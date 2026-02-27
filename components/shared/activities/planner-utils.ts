import { Exercise, DayScheduleEntry } from './planner-types'

export const DAYS = [
    { key: 1, label: 'L', fullLabel: 'Lunes' },
    { key: 2, label: 'M', fullLabel: 'Martes' },
    { key: 3, label: 'M', fullLabel: 'Miércoles' },
    { key: 4, label: 'J', fullLabel: 'Jueves' },
    { key: 5, label: 'V', fullLabel: 'Viernes' },
    { key: 6, label: 'S', fullLabel: 'Sábado' },
    { key: 7, label: 'D', fullLabel: 'Domingo' }
]

export const DEFAULT_NUTRITION_BLOCK_NAMES = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena', 'Colación', 'Pre-entreno', 'Post-entreno']

export const TYPE_COLOR_SCHEMES: Record<string, { hex: string; soft: string; strong: string }> = {
    // Paleta fitness (naranja/rosa)
    fuerza: { hex: '#FED7AA', soft: 'rgba(254, 215, 170, 0.25)', strong: '#FED7AA' }, // bg-orange-200
    cardio: { hex: '#FDBA74', soft: 'rgba(253, 186, 116, 0.25)', strong: '#FDBA74' }, // bg-orange-300
    hiit: { hex: '#FB923C', soft: 'rgba(251, 146, 60, 0.25)', strong: '#FB923C' },   // bg-orange-400
    movilidad: { hex: '#FDA4AF', soft: 'rgba(253, 164, 175, 0.25)', strong: '#FDA4AF' }, // bg-rose-300
    flexibilidad: { hex: '#F9A8D4', soft: 'rgba(249, 168, 212, 0.25)', strong: '#F9A8D4' }, // bg-pink-300
    equilibrio: { hex: '#FBCFE8', soft: 'rgba(251, 207, 232, 0.25)', strong: '#FBCFE8' },   // bg-pink-200
    funcional: { hex: '#FECDD3', soft: 'rgba(254, 205, 211, 0.25)', strong: '#FECDD3' },   // bg-rose-200
    general: { hex: '#FDBA74', soft: 'rgba(253, 186, 116, 0.25)', strong: '#FDBA74' },
    // Paleta nutrición alineada a la misma gama naranja/rosa
    desayuno: { hex: '#FED7AA', soft: 'rgba(254, 215, 170, 0.25)', strong: '#FED7AA' }, // similar a fuerza
    almuerzo: { hex: '#FB923C', soft: 'rgba(251, 146, 60, 0.25)', strong: '#FB923C' },  // similar a hiit
    cena: { hex: '#FDA4AF', soft: 'rgba(253, 164, 175, 0.25)', strong: '#FDA4AF' },     // similar a movilidad
    snack: { hex: '#FDBA74', soft: 'rgba(253, 186, 116, 0.25)', strong: '#FDBA74' },    // similar a cardio
    merienda: { hex: '#F9A8D4', soft: 'rgba(249, 168, 212, 0.25)', strong: '#F9A8D4' }, // similar a flexibilidad
    colación: { hex: '#FBCFE8', soft: 'rgba(251, 207, 232, 0.25)', strong: '#FBCFE8' }, // similar a equilibrio
    'pre-entreno': { hex: '#FECDD3', soft: 'rgba(254, 205, 211, 0.25)', strong: '#FECDD3' }, // similar a funcional
    'post-entreno': { hex: '#FDBA74', soft: 'rgba(253, 186, 116, 0.25)', strong: '#FDBA74' },
    otro: { hex: '#6B7280', soft: 'rgba(107, 114, 128, 0.25)', strong: '#6B7280' } // Gris neutro
}

export const allowedExerciseTypes = ['fuerza', 'cardio', 'hiit', 'movilidad', 'flexibilidad', 'equilibrio', 'funcional', 'general']
export const allowedNutritionTypes = ['desayuno', 'almuerzo', 'cena', 'snack', 'merienda', 'colación', 'pre-entreno', 'post-entreno', 'otro']

