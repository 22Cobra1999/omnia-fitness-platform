import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '../../lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();

    // Obtener el usuario autenticado
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const clientId = session.user.id;
    const { executionId, completed, intensity } = await request.json();

    console.log('🏃 Actualizando progreso de ejercicio:', { executionId, completed, intensity, clientId });

    // Verificar que la ejecución pertenece al usuario
    const { data: execution, error: executionError } = await supabase
      .from('ejecuciones_ejercicio')
      .select('id, client_id')
      .eq('id', executionId)
      .eq('client_id', clientId)
      .single();

    if (executionError || !execution) {
      console.error('Error verificando ejecución:', executionError);
      return NextResponse.json({ 
        success: false, 
        error: 'Ejecución no encontrada o no autorizada' 
      }, { status: 404 });
    }

    // Actualizar el progreso
    const updateData: any = {
      completado: completed,
      updated_at: new Date().toISOString()
    };

    // Si se proporciona intensidad, actualizarla
    if (intensity) {
      updateData.intensidad_aplicada = intensity;
    }

    // Si se marca como completado y no tiene fecha, establecerla
    if (completed && !execution.fecha_ejercicio) {
      updateData.fecha_ejercicio = new Date().toISOString().split('T')[0];
    }

    const { data: updatedExecution, error: updateError } = await supabase
      .from('ejecuciones_ejercicio')
      .update(updateData)
      .eq('id', executionId)
      .eq('client_id', clientId)
      .select()
      .single();

    if (updateError) {
      console.error('Error actualizando ejecución:', updateError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error actualizando progreso',
        details: updateError 
      }, { status: 500 });
    }

    console.log('✅ Progreso actualizado exitosamente:', updatedExecution);

    return NextResponse.json({
      success: true,
      data: updatedExecution,
      message: completed ? 'Ejercicio marcado como completado' : 'Progreso actualizado'
    });

  } catch (error: any) {
    console.error('Error en POST /api/exercise-progress:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}










