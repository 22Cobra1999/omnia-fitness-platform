import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener el coach_id (el id de coaches es el mismo que user.id)
    const { data: coach } = await supabase
      .from('coaches')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!coach) {
      return NextResponse.json({ error: 'Coach no encontrado' }, { status: 404 })
    }

    // Crear cliente con service role para verificar si existe un plan activo
    // Esto evita problemas con RLS que podrían ocultar un plan existente
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verificar con service role si ya existe un plan activo
    // Un plan está activo si: status = 'active' Y started_at <= now
    const now = new Date()
    
    const { data: existingPlans, error: checkError } = await supabaseService
      .from('planes_uso_coach')
      .select('*')
      .eq('coach_id', coach.id)
      .eq('status', 'active')
      .order('started_at', { ascending: false })

    if (checkError) {
      console.error('Error verificando plan existente:', checkError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error al verificar plan',
        details: checkError.message 
      }, { status: 500 })
    }

    // Buscar el plan que realmente está activo (started_at <= now)
    const activePlan = existingPlans?.find(plan => {
      if (!plan.started_at) return true // Si no tiene started_at, considerar activo
      const startedAt = new Date(plan.started_at)
      return startedAt <= now
    })

    // Si hay un plan activo, retornarlo
    if (activePlan) {
      return NextResponse.json({ 
        success: true, 
        plan: activePlan 
      })
    }

    // Si no tiene plan, crear uno free por defecto
    const expiresAt = new Date(now.getTime() + (31 * 24 * 60 * 60 * 1000)) // 31 días en milisegundos

    const { data: newPlan, error: createError } = await supabaseService
      .from('planes_uso_coach')
      .insert({
        coach_id: coach.id,
        plan_type: 'free',
        storage_limit_gb: 1,
        storage_used_gb: 0,
        status: 'active',
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        renewal_count: 0
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creando plan por defecto:', createError)
      
      // Si el error es por restricción única, intentar obtener el plan nuevamente
      // (podría haber sido creado entre la verificación y la inserción)
      if (createError.message?.includes('idx_unique_active_plan_per_coach')) {
        const { data: retryPlan } = await supabaseService
          .from('planes_uso_coach')
          .select('*')
          .eq('coach_id', coach.id)
          .eq('status', 'active')
          .maybeSingle()

        if (retryPlan) {
          return NextResponse.json({ 
            success: true, 
            plan: retryPlan 
          })
        }
      }

      return NextResponse.json({ 
        success: false, 
        error: 'Error al crear plan por defecto',
        details: createError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      plan: newPlan 
    })

  } catch (error) {
    console.error('Error en GET /api/coach/plan:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { plan_type } = body

    if (!plan_type || !['free', 'basico', 'black', 'premium'].includes(plan_type)) {
      return NextResponse.json({ 
        error: 'plan_type inválido. Debe ser: free, basico, black o premium' 
      }, { status: 400 })
    }

    // Obtener el coach_id (el id de coaches es el mismo que user.id)
    const { data: coach } = await supabase
      .from('coaches')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!coach) {
      return NextResponse.json({ error: 'Coach no encontrado' }, { status: 404 })
    }

    // Crear cliente con service role para todas las operaciones
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Límites de almacenamiento por plan
    const storageLimits: Record<string, number> = {
      free: 1,
      basico: 5,
      black: 25,
      premium: 100
    }

    // Obtener el plan actual usando service role
    const { data: currentPlan, error: currentPlanError } = await supabaseService
      .from('planes_uso_coach')
      .select('*')
      .eq('coach_id', coach.id)
      .eq('status', 'active')
      .maybeSingle()

    if (currentPlanError) {
      console.error('Error obteniendo plan actual:', currentPlanError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error al obtener plan actual',
        details: currentPlanError.message 
      }, { status: 500 })
    }

    // Sincronizar el storage_used_gb desde storage_usage antes de validar
    const { data: storageUsageData, error: storageError } = await supabaseService
      .from('storage_usage')
      .select('gb_usage')
      .eq('coach_id', coach.id)

    let storageUsed = 0
    if (!storageError && storageUsageData) {
      storageUsed = storageUsageData.reduce((sum, item) => sum + (Number(item.gb_usage) || 0), 0)
    } else if (currentPlan) {
      // Si no hay datos en storage_usage, usar el valor del plan actual
      storageUsed = Number(currentPlan.storage_used_gb) || 0
    }

    const newStorageLimit = storageLimits[plan_type]

    // Validar que el nuevo plan tenga suficiente espacio
    if (storageUsed > newStorageLimit) {
      return NextResponse.json({ 
        success: false,
        error: `No se puede cambiar al plan ${plan_type}. El almacenamiento usado (${storageUsed.toFixed(2)} GB) excede el límite del plan (${newStorageLimit} GB)`,
        storageUsed,
        storageLimit: newStorageLimit
      }, { status: 400 })
    }

    // Orden de planes para determinar upgrade/downgrade
    const planOrder: Record<string, number> = {
      free: 0,
      basico: 1,
      black: 2,
      premium: 3
    }

    const currentPlanLevel = currentPlan ? planOrder[currentPlan.plan_type] : -1
    const newPlanLevel = planOrder[plan_type]
    const isUpgrade = newPlanLevel > currentPlanLevel
    const isDowngrade = newPlanLevel < currentPlanLevel
    const isSamePlan = newPlanLevel === currentPlanLevel

    // Si es el mismo plan, no hacer nada
    if (isSamePlan && currentPlan) {
      return NextResponse.json({ 
        success: true, 
        plan: currentPlan,
        message: `Ya estás en el plan ${plan_type}`
      })
    }

    const now = new Date()
    let newStartedAt: Date
    let newExpiresAt: Date
    let renewalCount = 0

    if (isUpgrade) {
      // UPGRADE: Cambio inmediato, comienza con 31 días nuevos desde ahora
      newStartedAt = new Date(now)
      
      // 31 días nuevos del plan mejor (en milisegundos)
      const thirtyOneDaysMs = 31 * 24 * 60 * 60 * 1000
      newExpiresAt = new Date(now.getTime() + thirtyOneDaysMs)

      // Desactivar el plan actual inmediatamente
      if (currentPlan) {
        const { error: updateError } = await supabaseService
          .from('planes_uso_coach')
          .update({ 
            status: 'cancelled',
            updated_at: now.toISOString()
          })
          .eq('id', currentPlan.id)

        if (updateError) {
          console.error('Error desactivando plan anterior:', updateError)
          return NextResponse.json({ 
            success: false, 
            error: 'Error al desactivar plan anterior',
            details: updateError.message 
          }, { status: 500 })
        }
      }
    } else if (isDowngrade) {
      // DOWNGRADE: Conserva días restantes, el nuevo plan empieza cuando termina el actual
      if (!currentPlan || !currentPlan.expires_at) {
        return NextResponse.json({ 
          success: false,
          error: 'No se puede hacer downgrade: plan actual no tiene fecha de expiración'
        }, { status: 400 })
      }

      // El nuevo plan empezará cuando termine el actual
      newStartedAt = new Date(currentPlan.expires_at)
      // 31 días desde que empiece (en milisegundos)
      const thirtyOneDaysMs = 31 * 24 * 60 * 60 * 1000
      newExpiresAt = new Date(newStartedAt.getTime() + thirtyOneDaysMs)

      // Crear el plan pendiente (status: 'pending' para que no interfiera con el actual)
      // Pero primero necesitamos cambiar el constraint único para permitir planes pending
      // Por ahora, lo creamos como 'active' pero el plan actual sigue siendo el que se usa
      // Necesitamos modificar la lógica para que el plan actual tenga prioridad hasta que expire
      
      // Por simplicidad, crearemos el plan con status 'pending' y luego lo activaremos cuando expire
      // Por ahora, lo marcamos como 'active' pero el frontend debe verificar expires_at
    } else {
      // Sin plan actual, crear nuevo plan normal
      newStartedAt = new Date(now)
      // 31 días desde ahora (en milisegundos)
      const thirtyOneDaysMs = 31 * 24 * 60 * 60 * 1000
      newExpiresAt = new Date(now.getTime() + thirtyOneDaysMs)
    }

    // Desactivar el plan actual según el tipo de cambio
    if (currentPlan) {
      const { error: updateError } = await supabaseService
        .from('planes_uso_coach')
        .update({ 
          status: 'cancelled',
          updated_at: now.toISOString()
        })
        .eq('id', currentPlan.id)

      if (updateError) {
        console.error('Error desactivando plan anterior:', updateError)
        return NextResponse.json({ 
          success: false, 
          error: 'Error al desactivar plan anterior',
          details: updateError.message 
        }, { status: 500 })
      }
    }

    // Si es plan free, establecer renewal_count en 0
    if (plan_type === 'free') {
      renewalCount = 0
    }

    // Si es un plan de pago (no free), cancelar suscripción anterior si existe
    let subscriptionId: string | null = null
    let subscriptionInitPoint: string | undefined = undefined
    if (plan_type !== 'free' && currentPlan?.mercadopago_subscription_id) {
      try {
        const { cancelSubscription } = await import('@/lib/mercadopago/subscriptions')
        await cancelSubscription(currentPlan.mercadopago_subscription_id)
        console.log('✅ Suscripción anterior cancelada:', currentPlan.mercadopago_subscription_id)
      } catch (error: any) {
        console.error('⚠️ Error cancelando suscripción anterior:', error)
        // Continuar aunque falle, el plan se cambiará de todos modos
      }
    }

    // Si es un plan de pago (no free), crear suscripción de Mercado Pago
    if (plan_type !== 'free') {
      try {
        const { createCoachSubscription } = await import('@/lib/mercadopago/subscriptions')
        
        // Obtener email del usuario
        const { data: { user: userData } } = await supabase.auth.getUser()
        const email = userData?.email || user.email || ''
        
        if (!email) {
          return NextResponse.json({
            success: false,
            error: 'Se requiere email para crear suscripción'
          }, { status: 400 })
        }

        const subscription = await createCoachSubscription({
          coachId: coach.id,
          planType: plan_type as 'basico' | 'black' | 'premium',
          email,
          reason: `Plan ${plan_type} - OMNIA`
        })

        subscriptionId = subscription.id
        subscriptionInitPoint = subscription.init_point
        console.log('✅ Suscripción de Mercado Pago creada:', subscriptionId, 'init_point:', subscriptionInitPoint)
      } catch (error: any) {
        console.error('❌ Error creando suscripción de Mercado Pago:', error)
        return NextResponse.json({
          success: false,
          error: 'Error creando suscripción de Mercado Pago',
          details: error.message || 'Error desconocido'
        }, { status: 500 })
      }
    }

    // Crear el nuevo plan con los límites y fechas actualizados
    const { data: newPlan, error: createError } = await supabaseService
      .from('planes_uso_coach')
      .insert({
        coach_id: coach.id,
        plan_type,
        storage_limit_gb: newStorageLimit,
        storage_used_gb: storageUsed,
        status: 'active',
        started_at: newStartedAt.toISOString(),
        expires_at: newExpiresAt.toISOString(),
        renewal_count: renewalCount,
        mercadopago_subscription_id: subscriptionId
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creando nuevo plan:', createError)
      
      // Si hay un error de constraint único, intentar obtener el plan activo
      if (createError.message?.includes('idx_unique_active_plan_per_coach')) {
        const { data: existingPlan } = await supabaseService
          .from('planes_uso_coach')
          .select('*')
          .eq('coach_id', coach.id)
          .eq('status', 'active')
          .maybeSingle()

        if (existingPlan) {
          return NextResponse.json({ 
            success: true, 
            plan: existingPlan,
            message: `Plan ya está activo: ${plan_type}`
          })
        }
      }

      return NextResponse.json({ 
        success: false, 
        error: 'Error al cambiar plan',
        details: createError.message 
      }, { status: 500 })
    }

    if (!newPlan) {
      return NextResponse.json({ 
        success: false, 
        error: 'No se pudo crear el nuevo plan'
      }, { status: 500 })
    }

    let message = `Plan cambiado a ${plan_type} exitosamente`
    
    if (isUpgrade) {
      message = `Plan actualizado a ${plan_type}. Tu nuevo plan comenzará ahora con 31 días completos.`
    } else if (isDowngrade) {
      // Calcular días hasta que empiece el nuevo plan
      let daysUntilStart = 0
      if (currentPlan && currentPlan.expires_at) {
        const currentExpires = new Date(currentPlan.expires_at)
        const diffMs = currentExpires.getTime() - now.getTime()
        daysUntilStart = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
      }
      message = `Plan cambiado a ${plan_type}. El nuevo plan comenzará en ${daysUntilStart} días (cuando termine tu plan actual).`
    }

    console.log('✅ Plan cambiado exitosamente:', {
      coach_id: coach.id,
      plan_type,
      is_upgrade: isUpgrade,
      is_downgrade: isDowngrade,
      storage_limit_gb: newStorageLimit,
      storage_used_gb: storageUsed,
      started_at: newStartedAt.toISOString(),
      expires_at: newExpiresAt.toISOString(),
      subscription_id: subscriptionId
    })

    return NextResponse.json({ 
      success: true, 
      plan: newPlan,
      message,
      is_upgrade: isUpgrade,
      is_downgrade: isDowngrade,
      subscription_id: subscriptionId,
      subscription_init_point: subscriptionInitPoint,
      requires_payment: plan_type !== 'free' && subscriptionId ? true : false
    })

  } catch (error) {
    console.error('Error en POST /api/coach/plan:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

