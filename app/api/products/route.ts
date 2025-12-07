import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'
import { createClient } from '@supabase/supabase-js'

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
    
    // Intentar obtener sesión primero (más confiable en algunos casos)
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ [GET /api/products] Error obteniendo sesión:', {
        error: sessionError.message,
        code: sessionError.status,
        name: sessionError.name
      })
    }
    
    // Verificar autenticación con getUser (más seguro)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('❌ [GET /api/products] Error de autenticación:', {
        error: authError.message,
        code: authError.status,
        name: authError.name,
        hasSession: !!sessionData?.session,
        sessionError: sessionError?.message
      })
      return NextResponse.json({ 
        error: 'No autorizado',
        details: authError.message 
      }, { status: 401 })
    }
    
    if (!user) {
      console.warn('⚠️ [GET /api/products] Usuario no encontrado en sesión', {
        hasSession: !!sessionData?.session,
        sessionUserId: sessionData?.session?.user?.id
      })
      return NextResponse.json({ 
        error: 'No autorizado',
        details: 'Usuario no autenticado'
      }, { status: 401 })
    }
    
    console.log('✅ [GET /api/products] Usuario autenticado:', user.id)
    
    // Obtener productos básicos (incluyendo is_paused)
    const { data: products, error: productsError } = await supabase
      .from('activities')
      .select('*')
      .eq('coach_id', user.id)
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
      .order('created_at', { ascending: false })
    
    // Usar productos actualizados si están disponibles, sino usar los originales
    const productsToProcess = updatedProducts || products
    
    // Obtener media y estadísticas para cada producto
    const productsWithMedia = await Promise.all(
      (productsToProcess || []).map(async (product) => {
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
          
          const baseWeeksCheck = new Set(planificacionCheck?.map(p => p.numero_semana) || []).size
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
        
        // Verificar si es nutrición - usar categoria, no type
        const isNutrition = product.categoria === 'nutricion' || product.categoria === 'nutrition'
        
        if (isNutrition) {
          // Para nutrición: obtener platos ÚNICOS realmente usados en la planificación
          const activityId = product.id
          
          // Usar la planificación ya obtenida arriba (no hacer consulta duplicada)
          // Extraer todos los IDs únicos de platos de la planificación
          const uniquePlateIds = new Set<number>()
          const diasConEjercicios = new Set<string>()
          
          if (planificacion && planificacion.length > 0) {
            const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
            
            planificacion.forEach((semana: any) => {
              dias.forEach((dia: string) => {
                const diaData = semana[dia]
                if (diaData && typeof diaData === 'object') {
                  // El día puede ser un objeto con ejercicios o un array directo
                  let ejercicios: any[] = []
                  if (Array.isArray(diaData)) {
                    ejercicios = diaData
                  } else if (Array.isArray(diaData.ejercicios)) {
                    ejercicios = diaData.ejercicios
                  } else if (Array.isArray(diaData.exercises)) {
                    ejercicios = diaData.exercises
                  }
                  
                  // Extraer IDs de los ejercicios y contar días con ejercicios válidos
                  let hasValidExercise = false
                  ejercicios.forEach((ej: any) => {
                    if (ej && ej.id !== undefined && ej.id !== null) {
                      const id = typeof ej.id === 'number' ? ej.id : Number(ej.id)
                      if (!isNaN(id) && id > 0) {
                        uniquePlateIds.add(id)
                        hasValidExercise = true
                      }
                    }
                  })
                  
                  // Solo contar el día si tiene al menos un ejercicio válido
                  if (hasValidExercise) {
                    diasConEjercicios.add(dia)
                  }
                }
              })
            })
            
            exercisesCount = uniquePlateIds.size
            const diasUnicos = diasConEjercicios.size
            const periodosUnicos = periodos?.cantidad_periodos || 1
            totalSessions = diasUnicos * periodosUnicos
            
            console.log(`🥗 PRODUCTOS: Actividad ${activityId} (Nutrición) - Platos: ${exercisesCount}, Días: ${diasUnicos}, Períodos: ${periodosUnicos}, Sesiones: ${totalSessions}, Planificación encontrada: ${planificacion.length} semanas`)
          } else {
            console.log(`🥗 PRODUCTOS: Actividad ${activityId} (Nutrición) - Sin planificación encontrada`)
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
            planificacion.forEach(semana => {
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
        let cantidadTemas = 0 // Cantidad de temas únicos para el icono de rayo
        let cantidadDias = 0 // Cantidad de días (cada tema cuenta como 1 día)
        if (product.type === 'workshop') {
          try {
            // Obtener todos los temas con 'activo' y 'nombre' desde la BD para contar temas
            const { data: todosLosTemas, error: temasError } = await supabase
              .from('taller_detalles')
              .select('activo, originales, nombre')
              .eq('actividad_id', product.id)
            
            // Contar temas únicos (por nombre)
            if (todosLosTemas && todosLosTemas.length > 0) {
              const temasUnicos = new Set(todosLosTemas.map((tema: any) => tema.nombre).filter(Boolean))
              cantidadTemas = temasUnicos.size
              // Cada tema cuenta como 1 día
              cantidadDias = cantidadTemas
              
              console.log(`📊 Taller ${product.id}: ${cantidadTemas} temas únicos, ${cantidadDias} días`)
            }
            
            // Obtener 'activo' y 'originales' desde la BD (solo para estado activo)
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
                tallerActivo = false // Sin temas = inactivo (no puede estar activo sin fechas)
                console.log(`ℹ️ Taller ${product.id}: sin temas, inactivo`)
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
              // Si no hay temas, considerar como inactivo (no puede estar activo sin fechas)
              tallerActivo = false
              console.log(`ℹ️ Taller ${product.id}: sin temas, inactivo`)
            }
          } catch (error) {
            console.error(`❌ Error procesando taller ${product.id}:`, error)
            tallerActivo = false // Por defecto inactivo si hay error (más seguro)
          }
        }
        
        const finalProduct = {
          id: product.id,
          title: product.title || 'Sin título',
          name: product.title || 'Sin título', // Alias para compatibilidad
          description: product.description || 'Sin descripción',
          price: product.price || 0,
          type: product.type || 'activity',
          difficulty: product.difficulty || 'beginner',
          is_public: product.is_public || false,
          capacity: product.capacity || null,
          modality: product.modality || null,
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
          // Categoría para determinar si es nutrición
          categoria: product.categoria,
          // Tipo de dieta para productos de nutrición
          dieta: product.dieta || null,
          // Ubicación para actividades presenciales
          location_url: product.location_url,
          location_name: product.location_name,
          // Estadísticas calculadas dinámicamente
          exercisesCount: product.type === 'workshop' ? cantidadTemas : exercisesCount,
          totalSessions: product.type === 'workshop' ? cantidadDias : totalSessions,
          // Para talleres: cantidad de temas y días
          cantidadTemas: product.type === 'workshop' ? cantidadTemas : undefined,
          cantidadDias: product.type === 'workshop' ? cantidadDias : undefined,
          // Estado de pausa
          is_paused: product.is_paused || false,
          // Para talleres: estado 'activo' desde taller_detalles (indica si está disponible para nuevas ventas)
          taller_activo: product.type === 'workshop' 
            ? (tallerActivo !== null ? tallerActivo : undefined)
            : undefined,
          // Estado de finalización del taller
          is_finished: product.is_finished || false,
          finished_at: product.finished_at || null,
          is_active: product.is_active !== undefined ? product.is_active : true,
          workshop_versions: product.workshop_versions || null,
          // Obtener semanas para validar límites (semanas base * períodos)
          weeks: (() => {
            // Obtener semanas base desde planificacion_ejercicios
            const planificacionWeeks = planificacion ? new Set(planificacion.map(p => p.numero_semana || p.semana)).size : 0
            const periods = periodos?.cantidad_periodos || 1
            return planificacionWeeks * periods
          })(),
          // Razones de pausa (si está pausado por exceso de límites)
          pause_reasons: pauseReasons,
          pause_details: pauseDetails
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
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
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
      console.error('❌ Error obteniendo actividades existentes para validar cupos totales:', existingActivitiesError)
      return NextResponse.json({ error: 'No se pudo validar los cupos disponibles' }, { status: 500 })
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
    
    const totalCapacityUsed = (existingActivities || [])
      .filter((activity) => {
        if (!activity?.type) return true
        const type = activity.type.toLowerCase()
        return type !== 'document'
      })
      .reduce((sum, activity) => sum + normalizeCapacity(activity.capacity), 0)
    
    const isDocumentProduct = typeof body.modality === 'string' && body.modality.toLowerCase() === 'document'
    
    // Ajustar capacity (stock) automáticamente si excede los límites
    let adjustedCapacity = body.capacity ?? null
    
    if (isDocumentProduct) {
      adjustedCapacity = null
      console.log('ℹ️ Producto de tipo documento: la venta es ilimitada, no se aplica límite de cupos.')
    } else if (adjustedCapacity !== null && adjustedCapacity !== undefined) {
      const numericCapacity = normalizeCapacity(adjustedCapacity)
      let targetCapacity = numericCapacity
      
      if (numericCapacity > stockLimit) {
        console.log(`⚠️ Stock excede límite individual del plan ${planType}: ${numericCapacity} > ${stockLimit}. Ajustando a ${stockLimit}`)
        targetCapacity = stockLimit
      }
      
      const remainingCapacity = Math.max(totalClientsLimit - totalCapacityUsed, 0)
      if (targetCapacity > remainingCapacity) {
        console.log(
          `⚠️ Stock excede límite total de clientes (${totalClientsLimit}). Cupos usados actualmente: ${totalCapacityUsed}. Ajustando a ${remainingCapacity}`
        )
        targetCapacity = remainingCapacity
      }
      
      adjustedCapacity = Math.max(Math.floor(targetCapacity), 0)
    }
    
    // Crear producto en activities (la tabla real)
    const { data: product, error: productError } = await supabase
      .from('activities')
      .insert({
        title: body.name, // Usar title en lugar de name
        description: body.description,
        price: body.price,
        // ✅ type = tipo de producto (workshop/program/document) - solo estos 3 valores
        type: body.modality === 'workshop' ? 'workshop' : (body.modality === 'document' ? 'document' : 'program'),
        // ✅ modality = modalidad (online/presencial/híbrido)
        modality: body.type || 'online',
        // ✅ categoria = fitness o nutricion (no confundir con type)
        categoria: body.categoria || 'fitness',
        difficulty: body.level, // Usar difficulty en lugar de level
        is_public: body.is_public,
        capacity: adjustedCapacity,
        // stockQuantity no existe en la tabla activities
        coach_id: user.id,
        // ✅ GUARDAR TIPO DE DIETA
        dieta: body.dieta || null,
        // ✅ GUARDAR OBJETIVOS EN workshop_type como JSON
        workshop_type: body.objetivos && Array.isArray(body.objetivos) && body.objetivos.length > 0
          ? JSON.stringify(body.objetivos)
          : (body.workshop_type || (body.modality === 'workshop' ? 'general' : null)),
        // ✅ Campos de ubicación para modalidad presencial
        location_name: body.location_name || null,
        location_url: body.location_url || null,
        // ✅ NUEVO: Días para acceder al producto
        dias_acceso: body.dias_acceso || 30
      })
      .select()
      .single()
    
    if (productError) {
      return NextResponse.json({ error: productError.message }, { status: 500 })
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
        
        if (session.isPrimary) {
          topic.originales.push(horarioItem)
        } else {
          topic.secundarios.push(horarioItem)
        }
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
        const { error: topicError } = await supabase
          .from('taller_detalles')
          .insert({
            actividad_id: product.id,
            nombre: topicData.nombre || 'Sin título',
            descripcion: topicData.descripcion || '',
            originales: originalesJson,
            secundarios: secundariosJson,
            activo: hasFutureDates // Activo solo si hay fechas futuras
          })
        
        if (topicError) {
          console.error('❌ Error creando tema en taller_detalles:', topicError)
        } else {
        }
      }
    }
    
    // Devolver formato esperado por el modal
    return NextResponse.json({ 
      success: true, 
      productId: product.id,
      product: product 
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
      console.error('❌ Error obteniendo actividades existentes para validar cupos totales:', existingActivitiesError)
      return NextResponse.json({ error: 'No se pudo validar los cupos disponibles' }, { status: 500 })
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
    
    const otherCapacityUsed = (existingActivities || [])
      .filter((activity) => activity.id !== body.editingProductId)
      .filter((activity) => {
        if (!activity?.type) return true
        const type = activity.type.toLowerCase()
        return type !== 'document'
      })
      .reduce((sum, activity) => sum + normalizeCapacity(activity.capacity), 0)
    
    // Ajustar capacity (stock) automáticamente si excede los límites
    console.log('📊 [PUT /api/products] Recepción de capacidad:', {
      capacityFromBody: body.capacity,
      capacityType: typeof body.capacity,
      isNull: body.capacity === null,
      isUndefined: body.capacity === undefined,
      editingProductId: body.editingProductId,
      isDocumentProduct
    })
    
    let adjustedCapacity = body.capacity ?? null
    
    if (isDocumentProduct) {
      adjustedCapacity = null
      console.log(`ℹ️ Producto ${body.editingProductId} de tipo documento: la venta es ilimitada, no se aplica límite de cupos.`)
    } else if (adjustedCapacity !== null && adjustedCapacity !== undefined) {
      const numericCapacity = normalizeCapacity(adjustedCapacity)
      let targetCapacity = numericCapacity
      
      if (numericCapacity > stockLimit) {
        console.log(`⚠️ Stock excede límite individual del plan ${planType}: ${numericCapacity} > ${stockLimit}. Ajustando a ${stockLimit}`)
        targetCapacity = stockLimit
      }
      
      const remainingCapacity = Math.max(totalClientsLimit - otherCapacityUsed, 0)
      if (targetCapacity > remainingCapacity) {
        console.log(
          `⚠️ Stock excede límite total de clientes (${totalClientsLimit}). Cupos usados por otros productos: ${otherCapacityUsed}. Ajustando a ${remainingCapacity}`
        )
        targetCapacity = remainingCapacity
      }
      
      adjustedCapacity = Math.max(Math.floor(targetCapacity), 0)
      
      // Si el resultado es 0, convertir a null para evitar violar check_capacity_positive
      if (adjustedCapacity === 0) {
        adjustedCapacity = null
        console.log(`ℹ️ Capacity ajustada a null (era 0) para evitar violar constraint check_capacity_positive`)
      }
    }
    
    // Obtener producto actual ANTES de actualizarlo para comparar cambios
    const { data: productoActual, error: productoActualError } = await supabase
      .from('activities')
      .select('title, description, price, type, modality, categoria, difficulty, is_public, capacity, dieta, workshop_type, location_name, location_url, dias_acceso, is_finished, workshop_versions, created_at')
      .eq('id', body.editingProductId)
      .eq('coach_id', user.id)
      .single()
    
    if (productoActualError) {
      console.error('❌ Error obteniendo producto actual:', productoActualError)
      return NextResponse.json({ error: 'No se pudo obtener el producto actual' }, { status: 500 })
    }
    
    // Comparar campos para detectar si hay cambios además de las fechas
    const objetivosActual = productoActual?.workshop_type ? 
      (() => {
        try {
          const parsed = typeof productoActual.workshop_type === 'string' 
            ? JSON.parse(productoActual.workshop_type) 
            : productoActual.workshop_type
          return Array.isArray(parsed) ? parsed : (parsed?.objetivos ? String(parsed.objetivos).split(';') : [])
        } catch {
          return []
        }
      })() : []
    
    const objetivosNuevos = body.objetivos && Array.isArray(body.objetivos) && body.objetivos.length > 0
      ? body.objetivos
      : []
    
    const hayCambiosEnOtrosCampos = (
      productoActual?.title !== body.name ||
      productoActual?.description !== body.description ||
      productoActual?.price !== body.price ||
      productoActual?.type !== (body.modality === 'workshop' ? 'workshop' : (body.modality === 'document' ? 'document' : 'program')) ||
      productoActual?.modality !== (body.type || 'online') ||
      productoActual?.categoria !== (body.categoria || 'fitness') ||
      productoActual?.difficulty !== body.level ||
      productoActual?.is_public !== body.is_public ||
      productoActual?.capacity !== adjustedCapacity ||
      productoActual?.dieta !== (body.dieta || null) ||
      JSON.stringify(objetivosActual.sort()) !== JSON.stringify(objetivosNuevos.sort()) ||
      productoActual?.location_name !== (body.location_name || null) ||
      productoActual?.location_url !== (body.location_url || null) ||
      productoActual?.dias_acceso !== (body.dias_acceso || 30)
    )
    
    // Actualizar producto en activities
    console.log('💾 [PUT /api/products] Actualizando capacidad:', {
      capacityFromBody: body.capacity,
      adjustedCapacity,
      editingProductId: body.editingProductId,
      capacityType: typeof body.capacity,
      willUpdate: adjustedCapacity !== null && adjustedCapacity !== undefined
    })
    
    const { data: product, error: productError } = await supabase
      .from('activities')
      .update({
        title: body.name,
        description: body.description,
        price: body.price,
        // ✅ type = tipo de producto (workshop/program/document) - solo estos 3 valores
        type: body.modality === 'workshop' ? 'workshop' : (body.modality === 'document' ? 'document' : 'program'),
        // ✅ modality = modalidad (online/presencial/híbrido)
        modality: body.type || 'online',
        // ✅ categoria = fitness o nutricion (no confundir con type)
        categoria: body.categoria || 'fitness',
        difficulty: body.level,
        is_public: body.is_public,
        capacity: adjustedCapacity,
        // ✅ ACTUALIZAR TIPO DE DIETA
        dieta: body.dieta || null,
        // ✅ GUARDAR OBJETIVOS EN workshop_type como JSON
        workshop_type: body.objetivos && Array.isArray(body.objetivos) && body.objetivos.length > 0
          ? JSON.stringify(body.objetivos)
          : (body.workshop_type || (body.modality === 'workshop' ? 'general' : null)),
        // ✅ Campos de ubicación para modalidad presencial
        location_name: body.location_name || null,
        location_url: body.location_url || null,
        // ✅ NUEVO: Días para acceder al producto
        dias_acceso: body.dias_acceso || 30
      })
      .eq('id', body.editingProductId)
      .eq('coach_id', user.id) // Seguridad: solo el coach dueño puede actualizar
      .select()
      .single()
    
    if (productError) {
      console.error('❌ Error actualizando producto:', productError)
      return NextResponse.json({ error: productError.message }, { status: 500 })
    }
    
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
      
      console.log('🔄 Procesando horarios de taller - REEMPLAZANDO fechas anteriores')
      
      // 1. Crear nueva versión SOLO si hay cambios en otros campos además de las fechas
      let nuevaVersionCreada = false
      if (productoActual) {
        // Solo crear nueva versión si:
        // - El taller está finalizado Y
        // - Hay cambios en otros campos además de las fechas
        if (productoActual.is_finished === true && hayCambiosEnOtrosCampos) {
          const currentVersions = productoActual.workshop_versions?.versions || []
          const nextVersion = currentVersions.length + 1
          
          // Obtener la fecha de inicio (created_at de la actividad o fecha de la última versión)
          const fechaInicio = productoActual.created_at
          
          // Obtener la fecha de finalización (finished_at o usar la fecha actual)
          const fechaFin = new Date().toISOString()
          
          // Función helper para formatear fecha a dd/mm/aa (español)
          const formatDateSpanish = (date: string | Date) => {
            const d = typeof date === 'string' ? new Date(date) : date
            const day = String(d.getDate()).padStart(2, '0')
            const month = String(d.getMonth() + 1).padStart(2, '0')
            const year = String(d.getFullYear()).slice(-2)
            return `${day}/${month}/${year}`
          }
          
          const newVersion = {
            version: nextVersion,
            empezada_el: formatDateSpanish(fechaInicio),
            finalizada_el: formatDateSpanish(fechaFin)
          }
          
          const updatedVersions = {
            versions: [...currentVersions, newVersion]
          }
          
          // Actualizar workshop_versions en activities (NO reactivar automáticamente - el coach debe hacerlo manualmente)
          const { error: versionError } = await supabase
            .from('activities')
            .update({
              workshop_versions: updatedVersions
              // NO cambiar is_finished ni finished_at - el coach debe reactivar manualmente
            })
            .eq('id', body.editingProductId)
          
          if (versionError) {
            console.error('❌ Error creando nueva versión:', versionError)
          } else {
            console.log(`✅ Nueva versión ${nextVersion} creada para el taller (hay cambios en otros campos). El coach debe reactivar manualmente las ventas.`)
            nuevaVersionCreada = true
          }
        } else if (productoActual.is_finished === true && !hayCambiosEnOtrosCampos) {
          // Solo cambiar fechas: actualizar fechas sin crear nueva versión
          console.log('📅 Solo se actualizan fechas, NO se crea nueva versión. El coach debe reactivar manualmente las ventas.')
          // NO reactivar automáticamente - el coach debe hacerlo manualmente con el botón
        }
      }
      
      // 2. Obtener temas existentes (NO eliminar todavía)
      const actividadId = parseInt(String(body.editingProductId))
      
      console.log(`🔍 Obteniendo temas existentes para actividad_id: ${actividadId} (tipo: ${typeof actividadId})`)
      
      if (isNaN(actividadId)) {
        console.error('❌ ID de actividad inválido:', body.editingProductId)
        return NextResponse.json({ 
          error: 'ID de actividad inválido', 
          details: `El ID "${body.editingProductId}" no es un número válido`
        }, { status: 400 })
      }
      
      // Seleccionar solo las columnas que definitivamente existen
      const { data: temasExistentes, error: fetchError } = await supabaseService
        .from('taller_detalles')
        .select('id, nombre, descripcion, originales, activo')
        .eq('actividad_id', actividadId)
      
      if (fetchError) {
        console.error('❌ Error obteniendo temas existentes:', fetchError)
        console.error('❌ Detalles del error:', JSON.stringify(fetchError, null, 2))
        console.error('❌ actividad_id usado:', actividadId)
        return NextResponse.json({ 
          error: 'Error al obtener temas existentes', 
          details: fetchError.message || 'Error desconocido al consultar la base de datos'
        }, { status: 500 })
      }
      
      console.log(`📋 Temas existentes encontrados: ${temasExistentes?.length || 0}`)
      if (temasExistentes && temasExistentes.length > 0) {
        console.log(`📋 Nombres de temas: ${temasExistentes.map((t: any) => t.nombre).join(', ')}`)
      }
      
      // 3. Agrupar sesiones NUEVAS por tema
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
        
        // Si no tiene isPrimary definido, por defecto va a originales
        // Solo va a secundarios si explícitamente isPrimary === false
        if (session.isPrimary === false) {
          topic.secundarios.push(horarioItem)
        } else {
          topic.originales.push(horarioItem)
        }
      }
      
      // 4. Verificar si hay fechas futuras en los temas nuevos para determinar si el taller está activo
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      let hasAnyFutureDates = false
      
      // Verificar fechas futuras en temas nuevos (tanto en originales como en secundarios)
      for (const [topicTitle, topicData] of topicGroups) {
        const allHorarios = [...topicData.originales, ...topicData.secundarios]
        const hasFutureDates = allHorarios.some((horario: any) => {
          const fecha = new Date(horario.fecha)
          fecha.setHours(0, 0, 0, 0)
          return fecha >= now
        })
        if (hasFutureDates) {
          hasAnyFutureDates = true
          break
        }
      }
      
      // 5. Procesar temas: UPDATE de existentes, INSERT de nuevos
      const temasActualizadosIds: number[] = []
      const temasInsertadosIds: number[] = []
      const temasNombresProcesados = new Set<string>()
      let primerError: any = null
      
      // Crear mapa de temas existentes por nombre para búsqueda rápida
      const temasExistentesMap = new Map<string, any>()
      temasExistentes?.forEach((tema: any) => {
        temasExistentesMap.set(tema.nombre, tema)
      })
      
      for (const [topicTitle, topicData] of topicGroups) {
        // Validar que el tema tenga al menos un horario
        if (topicData.originales.length === 0 && topicData.secundarios.length === 0) {
          console.error('❌ Error: Tema sin horarios:', topicTitle)
          primerError = new Error(`El tema "${topicTitle}" no tiene horarios asignados`)
          continue
        }
        
        // Si originales está vacío pero secundarios tiene datos, moverlos a originales
        if (topicData.originales.length === 0 && topicData.secundarios.length > 0) {
          console.warn(`⚠️ Tema "${topicTitle}" tiene horarios solo en secundarios, moviendo a originales`)
          topicData.originales = [...topicData.secundarios]
          topicData.secundarios = []
        }
        
        const originalesJson = {
          fechas_horarios: topicData.originales
        }
        
        const secundariosJson = {
          fechas_horarios: topicData.secundarios
        }
        
        const temaExistente = temasExistentesMap.get(topicTitle)
        
        if (temaExistente) {
          // ACTUALIZAR tema existente
          console.log('🔄 Actualizando tema existente:', topicTitle)
          
          // Preparar objeto de actualización - intentar incluir secundarios pero manejarlo si falla
          // NO cambiar 'activo' automáticamente - mantener el valor actual (el coach debe activarlo manualmente)
          const updateData: any = {
            descripcion: topicData.descripcion || '',
            originales: originalesJson,
            // Mantener el valor actual de 'activo' del tema existente - NO reactivar automáticamente
            activo: temaExistente.activo !== undefined ? temaExistente.activo : false,
            updated_at: new Date().toISOString()
          }
          
          // Solo agregar secundarios si tiene datos (evitar problemas si la columna no existe)
          if (secundariosJson.fechas_horarios && secundariosJson.fechas_horarios.length > 0) {
            updateData.secundarios = secundariosJson
          }
          
          console.log('🔄 Actualizando tema con datos:', JSON.stringify(updateData, null, 2))
          
          const { data: updatedData, error: updateError } = await supabaseService
            .from('taller_detalles')
            .update(updateData)
            .eq('id', temaExistente.id)
            .select()
          
          if (updateError) {
            console.error('❌ Error actualizando tema:', topicTitle)
            console.error('❌ Error completo:', JSON.stringify(updateError, null, 2))
            console.error('❌ Código del error:', updateError.code)
            console.error('❌ Mensaje del error:', updateError.message)
            console.error('❌ Detalles del error:', updateError.details)
            console.error('❌ Hint del error:', updateError.hint)
            console.error('❌ Datos que intentaron actualizarse:', JSON.stringify(updateData, null, 2))
            if (!primerError) {
              primerError = updateError
            }
          } else {
            console.log('✅ Tema actualizado:', topicTitle)
            temasActualizadosIds.push(temaExistente.id)
            temasNombresProcesados.add(topicTitle)
          }
        } else {
          // INSERTAR tema nuevo
          console.log('➕ Insertando tema nuevo:', topicTitle)
          
          const topicInsert = {
            actividad_id: actividadId,
            nombre: topicData.nombre || 'Sin título',
            descripcion: topicData.descripcion || '',
            originales: originalesJson,
            secundarios: secundariosJson,
            activo: false // NO reactivar automáticamente - el coach debe activarlo manualmente
          }
          
          const { data: insertedData, error: insertError } = await supabaseService
            .from('taller_detalles')
            .insert(topicInsert)
            .select()
          
          if (insertError) {
            console.error('❌ Error insertando tema:', topicTitle, insertError)
            console.error('❌ Detalles del error:', JSON.stringify(insertError, null, 2))
            if (!primerError) {
              primerError = insertError
            }
          } else {
            console.log('✅ Tema insertado:', topicTitle)
            if (insertedData && insertedData.length > 0) {
              insertedData.forEach((item: any) => {
                if (item.id) {
                  temasInsertadosIds.push(item.id)
                }
              })
            }
            temasNombresProcesados.add(topicTitle)
          }
        }
      }
      
      // 6. Si hubo errores, NO eliminar nada y retornar error
      if (primerError) {
        console.error('❌ Hubo errores al procesar temas. NO se eliminarán temas existentes.')
        console.error('❌ Error completo:', JSON.stringify(primerError, null, 2))
        console.error('❌ Temas procesados exitosamente:', temasNombresProcesados.size)
        console.error('❌ Temas actualizados:', temasActualizadosIds.length)
        console.error('❌ Temas insertados:', temasInsertadosIds.length)
        return NextResponse.json({ 
          error: 'Error al procesar temas. Los temas originales se mantienen intactos.', 
          details: primerError?.message || primerError?.details || JSON.stringify(primerError) || 'Error desconocido',
          errorCode: primerError?.code,
          errorHint: primerError?.hint
        }, { status: 500 })
      }
      
      // 7. SOLO AHORA, después de que todo fue exitoso, eliminar temas que ya no están en el nuevo schedule
      const temasParaEliminar = temasExistentes?.filter((tema: any) => 
        !temasNombresProcesados.has(tema.nombre)
      ) || []
      
      if (temasParaEliminar.length > 0) {
        console.log(`🗑️ Eliminando ${temasParaEliminar.length} temas que ya no están en el nuevo schedule...`)
        const idsParaEliminar = temasParaEliminar.map((t: any) => t.id)
        
        const { error: deleteError } = await supabaseService
          .from('taller_detalles')
          .delete()
          .in('id', idsParaEliminar)
        
        if (deleteError) {
          console.error('❌ Error eliminando temas obsoletos:', deleteError)
          // No es crítico, los temas nuevos ya están insertados
        } else {
          console.log(`✅ ${temasParaEliminar.length} temas obsoletos eliminados`)
        }
      }
      
      console.log(`✅ Proceso completado: ${temasActualizadosIds.length} temas actualizados, ${temasInsertadosIds.length} temas insertados.`)
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