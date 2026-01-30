import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '../../../../lib/supabase/supabase-server';
import { getSupabaseAdmin } from '@/lib/config/db';

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

    // Obtener nombres de bloques desde planificacion_ejercicios si es nutrición
    let blockNames: Record<string, string> = {};
    if (categoria === 'nutricion' && dia) {
      try {
        // Calcular semana y día
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

        // Obtener planificación de la semana 1 (o calcular según start_date si es necesario)
        const { data: planificacion } = await supabase
          .from('planificacion_ejercicios')
          .select(diaColumna)
          .eq('actividad_id', activityId)
          .eq('numero_semana', 1)
          .single();

        if (planificacion && planificacion[diaColumna]) {
          const diaData = typeof planificacion[diaColumna] === 'string'
            ? JSON.parse(planificacion[diaColumna])
            : planificacion[diaColumna];

          if (diaData.blockNames) {
            blockNames = diaData.blockNames;
            console.log(`📋 [API] Nombres de bloques obtenidos:`, blockNames);
          }
        }
      } catch (err) {
        console.error('❌ [API] Error obteniendo nombres de bloques:', err);
      }
    }

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
    // IMPORTANTE: Solo devolver actividades si existe un registro real en progreso_cliente o progreso_cliente_nutricion
    // NO crear registros automáticamente basándose en la planificación
    const tablaProgreso = categoria === 'nutricion' ? 'progreso_cliente_nutricion' : 'progreso_cliente'
    const camposProgreso = categoria === 'nutricion'
      ? 'id, fecha, ejercicios_completados, ejercicios_pendientes, macros, ingredientes'
      : 'id, fecha, ejercicios_completados, ejercicios_pendientes, detalles_series, minutos_json, calorias_json'

    // Buscar progreso - usar .limit() para obtener todos los registros que coincidan
    // y luego tomar el primero si hay varios
    // Intentar con activityId como número primero, luego como string si falla
    let { data: progressRecords, error: progressError } = await supabase
      .from(tablaProgreso)
      .select(camposProgreso)
      .eq('cliente_id', clientId)
      .eq('actividad_id', activityId)
      .eq('fecha', today)
      .order('id', { ascending: false })
      .limit(10);

    // Si no encuentra nada, intentar con activityId como string
    if ((!progressRecords || progressRecords.length === 0) && !progressError) {
      console.log(`🔄 [API] No se encontraron registros con activityId como número, intentando como string...`);
      const result = await supabase
        .from(tablaProgreso)
        .select(camposProgreso)
        .eq('cliente_id', clientId)
        .eq('actividad_id', String(activityId))
        .eq('fecha', today)
        .order('id', { ascending: false })
        .limit(10);

      progressRecords = result.data;
      progressError = result.error;
    }

    console.log(`🔍 [API] Buscando progreso en ${tablaProgreso}:`, {
      cliente_id: clientId,
      actividad_id: activityId,
      actividad_id_tipo: typeof activityId,
      actividad_id_string: String(activityId),
      fecha: today,
      fecha_tipo: typeof today,
      registros_encontrados: progressRecords?.length || 0,
      error: progressError,
      error_code: progressError?.code,
      error_message: progressError?.message,
      error_details: progressError?.details,
      error_hint: progressError?.hint
    });

    // Si hay error o no hay registros, devolver vacío
    if (progressError || !progressRecords || progressRecords.length === 0) {
      console.log('ℹ️ No existe registro de progreso para fecha:', today, 'en tabla:', tablaProgreso, '- devolviendo actividades vacías');
      if (progressError) {
        console.error('❌ Error obteniendo progreso:', {
          code: progressError.code,
          message: progressError.message,
          details: progressError.details,
          hint: progressError.hint
        });
      }
      return NextResponse.json({
        success: true,
        data: {
          activities: [],
          count: 0,
          date: today,
          activity: actividadInfo,
          enrollment: enrollment[0]
        }
      });
    }

    // Tomar el primer registro (el más reciente por el order by id desc)
    const progressRecord = progressRecords[0];

    console.log(`✅ [API] Registro de progreso seleccionado (de ${progressRecords.length} encontrados):`, {
      id: progressRecord.id,
      fecha: progressRecord.fecha,
      tiene_ejercicios_pendientes: !!progressRecord.ejercicios_pendientes,
      tiene_macros: !!progressRecord.macros,
      tiene_ingredientes: !!progressRecord.ingredientes
    });

    // Parsear ejercicios_pendientes una vez aquí para debug
    let ejerciciosPendientesParsed: any = null;
    try {
      ejerciciosPendientesParsed = progressRecord.ejercicios_pendientes
        ? (typeof progressRecord.ejercicios_pendientes === 'string'
          ? JSON.parse(progressRecord.ejercicios_pendientes)
          : progressRecord.ejercicios_pendientes)
        : null;
    } catch (err) {
      console.error('❌ Error parseando ejercicios_pendientes en log:', err);
    }

    console.log(`✅ [API] Progreso encontrado:`, {
      id: progressRecord.id,
      fecha: progressRecord.fecha,
      categoria,
      tabla_usada: tablaProgreso,
      ejercicios_pendientes_type: typeof progressRecord.ejercicios_pendientes,
      ejercicios_pendientes_is_string: typeof progressRecord.ejercicios_pendientes === 'string',
      ejercicios_pendientes_is_object: typeof progressRecord.ejercicios_pendientes === 'object',
      ejercicios_pendientes_keys: ejerciciosPendientesParsed
        ? Object.keys(ejerciciosPendientesParsed).length
        : 0,
      ejercicios_pendientes_keys_list: ejerciciosPendientesParsed
        ? Object.keys(ejerciciosPendientesParsed)
        : [],
      tiene_macros: !!progressRecord.macros,
      macros_type: typeof progressRecord.macros,
      tiene_ingredientes: !!progressRecord.ingredientes,
      ingredientes_type: typeof progressRecord.ingredientes,
      sample_ejercicios_pendientes: ejerciciosPendientesParsed
        ? ejerciciosPendientesParsed[Object.keys(ejerciciosPendientesParsed)[0]]
        : null
    });

    const normalizeNutritionContainerToMap = (raw: any): Record<string, { ejercicio_id: number; orden: number; bloque: number }> => {
      if (!raw) return {}
      if (typeof raw === 'string') {
        try {
          raw = JSON.parse(raw)
        } catch {
          return {}
        }
      }

      // Handle 'ejercicios' as Array
      if (raw && typeof raw === 'object' && Array.isArray((raw as any).ejercicios)) {
        const map: Record<string, { ejercicio_id: number; orden: number; bloque: number }> = {}
          ; ((raw as any).ejercicios || []).forEach((x: any) => {
            const id = Number(x?.id)
            const orden = Number(x?.orden)
            const bloque = Number(x?.bloque)
            if (!Number.isFinite(id) || !Number.isFinite(orden) || !Number.isFinite(bloque)) return
            const key = `${id}_${bloque}_${orden}`
            map[key] = { ejercicio_id: id, orden, bloque }
          })
        return map
      }

      // Handle 'ejercicios' as Object (Map)
      if (raw && typeof raw === 'object' && (raw as any).ejercicios && typeof (raw as any).ejercicios === 'object' && !Array.isArray((raw as any).ejercicios)) {
        const map: Record<string, { ejercicio_id: number; orden: number; bloque: number }> = {}
        Object.values((raw as any).ejercicios).forEach((x: any) => {
          const id = Number(x?.id)
          const orden = Number(x?.orden)
          const bloque = Number(x?.bloque)
          // Permitir id=0 si es válido en tu lógica, si no cambiar filtro
          if (!Number.isFinite(id) || !Number.isFinite(orden) || !Number.isFinite(bloque)) return
          const key = `${id}_${bloque}_${orden}`
          map[key] = { ejercicio_id: id, orden, bloque }
        })
        return map
      }

      if (Array.isArray(raw)) {
        const map: Record<string, { ejercicio_id: number; orden: number; bloque: number }> = {}
        raw.forEach((k: any) => {
          const key = String(k)
          const parts = key.split('_')
          if (parts.length >= 2) {
            const id = Number(parts[0])
            const bloque = parts.length >= 3 ? Number(parts[1]) : 1
            const orden = parts.length >= 3 ? Number(parts[2]) : Number(parts[1])
            if (Number.isFinite(id) && Number.isFinite(bloque) && Number.isFinite(orden)) {
              map[key] = { ejercicio_id: id, orden, bloque }
            }
          }
        })
        return map
      }

      if (raw && typeof raw === 'object') {
        const map: Record<string, { ejercicio_id: number; orden: number; bloque: number }> = {}
        Object.keys(raw).forEach((key) => {
          if (key === 'blockCount' || key === 'blockNames' || key === 'ejercicios') return

          const v = (raw as any)[key]
          if (v && typeof v === 'object') {
            const ejercicio_id = Number(v?.ejercicio_id ?? v?.id ?? key.split('_')[0])
            const parts = key.split('_')
            const bloque = Number(v?.bloque ?? (parts.length >= 3 ? parts[1] : 1))
            const orden = Number(v?.orden ?? (parts.length >= 3 ? parts[2] : (parts.length === 2 ? parts[1] : 1)))
            if (!Number.isFinite(ejercicio_id) || !Number.isFinite(orden) || !Number.isFinite(bloque)) return
            map[String(key)] = { ejercicio_id, orden, bloque }
          } else {
            const parts = String(key).split('_')
            if (parts.length >= 2) {
              const id = Number(parts[0])
              const bloque = parts.length >= 3 ? Number(parts[1]) : 1
              const orden = parts.length >= 3 ? Number(parts[2]) : Number(parts[1])
              if (Number.isFinite(id) && Number.isFinite(bloque) && Number.isFinite(orden)) {
                map[String(key)] = { ejercicio_id: id, orden, bloque }
              }
            }
          }
        })
        return map
      }

      return {}
    }

    const normalizeNutritionContainerToCompletionKeySet = (raw: any): Set<string> => {
      if (!raw) return new Set()
      if (typeof raw === 'string') {
        try {
          raw = JSON.parse(raw)
        } catch {
          return new Set()
        }
      }

      // Handle 'ejercicios' as Array
      if (raw && typeof raw === 'object' && Array.isArray((raw as any).ejercicios)) {
        const set = new Set<string>()
          ; ((raw as any).ejercicios || []).forEach((x: any) => {
            const id = Number(x?.id)
            const orden = Number(x?.orden)
            const bloque = Number(x?.bloque)
            if (!Number.isFinite(id) || !Number.isFinite(orden) || !Number.isFinite(bloque)) return
            set.add(`${id}_${bloque}_${orden}`)
          })
        return set
      }

      // Handle 'ejercicios' as Object (Map)
      if (raw && typeof raw === 'object' && (raw as any).ejercicios && typeof (raw as any).ejercicios === 'object' && !Array.isArray((raw as any).ejercicios)) {
        const set = new Set<string>()
        Object.values((raw as any).ejercicios).forEach((x: any) => {
          const id = Number(x?.id)
          const orden = Number(x?.orden)
          const bloque = Number(x?.bloque)
          if (!Number.isFinite(id) || !Number.isFinite(orden) || !Number.isFinite(bloque)) return
          set.add(`${id}_${bloque}_${orden}`)
        })
        return set
      }

      if (Array.isArray(raw)) {
        const set = new Set<string>()
        raw.forEach((k: any) => {
          const key = String(k)
          const parts = key.split('_')
          if (parts.length >= 2) {
            const id = Number(parts[0])
            const bloque = parts.length >= 3 ? Number(parts[1]) : 1
            const orden = parts.length >= 3 ? Number(parts[2]) : Number(parts[1])
            if (Number.isFinite(id) && Number.isFinite(bloque) && Number.isFinite(orden)) {
              set.add(`${id}_${bloque}_${orden}`)
            }
          }
        })
        return set
      }

      if (raw && typeof raw === 'object') {
        const set = new Set<string>()
        Object.keys(raw).forEach((key) => {
          if (key === 'blockCount' || key === 'blockNames' || key === 'ejercicios') return

          const v = (raw as any)[key]
          if (v && typeof v === 'object') {
            const id = Number(v?.ejercicio_id ?? v?.id ?? key.split('_')[0])
            const parts = key.split('_')
            const bloque = Number(v?.bloque ?? (parts.length >= 3 ? parts[1] : 1))
            const orden = Number(v?.orden ?? (parts.length >= 3 ? parts[2] : (parts.length === 2 ? parts[1] : 1)))
            if (!Number.isFinite(id) || !Number.isFinite(orden) || !Number.isFinite(bloque)) return
            set.add(`${id}_${bloque}_${orden}`)
          } else {
            const parts = String(key).split('_')
            if (parts.length >= 2) {
              const id = Number(parts[0])
              const bloque = parts.length >= 3 ? Number(parts[1]) : 1
              const orden = parts.length >= 3 ? Number(parts[2]) : Number(parts[1])
              if (Number.isFinite(id) && Number.isFinite(bloque) && Number.isFinite(orden)) {
                set.add(`${id}_${bloque}_${orden}`)
              }
            }
          }
        })
        return set
      }

      return new Set()
    }

    // 3. Obtener detalles de ejercicios
    let ejercicioIds: number[] = [];
    if (progressRecord) {
      try {
        // Para nutrición: usar ejercicios_pendientes directamente (no hay detalles_series)
        // Para fitness: usar detalles_series como fuente principal
        let idsDeDetallesSeries: number[] = [];

        // Parsear ejercicios_pendientes una sola vez
        const pendientesObjRaw = progressRecord.ejercicios_pendientes
          ? (typeof progressRecord.ejercicios_pendientes === 'string'
            ? JSON.parse(progressRecord.ejercicios_pendientes)
            : progressRecord.ejercicios_pendientes)
          : {};
        const pendientesObj = categoria === 'nutricion'
          ? normalizeNutritionContainerToMap(pendientesObjRaw)
          : pendientesObjRaw;

        if (categoria === 'nutricion') {
          // Para nutrición: extraer IDs desde ejercicios_pendientes
          idsDeDetallesSeries = Object.values(pendientesObj)
            .map((item: any) => item?.ejercicio_id)
            .filter(id => id !== undefined && id !== null && !isNaN(Number(id)))
            .map(id => Number(id));

          console.log(`🔍 [API] IDs extraídos desde ejercicios_pendientes para nutrición:`, {
            pendientes_obj_keys: Object.keys(pendientesObj),
            pendientes_obj_values: Object.values(pendientesObj),
            ids_extraidos: idsDeDetallesSeries
          });
        } else {
          // Para fitness: usar detalles_series como fuente principal
          const detallesSeriesTemp = progressRecord.detalles_series
            ? (typeof progressRecord.detalles_series === 'string'
              ? JSON.parse(progressRecord.detalles_series)
              : progressRecord.detalles_series)
            : {};

          idsDeDetallesSeries = Object.values(detallesSeriesTemp)
            .map((item: any) => item?.ejercicio_id)
            .filter(id => id !== undefined && id !== null && !isNaN(Number(id)))
            .map(id => Number(id));
        }

        // completados es un objeto con keys únicos
        const completadosObjRaw = progressRecord.ejercicios_completados
          ? (typeof progressRecord.ejercicios_completados === 'string'
            ? JSON.parse(progressRecord.ejercicios_completados)
            : progressRecord.ejercicios_completados)
          : {};
        const completadosObj = categoria === 'nutricion'
          ? normalizeNutritionContainerToMap(completadosObjRaw)
          : completadosObjRaw;

        // Extraer IDs únicos de ambos objetos
        const idsCompletados = Object.values(completadosObj)
          .map((item: any) => item?.ejercicio_id)
          .filter(id => id !== undefined && id !== null && !isNaN(Number(id)))
          .map(id => Number(id));
        const idsPendientes = Object.values(pendientesObj)
          .map((item: any) => item?.ejercicio_id)
          .filter(id => id !== undefined && id !== null && !isNaN(Number(id)))
          .map(id => Number(id));

        // Combinar todos los IDs (detalles_series o ejercicios_pendientes es la fuente principal)
        ejercicioIds = [...new Set([...idsDeDetallesSeries, ...idsCompletados, ...idsPendientes])]; // Set para eliminar duplicados

        console.log('🔍 [API] IDs extraídos:', {
          categoria,
          de_detalles_series: idsDeDetallesSeries,
          completados: idsCompletados,
          pendientes: idsPendientes,
          final: ejercicioIds,
          pendientes_obj_keys: Object.keys(pendientesObj)
        });
      } catch (err) {
        console.error('❌ [API] Error parseando ejercicios:', err);
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

        if (categoria === 'nutricion') {
          // Para nutrición: parsear macros y receta desde progressRecord
          // Los detalles de nutrición vienen de macros y receta
          detallesSeries = {}; // Se construirá desde macros y receta más adelante
          minutosJson = {}; // Se construirá desde receta más adelante
          caloriasJson = {}; // Se construirá desde macros más adelante

          // Parsear macros si existen
          try {
            if (progressRecord.macros) {
              const macrosParsed = typeof progressRecord.macros === 'string'
                ? JSON.parse(progressRecord.macros)
                : progressRecord.macros;
              // Construir caloriasJson desde macros
              Object.keys(macrosParsed).forEach(key => {
                if (macrosParsed[key]?.calorias) {
                  caloriasJson[key] = macrosParsed[key].calorias;
                }
                if (macrosParsed[key]?.minutos) {
                  minutosJson[key] = macrosParsed[key].minutos;
                }
              });
            }
          } catch (err) {
            console.error('Error parseando macros:', err);
          }
        } else {
          // Para fitness: usar detalles_series, minutos_json y calorias_json
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
        }
      } catch (err) {
        console.error('Error parseando datos de progreso:', err);
      }
    }

    // Obtener detalles según la categoría
    // ⚠️ IMPORTANTE: Para nutrición NO volvemos a leer de nutrition_program_details.
    // Toda la información necesaria (nombre, macros, receta, minutos, ingredientes)
    // viene desde progreso_cliente_nutricion (campos JSONB: ejercicios_pendientes, macros, receta).
    let ejerciciosDetalles: any[] | null = null;
    let recetasByEjercicioId: Record<string, { id: string; ejercicio_id: string; nombre: string | null; receta: string | null }> = {}
    if (categoria === 'nutricion') {
      console.log('🍽️ [API] Categoría nutrición: NO se consulta nutrition_program_details. Se usará SOLO progreso_cliente_nutricion (macros/receta/ejercicios_pendientes).', {
        ejercicioIds,
        tiene_macros: !!progressRecord && !!(progressRecord as any).macros,
        tiene_ingredientes: !!progressRecord && !!(progressRecord as any).ingredientes
      });
      const ejercicioIdsForQuery = (ejercicioIds || [])
        .map((id: any) => {
          const n = typeof id === 'number' ? id : parseInt(String(id || ''), 10)
          return Number.isFinite(n) ? n : null
        })
        .filter((n: any) => n !== null)

      const idsForQuerySafe = ejercicioIdsForQuery.length > 0 ? ejercicioIdsForQuery : [0]
      // ⚠️ IMPORTANTE: esta lectura debe evitar RLS del cliente.
      // Usamos service role para poder resolver nombre/receta aunque el usuario no tenga policy.
      const adminSupabase = await getSupabaseAdmin();

      // 1) Lookup directo en recetas por ejercicio_id (nuevo vínculo)
      try {
        const { data: recetasRows, error: recetasError } = await adminSupabase
          .from('recetas')
          .select('id, ejercicio_id, nombre, receta')
          .in('ejercicio_id', idsForQuerySafe as any)

        if (recetasError) {
          console.error('❌ [API] Error consultando recetas por ejercicio_id:', recetasError)
        } else {
          recetasByEjercicioId = {}
            ; (recetasRows || []).forEach((r: any) => {
              const eid = r?.ejercicio_id != null ? String(r.ejercicio_id) : ''
              if (!eid) return
              recetasByEjercicioId[eid] = {
                id: String(r?.id || ''),
                ejercicio_id: eid,
                nombre: r?.nombre == null ? null : String(r.nombre || ''),
                receta: r?.receta == null ? null : String(r.receta || ''),
              }
            })

          console.log('🍽️ [API] recetas lookup by ejercicio_id', {
            ejercicioIds: idsForQuerySafe,
            returnedCount: Array.isArray(recetasRows) ? recetasRows.length : 0,
            sample: Array.isArray(recetasRows)
              ? (recetasRows as any[]).slice(0, 10).map((r: any) => ({ ejercicio_id: r?.ejercicio_id, nombre: r?.nombre, receta: r?.receta ? 'present' : null }))
              : [],
          })
        }
      } catch (e) {
        console.error('❌ [API] Error cargando recetas por ejercicio_id:', e)
      }

      // 2) Mantener nutrition_program_details SOLO para video_url/video_file_name (opcional)
      try {
        const { data: nutritionDetailsData, error: nutritionDetailsError } = await adminSupabase
          .from('nutrition_program_details')
          .select('id, video_url, video_file_name')
          .in('id', idsForQuerySafe as any)

        if (nutritionDetailsError) {
          console.error('❌ [API] Error consultando nutrition_program_details (video):', nutritionDetailsError)
          ejerciciosDetalles = []
        } else {
          ejerciciosDetalles = nutritionDetailsData || []
        }
      } catch (e) {
        console.error('❌ [API] Error consultando nutrition_program_details (video) try/catch:', e)
        ejerciciosDetalles = []
      }
    } else {
      const tablaDetalles = 'ejercicios_detalles';
      const camposSelect = 'id, nombre_ejercicio, tipo, descripcion, video_url, calorias, equipo, body_parts, intensidad, detalle_series, duracion_min';

      // Convertir IDs a strings para la query de Supabase (los IDs en la BD pueden ser strings o números)
      const ejercicioIdsForQuery = ejercicioIds.length > 0
        ? ejercicioIds.map(id => String(id))
        : ['0'];

      const { data: ejerciciosDetallesData } = await supabase
        .from(tablaDetalles)
        .select(camposSelect)
        .in('id', ejercicioIdsForQuery);

      ejerciciosDetalles = ejerciciosDetallesData || [];

      console.log(`📚 Ejercicios encontrados en ${tablaDetalles}:`, ejerciciosDetalles);
      console.log('📋 detalles_series desde progreso_cliente:', detallesSeries);
      console.log('🔍 IDs buscados (números):', ejercicioIds);
      console.log('🔍 IDs encontrados (tipos):', ejerciciosDetalles?.map(e => ({ id: e.id, tipo: typeof e.id, nombre: e.nombre_ejercicio })));
    }

    // Usar detalles_series o ejercicios_pendientes para obtener bloque y orden correctos
    // Para nutrición: usar ejercicios_pendientes directamente
    // Para fitness: usar detalles_series
    let sourceData: any = {};

    let nutritionCompletionKeySet: Set<string> | null = null
    if (categoria === 'nutricion') {
      // Para nutrición: usar ejercicios_pendientes directamente
      console.log(`🔍 [API] ANTES de parsear ejercicios_pendientes:`, {
        progressRecord_exists: !!progressRecord,
        ejercicios_pendientes_exists: !!progressRecord && !!(progressRecord as any).ejercicios_pendientes,
        ejercicios_pendientes_type: progressRecord ? typeof (progressRecord as any).ejercicios_pendientes : 'undefined',
        ejercicios_pendientes_is_null: !progressRecord ? false : (progressRecord as any).ejercicios_pendientes === null,
        ejercicios_pendientes_is_undefined: !progressRecord ? true : (progressRecord as any).ejercicios_pendientes === undefined,
        ejercicios_pendientes_value_preview: progressRecord && (progressRecord as any).ejercicios_pendientes
          ? (typeof progressRecord.ejercicios_pendientes === 'string'
            ? progressRecord.ejercicios_pendientes.substring(0, 100)
            : JSON.stringify(progressRecord.ejercicios_pendientes).substring(0, 100))
          : null
      });

      const pendientesMap: any = {}
      const completadosMap: any = {}

      if (progressRecord && (progressRecord as any).ejercicios_pendientes) {
        try {
          // Supabase devuelve JSONB como objetos JavaScript directamente
          // Solo necesitamos parsear si es string
          if (typeof progressRecord.ejercicios_pendientes === 'string') {
            Object.assign(pendientesMap, normalizeNutritionContainerToMap(progressRecord.ejercicios_pendientes));
          } else if (typeof progressRecord.ejercicios_pendientes === 'object' && progressRecord.ejercicios_pendientes !== null) {
            // Ya es un objeto, normalizarlo (soporta schema nuevo y legacy)
            Object.assign(pendientesMap, normalizeNutritionContainerToMap(progressRecord.ejercicios_pendientes));
          } else {
            console.error(`❌ [API] ejercicios_pendientes tiene un tipo inesperado:`, typeof progressRecord.ejercicios_pendientes);
          }

          if (progressRecord && (progressRecord as any).ejercicios_completados) {
            try {
              Object.assign(completadosMap, normalizeNutritionContainerToMap(progressRecord.ejercicios_completados));
            } catch (e) {
              console.error(`❌ [API] Error normalizando ejercicios_completados:`, e);
            }
          }

          nutritionCompletionKeySet = normalizeNutritionContainerToCompletionKeySet(progressRecord.ejercicios_completados)

          // Para nutrición: mostrar tanto pendientes como completados
          sourceData = { ...pendientesMap, ...completadosMap }

          // Verificar que sourceData sea un objeto válido
          if (typeof sourceData !== 'object' || sourceData === null || Array.isArray(sourceData)) {
            console.error(`❌ [API] sourceData no es un objeto válido después del parseo:`, {
              tipo: typeof sourceData,
              es_null: sourceData === null,
              es_array: Array.isArray(sourceData),
              valor: sourceData
            });
            sourceData = {};
          }
        } catch (err) {
          console.error(`❌ [API] Error parseando ejercicios_pendientes:`, err);
          sourceData = {};
        }
      } else {
        console.warn(`⚠️ [API] progressRecord.ejercicios_pendientes no existe o es null`);
        if (progressRecord && (progressRecord as any).ejercicios_completados) {
          try {
            nutritionCompletionKeySet = normalizeNutritionContainerToCompletionKeySet(progressRecord.ejercicios_completados)
            sourceData = normalizeNutritionContainerToMap(progressRecord.ejercicios_completados)
          } catch (e) {
            sourceData = {}
          }
        } else {
          sourceData = {};
        }
      }

      console.log(`📋 [API] Usando ejercicios_pendientes para nutrición:`, {
        keys_count: Object.keys(sourceData).length,
        keys: Object.keys(sourceData),
        sample: sourceData[Object.keys(sourceData)[0]],
        sourceData_type: typeof sourceData,
        sourceData_is_object: typeof sourceData === 'object' && !Array.isArray(sourceData)
      });
    } else {
      // Para fitness: usar detalles_series
      sourceData = detallesSeries;
      console.log(`📋 [API] Usando detalles_series para fitness:`, {
        keys_count: Object.keys(sourceData).length
      });
    }

    console.log(`📋 [API] sourceData final:`, {
      categoria,
      keys_count: Object.keys(sourceData).length,
      keys: Object.keys(sourceData).slice(0, 10),
      sourceData_is_empty: Object.keys(sourceData).length === 0,
      progressRecord_exists: !!progressRecord,
      progressRecord_ejercicios_pendientes_exists: !!progressRecord && !!(progressRecord as any).ejercicios_pendientes,
      progressRecord_ejercicios_pendientes_type: progressRecord ? typeof (progressRecord as any).ejercicios_pendientes : 'undefined',
      progressRecord_ejercicios_pendientes_value: progressRecord && (progressRecord as any).ejercicios_pendientes
        ? (typeof progressRecord.ejercicios_pendientes === 'string'
          ? progressRecord.ejercicios_pendientes.substring(0, 200)
          : JSON.stringify(progressRecord.ejercicios_pendientes).substring(0, 200))
        : null,
      sourceData_completo: categoria === 'nutricion' ? sourceData : 'no mostrar (fitness)'
    });

    // Si sourceData está vacío, devolver vacío
    if (Object.keys(sourceData).length === 0) {
      console.warn(`⚠️ [API] sourceData está vacío para ${categoria}. Devolviendo actividades vacías.`, {
        categoria,
        progressRecord_id: progressRecord ? (progressRecord as any).id : null,
        progressRecord_fecha: progressRecord ? (progressRecord as any).fecha : null,
        ejercicios_pendientes_raw: progressRecord ? (progressRecord as any).ejercicios_pendientes : null,
        ejercicios_pendientes_type: progressRecord ? typeof (progressRecord as any).ejercicios_pendientes : 'undefined',
        ejercicios_pendientes_is_null: !progressRecord ? false : (progressRecord as any).ejercicios_pendientes === null,
        ejercicios_pendientes_is_undefined: !progressRecord ? true : (progressRecord as any).ejercicios_pendientes === undefined
      });
      return NextResponse.json({
        success: true,
        data: {
          activities: [],
          count: 0,
          date: today,
          activity: actividadInfo,
          enrollment: enrollment[0]
        }
      });
    }

    // Parsear macros e ingredientes UNA SOLA VEZ para nutrición (antes del map)
    let macrosParsed: Record<string, any> = {};
    let ingredientesParsed: Record<string, any> = {};
    if (categoria === 'nutricion' && progressRecord) {
      try {
        macrosParsed = progressRecord.macros
          ? (typeof progressRecord.macros === 'string'
            ? JSON.parse(progressRecord.macros)
            : progressRecord.macros)
          : {};
        ingredientesParsed = progressRecord.ingredientes
          ? (typeof progressRecord.ingredientes === 'string'
            ? JSON.parse(progressRecord.ingredientes)
            : progressRecord.ingredientes)
          : {};

        console.log(`🍽️ [API] Macros e ingredientes parseados para nutrición:`, {
          macros_keys: Object.keys(macrosParsed),
          ingredientes_keys: Object.keys(ingredientesParsed),
          sample_macro: macrosParsed[Object.keys(macrosParsed)[0]],
          sample_ingredientes: ingredientesParsed[Object.keys(ingredientesParsed)[0]]
        });
      } catch (err) {
        console.error('❌ [API] Error parseando macros/ingredientes:', err);
      }
    }

    const transformedActivities = Object.keys(sourceData).map((key, index) => {
      const detalle = sourceData[key];
      if (!detalle || !detalle.ejercicio_id) {
        console.warn(`⚠️ [API] Detalle inválido para key ${key}:`, detalle);
        return null;
      }

      // Para nutrición: NO buscar en ejerciciosDetalles, usar solo datos de progreso_cliente_nutricion
      let ejercicio: any = null;
      if (categoria !== 'nutricion') {
        // Solo para fitness: buscar en ejerciciosDetalles
        const ejercicioIdNum = Number(detalle.ejercicio_id);
        const ejercicioIdStr = String(detalle.ejercicio_id);
        ejercicio = ejerciciosDetalles?.find(e => {
          const eIdNum = Number(e.id);
          const eIdStr = String(e.id);
          return eIdNum === ejercicioIdNum ||
            eIdStr === ejercicioIdStr ||
            eIdNum.toString() === ejercicioIdStr ||
            eIdStr === ejercicioIdNum.toString();
        });
      }

      // Verificar si está completado usando el key único
      const isCompleted = categoria === 'nutricion'
        ? (nutritionCompletionKeySet ? nutritionCompletionKeySet.has(`${detalle.ejercicio_id}_${detalle.bloque}_${detalle.orden}`) : false)
        : (completados && typeof completados === 'object' && key in completados);

      // Para nutrición: obtener datos directamente de macrosParsed, recetaParsed e ingredientesParsed usando la key
      let macrosData: any = null;
      let ingredientesData: any = null;
      if (categoria === 'nutricion') {
        macrosData = macrosParsed[key] || null;
        const detalleIdStr = String(detalle.ejercicio_id)
        const recetaLookup = recetasByEjercicioId[detalleIdStr]
        const recetaText = recetaLookup?.receta || null
        const recetaData: any = {
          nombre: recetaLookup?.nombre || null,
          receta: recetaText,
          minutos: null
        }
        ingredientesData = ingredientesParsed[key] || null;

        console.log(`🍽️ [API] Datos para key ${key}:`, {
          key,
          ejercicio_id: detalle.ejercicio_id,
          bloque: detalle.bloque,
          orden: detalle.orden,
          macrosData: macrosData ? {
            proteinas: macrosData.proteinas,
            carbohidratos: macrosData.carbohidratos,
            grasas: macrosData.grasas,
            calorias: macrosData.calorias,
            minutos: macrosData.minutos
          } : null,
          recetaData: recetaData ? {
            nombre: recetaData.nombre,
            receta: recetaData.receta ? recetaData.receta.substring(0, 50) + '...' : null,
            minutos: recetaData.minutos
          } : null,
          ingredientesData: ingredientesData ? (typeof ingredientesData === 'string' ? ingredientesData.substring(0, 100) + '...' : 'presente') : null
        });
      }

      // Obtener nombre
      let nombreFinal = "";
      if (categoria === 'nutricion') {
        // Para nutrición: nombre viene de recetaData.nombre
        const detalleIdStr = String(detalle.ejercicio_id)
        const recetaLookup = recetasByEjercicioId[detalleIdStr]
        nombreFinal =
          recetaLookup?.nombre ||
          `Plato ${detalle.ejercicio_id}`;
      } else {
        // Para fitness: nombre viene de ejercicio
        nombreFinal = ejercicio?.nombre_ejercicio || `Ejercicio ${detalle.ejercicio_id}`;
      }

      // Obtener minutos
      let minutosFinal: number | null = null;
      if (categoria === 'nutricion') {
        // Para nutrición: minutos puede venir de macrosData.minutos o recetaData.minutos
        minutosFinal = macrosData?.minutos !== null && macrosData?.minutos !== undefined
          ? Number(macrosData.minutos)
          : null;
      } else {
        // Para fitness: usar minutosJson o ejercicio.duracion_min
        const minutosKey = `${detalle.ejercicio_id}_${detalle.orden}`;
        minutosFinal = minutosJson[minutosKey] || minutosJson[detalle.ejercicio_id] || (ejercicio as any)?.duracion_min || null;
      }

      // Obtener calorías
      let caloriasFinal: number | null = null;
      if (categoria === 'nutricion') {
        // Para nutrición: calorías viene de macrosData.calorias
        caloriasFinal = macrosData?.calorias !== null && macrosData?.calorias !== undefined
          ? Number(macrosData.calorias)
          : null;
      } else {
        // Para fitness: usar caloriasJson o ejercicio.calorias
        const caloriasKey = `${detalle.ejercicio_id}_${detalle.orden}`;
        caloriasFinal = caloriasJson[caloriasKey] || caloriasJson[detalle.ejercicio_id] || (ejercicio as any)?.calorias || null;
      }

      // Construir objeto transformado
      const transformedExercise: any = {
        id: `${(progressRecord ? (progressRecord as any).id : 0) || 0}-${detalle.ejercicio_id}-${key}`,
        exercise_id: detalle.ejercicio_id,
        nombre_ejercicio: nombreFinal,
        nombre_plato: categoria === 'nutricion' ? nombreFinal : null,
        title: nombreFinal,
        name: nombreFinal,
        tipo: categoria,
        type: categoria,
        bloque: detalle.bloque,
        block: detalle.bloque,
        orden: detalle.orden,
        order: detalle.orden,
        done: isCompleted,
        completed: isCompleted,
        day: null,
        date: today,
        series: detalle.detalle_series || null,
        detalle_series: detalle.detalle_series || null,
        formatted_series: detalle.detalle_series || null,
        video_url: categoria === 'nutricion'
          ? ((ejerciciosDetalles || []).find((r: any) => String(r?.id) === String(detalle.ejercicio_id))?.video_url || null)
          : (ejercicio?.video_url || null),
        duracion_minutos: minutosFinal,
        duracion_min: minutosFinal,
        duration: minutosFinal,
        minutos: minutosFinal,
        calorias: caloriasFinal,
        intensidad: categoria === 'nutricion' ? null : (ejercicio?.intensidad || null),
        equipo: categoria === 'nutricion' ? null : (ejercicio?.equipo || null),
        body_parts: categoria === 'nutricion' ? null : (ejercicio?.body_parts || null)
      };

      // Campos específicos para nutrición
      if (categoria === 'nutricion') {
        transformedExercise.proteinas = macrosData?.proteinas !== null && macrosData?.proteinas !== undefined
          ? Number(macrosData.proteinas)
          : null;
        transformedExercise.carbohidratos = macrosData?.carbohidratos !== null && macrosData?.carbohidratos !== undefined
          ? Number(macrosData.carbohidratos)
          : null;
        transformedExercise.grasas = macrosData?.grasas !== null && macrosData?.grasas !== undefined
          ? Number(macrosData.grasas)
          : null;
        const detalleIdStr = String(detalle.ejercicio_id)
        const recetaLookup = recetasByEjercicioId[detalleIdStr]
        transformedExercise.receta = recetaLookup?.receta || null;
        // Nombre del plato: fuente de verdad recetas.nombre (migración), fallback temporal a nutrition_program_details.nombre
        transformedExercise.nombre =
          recetaLookup?.nombre || transformedExercise.nombre
        // Los ingredientes vienen directamente del campo ingredientes de progreso_cliente_nutricion
        transformedExercise.ingredientes = ingredientesData || null;
      }

      console.log(`✅ ${categoria === 'nutricion' ? 'Plato' : 'Ejercicio'} ${detalle.ejercicio_id} transformado:`, {
        nombre: nombreFinal,
        ejercicio_id: detalle.ejercicio_id,
        bloque: detalle.bloque,
        orden: detalle.orden,
        proteinas: transformedExercise.proteinas,
        carbohidratos: transformedExercise.carbohidratos,
        grasas: transformedExercise.grasas,
        minutos: transformedExercise.minutos,
        calorias: transformedExercise.calorias,
        receta: transformedExercise.receta ? 'presente' : 'null',
        ingredientes: transformedExercise.ingredientes ? 'presente' : 'null'
      });

      return transformedExercise;
    }).filter(Boolean);

    console.log(`✅ [API] Actividades transformadas: ${transformedActivities.length}`, {
      categoria,
      fecha: today,
      primer_actividad: transformedActivities[0] ? {
        id: transformedActivities[0].id,
        nombre: transformedActivities[0].nombre_ejercicio,
        ejercicio_id: transformedActivities[0].exercise_id,
        proteinas: transformedActivities[0].proteinas,
        carbohidratos: transformedActivities[0].carbohidratos,
        grasas: transformedActivities[0].grasas
      } : null
    });

    // 5. Usar la info de actividad ya obtenida

    return NextResponse.json({
      success: true,
      data: {
        activities: transformedActivities,
        count: transformedActivities.length,
        date: today,
        activity: actividadInfo,
        enrollment: enrollment[0],
        blockNames: blockNames // Incluir nombres de bloques para nutrición
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
    const tablaDetalles = categoria === 'nutricion' ? 'nutrition_program_details' : 'ejercicios_detalles'
    const camposSelect = categoria === 'nutricion'
      ? 'id, nombre, tipo, descripcion, video_url, video_file_name, calorias, proteinas, carbohidratos, grasas, receta, ingredientes, minutos'
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
          ? (ejercicio?.nombre || ejercicio?.nombre_plato || 'Plato')
          : (ejercicio?.nombre_ejercicio || 'Ejercicio'),
        name: categoria === 'nutricion'
          ? (ejercicio?.nombre || ejercicio?.nombre_plato || 'Plato')
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
        receta: categoria === 'nutricion' ? (ejercicio?.receta || null) : null,
        ingredientes: categoria === 'nutricion' ? (ejercicio?.ingredientes || null) : null,
        minutos: categoria === 'nutricion' ? (ejercicio?.minutos || null) : null
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
