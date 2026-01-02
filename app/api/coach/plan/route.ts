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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // En desarrollo o entornos mal configurados, devolver plan free sin romper la UI
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        success: true,
        plan: {
          coach_id: coach.id,
          plan_type: 'free',
          status: 'active'
        },
        warning: 'Service role key no configurada; usando plan free por defecto'
      })
    }

    // Crear cliente con service role para verificar si existe un plan activo
    // Esto evita problemas con RLS que podrían ocultar un plan existente
    const supabaseService = createClient(
      supabaseUrl,
      serviceRoleKey
    )

    // Verificar con service role si ya existe un plan activo
    // Un plan está activo si: status = 'active' Y started_at <= now Y (expires_at is null o expires_at > now)
    const now = new Date()
    
    const { data: existingPlans, error: checkError } = await supabaseService
      .from('planes_uso_coach')
      .select('*')
      .eq('coach_id', coach.id)
      .eq('status', 'active')
      .order('started_at', { ascending: false })

    // También traer el plan pendiente más reciente (trial)
    const { data: pendingPlan } = await supabaseService
      .from('planes_uso_coach')
      .select('*')
      .eq('coach_id', coach.id)
      .eq('status', 'trial')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (checkError) {
      console.error('Error verificando plan existente:', checkError)
      return NextResponse.json({
        success: true,
        plan: {
          coach_id: coach.id,
          plan_type: 'free',
          status: 'active'
        },
        warning: checkError.message
      })
    }

    // Buscar el plan que realmente está activo (started_at <= now y no expirado)
    const activePlan = existingPlans?.find(plan => {
      const startedAtOk = !plan.started_at || new Date(plan.started_at) <= now
      const notExpired = !plan.expires_at || new Date(plan.expires_at) > now
      return startedAtOk && notExpired
    })

    // Si hay un plan activo, retornarlo
    if (activePlan) {
      return NextResponse.json({ 
        success: true, 
        plan: activePlan,
        pending_plan: pendingPlan || null
      })
    }

    // Si no hay plan activo (por ejemplo, el anterior expiró), pero existe un plan trial cuyo started_at ya llegó,
    // lo promovemos a active automáticamente.
    if (pendingPlan?.started_at) {
      const pendingStart = new Date(pendingPlan.started_at)
      if (pendingStart <= now) {
        // Marcar planes activos expirados como expired para no violar unicidad.
        // (La consulta de activePlan ya filtra por expires_at, pero en DB puede seguir status='active')
        try {
          await supabaseService
            .from('planes_uso_coach')
            .update({ status: 'expired', updated_at: now.toISOString() })
            .eq('coach_id', coach.id)
            .eq('status', 'active')
            .lte('expires_at', now.toISOString())
        } catch (e) {
          // no bloquear
        }

        // Si el pending es un plan pago, copiar la suscripción del plan anterior para mantener débito automático.
        let previousSubscriptionId: string | null = null
        try {
          const { data: previousPlan } = await supabaseService
            .from('planes_uso_coach')
            .select('mercadopago_subscription_id')
            .eq('coach_id', coach.id)
            .in('status', ['active', 'expired', 'cancelled'])
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          previousSubscriptionId = (previousPlan as any)?.mercadopago_subscription_id
            ? String((previousPlan as any).mercadopago_subscription_id)
            : null
        } catch (e) {
          // no bloquear
        }

        const nowIso = now.toISOString()
        const { data: promotedPlan, error: promoteError } = await supabaseService
          .from('planes_uso_coach')
          .update({
            status: 'active',
            updated_at: nowIso,
            mercadopago_subscription_id:
              pendingPlan.plan_type !== 'free' ? (previousSubscriptionId ?? null) : null,
          })
          .eq('id', pendingPlan.id)
          .select()
          .single()

        if (promoteError) {
          console.error('Error promoviendo plan pending a active:', promoteError)
        } else if (promotedPlan) {
          return NextResponse.json({
            success: true,
            plan: promotedPlan,
            pending_plan: null
          })
        }
      }
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
        success: true,
        plan: {
          coach_id: coach.id,
          plan_type: 'free',
          status: 'active'
        },
        warning: createError.message
      })
    }

    return NextResponse.json({ 
      success: true, 
      plan: newPlan,
      pending_plan: pendingPlan || null
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Intentar usar service role (evita problemas de RLS), pero si no está configurado o es inválido,
    // hacer fallback al cliente autenticado por cookies.
    const supabaseService = supabaseUrl && serviceRoleKey
      ? createClient(supabaseUrl, serviceRoleKey)
      : null

    const isInvalidApiKeyError = (err: any) => {
      const msg = String(err?.message || '')
      const hint = String(err?.hint || '')
      return msg.toLowerCase().includes('invalid api key') || hint.toLowerCase().includes('invalid api key')
    }

    // Límites de almacenamiento por plan
    const storageLimits: Record<string, number> = {
      free: 1,
      basico: 5,
      black: 25,
      premium: 100
    }

    // Obtener el plan actual (preferimos service role, pero con fallback)
    let currentPlan: any = null
    let currentPlanError: any = null

    if (supabaseService) {
      const res = await supabaseService
        .from('planes_uso_coach')
        .select('*')
        .eq('coach_id', coach.id)
        .eq('status', 'active')
        .maybeSingle()
      currentPlan = res.data
      currentPlanError = res.error
    }

    if (!supabaseService || (currentPlanError && isInvalidApiKeyError(currentPlanError))) {
      const res = await supabase
        .from('planes_uso_coach')
        .select('*')
        .eq('coach_id', coach.id)
        .eq('status', 'active')
        .maybeSingle()
      currentPlan = res.data
      currentPlanError = res.error
    }

    if (currentPlanError) {
      console.error('Error obteniendo plan actual:', currentPlanError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error al obtener plan actual',
        details: currentPlanError.message 
      }, { status: 500 })
    }

    // Sincronizar el storage_used_gb desde storage_usage antes de validar
    let storageUsageData: any[] | null = null
    let storageError: any = null

    if (supabaseService) {
      const res = await supabaseService
        .from('storage_usage')
        .select('gb_usage')
        .eq('coach_id', coach.id)
      storageUsageData = res.data as any
      storageError = res.error
    }

    if (!supabaseService || (storageError && isInvalidApiKeyError(storageError))) {
      const res = await supabase
        .from('storage_usage')
        .select('gb_usage')
        .eq('coach_id', coach.id)
      storageUsageData = res.data as any
      storageError = res.error
    }

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

    const isPaidPlan = (p: any) => p && typeof p === 'string' && p !== 'free'

    // Regla de negocio:
    // - Upgrade (a un plan más caro): requiere checkout ahora (nueva suscripción).
    // - Downgrade a un plan pago más barato: se programa al final del período actual,
    //   sin redirección. Se actualiza el monto de la suscripción existente para el próximo ciclo.
    const isPaidToPaidDowngrade =
      !!currentPlan && isPaidPlan(currentPlan.plan_type) && isPaidPlan(plan_type) && isDowngrade

    // Downgrade a free desde un plan pago: debe respetar la suscripción vigente.
    // Programamos el plan free para cuando venza el plan actual.
    const isDowngradeToFree = plan_type === 'free' && !!currentPlan && currentPlan.plan_type !== 'free'

    // Si es downgrade a free desde un plan pago con suscripción activa, cancelar suscripción en Mercado Pago
    // para que no se renueve/cobre el próximo período. El plan actual sigue vigente hasta expires_at.
    if (isDowngradeToFree && currentPlan?.mercadopago_subscription_id) {
      try {
        const { cancelSubscription } = await import('../../../../lib/mercadopago/subscriptions')
        await cancelSubscription(String(currentPlan.mercadopago_subscription_id))
        console.log('✅ Suscripción Mercado Pago cancelada por downgrade:', currentPlan.mercadopago_subscription_id)
      } catch (e: any) {
        console.warn('⚠️ No se pudo cancelar suscripción Mercado Pago en downgrade:', {
          subscriptionId: currentPlan.mercadopago_subscription_id,
          message: e?.message,
        })
      }
    }

    // Downgrade pago→pago: no hay checkout. Se programa para cuando termina el plan actual,
    // y se actualiza el monto de la suscripción existente para el próximo ciclo.
    if (isPaidToPaidDowngrade && currentPlan?.mercadopago_subscription_id) {
      try {
        const { updateSubscriptionAmount } = await import('../../../../lib/mercadopago/subscriptions')
        await updateSubscriptionAmount(String(currentPlan.mercadopago_subscription_id), plan_type as any)
        console.log('✅ Monto de suscripción Mercado Pago actualizado por downgrade programado:', {
          subscriptionId: currentPlan.mercadopago_subscription_id,
          nextPlan: plan_type,
        })
      } catch (e: any) {
        console.warn('⚠️ No se pudo actualizar el monto de la suscripción en downgrade programado:', {
          subscriptionId: currentPlan.mercadopago_subscription_id,
          message: e?.message,
        })
      }
    }

    if (isUpgrade) {
      // UPGRADE: el cambio de plan es inmediato, pero sólo después de que Mercado Pago autorice el pago.
      // En esta API vamos a dejar el plan en estado pending y el webhook lo activará.
      newStartedAt = new Date(now)
      const thirtyOneDaysMs = 31 * 24 * 60 * 60 * 1000
      newExpiresAt = new Date(now.getTime() + thirtyOneDaysMs)
    } else if (isDowngradeToFree || isPaidToPaidDowngrade) {
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
    } else {
      // Sin plan actual, crear nuevo plan normal
      newStartedAt = new Date(now)
      // 31 días desde ahora (en milisegundos)
      const thirtyOneDaysMs = 31 * 24 * 60 * 60 * 1000
      newExpiresAt = new Date(now.getTime() + thirtyOneDaysMs)
    }

    // Si es plan free, establecer renewal_count en 0
    if (plan_type === 'free') {
      renewalCount = 0
    }

    // Si es un plan de pago (no free), crear suscripción de Mercado Pago y generar un plan pending.
    let subscriptionId: string | null = null
    let subscriptionInitPoint: string | undefined = undefined

    // Sólo en upgrades a planes pagos creamos una nueva suscripción (checkout).
    const shouldCreateSubscriptionNow = plan_type !== 'free' && isUpgrade

    if (shouldCreateSubscriptionNow) {
      const mpMode = (process.env.MERCADOPAGO_MODE || '').toLowerCase() // 'test' | 'production'
      const forceTest = mpMode === 'test'
      const isProd = process.env.NODE_ENV === 'production'
      const mpToken = forceTest
        ? (process.env.TEST_MP_SUBSCRIPTIONS_ACCESS_TOKEN || process.env.TEST_MERCADOPAGO_ACCESS_TOKEN)
        : (isProd
          ? (process.env.MP_SUBSCRIPTIONS_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN)
          : ((process.env.TEST_MP_SUBSCRIPTIONS_ACCESS_TOKEN || process.env.TEST_MERCADOPAGO_ACCESS_TOKEN) ||
            (process.env.MP_SUBSCRIPTIONS_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN)))
      if (!mpToken || String(mpToken).trim() === '') {
        return NextResponse.json(
          {
            success: false,
            error: 'No se puede iniciar el upgrade: Mercado Pago no está configurado',
            code: 'MISSING_MERCADOPAGO_TOKEN',
            details: forceTest
              ? 'Modo TEST: falta TEST_MP_SUBSCRIPTIONS_ACCESS_TOKEN (o TEST_MERCADOPAGO_ACCESS_TOKEN como fallback)'
              : (isProd
                ? 'Falta MP_SUBSCRIPTIONS_ACCESS_TOKEN (o MERCADOPAGO_ACCESS_TOKEN como fallback)'
                : 'Falta TEST_MP_SUBSCRIPTIONS_ACCESS_TOKEN/TEST_MERCADOPAGO_ACCESS_TOKEN o MP_SUBSCRIPTIONS_ACCESS_TOKEN/MERCADOPAGO_ACCESS_TOKEN')
          },
          { status: 500 }
        )
      }

      try {
        const { createCoachSubscription } = await import('../../../../lib/mercadopago/subscriptions')
        
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

    // Determinar status del nuevo plan.
    // En la DB, status permite: active | cancelled | expired | trial.
    // Usamos 'trial' como estado "pendiente" para upgrades y downgrades programados.
    // El upgrade se activa por webhook/verify; el downgrade se activará cuando started_at llegue (ver GET /api/coach/plan).
    const targetStatus = (plan_type === 'free' && !isDowngradeToFree && !isDowngrade) ? 'active' : 'trial'

    let newPlan: any = null
    let createError: any = null

    if (supabaseService) {
      const res = await supabaseService
        .from('planes_uso_coach')
        .insert({
          coach_id: coach.id,
          plan_type,
          storage_limit_gb: newStorageLimit,
          storage_used_gb: storageUsed,
          status: targetStatus,
          started_at: newStartedAt.toISOString(),
          expires_at: newExpiresAt.toISOString(),
          renewal_count: renewalCount,
          // En downgrade pago→pago programado NO asociamos la suscripción al plan pending para evitar que el webhook
          // lo active antes de tiempo. Al momento de activar (GET), copiamos el subscription_id del plan anterior.
          mercadopago_subscription_id: shouldCreateSubscriptionNow ? subscriptionId : null
        })
        .select()
        .single()
      newPlan = res.data
      createError = res.error
    }

    if (!supabaseService || (createError && isInvalidApiKeyError(createError))) {
      const res = await supabase
        .from('planes_uso_coach')
        .insert({
          coach_id: coach.id,
          plan_type,
          storage_limit_gb: newStorageLimit,
          storage_used_gb: storageUsed,
          status: targetStatus,
          started_at: newStartedAt.toISOString(),
          expires_at: newExpiresAt.toISOString(),
          renewal_count: renewalCount,
          mercadopago_subscription_id: shouldCreateSubscriptionNow
            ? subscriptionId
            : null
        })
        .select()
        .single()
      newPlan = res.data
      createError = res.error
    }

    if (createError) {
      console.error('Error creando nuevo plan:', createError)
      
      // Si hay un error de constraint único, intentar obtener el plan activo
      if (createError.message?.includes('idx_unique_active_plan_per_coach')) {
        const db = supabaseService && !isInvalidApiKeyError(createError) ? supabaseService : supabase
        const { data: existingPlan } = await db
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
    const requiresPayment = shouldCreateSubscriptionNow && !!subscriptionId
    
    if (requiresPayment) {
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
      requires_payment: requiresPayment
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

