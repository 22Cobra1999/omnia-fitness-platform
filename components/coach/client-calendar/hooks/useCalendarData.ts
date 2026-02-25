import { useState, useEffect, useCallback } from 'react'
import { DayData, ClientDaySummaryRow, ExerciseExecution, ActivityFilterOption } from '../types'
import { getMonthRange } from '../utils/date-helpers'

export function useCalendarData(supabase: any, clientId: string, currentDate: Date, onLastWorkoutUpdate?: (d: string | null) => void) {
    const [dayData, setDayData] = useState<{ [key: string]: DayData }>({})
    const [summaryRowsByDate, setSummaryRowsByDate] = useState<Record<string, ClientDaySummaryRow[]>>({})
    const [activityDetailsByKey, setActivityDetailsByKey] = useState<Record<string, ExerciseExecution[]>>({})
    const [monthlyProgress, setMonthlyProgress] = useState<any[]>([])
    const [eventDetailsByKey, setEventDetailsByKey] = useState<Record<string, any>>({})
    const [activityFilterOptions, setActivityFilterOptions] = useState<ActivityFilterOption[]>([])
    const [activeEnrollmentFilterId, setActiveEnrollmentFilterId] = useState<number | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchMonthlyProgress = useCallback(async () => {
        if (!clientId) return
        try {
            const { monthStartStr, monthEndStr } = getMonthRange(currentDate)
            const { data, error } = await supabase
                .from('progreso_diario_actividad')
                .select('*')
                .eq('cliente_id', clientId)
                .gte('fecha', monthStartStr)
                .lte('fecha', monthEndStr)

            if (!error && data) setMonthlyProgress(data)
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
            const { monthStartStr, monthEndStr } = getMonthRange(currentDate)

            // 1. Fetch from progreso_diario_actividad (primary source — captures all enrollments)
            const { data: dailyRows } = await supabase
                .from('progreso_diario_actividad')
                .select('id, actividad_id, fecha, area, tipo, items_objetivo, items_completados, minutos, enrollment_id')
                .eq('cliente_id', clientId)
                .gte('fecha', monthStartStr)
                .lte('fecha', monthEndStr)
                .not('actividad_id', 'is', null)

            // 2. Fetch Fitness Progress (legacy — for old enrollments without daily rows)
            const { data: fitnessRows } = await supabase
                .from('progreso_cliente')
                .select('id, actividad_id, fecha, minutos_json, enrollment_id')
                .eq('cliente_id', clientId)
                .gte('fecha', monthStartStr)
                .lte('fecha', monthEndStr)
                .not('actividad_id', 'is', null)

            // 3. Fetch Nutrition Progress (legacy)
            const { data: nutriRows } = await supabase
                .from('progreso_cliente_nutricion')
                .select('id, actividad_id, fecha, macros, enrollment_id')
                .eq('cliente_id', clientId)
                .gte('fecha', monthStartStr)
                .lte('fecha', monthEndStr)
                .not('actividad_id', 'is', null)

            // Fetch activity titles for all sources
            const activityIds = [
                ...new Set([
                    ...(dailyRows || []).map((r: any) => r.actividad_id),
                    ...(fitnessRows || []).map((r: any) => r.actividad_id),
                    ...(nutriRows || []).map((r: any) => r.actividad_id)
                ].filter(Boolean))
            ]
            const activityTitleMap: Record<number, string> = {}
            if (activityIds.length > 0) {
                const { data: acts } = await supabase
                    .from('activities')
                    .select('id, title, coach_id')
                    .in('id', activityIds)
                if (acts) acts.forEach((a: any) => { activityTitleMap[a.id] = a.title })
            }

            // 4. Fetch Workshop Progress (left join to avoid 400)
            const { data: workshopRows } = await supabase
                .from('taller_progreso_temas')
                .select('id, actividad_id, fecha_seleccionada, horario_seleccionado')
                .eq('cliente_id', clientId)
                .gte('fecha_seleccionada', monthStartStr)
                .lte('fecha_seleccionada', monthEndStr)

            // 5. Fetch Calendar Events (Meets)
            const { data: participants } = await supabase
                .from('calendar_event_participants')
                .select('event_id')
                .eq('user_id', clientId)

            const myEventIds = (participants || []).map((p: any) => p.event_id)
            let meetRows: any[] = []
            if (myEventIds.length > 0) {
                const { data: events } = await supabase
                    .from('calendar_events')
                    .select('id, title, start_time, end_time, coach_id, activity_id')
                    .in('id', myEventIds)
                    .gte('start_time', `${monthStartStr}T00:00:00`)
                    .lte('start_time', `${monthEndStr}T23:59:59`)
                meetRows = events || []
            }

            const byDate: Record<string, ClientDaySummaryRow[]> = {}
            const processed: { [key: string]: DayData } = {}

            // Helper to aggregate
            const addRow = (day: string, row: ClientDaySummaryRow) => {
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

            // Process progreso_diario_actividad (primary — new enrollments)
            const dailyList = Array.isArray(dailyRows) ? dailyRows : []
            // Track which (day+actividad_id) combos are covered by daily rows to avoid double-counting
            const dailyCovered = new Set<string>()
            dailyList.forEach((r: any) => {
                const day = String(r.fecha)
                const key = `${day}::${r.actividad_id}`
                dailyCovered.add(key)
                const mins = Number(r.minutos) || 0
                const isNutri = r.area === 'nutricion'
                addRow(day, {
                    id: `daily-${r.id}`,
                    client_id: clientId,
                    day,
                    activity_id: r.actividad_id,
                    activity_title: activityTitleMap[r.actividad_id] || `Programa ${r.actividad_id}`,
                    enrollment_id: r.enrollment_id,
                    coach_id: null,
                    total_mins: mins,
                    fitness_mins: isNutri ? 0 : mins,
                    nutri_mins: isNutri ? mins : 0,
                    calendar_mins: 0,
                    items_objetivo: r.items_objetivo,
                    items_completados: r.items_completados
                } as any)
            })

            // Process Fitness (legacy — skip if already covered by dailyRows)
            const fitnessList = Array.isArray(fitnessRows) ? fitnessRows : []
            fitnessList.forEach((r: any) => {
                const day = String(r.fecha)
                const key = `${day}::${r.actividad_id}`
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
                    coach_id: null,
                    total_mins: mins,
                    fitness_mins: mins,
                    nutri_mins: 0,
                    calendar_mins: 0
                } as any)
            })


            // Process Nutrition
            const nutriList = Array.isArray(nutriRows) ? nutriRows : []
            nutriList.forEach((r: any) => {
                const day = String(r.fecha)
                let mins = 0
                if (r.macros) {
                    const mObj = typeof r.macros === 'string' ? JSON.parse(r.macros) : r.macros
                    Object.values(mObj).forEach((v: any) => { mins += (Number(v?.minutos) || 0) })
                }
                addRow(day, {
                    id: `nut-${r.id}`,
                    client_id: clientId,
                    day,
                    activity_id: r.actividad_id,
                    activity_title: activityTitleMap[r.actividad_id] || `Nutrición ${r.actividad_id}`,
                    coach_id: null,
                    total_mins: mins,
                    fitness_mins: 0,
                    nutri_mins: mins,
                    calendar_mins: 0
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
                    activity_title: r.activities?.title || 'Taller',
                    coach_id: r.activities?.coach_id,
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
    }, [clientId, currentDate, supabase, onLastWorkoutUpdate, fetchMonthlyProgress])

    const loadDayActivityDetails = useCallback(async (dayStr: string, activityId: number) => {
        const cacheKey = `${dayStr}::${activityId}`
        if (activityDetailsByKey[cacheKey]) return

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

                // Fetch prescriptions from informacion column (merged fitness details)
                const informacion = fit.informacion || fit.detalles_series || {}
                const infoObj = typeof informacion === 'string' ? JSON.parse(informacion || '{}') : informacion

                allIds.forEach((rawId: any) => {
                    const realId = parseEjercicioId(rawId)
                    const ex = exMap[realId]
                    const fullKey = String(rawId)
                    const seriesData = infoObj?.[fullKey] || infoObj?.[realId] || fit.detalles_series?.[fullKey] || fit.detalles_series?.[realId] || null
                    const seriesObj = typeof seriesData === 'string' ? (() => { try { return JSON.parse(seriesData) } catch { return seriesData } })() : seriesData
                    const sets = seriesObj?.sets ?? seriesObj?.series ?? seriesObj?.series_num ?? null
                    const reps = seriesObj?.reps ?? seriesObj?.repeticiones ?? seriesObj?.reps_num ?? null
                    const kg = seriesObj?.kg ?? seriesObj?.peso ?? null
                    const mins = seriesObj?.minutos ?? seriesObj?.duracion ?? ex?.duracion_min ?? null
                    const cals = seriesObj?.calorias ?? ex?.calorias ?? null

                    details.push({
                        id: `fit-${fit.id}-${fullKey}`,
                        ejercicio_id: realId,
                        ejercicio_nombre: ex?.nombre_ejercicio || (ex ? `Ejercicio ${realId}` : `Ejercicio ${rawId}`),
                        completado: Array.isArray(comp) ? comp.map(String).includes(String(rawId)) : !!comp[rawId],
                        fecha_ejercicio: dayStr,
                        actividad_id: activityId,
                        actividad_titulo: activityTitle,
                        detalle_series: sets ? `${sets} series × ${reps ?? '?'} reps${kg ? ` · ${kg}kg` : ''}` : (seriesData ? String(seriesData) : null),
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
                const compList = Array.isArray(comp.ejercicios) ? comp.ejercicios : (typeof comp === 'object' ? Object.keys(comp) : [])
                Object.keys(macros).forEach(key => {
                    const baseId = key.split('_')[0]
                    details.push({
                        id: `nut-${nut.id}-${key}`, ejercicio_id: baseId, nutrition_key: key, nutrition_record_id: nut.id,
                        ejercicio_nombre: macros[key]?.nombre_plato || key.replace(/_/g, ' '),
                        completado: compList.includes(key),
                        fecha_ejercicio: dayStr, actividad_id: activityId, actividad_titulo: activityTitle,
                        is_nutricion: true, nutricion_macros: macros[key], ingredientes_detalle: nut.ingredientes?.[key]
                    })
                })
            }

            // --- Talleres ---
            const { data: wsList } = await supabase
                .from('taller_progreso_temas')
                .select('*, taller_detalles(nombre, descripcion)')
                .eq('cliente_id', clientId)
                .eq('fecha_seleccionada', dayStr)
                .eq('actividad_id', activityId)

            if (wsList && wsList.length > 0) {
                wsList.forEach((ws: any) => {
                    details.push({
                        id: `ws-${ws.id}`,
                        ejercicio_id: String(ws.tema_id),
                        ejercicio_nombre: ws.taller_detalles?.nombre || `Tema de taller`,
                        completado: ws.asistio || ws.estado === 'completado',
                        fecha_ejercicio: dayStr,
                        actividad_id: activityId,
                        actividad_titulo: activityTitle,
                        is_workshop: true,
                        workshop_details: ws.taller_detalles
                    })
                })
            }

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

    const getDayData = useCallback((date: Date) => {
        return dayData[date.toISOString().split('T')[0]]
    }, [dayData])

    useEffect(() => {
        fetchClientCalendarSummary()
    }, [fetchClientCalendarSummary])

    return {
        dayData, summaryRowsByDate, activityDetailsByKey, setActivityDetailsByKey,
        monthlyProgress, eventDetailsByKey, activityFilterOptions,
        activeEnrollmentFilterId, setActiveEnrollmentFilterId,
        loading,
        fetchClientCalendarSummary, loadDayActivityDetails, loadEventDetails, getDayData
    }
}
