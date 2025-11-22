import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '../../../../lib/supabase/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const clientId = session.user.id;
    const url = new URL(request.url);
    const activityIdParam = url.searchParams.get('activityId');
    const selectedDate = url.searchParams.get('fecha');
    const dia = url.searchParams.get('dia');
    
    const activityId = activityIdParam ? parseInt(activityIdParam) : 78;
    const today = selectedDate || new Date().toISOString().split('T')[0];

    // 1. Obtener información de la actividad (incluyendo categoría)
    const { data: actividadInfo } = await supabase
      .from('activities')
      .select('id, title, description, categoria')
      .eq('id', activityId)
      .single();

    const categoria = actividadInfo?.categoria || 'fitness';
    console.log('📊 Categoría de actividad:', categoria);

    // 2. Verificar enrollment
    const { data: enrollment } = await supabase
      .from('activity_enrollments')
      .select('id, activity_id, start_date, status')
      .eq('client_id', clientId)
      .eq('activity_id', activityId)
      .order('created_at', { ascending: false })
      .limit(1);

    // Si no hay enrollment, verificar si el usuario es el coach del producto
    if (!enrollment || enrollment.length === 0) {
      
      const { data: activity } = await supabase
        .from('activities')
        .select('id, coach_id, title, description')
        .eq('id', activityId)
        .single();


      // Si el usuario es el coach, cargar ejercicios desde planificación
      if (activity && activity.coach_id === clientId && dia) {
        return await getActivitiesFromPlanning(supabase, activityId, dia, activity);
      }

      return NextResponse.json({
        success: true,
        data: { activities: [], count: 0, date: today, message: 'No estás inscrito en esta actividad' }
      });
    }

    // 2. Obtener progreso del cliente para este día
    let { data: progressRecord } = await supabase
      .from('progreso_cliente')
      .select('id, fecha, ejercicios_completados, ejercicios_pendientes, detalles_series, minutos_json, calorias_json')
      .eq('cliente_id', clientId)
      .eq('actividad_id', activityId)
      .eq('fecha', today)
      .single();

    // Si no existe registro de progreso, crearlo SOLO si hay planificación para este día
    if (!progressRecord && dia) {
      console.log('📝 No existe registro de progreso para fecha:', today, 'Verificando planificación...');
      const ejerciciosDelDia = await obtenerEjerciciosPlanificacion(supabase, activityId, enrollment[0].start_date, today, dia, categoria);
      console.log('📋 Ejercicios obtenidos de planificación:', ejerciciosDelDia);
      
      // SOLO crear registro si hay ejercicios en la planificación
      if (ejerciciosDelDia && ejerciciosDelDia.length > 0) {
        console.log('✅ Insertando registro de progreso con', ejerciciosDelDia.length, 'ejercicios');
        
        // Obtener detalles de ejercicios/platos para crear la estructura correcta
        const tablaDetalles = categoria === 'nutricion' ? 'platos_detalles' : 'ejercicios_detalles'
        const campoDetalles = categoria === 'nutricion' ? 'receta' : 'detalle_series'
        
        const { data: ejerciciosDetalles } = await supabase
          .from(tablaDetalles)
          .select(`id, ${campoDetalles}`)
          .in('id', ejerciciosDelDia);
        
        // Crear estructura de objetos con keys únicos
        const ejerciciosPendientes: any = {};
        const detallesSeries: any = {};
        let ordenGlobal = 1;
        
        ejerciciosDelDia.forEach((ejercicioId: number) => {
          const key = `${ejercicioId}_${ordenGlobal}`;
          const detalleSeries = ejerciciosDetalles?.find(e => e.id === ejercicioId)?.detalle_series || '';
          
          ejerciciosPendientes[key] = {
            ejercicio_id: ejercicioId,
            bloque: 1, // Asumir bloque 1 para registros creados automáticamente
            orden: ordenGlobal
          };
          
          detallesSeries[key] = {
            ejercicio_id: ejercicioId,
            bloque: 1,
            orden: ordenGlobal,
            detalle_series: detalleSeries
          };
          
          ordenGlobal++;
        });
        
        const { data: newRecord, error: createError } = await supabase
          .from('progreso_cliente')
          .insert({
            actividad_id: activityId,
            cliente_id: clientId,
            fecha: today,
            ejercicios_completados: {},
            ejercicios_pendientes: ejerciciosPendientes,
            detalles_series: detallesSeries,
            minutos_json: {},
            calorias_json: {}
          })
          .select('id, fecha, ejercicios_completados, ejercicios_pendientes, detalles_series, minutos_json, calorias_json')
          .single();
        
        if (createError) {
          console.error('❌ Error creando registro:', createError);
        } else if (newRecord) {
          console.log('✅ Registro creado exitosamente:', newRecord.id);
          progressRecord = newRecord;
        }
      } else {
        console.log('ℹ️ No hay planificación para este día - no se crea registro');
      }
    }

    // 3. Obtener detalles de ejercicios
    let ejercicioIds: number[] = [];
    if (progressRecord) {
      try {
        // Primero parsear detalles_series que contiene TODOS los ejercicios del día
        const detallesSeriesTemp = progressRecord.detalles_series 
          ? (typeof progressRecord.detalles_series === 'string' 
              ? JSON.parse(progressRecord.detalles_series) 
              : progressRecord.detalles_series)
          : {};
        
        // Extraer IDs de detalles_series (fuente principal)
        const idsDeDetallesSeries = Object.values(detallesSeriesTemp)
          .map((item: any) => item?.ejercicio_id)
          .filter(id => id !== undefined && id !== null && !isNaN(Number(id)))
          .map(id => Number(id));
        
        // completados es un objeto con keys únicos
        const completadosObj = progressRecord.ejercicios_completados 
          ? (typeof progressRecord.ejercicios_completados === 'string' 
              ? JSON.parse(progressRecord.ejercicios_completados) 
              : progressRecord.ejercicios_completados)
          : {};
        
        // pendientes es un objeto con keys únicos
        const pendientesObj = progressRecord.ejercicios_pendientes 
          ? (typeof progressRecord.ejercicios_pendientes === 'string' 
              ? JSON.parse(progressRecord.ejercicios_pendientes) 
              : progressRecord.ejercicios_pendientes)
          : {};
        
        // Extraer IDs únicos de ambos objetos
        const idsCompletados = Object.values(completadosObj)
          .map((item: any) => item?.ejercicio_id)
          .filter(id => id !== undefined && id !== null && !isNaN(Number(id)))
          .map(id => Number(id));
        const idsPendientes = Object.values(pendientesObj)
          .map((item: any) => item?.ejercicio_id)
          .filter(id => id !== undefined && id !== null && !isNaN(Number(id)))
          .map(id => Number(id));
        
        // Combinar todos los IDs (detalles_series es la fuente principal)
        ejercicioIds = [...new Set([...idsDeDetallesSeries, ...idsCompletados, ...idsPendientes])]; // Set para eliminar duplicados
        
        console.log('🔍 IDs extraídos:', {
          de_detalles_series: idsDeDetallesSeries,
          completados: idsCompletados,
          pendientes: idsPendientes,
          final: ejercicioIds
        });
      } catch (err) {
        console.error('Error parseando ejercicios:', err);
        ejercicioIds = [];
      }
    }

    console.log('🔍 IDs de ejercicios a buscar:', ejercicioIds);
    
    // 4. Declarar variables para transformar datos
    let completados: Record<string, any> = {};
    let detallesSeries: Record<string, any> = {};
    let minutosJson: Record<string, any> = {};
    let caloriasJson: Record<string, any> = {};
    
    if (progressRecord) {
      try {
        completados = progressRecord.ejercicios_completados 
          ? (typeof progressRecord.ejercicios_completados === 'string' 
              ? JSON.parse(progressRecord.ejercicios_completados) 
              : progressRecord.ejercicios_completados)
          : {};
        detallesSeries = progressRecord.detalles_series 
          ? (typeof progressRecord.detalles_series === 'string' 
              ? JSON.parse(progressRecord.detalles_series) 
              : progressRecord.detalles_series)
          : {};
        minutosJson = progressRecord.minutos_json 
          ? (typeof progressRecord.minutos_json === 'string' 
              ? JSON.parse(progressRecord.minutos_json) 
              : progressRecord.minutos_json)
          : {};
        caloriasJson = progressRecord.calorias_json 
          ? (typeof progressRecord.calorias_json === 'string' 
              ? JSON.parse(progressRecord.calorias_json) 
              : progressRecord.calorias_json)
          : {};
      } catch (err) {
        console.error('Error parseando datos de progreso:', err);
      }
    }
    
    // Obtener detalles según la categoría
    const tablaDetalles = categoria === 'nutricion' ? 'platos_detalles' : 'ejercicios_detalles'
    const camposSelect = categoria === 'nutricion' 
      ? 'id, nombre_plato, tipo, descripcion, video_url, calorias, proteinas, carbohidratos, grasas, receta'
      : 'id, nombre_ejercicio, tipo, descripcion, video_url, calorias, equipo, body_parts, intensidad, detalle_series, duracion_min'
    
    const { data: ejerciciosDetalles } = await supabase
      .from(tablaDetalles)
      .select(camposSelect)
      .in('id', ejercicioIds.length > 0 ? ejercicioIds : [0]);
    
    console.log(`📚 ${categoria === 'nutricion' ? 'Platos' : 'Ejercicios'} encontrados en ${tablaDetalles}:`, ejerciciosDetalles);
    console.log('📋 detalles_series desde progreso_cliente:', detallesSeries);
    console.log('🔍 IDs buscados:', ejercicioIds);
    console.log('🔍 IDs encontrados:', ejerciciosDetalles?.map(e => e.id));

    // Usar detalles_series para obtener bloque y orden correctos
    const transformedActivities = Object.keys(detallesSeries).map((key, index) => {
      const detalle = detallesSeries[key];
      if (!detalle || !detalle.ejercicio_id) return null;
      
      const ejercicio = ejerciciosDetalles?.find(e => e.id === detalle.ejercicio_id);
      
      // Log para debug
      if (!ejercicio) {
        console.warn(`⚠️ Ejercicio ${detalle.ejercicio_id} no encontrado en ${tablaDetalles}. IDs disponibles:`, ejerciciosDetalles?.map(e => e.id));
      } else {
        console.log(`✅ Ejercicio ${detalle.ejercicio_id} encontrado:`, {
          nombre: categoria === 'nutricion' ? ejercicio.nombre_plato : ejercicio.nombre_ejercicio,
          video_url: ejercicio.video_url
        });
      }
      
      // NUEVO: Verificar si está completado usando el key único
      // completados es un objeto, no un array
      const isCompleted = completados && typeof completados === 'object' && key in completados;
      
      // Usar la key correcta para minutos_json y calorias_json (formato: "ejercicio_id_orden")
      const minutosKey = `${detalle.ejercicio_id}_${detalle.orden}`;
      const caloriasKey = `${detalle.ejercicio_id}_${detalle.orden}`;
      
      const nombreEjercicio = ejercicio 
        ? (categoria === 'nutricion' ? ejercicio.nombre_plato : ejercicio.nombre_ejercicio)
        : null;
      
      // Obtener duración: primero de minutosJson, luego de ejercicio.duracion_min, luego null
      const duracionMinutos = categoria === 'nutricion' 
        ? null 
        : (minutosJson[minutosKey] || minutosJson[detalle.ejercicio_id] || (ejercicio as any)?.duracion_min || null);
      
      // Obtener calorías: primero de caloriasJson, luego de ejercicio.calorias, luego null
      const caloriasFinal = caloriasJson[caloriasKey] || caloriasJson[detalle.ejercicio_id] || ejercicio?.calorias || null;
      
      console.log(`🔍 [API] Ejercicio ${detalle.ejercicio_id} - Duración y Calorías:`, {
        ejercicio_id: detalle.ejercicio_id,
        minutosJson_key: minutosKey,
        minutosJson_value: minutosJson[minutosKey],
        minutosJson_ejercicio_id: minutosJson[detalle.ejercicio_id],
        ejercicio_duracion_min: (ejercicio as any)?.duracion_min,
        duracion_final: duracionMinutos,
        caloriasJson_key: caloriasKey,
        caloriasJson_value: caloriasJson[caloriasKey],
        caloriasJson_ejercicio_id: caloriasJson[detalle.ejercicio_id],
        ejercicio_calorias: ejercicio?.calorias,
        calorias_final: caloriasFinal,
        ejercicio_completo: ejercicio
      });
      
      const transformedExercise = {
        id: `${progressRecord?.id || 0}-${detalle.ejercicio_id}`,
        exercise_id: detalle.ejercicio_id,
        nombre_ejercicio: nombreEjercicio || `Ejercicio ${detalle.ejercicio_id}`,
        name: nombreEjercicio || `Ejercicio ${detalle.ejercicio_id}`,
        type: ejercicio?.tipo || 'general',
        tipo: ejercicio?.tipo || 'general',
        description: ejercicio?.descripcion || '',
        descripcion: ejercicio?.descripcion || '',
        completed: isCompleted,
        intensity: categoria === 'nutricion' ? null : (ejercicio?.intensidad || 'Principiante'),
        day: null,
        block: detalle.bloque,
        bloque: detalle.bloque,
        order: detalle.orden,
        orden: detalle.orden,
        series: detalle.detalle_series || null,
        detalle_series: detalle.detalle_series || null,
        formatted_series: detalle.detalle_series || null,
        date: today,
        video_url: ejercicio?.video_url || null,
        duracion_minutos: duracionMinutos,
        duracion_min: duracionMinutos,
        duration: duracionMinutos,
        calorias: caloriasFinal,
        intensidad: categoria === 'nutricion' ? null : (ejercicio?.intensidad || null),
        equipo: categoria === 'nutricion' ? null : (ejercicio?.equipo || null),
        body_parts: categoria === 'nutricion' ? null : (ejercicio?.body_parts || null),
        // Campos específicos para nutrición
        proteinas: categoria === 'nutricion' ? (ejercicio?.proteinas || null) : null,
        carbohidratos: categoria === 'nutricion' ? (ejercicio?.carbohidratos || null) : null,
        grasas: categoria === 'nutricion' ? (ejercicio?.grasas || null) : null,
        receta: categoria === 'nutricion' ? (ejercicio?.receta || null) : null
      };
      
      console.log(`🔍 ${categoria === 'nutricion' ? 'Plato' : 'Ejercicio'} ${detalle.ejercicio_id} (${categoria === 'nutricion' ? ejercicio?.nombre_plato : ejercicio?.nombre_ejercicio}):`, {
        key: key,
        detalle_series: detalle.detalle_series,
        bloque: detalle.bloque,
        orden: detalle.orden
      });
      
      return transformedExercise;
    }).filter(Boolean);

    // 5. Usar la info de actividad ya obtenida

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

