"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2, Copy, GripVertical, ChevronUp, ChevronDown, RotateCcw, Search } from 'lucide-react'

interface Exercise {
  id: string
  name: string
  description?: string
  duration?: number | null
  duracion_min?: number | null
  type?: string
  tipo?: string
  intensity?: string
  equipment?: string
  bodyParts?: string
  calories?: number | null
  calorias?: number | null
  peso?: string
  reps?: string
  series?: string
  detalle_series?: string
  block?: number
  bloque?: number
  orden?: number
  // Campos específicos para nutrición
  proteinas?: number
  carbohidratos?: number
  grasas?: number
  // Campos para estado activo
  is_active?: boolean
  activo?: boolean
  // Campos adicionales para compatibilidad
  nombre_ejercicio?: string
}

type DayScheduleEntry =
  | Exercise[]
  | {
    ejercicios?: Exercise[]
    exercises?: Exercise[]
    blockNames?: { [key: number]: string }
    blockCount?: number
  }

type DaySchedulePayload = {
  exercises: Exercise[]
  ejercicios: Exercise[]
  blockNames: { [key: number]: string }
  blockCount: number
}

interface WeeklySchedule {
  [weekNumber: number]: {
    [dayNumber: number]: DayScheduleEntry
  }
}

interface WeeklyExercisePlannerProps {
  exercises: any[]
  onScheduleChange?: (schedule: WeeklySchedule) => void
  onPeriodsChange?: (periods: number) => void
  onStatsChange?: (stats: any) => void
  initialSchedule?: WeeklySchedule
  initialPeriods?: number
  activityId?: number
  isEditing?: boolean
  productCategory?: string
  planLimits?: {
    activitiesLimit?: number
    weeksLimit?: number
  } | null
  onUndoAvailable?: (canUndo: boolean) => void
  onUndo?: () => void
}

const DAYS = [
  { key: 1, label: 'L', fullLabel: 'Lunes' },
  { key: 2, label: 'M', fullLabel: 'Martes' },
  { key: 3, label: 'M', fullLabel: 'Miércoles' },
  { key: 4, label: 'J', fullLabel: 'Jueves' },
  { key: 5, label: 'V', fullLabel: 'Viernes' },
  { key: 6, label: 'S', fullLabel: 'Sábado' },
  { key: 7, label: 'D', fullLabel: 'Domingo' }
]

