/**
 * Utilidades para integración con Mercado Pago Checkout Pro
 * 
 * Este módulo proporciona funciones para interactuar con el Checkout Pro
 * de Mercado Pago desde el frontend.
 */

export interface CreatePreferenceResponse {
  success: boolean;
  preferenceId: string;
  initPoint: string;
  marketplaceFee?: number;
  sellerAmount?: number;
  externalReference?: string;
  error?: string;
  code?: string;
  details?: string;
  requiresCoachSetup?: boolean;
}

export interface CreatePreferenceError {
  error: string;
  code: string;
  details?: string;
  requiresCoachSetup?: boolean;
}

/**
 * Crea una preferencia de pago en Mercado Pago Checkout Pro
 * 
 * @param activityId - ID de la actividad a comprar
 * @returns Promise con la respuesta de la creación de preferencia
 * 
 * @throws {Error} Si hay un error en la creación de la preferencia
 * 
 * @example
 * ```typescript
 * try {
 *   const response = await createCheckoutProPreference('123');
 *   if (response.success) {
 *     window.location.href = response.initPoint;
 *   }
 * } catch (error) {
 *   console.error('Error:', error);
 * }
 * ```
 */
export async function createCheckoutProPreference(
  activityId: string | number
): Promise<CreatePreferenceResponse> {
  try {
    const response = await fetch('/api/mercadopago/checkout-pro/create-preference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        activityId: String(activityId),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Manejar errores específicos
      const error: CreatePreferenceError = {
        error: data.error || 'Error desconocido',
        code: data.code || 'UNKNOWN_ERROR',
        details: data.details,
        requiresCoachSetup: data.requiresCoachSetup,
      };

      throw new Error(JSON.stringify(error));
    }

    if (!data.success) {
      throw new Error(data.error || 'Error creando preferencia');
    }

    if (!data.initPoint) {
      throw new Error('No se recibió initPoint de Mercado Pago');
    }

    return data;
  } catch (error: any) {
    // Si el error ya es un string JSON con el formato correcto, parsearlo
    if (error.message && error.message.startsWith('{')) {
      try {
        const parsedError = JSON.parse(error.message);
        throw parsedError;
      } catch {
        // Si no se puede parsear, continuar con el error original
      }
    }

    console.error('Error creando preferencia de Checkout Pro:', error);
    throw error;
  }
}

/**
 * Redirige al usuario al checkout de Mercado Pago
 * 
 * @param initPoint - URL del init_point de Mercado Pago
 * @param activityId - ID de la actividad (opcional, para guardar en sessionStorage)
 * @param preferenceId - ID de la preferencia (opcional, para guardar en sessionStorage)
 */
export function redirectToMercadoPagoCheckout(
  initPoint: string,
  activityId?: string | number,
  preferenceId?: string
): void {
  // Guardar información de la compra en sessionStorage para detectar cancelación y retorno
  if (activityId && preferenceId && typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('pending_payment', JSON.stringify({
        activityId: String(activityId),
        preferenceId,
        timestamp: Date.now()
      }));
      // Guardar también para que el modal de compra sepa qué actividad mostrar al volver
      sessionStorage.setItem('last_purchase_activity_id', String(activityId));
    } catch (error) {
      console.warn('No se pudo guardar en sessionStorage:', error);
    }
  }

  // Redirigir a Mercado Pago
  if (typeof window !== 'undefined') {
    window.location.href = initPoint;
  }
}

/**
 * Maneja errores de creación de preferencia y muestra mensajes apropiados
 * 
 * @param error - Error recibido
 * @returns Mensaje de error amigable para el usuario
 */
export function getCheckoutProErrorMessage(error: any): string {
  if (typeof error === 'string') {
    try {
      const parsed = JSON.parse(error);
      return getCheckoutProErrorMessage(parsed);
    } catch {
      return error;
    }
  }

  if (error?.code) {
    switch (error.code) {
      case 'UNAUTHORIZED':
        return 'No estás autenticado. Por favor, inicia sesión.';
      case 'MISSING_EMAIL':
        return 'Tu cuenta no tiene un email asociado. Por favor, actualiza tu perfil.';
      case 'ACTIVITY_NOT_FOUND':
        return 'La actividad no fue encontrada.';
      case 'INVALID_AMOUNT':
        return 'El precio de la actividad no es válido.';
      case 'COACH_NOT_CONFIGURED':
        return 'El coach de esta actividad no ha configurado Mercado Pago. Por favor, contacta al coach.';
      case 'COACH_CREDENTIALS_ERROR':
        return 'Error al verificar las credenciales del coach.';
      case 'COMMISSION_CALCULATION_ERROR':
        return 'Error calculando la comisión. Por favor, intenta más tarde.';
      case 'TOKEN_DECRYPTION_ERROR':
        return 'Error procesando las credenciales del coach.';
      case 'PREFERENCE_CREATION_ERROR':
        return `Error creando la preferencia de pago: ${error.details || 'Error desconocido'}`;
      case 'MISSING_INIT_POINT':
        return 'No se recibió la URL de pago de Mercado Pago.';
      case 'INTERNAL_SERVER_ERROR':
        return 'Error interno del servidor. Por favor, intenta más tarde.';
      default:
        return error.error || 'Error desconocido al procesar el pago.';
    }
  }

  return error?.error || error?.message || 'Error desconocido al procesar el pago.';
}

