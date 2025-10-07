import { NextRequest, NextResponse } from 'next/server';
import { createClientWithCookies } from '../../../lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = request.cookies;
    const supabase = await createClientWithCookies(cookieStore);

    // console.log('🔍 DIAGNOSTICANDO PROBLEMA DEL TRIGGER...');

    // 1. Verificar si hay múltiples triggers
    // console.log('🔍 Verificando triggers existentes...');
    
    // 2. Verificar la función actual
    // console.log('🔍 Verificando función actual...');
    
    // 3. Limpiar completamente el sistema
    console.log('🧹 Limpieza completa del sistema...');
    
    // Eliminar todas las ejecuciones
    const { error: deleteExecutionsError } = await supabase
      .from('ejecuciones_ejercicio')
      .delete()
      .neq('id', 0);

    if (deleteExecutionsError) {
      console.error('Error eliminando ejecuciones:', deleteExecutionsError);
    }

    // Eliminar enrollments de prueba
    const testUserId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';
    const { error: deleteEnrollmentsError } = await supabase
      .from('activity_enrollments')
      .delete()
      .eq('client_id', testUserId)
      .eq('activity_id', 59);

    if (deleteEnrollmentsError) {
      console.error('Error eliminando enrollments:', deleteEnrollmentsError);
    }

    // 4. Verificar estado limpio
    const { data: cleanExecutions } = await supabase
      .from('ejecuciones_ejercicio')
      .select('*');

    const { data: cleanEnrollments } = await supabase
      .from('activity_enrollments')
      .select('*')
      .eq('client_id', testUserId);

    // // console.log('📊 Estado limpio - Ejecuciones:', cleanExecutions?.length || 0);
    // // console.log('📊 Estado limpio - Enrollments:', cleanEnrollments?.length || 0);

    // 5. Crear un enrollment de prueba con logging detallado
    console.log('🧪 Creando enrollment de prueba con logging...');
    
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

    // 6. Esperar y verificar ejecuciones
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { data: executions, error: executionsError } = await supabase
      .from('ejecuciones_ejercicio')
      .select('*')
      .eq('client_id', testUserId);

    const totalExecutions = executions?.length || 0;
    const expectedExecutions = 19 * 2; // 19 ejercicios × 2 períodos

    // 7. Análisis detallado
    const analysis = {
      enrollment: newEnrollment,
      executions: {
        total: totalExecutions,
        expected: expectedExecutions,
        correct: totalExecutions === expectedExecutions,
        doubled: totalExecutions === expectedExecutions * 2,
        sample: executions?.slice(0, 10) || []
      },
      periodAnalysis: executions?.reduce((acc, exec) => {
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
      }, {} as Record<string, any>) || {}
    };

    // // console.log('📊 Análisis completo:', analysis);

    return NextResponse.json({
      success: true,
      message: 'Diagnóstico completado',
      data: analysis
    });

  } catch (error) {
    console.error('Error en diagnose-trigger-issue:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

































