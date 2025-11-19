import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';

/**
 * Webhook de Mercado Pago
 * Recibe notificaciones de cambios en el estado de los pagos
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { type, data: paymentData, live_mode } = data;

    console.log('📥 Webhook recibido:', { 
      type, 
      paymentId: paymentData?.id, 
      live_mode,
      action: data.action,
      api_version: data.api_version
    });
    
    // Si es una notificación de prueba (live_mode: false) y no es un pago real, 
    // retornar 200 sin procesar
    if (live_mode === false && type === 'payment' && (!paymentData?.id || paymentData.id === '123456')) {
      console.log('ℹ️ Notificación de prueba detectada, retornando 200 sin procesar');
      return NextResponse.json({ 
        received: true, 
        message: 'Notificación de prueba recibida correctamente' 
      }, { status: 200 });
    }

    if (type === 'payment') {
      const paymentId = paymentData.id;

      if (!paymentId) {
        return NextResponse.json({ error: 'payment_id no encontrado' }, { status: 400 });
      }

      // Obtener access token de OMNIA para consultar el pago
      const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

      if (!accessToken) {
        console.error('MERCADOPAGO_ACCESS_TOKEN no configurado');
        return NextResponse.json({ error: 'Configuración incorrecta' }, { status: 500 });
      }

      // Consultar detalles del pago en Mercado Pago
      const client = new MercadoPagoConfig({
        accessToken: accessToken.trim(),
        options: { timeout: 5000 }
      });

      const payment = new Payment(client);
      let paymentDetails;

      try {
        paymentDetails = await payment.get({ id: paymentId });
      } catch (error: any) {
        console.error('Error obteniendo detalles del pago:', error);
        // Si es un error de pago no encontrado (probablemente es una notificación de prueba)
        // Retornar 200 para que Mercado Pago no reintente
        if (error.status === 404 || error.message?.includes('not found') || error.message?.includes('no encontrado')) {
          console.log('⚠️ Pago no encontrado en Mercado Pago (probablemente notificación de prueba)');
          return NextResponse.json({ 
            received: true, 
            message: 'Pago no encontrado (probablemente notificación de prueba)' 
          }, { status: 200 });
        }
        return NextResponse.json({ error: 'Error consultando pago' }, { status: 500 });
      }

      // Validar que paymentDetails existe y tiene datos válidos
      if (!paymentDetails || !paymentDetails.id) {
        console.error('PaymentDetails inválido:', paymentDetails);
        return NextResponse.json({ 
          received: true, 
          message: 'PaymentDetails inválido (probablemente notificación de prueba)' 
        }, { status: 200 });
      }

      const supabase = await createRouteHandlerClient();

      // Construir query para buscar en banco
      // Manejar casos donde preference_id o external_reference pueden ser null
      let query = supabase.from('banco').select('*');
      
      const conditions: string[] = [];
      
      if (paymentDetails.preference_id) {
        conditions.push(`mercadopago_preference_id.eq.${paymentDetails.preference_id}`);
      }
      
      if (paymentDetails.external_reference) {
        conditions.push(`external_reference.eq.${paymentDetails.external_reference}`);
      }
      
      // Si no hay preference_id ni external_reference, buscar por payment_id
      if (conditions.length === 0) {
        conditions.push(`mercadopago_payment_id.eq.${paymentDetails.id}`);
      }
      
      if (conditions.length > 0) {
        query = query.or(conditions.join(','));
      } else {
        // Si no hay ninguna condición, retornar error
        console.error('No hay preference_id, external_reference ni payment_id válidos');
        return NextResponse.json({ 
          received: true, 
          message: 'No hay identificadores válidos (probablemente notificación de prueba)' 
        }, { status: 200 });
      }

      const { data: bancoRecord, error: bancoError } = await query.maybeSingle();

      // Si no se encuentra el registro, puede ser una notificación de prueba
      // Retornar 200 para que Mercado Pago no reintente
      if (bancoError || !bancoRecord) {
        console.log('⚠️ Registro de banco no encontrado (probablemente notificación de prueba)');
        console.log('   Preference ID:', paymentDetails.preference_id);
        console.log('   External Reference:', paymentDetails.external_reference);
        console.log('   Payment ID:', paymentDetails.id);
        console.log('   Error:', bancoError);
        // Retornar 200 para notificaciones de prueba, 404 solo para errores reales
        return NextResponse.json({ 
          received: true, 
          message: 'Registro de banco no encontrado (probablemente notificación de prueba)' 
        }, { status: 200 });
      }

      // Calcular marketplace_fee y seller_amount desde los fee_details
      const marketplaceFeeDetail = paymentDetails.fee_details?.find(
        (fee: any) => fee.type === 'marketplace_fee'
      );
      const marketplaceFee = marketplaceFeeDetail?.amount || bancoRecord.marketplace_fee || 0;
      const sellerAmount = paymentDetails.transaction_details?.net_received_amount || 
                          (bancoRecord.amount_paid - marketplaceFee);

      // Actualizar banco con datos del pago
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
          webhook_data: data
        })
        .eq('id', bancoRecord.id);

      if (updateError) {
        console.error('Error actualizando registro de banco:', updateError);
        return NextResponse.json({ error: 'Error actualizando registro de banco' }, { status: 500 });
      }

      // Si el pago fue aprobado, crear enrollment si no existe
      if (paymentDetails.status === 'approved') {
        let enrollmentId = bancoRecord.enrollment_id;
        
        // Si no hay enrollment_id, crear el enrollment ahora
        if (!enrollmentId && bancoRecord.activity_id && bancoRecord.client_id) {
          console.log('📝 Creando enrollment para pago aprobado...');
          console.log('   Activity ID:', bancoRecord.activity_id);
          console.log('   Client ID:', bancoRecord.client_id);
          
          // Crear enrollment
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
            // No retornar error, el pago ya se registró
          } else {
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
                // No fallar la transacción por esto
              });
            }
          }
        } else if (enrollmentId) {
          // Si ya existe el enrollment, solo actualizar su status
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
        } else {
          console.warn('⚠️ No se puede crear enrollment: faltan activity_id o client_id en banco');
        }
      } else if (paymentDetails.status === 'rejected' || paymentDetails.status === 'cancelled') {
        // Si el pago fue rechazado o cancelado, NO crear enrollment
        // Solo registrar el estado en banco (ya se hizo arriba)
        console.log('⚠️ Pago rechazado o cancelado - no se crea enrollment');
        
        // Si por alguna razón ya existe un enrollment, marcarlo como cancelado
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

      console.log('✅ Webhook procesado correctamente:', paymentId);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Error procesando webhook:', error);
    return NextResponse.json({ 
      error: 'Error procesando webhook',
      details: error.message 
    }, { status: 500 });
  }
}






