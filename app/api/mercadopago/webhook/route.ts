import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';

/**
 * Webhook de Mercado Pago para recibir notificaciones de pagos
 * 
 * Este endpoint recibe notificaciones de Mercado Pago cuando cambia el estado
 * de un pago. Valida la notificación y actualiza el estado en la base de datos.
 * 
 * @route POST /api/mercadopago/webhook
 * 
 * @security Validación de origen de Mercado Pago (recomendado implementar)
 * 
 * @body {object} Notificación de Mercado Pago
 * 
 * @returns {object} Confirmación de recepción
 * 
 * @see https://www.mercadopago.com/developers/es/docs/your-integrations/notifications/webhooks
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parsear body de la notificación
    let notificationData;
    try {
      notificationData = await request.json();
    } catch (error) {
      console.error('Error parseando body del webhook:', error);
      return NextResponse.json(
        { error: 'Body inválido' },
        { status: 400 }
      );
    }

    const { type, data: paymentData, live_mode, action, api_version } = notificationData;

    console.log('📥 Webhook recibido:', { 
      type, 
      paymentId: paymentData?.id, 
      live_mode,
      action,
      api_version
    });

    // 2. Validar tipo de notificación
    if (type !== 'payment') {
      console.log('ℹ️ Notificación de tipo no manejado:', type);
      // Retornar 200 para otros tipos de notificaciones
      return NextResponse.json({ received: true });
    }

    // 3. Validar que hay payment_id
    const paymentId = paymentData?.id;
    if (!paymentId) {
      console.error('❌ payment_id no encontrado en la notificación');
      return NextResponse.json(
        { error: 'payment_id no encontrado' },
        { status: 400 }
      );
    }

    // 4. Obtener access token de OMNIA para consultar el pago
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
    if (!accessToken) {
      console.error('❌ MERCADOPAGO_ACCESS_TOKEN no configurado');
      return NextResponse.json(
        { error: 'Configuración incorrecta' },
        { status: 500 }
      );
    }

    // 5. Consultar detalles del pago en Mercado Pago
    const client = new MercadoPagoConfig({
      accessToken,
      options: { timeout: 5000 }
    });

    const payment = new Payment(client);
    let paymentDetails;

    try {
      paymentDetails = await payment.get({ id: paymentId });
    } catch (error: any) {
      console.error('❌ Error obteniendo detalles del pago:', error);
      
      // Si es un error 404, puede ser una notificación de prueba
      if (error.status === 404 || error.message?.includes('not found') || error.message?.includes('no encontrado')) {
        console.log('⚠️ Pago no encontrado (probablemente notificación de prueba)');
        return NextResponse.json(
          { received: true, message: 'Pago no encontrado' },
          { status: 200 }
        );
      }
      
      return NextResponse.json(
        { error: 'Error consultando pago' },
        { status: 500 }
      );
    }

    // 6. Validar que paymentDetails es válido
    if (!paymentDetails || !paymentDetails.id) {
      console.error('❌ PaymentDetails inválido:', paymentDetails);
      return NextResponse.json(
        { received: true, message: 'PaymentDetails inválido' },
        { status: 200 }
      );
    }

    // 7. Buscar registro en banco
    const supabase = await createRouteHandlerClient();
    
    let query = supabase.from('banco').select('*');
    const conditions: string[] = [];
    
    if (paymentDetails.preference_id) {
      conditions.push(`mercadopago_preference_id.eq.${paymentDetails.preference_id}`);
    }
    
    if (paymentDetails.external_reference) {
      conditions.push(`external_reference.eq.${paymentDetails.external_reference}`);
    }
    
    if (conditions.length === 0) {
      conditions.push(`mercadopago_payment_id.eq.${paymentDetails.id}`);
    }
    
    if (conditions.length > 0) {
      query = query.or(conditions.join(','));
    } else {
      console.error('❌ No hay identificadores válidos para buscar en banco');
      return NextResponse.json(
        { received: true, message: 'No hay identificadores válidos' },
        { status: 200 }
      );
    }

    const { data: bancoRecord, error: bancoError } = await query.maybeSingle();

    if (bancoError || !bancoRecord) {
      console.log('⚠️ Registro de banco no encontrado');
      console.log('   Preference ID:', paymentDetails.preference_id);
      console.log('   External Reference:', paymentDetails.external_reference);
      console.log('   Payment ID:', paymentDetails.id);
      return NextResponse.json(
        { received: true, message: 'Registro de banco no encontrado' },
        { status: 200 }
      );
    }

    // 8. Calcular marketplace_fee y seller_amount
    const marketplaceFeeDetail = paymentDetails.fee_details?.find(
      (fee: any) => fee.type === 'marketplace_fee'
    );
    const marketplaceFee = marketplaceFeeDetail?.amount || bancoRecord.marketplace_fee || 0;
    const sellerAmount = paymentDetails.transaction_details?.net_received_amount || 
                        (bancoRecord.amount_paid - marketplaceFee);

    // 9. Actualizar registro en banco
    const { error: updateError } = await supabase
      .from('banco')
      .update({
        mercadopago_payment_id: paymentDetails.id,
        mercadopago_status: paymentDetails.status,
        mercadopago_status_detail: paymentDetails.status_detail,
        mercadopago_payment_type_id: paymentDetails.payment_type_id,
        mercadopago_installments: paymentDetails.installments,
        mercadopago_fee: paymentDetails.fee_details?.reduce((sum: number, fee: any) => sum + (fee.amount || 0), 0) || 0,
        mercadopago_net_amount: paymentDetails.transaction_details?.net_received_amount || 0,
        mercadopago_currency_id: paymentDetails.currency_id,
        mercadopago_date_approved: paymentDetails.date_approved,
        mercadopago_date_created: paymentDetails.date_created,
        mercadopago_date_last_updated: paymentDetails.date_last_updated,
        mercadopago_collector_id: paymentDetails.collector_id?.toString(),
        payment_status: paymentDetails.status === 'approved' ? 'completed' : 
                       paymentDetails.status === 'rejected' ? 'failed' :
                       paymentDetails.status === 'cancelled' ? 'cancelled' : 'pending',
        marketplace_fee: marketplaceFee,
        seller_amount: sellerAmount,
        webhook_received: true,
        webhook_data: notificationData
      })
      .eq('id', bancoRecord.id);

    if (updateError) {
      console.error('❌ Error actualizando registro de banco:', updateError);
      return NextResponse.json(
        { error: 'Error actualizando registro de banco' },
        { status: 500 }
      );
    }

    // 10. Si el pago fue aprobado, crear/activar enrollment
    if (paymentDetails.status === 'approved') {
      await handleApprovedPayment(supabase, bancoRecord, paymentDetails);
    } else if (paymentDetails.status === 'rejected' || paymentDetails.status === 'cancelled') {
      await handleRejectedPayment(supabase, bancoRecord);
    } else if (paymentDetails.status === 'pending') {
      // Si el pago está pendiente pero ya tenemos activity_id y client_id, 
      // crear el enrollment en estado 'pending' para que esté listo cuando se apruebe
      console.log('⏳ Pago pendiente - verificando si crear enrollment...');
      if (!bancoRecord.enrollment_id && bancoRecord.activity_id && bancoRecord.client_id) {
        console.log('📝 Creando enrollment en estado pendiente...');
        await handlePendingPayment(supabase, bancoRecord);
      }
    }

    console.log('✅ Webhook procesado correctamente:', paymentId);
    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('❌ Error procesando webhook:', error);
    return NextResponse.json(
      { 
        error: 'Error procesando webhook',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * Maneja un pago aprobado: crea o activa el enrollment
 */
