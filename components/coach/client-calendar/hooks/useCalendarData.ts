import { useState, useEffect, useCallback, useMemo } from 'react'
import { DayData, ClientDaySummaryRow, ExerciseExecution, ActivityFilterOption } from '../types'
import { getMonthRange } from '../utils/date-helpers'

export function useCalendarData(supabase: any, clientId: string, currentDate: Date, onLastWorkoutUpdate?: (d: string | null) => void, currentCoachId?: string | null) {
    const [dayData, setDayData] = useState<{ [key: string]: DayData }>({})
    const [summaryRowsByDate, setSummaryRowsByDate] = useState<Record<string, ClientDaySummaryRow[]>>({})
    const [activityDetailsByKey, setActivityDetailsByKey] = useState<Record<string, ExerciseExecution[]>>({})
    const [monthlyProgress, setMonthlyProgress] = useState<any[]>([])
    const [eventDetailsByKey, setEventDetailsByKey] = useState<Record<string, any>>({})
    const [activityFilterOptions, setActivityFilterOptions] = useState<ActivityFilterOption[]>([])
    const [activeEnrollmentFilterId, setActiveEnrollmentFilterId] = useState<number | null>(null)
    const [loading, setLoading] = useState(true)

    const [activityEndDates, setActivityEndDates] = useState<Record<number, string>>({})
    const [dishNameMap, setDishNameMap] = useState<Record<string, string>>({})
    const [dishMinsMap, setDishMinsMap] = useState<Record<string, number>>({})
    const [docProgressMap, setDocProgressMap] = useState<Record<number, boolean>>({})

    const fetchMonthlyProgress = useCallback(async () => {
        if (!clientId) return
        try {
            const { monthStartStr, monthEndStr } = getMonthRange(currentDate)
            
            // 1. Fetch Programs (Daily Rows)
            const { data: dailyData, error: dailyError } = await supabase
                .from('progreso_diario_actividad')
                .select('*')
                .eq('cliente_id', clientId)
                .gte('fecha', monthStartStr)
                .lte('fecha', monthEndStr)

            // 2. Fetch Workshops
            const { data: wsData } = await supabase
                .from('taller_progreso_temas')
                .select('id, actividad_id, fecha_seleccionada, asistio, estado')
                .eq('cliente_id', clientId)
                .gte('fecha_seleccionada', monthStartStr)
                .lte('fecha_seleccionada', monthEndStr)

            const normalizedDaily = (dailyData || []).map((r: any) => ({
                ...r,
                fecha: String(r.fecha).split(' ')[0].split('T')[0]
            }))

            const normalizedWS = (wsData || []).map((r: any) => ({
                id: `ws-progress-${r.id}`,
                actividad_id: r.actividad_id,
                fecha: String(r.fecha_seleccionada),
                fit_items_o: 1,
                fit_items_c: (r.asistio || r.estado === 'completado') ? 1 : 0,
                is_workshop: true
            }))

            setMonthlyProgress([...normalizedDaily, ...normalizedWS])
        } catch (e) {
            console.warn('Error fetching monthly progress:', e)
        }
    }, [clientId, currentDate, supabase])

    const fetchClientCalendarSummary = useCallback(async () => {
        if (!clientId) {
            setLoading(false)
            return
        }
        try {
            setLoading(true)
            console.log('📅 [Calendar] START fetchClientCalendarSummary | Client:', clientId, 'Month:', currentDate.toISOString().split('T')[0])
            const { monthStartStr, monthEndStr } = getMonthRange(currentDate)

            // 1. Fetch from progreso_diario_actividad (NEW FLAT SCHEMA)
            const { data: dailyRows, error: dailyError } = await supabase
                .from('progreso_diario_actividad')
                .select(`
                    id, actividad_id, fecha, tipo, enrollment_id,
                    fit_items_c, fit_items_o, fit_mins_c, fit_mins_o, fit_kcal_c, fit_kcal_o,
                    nut_items_c, nut_items_o, nut_kcal_c, nut_kcal_o, nut_macros
                `)
                .eq('cliente_id', clientId)
                .gte('fecha', monthStartStr)
                .lte('fecha', monthEndStr)
                .not('actividad_id', 'is', null)
            
            if (dailyError) {
                console.error('❌ [Calendar:dailyRows] ERROR:', dailyError.code, dailyError.message, dailyError.details)
            } else {
                console.log('✅ [Calendar:dailyRows] OK | Count:', dailyRows?.length)
            }

            // 2. Fetch Fitness Progress (legacy fallback)
            const { data: fitnessRows, error: fitnessError } = await supabase
                .from('progreso_cliente')
                .select('id, actividad_id, fecha')
                .eq('cliente_id', clientId)
                .gte('fecha', monthStartStr)
                .lte('fecha', monthEndStr)
            
            if (fitnessError) console.error('❌ [Calendar:fitnessRows]', fitnessError)

            // 3. Fetch Nutrition Progress (legacy fallback)
            const { data: nutriRows, error: nutriError } = await supabase
                .from('progreso_cliente_nutricion')
                .select('id, actividad_id, fecha')
                .eq('cliente_id', clientId)
                .gte('fecha', monthStartStr)
                .lte('fecha', monthEndStr)
            
            if (nutriError) console.error('❌ [Calendar:nutriRows]', nutriError)

            // Fetch activity titles
            const activityIds = [
                ...new Set([
                    ...(dailyRows || []).map((r: any) => r.actividad_id),
                    ...(fitnessRows || []).map((r: any) => r.actividad_id),
                    ...(nutriRows || []).map((r: any) => r.actividad_id)
                ].filter(Boolean))
            ]
            const activityTitleMap: Record<number, string> = {}
            const activityCoachMap: Record<number, string> = {}
            if (activityIds.length > 0) {
                const { data: acts, error: actsError } = await supabase
                    .from('activities')
                    .select('id, title, coach_id')
                    .in('id', activityIds)
                if (actsError) console.error('❌ [Calendar:activities]', actsError)
                if (acts) {
                    acts.forEach((a: any) => { 
                        activityTitleMap[a.id] = a.title 
                        if (a.coach_id) activityCoachMap[a.id] = a.coach_id
                    })

                }
            }

            // Fetch all dish names and minutes from recetas (new primary source) and legacy details
            const { data: recData } = await supabase.from('recetas').select('id, nombre, minutos')
            const { data: dishes } = await supabase.from('nutrition_program_details').select('id, nombre, minutos')
            
            const dMap: Record<string, string> = {}
            const minsMap: Record<string, number> = {}

            // Populate from legacy first
            if (dishes) {
                dishes.forEach((d: any) => {
                    const idStr = String(d.id)
                    dMap[idStr] = d.nombre || ''
                    minsMap[idStr] = d.minutos || 0
                })
            }
            // Override/add from recetas (cleaner names/centralized minutes)
            if (recData) {
                recData.forEach((r: any) => {
                    const idStr = String(r.id)
                    if (r.nombre) dMap[idStr] = r.nombre
                    if (r.minutos) minsMap[idStr] = r.minutos
                })
            }
            setDishNameMap(dMap)
            setDishMinsMap(minsMap)

            // 4. Fetch Workshop Progress
            let workshopRows: any[] = []
            try {
                const { data: wsData, error: wsError } = await supabase
                    .from('taller_progreso_temas')
                    .select('id, actividad_id, fecha_seleccionada, horario_seleccionado')
                    .eq('cliente_id', clientId)
                    .gte('fecha_seleccionada', monthStartStr)
                    .lte('fecha_seleccionada', monthEndStr)
                if (wsError) console.error('❌ [Calendar:workshopRows]', wsError)
                workshopRows = wsData || []
            } catch (wsErr) {
                console.warn('[Calendar] taller_progreso_temas query failed:', wsErr)
            }

            // 5. Fetch Calendar Events (Meets)
            const { data: participants, error: partError } = await supabase
                .from('calendar_event_participants')
                .select('event_id')
                .eq('user_id', clientId)
            
            if (partError) console.error('❌ [Calendar:participants]', partError)

            const myEventIds = (participants || []).map((p: any) => p.event_id)
            let meetRows: any[] = []
            if (myEventIds.length > 0) {
                const { data: events, error: eventsError } = await supabase
                    .from('calendar_events')
                    .select('id, title, start_time, end_time, coach_id, activity_id')
                    .in('id', myEventIds)
                    .gte('start_time', `${monthStartStr}T00:00:00`)
                    .lte('start_time', `${monthEndStr}T23:59:59`)
                if (eventsError) console.error('❌ [Calendar:meetRows]', eventsError)
                meetRows = events || []
            }
            
            // 5.b Fetch Document Progress (to ensure it's not 0)
            const { data: docProgs } = await supabase.from('client_document_progress').select('activity_id, completed').eq('client_id', clientId)
            const docMap: Record<number, boolean> = {}
            if (docProgs) docProgs.forEach((dp: any) => { if (dp.completed) docMap[Number(dp.activity_id)] = true })
            setDocProgressMap(docMap)

            // 6. Fetch Enrollment End Dates
            const { data: enrolls, error: enrollsError } = await supabase
                .from('activity_enrollments')
                .select('activity_id, program_end_date')
                .eq('client_id', clientId)
            
            const aEndDates: Record<number, string> = {}
            if (enrolls) {
                enrolls.forEach((e: any) => {
                    if (e.program_end_date) aEndDates[Number(e.activity_id)] = e.program_end_date
                })
            }
            setActivityEndDates(aEndDates)

            const byDate: Record<string, ClientDaySummaryRow[]> = {}
            const processed: { [key: string]: DayData } = {}

            // Helper to aggregate
            const addRow = (day: string, row: ClientDaySummaryRow) => {
                // We no longer skip rows belonging to other coaches here.
                // Filtering for the calendar bubbles vs "Otros del cliente" list
                // happens in the UI components (CalendarGrid vs DayDetailsPanel).

                if (!byDate[day]) byDate[day] = []
                byDate[day].push(row)

                if (!processed[day]) {
                    processed[day] = {
                        date: day,
                        exerciseCount: 0,
                        completedCount: 0,
                        totalMinutes: 0,
                        exercises: [],
                        activities: []
                    }
                }
                processed[day].exerciseCount++
                processed[day].totalMinutes += (Number(row.total_mins) || 0)
            }

            // Process progreso_diario_actividad (NEW FLAT SCHEMA)
            const dailyList = Array.isArray(dailyRows) ? dailyRows : []
            const dailyCovered = new Set<string>()
            dailyList.forEach((r: any) => {
                const day = String(r.fecha)
                const actId = Number(r.actividad_id)
                const key = `${day}::${actId}`
                dailyCovered.add(key)
                
                const fitnessMins = Number(r.fit_mins_c) || Number(r.fit_mins_o) || (r.area === 'fitness' ? Number(r.minutos) : 0) || 0
                
                // Aggregate nutrition minutes from macros if needed
                let nutriMins = Number(r.nut_mins_c) || Number(r.nut_mins_o) || 0
                if (nutriMins === 0 && r.nut_macros) {
                    const macros = typeof r.nut_macros === 'string' ? JSON.parse(r.nut_macros) : r.nut_macros
                    Object.values(macros).forEach((m: any) => {
                        nutriMins += (Number(m?.minutos) || Number(m?.m) || 0)
                    })
                }

                const row = {
                    id: `daily-${r.id}`,
                    client_id: clientId,
                    day,
                    activity_id: r.actividad_id,
                    activity_title: activityTitleMap[r.actividad_id] || `Programa ${r.actividad_id}`,
                    enrollment_id: r.enrollment_id,
                    coach_id: activityCoachMap[r.actividad_id] || null,
                    total_mins: (Number(r.minutos) || (fitnessMins + nutriMins)),
                    fitness_mins: fitnessMins,
                    nutri_mins: nutriMins,
                    calendar_mins: 0,
                    items_objetivo: (r.fit_items_o || 0) + (r.nut_items_o || 0) || (r.tipo === 'documento' ? 1 : 0),
                    items_completados: (r.fit_items_c || 0) + (r.nut_items_c || 0) || (r.tipo === 'documento' && dMap[r.actividad_id] ? 1 : 0),
                    fit_items_o: r.fit_items_o,
                    fit_items_c: r.fit_items_c,
                    nut_items_o: r.nut_items_o,
                    nut_items_c: r.nut_items_c
                }
                if (r.actividad_id === 78 && day === '2026-03-30') {
                    console.log(`[Calendar:Row78] Items: ${row.items_completados}/${row.items_objetivo} (fit_c=${r.fit_items_c} fit_o=${r.fit_items_o})`)
                }
                addRow(day, row as any)
            })

            // Process Fitness (legacy — skip if already covered by dailyRows)
            const fitnessList = Array.isArray(fitnessRows) ? fitnessRows : []
            fitnessList.forEach((r: any) => {
                const day = String(r.fecha)
                const actId = Number(r.actividad_id)
                const key = `${day}::${actId}`
                if (dailyCovered.has(key)) return // already accounted for
                let mins = 0
                if (r.minutos_json) {
                    const mObj = typeof r.minutos_json === 'string' ? JSON.parse(r.minutos_json) : r.minutos_json
                    Object.values(mObj).forEach((v: any) => { mins += (Number(v) || 0) })
                }
                addRow(day, {
                    id: `fit-${r.id}`,
                    client_id: clientId,
                    day,
                    activity_id: r.actividad_id,
                    activity_title: activityTitleMap[r.actividad_id] || `Programa ${r.actividad_id}`,
                    coach_id: activityCoachMap[r.actividad_id] || null,
                    total_mins: mins,
                    fitness_mins: mins,
                    nutri_mins: 0,
                    calendar_mins: 0,
                    items_objetivo: 1,
                    items_completados: r.completado ? 1 : 0
                } as any)
            })


            // Process Nutrition
            const nutriList = Array.isArray(nutriRows) ? nutriRows : []
            nutriList.forEach((r: any) => {
                const day = String(r.fecha)
                const actId = Number(r.actividad_id)
                const key = `${day}::${actId}`
                if (dailyCovered.has(key)) return // Skip if already covered by flat schema
                
                let mins = 0
                if (r.macros) {
                    const mObj = typeof r.macros === 'string' ? JSON.parse(r.macros) : r.macros
                    Object.values(mObj).forEach((v: any) => { 
                        mins += (Number(v?.minutos) || Number(v?.m) || 0) 
                    })
                }
                addRow(day, {
                    id: `nut-${r.id}`,
                    client_id: clientId,
                    day,
                    activity_id: r.actividad_id,
                    activity_title: activityTitleMap[r.actividad_id] || `Nutrición ${r.actividad_id}`,
                    coach_id: activityCoachMap[r.actividad_id] || null,
                    total_mins: mins,
                    fitness_mins: 0,
                    nutri_mins: mins,
                    calendar_mins: 0,
                    items_objetivo: 1,
                    items_completados: r.completado ? 1 : 0
                } as any)
            })

            // Process Workshops
            const workshopList = Array.isArray(workshopRows) ? workshopRows : []
            workshopList.forEach((r: any) => {
                const day = String(r.fecha_seleccionada)
                let mins = 0
                if (r.horario_seleccionado) {
                    const h = typeof r.horario_seleccionado === 'string' ? JSON.parse(r.horario_seleccionado) : r.horario_seleccionado
                    if (h.hora_inicio && h.hora_fin) {
                        const start = new Date(`1970-01-01T${h.hora_inicio}`)
                        const end = new Date(`1970-01-01T${h.hora_fin}`)
                        mins = Math.round((end.getTime() - start.getTime()) / 60000)
                    }
                }
                addRow(day, {
                    id: `ws-${r.id}`,
                    client_id: clientId,
                    day,
                    activity_id: r.actividad_id,
                    activity_title: activityTitleMap[r.actividad_id] || 'Taller',
                    coach_id: activityCoachMap[r.actividad_id] || null,
                    total_mins: mins,
                    fitness_mins: 0,
                    nutri_mins: 0,
                    calendar_mins: 0,
                    is_workshop: true
                } as any)
            })

            // Process Meets
            meetRows.forEach((r: any) => {
                const day = String(r.start_time).split('T')[0]
                const durationMs = new Date(r.end_time).getTime() - new Date(r.start_time).getTime()
                const mins = Math.round(durationMs / 60000)
                addRow(day, {
                    id: `evt-${r.id}`,
                    client_id: clientId,
                    day,
                    calendar_event_id: r.id,
                    activity_id: r.activity_id,
                    activity_title: r.title,
                    coach_id: r.coach_id,
                    total_mins: mins,
                    fitness_mins: 0,
                    nutri_mins: 0,
                    calendar_mins: mins
                } as any)
            })

            setSummaryRowsByDate(byDate)
            setDayData(processed)

            // Build activity filter options from all unique activities seen this month
            const filterMap = new Map<number, ActivityFilterOption>()
            ;[...dailyList, ...fitnessList].forEach((r: any) => {
                if (!r.actividad_id || filterMap.has(Number(r.actividad_id))) return
                filterMap.set(Number(r.actividad_id), {
                    enrollment_id: r.enrollment_id ?? r.actividad_id,
                    activity_id: Number(r.actividad_id),
                    title: activityTitleMap[r.actividad_id] || `Actividad ${r.actividad_id}`,
                    version: 1
                })
            })
            setActivityFilterOptions(Array.from(filterMap.values()))

            // Calculate last workout 
            let lastDate: string | null = null
            const sortedDates = Object.keys(processed).sort((a, b) => b.localeCompare(a))
            for (const d of sortedDates) {
                if (processed[d].totalMinutes > 0) {
                    lastDate = d; break
                }
            }
            if (onLastWorkoutUpdate) onLastWorkoutUpdate(lastDate)

            // Also fetch monthly progress stats
            fetchMonthlyProgress()

        } catch (e) {
            console.warn(e)
        } finally {
            setLoading(false)
        }
    }, [clientId, currentDate, supabase, onLastWorkoutUpdate, fetchMonthlyProgress, currentCoachId])

    const loadDayActivityDetails = useCallback(async (dayStr: string, activityId: number, forceRefresh = false) => {
        const cacheKey = `${dayStr}::${activityId}`
        if (!forceRefresh && activityDetailsByKey[cacheKey]) return

        try {
            const { data: actRow } = await supabase.from('activities').select('id, title, coach_id, type').eq('id', activityId).single()
            const activityTitle = actRow?.title || `Actividad ${activityId}`
            const details: ExerciseExecution[] = []

            // Helper: extract real numeric ejercicio_id from composite keys like "1230_1_1" or plain "1230"
            const parseEjercicioId = (raw: any): string => {
                const str = String(raw)
                // Format: "activityId-exerciseId_block_order" or "exerciseId_block_order" or plain "exerciseId"
                const noPrefix = str.includes('-') ? str.split('-').slice(1).join('-') : str
                const parts = noPrefix.split('_')
                return parts[0] // first segment is the real ejercicio_id
            }

            // --- Fitness from progreso_cliente ---
            const { data: fit } = await supabase
                .from('progreso_cliente')
                .select('*')
                .eq('cliente_id', clientId)
                .eq('fecha', dayStr)
                .eq('actividad_id', activityId)
                .maybeSingle()

            if (fit) {
                const pend = typeof fit.ejercicios_pendientes === 'string' ? JSON.parse(fit.ejercicios_pendientes || '[]') : (fit.ejercicios_pendientes || [])
                const comp = typeof fit.ejercicios_completados === 'string' ? JSON.parse(fit.ejercicios_completados || '[]') : (fit.ejercicios_completados || [])
                const allIds = [...new Set([...(Array.isArray(pend) ? pend : Object.keys(pend)), ...(Array.isArray(comp) ? comp : Object.keys(comp))])]

                // Collect real exercise IDs to batch-fetch names
                const realIds = [...new Set(allIds.map(parseEjercicioId).filter(Boolean))]
                const exMap: Record<string, any> = {}
                if (realIds.length > 0) {
                    const { data: exData } = await supabase
                        .from('ejercicios_detalles')
                        .select('id, nombre_ejercicio, calorias, duracion_min, equipo, body_parts')
                        .in('id', realIds)
                    if (exData) exData.forEach((e: any) => { exMap[String(e.id)] = e })
                }

                // Helper to parse a JSONB column that may be stored as string
                const parseCol = (col: any) => {
                    if (!col) return {}
                    if (typeof col === 'string') { try { return JSON.parse(col) } catch { return {} } }
                    return col
                }

                // Fetch prescriptions from all possible columns
                const infoObj = parseCol(fit.informacion)
                const detallesObj = parseCol(fit.detalles_series)
                // New dedicated columns (one value per exercise key)
                const repsMap = parseCol(fit.reps)
                const seriesMap = parseCol(fit.series)
                const pesoMap = parseCol(fit.peso)
                const minutosMap = parseCol(fit.minutos)
                const caloriasMap = parseCol(fit.calorias)

                allIds.forEach((rawId: any) => {

                    const realId = parseEjercicioId(rawId)
                    const ex = exMap[realId]
                    const fullKey = String(rawId)

                    // Try informacion first, then detalles_series
                    const seriesData = infoObj?.[fullKey] || infoObj?.[realId] || detallesObj?.[fullKey] || detallesObj?.[realId] || null
                    const seriesObj = typeof seriesData === 'string' ? (() => { try { return JSON.parse(seriesData) } catch { return null } })() : seriesData

                    // Read values from seriesObj first, then fall back to dedicated columns
                    const sets = seriesObj?.sets ?? seriesObj?.series ?? seriesObj?.series_num ?? seriesMap?.[fullKey] ?? seriesMap?.[realId] ?? null
                    const reps = seriesObj?.reps ?? seriesObj?.repeticiones ?? seriesObj?.reps_num ?? repsMap?.[fullKey] ?? repsMap?.[realId] ?? null
                    const kg = seriesObj?.kg ?? seriesObj?.peso ?? pesoMap?.[fullKey] ?? pesoMap?.[realId] ?? null
                    const mins = seriesObj?.minutos ?? seriesObj?.duracion ?? minutosMap?.[fullKey] ?? minutosMap?.[realId] ?? ex?.duracion_min ?? null
                    const cals = seriesObj?.calorias ?? caloriasMap?.[fullKey] ?? caloriasMap?.[realId] ?? ex?.calorias ?? null

                    // Build a clean seriesData object if we have at least sets+reps
                    const effectiveSeriesData = (sets != null && reps != null)
                        ? { sets: Number(sets), reps: Number(reps), kg: Number(kg ?? 0), minutos: mins, calorias: cals }
                        : seriesData

                    details.push({
                        id: `fit-${fit.id}-${fullKey}`,
                        exercise_key: fullKey,
                        ejercicio_id: realId,
                        ejercicio_nombre: ex?.nombre_ejercicio || (ex ? `Ejercicio ${realId}` : `Ejercicio ${rawId}`),
                        completado: Array.isArray(comp) ? comp.map(String).includes(String(rawId)) : !!comp[rawId],
                        fecha_ejercicio: dayStr,
                        actividad_id: activityId,
                        actividad_titulo: activityTitle,
                        detalle_series: effectiveSeriesData,
                        sets, reps, kg,
                        duracion: mins,
                        calorias_estimadas: cals,
                        body_parts: ex?.body_parts,
                        equipo: ex?.equipo
                    } as any)
                })
            }

            // --- Nutrición ---
            const { data: nut } = await supabase
                .from('progreso_cliente_nutricion')
                .select('*')
                .eq('cliente_id', clientId)
                .eq('fecha', dayStr)
                .eq('actividad_id', activityId)
                .maybeSingle()

            if (nut) {
                const macros = typeof nut.macros === 'string' ? JSON.parse(nut.macros || '{}') : (nut.macros || {})
                const comp = typeof nut.ejercicios_completados === 'string' ? JSON.parse(nut.ejercicios_completados || '{}') : (nut.ejercicios_completados || {})
                const rawList = Array.isArray(comp.ejercicios) ? comp.ejercicios : (typeof comp === 'object' ? Object.keys(comp) : [])
                const compList = rawList.map(String)
                
                Object.keys(macros).forEach(key => {
                    const baseId = key.split('_')[0]
                    const m = macros[key]
                    
                    details.push({
                        id: `nut-${nut.id}-${key}`, 
                        ejercicio_id: key, 
                        exercise_key: key, 
                        nutrition_key: key, 
                        nutrition_record_id: nut.id,
                        ejercicio_nombre: m?.nombre_plato || m?.label || dishNameMap[key] || dishNameMap[baseId] || (m?.id ? `Plato ${m.id}` : key.replace(/_/g, ' ')),
                        completado: compList.includes(key),
                        fecha_ejercicio: dayStr, 
                        actividad_id: activityId, 
                        actividad_titulo: activityTitle,
                        is_nutricion: true, 
                        duracion: m?.minutos || m?.m || dishMinsMap[baseId] || dishMinsMap[key] || 0,
                        calorias_estimadas: m?.calorias || m?.k || 0,
                        nutricion_macros: {
                            proteinas: m?.proteinas || m?.p || 0,
                            carbohidratos: m?.carbohidratos || m?.c || 0,
                            grasas: m?.grasas || m?.g || 0,
                            calorias: m?.calorias || m?.k || 0,
                            minutos: m?.minutos || m?.m || 0
                        }, 
                        ingredientes_detalle: (nut.ingredientes as any)?.[key]
                    })
                })
            }

            // --- Talleres (safe - may fail with 400) ---
            try {
                const { data: wsList } = await supabase
                    .from('taller_progreso_temas')
                    .select('id, actividad_id, fecha_seleccionada, tema_id, asistio, estado')
                    .eq('cliente_id', clientId)
                    .eq('fecha_seleccionada', dayStr)
                    .eq('actividad_id', activityId)

                if (wsList && wsList.length > 0) {
                    wsList.forEach((ws: any) => {
                        details.push({
                            id: `ws-${ws.id}`,
                            ejercicio_id: String(ws.tema_id),
                            ejercicio_nombre: ws.tema_nombre || `Tema de taller`,
                            completado: ws.asistio || ws.estado === 'completado',
                            fecha_ejercicio: dayStr,
                            actividad_id: activityId,
                            actividad_titulo: activityTitle,
                            is_workshop: true,
                            workshop_details: ws
                        })
                    })
                }
            } catch (wsErr) {
                console.warn('[Calendar] taller_progreso_temas detail query failed:', wsErr)
            }

            console.log(`[Calendar] Loaded details for ${cacheKey}:`, details.length, 'items', details.map(d => d.exercise_key))
            setActivityDetailsByKey(prev => ({ ...prev, [cacheKey]: details }))
        } catch (e) { console.warn(e) }
    }, [clientId, supabase, activityDetailsByKey])

    const loadEventDetails = useCallback(async (eventId: string) => {
        if (!eventId || eventDetailsByKey[eventId]) return
        const { data } = await supabase
            .from('calendar_events')
            .select('*, participants:calendar_event_participants(*)')
            .eq('id', eventId)
            .single()
        if (data) setEventDetailsByKey(prev => ({ ...prev, [eventId]: data }))
    }, [supabase, eventDetailsByKey])

    const filteredSummaryRows = useMemo(() => {
        if (!activeEnrollmentFilterId) return summaryRowsByDate
        const filtered: Record<string, ClientDaySummaryRow[]> = {}
        Object.keys(summaryRowsByDate).forEach(date => {
            const rows = summaryRowsByDate[date].filter(r => 
                r.enrollment_id === activeEnrollmentFilterId || r.activity_id === activeEnrollmentFilterId
            )
            if (rows.length > 0) filtered[date] = rows
        })
        return filtered
    }, [summaryRowsByDate, activeEnrollmentFilterId])

    const getDayData = useCallback((date: Date) => {
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        return dayData[dateStr]
    }, [dayData])

    useEffect(() => {
        fetchClientCalendarSummary()
    }, [fetchClientCalendarSummary])

    return {
        dayData, summaryRowsByDate, filteredSummaryRows, activityDetailsByKey, setActivityDetailsByKey,
        monthlyProgress, eventDetailsByKey, activityFilterOptions,
        activeEnrollmentFilterId, setActiveEnrollmentFilterId,
        loading, activityEndDates, dishNameMap,
        fetchClientCalendarSummary, loadDayActivityDetails, loadEventDetails, getDayData
    }
}
