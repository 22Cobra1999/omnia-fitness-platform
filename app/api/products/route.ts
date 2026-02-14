import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { saveWeeklySchedule, saveProductPeriods } from './handlers/program.handler'
import { handleWorkshopCreation, handleWorkshopUpdate } from './handlers/workshop.handler'
import { handleDocumentCreation, handleDocumentUpdate } from './handlers/document.handler'

const calculateStatsFromSchedule = (weeklySchedule: any, periods: number) => {
  const defaultStats = {
    items_totales: 0,
    items_unicos: 0,
    sesiones_dias_totales: 0,
    semanas_totales: 0
  };

  try {
    let schedule = weeklySchedule;
    if (typeof schedule === 'string' && schedule.trim() !== '') {
      try {
        schedule = JSON.parse(schedule);
      } catch (e) {
        console.error('❌ Error parsing weeklySchedule string:', e);
        return defaultStats;
      }
    }

    if (!schedule || typeof schedule !== 'object') {
      console.log('⚠️ Schedule no es objeto en calculo:', typeof schedule);
      return defaultStats;
    }

    // Convertir a array de semanas si es un objeto { "1": ..., "2": ... }
    const weeks = Array.isArray(schedule) ? schedule : Object.values(schedule);
    const rawWeeks = weeks.length;

    if (rawWeeks === 0) {
      console.log('⚠️ No hay semanas en el schedule');
      return defaultStats;
    }

    const uniqueItems = new Set();
    let itemsTotales = 0;
    let sesionesTotales = 0;

    console.log(`📊 Iniciando calculo para ${rawWeeks} semanas...`);

    weeks.forEach((week: any, wIdx) => {
      if (!week || typeof week !== 'object') return;

      // Iterar sobre todas las claves del objeto semana, no solo las predefinidas
      Object.entries(week).forEach(([dayKey, dayData]: [string, any]) => {
        // Solo procesar claves que parezcan dias (nombres o numeros del 1 al 7)
        const isDayKey = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo', '1', '2', '3', '4', '5', '6', '7'].includes(dayKey.toLowerCase());
        if (!isDayKey) return;

        let data = dayData;
        if (typeof data === 'string' && data.trim() !== '') {
          try { data = JSON.parse(data); } catch (e) { }
        }

        if (!data) return;

        // Buscar el array de ejercicios. Puede ser data.ejercicios, data.exercises, o data mismo si es un array
        let ejercicios: any[] = [];
        if (Array.isArray(data)) {
          ejercicios = data;
        } else if (data && typeof data === 'object') {
          ejercicios = data.ejercicios || data.exercises || [];
        }

        if (Array.isArray(ejercicios) && ejercicios.length > 0) {
          // Filtrar activos (permissivo: si no tiene el campo, se considera activo)
          const activeExercises = ejercicios.filter((ex: any) =>
            ex && typeof ex === 'object' && ex.activo !== false && ex.is_active !== false
          );

          if (activeExercises.length > 0) {
            sesionesTotales++;
            activeExercises.forEach((ex: any) => {
              const id = ex.id || ex.ejercicio_id || ex.id_ejercicio || ex.exercise_id;
              if (id) {
                uniqueItems.add(String(id));
                itemsTotales++;
              }
            });
          }
        }
      });
    });

    const periodos = Number(periods) || 1;
    const finalStats = {
      items_totales: itemsTotales * periodos,
      items_unicos: uniqueItems.size,
      sesiones_dias_totales: sesionesTotales * periodos,
      semanas_totales: rawWeeks * periodos
    };

    console.log('✅ Resultado calculo servidor:', {
      rawWeeks,
      periodos,
      sesionesBase: sesionesTotales,
      itemsBase: itemsTotales,
      finalStats
    });

    return finalStats;
  } catch (error) {
    console.error('❌ Error crítico en calculateStatsFromSchedule:', error);
    return defaultStats;
  }
};

