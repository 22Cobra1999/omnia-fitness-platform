import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const splitSemicolonList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((v) => String(v ?? '').trim())
          .filter((v) => v.length > 0)
      )
    )
  }

  if (typeof value === 'string') {
    return Array.from(
      new Set(
        value
          .split(';')
          .map((v) => v.trim())
          .filter((v) => v.length > 0)
      )
    )
  }

  return []
}

const joinSemicolonList = (value: unknown): string => {
  return splitSemicolonList(value).join(';')
}

// Función para verificar y pausar productos automáticamente si exceden el límite
async function checkAndPauseProductsIfNeeded(coachId: string) {
  try {
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Obtener plan actual del coach
    const { data: plan } = await supabaseService
      .from('planes_uso_coach')
      .select('plan_type')
      .eq('coach_id', coachId)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Límites de productos activos por plan (usar función getPlanLimit)
    const { getPlanLimit } = await import('@/lib/utils/plan-limits')
    const planType = (plan?.plan_type || 'free') as 'free' | 'basico' | 'black' | 'premium'
    const limit = getPlanLimit(planType, 'activeProducts')

    // Contar productos activos (no pausados)
    // Ordenar por created_at ASCENDENTE para mantener activos los más antiguos y pausar los más recientes
    const { data: activeProducts, error: countError } = await supabaseService
      .from('activities')
      .select('id, created_at')
      .eq('coach_id', coachId)
      .eq('is_paused', false)
      .neq('type', 'consultation')
      .order('created_at', { ascending: true }) // ASCENDENTE: los más antiguos primero

    if (countError) {
      console.error('Error contando productos activos:', countError)
      return
    }

    const activeCount = activeProducts?.length || 0

    // Si excede el límite, pausar los más recientes (los últimos en el array ordenado ascendente)
    if (activeCount > limit) {
      // Mantener activos los primeros 'limit' productos (más antiguos)
      // Pausar los productos desde el índice 'limit' en adelante (más recientes)
      const productsToPause = activeProducts.slice(limit)
      const productIds = productsToPause.map(p => p.id)

      console.log(`⚠️ Plan ${planType}: ${activeCount} productos activos, límite: ${limit}. Pausando ${productIds.length} productos más recientes:`, productIds)

      if (productIds.length > 0) {
        const { error: pauseError } = await supabaseService
          .from('activities')
          .update({
            is_paused: true,
            updated_at: new Date().toISOString()
          })
          .in('id', productIds)

        if (pauseError) {
          console.error('Error pausando productos automáticamente:', pauseError)
        } else {
          console.log(`✅ Pausados automáticamente ${productIds.length} productos que excedían el límite del plan ${planType}`)
        }
      }
    }
  } catch (error) {
    console.error('Error en checkAndPauseProductsIfNeeded:', error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    // Verificar autenticación
    let user = null as any
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (!authError && userData?.user) {
      user = userData.user
    } else {
      // Fallback: en algunos entornos el access token no se resuelve bien con getUser(),
      // pero la sesión sí está disponible.
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData?.session?.user) {
        user = sessionData.session.user
      }
    }
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener productos básicos (incluyendo is_paused)
    const { data: products, error: productsError } = await supabase
      .from('activities')
      .select('*')
      .eq('coach_id', user.id)
      .neq('type', 'consultation')
      .order('created_at', { ascending: false })

    if (productsError) {
      return NextResponse.json({ error: productsError.message }, { status: 500 })
    }

    // Obtener plan una sola vez para todos los productos
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: plan } = await supabaseService
      .from('planes_uso_coach')
      .select('plan_type')
      .eq('coach_id', user.id)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const planType = (plan?.plan_type || 'free') as 'free' | 'basico' | 'black' | 'premium'
    const { getPlanLimit } = await import('@/lib/utils/plan-limits')
    const { adjustProductCapacityIfNeeded, adjustProductActivitiesIfNeeded, updateFinishedWorkshops } = await import('@/lib/utils/auto-adjust-limits')
    const stockLimit = getPlanLimit(planType, 'stockPerProduct')

    // IMPORTANTE: Actualizar talleres finalizados y pausar productos excedentes ANTES de procesar
    // Esto asegura que los productos se muestren con el estado correcto
    await updateFinishedWorkshops(user.id)
    await checkAndPauseProductsIfNeeded(user.id)

    // Recargar productos después de pausar para obtener el estado actualizado
    const { data: updatedProducts, error: updatedProductsError } = await supabase
      .from('activities')
      .select('*')
      .eq('coach_id', user.id)
      .neq('type', 'consultation')
      .order('created_at', { ascending: false })

    // Usar productos actualizados si están disponibles, sino usar los originales
    const productsToProcess = updatedProducts || products

    // Obtener media y estadísticas para cada producto
    const productsWithMedia = await Promise.all(
      (productsToProcess || []).map(async (product: any) => {
        // Ajustar capacity automáticamente si excede el límite
        // Verificar siempre, incluso si capacity es null o 0
        if (product.capacity !== null && product.capacity !== undefined) {
          const capacityNumber = typeof product.capacity === 'string' ? parseFloat(product.capacity) : product.capacity

          if (capacityNumber > stockLimit) {
            const adjustedCapacity = await adjustProductCapacityIfNeeded(
              user.id,
              product.id,
              capacityNumber
            )
            if (adjustedCapacity !== capacityNumber && adjustedCapacity !== null) {
              product.capacity = adjustedCapacity
            }
          }
        }

        // Ajustar actividades (platos/ejercicios) automáticamente si exceden el límite
        const adjustResult = await adjustProductActivitiesIfNeeded(
          user.id,
          product.id,
          product.categoria || 'fitness'
        )

        // Silenciar logs detallados de autoajuste

        // Verificar y pausar producto si excede límites (actividades o semanas)
        // Solo si el producto no está ya pausado manualmente
        let pauseReasons: string[] = []
        let pauseDetails: any = {}
        if (!product.is_paused) {
          const { checkAndPauseProductIfExceedsLimits } = await import('@/lib/utils/auto-adjust-limits')
          const pauseResult = await checkAndPauseProductIfExceedsLimits(
            user.id,
            product.id,
            product.categoria || 'fitness'
          )
          pauseReasons = pauseResult.reasons || []
          pauseDetails = pauseResult.details || {}
          // Recargar el producto para obtener el estado actualizado
          const { data: updatedProduct } = await supabase
            .from('activities')
            .select('is_paused')
            .eq('id', product.id)
            .single()
          if (updatedProduct) {
            product.is_paused = updatedProduct.is_paused
          }
        } else {
          // Si ya está pausado, verificar por qué (puede ser por exceso de límites)
          // Obtener períodos para calcular semanas
          const { data: periodosPaused } = await supabase
            .from('periodos')
            .select('cantidad_periodos')
            .eq('actividad_id', product.id)
            .maybeSingle()

          // Verificar sin pausar (solo para obtener los detalles)
          const { data: planificacionCheck } = await supabase
            .from('planificacion_ejercicios')
            .select('numero_semana')
            .eq('actividad_id', product.id)

          const baseWeeksCheck = new Set(planificacionCheck?.map((p: any) => p.numero_semana) || []).size
          const periodsCheck = periodosPaused?.cantidad_periodos || 1
          const weeksCountCheck = baseWeeksCheck * periodsCheck

          const isNutritionCheck = (product.categoria || 'fitness') === 'nutricion' || (product.categoria || 'fitness') === 'nutrition'
          const tableNameCheck = isNutritionCheck ? 'nutrition_program_details' : 'ejercicios_detalles'

          let activitiesCountCheck = 0
          if (tableNameCheck === 'ejercicios_detalles') {
            const { count } = await supabase
              .from('ejercicios_detalles')
              .select('*', { count: 'exact', head: true })
              .contains('activity_id', { [product.id]: {} })
            activitiesCountCheck = count || 0
          } else {
            const { count } = await supabase
              .from(tableNameCheck)
              .select('*', { count: 'exact', head: true })
              .contains('activity_id', { [product.id.toString()]: {} })
            activitiesCountCheck = count || 0
          }

          const activitiesLimitCheck = getPlanLimit(planType, 'activitiesPerProduct')
          const weeksLimitCheck = getPlanLimit(planType, 'weeksPerProduct')

          if (activitiesCountCheck > activitiesLimitCheck) {
            pauseReasons.push(`Exceso de ${isNutritionCheck ? 'platos' : 'ejercicios'}: ${activitiesCountCheck} (límite: ${activitiesLimitCheck})`)
          }
          if (weeksCountCheck > weeksLimitCheck) {
            pauseReasons.push(`Exceso de semanas: ${weeksCountCheck} (límite: ${weeksLimitCheck})`)
          }

          pauseDetails = {
            activitiesCount: activitiesCountCheck,
            activitiesLimit: activitiesLimitCheck,
            weeksCount: weeksCountCheck,
            weeksLimit: weeksLimitCheck
          }
        }
        const { data: media } = await supabase
          .from('activity_media')
          .select('id, image_url, video_url, pdf_url, bunny_video_id, bunny_library_id, video_thumbnail_url')
          .eq('activity_id', product.id)
          .single()

        // Obtener planificación y períodos una sola vez para todos los cálculos
        const { data: planificacion } = await supabase
          .from('planificacion_ejercicios')
          .select('*')
          .eq('actividad_id', product.id)

        const { data: periodos } = await supabase
          .from('periodos')
          .select('cantidad_periodos')
          .eq('actividad_id', product.id)
          .maybeSingle()

        // Calcular estadísticas dinámicamente
        let exercisesCount = 0
        let totalSessions = 0
        let cantidadTemas: number | undefined = undefined
        let cantidadDias: number | undefined = undefined

        // Verificar si es taller - calcular cantidadTemas y cantidadDias
        if (product.type === 'workshop') {
          try {
            const { data: tallerDetallesStats } = await supabase
              .from('taller_detalles')
              .select('nombre, originales')
              .eq('actividad_id', product.id)
              .eq('activo', true)

            if (tallerDetallesStats && tallerDetallesStats.length > 0) {
              // Calcular cantidad de temas únicos
              const temasUnicos = new Set(tallerDetallesStats.map((t: any) => t.nombre).filter(Boolean))
              cantidadTemas = temasUnicos.size

              // Calcular duración desde la primera fecha hasta la última fecha
              const allDates: string[] = []
              tallerDetallesStats.forEach((tema: any) => {
                try {
                  let originales = tema.originales
                  if (typeof originales === 'string') {
                    originales = JSON.parse(originales)
                  }
                  if (originales?.fechas_horarios && Array.isArray(originales.fechas_horarios)) {
                    originales.fechas_horarios.forEach((fecha: any) => {
                      if (fecha?.fecha) {
                        allDates.push(fecha.fecha)
                      }
                    })
                  }
                } catch (e) {
                  console.error('Error procesando fechas del tema:', e)
                }
              })

              if (allDates.length > 0) {
                const fechas = allDates
                  .map((fecha: string) => new Date(fecha))
                  .filter((fecha: Date) => !isNaN(fecha.getTime()))
                  .sort((a: Date, b: Date) => a.getTime() - b.getTime())

                if (fechas.length > 0) {
                  const primeraFecha = fechas[0]
                  const ultimaFecha = fechas[fechas.length - 1]
                  const diferenciaMs = ultimaFecha.getTime() - primeraFecha.getTime()
                  cantidadDias = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24)) + 1 // +1 para incluir ambos días
                } else {
                  cantidadDias = cantidadTemas // Fallback: cantidad de temas
                }
              } else {
                cantidadDias = cantidadTemas // Fallback: cantidad de temas
              }

              exercisesCount = cantidadTemas
              totalSessions = cantidadDias

              console.log(`📊 PRODUCTOS: Taller ${product.id} - Temas: ${cantidadTemas}, Días: ${cantidadDias}`)
            }
          } catch (error) {
            console.error(`❌ Error calculando estadísticas del taller ${product.id}:`, error)
          }
        }

        // Verificar si es nutrición - usar categoria, no type
        const isNutrition = product.categoria === 'nutricion' || product.categoria === 'nutrition'

        if (isNutrition) {
          // Para nutrición: obtener platos de nutrition_program_details
          // Intentar múltiples estrategias para encontrar los platos
          let platos: any[] = []

          // Estrategia 0: match directo por activity_id (legacy) como número o string
          try {
            const { data: platosByActivityId } = await supabase
              .from('nutrition_program_details')
              .select('id')
              .eq('activity_id', product.id)

            if (platosByActivityId && platosByActivityId.length > 0) {
              platos = platosByActivityId
            }
          } catch (e) {
            // ignore
          }

          if (platos.length === 0) {
            try {
              const { data: platosByActivityIdStr } = await supabase
                .from('nutrition_program_details')
                .select('id')
                .eq('activity_id', product.id.toString())

              if (platosByActivityIdStr && platosByActivityIdStr.length > 0) {
                platos = platosByActivityIdStr
              }
            } catch (e) {
              // ignore
            }
          }

          // Estrategia 0b: activity_id_new JSONB con .contains()
          if (platos.length === 0) {
            try {
              const activityKeyObjNew = { [product.id.toString()]: { activo: true } }
              const { data: platosJsonbNew } = await supabase
                .from('nutrition_program_details')
                .select('id')
                .contains('activity_id_new', activityKeyObjNew)

              if (platosJsonbNew && platosJsonbNew.length > 0) {
                platos = platosJsonbNew
              }
            } catch (e) {
              // ignore
            }
          }

          // Estrategia 1: JSONB con .contains()
          try {
            const activityKeyObj = { [product.id.toString()]: {} }
            const { data: platosJsonb } = await supabase
              .from('nutrition_program_details')
              .select('id')
              .contains('activity_id', activityKeyObj)

            if (platosJsonb && platosJsonb.length > 0) {
              platos = platosJsonb
            }
          } catch (e) {
            // Continuar con otras estrategias
          }

          // Estrategia 2: Si no hay resultados, buscar todos y filtrar manualmente
          if (platos.length === 0) {
            try {
              const { data: allPlatos } = await supabase
                .from('nutrition_program_details')
                .select('id, activity_id, activity_id_new')
                .eq('coach_id', user.id)

              if (allPlatos) {
                const filteredPlatos = allPlatos.filter((plato: any) => {
                  // Verificar si activity_id es JSONB y contiene el ID
                  if (plato.activity_id && typeof plato.activity_id === 'object') {
                    return product.id.toString() in plato.activity_id
                  }
                  // Verificar si es integer (formato legacy)
                  if (typeof plato.activity_id === 'number') {
                    return plato.activity_id === product.id
                  }
                  // Verificar si es string (formato legacy)
                  if (typeof plato.activity_id === 'string') {
                    return plato.activity_id === product.id.toString()
                  }

                  // Verificar JSONB nuevo
                  if (plato.activity_id_new && typeof plato.activity_id_new === 'object') {
                    return product.id.toString() in plato.activity_id_new
                  }
                  return false
                })
                platos = filteredPlatos
              }
            } catch (e) {
              // Si falla, continuar con 0
            }
          }

          exercisesCount = platos.length

          if (planificacion && planificacion.length > 0) {
            const diasConEjercicios = new Set()
            planificacion.forEach((semana: any) => {
              ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].forEach(dia => {
                if (semana[dia] && typeof semana[dia] === 'object' && semana[dia].ejercicios && Array.isArray(semana[dia].ejercicios) && semana[dia].ejercicios.length > 0) {
                  diasConEjercicios.add(dia)
                }
              })
            })

            const diasUnicos = diasConEjercicios.size
            const periodosUnicos = periodos?.cantidad_periodos || 1
            totalSessions = diasUnicos * periodosUnicos

            console.log(`🥗 PRODUCTOS: Actividad ${product.id} (Nutrición) - Platos: ${exercisesCount}, Días: ${diasUnicos}, Períodos: ${periodosUnicos}, Sesiones: ${totalSessions}`)
          }
        } else if (product.type === 'program' && product.categoria === 'fitness') {
          // Obtener ejercicios
          const { data: ejercicios } = await supabase
            .from('ejercicios_detalles')
            .select('id')
            .contains('activity_id', { [product.id]: {} })

          exercisesCount = ejercicios?.length || 0

          if (planificacion && planificacion.length > 0) {
            // Calcular días únicos con ejercicios ACTIVOS
            const diasConEjercicios = new Set()
            planificacion.forEach((semana: any) => {
              ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].forEach(dia => {
                if (semana[dia] && typeof semana[dia] === 'object' && semana[dia].ejercicios && Array.isArray(semana[dia].ejercicios)) {
                  // Filtrar solo ejercicios activos (activo !== false)
                  const activeExercises = semana[dia].ejercicios.filter((exercise: any) => {
                    return exercise.activo !== false
                  })

                  // Solo contar el día si tiene al menos un ejercicio activo
                  if (activeExercises.length > 0) {
                    diasConEjercicios.add(dia)
                  }
                }
              })
            })

            const diasUnicos = diasConEjercicios.size
            const periodosUnicos = periodos?.cantidad_periodos || 1
            totalSessions = diasUnicos * periodosUnicos

            console.log(`📊 PRODUCTOS: Actividad ${product.id} - Días: ${diasUnicos}, Períodos: ${periodosUnicos}, Sesiones: ${totalSessions}`)
          }
        }

        // Los objetivos están guardados en workshop_type; puede venir como:
        // 1) string JSON: '{"objetivos":"A;B"}' o '["A","B"]'
        // 2) objeto: { objetivos: 'A;B' } o ['A','B']
        // 3) string plano: 'general' (sin objetivos)
        let objetivos = []
        if (product.workshop_type) {
          try {
            let parsed: any = product.workshop_type
            if (typeof product.workshop_type === 'string') {
              const ws = product.workshop_type.trim()
              if (ws.startsWith('{') || ws.startsWith('[')) {
                parsed = JSON.parse(ws)
              } else {
                // String plano como 'general' -> sin objetivos
                parsed = ws
              }
            }

            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.objetivos) {
              objetivos = String(parsed.objetivos)
                .split(';')
                .map((obj: string) => obj.trim())
                .filter((obj: string) => obj.length > 0)
            } else if (Array.isArray(parsed)) {
              objetivos = parsed
            } else {
              objetivos = []
            }
          } catch (e) {
            console.warn('Error parseando objetivos:', e)
            objetivos = []
          }
        }

        // Para talleres: obtener el estado 'activo' desde taller_detalles
        // Todos los temas de un taller deben tener el mismo valor de 'activo'
        let tallerActivo: boolean | null = null
        if (product.type === 'workshop') {
          try {
            // Obtener 'activo' y 'originales' desde la BD
            const { data: tallerDetalles, error: tallerError } = await supabase
              .from('taller_detalles')
              .select('activo, originales')
              .eq('actividad_id', product.id)
              .limit(1)

            if (tallerError) {
              // Si hay error (probablemente la columna no existe), usar lógica de fechas
              console.warn(`⚠️ Error obteniendo 'activo' para taller ${product.id}:`, tallerError.message)

              // Obtener fechas para calcular si está activo
              const { data: tallerDetallesFechas } = await supabase
                .from('taller_detalles')
                .select('originales')
                .eq('actividad_id', product.id)

              if (tallerDetallesFechas && tallerDetallesFechas.length > 0) {
                // Extraer todas las fechas
                const allDates: string[] = []
                tallerDetallesFechas.forEach((tema: any) => {
                  try {
                    let originales = tema.originales
                    if (typeof originales === 'string') {
                      originales = JSON.parse(originales)
                    }
                    if (originales?.fechas_horarios && Array.isArray(originales.fechas_horarios)) {
                      originales.fechas_horarios.forEach((fecha: any) => {
                        if (fecha?.fecha) {
                          allDates.push(fecha.fecha)
                        }
                      })
                    }
                  } catch (e) {
                    console.error('Error procesando fechas del tema:', e)
                  }
                })

                // Verificar si hay fechas futuras
                if (allDates.length > 0) {
                  const now = new Date()
                  now.setHours(0, 0, 0, 0)
                  const lastDate = new Date(Math.max(...allDates.map((date: string) => new Date(date).getTime())))
                  lastDate.setHours(0, 0, 0, 0)
                  tallerActivo = lastDate >= now
                  console.log(`📅 Taller ${product.id}: Última fecha = ${lastDate.toISOString().split('T')[0]}, Hoy = ${now.toISOString().split('T')[0]}, Activo = ${tallerActivo}`)
                } else {
                  tallerActivo = false // Sin fechas = inactivo
                  console.log(`📅 Taller ${product.id}: Sin fechas, inactivo`)
                }
              } else {
                tallerActivo = true // Sin temas = activo por defecto
                console.log(`ℹ️ Taller ${product.id}: sin temas, activo por defecto`)
              }
            } else if (tallerDetalles && tallerDetalles.length > 0) {
              // Verificar si la columna 'activo' existe en los resultados
              const primerTema = tallerDetalles[0]
              const tieneColumnaActivo = 'activo' in primerTema

              console.log(`🔍 Taller ${product.id}: Verificando columna 'activo' - tieneColumnaActivo: ${tieneColumnaActivo}, valor: ${primerTema.activo}, tipo: ${typeof primerTema.activo}`)

              if (tieneColumnaActivo) {
                // Si la columna existe, usar su valor (puede ser true, false, 'true', 'false', etc.)
                // Convertir a boolean si es necesario
                let valorActivo = primerTema.activo
                if (typeof valorActivo === 'string') {
                  valorActivo = valorActivo === 'true' || valorActivo === '1'
                }
                tallerActivo = valorActivo === true
                console.log(`✅ Taller ${product.id}: taller_activo = ${tallerActivo} (desde BD, columna activo = ${primerTema.activo}, convertido a ${tallerActivo})`)
              } else {
                // Si la columna no existe, calcular basándose en fechas
                console.log(`ℹ️ Columna 'activo' no existe para taller ${product.id}, usando lógica de fechas`)

                // Extraer todas las fechas
                const allDates: string[] = []
                tallerDetalles.forEach((tema: any) => {
                  try {
                    let originales = tema.originales
                    if (typeof originales === 'string') {
                      originales = JSON.parse(originales)
                    }
                    if (originales?.fechas_horarios && Array.isArray(originales.fechas_horarios)) {
                      originales.fechas_horarios.forEach((fecha: any) => {
                        if (fecha?.fecha) {
                          allDates.push(fecha.fecha)
                        }
                      })
                    }
                  } catch (e) {
                    console.error('Error procesando fechas del tema:', e)
                  }
                })

                // Verificar si hay fechas futuras
                if (allDates.length > 0) {
                  const now = new Date()
                  now.setHours(0, 0, 0, 0)
                  const lastDate = new Date(Math.max(...allDates.map((date: string) => new Date(date).getTime())))
                  lastDate.setHours(0, 0, 0, 0)
                  tallerActivo = lastDate >= now
                  console.log(`📅 Taller ${product.id}: Última fecha = ${lastDate.toISOString().split('T')[0]}, Hoy = ${now.toISOString().split('T')[0]}, Activo = ${tallerActivo}`)
                } else {
                  tallerActivo = false // Sin fechas = inactivo
                  console.log(`📅 Taller ${product.id}: Sin fechas, inactivo`)
                }
              }
            } else {
              // Si no hay temas, considerar como activo por defecto
              tallerActivo = true
              console.log(`ℹ️ Taller ${product.id}: sin temas, activo por defecto`)
            }
          } catch (error) {
            console.error(`❌ Error procesando taller ${product.id}:`, error)
            tallerActivo = true // Por defecto activo si hay error
          }
        }

        const finalProduct = {
          id: product.id,
          title: (product as any).title || (product as any).name || 'Sin título',
          name: (product as any).title || (product as any).name || 'Sin título', // Alias para compatibilidad
          description: product.description || 'Sin descripción',
          price: product.price || 0,
          type: product.type || 'activity',
          difficulty: product.difficulty || 'beginner',
          is_public: product.is_public || false,
          capacity: product.capacity !== null && product.capacity !== undefined ? product.capacity : null,
          modality: product.modality || null,
          included_meet_credits: typeof (product as any).included_meet_credits === 'number' ? (product as any).included_meet_credits : 0,
          created_at: product.created_at,
          updated_at: product.updated_at,
          // Valores seguros para campos que pueden no existir
          program_rating: product.program_rating || null,
          total_program_reviews: product.total_program_reviews || null,
          coach_name: product.coach_name || null,
          coach_avatar_url: product.coach_avatar_url || null,
          coach_whatsapp: product.coach_whatsapp || null,
          // Media real
          media: media,
          image_url: media?.image_url || null,
          video_url: media?.video_url || null,
          pdf_url: media?.pdf_url || null,
          // Para compatibilidad con el modal
          activity_media: media ? [media] : [],
          // Objetivos desde workshop_type
          objetivos: objetivos,
          restricciones: splitSemicolonList((product as any).restricciones),
          // Categoría para determinar si es nutrición
          categoria: product.categoria,
          // Ubicación para actividades presenciales
          location_name: (product as any).location_name || null,
          location_url: (product as any).location_url || null,
          // Modo de taller (individual/grupal) - solo para talleres
          workshop_mode: product.type === 'workshop' ? ((product as any).workshop_mode || 'grupal') : undefined,
          // Cantidad de participantes por clase (solo para talleres grupales)
          participants_per_class: product.type === 'workshop' && ((product as any).workshop_mode === 'grupal') ? ((product as any).participants_per_class || null) : null,
          // Estadísticas calculadas dinámicamente (con fallback a denormalizadas)
          exercisesCount: product.items_unicos ?? exercisesCount,
          totalSessions: product.sesiones_dias_totales ?? totalSessions,
          // Para talleres: cantidad de temas y días
          cantidadTemas: cantidadTemas,
          cantidadDias: cantidadDias,
          // Estado de pausa
          is_paused: product.is_paused || false,
          // Para talleres: estado 'activo' desde taller_detalles (indica si está disponible para nuevas ventas)
          taller_activo: product.type === 'workshop'
            ? (tallerActivo !== null ? tallerActivo : undefined)
            : undefined,
          // Obtener semanas para validar límites (semanas base * períodos)
          weeks: product.semanas_totales ?? (() => {
            // Obtener semanas base desde planificacion_ejercicios
            const planificacionWeeks = planificacion ? new Set(planificacion.map((p: any) => p.numero_semana || p.semana)).size : 0
            const periods = periodos?.cantidad_periodos || 1
            return planificacionWeeks * periods
          })(),
          // Razones de pausa (si está pausado por exceso de límites)
          pause_reasons: pauseReasons,
          pause_details: pauseDetails,
          // ✅ NUEVO: Estadísticas denormalizadas (prioridad)
          semanas_totales: product.semanas_totales,
          sesiones_dias_totales: product.sesiones_dias_totales,
          items_totales: product.items_totales,
          items_unicos: product.items_unicos,
          periodos_configurados: product.periodos_configurados
        }

        // Debug: Log para verificar que taller_activo se está devolviendo correctamente
        if (product.type === 'workshop') {
          console.log(`📦 Producto ${finalProduct.id} (${finalProduct.title}): taller_activo = ${finalProduct.taller_activo}, tipo = ${typeof finalProduct.taller_activo}`)
        }

        return finalProduct
      })
    )

    return NextResponse.json({
      success: true,
      products: productsWithMedia
    })

  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}