export const normalizeExerciseType = (rawType: string): string => {
    const base = (rawType || '')
        .toString()
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[-\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/[\u0300-\u036f]/g, '')

    if (!base) return allowedExerciseTypes[0]
    if (allowedExerciseTypes.includes(base)) return base

    if (base.includes('strength') || base.includes('fuerz')) return 'fuerza'
    if (base.includes('cardio') || base.includes('resistencia')) return 'cardio'
    if (base.includes('hiit') || base.includes('interval')) return 'hiit'
    if (base.includes('movil') || base.includes('mobility')) return 'movilidad'
    if (base.includes('flex') || base.includes('stretch')) return 'flexibilidad'
    if (base.includes('equilibr') || base.includes('balance')) return 'equilibrio'
    if (base.includes('funcion') || base.includes('functional')) return 'funcional'

    return 'general'
}

export const normalizeNutritionType = (rawType: string): string => {
    const base = (rawType || '')
        .toString()
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[-\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9-]/g, '')

    if (!base) return 'otro'
    if (allowedNutritionTypes.includes(base)) return base

    if (base.includes('desayun')) return 'desayuno'
    if (base.includes('almuerz') || base.includes('comida') || base.includes('lunch')) return 'almuerzo'
    if (base.includes('cena') || base.includes('dinner')) return 'cena'
    if (base.includes('snack') || base.includes('tentempié') || base.includes('tentempie')) return 'snack'
    if (base.includes('meriend') || base.includes('afternoon')) return 'merienda'
    if (base.includes('colación') || base.includes('colacion')) return 'colación'
    if (base.includes('pre-entren') || base.includes('preentren') || base.includes('pre-workout')) return 'pre-entreno'
    if (base.includes('post-entren') || base.includes('postentren') || base.includes('post-workout')) return 'post-entreno'

    return 'otro'
}