const calculateWorkshopStats = (schedule: any[]) => {
  if (!Array.isArray(schedule) || schedule.length === 0) return {
    items_totales: 0,
    items_unicos: 0,
    sesiones_dias_totales: 0,
    semanas_totales: 0
  }

  const uniqueDays = new Set(schedule.map(s => s.date)).size
  const uniqueThemes = new Set(schedule.map(s => s.title).filter(Boolean)).size

  return {
    items_totales: schedule.length,
    items_unicos: uniqueThemes,
    sesiones_dias_totales: uniqueDays,
    semanas_totales: 0
  }
}

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
    let query = supabaseService
      .from('activities')
      .select('id, created_at')
      .eq('coach_id', coachId)
      .neq('type', 'consultation')
      .order('created_at', { ascending: true }) // ASCENDENTE: los más antiguos primero

    // Intentar filtrar por is_paused solo si sabemos que existe o simplemente fallar con elegancia
    const { data: activeProducts, error: countError } = await query.eq('is_paused', false)

    if (countError) {
      console.warn('⚠️ Error contando productos activos (posible columna is_paused ausente):', countError.message)

      // Reintentar sin el filtro is_paused si el error es de columna inexistente
      if (countError.code === '42703' || countError.message.includes('is_paused')) {
        const { data: retryProducts, error: retryError } = await supabaseService
          .from('activities')
          .select('id, created_at')
          .eq('coach_id', coachId)
          .neq('type', 'consultation')
          .order('created_at', { ascending: true })

        if (!retryError) {
          // Si pudimos reintentar, usar esos datos
          handlePausadoLogic(retryProducts, limit, planType, coachId, supabaseService)
        }
      }
      return
    }

    handlePausadoLogic(activeProducts, limit, planType, coachId, supabaseService)
  } catch (error) {
    console.error('Error en checkAndPauseProductsIfNeeded:', error)
  }
}

