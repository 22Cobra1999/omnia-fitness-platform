import { useState, useCallback } from 'react'
import { ExerciseExecution } from '../types'

export function useCascadeUpdates(
    supabase: any,
    clientId: string,
    fetchClientCalendarSummary: () => Promise<void>,
    loadDayActivityDetails: (day: string, actId: number) => Promise<void>,
    setActivityDetailsByKey: React.Dispatch<React.SetStateAction<any>>,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>
) {
    const [cascadeModal, setCascadeModal] = useState<{
        isOpen: boolean
        type: 'fitness' | 'nutrition'
        mode: 'swap' | 'update'
        sourceDate: string
        sourceDayName: string
        itemName: string
        payload: any
    } | null>(null)

    const handleApplyCascade = useCallback(async (scope: 'same_day' | 'future_all') => {
        if (!cascadeModal) return
        setLoading(true)

        try {
            const { type, mode, sourceDate, payload } = cascadeModal
            const nextDay = new Date(sourceDate); nextDay.setDate(nextDay.getDate() + 1)
            const startDateStr = nextDay.toISOString().split('T')[0]
            const sourceDayIndex = new Date(sourceDate + 'T00:00:00').getDay()
            const updates: any[] = []

            if (type === 'fitness') {
                const { data: rows, error } = await supabase.from('progreso_cliente').select('*').eq('cliente_id', clientId).gte('fecha', startDateStr)
                if (error || !rows) return

                for (const row of rows) {
                    const rowDayIndex = new Date(row.fecha + 'T00:00:00').getDay()
                    if (scope === 'same_day' && rowDayIndex !== sourceDayIndex) continue

                    const det = typeof row.detalles_series === 'string' ? JSON.parse(row.detalles_series) : (row.detalles_series || {})
                    const min = typeof row.minutos_json === 'string' ? JSON.parse(row.minutos_json) : (row.minutos_json || {})
                    const cal = typeof row.calorias_json === 'string' ? JSON.parse(row.calorias_json) : (row.calorias_json || {})
                    let mod = false

                    const newBase = String(payload.newId).split('_')[0]
                    if (mode === 'swap') {
                        const oldBase = payload.originalId ? String(payload.originalId).split('_')[0] : null
                        const keys = Object.keys(det).filter(k => k.split('_')[0] === oldBase)
                        if (keys.length > 0) {
                            mod = true
                            keys.forEach(k => { delete det[k]; delete min[k]; delete cal[k] })
                            payload.validSeries?.forEach((s: any, i: number) => {
                                const k = `${newBase}_${i + 1}`
                                det[k] = { orden: i + 1, bloque: i + 1, ejercicio_id: parseInt(newBase), detalle_series: `(${s.peso || 0}-${s.repeticiones}-${s.series})` }
                                if (s.minutos) min[k] = parseInt(s.minutos)
                                if (s.calorias) cal[k] = parseInt(s.calorias)
                            })
                        }
                    } else {
                        const keys = Object.keys(det).filter(k => k.split('_')[0] === newBase)
                        if (keys.length > 0) {
                            mod = true
                            keys.forEach(k => { delete det[k]; delete min[k]; delete cal[k] })
                            payload.validSeries?.forEach((s: any, i: number) => {
                                const k = `${newBase}_${i + 1}`
                                det[k] = { orden: i + 1, bloque: i + 1, ejercicio_id: parseInt(newBase), detalle_series: `(${s.peso || 0}-${s.repeticiones}-${s.series})` }
                                if (s.minutos) min[k] = parseInt(s.minutos)
                                if (s.calorias) cal[k] = parseInt(s.calorias)
                            })
                        }
                    }
                    if (mod) updates.push({ ...row, detalles_series: det, minutos_json: min, calorias_json: cal })
                }
                if (updates.length) await supabase.from('progreso_cliente').upsert(updates)

            } else if (type === 'nutrition') {
                const { data: rows, error } = await supabase.from('progreso_cliente_nutricion').select('*').eq('cliente_id', clientId).gte('fecha', startDateStr)
                if (error || !rows) return

                for (const row of rows) {
                    const rowDayIndex = new Date(row.fecha + 'T00:00:00').getDay()
                    if (scope === 'same_day' && rowDayIndex !== sourceDayIndex) continue

                    const macros = typeof row.macros === 'string' ? JSON.parse(row.macros) : (row.macros || {})
                    const ing = typeof row.ingredientes === 'string' ? JSON.parse(row.ingredientes) : (row.ingredientes || {})
                    const pend = typeof row.ejercicios_pendientes === 'string' ? JSON.parse(row.ejercicios_pendientes) : (row.ejercicios_pendientes || {})
                    const comp = typeof row.ejercicios_completados === 'string' ? JSON.parse(row.ejercicios_completados) : (row.ejercicios_completados || {})

                    const searchId = mode === 'swap' ? payload.oldId : payload.newId
                    const findInC = (c: any) => {
                        if (!c) return null
                        for (const k of Object.keys(c)) {
                            const v = c[k]; if (v && typeof v === 'object' && String(v.id || v.ejercicio_id) === String(searchId)) return { c, k, item: v }
                        }
                        if (c.ejercicios) {
                            if (Array.isArray(c.ejercicios)) {
                                const idx = c.ejercicios.findIndex((x: any) => String(x.id || x.ejercicio_id) === String(searchId))
                                if (idx !== -1) return { c: c.ejercicios, k: String(idx), item: c.ejercicios[idx] }
                            } else {
                                for (const k of Object.keys(c.ejercicios)) {
                                    const v = c.ejercicios[k]; if (v && typeof v === 'object' && String(v.id || v.ejercicio_id) === String(searchId)) return { c: c.ejercicios, k, item: v }
                                }
                            }
                        }
                        return null
                    }

                    const found = findInC(pend) || findInC(comp)
                    if (found) {
                        const macroKey = Object.keys(macros).find(k => k === `${searchId}_${found.item.orden}`) || Object.keys(macros).find(k => k.startsWith(`${searchId}_`))
                        if (mode === 'swap') {
                            found.item.id = Number(payload.newId); if (found.item.ejercicio_id) found.item.ejercicio_id = Number(payload.newId)
                            const newK = `${payload.newId}_${found.item.orden}`
                            if (macroKey) { delete macros[macroKey]; if (ing[macroKey]) delete ing[macroKey] }
                            macros[newK] = payload.macros; if (payload.ingredients) ing[newK] = payload.ingredients
                        } else if (macroKey) {
                            macros[macroKey] = { ...macros[macroKey], ...payload.macros }; if (payload.ingredients) ing[macroKey] = payload.ingredients
                        }
                        updates.push({ ...row, macros, ingredientes: ing, ejercicios_pendientes: pend, ejercicios_completados: comp })
                    }
                }
                if (updates.length) await supabase.from('progreso_cliente_nutricion').upsert(updates)
            }
        } catch (e) { console.error(e) } finally {
            setActivityDetailsByKey({}); await fetchClientCalendarSummary()
            setCascadeModal(null); setLoading(false)
        }
    }, [cascadeModal, clientId, supabase, fetchClientCalendarSummary, setActivityDetailsByKey, setLoading])

    return { cascadeModal, setCascadeModal, handleApplyCascade }
}
