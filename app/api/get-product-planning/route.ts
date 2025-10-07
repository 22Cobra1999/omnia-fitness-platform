import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

// GET - Obtener planificación de ejercicios de un producto
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { searchParams } = new URL(request.url)
    const actividad_id = searchParams.get('actividad_id')

    if (!actividad_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'actividad_id es requerido' 
      }, { status: 400 })
    }

    console.log('📅 Obteniendo planificación para actividad:', actividad_id)

    // 1. Obtener planificación de ejercicios
    const { data: planificacion, error: planificacionError } = await supabase
      .from('planificacion_ejercicios')
      .select('*')
      .eq('actividad_id', actividad_id)
      .order('numero_semana')

    if (planificacionError) {
      console.error('Error obteniendo planificación:', planificacionError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error obteniendo planificación' 
      }, { status: 500 })
    }

    console.log('📅 Datos de planificación obtenidos:', planificacion)

    // 2. Obtener información de períodos
    const { data: periodos, error: periodosError } = await supabase
      .from('periodos')
      .select('*')
      .eq('actividad_id', actividad_id)
      .single()

    if (periodosError) {
      console.error('Error obteniendo períodos:', periodosError)
      // No es crítico si no hay períodos, continuar
    }

    // 3. Obtener ejercicios asociados para obtener nombres
    const { data: ejercicios, error: ejerciciosError } = await supabase
      .from('ejercicios_detalles')
      .select('id, nombre_ejercicio, tipo, descripcion, calorias, intensidad')
      .eq('activity_id', actividad_id)

    if (ejerciciosError) {
      console.error('Error obteniendo ejercicios:', ejerciciosError)
      // No es crítico, continuar sin nombres de ejercicios
    }

    console.log('📅 Ejercicios obtenidos:', ejercicios)

    // 4. Crear mapa de ejercicios por ID
    const ejerciciosMap = new Map()
    if (ejercicios) {
      ejercicios.forEach(ejercicio => {
        ejerciciosMap.set(ejercicio.id, ejercicio)
      })
    }

    // 5. Procesar planificación y convertir a formato del frontend
    const weeklySchedule: { [weekNumber: string]: { [dayNumber: string]: any[] } } = {}
    let totalSessions = 0
    const uniqueExercises = new Set<string>()

    if (planificacion && planificacion.length > 0) {
      planificacion.forEach(semana => {
        const semanaKey = semana.numero_semana.toString()
        weeklySchedule[semanaKey] = {}

        // Procesar cada día de la semana
        const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
        
        diasSemana.forEach((dia, index) => {
          const diaKey = (index + 1).toString()
          const ejerciciosDia = semana[dia]
          
          console.log(`📅 Procesando ${dia} (${diaKey}):`, ejerciciosDia)

          if (ejerciciosDia && typeof ejerciciosDia === 'string' && ejerciciosDia.trim() !== '') {
            try {
              // Intentar parsear como JSON primero (nuevo formato con bloques)
              const bloquesEjercicios = JSON.parse(ejerciciosDia)
              
              if (typeof bloquesEjercicios === 'object' && !Array.isArray(bloquesEjercicios)) {
                // Nuevo formato: { "1": [{ "id": 1000, "orden": 1 }], "2": [...] }
                const todosEjercicios: any[] = []
                
                Object.keys(bloquesEjercicios).forEach(bloqueKey => {
                  const bloque = parseInt(bloqueKey)
                  const ejerciciosBloque = bloquesEjercicios[bloqueKey]
                  
                  console.log(`🔍 Procesando bloque ${bloqueKey}:`, ejerciciosBloque)
                  
                  if (Array.isArray(ejerciciosBloque)) {
                    ejerciciosBloque.forEach((ejercicioData: any) => {
                      console.log(`🔍 Buscando ejercicio con ID: ${ejercicioData.id}`)
                      const ejercicio = ejerciciosMap.get(ejercicioData.id)
                      
                      if (ejercicio) {
                        console.log(`✅ Ejercicio encontrado: ${ejercicio.nombre_ejercicio}`)
                        uniqueExercises.add(ejercicio.nombre_ejercicio)
                        todosEjercicios.push({
                          id: ejercicio.id,
                          name: ejercicio.nombre_ejercicio,
                          type: ejercicio.tipo,
                          description: ejercicio.descripcion,
                          calories: ejercicio.calorias,
                          intensity: ejercicio.intensidad,
                          block: bloque,
                          orden: ejercicioData.orden
                        })
                      } else {
                        console.log(`❌ Ejercicio NO encontrado para ID: ${ejercicioData.id}`)
                        console.log(`🔍 IDs disponibles en ejerciciosMap:`, Array.from(ejerciciosMap.keys()))
                      }
                    })
                  }
                })
                
                // Ordenar por orden
                todosEjercicios.sort((a, b) => a.orden - b.orden)
                
                console.log(`📊 Ejercicios finales para ${dia}:`, todosEjercicios.length, todosEjercicios)
                
                if (todosEjercicios.length > 0) {
                  weeklySchedule[semanaKey][diaKey] = todosEjercicios
                  totalSessions++
                }
              } else {
                throw new Error('No es el formato de bloques esperado')
              }
            } catch (jsonError) {
              // Si no es JSON válido, procesar como formato anterior (IDs separados por comas)
              console.log('📅 Formato anterior detectado, procesando como IDs separados por comas')
              const ejercicioIds = ejerciciosDia.split(',').map(id => id.trim()).filter(id => id)
              const ejerciciosObjetos = ejercicioIds.map((id: string, index: number) => {
                // Manejar tanto IDs numéricos como strings como 'exercise-0'
                let ejercicio = null
                if (id.startsWith('exercise-')) {
                  // Si es un ID de tipo 'exercise-X', extraer el índice y usar el ejercicio correspondiente
                  const exerciseIndex = parseInt(id.replace('exercise-', ''))
                  const ejerciciosArray = Array.from(ejerciciosMap.values())
                  ejercicio = ejerciciosArray[exerciseIndex] || ejerciciosArray[0]
                } else {
                  // Si es un ID numérico, buscar por ID
                  ejercicio = ejerciciosMap.get(parseInt(id))
                }
                
                if (ejercicio) {
                  uniqueExercises.add(ejercicio.nombre_ejercicio)
                  return {
                    id: ejercicio.id,
                    name: ejercicio.nombre_ejercicio,
                    type: ejercicio.tipo,
                    description: ejercicio.descripcion,
                    calories: ejercicio.calorias,
                    intensity: ejercicio.intensidad
                  }
                }
                return null
              }).filter((ej: any) => ej !== null)

              if (ejerciciosObjetos.length > 0) {
                weeklySchedule[semanaKey][diaKey] = ejerciciosObjetos
                totalSessions++
              }
            }
          } else if (ejerciciosDia && typeof ejerciciosDia === 'object') {
            // Si es objeto JSON, procesar directamente
            if (ejerciciosDia.ejercicios && Array.isArray(ejerciciosDia.ejercicios)) {
              const ejerciciosObjetos = ejerciciosDia.ejercicios.map((id: any) => {
                const ejercicio = ejerciciosMap.get(id)
                if (ejercicio) {
                  uniqueExercises.add(ejercicio.nombre_ejercicio)
                  return {
                    id: ejercicio.id,
                    name: ejercicio.nombre_ejercicio,
                    type: ejercicio.tipo,
                    description: ejercicio.descripcion,
                    calories: ejercicio.calorias,
                    intensity: ejercicio.intensidad
                  }
                }
                return null
              }).filter((ej: any) => ej !== null)

              if (ejerciciosObjetos.length > 0) {
                weeklySchedule[semanaKey][diaKey] = ejerciciosObjetos
                totalSessions++
              }
            }
          }
        })
      })
    }

    console.log('📅 Planificación procesada:', {
      semanas: Object.keys(weeklySchedule).length,
      sesiones: totalSessions,
      ejerciciosUnicos: uniqueExercises.size,
      periodos: periodos?.cantidad_periodos || 1
    })

    return NextResponse.json({
      success: true,
      data: {
        weeklySchedule,
        periods: periodos?.cantidad_periodos || 1,
        totalSessions,
        uniqueExercises: Array.from(uniqueExercises),
        semanas: Object.keys(weeklySchedule).length
      }
    })

  } catch (error) {
    console.error('Error en GET /api/get-product-planning:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}