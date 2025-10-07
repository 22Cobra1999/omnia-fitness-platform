import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { calculateExerciseDateWithPeriod } from '@/utils/date-utils';

export async function POST(request: NextRequest) {
  try {
    const { enrollmentId, startDate } = await request.json();
    
    if (!enrollmentId || !startDate) {
      return NextResponse.json(
        { success: false, error: "Enrollment ID y start date son requeridos" },
        { status: 400 }
      );
    }

    const supabase = await createRouteHandlerClient();

    console.log('🚀 Generando fechas de ejercicio para enrollment:', enrollmentId, 'desde:', startDate);

    // 1. Obtener información del enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('activity_enrollments')
      .select('id, activity_id, client_id, start_date')
      .eq('id', enrollmentId)
      .single();

    if (enrollmentError || !enrollment) {
      console.error('❌ Error obteniendo enrollment:', enrollmentError);
      return NextResponse.json(
        { success: false, error: "Error obteniendo enrollment" },
        { status: 500 }
      );
    }

    // 2. Obtener ejecuciones_ejercicio para este cliente
    const { data: ejecuciones, error: ejecucionesError } = await supabase
      .from('ejecuciones_ejercicio')
      .select(`
        id,
        ejercicio_id,
        dia_semana,
        bloque,
        orden,
        periodo_id,
        fecha_ejercicio
      `)
      .eq('client_id', enrollment.client_id)
      .is('fecha_ejercicio', null); // Solo las que no tienen fecha aún

    if (ejecucionesError) {
      console.error('❌ Error obteniendo ejecuciones:', ejecucionesError);
      return NextResponse.json(
        { success: false, error: "Error obteniendo ejecuciones", details: ejecucionesError.message },
        { status: 500 }
      );
    }

    console.log(`📋 Encontradas ${ejecuciones?.length || 0} ejecuciones sin fecha`);

    if (!ejecuciones || ejecuciones.length === 0) {
      console.log('⚠️ No hay ejecuciones sin fecha para generar');
      return NextResponse.json({
        success: true,
        message: "No hay ejecuciones sin fecha para generar",
        generatedCount: 0
      });
    }

    // 3. Obtener detalles de ejercicios para filtrar por actividad
    const ejercicioIds = ejecuciones.map(e => e.ejercicio_id);
    const { data: ejerciciosDetalles, error: ejerciciosError } = await supabase
      .from('ejercicios_detalles')
      .select('id, activity_id')
      .in('id', ejercicioIds)
      .eq('activity_id', enrollment.activity_id);

    if (ejerciciosError) {
      console.error('❌ Error obteniendo ejercicios detalles:', ejerciciosError);
      return NextResponse.json(
        { success: false, error: "Error obteniendo ejercicios detalles", details: ejerciciosError.message },
        { status: 500 }
      );
    }

    console.log(`📋 Encontrados ${ejerciciosDetalles?.length || 0} ejercicios detalles para la actividad`);

    // 4. Filtrar ejecuciones que pertenecen a esta actividad
    const ejercicioIdsValidos = ejerciciosDetalles?.map(e => e.id) || [];
    const ejecucionesFiltradas = ejecuciones.filter(e => ejercicioIdsValidos.includes(e.ejercicio_id));

    console.log(`📋 Ejecuciones filtradas para la actividad: ${ejecucionesFiltradas.length}`);

    // 5. Calcular fechas de ejercicio usando la estructura real del sistema
    const updates = [];

    for (const ejecucion of ejecucionesFiltradas) {
      // Convertir dia_semana string a número
      const diaSemanaMap: Record<string, number> = {
        'lunes': 1,
        'martes': 2,
        'miercoles': 3,
        'jueves': 4,
        'viernes': 5,
        'sabado': 6,
        'domingo': 7
      };

      const diaNumero = diaSemanaMap[ejecucion.dia_semana.toLowerCase()];
      if (!diaNumero) {
        console.error('❌ Día de semana inválido:', ejecucion.dia_semana);
        continue;
      }

      // Determinar la semana basándose en el orden y bloque
      // Cada bloque representa una sesión diferente en la misma semana
      const semana = Math.ceil(ejecucion.orden / 4); // Asumiendo 4 bloques por semana
      
      // Determinar el período basándose en periodo_id
      // El sistema actual usa periodo_id 19, que parece ser período 1
      const periodo = 1; // Por ahora, solo período 1

      // Calcular la fecha usando la función de períodos
      const fechaEjercicio = calculateExerciseDateWithPeriod(
        startDate,
        semana,
        diaNumero,
        periodo
      );
      
      if (fechaEjercicio) {
        updates.push({
          id: ejecucion.id,
          fecha_ejercicio: fechaEjercicio,
          periodo: periodo,
          semana: semana,
          dia: diaNumero
        });
        
        console.log(`📅 Ejercicio ${ejecucion.id}: Período ${periodo}, Semana ${semana}, Día ${diaNumero} (${ejecucion.dia_semana}) → ${fechaEjercicio}`);
      } else {
        console.error('❌ No se pudo calcular fecha para ejercicio:', ejecucion.id);
      }
    }

    console.log(`📅 Calculadas ${updates.length} fechas de ejercicio`);

    // 5. Actualizar las ejecuciones con las fechas calculadas
    let successCount = 0;
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('ejecuciones_ejercicio')
        .update({ fecha_ejercicio: update.fecha_ejercicio })
        .eq('id', update.id);

      if (updateError) {
        console.error('❌ Error actualizando ejecución:', update.id, updateError);
      } else {
        successCount++;
      }
    }

    console.log(`✅ ${successCount}/${updates.length} fechas generadas exitosamente`);

    return NextResponse.json({
      success: true,
      message: "Fechas de ejercicio generadas exitosamente",
      generatedCount: successCount,
      totalCount: updates.length
    });

  } catch (error: any) {
    console.error('❌ Error en generate-exercise-dates:', error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor", details: error.message },
      { status: 500 }
    );
  }
}