// Función auxiliar para obtener los IDs de ejercicios de la planificación para un día específico
async function obtenerEjerciciosPlanificacion(supabase: any, activityId: number, startDate: string, currentDate: string, dia: string, categoria: string = 'fitness'): Promise<number[]> {
  try {
    // 1. Obtener cantidad de períodos y cuántas semanas tiene la planificación
    const { data: periodosData } = await supabase
      .from('periodos')
      .select('cantidad_periodos')
      .eq('actividad_id', activityId)
      .single();
    
    const cantidadPeriodos = periodosData?.cantidad_periodos || 1;
    
    // Obtener todas las semanas de planificación
    const { data: allPlanificacion } = await supabase
      .from('planificacion_ejercicios')
      .select('numero_semana')
      .eq('actividad_id', activityId)
      .order('numero_semana', { ascending: false })
      .limit(1);
    
    const maxSemanasPlanificacion = allPlanificacion?.[0]?.numero_semana || 1;

    // 2. Calcular en qué semana del ciclo estamos
    const start = new Date(startDate);
    const current = new Date(currentDate);
    const diffDays = Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const totalWeekNumber = Math.floor(diffDays / 7) + 1;
    
    // Calcular qué semana dentro del ciclo de planificación corresponde
    // Si hay 2 semanas en planificación, la semana 3 sería la semana 1, la semana 4 sería la semana 2, etc.
    const weekInCycle = ((totalWeekNumber - 1) % maxSemanasPlanificacion) + 1;

    console.log('🔍 obtenerEjerciciosPlanificacion:', {
      activityId,
      startDate,
      currentDate,
      dia,
      diffDays,
      totalWeekNumber,
      maxSemanasPlanificacion,
      weekInCycle,
      cantidadPeriodos
    });

    // 3. Mapear el día al nombre de columna en la BD
    const diasMap: Record<string, string> = {
      '1': 'lunes',
      '2': 'martes',
      '3': 'miercoles',
      '4': 'jueves',
      '5': 'viernes',
      '6': 'sabado',
      '7': 'domingo'
    };
    
    const diaColumna = diasMap[dia] || 'lunes';
    console.log('📅 Buscando en columna:', diaColumna, 'para semana del ciclo:', weekInCycle);

    // 4. Obtener planificación para esta semana del ciclo y día
    let planificacion: any = null
    let planError: any = null
    
    if (categoria === 'nutricion') {
      // Para nutrición: intentar planificacion_platos primero, luego planificacion_ejercicios
      const { data: planificacionPlatos, error: platosError } = await supabase
        .from('planificacion_platos')
        .select(`${diaColumna}`)
        .eq('actividad_id', activityId)
        .eq('numero_semana', weekInCycle)
        .single()
      
      if (platosError && platosError.code === 'PGRST116') {
        // La tabla planificacion_platos no existe, usar planificacion_ejercicios
        console.log('⚠️ Tabla planificacion_platos no existe, usando planificacion_ejercicios')
        const { data: planificacionEjercicios, error: ejerciciosError } = await supabase
          .from('planificacion_ejercicios')
          .select(`${diaColumna}`)
          .eq('actividad_id', activityId)
          .eq('numero_semana', weekInCycle)
          .single()
        
        planificacion = planificacionEjercicios
        planError = ejerciciosError
      } else {
        planificacion = planificacionPlatos
        planError = platosError
      }
    } else {
      // Para fitness: usar planificacion_ejercicios
      const { data: planificacionEjercicios, error: ejerciciosError } = await supabase
        .from('planificacion_ejercicios')
        .select(`${diaColumna}`)
        .eq('actividad_id', activityId)
        .eq('numero_semana', weekInCycle)
        .single()
      
      planificacion = planificacionEjercicios
      planError = ejerciciosError
    }

    if (planError) {
      console.log('ℹ️ No hay planificación para semana', weekInCycle, 'día', diaColumna);
      return [];
    }

    if (!planificacion || !planificacion[diaColumna]) {
      console.log('ℹ️ No hay ejercicios planificados para', diaColumna, 'en semana', weekInCycle);
      return [];
    }

    console.log('📋 Planificación encontrada:', planificacion[diaColumna]);

    // 5. Parsear los ejercicios del día
    const ejerciciosDia = typeof planificacion[diaColumna] === 'string' 
      ? JSON.parse(planificacion[diaColumna]) 
      : planificacion[diaColumna];

    // 6. Extraer IDs de ejercicios del formato de bloques
    const ejercicioIds: number[] = [];
    
    if (typeof ejerciciosDia === 'object' && !Array.isArray(ejerciciosDia)) {
      // Formato: { "1": [{ "id": 1000, "orden": 1 }], "2": [...] }
      Object.keys(ejerciciosDia).forEach(bloqueKey => {
        const ejerciciosBloque = ejerciciosDia[bloqueKey];
        
        if (Array.isArray(ejerciciosBloque)) {
          ejerciciosBloque.forEach((ejercicioData: any) => {
            if (ejercicioData.id) {
              ejercicioIds.push(ejercicioData.id);
            }
          });
        }
      });
    }

    console.log('✅ IDs de ejercicios extraídos:', ejercicioIds);
    return ejercicioIds;
  } catch (error) {
    console.error('❌ Error en obtenerEjerciciosPlanificacion:', error);
    return [];
  }
}