const TYPE_COLOR_SCHEMES: Record<string, { hex: string; soft: string; strong: string }> = {
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

const allowedExerciseTypes = ['fuerza', 'cardio', 'hiit', 'movilidad', 'flexibilidad', 'equilibrio', 'funcional', 'general']
const allowedNutritionTypes = ['desayuno', 'almuerzo', 'cena', 'snack', 'merienda', 'colación', 'pre-entreno', 'post-entreno', 'otro']

const normalizeExerciseType = (rawType: string): string => {
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

const normalizeNutritionType = (rawType: string): string => {
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

  // Verificar coincidencia exacta
  if (allowedNutritionTypes.includes(base)) return base

  // Coincidencias parciales
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

const formatSeriesDisplay = (exercise: Exercise) => {
  if (!exercise) return null
  if (typeof exercise.series === 'string' && exercise.series.includes('-')) {
    return exercise.series
  }
  const parts = [exercise.peso, exercise.reps, exercise.series].filter(Boolean)
  return parts.length > 0 ? parts.join('-') : null
}

const getTypeColorScheme = (type: string | undefined | null, isNutrition: boolean = false) => {
  if (!type) {
    return isNutrition ? TYPE_COLOR_SCHEMES.otro : TYPE_COLOR_SCHEMES.general
  }

  // Si es nutrición, usar normalización de tipos de platos
  if (isNutrition || type.toLowerCase() === 'nutrición' || type.toLowerCase() === 'nutricion') {
    const normalized = normalizeNutritionType(type)
    return TYPE_COLOR_SCHEMES[normalized] ?? TYPE_COLOR_SCHEMES.otro
  }

  // Si es ejercicio, usar normalización de tipos de ejercicios
  const normalized = normalizeExerciseType(type)
  return TYPE_COLOR_SCHEMES[normalized] ?? TYPE_COLOR_SCHEMES.general
}

// Helper function para verificar si un ejercicio es genérico
const isGenericExercise = (ex: any): boolean => {
  if (!ex) return true

  // ✅ Si tiene un ID válido (número o string que no sea "deleted-"), NO es genérico
  // El nombre se puede obtener después desde availableExercises usando el ID
  const hasValidId = ex.id !== undefined &&
    ex.id !== null &&
    ex.id !== '' &&
    !String(ex.id).startsWith('deleted-') &&
    ex.id !== `deleted-${ex._originalIndex || ''}`

  // Si tiene ID válido, no es genérico (aunque no tenga nombre todavía)
  if (hasValidId) {
    return false
  }

  // Si no tiene ID válido, verificar por nombre
  const name = ex.name || ex.nombre_ejercicio || ex['Nombre de la Actividad'] || ex.Nombre || ''
  const isGenericName = !name ||
    name.trim() === '' ||
    /^Ejercicio\s+\d+$/i.test(name.trim()) ||
    /^Plato\s+\d+$/i.test(name.trim()) ||
    name.trim().startsWith('Ejercicio ') ||
    name.trim().startsWith('Plato ')

  return isGenericName
}

// Helper functions para manejar ambos tipos de datos
const getExercisesFromDay = (dayData: DayScheduleEntry): Exercise[] => {
  if (!dayData) return []

  let exercises: Exercise[] = []
  if (Array.isArray(dayData)) {
    exercises = dayData
  } else if (Array.isArray(dayData.ejercicios)) {
    exercises = dayData.ejercicios
  } else if (Array.isArray(dayData.exercises)) {
    exercises = dayData.exercises
  }

  // ✅ Filtrar ejercicios genéricos antes de retornar
  return exercises.filter(ex => !isGenericExercise(ex))
}

const getBlockNamesFromDay = (dayData: DayScheduleEntry): { [key: number]: string } => {
  if (!dayData || Array.isArray(dayData)) return {}
  return dayData.blockNames || {}
}

export function WeeklyExercisePlanner({ exercises, onScheduleChange, onPeriodsChange, onStatsChange, initialSchedule, initialPeriods, activityId, isEditing, productCategory, planLimits, onUndoAvailable, onUndo }: WeeklyExercisePlannerProps) {
  // Inicializando planificador semanal

  console.log(`🚀 [WeeklyExercisePlanner] Componente montado/renderizado:`, {
    exercisesCount: exercises?.length || 0,
    exercisesType: typeof exercises,
    esArray: Array.isArray(exercises),
    initialScheduleKeys: initialSchedule ? Object.keys(initialSchedule).length : 0,
    initialPeriods,
    activityId,
    isEditing,
    productCategory,
    env: typeof window !== 'undefined' ? window.location.hostname : 'server',
    primerosExercises: Array.isArray(exercises) && exercises.length > 0 ? exercises.slice(0, 2).map((ex: any) => ({
      id: ex.id,
      name: ex.name,
      type: ex.type,
      tieneId: !!ex.id
    })) : null,
    estructuraSchedule: initialSchedule ? Object.keys(initialSchedule).slice(0, 3).map(key => {
      const weekNum = Number(key)
      const weekData = Number.isFinite(weekNum) ? (initialSchedule[weekNum] || {}) : {}
      return {
        semana: key,
        dias: Object.keys(weekData),
        totalDias: Object.keys(weekData).length
      }
    }) : []
  })

  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>(initialSchedule || {})
  // ✅ Inicializar numberOfWeeks basado en el schedule real, no en un valor por defecto
  // Si el schedule está vacío, numberOfWeeks debe ser 0 para permitir agregar la primera semana
  const [numberOfWeeks, setNumberOfWeeks] = useState(() => {
    const schedule = initialSchedule || {}
    const weekCount = Object.keys(schedule).filter(key => {
      const weekNum = Number(key)
      return !isNaN(weekNum) && weekNum > 0
    }).length
    return weekCount > 0 ? weekCount : 0
  })
  const [replicationCount, setReplicationCount] = useState(1)
  const [similarDays, setSimilarDays] = useState<{ [key: string]: string[] }>({}) // Rastrea días con la misma selección
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set())
  const [weekLimitError, setWeekLimitError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>('') // Término de búsqueda para filtrar platos/ejercicios
  const [isExerciseSelectorOpen, setIsExerciseSelectorOpen] = useState(false)

  // Huella de los ejercicios disponibles (IDs) para detectar eliminaciones en Paso 4
  const availableExerciseIdsFingerprint = React.useMemo(() => {
    if (!exercises || !Array.isArray(exercises)) return ''
    try {
      const ids = exercises
        .map(ex => (ex && (ex as any).id !== undefined && (ex as any).id !== null ? String((ex as any).id) : ''))
        .filter(Boolean)
        .sort()
      return ids.join(',')
    } catch {
      return ''
    }
  }, [exercises])

  // Ref para rastrear el fingerprint anterior y evitar limpiezas innecesarias
  // Inicializar con un valor especial para detectar el primer cambio
  const previousFingerprintRef = useRef<string | null>(null)
  // Ref para mantener una referencia al schedule actual sin causar loops
  const scheduleRef = useRef<WeeklySchedule>(weeklySchedule)
  // ✅ Si el endpoint /api/activity-exercises falla con errores de cliente (400/403/404),
  // deshabilitar más intentos (incluye polling) para evitar spam de consola.
  const disableActiveStatusFetchRef = useRef(false)
  const hasLoggedActiveStatusClientErrorRef = useRef(false)
  // ✅ Ref para rastrear semanas que fueron agregadas por el usuario (no deben eliminarse aunque estén vacías)
  const userAddedWeeksRef = useRef<Set<number>>(new Set())

  // ✅ Ref para rastrear si ya hay datos locales (evitar cargar desde backend si hay cambios sin guardar)
  // Inicializar con true si initialSchedule tiene datos al montar
  const hasLocalChangesRef = useRef<boolean>(initialSchedule && Object.keys(initialSchedule || {}).length > 0)

  // Actualizar el ref cuando cambia el schedule
  useEffect(() => {
    scheduleRef.current = weeklySchedule
  }, [weeklySchedule])

  // ✅ Actualizar el schedule interno cuando initialSchedule cambia (para sincronizar con datos cargados desde backend)
  useEffect(() => {
    // Solo actualizar si initialSchedule cambió y no hay cambios locales del usuario
    const hasLocalChanges = hasLocalChangesRef.current
    const currentSchedule = scheduleRef.current // Usar ref para obtener valor actualizado sin agregar dependencias
    const currentScheduleString = JSON.stringify(currentSchedule)
    const initialScheduleString = JSON.stringify(initialSchedule || {})

    console.log('🔍 [WeeklyExercisePlanner] Verificando cambios en initialSchedule', {
      hasLocalChanges,
      currentScheduleKeys: Object.keys(currentSchedule).length,
      initialScheduleKeys: Object.keys(initialSchedule || {}).length,
      sonDiferentes: currentScheduleString !== initialScheduleString
    })

    if (!hasLocalChanges) {
      // Solo actualizar si son diferentes para evitar loops
      if (currentScheduleString !== initialScheduleString) {
        const newSchedule = initialSchedule || {}
        const newScheduleKeys = Object.keys(newSchedule).filter(key => {
          const weekNum = Number(key)
          return !isNaN(weekNum) && weekNum > 0
        })

        console.log('✅ [WeeklyExercisePlanner] initialSchedule cambió, actualizando estado interno', {
          semanasAnteriores: Object.keys(currentSchedule).length,
          semanasNuevas: newScheduleKeys.length,
          tieneContenido: newScheduleKeys.length > 0,
          estructuraSemanas: newScheduleKeys.map(week => {
            const weekNum = Number(week)
            const weekData = Number.isFinite(weekNum) ? (newSchedule[weekNum] || {}) : {}
            return {
              semana: week,
              dias: Object.keys(weekData),
              totalDias: Object.keys(weekData).length
            }
          })
        })

        setWeeklySchedule(newSchedule)
        scheduleRef.current = newSchedule
        setNumberOfWeeks(newScheduleKeys.length > 0 ? newScheduleKeys.length : 0)

        // Marcar que ahora tenemos datos locales (vienen del parent component, pero son datos locales para este componente)
        if (newScheduleKeys.length > 0) {
          hasLocalChangesRef.current = true
        }
      }
    } else {
      console.log('⏭️ [WeeklyExercisePlanner] Hay cambios locales del usuario, NO actualizando desde initialSchedule')
    }
  }, [initialSchedule])

  // Marcar que hay datos locales cuando initialSchedule tiene contenido
  useEffect(() => {
    if (initialSchedule && Object.keys(initialSchedule).length > 0) {
      hasLocalChangesRef.current = true
      console.log('✅ [WeeklyExercisePlanner] Datos locales detectados, evitando carga desde backend', {
        semanas: Object.keys(initialSchedule).length
      })
    } else {
      hasLocalChangesRef.current = false
    }
  }, [initialSchedule])

  // Cuando cambian los ejercicios disponibles (por ejemplo, al eliminar en Paso 4),
  // limpiar del calendario semanal cualquier referencia a ejercicios que ya no existen.
  useEffect(() => {
    console.log('🔍 [LIMPIEZA] Verificando cambios en ejercicios disponibles:', {
      fingerprintActual: availableExerciseIdsFingerprint,
      fingerprintAnterior: previousFingerprintRef.current,
      haCambiado: availableExerciseIdsFingerprint !== previousFingerprintRef.current,
      scheduleKeys: Object.keys(scheduleRef.current || {}),
      scheduleTieneDatos: Object.keys(scheduleRef.current || {}).length > 0,
      esPrimeraVez: previousFingerprintRef.current === null
    })

    // ✅ Solo ejecutar si el fingerprint realmente cambió (o es la primera vez)
    if (previousFingerprintRef.current !== null && availableExerciseIdsFingerprint === previousFingerprintRef.current) {
      console.log('⏭️ [LIMPIEZA] Fingerprint no cambió, saltando limpieza')
      return
    }

    // ✅ Actualizar el ref
    const oldFingerprint = previousFingerprintRef.current
    previousFingerprintRef.current = availableExerciseIdsFingerprint

    const currentSchedule = scheduleRef.current

    // ✅ Si no hay ejercicios disponibles (fingerprint vacío), NO limpiar si hay datos o cambios del usuario
    if (!availableExerciseIdsFingerprint || availableExerciseIdsFingerprint.trim() === '') {
      if (currentSchedule && Object.keys(currentSchedule).length > 0) {
        // ✅ NO limpiar si hay cambios locales del usuario o datos existentes
        if (hasLocalChangesRef.current || (initialSchedule && Object.keys(initialSchedule).length > 0)) {
          console.log('✅ [LIMPIEZA] No hay ejercicios disponibles PERO hay cambios del usuario o datos existentes, NO limpiando schedule', {
            hasLocalChanges: hasLocalChangesRef.current,
            hasInitialSchedule: !!(initialSchedule && Object.keys(initialSchedule).length > 0),
            scheduleKeys: Object.keys(currentSchedule).length
          })
          return
        }

        // ✅ Solo limpiar si realmente no hay datos y no estamos editando (producto nuevo)
        console.log('🧹 [LIMPIEZA] No hay ejercicios disponibles y no hay cambios del usuario, limpiando todo el schedule')
        setWeeklySchedule({})
        scheduleRef.current = {}
        setNumberOfWeeks(0) // ✅ Cambiar a 0 para permitir agregar la primera semana
        if (onScheduleChange) {
          setTimeout(() => onScheduleChange({}), 0)
        }
        return
      }
      return
    }

    if (!currentSchedule || Object.keys(currentSchedule).length === 0) {
      console.log('⏭️ [LIMPIEZA] No hay schedule, saltando limpieza')
      return
    }

    console.log('🧹 [LIMPIEZA] Iniciando limpieza de ejercicios eliminados:', {
      fingerprintAnterior: oldFingerprint,
      fingerprintNuevo: availableExerciseIdsFingerprint,
      semanasEnSchedule: Object.keys(currentSchedule).length
    })

    // ✅ Crear Set con IDs como strings Y como números para manejar ambos formatos
    const availableIds = new Set<string>()
    const availableIdsNum = new Set<number>()
    const availableIdStrings = availableExerciseIdsFingerprint.split(',').filter(Boolean)

    availableIdStrings.forEach(idStr => {
      availableIds.add(idStr)
      const idNum = Number(idStr)
      if (!isNaN(idNum)) {
        availableIdsNum.add(idNum)
      }
    })

    // ✅ Verificar si todos los IDs disponibles son temporales (nuevos, no guardados)
    // IDs temporales son strings que no son números puros (ej: "nutrition-0", "fitness-1")
    const allAvailableIdsAreTemporary = availableIdStrings.length > 0 &&
      availableIdStrings.every(id => {
        // Si el ID contiene un guión o no es un número puro, es temporal
        return id.includes('-') || isNaN(Number(id))
      })

    // ✅ Verificar si el schedule tiene IDs numéricos (de BD)
    // Recorrer el schedule para ver qué tipos de IDs tiene
    let scheduleHasNumericIds = false
    let scheduleHasAnyExercises = false

    Object.values(currentSchedule).forEach((days: any) => {
      Object.values(days || {}).forEach((entry: any) => {
        const rawExercises = Array.isArray(entry) ? entry : (entry?.ejercicios || entry?.exercises || [])
        if (rawExercises.length > 0) {
          scheduleHasAnyExercises = true
          rawExercises.forEach((ex: any) => {
            if (ex && ex.id !== undefined && ex.id !== null) {
              const exId = ex.id
              // Si el ID es un número o es un string que representa un número, es de BD
              if (typeof exId === 'number' || (!isNaN(Number(exId)) && !String(exId).includes('-'))) {
                scheduleHasNumericIds = true
              }
            }
          })
        }
      })
    })

    // ✅ Si todos los IDs disponibles son temporales Y el schedule tiene IDs numéricos,
    // significa que se eliminaron todos los ejercicios viejos y se agregaron completamente nuevos
    // PERO NO limpiar si el usuario ya hizo cambios o hay datos existentes
    if (allAvailableIdsAreTemporary && scheduleHasNumericIds && scheduleHasAnyExercises) {
      // ✅ NO limpiar si hay cambios locales del usuario o datos existentes
      if (hasLocalChangesRef.current || (initialSchedule && Object.keys(initialSchedule).length > 0)) {
        console.log('✅ [LIMPIEZA] Todos los IDs son temporales PERO hay cambios del usuario o datos existentes, NO limpiando schedule', {
          hasLocalChanges: hasLocalChangesRef.current,
          hasInitialSchedule: !!(initialSchedule && Object.keys(initialSchedule).length > 0)
        })
        return
      }

      console.log('🧹 [LIMPIEZA] Todos los ejercicios disponibles son nuevos (IDs temporales) y el schedule tiene IDs antiguos de BD - Limpiando todo el schedule')
      setWeeklySchedule({})
      scheduleRef.current = {}
      setNumberOfWeeks(0)
      if (onScheduleChange) {
        setTimeout(() => onScheduleChange({}), 0)
      }
      return
    }

    let changed = false
    const newSchedule: WeeklySchedule = {}

    Object.entries(currentSchedule).forEach(([weekKey, days]) => {
      const weekNumber = parseInt(weekKey)
      const cleanedDays: { [key: string]: DayScheduleEntry } = {}
      let weekHasValidExercises = false

      Object.entries(days as { [key: string]: DayScheduleEntry }).forEach(([dayKey, entry]) => {
        // ✅ Obtener ejercicios sin filtrar genéricos primero (para verificar IDs)
        let rawExercises: Exercise[] = []
        if (Array.isArray(entry)) {
          rawExercises = entry
        } else if (entry && typeof entry === 'object') {
          rawExercises = (entry as any).ejercicios || (entry as any).exercises || []
        }

        // ✅ Verificar si el día tenía ejercicios antes de la limpieza
        const dayHadExercises = rawExercises.length > 0

        // ✅ Filtrar ejercicios que ya no están disponibles (eliminados en Paso 4)
        const filteredExercises = rawExercises.filter(ex => {
          if (!ex || (ex as any).id === undefined || (ex as any).id === null) return false

          const exId = (ex as any).id
          const idStr = String(exId)
          const idNum = typeof exId === 'number' ? exId : Number(exId)

          // ✅ Verificar si el ID está en los ejercicios disponibles (como string O como número)
          const isAvailable = availableIds.has(idStr) ||
            (!isNaN(idNum) && availableIdsNum.has(idNum)) ||
            availableIds.has(String(idNum))

          if (!isAvailable) {
            console.log(`🗑️ Eliminando ejercicio ${idStr} (${typeof exId}) del día ${dayKey} de la semana ${weekKey} (ya no está disponible)`, {
              idStr,
              idNum,
              enAvailableIds: availableIds.has(idStr),
              enAvailableIdsNum: !isNaN(idNum) && availableIdsNum.has(idNum),
              availableIdsSample: Array.from(availableIds).slice(0, 5),
              availableIdsNumSample: Array.from(availableIdsNum).slice(0, 5)
            })
          }
          return isAvailable
        })

        if (filteredExercises.length !== rawExercises.length) {
          changed = true
        }

        // ✅ Si quedan ejercicios válidos, mantener el día
        if (filteredExercises.length > 0) {
          weekHasValidExercises = true
          let newEntry: DayScheduleEntry = entry

          if (Array.isArray(entry)) {
            newEntry = filteredExercises
          } else if (entry && typeof entry === 'object') {
            // Mantener el resto de metadatos del día (blockNames, blockCount, etc.)
            newEntry = {
              ...(entry as any),
              ejercicios: filteredExercises,
              exercises: filteredExercises,
              blockCount: filteredExercises.length > 0 ? ((entry as any).blockCount || 1) : 0
            }
          }

          cleanedDays[dayKey] = newEntry
        } else if (dayHadExercises) {
          // ✅ Día tenía ejercicios pero ahora está vacío (fueron eliminados): no incluirlo
          console.log(`🧹 Día ${dayKey} de semana ${weekKey} quedó vacío después de eliminar ejercicios`)
          changed = true
        } else {
          // ✅ Día estaba vacío desde el principio (semana nueva): mantenerlo vacío
          cleanedDays[dayKey] = entry
        }
      })

      // ✅ SIEMPRE incluir la semana - permitir semanas vacías
      // El usuario puede tener semanas vacías si lo desea
      const weekHasDays = Object.keys(cleanedDays).length > 0
      const originalWeekHadDays = Object.keys(days as any).length > 0

      // ✅ Mantener siempre la semana, incluso si está vacía
      if (weekHasDays || originalWeekHadDays) {
        newSchedule[weekNumber] = cleanedDays
      } else {
        // Si la semana no tenía días antes, mantenerla vacía
        newSchedule[weekNumber] = cleanedDays
      }
    })

    // ✅ NO eliminar semanas vacías - el usuario puede tener semanas vacías si lo desea

    if (changed) {
      console.log('🧹 WeeklyExercisePlanner: limpiando ejercicios eliminados del Paso 4 del calendario semanal', {
        semanasAntes: Object.keys(currentSchedule).length,
        semanasDespues: Object.keys(newSchedule).length,
        ejerciciosEliminados: Object.keys(currentSchedule).reduce((total, weekKey) => {
          const days = currentSchedule[parseInt(weekKey)] as any
          return total + Object.values(days || {}).reduce((dayTotal: number, entry: any) => {
            const rawExercises = Array.isArray(entry) ? entry : (entry?.ejercicios || entry?.exercises || [])
            const filtered = rawExercises.filter((ex: any) => {
              if (!ex || (ex as any).id === undefined || (ex as any).id === null) return false
              const idStr = String((ex as any).id)
              const idNum = typeof (ex as any).id === 'number' ? (ex as any).id : Number((ex as any).id)
              return availableIds.has(idStr) || (!isNaN(idNum) && availableIdsNum.has(idNum)) || availableIds.has(String(idNum))
            })
            return dayTotal + (rawExercises.length - filtered.length)
          }, 0)
        }, 0),
        schedule: newSchedule
      })
      setWeeklySchedule(newSchedule)
      // ✅ Actualizar el ref también
      scheduleRef.current = newSchedule
      if (onScheduleChange) {
        setTimeout(() => onScheduleChange(newSchedule), 0)
      }
    } else {
      console.log('✅ [LIMPIEZA] No se encontraron ejercicios eliminados para limpiar')
    }
  }, [availableExerciseIdsFingerprint, onScheduleChange]) // ✅ Usar ref para acceder a weeklySchedule sin causar loops

  // Historial para undo
  const [scheduleHistory, setScheduleHistory] = useState<WeeklySchedule[]>([])
  const [canUndo, setCanUndo] = useState(false)

  // Función para guardar estado antes de cambios
  const saveToHistory = (schedule: WeeklySchedule) => {
    setScheduleHistory(prev => [...prev.slice(-9), JSON.parse(JSON.stringify(schedule))]) // Mantener últimos 10 estados
    setCanUndo(true)
  }

  // Ref para almacenar la función callback y evitar loops infinitos
  const onUndoAvailableRef = useRef(onUndoAvailable)

  // Actualizar el ref cuando la función cambia (sin causar re-renders)
  useEffect(() => {
    onUndoAvailableRef.current = onUndoAvailable
  }, [onUndoAvailable])

  // Función para deshacer último cambio (como Ctrl+Z)
  const handleUndo = React.useCallback(() => {
    setScheduleHistory(prev => {
      if (prev.length === 0) {
        setCanUndo(false)
        if (onUndoAvailableRef.current) {
          onUndoAvailableRef.current(false)
        }
        return prev
      }

      // El último elemento del historial es el estado anterior al actual
      // El estado actual está en weeklySchedule, así que deshacer significa volver al último del historial
      const previousSchedule = prev[prev.length - 1]
      const newHistory = prev.slice(0, -1)

      // Actualizar el schedule al estado anterior
      const restoredSchedule = JSON.parse(JSON.stringify(previousSchedule))
      setWeeklySchedule(restoredSchedule)
      scheduleRef.current = restoredSchedule

      // Recalcular numberOfWeeks basado en el schedule restaurado
      const restoredWeekNumbers = Object.keys(restoredSchedule).map(Number).filter(n => !isNaN(n) && n > 0)
      if (restoredWeekNumbers.length > 0) {
        setNumberOfWeeks(Math.max(...restoredWeekNumbers))
      } else {
        setNumberOfWeeks(0)
      }

      // Actualizar canUndo basado en si queda historial
      const stillCanUndo = newHistory.length > 0
      setCanUndo(stillCanUndo)

      // Notificar al padre
      if (onScheduleChange) {
        setTimeout(() => onScheduleChange(previousSchedule), 0)
      }
      if (onUndoAvailableRef.current) {
        onUndoAvailableRef.current(stillCanUndo)
      }

      return newHistory
    })
  }, [onScheduleChange])

  // Soporte para Ctrl+Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z o Cmd+Z (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (canUndo) {
          handleUndo()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canUndo, handleUndo])

  // Notificar al padre sobre disponibilidad de undo
  useEffect(() => {
    if (onUndoAvailableRef.current) {
      onUndoAvailableRef.current(canUndo)
    }
  }, [canUndo])

  // Exponer handleUndo para uso externo
  useEffect(() => {
    if (onUndo) {
      // Exponer función de undo al padre a través de window temporalmente
      if (typeof window !== 'undefined') {
        (window as any).weeklyPlannerUndo = handleUndo
      }
    }
  }, [onUndo, handleUndo])

  const weeksLimit = planLimits?.weeksLimit ?? null
  const activitiesLimit = planLimits?.activitiesLimit ?? null

  // Función para generar una huella digital de la selección de ejercicios
  const generateSelectionFingerprint = (exercises: Exercise[]) => {
    if (!exercises || !Array.isArray(exercises)) {
      return ''
    }
    const sortedIds = exercises.map(ex => ex.id).sort().join(',')
    return sortedIds
  }

  // Función para encontrar días con la misma selección
  const findSimilarDays = (currentDayKey: string, currentExercises: Exercise[]) => {
    return findSimilarDaysInSchedule(weeklySchedule, currentDayKey, currentExercises)
  }

  // Función para encontrar días similares en un schedule específico
  const findSimilarDaysInSchedule = (schedule: WeeklySchedule, currentDayKey: string, currentExercises: Exercise[]) => {
    const currentFingerprint = generateSelectionFingerprint(currentExercises)
    const similarDaysList: string[] = []

    console.log('🔍 BUSCANDO DÍAS SIMILARES:', {
      currentDay: currentDayKey,
      currentFingerprint,
      scheduleKeys: Object.keys(schedule)
    })

    Object.keys(schedule).forEach(weekKey => {
      Object.keys(schedule[parseInt(weekKey)]).forEach(dayKey => {
        const dayExercises = schedule[parseInt(weekKey)][parseInt(dayKey)]
        const dayExercisesList = getExercisesFromDay(dayExercises)
        const dayFingerprint = generateSelectionFingerprint(dayExercisesList)

        console.log('🔍 COMPARANDO DÍA:', {
          day: `${weekKey}-${dayKey}`,
          dayFingerprint,
          dayExercises: dayExercisesList.length,
          isSimilar: dayFingerprint === currentFingerprint && `${weekKey}-${dayKey}` !== currentDayKey
        })

        if (dayFingerprint === currentFingerprint && `${weekKey}-${dayKey}` !== currentDayKey) {
          similarDaysList.push(`${weekKey}-${dayKey}`)
          console.log('✅ DÍA SIMILAR ENCONTRADO:', `${weekKey}-${dayKey}`)
        }
      })
    })

    console.log('🎯 RESULTADO FINAL:', similarDaysList)
    return similarDaysList
  }
  const [currentWeek, setCurrentWeek] = useState(1)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [showDayExercises, setShowDayExercises] = useState(false)
  const [periods, setPeriods] = useState(initialPeriods && initialPeriods > 0 ? initialPeriods : 1)

  // Sincronizar periods cuando initialPeriods cambia (desde carga asíncrona)
  useEffect(() => {
    if (initialPeriods && initialPeriods > 0) {
      setPeriods(initialPeriods)
    }
  }, [initialPeriods])
  const [isLoadingPlanning, setIsLoadingPlanning] = useState(false)

  // ✅ Función helper para calcular semanas con ejercicios válidos
  const getWeeksWithExercises = React.useCallback((): Set<number> => {
    const weeksWithExercises = new Set<number>()
    for (let week = 1; week <= numberOfWeeks; week++) {
      let weekHasExercises = false
      for (const day of DAYS) {
        const dayEntry = weeklySchedule[week]?.[day.key]
        const exercises = getExercisesFromDay(dayEntry) // Ya filtra genéricos
        if (exercises.length > 0) {
          weekHasExercises = true
          break
        }
      }
      if (weekHasExercises) {
        weeksWithExercises.add(week)
      }
    }
    return weeksWithExercises
  }, [weeklySchedule, numberOfWeeks])

  // Ref para rastrear si acabamos de agregar una semana nueva
  const justAddedWeekRef = useRef<number | null>(null)

  // ✅ NO ajustar currentWeek automáticamente - permitir que el usuario seleccione semanas vacías
  // El usuario debe poder seleccionar y trabajar con semanas vacías si lo desea
  // Se eliminó el useEffect que ajustaba automáticamente currentWeek cuando una semana estaba vacía

  // Función para obtener ejercicios de un día específico
  const getExercisesForDay = (weekNumber: number, dayNumber: number): Exercise[] => {
    const dayData = weeklySchedule[weekNumber]?.[dayNumber]
    // ✅ Usar getExercisesFromDay que ya filtra ejercicios genéricos
    const result = getExercisesFromDay(dayData)

    // Log para debug cuando se llama desde el modal
    if (selectedDay && parseInt(selectedDay) === dayNumber && currentWeek === weekNumber) {
      console.log('📋 getExercisesForDay llamado desde modal', {
        week: weekNumber,
        day: dayNumber,
        dayDataKeys: dayData && typeof dayData === 'object' ? Object.keys(dayData) : [],
        resultCount: result.length,
        resultSample: result.slice(0, 2).map(ex => ({
          id: ex.id,
          name: ex.name,
          nombre_ejercicio: (ex as any)?.nombre_ejercicio,
          type: ex.type,
          tipo: (ex as any)?.tipo,
          allKeys: Object.keys(ex || {})
        }))
      })
    }

    return result
  }

  // Obtener cantidad de bloques configurados para un día (1 si no hay bloques explícitos)
  const getBlockCountForDay = (weekNumber: number, dayNumber: number): number => {
    const dayData = weeklySchedule[weekNumber]?.[dayNumber]
    if (dayData && typeof dayData === 'object' && 'blockCount' in (dayData as any)) {
      const count = Number((dayData as any).blockCount)
      return Number.isFinite(count) && count > 0 ? count : 1
    }
    return 1
  }

  // Memoizar el cálculo de días similares para evitar re-renders innecesarios
  const similarDaysForCurrentDay = React.useMemo(() => {
    if (!selectedDay) return []
    const currentDayKey = `${currentWeek}-${selectedDay}`
    const currentExercises = getExercisesForDay(currentWeek, parseInt(selectedDay))
    const similarDaysList = findSimilarDays(currentDayKey, currentExercises)
    console.log('🔍 MODAL - Días similares calculados en tiempo real:', {
      currentDay: currentDayKey,
      currentExercises: currentExercises.length,
      similarDays: similarDaysList,
      shouldShowButton: similarDaysList.length > 0
    })
    return similarDaysList
  }, [currentWeek, selectedDay, weeklySchedule])

  // ✅ Refs para evitar notificaciones durante la carga inicial
  const isInitialMount = React.useRef(true)
  const lastScheduleNotified = React.useRef<string>('')
  const lastPeriodsNotified = React.useRef<number>(0)
  const lastStatsNotified = React.useRef<string>('')
  const summaryRef = React.useRef<HTMLDivElement>(null)

  // Sincronizar con initialSchedule cuando cambia desde el padre (datos locales persistentes)
  // Esto preserva los cambios del usuario cuando navega entre pasos
  useEffect(() => {
    // Solo sincronizar si initialSchedule tiene contenido válido
    if (initialSchedule) {
      const hasContent = Object.keys(initialSchedule).length > 0
      if (hasContent) {
        const currentScheduleString = JSON.stringify(weeklySchedule)
        const initialScheduleString = JSON.stringify(initialSchedule)

        // Solo sincronizar si son diferentes (evitar loops)
        if (currentScheduleString !== initialScheduleString) {
          console.log('🔄 WeeklyExercisePlanner: Sincronizando con initialSchedule del padre (datos locales persistentes)', {
            semanas: Object.keys(initialSchedule).length,
            initialSchedule
          })
          const localSchedule = JSON.parse(JSON.stringify(initialSchedule))
          setWeeklySchedule(localSchedule)
          scheduleRef.current = localSchedule
          hasLocalChangesRef.current = true // Marcar que hay datos locales
          const weekCount = Object.keys(initialSchedule).filter(key => {
            const weekNum = Number(key)
            return !isNaN(weekNum) && weekNum > 0
          }).length
          setNumberOfWeeks(weekCount > 0 ? weekCount : 0)
        }
      } else {
        // Si initialSchedule está vacío, resetear el flag
        hasLocalChangesRef.current = false
      }
    }
  }, [JSON.stringify(initialSchedule)])

  // Estado para ejercicios con flags de actividad actualizados
  const [exercisesWithActiveStatus, setExercisesWithActiveStatus] = useState<any[]>(exercises)

  // Sincronizar exercisesWithActiveStatus cuando exercises cambie
  useEffect(() => {
    console.log('🔄 Sincronizando exercisesWithActiveStatus con exercises:', exercises.length, 'ejercicios')
    setExercisesWithActiveStatus(exercises)
  }, [exercises.length]) // Usar length para evitar re-renders innecesarios

  // Cargar estado activo de ejercicios desde planificacion_ejercicios
  useEffect(() => {
    const loadActiveStatusFromPlanning = async () => {
      if (!activityId || activityId <= 0) return
      // Solo consultar endpoint de estado activo en modo edición
      if (!isEditing) return
      if (disableActiveStatusFetchRef.current) return

      // ⛔ Si todos los ejercicios actuales tienen IDs temporales (nutrition-0..N, etc.)
      // no tiene sentido consultar planificacion_ejercicios porque aún no hay IDs reales de BD.
      if (!availableExerciseIdsFingerprint || availableExerciseIdsFingerprint.trim() === '') {
        return
      }
      const idStrings = availableExerciseIdsFingerprint.split(',').filter(Boolean)
      const hasRealNumericIds = idStrings.some(id => !id.includes('-') && !isNaN(Number(id)))
      if (!hasRealNumericIds) {
        console.log('⏭️ [WeeklyExercisePlanner] Solo hay IDs temporales en ejercicios disponibles - no se consulta planificacion_ejercicios para estado activo')
        return
      }

      try {
        console.log('🔄 Consultando estado activo desde planificacion_ejercicios para actividad:', activityId)
        // Consultar planificacion_ejercicios para obtener el estado activo más reciente
        const response = await fetch(`/api/activity-exercises/${activityId}?t=${Date.now()}`)
        if (response.status === 401) {
          console.warn('⚠️ No autenticado al consultar /api/activity-exercises; se omite actualización de estados activos')
          return
        }
        if (response.status === 400 || response.status === 403 || response.status === 404) {
          disableActiveStatusFetchRef.current = true
          if (!hasLoggedActiveStatusClientErrorRef.current) {
            hasLoggedActiveStatusClientErrorRef.current = true
            console.warn('⚠️ /api/activity-exercises no disponible para esta actividad (se deshabilita actualización de activos):', {
              activityId,
              status: response.status
            })
          }
          return
        }
        if (!response.ok) {
          console.warn('⚠️ Error obteniendo ejercicios para estado activo:', response.status)
          return
        }
        const result = await response.json()

        if (result.success && result.data && Array.isArray(result.data)) {
          // Crear un mapa de ejercicios por ID con su estado activo
          const activeStatusMap = new Map<number | string, boolean>()
          result.data.forEach((ex: any) => {
            if (ex.id) {
              // Verificar explícitamente: si is_active === false O activo === false, está INACTIVO
              // Si no está definido o es true, está activo por defecto
              const isInactive = ex.is_active === false || ex.activo === false
              const isActive = !isInactive
              activeStatusMap.set(ex.id, isActive)
              console.log(`🔍 Mapeando ejercicio ${ex.id} (${ex.name || ex['Nombre de la Actividad']}): is_active=${ex.is_active}, activo=${ex.activo}, isInactive=${isInactive}, resultado=${isActive}`)
            }
          })

          console.log('📊 Mapa de estado activo:', Array.from(activeStatusMap.entries()))
          console.log('📊 IDs en mapa de estado activo:', Array.from(activeStatusMap.keys()).map(k => ({ key: k, type: typeof k, value: activeStatusMap.get(k) })))
          console.log('📋 Ejercicios recibidos del endpoint:', result.data.map((ex: any) => ({
            id: ex.id,
            id_type: typeof ex.id,
            name: ex.name || ex['Nombre de la Actividad'],
            is_active: ex.is_active,
            activo: ex.activo,
            tipo_is_active: typeof ex.is_active,
            valor_is_active: ex.is_active
          })))
          console.log('📋 Ejercicios locales a actualizar:', exercises.map((ex: any) => ({
            id: ex.id,
            id_type: typeof ex.id,
            id_string: String(ex.id),
            id_number: typeof ex.id === 'string' ? null : Number(ex.id),
            name: ex.name || ex['Nombre de la Actividad'],
            is_active_actual: (ex as any).is_active,
            activo_actual: (ex as any).activo,
            en_mapa: activeStatusMap.has(ex.id) || (typeof ex.id === 'number' ? activeStatusMap.has(String(ex.id)) : activeStatusMap.has(Number(ex.id)))
          })))

          // Actualizar ejercicios con el estado activo desde la planificación
          const updatedExercises = exercises.map((ex: any) => {
            // Ignorar IDs temporales (que contienen guiones)
            if (typeof ex.id === 'string' && ex.id.includes('-')) {
              console.log(`⚠️ Ejercicio con ID temporal ignorado: ${ex.id}`)
              return ex
            }

            const exerciseId = ex.id
            // Intentar encontrar el ID en el mapa (manejar tanto números como strings)
            let isActive = undefined
            let foundInMap = false

            // Intentar directamente
            if (activeStatusMap.has(exerciseId)) {
              isActive = activeStatusMap.get(exerciseId)
              foundInMap = true
            } else {
              // Intentar con conversión de tipos
              if (typeof exerciseId === 'number') {
                const asString = String(exerciseId)
                if (activeStatusMap.has(asString)) {
                  isActive = activeStatusMap.get(asString)
                  foundInMap = true
                }
              } else if (typeof exerciseId === 'string') {
                const asNumber = Number(exerciseId)
                if (!isNaN(asNumber) && activeStatusMap.has(asNumber)) {
                  isActive = activeStatusMap.get(asNumber)
                  foundInMap = true
                }
              }
            }

            console.log(`🔍 Verificando ejercicio local: id=${exerciseId} (${typeof exerciseId}), nombre=${ex.name || ex['Nombre de la Actividad']}, encontrado=${foundInMap}, isActive=${isActive}`)

            if (foundInMap && isActive !== undefined) {
              const isInactive = !isActive
              console.log(`✅ Actualizando ejercicio ${exerciseId} (${ex.name || ex['Nombre de la Actividad']}): isActive=${isActive}, isInactive=${isInactive}`)
              return {
                ...ex,
                is_active: isActive,
                activo: isActive
              }
            } else if (exerciseId) {
              console.log(`⚠️ Ejercicio ${exerciseId} (${ex.name || ex['Nombre de la Actividad']}) no encontrado en mapa. IDs en mapa:`, Array.from(activeStatusMap.keys()))
            }

            return ex
          })

          setExercisesWithActiveStatus(updatedExercises)
          const inactiveCount = updatedExercises.filter((ex: any) => ex.is_active === false || ex.activo === false).length
          console.log('✅ Estado activo actualizado desde planificacion_ejercicios:', inactiveCount, 'ejercicios inactivos')

          // Log detallado de ejercicios inactivos
          if (inactiveCount > 0) {
            const inactiveExercises = updatedExercises.filter((ex: any) => ex.is_active === false || ex.activo === false)
            console.log('🔴 Ejercicios INACTIVOS encontrados:', inactiveExercises.map((ex: any) => ({
              id: ex.id,
              name: ex.name || ex['Nombre de la Actividad'],
              is_active: ex.is_active,
              activo: ex.activo
            })))
          }
        }
      } catch (error) {
        console.warn('⚠️ Error cargando estado activo desde planificación:', error)
      }
    }

    loadActiveStatusFromPlanning()
  }, [activityId, exercises.length, isEditing, availableExerciseIdsFingerprint]) // Solo recargar cuando cambian estos valores, no en cada render

  // Recargar estado activo cada 3 segundos cuando estamos en modo edición
  // Evitar hacer polling si solo hay IDs temporales (CSV nuevo sin guardar en BD)
  useEffect(() => {
    if (!isEditing || !activityId || activityId <= 0) return
    if (disableActiveStatusFetchRef.current) return

    // Si no hay ningún ID real de BD, no hacemos polling periódico
    if (!availableExerciseIdsFingerprint || availableExerciseIdsFingerprint.trim() === '') {
      return
    }
    const idStrings = availableExerciseIdsFingerprint.split(',').filter(Boolean)
    const hasRealNumericIds = idStrings.some(id => !id.includes('-') && !isNaN(Number(id)))
    if (!hasRealNumericIds) {
      console.log('⏭️ [WeeklyExercisePlanner] Solo IDs temporales - deshabilitado polling periódico de estado activo')
      return
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/activity-exercises/${activityId}?t=${Date.now()}`)
        if (response.status === 401) {
          return
        }
        if (response.status === 400 || response.status === 403 || response.status === 404) {
          disableActiveStatusFetchRef.current = true
          if (!hasLoggedActiveStatusClientErrorRef.current) {
            hasLoggedActiveStatusClientErrorRef.current = true
            console.warn('⚠️ /api/activity-exercises no disponible para esta actividad (se detiene polling):', {
              activityId,
              status: response.status
            })
          }
          clearInterval(interval)
          return
        }
        if (!response.ok) {
          return
        }
        const result = await response.json()

        if (result.success && result.data && Array.isArray(result.data)) {
          const activeStatusMap = new Map<number | string, boolean>()
          result.data.forEach((ex: any) => {
            if (ex.id) {
              activeStatusMap.set(ex.id, ex.is_active !== false)
            }
          })

          setExercisesWithActiveStatus(prev => prev.map((ex: any) => {
            const exerciseId = typeof ex.id === 'string' && ex.id.includes('-') ? null : ex.id
            if (exerciseId && activeStatusMap.has(exerciseId)) {
              return {
                ...ex,
                is_active: activeStatusMap.get(exerciseId),
                activo: activeStatusMap.get(exerciseId)
              }
            }
            return ex
          }))
        }
      } catch (error) {
        console.error('❌ Error recargando estado activo:', error)
      }
    }, 3000) // Recargar cada 3 segundos

    return () => clearInterval(interval)
  }, [isEditing, activityId, availableExerciseIdsFingerprint])

  // Cargar planificación desde backend si estamos editando
  // PERO solo si hay ejercicios disponibles (si no hay ejercicios, el schedule debe estar vacío)
  // Y NO cargar si ya hay datos locales en initialSchedule (cambios sin guardar)
  // Además: si TODOS los ejercicios disponibles son nuevos con IDs temporales (nutrition-0..N, etc.),
  // significa que el coach reemplazó completamente el contenido anterior y debemos tratar
  // al planner como una planificación NUEVA, sin seguir trayendo la planificación vieja del backend.
  useEffect(() => {
    if (isEditing && activityId && activityId > 0) {
      // ✅ PRIORIDAD 1: Si hay datos locales en initialSchedule, NO cargar desde backend (preservar cambios del usuario)
      const hasLocalData = initialSchedule && Object.keys(initialSchedule).length > 0

      if (hasLocalData || hasLocalChangesRef.current) {
        console.log('✅ [WeeklyExercisePlanner] Hay datos locales, NO cargando desde backend para preservar cambios del usuario', {
          semanasLocales: hasLocalData ? Object.keys(initialSchedule).length : 0,
          hasLocalChanges: hasLocalChangesRef.current,
          initialSchedule: hasLocalData ? initialSchedule : null
        })

        // Usar los datos locales en lugar de cargar desde backend (preservar cambios del usuario)
        if (hasLocalData) {
          const currentScheduleString = JSON.stringify(weeklySchedule)
          const initialScheduleString = JSON.stringify(initialSchedule)
          // Solo actualizar si son diferentes para evitar loops
          if (currentScheduleString !== initialScheduleString) {
            const localSchedule = JSON.parse(JSON.stringify(initialSchedule))
            setWeeklySchedule(localSchedule)
            scheduleRef.current = localSchedule
            const weekCount = Object.keys(initialSchedule).filter(key => {
              const weekNum = Number(key)
              return !isNaN(weekNum) && weekNum > 0
            }).length
            setNumberOfWeeks(weekCount > 0 ? weekCount : 0)
          }
        }
        return // ✅ IMPORTANTE: No cargar desde backend si hay datos locales
      }

      // ✅ PRIORIDAD 1.5: Si TODOS los ejercicios disponibles tienen IDs temporales (solo CSV nuevo),
      // NO debemos seguir trayendo la planificación vieja desde el backend.
      // En este caso, el coach reemplazó todos los ejercicios/platos y el planner debe empezar desde cero.
      if (availableExerciseIdsFingerprint && availableExerciseIdsFingerprint.trim() !== '') {
        const availableIdStrings = availableExerciseIdsFingerprint.split(',').filter(Boolean)
        const allAvailableIdsAreTemporary =
          availableIdStrings.length > 0 &&
          availableIdStrings.every(id => {
            // IDs temporales: contienen guiones o no son números puros (ej: "nutrition-0")
            return id.includes('-') || isNaN(Number(id))
          })

        if (allAvailableIdsAreTemporary) {
          console.log('🧹 [WeeklyExercisePlanner] Solo hay ejercicios/platos con IDs temporales - tratando planificación como nueva y NO cargando planificación vieja desde backend', {
            availableExerciseIdsFingerprint,
            availableIdStrings,
            activityId
          })

          // Verificar si el schedule tiene IDs numéricos (viejos del backend) que deben limpiarse
          let scheduleHasNumericIds = false
          Object.values(weeklySchedule).forEach((days: any) => {
            Object.values(days || {}).forEach((entry: any) => {
              const rawExercises = Array.isArray(entry) ? entry : (entry?.ejercicios || entry?.exercises || [])
              rawExercises.forEach((ex: any) => {
                if (ex && ex.id !== undefined && ex.id !== null) {
                  const exId = ex.id
                  // Si el ID es un número o es un string que representa un número, es de BD
                  if (typeof exId === 'number' || (!isNaN(Number(exId)) && !String(exId).includes('-'))) {
                    scheduleHasNumericIds = true
                  }
                }
              })
            })
          })

          // Solo limpiar si el schedule tiene IDs numéricos viejos del backend
          // NO limpiar si el schedule está vacío o tiene semanas vacías que el usuario agregó
          if (scheduleHasNumericIds && Object.keys(weeklySchedule).length > 0) {
            console.log('🧹 [WeeklyExercisePlanner] Limpiando schedule viejo con IDs numéricos del backend')
            setWeeklySchedule({})
            scheduleRef.current = {}
            setNumberOfWeeks(0)
            if (onScheduleChange) {
              setTimeout(() => onScheduleChange({}), 0)
            }
          } else if (Object.keys(weeklySchedule).length === 0 && numberOfWeeks === 0) {
            // Si no hay schedule y no hay semanas, inicializar con semana 1 vacía por defecto
            console.log('📅 [WeeklyExercisePlanner] Inicializando con semana 1 vacía por defecto')
            const defaultSchedule = { 1: {} }
            setWeeklySchedule(defaultSchedule)
            scheduleRef.current = defaultSchedule
            setNumberOfWeeks(1)
            if (onScheduleChange) {
              setTimeout(() => onScheduleChange(defaultSchedule), 0)
            }
          }

          // Marcar que a partir de ahora hay datos locales (aunque sea schedule vacío nuevo)
          // para que futuros renders NO vuelvan a intentar cargar desde backend.
          hasLocalChangesRef.current = true
          return
        }
      }

      // ✅ PRIORIDAD 2: Solo cargar desde backend si NO hay datos locales Y hay ejercicios disponibles
      // Si no hay ejercicios, el schedule debe estar vacío y no tiene sentido cargar desde el backend
      if (availableExerciseIdsFingerprint && availableExerciseIdsFingerprint.trim() !== '') {
        loadPlanningFromBackend()
      } else {
        console.log('⏭️ [WeeklyExercisePlanner] No hay ejercicios disponibles, saltando carga desde backend')
        // ✅ Asegurar que el schedule esté vacío si no hay ejercicios
        if (Object.keys(weeklySchedule).length > 0) {
          setWeeklySchedule({})
          setNumberOfWeeks(0)
          scheduleRef.current = {}
        }
      }
    }
  }, [isEditing, activityId, availableExerciseIdsFingerprint, initialSchedule])

  const loadPlanningFromBackend = async () => {
    if (!activityId) return

    // ✅ NO cargar desde backend si ya hay datos locales (cambios sin guardar del usuario)
    if (hasLocalChangesRef.current || (initialSchedule && Object.keys(initialSchedule).length > 0)) {
      console.log('⏭️ [loadPlanningFromBackend] Hay datos locales, saltando carga desde backend para preservar cambios del usuario')
      return
    }

    setIsLoadingPlanning(true)
    try {

      const response = await fetch(`/api/get-product-planning?actividad_id=${activityId}`)
      const result = await response.json()

      if (result.success && result.data) {
        const { weeklySchedule: backendSchedule, periods: backendPeriods } = result.data

        // ✅ Verificar nuevamente si hay datos locales antes de sobrescribir
        if (hasLocalChangesRef.current || (initialSchedule && Object.keys(initialSchedule).length > 0)) {
          console.log('⏭️ [loadPlanningFromBackend] Datos locales detectados durante la carga, cancelando sobrescritura')
          setIsLoadingPlanning(false)
          return
        }

        console.log('📅 WeeklyExercisePlanner: Datos del backend cargados', {
          semanas: Object.keys(backendSchedule).length,
          periodos: backendPeriods,
          schedule: backendSchedule
        })

        Object.entries(backendSchedule || {}).forEach(([weekKey, days]) => {
          Object.entries(days as { [key: string]: DayScheduleEntry }).forEach(([dayKey, entry]) => {
            const parsedExercises = getExercisesFromDay(entry)
            console.log('🗓️ Día cargado desde backend', {
              week: weekKey,
              day: dayKey,
              rawEntry: entry,
              ejerciciosParseados: parsedExercises.map((ex, idx) => ({
                idx,
                id: ex.id,
                idType: typeof ex.id,
                name: ex.name,
                nombre_ejercicio: (ex as any)?.nombre_ejercicio,
                type: ex.type,
                tipo: (ex as any)?.tipo,
                detalle_series: (ex as any)?.detalle_series,
                series: ex.series,
                duracion_min: (ex as any)?.duracion_min,
                duration: ex.duration,
                calorias: (ex as any)?.calorias,
                calories: ex.calories,
                allKeys: Object.keys(ex || {})
              }))
            })
          })
        })

        // Actualizar estado con datos del backend
        if (backendSchedule && Object.keys(backendSchedule).length > 0) {
          // ✅ NO limpiar ejercicios aquí - solo guardar el schedule tal cual viene del backend
          // Los ejercicios se enriquecerán después cuando estén disponibles en availableExercises
          // y se filtrarán genéricos solo cuando se rendericen
          // La limpieza de ejercicios eliminados se hará en el useEffect que detecta cambios en availableExerciseIdsFingerprint
          console.log('✅ Schedule del backend guardado sin limpiar (se limpiará después si hay ejercicios eliminados):', {
            semanas: Object.keys(backendSchedule).length,
            schedule: backendSchedule
          })

          // Guardar el schedule tal cual viene del backend
          // El useEffect de limpieza se ejecutará después y limpiará los ejercicios eliminados
          setWeeklySchedule(backendSchedule)
          setNumberOfWeeks(Object.keys(backendSchedule).length)

          // ✅ Actualizar el ref del schedule para que el useEffect de limpieza pueda acceder a él
          scheduleRef.current = backendSchedule

          // ✅ Forzar ejecución del useEffect de limpieza después de cargar desde el backend
          // Esto asegura que se limpien ejercicios eliminados que ya no están en availableExercises
          // Resetear el fingerprint anterior para forzar que el useEffect se ejecute
          // Esto asegura que se limpie el schedule después de cargarlo desde el backend
          previousFingerprintRef.current = null
          console.log('🔄 Schedule cargado desde backend, forzando limpieza de ejercicios eliminados', {
            fingerprint: availableExerciseIdsFingerprint,
            tieneFingerprint: !!availableExerciseIdsFingerprint && availableExerciseIdsFingerprint.trim() !== ''
          })

          // Ejecutar limpieza manualmente después de un pequeño delay para asegurar que el schedule se haya actualizado
          setTimeout(() => {
            const currentSchedule = scheduleRef.current
            if (!currentSchedule || Object.keys(currentSchedule).length === 0) return

            // ✅ Si no hay ejercicios disponibles (fingerprint vacío), NO limpiar si hay datos del schedule
            // Esto evita limpiar la planificación antes de que se carguen los ejercicios/platos
            if (!availableExerciseIdsFingerprint || availableExerciseIdsFingerprint.trim() === '') {
              const hasScheduleData = currentSchedule && Object.keys(currentSchedule).length > 0
              if (hasScheduleData) {
                console.log('⏸️ [LIMPIEZA MANUAL] No hay ejercicios disponibles aún, pero hay planificación del backend. Esperando a que se carguen los ejercicios/platos antes de limpiar.')
                setIsLoadingPlanning(false)
                return
              }

              console.log('🧹 [LIMPIEZA MANUAL] No hay ejercicios disponibles y no hay planificación, limpiando todo el schedule')
              setWeeklySchedule({})
              scheduleRef.current = {}
              setNumberOfWeeks(0) // ✅ Cambiar a 0 para permitir agregar la primera semana
              if (onScheduleChange) {
                setTimeout(() => onScheduleChange({}), 0)
              }
              setIsLoadingPlanning(false)
              return
            }

            const availableIds = new Set<string>()
            const availableIdsNum = new Set<number>()
            availableExerciseIdsFingerprint.split(',').filter(Boolean).forEach(idStr => {
              availableIds.add(idStr)
              const idNum = Number(idStr)
              if (!isNaN(idNum)) {
                availableIdsNum.add(idNum)
              }
            })

            let changed = false
            const newSchedule: WeeklySchedule = {}

            Object.entries(currentSchedule).forEach(([weekKey, days]) => {
              const weekNumber = parseInt(weekKey)
              const cleanedDays: { [key: string]: DayScheduleEntry } = {}
              let weekHasValidExercises = false

              Object.entries(days as { [key: string]: DayScheduleEntry }).forEach(([dayKey, entry]) => {
                let rawExercises: Exercise[] = []
                if (Array.isArray(entry)) {
                  rawExercises = entry
                } else if (entry && typeof entry === 'object') {
                  rawExercises = (entry as any).ejercicios || (entry as any).exercises || []
                }

                const filteredExercises = rawExercises.filter(ex => {
                  if (!ex || (ex as any).id === undefined || (ex as any).id === null) return false
                  const exId = (ex as any).id
                  const idStr = String(exId)
                  const idNum = typeof exId === 'number' ? exId : Number(exId)
                  return availableIds.has(idStr) || (!isNaN(idNum) && availableIdsNum.has(idNum)) || availableIds.has(String(idNum))
                })

                if (filteredExercises.length !== rawExercises.length) {
                  changed = true
                }

                if (filteredExercises.length > 0) {
                  weekHasValidExercises = true
                  let newEntry: DayScheduleEntry = entry
                  if (Array.isArray(entry)) {
                    newEntry = filteredExercises
                  } else if (entry && typeof entry === 'object') {
                    newEntry = {
                      ...(entry as any),
                      ejercicios: filteredExercises,
                      exercises: filteredExercises,
                      blockCount: filteredExercises.length > 0 ? ((entry as any).blockCount || 1) : 0
                    }
                  }
                  cleanedDays[dayKey] = newEntry
                } else {
                  changed = true
                }
              })

              if (weekHasValidExercises && Object.keys(cleanedDays).length > 0) {
                newSchedule[weekNumber] = cleanedDays
              } else if (Object.keys(cleanedDays).length === 0 && Object.keys(days as any).length > 0) {
                changed = true
              }
            })

            if (changed) {
              console.log('🧹 [LIMPIEZA MANUAL] Limpiando ejercicios eliminados después de cargar desde backend', {
                semanasAntes: Object.keys(currentSchedule).length,
                semanasDespues: Object.keys(newSchedule).length
              })
              setWeeklySchedule(newSchedule)
              scheduleRef.current = newSchedule
              if (onScheduleChange) {
                setTimeout(() => onScheduleChange(newSchedule), 0)
              }
            }
          }, 100) // Pequeño delay para asegurar que el estado se haya actualizado
        }

        if (backendPeriods && backendPeriods > 0) {
          setPeriods(backendPeriods)
        }

        // Notificar al padre con los datos cargados
        if (onScheduleChange && backendSchedule) {
          setTimeout(() => {
            onScheduleChange(backendSchedule)
          }, 0)
        }
        if (onPeriodsChange && backendPeriods) {
          setTimeout(() => {
            onPeriodsChange(backendPeriods)
          }, 0)
        }

        // ✅ Resetear el flag de montaje inicial después de cargar datos
        isInitialMount.current = false
      } else {
      }
    } catch (error) {
      console.error('❌ Error cargando planificación desde backend:', error)
    } finally {
      setIsLoadingPlanning(false)
    }
  }

  // Notificar al padre cuando el schedule cambie
  useEffect(() => {
    // Saltar en el primer render
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    // Solo notificar si el schedule realmente cambió
    const scheduleString = JSON.stringify(weeklySchedule)
    if (onScheduleChange && scheduleString !== lastScheduleNotified.current) {
      lastScheduleNotified.current = scheduleString
      // Usar setTimeout para evitar setState durante renderizado
      const timeoutId = setTimeout(() => {
        onScheduleChange(weeklySchedule)
      }, 0)
      return () => clearTimeout(timeoutId)
    }
  }, [weeklySchedule]) // Remover onScheduleChange de las dependencias

  // Notificar al padre cuando los períodos cambien
  useEffect(() => {
    // Solo notificar si los períodos realmente cambiaron
    if (onPeriodsChange && periods !== lastPeriodsNotified.current) {
      lastPeriodsNotified.current = periods
      // Usar setTimeout para evitar setState durante renderizado
      const timeoutId = setTimeout(() => {
        onPeriodsChange(periods)
      }, 0)
      return () => clearTimeout(timeoutId)
    }
  }, [periods]) // Remover onPeriodsChange de las dependencias

  // Convertir datos del CSV a ejercicios
  // Ejercicios recibidos
  if (exercises?.length > 0) {
    // Procesando ejercicios
  }

  // Debug: Log de ejercicios antes de mapear
  console.log('🔍 Construyendo availableExercises desde exercisesWithActiveStatus:', {
    count: exercisesWithActiveStatus.length,
    exercises: exercisesWithActiveStatus.map((ex: any) => ({
      id: ex.id,
      name: ex.name || ex['Nombre de la Actividad'],
      is_active: (ex as any).is_active,
      activo: (ex as any).activo
    }))
  })
  const normalizedExercisePool = React.useMemo(() => {
    const registry = new Map<string, any>()

    exercisesWithActiveStatus.forEach((row, index) => {
      const rawIdentifier = row?.id ?? row?.['Nombre de la Actividad'] ?? row?.name ?? `idx-${index}`
      const identifier = typeof rawIdentifier === 'number'
        ? `id-${rawIdentifier}`
        : `key-${String(rawIdentifier).trim().toLowerCase()}`

      if (!registry.has(identifier)) {
        registry.set(identifier, row)
        return
      }

      const existing = registry.get(identifier)
      const existingActive = existing?.is_active !== false && existing?.activo !== false
      const currentActive = row?.is_active !== false && row?.activo !== false

      if (!existingActive && currentActive) {
        registry.set(identifier, row)
        return
      }

      if (existingActive === currentActive) {
        const existingIsExisting = existing?.isExisting ?? existing?.is_existing ?? false
        const currentIsExisting = row?.isExisting ?? row?.is_existing ?? false
        if (!existingIsExisting && currentIsExisting) {
          registry.set(identifier, row)
        }
      }
    })

    return Array.from(registry.values())
  }, [exercisesWithActiveStatus])

  const availableExercises: Exercise[] = normalizedExercisePool.map((row, index) => {

    // Detectar si es nutrición por la presencia de campos específicos
    const isNutrition = row && typeof row === 'object' && (
      'Nombre' in row ||
      'Proteínas (g)' in row ||
      'Carbohidratos (g)' in row ||
      'Grasas (g)' in row
    )

    // Si row es un array de strings, usar índices numéricos
    if (Array.isArray(row)) {
      const exercise = {
        id: `exercise-${index}`, // Usar ID temporal para arrays
        name: row[0] || `Ejercicio ${index + 1}`,
        description: row[1] || '',
        duration: parseInt(row[2]) || 30,
        type: row[3] || 'General',
        intensity: row[4] || 'Media',
        equipment: row[5] || 'Ninguno',
        bodyParts: row[6] || '',
        calories: parseInt(row[7]) || 0,
        peso: row[8] || '',
        reps: row[9] || '',
        series: row[10] || '',
        is_active: (row as any).is_active !== undefined ? (row as any).is_active : true,
        activo: (row as any).activo !== undefined ? (row as any).activo : true
      }
      // Ejercicio procesado desde array
      return exercise
    }

    // Si es nutrición, usar campos específicos de nutrición
    if (isNutrition) {
      // Procesando datos de nutrición
      console.log('🍽️ PROCESANDO PLATO DE NUTRICIÓN:', {
        index,
        row,
        nombre: row['Nombre'],
        receta: row['Receta'],
        calorias: row['Calorías']
      })

      // Obtener el tipo real del plato (Desayuno, Almuerzo, Cena, etc.)
      // Buscar en múltiples campos posibles
      const rawTipo = row['Tipo'] ||
        row.tipo ||
        row.tipo_plato ||
        (row as any)?.tipo ||
        (row as any)?.['Tipo'] ||
        'otro'

      console.log('🔍 Tipo de plato detectado:', {
        id: row.id,
        nombre: row['Nombre'] || row['nombre'] || row.nombre,
        rawTipo: rawTipo,
        rowKeys: Object.keys(row),
        tipoFields: {
          'Tipo': row['Tipo'],
          tipo: row.tipo,
          tipo_plato: row.tipo_plato
        }
      })

      const platoTipo = normalizeNutritionType(rawTipo)

      console.log('✅ Tipo normalizado:', platoTipo, 'desde raw:', rawTipo)

      const exercise = {
        id: row.id || `nutrition-${index}`,
        name: row['Nombre'] || row['nombre'] || row.nombre || `Plato ${index + 1}`,
        description: row['Descripción'] || row['Receta'] || row.descripcion || row.receta || '',
        duration: 0, // Los platos no tienen duración
        type: platoTipo, // Usar el tipo real del plato (desayuno, almuerzo, cena, etc.)
        intensity: 'N/A', // No aplica para nutrición
        equipment: 'N/A', // No aplica para nutrición
        bodyParts: '', // No aplica para nutrición
        calories: parseInt(row['Calorías'] || row.calorias || '0') || 0,
        proteinas: row.proteinas || parseInt(row['Proteínas (g)'] || '0') || 0,
        carbohidratos: row.carbohidratos || parseInt(row['Carbohidratos (g)'] || '0') || 0,
        grasas: row.grasas || parseInt(row['Grasas (g)'] || '0') || 0,
        peso: '',
        reps: '',
        series: '',
        is_active: row.is_active !== undefined ? row.is_active : (row.activo !== undefined ? row.activo : true),
        activo: row.activo !== undefined ? row.activo : (row.is_active !== undefined ? row.is_active : true),
        // Guardar el tipo original para referencia
        tipo: platoTipo
      }
      // Ejercicio de nutrición creado
      return exercise
    }

    // Si row es un objeto de fitness, usar propiedades de fitness
    const exercise = {
      id: row.id || `exercise-${index}`, // Usar ID real si existe, sino temporal
      name: row.name || row.nombre_ejercicio || row['Nombre de la Actividad'] || row[0] || `Ejercicio ${index + 1}`,
      description: row.description || row.descripcion || row['Descripción'] || row[1] || '',
      duration: parseInt(row.duration || row.duracion_min || row['Duración (min)'] || row[2] || '0') || null,
      type: row.type || row.tipo || row['Tipo de Ejercicio'] || row[3] || 'General',
      intensity: row.intensity || row.intensidad || row['Nivel de Intensidad'] || row[4] || 'Media',
      equipment: row.equipment || row.equipo || row['Equipo Necesario'] || row[5] || 'Ninguno',
      bodyParts: row.bodyParts || row.body_parts || row['Partes del Cuerpo'] || row[6] || '',
      calories: parseInt(row.calories || row.calorias || row['Calorías'] || row[7] || '0') || null,
      peso: row.peso || row['Peso'] || row['1RM'] || row[8] || '',
      reps: row.reps || row['Repeticiones'] || row[9] || '',
      series: row.series || row.detalle_series || row['Series'] || row['Detalle de Series (peso-repeticiones-series)'] || row[10] || '',
      detalle_series: row.detalle_series || row.series || row['Detalle de Series (peso-repeticiones-series)'] || row[10] || '',
      duracion_min: row.duracion_min || row.duration || parseInt(row['Duración (min)'] || row[2] || '0') || null,
      calorias: row.calorias || row.calories || parseInt(row['Calorías'] || row[7] || '0') || null,
      nombre_ejercicio: row.nombre_ejercicio || row.name || row['Nombre de la Actividad'] || row[0] || `Ejercicio ${index + 1}`,
      tipo: row.tipo || row.type || row['Tipo de Ejercicio'] || row[3] || 'General',
      proteinas: row.proteinas || parseInt(row['Proteínas (g)'] || '0') || 0,
      carbohidratos: row.carbohidratos || parseInt(row['Carbohidratos (g)'] || '0') || 0,
      grasas: row.grasas || parseInt(row['Grasas (g)'] || '0') || 0,
      // Preservar flags de actividad - priorizar valores explícitos
      is_active: row.is_active !== undefined ? row.is_active : (row.activo !== undefined ? row.activo : true),
      activo: row.activo !== undefined ? row.activo : (row.is_active !== undefined ? row.is_active : true)
    }

    // Debug: Log si el ejercicio está inactivo
    if (exercise.is_active === false || exercise.activo === false) {
      console.log(`🔴 Ejercicio INACTIVO detectado en mapeo: ${exercise.name} (ID: ${exercise.id}), is_active=${exercise.is_active}, activo=${exercise.activo}`)
    }
    // Ejercicio procesado
    return exercise
  })

  // ✅ Estado para almacenar los nombres reales de los platos cargados desde la BD
  const [exerciseNamesFromDB, setExerciseNamesFromDB] = React.useState<Map<string, any>>(new Map())

  // ✅ Si availableExercises está vacío pero hay ejercicios en el schedule, construirlos desde el schedule
  const availableExercisesFromSchedule = React.useMemo(() => {
    if (availableExercises.length > 0) {
      return availableExercises
    }

    // Extraer todos los ejercicios únicos del schedule
    const exercisesFromSchedule = new Map<string, Exercise>()

    Object.keys(weeklySchedule).forEach(weekKey => {
      const weekNum = Number(weekKey)
      if (isNaN(weekNum) || weekNum <= 0) return

      const weekData = weeklySchedule[weekNum]
      if (!weekData) return

      Object.keys(weekData).forEach(dayKey => {
        const dayNum = Number(dayKey)
        if (isNaN(dayNum) || dayNum <= 0 || dayNum > 7) return

        const dayData = weekData[dayNum]
        if (!dayData) return

        const dayExercises = getExercisesFromDay(dayData)
        dayExercises.forEach(ex => {
          if (ex && ex.id) {
            const exId = String(ex.id)
            // Solo agregar si no existe ya (evitar duplicados)
            if (!exercisesFromSchedule.has(exId)) {
              // Buscar nombre real desde la BD si está disponible
              const dbData = exerciseNamesFromDB.get(exId)
              const realName = dbData?.nombre || dbData?.name || ex.name || (ex as any)?.nombre_ejercicio || (ex as any)?.Nombre || null

              // ✅ NO usar nombres genéricos - si no hay nombre real, buscar en availableExercises
              let finalName = realName
              if (!finalName || finalName.trim() === '' || /^Plato\s+\d+$/i.test(finalName.trim())) {
                // Buscar en availableExercises por ID
                const foundInAvailable = availableExercises.find(ae => String(ae.id) === exId)
                if (foundInAvailable && foundInAvailable.name && foundInAvailable.name.trim() !== '' && !/^Plato\s+\d+$/i.test(foundInAvailable.name.trim())) {
                  finalName = foundInAvailable.name
                } else {
                  // Si aún no hay nombre válido, omitir este ejercicio
                  return
                }
              }

              // Construir ejercicio completo desde el schedule
              const exercise: Exercise = {
                id: ex.id,
                name: finalName,
                description: dbData?.receta || dbData?.descripcion || ex.description || (ex as any)?.descripcion || (ex as any)?.Descripción || '',
                type: ex.type || (ex as any)?.tipo || dbData?.tipo || (productCategory === 'nutricion' ? 'otro' : 'General'),
                tipo: ex.type || (ex as any)?.tipo || dbData?.tipo || (productCategory === 'nutricion' ? 'otro' : 'General'),
                duration: ex.duration ?? (ex as any)?.duracion_min ?? dbData?.minutos ?? (productCategory === 'nutricion' ? 0 : null),
                calories: dbData?.calorias ?? ex.calories ?? (ex as any)?.calorias ?? null,
                calorias: dbData?.calorias ?? ex.calories ?? (ex as any)?.calorias ?? null,
                proteinas: dbData?.proteinas ?? (ex as any)?.proteinas ?? 0,
                carbohidratos: dbData?.carbohidratos ?? (ex as any)?.carbohidratos ?? 0,
                grasas: dbData?.grasas ?? (ex as any)?.grasas ?? 0,
                block: ex.block ?? ex.bloque ?? 1,
                orden: ex.orden ?? 0,
                is_active: dbData?.is_active !== false && dbData?.activo !== false && (ex as any)?.is_active !== false && (ex as any)?.activo !== false,
                activo: dbData?.activo !== false && dbData?.is_active !== false && (ex as any)?.activo !== false && (ex as any)?.is_active !== false
              }
              if (exercise && exercise.name && exercise.name.trim() !== '' && !/^Plato\s+\d+$/i.test(exercise.name.trim())) {
                exercisesFromSchedule.set(exId, exercise)
              }
            }
          }
        })
      })
    })

    const exercisesArray = Array.from(exercisesFromSchedule.values())
    if (exercisesArray.length > 0) {
      console.log('📦 [WeeklyExercisePlanner] Construyendo availableExercises desde schedule:', {
        count: exercisesArray.length,
        sample: exercisesArray.slice(0, 3).map(ex => ({ id: ex.id, name: ex.name }))
      })
    }

    return exercisesArray
  }, [availableExercises, weeklySchedule, productCategory, exerciseNamesFromDB])

  // ✅ Cargar nombres reales de los platos desde la BD cuando availableExercises está vacío pero hay ejercicios en el schedule
  React.useEffect(() => {
    if (availableExercises.length > 0) {
      // Si ya hay availableExercises, no necesitamos cargar desde BD
      return
    }

    // Extraer todos los IDs únicos del schedule
    const exerciseIds = new Set<string>()
    Object.keys(weeklySchedule).forEach(weekKey => {
      const weekNum = Number(weekKey)
      if (isNaN(weekNum) || weekNum <= 0) return

      const weekData = weeklySchedule[weekNum]
      if (!weekData) return

      Object.keys(weekData).forEach(dayKey => {
        const dayNum = Number(dayKey)
        if (isNaN(dayNum) || dayNum <= 0 || dayNum > 7) return

        const dayData = weekData[dayNum]
        if (!dayData) return

        const dayExercises = getExercisesFromDay(dayData)
        dayExercises.forEach(ex => {
          if (ex && ex.id) {
            const exId = String(ex.id)
            // Solo agregar IDs numéricos (no temporales)
            if (!isNaN(Number(exId)) && !exId.includes('-')) {
              exerciseIds.add(exId)
            }
          }
        })
      })
    })

    if (exerciseIds.size === 0) {
      return
    }

    // Cargar nombres reales desde la BD
    const loadExerciseNames = async () => {
      try {
        const idsArray = Array.from(exerciseIds).map(id => Number(id)).filter(id => !isNaN(id))
        if (idsArray.length === 0) return

        if (productCategory === 'nutricion') {
          // Cargar platos desde nutrition_program_details
          const response = await fetch(`/api/coach/exercises?category=nutricion`)
          if (!response.ok) {
            console.warn('⚠️ Error cargando platos desde BD:', response.status)
            return
          }
          const result = await response.json()
          if (result.success && Array.isArray(result.data)) {
            const namesMap = new Map<string, any>()
            result.data.forEach((plato: any) => {
              const platoId = String(plato.id)
              if (exerciseIds.has(platoId)) {
                namesMap.set(platoId, {
                  nombre: plato.nombre || plato['Nombre'] || '',
                  receta: plato.receta || plato['Receta'] || '',
                  calorias: plato.calorias || plato['Calorías'] || 0,
                  proteinas: plato.proteinas || plato['Proteínas (g)'] || 0,
                  carbohidratos: plato.carbohidratos || plato['Carbohidratos (g)'] || 0,
                  grasas: plato.grasas || plato['Grasas (g)'] || 0,
                  tipo: plato.tipo || plato['Tipo'] || 'otro',
                  minutos: plato.minutos || 0,
                  is_active: plato.is_active !== false && plato.activo !== false,
                  activo: plato.activo !== false && plato.is_active !== false
                })
              }
            })
            if (namesMap.size > 0) {
              console.log('✅ [WeeklyExercisePlanner] Nombres de platos cargados desde BD:', namesMap.size)
              setExerciseNamesFromDB(namesMap)
            }
          }
        }
      } catch (error) {
        console.error('❌ Error cargando nombres de ejercicios desde BD:', error)
      }
    }

    loadExerciseNames()
  }, [availableExercises.length, weeklySchedule, productCategory])

  // ✅ Cargar TODOS los platos del coach cuando se está en modo nutrición (SIEMPRE para nutrición)
  const [allCoachExercises, setAllCoachExercises] = React.useState<Exercise[]>([])

  React.useEffect(() => {
    // Para nutrición, SIEMPRE cargar todos los platos del coach, no solo los del producto actual
    if (productCategory === 'nutricion') {
      const loadAllCoachExercises = async () => {
        try {
          console.log('🔄 [WeeklyExercisePlanner] Cargando TODOS los platos del coach para nutrición...')
          const response = await fetch(`/api/coach/exercises?category=nutricion`)
          if (!response.ok) {
            console.warn('⚠️ [WeeklyExercisePlanner] Error cargando todos los platos del coach:', response.status)
            return
          }
          const result = await response.json()
          if (result.success && Array.isArray(result.data)) {
            const exercises: Exercise[] = result.data.map((plato: any) => ({
              id: String(plato.id),
              name: plato.nombre || plato.name || '',
              description: plato.receta || plato.descripcion || '',
              type: plato.tipo || 'otro',
              tipo: plato.tipo || 'otro',
              calories: plato.calorias || 0,
              calorias: plato.calorias || 0,
              proteinas: plato.proteinas || 0,
              carbohidratos: plato.carbohidratos || 0,
              grasas: plato.grasas || 0,
              duration: plato.minutos || 0,
              duracion_min: plato.minutos || 0,
              is_active: plato.is_active !== false && plato.activo !== false,
              activo: plato.activo !== false && plato.is_active !== false,
              dificultad: plato.dificultad || 'Principiante'
            }))
            console.log('✅ [WeeklyExercisePlanner] Todos los platos del coach cargados:', {
              total: exercises.length,
              primeros: exercises.slice(0, 5).map(ex => ({ id: ex.id, name: ex.name }))
            })
            setAllCoachExercises(exercises)
          } else {
            console.warn('⚠️ [WeeklyExercisePlanner] Respuesta del API no tiene data válida:', result)
          }
        } catch (error) {
          console.error('❌ [WeeklyExercisePlanner] Error cargando todos los platos del coach:', error)
        }
      }
      loadAllCoachExercises()
    } else {
      // Para fitness, solo usar availableExercises
      setAllCoachExercises([])
    }
  }, [productCategory]) // Solo depender de productCategory, no de availableExercises.length

  // Para nutrición: Combinar allCoachExercises (todos los platos del coach) con los platos del schedule
  // Para fitness: usar availableExercises si hay, sino availableExercisesFromSchedule
  const finalAvailableExercises = React.useMemo(() => {
    if (productCategory === 'nutricion') {
      // Para nutrición, combinar todos los platos del coach con los que están en el schedule
      const combinedExercises = new Map<string, Exercise>()

      // Primero agregar todos los platos del coach
      if (allCoachExercises.length > 0) {
        allCoachExercises.forEach(ex => {
          const exId = String(ex.id)
          combinedExercises.set(exId, ex)
        })
      }

      // Luego agregar los platos del producto actual (si hay)
      if (availableExercises.length > 0) {
        availableExercises.forEach(ex => {
          const exId = String(ex.id)
          // Solo agregar si no existe ya (evitar duplicados)
          if (!combinedExercises.has(exId)) {
            combinedExercises.set(exId, ex)
          }
        })
      }

      // Finalmente agregar los platos que están en el schedule (para asegurar que aparezcan aunque no estén en el coach)
      if (availableExercisesFromSchedule.length > 0) {
        availableExercisesFromSchedule.forEach(ex => {
          const exId = String(ex.id)
          // Solo agregar si no existe ya
          if (!combinedExercises.has(exId)) {
            combinedExercises.set(exId, ex)
          } else {
            // Si ya existe, actualizar con la información del schedule (puede tener más detalles como block, orden, etc.)
            const existing = combinedExercises.get(exId)!
            combinedExercises.set(exId, {
              ...existing,
              ...ex,
              // Preservar información del coach (nombre, macros, etc.)
              name: existing.name || ex.name,
              description: existing.description || ex.description,
              type: existing.type || ex.type,
              calories: existing.calories || ex.calories,
              proteinas: existing.proteinas || ex.proteinas,
              carbohidratos: existing.carbohidratos || ex.carbohidratos,
              grasas: existing.grasas || ex.grasas
            })
          }
        })
      }

      const result = Array.from(combinedExercises.values())
      console.log(`📋 [WeeklyExercisePlanner] Ejercicios combinados para nutrición:`, {
        total: result.length,
        fromCoach: allCoachExercises.length,
        fromProduct: availableExercises.length,
        fromSchedule: availableExercisesFromSchedule.length,
        primeros: result.slice(0, 5).map(ex => ({ id: ex.id, name: ex.name }))
      })

      return result
    } else {
      // Para fitness: lógica normal
      return availableExercises.length > 0
        ? availableExercises
        : (availableExercisesFromSchedule.length > 0
          ? availableExercisesFromSchedule
          : allCoachExercises)
    }
  }, [productCategory, allCoachExercises, availableExercises, availableExercisesFromSchedule])

  // Totales de macros y calorías de los ejercicios/platos seleccionados (solo nutrición)
  const selectedNutritionTotals = React.useMemo(() => {
    const totals = {
      proteinas: 0,
      carbohidratos: 0,
      grasas: 0,
      calorias: 0
    }

    if (productCategory !== 'nutricion') {
      return totals
    }

    finalAvailableExercises.forEach(ex => {
      // Comparar como string para asegurar compatibilidad
      const exIdStr = String(ex.id)
      if (!selectedExercises.has(exIdStr)) return

      const p = typeof ex.proteinas === 'number' ? ex.proteinas : 0
      const c = typeof ex.carbohidratos === 'number' ? ex.carbohidratos : 0
      const g = typeof ex.grasas === 'number' ? ex.grasas : 0
      const k = typeof ex.calorias === 'number' ? ex.calorias : 0

      totals.proteinas += p
      totals.carbohidratos += c
      totals.grasas += g
      totals.calorias += k
    })

    return totals
  }, [finalAvailableExercises, selectedExercises, productCategory])

  // Ejercicios procesados
  if (finalAvailableExercises.length > 0) {
    // Ejercicios procesados
    // Log específico para nutrición
    const nutritionExercises = finalAvailableExercises.filter(ex => ex.type === 'Nutrición')
    // Platos de nutrición detectados

    // Debug: Verificar flags de actividad
    const inactiveExercises = finalAvailableExercises.filter(ex =>
      (ex as any).is_active === false || (ex as any).activo === false
    )
    if (inactiveExercises.length > 0) {
      console.log('🔴 Ejercicios inactivos detectados:', inactiveExercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        is_active: (ex as any).is_active,
        activo: (ex as any).activo
      })))
    }
  }

  // Ejercicios procesados para el planificador semanal

  // Función para formatear las series como P-R-S
  const addExerciseToDay = (weekNumber: number, dayNumber: number, exerciseId: string) => {
    const exercise = finalAvailableExercises.find(ex => String(ex.id) === String(exerciseId))
    if (!exercise) {
      console.warn(`⚠️ [addExerciseToDay] Ejercicio no encontrado:`, {
        exerciseId,
        finalAvailableExercisesCount: finalAvailableExercises.length,
        availableIds: finalAvailableExercises.slice(0, 5).map(ex => ex.id)
      })
      return
    }

    const newSchedule = { ...weeklySchedule }
    if (!newSchedule[weekNumber]) {
      newSchedule[weekNumber] = {}
    }
    if (!newSchedule[weekNumber][dayNumber]) {
      newSchedule[weekNumber][dayNumber] = {
        ejercicios: [],
        blockNames: {}
      }
    }

    // Agregar ejercicio (permitir duplicados)
    const dayData = newSchedule[weekNumber][dayNumber]
    if (Array.isArray(dayData)) {
      dayData.push(exercise)
    } else {
      if (!dayData.ejercicios) {
        dayData.ejercicios = []
      }
      dayData.ejercicios.push(exercise)
    }
    setWeeklySchedule(newSchedule)
    if (onScheduleChange) {
      setTimeout(() => onScheduleChange(newSchedule), 0)
    }
  }

  const removeExerciseFromDayByIndex = (weekNumber: number, dayNumber: number, exerciseIndex: number) => {
    const newSchedule = { ...weeklySchedule }
    if (newSchedule[weekNumber]?.[dayNumber]) {
      const dayData = newSchedule[weekNumber][dayNumber]
      if (Array.isArray(dayData)) {
        dayData.splice(exerciseIndex, 1)
      } else {
        if (!dayData.ejercicios) {
          dayData.ejercicios = []
        }
        dayData.ejercicios.splice(exerciseIndex, 1)
      }
    }
    setWeeklySchedule(newSchedule)
    if (onScheduleChange) {
      setTimeout(() => onScheduleChange(newSchedule), 0)
    }
  }

  const toggleExerciseSelection = (exerciseId: string) => {
    console.log('🔘 [WeeklyExercisePlanner] toggleExerciseSelection llamado:', {
      exerciseId,
      finalAvailableExercisesLength: finalAvailableExercises.length,
      exercise: finalAvailableExercises.find(ex => ex.id === exerciseId),
      currentSelectionSize: selectedExercises.size,
      isSelected: selectedExercises.has(exerciseId)
    })

    // No permitir seleccionar ejercicios inactivos
    const exercise = finalAvailableExercises.find(ex => ex.id === exerciseId)
    if (!exercise) {
      console.warn('⚠️ [WeeklyExercisePlanner] Ejercicio no encontrado:', exerciseId)
      return
    }

    if ((exercise as any).is_active === false || (exercise as any).activo === false) {
      console.log('⚠️ [WeeklyExercisePlanner] Intento de seleccionar ejercicio inactivo:', exercise.name)
      return // No hacer nada si el ejercicio está desactivado
    }

    const newSelection = new Set(selectedExercises)
    if (newSelection.has(exerciseId)) {
      newSelection.delete(exerciseId)
      console.log('✅ [WeeklyExercisePlanner] Ejercicio deseleccionado:', exercise.name)
    } else {
      newSelection.add(exerciseId)
      console.log('✅ [WeeklyExercisePlanner] Ejercicio seleccionado:', exercise.name, 'Total seleccionados:', newSelection.size)
    }
    setSelectedExercises(newSelection)
  }

  const selectAllExercises = () => {
    // Solo seleccionar ejercicios activos
    const activeExercises = finalAvailableExercises.filter(ex =>
      (ex as any).is_active !== false && (ex as any).activo !== false
    )
    const activeIds = activeExercises.map(ex => ex.id)
    const allActiveSelected = activeIds.length > 0 && activeIds.every(id => selectedExercises.has(id))

    if (allActiveSelected) {
      setSelectedExercises(new Set())
    } else {
      setSelectedExercises(new Set(activeIds))
    }
  }

  const clearSelection = () => {
    setSelectedExercises(new Set())
  }

  const openDayExercises = (dayKey: string) => {
    setSelectedDay(dayKey)
    setShowDayExercises(true)
  }

  const closeDayExercises = () => {
    setSelectedDay(null)
    setShowDayExercises(false)
  }

  // Smart day click: assign if exercises are selected, otherwise open day
  const handleDayClick = (dayNumber: number) => {
    if (selectedExercises.size > 0) {
      // Si hay ejercicios seleccionados, asignarlos al día
      assignSelectedToDay(currentWeek, dayNumber)
      // NO limpiar la selección para permitir asignar a múltiples días
    } else {
      // Si no hay ejercicios seleccionados, abrir el día
      openDayExercises(String(dayNumber))
    }
  }

  const removeExerciseFromDay = (dayKey: string, exerciseId: string) => {
    setWeeklySchedule(prev => {
      const newSchedule = { ...prev }
      const dayNumber = parseInt(dayKey)
      if (newSchedule[currentWeek]?.[dayNumber]) {
        const dayData = newSchedule[currentWeek][dayNumber]
        if (Array.isArray(dayData)) {
          newSchedule[currentWeek][dayNumber] = dayData.filter((ex: Exercise) => ex.id !== exerciseId)
        } else {
          dayData.ejercicios = (dayData.ejercicios || []).filter((ex: Exercise) => ex.id !== exerciseId)
        }
      }
      return newSchedule
    })
  }

  const clearDayExercises = (dayKey: string) => {
    setWeeklySchedule(prev => {
      const newSchedule = { ...prev }
      const dayNumber = parseInt(dayKey)
      if (newSchedule[currentWeek]) {
        newSchedule[currentWeek][dayNumber] = []
      }
      return newSchedule
    })
  }

  // Función eliminada - se estaba duplicando con el onClick inline

  // Calcular estadísticas del patrón
  const getPatternStats = React.useCallback(() => {
    let totalExercises = 0
    let totalDays = 0
    const uniqueExerciseIds = new Set<string>()
    const weeksWithExercises = new Set<number>()

    // ✅ Obtener IDs de ejercicios disponibles desde finalAvailableExercises (incluye platos del schedule)
    // Esto asegura que se cuenten correctamente incluso cuando persistentCsvData está vacío
    const availableExerciseIds = new Set<string>()
    const availableExerciseIdsNum = new Set<number>()
    finalAvailableExercises.forEach(ex => {
      if (ex && ex.id !== undefined && ex.id !== null) {
        const idStr = String(ex.id)
        availableExerciseIds.add(idStr)
        const idNum = Number(ex.id)
        if (!isNaN(idNum)) {
          availableExerciseIdsNum.add(idNum)
        }
      }
    })

      // También agregar IDs de exercises (persistentCsvData) si están disponibles
      ; (exercises || []).forEach(ex => {
        if (ex && ex.id !== undefined && ex.id !== null) {
          const idStr = String(ex.id)
          availableExerciseIds.add(idStr)
          const idNum = Number(ex.id)
          if (!isNaN(idNum)) {
            availableExerciseIdsNum.add(idNum)
          }
        }
      })

    for (let week = 1; week <= numberOfWeeks; week++) {
      let weekHasExercises = false

      for (const day of DAYS) {
        // ✅ Usar getExercisesFromDay que ya filtra genéricos
        const dayEntry = weeklySchedule[week]?.[day.key]
        const dayExercises = getExercisesFromDay(dayEntry)

        // ✅ Filtrar solo ejercicios que:
        // 1. NO son genéricos (ya filtrado por getExercisesFromDay)
        // 2. Aún están disponibles en el paso 4
        // 3. Están activos (activo !== false) - pero si no está definido, asumir activo
        const validDayExercises = dayExercises.filter(exercise => {
          // Verificar que no sea genérico (doble verificación)
          if (isGenericExercise(exercise)) {
            return false
          }

          // Verificar que esté disponible (comparar como string y número)
          const exerciseId = exercise.id
          const exerciseIdStr = exerciseId !== undefined && exerciseId !== null ? String(exerciseId) : null
          const exerciseIdNum = exerciseIdStr && !isNaN(Number(exerciseIdStr)) ? Number(exerciseIdStr) : null

          const isAvailable = exerciseIdStr && (
            availableExerciseIds.has(exerciseIdStr) ||
            (exerciseIdNum !== null && availableExerciseIdsNum.has(exerciseIdNum)) ||
            availableExerciseIds.has(String(exerciseIdNum))
          )

          // Verificar que esté activo (si no está definido, asumir activo por defecto)
          const isActive = (exercise as any).activo !== false && (exercise as any).is_active !== false

          return isAvailable && isActive
        })

        // ✅ Solo contar si hay ejercicios válidos (no genéricos, disponibles y activos)
        if (validDayExercises.length > 0) {
          totalExercises += validDayExercises.length
          totalDays++
          weekHasExercises = true

          // Agregar IDs únicos de ejercicios válidos y activos
          validDayExercises.forEach(exercise => {
            uniqueExerciseIds.add(String(exercise.id))
          })
        }
      }

      // ✅ Solo contar semanas que tienen al menos un día con ejercicios válidos
      if (weekHasExercises) {
        weeksWithExercises.add(week)
      }
    }

    // Calcular semanas únicas (número real de semanas con ejercicios válidos)
    const uniqueWeeks = weeksWithExercises.size
    // Total de semanas considerando períodos (si hay 2 semanas base y 2 períodos, son 4 semanas totales)
    const totalWeeks = uniqueWeeks > 0 ? uniqueWeeks * periods : 0 // ✅ 0 si no hay semanas válidas

    const stats = {
      totalExercises, // ✅ Ejercicios totales válidos (no genéricos, disponibles y activos)
      totalDays, // ✅ Sesiones (días con ejercicios válidos)
      totalWeeks, // ✅ Semanas únicas con ejercicios válidos multiplicadas por períodos
      uniqueExercises: uniqueExerciseIds.size, // ✅ Ejercicios únicos válidos (no genéricos, disponibles y activos)
      totalSessions: totalDays * periods, // ✅ Sesiones totales considerando períodos
      totalExercisesReplicated: totalExercises * periods // ✅ Ejercicios totales replicados
    }

    console.log('📊 [getPatternStats] Estadísticas calculadas:', {
      stats,
      numberOfWeeks,
      periods,
      availableExerciseIdsCount: availableExerciseIds.size,
      availableExerciseIdsNumCount: availableExerciseIdsNum.size,
      scheduleWeeks: Object.keys(weeklySchedule).length,
      weeksWithExercises: Array.from(weeksWithExercises),
      uniqueExerciseIds: Array.from(uniqueExerciseIds).slice(0, 10), // Primeros 10 IDs únicos
      uniqueExerciseIdsCount: uniqueExerciseIds.size,
      totalExercises,
      totalDays
    })

    return stats
  }, [weeklySchedule, numberOfWeeks, periods, exercises, finalAvailableExercises]) // Incluir finalAvailableExercises en las dependencias

  // Notificar al padre cuando las estadísticas cambien
  useEffect(() => {
    if (onStatsChange) {
      const stats = getPatternStats()
      const statsString = JSON.stringify(stats)

      // Solo notificar si las estadísticas realmente cambiaron
      if (statsString !== lastStatsNotified.current) {
        lastStatsNotified.current = statsString
        // Estadísticas calculadas
        // Usar setTimeout para evitar setState durante renderizado
        const timeoutId = setTimeout(() => {
          onStatsChange(stats)
        }, 0)
        return () => clearTimeout(timeoutId)
      }
    }
  }, [weeklySchedule, numberOfWeeks, periods, getPatternStats, exercises, onStatsChange]) // Incluir exercises para recalcular cuando cambien los ejercicios disponibles

  const assignSelectedToDay = (weekNumber: number, dayNumber: number) => {
    // Guardar estado actual en historial antes de cambiar
    saveToHistory(weeklySchedule)

    const newSchedule = { ...weeklySchedule }
    if (!newSchedule[weekNumber]) {
      newSchedule[weekNumber] = {}
    }
    if (!newSchedule[weekNumber][dayNumber]) {
      newSchedule[weekNumber][dayNumber] = {
        ejercicios: [],
        blockNames: {}
      }
    }

    console.log(`📊 [assignSelectedToDay] Asignando ejercicios a día:`, {
      weekNumber,
      dayNumber,
      selectedExercisesCount: selectedExercises.size,
      selectedIds: Array.from(selectedExercises),
      finalAvailableExercisesCount: finalAvailableExercises.length
    })

    selectedExercises.forEach(exerciseId => {
      // ✅ Buscar en finalAvailableExercises (que incluye todos los platos del coach para nutrición)
      const exercise = finalAvailableExercises.find(ex => String(ex.id) === String(exerciseId))

      if (!exercise) {
        console.warn(`⚠️ [assignSelectedToDay] Ejercicio no encontrado en finalAvailableExercises:`, {
          exerciseId,
          availableIds: finalAvailableExercises.slice(0, 5).map(ex => ex.id),
          tipoId: typeof exerciseId
        })
        return
      }

      console.log(`✅ [assignSelectedToDay] Ejercicio encontrado:`, {
        id: exercise.id,
        name: exercise.name,
        type: exercise.type
      })

      // ✅ PERMITIR DUPLICADOS - Removida validación de existencia
      // Manejar tanto el formato antiguo (array) como el nuevo (objeto con ejercicios)
      if (Array.isArray(newSchedule[weekNumber][dayNumber])) {
        newSchedule[weekNumber][dayNumber].push(exercise)
      } else if (newSchedule[weekNumber][dayNumber] && newSchedule[weekNumber][dayNumber].ejercicios) {
        newSchedule[weekNumber][dayNumber].ejercicios.push(exercise)
      } else {
        // Si no existe, crear la estructura correcta
        newSchedule[weekNumber][dayNumber] = {
          ejercicios: [exercise],
          blockNames: {}
        }
      }
    })

    console.log(`📅 [assignSelectedToDay] Schedule actualizado:`, {
      weekNumber,
      dayNumber,
      totalEjercicios: getExercisesFromDay(newSchedule[weekNumber][dayNumber]).length
    })

    setWeeklySchedule(newSchedule)

    // Actualizar días similares después de asignar ejercicios
    const currentDayKey = `${weekNumber}-${dayNumber}`
    const assignedExercises = getExercisesFromDay(newSchedule[weekNumber][dayNumber])

    // Buscar días similares usando el nuevo schedule
    const similarDaysList = findSimilarDaysInSchedule(newSchedule, currentDayKey, assignedExercises)
    setSimilarDays(prev => ({
      ...prev,
      [currentDayKey]: similarDaysList
    }))

    if (onScheduleChange) {
      setTimeout(() => onScheduleChange(newSchedule), 0)
    }
  }

  const addWeek = () => {
    console.log('➕ [addWeek] Iniciando agregar semana', {
      weeklySchedule,
      scheduleKeys: Object.keys(weeklySchedule),
      scheduleKeysLength: Object.keys(weeklySchedule).length,
      numberOfWeeks,
      weeksLimit,
      periods,
      planLimits
    })

    // ✅ Calcular el nuevo número de semana basado en semanas existentes (no solo numberOfWeeks)
    const existingWeekNumbers = Object.keys(weeklySchedule).map(Number).filter(n => !isNaN(n) && n > 0).sort((a, b) => a - b)
    const maxWeekNumber = existingWeekNumbers.length > 0 ? Math.max(...existingWeekNumbers) : 0
    const newWeekNumber = maxWeekNumber + 1

    // ✅ Usar el número real de semanas en el schedule
    // Si no hay semanas, totalWeeksInSchedule será 0, permitiendo agregar la primera semana
    const totalWeeksInSchedule = existingWeekNumbers.length
    const totalWeeksAfterAdd = totalWeeksInSchedule + 1
    const totalWithPeriods = totalWeeksAfterAdd * periods

    console.log('🔍 [addWeek] Verificando límite:', {
      existingWeekNumbers,
      maxWeekNumber,
      newWeekNumber,
      totalWeeksInSchedule,
      totalWeeksAfterAdd,
      periods,
      totalWithPeriods,
      weeksLimit,
      willExceedLimit: weeksLimit !== null && weeksLimit !== undefined && totalWithPeriods > weeksLimit
    })

    // ✅ Verificar límite: (semanas totales + 1 nueva semana) * períodos <= límite
    // Nota: La nueva semana estará vacía inicialmente, pero aún así cuenta para el límite
    if (weeksLimit !== null && weeksLimit !== undefined && totalWithPeriods > weeksLimit) {
      const errorMsg = `Límite de semanas (${weeksLimit}) alcanzado. Reduce semanas o repeticiones para continuar.`
      console.warn('⚠️ [addWeek] Límite alcanzado:', errorMsg, {
        totalWeeksAfterAdd,
        periods,
        totalWithPeriods,
        weeksLimit
      })
      setWeekLimitError(errorMsg)
      return
    }

    setWeekLimitError(null)

    // Guardar estado actual en historial antes de agregar semana
    saveToHistory(JSON.parse(JSON.stringify(weeklySchedule)))

    const newSchedule = { ...weeklySchedule }

    // Inicializar la nueva semana con días vacíos
    newSchedule[newWeekNumber] = {}
    for (let day = 1; day <= 7; day++) {
      newSchedule[newWeekNumber][day] = []
    }

    console.log('✅ [addWeek] Agregando semana', {
      newWeekNumber,
      newSchedule,
      scheduleKeys: Object.keys(newSchedule),
      scheduleKeysLength: Object.keys(newSchedule).length
    })

    setWeeklySchedule(newSchedule)
    // ✅ Actualizar numberOfWeeks basado en el número máximo de semana
    setNumberOfWeeks(newWeekNumber)
    // ✅ Marcar que acabamos de agregar esta semana para evitar que se ajuste currentWeek
    justAddedWeekRef.current = newWeekNumber
    // ✅ Marcar esta semana como agregada por el usuario (no debe eliminarse aunque esté vacía)
    userAddedWeeksRef.current.add(newWeekNumber)
    console.log(`✅ Semana ${newWeekNumber} marcada como agregada por el usuario`, {
      semanasMarcadas: Array.from(userAddedWeeksRef.current)
    })
    setCurrentWeek(newWeekNumber)
    if (onScheduleChange) {
      setTimeout(() => onScheduleChange(newSchedule), 0)
    }
  }

  const removeWeek = (weekToRemove: number = currentWeek) => {
    if (numberOfWeeks <= 1) return

    // Guardar estado actual en historial antes de eliminar semana
    saveToHistory(JSON.parse(JSON.stringify(weeklySchedule)))

    const tempSchedule = { ...weeklySchedule }
    delete tempSchedule[weekToRemove]

    // ✅ Limpiar la semana del ref de semanas agregadas por el usuario
    userAddedWeeksRef.current.delete(weekToRemove)
    console.log(`🧹 Semana ${weekToRemove} eliminada del ref de semanas agregadas por el usuario`)

    const reindexedSchedule: WeeklySchedule = {}
    let idx = 1
    Object.keys(tempSchedule)
      .map(Number)
      .sort((a, b) => a - b)
      .forEach(key => {
        reindexedSchedule[idx] = tempSchedule[key]
        idx++
      })

    setWeeklySchedule(reindexedSchedule)
    const newTotalWeeks = Math.max(1, Object.keys(reindexedSchedule).length)
    setNumberOfWeeks(newTotalWeeks)
    setCurrentWeek(prev => Math.max(1, Math.min(prev, newTotalWeeks)))
    setWeekLimitError(null)
    if (onScheduleChange) {
      setTimeout(() => onScheduleChange(reindexedSchedule), 0)
    }
  }

  const replicateWeeks = () => {
    if (replicationCount > 1) {
      const newSchedule = { ...weeklySchedule }
      const baseWeeks = Object.keys(weeklySchedule).map(Number).sort()
      const newTotalWeeks = numberOfWeeks * replicationCount
      if (!ensureWithinWeekLimit(newTotalWeeks, periods)) {
        return
      }
      for (let i = 1; i < replicationCount; i++) {
        baseWeeks.forEach(baseWeek => {
          const newWeekNumber = baseWeek + (numberOfWeeks * i)
          newSchedule[newWeekNumber] = { ...weeklySchedule[baseWeek] }
        })
      }

      setWeeklySchedule(newSchedule)
      setNumberOfWeeks(newTotalWeeks)
      if (onScheduleChange) {
        setTimeout(() => onScheduleChange(newSchedule), 0)
      }
    }
  }

  const increasePeriods = () => {
    const newPeriods = Math.min(12, periods + 1)
    if (newPeriods === periods) return
    // ✅ Usar semanas con ejercicios válidos en lugar de numberOfWeeks total
    const weeksWithExercises = getWeeksWithExercises()
    const validWeeksCount = weeksWithExercises.size || 1
    if (!ensureWithinWeekLimit(validWeeksCount, newPeriods)) return
    setPeriods(newPeriods)
  }

  const decreasePeriods = () => {
    const newPeriods = Math.max(1, periods - 1)
    if (newPeriods === periods) return
    setPeriods(newPeriods)
    if (weeksLimit !== null && numberOfWeeks * newPeriods <= weeksLimit) {
      setWeekLimitError(null)
    }
  }

  const ensureWithinWeekLimit = (targetWeeks: number, targetPeriods: number) => {
    if (weeksLimit !== null && targetWeeks * targetPeriods > weeksLimit) {
      setWeekLimitError(`Límite de semanas (${weeksLimit}) alcanzado. Reduce semanas o repeticiones para continuar.`)
      return false
    }
    setWeekLimitError(null)
    return true
  }

  const getBlockNamesForDay = (weekNumber: number, dayNumber: number): { [key: number]: string } => {
    const dayData = weeklySchedule[weekNumber]?.[dayNumber]
    // Si es el nuevo formato con ejercicios y blockNames
    if (dayData && typeof dayData === 'object' && 'blockNames' in dayData) {
      return (dayData as { blockNames: { [key: number]: string } }).blockNames || {}
    }
    return {}
  }

  const summaryStats = getPatternStats()
  const weeksExceeded = weeksLimit !== null && summaryStats.totalWeeks > weeksLimit
  const sessionsLimit = weeksLimit !== null ? weeksLimit * 7 : null
  const sessionsExceeded = sessionsLimit !== null && summaryStats.totalSessions > sessionsLimit
  const uniqueExceeded = activitiesLimit !== null && summaryStats.uniqueExercises > activitiesLimit

  useEffect(() => {
    if (weeksLimit !== null && summaryStats.totalWeeks <= weeksLimit && weekLimitError) {
      setWeekLimitError(null)
    }
  }, [weeksLimit, summaryStats.totalWeeks, weekLimitError])

  return (
    <div className="space-y-8">
      {/* Indicador de carga */}
      {isLoadingPlanning && (
        <div className="bg-gray-900/20 rounded-lg p-4 text-center">
          <div className="text-white">📅 Cargando planificación desde backend...</div>
        </div>
      )}
      {/* Resumen y Repetir - Mitad de pantalla cada uno */}
      <div className="grid grid-cols-2 gap-8">
        {/* Resumen total - Vertical */}
        <div ref={summaryRef} className="space-y-2">
          <h4 className="text-white text-base font-bold uppercase tracking-wider">Resumen</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Semanas:</span>
              <span className={`${weeksExceeded ? 'text-red-400 font-semibold' : 'text-[#FF7939] font-medium'}`}>
                {weeksLimit !== null ? `${summaryStats.totalWeeks}/${weeksLimit}` : summaryStats.totalWeeks}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Sesiones:</span>
              <span className={`${sessionsExceeded ? 'text-red-400 font-semibold' : 'text-[#FF7939] font-medium'}`}>
                {sessionsLimit !== null ? `${summaryStats.totalSessions}/${sessionsLimit}` : summaryStats.totalSessions}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">{productCategory === 'nutricion' ? 'Platos totales:' : 'Ejercicios totales:'}</span>
              <span className="text-[#FF7939] font-medium">{summaryStats.totalExercisesReplicated}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">{productCategory === 'nutricion' ? 'Platos únicos:' : 'Ejercicios únicos:'}</span>
              <span className={`${uniqueExceeded ? 'text-red-400 font-semibold' : 'text-[#FF7939] font-medium'}`}>
                {activitiesLimit !== null ? `${summaryStats.uniqueExercises}/${activitiesLimit}` : summaryStats.uniqueExercises}
              </span>
            </div>
          </div>
          {(weekLimitError || weeksExceeded) && weeksLimit !== null && (
            <p className="text-red-400 text-xs mt-2">
              {weekLimitError ?? `Has superado el límite de semanas (${weeksLimit}). Ajusta tu planificación.`}
            </p>
          )}
          {uniqueExceeded && activitiesLimit !== null && (
            <p className="text-red-400 text-xs">
              Has superado el límite de {productCategory === 'nutricion' ? 'platos únicos' : 'ejercicios únicos'} de tu plan ({activitiesLimit}). Ajusta tu selección.
            </p>
          )}
        </div>

        {/* Repetir - Centrado */}
        <div className="flex flex-col items-center space-y-2 mt-4">
          <h4 className="text-white text-base font-bold uppercase tracking-wider">Repetir</h4>
          {(() => {
            const canDecreasePeriods = periods > 1
            // ✅ Usar semanas con ejercicios válidos en lugar de numberOfWeeks total
            const weeksWithExercises = getWeeksWithExercises()
            const validWeeksCount = weeksWithExercises.size || 1 // Al menos 1 para permitir agregar
            const canIncreasePeriods = weeksLimit === null ? true : (validWeeksCount * (periods + 1)) <= weeksLimit
            return (
              <div className="flex items-center gap-1">
                <button
                  onClick={decreasePeriods}
                  disabled={!canDecreasePeriods}
                  className={`w-6 h-6 rounded-full border-2 text-xs font-light transition-colors flex items-center justify-center ${canDecreasePeriods
                    ? 'border-[#FF7939] text-[#FF7939] hover:bg-[#FF7939]/10'
                    : 'border-gray-700 text-gray-600 cursor-not-allowed opacity-50'
                    }`}
                >
                  -
                </button>
                <span className="text-[#FF7939] text-sm font-medium w-6 text-center">{periods}</span>
                <button
                  onClick={increasePeriods}
                  disabled={!canIncreasePeriods}
                  className={`w-6 h-6 rounded-full border-2 text-xs font-light transition-colors flex items-center justify-center ${canIncreasePeriods
                    ? 'border-[#FF7939] text-[#FF7939] hover:bg-[#FF7939]/10'
                    : 'border-gray-700 text-gray-600 cursor-not-allowed opacity-50'
                    }`}
                >
                  +
                </button>
              </div>
            )
          })()}
        </div>
      </div>

      {/* Tabla de semanas - formato compacto */}
      <div className="w-full">
        {/* Selector de semanas */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${canUndo
              ? 'border-[#FF7939] text-[#FF7939] hover:bg-[#FF7939]/10 bg-black'
              : 'border-gray-700 text-gray-600 bg-black cursor-not-allowed opacity-50'
              }`}
            title={canUndo ? 'Deshacer último cambio' : 'No hay acciones para deshacer'}
            aria-label="Deshacer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="flex flex-wrap items-center gap-2 max-w-md">
            {(() => {
              // ✅ Usar la función helper para calcular semanas con ejercicios
              const weeksWithExercises = getWeeksWithExercises()

              // ✅ Obtener todas las semanas del schedule (incluyendo vacías agregadas por el usuario)
              const allWeeksInSchedule = Object.keys(weeklySchedule)
                .map(Number)
                .filter(n => !isNaN(n) && n > 0)
                .sort((a, b) => a - b)

              // ✅ Si no hay semanas en el schedule, mostrar mensaje
              if (allWeeksInSchedule.length === 0 && weeksWithExercises.size === 0) {
                return (
                  <div className="text-gray-400 text-sm text-center py-2">
                    No hay {productCategory === 'nutricion' ? 'platos' : 'ejercicios'} programados
                  </div>
                )
              }

              // ✅ Mostrar TODAS las semanas del schedule (incluso las vacías)
              return allWeeksInSchedule.map((weekNumber) => {
                const hasExercises = weeksWithExercises.has(weekNumber)
                const isWeekEmpty = !hasExercises

                return (
                  <button
                    key={weekNumber}
                    onClick={() => setCurrentWeek(weekNumber)}
                    className={`w-8 h-8 rounded-full border-2 text-sm font-light transition-colors ${currentWeek === weekNumber
                      ? 'border-[#FF7939]'
                      : 'border-gray-600 hover:border-gray-500'
                      }`}
                    style={{
                      color: isWeekEmpty
                        ? '#ef4444' // Rojo si la semana está vacía
                        : currentWeek === weekNumber
                          ? '#FF7939' // Naranja si está seleccionada
                          : '#d1d5db' // Gris si no está seleccionada
                    }}
                  >
                    {weekNumber}
                  </button>
                )
              })
            })()}
            <button
              onClick={() => {
                console.log('🔘 [Agregar Semana] Click en botón +', {
                  weeklySchedule,
                  scheduleKeys: Object.keys(weeklySchedule),
                  numberOfWeeks,
                  weeksLimit,
                  periods
                })
                addWeek()
              }}
              disabled={(() => {
                if (weeksLimit === null || weeksLimit === undefined) {
                  console.log('✅ [Agregar Semana] Sin límite, habilitado')
                  return false
                }
                // ✅ Usar el número real de semanas en el schedule
                // Si no hay semanas, totalWeeksInSchedule será 0, permitiendo agregar la primera semana
                const existingWeekNumbers = Object.keys(weeklySchedule).map(Number).filter(n => !isNaN(n) && n > 0)
                const totalWeeksInSchedule = existingWeekNumbers.length
                const totalWeeksAfterAdd = totalWeeksInSchedule + 1
                const totalWithPeriods = totalWeeksAfterAdd * periods
                const isDisabled = totalWithPeriods > weeksLimit

                console.log('🔍 [Agregar Semana] Verificando límite:', {
                  existingWeekNumbers,
                  numberOfWeeks,
                  totalWeeksInSchedule,
                  totalWeeksAfterAdd,
                  periods,
                  totalWithPeriods,
                  weeksLimit,
                  isDisabled
                })

                // Permitir agregar si el total (semanas totales + 1 nueva) * períodos no supera el límite
                return isDisabled
              })()}
              className={`w-8 h-8 rounded-full border-2 text-sm font-light transition-colors ${(() => {
                if (weeksLimit === null || weeksLimit === undefined) return false
                const existingWeekNumbers = Object.keys(weeklySchedule).map(Number).filter(n => !isNaN(n) && n > 0)
                const totalWeeksInSchedule = existingWeekNumbers.length
                const totalWeeksAfterAdd = totalWeeksInSchedule + 1
                return (totalWeeksAfterAdd * periods) > weeksLimit
              })()
                ? 'border-gray-700 text-gray-600 cursor-not-allowed opacity-50'
                : 'border-[#FF7939] text-[#FF7939] hover:bg-[#FF7939]/10'
                }`}
            >
              +
            </button>
          </div>

          {/* Botón eliminar semana - solo mostrar si hay más de una semana con ejercicios */}
          {(() => {
            const weeksWithExercises = getWeeksWithExercises()
            return weeksWithExercises.size > 1 && (
              <button
                onClick={() => removeWeek(currentWeek)}
                className="w-6 h-6 rounded-full border-2 border-[#FF7939] text-[#FF7939] hover:bg-[#FF7939]/10 text-xs font-light transition-colors flex items-center justify-center"
              >
                ✕
              </button>
            )
          })()}
        </div>

        <div className="space-y-1">
          <div className="text-xs text-gray-500 px-1 text-center">
            Hacé click en un día para dividir en bloques y organizar.
          </div>
          {/* Headers de días */}
          <div className="grid grid-cols-[90px_repeat(7,minmax(0,1fr))] gap-0">
            <div className="text-left py-1 text-gray-400 text-sm font-medium"></div>
            {DAYS.map((day) => (
              <button
                type="button"
                key={day.key}
                onClick={() => handleDayClick(day.key)}
                className="text-center py-1 text-gray-400 text-sm font-medium w-full"
              >
                {day.label}
              </button>
            ))}
          </div>

          {/* Filas por tipo */}
          {(() => {
            const isNutrition = productCategory === 'nutricion'
            const dayTypeCounts: Record<number, Record<string, number>> = {}
            const typeTotals: Record<string, number> = {}

            const nutritionBlockDefaults = [
              'Desayuno',
              'Almuerzo',
              'Merienda',
              'Cena',
              'Colación',
              'Pre-entreno',
              'Post-entreno',
              'Otro'
            ]

            const getNutritionRowLabel = (typeKey: string) => {
              const map: Record<string, string> = {
                desayuno: 'Desayuno',
                almuerzo: 'Almuerzo',
                merienda: 'Merienda',
                cena: 'Cena',
                snack: 'Snack',
                colacion: 'Colación',
                'pre-entreno': 'Pre-entreno',
                'post-entreno': 'Post-entreno',
                otro: 'Otro'
              }
              return map[typeKey] || typeKey.charAt(0).toUpperCase() + typeKey.slice(1)
            }

            DAYS.forEach((day) => {
              const dayEntry = weeklySchedule[currentWeek]?.[day.key]
              const exercises = getExercisesFromDay(dayEntry)
              const counts: Record<string, number> = {}

              const dayBlockNames =
                dayEntry && typeof dayEntry === 'object' && 'blockNames' in dayEntry
                  ? ((dayEntry as any).blockNames as { [key: number]: string })
                  : {}

              exercises.forEach((ex: any) => {
                const fullExercise = availableExercises.find((a: any) => String(a.id) === String(ex.id))

                const normalizedType = (() => {
                  if (isNutrition) {
                    const blockId = Number(ex.block ?? (ex as any)?.bloque ?? 1)
                    const fallbackName = nutritionBlockDefaults[blockId - 1] || 'Otro'
                    const blockName = dayBlockNames?.[blockId] || fallbackName
                    return normalizeNutritionType(String(blockName))
                  }

                  const rawType =
                    fullExercise?.type ||
                    fullExercise?.tipo ||
                    ex.type ||
                    (ex as any)?.tipo ||
                    'General'

                  return normalizeExerciseType(String(rawType))
                })()

                counts[normalizedType] = (counts[normalizedType] || 0) + 1
                typeTotals[normalizedType] = (typeTotals[normalizedType] || 0) + 1
              })

              dayTypeCounts[day.key] = counts
            })

            const typesInWeek = Object.keys(typeTotals)
              .sort((a, b) => (typeTotals[b] || 0) - (typeTotals[a] || 0))

            const rows: React.ReactElement[] = typesInWeek.map((typeKey) => {
              const scheme = getTypeColorScheme(typeKey, isNutrition)
              const typeLabel = isNutrition
                ? getNutritionRowLabel(typeKey)
                : typeKey

              return (
                <div key={`week-${currentWeek}-type-${typeKey}`} className="grid grid-cols-[90px_repeat(7,minmax(0,1fr))] gap-0">
                  <div className="pr-2 py-1 flex items-center">
                    <span
                      className="px-2 py-1 rounded-md border text-xs font-semibold truncate w-full"
                      style={{ color: scheme.hex, borderColor: scheme.hex, backgroundColor: scheme.soft }}
                      title={typeLabel}
                    >
                      {typeLabel}
                    </span>
                  </div>

                  {DAYS.map((day, dayIndex) => {
                    const countForCell = dayTypeCounts[day.key]?.[typeKey] || 0

                    if (countForCell === 0) {
                      return (
                        <button
                          type="button"
                          key={`${currentWeek}-${day.key}-type-${typeKey}`}
                          onClick={() => handleDayClick(day.key)}
                          className="p-2 min-h-[40px] relative flex items-center justify-center w-full"
                        >
                          {dayIndex < 6 && (
                            <div className="absolute right-0 top-0 bottom-0 w-px bg-gray-600/30"></div>
                          )}
                        </button>
                      )
                    }

                    return (
                      <button
                        type="button"
                        key={`${currentWeek}-${day.key}-type-${typeKey}`}
                        onClick={() => handleDayClick(day.key)}
                        className="p-2 min-h-[40px] relative flex items-center justify-center w-full"
                      >
                        <div
                          className="w-9 h-9 rounded-full inline-flex items-center justify-center text-sm font-semibold shrink-0 leading-none"
                          style={{ backgroundColor: scheme.hex, color: '#000000' }}
                        >
                          {countForCell}
                        </div>
                        {dayIndex < 6 && (
                          <div className="absolute right-0 top-0 bottom-0 w-px bg-gray-600/30"></div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )
            })

            return <div className="space-y-1">{rows}</div>
          })()}
        </div>
      </div>

      {/* Lista de ejercicios/platos - sección debajo */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-white font-light text-lg">
            {productCategory === 'nutricion' ? 'Selecciona platos' : 'Selecciona ejercicios'}
          </h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-white/10 bg-white/5 hover:bg-white/10 text-white"
            onClick={() => setIsExerciseSelectorOpen((v) => !v)}
          >
            {isExerciseSelectorOpen
              ? 'Ocultar'
              : (productCategory === 'nutricion' ? 'Agregar platos' : 'Agregar ejercicios')}
          </Button>
        </div>

        {isExerciseSelectorOpen && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div />
              <button
                onClick={() => {
                  // Solo considerar ejercicios activos para seleccionar todos
                  const activeExercises = finalAvailableExercises.filter(ex =>
                    (ex as any).is_active !== false && (ex as any).activo !== false
                  )
                  const allActiveSelected = activeExercises.length > 0 && activeExercises.every(ex => selectedExercises.has(ex.id))
                  if (allActiveSelected) {
                    clearSelection()
                  } else {
                    selectAllExercises()
                  }
                }}
                className="text-[#FF7939] text-sm font-light hover:text-[#FF6B35] transition-colors"
              >
                {(() => {
                  const activeExercises = finalAvailableExercises.filter(ex =>
                    (ex as any).is_active !== false && (ex as any).activo !== false
                  )
                  const allActiveSelected = activeExercises.length > 0 && activeExercises.every(ex => selectedExercises.has(ex.id))
                  return allActiveSelected ? 'Ninguno' : 'Todos'
                })()}
              </button>
            </div>

            {/* Campo de búsqueda */}
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder={`Buscar ${productCategory === 'nutricion' ? 'platos' : 'ejercicios'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-900/40 border-gray-700/70 text-white placeholder:text-gray-500 focus:border-[#FF7939] focus:ring-[#FF7939]"
              />
            </div>

            {/* Totales de macros y calorías para selección (solo nutrición) */}
            {productCategory === 'nutricion' && selectedExercises.size > 0 && (
              <div className="mb-3 text-center">
                <span className="text-xs text-[#FF7939]">
                  P: {selectedNutritionTotals.proteinas}g&nbsp;|&nbsp;
                  C: {selectedNutritionTotals.carbohidratos}g&nbsp;|&nbsp;
                  G: {selectedNutritionTotals.grasas}g&nbsp;|&nbsp;
                  {selectedNutritionTotals.calorias}kcal
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              {(() => {
                // Filtrar ejercicios/platos basado en el término de búsqueda
                const filteredExercises = searchTerm.trim() === ''
                  ? finalAvailableExercises
                  : finalAvailableExercises.filter(ex => {
                    const searchLower = searchTerm.toLowerCase()
                    const name = (ex.name || '').toLowerCase()
                    const description = (ex.description || '').toLowerCase()
                    const type = ((ex.type || ex.tipo) || '').toLowerCase()
                    return name.includes(searchLower) || description.includes(searchLower) || type.includes(searchLower)
                  })

                return filteredExercises.map((exercise) => {
                  const isInactive = (exercise as any).is_active === false || (exercise as any).activo === false

                  // Debug log para verificar estado
                  if (isInactive) {
                    console.log(`🔴 Ejercicio INACTIVO detectado: ${exercise.name} (ID: ${exercise.id}), is_active: ${(exercise as any).is_active}, activo: ${(exercise as any).activo}`)
                  }

                  // Determinar si es nutrición: SOLO por categoría del producto.
                  // Evita mostrar macros en ejercicios fitness aunque vengan campos P/C/G.
                  const isNutrition = productCategory === 'nutricion'

                  // Obtener el tipo normalizado y su esquema de color
                  const exerciseType = isNutrition
                    ? normalizeNutritionType(exercise.type || (exercise as any).tipo || 'otro')
                    : normalizeExerciseType(exercise.type || (exercise as any).tipo || 'General')

                  const scheme = getTypeColorScheme(exerciseType, isNutrition)

                  // Obtener el nombre del tipo para mostrar (capitalizado)
                  const getTypeDisplayName = (type: string) => {
                    const typeMap: Record<string, string> = {
                      'desayuno': 'Desayuno',
                      'almuerzo': 'Almuerzo',
                      'cena': 'Cena',
                      'snack': 'Snack',
                      'merienda': 'Merienda',
                      'colación': 'Colación',
                      'colacion': 'Colación',
                      'pre-entreno': 'Pre-entreno',
                      'post-entreno': 'Post-entreno',
                      'otro': 'Otro'
                    }
                    return typeMap[type.toLowerCase()] || type.charAt(0).toUpperCase() + type.slice(1)
                  }

                  return (
                    <div
                      key={exercise.id}
                      className={`bg-gray-900/40 border border-gray-700/70 rounded-lg p-2 transition-colors ${isInactive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-500'
                        }`}
                      style={(() => {
                        if (isInactive) {
                          return { borderColor: '#3F3F46' }
                        }
                        if (selectedExercises.has(exercise.id)) {
                          // Solo el seleccionado resalta el frame, siempre con el mismo color (sin diferenciar por tipo)
                          return {
                            borderColor: '#FF7939',
                            backgroundColor: 'rgba(255, 121, 57, 0.15)'
                          }
                        }
                        // No aplicar color de tipo al resto; marco neutro
                        return {}
                      })()}
                      onClick={() => !isInactive && toggleExerciseSelection(exercise.id)}
                      title={isInactive ? 'Ejercicio desactivado' : undefined}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0 bg-[#FF7939]"
                          ></div>
                          <p className={`text-xs font-light truncate ${isInactive ? 'text-gray-500 line-through' : 'text-gray-100'}`}>
                            {exercise.name}
                          </p>
                        </div>
                        {/* Ya no mostramos el tipo en la card de selección; solo se usa en la tabla de días (bloques) */}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {isNutrition && exercise.proteinas !== undefined ? (
                          <div className={`text-xs ${isInactive ? 'text-gray-500 line-through' : 'text-gray-400'}`}>
                            <p>
                              P: {exercise.proteinas}g | C: {exercise.carbohidratos}g | G: {exercise.grasas}g
                              {exercise.calorias !== undefined && exercise.calorias !== null && ` | ${exercise.calorias}kcal`}
                            </p>
                          </div>
                        ) : (
                          <>
                            {(() => {
                              const exerciseScheme = getTypeColorScheme(exerciseType, false)
                              return (
                                <p
                                  className={`text-xs px-2 py-1 rounded border ${isInactive ? 'text-gray-500 line-through opacity-50 border-gray-600 bg-transparent' : 'font-medium'}`}
                                  style={
                                    isInactive
                                      ? undefined
                                      : {
                                        color: exerciseScheme.hex,
                                        borderColor: exerciseScheme.hex,
                                        backgroundColor: exerciseScheme.soft
                                      }
                                  }
                                >
                                  {exercise.type || 'General'}
                                </p>
                              )
                            })()}
                            {formatSeriesDisplay(exercise) ? (
                              <p className={`text-xs ${isInactive ? 'text-gray-500 line-through' : 'text-gray-400'}`}>
                                {formatSeriesDisplay(exercise)}
                              </p>
                            ) : null}
                          </>
                        )}
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </>
        )}
      </div>

      {/* Modal para ver/editar ejercicios del día con sistema de bloques */}
      {showDayExercises && selectedDay && (
        <DayExercisesModal
          dayKey={selectedDay}
          dayLabel={DAYS.find(d => d.key === parseInt(selectedDay))?.fullLabel || ''}
          exercises={getExercisesForDay(currentWeek, parseInt(selectedDay))}
          availableExercises={finalAvailableExercises}
          onClose={closeDayExercises}
          onUpdateExercises={(payload) => {
            // Guardar estado actual en historial antes de cambiar
            saveToHistory(JSON.parse(JSON.stringify(weeklySchedule)))

            // ✅ Filtrar ejercicios genéricos del payload antes de guardar
            const exercises = getExercisesFromDay(payload) // Ya filtra genéricos
            const cleanedPayload = Array.isArray(payload)
              ? exercises
              : {
                ...payload,
                exercises: exercises,
                ejercicios: exercises,
                blockCount: exercises.length > 0 ? (payload.blockCount || 1) : 0
              }

            setWeeklySchedule(prev => {
              const newSchedule = { ...prev }
              if (!newSchedule[currentWeek]) {
                newSchedule[currentWeek] = {}
              }
              const dayNumber = parseInt(selectedDay)

              // ✅ Si no hay ejercicios válidos, eliminar el día del schedule
              if (exercises.length === 0) {
                delete newSchedule[currentWeek][dayNumber]
                // Si la semana queda vacía, eliminarla también
                if (Object.keys(newSchedule[currentWeek]).length === 0) {
                  delete newSchedule[currentWeek]
                }
              } else {
                // Manejar tanto ejercicios como información de bloques
                newSchedule[currentWeek][dayNumber] = cleanedPayload
              }

              // Actualizar rastreo de días similares
              const currentDayKey = `${currentWeek}-${dayNumber}`
              const similarDaysList = findSimilarDays(currentDayKey, exercises)
              setSimilarDays(prev => ({
                ...prev,
                [currentDayKey]: similarDaysList
              }))

              // notificar al padre para que persista en estado superior
              if (onScheduleChange) {
                setTimeout(() => onScheduleChange(newSchedule), 0)
              }
              return newSchedule
            })
          }}
          weekNumber={currentWeek}
          blockNames={getBlockNamesForDay(currentWeek, parseInt(selectedDay))}
          blockCountStored={getBlockCountForDay(currentWeek, parseInt(selectedDay))}
          productCategory={productCategory}
          similarDays={similarDaysForCurrentDay}
          onApplyToSimilarDays={(blockNames, exercises, blockCountValue) => {
            // Guardar estado actual en historial antes de aplicar cambios
            saveToHistory(JSON.parse(JSON.stringify(weeklySchedule)))

            // ✅ Filtrar ejercicios genéricos antes de aplicar
            const validExercises = exercises.filter(ex => !isGenericExercise(ex))

            // Aplicar la configuración a todos los días similares
            const currentDayKey = `${currentWeek}-${selectedDay}`
            const currentExercises = getExercisesForDay(currentWeek, parseInt(selectedDay))
            const similarDaysList = findSimilarDays(currentDayKey, currentExercises)

            console.log('🔧 APLICANDO A DÍAS SIMILARES:', {
              currentDay: currentDayKey,
              similarDays: similarDaysList,
              blockNames,
              exercisesOriginales: exercises.length,
              ejerciciosValidos: validExercises.length
            })

            // ✅ Si no hay ejercicios válidos, no aplicar nada
            if (validExercises.length === 0) {
              console.log('⚠️ No hay ejercicios válidos para aplicar a días similares')
              return
            }

            // Actualizar el schedule con todos los cambios (día actual + días similares)
            setWeeklySchedule(prev => {
              const newSchedule = { ...prev }

              // 1. Primero guardar el día actual
              if (!newSchedule[currentWeek]) {
                newSchedule[currentWeek] = {}
              }
              newSchedule[currentWeek][parseInt(selectedDay)] = {
                ejercicios: validExercises,
                exercises: validExercises,
                blockNames: blockNames,
                blockCount: blockCountValue
              }
              console.log('🔧 Día actual guardado:', currentDayKey, newSchedule[currentWeek][parseInt(selectedDay)])

              // 2. Luego aplicar a días similares
              similarDaysList.forEach(dayKey => {
                const [week, day] = dayKey.split('-')
                console.log('🔧 Aplicando a día:', dayKey, 'ejercicios:', validExercises.length, 'bloques:', Object.keys(blockNames).length)

                if (!newSchedule[parseInt(week)]) {
                  newSchedule[parseInt(week)] = {}
                }
                newSchedule[parseInt(week)][parseInt(day)] = {
                  ejercicios: validExercises,
                  exercises: validExercises,
                  blockNames: blockNames,
                  blockCount: blockCountValue
                }
                console.log('🔧 Día similar actualizado:', dayKey, newSchedule[parseInt(week)][parseInt(day)])
              })

              return newSchedule
            })

            // Notificar al padre sobre los cambios
            if (onScheduleChange) {
              setTimeout(() => {
                const updatedSchedule = { ...weeklySchedule }
                // Aplicar los cambios al schedule que se va a notificar
                if (!updatedSchedule[currentWeek]) {
                  updatedSchedule[currentWeek] = {}
                }
                updatedSchedule[currentWeek][parseInt(selectedDay)] = {
                  ejercicios: exercises,
                  exercises: exercises,
                  blockNames: blockNames,
                  blockCount: blockCountValue
                }

                similarDaysList.forEach(dayKey => {
                  const [week, day] = dayKey.split('-')
                  if (!updatedSchedule[parseInt(week)]) {
                    updatedSchedule[parseInt(week)] = {}
                  }
                  updatedSchedule[parseInt(week)][parseInt(day)] = {
                    ejercicios: exercises,
                    exercises: exercises,
                    blockNames: blockNames,
                    blockCount: blockCountValue
                  }
                })

                onScheduleChange(updatedSchedule)
              }, 0)
            }
          }}
        />
      )}
    </div>
  )
}

// Componente del modal de ejercicios del día con sistema de bloques
interface DayExercisesModalProps {
  dayKey: string
  dayLabel: string
  exercises: Exercise[]
  availableExercises: Exercise[]
  onClose: () => void
  onUpdateExercises: (payload: DaySchedulePayload) => void
  weekNumber: number
  blockNames?: { [key: number]: string }
  blockCountStored?: number
  productCategory?: string
  similarDays?: string[]
  onApplyToSimilarDays?: (blockNames: { [key: number]: string }, exercises: Exercise[], blockCount: number) => void
}

function DayExercisesModal({ dayKey, dayLabel, exercises, availableExercises, onClose, onUpdateExercises, weekNumber, blockNames = {}, blockCountStored = 1, productCategory, similarDays = [], onApplyToSimilarDays }: DayExercisesModalProps) {
  const [exercisesLocal, setExercisesLocal] = useState<Exercise[]>([])
  const [blockCount, setBlockCount] = useState(1)
  const [showAvailableExercises, setShowAvailableExercises] = useState(false)
  const [localBlockNames, setLocalBlockNames] = useState<{ [key: number]: string }>({})
  const [allCoachExercisesInModal, setAllCoachExercisesInModal] = useState<Exercise[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchBar, setShowSearchBar] = useState(false)

  const isNutrition = productCategory === 'nutricion'

  // Opciones predefinidas para nombres de bloques
  const blockNameOptions = isNutrition
    ? [
      'Desayuno',
      'Almuerzo',
      'Merienda',
      'Cena',
      'Colación',
      'Pre-entreno',
      'Post-entreno'
    ]
    : Array.from({ length: Math.max(blockCount, 12) }, (_, i) => `Bloque ${i + 1}`)

  // Orden lógico para asignación automática
  const logicalOrder = isNutrition
    ? [
      'Desayuno',
      'Almuerzo',
      'Merienda',
      'Cena',
      'Colación',
      'Pre-entreno',
      'Post-entreno'
    ]
    : []

  // Nombres que se pueden repetir
  const repeatableNames = isNutrition ? ['Pre-entreno', 'Post-entreno'] : []

  // ✅ Cargar TODOS los platos del coach cuando el modal se abre (siempre para nutrición)
  React.useEffect(() => {
    if (isNutrition) {
      const loadAllCoachExercises = async () => {
        try {
          const response = await fetch(`/api/coach/exercises?category=nutricion`)
          if (!response.ok) {
            console.warn('⚠️ [DayExercisesModal] Error cargando todos los platos del coach:', response.status)
            return
          }
          const result = await response.json()
          if (result.success && Array.isArray(result.data)) {
            const exercises: Exercise[] = result.data
              .map((plato: any) => {
                // ✅ Asegurar que siempre haya un nombre válido
                const nombre = plato.nombre || plato.Nombre || plato.name || plato.nombre_plato || ''
                const name = nombre.trim()

                // ✅ Incluir TODOS los platos, incluso si no tienen nombre (usar ID como fallback)
                // NO filtrar platos - mostrar todos los que vienen del backend
                const finalName = name || `Plato ID ${plato.id}`

                return {
                  id: String(plato.id),
                  name: finalName,
                  description: plato.receta || plato.descripcion || '',
                  type: plato.tipo || 'otro',
                  tipo: plato.tipo || 'otro',
                  calories: plato.calorias || 0,
                  calorias: plato.calorias || 0,
                  proteinas: plato.proteinas || 0,
                  carbohidratos: plato.carbohidratos || 0,
                  grasas: plato.grasas || 0,
                  duration: plato.minutos || 0,
                  duracion_min: plato.minutos || 0,
                  is_active: plato.is_active !== false && plato.activo !== false,
                  activo: plato.activo !== false && plato.is_active !== false,
                  dificultad: plato.dificultad || 'Principiante'
                }
              })
            // ✅ NO filtrar - incluir TODOS los platos del backend (20 platos)
            console.log('✅ [DayExercisesModal] Todos los platos del coach cargados:', exercises.length, 'platos:', exercises.map(e => ({ id: e.id, name: e.name })))
            setAllCoachExercisesInModal(exercises)
          }
        } catch (error) {
          console.error('❌ [DayExercisesModal] Error cargando todos los platos del coach:', error)
        }
      }
      loadAllCoachExercises()
    }
  }, [isNutrition])

  // ✅ Para nutrición, SIEMPRE usar todos los platos del coach (allCoachExercisesInModal)
  // Para fitness, usar availableExercises si hay, sino allCoachExercisesInModal
  const exercisesToUse = React.useMemo(() => {
    if (isNutrition) {
      // Para nutrición, SIEMPRE mostrar todos los platos del coach, no solo los del schedule
      if (allCoachExercisesInModal.length > 0) {
        console.log('✅ [DayExercisesModal] Usando todos los platos del coach:', allCoachExercisesInModal.length)
        return allCoachExercisesInModal
      }
      // Si aún no se cargaron, usar availableExercises temporalmente
      console.log('⚠️ [DayExercisesModal] allCoachExercisesInModal vacío, usando availableExercises:', availableExercises.length)
      return availableExercises
    }
    // Para fitness, usar availableExercises si hay, sino allCoachExercisesInModal
    return availableExercises.length > 0 ? availableExercises : allCoachExercisesInModal
  }, [isNutrition, availableExercises, allCoachExercisesInModal])

  // Filtrar ejercicios por búsqueda
  const filteredExercisesToUse = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return exercisesToUse
    }
    const query = searchQuery.toLowerCase().trim()
    return exercisesToUse.filter(exercise => {
      const name = (exercise.name || '').toLowerCase()
      return name.includes(query)
    })
  }, [exercisesToUse, searchQuery])

  const availableExercisesMap = React.useMemo(() => {
    const map = new Map<string, Exercise>()
    exercisesToUse.forEach(exercise => {
      if (exercise && exercise.id !== undefined && exercise.id !== null) {
        const key = String(exercise.id)
        map.set(key, exercise)
        // También agregar con el ID como número si es posible (para compatibilidad)
        if (!isNaN(Number(key)) && !key.includes('-')) {
          map.set(String(Number(key)), exercise)
        }
      }
    })
    console.log('🗺️ [DayExercisesModal] availableExercisesMap construido:', {
      total: map.size,
      keys: Array.from(map.keys()).slice(0, 10),
      sampleExercises: Array.from(map.values()).slice(0, 3).map(ex => ({
        id: ex.id,
        name: ex.name || (ex as any)?.nombre_ejercicio,
        type: ex.type
      }))
    })
    return map
  }, [exercisesToUse])

  const availableExercisesSignature = React.useMemo(() => {
    return exercisesToUse
      .map(ex => `${ex.id}-${ex.name || ''}-${ex.type || ''}-${(ex as any)?.detalle_series || ex.series || ''}-${ex.duration ?? (ex as any)?.duracion_min ?? ''}-${ex.calories ?? (ex as any)?.calorias ?? ''}`)
      .join('|')
  }, [exercisesToUse])

  const mergeExerciseData = React.useCallback(
    (exercise: any, index: number): Exercise => {
      // Si el ejercicio es nulo/undefined (por ejemplo, se eliminó en Paso 4),
      // NO generar un ejercicio genérico. Simplemente devolver un placeholder mínimo
      // que luego será filtrado por la lógica de guardado cuando no haya platos.
      if (!exercise) {
        return {
          id: `deleted-${index}`,
          name: '',
          block: 1,
          type: 'general'
        }
      }

      const exerciseId = exercise.id ?? exercise?.['id']
      const exerciseIdStr = exerciseId !== undefined && exerciseId !== null ? String(exerciseId) : null

      // Buscar en el mapa con diferentes formatos de ID
      let source = exerciseIdStr ? availableExercisesMap.get(exerciseIdStr) : undefined

      // Si no se encuentra, intentar buscar con número (para IDs numéricos)
      if (!source && exerciseIdStr) {
        const exerciseIdNum = Number(exerciseIdStr)
        if (!Number.isNaN(exerciseIdNum) && !exerciseIdStr.includes('-')) {
          // Intentar con el número como string
          source = availableExercisesMap.get(String(exerciseIdNum))
          // También intentar buscar en los valores del mapa por ID numérico
          if (!source) {
            for (const [mapKey, mapValue] of availableExercisesMap.entries()) {
              const mapValueId = mapValue.id
              if (
                (typeof mapValueId === 'number' && mapValueId === exerciseIdNum) ||
                (typeof mapValueId === 'string' && Number(mapValueId) === exerciseIdNum && !isNaN(Number(mapValueId)))
              ) {
                source = mapValue
                console.log('✅ Ejercicio encontrado por ID numérico en valores:', {
                  ejercicioId: exerciseId,
                  ejercicioIdStr: exerciseIdStr,
                  mapKey,
                  mapValueId,
                  nombre: source.name || (source as any)?.nombre_ejercicio
                })
                break
              }
            }
          }
        }
      }

      // Si aún no se encuentra, intentar búsqueda exhaustiva en todas las claves y valores
      if (!source && exerciseIdStr) {
        for (const [mapKey, mapValue] of availableExercisesMap.entries()) {
          const mapKeyNum = Number(mapKey)
          const exerciseIdNum = Number(exerciseIdStr)
          const mapValueId = mapValue.id
          const mapValueIdStr = mapValueId !== undefined && mapValueId !== null ? String(mapValueId) : null

          // Comparar claves
          if (
            mapKey === exerciseIdStr ||
            (exerciseId !== undefined && exerciseId !== null && mapKey === String(exerciseId)) ||
            (!Number.isNaN(mapKeyNum) && !Number.isNaN(exerciseIdNum) && mapKeyNum === exerciseIdNum)
          ) {
            source = mapValue
            console.log('✅ Ejercicio encontrado con búsqueda exhaustiva (por clave):', {
              ejercicioId: exerciseId,
              ejercicioIdStr: exerciseIdStr,
              mapKey,
              nombre: source.name || (source as any)?.nombre_ejercicio
            })
            break
          }

          // Comparar valores del ID
          if (mapValueIdStr && (
            mapValueIdStr === exerciseIdStr ||
            (typeof mapValueId === 'number' && typeof exerciseId === 'number' && mapValueId === exerciseId) ||
            (typeof mapValueId === 'number' && !isNaN(Number(exerciseIdStr)) && mapValueId === Number(exerciseIdStr)) ||
            (typeof exerciseId === 'number' && !isNaN(Number(mapValueIdStr)) && exerciseId === Number(mapValueIdStr))
          )) {
            source = mapValue
            console.log('✅ Ejercicio encontrado con búsqueda exhaustiva (por valor ID):', {
              ejercicioId: exerciseId,
              ejercicioIdStr: exerciseIdStr,
              mapKey,
              mapValueId,
              mapValueIdStr,
              nombre: source.name || (source as any)?.nombre_ejercicio
            })
            break
          }
        }
      }

      // Log si no se encontró
      if (!source && exerciseIdStr) {
        console.log('⚠️ [mergeExerciseData] Ejercicio NO encontrado en mapa:', {
          exerciseId,
          exerciseIdStr,
          exerciseName: exercise.name || (exercise as any)?.nombre_ejercicio,
          mapSize: availableExercisesMap.size,
          mapKeysSample: Array.from(availableExercisesMap.keys()).slice(0, 10),
          mapValuesSample: Array.from(availableExercisesMap.values()).slice(0, 3).map(v => ({
            id: v.id,
            name: v.name || (v as any)?.nombre_ejercicio
          }))
        })
      }

      // ✅ Si aún no se encuentra y el ID es temporal (contiene guión), buscar por coincidencia exacta de string
      // Esto es importante para IDs temporales como "nutrition-0", "nutrition-1", etc.
      if (!source && exerciseIdStr && exerciseIdStr.includes('-')) {
        // Buscar coincidencia exacta de string (para IDs temporales)
        for (const [mapKey, mapValue] of availableExercisesMap.entries()) {
          if (mapKey === exerciseIdStr || String(mapValue.id) === exerciseIdStr) {
            source = mapValue
            console.log('✅ Ejercicio con ID temporal encontrado:', {
              ejercicioId: exerciseId,
              ejercicioIdStr: exerciseIdStr,
              mapKey,
              mapValueId: mapValue.id,
              nombre: source.name || (source as any)?.nombre_ejercicio
            })
            break
          }
        }
      }

      // finalSource es el source encontrado (puede ser null/undefined)
      const finalSource = source

      // Silenciar logs en producción para reducir ruido

      // Priorizar datos del schedule (vienen del backend), luego del source (del paso 4)
      // ✅ NO usar fallback genérico - si no hay nombre, dejar vacío (se enriquecerá después)
      const preferredName =
        exercise.name ||
        exercise.nombre_ejercicio ||
        exercise['Nombre de la Actividad'] ||
        exercise.Nombre ||
        finalSource?.name ||
        (finalSource as any)?.nombre_ejercicio ||
        '' // ✅ Cambiar: en lugar de `Ejercicio ${index + 1}`, usar string vacío

      const preferredDescription =
        exercise.description ||
        exercise.descripcion ||
        exercise['Descripción'] ||
        finalSource?.description ||
        (finalSource as any)?.descripcion ||
        ''

      const preferredType = normalizeExerciseType(
        exercise.type ||
        exercise.tipo ||
        finalSource?.type ||
        (finalSource as any)?.tipo ||
        ''
      )

      const preferredSeries =
        exercise.series ||
        exercise.detalle_series ||
        (finalSource as any)?.detalle_series ||
        finalSource?.series ||
        ''

      const preferredDuration =
        exercise.duration ??
        (exercise as any)?.duracion_min ??
        finalSource?.duration ??
        (finalSource as any)?.duracion_min ??
        null

      const preferredCalories =
        exercise.calories ??
        (exercise as any)?.calorias ??
        finalSource?.calories ??
        (finalSource as any)?.calorias ??
        null

      // Silenciar logs detallados para mejorar performance

      // Construir el objeto merged asegurando que todos los campos estén presentes
      const mergedBase = {
        ...(finalSource || {}),
        ...exercise
      }

      const merged: Exercise = {
        ...mergedBase,
        id: String(exercise.id ?? finalSource?.id ?? `exercise-${index}`),
        name: preferredName,
        nombre_ejercicio: preferredName,
        description: preferredDescription || mergedBase.description || (mergedBase as any)?.descripcion || '',
        descripcion: preferredDescription || (mergedBase as any)?.descripcion || mergedBase.description || '',
        type: preferredType,
        tipo: preferredType,
        series: preferredSeries || mergedBase.series || (mergedBase as any)?.detalle_series || '',
        detalle_series: preferredSeries || (mergedBase as any)?.detalle_series || mergedBase.series || '',
        duration: typeof preferredDuration === 'number' ? preferredDuration : (mergedBase.duration ?? (mergedBase as any)?.duracion_min ?? undefined),
        duracion_min: typeof preferredDuration === 'number' ? preferredDuration : ((mergedBase as any)?.duracion_min ?? mergedBase.duration ?? undefined),
        calories: typeof preferredCalories === 'number' ? preferredCalories : (mergedBase.calories ?? (mergedBase as any)?.calorias ?? undefined),
        calorias: typeof preferredCalories === 'number' ? preferredCalories : ((mergedBase as any)?.calorias ?? mergedBase.calories ?? undefined),
        block: exercise.block ?? exercise.bloque ?? (finalSource as any)?.block ?? 1,
        bloque: exercise.block ?? exercise.bloque ?? (finalSource as any)?.block ?? 1,
        orden: exercise.orden ?? (finalSource as any)?.orden ?? index + 1,
        // Preservar campos adicionales del source
        intensity: mergedBase.intensity || (mergedBase as any)?.intensidad || undefined,
        intensidad: (mergedBase as any)?.intensidad || mergedBase.intensity || undefined,
        equipment: mergedBase.equipment || (mergedBase as any)?.equipo || undefined,
        equipo: (mergedBase as any)?.equipo || mergedBase.equipment || undefined,
        bodyParts: mergedBase.bodyParts || (mergedBase as any)?.body_parts || undefined,
        body_parts: (mergedBase as any)?.body_parts || mergedBase.bodyParts || undefined,
        video_url: (mergedBase as any)?.video_url || undefined
      } as Exercise

      // Silenciar logs en merge final

      return merged
    },
    [availableExercisesMap]
  )

  // Función para asignar automáticamente nombres a los bloques
  const assignBlockNames = (currentBlockNames: { [key: number]: string }, newBlockCount: number) => {
    const newBlockNames = { ...currentBlockNames }

    // Obtener nombres ya asignados
    const assignedNames = Object.values(newBlockNames)

    for (let blockId = 1; blockId <= newBlockCount; blockId++) {
      if (!newBlockNames[blockId]) {
        if (!isNutrition) {
          newBlockNames[blockId] = `Bloque ${blockId}`
          assignedNames.push(newBlockNames[blockId])
          continue
        }

        // Buscar el siguiente nombre disponible en el orden lógico
        let assignedName = null

        // Primero intentar con nombres únicos en orden lógico
        for (const name of logicalOrder) {
          if (!repeatableNames.includes(name) && !assignedNames.includes(name)) {
            assignedName = name
            break
          }
        }

        // Si no hay nombres únicos disponibles, usar nombres repetibles
        if (!assignedName && repeatableNames.length > 0) {
          // Contar cuántas veces se ha usado cada nombre repetible
          const nameCounts: { [key: string]: number } = {}
          for (const name of repeatableNames) {
            nameCounts[name] = assignedNames.filter(n => n === name).length
          }

          // Elegir el nombre repetible menos usado
          const leastUsedName = repeatableNames.reduce((a, b) =>
            nameCounts[a] < nameCounts[b] ? a : b
          )
          assignedName = leastUsedName
        }

        newBlockNames[blockId] = assignedName ?? `Bloque ${blockId}`
        assignedNames.push(newBlockNames[blockId])
      } else if (!isNutrition) {
        newBlockNames[blockId] = `Bloque ${blockId}`
      }
    }

    return newBlockNames
  }

  const syncSignatureRef = useRef<string | null>(null)

  useEffect(() => {
    const exercisesSignature = Array.isArray(exercises)
      ? exercises
        .map((ex) => `${ex?.id ?? ''}-${ex?.block ?? ex?.bloque ?? ''}-${ex?.orden ?? ''}`)
        .join('|')
      : ''
    const blockNamesSignature = blockNames ? JSON.stringify(blockNames) : ''
    const signature = `${blockCountStored}|${blockNamesSignature}|${exercisesSignature}|${availableExercisesSignature}`

    if (syncSignatureRef.current === signature) {
      return
    }
    syncSignatureRef.current = signature

    // ✅ Filtrar ejercicios genéricos o sin nombre válido antes de establecer el estado
    const base = (exercises || [])
      .map((ex, index) => {
        const merged = mergeExerciseData(ex, index)
        return {
          ...merged,
          block: merged.block || 1,
          _originalIndex: index // Guardar índice original para referencia
        }
      })
      .filter((merged) => {
        // Filtrar ejercicios genéricos o sin nombre válido
        const name = merged.name || (merged as any)?.nombre_ejercicio || (merged as any)?.['Nombre de la Actividad'] || (merged as any)?.Nombre || ''

        // ✅ Si el ejercicio tiene un ID válido (temporal o numérico) pero no tiene nombre,
        // verificar si está en availableExercisesMap - si está, usar el nombre del mapa
        const mergedIdStr = merged.id ? String(merged.id) : null
        const hasTemporaryId = mergedIdStr && mergedIdStr.includes('-') &&
          (mergedIdStr.startsWith('nutrition-') || mergedIdStr.startsWith('exercise-'))
        const hasNumericId = mergedIdStr && !isNaN(Number(mergedIdStr)) && !mergedIdStr.includes('-')

        // Si tiene ID válido pero nombre genérico o vacío, verificar si está en availableExercisesMap
        if ((hasTemporaryId || hasNumericId) && (!name || /^Ejercicio\s+\d+$/i.test(name.trim()) || /^Plato\s+\d+$/i.test(name.trim()) || name.trim().startsWith('Ejercicio ') || name.trim().startsWith('Plato '))) {
          let exerciseInMap: Exercise | undefined = undefined

          // Buscar en el mapa con diferentes formatos
          if (mergedIdStr) {
            exerciseInMap = availableExercisesMap.get(mergedIdStr)
            if (!exerciseInMap && hasNumericId) {
              const numericId = Number(mergedIdStr)
              // Buscar en valores del mapa por ID numérico
              for (const [mapKey, mapValue] of availableExercisesMap.entries()) {
                const mapValueId = mapValue.id
                if (
                  (typeof mapValueId === 'number' && mapValueId === numericId) ||
                  (typeof mapValueId === 'string' && Number(mapValueId) === numericId && !isNaN(Number(mapValueId)))
                ) {
                  exerciseInMap = mapValue
                  break
                }
              }
            }
          }

          if (exerciseInMap && (exerciseInMap.name || (exerciseInMap as any)?.nombre_ejercicio)) {
            // El ejercicio está en el mapa y tiene nombre, no filtrarlo
            // Actualizar el nombre del merged con el nombre del mapa
            merged.name = exerciseInMap.name || (exerciseInMap as any)?.nombre_ejercicio
            merged.nombre_ejercicio = merged.name
            console.log('✅ Ejercicio encontrado en mapa, actualizando nombre y no filtrando:', {
              id: merged.id,
              nameOriginal: name,
              nameInMap: exerciseInMap.name || (exerciseInMap as any)?.nombre_ejercicio,
              nameActualizado: merged.name
            })
            return true
          }
        }

        // ✅ Si tiene ID numérico válido, NO filtrar aunque tenga nombre genérico
        // Los nombres genéricos pueden venir del backend cuando los ejercicios aún no se han cargado
        // El nombre se puede actualizar después cuando se carguen los ejercicios disponibles
        const hasValidNumericId = hasNumericId && Number(mergedIdStr) > 0

        if (hasValidNumericId) {
          // Si tiene ID válido, NO filtrar - el nombre se puede obtener después
          console.log('✅ Ejercicio con ID válido, NO filtrando aunque tenga nombre genérico:', { id: merged.id, name, merged })
          return true
        }

        const isGenericName = !name ||
          name.trim() === '' ||
          /^Ejercicio\s+\d+$/i.test(name.trim()) ||
          /^Plato\s+\d+$/i.test(name.trim()) ||
          name.trim().startsWith('Ejercicio ') ||
          name.trim().startsWith('Plato ') ||
          merged.id === `deleted-${(merged as any)._originalIndex}` ||
          String(merged.id || '').startsWith('deleted-')

        if (isGenericName) {
          console.log('🚫 Filtrando ejercicio genérico:', { id: merged.id, name, merged })
          return false
        }
        return true
      })
      .map(({ _originalIndex, ...rest }) => rest) // Remover _originalIndex antes de guardar

    setExercisesLocal(base)

    const maxBlockFromExercises = base.length > 0 ? Math.max(...base.map(ex => ex.block || 1)) : 1
    const storedCount = Math.max(1, blockCountStored || 1)
    const initialCount = Math.max(storedCount, maxBlockFromExercises)
    setBlockCount(initialCount)

    // Inicializar nombres de bloques con asignación automática
    const initialBlockNames = assignBlockNames(blockNames, initialCount)
    setLocalBlockNames(initialBlockNames)
  }, [exercises, blockNames, blockCountStored, mergeExerciseData, availableExercisesSignature])

  const distributeEvenly = (newCount: number) => {
    const total = exercisesLocal.length
    if (newCount < 1) newCount = 1
    const perBlock = Math.ceil(total / newCount)
    const reassigned = exercisesLocal.map((ex, idx) => ({
      ...ex,
      block: Math.floor(idx / perBlock) + 1,
    }))
    setBlockCount(newCount)
    setExercisesLocal(reassigned)

    // Asignar automáticamente nombres a los bloques
    const newBlockNames = assignBlockNames(localBlockNames, newCount)
    setLocalBlockNames(newBlockNames)
  }

  const saveChanges = () => {
    // ✅ Filtrar ejercicios sin nombre válido (eliminados/genéricos)
    const validExercises = exercisesLocal.filter(ex => {
      const name = ex.name || (ex as any)?.nombre_ejercicio || (ex as any)?.['Nombre de la Actividad'] || (ex as any)?.Nombre || ''
      const isGenericName = !name ||
        name.trim() === '' ||
        /^Ejercicio\s+\d+$/i.test(name.trim()) ||
        /^Plato\s+\d+$/i.test(name.trim()) ||
        name.trim().startsWith('Ejercicio ') ||
        name.trim().startsWith('Plato ') ||
        ex.id === `deleted-${exercisesLocal.indexOf(ex)}` ||
        String(ex.id || '').startsWith('deleted-')

      if (isGenericName) {
        console.log('🚫 Guardando: Filtrando ejercicio genérico:', { id: ex.id, name, ex })
        return false
      }
      return true
    })

    // Si no hay ejercicios válidos, guardar array vacío
    if (validExercises.length === 0) {
      const payload: DaySchedulePayload = {
        exercises: [],
        ejercicios: [],
        blockCount: 0, // ✅ 0 bloques si está vacío
        blockNames: {}
      }
      onUpdateExercises(payload)
      onClose()
      return
    }

    // Incluir información de bloques en el payload
    // 1) Recalcular cantidad real de bloques (solo bloques con ejercicios válidos)
    const maxBlockUsed = validExercises.length > 0 ? Math.max(...validExercises.map(ex => ex.block || 1)) : 0
    const finalBlockCount = Math.max(0, maxBlockUsed) // ✅ Puede ser 0 si está vacío

    // 2) Podar nombres de bloques que queden vacíos
    const prunedBlockNames: { [key: number]: string } = {}
    for (let i = 1; i <= finalBlockCount; i++) {
      // Solo incluir bloques que realmente tienen ejercicios
      const hasExercisesInBlock = validExercises.some(ex => (ex.block || 1) === i)
      if (hasExercisesInBlock && localBlockNames[i]) {
        prunedBlockNames[i] = localBlockNames[i]
      }
    }

    const payload: DaySchedulePayload = {
      exercises: validExercises,
      ejercicios: validExercises,
      blockCount: finalBlockCount,
      blockNames: prunedBlockNames
    }
    onUpdateExercises(payload)
    onClose()
  }

  const applyToSimilarDays = () => {
    if (onApplyToSimilarDays) {
      onApplyToSimilarDays(localBlockNames, exercisesLocal, blockCount)
    }
    onClose()
  }

  const moveUp = (index: number) => {
    if (index <= 0) return
    const newList = [...exercisesLocal]
    const temp = newList[index - 1]
    newList[index - 1] = newList[index]
    newList[index] = temp
    setExercisesLocal(newList)
  }

  const moveDown = (index: number) => {
    if (index >= exercisesLocal.length - 1) return
    const newList = [...exercisesLocal]
    const temp = newList[index + 1]
    newList[index + 1] = newList[index]
    newList[index] = temp
    setExercisesLocal(newList)
  }

  const moveToPrevBlock = (index: number) => {
    setExercisesLocal(prev => {
      const list = [...prev]
      const ex = { ...list[index] }
      ex.block = Math.max(1, (ex.block || 1) - 1)
      list[index] = ex
      return list
    })
  }

  const moveToNextBlock = (index: number) => {
    setExercisesLocal(prev => {
      const list = [...prev]
      const ex = { ...list[index] }
      ex.block = Math.min(blockCount, (ex.block || 1) + 1)
      list[index] = ex
      return list
    })
  }

  // Reordenar dentro del mismo bloque; si está en el borde, mover de bloque
  const moveUpInBlock = (index: number) => {
    setExercisesLocal(prev => {
      const list = [...prev]
      const current = list[index]
      const currentBlock = current.block || 1
      // Buscar el índice anterior del mismo bloque
      let prevIdx = index - 1
      while (prevIdx >= 0 && (list[prevIdx].block || 1) !== currentBlock) prevIdx--
      if (prevIdx >= 0) {
        const tmp = list[prevIdx]
        list[prevIdx] = current
        list[index] = tmp
      } else {
        // Está al tope del bloque → pasar al bloque anterior
        current.block = Math.max(1, currentBlock - 1)
        list[index] = current
      }
      return list
    })
  }

  const moveDownInBlock = (index: number) => {
    setExercisesLocal(prev => {
      const list = [...prev]
      const current = list[index]
      const currentBlock = current.block || 1
      // Buscar el índice siguiente del mismo bloque
      let nextIdx = index + 1
      while (nextIdx < list.length && (list[nextIdx].block || 1) !== currentBlock) nextIdx++
      if (nextIdx < list.length) {
        const tmp = list[nextIdx]
        list[nextIdx] = current
        list[index] = tmp
      } else {
        // Está al final del bloque → pasar al bloque siguiente
        current.block = Math.min(blockCount, currentBlock + 1)
        list[index] = current
      }
      return list
    })
  }

  // Sin bloques: solo reordenar arriba/abajo

  const removeAt = (index: number) => {
    setExercisesLocal(prev => prev.filter((_, i) => i !== index))
  }

  const addFromAvailable = (exercise: Exercise) => {
    console.log('🔵 [DayExercisesModal] addFromAvailable llamado:', {
      id: exercise.id,
      name: exercise.name,
      is_active: (exercise as any).is_active,
      activo: (exercise as any).activo,
      exercisesLocalLength: exercisesLocal.length
    })

    // No permitir agregar ejercicios inactivos
    if ((exercise as any).is_active === false || (exercise as any).activo === false) {
      console.log('⚠️ Intento de agregar ejercicio desactivado:', exercise.name)
      return
    }

    // Agregando ejercicio desde disponibles
    // Permitir duplicados - agregar siempre
    // Asegurar que el ejercicio tenga un bloque asignado (usar el primer bloque si no tiene)
    const exerciseWithBlock = {
      ...exercise,
      block: exercise.block || 1,
      orden: exercise.orden || exercisesLocal.length + 1
    }

    setExercisesLocal(prev => {
      const newList = [...prev, exerciseWithBlock]
      console.log('✅ [DayExercisesModal] Ejercicio agregado al estado:', {
        id: exercise.id,
        name: exercise.name,
        block: exerciseWithBlock.block,
        totalAnterior: prev.length,
        totalNuevo: newList.length
      })
      return newList
    })
  }

  return (
    <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div className="bg-black p-4 md:p-6 pt-20 w-screen h-full max-w-4xl mx-auto overflow-hidden flex flex-col relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-white text-2xl font-bold">{dayLabel} - Semana {weekNumber}</h3>
            <p className="text-gray-400 text-sm">Organiza {isNutrition ? 'platos' : 'ejercicios'} en bloques</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Botón Vaciar día */}
            <button
              type="button"
              onClick={() => setExercisesLocal([])}
              className="text-xs text-[#FF7939] hover:text-[#FF6B35] transition-colors"
            >
              Vaciar
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-xl leading-none"
              title="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="overflow-auto flex-1 pb-[400px]">
          {/* Controles de bloques (+ / -) con distribución equitativa */}
          <div className="flex items-center justify-between mb-4 w-full">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-white text-sm">Bloques:</span>
              <button
                onClick={() => distributeEvenly(Math.max(1, blockCount - 1))}
                className="w-7 h-7 rounded-md border border-[#FF7939] text-[#FF7939] hover:bg-[#FF7939]/10 flex items-center justify-center"
              >
                -
              </button>
              <span className="text-[#FF7939] text-sm w-6 text-center">{blockCount}</span>
              <button
                onClick={() => {
                  const maxBlocksNutrition = blockNameOptions.length
                  const nextCount = isNutrition
                    ? Math.min(maxBlocksNutrition, blockCount + 1)
                    : blockCount + 1
                  distributeEvenly(nextCount)
                }}
                className="w-7 h-7 rounded-md border border-[#FF7939] text-[#FF7939] hover:bg-[#FF7939]/10 flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
          {/* (Guardado en línea con acciones al pie; se quitó este botón superior) */}

          {/* Bloques en grilla responsive para aprovechar el ancho */}
          <div className="mb-6 grid grid-cols-1 gap-4 w-full px-0">
            {exercisesLocal.length === 0 && (
              <div className="text-gray-400 text-sm col-span-full">No hay {isNutrition ? 'platos' : 'ejercicios'} en este día.</div>
            )}
            {/* Solo mostrar bloques que tienen ejercicios - NO mostrar bloques vacíos */}
            {Array.from({ length: blockCount }, (_, i) => i + 1)
              .map((blockId) => {
                const items = exercisesLocal
                  .map((ex, idx) => ({ ex, idx }))
                  .filter(({ ex }) => (ex.block || 1) === blockId)
                return { blockId, items }
              })
              .filter(({ items }) => items.length > 0) // ✅ FILTRAR: Solo mostrar bloques con ejercicios
              .map(({ blockId, items }) => {
                return (
                  <div key={`block-${blockId}`} className="bg-transparent rounded-none p-0 border-0 w-full">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {isNutrition ? (
                          <select
                            value={
                              localBlockNames[blockId] ||
                              blockNameOptions[blockId - 1] ||
                              blockNameOptions[blockNameOptions.length - 1] ||
                              `Bloque ${blockId}`
                            }
                            onChange={(e) => setLocalBlockNames(prev => ({ ...prev, [blockId]: e.target.value }))}
                            className="bg-gray-800 border border-gray-600 rounded-md px-2 py-1 text-white text-sm focus:outline-none focus:border-[#FF7939]"
                          >
                            {blockNameOptions.map((option) => (
                              <option key={option} value={option} className="bg-gray-800">
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-sm text-white font-medium">
                            {localBlockNames[blockId] || `Bloque ${blockId}`}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {items.length} {productCategory === 'nutricion' ? 'platos' : 'ejercicios'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {items.map(({ ex, idx }) => {
                        // Renderizando ejercicio en bloque
                        const inactive = (ex as any).is_active === false || (ex as any).activo === false

                        // Buscar ejercicio completo en availableExercises usando el ID (probar diferentes formatos)
                        let fullExercise = null
                        if (ex.id) {
                          // Probar coincidencia exacta primero
                          fullExercise = availableExercises.find(ae => ae.id === ex.id)

                          // Si no se encuentra, probar con conversión de tipos
                          if (!fullExercise) {
                            const exIdNum = Number(ex.id)
                            const exIdStr = String(ex.id)
                            fullExercise = availableExercises.find(ae => {
                              const aeId = ae.id
                              const aeIdStr = String(aeId)
                              const aeIdNum = Number(aeId)
                              return (
                                (typeof aeId === 'number' && aeId === exIdNum) ||
                                (typeof aeId === 'string' && aeId === exIdStr) ||
                                (!Number.isNaN(aeIdNum) && !Number.isNaN(exIdNum) && aeIdNum === exIdNum) ||
                                aeIdStr === exIdStr
                              )
                            })
                          }

                          // Si aún no se encuentra, buscar por nombre como último recurso
                          if (!fullExercise && ex.name) {
                            fullExercise = availableExercises.find(ae =>
                              ae.name === ex.name ||
                              (ae as any).nombre_ejercicio === ex.name ||
                              ae.name === (ex as any).nombre_ejercicio ||
                              (ae as any).nombre_ejercicio === (ex as any).nombre_ejercicio
                            )
                          }
                        }

                        // Buscar nombre en todos los campos posibles (priorizar availableExercises, luego merged exercise)
                        // ✅ NO generar nombres genéricos - si no hay nombre, no mostrar el ejercicio
                        const displayTitle =
                          fullExercise?.name ||
                          (fullExercise as any)?.nombre_ejercicio ||
                          ex.name ||
                          (ex as any)?.nombre_ejercicio ||
                          (ex as any)?.['Nombre de la Actividad'] ||
                          (ex as any)?.Nombre ||
                          '' // ✅ Cambiar: en lugar de `Ejercicio ${idx + 1}`, usar string vacío

                        // ✅ Si no hay nombre válido O es un nombre genérico, no renderizar este ejercicio
                        const isGenericName = displayTitle.trim() === '' ||
                          /^Ejercicio\s+\d+$/i.test(displayTitle.trim()) ||
                          /^Plato\s+\d+$/i.test(displayTitle.trim()) ||
                          displayTitle.trim().startsWith('Ejercicio ') ||
                          displayTitle.trim().startsWith('Plato ') ||
                          ex.id === `deleted-${idx}` ||
                          String(ex.id || '').startsWith('deleted-')

                        if (!displayTitle || displayTitle.trim() === '' || isGenericName) {
                          return null
                        }

                        // Determinar si es nutrición: SOLO por categoría del producto.
                        // Evita mostrar macros en ejercicios fitness aunque vengan campos P/C/G.
                        const isNutrition = productCategory === 'nutricion'

                        // Buscar tipo en todos los campos posibles (priorizar availableExercises)
                        const normalizedTypeLabel =
                          fullExercise?.type ||
                          fullExercise?.tipo ||
                          ex.type ||
                          (ex as any)?.tipo ||
                          (isNutrition ? 'otro' : 'General')

                        // Normalizar el tipo según si es nutrición o ejercicio
                        const normalizedType = isNutrition
                          ? normalizeNutritionType(normalizedTypeLabel)
                          : normalizeExerciseType(normalizedTypeLabel)

                        const typeColorScheme = getTypeColorScheme(normalizedType, isNutrition)

                        // Obtener el nombre del tipo para mostrar (capitalizado)
                        const getTypeDisplayName = (type: string) => {
                          const typeMap: Record<string, string> = {
                            'desayuno': 'Desayuno',
                            'almuerzo': 'Almuerzo',
                            'cena': 'Cena',
                            'snack': 'Snack',
                            'merienda': 'Merienda',
                            'colación': 'Colación',
                            'colacion': 'Colación',
                            'pre-entreno': 'Pre-entreno',
                            'post-entreno': 'Post-entreno',
                            'otro': 'Otro'
                          }
                          return typeMap[type.toLowerCase()] || type.charAt(0).toUpperCase() + type.slice(1)
                        }
                        // Buscar series en todos los campos posibles (priorizar availableExercises)
                        const displaySeries =
                          fullExercise?.detalle_series ||
                          (fullExercise as any)?.detalle_series ||
                          formatSeriesDisplay(fullExercise || ex) ||
                          (ex as any)?.detalle_series ||
                          ex.detalle_series ||
                          formatSeriesDisplay(ex) ||
                          (ex.series ? String(ex.series) : null)

                        // Buscar duración en todos los campos posibles (priorizar availableExercises)
                        const durationValue =
                          fullExercise?.duration ??
                          fullExercise?.duracion_min ??
                          (fullExercise as any)?.duration ??
                          ex.duration ??
                          (ex as any)?.duracion_min ??
                          (ex as any)?.duration ??
                          null

                        // Buscar calorías en todos los campos posibles (priorizar availableExercises)
                        const caloriesValue =
                          fullExercise?.calories ??
                          fullExercise?.calorias ??
                          (fullExercise as any)?.calories ??
                          ex.calories ??
                          (ex as any)?.calorias ??
                          (ex as any)?.calories ??
                          null
                        return (
                          <div
                            key={`${ex.id}-${idx}`}
                            className={`rounded-md p-3 transition-colors w-full ${inactive ? 'bg-gray-900/10 border border-gray-800/50' : 'bg-gray-900/20'}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${inactive ? 'text-gray-500 line-through' : 'text-white'}`}>{displayTitle}</p>
                                <div className={`flex flex-wrap items-center gap-2 text-xs mt-1 ${inactive ? 'text-gray-500' : 'text-gray-400'}`}>
                                  {isNutrition && (fullExercise?.proteinas !== undefined || ex.proteinas !== undefined) ? (
                                    <span>
                                      P: {fullExercise?.proteinas ?? ex.proteinas}g | C: {fullExercise?.carbohidratos ?? ex.carbohidratos}g | G: {fullExercise?.grasas ?? ex.grasas}g
                                      {caloriesValue !== null && caloriesValue !== undefined && ` | ${caloriesValue}kcal`}
                                    </span>
                                  ) : (
                                    <>
                                      <span
                                        className={`px-2 py-0.5 rounded border ${inactive ? 'text-gray-500 line-through opacity-60 border-gray-600' : 'font-medium'
                                          }`}
                                        style={
                                          inactive
                                            ? undefined
                                            : {
                                              color: typeColorScheme.hex,
                                              borderColor: typeColorScheme.hex,
                                              backgroundColor: typeColorScheme.soft
                                            }
                                        }
                                      >
                                        {isNutrition ? getTypeDisplayName(normalizedType) : normalizedTypeLabel}
                                      </span>
                                      {displaySeries && (
                                        <span className={inactive ? 'line-through' : undefined}>{displaySeries}</span>
                                      )}
                                      {typeof caloriesValue === 'number' && caloriesValue > 0 && (
                                        <span className={inactive ? 'line-through' : undefined}>{caloriesValue} kcal</span>
                                      )}
                                      {typeof durationValue === 'number' && (
                                        <span className={inactive ? 'line-through' : undefined}>{durationValue} min</span>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button onClick={() => moveUpInBlock(idx)} className="w-7 h-7 rounded-md border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center">
                                  <ChevronUp className="w-4 h-4" />
                                </button>
                                <button onClick={() => moveDownInBlock(idx)} className="w-7 h-7 rounded-md border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center">
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                                <button onClick={() => removeAt(idx)} className="w-7 h-7 rounded-md border border-red-500/50 text-red-400 hover:text-red-300 hover:border-red-400 flex items-center justify-center">
                                  ✕
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
          </div>

          {/* Botón + ejercicios/platos con desplegable y búsqueda */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white text-base font-bold uppercase tracking-wider">
                {isNutrition ? 'Selecciona platos' : 'Selecciona ejercicios'}
              </h4>
              <button
                onClick={() => setShowAvailableExercises(!showAvailableExercises)}
                className="flex items-center gap-2 text-[#FF7939] hover:text-white transition-colors"
              >
                <span className="text-xl">+</span>
                <span>{isNutrition ? 'platos' : 'ejercicios'}</span>
              </button>
            </div>
            {/* Icono de búsqueda SIEMPRE visible debajo del título "Selecciona platos" */}
            {(() => {
              console.log('🔍 [DayExercisesModal] Verificando visibilidad del icono de búsqueda:', { isNutrition, productCategory })
              return null
            })()}
            {isNutrition && (
              <div className="mb-3 flex items-center gap-2">
                <button
                  onClick={() => {
                    console.log('🔍 [DayExercisesModal] Click en icono de búsqueda, showSearchBar actual:', showSearchBar)
                    setShowSearchBar(!showSearchBar)
                    if (!showSearchBar) {
                      setSearchQuery('')
                    }
                  }}
                  className="text-[#FF7939] hover:text-[#FF6B35] transition-colors p-1.5 flex-shrink-0"
                  title="Buscar platos"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                </button>
                {showSearchBar && (
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar plato..."
                    className="flex-1 bg-gray-800 border border-gray-600 rounded-md px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#FF7939]"
                    autoFocus
                  />
                )}
              </div>
            )}
            {showAvailableExercises && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-96 overflow-y-auto">
                {(() => {
                  console.log('🔍 [DayExercisesModal] Renderizando platos:', {
                    filteredCount: filteredExercisesToUse.length,
                    totalCount: exercisesToUse.length,
                    allCoachCount: allCoachExercisesInModal.length,
                    availableCount: availableExercises.length,
                    isNutrition,
                    showAvailableExercises,
                    exerciseNames: filteredExercisesToUse.map(e => e.name)
                  })
                  return null
                })()}
                {filteredExercisesToUse.map((exercise) => {
                  const isInactive = (exercise as any).is_active === false || (exercise as any).activo === false
                  const handleClick = (e: React.MouseEvent) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('🖱️ [DayExercisesModal] Click en plato:', {
                      id: exercise.id,
                      name: exercise.name,
                      isInactive,
                      exercisesLocalLength: exercisesLocal.length
                    })
                    if (!isInactive) {
                      addFromAvailable(exercise)
                    } else {
                      console.log('⚠️ [DayExercisesModal] Intento de agregar plato inactivo bloqueado')
                    }
                  }
                  return (
                    <div
                      key={exercise.id}
                      onClick={handleClick}
                      onMouseDown={(e) => e.preventDefault()} // Prevenir comportamiento por defecto
                      className={`rounded-lg p-2 transition-colors ${isInactive
                        ? 'bg-gray-800/10 opacity-50 cursor-not-allowed border border-gray-700/50'
                        : 'bg-gray-800/30 cursor-pointer hover:bg-gray-800/50 active:bg-gray-800/70'
                        }`}
                      title={isInactive ? (isNutrition ? 'Plato desactivado - no se puede agregar' : 'Ejercicio desactivado - no se puede agregar') : `Click para agregar ${exercise.name}`}
                    >
                      {(() => {
                        // Determinar si es nutrición
                        const isNutrition = productCategory === 'nutricion' ||
                          exercise.proteinas !== undefined ||
                          exercise.carbohidratos !== undefined ||
                          exercise.grasas !== undefined ||
                          allowedNutritionTypes.includes((exercise.type || '').toLowerCase())

                        // Obtener el tipo normalizado
                        const exerciseType = isNutrition
                          ? normalizeNutritionType(exercise.type || (exercise as any).tipo || 'otro')
                          : normalizeExerciseType(exercise.type || (exercise as any).tipo || 'General')

                        const scheme = getTypeColorScheme(exerciseType, isNutrition)

                        // Obtener el nombre del tipo para mostrar (capitalizado)
                        const getTypeDisplayName = (type: string) => {
                          const typeMap: Record<string, string> = {
                            'desayuno': 'Desayuno',
                            'almuerzo': 'Almuerzo',
                            'cena': 'Cena',
                            'snack': 'Snack',
                            'merienda': 'Merienda',
                            'colación': 'Colación',
                            'colacion': 'Colación',
                            'pre-entreno': 'Pre-entreno',
                            'post-entreno': 'Post-entreno',
                            'otro': 'Otro'
                          }
                          return typeMap[type.toLowerCase()] || type.charAt(0).toUpperCase() + type.slice(1)
                        }

                        return (
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-medium truncate ${isInactive ? 'text-gray-500 line-through' : 'text-white'}`}>{exercise.name}</p>
                              {isNutrition && exercise.proteinas !== undefined ? (
                                <p className={`text-xs ${isInactive ? 'text-gray-500 line-through' : 'text-gray-400'}`}>
                                  P: {exercise.proteinas}g | C: {exercise.carbohidratos}g | G: {exercise.grasas}g
                                  {exercise.calorias !== undefined && exercise.calorias !== null && ` | ${exercise.calorias}kcal`}
                                </p>
                              ) : (
                                <div className={`flex flex-wrap items-center gap-2 text-xs ${isInactive ? 'text-gray-500 line-through' : 'text-gray-400'}`}>
                                  <span
                                    className={`px-2 py-0.5 rounded border ${isInactive ? 'border-gray-700 text-gray-500' : ''}`}
                                    style={
                                      isInactive
                                        ? undefined
                                        : { color: scheme.hex, borderColor: scheme.hex, backgroundColor: scheme.soft }
                                    }
                                  >
                                    {exercise.type || (exercise as any).tipo || 'General'}
                                  </span>
                                </div>
                              )}
                            </div>

                            {!isNutrition && (
                              <div className={`flex flex-col items-end text-xs whitespace-nowrap ${isInactive ? 'text-gray-500 line-through' : 'text-gray-400'}`}>
                                {(exercise.calorias !== undefined && exercise.calorias !== null) && (
                                  <span>{exercise.calorias} kcal</span>
                                )}
                                {((exercise as any).duracion_min !== undefined && (exercise as any).duracion_min !== null) && (
                                  <span>{(exercise as any).duracion_min} min</span>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Información de días similares */}
          {similarDays.length > 0 && (
            <div className="text-sm text-gray-400 mb-4 text-center">
              También aplica a: {similarDays.map(day => {
                const [week, dayNum] = day.split('-')
                const dayName = DAYS.find(d => d.key === parseInt(dayNum))?.fullLabel || `Día ${dayNum}`
                return `Semana ${week} - ${dayName}`
              }).join(', ')}
            </div>
          )}

        </div>
        {/* Botones de acción (fixed bottom to ensure visibility) */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm pt-6 pb-12 border-t border-white/10 flex items-center justify-center z-[110]">
          <div className="flex items-center gap-3">
            {similarDays.length > 0 && (
              <button
                onClick={applyToSimilarDays}
                className="px-4 py-1.5 rounded-full bg-black text-[#FF7939] border border-[#FF7939]/40 hover:bg-gray-900 transition-colors text-sm"
                title="Aplicar a días similares"
              >
                Aplicar a días similares
              </button>
            )}
            <button
              onClick={saveChanges}
              className="px-4 py-1.5 rounded-full bg-black text-[#FF7939] border border-[#FF7939]/40 hover:bg-gray-900 transition-colors text-sm"
              title="Guardar cambios"
            >
              Guardar
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
