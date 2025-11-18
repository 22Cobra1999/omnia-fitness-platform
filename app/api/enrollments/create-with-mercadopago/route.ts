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
    // El coach DEBE tener Mercado Pago configurado para poder vender
    // Usar service role para leer credenciales del coach (RLS puede bloquear acceso del cliente)
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
      return NextResponse.json({ 
        error: 'Error al verificar credenciales del coach',
        details: credsError.message
      }, { status: 500 });
    }

    if (!coachCredentials) {
      console.log('Coach no tiene Mercado Pago configurado. Coach ID:', coachId);
      return NextResponse.json({ 
        error: 'El coach de esta actividad no ha configurado Mercado Pago. Por favor, contacta al coach para que configure su cuenta de Mercado Pago antes de realizar la compra.',
        requiresCoachSetup: true
      }, { status: 400 });
    }

    // Usar credenciales del coach
    const mercadopagoUserId = coachCredentials.mercadopago_user_id;

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

    // 5. Crear enrollment en estado "pendiente" (se activará cuando se apruebe el pago)
    // Nota: Usamos 'pendiente' porque es el valor permitido por la constraint de la BD
    // Nota: Solo incluimos los campos básicos que existen en la tabla según insert_enrollment.sql
    // Los campos de pago se guardan en la tabla 'banco' después
    const enrollmentData: any = {
      activity_id: activityId,
      client_id: clientId,
      status: 'pendiente', // Cambiado de 'pending' a 'pendiente' para cumplir con la constraint
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // Solo agregar progress si existe en la tabla (verificar primero)
    // progress puede no existir según algunas migraciones
    
    console.log('📝 Intentando crear enrollment con datos:', JSON.stringify(enrollmentData, null, 2));
    
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('activity_enrollments')
      .insert(enrollmentData)
      .select()
      .single();

    if (enrollmentError) {
      console.error('❌ Error creando enrollment:', enrollmentError);
      console.error('❌ Código de error:', enrollmentError.code);
      console.error('❌ Mensaje de error:', enrollmentError.message);
      console.error('❌ Detalles completos:', JSON.stringify(enrollmentError, null, 2));
      return NextResponse.json({ 
        error: 'Error creando inscripción',
        details: enrollmentError.message,
        code: enrollmentError.code,
        fullError: enrollmentError
      }, { status: 500 });
    }
    
    console.log('✅ Enrollment creado exitosamente:', enrollment.id);

    // 6. Desencriptar access token del coach
    let coachAccessToken: string;
    try {
      coachAccessToken = decrypt(coachCredentials.access_token_encrypted);
    } catch (error) {
      console.error('Error desencriptando token:', error);
      return NextResponse.json({ error: 'Error procesando credenciales del coach' }, { status: 500 });
    }

    // Validar que el token del coach sea de prueba para split payment
    const isTestToken = (token: string) => token.startsWith('TEST-');
    const isProductionToken = (token: string) => token.startsWith('APP_USR-');
    
    const coachTokenType = isTestToken(coachAccessToken) ? 'PRUEBA (TEST-)' : 
                          isProductionToken(coachAccessToken) ? 'PRODUCCIÓN (APP_USR-)' : 
                          'DESCONOCIDO';
    
    // Verificar si el token es de prueba (requerido para split payment en modo de prueba)
    if (!isTestToken(coachAccessToken)) {
      console.warn('⚠️ ADVERTENCIA: El access token del coach NO es de prueba:', coachTokenType);
      console.warn('⚠️ Para split payment en modo de prueba, el token del coach debe ser TEST-...');
      return NextResponse.json({ 
        error: 'Para realizar pagos de prueba, el coach debe usar credenciales de prueba (TEST-...). Por favor, el coach debe desconectar y volver a conectar su cuenta de Mercado Pago usando una cuenta de prueba (como ronaldinho).',
        tokenType: coachTokenType,
        requiresTestCredentials: true
      }, { status: 400 });
    }

    // 7. Crear preferencia de pago con Mercado Pago
    console.log('🔑 Usando Access Token del Coach');
    console.log('🔑 Tipo de token:', coachTokenType);
    console.log('💰 Monto total:', totalAmount);
    console.log('💵 Comisión marketplace:', marketplaceFee);
    console.log('👤 Monto para vendedor:', sellerAmount);
    
    const client = new MercadoPagoConfig({
      accessToken: coachAccessToken,
      options: { timeout: 5000 }
    });

    const preference = new Preference(client);

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000').replace(/\/$/, '');
    
    // Construir URLs de retorno - deben ser URLs completas y válidas
    // Mercado Pago requiere que back_urls.success esté definido si usamos auto_return
    const backUrls = {
      success: `${appUrl}/payment/success`,
      failure: `${appUrl}/payment/failure`,
      pending: `${appUrl}/payment/pending`
    };
    
    console.log('🔗 URLs de retorno:', JSON.stringify(backUrls, null, 2));
    console.log('🌐 App URL:', appUrl);
    
    // Construir preferencia - NO usar auto_return por ahora para evitar el error
    const preferenceData: any = {
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
        success: backUrls.success,
        failure: backUrls.failure,
        pending: backUrls.pending
      },
      notification_url: `${appUrl}/api/payments/webhook`
    };
    
    // No usar auto_return por ahora - el cliente será redirigido manualmente usando init_point

    console.log('📋 Creando preferencia con datos:', JSON.stringify(preferenceData, null, 2));

    let preferenceResponse;
    try {
      preferenceResponse = await preference.create({ body: preferenceData });
      console.log('✅ Preferencia creada exitosamente:', preferenceResponse.id);
      console.log('🔗 Init Point:', preferenceResponse.init_point);
    } catch (error: any) {
      console.error('❌ Error creando preferencia:', error);
      console.error('❌ Detalles del error:', JSON.stringify(error, null, 2));
      // Si falla, eliminar el enrollment creado
      await supabase.from('activity_enrollments').delete().eq('id', enrollment.id);
      return NextResponse.json({ 
        error: 'Error creando preferencia de pago',
        details: error.message || 'Error desconocido',
        fullError: error
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
      coach_mercadopago_user_id: mercadopagoUserId,
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

    const responseData = {
      success: true,
      enrollmentId: enrollment.id,
      preferenceId: preferenceResponse.id,
      initPoint: preferenceResponse.init_point, // URL para redirigir al checkout
      marketplaceFee,
      sellerAmount
    };
    
    console.log('✅ Respuesta exitosa:', JSON.stringify(responseData, null, 2));
    
    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('Error en create-with-mercadopago:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}


