import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { applyPersonalization, ClientProfile, ConditionalRule } from '@/lib/utils/personalization-engine'
import { reconstructPrescription, AdaptiveProfile, AdaptiveBase } from '@/lib/omnia-adaptive-motor'

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

    // 0. Obtener Perfil del Cliente Consolidado y Configuración de Motor Adaptativo
    const { data: clientFullProfile } = await supabase.from('client_full_profile').select('*').eq('client_id', clientId).single()

    // Obtener la actividad con su configuración adaptativa
    const { data: actBase } = await supabase
      .from('activities')
      .select('coach_id, type, categoria, adaptive_config')
      .eq('id', activityId)
      .single()

    const adaptiveConfig = actBase?.adaptive_config

    const clientProfile: ClientProfile = {
      gender: clientFullProfile?.gender,
      birth_date: clientFullProfile?.birth_date,
      current_weight: clientFullProfile?.current_weight,
      current_height: clientFullProfile?.current_height,
      intensity_level: clientFullProfile?.intensity_level,
      fitness_goals: clientFullProfile?.onboarding_interests || clientFullProfile?.fitness_goals || [],
      injuries: clientFullProfile?.injuries || [],
      change_goal: clientFullProfile?.change_goal,
      training_modality: clientFullProfile?.training_modality,
      coaching_style: clientFullProfile?.coaching_style,
      consistency_level: clientFullProfile?.consistency_level
    }

    // Preparar el perfil para el Motor Adaptativo v3.0 (Fitness)
    const adaptiveProfile: AdaptiveProfile = {
      trainingLevel: (clientProfile.intensity_level as any) || "Intermediate",
      ages: clientProfile.birth_date ? [calculateAge(clientProfile.birth_date)] : [30],
      genders: clientProfile.gender ? [clientProfile.gender as any] : ["male"],
      bmis: (clientProfile.current_weight && clientProfile.current_height)
        ? [clientProfile.current_weight / Math.pow(clientProfile.current_height / 100, 2)]
        : [24],
      injuries: clientProfile.injuries?.map((i: any) => i.name) || []
    }

    function calculateAge(birthDate: string): number {
      const birth = new Date(birthDate);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    }

    console.log('👤 Perfil cargado para personalización:', clientProfile)
    console.log('📏 Adaptive Config detected:', adaptiveConfig ? 'Yes' : 'No')

    // 1. Obtener información de la actividad y el enrollment actual
    const { data: enrollmentData } = await supabase
      .from('activity_enrollments')
      .select('id, start_date')
      .eq('activity_id', parseInt(activityId))
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const enrollmentId = enrollmentData?.id
    if (!enrollmentId) {
      console.error('❌ No se encontró un enrollment activo para la inicialización')
      return NextResponse.json({ error: 'Inscripción no encontrada' }, { status: 404 })
    }

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
            // Para nutrición: usar nutrition_program_details
            const { data: platosData } = await supabase
              .from('nutrition_program_details')
              .select('id, receta, calorias, proteinas, carbohidratos, grasas')
              .in('id', ejercicioIdsArray)
            ejerciciosData = platosData || []
            console.log(`📚 Platos cargados desde nutrition_program_details: ${ejerciciosData.length}`)
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
              // Mapeamos adaptiveConfig a la estructura que espera applyPersonalization si es necesario,
              // o simplemente pasamos el adaptiveConfig directamente si actualizamos applyPersonalization.
              // Por ahora, como applyPersonalization es legacy, usaremos un mock de rules si el coach activó algo.
              const legacyRules: any[] = [] // nutrition logic can be updated later if needed
              const personalizedEj = applyPersonalization(ej, clientProfile, legacyRules)

              const detallesNutricion = {
                proteinas: personalizedEj.proteinas || 0,
                carbohidratos: personalizedEj.carbohidratos || 0,
                grasas: personalizedEj.grasas || 0,
                receta: personalizedEj.receta || ''
              }

              ejerciciosMap.set(ej.id, {
                detalle_series: JSON.stringify(detallesNutricion),
                duracion_min: 0,
                calorias: personalizedEj.calorias || 0
              })
            } else {
              // FITNESS: USAR MOTOR ADAPTATIVO V3.0
              const base: AdaptiveBase = {
                sets: ej.detalle_series?.series || 3, // fallback si no hay objeto
                reps: ej.detalle_series?.repeticiones || 10,
                load_kg: 0 // La planificación base suele no tener carga, o se define en la instancia
              }

              // Intentar parsear detalle_series si es string
              let parsedBase = { ...base }
              if (typeof ej.detalle_series === 'string') {
                try {
                  const ds = JSON.parse(ej.detalle_series)
                  parsedBase.sets = ds.series || ds.sets || 3
                  parsedBase.reps = ds.repeticiones || ds.reps || 10
                } catch (e) { }
              } else if (typeof ej.detalle_series === 'object' && ej.detalle_series !== null) {
                parsedBase.sets = ej.detalle_series.series || ej.detalle_series.sets || 3
                parsedBase.reps = ej.detalle_series.repeticiones || ej.detalle_series.reps || 10
              }

              const adaptiveResult = reconstructPrescription(parsedBase, adaptiveProfile, adaptiveConfig)

              const finalDetalle = {
                series: adaptiveResult.final.sets,
                repeticiones: adaptiveResult.final.reps,
                // Conservamos otros campos del detalle original si existen
                ...(typeof ej.detalle_series === 'object' ? ej.detalle_series : {})
              }

              ejerciciosMap.set(ej.id, {
                detalle_series: JSON.stringify(finalDetalle),
                duracion_min: ej.duracion_min || 0,
                calorias: ej.calorias || 0,
                applied_factors: adaptiveResult.appliedFactors // Guardar rastro para el cliente
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

            // Crear el objeto del registro según el tipo
            const registro: any = {
              actividad_id: parseInt(activityId),
              cliente_id: clientId,
              enrollment_id: enrollmentId,
              fecha: fechaStr,
              ejercicios_completados: {},
              ejercicios_pendientes: ejerciciosPendientes,
              recalculado_en: new Date().toISOString()
            }

            if (categoria === 'nutricion') {
              // Para nutrición: mapear macros desde los ejercicios del mapa
              const macrosJson: any = {}
              Object.keys(ejerciciosPendientes).forEach(key => {
                const ejId = ejerciciosPendientes[key].ejercicio_id
                const ejData = ejerciciosMap.get(ejId)
                if (ejData && ejData.detalle_series) {
                  try {
                    macrosJson[key] = JSON.parse(ejData.detalle_series)
                  } catch {
                    macrosJson[key] = {}
                  }
                }
              })
              registro.macros = macrosJson
            } else {
              // Para fitness: mapear campos tradicionales
              registro.detalles_series = detallesSeries
              registro.minutos_json = minutosJson
              registro.calorias_json = caloriasJson
            }

            registrosACrear.push(registro)

            console.log(`  ✅ Semana ${semanaAbsoluta} (ciclo ${semanaEnCiclo}), ${nombreDia} ${fechaStr}: ${Object.keys(ejerciciosPendientes).length} items`)
          }
        }
      }
    }

    console.log(`📝 Total de registros a crear: ${registrosACrear.length}`)

    if (registrosACrear.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay días con items en la planificación',
        recordsCreated: 0
      })
    }

    // 5. Insertar todos los registros en la tabla correspondiente
    const targetTable = categoria === 'nutricion' ? 'progreso_cliente_nutricion' : 'progreso_cliente'
    console.log(`🚀 Insertando en tabla: ${targetTable}`)

    const { data: created, error: insertError } = await supabase
      .from(targetTable)
      .insert(registrosACrear)
      .select()

    if (insertError) {
      console.error(`❌ Error insertando en ${targetTable}:`, insertError)
      return NextResponse.json({
        error: `Error al crear registros en ${targetTable}`,
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