export const parseSeries = (seriesData?: any) => {
    if (!seriesData || seriesData === '' || seriesData === 'undefined' || seriesData === 'null') {
        return [];
    }

    console.log('[parseSeries] Input:', typeof seriesData, seriesData);

    // Si es un string, usar el formato anterior (reps-kg-sets; reps-kg-sets...)
    if (typeof seriesData === 'string') {
        const cleanData = seriesData.trim().replace(/^["']|["']$/g, '');
        const groups = cleanData.split(';').filter(g => g.trim() !== '');
        if (groups.length === 0) return [];

        const result = groups.map((group, index) => {
            // Clean more aggressively and handle potential double quotes inside string
            const cleanGroup = group.trim().replace(/[()"' ]/g, '');
            const parts = cleanGroup.split('-');

            return {
                id: index + 1,
                kg: parts[0] || '0',
                reps: parts[1] || '0',
                sets: parts[2] || '1'
            };
        });
        console.log('[parseSeries] Parsed:', result);
        return result;
    }

    // Si es un array de objetos (nuevo formato)
    if (Array.isArray(seriesData)) {
        return seriesData.map((block, index) => ({
            id: index + 1,
            reps: block.reps || block.repeticiones || '',
            kg: block.kg || block.peso || '',
            sets: block.sets || block.series || block.series_num || '1'
        }));
    }

    return [];
};

export const formatSeriesDisplay = (exercise: Exercise) => {
    if (!exercise) return null

    const seriesData = exercise.detalle_series || exercise.series;
    const parsed = parseSeries(seriesData);

    if (parsed.length > 0) {
        return parsed.map(f => `${f.kg || 0}kg · ${f.reps || 0}r · ${f.sets || 1}s`).join(' || ');
    }

    const p = exercise.peso || (exercise as any).peso_kg || (exercise as any).weight || (exercise as any).Weight || '0'
    const r = exercise.reps || (exercise as any).repeticiones || (exercise as any).Reps || (exercise as any).Repeticiones || '0'
    const s = exercise.series || (exercise as any).series_num || (exercise as any).sets || (exercise as any).Sets || (exercise as any).Series || '1'

    const displayP = p.toString().toLowerCase().includes('kg') ? p : `${p}kg`
    return `${displayP} · ${r}r · ${s}s`;
}

export const getTypeColorScheme = (type: string | undefined | null, isNutrition: boolean = false) => {
    if (!type) {
        return isNutrition ? TYPE_COLOR_SCHEMES.otro : TYPE_COLOR_SCHEMES.general
    }
    if (isNutrition || type.toLowerCase() === 'nutrición' || type.toLowerCase() === 'nutricion') {
        const normalized = normalizeNutritionType(type)
        return TYPE_COLOR_SCHEMES[normalized] ?? TYPE_COLOR_SCHEMES.otro
    }
    const normalized = normalizeExerciseType(type)
    return TYPE_COLOR_SCHEMES[normalized] ?? TYPE_COLOR_SCHEMES.general
}

export const isGenericExercise = (ex: any): boolean => {
    if (!ex) return true
    const hasValidId = ex.id !== undefined &&
        ex.id !== null &&
        ex.id !== '' &&
        !String(ex.id).startsWith('deleted-') &&
        ex.id !== `deleted-${ex._originalIndex || ''}`

    if (hasValidId) return false

    const name = ex.name || ex.nombre_ejercicio || ex['Nombre de la Actividad'] || ex.Nombre || ''
    const isGenericName = !name ||
        name.trim() === '' ||
        /^Ejercicio\s+\d+$/i.test(name.trim()) ||
        /^Plato\s+\d+$/i.test(name.trim()) ||
        name.trim().startsWith('Ejercicio ') ||
        name.trim().startsWith('Plato ')

    return isGenericName
}

export const getExercisesFromDay = (dayData: DayScheduleEntry): Exercise[] => {
    if (!dayData) return []
    let exercises: Exercise[] = []
    if (Array.isArray(dayData)) {
        exercises = dayData
    } else if (Array.isArray(dayData.ejercicios)) {
        exercises = dayData.ejercicios
    } else if (Array.isArray(dayData.exercises)) {
        exercises = dayData.exercises
    }
    return exercises.filter(ex => !isGenericExercise(ex))
}

export const getBlockNamesFromDay = (dayData: DayScheduleEntry): { [key: number]: string } => {
    if (!dayData || Array.isArray(dayData)) return {}
    return dayData.blockNames || {}
}

export const normalizeExerciseData = (data: any, isNutrition: boolean): Exercise => {
    if (!data) return {} as Exercise

    // Handle ID safely
    const id = String(data.id || data.exercise_id || data.ejercicio_id || '')

    // Handle Name logic
    const name = data.name || data.title || data.nombre_ejercicio || data.nombre || 'Sin nombre'
    const description = data.description || data.descripcion || ''

    // Normalize type
    const rawType = data.type || data.tipo || data.categoria || ''
    const type = isNutrition ? normalizeNutritionType(rawType) : normalizeExerciseType(rawType)

    // Normalize calories and macros
    const getVal = (...args: any[]) => {
        // First pass: try to find a non-zero value
        for (const val of args) {
            if (val !== undefined && val !== null && val !== '') {
                const n = Number(val)
                if (!isNaN(n) && n > 0) return n
            }
        }
        // Second pass: accept zero if that's all we have
        for (const val of args) {
            if (val !== undefined && val !== null && val !== '') return Number(val)
        }
        return 0
    }

    const calories = getVal(data.calories, data.calorias, data.kcal, data['Calorías'], data.macros?.calories)
    const proteinas = getVal(data.proteinas, data.protein, data.proteins, data['Proteínas'], data['Proteínas (g)'], data.macros?.protein)
    const carbohidratos = getVal(data.carbohidratos, data.carbs, data.carbohydrates, data['Carbohidratos'], data['Carbohidratos (g)'], data.macros?.carbs)
    const grasas = getVal(data.grasas, data.fats, data.fat, data['Grasas'], data['Grasas (g)'], data.macros?.fat)
    const duration = getVal(data.duration, data.duracion, data.duracion_min, data['Duración'], data['Duración (min)'])

    // Normalize media
    const video_url = data.video_url || data.url_video || data.video || ''
    const image_url = data.image_url || data.url_imagen || data.image || ''

    return {
        ...data,
        id,
        name,
        description,
        type,
        calories: isNaN(calories) ? 0 : calories,
        proteinas: isNaN(proteinas) ? 0 : proteinas,
        carbohidratos: isNaN(carbohidratos) ? 0 : carbohidratos,
        grasas: isNaN(grasas) ? 0 : grasas,
        duration: isNaN(duration) ? 0 : duration,
        video_url,
        image_url,
        block: data.block || data.bloque,
        orden: data.orden,
        series: data.series || data.series_num || data.sets || data.Series || data.Sets || '',
        detalle_series: data.detalle_series || data.series_details || '',
        reps: data.reps || data.repeticiones || data.Reps || data.Repeticiones || '',
        peso: data.peso || data.peso_kg || data.weight || data.Weight || ''
    }
}
