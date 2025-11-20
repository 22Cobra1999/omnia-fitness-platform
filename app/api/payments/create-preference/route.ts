import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';
import { decrypt } from '@/lib/utils/encryption';

/**
 * Crea una preferencia de pago con Split Payment
 * Usa Checkout Pro (redirige a Mercado Pago)
 */
export async function POST(request: NextRequest) {
  try {
    const { enrollmentId, activityId } = await request.json();

    if (!enrollmentId || !activityId) {
      return NextResponse.json({ 
        error: 'enrollmentId y activityId son requeridos' 
      }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 1. Obtener datos de la actividad
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('id, title, price, coach_id')
      .eq('id', activityId)
      .single();

    if (activityError || !activity) {
      return NextResponse.json({ error: 'Actividad no encontrada' }, { status: 404 });
    }

    const coachId = activity.coach_id;
    const totalAmount = parseFloat(activity.price.toString());

    // 2. Obtener credenciales del coach
    const { data: coachCredentials, error: credsError } = await supabase
      .from('coach_mercadopago_credentials')
      .select('*')
      .eq('coach_id', coachId)
      .eq('oauth_authorized', true)
      .single();

    if (credsError || !coachCredentials) {
      return NextResponse.json({ 
        error: 'Coach no ha autorizado Mercado Pago. Debe completar el proceso OAuth primero.',
        requiresOAuth: true
      }, { status: 400 });
    }

    // 3. Calcular comisión de OMNIA usando función SQL
    const { data: commissionResult, error: commissionError } = await supabase
      .rpc('calculate_marketplace_commission', { 
        amount: totalAmount 
      });

    if (commissionError) {
      console.error('Error calculando comisión:', commissionError);
      return NextResponse.json({ error: 'Error calculando comisión' }, { status: 500 });
    }

    const marketplaceFee = parseFloat(commissionResult?.toString() || '0');
    const sellerAmount = totalAmount - marketplaceFee;

    // 4. Desencriptar access token del coach
    let coachAccessToken: string;
    try {
      coachAccessToken = decrypt(coachCredentials.access_token_encrypted);
    } catch (error) {
      console.error('Error desencriptando token:', error);
      return NextResponse.json({ error: 'Error procesando credenciales del coach' }, { status: 500 });
    }

    // 5. Crear preferencia usando el access_token del coach
    const client = new MercadoPagoConfig({
      accessToken: coachAccessToken,
      options: { timeout: 5000 }
    });

    const preference = new Preference(client);

    const preferenceData = {
      items: [
        {
          title: activity.title,
          quantity: 1,
          unit_price: totalAmount,
          currency_id: 'ARS'
        }
      ],
      marketplace_fee: marketplaceFee, // ⭐ Comisión de OMNIA (para Checkout Pro)
      external_reference: `enrollment_${enrollmentId}`,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?preference_id={preference_id}`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/payment/failure?preference_id={preference_id}`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/payment/pending?preference_id={preference_id}`
      },
      auto_return: 'approved',
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`
    };

    const response = await preference.create({ body: preferenceData });

    // 6. Guardar en banco
    const { error: bancoError } = await supabase.from('banco').insert({
      enrollment_id: enrollmentId,
      amount_paid: totalAmount,
      payment_status: 'pending',
      payment_method: 'mercadopago',
      currency: 'ARS',
      mercadopago_preference_id: response.id,
      marketplace_fee: marketplaceFee,
      seller_amount: sellerAmount,
      coach_mercadopago_user_id: coachCredentials.mercadopago_user_id,
      coach_access_token_encrypted: coachCredentials.access_token_encrypted,
      external_reference: `enrollment_${enrollmentId}`
    });

    if (bancoError) {
      console.error('Error guardando en banco:', bancoError);
      return NextResponse.json({ error: 'Error guardando registro de pago' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      preferenceId: response.id,
      initPoint: response.init_point, // URL para redirigir al checkout
      marketplaceFee,
      sellerAmount
    });

  } catch (error: any) {
    console.error('Error creando preferencia:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}








