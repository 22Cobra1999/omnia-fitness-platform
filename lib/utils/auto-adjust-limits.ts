import { createClient } from '@supabase/supabase-js'
import { getPlanLimit, PlanType } from './plan-limits'

/**
 * Verifica si un taller está finalizado (todas sus fechas ya pasaron)
 */
export async function isWorkshopFinished(
  supabaseService: any,
  activityId: number
): Promise<boolean> {
  try {
    // Obtener detalles del taller
    const { data: tallerDetalles, error: tallerError } = await supabaseService
      .from('taller_detalles')
      .select('originales')
      .eq('actividad_id', activityId)

    if (tallerError || !tallerDetalles || tallerDetalles.length === 0) {
      return false // Si no hay detalles, no está finalizado
    }

    // Extraer todas las fechas de todos los temas
    const allDates: string[] = []
    tallerDetalles.forEach((tema: any) => {
      try {
        // Manejar caso donde originales puede ser string JSON o objeto
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
      } catch (error) {
        console.error(`Error procesando tema ${tema.id}:`, error)
      }
    })
    
    console.log(`📅 Taller ${activityId}: Fechas encontradas:`, allDates)

    if (allDates.length === 0) {
      return true // Si no hay fechas, está finalizado
    }

    // Verificar si la última fecha ya pasó (comparar solo fechas, sin horas)
    const now = new Date()
    now.setHours(0, 0, 0, 0) // Resetear horas para comparar solo fechas
    
    const lastDate = new Date(Math.max(...allDates.map((date: string) => new Date(date).getTime())))
    lastDate.setHours(0, 0, 0, 0) // Resetear horas para comparar solo fechas
    
    const isFinished = lastDate < now
    console.log(`📅 Taller ${activityId}: Última fecha: ${lastDate.toISOString().split('T')[0]}, Hoy: ${now.toISOString().split('T')[0]}, Finalizado: ${isFinished}`)
    
    // Si la última fecha es anterior a hoy, el taller está finalizado
    return isFinished
  } catch (error) {
    console.error('Error verificando si taller está finalizado:', error)
    return false
  }
}

/**
 * Actualiza automáticamente el estado 'activo' en taller_detalles para talleres finalizados
 * Todos los temas de un taller deben tener el mismo valor de 'activo'
 */
