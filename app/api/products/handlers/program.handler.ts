
import { createClient } from '@supabase/supabase-js'

/**
 * Saves the weekly schedule for a program/fitness product.
 * Handles both English/Spanish day keys and cleaning of obsolete weeks.
 */
export async function saveWeeklySchedule(supabase: any, activityId: number | string, weeklySchedule: any, category?: string) {
    try {
        const activityIdInt = typeof activityId === 'string' ? parseInt(activityId, 10) : activityId
        console.log(`📅 Guardando planificación (formato minimalista) para actividad ${activityIdInt} (${category})...`)

        // 1. Validar schedule no vacío
        if (!weeklySchedule || Object.keys(weeklySchedule).length === 0) {
            console.log('ℹ️ Schedule vacío, saltando guardado.')
            return
        }

        const isNutrition = category === 'nutricion' || category === 'nutrition'

        const cleanDayData = (data: any) => {
            if (!data) return {}
            let dayObj = data
            if (typeof data === 'string' && data.trim() !== '') {
                try { dayObj = JSON.parse(data); } catch { return {} }
            }

            if (!dayObj || typeof dayObj !== 'object') return {}
            if (Array.isArray(dayObj)) {
                dayObj = { ejercicios: dayObj }
            }

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

        // Identificar semanas que estamos procesando para limpiar las obsoletas después
        const weekNumbersProcessed: number[] = []

        // 2. Preparar filas para insertar
        const rows: any[] = []

        Object.entries(weeklySchedule).forEach(([weekKey, weekData]: [string, any]) => {
            const weekNum = parseInt(weekKey)
            if (isNaN(weekNum)) return

            weekNumbersProcessed.push(weekNum)

            // Helper para extraer datos de días, soportando claves numéricas ("1"-"7") o nombres ("lunes")
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
            // 2. Primero eliminamos las semanas que NO están en el nuevo schedule (limpieza)
            // Esto es más seguro que borrar todo primero si algo falla en el medio
            if (weekNumbersProcessed.length > 0) {
                const { error: deleteError } = await supabase
                    .from('planificacion_ejercicios')
                    .delete()
                    .eq('actividad_id', activityIdInt)
                    .not('numero_semana', 'in', `(${weekNumbersProcessed.join(',')})`)

                if (deleteError) {
                    console.error('❌ Error limpiando semanas obsoletas:', deleteError)
                }
            }

            // 3. Upsert de las nuevas semanas (insertar o actualizar)
            // Usamos upsert con onConflict (actividad_id, numero_semana)
            const { error: upsertError } = await supabase
                .from('planificacion_ejercicios')
                .upsert(rows, { onConflict: 'actividad_id, numero_semana' })

            if (upsertError) {
                console.error('❌ Error guardando (upsert) planificación:', upsertError)
                // Intentar fallback a delete-insert si upsert falla por alguna razón exótica
                console.log('⚠️ Intentando fallback a delete-insert...')

                await supabase.from('planificacion_ejercicios').delete().eq('actividad_id', activityIdInt)
                const { error: insertError } = await supabase.from('planificacion_ejercicios').insert(rows)

                if (insertError) {
                    console.error('❌ Error fatal en fallback insert:', insertError)
                    throw new Error(`Error guardando planificación: ${insertError.message}`)
                }
            }

            console.log(`✅ Planificación guardada correctamente: ${rows.length} semanas para actividad ${activityId}`)
        } else {
            console.log(`ℹ️ No hay semanas válidas para guardar en la planificación de ${activityId}`)
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

        // Validar que periods sea un número válido
        const periodsInt = typeof periods === 'string' ? parseInt(periods, 10) : periods
        if (isNaN(periodsInt) || periodsInt < 1) {
            console.warn(`⚠️ Periodos inválidos (${periods}) para actividad ${activityId}, saltando guardado.`)
            return
        }

        const { error } = await supabase
            .from('periodos')
            .upsert({
                actividad_id: activityIdInt,
                cantidad_periodos: periodsInt,
                fecha_actualizacion: new Date().toISOString()
            }, { onConflict: 'actividad_id' })

        if (error) {
            console.error('❌ Error guardando periodos:', error)
        } else {
            console.log(`✅ Periodos guardados para actividad ${activityIdInt}: ${periodsInt}`)
        }
    } catch (e) {
        console.error('❌ Excepción guardando periodos:', e)
    }
}
