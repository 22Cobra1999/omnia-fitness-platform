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
            const { data: summaryRows } = await supabase.from('client_day_activity_summary_v').select('*').eq('client_id', clientId).gte('day', monthStartStr).lte('day', monthEndStr)

            const rows = (summaryRows || []) as ClientDaySummaryRow[]
            const byDate: Record<string, ClientDaySummaryRow[]> = {}
            const processed: { [key: string]: DayData } = {}

            rows.forEach(r => {
                // Filter out obviously non-scheduled items if they are tagged as documents in title
                // or if we decide to skip them. Since type is missing, we'll need a better way later.
                // For now, removing the invalid check.
                const day = String(r.day)
                if (!byDate[day]) byDate[day] = []
                byDate[day].push(r)
            })

            Object.keys(byDate).forEach(day => {
                const dayRows = byDate[day]
                const progMins = dayRows.filter(r => !r.calendar_event_id).reduce((acc, r) => acc + (Number(r.total_mins) || 0), 0)
                processed[day] = {
                    date: day,
                    exerciseCount: dayRows.length,
                    completedCount: 0,
                    totalMinutes: progMins,
                    exercises: [],
                    activities: []
                }
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
