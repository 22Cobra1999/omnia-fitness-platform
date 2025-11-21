import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';
import { decrypt } from '@/lib/utils/encryption';

/**
 * Endpoint para crear una preferencia de pago con Checkout Pro
 * 
 * Este endpoint crea una preferencia de pago en Mercado Pago que redirige al usuario
 * al checkout de Mercado Pago para completar el pago.
 * 
 * @route POST /api/mercadopago/checkout-pro/create-preference
 * 
 * @security Requiere autenticación
 * 
 * @body {string} activityId - ID de la actividad a comprar
 * 
 * @returns {object} Objeto con preferenceId e initPoint para redirigir al checkout
 * 
 * @example
 * POST /api/mercadopago/checkout-pro/create-preference
 * {
 *   "activityId": "123"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validar autenticación
    const supabase = await createRouteHandlerClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { 
          error: 'No autorizado',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    const clientId = session.user.id;
    const clientEmail = session.user.email;

    if (!clientEmail) {
      return NextResponse.json(
        { 
          error: 'Email del usuario no encontrado',
          code: 'MISSING_EMAIL'
        },
        { status: 400 }
      );
    }

    // 2. Validar y parsear body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Body inválido',
          code: 'INVALID_BODY'
        },
        { status: 400 }
      );
    }

    const { activityId } = body;

    if (!activityId) {
      return NextResponse.json(
        { 
          error: 'activityId es requerido',
          code: 'MISSING_ACTIVITY_ID'
        },
        { status: 400 }
      );
    }

    // 3. Obtener datos de la actividad
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('id, title, price, coach_id, type')
      .eq('id', activityId)
      .single();

    if (activityError || !activity) {
      return NextResponse.json(
        { 
          error: 'Actividad no encontrada',
          code: 'ACTIVITY_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const coachId = activity.coach_id;
    const totalAmount = parseFloat(activity.price?.toString() || '0');

    // 4. Validar monto
    if (isNaN(totalAmount) || totalAmount <= 0) {
      return NextResponse.json(
        { 
          error: 'El precio de la actividad debe ser mayor a 0',
          code: 'INVALID_AMOUNT',
          details: `Precio recibido: ${activity.price}`
        },
        { status: 400 }
      );
    }

    // Advertencia si el monto es muy bajo (puede causar problemas en el checkout)
    if (totalAmount < 1) {
      console.warn(`⚠️ Monto muy bajo detectado: $${totalAmount}. Mercado Pago puede tener restricciones con montos menores a $1.`);
    }
    
    // Validar que el monto sea válido para evitar problemas con el botón
    if (totalAmount <= 0 || isNaN(totalAmount)) {
      return NextResponse.json(
        { 
          error: 'El monto debe ser mayor a 0',
          code: 'INVALID_AMOUNT',
          details: `Monto recibido: ${totalAmount}`
        },
        { status: 400 }
      );
    }

    // 5. Obtener credenciales del coach
    const { getSupabaseAdmin } = await import('@/lib/config/db');
    const adminSupabase = await getSupabaseAdmin();
    
    const { data: coachCredentials, error: credsError } = await adminSupabase
      .from('coach_mercadopago_credentials')
      .select('*')
      .eq('coach_id', coachId)
      .eq('oauth_authorized', true)
      .maybeSingle();

    if (credsError) {
      console.error('Error consultando credenciales del coach:', credsError);
      return NextResponse.json(
        { 
          error: 'Error al verificar credenciales del coach',
          code: 'COACH_CREDENTIALS_ERROR',
          details: credsError.message
        },
        { status: 500 }
      );
    }

    if (!coachCredentials) {
      return NextResponse.json(
        { 
          error: 'El coach de esta actividad no ha configurado Mercado Pago. Por favor, contacta al coach para que configure su cuenta de Mercado Pago antes de realizar la compra.',
          code: 'COACH_NOT_CONFIGURED',
          requiresCoachSetup: true
        },
        { status: 400 }
      );
    }

    // 6. Calcular comisión de OMNIA
    const { data: commissionResult, error: commissionError } = await supabase
      .rpc('calculate_marketplace_commission', { 
        amount: totalAmount 
      });

    if (commissionError) {
      console.error('Error calculando comisión:', commissionError);
      return NextResponse.json(
        { 
          error: 'Error calculando comisión',
          code: 'COMMISSION_CALCULATION_ERROR'
        },
        { status: 500 }
      );
    }

    const marketplaceFee = parseFloat(commissionResult?.toString() || '0');
    const sellerAmount = totalAmount - marketplaceFee;

    // Validar que la comisión no sea mayor que el monto total
    if (marketplaceFee >= totalAmount) {
      return NextResponse.json(
        { 
          error: 'Error en el cálculo de comisión',
          code: 'INVALID_COMMISSION',
          details: `Comisión: ${marketplaceFee}, Monto total: ${totalAmount}`
        },
        { status: 500 }
      );
    }

    // 7. Desencriptar access token del coach
    let coachAccessToken: string;
    try {
      coachAccessToken = decrypt(coachCredentials.access_token_encrypted);
    } catch (error) {
      console.error('Error desencriptando token:', error);
      return NextResponse.json(
        { 
          error: 'Error procesando credenciales del coach',
          code: 'TOKEN_DECRYPTION_ERROR'
        },
        { status: 500 }
      );
    }

    // 8. Obtener información del cliente (con todos los campos disponibles)
    const { data: clientProfile } = await supabase
      .from('profiles')
      .select('name, surname, phone, address, dni, document_type')
      .eq('id', clientId)
      .single();

    // 9. Configurar URLs
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000').replace(/\/$/, '');
    
    const backUrls = {
      success: `${appUrl}/payment/success`,
      failure: `${appUrl}/payment/failure`,
      pending: `${appUrl}/payment/pending`
    };

    // 10. Crear external_reference único
    const externalReference = `omnia_${activityId}_${clientId}_${Date.now()}`;

    // 11. Crear preferencia de pago
    const client = new MercadoPagoConfig({
      accessToken: coachAccessToken,
      options: { timeout: 5000 }
    });

    const preference = new Preference(client);

    const preferenceData = {
      items: [
        {
          id: String(activityId),
          title: activity.title,
          quantity: 1,
          unit_price: totalAmount,
          currency_id: 'ARS'
        }
      ],
      // Solo incluir marketplace_fee si es válido
      ...(marketplaceFee > 0 && sellerAmount > 0 ? { marketplace_fee: marketplaceFee } : {}),
      external_reference: externalReference,
      back_urls: backUrls,
      auto_return: 'approved' as const,
      notification_url: `${appUrl}/api/mercadopago/webhook`,
      payer: {
        email: clientEmail,
        name: clientProfile?.name || 'Cliente',
        surname: clientProfile?.surname || 'OMNIA',
        // Agregar phone si está disponible (puede ayudar con validaciones)
        ...(clientProfile?.phone ? { phone: { number: clientProfile.phone } } : {}),
        // Agregar identificación si está disponible (puede ser requerido para habilitar el botón)
        ...(clientProfile?.dni ? {
          identification: {
            type: clientProfile?.document_type || 'DNI',
            number: clientProfile.dni.toString()
          }
        } : {})
      },
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [],
        installments: 12,
        default_installments: 1
        // No incluir default_payment_method_id para permitir todos los métodos
      },
      statement_descriptor: 'OMNIA',
      binary_mode: false,
      // Configuraciones adicionales para mejorar la experiencia
      expires: false
      // No incluir expiration_date_from y expiration_date_to si expires es false
    };

    console.log('📋 Creando preferencia con los siguientes datos:', {
      totalAmount,
      marketplaceFee,
      sellerAmount,
      clientEmail,
      payer: {
        email: preferenceData.payer.email,
        name: preferenceData.payer.name,
        surname: preferenceData.payer.surname,
        hasPhone: !!preferenceData.payer.phone,
        hasIdentification: !!preferenceData.payer.identification
      },
      items: preferenceData.items,
      payment_methods: preferenceData.payment_methods,
      hasMarketplaceFee: !!(marketplaceFee > 0 && sellerAmount > 0),
      back_urls: preferenceData.back_urls,
      auto_return: preferenceData.auto_return,
      expires: preferenceData.expires
    });
    
    // Log completo de la preferencia (para debugging)
    console.log('🔍 Preferencia completa que se enviará a Mercado Pago:', JSON.stringify(preferenceData, null, 2));

    let preferenceResponse;
    try {
      preferenceResponse = await preference.create({ body: preferenceData });
      console.log('✅ Preferencia creada exitosamente:', {
        preferenceId: preferenceResponse.id,
        initPoint: preferenceResponse.init_point || preferenceResponse.sandbox_init_point,
        hasInitPoint: !!(preferenceResponse.init_point || preferenceResponse.sandbox_init_point)
      });
    } catch (error: any) {
      console.error('❌ Error creando preferencia:', error);
      console.error('Detalles del error:', {
        message: error.message,
        cause: error.cause,
        status: error.status,
        statusCode: error.statusCode,
        response: error.response
      });
      return NextResponse.json(
        { 
          error: 'Error creando preferencia de pago',
          code: 'PREFERENCE_CREATION_ERROR',
          details: error.message || 'Error desconocido'
        },
        { status: 500 }
      );
    }

    // 12. Guardar en banco (sin enrollment todavía)
    const { error: bancoError } = await supabase.from('banco').insert({
      enrollment_id: null,
      activity_id: activityId,
      client_id: clientId,
      amount_paid: totalAmount,
      payment_status: 'pending',
      payment_method: 'mercadopago',
      currency: 'ARS',
      mercadopago_preference_id: preferenceResponse.id,
      marketplace_fee: marketplaceFee,
      seller_amount: sellerAmount,
      coach_mercadopago_user_id: coachCredentials.mercadopago_user_id,
      coach_access_token_encrypted: coachCredentials.access_token_encrypted,
      external_reference: externalReference
    });

    if (bancoError) {
      console.error('Error guardando en banco:', bancoError);
      // No fallar la creación de la preferencia, solo loguear el error
      console.warn('⚠️ Preferencia creada pero no se pudo guardar en banco');
    }

    // 13. Obtener init_point (preferir sandbox_init_point en modo test)
    const initPoint = preferenceResponse.sandbox_init_point || preferenceResponse.init_point;

    if (!initPoint) {
      return NextResponse.json(
        { 
          error: 'No se recibió init_point de Mercado Pago',
          code: 'MISSING_INIT_POINT'
        },
        { status: 500 }
      );
    }

    // Agregar locale a la URL si no está presente
    const finalInitPoint = initPoint.includes('locale=') 
      ? initPoint 
      : `${initPoint}${initPoint.includes('?') ? '&' : '?'}locale=es-AR`;

    return NextResponse.json({
      success: true,
      preferenceId: preferenceResponse.id,
      initPoint: finalInitPoint,
      marketplaceFee,
      sellerAmount,
      externalReference
    });

  } catch (error: any) {
    console.error('Error inesperado en create-preference:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        code: 'INTERNAL_SERVER_ERROR',
        details: error.message
      },
      { status: 500 }
    );
  }
}

