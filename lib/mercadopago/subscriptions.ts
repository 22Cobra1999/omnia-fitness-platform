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

// Función auxiliar para inicializar el cliente de manera perezosa (lazy)
// Esto evita errores si las variables de entorno no están listas al momento de importar el archivo
const getPreApprovalClient = () => {
  const mpMode = (process.env.MERCADOPAGO_MODE || '').toLowerCase() // 'test' | 'production'
  const forceTest = mpMode === 'test'
  const isProd = process.env.NODE_ENV === 'production'

  // En test mode siempre usar TEST token.
  // En production mode usar PROD token.
  // Si no se define MERCADOPAGO_MODE: prod => PROD token, dev => prefer TEST.
  const accessToken = forceTest
    ? (process.env.TEST_MP_SUBSCRIPTIONS_ACCESS_TOKEN || process.env.TEST_MERCADOPAGO_ACCESS_TOKEN)
    : (isProd
      ? (process.env.MP_SUBSCRIPTIONS_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN)
      : ((process.env.TEST_MP_SUBSCRIPTIONS_ACCESS_TOKEN || process.env.TEST_MERCADOPAGO_ACCESS_TOKEN) ||
        (process.env.MP_SUBSCRIPTIONS_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN)))
  
  if (!accessToken) {
    throw new Error(
      forceTest
        ? 'MercadoPago Access Token no configurado (modo TEST: falta TEST_MERCADOPAGO_ACCESS_TOKEN)'
        : (isProd
          ? 'MercadoPago Access Token no configurado (falta MERCADOPAGO_ACCESS_TOKEN)'
          : 'MercadoPago Access Token no configurado (falta TEST_MERCADOPAGO_ACCESS_TOKEN o MERCADOPAGO_ACCESS_TOKEN)')
    )
  }

  const client = new MercadoPagoConfig({
    accessToken: accessToken,
    options: { timeout: 5000 }
  })
  
  return new PreApproval(client) as any
}

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
  const mpMode = (process.env.MERCADOPAGO_MODE || '').toLowerCase()
  const forceTest = mpMode === 'test'
  const payerEmail = forceTest
    ? (process.env.TEST_MERCADOPAGO_PAYER_EMAIL || email)
    : email
  const rawAppUrl = (process.env.NEXT_PUBLIC_APP_URL?.trim() || '').replace(/\/$/, '')
  
  if (!rawAppUrl) {
    throw new Error(
      'NEXT_PUBLIC_APP_URL no configurado. Mercado Pago requiere back_url y notification_url con un dominio público (ej: https://tuapp.com o un ngrok https)'
    )
  }

  let appUrl: string
  try {
    const parsed = new URL(rawAppUrl)
    const host = parsed.hostname.toLowerCase()
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
      throw new Error('NEXT_PUBLIC_APP_URL apunta a localhost')
    }
    appUrl = parsed.toString().replace(/\/$/, '')
  } catch (e: any) {
    throw new Error(
      `NEXT_PUBLIC_APP_URL inválido para Mercado Pago: "${rawAppUrl}". Usá una URL pública válida (https). Detalle: ${e?.message || 'invalid URL'}`
    )
  }

  // Crear suscripción con cobro automático mensual
  const subscriptionData = {
    reason: reason || `Plan ${planType} - OMNIA`,
    external_reference: `coach_${coachId}_${planType}_${Date.now()}`,
    payer_email: payerEmail,
    auto_recurring: {
      frequency: 1, // 1 = mensual
      frequency_type: 'months', // 'months' o 'days'
      transaction_amount: planPrice.price,
      currency_id: planPrice.currency,
      start_date: new Date(Date.now() + 60000).toISOString(), // Comienza en 1 minuto
      // IMPORTANTE: No usar end_date: null en sandbox, puede causar problemas
      // Dejar que se renueve automáticamente sin especificar end_date
    },
    back_url: `${appUrl}/payment/subscription-success`,
    notification_url: `${appUrl}/api/payments/subscription-webhook`
    // IMPORTANTE: No especificar payment_methods_allowed para PreApproval
    // PreApproval mostrará los métodos disponibles según la cuenta del usuario
    // En sandbox, si el usuario tiene dinero en cuenta, puede que aparezca primero
    // Pero también debería mostrar opciones para agregar tarjetas
  }

    try {
      // Detectar si estamos en modo prueba (NO inferir por existencia de env vars, sino por modo/token usado)
      const isProd = process.env.NODE_ENV === 'production'
      const selectedAccessToken = forceTest
        ? ((process.env.TEST_MP_SUBSCRIPTIONS_ACCESS_TOKEN || process.env.TEST_MERCADOPAGO_ACCESS_TOKEN) || '')
        : (isProd
          ? ((process.env.MP_SUBSCRIPTIONS_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN) || '')
          : ((process.env.TEST_MP_SUBSCRIPTIONS_ACCESS_TOKEN || process.env.TEST_MERCADOPAGO_ACCESS_TOKEN) ||
            (process.env.MP_SUBSCRIPTIONS_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN) || ''))
      const isTestMode = forceTest || selectedAccessToken.startsWith('TEST-')
      console.log(`📅 Creando suscripción de Mercado Pago (${isTestMode ? 'MODO PRUEBA' : 'MODO PRODUCCIÓN'}):`, JSON.stringify(subscriptionData, null, 2))
      
      const response = await getPreApprovalClient().create({ body: subscriptionData })
      
      // En modo prueba, usar sandbox_init_point si está disponible
      const initPoint = isTestMode
        ? ((response as any).sandbox_init_point || (response as any).init_point)
        : ((response as any).init_point || (response as any).sandbox_init_point)
      
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
    const errorDetails = {
      message: error?.message,
      name: error?.name,
      status: error?.status,
      cause: error?.cause,
      response: error?.response?.data ?? error?.response ?? null
    }
    console.error('❌ Error creando suscripción:', errorDetails)
    throw new Error(
      `Error creando suscripción: ${error?.message || 'Error desconocido'} | details=${JSON.stringify(errorDetails)}`
    )
  }
}

