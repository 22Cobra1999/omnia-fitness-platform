import { NextRequest, NextResponse } from 'next/server';
import { createClientWithCookies } from '../../../lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = request.cookies;
    const supabase = await createClientWithCookies(cookieStore);

    console.log('🧪 PROBANDO SISTEMA FINAL COMPLETO...');

    // 1. Limpiar sistema completamente
    console.log('🧹 Limpieza completa...');
    
    const testUserId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';
    
    // Eliminar ejecuciones
    await supabase
      .from('ejecuciones_ejercicio')
      .delete()
      .neq('id', 0);

    // Eliminar enrollments
    await supabase
      .from('activity_enrollments')
      .delete()
      .eq('client_id', testUserId)
      .eq('activity_id', 59);

    // 2. Verificar estado limpio
    const { data: cleanExecutions } = await supabase
      .from('ejecuciones_ejercicio')
      .select('*');

    const { data: cleanEnrollments } = await supabase
      .from('activity_enrollments')
      .select('*')
      .eq('client_id', testUserId);

    // // console.log('📊 Estado limpio - Ejecuciones:', cleanExecutions?.length || 0);
    // // console.log('📊 Estado limpio - Enrollments:', cleanEnrollments?.length || 0);

    // 3. Simular compra real usando el endpoint de enrollments
    console.log('🛒 Simulando compra real...');
    
    const purchaseResponse = await fetch('http://localhost:3000/api/enrollments/direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieStore.toString()
      },
      body: JSON.stringify({
        activityId: 59,
        paymentMethod: 'credit_card',
        notes: 'Test final del sistema'
      })
    });

    if (!purchaseResponse.ok) {
      const errorText = await purchaseResponse.text();
      console.error('Error en compra:', errorText);
      return NextResponse.json({ 
        success: false, 
        error: 'Error en compra simulada',
        details: errorText 
      });
    }

    const purchaseResult = await purchaseResponse.json();
    // console.log('✅ Compra exitosa:', purchaseResult);

    // 4. Esperar para que el trigger se ejecute
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 5. Verificar ejecuciones generadas
    const { data: executions, error: executionsError } = await supabase
      .from('ejecuciones_ejercicio')
      .select('*')
      .eq('client_id', testUserId);

    const totalExecutions = executions?.length || 0;
    const expectedExecutions = 19 * 2; // 19 ejercicios × 2 períodos
    const withClientId = executions?.filter(e => e.client_id).length || 0;
    const withoutClientId = executions?.filter(e => !e.client_id).length || 0;

    // 6. Análisis por período
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

    // 7. Verificar enrollments
    const { data: finalEnrollments } = await supabase
      .from('activity_enrollments')
      .select('*')
      .eq('client_id', testUserId)
      .eq('activity_id', 59);

    const result = {
      success: true,
      message: totalExecutions === expectedExecutions ? '🎉 SISTEMA FUNCIONANDO PERFECTAMENTE' : '❌ PROBLEMA PERSISTE',
      data: {
        purchase: purchaseResult,
        executions: {
          total: totalExecutions,
          expected: expectedExecutions,
          correct: totalExecutions === expectedExecutions,
          withClientId,
          withoutClientId,
          periodAnalysis: Object.values(periodAnalysis),
          sample: executions?.slice(0, 5) || []
        },
        enrollments: {
          count: finalEnrollments?.length || 0,
          data: finalEnrollments || []
        },
        systemStatus: {
          triggerWorking: totalExecutions === expectedExecutions,
          noDuplicates: totalExecutions <= expectedExecutions,
          clientIdInserted: withoutClientId === 0,
          readyForProduction: totalExecutions === expectedExecutions && withoutClientId === 0
        }
      }
    };

    // // console.log('📊 Resultado final:', result.data.executions);
    // console.log('🎯 Estado del sistema:', result.data.systemStatus);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error en test-final-system:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}




















