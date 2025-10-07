import { NextRequest, NextResponse } from 'next/server';
import { createClientWithCookies } from '../../../lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = request.cookies;
    const supabase = await createClientWithCookies(cookieStore);

    console.log('🧹 LIMPIANDO DATOS DE PRUEBA...');

    const testUserId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';

    // 1. Eliminar todas las ejecuciones del usuario de prueba
    console.log('🗑️ Eliminando ejecuciones...');
    const { error: deleteExecutionsError } = await supabase
      .from('ejecuciones_ejercicio')
      .delete()
      .eq('client_id', testUserId);

    if (deleteExecutionsError) {
      console.error('Error eliminando ejecuciones:', deleteExecutionsError);
    }

    // 2. Eliminar enrollments del usuario de prueba
    console.log('🗑️ Eliminando enrollments...');
    const { error: deleteEnrollmentsError } = await supabase
      .from('activity_enrollments')
      .delete()
      .eq('client_id', testUserId);

    if (deleteEnrollmentsError) {
      console.error('Error eliminando enrollments:', deleteEnrollmentsError);
    }

    // 3. Verificar estado limpio
    const { data: remainingExecutions } = await supabase
      .from('ejecuciones_ejercicio')
      .select('*')
      .eq('client_id', testUserId);

    const { data: remainingEnrollments } = await supabase
      .from('activity_enrollments')
      .select('*')
      .eq('client_id', testUserId);

    // // console.log('📊 Estado después de limpieza:');
    console.log('  - Ejecuciones restantes:', remainingExecutions?.length || 0);
    console.log('  - Enrollments restantes:', remainingEnrollments?.length || 0);

    return NextResponse.json({
      success: true,
      message: 'Datos de prueba limpiados exitosamente',
      data: {
        executionsDeleted: true,
        enrollmentsDeleted: true,
        remainingExecutions: remainingExecutions?.length || 0,
        remainingEnrollments: remainingEnrollments?.length || 0,
        readyForTesting: (remainingExecutions?.length || 0) === 0 && (remainingEnrollments?.length || 0) === 0
      }
    });

  } catch (error) {
    console.error('Error en clean-test-data:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}
































