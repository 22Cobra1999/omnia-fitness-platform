import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Hacer la ruta dinámica para evitar evaluación durante el build
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

/**
 * Webhook para recibir notificaciones de pagos recurrentes de suscripciones de Mercado Pago
 * 
 * Eventos que recibe:
 * - payment: Pago exitoso de renovación mensual
 * - subscription: Cambios en el estado de la suscripción
 */
export async function POST(request: NextRequest) {
  const supabaseService = getSupabaseService()
  try {
    const body = await request.json()
    
    console.log('📥 Webhook de suscripción recibido:', JSON.stringify(body, null, 2))

    const type = body.type || body.entity
    const action = body.action
    const data = body.data || body

    // Mercado Pago envía diferentes tipos de notificaciones de suscripciones
    // Formato: { type: "subscription_preapproval", entity: "preapproval", action: "updated", data: {"id":"123456"} }
    
    if (type === 'subscription_preapproval' || body.entity === 'preapproval') {
      // Notificación específica de suscripción (preapproval)
      console.log('🔔 Notificación de suscripción recibida:', {
        type: type || body.entity,
        action: action,
        subscription_id: data?.id || body.id
      })

      if (action === 'updated' || action === 'created') {
        // Cuando se actualiza o crea una suscripción, obtener los detalles desde Mercado Pago
        const subscriptionId = data?.id || body.id
        if (subscriptionId) {
          await handleSubscriptionUpdateNotification(subscriptionId, action)
        }
      } else if (action === 'payment.created' || action === 'payment.updated') {
        // Notificación de pago dentro de una suscripción
        await handleSubscriptionPayment(data || body)
      } else {
        // Por defecto, tratar como actualización de suscripción
        // MP a veces envía sólo { data: { id } } sin status: en ese caso, buscamos el estado real desde MP.
        const subscriptionId = (data || body)?.id || (data || body)?.preapproval_id
        if (subscriptionId) {
          await handleSubscriptionUpdateNotification(subscriptionId, action || 'unknown')
        } else {
          await handlePreApprovalNotification(data || body)
        }
      }
    } else if (type === 'payment' || action === 'payment.created' || action === 'payment.updated') {
      // Notificación de pago (renovación mensual)
      await handleSubscriptionPayment(data)
    } else if (type === 'subscription' || action?.includes('subscription')) {
      // Notificación de cambios en la suscripción
      await handleSubscriptionUpdate(data)
    } else if (data?.id || data?.preapproval_id || body.id) {
      // Notificación de preapproval (suscripción)
      await handlePreApprovalNotification(data || body)
    } else {
      console.warn('⚠️ Tipo de notificación no reconocido:', { type, action, entity: body.entity })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ Error procesando webhook de suscripción:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Error procesando webhook'
    }, { status: 500 })
  }
}

async function activatePendingPlanForSubscription(subscriptionId: string) {
  const supabaseService = getSupabaseService()

  // Buscar el plan pendiente asociado a la suscripción
  const { data: pendingPlan, error: pendingError } = await supabaseService
    .from('planes_uso_coach')
    .select('*')
    .eq('mercadopago_subscription_id', subscriptionId)
    .eq('status', 'trial')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (pendingError) {
    console.error('❌ Error buscando plan pending para suscripción:', pendingError)
    return
  }

  if (!pendingPlan) {
    return
  }

  const now = new Date().toISOString()

  // Cancelar plan activo anterior (si existe)
  const { data: activePlan, error: activeError } = await supabaseService
    .from('planes_uso_coach')
    .select('id')
    .eq('coach_id', pendingPlan.coach_id)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (activeError) {
    console.warn('⚠️ Error buscando plan activo anterior:', activeError)
  }

  if (activePlan?.id) {
    const { error: cancelError } = await supabaseService
      .from('planes_uso_coach')
      .update({ status: 'cancelled', updated_at: now })
      .eq('id', activePlan.id)

    if (cancelError) {
      console.error('❌ Error cancelando plan activo anterior:', cancelError)
      // continuar igual para no trabar el activation
    }
  }

  // Activar el plan pending
  const { error: activateError } = await supabaseService
    .from('planes_uso_coach')
    .update({ status: 'active', updated_at: now })
    .eq('id', pendingPlan.id)

  if (activateError) {
    console.error('❌ Error activando plan pending:', activateError)
  } else {
    console.log('✅ Plan activado desde pending:', {
      planId: pendingPlan.id,
      coachId: pendingPlan.coach_id,
      planType: pendingPlan.plan_type,
      subscriptionId
    })
  }
}

