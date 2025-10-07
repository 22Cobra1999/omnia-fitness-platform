// =====================================================
// SISTEMA ESTANDARIZADO DE MÚSCULOS Y DOLOR
// =====================================================
// Sistema para reportar lesiones por músculo específico e intensidad

export interface MuscleGroup {
  id: string
  name: string
  muscles: Muscle[]
  icon: string
}

export interface Muscle {
  id: string
  name: string
  groupId: string
  commonInjuries: string[]
}

export interface PainLevel {
  level: number
  name: string
  description: string
  color: string
}

// =====================================================
// GRUPOS MUSCULARES Y MÚSCULOS ESPECÍFICOS
// =====================================================

export const MUSCLE_GROUPS: MuscleGroup[] = [
  {
    id: 'upper-body',
    name: 'Tren Superior',
    icon: '🏋️',
    muscles: [
      { id: 'chest', name: 'Pecho', groupId: 'upper-body', commonInjuries: ['Desgarro', 'Tendinitis', 'Contractura'] },
      { id: 'shoulders', name: 'Hombros', groupId: 'upper-body', commonInjuries: ['Tendinitis', 'Bursitis', 'Contractura'] },
      { id: 'arms', name: 'Brazos', groupId: 'upper-body', commonInjuries: ['Tendinitis', 'Desgarro', 'Contractura'] },
      { id: 'back', name: 'Espalda', groupId: 'upper-body', commonInjuries: ['Contractura', 'Tendinitis', 'Desgarro'] }
    ]
  },
  {
    id: 'core',
    name: 'Core',
    icon: '💪',
    muscles: [
      { id: 'abs', name: 'Abdominales', groupId: 'core', commonInjuries: ['Contractura', 'Desgarro', 'Hernia'] },
      { id: 'lower-back', name: 'Espalda baja', groupId: 'core', commonInjuries: ['Contractura', 'Tendinitis', 'Punto gatillo'] }
    ]
  },
  {
    id: 'lower-body',
    name: 'Tren Inferior',
    icon: '🦵',
    muscles: [
      { id: 'thighs', name: 'Muslos', groupId: 'lower-body', commonInjuries: ['Tendinitis', 'Desgarro', 'Contractura'] },
      { id: 'glutes', name: 'Glúteos', groupId: 'lower-body', commonInjuries: ['Contractura', 'Tendinitis', 'Punto gatillo'] },
      { id: 'calves', name: 'Pantorrillas', groupId: 'lower-body', commonInjuries: ['Tendinitis', 'Contractura', 'Desgarro'] }
    ]
  },
  {
    id: 'joints',
    name: 'Articulaciones',
    icon: '🦴',
    muscles: [
      { id: 'shoulder', name: 'Hombro', groupId: 'joints', commonInjuries: ['Bursitis', 'Tendinitis', 'Capsulitis'] },
      { id: 'elbow', name: 'Codo', groupId: 'joints', commonInjuries: ['Epicondilitis', 'Bursitis', 'Tendinitis'] },
      { id: 'wrist', name: 'Muñeca', groupId: 'joints', commonInjuries: ['Tendinitis', 'Síndrome del túnel', 'Bursitis'] },
      { id: 'hip', name: 'Cadera', groupId: 'joints', commonInjuries: ['Bursitis', 'Tendinitis', 'Artritis'] },
      { id: 'knee', name: 'Rodilla', groupId: 'joints', commonInjuries: ['Tendinitis', 'Bursitis', 'Artritis'] },
      { id: 'ankle', name: 'Tobillo', groupId: 'joints', commonInjuries: ['Tendinitis', 'Esguince', 'Bursitis'] }
    ]
  }
]

// =====================================================
// NIVELES DE INTENSIDAD DEL DOLOR (SIMPLIFICADO)
// =====================================================

export const PAIN_LEVELS: PainLevel[] = [
  { level: 1, name: 'Leve', description: 'Molestia leve, no interfiere con actividades', color: 'text-green-400' },
  { level: 2, name: 'Moderado', description: 'Dolor moderado, interfiere con algunas actividades', color: 'text-yellow-400' },
  { level: 3, name: 'Fuerte', description: 'Dolor fuerte, limita actividades diarias', color: 'text-red-400' }
]

// =====================================================
// FUNCIONES UTILITARIAS
// =====================================================

export function getMuscleById(muscleId: string): Muscle | undefined {
  for (const group of MUSCLE_GROUPS) {
    const muscle = group.muscles.find(m => m.id === muscleId)
    if (muscle) return muscle
  }
  return undefined
}

export function getMuscleGroupById(groupId: string): MuscleGroup | undefined {
  return MUSCLE_GROUPS.find(group => group.id === groupId)
}

export function getPainLevel(level: number): PainLevel | undefined {
  return PAIN_LEVELS.find(pain => pain.level === level)
}

export function getAllMuscles(): Muscle[] {
  return MUSCLE_GROUPS.flatMap(group => group.muscles)
}

export function getMusclesByGroup(groupId: string): Muscle[] {
  const group = getMuscleGroupById(groupId)
  return group ? group.muscles : []
}

// =====================================================
// INTERFAZ PARA LESIONES ESTANDARIZADAS
// =====================================================

export interface StandardizedInjury {
  id: string
  muscleId: string
  muscleName: string
  muscleGroup: string
  painLevel: number
  painDescription: string
  injuryType: string
  description?: string
  restrictions?: string
  createdAt: string
  updatedAt: string
}

export function createStandardizedInjury(
  muscleId: string,
  painLevel: number,
  injuryType: string,
  description?: string,
  restrictions?: string
): Omit<StandardizedInjury, 'id' | 'createdAt' | 'updatedAt'> {
  const muscle = getMuscleById(muscleId)
  const group = muscle ? getMuscleGroupById(muscle.groupId) : undefined
  const pain = getPainLevel(painLevel)
  
  return {
    muscleId,
    muscleName: muscle?.name || 'Músculo desconocido',
    muscleGroup: group?.name || 'Grupo desconocido',
    painLevel,
    painDescription: pain?.description || 'Nivel de dolor desconocido',
    injuryType,
    description,
    restrictions
  }
}