export async function updateFinishedWorkshops(coachId: string): Promise<{ updated: number }> {
  try {
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    console.log(`🔍 [updateFinishedWorkshops] Verificando talleres finalizados para coach: ${coachId}`)
    
    // Obtener todos los talleres del coach
    const { data: workshops, error: workshopsError } = await supabaseService
      .from('activities')
      .select('id, type, title')
      .eq('coach_id', coachId)
      .eq('type', 'workshop')
    
    if (workshopsError) {
      console.error('❌ Error obteniendo talleres:', workshopsError)
      return { updated: 0 }
    }
    
    if (!workshops || workshops.length === 0) {
      console.log('ℹ️ [updateFinishedWorkshops] No hay talleres para verificar')
      return { updated: 0 }
    }
    
    console.log(`📋 [updateFinishedWorkshops] Encontrados ${workshops.length} talleres para verificar`)
    
    let updatedCount = 0
    
    // Verificar cada taller y actualizar 'activo' en taller_detalles si está finalizado
    for (const workshop of workshops) {
      console.log(`🔍 [updateFinishedWorkshops] Verificando taller: ${workshop.title} (ID: ${workshop.id})`)
      const isFinished = await isWorkshopFinished(supabaseService, workshop.id)
      
      // Verificar el estado actual de 'activo' en taller_detalles
      // Si la columna no existe, intentar crearla o usar lógica de fechas
      let activoActual: boolean | null = null
      let columnaExiste = false
      
      try {
        const { data: temasActuales, error: temasError } = await supabaseService
          .from('taller_detalles')
          .select('id, activo')
          .eq('actividad_id', workshop.id)
          .limit(1)
        
        if (temasError) {
          // Si hay error, probablemente la columna no existe
          console.warn(`⚠️ [updateFinishedWorkshops] Columna 'activo' no existe o error obteniendo temas del taller ${workshop.id}:`, temasError.message)
          columnaExiste = false
        } else if (temasActuales && temasActuales.length > 0) {
          columnaExiste = true
          activoActual = temasActuales[0].activo
        } else {
          console.log(`ℹ️ [updateFinishedWorkshops] Taller ${workshop.id} no tiene temas`)
          continue
        }
      } catch (error) {
        console.warn(`⚠️ [updateFinishedWorkshops] Error verificando columna 'activo' para taller ${workshop.id}:`, error)
        columnaExiste = false
      }
      
      if (isFinished) {
        // Si está finalizado, desactivarlo (si la columna existe)
        if (columnaExiste) {
          if (activoActual === true) {
            console.log(`⏸️ [updateFinishedWorkshops] Taller ${workshop.id} (${workshop.title}) está finalizado - desactivando...`)
            
            // Actualizar TODOS los temas del taller a activo = false
            const { error: updateError } = await supabaseService
              .from('taller_detalles')
              .update({
                activo: false,
                updated_at: new Date().toISOString()
              })
              .eq('actividad_id', workshop.id)
            
            if (!updateError) {
              console.log(`✅ [updateFinishedWorkshops] Taller ${workshop.id} (${workshop.title}) desactivado - todos los temas marcados como inactivos`)
              updatedCount++
            } else {
              console.error(`❌ [updateFinishedWorkshops] Error desactivando taller ${workshop.id}:`, updateError)
            }
          } else {
            console.log(`ℹ️ [updateFinishedWorkshops] Taller ${workshop.id} (${workshop.title}) ya está desactivado`)
          }
        } else {
          console.log(`⚠️ [updateFinishedWorkshops] Taller ${workshop.id} (${workshop.title}) está finalizado pero la columna 'activo' no existe. Ejecuta la migración SQL.`)
        }
      } else {
        // Si NO está finalizado pero está desactivado, reactivarlo (por si se agregaron nuevas fechas)
        if (columnaExiste) {
          if (activoActual === false) {
            console.log(`🔄 [updateFinishedWorkshops] Taller ${workshop.id} (${workshop.title}) tiene fechas futuras - reactivando...`)
            
            // Actualizar TODOS los temas del taller a activo = true
            const { error: updateError } = await supabaseService
              .from('taller_detalles')
              .update({
                activo: true,
                updated_at: new Date().toISOString()
              })
              .eq('actividad_id', workshop.id)
            
            if (!updateError) {
              console.log(`✅ [updateFinishedWorkshops] Taller ${workshop.id} (${workshop.title}) reactivado - todos los temas marcados como activos`)
              updatedCount++
            } else {
              console.error(`❌ [updateFinishedWorkshops] Error reactivando taller ${workshop.id}:`, updateError)
            }
          } else {
            console.log(`✅ [updateFinishedWorkshops] Taller ${workshop.id} (${workshop.title}) está activo y tiene fechas pendientes`)
          }
        }
      }
    }
    
    console.log(`📊 [updateFinishedWorkshops] Total de talleres actualizados: ${updatedCount}`)
    return { updated: updatedCount }
  } catch (error) {
    console.error('❌ [updateFinishedWorkshops] Error:', error)
    return { updated: 0 }
  }
}

/**
 * Ajusta automáticamente el capacity (stock) de un producto si excede el límite del plan
 */