async function handleApprovedPayment(
  supabase: any,
  bancoRecord: any,
  paymentDetails: any
) {
  let enrollmentId = bancoRecord.enrollment_id;
  
  // Si no hay enrollment_id, crear el enrollment
  if (!enrollmentId && bancoRecord.activity_id && bancoRecord.client_id) {
    console.log('📝 Creando enrollment para pago aprobado...');
    
    const { data: newEnrollment, error: enrollmentCreateError } = await supabase
      .from('activity_enrollments')
      .insert({
        activity_id: bancoRecord.activity_id,
        client_id: bancoRecord.client_id,
        status: 'activa',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (enrollmentCreateError) {
      console.error('❌ Error creando enrollment:', enrollmentCreateError);
      return;
    }

    enrollmentId = newEnrollment.id;
    console.log('✅ Enrollment creado:', enrollmentId);
    
    // Actualizar banco con el enrollment_id
    await supabase
      .from('banco')
      .update({ enrollment_id: enrollmentId })
      .eq('id', bancoRecord.id);
    
    // Si es un programa, duplicar detalles
    const { data: activity } = await supabase
      .from('activities')
      .select('type')
      .eq('id', bancoRecord.activity_id)
      .single();
  
    if (activity && (activity.type === 'fitness_program' || activity.type === 'nutrition_program')) {
      console.log('📋 Duplicando detalles del programa...');
      await supabase.rpc('duplicate_program_details_on_enrollment', {
        p_activity_id: bancoRecord.activity_id,
        p_client_id: bancoRecord.client_id,
        p_enrollment_id: enrollmentId,
        p_program_type: activity.type,
      }).catch((err) => {
        console.error('Error duplicando detalles del programa:', err);
      });
    }
  } else if (enrollmentId) {
    // Si ya existe el enrollment, activarlo
    const { error: enrollmentUpdateError } = await supabase
      .from('activity_enrollments')
      .update({
        status: 'activa',
        updated_at: new Date().toISOString()
      })
      .eq('id', enrollmentId);

    if (enrollmentUpdateError) {
      console.error('Error activando enrollment:', enrollmentUpdateError);
    } else {
      console.log('✅ Enrollment activado:', enrollmentId);
    }
  }
}

/**
 * Maneja un pago pendiente: crea el enrollment en estado pendiente
 */
async function handlePendingPayment(
  supabase: any,
  bancoRecord: any
) {
  try {
    const { data: newEnrollment, error: enrollmentCreateError } = await supabase
      .from('activity_enrollments')
      .insert({
        activity_id: bancoRecord.activity_id,
        client_id: bancoRecord.client_id,
        status: 'pendiente',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (enrollmentCreateError) {
      console.error('❌ Error creando enrollment pendiente:', enrollmentCreateError);
      return;
    }

    const enrollmentId = newEnrollment.id;
    console.log('✅ Enrollment pendiente creado:', enrollmentId);
    
    // Actualizar banco con el enrollment_id
    await supabase
      .from('banco')
      .update({ enrollment_id: enrollmentId })
      .eq('id', bancoRecord.id);
  } catch (error: any) {
    console.error('❌ Error en handlePendingPayment:', error);
  }
}

/**
 * Maneja un pago rechazado o cancelado
 */
async function handleRejectedPayment(
  supabase: any,
  bancoRecord: any
) {
  console.log('⚠️ Pago rechazado o cancelado - no se crea enrollment');
  
  const enrollmentId = bancoRecord.enrollment_id;
  if (enrollmentId) {
    const { error: enrollmentUpdateError } = await supabase
      .from('activity_enrollments')
      .update({
        status: 'cancelada',
        updated_at: new Date().toISOString()
      })
      .eq('id', enrollmentId);

    if (enrollmentUpdateError) {
      console.error('Error actualizando enrollment rechazado:', enrollmentUpdateError);
    } else {
      console.log('⚠️ Enrollment marcado como cancelado:', enrollmentId);
    }
  }
}

