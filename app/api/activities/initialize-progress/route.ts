import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Endpoint para inicializar todas las filas de progreso_cliente al comprar una actividad
export async function POST(request: NextRequest) {
  try {
    const { activityId, clientId, startDate } = await request.json()

    if (!activityId || !clientId || !startDate) {
      return NextResponse.json({ 
        error: 'activityId, clientId y startDate son requeridos' 
      }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    console.log('🔧 Supabase config:', {
      url: supabaseUrl ? '✅ Configurado' : '❌ No configurado',
      key: supabaseKey ? '✅ Configurado' : '❌ No configurado'
    })

    console.log('🚀 Inicializando progreso para actividad', activityId, 'cliente', clientId)
    console.log('🔍 Tipos de datos:', {
      activityId: typeof activityId,
      clientId: typeof clientId,
      startDate: typeof startDate
    })

    // 1. Obtener información de la actividad para determinar el tipo
    const { data: actividadData } = await supabase
      .from('activities')
      .select('categoria')
      .eq('id', parseInt(activityId))
      .single()
    
    const categoria = actividadData?.categoria || 'fitness'
    console.log('📊 Categoría de actividad:', categoria)

    // 2. Obtener cantidad de períodos
    const { data: periodosData } = await supabase
      .from('periodos')
      .select('cantidad_periodos')
      .eq('actividad_id', parseInt(activityId))
      .single()
    
    const cantidadPeriodos = periodosData?.cantidad_periodos || 1
    console.log('📊 Cantidad de períodos:', cantidadPeriodos)

    // 3. Obtener toda la planificación según la categoría
    let planificacion: any[] = []
    
    // Simplificar: usar planificacion_ejercicios para ambos casos por ahora
    console.log('🔍 Consultando planificacion_ejercicios para actividad:', activityId, 'tipo:', typeof activityId)
    const { data: planificacionEjercicios, error: ejerciciosError } = await supabase
      .from('planificacion_ejercicios')
      .select('*')
      .eq('actividad_id', parseInt(activityId))
      .order('numero_semana', { ascending: true })
    
    console.log('📋 Planificación de ejercicios encontrada:', planificacionEjercicios?.length || 0)
    if (ejerciciosError) {
      console.error('❌ Error obteniendo planificación de ejercicios:', ejerciciosError)
    }
    
    planificacion = planificacionEjercicios || []

    console.log('📊 Planificación final obtenida:', planificacion.length, 'semanas')
    
    if (!planificacion || planificacion.length === 0) {
      return NextResponse.json({ 
        error: 'No hay planificación para esta actividad',
        categoria: categoria,
        tablaUsada: categoria === 'nutricion' ? 'planificacion_ejercicios (fallback)' : 'planificacion_ejercicios',
        debug: {
          planificacionLength: planificacion?.length || 0,
          planificacionData: planificacion
        }
      }, { status: 404 })
    }

    const maxSemanasPlanificacion = Math.max(...planificacion.map(p => p.numero_semana))
    console.log('📅 Semanas en planificación:', maxSemanasPlanificacion)

    // 3. Mapeo de días (índice 0 = lunes, 1 = martes, ..., 6 = domingo)
    const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']

    // 4. Encontrar el primer día con ejercicios en la semana 1
    const primeraSemana = planificacion.find(p => p.numero_semana === 1)
    let primerDiaConEjercicios = -1
    
    if (primeraSemana) {
      for (let i = 0; i < diasSemana.length; i++) {
        const dia = diasSemana[i]
        const ejerciciosDia = primeraSemana[dia]
        if (ejerciciosDia && ejerciciosDia !== '{}' && ejerciciosDia !== '' && ejerciciosDia !== '""') {
          primerDiaConEjercicios = i
          break
        }
      }
    }

    // 5. Usar directamente el startDate proporcionado
    // El ajuste ya se hizo en el frontend (handleStartOnFirstDay)
    const start = new Date(startDate + 'T00:00:00')
    
    console.log('🗓️ Fecha de inicio:', {
      startDate: startDate,
      primerDiaConEjercicios: diasSemana[primerDiaConEjercicios] || 'lunes',
      startDayOfWeek: ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][start.getDay()]
    })

    // 6. Generar todas las filas de progreso para todos los períodos
    const registrosACrear: any[] = []

    // Calcular total de semanas a generar
    const totalSemanas = maxSemanasPlanificacion * cantidadPeriodos

    for (let semanaAbsoluta = 1; semanaAbsoluta <= totalSemanas; semanaAbsoluta++) {
      // Calcular qué semana del ciclo es (1 o 2 o 3...)
      const semanaEnCiclo = ((semanaAbsoluta - 1) % maxSemanasPlanificacion) + 1
      
      // Obtener planificación para esta semana del ciclo
      const planSemana = planificacion.find(p => p.numero_semana === semanaEnCiclo)
      
      if (!planSemana) continue

      // Calcular la fecha de inicio de esta semana (lunes de la semana)
      const inicioSemana = new Date(start)
      inicioSemana.setDate(start.getDate() + ((semanaAbsoluta - 1) * 7))

      // Revisar cada día de la semana
      for (let diaSemana = 0; diaSemana < 7; diaSemana++) {
        const nombreDia = diasSemana[diaSemana]
        const ejerciciosDia = planSemana[nombreDia]

        // Si este día tiene ejercicios
        if (ejerciciosDia && ejerciciosDia !== '{}' && ejerciciosDia !== '') {
          // Parsear ejercicios
          let ejerciciosParsed: any
          try {
            ejerciciosParsed = typeof ejerciciosDia === 'string' 
              ? JSON.parse(ejerciciosDia) 
              : ejerciciosDia
          } catch {
            continue
          }

          // Extraer ejercicios con identificadores únicos (ID + orden)
          const ejerciciosPendientes: any = {} // Objeto con keys "id_orden"
          const detallesSeries: any = {}
          let ordenGlobal = 1 // Contador de orden global para el día
          
          // Extraer array de ejercicios del formato {ejercicios: [{id, orden, bloque}, ...]}
          let ejerciciosArray: any[] = []
          if (ejerciciosParsed && typeof ejerciciosParsed === 'object') {
            if (Array.isArray(ejerciciosParsed.ejercicios)) {
              // Nuevo formato: {ejercicios: [...]}
              ejerciciosArray = ejerciciosParsed.ejercicios
            } else if (Array.isArray(ejerciciosParsed)) {
              // Formato directo: [...]
              ejerciciosArray = ejerciciosParsed
            }
          }
          
          // Primero obtener todos los IDs de ejercicios para cargar sus detalles
          const ejercicioIdsSet = new Set<number>()
          ejerciciosArray.forEach((ej: any) => {
            if (ej.id) {
              ejercicioIdsSet.add(parseInt(ej.id))
            }
          })
          
          // Obtener detalles según la categoría
          const ejercicioIdsArray = Array.from(ejercicioIdsSet)
          let ejerciciosData: any[] = []
          
          if (categoria === 'nutricion') {
            // Para nutrición: usar platos_detalles
            const { data: platosData } = await supabase
              .from('platos_detalles')
              .select('id, receta, calorias, proteinas, carbohidratos, grasas')
              .in('id', ejercicioIdsArray)
            ejerciciosData = platosData || []
            console.log(`📚 Platos cargados desde platos_detalles: ${ejerciciosData.length}`)
          } else {
            // Para fitness: usar ejercicios_detalles
            const { data: ejerciciosFitnessData } = await supabase
              .from('ejercicios_detalles')
              .select('id, detalle_series, duracion_min, calorias')
              .in('id', ejercicioIdsArray)
            ejerciciosData = ejerciciosFitnessData || []
            console.log(`📚 Ejercicios cargados desde ejercicios_detalles: ${ejerciciosData.length}`)
          }
          
          if (ejerciciosData.length > 0) {
            console.log('🔍 DEBUG - Primer elemento:', JSON.stringify(ejerciciosData[0], null, 2))
          }
          
          const ejerciciosMap = new Map()
          ejerciciosData?.forEach((ej: any) => {
            if (categoria === 'nutricion') {
              // Para nutrición: guardar macronutrientes y receta
              const detallesNutricion = {
                proteinas: ej.proteinas || 0,
                carbohidratos: ej.carbohidratos || 0,
                grasas: ej.grasas || 0,
                receta: ej.receta || ''
              }
              
              console.log(`🔧 Plato ${ej.id} - detalles nutrición:`, detallesNutricion)
              ejerciciosMap.set(ej.id, {
                detalle_series: JSON.stringify(detallesNutricion),
                duracion_min: 0, // Los platos no tienen duración
                calorias: ej.calorias || 0
              })
            } else {
              // Para fitness: manejar detalle_series como antes
              let detalleSeries = ej.detalle_series || ''
              
              // Si es un objeto JSONB, convertirlo a string para guardarlo
              if (typeof detalleSeries === 'object' && detalleSeries !== null) {
                detalleSeries = JSON.stringify(detalleSeries)
              }
              
              console.log(`🔧 Ejercicio ${ej.id} - detalle_series: ${JSON.stringify(detalleSeries)}`)
              ejerciciosMap.set(ej.id, {
                detalle_series: detalleSeries,
                duracion_min: ej.duracion_min || 0,
                calorias: ej.calorias || 0
              })
            }
          })
          
          // Ahora procesar los ejercicios usando el orden y bloque que vienen de planificacion_ejercicios
          ejerciciosArray.forEach((ej: any) => {
            if (ej.id) {
              const ejercicioId = parseInt(ej.id)
              // Usar el orden que viene de planificacion_ejercicios (ya está definido)
              const orden = ej.orden || ordenGlobal
              const bloqueNum = ej.bloque || 1
              const keyUnico = `${ejercicioId}_${orden}`
              
              // Crear entrada en ejercicios_pendientes
              ejerciciosPendientes[keyUnico] = {
                ejercicio_id: ejercicioId,
                bloque: bloqueNum,
                orden: orden
              }
              
              // Obtener datos del ejercicio desde el mapa
              const ejercicioData = ejerciciosMap.get(ejercicioId) || { detalle_series: '', duracion_min: 0, calorias: 0 }
              
              // Guardar metadata completa en detalles_series incluyendo detalle_series de la tabla ejercicios
              detallesSeries[keyUnico] = {
                ejercicio_id: ejercicioId,
                bloque: bloqueNum,
                orden: orden,
                detalle_series: ejercicioData.detalle_series || ''
              }
              
              // Solo incrementar ordenGlobal si no venía orden definido
              if (!ej.orden) {
                ordenGlobal++
              }
            }
          })

          if (Object.keys(ejerciciosPendientes).length > 0) {
            // Calcular fecha exacta del día
            const fechaDia = new Date(inicioSemana)
            fechaDia.setDate(inicioSemana.getDate() + diaSemana)
            const fechaStr = fechaDia.toISOString().split('T')[0]

            // Crear objetos de minutos y calorías basados en los ejercicios
            const minutosJson: any = {}
            const caloriasJson: any = {}
            
            Object.keys(ejerciciosPendientes).forEach(key => {
              const ejercicioId = ejerciciosPendientes[key].ejercicio_id
              const ejercicioData = ejerciciosMap.get(ejercicioId) || { duracion_min: 0, calorias: 0 }
              
              minutosJson[key] = ejercicioData.duracion_min || 0
              caloriasJson[key] = ejercicioData.calorias || 0
            })

            registrosACrear.push({
              actividad_id: activityId,
              cliente_id: clientId,
              fecha: fechaStr,
              ejercicios_completados: {}, // Objeto vacío al inicio
              ejercicios_pendientes: ejerciciosPendientes, // Objeto con keys "id_orden"
              detalles_series: detallesSeries,
              minutos_json: minutosJson,
              calorias_json: caloriasJson
            })

            console.log(`  ✅ Semana ${semanaAbsoluta} (ciclo ${semanaEnCiclo}), ${nombreDia} ${fechaStr}: ${Object.keys(ejerciciosPendientes).length} ejercicios`)
          }
        }
      }
    }

    console.log(`📝 Total de registros a crear: ${registrosACrear.length}`)
    
    // DEBUG: Ver primer registro
    if (registrosACrear.length > 0) {
      console.log('🔍 PRIMER REGISTRO A INSERTAR:')
      console.log('📊 ejercicios_pendientes:', JSON.stringify(registrosACrear[0].ejercicios_pendientes, null, 2))
      console.log('📋 detalles_series:', JSON.stringify(registrosACrear[0].detalles_series, null, 2))
      console.log('🔑 Keys en pendientes:', Object.keys(registrosACrear[0].ejercicios_pendientes))
    }

    if (registrosACrear.length === 0) {
      return NextResponse.json({ 
        success: true,
        message: 'No hay días con ejercicios en la planificación',
        recordsCreated: 0
      })
    }

    // 5. Insertar todos los registros
    const { data: created, error: insertError } = await supabase
      .from('progreso_cliente')
      .insert(registrosACrear)
      .select()

    if (insertError) {
      console.error('❌ Error insertando registros:', insertError)
      return NextResponse.json({ 
        error: 'Error al crear registros de progreso',
        details: insertError.message 
      }, { status: 500 })
    }

    console.log(`✅ ${created?.length || 0} registros creados exitosamente`)
    
    // DEBUG: Ver qué se guardó realmente
    if (created && created.length > 0) {
      console.log('✅ PRIMER REGISTRO GUARDADO EN BD:')
      console.log('📊 ejercicios_pendientes:', JSON.stringify(created[0].ejercicios_pendientes, null, 2))
      console.log('📋 detalles_series:', JSON.stringify(created[0].detalles_series, null, 2))
      console.log('🔑 Keys guardadas:', Object.keys(created[0].ejercicios_pendientes))
    }

    return NextResponse.json({ 
      success: true,
      message: `${created?.length || 0} días de ejercicios inicializados`,
      recordsCreated: created?.length || 0,
      periods: cantidadPeriodos,
      weeksPerPeriod: maxSemanasPlanificacion,
      totalWeeks: totalSemanas
    })

  } catch (error: any) {
    console.error('❌ Error en initialize-progress:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 })
  }
}