// Extraer lógica de pausa para reutilizarla
async function handlePausadoLogic(activeProducts: any[] | null, limit: number, planType: string, coachId: string, supabaseService: any) {
  const activeCount = activeProducts?.length || 0

  if (activeCount > limit) {
    const productsToPause = activeProducts!.slice(limit)
    const productIds = productsToPause.map(p => p.id)

    console.log(`⚠️ Plan ${planType}: ${activeCount} productos activos, límite: ${limit}. Pausando ${productIds.length} productos más recientes:`, productIds)

    if (productIds.length > 0) {
      // Intentar actualizar is_paused
      const { error: pauseError } = await supabaseService
        .from('activities')
        .update({
          is_paused: true,
          updated_at: new Date().toISOString()
        })
        .in('id', productIds)

      if (pauseError) {
        console.warn('⚠️ Error pausando productos automáticamente (columna missing?):', pauseError.message)
      }
    }
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
            const targetId = typeof product.id === 'string' ? parseInt(product.id) : product.id

            let { data: tallerDetallesStats, error: tallerError } = await supabaseService
              .from('taller_detalles')
              .select('id, nombre, descripcion, originales, pdf_url, pdf_file_name, activo')
              .eq('actividad_id', targetId)

            if (tallerError) {
              console.error(`❌ [API] Error fetching taller_detalles for ${product.id}:`, tallerError)
            }

            // Si falló con número y el id original era distinto, reintentar con el id original
            if ((!tallerDetallesStats || tallerDetallesStats.length === 0) && product.id !== targetId) {
              const { data: retryData } = await supabaseService
                .from('taller_detalles')
                .select('id, nombre, descripcion, originales, pdf_url, pdf_file_name, activo')
                .eq('actividad_id', product.id)
              if (retryData && retryData.length > 0) {
                tallerDetallesStats = retryData
              }
            }

            if (tallerDetallesStats && tallerDetallesStats.length > 0) {
              const activeDetalles = tallerDetallesStats.filter((t: any) => t.activo !== false)
              // Store full details for editing
              product.workshop_details = tallerDetallesStats

              // Calcular cantidad de temas únicos
              const temasUnicos = new Set(activeDetalles.map((t: any) => t.nombre).filter(Boolean))
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

        // Helper interno para parsear días (que pueden venir como string o JSONB)
        const parseDay = (data: any) => {
          if (!data) return null
          if (typeof data === 'object' && !Array.isArray(data)) return data
          try {
            return typeof data === 'string' ? JSON.parse(data) : data
          } catch (e) {
            return null
          }
        }

        // Verificar si es nutrición - usar categoria, no type
        const isNutrition = product.categoria === 'nutricion' || product.categoria === 'nutrition'

        if (isNutrition) {
          // Para nutrición: obtener platos de nutrition_program_details
          let platosCount = 0
          try {
            const { count } = await supabase
              .from('nutrition_program_details')
              .select('*', { count: 'exact', head: true })
              .or(`activity_id.eq.${product.id},activity_id.eq.${product.id.toString()},activity_id_new.cs.{"${product.id.toString()}":{}},activity_id.cs.{"${product.id.toString()}":{}}`)
            platosCount = count || 0
          } catch (e) { }

          // Fallback: contar platos únicos del plan
          const uniquePlatosInPlan = new Set()
          let totalSessionsCalculated = 0

          if (planificacion && planificacion.length > 0) {
            planificacion.forEach((semana: any) => {
              ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].forEach(dia => {
                const dayData = parseDay(semana[dia])
                if (dayData && dayData.ejercicios && Array.isArray(dayData.ejercicios) && dayData.ejercicios.length > 0) {
                  totalSessionsCalculated++
                  dayData.ejercicios.forEach((ex: any) => { if (ex.id) uniquePlatosInPlan.add(ex.id) })
                }
              })
            })
          }

          exercisesCount = Math.max(platosCount, uniquePlatosInPlan.size)
          const periodosUnicos = periodos?.cantidad_periodos || 1
          totalSessions = totalSessionsCalculated * periodosUnicos

          console.log(`🥗 PRODUCTOS: Actividad ${product.id} (Nutrición) - Platos: ${exercisesCount}, Sesiones: ${totalSessions}`)

        } else if (product.type === 'program' && product.categoria === 'fitness') {
          // Obtener ejercicios
          let exerciseCountFromDetails = 0
          try {
            const { count } = await supabase
              .from('ejercicios_detalles')
              .select('*', { count: 'exact', head: true })
              .contains('activity_id', { [product.id.toString()]: {} })
            exerciseCountFromDetails = count || 0
          } catch (e) { }

          // Fallback: contar ejercicios únicos del plan
          const uniqueExercisesInPlan = new Set()
          let totalSessionsCalculated = 0

          if (planificacion && planificacion.length > 0) {
            planificacion.forEach((semana: any) => {
              ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].forEach(dia => {
                const dayData = parseDay(semana[dia])
                if (dayData && dayData.ejercicios && Array.isArray(dayData.ejercicios)) {
                  const activeExercises = dayData.ejercicios.filter((ex: any) => ex.activo !== false)
                  if (activeExercises.length > 0) {
                    totalSessionsCalculated++
                    activeExercises.forEach((ex: any) => { if (ex.id) uniqueExercisesInPlan.add(ex.id) })
                  }
                }
              })
            })
          }

          exercisesCount = Math.max(exerciseCountFromDetails, uniqueExercisesInPlan.size)
          const periodosUnicos = periodos?.cantidad_periodos || 1
          totalSessions = totalSessionsCalculated * periodosUnicos

          console.log(`📊 PRODUCTOS: Actividad ${product.id} - Ejercicios: ${exercisesCount}, Sesiones: ${totalSessions}`)
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
          exercisesCount: product.items_unicos || exercisesCount,
          totalSessions: product.sesiones_dias_totales || totalSessions,
          // Para talleres: cantidad de temas y días
          cantidadTemas: cantidadTemas,
          cantidadDias: cantidadDias,
          workshop_details: product.workshop_details,
          taller_detalles: product.workshop_details,
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
          // ✅ NUEVO: Estadísticas denormalizadas (Preferir frontend, fallback servidor)
          ...(() => {
            const calculated = body.modality === 'workshop' && body.workshopSchedule
              ? calculateWorkshopStats(body.workshopSchedule)
              : calculateStatsFromSchedule(body.weeklySchedule, body.periods || 1);

            console.log('🚀 [POST] Stats combinadas:', {
              type: body.modality,
              frontend: {
                semanas: body.semanas_totales,
                sesiones: body.sesiones_dias_totales,
                items: body.items_totales,
                unicos: body.items_unicos
              },
              backend: calculated
            });
            return {
              semanas_totales: body.semanas_totales || calculated.semanas_totales || 0,
              sesiones_dias_totales: body.sesiones_dias_totales || calculated.sesiones_dias_totales || 0,
              items_totales: body.items_totales || calculated.items_totales || 0,
              items_unicos: body.items_unicos || calculated.items_unicos || 0,
            };
          })(),
          periodos_configurados: body.periods || 1
        }
      ])
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Verificar y pausar productos automáticamente si exceden el límite del plan
    await checkAndPauseProductsIfNeeded(user.id)

    // ✅ MANEJAR TALLERES (WORKSHOPS)
    if (body.modality === 'workshop') {
      await handleWorkshopCreation(supabase, newActivity.id, body, user.id)
    }



    // ✅ MANEJAR TEMAS Y PDFs DE DOCUMENTOS (NUEVO)
    if (body.modality === 'document') {
      await handleDocumentCreation(supabase, newActivity.id, body)
    }

    // ✅ MANEJAR PLANIFICACIÓN DE EJERCICIOS (PROGRAMAS/FITNESS) EN CREACIÓN
    if (body.modality !== 'workshop' && body.modality !== 'document' && !body.modality?.includes('consultation')) {
      if (body.weeklySchedule && typeof body.weeklySchedule === 'object' && Object.keys(body.weeklySchedule).length > 0) {
        await saveWeeklySchedule(supabase, newActivity.id, body.weeklySchedule, body.categoria)

        // 🔥 NUCLEAR RESYNC: Reparar estadísticas después de que el trigger potencialmente las rompiera
        const finalStats = calculateStatsFromSchedule(body.weeklySchedule, body.periods || 1);
        console.log('🔥 [POST] Nuclear Resync de estadísticas:', finalStats);

        await supabase.from('activities').update({
          semanas_totales: body.semanas_totales || finalStats.semanas_totales || 0,
          sesiones_dias_totales: body.sesiones_dias_totales || finalStats.sesiones_dias_totales || 0,
          items_totales: body.items_totales || finalStats.items_totales || 0,
          items_unicos: body.items_unicos || finalStats.items_unicos || 0,
          duration_weeks: body.semanas_totales || finalStats.semanas_totales || 0
        }).eq('id', newActivity.id);
      }

      // Guardar periodos si existen
      if (body.periods) {
        await saveProductPeriods(supabase, newActivity.id, body.periods)
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

    const calculatedStats = (body.modality === 'workshop' && Array.isArray(body.workshopSchedule))
      ? calculateWorkshopStats(body.workshopSchedule)
      : calculateStatsFromSchedule(body.weeklySchedule, body.periods || 1);

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
      // ✅ NUEVO: Estadísticas denormalizadas (Preferir frontend, fallback servidor)
      // Solo incluirlos si vienen en el body o si se pueden calcular del schedule
      periodos_configurados: body.periods || 1
    };

    if (body.semanas_totales !== undefined || calculatedStats.semanas_totales !== undefined) {
      updateData.semanas_totales = body.semanas_totales || calculatedStats.semanas_totales || 0;
    }
    if (body.sesiones_dias_totales !== undefined || calculatedStats.sesiones_dias_totales !== undefined) {
      updateData.sesiones_dias_totales = body.sesiones_dias_totales || calculatedStats.sesiones_dias_totales || 0;
    }
    if (body.items_totales !== undefined || calculatedStats.items_totales !== undefined) {
      updateData.items_totales = body.items_totales || calculatedStats.items_totales || 0;
    }
    if (body.items_unicos !== undefined || calculatedStats.items_unicos !== undefined) {
      updateData.items_unicos = body.items_unicos || calculatedStats.items_unicos || 0;
    }

    console.log('🚀 [PUT] updateData final para activities:', {
      semanas: updateData.semanas_totales,
      sesiones: updateData.sesiones_dias_totales,
      items: updateData.items_totales,
      unicos: updateData.items_unicos,
      frontend: {
        semanas: body.semanas_totales,
        sesiones: body.sesiones_dias_totales,
        items: body.items_totales,
        unicos: body.items_unicos
      },
      backendCalculation: calculatedStats
    });

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

    // ✅ MANEJAR TALLERES (WORKSHOPS) EN ACTUALIZACIÓN
    if (body.modality === 'workshop') {
      await handleWorkshopUpdate(supabase, body.editingProductId, body, user.id)
    }

    // ✅ MANEJAR TEMAS Y PDFs DE DOCUMENTOS (NUEVO)
    if (body.modality === 'document') {
      await handleDocumentUpdate(supabase, body.editingProductId, body)
    }

    // ✅ MANEJAR PLANIFICACIÓN DE EJERCICIOS (PROGRAMAS/FITNESS)
    if (body.modality !== 'workshop' && body.modality !== 'document' && !body.modality?.includes('consultation')) {
      if (body.weeklySchedule && typeof body.weeklySchedule === 'object' && Object.keys(body.weeklySchedule).length > 0) {
        await saveWeeklySchedule(supabase, body.editingProductId, body.weeklySchedule, body.categoria)

        // 🔥 NUCLEAR RESYNC: Reparar estadísticas después de que el trigger potencialmente las rompiera
        const finalStats = calculateStatsFromSchedule(body.weeklySchedule, body.periods || 1);
        console.log('🔥 [PUT] Nuclear Resync de estadísticas:', finalStats);

        await supabase.from('activities').update({
          semanas_totales: body.semanas_totales || finalStats.semanas_totales || 0,
          sesiones_dias_totales: body.sesiones_dias_totales || finalStats.sesiones_dias_totales || 0,
          items_totales: body.items_totales || finalStats.items_totales || 0,
          items_unicos: body.items_unicos || finalStats.items_unicos || 0,
          duration_weeks: body.semanas_totales || finalStats.semanas_totales || 0
        }).eq('id', body.editingProductId);
      }

      // Guardar periodos si existen
      if (body.periods) {
        await saveProductPeriods(supabase, body.editingProductId, body.periods)
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
