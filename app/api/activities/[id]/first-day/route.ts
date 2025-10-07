import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '../../../../../lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const activityId = parseInt(resolvedParams.id);
    
    if (!activityId || isNaN(activityId)) {
      return NextResponse.json(
        { success: false, error: "ID de actividad inválido" },
        { status: 400 }
      );
    }

    const supabase = await createRouteHandlerClient();

    // Obtener el primer día de la semana de la planificación
    const { data: planificacion, error: planificacionError } = await supabase
      .from('planificacion_ejercicios')
      .select('lunes, martes, miercoles, jueves, viernes, sabado, domingo')
      .eq('actividad_id', activityId)
      .eq('numero_semana', 1) // Primera semana
      .limit(1)
      .single();

    if (planificacionError) {
      console.error('Error obteniendo planificación:', planificacionError);
      return NextResponse.json(
        { success: false, error: "Error obteniendo planificación de ejercicios" },
        { status: 500 }
      );
    }

    // Encontrar el primer día que tiene ejercicios
    const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    let firstDay = 'lunes'; // Por defecto

    for (const dia of dias) {
      const diaData = planificacion[dia as keyof typeof planificacion];
      if (diaData && diaData !== '[]' && diaData !== 'null' && diaData !== null) {
        try {
          const ejerciciosDia = JSON.parse(diaData);
          if (Array.isArray(ejerciciosDia) && ejerciciosDia.length > 0) {
            firstDay = dia;
            break;
          }
        } catch (e) {
          // Si no es JSON válido, continuar con el siguiente día
          continue;
        }
      }
    }

    console.log(`🎯 Primer día de la actividad ${activityId}: ${firstDay}`);

    return NextResponse.json({
      success: true,
      firstDay: firstDay,
      activityId: activityId
    });

  } catch (error: any) {
    console.error('Error en GET /api/activities/[id]/first-day:', error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor", details: error.message },
      { status: 500 }
    );
  }
}
