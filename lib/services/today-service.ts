import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Robert - Today Screen Service
 * Lógica extraída de app/api/activities/today/route.ts para mejorar la mantenibilidad y performance.
 */

export interface ExerciseDetail {
    ejercicio_id: number;
    orden: number;
    bloque: number;
    detalle_series?: any;
    peso?: number;
    series?: number;
    repeticiones?: number;
}

/**
 * Normaliza los diferentes formatos de contenedores de ejercicios (nutrición o fitness)
 * que pueden venir de la base de datos como strings, arrays o mapas.
 */
export const normalizeExercisesToMap = (raw: any): Record<string, ExerciseDetail> => {
    if (!raw) return {};

    let data = raw;
    if (typeof raw === 'string') {
        try {
            data = JSON.parse(raw);
        } catch {
            return {};
        }
    }

    const map: Record<string, ExerciseDetail> = {};

    // Caso 1: Estructura { ejercicios: [...] } (Array)
    if (data && typeof data === 'object' && Array.isArray(data.ejercicios)) {
        data.ejercicios.forEach((x: any) => {
            const id = Number(x?.id || x?.ejercicio_id);
            const orden = Number(x?.orden || 1);
            const bloque = Number(x?.bloque || 1);
            if (!Number.isFinite(id)) return;
            const key = `${id}_${bloque}_${orden}`;
            map[key] = { ejercicio_id: id, orden, bloque, ...x };
        });
        return map;
    }

    // Caso 2: Estructura { ejercicios: {...} } (Mapa)
    if (data && typeof data === 'object' && data.ejercicios && typeof data.ejercicios === 'object' && !Array.isArray(data.ejercicios)) {
        Object.values(data.ejercicios).forEach((x: any) => {
            const id = Number(x?.id || x?.ejercicio_id);
            const orden = Number(x?.orden || 1);
            const bloque = Number(x?.bloque || 1);
            if (!Number.isFinite(id)) return;
            const key = `${id}_${bloque}_${orden}`;
            map[key] = { ejercicio_id: id, orden, bloque, ...x };
        });
        return map;
    }

    // Caso 3: Array directo de IDs o keys
    if (Array.isArray(data)) {
        data.forEach((k: any) => {
            if (typeof k === 'object') {
                const id = Number(k?.id || k?.ejercicio_id);
                const orden = Number(k?.orden || 1);
                const bloque = Number(k?.bloque || 1);
                if (Number.isFinite(id)) {
                    map[`${id}_${bloque}_${orden}`] = { ejercicio_id: id, orden, bloque, ...k };
                }
            } else {
                const key = String(k);
                const parts = key.split('_');
                if (parts.length >= 1) {
                    const id = Number(parts[0]);
                    const bloque = parts.length >= 2 ? Number(parts[1]) : 1;
                    const orden = parts.length >= 3 ? Number(parts[2]) : (parts.length === 2 ? 1 : 1);
                    if (Number.isFinite(id)) {
                        map[key] = { ejercicio_id: id, orden, bloque };
                    }
                }
            }
        });
        return map;
    }

    // Caso 4: Objeto Mapa directo (legacy format)
    if (data && typeof data === 'object') {
        Object.keys(data).forEach((key) => {
            if (key === 'blockCount' || key === 'blockNames' || key === 'ejercicios') return;

            const v = data[key];
            if (v && typeof v === 'object') {
                const id = Number(v?.ejercicio_id ?? v?.id ?? key.split('_')[0]);
                const parts = key.split('_');
                const bloque = Number(v?.bloque ?? (parts.length >= 2 ? parts[1] : 1));
                const orden = Number(v?.orden ?? (parts.length >= 3 ? parts[2] : (parts.length === 2 ? 1 : 1)));
                if (Number.isFinite(id)) {
                    map[key] = { ejercicio_id: id, orden, bloque, ...v };
                }
            } else {
                const parts = String(key).split('_');
                if (parts.length >= 1) {
                    const id = Number(parts[0]);
                    const bloque = parts.length >= 2 ? Number(parts[1]) : 1;
                    const orden = parts.length >= 3 ? Number(parts[2]) : 1;
                    if (Number.isFinite(id)) {
                        map[key] = { ejercicio_id: id, orden, bloque };
                    }
                }
            }
        });
        return map;
    }

    return map;
};

/**
 * Calcula las calorías basándose en macros si no vienen explícitas.
 */
export const computeKcalFromMacros = (row: any): number => {
    if (row.calorias || row.calorías) return Number(row.calorias || row.calorías);

    const p = Number(row.proteinas || row.p || 0);
    const c = Number(row.carbohidratos || row.carbs || row.c || 0);
    const f = Number(row.grasas || row.fats || row.f || 0);

    return (p * 4) + (c * 4) + (f * 9);
};

/**
 * Obtiene la semana objetivo basándose en la fecha de inicio del enrollment.
 */
export const getTargetWeek = async (
    supabase: SupabaseClient,
    activityId: number,
    startDate: string,
    currentDate: string,
    categoria: string
): Promise<number> => {
    const start = new Date(startDate);
    const current = new Date(currentDate);
    const diffDays = Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 1;

    const totalWeekNumber = Math.floor(diffDays / 7) + 1;
    const planTable = (categoria === 'nutricion' || categoria === 'nutrition') ? 'planificacion_platos' : 'planificacion_ejercicios';

    const { data: allPlan } = await supabase
        .from(planTable)
        .select('numero_semana')
        .eq('actividad_id', activityId)
        .order('numero_semana', { ascending: false })
        .limit(1);

    const maxSemanas = allPlan?.[0]?.numero_semana || 1;
    return ((totalWeekNumber - 1) % maxSemanas) + 1;
};

/**
 * Obtiene los nombres de los bloques para un día específico.
 */
export const getBlockNames = async (
    supabase: SupabaseClient,
    activityId: number,
    diaNum: string,
    week: number = 1
): Promise<Record<string, string>> => {
    const diasMap: Record<string, string> = {
        '1': 'lunes', '2': 'martes', '3': 'miercoles', '4': 'jueves', '5': 'viernes', '6': 'sabado', '7': 'domingo'
    };
    const diaColumna = diasMap[diaNum] || 'lunes';

    const { data: plan } = await supabase
        .from('planificacion_ejercicios')
        .select(diaColumna)
        .eq('actividad_id', activityId)
        .eq('numero_semana', week)
        .single();

    if (plan && plan[diaColumna]) {
        const diaData = typeof plan[diaColumna] === 'string' ? JSON.parse(plan[diaColumna]) : plan[diaColumna];
        return diaData.blockNames || {};
    }
    return {};
};
