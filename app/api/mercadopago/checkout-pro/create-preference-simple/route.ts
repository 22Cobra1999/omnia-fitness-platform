import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';

/**
 * Endpoint SIMPLIFICADO para crear una preferencia de pago con Checkout Pro
 * 
 * Esta es una versión MINIMALISTA que solo incluye lo esencial para que funcione
 * con cuentas de prueba. Úsala para comparar y ver qué está causando el problema.
 * 
 * @route POST /api/mercadopago/checkout-pro/create-preference-simple
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validar autenticación
    const supabase = await createRouteHandlerClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'No autorizado', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { activityId } = await request.json();
    if (!activityId) {
      return NextResponse.json(
        { error: 'activityId es requerido' },
        { status: 400 }
      );
    }

    // 2. Obtener actividad
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('id, title, price')
      .eq('id', activityId)
      .single();

    if (activityError || !activity) {
      return NextResponse.json(
        { error: 'Actividad no encontrada' },
        { status: 404 }
      );
    }

    const totalAmount = parseFloat(activity.price?.toString() || '0');
    if (isNaN(totalAmount) || totalAmount <= 0) {
      return NextResponse.json(
        { error: 'Precio inválido' },
        { status: 400 }
      );
    }

    // 3. Usar token de prueba del marketplace (SIEMPRE para pruebas)
    const marketplaceToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() || '';
    
    if (!marketplaceToken) {
      return NextResponse.json(
        { error: 'Token de Mercado Pago no configurado' },
        { status: 500 }
      );
    }

    console.log('🔍 ========== PREFERENCIA SIMPLE ==========');
    console.log('🔍 Usando token del marketplace:', marketplaceToken.substring(0, 20) + '...');
    console.log('🔍 Monto:', totalAmount);

    // 4. Crear cliente de Mercado Pago
    const client = new MercadoPagoConfig({
      accessToken: marketplaceToken,
      options: { timeout: 5000 }
    });

    const preference = new Preference(client);

    // 5. Configuración MÍNIMA de la preferencia
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000').replace(/\/$/, '');

    const preferenceData = {
      // SOLO lo esencial
      items: [
        {
          title: activity.title,
          quantity: 1,
          unit_price: totalAmount,
          currency_id: 'ARS'
        }
      ],
      back_urls: {
        success: `${appUrl}/payment/success`,
        failure: `${appUrl}/payment/failure`,
        pending: `${appUrl}/payment/pending`
      },
      auto_return: 'approved' as const,
      payer: {
        email: session.user.email || 'test@test.com'
      }
      // NO incluir:
      // - marketplace_fee (puede causar problemas en prueba)
      // - payment_methods (usar defaults)
      // - metadata
      // - additional_info
      // - expires
      // - binary_mode
      // - statement_descriptor
    };

    console.log('📋 Preferencia simple:', JSON.stringify(preferenceData, null, 2));

    // 6. Crear preferencia
    let preferenceResponse;
    try {
      preferenceResponse = await preference.create({ body: preferenceData });
      console.log('✅ Preferencia creada:', {
        id: preferenceResponse.id,
        initPoint: preferenceResponse.sandbox_init_point || preferenceResponse.init_point
      });
    } catch (error: any) {
      console.error('❌ Error creando preferencia:', error);
      return NextResponse.json(
        { 
          error: 'Error creando preferencia',
          details: error.message
        },
        { status: 500 }
      );
    }

    // 7. Obtener init_point (preferir sandbox)
    const initPoint = preferenceResponse.sandbox_init_point || preferenceResponse.init_point;

    if (!initPoint) {
      return NextResponse.json(
        { error: 'No se recibió init_point' },
        { status: 500 }
      );
    }

    // Agregar locale
    const finalInitPoint = initPoint.includes('locale=') 
      ? initPoint 
      : `${initPoint}${initPoint.includes('?') ? '&' : '?'}locale=es-AR`;

    console.log('✅ ========== FIN PREFERENCIA SIMPLE ==========');

    return NextResponse.json({
      success: true,
      preferenceId: preferenceResponse.id,
      initPoint: finalInitPoint
    });

  } catch (error: any) {
    console.error('❌ Error inesperado:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error.message
      },
      { status: 500 }
    );
  }
}

