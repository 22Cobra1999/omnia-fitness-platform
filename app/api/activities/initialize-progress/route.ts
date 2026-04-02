import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ClientProfile } from '@/lib/utils/personalization-engine'
import { reconstructPrescription, AdaptiveProfile, AdaptiveBase } from '@/lib/omnia-adaptive-motor'

// Endpoint para inicializar todas las filas de progreso_cliente al comprar una actividad

function parseIngredientString(s: string) {
  if (!s || s === "" || s === '""') return null;
  // Regex para: [Nombre] [Cantidad] [Unidad]
  const regex = /^(.+?)\s+(\d+(?:\.\d+)?)\s*(.*)$/i;
  const match = s.trim().match(regex);
  if (match) {
    return {
      nombre: match[1].trim(),
      cantidad: parseFloat(match[2]),
      unidad: match[3].trim() || 'u'
    };
  }
  return { nombre: s.trim(), cantidad: 1, unidad: 'u' };
}

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

    // Obtener la actividad con su configuración adaptativa y coach_id
    const { data: actBase } = await supabase
      .from('activities')
      .select('id, coach_id, type, categoria, adaptive_rule_ids')
      .eq('id', activityId)
      .single()

    const coachId = actBase?.coach_id;
    const adaptiveRuleIds = actBase?.adaptive_rule_ids || []

    // 0.1 Obtener Reglas Dinámicas del Coach (Condicionales de Omnia)
    const { data: coachSpecificRules } = coachId ? await supabase
      .from('product_conditional_rules')
      .select('*')
      .eq('coach_id', coachId)
      .eq('is_active', true)
      : { data: [] }

    // Filtrar reglas que aplican a este producto específico
    const productRules = (coachSpecificRules || []).filter(r => 
      !r.target_product_ids || r.target_product_ids.length === 0 || r.target_product_ids.includes(Number(activityId))
    )

    // Obtener las reglas del catálogo que están habilitadas para esta actividad
    const { data: catalogRules } = await supabase
      .from('adaptive_rules_catalog')
      .select('*')
      .in('id', adaptiveRuleIds)

    const clientProfile: ClientProfile = {
      gender: (clientFullProfile?.gender || '').toLowerCase(),
      birth_date: clientFullProfile?.birth_date,
      current_weight: clientFullProfile?.current_weight || 0,
      current_height: clientFullProfile?.current_height || 0,
      intensity_level: clientFullProfile?.intensity_level,
      fitness_goals: clientFullProfile?.onboarding_interests || clientFullProfile?.fitness_goals || [],
      injuries: clientFullProfile?.injuries || [],
      change_goal: clientFullProfile?.change_goal,
      training_modality: clientFullProfile?.training_modality,
      coaching_style: clientFullProfile?.coaching_style,
      consistency_level: clientFullProfile?.consistency_level
    }

    const bmi = (clientProfile.current_weight && clientProfile.current_height)
      ? clientProfile.current_weight / Math.pow(clientProfile.current_height / 100, 2)
      : 24
    const age = clientProfile.birth_date ? calculateAge(clientProfile.birth_date) : 30
    const gender = clientProfile.gender;

    // Preparar el perfil para el Motor Adaptativo v3.0 (Fitness)
    const adaptiveProfile: AdaptiveProfile = {
      trainingLevel: (clientProfile.intensity_level as any) || "Intermediate",
      activityLevel: "Moderately Active",
      ages: [age],
      genders: [gender as any || "male"],
      weight: clientProfile.current_weight,
      bmis: [bmi],
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

    // 4. PRE-PROCESAR TODOS LOS INGREDIENTES PARA EL DICCIONARIO (v4.0)
    const allDishesSet = new Set<number>()
    planificacion.forEach(p => {
      diasSemana.forEach(d => {
        const ej = p[d]
        if (ej && ej !== '{}') {
          const parsed = typeof ej === 'string' ? JSON.parse(ej) : ej
          const arr = Array.isArray(parsed.ejercicios) ? parsed.ejercicios : (Array.isArray(parsed) ? parsed : [])
          arr.forEach((item: any) => {
            const id = typeof item === 'object' ? (item.id || item.ejercicio_id) : item
            if (id) allDishesSet.add(Number(id))
          })
        }
      })
    })

    const allDishIds = Array.from(allDishesSet)
    let ingredientLookup: Record<number, any[]> = {}
    let ingredientsToSync: any[] = []

    if (categoria === 'nutricion' && allDishIds.length > 0) {
      console.log(`🧪 [v4] Pre-syncing ingredients for ${allDishIds.length} dishes...`)
      const { data: dishesDetails } = await supabase
        .from('nutrition_program_details')
        .select('id, ingredientes')
        .in('id', allDishIds)

      dishesDetails?.forEach(d => {
        if (Array.isArray(d.ingredientes)) {
          const parsed = d.ingredientes.map(s => parseIngredientString(s)).filter(x => x !== null)
          ingredientLookup[d.id] = parsed
          parsed.forEach(i => ingredientsToSync.push({ nombre: i.nombre, unidad: i.unidad }))
        }
      })

      // Sync with ingredients_nutricion (Insert uniqueness cleaning)
      if (ingredientsToSync.length > 0) {
        // Quitar duplicados locales antes de intentar batch insert
        const uniqueToSync = Array.from(new Map(ingredientsToSync.map(i => [`${i.nombre.toLowerCase()}_${i.unidad.toLowerCase()}`, i])).values())
        
        const { data: syncedIngs, error: syncErr } = await supabase
          .from('ingredientes_nutricion')
          .upsert(uniqueToSync, { onConflict: 'nombre,unidad', ignoreDuplicates: true })
          .select()

        if (syncErr) {
          console.warn('⚠️ [v4] Error syncing ingredients table:', syncErr.message)
        }

        // Recuperar IDs reales de todos para mapear en el progreso (incluyendo los que ya existían)
        const { data: allSynced } = await supabase
          .from('ingredientes_nutricion')
          .select('id, nombre, unidad')

        if (allSynced) {
          Object.keys(ingredientLookup).forEach(dishId => {
            ingredientLookup[Number(dishId)] = ingredientLookup[Number(dishId)].map(i => {
              const found = allSynced.find(s => 
                s.nombre.toLowerCase() === i.nombre.toLowerCase() && 
                s.unidad.toLowerCase() === i.unidad.toLowerCase()
              )
              return { ...i, ingredient_id: found?.id }
            })
          })
        }
      }
    }


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

      // Categorizar reglas que aplican a Fitness para pasarlas al motor
      const fitnessCoachRules = (productRules || []).filter(r => (r.rule_type || r.criteria?.type) === 'fitness')
      const nutritionCoachRules = (productRules || []).filter(r => (r.rule_type || r.criteria?.type) === 'nutricion')

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

          const ejerciciosArray: any[] = []
          if (ejerciciosParsed && typeof ejerciciosParsed === 'object') {
            if (Array.isArray(ejerciciosParsed.ejercicios)) {
              // Handle [753, 758] vs [{id: 753, orden: 1}]
              ejerciciosParsed.ejercicios.forEach((item: any, idx: number) => {
                if (typeof item === 'number' || typeof item === 'string') {
                  ejerciciosArray.push({ id: Number(item), orden: idx + 1, bloque: 1 })
                } else if (item && typeof item === 'object') {
                  ejerciciosArray.push(item)
                }
              })
            } else if (Array.isArray(ejerciciosParsed)) {
              ejerciciosParsed.forEach((item: any, idx: number) => {
                if (typeof item === 'number' || typeof item === 'string') {
                  ejerciciosArray.push({ id: Number(item), orden: idx + 1, bloque: 1 })
                } else if (item && typeof item === 'object') {
                  ejerciciosArray.push(item)
                }
              })
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
          let ejerciciosData: any[] = []

          if (categoria === 'nutricion') {
            const { data: platosData, error: platesError } = await supabase
              .from('nutrition_program_details')
              .select(`
                id, 
                nombre, 
                receta_id, 
                calorias, 
                proteinas, 
                carbohidratos, 
                grasas, 
                ingredientes, 
                minutos,
                recetas (
                  receta,
                  nombre
                )
              `)
              .in('id', ejercicioIdsArray)
            
            if (platesError) {
              console.error(`❌ Error fetching nutrition plates for day ${nombreDia}:`, platesError)
            }
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

              // 1. Catálogo Global (v3.0)
              const matchingCatalogRules = (catalogRules || []).filter(r => {
                const name = (r.name || '').toLowerCase()
                if (r.category === 'gender' && name.includes(gender)) return true
                if (r.category === 'bmi' && bmi >= 30 && name.includes('obesidad')) return true
                if (r.category === 'age' && age < 18 && name.includes('<18')) return true
                if (r.category === 'age' && age >= 26 && age <= 35 && name.includes('plenitud')) return true
                if (r.category === 'level' && name.includes((clientProfile.intensity_level || '').toLowerCase())) return true
                return false
              })

              // 2. Reglas Específicas del Coach (Condicionales de Omnia)
              const matchingCoachRules = (nutritionCoachRules || []).filter(r => {
                const c = r.criteria
                if (!c) return false
                
                // Filtro por género (normalizado)
                if (c.gender && c.gender !== 'all' && c.gender.toLowerCase() !== gender) return false
                
                // Filtro por edad
                if (c.ageRange && (age < c.ageRange[0] || age > c.ageRange[1])) return false
                
                // Filtro por peso
                const curWeight = clientProfile.current_weight || 70
                if (c.weightRange && (curWeight < c.weightRange[0] || curWeight > c.weightRange[1])) return false

                return true
              })

              // Calcular multiplicadores acumulados (Catalog + Coach)
              let factorKcal = 1.0
              let factorProt = 1.0
              
              matchingCatalogRules.forEach(r => {
                factorKcal *= (r.kcal || 1.0)
                factorProt *= (r.proteina || 1.0)
              })

              matchingCoachRules.forEach(r => {
                // Las reglas del coach suelen usar incrementos porcentuales (Ej: 20 para +20%)
                const portionIncrease = (r.adjustments?.portions || 0) / 100
                factorKcal *= (1.0 + portionIncrease)
                factorProt *= (1.0 + portionIncrease)
              })

              const kcalFinal = Math.round((ej.calorias || 0) * factorKcal)
              const protFinal = Number(((ej.proteinas || 0) * factorProt).toFixed(1))

              // Extraer receta de la relación join si existe (Supabase puede devolverla como objeto o array)
              const joinedReceta = Array.isArray(ej.recetas) ? ej.recetas[0] : ej.recetas
              const recetaText = joinedReceta?.receta || ej.receta || null

              // Estructura de macros ultra-compacta (v4.0)
              const macrosCompactos = {
                rid: ej.receta_id,
                k: kcalFinal,
                p: protFinal,
                c: ej.carbohidratos || 0,
                g: ej.grasas || 0,
                m: ej.minutos || 0
              }


              ejerciciosMap.set(ej.id, {
                detalle_series: JSON.stringify(macrosCompactos),
                duracion_min: ej.minutos || 0,
                kcal: kcalFinal,
                // Mapear ingredientes a { id, cnt } unicamente
                ingredientes: (ingredientLookup[ej.id] || []).map(i => ({ id: i.ingredient_id, cnt: i.cantidad })),
                rid: ej.receta_id
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

              // 3. Aplicar Reglas del Coach a nivel de motor (Fitness)
              const coachFactors = (fitnessCoachRules || []).filter(r => {
                const c = r.criteria
                if (!c) return false
                if (c.gender && c.gender !== 'all' && c.gender.toLowerCase() !== gender) return false
                if (c.ageRange && (age < c.ageRange[0] || age > c.ageRange[1])) return false
                const curWeight = clientProfile.current_weight || 70
                if (c.weightRange && (curWeight < c.weightRange[0] || curWeight > c.weightRange[1])) return false
                return true
              }).map(r => ({
                name: r.name,
                peso: 1.0 + (r.adjustments?.weight || 0) / 100,
                series: 1.0 + (r.adjustments?.series || 0) / 100,
                reps: 1.0 + (r.adjustments?.reps || 0) / 100
              }))

              const adaptiveResult = reconstructPrescription(parsedBase, adaptiveProfile, adaptiveRuleIds)

              // Aplicar factores del coach manualmente sobre el resultado del motor
              let coachAppliedResult = { ...adaptiveResult }
              coachFactors.forEach(f => {
                coachAppliedResult.final.load *= f.peso
                coachAppliedResult.final.series *= f.series
                coachAppliedResult.final.reps *= f.reps
                coachAppliedResult.appliedFactors.push({
                   phase: 3, 
                   category: "Coach", 
                   name: f.name, 
                   peso: f.peso, 
                   series: f.series, 
                   reps: f.reps, 
                   isActive: true 
                })
              })

              // Redondeos finales tras aplicar reglas del coach
              coachAppliedResult.final.load = Math.round(coachAppliedResult.final.load / 2.5) * 2.5
              coachAppliedResult.final.series = Math.max(1, Math.round(coachAppliedResult.final.series))
              coachAppliedResult.final.reps = Math.max(1, Math.round(coachAppliedResult.final.reps))

              const finalDetalle = {
                series: coachAppliedResult.final.series,
                repeticiones: coachAppliedResult.final.reps,
                peso: coachAppliedResult.final.load,
                ...(typeof ej.detalle_series === 'object' ? ej.detalle_series : {})
              }

              ejerciciosMap.set(ej.id, {
                detalle_series: JSON.stringify(finalDetalle),
                duracion_min: ej.duracion_min || 0,
                kcal: ej.calorias || 0,
                series: coachAppliedResult.final.series,
                reps: coachAppliedResult.final.reps,
                peso: coachAppliedResult.final.load,
                descanso: ej.descanso || 60,
                applied_factors: coachAppliedResult.appliedFactors
              })
            }
          });

          // Usar ejerciciosArray que ya fue homogeneizado arriba
          (ejerciciosArray || []).forEach((ej: any) => {
            const ejercicioId = ej.id;
            if (ejercicioId) {
              const orden = ej.orden || ordenGlobal
              const bloqueNum = ej.bloque || 1
              const keyUnico = categoria === 'nutricion' ? ejercicioId.toString() : `${ejercicioId}_${bloqueNum}_${orden}`

              ejerciciosPendientes[keyUnico] = ejercicioId

              const ejercicioData = ejerciciosMap.get(ejercicioId) || { detalle_series: '', duracion_min: 0, calorias: 0 }

              if (categoria === 'fitness') {
                detallesSeries[keyUnico] = {
                  id: ejercicioId,
                  detalle_series: ejercicioData.detalle_series || ''
                }
              }

              if (typeof ej === 'object' && !ej.orden) ordenGlobal++
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
              const ejercicioData = ejerciciosMap.get(ejercicioId) || { duracion_min: 0, kcal: 0, peso: 0, series: 0, reps: 0, descanso: 60 }
              minutosJson[key] = ejercicioData.duracion_min || 0
              caloriasJson[key] = ejercicioData.kcal || 0
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
              ejercicios_completados: categoria === 'nutricion' ? { ejercicios: [] } : {},
              ejercicios_pendientes: categoria === 'nutricion' ? { ejercicios: Object.values(ejerciciosPendientes) } : ejerciciosPendientes
            }

            if (categoria === 'nutricion') {
              const macrosJson: any = {}
              const ingredientesJson: any = {}
              const recetasJson: any = {}
              
              const platosDelDiaIds = Object.values(ejerciciosPendientes) as number[]
              
              platosDelDiaIds.forEach(ejId => {
                const ejData = ejerciciosMap.get(ejId)
                if (ejData) {
                  if (ejData.detalle_series) {
                    try { 
                      macrosJson[ejId.toString()] = JSON.parse(ejData.detalle_series) 
                    } catch (e) { 
                      macrosJson[ejId.toString()] = {} 
                    }
                    ingredientesJson[ejId.toString()] = ejData.ingredientes || []
                    recetasJson[ejId.toString()] = ejData.rid || null // Solo el ID!
                  }
                }
              })

              
              registro.macros = macrosJson
              registro.ingredientes = ingredientesJson
              registro.recetas = recetasJson
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
      console.warn('⚠️ [initialize-progress] No hay registros para crear');
      return NextResponse.json({ success: true, message: 'No recordings created', recordsCreated: 0 })
    }

    const targetTable = categoria === 'nutricion' ? 'progreso_cliente_nutricion' : 'progreso_cliente'
    
    console.log(`🚀 [initialize-progress] Creando ${registrosACrear.length} registros en ${targetTable}`);
    
    // Usamos insert simple en lote para eficiencia. 
    // Los problemas de ON CONFLICT se resolvieron corrigiendo los constraints en la BD.
    const { data: created, error: insertError } = await supabase
      .from(targetTable)
      .insert(registrosACrear)
      .select()

    if (insertError) {
      console.error(`❌ [initialize-progress] Error inserting into ${targetTable}:`, insertError)
      return NextResponse.json({ error: `Error at ${targetTable}`, details: insertError.message }, { status: 500 })
    }

    // 7. Actualizar el enrollment con la nueva fecha de inicio
    const { error: enrollmentUpdateError } = await supabase
      .from('activity_enrollments')
      .update({ 
        start_date: startDate,
        status: 'activa' 
      })
      .eq('id', enrollmentId)

    if (enrollmentUpdateError) {
      console.warn('⚠️ [initialize-progress] Falló actualizar start_date en enrollment:', enrollmentUpdateError.message)
    }

    return NextResponse.json({
      success: true,
      message: `${created?.length || 0} days initialized`,
      recordsCreated: created?.length || 0,
      startDate
    })

  } catch (error: any) {
    console.error('❌ Error in initialize-progress:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