/**
 * Obtiene información de una suscripción existente
 */
export async function getSubscriptionInfo(subscriptionId: string) {
  try {
    const response = await getPreApprovalClient().get({ preApprovalId: subscriptionId } as any)

    const nextPaymentDate =
      (response as any)?.next_payment_date ||
      (response as any)?.auto_recurring?.next_payment_date ||
      null

    return {
      id: response.id,
      status: response.status,
      reason: response.reason,
      payer_email: response.payer_email,
      auto_recurring: response.auto_recurring,
      payment_method_id: response.payment_method_id,
      card_id: (response as any).card_id,
      next_payment_date: nextPaymentDate
    }
  } catch (error: any) {
    const errorDetails = {
      message: error?.message,
      name: error?.name,
      status: error?.status,
      cause: error?.cause,
      response: error?.response?.data ?? error?.response ?? null
    }
    console.error('❌ Error obteniendo suscripción:', errorDetails)
    throw new Error(
      `Error obteniendo suscripción: ${error?.message || 'Error desconocido'} | details=${JSON.stringify(errorDetails)}`
    )
  }
}

/**
 * Cancela una suscripción de Mercado Pago
 */
export async function cancelSubscription(subscriptionId: string) {
  try {
    console.log('🚫 Cancelando suscripción:', subscriptionId)
    
    const response = await getPreApprovalClient().update(
      {
        preApprovalId: subscriptionId,
        body: {
          status: 'cancelled'
        }
      } as any
    )

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
    
    const response = await getPreApprovalClient().update(
      {
        preApprovalId: subscriptionId,
        body: {
          status: 'paused'
        }
      } as any
    )

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
    
    const response = await getPreApprovalClient().update(
      {
        preApprovalId: subscriptionId,
        body: {
          status: 'authorized'
        }
      } as any
    )

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
