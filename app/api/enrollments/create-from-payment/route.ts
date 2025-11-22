import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';

/**
 * Endpoint para crear enrollment desde un pago confirmado
 * Fallback cuando el webhook no crea el enrollment
 * 
 * @route POST /api/enrollments/create-from-payment
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { preferenceId, paymentId, activityId } = body;

    if (!preferenceId && !paymentId) {
      return NextResponse.json(
        { error: 'Se requiere preference_id o payment_id' },
        { status: 400 }
      );
    }

    console.log('🔄 Creando enrollment desde pago...');
    console.log('   Preference ID:', preferenceId);
    console.log('   Payment ID:', paymentId);
    console.log('   Activity ID:', activityId);
    console.log('   Client ID:', user.id);

    // 1. Buscar registro en banco
    let bancoRecord;
    
    if (preferenceId) {
      const { data, error } = await supabase
        .from('banco')
        .select('*')
        .eq('mercadopago_preference_id', preferenceId)
        .maybeSingle();
      
      if (error) {
        console.error('❌ Error buscando banco por preference_id:', error);
      } else {
        bancoRecord = data;
      }
    }
    
    if (!bancoRecord && paymentId) {
      const { data, error } = await supabase
        .from('banco')
        .select('*')
        .eq('mercadopago_payment_id', paymentId)
        .maybeSingle();
      
      if (error) {
        console.error('❌ Error buscando banco por payment_id:', error);
      } else {
        bancoRecord = data;
      }
    }

    if (!bancoRecord) {
      console.error('❌ Registro de banco no encontrado');
      return NextResponse.json(
        { error: 'Registro de pago no encontrado' },
        { status: 404 }
      );
    }

    console.log('✅ Registro de banco encontrado:', bancoRecord.id);
    console.log('   Activity ID:', bancoRecord.activity_id);
    console.log('   Client ID:', bancoRecord.client_id);
    console.log('   Enrollment ID actual:', bancoRecord.enrollment_id);
    console.log('   Payment Status:', bancoRecord.payment_status);
    console.log('   Mercado Pago Status:', bancoRecord.mercadopago_status);

    // 2. Verificar si ya existe enrollment
    if (bancoRecord.enrollment_id) {
      console.log('ℹ️ Enrollment ya existe:', bancoRecord.enrollment_id);
      
      // Verificar que el enrollment existe
      const { data: existingEnrollment } = await supabase
        .from('activity_enrollments')
        .select('id, status')
        .eq('id', bancoRecord.enrollment_id)
        .single();

      if (existingEnrollment) {
        return NextResponse.json({
          success: true,
          enrollmentId: bancoRecord.enrollment_id,
          alreadyExists: true,
          status: existingEnrollment.status
        });
      } else {
        console.warn('⚠️ Enrollment ID en banco pero no existe en activity_enrollments');
        // Continuar para crear uno nuevo
      }
    }

    // 3. Verificar que tenemos activity_id y client_id
    const finalActivityId = activityId || bancoRecord.activity_id;
    const finalClientId = bancoRecord.client_id || user.id;

    if (!finalActivityId || !finalClientId) {
      console.error('❌ Faltan datos requeridos:');
      console.error('   Activity ID:', finalActivityId);
      console.error('   Client ID:', finalClientId);
      return NextResponse.json(
        { error: 'Faltan datos requeridos (activity_id o client_id)' },
        { status: 400 }
      );
    }

    // 4. Determinar estado del enrollment basado en el estado del pago
    const paymentStatus = bancoRecord.mercadopago_status || bancoRecord.payment_status;
    const enrollmentStatus = paymentStatus === 'approved' || paymentStatus === 'completed' 
      ? 'activa' 
      : paymentStatus === 'pending' 
        ? 'pendiente' 
        : 'pendiente'; // Por defecto pendiente

    console.log('📝 Creando enrollment...');
    console.log('   Activity ID:', finalActivityId);
    console.log('   Client ID:', finalClientId);
    console.log('   Status:', enrollmentStatus);

    // 5. Crear enrollment
    const { data: newEnrollment, error: enrollmentError } = await supabase
      .from('activity_enrollments')
      .insert({
        activity_id: finalActivityId,
        client_id: finalClientId,
        status: enrollmentStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (enrollmentError) {
      console.error('❌ Error creando enrollment:', enrollmentError);
      console.error('   Detalles:', JSON.stringify(enrollmentError, null, 2));
      return NextResponse.json(
        { 
          error: 'Error creando enrollment',
          details: enrollmentError.message 
        },
        { status: 500 }
      );
    }

    const enrollmentId = newEnrollment.id;
    console.log('✅ Enrollment creado:', enrollmentId);

    // 6. Actualizar banco con enrollment_id
    const { error: updateError } = await supabase
      .from('banco')
      .update({ enrollment_id: enrollmentId })
      .eq('id', bancoRecord.id);

    if (updateError) {
      console.error('⚠️ Error actualizando banco con enrollment_id:', updateError);
      // No fallar, el enrollment ya se creó
    } else {
      console.log('✅ Banco actualizado con enrollment_id:', enrollmentId);
    }

    // 7. Si es un programa, duplicar detalles
    const { data: activity } = await supabase
      .from('activities')
      .select('type')
      .eq('id', finalActivityId)
      .single();

    if (activity && (activity.type === 'fitness_program' || activity.type === 'nutrition_program')) {
      console.log('📋 Duplicando detalles del programa...');
      try {
        const { error: duplicateError } = await supabase.rpc('duplicate_program_details_on_enrollment', {
          p_activity_id: finalActivityId,
          p_client_id: finalClientId,
          p_enrollment_id: enrollmentId,
          p_program_type: activity.type,
        });

        if (duplicateError) {
          console.error('⚠️ Error duplicando detalles del programa:', duplicateError);
        } else {
          console.log('✅ Detalles del programa duplicados correctamente');
        }
      } catch (err: any) {
        console.error('⚠️ Excepción al duplicar detalles del programa:', err);
      }
    }

    return NextResponse.json({
      success: true,
      enrollmentId,
      status: enrollmentStatus,
      alreadyExists: false
    });

  } catch (error: any) {
    console.error('❌ Error en create-from-payment:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