/**
 * Maneja el pago de una renovación mensual de suscripción
 */
async function handleSubscriptionPayment(paymentData: any) {
  try {
    const supabaseService = getSupabaseService()
    const preApprovalId = paymentData.preapproval_id || paymentData.subscription_id
    
    if (!preApprovalId) {
      console.warn('⚠️ Pago sin preapproval_id/subscription_id:', paymentData)
      return
    }

    console.log('💰 Procesando pago de renovación de suscripción:', preApprovalId)

    // Buscar el plan activo asociado a esta suscripción (renovaciones)
    const { data: plan, error: planError } = await supabaseService
      .from('planes_uso_coach')
      .select('*')
      .eq('mercadopago_subscription_id', preApprovalId)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (planError) {
      console.error('❌ Error buscando plan:', planError)
      return
    }

    if (!plan) {
      console.warn('⚠️ No se encontró plan activo para suscripción:', preApprovalId)
      return
    }

    // Si el pago está aprobado, renovar el plan automáticamente
    if (paymentData.status === 'approved' || paymentData.status === 'credited') {
      console.log('✅ Pago aprobado, renovando plan:', plan.id)

      const now = new Date()
      const thirtyOneDaysFromNow = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000)

      // Actualizar la fecha de expiración del plan
      const { error: updateError } = await supabaseService
        .from('planes_uso_coach')
        .update({
          expires_at: thirtyOneDaysFromNow.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('id', plan.id)

      if (updateError) {
        console.error('❌ Error renovando plan:', updateError)
      } else {
        console.log('✅ Plan renovado exitosamente hasta:', thirtyOneDaysFromNow.toISOString())
      }
    } else {
      console.warn('⚠️ Pago no aprobado, estado:', paymentData.status)
      // Si el pago falla múltiples veces, podrías pausar el plan
      // Por ahora solo registramos el warning
    }
  } catch (error: any) {
    console.error('❌ Error en handleSubscriptionPayment:', error)
  }
}

/**
 * Maneja cambios en el estado de la suscripción
 */
async function handleSubscriptionUpdate(subscriptionData: any) {
  try {
    const supabaseService = getSupabaseService()
    const subscriptionId = subscriptionData.id || subscriptionData.preapproval_id
    
    if (!subscriptionId) {
      console.warn('⚠️ Actualización sin subscription_id:', subscriptionData)
      return
    }

    console.log('📝 Actualizando estado de suscripción:', subscriptionId, subscriptionData.status)

    // Buscar el plan asociado
    const { data: plan, error: planError } = await supabaseService
      .from('planes_uso_coach')
      .select('*')
      .eq('mercadopago_subscription_id', subscriptionId)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (planError || !plan) {
      console.warn('⚠️ No se encontró plan para suscripción:', subscriptionId)
      return
    }

    // Si la suscripción fue cancelada o pausada, actualizar el plan
    if (subscriptionData.status === 'cancelled' || subscriptionData.status === 'paused') {
      console.log('🚫 Suscripción cancelada/pausada, desactivando plan')

      const { error: updateError } = await supabaseService
        .from('planes_uso_coach')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', plan.id)

      if (updateError) {
        console.error('❌ Error desactivando plan:', updateError)
      } else {
        console.log('✅ Plan desactivado exitosamente')
      }
    }
  } catch (error: any) {
    console.error('❌ Error en handleSubscriptionUpdate:', error)
  }
}

/**
 * Maneja notificaciones de preapproval (suscripción)
 */
async function handlePreApprovalNotification(preApprovalData: any) {
  try {
    const subscriptionId = preApprovalData.id || preApprovalData.preapproval_id
    
    if (!subscriptionId) {
      return
    }

    console.log('📋 Notificación de preapproval:', subscriptionId, preApprovalData.status)

    // Si MP no envía status, obtenerlo desde la API de MP y procesar en base a eso.
    if (!preApprovalData.status) {
      await handleSubscriptionUpdateNotification(subscriptionId, 'missing_status')
      return
    }

    // Si la suscripción fue autorizada/pagada, activar el plan pendiente asociado
    if (preApprovalData.status === 'authorized' || preApprovalData.status === 'paid') {
      await activatePendingPlanForSubscription(subscriptionId)
      // Además tratamos como pago aprobado para renovar en caso de que ya exista plan activo
      await handleSubscriptionPayment({
        preapproval_id: subscriptionId,
        status: 'approved',
        ...preApprovalData
      })
    } else if (preApprovalData.status === 'cancelled' || preApprovalData.status === 'paused') {
      await handleSubscriptionUpdate({
        id: subscriptionId,
        status: preApprovalData.status
      })
    }
  } catch (error: any) {
    console.error('❌ Error en handlePreApprovalNotification:', error)
  }
}

/**
 * Maneja notificaciones específicas de suscripción cuando se actualiza o crea
 * Obtiene los detalles actualizados desde Mercado Pago
 */
async function handleSubscriptionUpdateNotification(subscriptionId: string, action: string) {
  try {
    console.log(`📋 Procesando notificación de suscripción (${action}):`, subscriptionId)

    // Obtener información actualizada de la suscripción desde Mercado Pago
    const { getSubscriptionInfo } = await import('../../../../lib/mercadopago/subscriptions')
    const subscriptionInfo = await getSubscriptionInfo(subscriptionId)

    if (!subscriptionInfo) {
      console.warn('⚠️ No se pudo obtener información de la suscripción:', subscriptionId)
      return
    }

    console.log('📊 Información de suscripción:', JSON.stringify(subscriptionInfo, null, 2))

    const supabaseService = getSupabaseService()
    // Buscar el plan asociado (puede estar pending o active)
    const { data: plan, error: planError } = await supabaseService
      .from('planes_uso_coach')
      .select('*')
      .eq('mercadopago_subscription_id', subscriptionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (planError) {
      console.error('❌ Error buscando plan:', planError)
      return
    }

    if (!plan) {
      console.warn('⚠️ No se encontró plan para suscripción:', subscriptionId)
      return
    }

    // Si la suscripción está autorizada, primero activar el plan pending (si existe)
    if (subscriptionInfo.status === 'authorized') {
      await activatePendingPlanForSubscription(subscriptionId)
    }

    // Si la suscripción está autorizada, actualizar expiración (si MP no devuelve next_payment_date, usar 31 días desde ahora)
    if (subscriptionInfo.status === 'authorized') {
      const now = new Date()
      const nextPaymentDate = subscriptionInfo.next_payment_date
      const nextExpiresAt = nextPaymentDate
        ? new Date(nextPaymentDate)
        : new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000)

      console.log('✅ Suscripción autorizada, actualizando fecha de expiración:', nextExpiresAt.toISOString())

      const { error: updateError } = await supabaseService
        .from('planes_uso_coach')
        .update({
          expires_at: nextExpiresAt.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('id', plan.id)

      if (updateError) {
        console.error('❌ Error actualizando plan:', updateError)
      } else {
        console.log('✅ Plan actualizado exitosamente')
      }
    } else if (subscriptionInfo.status === 'cancelled' || subscriptionInfo.status === 'paused') {
      // Si la suscripción fue cancelada o pausada, desactivar el plan
      console.log('🚫 Suscripción cancelada/pausada, desactivando plan')

      const { error: updateError } = await supabaseService
        .from('planes_uso_coach')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', plan.id)

      if (updateError) {
        console.error('❌ Error desactivando plan:', updateError)
      } else {
        console.log('✅ Plan desactivado exitosamente')
      }
    }
  } catch (error: any) {
    console.error('❌ Error en handleSubscriptionUpdateNotification:', error)
  }
}