// Función auxiliar para obtener ejercicios desde planificación cuando el coach ve el producto
async function getActivitiesFromPlanning(supabase: any, activityId: number, dia: string, activity: any) {
  try {
    
    // Mapear el día al nombre de columna en la BD
    const diasMap: Record<string, string> = {
      '1': 'lunes',
      '2': 'martes',
      '3': 'miercoles',
      '4': 'jueves',
      '5': 'viernes',
      '6': 'sabado',
      '7': 'domingo',
      'lunes': 'lunes',
      'martes': 'martes',
      'miercoles': 'miercoles',
      'jueves': 'jueves',
      'viernes': 'viernes',
      'sabado': 'sabado',
      'domingo': 'domingo'
    };
    
    const diaColumna = diasMap[dia] || 'lunes';
    
    // Obtener planificación de la primera semana (para preview del coach)
    const { data: planificacion } = await supabase
      .from('planificacion_ejercicios')
      .select(`${diaColumna}`)
      .eq('actividad_id', activityId)
      .eq('numero_semana', 1)
      .single();


    if (!planificacion || !planificacion[diaColumna]) {
      return NextResponse.json({
        success: true,
        data: { activities: [], count: 0, date: new Date().toISOString().split('T')[0], activity }
      });
    }

    // Parsear los ejercicios del día
    const ejerciciosDia = typeof planificacion[diaColumna] === 'string' 
      ? JSON.parse(planificacion[diaColumna]) 
      : planificacion[diaColumna];


    // Obtener IDs de ejercicios del formato de bloques
    const ejercicioIds: number[] = [];
    const ejerciciosConBloque: Array<{ id: number; bloque: number; orden: number }> = [];
    
    if (typeof ejerciciosDia === 'object' && !Array.isArray(ejerciciosDia)) {
      // Formato nuevo: { "1": [{ "id": 1000, "orden": 1 }], "2": [...] }
      Object.keys(ejerciciosDia).forEach(bloqueKey => {
        const bloque = parseInt(bloqueKey);
        const ejerciciosBloque = ejerciciosDia[bloqueKey];
        
        if (Array.isArray(ejerciciosBloque)) {
          ejerciciosBloque.forEach((ejercicioData: any) => {
            ejercicioIds.push(ejercicioData.id);
            ejerciciosConBloque.push({
              id: ejercicioData.id,
              bloque: bloque,
              orden: ejercicioData.orden || 1
            });
          });
        }
      });
    }


    if (ejercicioIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: { activities: [], count: 0, date: new Date().toISOString().split('T')[0], activity }
      });
    }

    // Obtener categoría de la actividad
    const { data: actividadInfo } = await supabase
      .from('activities')
      .select('categoria')
      .eq('id', activityId)
      .single();
    
    const categoria = actividadInfo?.categoria || 'fitness';
    
    // Obtener detalles de ejercicios desde la tabla correcta
    const tablaDetalles = categoria === 'nutricion' ? 'platos_detalles' : 'ejercicios_detalles'
    const camposSelect = categoria === 'nutricion' 
      ? 'id, nombre_plato, tipo, descripcion, video_url, calorias, proteinas, carbohidratos, grasas, receta'
      : 'id, nombre_ejercicio, tipo, descripcion, video_url, calorias, equipo, body_parts, intensidad, detalle_series, duracion_min'
    
    const { data: ejerciciosDetalles, error: ejerciciosError } = await supabase
      .from(tablaDetalles)
      .select(camposSelect)
      .in('id', ejercicioIds.length > 0 ? ejercicioIds : [0]);

    if (ejerciciosError) {
      console.error('Error obteniendo detalles de ejercicios:', ejerciciosError);
    }

    // Transformar a formato esperado por el frontend
    const transformedActivities = ejerciciosConBloque.map((ejInfo, index) => {
      const ejercicio = ejerciciosDetalles?.find((e: any) => e.id === ejInfo.id);
      
      const transformed = {
        id: `preview-${ejInfo.id}-${index}`,
        exercise_id: ejInfo.id,
        nombre_ejercicio: categoria === 'nutricion' 
          ? (ejercicio?.nombre_plato || 'Plato')
          : (ejercicio?.nombre_ejercicio || 'Ejercicio'),
        name: categoria === 'nutricion' 
          ? (ejercicio?.nombre_plato || 'Plato')
          : (ejercicio?.nombre_ejercicio || 'Ejercicio'),
        type: ejercicio?.tipo || 'general',
        tipo: ejercicio?.tipo || 'general',
        description: ejercicio?.descripcion || '',
        descripcion: ejercicio?.descripcion || '',
        completed: false,
        intensity: categoria === 'nutricion' ? null : (ejercicio?.intensidad || 'Principiante'),
        day: dia,
        block: ejInfo.bloque,
        bloque: ejInfo.bloque,
        order: ejInfo.orden,
        orden: ejInfo.orden,
        series: ejercicio?.detalle_series || null,
        detalle_series: ejercicio?.detalle_series || null,
        formatted_series: ejercicio?.detalle_series || null,
        date: new Date().toISOString().split('T')[0],
        video_url: ejercicio?.video_url || null,
        duracion_minutos: categoria === 'nutricion' ? null : ((ejercicio as any)?.duracion_min || null),
        duracion_min: categoria === 'nutricion' ? null : ((ejercicio as any)?.duracion_min || null),
        duration: categoria === 'nutricion' ? null : ((ejercicio as any)?.duracion_min || null),
        calorias: ejercicio?.calorias || null,
        intensidad: categoria === 'nutricion' ? null : (ejercicio?.intensidad || null),
        equipo: categoria === 'nutricion' ? null : (ejercicio?.equipo || 'Ninguno'),
        body_parts: categoria === 'nutricion' ? null : (ejercicio?.body_parts || null),
        // Campos específicos para nutrición
        proteinas: categoria === 'nutricion' ? (ejercicio?.proteinas || null) : null,
        carbohidratos: categoria === 'nutricion' ? (ejercicio?.carbohidratos || null) : null,
        grasas: categoria === 'nutricion' ? (ejercicio?.grasas || null) : null,
        receta: categoria === 'nutricion' ? (ejercicio?.receta || null) : null
      };
      
      return transformed;
    });


    return NextResponse.json({
      success: true,
      data: {
        activities: transformedActivities,
        count: transformedActivities.length,
        date: new Date().toISOString().split('T')[0],
        activity
      }
    });

  } catch (error: any) {
    console.error('Error en getActivitiesFromPlanning:', error);
    return NextResponse.json({
      success: true,
      data: { activities: [], count: 0, date: new Date().toISOString().split('T')[0] }
    });
  }
}
