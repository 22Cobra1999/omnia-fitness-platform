import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function getSupabaseService() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

async function activatePendingPlanForSubscription(subscriptionId: string) {
  const supabaseService = getSupabaseService()

  const { data: pendingPlan, error: pendingError } = await supabaseService
    .from('planes_uso_coach')
    .select('*')
    .eq('mercadopago_subscription_id', subscriptionId)
    .eq('status', 'trial')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (pendingError) {
    console.error('❌ [subscription-verify] Error buscando plan pending:', pendingError)
    return { activated: false as const, reason: 'pending_plan_query_error' as const }
  }

  if (!pendingPlan) {
    return { activated: false as const, reason: 'pending_plan_not_found' as const }
  }

  const now = new Date().toISOString()

  const { data: activePlan, error: activeError } = await supabaseService
    .from('planes_uso_coach')
    .select('id, mercadopago_subscription_id')
    .eq('coach_id', pendingPlan.coach_id)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (activeError) {
    console.warn('⚠️ [subscription-verify] Error buscando plan activo anterior:', activeError)
  }

  if (activePlan?.id) {
    // Cancelar la suscripción anterior en Mercado Pago (si existía) para evitar doble cobro.
    if (activePlan.mercadopago_subscription_id && String(activePlan.mercadopago_subscription_id) !== String(subscriptionId)) {
      try {
        const { cancelSubscription } = await import('../../../../lib/mercadopago/subscriptions')
        await cancelSubscription(String(activePlan.mercadopago_subscription_id))
        console.log('✅ [subscription-verify] Suscripción anterior cancelada en Mercado Pago:', activePlan.mercadopago_subscription_id)
      } catch (e: any) {
        console.warn('⚠️ [subscription-verify] No se pudo cancelar suscripción anterior en Mercado Pago:', {
          subscriptionId: activePlan.mercadopago_subscription_id,
          message: e?.message,
        })
      }
    }

    const { error: cancelError } = await supabaseService
      .from('planes_uso_coach')
      .update({ status: 'cancelled', updated_at: now })
      .eq('id', activePlan.id)

    if (cancelError) {
      console.error('❌ [subscription-verify] Error cancelando plan activo anterior:', cancelError)
    }
  }

  const { error: activateError } = await supabaseService
    .from('planes_uso_coach')
    .update({ status: 'active', updated_at: now })
    .eq('id', pendingPlan.id)

  if (activateError) {
    console.error('❌ [subscription-verify] Error activando plan pending:', activateError)
    return { activated: false as const, reason: 'activate_error' as const }
  }

  console.log('✅ [subscription-verify] Plan activado desde pending:', {
    planId: pendingPlan.id,
    coachId: pendingPlan.coach_id,
    planType: pendingPlan.plan_type,
    subscriptionId
  })

  return { activated: true as const, reason: 'activated' as const }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const subscriptionId = body?.subscription_id || body?.preapproval_id || body?.id

    if (!subscriptionId || typeof subscriptionId !== 'string') {
      return NextResponse.json({ success: false, error: 'subscription_id es requerido' }, { status: 400 })
    }

    // Confirmar que el subscriptionId pertenece a un plan del coach autenticado
    const supabaseService = getSupabaseService()
    const { data: plan, error: planError } = await supabaseService
      .from('planes_uso_coach')
      .select('*')
      .eq('coach_id', user.id)
      .eq('mercadopago_subscription_id', subscriptionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (planError) {
      console.error('❌ [subscription-verify] Error buscando plan:', planError)
      return NextResponse.json({ success: false, error: 'Error buscando plan', details: planError.message }, { status: 500 })
    }

    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plan no encontrado para subscription_id' }, { status: 404 })
    }

    // Consultar info en Mercado Pago
    const { getSubscriptionInfo } = await import('../../../../lib/mercadopago/subscriptions')
    const subscriptionInfo = await getSubscriptionInfo(subscriptionId)

    // Persistir metadata mínima (mismo esquema que webhook)
    try {
      const nowIso = new Date().toISOString()
      await supabaseService
        .from('planes_uso_coach')
        .update({
          mercadopago_subscription_status: subscriptionInfo.status ?? null,
          mercadopago_subscription_payer_email: (subscriptionInfo as any).payer_email ?? null,
          mercadopago_subscription_next_payment_date: (subscriptionInfo as any).next_payment_date
            ? new Date((subscriptionInfo as any).next_payment_date).toISOString()
            : null,
          mercadopago_subscription_info: subscriptionInfo as any,
          mercadopago_subscription_last_webhook_payload: {
            source: 'subscription-verify',
            subscription_id: subscriptionId,
          },
          mercadopago_subscription_last_webhook_received_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id', plan.id)
    } catch (e: any) {
      console.warn('⚠️ [subscription-verify] No se pudo persistir metadata en plan:', { message: e?.message })
    }

    let activation: { activated: boolean; reason: string } | null = null
    if (subscriptionInfo.status === 'authorized' || subscriptionInfo.status === 'paid') {
      activation = await activatePendingPlanForSubscription(subscriptionId)
    }

    return NextResponse.json({
      success: true,
      subscription: subscriptionInfo,
      activated: activation?.activated ?? false,
      activation_reason: activation?.reason ?? null,
    })

  } catch (error: any) {
    console.error('❌ [subscription-verify] Error:', error)
    return NextResponse.json({
      success: false,
      error: error?.message || 'Error interno'
    }, { status: 500 })
  }
}
