import { createClient } from '@supabase/supabase-js'

/**
 * Saves the weekly schedule for a program/fitness product.
 */
export async function saveWeeklySchedule(supabase: any, activityId: number | string, weeklySchedule: any, category?: string) {
    try {
        const activityIdInt = typeof activityId === 'string' ? parseInt(activityId, 10) : activityId
        if (!weeklySchedule || Object.keys(weeklySchedule).length === 0) return

        const isNutrition = category === 'nutricion' || category === 'nutrition'

        const cleanDayData = (data: any) => {
            if (!data) return {}
            let dayObj = data
            if (typeof data === 'string' && data.trim() !== '') {
                try { dayObj = JSON.parse(data); } catch { return {} }
            }
            if (!dayObj || typeof dayObj !== 'object') return {}
            if (Array.isArray(dayObj)) dayObj = { ejercicios: dayObj }

            const cleanObj: any = {}
            if (dayObj.blockCount !== undefined) cleanObj.blockCount = Number(dayObj.blockCount)
            if (dayObj.blockNames) cleanObj.blockNames = dayObj.blockNames

            const exList = dayObj.ejercicios || dayObj.exercises
            if (exList && Array.isArray(exList)) {
                cleanObj.ejercicios = exList
                    .filter((ex: any) => ex && ex.activo !== false && ex.is_active !== false)
                    .map((ex: any) => {
                        const item: any = {
                            id: Number(ex.id || ex.ejercicio_id || ex.id_ejercicio || ex.exercise_id),
                            orden: Number(ex.orden || ex.order || 1),
                            bloque: Number(ex.bloque || ex.block || 1)
                        }
                        item.series = String(ex.series || ex.series_num || ex.sets || ex.Series || ex.Sets || ex.Blocks || ex.Bloques || '1')
                        item.reps = String(ex.reps || ex.repeticiones || ex.reps_num || ex.Reps || ex.Repeticiones || ex['Repeticiones Ejercicio'] || '0')
                        item.peso = String(ex.peso || ex.peso_kg || ex.weight || ex.Weight || ex.Peso || ex['Peso (kg)'] || ex['Peso Ejercicio'] || '0')
                        
                        if (ex.detalle_series !== undefined) item.detalle_series = String(ex.detalle_series || ex.series_details || '')
                        if (ex.notas_coach !== undefined) item.notas_coach = String(ex.notas_coach)
                        if (ex.calorias !== undefined || ex.calories !== undefined) item.calorias = Number(ex.calorias || ex.calories || 0)
                        if (ex.proteinas !== undefined) item.proteinas = Number(ex.proteinas || 0)
                        if (ex.carbohidratos !== undefined) item.carbohidratos = Number(ex.carbohidratos || 0)
                        if (ex.grasas !== undefined) item.grasas = Number(ex.grasas || 0)
                        if (ex.minutos !== undefined || ex.minutes !== undefined || ex.duration !== undefined) {
                            item.minutos = Number(ex.minutos || ex.minutes || ex.duration || 0)
                        }
                        if (isNutrition) {
                            const name = ex.nombre || ex.name || ex.nombre_ejercicio || ex.title
                            if (name) item.nombre = name
                        }
                        return item
                    })
            } else {
                cleanObj.ejercicios = []
            }
            return cleanObj
        }

        const weekNumbersProcessed: number[] = []
        const rows: any[] = []

        Object.entries(weeklySchedule).forEach(([weekKey, weekData]: [string, any]) => {
            const weekNum = parseInt(weekKey)
            if (isNaN(weekNum)) return
            weekNumbersProcessed.push(weekNum)

            const getDayData = (dayName: string, dayIndex: string) => {
                const dayContent = weekData[dayName] || weekData[dayIndex] || weekData[parseInt(dayIndex)]
                return dayContent ? cleanDayData(dayContent) : {}
            }

            rows.push({
                actividad_id: activityIdInt,
                numero_semana: weekNum,
                lunes: getDayData('lunes', '1'),
                martes: getDayData('martes', '2'),
                miercoles: getDayData('miercoles', '3'),
                jueves: getDayData('jueves', '4'),
                viernes: getDayData('viernes', '5'),
                sabado: getDayData('sabado', '6'),
                domingo: getDayData('domingo', '7'),
                fecha_actualizacion: new Date().toISOString()
            })
        })

        if (rows.length > 0) {
            if (weekNumbersProcessed.length > 0) {
                await supabase
                    .from('planificacion_ejercicios')
                    .delete()
                    .eq('actividad_id', activityIdInt)
                    .not('numero_semana', 'in', `(${weekNumbersProcessed.join(',')})`)
            }

            const { error: upsertError } = await supabase
                .from('planificacion_ejercicios')
                .upsert(rows, { onConflict: 'actividad_id, numero_semana' })

            if (upsertError) {
                await supabase.from('planificacion_ejercicios').delete().eq('actividad_id', activityIdInt)
                const { error: insertError } = await supabase.from('planificacion_ejercicios').insert(rows)
                if (insertError) throw new Error(`Error guardando planificación: ${insertError.message}`)
            }
        }
    } catch (error) {
        console.error('❌ Error crítico en saveWeeklySchedule:', error)
    }
}

/**
 * Saves the periods (repetition settings) for a program.
 */
export async function saveProductPeriods(supabase: any, activityId: number | string, periods: number) {
    try {
        const activityIdInt = typeof activityId === 'string' ? parseInt(activityId, 10) : activityId
        const periodsInt = typeof periods === 'string' ? parseInt(periods, 10) : periods
        if (isNaN(periodsInt) || periodsInt < 1) return

        await supabase
            .from('activity_periodos')
            .upsert({
                actividad_id: activityIdInt,
                cantidad_periodos: periodsInt,
                fecha_actualizacion: new Date().toISOString()
            }, { onConflict: 'actividad_id' })

    } catch (e) {
        console.error('❌ Excepción guardando periodos:', e)
    }
}
