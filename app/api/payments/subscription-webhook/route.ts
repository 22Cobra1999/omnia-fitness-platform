import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Webhook para recibir notificaciones de pagos recurrentes de suscripciones de Mercado Pago
 * 
 * Eventos que recibe:
 * - payment: Pago exitoso de renovación mensual
 * - subscription: Cambios en el estado de la suscripción
 */
export async function POST(request: NextRequest) {
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
        await handlePreApprovalNotification(data || body)
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

/**
 * Maneja el pago de una renovación mensual de suscripción
 */
async function handleSubscriptionPayment(paymentData: any) {
  try {
    const preApprovalId = paymentData.preapproval_id || paymentData.subscription_id
    
    if (!preApprovalId) {
      console.warn('⚠️ Pago sin preapproval_id/subscription_id:', paymentData)
      return
    }

    console.log('💰 Procesando pago de renovación de suscripción:', preApprovalId)

    // Buscar el plan asociado a esta suscripción
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

    // Si es un pago autorizado, procesarlo
    if (preApprovalData.status === 'authorized' || preApprovalData.status === 'paid') {
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
    const { getSubscriptionInfo } = await import('@/lib/mercadopago/subscriptions')
    const subscriptionInfo = await getSubscriptionInfo(subscriptionId)

    if (!subscriptionInfo) {
      console.warn('⚠️ No se pudo obtener información de la suscripción:', subscriptionId)
      return
    }

    console.log('📊 Información de suscripción:', JSON.stringify(subscriptionInfo, null, 2))

    // Buscar el plan asociado
    const { data: plan, error: planError } = await supabaseService
      .from('planes_uso_coach')
      .select('*')
      .eq('mercadopago_subscription_id', subscriptionId)
      .order('started_at', { ascending: false })
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

    // Si la suscripción está autorizada y tiene próxima fecha de pago, renovar el plan
    if (subscriptionInfo.status === 'authorized' && subscriptionInfo.auto_recurring) {
      const nextPaymentDate = subscriptionInfo.auto_recurring.end_date || subscriptionInfo.next_payment_date
      
      if (nextPaymentDate) {
        console.log('✅ Suscripción autorizada, actualizando fecha de expiración:', nextPaymentDate)

        const { error: updateError } = await supabaseService
          .from('planes_uso_coach')
          .update({
            expires_at: nextPaymentDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', plan.id)

        if (updateError) {
          console.error('❌ Error actualizando plan:', updateError)
        } else {
          console.log('✅ Plan actualizado exitosamente')
        }
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

