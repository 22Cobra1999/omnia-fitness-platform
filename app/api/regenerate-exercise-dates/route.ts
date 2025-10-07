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

    console.log('🔄 Regenerando fechas de ejercicio para enrollment:', enrollmentId, 'desde:', startDate);

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

    // 2. Obtener ejecuciones_ejercicio para este enrollment específico
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
      .eq('client_id', enrollment.client_id);

    if (ejecucionesError) {
      console.error('❌ Error obteniendo ejecuciones:', ejecucionesError);
      return NextResponse.json(
        { success: false, error: "Error obteniendo ejecuciones", details: ejecucionesError.message },
        { status: 500 }
      );
    }

    console.log(`📋 Encontradas ${ejecuciones?.length || 0} ejecuciones`);

    // 3. Obtener detalles de ejercicios para filtrar por actividad
    const ejercicioIds = ejecuciones?.map(e => e.ejercicio_id) || [];
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
    const ejecucionesFiltradas = ejecuciones?.filter(e => ejercicioIdsValidos.includes(e.ejercicio_id)) || [];

    console.log(`📋 Ejecuciones filtradas para la actividad: ${ejecucionesFiltradas.length}`);

    if (ejecucionesFiltradas.length === 0) {
      console.log('⚠️ No hay ejecuciones para regenerar');
      return NextResponse.json({
        success: true,
        message: "No hay ejecuciones para regenerar",
        generatedCount: 0
      });
    }

    // 5. Obtener información de períodos y planificación
    const { data: periodosInfo, error: periodosError } = await supabase
      .from('periodos')
      .select('*')
      .eq('actividad_id', enrollment.activity_id)
      .single();

    if (periodosError || !periodosInfo) {
      console.error('❌ Error obteniendo información de períodos:', periodosError);
      return NextResponse.json(
        { success: false, error: "Error obteniendo información de períodos" },
        { status: 500 }
      );
    }

    const { data: planificacion, error: planificacionError } = await supabase
      .from('planificacion_ejercicios')
      .select('*')
      .eq('actividad_id', enrollment.activity_id)
      .order('numero_semana');

    if (planificacionError) {
      console.error('❌ Error obteniendo planificación:', planificacionError);
      return NextResponse.json(
        { success: false, error: "Error obteniendo planificación" },
        { status: 500 }
      );
    }

    console.log(`📋 Períodos configurados: ${periodosInfo.cantidad_periodos}`);
    console.log(`📋 Semanas de planificación: ${planificacion?.length || 0}`);

    // 6. Calcular nuevas fechas de ejercicio usando la estructura real del sistema
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

      // Determinar el período basándose en periodo_id
      // periodo_id 19 corresponde al período 1 de 3 períodos totales
      const periodo = 1; // Por ahora solo tenemos período 1

      // Determinar la semana basándose en la planificación
      // Buscar en qué semana de la planificación aparece este día con ejercicios
      let semana = 1;
      let semanaEncontrada = false;

      for (const semanaPlanificacion of planificacion || []) {
        const diaPlanificacion = semanaPlanificacion[diaSemanaMap[ejecucion.dia_semana.toLowerCase()] === 1 ? 'lunes' :
                                 diaSemanaMap[ejecucion.dia_semana.toLowerCase()] === 2 ? 'martes' :
                                 diaSemanaMap[ejecucion.dia_semana.toLowerCase()] === 3 ? 'miercoles' :
                                 diaSemanaMap[ejecucion.dia_semana.toLowerCase()] === 4 ? 'jueves' :
                                 diaSemanaMap[ejecucion.dia_semana.toLowerCase()] === 5 ? 'viernes' :
                                 diaSemanaMap[ejecucion.dia_semana.toLowerCase()] === 6 ? 'sabado' : 'domingo'];

        if (diaPlanificacion && diaPlanificacion !== '' && diaPlanificacion !== '[]') {
          // Verificar si este ejercicio está en esta semana
          try {
            const ejerciciosSemana = JSON.parse(diaPlanificacion);
            const tieneEjercicio = Object.values(ejerciciosSemana).some((bloque: any) => 
              Array.isArray(bloque) && bloque.some((ej: any) => ej.id === ejecucion.ejercicio_id)
            );

            if (tieneEjercicio) {
              semana = semanaPlanificacion.numero_semana;
              semanaEncontrada = true;
              break;
            }
          } catch (e) {
            console.log('⚠️ Error parseando JSON de planificación:', e);
          }
        }
      }

      if (!semanaEncontrada) {
        console.log(`⚠️ No se encontró semana para ejercicio ${ejecucion.ejercicio_id} en día ${ejecucion.dia_semana}`);
        semana = 1; // Default a semana 1
      }

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
          dia: diaNumero,
          orden: ejecucion.orden,
          bloque: ejecucion.bloque,
          dia_semana: ejecucion.dia_semana
        });
        
        console.log(`📅 Ejercicio ${ejecucion.id}: Orden ${ejecucion.orden}, Bloque ${ejecucion.bloque}, Período ${periodo}, Semana ${semana}, Día ${diaNumero} (${ejecucion.dia_semana}) → ${fechaEjercicio}`);
      } else {
        console.error('❌ No se pudo calcular fecha para ejercicio:', ejecucion.id);
      }
    }

    console.log(`📅 Calculadas ${updates.length} fechas de ejercicio`);

    // 6. Actualizar las ejecuciones con las nuevas fechas calculadas
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

    console.log(`✅ ${successCount}/${updates.length} fechas regeneradas exitosamente`);

    return NextResponse.json({
      success: true,
      message: "Fechas de ejercicio regeneradas exitosamente",
      generatedCount: successCount,
      totalCount: updates.length,
      details: {
        enrollment: enrollment,
        ejecucionesProcesadas: updates.length,
        fechasRegeneradas: successCount
      }
    });

  } catch (error: any) {
    console.error('❌ Error en regenerate-exercise-dates:', error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor", details: error.message },
      { status: 500 }
    );
  }
}
