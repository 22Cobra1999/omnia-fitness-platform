import { NextRequest, NextResponse } from 'next/server';
import { createClientWithCookies } from '../../../lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = request.cookies;
    const supabase = await createClientWithCookies(cookieStore);

    console.log('🧪 PROBANDO ENROLLMENT MANUAL...');

    // 1. Limpiar sistema
    const testUserId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';
    
    await supabase
      .from('ejecuciones_ejercicio')
      .delete()
      .neq('id', 0);

    await supabase
      .from('activity_enrollments')
      .delete()
      .eq('client_id', testUserId)
      .eq('activity_id', 59);

    // 2. Crear enrollment manual (esto debería disparar el trigger)
    console.log('📝 Creando enrollment manual...');
    
    const { data: newEnrollment, error: enrollmentError } = await supabase
      .from('activity_enrollments')
      .insert({
        activity_id: 59,
        client_id: testUserId,
        status: 'activa',
        payment_status: 'paid',
        amount_paid: 0
      })
      .select()
      .single();

    if (enrollmentError) {
      console.error('Error creando enrollment:', enrollmentError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error creando enrollment',
        details: enrollmentError 
      });
    }

    // console.log('✅ Enrollment creado:', newEnrollment.id);

    // 3. Esperar para que el trigger se ejecute
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4. Verificar ejecuciones
    const { data: executions } = await supabase
      .from('ejecuciones_ejercicio')
      .select('*')
      .eq('client_id', testUserId);

    const totalExecutions = executions?.length || 0;
    const expectedExecutions = 19 * 2; // 19 ejercicios × 2 períodos
    const withClientId = executions?.filter(e => e.client_id).length || 0;
    const withoutClientId = executions?.filter(e => !e.client_id).length || 0;

    // 5. Análisis por período
    const periodAnalysis = executions?.reduce((acc, exec) => {
      const key = `${exec.periodo_id}-${exec.numero_periodo}`;
      if (!acc[key]) {
        acc[key] = {
          periodo_id: exec.periodo_id,
          numero_periodo: exec.numero_periodo,
          count: 0,
          with_client_id: 0,
          without_client_id: 0
        };
      }
      acc[key].count++;
      if (exec.client_id) {
        acc[key].with_client_id++;
      } else {
        acc[key].without_client_id++;
      }
      return acc;
    }, {} as Record<string, any>) || {};

    const result = {
      success: true,
      message: totalExecutions === expectedExecutions ? '🎉 TRIGGER FUNCIONANDO PERFECTAMENTE' : '❌ PROBLEMA PERSISTE',
      data: {
        enrollment: newEnrollment,
        executions: {
          total: totalExecutions,
          expected: expectedExecutions,
          correct: totalExecutions === expectedExecutions,
          withClientId,
          withoutClientId,
          periodAnalysis: Object.values(periodAnalysis),
          sample: executions?.slice(0, 5) || []
        },
        systemStatus: {
          triggerWorking: totalExecutions === expectedExecutions,
          noDuplicates: totalExecutions <= expectedExecutions,
          clientIdInserted: withoutClientId === 0,
          readyForProduction: totalExecutions === expectedExecutions && withoutClientId === 0
        }
      }
    };

    // // console.log('📊 Resultado:', result.data.executions);
    // console.log('🎯 Estado:', result.data.systemStatus);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error en test-manual-enrollment:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}
































