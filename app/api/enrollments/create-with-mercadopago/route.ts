import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { decrypt } from '@/lib/utils/encryption';

/**
 * Crea un enrollment y una preferencia de pago con Mercado Pago Split Payment
 * Reemplaza el flujo directo con el flujo de Mercado Pago
 */
export async function POST(request: NextRequest) {
  try {
    const { activityId, paymentMethod, notes } = await request.json();

    if (!activityId) {
      return NextResponse.json({ error: 'activityId es requerido' }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const clientId = session.user.id;

    // Permitir múltiples compras - eliminada validación de compra única
    // 1. Obtener datos de la actividad
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('id, title, price, coach_id, type')
      .eq('id', activityId)
      .single();

    if (activityError || !activity) {
      return NextResponse.json({ error: 'Actividad no encontrada' }, { status: 404 });
    }

    const coachId = activity.coach_id;
    const totalAmount = parseFloat(activity.price.toString());

    // 3. Verificar que el coach tenga Mercado Pago autorizado
    const { data: coachCredentials, error: credsError } = await supabase
      .from('coach_mercadopago_credentials')
      .select('*')
      .eq('coach_id', coachId)
      .eq('oauth_authorized', true)
      .single();

    if (credsError || !coachCredentials) {
      return NextResponse.json({ 
        error: 'El coach no ha configurado Mercado Pago. Por favor, contacta al coach.',
        requiresCoachSetup: true
      }, { status: 400 });
    }

    // 4. Calcular comisión de OMNIA
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

    // 5. Crear enrollment en estado "pending" (se activará cuando se apruebe el pago)
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('activity_enrollments')
      .insert({
        activity_id: activityId,
        client_id: clientId,
        status: 'pending',
        progress: 0,
        amount_paid: 0,
        payment_method: 'mercadopago',
        payment_status: 'pending',
        metadata: {
          notes: notes || 'Compra desde la aplicación',
          purchase_type: 'mercadopago',
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (enrollmentError) {
      console.error('Error creando enrollment:', enrollmentError);
      return NextResponse.json({ error: 'Error creando inscripción' }, { status: 500 });
    }

    // 6. Desencriptar access token del coach
    let coachAccessToken: string;
    try {
      coachAccessToken = decrypt(coachCredentials.access_token_encrypted);
    } catch (error) {
      console.error('Error desencriptando token:', error);
      return NextResponse.json({ error: 'Error procesando credenciales del coach' }, { status: 500 });
    }

    // 7. Crear preferencia de pago con Mercado Pago
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
      marketplace_fee: marketplaceFee, // Comisión de OMNIA
      external_reference: `enrollment_${enrollment.id}`,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?preference_id={preference_id}`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/payment/failure?preference_id={preference_id}`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/payment/pending?preference_id={preference_id}`
      },
      auto_return: 'approved',
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`
    };

    let preferenceResponse;
    try {
      preferenceResponse = await preference.create({ body: preferenceData });
    } catch (error: any) {
      console.error('Error creando preferencia:', error);
      // Si falla, eliminar el enrollment creado
      await supabase.from('activity_enrollments').delete().eq('id', enrollment.id);
      return NextResponse.json({ 
        error: 'Error creando preferencia de pago',
        details: error.message 
      }, { status: 500 });
    }

    // 8. Guardar en banco
    const { error: bancoError } = await supabase.from('banco').insert({
      enrollment_id: enrollment.id,
      amount_paid: totalAmount,
      payment_status: 'pending',
      payment_method: 'mercadopago',
      currency: 'ARS',
      mercadopago_preference_id: preferenceResponse.id,
      marketplace_fee: marketplaceFee,
      seller_amount: sellerAmount,
      coach_mercadopago_user_id: coachCredentials.mercadopago_user_id,
      coach_access_token_encrypted: coachCredentials.access_token_encrypted,
      external_reference: `enrollment_${enrollment.id}`
    });

    if (bancoError) {
      console.error('Error guardando en banco:', bancoError);
      // No eliminar enrollment, pero registrar el error
    }

    // 9. Si es un programa, duplicar detalles
    if (activity.type === 'fitness_program' || activity.type === 'nutrition_program') {
      await supabase.rpc('duplicate_program_details_on_enrollment', {
        p_activity_id: activityId,
        p_client_id: clientId,
        p_enrollment_id: enrollment.id,
        p_program_type: activity.type,
      }).catch((err) => {
        console.error('Error duplicando detalles del programa:', err);
        // No fallar la transacción por esto
      });
    }

    return NextResponse.json({
      success: true,
      enrollmentId: enrollment.id,
      preferenceId: preferenceResponse.id,
      initPoint: preferenceResponse.init_point, // URL para redirigir al checkout
      marketplaceFee,
      sellerAmount
    });

  } catch (error: any) {
    console.error('Error en create-with-mercadopago:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}


