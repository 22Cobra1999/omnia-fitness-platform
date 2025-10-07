import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '../../../../lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();

    // Obtener el usuario autenticado
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const clientId = session.user.id;
    console.log('🔍 Usuario autenticado:', clientId);

    // Obtener parámetros de la query
    const url = new URL(request.url);
    const activityIdParam = url.searchParams.get('activityId');
    const diaParam = url.searchParams.get('dia');
    
    // Usar actividad 78 por defecto si no se especifica
    const activityId = activityIdParam ? parseInt(activityIdParam) : 78;
    const today = new Date().toISOString().split('T')[0];
    
    console.log('🎯 Actividad solicitada:', activityId);
    console.log('📅 Día solicitado:', diaParam);

    // 1. Verificar que el usuario esté inscrito en la actividad (sin filtro de status)
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('activity_enrollments')
      .select('id, activity_id, start_date, status')
      .eq('client_id', clientId)
      .eq('activity_id', activityId)
      .order('created_at', { ascending: false })
      .limit(1);

    console.log('📝 Enrollment del usuario:', { enrollment, enrollmentError });

    if (!enrollment || enrollment.length === 0) {
      console.log('⚠️ Usuario no está inscrito en la actividad');
      return NextResponse.json({
        success: true,
        data: {
          activities: [],
          count: 0,
          date: today,
          message: 'No estás inscrito en esta actividad'
        }
      });
    }

    // 2. Obtener ejecuciones de ejercicios para el cliente y actividad
    // Usar el enrollment específico para obtener ejecuciones correctas
    const enrollmentId = enrollment[0].id;
    console.log(`📋 Usando enrollment ID: ${enrollmentId}`);
    console.log(`🔍 Cliente ID: ${clientId}`);
    console.log(`🎯 Actividad ID: ${activityId}`);

    // Obtener ejecuciones con join para obtener todos los detalles del ejercicio
    console.log('🔍 Iniciando consulta de ejecuciones...');
    let query = supabase
      .from('ejecuciones_ejercicio')
      .select(`
        id,
        ejercicio_id,
        completado,
        intensidad_aplicada,
        dia_semana,
        fecha_ejercicio,
        bloque,
        orden,
        detalle_series,
        ejercicios_detalles!inner(
          id,
          nombre_ejercicio,
          tipo,
          descripcion,
          detalle_series,
          video_url,
          duracion_min,
          calorias,
          intensidad,
          equipo,
          body_parts
        )
      `)
      .eq('client_id', clientId);

    console.log('🔍 Consulta base creada para client_id:', clientId);

    // Si la columna activity_enrollment_id existe, filtrar por enrollment específico
    // Por ahora comentamos esto hasta que se agregue la columna
    // .eq('activity_enrollment_id', enrollmentId);

    // Filtrar por fecha específica seleccionada por el usuario
    // Usar la fecha seleccionada, no siempre el start_date
    const selectedDate = url.searchParams.get('fecha');
    if (selectedDate) {
      console.log('🔍 Filtrando por fecha seleccionada:', selectedDate);
      query = query.eq('fecha_ejercicio', selectedDate);
      console.log('🔍 Filtro por fecha agregado:', selectedDate);
    } else if (enrollment && enrollment.length > 0) {
      // Fallback al start_date si no se especifica fecha
      const startDate = enrollment[0].start_date;
      console.log('🔍 Filtrando por fecha de inicio (fallback):', startDate);
      query = query.eq('fecha_ejercicio', startDate);
      console.log('🔍 Filtro por fecha agregado:', startDate);
    }

    // Primero verificar si hay ejecuciones sin filtro de día
    const { data: todasLasEjecuciones, error: todasLasEjecucionesError } = await supabase
      .from('ejecuciones_ejercicio')
      .select('id, ejercicio_id, dia_semana, fecha_ejercicio')
      .eq('client_id', clientId);

    console.log('🔍 TODAS las ejecuciones del cliente:', { 
      count: todasLasEjecuciones?.length || 0, 
      error: todasLasEjecucionesError,
      ejecuciones: todasLasEjecuciones?.map(e => ({ 
        id: e.id, 
        dia: e.dia_semana, 
        fecha: e.fecha_ejercicio 
      })) || []
    });

    console.log('🔍 Ejecutando consulta final...');
    console.log('🔍 Query final antes de ejecutar:', query);
    const { data: ejecuciones, error: ejecucionesError } = await query.order('bloque').order('orden');

    console.log('🏃 Ejecuciones encontradas:', { count: ejecuciones?.length || 0, error: ejecucionesError });
    console.log('🔍 Error completo:', ejecucionesError);
    console.log('🔍 Datos completos de ejecuciones:', ejecuciones);
    
    // Log detallado de las ejecuciones encontradas
    if (ejecuciones && ejecuciones.length > 0) {
      console.log('📋 Detalles de ejecuciones encontradas:');
      ejecuciones.forEach((ejecucion, index) => {
        const ejercicio = Array.isArray(ejecucion.ejercicios_detalles) 
          ? ejecucion.ejercicios_detalles[0] 
          : ejecucion.ejercicios_detalles;
        
        console.log(`  ${index + 1}. ID: ${ejecucion.id}, Orden: ${ejecucion.orden}, Bloque: ${ejecucion.bloque}`);
        console.log(`     Ejercicio: ${ejercicio?.nombre_ejercicio || 'Sin nombre'} (ID: ${ejecucion.ejercicio_id})`);
        console.log(`     Tipo: ${ejercicio?.tipo || 'Sin tipo'}`);
        console.log(`     Día: ${ejecucion.dia_semana}, Fecha: ${ejecucion.fecha_ejercicio}`);
        console.log(`     Video: ${ejercicio?.video_url || 'Sin video'}`);
        console.log(`     Duración: ${ejercicio?.duracion_min || 'Sin duración'} min`);
        console.log(`     Calorías: ${ejercicio?.calorias || 'Sin calorías'}`);
        console.log(`     Intensidad: ${ejercicio?.intensidad || 'Sin intensidad'}`);
        console.log(`     Equipo: ${ejercicio?.equipo || 'Sin equipo'}`);
        console.log(`     Partes del cuerpo: ${ejercicio?.body_parts || 'Sin especificar'}`);
        console.log(`     🔥 COMPLETADO: ${ejecucion.completado || false} (CRÍTICO PARA TOGGLE)`);
        console.log('     ---');
      });
    } else {
      console.log('⚠️ No se encontraron ejecuciones con los filtros aplicados');
    }

    if (ejecucionesError) {
      console.error('Error obteniendo ejecuciones:', ejecucionesError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error obteniendo ejecuciones de ejercicios',
        details: ejecucionesError 
      });
    }

    // 3. Obtener información de la actividad
    const { data: actividadInfo, error: actividadError } = await supabase
      .from('activities')
      .select('id, title, description')
      .eq('id', activityId)
      .single();

    if (actividadError) {
      console.error('Error obteniendo información de actividad:', actividadError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error obteniendo información de actividad',
        details: actividadError 
      });
    }

    // Transformar los datos para el formato esperado (ya tenemos los detalles del ejercicio en el join)
    console.log('🔄 [API activities/today] Iniciando transformación de datos...');
    const transformedActivities = ejecuciones?.map(ejecucion => {
      const ejercicio = Array.isArray(ejecucion.ejercicios_detalles) 
        ? ejecucion.ejercicios_detalles[0] 
        : ejecucion.ejercicios_detalles;
      
      const transformed = {
        id: ejecucion.id, // ⚠️ CRÍTICO: Este es el ID de la ejecución que se usará en el toggle
        exercise_id: ejecucion.ejercicio_id,
        name: ejercicio?.nombre_ejercicio || 'Ejercicio',
        type: ejercicio?.tipo || 'general',
        description: ejercicio?.descripcion || '',
        completed: ejecucion.completado || false, // ⚠️ CRÍTICO: Estado de completado
        intensity: ejecucion.intensidad_aplicada || 'Principiante',
        day: ejecucion.dia_semana,
        block: ejecucion.bloque,
        order: ejecucion.orden,
        series: ejercicio?.detalle_series || ejecucion.detalle_series || null,
        detalle_series: ejercicio?.detalle_series || ejecucion.detalle_series || null,
        date: ejecucion.fecha_ejercicio,
        // Campos adicionales del ejercicio
        video_url: ejercicio?.video_url || null,
        duracion_minutos: ejercicio?.duracion_min || null,
        calorias: ejercicio?.calorias || null,
        intensidad: ejercicio?.intensidad || null,
        equipo: ejercicio?.equipo || null,
        body_parts: ejercicio?.body_parts || null
      };
      
      console.log(`🔄 [API activities/today] Ejercicio transformado: ID=${transformed.id}, Nombre=${transformed.name}, Completado=${transformed.completed}`);
      return transformed;
    }) || [];

    console.log('🎯 Ejercicios transformados:', transformedActivities.length);
    
    // Log del resultado final
    if (transformedActivities.length > 0) {
      console.log('📋 RESULTADO FINAL - Ejercicios para mostrar:');
      transformedActivities.forEach((activity, index) => {
        console.log(`  ${index + 1}. ${activity.name} (Orden: ${activity.order}, Bloque: ${activity.block})`);
        console.log(`     Tipo: ${activity.type}, Completado: ${activity.completed}`);
        console.log(`     Video: ${activity.video_url || 'Sin video'}`);
        console.log(`     Duración: ${activity.duracion_minutos || 'Sin duración'} min`);
        console.log(`     Calorías: ${activity.calorias || 'Sin calorías'}`);
        console.log(`     Intensidad: ${activity.intensidad || 'Sin intensidad'}`);
        console.log(`     Equipo: ${activity.equipo || 'Sin equipo'}`);
        console.log('     ---');
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        activities: transformedActivities,
        count: transformedActivities.length,
        date: today,
        activity: actividadInfo,
        enrollment: enrollment[0]
      }
    });

  } catch (error: any) {
    console.error('Error en GET /api/activities/today:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}