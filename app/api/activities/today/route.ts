import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '../../../../lib/supabase/supabase-server';
import { getSupabaseAdmin } from '@/lib/config/db';
import { normalizeExercisesToMap, getBlockNames } from '@/lib/services/today-service';

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
    const enrollmentId = url.searchParams.get('enrollmentId');

    const activityId = activityIdParam ? parseInt(activityIdParam) : 78;
    const today = selectedDate || new Date().toISOString().split('T')[0];

    // 1. Obtener información de la actividad
    const { data: actividadInfo } = await supabase
      .from('activities')
      .select('id, title, description, categoria')
      .eq('id', activityId)
      .single();

    const categoria = actividadInfo?.categoria || 'fitness';

    // Obtener nombres de bloques desde el servicio
    const blockNames = dia ? await getBlockNames(supabase, activityId, dia) : {};

    // 2. Verificar enrollment
    let enrollmentQuery = supabase
      .from('activity_enrollments')
      .select('id, activity_id, start_date, status, expiration_date')
      .eq('client_id', clientId);

    if (enrollmentId) {
      enrollmentQuery = enrollmentQuery.eq('id', enrollmentId);
    } else {
      enrollmentQuery = enrollmentQuery.eq('activity_id', activityId);
    }

    const { data: enrollment } = await enrollmentQuery
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
        activity.targetDate = today;
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
      : 'id, fecha, ejercicios_completados, ejercicios_pendientes, informacion, minutos, calorias, peso, series, reps, descanso, descanso_bloques'

    // Buscar progreso
    let queryProgress = supabase
      .from(tablaProgreso)
      .select(camposProgreso)
      .eq('cliente_id', clientId)
      .eq('fecha', today);

    let progressRecords = null;
    let progressError = null;

    if (enrollmentId) {
      const { data, error } = await queryProgress.eq('enrollment_id', enrollmentId).limit(5);
      progressRecords = data;
      progressError = error;

      // Si no encontró por enrollment_id, intentar por actividad_id (legacy)
      if (!progressRecords || progressRecords.length === 0) {
        console.log(`🔍 [API Today] No progress records for enrollment_id: ${enrollmentId}. Attempting legacy activity_id fallback...`);
      } else {
        console.log(`🔍 [API Today] Found ${progressRecords.length} progress records for enrollment_id: ${enrollmentId}`);
      }

      if (!progressRecords || progressRecords.length === 0) {
        console.log(`🔍 [API Today] No progress records for enrollment_id: ${enrollmentId}. Attempting fallback...`);
      } else {
        console.log(`🔍 [API Today] Found ${progressRecords.length} progress records for enrollment_id: ${enrollmentId}`);
      }

      if (!progressRecords || progressRecords.length === 0) {
        console.log(`🔄 [API] No se encontró progreso para enrollment_id ${enrollmentId}, intentando por actividad_id ${activityId}...`);
        const { data: legacyData, error: legacyError } = await supabase
          .from(tablaProgreso)
          .select(camposProgreso)
          .eq('cliente_id', clientId)
          .eq('fecha', today)
          .eq('actividad_id', activityId)
          .limit(5);

        if (legacyData && legacyData.length > 0) {
          progressRecords = legacyData;
          progressError = legacyError;
          console.log(`✅ [API] Se encontró progreso legacy para actividad_id ${activityId}`);
        }
      }
    } else {
      const { data, error } = await queryProgress.eq('actividad_id', activityId).limit(5);
      progressRecords = data;
      progressError = error;
    }

    // Si no encuentra nada, intentar con activityId como string
    if ((!progressRecords || progressRecords.length === 0) && !progressError) {
      const result = await supabase
        .from(tablaProgreso)
        .select(camposProgreso)
        .eq('cliente_id', clientId)
        .eq('actividad_id', String(activityId))
        .eq('fecha', today)
        .order('id', { ascending: false })
        .limit(1);

      if (result.data && result.data.length > 0) {
        progressRecords = result.data;
      }
    }

    console.log(`🔍 [API] Buscando progreso en ${tablaProgreso}:`, {
      cliente_id: clientId,
      actividad_id: activityId,
      fecha: today,
      registros_encontrados: progressRecords?.length || 0
    });

    // Si hay error o no hay registros, devolver vacío para clientes (evitar fallback a planificación que "miente")
    if (progressError || !progressRecords || progressRecords.length === 0) {
      console.log('ℹ️ No existe registro de progreso real para fecha:', today, 'en tabla:', tablaProgreso);

      // Si el cliente no tiene registro, devolvemos vacío. 
      // La visualización de planificación solo debe ocurrir si el usuario es el coach (ya manejado arriba)
      // o en una vista de preview específica.
      return NextResponse.json({
        success: true,
        data: {
          activities: [],
          count: 0,
          date: today,
          message: 'Día sin actividad registrada'
        }
      });
    }

    // Tomar el primer registro (el más reciente por el order by id desc)
    const progressRecord = progressRecords[0];
    console.log(`✅ [API Today] Found progress record: ID=${progressRecord.id}, Enrollment=${progressRecord.enrollment_id}, Date=${progressRecord.fecha}`);
    if (progressRecord.informacion || progressRecord.detalles_series) {
      console.log(`🔍 [API Today] Has details: ${Object.keys(progressRecord.informacion || progressRecord.detalles_series || {}).length} entries`);
    } else {
      console.warn(`⚠️ [API Today] Record has NO details/informacion!`);
    }

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

    // 4. Declarar variables para transformar datos
    let completados: Record<string, any> = {};
    let informacion: Record<string, any> = {};
    let minutosJson: Record<string, any> = {};
    let caloriasJson: Record<string, any> = {};
    let pesoJson: Record<string, any> = {};
    let seriesActualesJson: Record<string, any> = {};
    let repsActualesJson: Record<string, any> = {};
    let descansoJson: Record<string, any> = {};

    if (progressRecord) {
      try {
        completados = progressRecord.ejercicios_completados
          ? (typeof progressRecord.ejercicios_completados === 'string'
            ? JSON.parse(progressRecord.ejercicios_completados)
            : progressRecord.ejercicios_completados)
          : {};

        if (categoria === 'nutricion') {
          // Para nutrición: parsear macros y receta desde progressRecord
          informacion = {};
          minutosJson = {};
          caloriasJson = {};

          try {
            if (progressRecord.macros) {
              const macrosParsed = typeof progressRecord.macros === 'string'
                ? JSON.parse(progressRecord.macros)
                : progressRecord.macros;
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
          // Combinar informacion y detalles_series para obtener datos completos
          const rawInfo = (typeof progressRecord.informacion === 'string' ? JSON.parse(progressRecord.informacion) : (progressRecord.informacion || {}));
          const rawDetalles = (typeof progressRecord.detalles_series === 'string' ? JSON.parse(progressRecord.detalles_series) : (progressRecord.detalles_series || {}));

          informacion = { ...rawDetalles, ...rawInfo }; // Info tiene prioridad para la estructura base

          minutosJson = (progressRecord.minutos || progressRecord.minutos_json)
            ? (typeof (progressRecord.minutos || progressRecord.minutos_json) === 'string'
              ? JSON.parse(progressRecord.minutos || progressRecord.minutos_json)
              : (progressRecord.minutos || progressRecord.minutos_json))
            : {};
          caloriasJson = (progressRecord.calorias || progressRecord.calorias_json)
            ? (typeof (progressRecord.calorias || progressRecord.calorias_json) === 'string'
              ? JSON.parse(progressRecord.calorias || progressRecord.calorias_json)
              : (progressRecord.calorias || progressRecord.calorias_json))
            : {};
          pesoJson = (progressRecord.peso || progressRecord.peso_json)
            ? (typeof (progressRecord.peso || progressRecord.peso_json) === 'string'
              ? JSON.parse(progressRecord.peso || progressRecord.peso_json)
              : (progressRecord.peso || progressRecord.peso_json))
            : {};
          seriesActualesJson = (progressRecord.series || progressRecord.series_json)
            ? (typeof (progressRecord.series || progressRecord.series_json) === 'string'
              ? JSON.parse(progressRecord.series || progressRecord.series_json)
              : (progressRecord.series || progressRecord.series_json))
            : {};
          repsActualesJson = (progressRecord.reps || progressRecord.reps_json)
            ? (typeof (progressRecord.reps || progressRecord.reps_json) === 'string'
              ? JSON.parse(progressRecord.reps || progressRecord.reps_json)
              : (progressRecord.reps || progressRecord.reps_json))
            : {};
          descansoJson = (progressRecord.descanso || progressRecord.descanso_json)
            ? (typeof (progressRecord.descanso || progressRecord.descanso_json) === 'string'
              ? JSON.parse(progressRecord.descanso || progressRecord.descanso_json)
              : (progressRecord.descanso || progressRecord.descanso_json))
            : {};
        }
      } catch (err) {
        console.error('❌ Error parseando campos de progreso:', err);
      }
    }

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

        // Parsear ejercicios_pendientes una sola vez usando normalización universal
        const pendientesObjRaw = progressRecord.ejercicios_pendientes
          ? (typeof progressRecord.ejercicios_pendientes === 'string'
            ? JSON.parse(progressRecord.ejercicios_pendientes)
            : progressRecord.ejercicios_pendientes)
          : {};
        const pendientesObj = normalizeNutritionContainerToMap(pendientesObjRaw);

        // Helper to extract IDs from various formats (object or stringified JSON)
        const extractIds = (data: any): number[] => {
          if (!data) return [];
          const entries = typeof data === 'object' && !Array.isArray(data) ? Object.values(data) : (Array.isArray(data) ? data : []);
          return entries.map((item: any) => {
            if (typeof item === 'string') {
              try {
                const parsed = JSON.parse(item);
                return Number(parsed.ejercicio_id || parsed.id || item.split('_')[0]);
              } catch {
                return Number(item.split('_')[0]);
              }
            }
            return Number(item?.ejercicio_id || item?.id || 0);
          }).filter(id => id !== undefined && id !== null && !isNaN(id) && id > 0);
        };

        if (categoria === 'nutricion') {
          // Para nutrición: extraer IDs desde ejercicios_pendientes
          const pendientesObjRaw = progressRecord.ejercicios_pendientes
            ? (typeof progressRecord.ejercicios_pendientes === 'string'
              ? JSON.parse(progressRecord.ejercicios_pendientes)
              : progressRecord.ejercicios_pendientes)
            : {};

          idsDeDetallesSeries = extractIds(pendientesObjRaw);

          console.log(`🔍 [API] IDs extraídos para nutrición:`, idsDeDetallesSeries);
        } else {
          // Para fitness: usar la variable 'informacion' ya parseada/combinada
          idsDeDetallesSeries = extractIds(informacion);
        }

        // También colectar IDs de completados y pendientes como respaldo
        const completadosObjRaw = progressRecord.ejercicios_completados
          ? (typeof progressRecord.ejercicios_completados === 'string'
            ? JSON.parse(progressRecord.ejercicios_completados)
            : progressRecord.ejercicios_completados)
          : {};
        const idsCompletados = extractIds(completadosObjRaw);

        const pendientesObjRawForFit = progressRecord.ejercicios_pendientes
          ? (typeof progressRecord.ejercicios_pendientes === 'string'
            ? JSON.parse(progressRecord.ejercicios_pendientes)
            : progressRecord.ejercicios_pendientes)
          : {};
        const idsPendientes = extractIds(pendientesObjRawForFit);

        // Combinar todos los IDs
        ejercicioIds = [...new Set([...idsDeDetallesSeries, ...idsCompletados, ...idsPendientes])];

        console.log('🔍 [API] IDs extraídos finales:', {
          categoria,
          count: ejercicioIds.length,
          ids: ejercicioIds
        });
      } catch (err) {
        console.error('❌ [API] Error parseando ejercicios:', err);
        ejercicioIds = [];
      }
    }

    console.log('🔍 IDs de ejercicios a buscar:', ejercicioIds);


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
      console.log('📋 informacion desde progreso_cliente:', informacion);
      console.log('🔍 IDs buscados (números):', ejercicioIds);
      console.log('🔍 IDs encontrados (tipos):', ejerciciosDetalles?.map(e => ({ id: e.id, tipo: typeof e.id, nombre: e.nombre_ejercicio })));
    }

    // Usar informacion o ejercicios_pendientes para obtener bloque y orden correctos
    // Para nutrición: usar ejercicios_pendientes directamente
    // Para fitness: usar informacion
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
      // Para fitness: colectar todas las llaves posibles (informacion, pendientes, completados)
      // Esto previene que la lista aparezca vacía si 'informacion' aún no se pobló correctamente
      const pendKeys = (typeof progressRecord.ejercicios_pendientes === 'string' ? JSON.parse(progressRecord.ejercicios_pendientes) : (progressRecord.ejercicios_pendientes || {}));
      const compKeys = (typeof progressRecord.ejercicios_completados === 'string' ? JSON.parse(progressRecord.ejercicios_completados) : (progressRecord.ejercicios_completados || {}));
      const infoKeys = (progressRecord.informacion || progressRecord.detalles_series)
        ? (typeof (progressRecord.informacion || progressRecord.detalles_series) === 'string'
          ? JSON.parse(progressRecord.informacion || progressRecord.detalles_series)
          : (progressRecord.informacion || progressRecord.detalles_series))
        : {};

      sourceData = { ...infoKeys, ...pendKeys, ...compKeys };

      // Limpiar metadata si se coló
      ['ejercicios', 'blockCount', 'blockNames', 'orden', 'bloque', 'ejercicio_id'].forEach(k => delete sourceData[k]);

      console.log(`📋 [API] Usando agregación de llaves para fitness:`, {
        keys_count: Object.keys(sourceData).length,
        has_info: Object.keys(infoKeys).length > 0,
        has_pend: Object.keys(pendKeys).length > 0,
        has_comp: Object.keys(compKeys).length > 0
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

    // Si sourceData está vacío, intentar fallback a planificación (self-healing)
    if (Object.keys(sourceData).length === 0) {
      console.warn(`⚠️ [API] sourceData está vacío para ${categoria}. Intentando fallback a planificación.`);

      const userEnrollment = enrollment && enrollment.length > 0 ? enrollment[0] : null;
      if (userEnrollment && userEnrollment.start_date && dia) {
        const current = new Date(today);
        const start = new Date(userEnrollment.start_date);
        const diffDays = Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const totalWeekNumber = Math.floor(diffDays / 7) + 1;

        if (diffDays >= 0) {
          const { data: allPlan } = await supabase
            .from('planificacion_ejercicios')
            .select('numero_semana')
            .eq('actividad_id', activityId)
            .order('numero_semana', { ascending: false })
            .limit(1);

          const maxSemanas = allPlan?.[0]?.numero_semana || 1;
          const targetWeek = ((totalWeekNumber - 1) % maxSemanas) + 1;

          const activity = { ...actividadInfo, targetDate: today };
          return await getActivitiesFromPlanning(supabase, Number(activityId), String(dia), activity, targetWeek);
        }
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
      let detalle = sourceData[key];
      const parts = key.split('_');
      const keyId = parseInt(parts[0]);
      const keyB = parts.length >= 2 ? parseInt(parts[1]) : 1;
      const keyO = parts.length >= 3 ? parseInt(parts[2]) : (parts.length === 2 ? parseInt(parts[1]) : 1);

      // Si el detalle es un string (formato legado), intentar parsearlo
      if (typeof detalle === 'string') {
        try {
          const parsed = JSON.parse(detalle);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            detalle = parsed;
          }
        } catch (e) {
          // No es JSON válido, se tratará abajo
        }
      }

      // Si el detalle sigue sin ser un objeto válido, reconstruir esqueleto
      if (!detalle || typeof detalle !== 'object' || Array.isArray(detalle)) {
        detalle = {
          ejercicio_id: keyId,
          bloque: keyB,
          orden: keyO
        };
      } else {
        // Asegurar que tenga los campos necesarios para el resto de la lógica
        detalle.ejercicio_id = detalle.ejercicio_id || detalle.id || keyId;
        detalle.bloque = detalle.bloque || keyB;
        detalle.orden = detalle.orden || keyO;
      }

      const exerciseIdVal = detalle.ejercicio_id;
      if (!exerciseIdVal) {
        console.warn(`⚠️ [API] No se pudo determinar el ID para key ${key}`);
        return null;
      }

      // Para nutrición: NO buscar en ejerciciosDetalles, usar solo datos de progreso_cliente_nutricion
      let ejercicio: any = null;
      if (categoria !== 'nutricion' && categoria !== 'nutrition') {
        // Asegurarnos de que tenemos el ID limpio
        const pureExerciseId = detalle.ejercicio_id || detalle.id || (typeof key === 'string' ? key.split('_')[0] : null);
        const ejercicioIdNum = Number(pureExerciseId);

        ejercicio = ejerciciosDetalles?.find(e => {
          const eId = Number(e.id);
          return eId === ejercicioIdNum;
        });
      }

      // Verificar si está completado usando el key único y soporte para varios formatos
      const isCompleted = (() => {
        if (categoria === 'nutricion') {
          return nutritionCompletionKeySet ? nutritionCompletionKeySet.has(`${detalle.ejercicio_id}_${detalle.bloque}_${detalle.orden}`) : false;
        }

        if (!completados) return false;
        const c = completados;

        // 1. Verificar por key directo (Map)
        if (key in c) return true;

        // 2. Verificar dentro de object.ejercicios si existe
        if (c.ejercicios && typeof c.ejercicios === 'object' && !Array.isArray(c.ejercicios)) {
          if (key in c.ejercicios) return true;
        }

        // 3. Verificar en Array (root o .ejercicios)
        const arr = Array.isArray(c) ? c : (Array.isArray(c.ejercicios) ? c.ejercicios : []);
        const ejIdNum = Number(detalle.ejercicio_id);
        const bNum = Number(detalle.bloque);
        const oNum = Number(detalle.orden);

        if (arr.length > 0) {
          const found = arr.some((e: any) => {
            if (typeof e === 'string') return e === key || e === String(detalle.ejercicio_id) || e === `${ejIdNum}_${bNum}_${oNum}`;
            const itemID = Number(e.id ?? e.ejercicio_id);
            const itemB = Number(e.bloque ?? 1);
            const itemO = Number(e.orden ?? 1);
            return itemID === ejIdNum && itemB === bNum && itemO === oNum;
          });
          if (found) return true;
        }

        // 4. Si es objeto (Map), buscar por valor o por patrón de key
        if (typeof c === 'object' && !Array.isArray(c)) {
          const alternativeKey = `${ejIdNum}_${bNum}_${oNum}`;
          if (alternativeKey in c) return true;

          return Object.entries(c).some(([k, v]: [string, any]) => {
            if (k === 'ejercicios' || k === 'blockCount' || k === 'blockNames') return false;
            const parts = k.split('_');
            if (parts.length >= 2) {
              const kId = Number(parts[0]);
              const kB = parts.length >= 3 ? Number(parts[1]) : 1;
              const kO = parts.length >= 3 ? Number(parts[2]) : Number(parts[1]);
              if (kId === ejIdNum && kB === bNum && kO === oNum) return true;
            }
            if (v && typeof v === 'object') {
              const itemID = Number(v.id ?? v.ejercicio_id);
              const itemB = Number(v.bloque ?? 1);
              const itemO = Number(v.orden ?? 1);
              return itemID === ejIdNum && itemB === bNum && itemO === oNum;
            }
            return false;
          });
        }

        return false;
      })();

      // Para nutrición: obtener datos directamente de macrosParsed, recetaParsed e ingredientesParsed usando la key de forma robusta
      let macrosData: any = null;
      let ingredientesData: any = null;
      let recetaData: any = null;

      if (categoria === 'nutricion') {
        const key_ibo = `${detalle.ejercicio_id}_${detalle.bloque}_${detalle.orden}`;
        const key_io = `${detalle.ejercicio_id}_${detalle.orden}`;
        const key_ib = `${detalle.ejercicio_id}_${detalle.bloque}`;
        const key_i = `${detalle.ejercicio_id}`;

        macrosData = macrosParsed[key_ibo] || macrosParsed[key_io] || macrosParsed[key_ib] || macrosParsed[key_i] || null;
        ingredientesData = ingredientesParsed[key_ibo] || ingredientesParsed[key_io] || ingredientesParsed[key_ib] || ingredientesParsed[key_i] || null;

        const detalleIdStr = String(detalle.ejercicio_id);
        const recetaLookup = recetasByEjercicioId[detalleIdStr];
        recetaData = {
          nombre: recetaLookup?.nombre || null,
          receta: recetaLookup?.receta || null,
          minutos: macrosData?.minutos || null
        };

        console.log(`🍽️ [API] Datos para key ${key}:`, {
          key,
          ejercicio_id: detalle.ejercicio_id,
          bloque: detalle.bloque,
          orden: detalle.orden,
          found_macros_key: [key_ibo, key_io, key_ib, key_i].find(k => macrosParsed[k]),
          found_macros: !!macrosData,
          calorias: macrosData?.calorias
        });
      }

      // Si es fitness y no tiene detalle_series, intentar construirlo desde campos individuales si existen
      if (categoria !== 'nutricion' && !detalle.detalle_series) {
        if (detalle.peso !== undefined || detalle.series !== undefined || detalle.repeticiones !== undefined) {
          detalle.detalle_series = [{
            peso: detalle.peso || 0,
            series: detalle.series || 0,
            repeticiones: detalle.repeticiones || 0
          }];
        }
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
        // Para fitness: usar key actual (id_bloque_orden o id_orden), id_orden explícito o ejercicio.duracion_min
        const key_io = `${detalle.ejercicio_id}_${detalle.orden}`;
        minutosFinal = minutosJson[key] || minutosJson[key_io] || minutosJson[detalle.ejercicio_id] || (ejercicio as any)?.duracion_min || null;
      }

      // Obtener calorías
      let caloriasFinal: number | null = null;
      if (categoria === 'nutricion') {
        // Para nutrición: calorías viene de macrosData.calorias
        caloriasFinal = macrosData?.calorias !== null && macrosData?.calorias !== undefined
          ? Number(macrosData.calorias)
          : null;
      } else {
        // Para fitness: usar key actual, id_orden explícito o ejercicio.calorias
        const key_io = `${detalle.ejercicio_id}_${detalle.orden}`;
        caloriasFinal = caloriasJson[key] || caloriasJson[key_io] || caloriasJson[detalle.ejercicio_id] || (ejercicio as any)?.calorias || null;
      }

      // Obtener datos técnicos (peso, series, reps, descanso)
      const currentPeso = pesoJson[key] || pesoJson[`${detalle.ejercicio_id}_${detalle.orden}`] || null;
      const currentSeries = seriesActualesJson[key] || seriesActualesJson[`${detalle.ejercicio_id}_${detalle.orden}`] || null;
      const currentReps = repsActualesJson[key] || repsActualesJson[`${detalle.ejercicio_id}_${detalle.orden}`] || null;
      const currentDescanso = descansoJson[key] || descansoJson[`${detalle.ejercicio_id}_${detalle.orden}`] || null;

      // Construir objeto transformado
      const transformedExercise: any = {
        id: `${(progressRecord ? (progressRecord as any).id : 0) || 0}-${detalle.ejercicio_id}-${key}`,
        exercise_id: detalle.ejercicio_id,
        nombre_ejercicio: nombreFinal,
        nombre_plato: categoria === 'nutricion' ? nombreFinal : null,
        title: nombreFinal,
        name: nombreFinal,
        tipo: ejercicio?.tipo || categoria,
        type: ejercicio?.tipo || categoria,
        bloque: detalle.bloque,
        block: detalle.bloque,
        orden: detalle.orden,
        order: detalle.orden,
        day: null,
        date: today,
        video_url: categoria === 'nutricion'
          ? ((ejerciciosDetalles || []).find((r: any) => String(r?.id) === String(detalle.ejercicio_id))?.video_url || null)
          : (ejercicio?.video_url || null),
        calorias: caloriasFinal,
        minutos: minutosFinal,
        duracion_min: minutosFinal,
        duration: minutosFinal,
        peso: currentPeso,
        kg: currentPeso,
        series_num: currentSeries,
        sets: currentSeries,
        reps_num: currentReps,
        reps: currentReps,
        descanso: currentDescanso,
        detalle_series: currentSeries && currentReps ? JSON.stringify({ series: currentSeries, reps: currentReps, load: currentPeso }) : (detalle.detalle_series || null),
        done: isCompleted,
        completed: isCompleted,
        description: categoria === 'nutricion' ? null : (ejercicio?.descripcion || null),
        descripcion: categoria === 'nutricion' ? null : (ejercicio?.descripcion || null),
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
async function getActivitiesFromPlanning(supabase: any, activityId: number, dia: string, activity: any, week: number = 1) {
  try {
    console.log(`📋 [getActivitiesFromPlanning] Loading Week ${week}, Day ${dia} for Activity ${activityId}`);

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

    // Obtener categoría de la actividad para saber qué tabla consultar
    const { data: actBase } = await supabase
      .from('activities')
      .select('categoria')
      .eq('id', activityId)
      .single();

    const categoria = actBase?.categoria || 'fitness';
    const planTable = (categoria === 'nutricion' || categoria === 'nutrition') ? 'planificacion_platos' : 'planificacion_ejercicios';

    // Obtener planificación de la semana especificada
    let { data: planificacion, error: planError } = await supabase
      .from(planTable)
      .select(`${diaColumna}`)
      .eq('actividad_id', activityId)
      .eq('numero_semana', week)
      .maybeSingle();

    if (!planificacion || !planificacion[diaColumna]) {
      const otherTable = planTable === 'planificacion_platos' ? 'planificacion_ejercicios' : 'planificacion_platos';
      console.log(`🔄 [getActivitiesFromPlanning] Empty ${planTable}, trying ${otherTable} fallback for Act: ${activityId}, Week: ${week}, Day: ${diaColumna}`);
      const fallback = await supabase
        .from(otherTable)
        .select(`${diaColumna}`)
        .eq('actividad_id', activityId)
        .eq('numero_semana', week)
        .maybeSingle();

      if (fallback.data && fallback.data[diaColumna]) {
        planificacion = fallback.data;
        console.log(`✅ [getActivitiesFromPlanning] Fallback success using ${otherTable}`);
      }
    }


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
    } else if (Array.isArray(ejerciciosDia)) {
      // Handle array format for backward compatibility or simpler plans
      ejerciciosDia.forEach((ejercicioData: any, index: number) => {
        if (typeof ejercicioData === 'object' && ejercicioData.id) {
          ejercicioIds.push(ejercicioData.id);
          ejerciciosConBloque.push({
            id: ejercicioData.id,
            bloque: 1, // Default block for array format
            orden: ejercicioData.orden || (index + 1)
          });
        } else if (typeof ejercicioData === 'number') {
          ejercicioIds.push(ejercicioData);
          ejerciciosConBloque.push({
            id: ejercicioData,
            bloque: 1,
            orden: index + 1
          });
        }
      });
    }

    console.log('✅ IDs de ejercicios extraídos:', ejercicioIds);
    console.log('✅ Ejercicios con bloque y orden:', ejerciciosConBloque);

    if (ejercicioIds.length === 0) {
      console.log('ℹ️ No se encontraron IDs de ejercicios para el día.');
      return NextResponse.json({
        success: true,
        data: { activities: [], count: 0, date: new Date().toISOString().split('T')[0], activity }
      });
    }

    // Obtener detalles de ejercicios desde la tabla correcta
    const tablaDetalles = (categoria === 'nutricion' || categoria === 'nutrition') ? 'nutrition_program_details' : 'ejercicios_detalles'
    const camposSelect = (categoria === 'nutricion' || categoria === 'nutrition')
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
        date: activity.targetDate || new Date().toISOString().split('T')[0], // Usar fecha del contexto
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
        date: activity.targetDate || new Date().toISOString().split('T')[0],
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
