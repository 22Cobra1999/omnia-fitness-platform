/**
 * Servicio para manejar suscripciones de Mercado Pago
 * Permite crear, renovar y cancelar suscripciones automáticas mensuales
 */

import { MercadoPagoConfig, PreApproval } from 'mercadopago'

// Precios de planes (debe coincidir con plan-management.tsx)
const PLAN_PRICES = {
  free: { price: 0, currency: 'ARS', period: '3 meses o hasta 3 ventas' },
  basico: { price: 12000, currency: 'ARS', period: 'mensual' },
  black: { price: 22000, currency: 'ARS', period: 'mensual' },
  premium: { price: 35000, currency: 'ARS', period: 'mensual' }
}

// Usar TEST_MERCADOPAGO_ACCESS_TOKEN si está disponible (modo prueba), sino usar MERCADOPAGO_ACCESS_TOKEN
const accessToken = process.env.TEST_MERCADOPAGO_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN!

const client = new MercadoPagoConfig({
  accessToken: accessToken,
  options: { timeout: 5000 }
})

const preApproval = new PreApproval(client)

export interface CreateSubscriptionParams {
  coachId: string
  planType: 'basico' | 'black' | 'premium'
  email: string
  reason?: string
}

export interface SubscriptionResponse {
  id: string
  status: string
  init_point?: string
  sandbox_init_point?: string
}

/**
 * Crea una suscripción mensual en Mercado Pago para un coach
 */
export async function createCoachSubscription({
  coachId,
  planType,
  email,
  reason
}: CreateSubscriptionParams): Promise<SubscriptionResponse> {
  const planPrice = PLAN_PRICES[planType]
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000').replace(/\/$/, '')

  // Crear suscripción con cobro automático mensual
  const subscriptionData = {
    reason: reason || `Plan ${planType} - OMNIA`,
    external_reference: `coach_${coachId}_${planType}_${Date.now()}`,
    payer_email: email,
    auto_recurring: {
      frequency: 1, // 1 = mensual
      frequency_type: 'months', // 'months' o 'days'
      transaction_amount: planPrice.price,
      currency_id: planPrice.currency,
      start_date: new Date(Date.now() + 60000).toISOString(), // Comienza en 1 minuto
      end_date: null // Sin fecha de fin (indefinida hasta cancelación)
    },
    back_url: `${appUrl}/payment/subscription-success`,
    notification_url: `${appUrl}/api/payments/subscription-webhook`,
    payment_methods_allowed: {
      payment_types: [
        { id: 'credit_card' },
        { id: 'debit_card' }
        // Removido account_money temporalmente - puede causar problemas en sandbox
      ],
      payment_methods: [
        { id: 'visa' },
        { id: 'master' },
        { id: 'amex' },
        { id: 'naranja' },
        { id: 'cabal' }
      ]
    }
  }

    try {
      // Detectar si estamos en modo prueba (usa TEST_MERCADOPAGO_ACCESS_TOKEN si está disponible)
      const isTestMode = !!process.env.TEST_MERCADOPAGO_ACCESS_TOKEN || accessToken.startsWith('TEST-')
      console.log(`📅 Creando suscripción de Mercado Pago (${isTestMode ? 'MODO PRUEBA' : 'MODO PRODUCCIÓN'}):`, JSON.stringify(subscriptionData, null, 2))
      
      const response = await preApproval.create({ body: subscriptionData })
      
      // En modo prueba, usar sandbox_init_point si está disponible
      const initPoint = isTestMode 
        ? (response.sandbox_init_point || response.init_point)
        : (response.init_point || response.sandbox_init_point)
      
      console.log('✅ Suscripción creada exitosamente:', {
        id: response.id,
        status: response.status,
        init_point: initPoint,
        mode: isTestMode ? 'PRUEBA' : 'PRODUCCIÓN'
      })

      return {
        id: response.id!,
        status: response.status!,
        init_point: initPoint
      }
  } catch (error: any) {
    console.error('❌ Error creando suscripción:', error)
    throw new Error(`Error creando suscripción: ${error.message || 'Error desconocido'}`)
  }
}

/**
 * Obtiene información de una suscripción existente
 */
export async function getSubscriptionInfo(subscriptionId: string) {
  try {
    const response = await preApproval.get({ preApprovalId: subscriptionId })
    return {
      id: response.id,
      status: response.status,
      reason: response.reason,
      payer_email: response.payer_email,
      auto_recurring: response.auto_recurring,
      payment_method_id: response.payment_method_id,
      card_id: response.card_id,
      next_payment_date: response.auto_recurring?.end_date || null
    }
  } catch (error: any) {
    console.error('❌ Error obteniendo suscripción:', error)
    throw new Error(`Error obteniendo suscripción: ${error.message || 'Error desconocido'}`)
  }
}

/**
 * Cancela una suscripción de Mercado Pago
 */
export async function cancelSubscription(subscriptionId: string) {
  try {
    console.log('🚫 Cancelando suscripción:', subscriptionId)
    
    const response = await preApproval.update({
      preApprovalId: subscriptionId,
      body: {
        status: 'cancelled'
      }
    })

    console.log('✅ Suscripción cancelada:', {
      id: response.id,
      status: response.status
    })

    return {
      id: response.id,
      status: response.status
    }
  } catch (error: any) {
    console.error('❌ Error cancelando suscripción:', error)
    throw new Error(`Error cancelando suscripción: ${error.message || 'Error desconocido'}`)
  }
}

/**
 * Pausa una suscripción de Mercado Pago
 */
export async function pauseSubscription(subscriptionId: string) {
  try {
    console.log('⏸️ Pausando suscripción:', subscriptionId)
    
    const response = await preApproval.update({
      preApprovalId: subscriptionId,
      body: {
        status: 'paused'
      }
    })

    console.log('✅ Suscripción pausada:', {
      id: response.id,
      status: response.status
    })

    return {
      id: response.id,
      status: response.status
    }
  } catch (error: any) {
    console.error('❌ Error pausando suscripción:', error)
    throw new Error(`Error pausando suscripción: ${error.message || 'Error desconocido'}`)
  }
}

/**
 * Reactiva una suscripción pausada
 */
export async function resumeSubscription(subscriptionId: string) {
  try {
    console.log('▶️ Reactivando suscripción:', subscriptionId)
    
    const response = await preApproval.update({
      preApprovalId: subscriptionId,
      body: {
        status: 'authorized'
      }
    })

    console.log('✅ Suscripción reactivada:', {
      id: response.id,
      status: response.status
    })

    return {
      id: response.id,
      status: response.status
    }
  } catch (error: any) {
    console.error('❌ Error reactivando suscripción:', error)
    throw new Error(`Error reactivando suscripción: ${error.message || 'Error desconocido'}`)
  }
}