export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    // Verificar autenticación con fallback
    let user = null as any
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (!authError && userData?.user) {
      user = userData.user
    } else {
      // Fallback: en algunos entornos el access token no se resuelve bien con getUser(),
      // pero la sesión sí está disponible.
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData?.session?.user) {
        user = sessionData.session.user
      }
    }
    if (!user) {
      console.error('❌ POST /api/products: No autorizado - No se pudo obtener el usuario', { authError })
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()

    // Validar límite de stock según plan
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: plan } = await supabaseService
      .from('planes_uso_coach')
      .select('plan_type')
      .eq('coach_id', user.id)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const planType = (plan?.plan_type || 'free') as 'free' | 'basico' | 'black' | 'premium'
    const { getPlanLimit } = await import('@/lib/utils/plan-limits')
    const stockLimit = getPlanLimit(planType, 'stockPerProduct')
    const totalClientsLimit = getPlanLimit(planType, 'totalClients')

    const { data: existingActivities, error: existingActivitiesError } = await supabaseService
      .from('activities')
      .select('id, capacity, type')
      .eq('coach_id', user.id)

    if (existingActivitiesError) {
      console.warn('⚠️ Error obteniendo actividades existentes para validar cupos totales (se continúa sin validar totalClients):', existingActivitiesError)
    }

    const normalizeCapacity = (value: any) => {
      if (value === null || value === undefined) return 0
      if (typeof value === 'number') return isFinite(value) ? value : 0
      if (typeof value === 'string') {
        const parsed = parseFloat(value)
        return isNaN(parsed) ? 0 : parsed
      }
      return 0
    }

    // Ajustar capacity (stock) automáticamente si excede los límites
    let adjustedCapacity = body.capacity ?? null

    if (adjustedCapacity !== null && adjustedCapacity !== undefined) {
      const numericCapacity = normalizeCapacity(adjustedCapacity)
      let targetCapacity = numericCapacity

      if (numericCapacity > stockLimit) {
        console.log(`⚠️ Stock excede límite individual del plan ${planType}: ${numericCapacity} > ${stockLimit}. Ajustando a ${stockLimit}`)
        targetCapacity = stockLimit
      }

      const remainingCapacity = Math.max(totalClientsLimit - (existingActivitiesError ? 0 : existingActivities.reduce((sum, activity) => sum + normalizeCapacity(activity.capacity), 0)), 0)
      if (targetCapacity > remainingCapacity) {
        console.log(
          `⚠️ Stock excede límite total de clientes (${totalClientsLimit}). Cupos usados actualmente: ${existingActivitiesError ? 0 : existingActivities.reduce((sum, activity) => sum + normalizeCapacity(activity.capacity), 0)}. Ajustando a ${remainingCapacity}`
        )
        targetCapacity = remainingCapacity
      }

      adjustedCapacity = Math.max(Math.floor(targetCapacity), 0)
    }

    // Crear producto en activities (la tabla real)
    const { data: newActivity, error: insertError } = await supabaseService
      .from('activities')
      .insert([
        {
          title: body.name, // Usar title en lugar de name
          description: body.description,
          price: body.price,
          // ✅ type = tipo de producto (workshop/program/document) - solo estos 3 valores
          type: body.modality === 'workshop' ? 'workshop' : (body.modality === 'document' ? 'document' : 'program'),
          // ✅ modality = modalidad (online/presencial/híbrido)
          modality: body.type || 'online',
          included_meet_credits: body.modality === 'workshop' ? 0 : (typeof body.included_meet_credits === 'number' ? body.included_meet_credits : parseInt(String(body.included_meet_credits ?? '0'), 10) || 0),
          // ✅ categoria = fitness o nutricion (no confundir con type)
          categoria: body.categoria || 'fitness',
          difficulty: body.level, // Usar difficulty en lugar de level
          is_public: body.is_public,
          capacity: adjustedCapacity,
          restricciones: joinSemicolonList(body.restricciones),
          // stockQuantity no existe en la tabla activities
          coach_id: user.id,
          // ✅ GUARDAR OBJETIVOS EN workshop_type como JSON
          workshop_type: splitSemicolonList(body.objetivos).length > 0
            ? JSON.stringify({ objetivos: joinSemicolonList(body.objetivos) })
            : (body.workshop_type || (body.modality === 'workshop' ? 'general' : null)),
          // ✅ Campos de ubicación para modalidad presencial
          location_name: body.location_name || null,
          location_url: body.location_url || null,
          // ✅ NUEVO: Días para acceder al producto
          dias_acceso: body.dias_acceso || 30,
          // ✅ NUEVO: Modo de taller (individual/grupal)
          workshop_mode: body.workshop_mode || 'grupal',
          // ✅ NUEVO: Cantidad de participantes por clase (solo para talleres grupales)
          participants_per_class: body.participants_per_class || null,
          // ✅ NUEVO: Estadísticas denormalizadas
          semanas_totales: body.semanas_totales || 0,
          sesiones_dias_totales: body.sesiones_dias_totales || 0,
          items_totales: body.items_totales || 0,
          items_unicos: body.items_unicos || 0,
          periodos_configurados: body.periodos_configurados || 1
        }
      ])
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Verificar y pausar productos automáticamente si exceden el límite del plan
    await checkAndPauseProductsIfNeeded(user.id)

    if (body.modality === 'workshop' && body.workshopSchedule && Array.isArray(body.workshopSchedule)) {

      // Agrupar sesiones por tema
      const topicGroups = new Map()

      for (const session of body.workshopSchedule) {
        const topicKey = session.title || 'Sin título'
        if (!topicGroups.has(topicKey)) {
          topicGroups.set(topicKey, {
            nombre: session.title,
            descripcion: session.description || '',
            originales: [],
            secundarios: []
          })
        }

        const topic = topicGroups.get(topicKey)
        const horarioItem = {
          fecha: session.date,
          hora_inicio: session.startTime,
          hora_fin: session.endTime,
          cupo: 20 // Cupo por defecto
        }

        // Si no viene isPrimary (viejas versiones del UI), asumir que es horario principal
        if (session.isPrimary !== false) {
          topic.originales.push(horarioItem)
        } else {
          topic.secundarios.push(horarioItem)
        }
      }

      // Manejar PDFs del taller
      let generalPdfUrl = null
      const topicPdfUrls: Record<string, { url: string, fileName: string }> = {}

      if (body.workshopMaterial) {
        const material = body.workshopMaterial

        // Si hay PDF general, guardarlo
        if (material.pdfType === 'general' && material.pdfUrl && material.pdfUrl.startsWith('http')) {
          generalPdfUrl = material.pdfUrl
        }

        // Si hay PDFs por tema, guardar las URLs
        if (material.pdfType === 'by-topic' && material.topicPdfs) {
          for (const [topicTitle, topicPdf] of Object.entries(material.topicPdfs)) {
            const topicPdfAny = topicPdf as any
            if (topicPdfAny && topicPdfAny.url && String(topicPdfAny.url).startsWith('http')) {
              topicPdfUrls[topicTitle] = {
                url: topicPdfAny.url,
                fileName: topicPdfAny.fileName || null
              }
            }
          }
        }
      }

      // Guardar PDF general en activity_media si existe
      if (generalPdfUrl) {
        await supabase
          .from('activity_media')
          .insert({
            activity_id: newActivity.id,
            pdf_url: generalPdfUrl
          })
      }

      for (const [topicTitle, topicData] of topicGroups) {
        const originalesJson = {
          fechas_horarios: topicData.originales
        }

        const secundariosJson = {
          fechas_horarios: topicData.secundarios
        }

        // Verificar si hay fechas futuras para determinar si el taller está activo
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        const hasFutureDates = topicData.originales.some((horario: any) => {
          const fecha = new Date(horario.fecha)
          fecha.setHours(0, 0, 0, 0)
          return fecha >= now
        })

        // Insertar en taller_detalles con activo = true si hay fechas futuras
        const topicInsert: any = {
          actividad_id: newActivity.id,
          nombre: topicData.nombre || 'Sin título',
          descripcion: topicData.descripcion || '',
          originales: originalesJson,
          secundarios: secundariosJson,
          activo: hasFutureDates // Activo solo si hay fechas futuras
        }

        // Agregar PDF por tema si existe
        if (topicPdfUrls[topicTitle]) {
          topicInsert.pdf_url = topicPdfUrls[topicTitle].url
          topicInsert.pdf_file_name = topicPdfUrls[topicTitle].fileName
        }

        const { error: topicError } = await supabase
          .from('taller_detalles')
          .insert(topicInsert)

        if (topicError) {
          console.error('❌ Error creando tema en taller_detalles:', topicError)
        } else {
        }
      }
    }

    // ✅ MANEJAR TEMAS Y PDFs DE DOCUMENTOS (NUEVO)
    if (body.modality === 'document' && body.documentMaterial) {
      const material = body.documentMaterial
      const topics = material.topics || []
      const topicPdfs = material.topicPdfs || {}

      // 1. Guardar PDF general si existe
      if (material.pdfType === 'general' && material.pdfUrl) {
        await supabase
          .from('activity_media')
          .insert({
            activity_id: newActivity.id,
            pdf_url: material.pdfUrl
          })
      }

      // 2. Guardar cada tema en document_topics
      for (const topic of topics) {
        if (!topic.title) continue

        const topicInsert = {
          activity_id: newActivity.id,
          title: topic.title,
          description: topic.description || '',
          pdf_url: topicPdfs[topic.id]?.url || null,
          pdf_filename: topicPdfs[topic.id]?.fileName || null
        }

        const { error: topicError } = await supabase
          .from('document_topics')
          .insert(topicInsert)

        if (topicError) {
          console.error(`❌ Error insertando tema de documento "${topic.title}":`, topicError)
        }
      }
    }

    // Devolver formato esperado por el modal
    return NextResponse.json({
      success: true,
      productId: newActivity.id,
      product: newActivity
    })

  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()

    // Verificar que se envió el ID del producto a actualizar
    if (!body.editingProductId) {
      return NextResponse.json({ error: 'ID de producto requerido para actualización' }, { status: 400 })
    }

    // Validar límite de stock según plan
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: plan } = await supabaseService
      .from('planes_uso_coach')
      .select('plan_type')
      .eq('coach_id', user.id)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const planType = (plan?.plan_type || 'free') as 'free' | 'basico' | 'black' | 'premium'
    const { getPlanLimit } = await import('@/lib/utils/plan-limits')
    const stockLimit = getPlanLimit(planType, 'stockPerProduct')
    const totalClientsLimit = getPlanLimit(planType, 'totalClients')

    const { data: existingActivities, error: existingActivitiesError } = await supabaseService
      .from('activities')
      .select('id, capacity, type')
      .eq('coach_id', user.id)

    if (existingActivitiesError) {
      console.warn('⚠️ Error obteniendo actividades existentes para validar cupos totales (se continúa sin validar totalClients):', existingActivitiesError)
    }

    const normalizeCapacity = (value: any) => {
      if (value === null || value === undefined) return 0
      if (typeof value === 'number') return isFinite(value) ? value : 0
      if (typeof value === 'string') {
        const parsed = parseFloat(value)
        return isNaN(parsed) ? 0 : parsed
      }
      return 0
    }

    const isDocumentProduct = typeof body.modality === 'string' && body.modality.toLowerCase() === 'document'

    // Obtener el capacity actual del producto que se está editando
    const safeExistingActivities = ((existingActivitiesError ? [] : existingActivities) || [])

    const currentProductCapacity = safeExistingActivities.find(
      (activity) => activity.id === body.editingProductId
    )?.capacity || null
    const currentProductCapacityNumber = normalizeCapacity(currentProductCapacity)

    const otherCapacityUsed = safeExistingActivities
      .filter((activity) => activity.id !== body.editingProductId)
      .filter((activity) => {
        if (!activity?.type) return true
        const type = activity.type.toLowerCase()
        return type !== 'document'
      })
      .reduce((sum, activity) => sum + normalizeCapacity(activity.capacity), 0)

    console.log(`📊 PRODUCTOS PUT: Capacidades calculadas:`, {
      currentProductCapacity,
      currentProductCapacityNumber,
      otherCapacityUsed,
      totalClientsLimit,
      availableForThisProduct: totalClientsLimit - otherCapacityUsed
    })

    // Ajustar capacity (stock) automáticamente si excede los límites
    let adjustedCapacity = body.capacity ?? null

    console.log(`📊 PRODUCTOS PUT: Capacity recibido:`, {
      rawCapacity: body.capacity,
      capacityType: typeof body.capacity,
      editingProductId: body.editingProductId,
      isDocumentProduct,
      stockLimit,
      totalClientsLimit
    })

    // Permitir capacity para documentos también
    if (adjustedCapacity !== null && adjustedCapacity !== undefined) {
      const numericCapacity = normalizeCapacity(adjustedCapacity)
      let targetCapacity = numericCapacity

      if (numericCapacity > stockLimit) {
        console.log(`⚠️ Stock excede límite individual del plan ${planType}: ${numericCapacity} > ${stockLimit}. Ajustando a ${stockLimit}`)
        targetCapacity = stockLimit
      }

      // Calcular capacidad disponible: límite total - otros productos + capacidad actual del producto (si existe)
      // Esto permite que el usuario pueda mantener o ajustar el capacity del producto actual
      // IMPORTANTE: Si el producto ya tiene un capacity, podemos "liberar" ese espacio al establecer uno nuevo
      const capacityAvailableForThisProduct = totalClientsLimit - otherCapacityUsed + currentProductCapacityNumber
      let remainingCapacity = Math.max(capacityAvailableForThisProduct, 0)

      // Si no hay capacidad disponible (remainingCapacity = 0) y el producto no tenía capacity previo,
      // pero el usuario intenta establecer uno, permitir establecer hasta stockLimit individual
      // Esto permite que el usuario pueda establecer cupos aunque otros productos estén usando el límite total,
      // ya que luego puede ajustar otros productos para liberar espacio
      if (remainingCapacity === 0 && currentProductCapacityNumber === 0 && numericCapacity > 0) {
        // Permitir establecer cupos hasta el stockLimit individual
        remainingCapacity = Math.min(stockLimit, numericCapacity)
        console.warn(`⚠️ Límite total alcanzado (${otherCapacityUsed}/${totalClientsLimit}). Permitindo establecer hasta ${remainingCapacity} cupos (stockLimit individual) para permitir flexibilidad al usuario.`)
      }

      console.log(`📊 PRODUCTOS PUT: Cálculo de capacidad disponible:`, {
        totalClientsLimit,
        otherCapacityUsed,
        currentProductCapacityNumber,
        capacityAvailableForThisProduct,
        remainingCapacity,
        targetCapacity
      })

      if (targetCapacity > remainingCapacity) {
        console.log(
          `⚠️ Stock excede límite total de clientes (${totalClientsLimit}). Cupos usados por otros productos: ${otherCapacityUsed}, capacidad actual del producto: ${currentProductCapacityNumber}. Disponible: ${remainingCapacity}. Ajustando a ${remainingCapacity}`
        )
        targetCapacity = remainingCapacity
      }

      adjustedCapacity = Math.max(Math.floor(targetCapacity), 0)

      console.log(`📊 PRODUCTOS PUT: Capacity ajustado:`, {
        originalCapacity: body.capacity,
        numericCapacity,
        targetCapacity,
        adjustedCapacity,
        otherCapacityUsed,
        remainingCapacity: Math.max(totalClientsLimit - otherCapacityUsed, 0),
        totalClientsLimit,
        stockLimit
      })

      // Si el resultado es 0, verificar si realmente debe ser null o si puede mantener un valor
      if (adjustedCapacity === 0) {
        // Si el usuario intentó establecer un valor > 0 pero quedó en 0 por límites
        if (numericCapacity > 0) {
          console.warn(`⚠️ Capacity ajustado a 0 aunque el usuario especificó ${numericCapacity}.`)
          // Si hay capacidad disponible considerando el capacity actual del producto
          if (remainingCapacity > 0) {
            // Hay capacidad disponible, usar el mínimo entre lo solicitado y lo disponible
            adjustedCapacity = Math.min(numericCapacity, remainingCapacity, stockLimit)
            console.log(`✅ Ajustando capacity a ${adjustedCapacity} (hay ${remainingCapacity} disponible)`)
          } else {
            // No hay capacidad disponible incluso considerando el capacity actual
            // Mantener el capacity actual del producto si existe, sino null
            if (currentProductCapacityNumber > 0) {
              adjustedCapacity = currentProductCapacityNumber
              console.log(`✅ Manteniendo capacity actual del producto: ${adjustedCapacity} (no hay más capacidad disponible)`)
            } else {
              adjustedCapacity = null
              console.log(`ℹ️ Capacity ajustada a null (no hay capacidad disponible y el producto no tenía capacity previo)`)
            }
          }
        } else {
          // El usuario especificó 0 o null explícitamente
          adjustedCapacity = null
          console.log(`ℹ️ Capacity ajustada a null (el usuario especificó ${numericCapacity})`)
        }
      }
    } else {
      console.log(`📊 PRODUCTOS PUT: Capacity es null o undefined, no se ajusta`)
    }

    console.log(`📊 PRODUCTOS PUT: Capacity final que se guardará:`, {
      adjustedCapacity,
      adjustedCapacityType: typeof adjustedCapacity
    })

    // Actualizar producto en activities
    console.log(`💾 PRODUCTOS PUT: Guardando producto con capacity:`, {
      productId: body.editingProductId,
      capacity: adjustedCapacity,
      capacityType: typeof adjustedCapacity,
      updateObject: {
        title: body.name,
        capacity: adjustedCapacity
      }
    })

    const updateData: any = {
      title: body.name,
      description: body.description,
      price: body.price,
      // ✅ type = tipo de producto (workshop/program/document) - solo estos 3 valores
      type: body.modality === 'workshop' ? 'workshop' : (body.modality === 'document' ? 'document' : 'program'),
      // ✅ modality = modalidad (online/presencial/híbrido)
      modality: body.type || 'online',
      included_meet_credits: body.modality === 'workshop' ? 0 : (typeof body.included_meet_credits === 'number' ? body.included_meet_credits : parseInt(String(body.included_meet_credits ?? '0'), 10) || 0),
      // ✅ categoria = fitness o nutricion (no confundir con type)
      categoria: body.categoria || 'fitness',
      difficulty: body.level,
      is_public: body.is_public,
      capacity: adjustedCapacity,
      restricciones: joinSemicolonList(body.restricciones),
      // ✅ GUARDAR OBJETIVOS EN workshop_type como JSON
      workshop_type: splitSemicolonList(body.objetivos).length > 0
        ? JSON.stringify({ objetivos: joinSemicolonList(body.objetivos) })
        : (body.workshop_type || (body.modality === 'workshop' ? 'general' : null)),
      // ✅ Campos de ubicación para modalidad presencial
      location_name: body.location_name || null,
      location_url: body.location_url || null,
      // ✅ NUEVO: Días para acceder al producto
      dias_acceso: body.dias_acceso || 30,
      // ✅ NUEVO: Modo de taller (individual/grupal)
      workshop_mode: body.workshop_mode || 'grupal',
      // ✅ NUEVO: Cantidad de participantes por clase (solo para talleres grupales)
      participants_per_class: body.participants_per_class || null,
      // ✅ NUEVO: Estadísticas denormalizadas
      semanas_totales: body.semanas_totales || 0,
      sesiones_dias_totales: body.sesiones_dias_totales || 0,
      items_totales: body.items_totales || 0,
      items_unicos: body.items_unicos || 0,
      periodos_configurados: body.periodos_configurados || 1
    }

    const { data: product, error: productError } = await supabase
      .from('activities')
      .update(updateData)
      .eq('id', body.editingProductId)
      .eq('coach_id', user.id) // Seguridad: solo el coach dueño puede actualizar
      .select()
      .single()

    if (productError) {
      console.error(`❌ PRODUCTOS PUT: Error actualizando producto:`, {
        productId: body.editingProductId,
        error: productError,
        capacitySent: adjustedCapacity
      })
      console.error('❌ Error actualizando producto:', productError)
      return NextResponse.json({ error: productError.message }, { status: 500 })
    }

    console.log(`✅ PRODUCTOS PUT: Producto actualizado exitosamente:`, {
      productId: body.editingProductId,
      capacityGuardado: product?.capacity,
      capacityEnviado: adjustedCapacity,
      productCapacityType: typeof product?.capacity
    })

    if (body.image_url || body.video_url) {
      // Verificar si ya existe un registro de media para esta actividad
      const { data: existingMedia, error: checkError } = await supabase
        .from('activity_media')
        .select('id')
        .eq('activity_id', body.editingProductId)
        .maybeSingle()

      if (checkError) {
        console.error('⚠️ Error verificando media existente:', checkError)
      }

      // Preparar datos de actualización
      const mediaUpdate: any = {
        image_url: body.image_url || null,
        video_url: body.video_url || null
      }

      if (body.video_url) {
        const isBunnyVideo = body.video_url.includes('b-cdn.net') ||
          body.video_url.includes('mediadelivery.net')

        if (isBunnyVideo) {
          const embedMatch = body.video_url.match(/mediadelivery\.net\/embed\/([a-f0-9-]+)/)
          const cdnMatch = body.video_url.match(/b-cdn\.net\/([a-f0-9-]+)\//)
          const playlistMatch = body.video_url.match(/mediadelivery\.net\/([a-f0-9-]+)\//)
          const bunnyVideoId = embedMatch?.[1] || cdnMatch?.[1] || playlistMatch?.[1]

          if (bunnyVideoId) {
            mediaUpdate.bunny_video_id = bunnyVideoId
            mediaUpdate.bunny_library_id = parseInt(process.env.BUNNY_STREAM_LIBRARY_ID || '0')
          }
        }
      }

      if (existingMedia) {
        // Actualizar registro existente
        const { error: updateError } = await supabase
          .from('activity_media')
          .update(mediaUpdate)
          .eq('activity_id', body.editingProductId)

        if (updateError) {
          console.error('❌ Error actualizando media:', updateError)
        }
      } else {
        const { error: insertError } = await supabase
          .from('activity_media')
          .insert({
            activity_id: body.editingProductId,
            ...mediaUpdate
          })

        if (insertError) {
          console.error('❌ Error insertando media:', insertError)
        }
      }
    }

    if (body.modality === 'workshop' && body.workshopSchedule && Array.isArray(body.workshopSchedule)) {

      // Cargar temas existentes para hacer merge inteligente
      const { data: existingTopics, error: fetchError } = await supabase
        .from('taller_detalles')
        .select('id, nombre, descripcion, originales, pdf_url, pdf_file_name, activo')
        .eq('actividad_id', body.editingProductId)

      if (fetchError) {
        console.error('❌ Error cargando temas existentes:', fetchError)
      }

      const existingTopicsMap = new Map()
      if (existingTopics) {
        existingTopics.forEach((tema: any) => {
          existingTopicsMap.set(tema.nombre, tema)
        })
      }

      console.log(`📊 Temas existentes encontrados: ${existingTopics?.length || 0}`)

      // Agrupar sesiones por tema
      const topicGroups = new Map()

      for (const session of body.workshopSchedule) {
        const topicKey = session.title || 'Sin título'
        if (!topicGroups.has(topicKey)) {
          topicGroups.set(topicKey, {
            nombre: session.title,
            descripcion: session.description || '',
            originales: [],
            secundarios: []
          })
        }

        const topic = topicGroups.get(topicKey)
        const horarioItem = {
          fecha: session.date,
          hora_inicio: session.startTime,
          hora_fin: session.endTime,
          cupo: 20 // Cupo por defecto
        }

        // Si no viene isPrimary (viejas versiones del UI), asumir que es horario principal
        if (session.isPrimary !== false) {
          topic.originales.push(horarioItem)
        } else {
          topic.secundarios.push(horarioItem)
        }
      }

      // Verificar si hay fechas futuras en todos los temas para determinar si el taller está activo
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      let hasAnyFutureDates = false

      for (const [topicTitle, topicData] of topicGroups) {
        const hasFutureDates = topicData.originales.some((horario: any) => {
          const fecha = new Date(horario.fecha)
          fecha.setHours(0, 0, 0, 0)
          return fecha >= now
        })
        if (hasFutureDates) {
          hasAnyFutureDates = true
          break
        }
      }

      // Si el taller estaba finalizado y se agregaron nuevas fechas futuras, generar nueva versión y reactivar
      if (hasAnyFutureDates) {
        const formatDateSpanish = (date: Date | string): string => {
          const d = typeof date === 'string' ? new Date(date) : date
          const day = String(d.getDate()).padStart(2, '0')
          const month = String(d.getMonth() + 1).padStart(2, '0')
          const year = String(d.getFullYear()).slice(-2)
          return `${day}/${month}/${year}`
        }

        const { data: currentActivity } = await supabase
          .from('activities')
          .select('is_finished, workshop_versions')
          .eq('id', body.editingProductId)
          .single()

        const wasFinished = currentActivity?.is_finished === true
        if (wasFinished) {
          const versions = (currentActivity as any)?.workshop_versions?.versions || []
          const nextVersion = (Array.isArray(versions) ? versions.length : 0) + 1
          const newVersion = {
            version: nextVersion,
            empezada_el: formatDateSpanish(new Date()),
            finalizada_el: null
          }

          await supabase
            .from('activities')
            .update({
              is_finished: false,
              finished_at: null,
              workshop_versions: {
                versions: [...(Array.isArray(versions) ? versions : []), newVersion]
              }
            })
            .eq('id', body.editingProductId)
        }
      }

      // Manejar PDFs del taller
      let generalPdfUrl = null
      const topicPdfUrls: Record<string, { url: string, fileName: string }> = {}

      if (body.workshopMaterial) {
        const material = body.workshopMaterial

        // Si hay PDF general, subirlo
        if (material.pdfType === 'general' && material.pdfFile) {
          // El PDF general se subirá desde el frontend antes de enviar
          // Aquí solo guardamos la URL si viene en el body
          if (material.pdfUrl && material.pdfUrl.startsWith('http')) {
            generalPdfUrl = material.pdfUrl
          }
        }

        // Si hay PDFs por tema, guardar las URLs
        if (material.pdfType === 'by-topic' && material.topicPdfs) {
          for (const [topicTitle, topicPdf] of Object.entries(material.topicPdfs)) {
            const topicPdfAny = topicPdf as any
            if (topicPdfAny && topicPdfAny.url && String(topicPdfAny.url).startsWith('http')) {
              topicPdfUrls[topicTitle] = {
                url: topicPdfAny.url,
                fileName: topicPdfAny.fileName || null
              }
            }
          }
        }
      }

      // Guardar PDF general en activities o activity_media si existe
      if (generalPdfUrl) {
        // Verificar si existe activity_media
        const { data: existingMedia } = await supabase
          .from('activity_media')
          .select('id')
          .eq('activity_id', body.editingProductId)
          .maybeSingle()

        if (existingMedia) {
          await supabase
            .from('activity_media')
            .update({ pdf_url: generalPdfUrl })
            .eq('activity_id', body.editingProductId)
        } else {
          await supabase
            .from('activity_media')
            .insert({
              activity_id: body.editingProductId,
              pdf_url: generalPdfUrl
            })
        }
      }

      // Procesar cada tema: actualizar si existe, insertar si no existe
      for (const [topicTitle, topicData] of topicGroups) {
        const originalesJson = {
          fechas_horarios: topicData.originales
        }

        const existingTopic = existingTopicsMap.get(topicTitle)

        const topicUpdate: any = {
          actividad_id: body.editingProductId,
          nombre: topicData.nombre || 'Sin título',
          descripcion: topicData.descripcion || '',
          originales: originalesJson,
          activo: hasAnyFutureDates // Todos los temas tienen el mismo valor
        }

        // Nota: La columna 'secundarios' no existe en la tabla, no la incluimos

        // Agregar PDF por tema si existe (preservar el existente si no hay uno nuevo)
        if (topicPdfUrls[topicTitle]) {
          topicUpdate.pdf_url = topicPdfUrls[topicTitle].url
          topicUpdate.pdf_file_name = topicPdfUrls[topicTitle].fileName
        } else if (existingTopic && existingTopic.pdf_url) {
          // Preservar PDF existente si no hay uno nuevo
          topicUpdate.pdf_url = existingTopic.pdf_url
          topicUpdate.pdf_file_name = existingTopic.pdf_file_name
        }

        if (existingTopic) {
          // Actualizar tema existente
          const { error: updateError } = await supabase
            .from('taller_detalles')
            .update(topicUpdate)
            .eq('id', existingTopic.id)

          if (updateError) {
            console.error(`❌ Error actualizando tema "${topicTitle}":`, updateError)
          } else {
            console.log(`✅ Tema actualizado: "${topicTitle}"`)
          }
        } else {
          // Insertar tema nuevo
          const { error: insertError } = await supabase
            .from('taller_detalles')
            .insert(topicUpdate)

          if (insertError) {
            console.error(`❌ Error insertando tema "${topicTitle}":`, insertError)
          } else {
            console.log(`✅ Tema insertado: "${topicTitle}"`)
          }
        }
      }

      // Eliminar solo los temas que ya no están en el nuevo schedule
      // (temas que existían pero no están en topicGroups)
      const newTopicNames = new Set(topicGroups.keys())
      const topicsToDelete: number[] = []

      existingTopicsMap.forEach((tema, nombre) => {
        if (!newTopicNames.has(nombre)) {
          topicsToDelete.push(tema.id)
        }
      })

      if (topicsToDelete.length > 0) {
        console.log(`🗑️ Eliminando ${topicsToDelete.length} tema(s) que ya no están en el schedule:`, topicsToDelete)
        const { error: deleteError } = await supabase
          .from('taller_detalles')
          .delete()
          .in('id', topicsToDelete)

        if (deleteError) {
          console.error('❌ Error eliminando temas obsoletos:', deleteError)
        } else {
          console.log(`✅ Temas obsoletos eliminados correctamente`)
        }
      }
    }

    // ✅ MANEJAR TEMAS Y PDFs DE DOCUMENTOS EN ACTUALIZACIÓN (NUEVO)
    if (body.modality === 'document' && body.documentMaterial) {
      const material = body.documentMaterial
      const topics = material.topics || []
      const topicPdfs = material.topicPdfs || {}

      // 1. Guardar/Actualizar PDF general en activity_media
      if (material.pdfType === 'general' && material.pdfUrl) {
        const { data: existingMedia } = await supabase
          .from('activity_media')
          .select('id')
          .eq('activity_id', body.editingProductId)
          .maybeSingle()

        if (existingMedia) {
          await supabase
            .from('activity_media')
            .update({ pdf_url: material.pdfUrl })
            .eq('activity_id', body.editingProductId)
        } else {
          await supabase
            .from('activity_media')
            .insert({
              activity_id: body.editingProductId,
              pdf_url: material.pdfUrl
            })
        }
      }

      // 2. Cargar temas existentes para sincronizar (desde document_topics)
      const { data: existingTopics } = await supabase
        .from('document_topics')
        .select('id, title')
        .eq('activity_id', body.editingProductId)

      const existingTopicsMap = new Map()
      if (existingTopics) {
        existingTopics.forEach((t: any) => existingTopicsMap.set(t.title, t.id))
      }

      const currentTopicNames = new Set()

      // 3. Procesar temas: Insertar o actualizar
      for (const topic of topics) {
        if (!topic.title) continue
        currentTopicNames.add(topic.title)

        const topicData = {
          activity_id: body.editingProductId,
          title: topic.title,
          description: topic.description || '',
          pdf_url: topicPdfs[topic.id]?.url || null,
          pdf_filename: topicPdfs[topic.id]?.fileName || null
        }

        if (existingTopicsMap.has(topic.title)) {
          // Actualizar existente
          const topicId = existingTopicsMap.get(topic.title)
          await supabase
            .from('document_topics')
            .update(topicData)
            .eq('id', topicId)
        } else {
          // Insertar nuevo
          await supabase
            .from('document_topics')
            .insert(topicData)
        }
      }

      // 4. Eliminar temas obsoletos
      if (existingTopics) {
        const topicsToDelete = existingTopics
          .filter((t: any) => !currentTopicNames.has(t.title))
          .map((t: any) => t.id)

        if (topicsToDelete.length > 0) {
          await supabase
            .from('document_topics')
            .delete()
            .in('id', topicsToDelete)
        }
      }
    }

    // Devolver formato esperado por el modal
    return NextResponse.json({
      success: true,
      productId: product.id,
      product: product
    })

  } catch (error: any) {
    console.error('❌ Error en actualización:', error)
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 })
  }
}