export async function adjustProductCapacityIfNeeded(
  coachId: string,
  productId: number,
  currentCapacity: number | null
): Promise<number | null> {
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
    
    const planType = (plan?.plan_type || 'free') as PlanType
    const stockLimit = getPlanLimit(planType, 'stockPerProduct')
    const totalClientsLimit = getPlanLimit(planType, 'totalClients')
    
    console.log(`🔍 adjustProductCapacityIfNeeded: Producto ${productId}, capacity: ${currentCapacity}, límite individual: ${stockLimit}, límite total: ${totalClientsLimit} (plan: ${planType})`)
    
    // Si no hay capacity definido o es null, no hacer nada
    if (currentCapacity === null || currentCapacity === undefined) {
      console.log(`ℹ️ Producto ${productId}: capacity es null/undefined, no se ajusta`)
      return currentCapacity
    }
    
    // Convertir a número si es string
    const capacityNumber = typeof currentCapacity === 'string' ? parseFloat(currentCapacity) : currentCapacity
    
    if (isNaN(capacityNumber)) {
      console.log(`⚠️ Producto ${productId}: capacity no es un número válido: ${currentCapacity}`)
      return currentCapacity
    }
    const { data: coachProducts, error: productsError } = await supabaseService
      .from('activities')
      .select('id, capacity, type')
      .eq('coach_id', coachId)
    
    if (productsError) {
      console.error('❌ Error obteniendo productos del coach para validar capacidad total:', productsError)
      return currentCapacity
    }
    
    const isDocumentProduct = coachProducts?.some(
      (product) => product.id === productId && typeof product.type === 'string' && product.type.toLowerCase() === 'document'
    )
    
    if (isDocumentProduct) {
      console.log(`ℹ️ Producto ${productId} es un documento. Se omite validación de cupos totales.`)
      return currentCapacity
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
    
    const otherCapacitySum = (coachProducts || [])
      .filter((product) => product.id !== productId)
      .filter((product) => {
        if (!product?.type) return true
        const type = product.type.toLowerCase()
        return type !== 'document'
      })
      .reduce((sum, product) => sum + normalizeCapacity(product.capacity), 0)
    
    const maxAllowedByTotal = Math.max(totalClientsLimit - otherCapacitySum, 0)
    let targetCapacity = capacityNumber
    let capacityAdjusted = false
    
    if (targetCapacity > stockLimit) {
      console.log(`⚠️ Producto ${productId} excede límite individual: ${targetCapacity} > ${stockLimit} (plan: ${planType}). Ajustando a ${stockLimit}`)
      targetCapacity = stockLimit
      capacityAdjusted = true
    }
    
    if (targetCapacity > maxAllowedByTotal) {
      console.log(
        `⚠️ Producto ${productId} excede límite total de clientes: ${targetCapacity} + otros ${otherCapacitySum} > ${totalClientsLimit}. Ajustando a ${maxAllowedByTotal}`
      )
      targetCapacity = maxAllowedByTotal
      capacityAdjusted = true
    }
    
    if (!capacityAdjusted) {
      console.log(`✅ Producto ${productId}: capacity ${capacityNumber} está dentro de los límites (individual y total).`)
      return currentCapacity
    }
    
    const sanitizedTarget = Math.max(Math.floor(targetCapacity), 0)
    
    const { data: updatedProduct, error } = await supabaseService
      .from('activities')
      .update({ 
        capacity: sanitizedTarget,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .eq('coach_id', coachId)
      .select('capacity')
      .single()
    
    if (error) {
      console.error(`❌ Error ajustando capacity del producto ${productId}:`, error)
      return currentCapacity // Retornar el valor original si falla
    }
    
    console.log(`✅ Producto ${productId}: capacity actualizado exitosamente de ${capacityNumber} a ${sanitizedTarget}. BD confirma: ${updatedProduct?.capacity}`)
    return sanitizedTarget
  } catch (error) {
    console.error('Error en adjustProductCapacityIfNeeded:', error)
    return currentCapacity
  }
}

/**
 * Verifica si un producto excede los límites del plan y lo pausa automáticamente si es necesario
 * NOTA: El exceso de stock (cupos) NO pausa, solo se ajusta automáticamente
 */
export async function checkAndPauseProductIfExceedsLimits(
  coachId: string,
  productId: number,
  categoria: string
): Promise<{ paused: boolean; reasons: string[]; details: { activitiesCount?: number; activitiesLimit?: number; weeksCount?: number; weeksLimit?: number } }> {
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
    
    const planType = (plan?.plan_type || 'free') as PlanType
    const activitiesLimit = getPlanLimit(planType, 'activitiesPerProduct')
    const weeksLimit = getPlanLimit(planType, 'weeksPerProduct')
    
    const isNutrition = categoria === 'nutricion' || categoria === 'nutrition'
    const tableName = isNutrition ? 'nutrition_program_details' : 'ejercicios_detalles'
    const activityIdField = 'activity_id'
    
    // Contar actividades actuales
    let activitiesCount = 0
    if (tableName === 'ejercicios_detalles') {
      const { count } = await supabaseService
        .from('ejercicios_detalles')
        .select('id', { count: 'exact', head: true })
        .contains('activity_id', { [productId]: {} })
      activitiesCount = count || 0
    } else {
      const { count } = await supabaseService
        .from(tableName)
        .select('id', { count: 'exact', head: true })
        .eq(activityIdField, productId)
      activitiesCount = count || 0
    }
    
    // Obtener semanas del producto: semanas base * períodos
    const { data: planificacion } = await supabaseService
      .from('planificacion_ejercicios')
      .select('numero_semana')
      .eq('actividad_id', productId)
    
    const baseWeeks = new Set(planificacion?.map(p => p.numero_semana) || []).size
    
    const { data: periodos } = await supabaseService
      .from('periodos')
      .select('cantidad_periodos')
      .eq('actividad_id', productId)
      .maybeSingle()
    
    const periods = periodos?.cantidad_periodos || 1
    const weeksCount = baseWeeks * periods
    
    const reasons: string[] = []
    let shouldPause = false
    
    const details = {
      activitiesCount,
      activitiesLimit,
      weeksCount,
      weeksLimit
    }
    
    // Verificar si excede límites (solo actividades y semanas pausan, NO el stock)
    if (activitiesCount > activitiesLimit) {
      reasons.push(`Exceso de ${isNutrition ? 'platos' : 'ejercicios'}: ${activitiesCount} (límite: ${activitiesLimit})`)
      shouldPause = true
    }
    
    if (weeksCount > weeksLimit) {
      reasons.push(`Exceso de semanas: ${weeksCount} (límite: ${weeksLimit})`)
      shouldPause = true
    }
    
    // Si debe pausarse, actualizar el producto
    if (shouldPause) {
      const { error: pauseError } = await supabaseService
        .from('activities')
        .update({ 
          is_paused: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
        .eq('coach_id', coachId)
      
      if (pauseError) {
        console.error('Error pausando producto por exceso de límites:', pauseError)
        return { paused: false, reasons: [], details }
      }
      
      console.log(`⚠️ Producto ${productId} pausado automáticamente por exceder límites:`, reasons.join(', '))
      return { paused: true, reasons, details }
    }
    
    return { paused: false, reasons: [], details }
  } catch (error) {
    console.error('Error en checkAndPauseProductIfExceedsLimits:', error)
    return { paused: false, reasons: [], details: {} }
  }
}

/**
 * Ajusta automáticamente la cantidad de actividades (ejercicios/platos) si exceden el límite del plan
 */
export async function adjustProductActivitiesIfNeeded(
  coachId: string,
  productId: number,
  categoria: string
): Promise<{ adjusted: boolean; removedCount: number }> {
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
    
    const planType = (plan?.plan_type || 'free') as PlanType
    const activitiesLimit = getPlanLimit(planType, 'activitiesPerProduct')
    
    const isNutrition = categoria === 'nutricion' || categoria === 'nutrition'
    
    // Determinar qué tabla usar
    const tableName = isNutrition ? 'nutrition_program_details' : 'ejercicios_detalles'
    const activityIdField = isNutrition ? 'activity_id' : 'activity_id'
    
    // Contar actividades actuales
    let activities: { id: number; created_at: string | null }[] | null = null
    let countError = null

    if (tableName === 'ejercicios_detalles') {
      const { data, error } = await supabaseService
        .from('ejercicios_detalles')
        .select('id, created_at')
        .contains('activity_id', { [productId]: {} })
        .order('created_at', { ascending: false })
      activities = data || null
      countError = error
    } else {
      const { data, error } = await supabaseService
        .from(tableName)
        .select('id, created_at')
        .eq(activityIdField, productId)
        .order('created_at', { ascending: false })
      activities = data || null
      countError = error
    }

    if (countError) {
      console.error('Error contando actividades:', countError)
      return { adjusted: false, removedCount: 0 }
    }
    
    const currentCount = activities?.length || 0
    
    // Si excede el límite, eliminar las más recientes
    if (currentCount > activitiesLimit) {
      const activitiesToRemove = activities.slice(activitiesLimit)
      const idsToRemove = activitiesToRemove.map(a => a.id)
      
      console.log(`⚠️ Producto ${productId} excede límite de actividades: ${currentCount} > ${activitiesLimit}. Eliminando ${idsToRemove.length} actividades más recientes`)
      
      // Eliminar las actividades más recientes que exceden el límite
      const { error: deleteError } = await supabaseService
        .from(tableName)
        .delete()
        .in('id', idsToRemove)
      
      if (deleteError) {
        console.error('Error eliminando actividades excedentes:', deleteError)
        return { adjusted: false, removedCount: 0 }
      }
      
      return { adjusted: true, removedCount: idsToRemove.length }
    }
    
    return { adjusted: false, removedCount: 0 }
  } catch (error) {
    console.error('Error en adjustProductActivitiesIfNeeded:', error)
    return { adjusted: false, removedCount: 0 }
  }
}

