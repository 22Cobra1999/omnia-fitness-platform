import { NextRequest, NextResponse } from 'next/server';
import { createClientWithCookies } from '../../../lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = request.cookies;
    const supabase = await createClientWithCookies(cookieStore);

    console.log('🚨 INICIANDO FIX URGENTE DEL TRIGGER...');

    // 1. Limpiar todas las ejecuciones existentes
    console.log('🗑️ Eliminando ejecuciones existentes...');
    const { error: deleteError } = await supabase
      .from('ejecuciones_ejercicio')
      .delete()
      .neq('id', 0);

    if (deleteError) {
      console.error('Error eliminando ejecuciones:', deleteError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error eliminando ejecuciones existentes',
        details: deleteError 
      });
    }

    // 2. Limpiar enrollments de prueba
    console.log('🗑️ Limpiando enrollments de prueba...');
    const testUserId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';
    await supabase
      .from('activity_enrollments')
      .delete()
      .eq('client_id', testUserId)
      .eq('activity_id', 59);

    // 3. Verificar estado inicial
    const { data: initialExecutions } = await supabase
      .from('ejecuciones_ejercicio')
      .select('*');

    // // console.log('📊 Estado inicial - Ejecuciones:', initialExecutions?.length || 0);

    // 4. Crear un enrollment de prueba
    console.log('🧪 Creando enrollment de prueba...');
    const { data: newEnrollment, error: enrollmentError } = await supabase
      .from('activity_enrollments')
      .insert({
        activity_id: 59,
        client_id: testUserId,
        status: 'activa'
      })
      .select()
      .single();

    if (enrollmentError) {
      console.error('Error creando enrollment:', enrollmentError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error creando enrollment de prueba',
        details: enrollmentError 
      });
    }

    // console.log('✅ Enrollment creado:', newEnrollment.id);

    // 5. Esperar un momento para que el trigger se ejecute
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 6. Verificar ejecuciones generadas
    const { data: executions, error: executionsError } = await supabase
      .from('ejecuciones_ejercicio')
      .select('*')
      .eq('client_id', testUserId);

    const totalExecutions = executions?.length || 0;
    const expectedExecutions = 19 * 2; // 19 ejercicios × 2 períodos
    const withClientId = executions?.filter(e => e.client_id).length || 0;
    const withoutClientId = executions?.filter(e => !e.client_id).length || 0;

    // 7. Agrupar por período
    const periodGroups = executions?.reduce((acc, exec) => {
      const key = `${exec.periodo_id}-${exec.numero_periodo}`;
      if (!acc[key]) {
        acc[key] = {
          periodo_id: exec.periodo_id,
          numero_periodo: exec.numero_periodo,
          total: 0,
          con_client_id: 0,
          sin_client_id: 0
        };
      }
      acc[key].total++;
      if (exec.client_id) {
        acc[key].con_client_id++;
      } else {
        acc[key].sin_client_id++;
      }
      return acc;
    }, {} as Record<string, any>) || {};

    const result = {
      success: true,
      message: totalExecutions === expectedExecutions ? '✅ TRIGGER CORREGIDO' : '❌ PROBLEMA PERSISTE',
      data: {
        enrollment: newEnrollment,
        executions: {
          total: totalExecutions,
          expected: expectedExecutions,
          correct: totalExecutions === expectedExecutions,
          withClientId,
          withoutClientId,
          periodGroups: Object.values(periodGroups),
          sample: executions?.slice(0, 5) || []
        },
        status: {
          triggerFixed: totalExecutions === expectedExecutions,
          noDuplicates: totalExecutions <= expectedExecutions,
          clientIdInserted: withoutClientId === 0
        }
      }
    };

    // // console.log('📊 Resultado:', result.data.executions);
    // console.log('🎯 Estado:', result.data.status);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error en urgent-fix-trigger:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}
































