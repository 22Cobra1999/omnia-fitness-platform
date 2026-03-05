import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { applyPersonalization, ClientProfile, ConditionalRule } from '@/lib/utils/personalization-engine'
import { reconstructPrescription, AdaptiveProfile, AdaptiveBase } from '@/lib/omnia-adaptive-motor'

// Endpoint para inicializar todas las filas de progreso_cliente al comprar una actividad
export async function POST(request: NextRequest) {
  try {
    const { activityId, clientId, startDate, enrollmentId: explicitEnrollmentId } = await request.json()

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
      .select('coach_id, type, categoria, adaptive_rule_ids')
      .eq('id', activityId)
      .single()

    const adaptiveRuleIds = actBase?.adaptive_rule_ids || []

    // Obtener las reglas del catálogo que están habilitadas para esta actividad
    const { data: catalogRules } = await supabase
      .from('adaptive_rules_catalog')
      .select('*')
      .in('id', adaptiveRuleIds)

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
      activityLevel: "Moderately Active",
      ages: clientProfile.birth_date ? [calculateAge(clientProfile.birth_date)] : [30],
      genders: clientProfile.gender ? [clientProfile.gender as any] : ["male"],
      weight: clientProfile.current_weight,
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
    console.log('📏 Adaptive Rules detected:', adaptiveRuleIds?.length || 0)

    // 1. Obtener información del enrollment
    let enrollmentData;
    if (explicitEnrollmentId) {
      const { data } = await supabase
        .from('activity_enrollments')
        .select('id, start_date')
        .eq('id', explicitEnrollmentId)
        .single()
      enrollmentData = data;
    } else {
      const { data } = await supabase
        .from('activity_enrollments')
        .select('id, start_date')
        .eq('activity_id', parseInt(activityId))
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      enrollmentData = data;
    }

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

    console.log('🔍 Consultando planificación for activity:', activityId, 'categoria:', categoria)

    // Intentar obtener de la tabla correspondiente
    const planTable = categoria === 'nutricion' ? 'planificacion_platos' : 'planificacion_ejercicios'

    let { data: planData, error: planError } = await supabase
      .from(planTable)
      .select('*')
      .eq('actividad_id', parseInt(activityId))
      .order('numero_semana', { ascending: true })

    // Fallback if nutrition table doesn't exist or is empty
    if (categoria === 'nutricion' && (!planData || planData.length === 0)) {
      console.log('⚠️ No se encontró en planificacion_platos, intentando planificacion_ejercicios')
      const { data: secondTry } = await supabase
        .from('planificacion_ejercicios')
        .select('*')
        .eq('actividad_id', parseInt(activityId))
        .order('numero_semana', { ascending: true })
      planData = secondTry
    }

    console.log(`📋 Planificación encontrada (${planTable}):`, planData?.length || 0)
    if (planError) {
      console.error(`❌ Error obteniendo planificación desde ${planTable}:`, planError)
    }

    planificacion = planData || []

    if (!planificacion || planificacion.length === 0) {
      console.error('❌ No hay planificación para esta actividad en ninguna tabla')
      return NextResponse.json({
        error: 'No hay planificación para esta actividad',
        categoria: categoria,
        activityId
      }, { status: 404 })
    }

    const maxSemanasPlanificacion = Math.max(...planificacion.map(p => p.numero_semana))
    const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']

    // 5. Usar directamente el startDate proporcionado
    const start = new Date(startDate + 'T00:00:00')

    const registrosACrear: any[] = []
    const totalSemanas = maxSemanasPlanificacion * cantidadPeriodos
    console.log(`🚀 Iniciando generación: ${totalSemanas} semanas en total (${maxSemanasPlanificacion} x ${cantidadPeriodos})`)

    for (let semanaAbsoluta = 1; semanaAbsoluta <= totalSemanas; semanaAbsoluta++) {
      const semanaEnCiclo = ((semanaAbsoluta - 1) % maxSemanasPlanificacion) + 1
      const planSemana = planificacion.find(p => p.numero_semana === semanaEnCiclo)

      if (!planSemana) {
        console.warn(`⚠️ Semana ${semanaEnCiclo} no encontrada en la planificación`)
        continue
      }

      console.log(`📅 Procesando Semana Absoluta ${semanaAbsoluta} (Semana Ciclo ${semanaEnCiclo})`)
      const inicioSemana = new Date(start)
      inicioSemana.setDate(start.getDate() + ((semanaAbsoluta - 1) * 7))

      for (let diaSemana = 0; diaSemana < 7; diaSemana++) {
        const nombreDia = diasSemana[diaSemana]
        const ejerciciosDia = planSemana[nombreDia]

        if (ejerciciosDia && ejerciciosDia !== '{}' && ejerciciosDia !== '') {
          let ejerciciosParsed: any
          try {
            ejerciciosParsed = typeof ejerciciosDia === 'string'
              ? JSON.parse(ejerciciosDia)
              : ejerciciosDia
          } catch {
            continue
          }

          const ejerciciosPendientes: any = {}
          const detallesSeries: any = {}
          let ordenGlobal = 1

          let ejerciciosArray: any[] = []
          if (ejerciciosParsed && typeof ejerciciosParsed === 'object') {
            if (Array.isArray(ejerciciosParsed.ejercicios)) {
              ejerciciosArray = ejerciciosParsed.ejercicios
            } else if (Array.isArray(ejerciciosParsed)) {
              ejerciciosArray = ejerciciosParsed
            }
          }

          const ejercicioIdsSet = new Set<number>()
          ejerciciosArray.forEach((ej: any) => {
            const id = ej.id || ej.ejercicio_id || ej.exercise_id
            if (id) {
              ejercicioIdsSet.add(parseInt(id))
            }
          })

          const ejercicioIdsArray = Array.from(ejercicioIdsSet)
          console.log(`🔍 [${nombreDia}] IDs detectados:`, ejercicioIdsArray)
          let ejerciciosData: any[] = []

          if (categoria === 'nutricion') {
            const { data: platosData } = await supabase
              .from('nutrition_program_details')
              .select('id, receta, calorias, proteinas, carbohidratos, grasas')
              .in('id', ejercicioIdsArray)
            ejerciciosData = platosData || []
          } else {
            const { data: ejerciciosFitnessData } = await supabase
              .from('ejercicios_detalles')
              .select('id, detalle_series, duracion_min, calorias, descanso')
              .in('id', ejercicioIdsArray)
            ejerciciosData = ejerciciosFitnessData || []
          }

          const ejerciciosMap = new Map()
          ejerciciosData?.forEach((ej: any) => {
            if (categoria === 'nutricion') {
              // LÓGICA DE NUTRICIÓN ADAPTATIVA (Sincronizada con auditoría v3.0)
              const bmi = (clientProfile.current_weight && clientProfile.current_height)
                ? clientProfile.current_weight / Math.pow(clientProfile.current_height / 100, 2)
                : 24
              const age = clientProfile.birth_date ? calculateAge(clientProfile.birth_date) : 30
              const gender = (clientProfile.gender || '').toLowerCase()

              // Filtrar reglas que aplican a este cliente específico
              const matchingRules = (catalogRules || []).filter(r => {
                const name = (r.name || '').toLowerCase()
                if (r.category === 'gender' && name.includes(gender)) return true
                if (r.category === 'bmi' && bmi >= 30 && name.includes('obesidad')) return true
                if (r.category === 'age' && age < 18 && name.includes('<18')) return true
                if (r.category === 'age' && age >= 26 && age <= 35 && name.includes('plenitud')) return true
                if (r.category === 'level' && name.includes((clientProfile.intensity_level || '').toLowerCase())) return true
                return false
              })

              // Calcular multiplicadores acumulados (Producto de reglas)
              let factorKcal = 1.0
              let factorProt = 1.0
              matchingRules.forEach(r => {
                factorKcal *= (r.kcal || 1.0)
                factorProt *= (r.proteina || 1.0)
              })

              const kcalFinal = Math.round((ej.calorias || 0) * factorKcal)
              const protFinal = Number(((ej.proteinas || 0) * factorProt).toFixed(1))

              const detallesNutricion = {
                proteinas: protFinal,
                carbohidratos: ej.carbohidratos || 0,
                grasas: ej.grasas || 0,
                receta: ej.receta || '',
                ajuste_motor: factorKcal !== 1.0 ? factorKcal : undefined
              }

              ejerciciosMap.set(ej.id, {
                detalle_series: JSON.stringify(detallesNutricion),
                duracion_min: 0,
                calorias: kcalFinal
              })
            } else {
              const base: AdaptiveBase = {
                sets: 3,
                reps: 10,
                series: 3,
                load_kg: 0
              }

              let parsedBase = { ...base }
              if (typeof ej.detalle_series === 'string') {
                try {
                  // Prioridad 1: JSON
                  const ds = JSON.parse(ej.detalle_series)
                  parsedBase.sets = ds.series || ds.sets || 3
                  parsedBase.series = ds.series || ds.sets || 3
                  parsedBase.reps = ds.repeticiones || ds.reps || 10
                  parsedBase.load_kg = ds.peso || ds.load || ds.kg || 0
                } catch (e) {
                  // Prioridad 2: Formato Custom "(P-R-S)" o "(P-R-S); (P-R-S)"
                  const match = ej.detalle_series.match(/\((\d+)-(\d+)-(\d+)\)/)
                  if (match) {
                    parsedBase.load_kg = parseInt(match[1]) || 0
                    parsedBase.reps = parseInt(match[2]) || 10
                    parsedBase.sets = parseInt(match[3]) || 3
                    parsedBase.series = parseInt(match[3]) || 3
                  }
                }
              } else if (typeof ej.detalle_series === 'object' && ej.detalle_series !== null) {
                parsedBase.sets = ej.detalle_series.series || ej.detalle_series.sets || 3
                parsedBase.series = ej.detalle_series.series || ej.detalle_series.sets || 3
                parsedBase.reps = ej.detalle_series.repeticiones || ej.detalle_series.reps || 10
                parsedBase.load_kg = ej.detalle_series.peso || ej.detalle_series.load || ej.detalle_series.kg || 0
              }

              const adaptiveResult = reconstructPrescription(parsedBase, adaptiveProfile, adaptiveRuleIds)

              const finalDetalle = {
                series: adaptiveResult.final.sets,
                repeticiones: adaptiveResult.final.reps,
                peso: adaptiveResult.final.load,
                ...(typeof ej.detalle_series === 'object' ? ej.detalle_series : {})
              }

              ejerciciosMap.set(ej.id, {
                detalle_series: JSON.stringify(finalDetalle),
                duracion_min: ej.duracion_min || 0,
                calorias: ej.calorias || 0,
                series: adaptiveResult.final.sets,
                reps: adaptiveResult.final.reps,
                peso: adaptiveResult.final.load,
                descanso: ej.descanso || 60,
                applied_factors: adaptiveResult.appliedFactors
              })
            }
          })

          ejerciciosArray.forEach((ej: any) => {
            if (ej.id) {
              const ejercicioId = parseInt(ej.id)
              const orden = ej.orden || ordenGlobal
              const bloqueNum = ej.bloque || 1
              const keyUnico = `${ejercicioId}_${bloqueNum}_${orden}`

              // Simplificado: Guardamos solo el ID (o true), ya que la info de bloque/orden está en la KEY
              ejerciciosPendientes[keyUnico] = ejercicioId

              const ejercicioData = ejerciciosMap.get(ejercicioId) || { detalle_series: '', duracion_min: 0, calorias: 0 }

              detallesSeries[keyUnico] = {
                id: ejercicioId,
                detalle_series: ejercicioData.detalle_series || ''
              }

              if (!ej.orden) ordenGlobal++
            }
          })

          if (Object.keys(ejerciciosPendientes).length > 0) {
            const fechaDia = new Date(inicioSemana)
            fechaDia.setDate(inicioSemana.getDate() + diaSemana)
            const fechaStr = fechaDia.toISOString().split('T')[0]

            const minutosJson: any = {}
            const caloriasJson: any = {}
            const pesoJson: any = {}
            const seriesJson: any = {}
            const repsJson: any = {}
            const descansoJson: any = {}

            Object.keys(ejerciciosPendientes).forEach(key => {
              const ejercicioId = ejerciciosPendientes[key]
              const ejercicioData = ejerciciosMap.get(ejercicioId) || { duracion_min: 0, calorias: 0, peso: 0, series: 0, reps: 0, descanso: 60 }
              minutosJson[key] = ejercicioData.duracion_min || 0
              caloriasJson[key] = ejercicioData.calorias || 0
              pesoJson[key] = ejercicioData.peso || 0
              seriesJson[key] = ejercicioData.series || 0
              repsJson[key] = ejercicioData.reps || 0
              descansoJson[key] = ejercicioData.descanso || 60
            })

            const registro: any = {
              actividad_id: parseInt(activityId),
              cliente_id: clientId,
              enrollment_id: enrollmentId,
              fecha: fechaStr,
              ejercicios_completados: {},
              ejercicios_pendientes: ejerciciosPendientes
            }

            if (categoria === 'nutricion') {
              const macrosJson: any = {}
              Object.keys(ejerciciosPendientes).forEach(key => {
                const ejId = ejerciciosPendientes[key]
                const ejData = ejerciciosMap.get(ejId)
                if (ejData && ejData.detalle_series) {
                  try { macrosJson[key] = JSON.parse(ejData.detalle_series) } catch { macrosJson[key] = {} }
                }
              })
              registro.macros = macrosJson
            } else {
              registro.informacion = detallesSeries
              registro.minutos = minutosJson
              registro.calorias = caloriasJson
              registro.peso = pesoJson
              registro.series = seriesJson
              registro.reps = repsJson
              registro.descanso = descansoJson
            }

            registrosACrear.push(registro)
          }
        }
      }
    }

    if (registrosACrear.length === 0) {
      return NextResponse.json({ success: true, message: 'No recordings created', recordsCreated: 0 })
    }

    const targetTable = categoria === 'nutricion' ? 'progreso_cliente_nutricion' : 'progreso_cliente'
    const { data: created, error: insertError } = await supabase.from(targetTable).insert(registrosACrear).select()

    if (insertError) {
      return NextResponse.json({ error: `Error at ${targetTable}`, details: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `${created?.length || 0} days initialized`,
      recordsCreated: created?.length || 0
    })

  } catch (error: any) {
    console.error('❌ Error in initialize-progress:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
