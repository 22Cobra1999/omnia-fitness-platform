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
        try {
            const { monthStartStr, monthEndStr } = getMonthRange(currentDate)
            const { data } = await supabase
                .from('progreso_diario_actividad')
                .select('*')
                .eq('cliente_id', clientId)
                .gte('fecha', monthStartStr)
                .lte('fecha', monthEndStr)

            if (data) setMonthlyProgress(data)
        } catch (e) {
            console.warn('Error fetching monthly progress:', e)
        }
    }, [clientId, currentDate, supabase])

    const fetchClientCalendarSummary = useCallback(async () => {
        try {
            const { monthStartStr, monthEndStr } = getMonthRange(currentDate)

            // 1. Fetch Fitness Progress
            const { data: fitnessRows } = await supabase
                .from('progreso_cliente')
                .select('id, actividad_id, fecha, minutos_json')
                .eq('cliente_id', clientId)
                .gte('fecha', monthStartStr)
                .lte('fecha', monthEndStr)

            // 2. Fetch Nutrition Progress
            const { data: nutriRows } = await supabase
                .from('progreso_cliente_nutricion')
                .select('id, actividad_id, fecha, macros')
                .eq('cliente_id', clientId)
                .gte('fecha', monthStartStr)
                .lte('fecha', monthEndStr)

            // 3. Fetch Calendar Events (Meets)
            const { data: participants } = await supabase
                .from('calendar_event_participants')
                .select('event_id')
                .eq('client_id', clientId)

            const myEventIds = (participants || []).map((p: any) => p.event_id)
            let meetRows: any[] = []
            if (myEventIds.length > 0) {
                const { data: events } = await supabase
                    .from('calendar_events')
                    .select('id, title, start_time, end_time')
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

            // Process Fitness
            (fitnessRows || []).forEach((r: any) => {
                const day = String(r.fecha)
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
                    total_mins: mins,
                    fitness_mins: mins,
                    nutri_mins: 0,
                    calendar_mins: 0
                } as any)
            })

                // Process Nutrition
                (nutriRows || []).forEach((r: any) => {
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
                        total_mins: mins,
                        fitness_mins: 0,
                        nutri_mins: mins,
                        calendar_mins: 0
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
                    activity_title: r.title,
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

            // Fitness
            const { data: fit } = await supabase.from('progreso_cliente').select('*').eq('cliente_id', clientId).eq('fecha', dayStr).eq('actividad_id', activityId).maybeSingle()
            if (fit) {
                const pend = typeof fit.ejercicios_pendientes === 'string' ? JSON.parse(fit.ejercicios_pendientes || '[]') : (fit.ejercicios_pendientes || [])
                const comp = typeof fit.ejercicios_completados === 'string' ? JSON.parse(fit.ejercicios_completados || '[]') : (fit.ejercicios_completados || [])
                const allIds = [...new Set([...(Array.isArray(pend) ? pend : Object.keys(pend)), ...(Array.isArray(comp) ? comp : Object.keys(comp))])]

                allIds.forEach(id => {
                    details.push({
                        id: `fit-${fit.id}-${id}`, ejercicio_id: String(id),
                        ejercicio_nombre: fit.ejercicio_nombre || `Ejercicio ${id}`,
                        completado: Array.isArray(comp) ? comp.includes(id) : !!comp[id],
                        fecha_ejercicio: dayStr, actividad_id: activityId, actividad_titulo: activityTitle,
                        detalle_series: fit.detalles_series?.[id]?.detalle_series || fit.detalles_series?.[id] || null
                    })
                })
            }

            // Nutrición
            const { data: nut } = await supabase.from('progreso_cliente_nutricion').select('*').eq('cliente_id', clientId).eq('fecha', dayStr).eq('actividad_id', activityId).maybeSingle()
            if (nut) {
                const macros = typeof nut.macros === 'string' ? JSON.parse(nut.macros || '{}') : (nut.macros || {})
                const comp = typeof nut.ejercicios_completados === 'string' ? JSON.parse(nut.ejercicios_completados || '{}') : (nut.ejercicios_completados || {})
                const compList = Array.isArray(comp.ejercicios) ? comp.ejercicios : (typeof comp === 'object' ? Object.keys(comp) : [])

                Object.keys(macros).forEach(key => {
                    const baseId = key.split('_')[0]
                    details.push({
                        id: `nut-${nut.id}-${key}`, ejercicio_id: baseId, nutrition_key: key, nutrition_record_id: nut.id,
                        ejercicio_nombre: key.replace(/_/g, ' '),
                        completado: compList.includes(key),
                        fecha_ejercicio: dayStr, actividad_id: activityId, actividad_titulo: activityTitle,
                        is_nutricion: true, nutricion_macros: macros[key], ingredientes_detalle: nut.ingredientes?.[key]
                    })
                })
            }

            setActivityDetailsByKey(prev => ({ ...prev, [cacheKey]: details }))
        } catch (e) { console.warn(e) }
    }, [clientId, supabase, activityDetailsByKey])

    const loadEventDetails = useCallback(async (eventId: string) => {
        if (!eventId || eventDetailsByKey[eventId]) return
        const { data } = await supabase.from('calendar_events').select('*').eq('id', eventId).single()
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
