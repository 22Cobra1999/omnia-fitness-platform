
export const exerciseTypeOptions = [
    { value: 'fuerza', label: 'Fuerza' },
    { value: 'cardio', label: 'Cardio' },
    { value: 'hiit', label: 'HIIT' },
    { value: 'movilidad', label: 'Movilidad' },
    { value: 'flexibilidad', label: 'Flexibilidad' },
    { value: 'equilibrio', label: 'Equilibrio' },
    { value: 'funcional', label: 'Funcional' }
]

export const allowedExerciseTypes = exerciseTypeOptions.map(option => option.value)

export const intensityLevels = ['Bajo', 'Medio', 'Alto']

export const bodyPartsOptions = [
    'Pecho',
    'Espalda',
    'Hombros',
    'Brazos',
    'Antebrazos',
    'Core',
    'Glúteos',
    'Piernas',
    'Cuádriceps',
    'Isquiotibiales',
    'Pantorrillas',
    'Caderas',
    'Cuerpo Completo'
]

export const equipmentOptions = [
    'Barra', 'Mancuernas', 'Banco', 'Rack', 'Bandas', 'Kettlebell',
    'Máquinas', 'Mat de yoga', 'Chaleco', 'Escalera de agilidad',
    'Pelota', 'Campo', 'Pelota de fútbol', 'Cancha de fútbol'
]

export const mealTypes = ['Desayuno', 'Almuerzo', 'Cena', 'Snack', 'Colación']
export const nutritionCategories = ['Proteína', 'Carbohidrato', 'Grasa', 'Fibra', 'Vitaminas', 'Minerales']

export const bodyPartSynonyms: Record<string, string[]> = {
    Pecho: ['pecho', 'pechos', 'chest', 'pectorales', 'pectoral'],
    Espalda: ['espalda', 'espaldas', 'back', 'dorsal', 'dorsales', 'lats'],
    Hombros: ['hombro', 'hombros', 'shoulder', 'shoulders', 'deltoides', 'deltoids'],
    Brazos: ['brazo', 'brazos', 'arms', 'arm', 'bíceps', 'biceps', 'tríceps', 'triceps', 'upper arm'],
    Antebrazos: ['antebrazo', 'antebrazos', 'forearm', 'forearms'],
    Core: ['core', 'abdomen', 'abdominales', 'abs', 'tronco', 'midsection'],
    Glúteos: ['gluteos', 'gluteo', 'glute', 'glutes', 'gluteus', 'trasero'],
    Piernas: ['piernas', 'pierna', 'legs', 'leg', 'tren inferior', 'lower body'],
    Cuádriceps: ['cuadricep', 'cuadriceps', 'quads', 'quad', 'recto femoral'],
    Isquiotibiales: ['isquiotibial', 'isquiotibiales', 'hamstring', 'hamstrings'],
    Pantorrillas: ['pantorrilla', 'pantorrillas', 'gemelos', 'calf', 'calves', 'gastrocnemio', 'soleo', 'soleus', 'gastrocnemius'],
    Caderas: ['cadera', 'caderas', 'hip', 'hips'],
    'Cuerpo Completo': ['cuerpo completo', 'full body', 'total body', 'todo el cuerpo']
}

export const NONE_VALUES = new Set([
    'ninguno', 'ninguna', 'ningun', 'ninguno/a', 'ninguna/o', 'ningun@', 'ningunx',
    'none', 'sin', 'sin equipo', 'sin equipamiento', 'n/a', 'na', 'no aplica', 'ning'
])
