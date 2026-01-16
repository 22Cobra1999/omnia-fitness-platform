"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, Calendar, Clock, Flame, Edit, RotateCcw, ChevronDown, Check, X, Trash2, Save, List } from "lucide-react"
import { Switch } from '@/components/ui/switch'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/supabase-client'

interface ClientCalendarProps {
  clientId: string
  onLastWorkoutUpdate?: (lastWorkoutDate: string | null) => void
  onDaySelected?: () => void
  exercisesListRef?: React.RefObject<HTMLDivElement | null>
}

interface ExerciseExecution {
  id: string
  ejercicio_id: string
  completado: boolean
  fecha_ejercicio: string
  duracion?: number
  calorias_estimadas?: number
  nutricion_macros?: {
    proteinas?: number
    carbohidratos?: number
    grasas?: number
    calorias?: number
    minutos?: number
  } | null
  nutrition_record_id?: string
  nutrition_key?: string
  nutrition_bloque?: number
  nutrition_orden?: number
  is_nutricion?: boolean
  nota_cliente?: string
  ejercicio_nombre?: string
  actividad_titulo?: string
  actividad_id?: number
  actividad_coach_id?: string | number | null
  enrollment_id?: number
  version?: number
  detalle_series?: any | null
  ejercicioKeys?: string[] // Keys en detalles_series para este ejercicio (ej: ["1042_1", "1042_2"])
  minutosJson?: any // Minutos JSON del registro para acceder a minutos por bloque
  caloriasJson?: any // Calorías JSON del registro para acceder a kcal por bloque
  original_ejercicio_id?: string // Para limpiar el ejercicio anterior al guardar si se cambió
  receta_texto?: string // Texto de la receta (override o default)
  ingredientes_detalle?: any // Objeto de ingredientes para este plato
}

interface DayData {
  date: string
  exerciseCount: number
  completedCount: number
  totalMinutes: number
  exercises: ExerciseExecution[]
  activities: string[]
}

interface ClientDaySummaryRow {
  id: string
  client_id: string
  day: string
  activity_id: number | null
  calendar_event_id: string | null
  activity_title: string | null
  coach_id: string | null
  fitness_mins: number | null
  nutri_mins: number | null
  calendar_mins: number | null
  total_mins: number | null
}

interface ActivityFilterOption {
  enrollment_id: number
  activity_id: number
  title: string
  version: number
  type?: string
}

export function ClientCalendar({ clientId, onLastWorkoutUpdate, onDaySelected, exercisesListRef }: ClientCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [dayData, setDayData] = useState<{ [key: string]: DayData }>({})
  const [loading, setLoading] = useState(true)
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [monthPickerYear, setMonthPickerYear] = useState<number>(() => new Date().getFullYear())
  const [selectedDayExercises, setSelectedDayExercises] = useState<ExerciseExecution[]>([])
  const [editingOriginalExercise, setEditingOriginalExercise] = useState<ExerciseExecution | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [newDate, setNewDate] = useState<Date | null>(null)
  const [editingDate, setEditingDate] = useState<Date | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isSelectingNewDate, setIsSelectingNewDate] = useState(false)
  const [applyToAllSameDays, setApplyToAllSameDays] = useState(false)
  const [selectedActivityIdsForDateChange, setSelectedActivityIdsForDateChange] = useState<string[]>([])
  const [selectedDayForEdit, setSelectedDayForEdit] = useState<Date | null>(null)
  const [targetDayForEdit, setTargetDayForEdit] = useState<Date | null>(null)
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null)
  const [editingSeries, setEditingSeries] = useState<any[]>([])
  const [availableExercises, setAvailableExercises] = useState<any[]>([])
  const [showExerciseDropdown, setShowExerciseDropdown] = useState(false)

  const [otherMinutesByDate, setOtherMinutesByDate] = useState<Record<string, number>>({})

  const [summaryRowsByDate, setSummaryRowsByDate] = useState<Record<string, ClientDaySummaryRow[]>>({})
  const [activityDetailsByKey, setActivityDetailsByKey] = useState<Record<string, ExerciseExecution[]>>({})
  const [expandedActivityKeys, setExpandedActivityKeys] = useState<Record<string, boolean>>({})

  const [activityFilterOptions, setActivityFilterOptions] = useState<ActivityFilterOption[]>([])
  const [activeEnrollmentFilterId, setActiveEnrollmentFilterId] = useState<number | null>(null)

  const [editingNutritionId, setEditingNutritionId] = useState<string | null>(null)
  const [editingNutritionMacros, setEditingNutritionMacros] = useState<{ proteinas: string; carbohidratos: string; grasas: string; calorias: string; minutos: string } | null>(null)
  const [editingNutritionPlateId, setEditingNutritionPlateId] = useState<string | null>(null)
  const [nutritionPlateOptionsByActivity, setNutritionPlateOptionsByActivity] = useState<Record<string, any[]>>({})
  const [confirmDeleteNutritionId, setConfirmDeleteNutritionId] = useState<string | null>(null)

  const [showRecipeModal, setShowRecipeModal] = useState(false)
  const [editingRecipeText, setEditingRecipeText] = useState('')

  const [showIngredientsModal, setShowIngredientsModal] = useState(false)
  const [editingIngredientsList, setEditingIngredientsList] = useState<any[]>([])
  const [editingNutritionExercise, setEditingNutritionExercise] = useState<ExerciseExecution | null>(null)



  // Cascade Modal State
  const [cascadeModal, setCascadeModal] = useState<{
    isOpen: boolean
    type: 'fitness' | 'nutrition'
    mode: 'swap' | 'update'
    sourceDate: string
    sourceDayName: string
    itemName: string
    payload: any
  } | null>(null)

  const internalExercisesListRef = useRef<HTMLDivElement | null>(null)
  const dayDetailRef = exercisesListRef ?? internalExercisesListRef
  const router = useRouter()

  const supabase = createClient()

  const [currentCoachId, setCurrentCoachId] = useState<string | null>(null)
  const [eventDetailsByKey, setEventDetailsByKey] = useState<Record<string, any>>({})

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          const { data, error } = await supabase.auth.getUser()
          if (!mounted) return
          if (error) {
            setCurrentCoachId(null)
            return
          }
          setCurrentCoachId(data?.user?.id ?? null)
        } catch {
          if (!mounted) return
          setCurrentCoachId(null)
        }
      })()
    return () => {
      mounted = false
    }
  }, [supabase])

  const loadEventDetails = async (eventId: string) => {
    if (!eventId || eventDetailsByKey[eventId]) return
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (!error && data) {
        setEventDetailsByKey(prev => ({ ...prev, [eventId]: data }))
      }
    } catch {
      // ignore
    }
  }

  const formatMinutesCompact = (totalMinutes: number | null | undefined): string => {
    const mins = Number(totalMinutes || 0)
    if (!Number.isFinite(mins) || mins <= 0) return ''
    const h = Math.floor(mins / 60)
    const m = mins % 60
    if (h > 0 && m > 0) return `${h}h ${m}m`
    if (h > 0) return `${h}h`
    return `${m}m`
  }

  const getExerciseMinutes = (ex: ExerciseExecution): number => {
    const minsFromFitness = Number(ex.duracion ?? 0) || 0
    const minsFromNutri = Number(ex.nutricion_macros?.minutos ?? 0) || 0
    const mins = Math.max(minsFromFitness, minsFromNutri)
    return mins > 0 ? mins : 0
  }

  const getMonthRange = () => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const monthStartStr = monthStart.toISOString().split('T')[0]
    const monthEndStr = monthEnd.toISOString().split('T')[0]
    return { monthStart, monthEnd, monthStartStr, monthEndStr }
  }

  const fetchClientCalendarSummary = async () => {
    try {
      setLoading(true)

      const { monthStartStr, monthEndStr } = getMonthRange()

      const { data: summaryRows, error: summaryErr } = await supabase
        .from('client_day_activity_summary_v')
        .select(
          'id, client_id, day, activity_id, calendar_event_id, activity_title, coach_id, fitness_mins, nutri_mins, calendar_mins, total_mins'
        )
        .eq('client_id', clientId)
        .gte('day', monthStartStr)
        .lte('day', monthEndStr)

      if (summaryErr) {
        console.warn('⚠️ [CLIENT CALENDAR] Error cargando view client_day_activity_summary_v:', summaryErr)
      }

      const rows = (Array.isArray(summaryRows) ? summaryRows : []) as ClientDaySummaryRow[]
      const byDate: Record<string, ClientDaySummaryRow[]> = {}
      const processed: { [key: string]: DayData } = {}

      for (const r of rows) {
        const dayKey = String(r.day)
        if (!byDate[dayKey]) byDate[dayKey] = []
        byDate[dayKey].push(r)
      }

      Object.keys(byDate).forEach((dayKey) => {
        const list = byDate[dayKey] || []
        const totalMinutes = list.reduce((acc, r) => acc + (Number(r.total_mins ?? 0) || 0), 0)
        processed[dayKey] = {
          date: dayKey,
          // En la vista el "count" deja de ser útil; lo usamos como cantidad de filas de resumen
          exerciseCount: list.length,
          completedCount: 0,
          totalMinutes,
          exercises: [],
          activities: []
        }
      })

      setSummaryRowsByDate(byDate)
      setDayData(processed)

      // Ya no necesitamos otherMinutesByDate separado: podemos derivarlo desde summaryRowsByDate.
      // Lo dejamos por compatibilidad con UI, pero lo seteamos vacío.
      setOtherMinutesByDate({})

      if (onLastWorkoutUpdate) {
        onLastWorkoutUpdate(null)
      }
    } catch (e) {
      console.warn('⚠️ [CLIENT CALENDAR] Error general cargando resumen del calendario:', e)
      setSummaryRowsByDate({})
      setDayData({})
    } finally {
      setLoading(false)
    }
  }

  const loadDayActivityDetails = async (dayStr: string, activityId: number) => {
    const cacheKey = `${dayStr}::${String(activityId)}`

    if (activityDetailsByKey[cacheKey]) return

    try {
      const { data: actRow } = await supabase
        .from('activities')
        .select('id, title, coach_id, type')
        .eq('id', activityId)
        .single()

      const actividadTitulo = actRow?.title || `Actividad ${activityId}`
      const actividadCoachId = actRow?.coach_id ?? null

      const details: ExerciseExecution[] = []
      const idsToResolve = new Set<string>()

      // Fitness
      const { data: progressRecord } = await supabase
        .from('progreso_cliente')
        .select('id, fecha, actividad_id, ejercicios_completados, ejercicios_pendientes, detalles_series, minutos_json, calorias_json')
        .eq('cliente_id', clientId)
        .eq('fecha', dayStr)
        .eq('actividad_id', activityId)
        .maybeSingle()

      if (progressRecord) {
        let completados: string[] = []
        let pendientes: string[] = []
        try {
          const rawCompleted = typeof (progressRecord as any).ejercicios_completados === 'string'
            ? JSON.parse((progressRecord as any).ejercicios_completados || '{}')
            : (progressRecord as any).ejercicios_completados
          const rawPending = typeof (progressRecord as any).ejercicios_pendientes === 'string'
            ? JSON.parse((progressRecord as any).ejercicios_pendientes || '{}')
            : (progressRecord as any).ejercicios_pendientes

          if (Array.isArray(rawCompleted)) completados = rawCompleted.map((x: any) => String(x))
          else if (rawCompleted && typeof rawCompleted === 'object') completados = Object.keys(rawCompleted).map((k) => String(k).split('_')[0])

          if (Array.isArray(rawPending)) pendientes = rawPending.map((x: any) => String(x))
          else if (rawPending && typeof rawPending === 'object') pendientes = Object.keys(rawPending).map((k) => String(k).split('_')[0])

          completados = [...new Set(completados)]
          pendientes = [...new Set(pendientes)]
        } catch {
          completados = []
          pendientes = []
        }

        const allIds = [...new Set([...completados, ...pendientes])]

        // Parse detalles_series/minutos/calorias para mins/kcal
        let detallesSeriesObj: any = null
        let minutosObj: any = null
        let caloriasObj: any = null
        try {
          detallesSeriesObj = typeof (progressRecord as any).detalles_series === 'string'
            ? JSON.parse((progressRecord as any).detalles_series)
            : (progressRecord as any).detalles_series
        } catch {
          detallesSeriesObj = null
        }
        try {
          minutosObj = typeof (progressRecord as any).minutos_json === 'string'
            ? JSON.parse((progressRecord as any).minutos_json)
            : (progressRecord as any).minutos_json
        } catch {
          minutosObj = null
        }
        try {
          caloriasObj = typeof (progressRecord as any).calorias_json === 'string'
            ? JSON.parse((progressRecord as any).calorias_json)
            : (progressRecord as any).calorias_json
        } catch {
          caloriasObj = null
        }

        for (const ejId of allIds) {
          const baseId = String(ejId)
          idsToResolve.add(baseId)
          const isCompleted = completados.includes(baseId)

          const duracion = (() => {
            try {
              if (!minutosObj || typeof minutosObj !== 'object') return undefined
              const matchingKey = Object.keys(minutosObj).find((k) => String(k).split('_')[0] === baseId)
              const value = matchingKey ? (minutosObj as any)[matchingKey] : (minutosObj as any)[baseId]
              return value ? Number(value) : undefined
            } catch {
              return undefined
            }
          })()

          const calorias_estimadas = (() => {
            try {
              if (!caloriasObj || typeof caloriasObj !== 'object') return undefined
              const matchingKey = Object.keys(caloriasObj).find((k) => String(k).split('_')[0] === baseId)
              const value = matchingKey ? (caloriasObj as any)[matchingKey] : (caloriasObj as any)[baseId]
              return value ? Number(value) : undefined
            } catch {
              return undefined
            }
          })()

          const detalleSeriesValue = (() => {
            try {
              if (!detallesSeriesObj || typeof detallesSeriesObj !== 'object' || Array.isArray(detallesSeriesObj)) return null
              const matchingKey = Object.keys(detallesSeriesObj).find((k) => String(k).split('_')[0] === baseId)
              const detalle = matchingKey ? (detallesSeriesObj as any)[matchingKey] : (detallesSeriesObj as any)[baseId]
              if (detalle && typeof detalle === 'object' && detalle.detalle_series) return detalle.detalle_series
              return detalle || null
            } catch {
              return null
            }
          })()

          details.push({
            id: `fit-${String((progressRecord as any).id)}-${baseId}`,
            ejercicio_id: baseId,
            completado: isCompleted,
            fecha_ejercicio: dayStr,
            duracion,
            calorias_estimadas,
            ejercicio_nombre: undefined,
            actividad_titulo: actividadTitulo,
            actividad_id: activityId,
            actividad_coach_id: actividadCoachId,
            detalle_series: detalleSeriesValue,
            minutosJson: minutosObj,
            caloriasJson: caloriasObj
          })
        }
      }

      // Nutrición
      const { data: nutriRecord } = await supabase
        .from('progreso_cliente_nutricion')
        .select('id, fecha, actividad_id, ejercicios_completados, ejercicios_pendientes, macros, ingredientes, recetas')
        .eq('cliente_id', clientId)
        .eq('fecha', dayStr)
        .eq('actividad_id', activityId)
        .maybeSingle()

      if (nutriRecord) {
        let macrosData: any = null
        let ingredientesData: any = null
        try {
          macrosData = typeof (nutriRecord as any).macros === 'string' ? JSON.parse((nutriRecord as any).macros) : (nutriRecord as any).macros
        } catch {
          macrosData = null
        }
        try {
          ingredientesData = typeof (nutriRecord as any).ingredientes === 'string'
            ? JSON.parse((nutriRecord as any).ingredientes)
            : (nutriRecord as any).ingredientes
        } catch {
          ingredientesData = null
        }

        let recetasData: any = null
        try {
          recetasData = typeof (nutriRecord as any).recetas === 'string'
            ? JSON.parse((nutriRecord as any).recetas)
            : (nutriRecord as any).recetas
        } catch {
          recetasData = null
        }

        const keys = macrosData && typeof macrosData === 'object' ? Object.keys(macrosData) : []

        for (const key of keys) {
          const baseId = String(key).split('_')[0]
          if (baseId) idsToResolve.add(baseId)
          const nombre = ingredientesData?.[key]?.nombre
          const minutos = macrosData?.[key]?.minutos
          const kcal = macrosData?.[key]?.calorias

          // Fallback to defaults or empty if null
          const ingVal = ingredientesData?.[key]

          details.push({
            id: `nut-${String((nutriRecord as any).id)}-${key}`,
            ejercicio_id: baseId,
            completado: false,
            fecha_ejercicio: dayStr,
            duracion: minutos !== undefined && minutos !== null ? Number(minutos) : undefined,
            calorias_estimadas: kcal !== undefined && kcal !== null ? Number(kcal) : undefined,
            ejercicio_nombre: nombre || undefined,
            actividad_titulo: actividadTitulo,
            actividad_id: activityId,
            actividad_coach_id: actividadCoachId,
            is_nutricion: true,
            nutrition_record_id: String((nutriRecord as any).id),
            nutrition_key: String(key),
            nutricion_macros: {
              proteinas: macrosData?.[key]?.proteinas !== undefined ? Number(macrosData?.[key]?.proteinas) : undefined,
              carbohidratos: macrosData?.[key]?.carbohidratos !== undefined ? Number(macrosData?.[key]?.carbohidratos) : undefined,
              grasas: macrosData?.[key]?.grasas !== undefined ? Number(macrosData?.[key]?.grasas) : undefined,
              calorias: kcal !== undefined && kcal !== null ? Number(kcal) : undefined,
              minutos: minutos !== undefined && minutos !== null ? Number(minutos) : undefined
            },
            ingredientes_detalle: ingVal
          })
        }
      }

      // Resolver nombres (ejercicios + platos) para lo que falte
      const idsArray = Array.from(idsToResolve)
        .map((id) => parseInt(String(id), 10))
        .filter((id) => !Number.isNaN(id))

      const [ejRes, plRes] = await Promise.all([
        idsArray.length
          ? supabase.from('ejercicios_detalles').select('id, nombre_ejercicio').in('id', idsArray)
          : Promise.resolve({ data: [], error: null } as any),
        idsArray.length
          ? supabase.from('nutrition_program_details').select('id, nombre, ingredientes').in('id', idsArray)
          : Promise.resolve({ data: [], error: null } as any)
      ])

      const nameMap = new Map<string, string>()
      const defaultIngredientsMap = new Map<string, any>()

        ; (Array.isArray((ejRes as any)?.data) ? (ejRes as any).data : []).forEach((r: any) => {
          if (r?.id) nameMap.set(String(r.id), String(r.nombre_ejercicio || ''))
        })
        ; (Array.isArray((plRes as any)?.data) ? (plRes as any).data : []).forEach((r: any) => {
          if (r?.id) nameMap.set(String(r.id), String(r.nombre || ''))
          if (r?.id && r?.ingredientes) {
            defaultIngredientsMap.set(String(r.id), r.ingredientes)
          }
        })

      const enriched = details.map((d: any) => {
        if (d.ejercicio_nombre) return d
        const nm = nameMap.get(String(d.ejercicio_id))
        const defIngredients = defaultIngredientsMap.get(String(d.ejercicio_id))

        if (d.is_nutricion && !d.ingredientes_detalle && !defIngredients) {
          // console.warn(`DEBUG: No ingredients for ${d.nutrition_key} (ID: ${d.ejercicio_id}). Override: ${!!d.ingredientes_detalle}, Default: ${!!defIngredients}`)
        }

        return {
          ...d,
          ejercicio_nombre: nm || (d.is_nutricion ? `Plato ${d.ejercicio_id}` : `Ejercicio ${d.ejercicio_id}`),
          ingredientes_detalle: d.ingredientes_detalle || defIngredients
        }
      })

      setActivityDetailsByKey((prev) => ({ ...prev, [cacheKey]: enriched }))

      // Mantener compatibilidad con editores existentes que leen de selectedDayExercises
      // (los detalles se cargan on-demand por actividad).
      try {
        const selectedDayStr = selectedDate ? selectedDate.toISOString().split('T')[0] : null
        if (selectedDayStr === dayStr) {
          setSelectedDayExercises((prev) => {
            const filtered = (prev || []).filter((e) => String(e.actividad_id ?? '') !== String(activityId))
            return [...filtered, ...enriched]
          })
        }
      } catch {
        // ignore
      }
    } catch (e) {
      console.warn('⚠️ [CLIENT CALENDAR] Error cargando detalle por actividad:', e)
      setActivityDetailsByKey((prev) => ({ ...prev, [cacheKey]: [] }))
    }
  }

  const loadNutritionPlatesForActivity = async (activityIdNum: number): Promise<any[]> => {
    if (!activityIdNum || Number.isNaN(activityIdNum)) return []
    const activityKey = String(activityIdNum)

    // Estrategia 1: activity_id como integer
    const { data: platesInt, error: errInt } = await supabase
      .from('nutrition_program_details')
      .select('id, nombre, calorias, proteinas, carbohidratos, grasas, ingredientes, minutos, activity_id, activity_id_new')
      .eq('activity_id', activityIdNum)
      .order('id', { ascending: true })

    if (!errInt && platesInt && platesInt.length > 0) {
      return platesInt
    }

    // Estrategia 2: activity_id como JSONB
    try {
      const activityKeyObj = { [activityKey]: {} }
      const { data: platesJsonb, error: errJsonb } = await supabase
        .from('nutrition_program_details')
        .select('id, nombre, calorias, proteinas, carbohidratos, grasas, ingredientes, minutos, activity_id, activity_id_new')
        .contains('activity_id', activityKeyObj)
        .order('id', { ascending: true })

      if (!errJsonb && platesJsonb) {
        return platesJsonb
      }
    } catch {
      // ignore
    }

    return []
  }

  const pickEnrollmentForDate = (enrollmentsForClient: any[] | null | undefined, activityId: number | null | undefined, fechaStr: string): any | null => {
    if (!enrollmentsForClient || !activityId) return null
    const list = enrollmentsForClient
      .filter(e => String(e.activity_id) === String(activityId) && e.start_date)
      .map(e => ({ ...e, _start: new Date(e.start_date).getTime() }))
      .sort((a, b) => a._start - b._start)
    const target = new Date(fechaStr).getTime()
    let pick: any | null = null
    for (const e of list) {
      if (e._start <= target) pick = e
    }
    return pick || list[list.length - 1] || null
  }

  useEffect(() => {
    const activityIdsToFetch = Array.from(
      new Set(
        selectedDayExercises
          .filter((e) => e.is_nutricion && e.actividad_id !== undefined && e.actividad_id !== null)
          .map((e) => String(e.actividad_id))
      )
    )

    activityIdsToFetch.forEach((activityId) => {
      const numericActivityId = parseInt(activityId, 10)
      if (Number.isNaN(numericActivityId) || numericActivityId <= 0) return
      setNutritionPlateOptionsByActivity((prev) => {
        const key = String(numericActivityId)
        if (prev[key]) return prev
        fetch(`/api/activity-nutrition/${numericActivityId}`, { credentials: 'include' })
          .then((r) => {
            if (!r.ok) {
              r.text().then((t) => console.warn('⚠️ Error cargando platos', numericActivityId, r.status, t))
              return null
            }
            return r.json()
          })
          .then((json) => {
            if (json) {
              const plates = (json?.data || json?.plates || []) as any[]
              setNutritionPlateOptionsByActivity((prev2) => ({ ...prev2, [key]: plates }))
              return
            }

            loadNutritionPlatesForActivity(numericActivityId).then((plates) => {
              if (plates && plates.length > 0) {
                setNutritionPlateOptionsByActivity((prev2) => ({ ...prev2, [key]: plates }))
              }
            })
          })
          .catch(() => {
            loadNutritionPlatesForActivity(numericActivityId).then((plates) => {
              if (plates && plates.length > 0) {
                setNutritionPlateOptionsByActivity((prev2) => ({ ...prev2, [key]: plates }))
              }
            })
          })
        return prev
      })
    })
  }, [selectedDayExercises])

  const filteredDayData = (() => {
    // La vista de resumen no trae enrollment_id, así que por ahora no filtramos por enrollment
    // (evitamos romper la grilla mensual y el resumen del día).
    return dayData
  })()

  // Función para calcular la última ejercitación (último día que completó al menos un ejercicio)
  const calculateLastWorkoutDate = (data: { [key: string]: DayData }): string | null => {
    const dates = Object.keys(data).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    for (const date of dates) {
      const dayData = data[date]
      if (dayData.completedCount > 0) {
        // Formatear la fecha como DD/MM/YYYY
        const dateObj = new Date(date)
        return `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`
      }
    }

    return null
  }

  const handleEditNutrition = (exercise: ExerciseExecution) => {
    setEditingNutritionId(exercise.id)
    const m = exercise.nutricion_macros || {}
    setEditingNutritionMacros({
      proteinas: m.proteinas !== undefined && m.proteinas !== null ? String(m.proteinas) : '',
      carbohidratos: m.carbohidratos !== undefined && m.carbohidratos !== null ? String(m.carbohidratos) : '',
      grasas: m.grasas !== undefined && m.grasas !== null ? String(m.grasas) : '',
      calorias: m.calorias !== undefined && m.calorias !== null ? String(m.calorias) : '',
      minutos: m.minutos !== undefined && m.minutos !== null ? String(m.minutos) : ''
    })

    setEditingNutritionPlateId(exercise.ejercicio_id ? String(exercise.ejercicio_id) : null)

    const rawActivityId = exercise.actividad_id !== undefined && exercise.actividad_id !== null ? String(exercise.actividad_id) : null
    const activityIdNum = rawActivityId ? parseInt(rawActivityId, 10) : NaN
    const activityId = !Number.isNaN(activityIdNum) && activityIdNum > 0 ? String(activityIdNum) : null
    if (activityId && !nutritionPlateOptionsByActivity[activityId]) {
      fetch(`/api/activity-nutrition/${activityId}`, { credentials: 'include' })
        .then((r) => {
          if (!r.ok) {
            r.text().then((t) => console.warn('⚠️ Error cargando platos', activityId, r.status, t))
            return null
          }
          return r.json()
        })
        .then(json => {
          if (json) {
            const plates = (json?.data || json?.plates || []) as any[]
            setNutritionPlateOptionsByActivity(prev => ({ ...prev, [activityId]: plates }))
            return
          }
          if (!Number.isNaN(activityIdNum) && activityIdNum > 0) {
            loadNutritionPlatesForActivity(activityIdNum).then((plates) => {
              if (plates && plates.length > 0) {
                setNutritionPlateOptionsByActivity((prev) => ({ ...prev, [activityId]: plates }))
              }
            })
          }
        })
        .catch(() => {
          if (!Number.isNaN(activityIdNum) && activityIdNum > 0) {
            loadNutritionPlatesForActivity(activityIdNum).then((plates) => {
              if (plates && plates.length > 0) {
                setNutritionPlateOptionsByActivity((prev) => ({ ...prev, [activityId]: plates }))
              }
            })
          }
        })
    }
  }

  const handleOpenIngredients = (ex: ExerciseExecution) => {
    setEditingNutritionExercise(ex)
    const raw = ex.ingredientes_detalle
    console.log('DEBUG: Opening Ingredients', { raw, type: typeof raw })

    let list: any[] = []

    if (typeof raw === 'string') {
      // Parse legacy string format: "Item 1; Item 2"
      list = raw.split(';').map((s: string, idx: number) => {
        const trimmed = s.trim()
        if (!trimmed) return null

        // Intentar extraer cantidad y unidad. 
        // Regex busca: (cualquier cosa) (espacio opcional) (numero) (espacio opcional) (letras al final)
        // Ej: "Tofu 150g" -> "Tofu", "150", "g"
        // Ej: "Limón 1 unidad" -> "Limón", "1", "unidad"
        const match = trimmed.match(/^(.*?)\s*(\d+(?:[.,]\d+)?)\s*([a-zA-ZñÑáéíóúÁÉÍÓÚ\s]*)$/)

        if (match) {
          return {
            _key: `legacy_${idx}`,
            nombre: match[1].trim(),
            cantidad: match[2],
            unidad: match[3].trim()
          }
        }

        // Fallback si no matchea formato estandard
        return {
          _key: `legacy_${idx}`,
          nombre: trimmed,
          cantidad: '',
          unidad: ''
        }
      }).filter(Boolean)
    } else if (Array.isArray(raw)) {
      list = raw.map((v: any, idx: number) => ({
        _key: String(idx),
        nombre: v.nombre || v || '',
        cantidad: v.cantidad || '',
        unidad: v.unidad || ''
      }))
    } else if (raw && typeof raw === 'object') {
      list = Object.entries(raw).map(([k, v]: any) => ({
        _key: k,
        nombre: v.nombre || '',
        cantidad: v.cantidad || '',
        unidad: v.unidad || ''
      }))
    }

    if (list.length === 0) {
      list = [{ _key: `new_${Date.now()}`, nombre: '', cantidad: '', unidad: '' }]
    }
    setEditingIngredientsList(list)
    setShowIngredientsModal(true)
  }


  const handleCancelNutrition = () => {
    setEditingNutritionId(null)
    setEditingNutritionMacros(null)
    setEditingNutritionPlateId(null)
    setConfirmDeleteNutritionId(null)
  }

  const canEditNutritionForDay = (exercise: ExerciseExecution): boolean => {
    const dateStr = exercise.fecha_ejercicio
    const todayStr = new Date().toISOString().split('T')[0]
    // No permitir editar días pasados
    if (dateStr < todayStr) return false

    // Si es hoy, solo permitir si no hay ningún plato completado en el día
    if (dateStr === todayStr) {
      const hasAnyCompleted = selectedDayExercises.some(e => e.is_nutricion && e.fecha_ejercicio === dateStr && e.completado)
      if (hasAnyCompleted) return false
    }
    return true
  }

  const canEditFitnessForDay = (exercise: ExerciseExecution): boolean => {
    const dateStr = exercise.fecha_ejercicio
    const todayStr = new Date().toISOString().split('T')[0]
    // No permitir editar días pasados
    if (dateStr < todayStr) return false
    return true
  }

  const parseMaybeJson = (value: any): any => {
    if (!value) return null
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch {
        return null
      }
    }
    return value
  }

  const normalizeKeyList = (raw: any): string[] => {
    if (!raw) return []
    if (Array.isArray(raw)) return raw.map((x: any) => String(x))
    if (typeof raw === 'object') return Object.keys(raw).map(k => String(k))
    return []
  }

  const inferMetaFromKey = (key: string): { ejercicio_id: number; orden: number; bloque: number } => {
    const [baseStr, suffixStr] = String(key).split('_')
    const ejercicio_id = Number(baseStr)
    const orden = suffixStr !== undefined ? Number(suffixStr) : 1
    return {
      ejercicio_id: Number.isFinite(ejercicio_id) ? ejercicio_id : 0,
      orden: Number.isFinite(orden) ? orden : 1,
      bloque: 1
    }
  }

  const normalizeNutritionContainerToObject = (raw: any): Record<string, any> => {
    if (!raw) return {}
    if (Array.isArray(raw)) {
      const obj: Record<string, any> = {}
      raw.map((x: any) => String(x)).forEach((k, idx) => {
        obj[k] = { ...inferMetaFromKey(k), orden: idx + 1 }
      })
      return obj
    }
    if (typeof raw === 'object') {
      const obj: Record<string, any> = { ...raw }
      Object.keys(obj).forEach((k) => {
        const v = obj[k]
        if (v === true) {
          obj[k] = inferMetaFromKey(k)
        } else if (v && typeof v === 'object') {
          const inferred = inferMetaFromKey(k)
          obj[k] = {
            ...inferred,
            ...v,
            ejercicio_id:
              v.ejercicio_id !== undefined && v.ejercicio_id !== null
                ? Number(v.ejercicio_id)
                : inferred.ejercicio_id,
            orden:
              v.orden !== undefined && v.orden !== null
                ? Number(v.orden)
                : inferred.orden,
            bloque:
              v.bloque !== undefined && v.bloque !== null
                ? Number(v.bloque)
                : inferred.bloque
          }
        } else {
          obj[k] = inferMetaFromKey(k)
        }
      })
      return obj
    }
    return {}
  }

  const updateKeyContainer = (raw: any, oldKey: string, newKey?: string): any => {
    if (!raw) {
      if (!newKey) return raw
      return [newKey]
    }
    if (Array.isArray(raw)) {
      const list = raw.map((x: any) => String(x)).filter((k: string) => k !== oldKey)
      if (newKey) list.push(newKey)
      return list
    }
    if (typeof raw === 'object') {
      const obj: any = { ...raw }
      delete obj[oldKey]
      if (newKey) {
        const inferred = inferMetaFromKey(newKey)
        obj[newKey] = obj[newKey] && typeof obj[newKey] === 'object' ? { ...inferred, ...obj[newKey] } : inferred
      }
      return obj
    }
    return raw
  }

  const buildNewNutritionPayload = (plate: any) => {
    return {
      nombre: plate?.nombre_plato || plate?.nombre || '',
      ingredientes: plate?.ingredientes ?? null,
      macros: {
        proteinas: plate?.proteinas ?? 0,
        carbohidratos: plate?.carbohidratos ?? 0,
        grasas: plate?.grasas ?? 0,
        calorias: plate?.calorias ?? 0,
        minutos: plate?.minutos ?? 0
      }
    }
  }

  const handleSaveNutrition = async (exercise: ExerciseExecution, specificChanges: { receta?: string, ingredientes?: any } | null = null) => {
    if (!editingNutritionId || !editingNutritionMacros) return
    if (!exercise.nutrition_record_id || !exercise.nutrition_key) return
    if (!canEditNutritionForDay(exercise)) return

    const nutritionKey: string = exercise.nutrition_key
    try {
      const { data: currentRecord, error: fetchError } = await supabase
        .from('progreso_cliente_nutricion')
        .select('macros, ingredientes, ejercicios_pendientes, ejercicios_completados')
        .eq('id', exercise.nutrition_record_id)
        .single()
      if (fetchError) {
        console.error('Error obteniendo macros actuales:', fetchError)
        return
      }

      const currentMacros = parseMaybeJson(currentRecord?.macros) || {}
      const currentIngredientes = parseMaybeJson(currentRecord?.ingredientes) || {}
      const currentPendientesRaw = parseMaybeJson(currentRecord?.ejercicios_pendientes)
      const currentCompletadosRaw = parseMaybeJson(currentRecord?.ejercicios_completados)

      const selectedPlateId = editingNutritionPlateId ? String(editingNutritionPlateId) : String(exercise.ejercicio_id)

      // Compute New Key if ID changed
      const oldKey = nutritionKey
      const keyParts = oldKey.split('_')
      const suffix = keyParts.length > 1 ? keyParts.slice(1).join('_') : ''
      const newKey = suffix ? `${selectedPlateId}_${suffix}` : String(selectedPlateId)

      const activityId = exercise.actividad_id !== undefined && exercise.actividad_id !== null ? String(exercise.actividad_id) : null
      const platesList = activityId ? nutritionPlateOptionsByActivity[activityId] : undefined
      const selectedPlate = platesList?.find((p: any) => String(p.id) === String(selectedPlateId))

      const payloadFromPlate = selectedPlate ? buildNewNutritionPayload(selectedPlate) : null

      const allMacros: any = { ...currentMacros }
      const allIngredientes: any = { ...currentIngredientes }

      // Handle Key Swap in Macros/Ingredientes/Recetas
      if (newKey !== oldKey) {
        delete allMacros[oldKey]
        delete allIngredientes[oldKey]
      }

      // Setear ingredientes/macros según plato nuevo (si disponible)
      // PRIORITY: specificChanges > payloadFromPlate > existing
      if (specificChanges?.ingredientes) {
        allIngredientes[newKey] = specificChanges.ingredientes
      } else if (payloadFromPlate) {
        allIngredientes[newKey] = payloadFromPlate.ingredientes
      }


      allMacros[newKey] = {
        ...(allMacros[newKey] || allMacros[oldKey] || {}), // Fallback to old data if just renaming
        proteinas: editingNutritionMacros.proteinas ? Number(editingNutritionMacros.proteinas) : (payloadFromPlate?.macros?.proteinas ?? 0),
        carbohidratos: editingNutritionMacros.carbohidratos ? Number(editingNutritionMacros.carbohidratos) : (payloadFromPlate?.macros?.carbohidratos ?? 0),
        grasas: editingNutritionMacros.grasas ? Number(editingNutritionMacros.grasas) : (payloadFromPlate?.macros?.grasas ?? 0),
        calorias: editingNutritionMacros.calorias ? Number(editingNutritionMacros.calorias) : (payloadFromPlate?.macros?.calorias ?? 0),
        minutos: editingNutritionMacros.minutos ? Number(editingNutritionMacros.minutos) : (payloadFromPlate?.macros?.minutos ?? 0)
      }

      const pendingObj = normalizeNutritionContainerToObject(currentPendientesRaw)
      const completedObj = normalizeNutritionContainerToObject(currentCompletadosRaw)

      const wasPending = Object.prototype.hasOwnProperty.call(pendingObj, oldKey)
      const wasCompleted = Object.prototype.hasOwnProperty.call(completedObj, oldKey)

      if (wasPending) {
        if (newKey !== oldKey) delete pendingObj[oldKey]
        pendingObj[newKey] = {
          ...(pendingObj[oldKey] || inferMetaFromKey(oldKey)),
          ejercicio_id: Number(selectedPlateId)
        }
      }

      if (wasCompleted) {
        if (newKey !== oldKey) delete completedObj[oldKey]
        completedObj[newKey] = {
          ...(completedObj[oldKey] || inferMetaFromKey(oldKey)),
          ejercicio_id: Number(selectedPlateId)
        }
      }

      const { error: updateError } = await supabase
        .from('progreso_cliente_nutricion')
        .update({
          macros: allMacros,
          ingredientes: allIngredientes,
          ejercicios_pendientes: pendingObj,
          ejercicios_completados: completedObj
        })
        .eq('id', exercise.nutrition_record_id)

      if (updateError) {
        console.error('Error actualizando macros:', updateError)
        return
      }

      setSelectedDayExercises(prev =>
        prev.map(ex =>
          ex.id === exercise.id
            ? {
              ...ex,
              nutricion_macros: {
                proteinas: allMacros[newKey]?.proteinas,
                carbohidratos: allMacros[newKey]?.carbohidratos,
                grasas: allMacros[newKey]?.grasas,
                calorias: allMacros[newKey]?.calorias,
                minutos: allMacros[newKey]?.minutos
              },
              duracion: allMacros[newKey]?.minutos,
              calorias_estimadas: allMacros[newKey]?.calorias,
              ejercicio_id: String(selectedPlateId),
              nutrition_key: String(newKey),
              ejercicio_nombre: payloadFromPlate?.nombre || ex.ejercicio_nombre,
              ingredientes_detalle: allIngredientes[newKey]
            }
            : ex
        )
      )

      setDayData(prev => {
        const dateKey = exercise.fecha_ejercicio
        const day = prev[dateKey]
        if (!day) return prev
        const updated = day.exercises.map(ex =>
          ex.id === exercise.id
            ? {
              ...ex,
              nutricion_macros: {
                proteinas: allMacros[newKey]?.proteinas,
                carbohidratos: allMacros[newKey]?.carbohidratos,
                grasas: allMacros[newKey]?.grasas,
                calorias: allMacros[newKey]?.calorias,
                minutos: allMacros[newKey]?.minutos
              },
              duracion: allMacros[newKey]?.minutos,
              calorias_estimadas: allMacros[newKey]?.calorias,
              ejercicio_id: String(selectedPlateId),
              nutrition_key: String(newKey),
              ejercicio_nombre: payloadFromPlate?.nombre || ex.ejercicio_nombre,
              ingredientes_detalle: allIngredientes[newKey]
            }
            : ex
        )
        return { ...prev, [dateKey]: { ...day, exercises: updated } }
      })

      // Trigger Cascade Modal
      const dayName = getDayName(new Date(exercise.fecha_ejercicio).getDay())
      const isSwap = String(selectedPlateId) !== String(exercise.ejercicio_id)

      console.log('Cascade Debug: Saving Nutrition', {
        isSwap,
        selectedPlateId,
        oldId: String(exercise.ejercicio_id).split('_')[0],
        newId: String(selectedPlateId).split('_')[0]
      })

      setCascadeModal({
        isOpen: true,
        type: 'nutrition',
        mode: isSwap ? 'swap' : 'update',
        sourceDate: exercise.fecha_ejercicio,
        sourceDayName: dayName,
        itemName: payloadFromPlate?.nombre || exercise.ejercicio_nombre || 'Plato',
        payload: {
          macros: allMacros[newKey],
          ingredients: allIngredientes[newKey],
          plateId: String(selectedPlateId),
          nutritionKey: newKey,
          oldId: String(exercise.ejercicio_id).split('_')[0],
          newId: String(selectedPlateId).split('_')[0],
          activityId: exercise.actividad_id
        }
      })
    } catch (e) {
      console.error('Error guardando macros:', e)
    }
  }

  const handleDeleteNutrition = async (exercise: ExerciseExecution) => {
    if (!exercise.nutrition_record_id || !exercise.nutrition_key) return
    if (!canEditNutritionForDay(exercise)) return
    try {
      const { data: currentRecord, error: fetchError } = await supabase
        .from('progreso_cliente_nutricion')
        .select('macros, ingredientes, ejercicios_pendientes, ejercicios_completados')
        .eq('id', exercise.nutrition_record_id)
        .single()
      if (fetchError) return

      const currentMacros = parseMaybeJson(currentRecord?.macros) || {}
      const currentIngredientes = parseMaybeJson(currentRecord?.ingredientes) || {}
      const currentPendientesRaw = parseMaybeJson(currentRecord?.ejercicios_pendientes)
      const currentCompletadosRaw = parseMaybeJson(currentRecord?.ejercicios_completados)

      const allMacros: any = { ...currentMacros }
      const allIngredientes: any = { ...currentIngredientes }
      delete allMacros[exercise.nutrition_key]
      delete allIngredientes[exercise.nutrition_key]

      const pendingObj = normalizeNutritionContainerToObject(currentPendientesRaw)
      const completedObj = normalizeNutritionContainerToObject(currentCompletadosRaw)
      delete pendingObj[exercise.nutrition_key]
      delete completedObj[exercise.nutrition_key]

      const { error: updateError } = await supabase
        .from('progreso_cliente_nutricion')
        .update({
          macros: allMacros,
          ingredientes: allIngredientes,
          ejercicios_pendientes: pendingObj,
          ejercicios_completados: completedObj
        })
        .eq('id', exercise.nutrition_record_id)

      if (updateError) return

      setSelectedDayExercises(prev => prev.filter(e => e.id !== exercise.id))
      setDayData(prev => {
        const dateKey = exercise.fecha_ejercicio
        const day = prev[dateKey]
        if (!day) return prev
        const exercises = day.exercises.filter(e => e.id !== exercise.id)
        return {
          ...prev,
          [dateKey]: {
            ...day,
            exercises,
            exerciseCount: exercises.length,
            completedCount: exercises.filter(e => e.completado).length
          }
        }
      })

      handleCancelNutrition()
    } catch {
      // ignore
    }
  }

  // Función para parsear el formato de detalle_series: "(peso-reps-series);(peso-reps-series)"
  const parseDetalleSeries = (detalleSeriesStr: string): any[] => {
    if (!detalleSeriesStr || typeof detalleSeriesStr !== 'string') return []

    // Formato: "(peso-reps-series);(peso-reps-series)"
    const matches = detalleSeriesStr.match(/\(([^)]+)\)/g)
    if (!matches) return []

    return matches.map(match => {
      const content = match.replace(/[()]/g, '') // Remover paréntesis
      const parts = content.split('-')
      if (parts.length >= 3) {
        return {
          peso: parseFloat(parts[0]) || 0,
          repeticiones: parseInt(parts[1]) || 0,
          series: parseInt(parts[2]) || 0
        }
      }
      return null
    }).filter(Boolean)
  }

  // Función para obtener bloques de series con minutos
  const getSeriesBlocks = (detalleSeries: any, duracion?: number, ejercicioId?: string, minutosJson?: any): Array<{ bloque: number, peso: number, reps: number, series: number, minutos?: number }> => {
    const blocks: Array<{ bloque: number, peso: number, reps: number, series: number, minutos?: number }> = []

    if (!detalleSeries) {
      return blocks
    }

    // Función para obtener minutos de un bloque específico
    const getMinutosForBlock = (blockKey: string): number | undefined => {
      if (!minutosJson || !ejercicioId) return undefined

      // Parsear minutosJson si es string
      let minutosData: any = minutosJson
      if (typeof minutosJson === 'string') {
        try {
          minutosData = JSON.parse(minutosJson)
        } catch (e) {
          return undefined
        }
      }

      if (!minutosData || typeof minutosData !== 'object') return undefined

      // Buscar minutos por key exacta (ej: "1042_1")
      let minutos = minutosData[blockKey]

      // Si no se encuentra, buscar por ID base con sufijos
      if (minutos === undefined && ejercicioId) {
        const baseId = ejercicioId.split('_')[0]
        const matchingKey = Object.keys(minutosData).find(key => {
          const keyBaseId = key.split('_')[0]
          const keySuffix = key.split('_')[1]
          return keyBaseId === baseId && keySuffix === blockKey.split('_')[1]
        })
        if (matchingKey) {
          minutos = minutosData[matchingKey]
        }
      }

      return minutos !== undefined && minutos !== null ? Number(minutos) : undefined
    }

    // Si es un string con formato "(peso-reps-series);(peso-reps-series)"
    if (typeof detalleSeries === 'string' && detalleSeries.includes('(')) {
      const parsed = parseDetalleSeries(detalleSeries)
      if (parsed.length > 0) {
        return parsed.map((serie, index) => {
          // Intentar obtener minutos específicos por bloque usando el índice
          const blockKey = ejercicioId ? `${ejercicioId.split('_')[0]}_${index + 1}` : undefined
          const minutosBlock = blockKey ? getMinutosForBlock(blockKey) : undefined
          // Si no se encontró, usar duración total dividida
          const minutos = minutosBlock !== undefined ? minutosBlock : (duracion ? Math.floor(duracion / parsed.length) : undefined)
          return {
            bloque: index + 1,
            peso: serie.peso,
            reps: serie.repeticiones,
            series: serie.series,
            minutos: minutos
          }
        })
      }
    }

    // Si es un objeto con los campos directamente
    if (typeof detalleSeries === 'object' && detalleSeries.series && detalleSeries.repeticiones) {
      const peso = detalleSeries.peso || detalleSeries.descanso || 0
      const blockKey = ejercicioId || '1'
      const minutos = getMinutosForBlock(blockKey) || duracion
      return [{
        bloque: 1,
        peso: peso,
        reps: detalleSeries.repeticiones,
        series: detalleSeries.series,
        minutos: minutos
      }]
    }

    // Si es un array de series
    if (Array.isArray(detalleSeries) && detalleSeries.length > 0) {
      return detalleSeries.map((serie, index) => {
        const blockKey = ejercicioId ? `${ejercicioId.split('_')[0]}_${index + 1}` : undefined
        const minutos = blockKey ? getMinutosForBlock(blockKey) : (duracion ? Math.floor(duracion / detalleSeries.length) : undefined)
        return {
          bloque: index + 1,
          peso: serie.peso || 0,
          reps: serie.repeticiones || 0,
          series: serie.series || 0,
          minutos: minutos
        }
      })
    }

    // Si es un objeto con detalle_series dentro
    if (typeof detalleSeries === 'object' && detalleSeries.detalle_series) {
      if (typeof detalleSeries.detalle_series === 'string') {
        const parsed = parseDetalleSeries(detalleSeries.detalle_series)
        if (parsed.length > 0) {
          return parsed.map((serie, index) => {
            const blockKey = ejercicioId ? `${ejercicioId.split('_')[0]}_${index + 1}` : undefined
            const minutos = blockKey ? getMinutosForBlock(blockKey) : (duracion ? Math.floor(duracion / parsed.length) : undefined)
            return {
              bloque: index + 1,
              peso: serie.peso,
              reps: serie.repeticiones,
              series: serie.series,
              minutos: minutos
            }
          })
        }
      }
    }

    return blocks
  }

  // Función para obtener kcal por bloque (similar a minutos_json)
  const getCaloriasForBlock = (blockKey: string, ejercicioId?: string, caloriasJson?: any): number | undefined => {
    if (!caloriasJson || !ejercicioId) return undefined

    let caloriasData: any = caloriasJson
    if (typeof caloriasJson === 'string') {
      try {
        caloriasData = JSON.parse(caloriasJson)
      } catch {
        return undefined
      }
    }

    if (!caloriasData || typeof caloriasData !== 'object') return undefined

    let kcal = caloriasData[blockKey]
    if (kcal === undefined && ejercicioId) {
      const baseId = ejercicioId.split('_')[0]
      const matchingKey = Object.keys(caloriasData).find(key => {
        const keyBaseId = key.split('_')[0]
        const keySuffix = key.split('_')[1]
        return keyBaseId === baseId && keySuffix === blockKey.split('_')[1]
      })
      if (matchingKey) {
        kcal = caloriasData[matchingKey]
      }
    }

    return kcal !== undefined && kcal !== null ? Number(kcal) : undefined
  }

  // Función para formatear las series en el formato del cliente
  const formatSeries = (detalleSeries: any): string => {
    if (!detalleSeries) {
      return 'Sin series'
    }

    // Si es un string con formato "(peso-reps-series);(peso-reps-series)"
    if (typeof detalleSeries === 'string' && detalleSeries.includes('(')) {
      const parsed = parseDetalleSeries(detalleSeries)
      if (parsed.length > 0) {
        return parsed
          .map((serie, index) => {
            const prefix = parsed.length > 1 ? `S${index + 1}: ` : ''
            return `${prefix}${serie.series}s × ${serie.repeticiones}r × ${serie.peso}kg`
          })
          .join(' | ')
      }
    }

    // Si es un objeto con los campos directamente (estructura actual)
    if (typeof detalleSeries === 'object' && detalleSeries.series && detalleSeries.repeticiones) {
      const peso = detalleSeries.peso || detalleSeries.descanso || 0
      return `${detalleSeries.series}s × ${detalleSeries.repeticiones}r × ${peso}kg`
    }

    // Si es un array de series (nueva estructura para múltiples bloques)
    if (Array.isArray(detalleSeries) && detalleSeries.length > 0) {
      return detalleSeries
        .map((serie, index) => {
          const peso = serie.peso || 0
          const prefix = detalleSeries.length > 1 ? `B${index + 1}: ` : ''
          return `${prefix}${serie.series || 0}s × ${serie.repeticiones || 0}r × ${peso}kg`
        })
        .join(' | ')
    }

    // Si es un objeto con detalle_series dentro
    if (typeof detalleSeries === 'object' && detalleSeries.detalle_series) {
      if (typeof detalleSeries.detalle_series === 'string') {
        const parsed = parseDetalleSeries(detalleSeries.detalle_series)
        if (parsed.length > 0) {
          return parsed
            .map((serie, index) => {
              const prefix = parsed.length > 1 ? `S${index + 1}: ` : ''
              return `${prefix}${serie.series}s × ${serie.repeticiones}r × ${serie.peso}kg`
            })
            .join(' | ')
        }
      }
    }

    return 'Sin series'
  }

  // Función para iniciar edición de series
  const handleEditSeries = async (exerciseId: string, currentSeries: any) => {
    // Cargar ejercicios disponibles del programa
    const currentExercise = selectedDayExercises.find(ex => ex.id === exerciseId)

    // Verificar que la fecha del ejercicio sea futura (desde mañana)
    if (!currentExercise) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const exerciseDate = new Date(currentExercise.fecha_ejercicio)
    exerciseDate.setHours(0, 0, 0, 0)

    if (exerciseDate <= today) {
      console.log('No se pueden editar ejercicios de días pasados o de hoy')
      return
    }

    setEditingExerciseId(exerciseId)
    setEditingOriginalExercise(currentExercise ? { ...currentExercise } : null)

    if (currentExercise) {
      // Intentar obtener activity_id de diferentes formas
      let activityId = currentExercise.actividad_id

      if (!activityId && currentExercise.actividad_titulo) {
        // Buscar por título como fallback
        const { data: activity, error } = await supabase
          .from('activities')
          .select('id')
          .ilike('title', `%${currentExercise.actividad_titulo}%`)
          .single()

        if (activity && !error) {
          activityId = activity.id
        }
      }

      // Si aún no tenemos activity_id, buscar en ejercicios_detalles
      if (!activityId) {
        const { data: ejercicioDetalle, error: detalleError } = await supabase
          .from('ejercicios_detalles')
          .select('activity_id')
          .eq('id', currentExercise.ejercicio_id)
          .single()

        if (ejercicioDetalle && !detalleError) {
          const rawActivity = ejercicioDetalle.activity_id
          if (typeof rawActivity === 'number') {
            activityId = rawActivity
          } else if (rawActivity && typeof rawActivity === 'object') {
            const keys = Object.keys(rawActivity)
            if (keys.length > 0) {
              const firstKey = parseInt(keys[0], 10)
              if (!Number.isNaN(firstKey)) {
                activityId = firstKey
              }
            }
          }
        }
      }

      if (activityId) {
        console.log('🔍 Cargando ejercicios para actividad:', activityId)
        await loadAvailableExercises(activityId)
      } else {
        console.warn('⚠️ No se pudo encontrar activity_id para el ejercicio:', currentExercise)
      }

      // Usar getSeriesBlocks para parsear correctamente todos los bloques
      const blocks = getSeriesBlocks(
        currentSeries,
        currentExercise.duracion,
        currentExercise.ejercicio_id,
        currentExercise.minutosJson
      )

      if (blocks.length > 0) {
        // Convertir bloques al formato del editor
        const seriesForEditor = blocks.map(block => ({
          series: String(block.series || ''),
          repeticiones: String(block.reps || ''),
          peso: String(block.peso || ''),
          minutos: block.minutos ? String(block.minutos) : '',
          calorias: (() => {
            const key = currentExercise?.ejercicio_id
              ? `${currentExercise.ejercicio_id.split('_')[0]}_${block.bloque}`
              : undefined
            if (!key) return ''
            const kcal = getCaloriasForBlock(key, currentExercise.ejercicio_id, currentExercise.caloriasJson)
            return kcal !== undefined && kcal > 0 ? String(kcal) : ''
          })()
        }))
        setEditingSeries(seriesForEditor)
      } else {
        // Si no hay bloques, crear uno vacío
        setEditingSeries([{ series: '', repeticiones: '', peso: '', minutos: '', calorias: '' }])
      }
    }
  }

  // Función para cancelar edición de series
  const handleCancelEditSeries = () => {
    if (editingExerciseId && editingOriginalExercise) {
      setSelectedDayExercises(prev =>
        prev.map(ex => (ex.id === editingExerciseId ? { ...editingOriginalExercise } : ex))
      )
    }
    setEditingExerciseId(null)
    setEditingSeries([])
    setShowExerciseDropdown(false)
    setEditingOriginalExercise(null)
  }

  // Función para cargar ejercicios disponibles del programa
  const loadAvailableExercises = async (activityId: number) => {
    try {
      console.log('🔍 Buscando ejercicios para activity_id:', activityId)

      const { data: exercises, error } = await supabase
        .from('ejercicios_detalles')
        .select('id, nombre_ejercicio, descripcion, detalle_series, duracion_min, calorias')
        .contains('activity_id', { [activityId]: {} })
        .order('id')

      if (error) {
        console.error('❌ Error cargando ejercicios disponibles:', error)
        return
      }

      console.log('✅ Ejercicios encontrados:', exercises)
      setAvailableExercises(exercises || [])
    } catch (error) {
      console.error('❌ Error en loadAvailableExercises:', error)
    }
  }

  // Función para agregar una nueva serie
  const handleAddSeries = () => {
    setEditingSeries([...editingSeries, { series: '', repeticiones: '', peso: '', minutos: '', calorias: '' }])
  }

  // Función para cambiar el ejercicio
  const handleChangeExercise = async (newExerciseId: string) => {
    if (!editingExerciseId) return

    try {
      // Buscar el ejercicio actual
      const currentExercise = selectedDayExercises.find(ex => ex.id === editingExerciseId)
      if (!currentExercise) return

      // Obtener el nuevo ejercicio de la lista disponible
      const newExercise = availableExercises.find(ex => String(ex.id) === String(newExerciseId))
      if (!newExercise) return

      // Preparar defaults del nuevo ejercicio (series/reps/kg) + mins/kcal
      const defaultBlocks = getSeriesBlocks(
        newExercise.detalle_series,
        Number(newExercise.duracion_min) || undefined,
        String(newExerciseId),
        undefined
      )

      const baseEjId = String(newExerciseId).split('_')[0]
      const defaultMin = Number(newExercise.duracion_min) || undefined
      const defaultKcal = Number(newExercise.calorias) || undefined
      const defaultMinutosJson: any = {}
      const defaultCaloriasJson: any = {}
      const blocksCount = defaultBlocks.length > 0 ? defaultBlocks.length : 1
      for (let i = 0; i < blocksCount; i++) {
        const key = `${baseEjId}_${i + 1}`
        if (defaultMin !== undefined && defaultMin > 0) defaultMinutosJson[key] = defaultMin
        if (defaultKcal !== undefined && defaultKcal > 0) defaultCaloriasJson[key] = defaultKcal
      }

      // Seedear el editor con los defaults
      if (defaultBlocks.length > 0) {
        setEditingSeries(
          defaultBlocks.map((block) => ({
            series: String(block.series || ''),
            repeticiones: String(block.reps || ''),
            peso: String(block.peso || ''),
            minutos: block.minutos !== undefined && block.minutos > 0 ? String(block.minutos) : (defaultMin ? String(defaultMin) : ''),
            calorias: defaultKcal ? String(defaultKcal) : ''
          }))
        )
      } else {
        setEditingSeries([{ series: '', repeticiones: '', peso: '', minutos: defaultMin ? String(defaultMin) : '', calorias: defaultKcal ? String(defaultKcal) : '' }])
      }

      // Actualizar el ejercicio en el estado local (no persistir ni recargar acá)
      const updatedExercises = selectedDayExercises.map(ex =>
        ex.id === editingExerciseId
          ? {
            ...ex,
            original_ejercicio_id: ex.original_ejercicio_id || ex.ejercicio_id,
            ejercicio_id: String(newExerciseId),
            ejercicio_nombre: newExercise.nombre_ejercicio,
            detalle_series: newExercise.detalle_series || null,
            duracion: Number(newExercise.duracion_min) || undefined,
            calorias_estimadas: Number(newExercise.calorias) || undefined,
            // Se usan para mostrar min/kcal inmediatamente (sin tocar BD aún)
            minutosJson: defaultMinutosJson,
            caloriasJson: defaultCaloriasJson,
            ejercicioKeys: Array.from({ length: blocksCount }).map((_, idx) => `${baseEjId}_${idx + 1}`)
          }
          : ex
      )
      setSelectedDayExercises(updatedExercises)

      setShowExerciseDropdown(false)

    } catch (error) {
      console.error('Error cambiando ejercicio:', error)
    }
  }

  // Función para eliminar una serie
  const handleRemoveSeries = (index: number) => {
    const newSeries = editingSeries.filter((_, i) => i !== index)
    setEditingSeries(newSeries)
  }

  // Función para actualizar una serie
  const handleUpdateSeries = (index: number, field: string, value: string) => {
    const newSeries = [...editingSeries]
    newSeries[index] = { ...newSeries[index], [field]: value }
    setEditingSeries(newSeries)
  }

  // Función para guardar cambios de series
  const handleSaveSeries = async () => {
    if (!editingExerciseId) return

    try {
      // Buscar el ejercicio en los datos actuales
      const exercise = selectedDayExercises.find(ex => ex.id === editingExerciseId)
      if (!exercise) return

      // Verificar que la fecha del ejercicio sea futura (desde mañana)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const exerciseDate = new Date(exercise.fecha_ejercicio)
      exerciseDate.setHours(0, 0, 0, 0)

      if (exerciseDate <= today) {
        console.log('No se pueden guardar cambios en ejercicios de días pasados o de hoy')
        return
      }

      // Ejercicio actual y, si cambió en el dropdown, el original
      const ejercicioIdStr = exercise.ejercicio_id
      const originalEjercicioIdStr = exercise.original_ejercicio_id

      // Obtener detalles_series, minutos_json y calorias_json actuales desde la BD
      const { data: currentRecord, error: fetchError } = await supabase
        .from('progreso_cliente')
        .select('detalles_series, minutos_json, calorias_json')
        .eq('cliente_id', clientId)
        .eq('fecha', exercise.fecha_ejercicio)
        .single()

      if (fetchError) {
        console.error('Error obteniendo registro actual:', fetchError)
        return
      }

      // Parsear detalles_series existente
      let allDetalles: any = {}
      if (currentRecord?.detalles_series) {
        if (typeof currentRecord.detalles_series === 'string') {
          allDetalles = JSON.parse(currentRecord.detalles_series)
        } else if (typeof currentRecord.detalles_series === 'object') {
          allDetalles = { ...currentRecord.detalles_series }
        }
      }

      // Parsear minutos_json existente
      let allMinutos: any = {}
      if (currentRecord?.minutos_json) {
        if (typeof currentRecord.minutos_json === 'string') {
          try {
            allMinutos = JSON.parse(currentRecord.minutos_json)
          } catch (e) {
            allMinutos = {}
          }
        } else if (typeof currentRecord.minutos_json === 'object') {
          allMinutos = { ...currentRecord.minutos_json }
        }
      }

      // Parsear calorias_json existente
      let allCalorias: any = {}
      if (currentRecord?.calorias_json) {
        if (typeof currentRecord.calorias_json === 'string') {
          try {
            allCalorias = JSON.parse(currentRecord.calorias_json)
          } catch (e) {
            allCalorias = {}
          }
        } else if (typeof currentRecord.calorias_json === 'object') {
          allCalorias = { ...currentRecord.calorias_json }
        }
      }

      // Actualizar solo el ejercicio actual
      // Filtrar series válidas (que tengan series y repeticiones)
      const validSeries = editingSeries.filter(serie =>
        serie.series && serie.repeticiones &&
        parseInt(serie.series) > 0 && parseInt(serie.repeticiones) > 0
      )

      const detalleSeriesString = validSeries.length > 0
        ? validSeries
          .map((serie) => `(${serie.peso || 0}-${serie.repeticiones}-${serie.series})`)
          .join(';')
        : null

      // Buscar todas las keys relacionadas con este ejercicio en detalles_series
      const ejercicioKeys = exercise.ejercicioKeys || []
      const baseEjId = ejercicioIdStr.split('_')[0]
      const baseOriginalEjId = originalEjercicioIdStr ? originalEjercicioIdStr.split('_')[0] : null
      const basesToClean = [baseEjId, baseOriginalEjId].filter(Boolean) as string[]

      // Limpiar minutos/calorías antiguos de este ejercicio
      ejercicioKeys.forEach(key => {
        delete allMinutos[key]
        delete allCalorias[key]
      })
      // También eliminar por base ID
      Object.keys(allMinutos).forEach(key => {
        if (basesToClean.includes(key.split('_')[0])) {
          delete allMinutos[key]
        }
      })
      Object.keys(allCalorias).forEach(key => {
        if (basesToClean.includes(key.split('_')[0])) {
          delete allCalorias[key]
        }
      })

      if (validSeries.length > 0) {
        // Si solo hay una serie válida, guardarla como objeto directo (compatibilidad)
        if (validSeries.length === 1) {
          const serie = validSeries[0]
          const detailKey = `${baseEjId}_1`
          allDetalles[detailKey] = {
            orden: 1,
            bloque: 1,
            ejercicio_id: parseInt(baseEjId),
            detalle_series: `(${serie.peso || 0}-${serie.repeticiones}-${serie.series})`
          }

          // Agregar minutos si existen
          if (serie.minutos && parseInt(serie.minutos) > 0) {
            allMinutos[detailKey] = parseInt(serie.minutos)
          }

          // Agregar calorías si existen
          if (serie.calorias && parseInt(serie.calorias) > 0) {
            allCalorias[detailKey] = parseInt(serie.calorias)
          }
        } else {
          // Si hay múltiples series, guardarlas con formato de bloques
          validSeries.forEach((serie, index) => {
            const detailKey = `${baseEjId}_${index + 1}`
            allDetalles[detailKey] = {
              orden: index + 1,
              bloque: index + 1,
              ejercicio_id: parseInt(baseEjId),
              detalle_series: `(${serie.peso || 0}-${serie.repeticiones}-${serie.series})`
            }

            // Agregar minutos si existen
            if (serie.minutos && parseInt(serie.minutos) > 0) {
              allMinutos[detailKey] = parseInt(serie.minutos)
            }

            // Agregar calorías si existen
            if (serie.calorias && parseInt(serie.calorias) > 0) {
              allCalorias[detailKey] = parseInt(serie.calorias)
            }
          })
        }
      } else {
        // Eliminar si no tiene datos válidos
        ejercicioKeys.forEach(key => {
          delete allDetalles[key]
          delete allMinutos[key]
          delete allCalorias[key]
        })
        Object.keys(allDetalles).forEach(key => {
          if (basesToClean.includes(key.split('_')[0])) {
            delete allDetalles[key]
          }
        })
      }

      // Actualizar en la base de datos
      const { error } = await supabase
        .from('progreso_cliente')
        .update({
          detalles_series: allDetalles,
          minutos_json: allMinutos,
          calorias_json: allCalorias
        })
        .eq('cliente_id', clientId)
        .eq('fecha', exercise.fecha_ejercicio)

      if (error) {
        console.error('Error actualizando series:', error)
        return
      }

      // Actualizar el estado local
      const updatedExercises = selectedDayExercises.map(ex =>
        ex.id === editingExerciseId
          ? {
            ...ex,
            detalle_series: detalleSeriesString,
            minutosJson: allMinutos,
            caloriasJson: allCalorias,
            ejercicioKeys: validSeries.length > 0
              ? validSeries.map((_, idx) => `${baseEjId}_${idx + 1}`)
              : [],
            original_ejercicio_id: undefined
          }
          : ex
      )
      setSelectedDayExercises(updatedExercises)

      // Trigger Cascade Modal
      const dayName = getDayName(new Date(exercise.fecha_ejercicio).getDay())

      setCascadeModal({
        isOpen: true,
        type: 'fitness',
        mode: exercise.original_ejercicio_id ? 'swap' : 'update',
        sourceDate: exercise.fecha_ejercicio,
        sourceDayName: dayName,
        itemName: exercise.ejercicio_nombre || 'Ejercicio',
        payload: {
          activityId: exercise.actividad_id,
          originalId: exercise.original_ejercicio_id || exercise.ejercicio_id,
          newId: exercise.ejercicio_id,
          validSeries: validSeries
        }
      })

    } catch (error) {
      console.error('Error guardando series:', error)
    }
  }

  // Función para activar/cancelar modo de selección de nueva fecha (solo fechas futuras)
  const handleEditDate = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Permitir editar cualquier fecha (pasado, hoy o futuro)
    // if (date <= today) { ... }

    if (isSelectingNewDate) {
      // Cancelar modo de selección
      setIsSelectingNewDate(false)
      setEditingDate(null)
      setNewDate(null)
      setSelectedDayForEdit(null)
      setTargetDayForEdit(null)
      setSelectedActivityIdsForDateChange([])
    } else {
      // Activar modo de selección
      setEditingDate(date)
      setNewDate(null)
      setSelectedDayForEdit(date)
      setTargetDayForEdit(null)
      setIsSelectingNewDate(true)

      try {
        const dayStr = date.toISOString().split('T')[0]
        const activitiesFromLoadedDetail = (dayData?.[dayStr]?.exercises || [])
          .map((e) => e.actividad_id)
          .filter((id) => id !== undefined && id !== null)
          .map((id) => String(id))

        const activitiesFromSummary = (summaryRowsByDate?.[dayStr] || [])
          .map((r) => r.activity_id)
          .filter((id) => id !== undefined && id !== null)
          .map((id) => String(id))

        const activitiesForDay = activitiesFromLoadedDetail.length > 0 ? activitiesFromLoadedDetail : activitiesFromSummary
        setSelectedActivityIdsForDateChange(Array.from(new Set(activitiesForDay)))
      } catch {
        setSelectedActivityIdsForDateChange([])
      }
    }
  }


  // Función para confirmar y actualizar las fechas de los ejercicios
  const confirmUpdateDate = async () => {
    if (!editingDate || !newDate) return

    // Validar que la nueva fecha sea futura
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (newDate <= today) {
      console.log('No se puede cambiar a una fecha pasada o de hoy')
      return
    }

    try {
      const oldDateStr = editingDate.toISOString().split('T')[0]
      const newDateStr = newDate.toISOString().split('T')[0]
      const oldDayOfWeek = editingDate.getDay() // 0 = domingo, 1 = lunes, etc.
      const newDayOfWeek = newDate.getDay()

      console.log('📅 ClientCalendar: Moviendo ejercicio', {
        oldDateStr,
        newDateStr,
        applyToAllSameDays,
        oldDayOfWeek,
        newDayOfWeek
      })

      const selectedSet = new Set((selectedActivityIdsForDateChange || []).map(String))
      const shouldFilterByActivity = selectedSet.size > 0

      const progressUpdate = await supabase
        .from('progreso_cliente')
        .update({ fecha: newDateStr })
        .eq('cliente_id', clientId)
        .eq('fecha', oldDateStr)

      if (progressUpdate.error) {
        console.error('❌ [EDIT DATE] Error actualizando progreso_cliente:', progressUpdate.error)
      }

      const nutritionUpdate = await supabase
        .from('progreso_cliente_nutricion')
        .update({ fecha: newDateStr })
        .eq('cliente_id', clientId)
        .eq('fecha', oldDateStr)

      if (nutritionUpdate.error) {
        console.error('❌ [EDIT DATE] Error actualizando progreso_cliente_nutricion:', nutritionUpdate.error)
      }

      // Si hay filtro de actividades, re-hacer updates con filtro por actividad
      // (Supabase no permite condicionar dinámicamente el query sin duplicar; hacemos el camino correcto cuando hay selección)
      if (shouldFilterByActivity) {
        const progressFiltered = await supabase
          .from('progreso_cliente')
          .update({ fecha: newDateStr })
          .eq('cliente_id', clientId)
          .eq('fecha', oldDateStr)
          .in('actividad_id', Array.from(selectedSet))

        if (progressFiltered.error) {
          console.error('❌ [EDIT DATE] Error actualizando progreso_cliente (filtrado):', progressFiltered.error)
        }

        const nutritionFiltered = await supabase
          .from('progreso_cliente_nutricion')
          .update({ fecha: newDateStr })
          .eq('cliente_id', clientId)
          .eq('fecha', oldDateStr)
          .in('actividad_id', Array.from(selectedSet))

        if (nutritionFiltered.error) {
          console.error('❌ [EDIT DATE] Error actualizando progreso_cliente_nutricion (filtrado):', nutritionFiltered.error)
        }
      }

      // Cerrar modales y recargar datos
      setShowConfirmModal(false)
      setIsSelectingNewDate(false)
      setEditingDate(null)
      setNewDate(null)
      setApplyToAllSameDays(false)
      setSelectedDayForEdit(null)
      setTargetDayForEdit(null)
      setSelectedActivityIdsForDateChange([])

      // Recargar los datos del calendario
      await fetchClientCalendarSummary()

    } catch (error) {
      console.error('❌ [EDIT DATE] Error general:', error)
    }
  }


  // Función para obtener datos de ejercicios del cliente
  const fetchClientExercises = async () => {
    try {
      setLoading(true)

      // ✅ Obtener enrollments del cliente para saber sus actividades y fechas de inicio
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('activity_enrollments')
        .select('id, activity_id, start_date, status, created_at')
        .eq('client_id', clientId)
        .eq('status', 'activa')

      if (enrollmentsError) {
        console.warn('⚠️ [CLIENT CALENDAR] Error obteniendo enrollments:', enrollmentsError)
      }

      // ✅ Obtener progreso del cliente desde la nueva tabla
      const { data: progressRecords, error } = await supabase
        .from('progreso_cliente')
        .select('id, fecha, actividad_id, ejercicios_completados, ejercicios_pendientes, detalles_series, minutos_json, calorias_json')
        .eq('cliente_id', clientId)
        .order('fecha', { ascending: false })

      // ✅ Obtener progreso de nutrición también
      const { data: nutritionRecords, error: nutritionError } = await supabase
        .from('progreso_cliente_nutricion')
        .select('id, fecha, actividad_id, ejercicios_completados, ejercicios_pendientes, macros, ingredientes')
        .eq('cliente_id', clientId)
        .order('fecha', { ascending: false })

      // ✅ Obtener IDs de ejercicios y platos desde progreso_cliente
      const ejercicioIds = new Set<string>()
      const actividadIds = new Set<string>()
      const fechasConRegistros = new Set<string>() // Para rastrear fechas con registros reales

      // Procesar registros de progreso_cliente
      progressRecords?.forEach((record: any) => {
        fechasConRegistros.add(record.fecha)

        let completados: any[] = []
        let pendientes: any[] = []

        try {
          // Completados puede ser objeto {} o array
          if (Array.isArray(record.ejercicios_completados)) {
            completados = record.ejercicios_completados.map((id: string) => String(id))
          } else if (typeof record.ejercicios_completados === 'object' && record.ejercicios_completados) {
            completados = Object.keys(record.ejercicios_completados)
          } else if (typeof record.ejercicios_completados === 'string') {
            const parsed = JSON.parse(record.ejercicios_completados || '{}')
            completados = Array.isArray(parsed) ? parsed : Object.keys(parsed)
          }

          // Pendientes puede ser objeto {} o array
          if (Array.isArray(record.ejercicios_pendientes)) {
            pendientes = record.ejercicios_pendientes.map((id: string) => String(id))
          } else if (typeof record.ejercicios_pendientes === 'object' && record.ejercicios_pendientes) {
            pendientes = Object.keys(record.ejercicios_pendientes)
          } else if (typeof record.ejercicios_pendientes === 'string') {
            const parsed = JSON.parse(record.ejercicios_pendientes || '{}')
            pendientes = Array.isArray(parsed) ? parsed : Object.keys(parsed)
          }
        } catch (err) {
          // Ignorar errores de parsing
        }

        [...completados, ...pendientes].forEach((id: string) => {
          ejercicioIds.add(String(id))
        })

        // ✅ Guardar actividad_id para determinar el tipo
        if (record.actividad_id !== undefined && record.actividad_id !== null) {
          actividadIds.add(String(record.actividad_id))
        }
      })

      // Procesar registros de progreso_cliente_nutricion
      nutritionRecords?.forEach((record: any) => {
        fechasConRegistros.add(record.fecha)

        let completados: any[] = []
        let pendientes: any[] = []

        try {
          if (Array.isArray(record.ejercicios_completados)) {
            completados = record.ejercicios_completados.map((id: string) => String(id))
          } else if (typeof record.ejercicios_completados === 'object' && record.ejercicios_completados) {
            completados = Object.keys(record.ejercicios_completados)
          } else if (typeof record.ejercicios_completados === 'string') {
            const parsed = JSON.parse(record.ejercicios_completados || '{}')
            completados = Array.isArray(parsed) ? parsed : Object.keys(parsed)
          }

          if (Array.isArray(record.ejercicios_pendientes)) {
            pendientes = record.ejercicios_pendientes.map((id: string) => String(id))
          } else if (typeof record.ejercicios_pendientes === 'object' && record.ejercicios_pendientes) {
            pendientes = Object.keys(record.ejercicios_pendientes)
          } else if (typeof record.ejercicios_pendientes === 'string') {
            const parsed = JSON.parse(record.ejercicios_pendientes || '{}')
            pendientes = Array.isArray(parsed) ? parsed : Object.keys(parsed)
          }
        } catch (err) {
          // Ignorar errores de parsing
        }

        [...completados, ...pendientes].forEach((id: string) => {
          ejercicioIds.add(String(id))
        })

        if (record.actividad_id !== undefined && record.actividad_id !== null) {
          actividadIds.add(String(record.actividad_id))
        }
      })

      // ✅ Obtener enrollments para calcular versiones
      const { data: allEnrollments } = await supabase
        .from('activity_enrollments')
        .select('id, activity_id, created_at, start_date')
        .eq('client_id', clientId)
        .eq('status', 'activa')
        .order('created_at', { ascending: true })

      // ✅ Obtener información de actividades para determinar tipo y nombre
      // Incluir también las actividades de enrollments aunque todavía no haya progreso (evita "Actividad <id>")
      const enrollmentActivityIds = (allEnrollments || [])
        .map((e: any) => parseInt(String(e.activity_id), 10))
        .filter((id: number) => !Number.isNaN(id))

      const actividadIdsNumeric = Array.from(
        new Set(
          Array.from(actividadIds)
            .map((id) => parseInt(id, 10))
            .filter((id) => !Number.isNaN(id))
            .concat(enrollmentActivityIds)
        )
      )
      const { data: actividadesData } = await supabase
        .from('activities')
        .select('id, type, title')
        .in('id', actividadIdsNumeric)

      const actividadTypes = new Map<string, string>()
      const actividadTitulos = new Map<string, string>()
      actividadesData?.forEach((act: any) => {
        actividadTypes.set(String(act.id), act.type)
        actividadTitulos.set(String(act.id), act.title)
      })

      // ✅ Calcular versión para cada enrollment (basado en orden de compra del mismo producto)
      const enrollmentVersions = new Map<number, number>()
      const enrollmentsByActivity = new Map<number, any[]>()

      allEnrollments?.forEach((enrollment: any) => {
        const activityId = enrollment.activity_id
        if (!enrollmentsByActivity.has(activityId)) {
          enrollmentsByActivity.set(activityId, [])
        }
        enrollmentsByActivity.get(activityId)!.push(enrollment)
      })

      // ✅ Asignar versión a cada enrollment (1, 2, 3... según orden de compra)
      enrollmentsByActivity.forEach((enrollments, activityId) => {
        enrollments.forEach((enrollment, index) => {
          enrollmentVersions.set(enrollment.id, index + 1)
        })
      })

      const filterOpts: ActivityFilterOption[] = []
      allEnrollments?.forEach((e: any) => {
        const title = actividadTitulos.get(String(e.activity_id)) || `Actividad ${e.activity_id}`
        filterOpts.push({
          enrollment_id: e.id,
          activity_id: e.activity_id,
          title,
          version: enrollmentVersions.get(e.id) || 1,
          type: actividadTypes.get(String(e.activity_id))
        })
      })
      setActivityFilterOptions(filterOpts)

      // ✅ Recopilar IDs de planificación ANTES de cargar nombres
      const planificacionIds = new Set<string>()

      if (enrollments && enrollments.length > 0) {
        for (const enrollment of enrollments) {
          if (!enrollment.activity_id) continue
          const actividadId = enrollment.activity_id

          // ✅ Obtener planificación semanal para esta actividad
          const { data: planificacion, error: planError } = await supabase
            .from('planificacion_ejercicios')
            .select('*')
            .eq('actividad_id', actividadId)
            .order('numero_semana', { ascending: true })

          if (planError || !planificacion || planificacion.length === 0) continue

          // ✅ Recopilar IDs de la planificación
          planificacion.forEach((semana: any) => {
            const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
            diasSemana.forEach((dia: string) => {
              const diaData = semana[dia]
              if (!diaData) return

              let ejerciciosDelDia: any[] = []
              try {
                if (typeof diaData === 'string') {
                  ejerciciosDelDia = JSON.parse(diaData)
                } else if (Array.isArray(diaData)) {
                  ejerciciosDelDia = diaData
                } else if (diaData && typeof diaData === 'object') {
                  ejerciciosDelDia = (diaData as any).ejercicios || (diaData as any).exercises || []
                }
              } catch (err) {
                // Ignorar errores de parsing
              }

              ejerciciosDelDia.forEach((ej: any) => {
                const ejId = String(ej.id || ej.ejercicioId || ej.ejercicio_id)
                if (ejId) planificacionIds.add(ejId)
              })
            })
          })
        }
      }

      // ✅ Combinar IDs de progreso_cliente y planificación
      const allEjercicioIds = new Set([...ejercicioIds, ...planificacionIds])

      // ✅ Separar IDs en ejercicios y platos (todos los IDs pueden ser de cualquier tipo)
      const ejercicioIdsArray = Array.from(allEjercicioIds).map(id => parseInt(id, 10)).filter(id => !isNaN(id))
      const platoIdsArray = Array.from(allEjercicioIds).map(id => parseInt(id, 10)).filter(id => !isNaN(id))

      // ✅ Obtener nombres de ejercicios desde ejercicios_detalles
      const { data: ejerciciosData, error: ejerciciosError } = await supabase
        .from('ejercicios_detalles')
        .select('id, nombre_ejercicio')
        .in('id', ejercicioIdsArray)

      // ✅ Obtener nombres de platos desde nutrition_program_details
      const { data: platosData, error: platosError } = await supabase
        .from('nutrition_program_details')
        .select('id, nombre')
        .in('id', platoIdsArray)

      if (ejerciciosError) {
        console.warn('⚠️ [CLIENT CALENDAR] Error obteniendo nombres de ejercicios:', ejerciciosError)
      }

      if (platosError) {
        console.warn('⚠️ [CLIENT CALENDAR] Error obteniendo nombres de platos:', platosError)
      }

      // ✅ Crear un mapa combinado de nombres
      const nombresMap = new Map<string, string>()
      ejerciciosData?.forEach((ej: any) => {
        nombresMap.set(String(ej.id), ej.nombre_ejercicio)
      })
      platosData?.forEach((plato: any) => {
        nombresMap.set(String(plato.id), plato.nombre)
      })

      if (error) {
        console.error('❌ [CLIENT CALENDAR] Error obteniendo ejecuciones:', error)
        // Si hay error, mostrar mensaje informativo
        setDayData({})
        return
      }


      // Procesar datos por día desde progreso_cliente
      const processedData: { [key: string]: DayData } = {}

      progressRecords?.forEach((record: any) => {
        const fecha = record.fecha

        // Manejar tanto arrays nativos de PostgreSQL como strings JSON u objetos
        let completados: any[] = []
        let pendientes: any[] = []

        try {
          // Parsear ejercicios_completados
          let completadosParsed: any = record.ejercicios_completados
          if (typeof record.ejercicios_completados === 'string') {
            completadosParsed = JSON.parse(record.ejercicios_completados || '{}')
          }

          if (Array.isArray(completadosParsed)) {
            completados = completadosParsed.map((id: any) => String(id))
          } else if (completadosParsed && typeof completadosParsed === 'object') {
            // Si es un objeto, obtener las keys
            completados = Object.keys(completadosParsed).map(key => {
              // Extraer el ID base del ejercicio (ej: "1042_1" -> "1042")
              const baseId = key.split('_')[0]
              return baseId
            })
            // Remover duplicados
            completados = [...new Set(completados)]
          }

          // Parsear ejercicios_pendientes
          let pendientesParsed: any = record.ejercicios_pendientes
          if (typeof record.ejercicios_pendientes === 'string') {
            pendientesParsed = JSON.parse(record.ejercicios_pendientes || '{}')
          }

          if (Array.isArray(pendientesParsed)) {
            pendientes = pendientesParsed.map((id: any) => String(id))
          } else if (pendientesParsed && typeof pendientesParsed === 'object') {
            // Si es un objeto, obtener las keys
            pendientes = Object.keys(pendientesParsed).map(key => {
              // Extraer el ID base del ejercicio
              const baseId = key.split('_')[0]
              return baseId
            })
            // Remover duplicados
            pendientes = [...new Set(pendientes)]
          }
        } catch (err) {
          console.warn('Error parseando ejercicios:', err, record)
          completados = []
          pendientes = []
        }

        const allEjercicios = [...completados, ...pendientes]
        // Remover duplicados de allEjercicios
        const allEjerciciosUnique = [...new Set(allEjercicios)]

        if (!processedData[fecha]) {
          processedData[fecha] = {
            date: fecha,
            exerciseCount: 0,
            completedCount: 0,
            totalMinutes: 0,
            exercises: [],
            activities: []
          }
        }

        allEjerciciosUnique.forEach((ejId: string) => {
          const isCompleted = completados.includes(ejId)

          // ✅ Buscar el nombre del ejercicio o plato desde el mapa combinado
          const nombre = nombresMap.get(String(ejId))
          const actividadType = record.actividad_id ? actividadTypes.get(String(record.actividad_id)) : null
          const defaultNombre = actividadType === 'nutricion' || actividadType === 'nutrition_program'
            ? `Plato ${ejId}`
            : `Ejercicio ${ejId}`

          // ✅ Obtener enrollment_id desde activity_enrollments basándome en actividad_id y cliente_id
          // Buscar el enrollment más reciente para esta actividad y cliente
          const enrollmentForActivity = pickEnrollmentForDate(allEnrollments, record.actividad_id, fecha)
          const enrollmentId = enrollmentForActivity?.id
          const version = enrollmentId ? enrollmentVersions.get(enrollmentId) : undefined
          const actividadTitulo = record.actividad_id ? actividadTitulos.get(String(record.actividad_id)) : undefined

          // Buscar todas las keys relacionadas con este ejercicio en detalles_series
          const ejercicioKeys: string[] = []
          try {
            let detalles: any = null
            if (typeof record.detalles_series === 'string') {
              detalles = JSON.parse(record.detalles_series)
            } else if (typeof record.detalles_series === 'object') {
              detalles = record.detalles_series
            }

            if (detalles && typeof detalles === 'object') {
              const ejIdStr = String(ejId)
              // Buscar keys que empiecen con este ID (ej: "1042", "1042_1", "1042_2")
              ejercicioKeys.push(...Object.keys(detalles).filter(key => {
                const baseId = key.split('_')[0]
                return baseId === ejIdStr
              }))
            }
          } catch (err) {
            // Ignorar errores de parsing
          }

          const detalleSeriesValue = (() => {
            try {
              if (!record.detalles_series) return null

              let detalles: any = null
              if (typeof record.detalles_series === 'string') {
                detalles = JSON.parse(record.detalles_series)
              } else if (typeof record.detalles_series === 'object') {
                detalles = record.detalles_series
              }

              if (!detalles || typeof detalles !== 'object' || Array.isArray(detalles)) {
                return null
              }

              const ejIdStr = String(ejId)
              const matchingKey = Object.keys(detalles).find(key => key.split('_')[0] === ejIdStr)
              const detalle = matchingKey ? detalles[matchingKey] : detalles[ejIdStr]

              if (detalle && typeof detalle === 'object' && detalle.detalle_series) {
                return detalle.detalle_series
              }
              return detalle || null
            } catch (err) {
              console.warn('Error parseando detalles_series:', err)
              return null
            }
          })()

          const duracion = (() => {
            try {
              if (!record.minutos_json) return undefined
              let minutos: any = null
              if (typeof record.minutos_json === 'string') {
                minutos = JSON.parse(record.minutos_json)
              } else if (typeof record.minutos_json === 'object') {
                minutos = record.minutos_json
              }
              if (!minutos || typeof minutos !== 'object') return undefined

              const ejIdStr = String(ejId)
              const matchingKey = Object.keys(minutos).find(key => key.split('_')[0] === ejIdStr)
              const value = matchingKey ? minutos[matchingKey] : minutos[ejIdStr]
              return value ? Number(value) : undefined
            } catch {
              return undefined
            }
          })()

          const calorias_estimadas = (() => {
            try {
              if (!record.calorias_json) return undefined
              let calorias: any = null
              if (typeof record.calorias_json === 'string') {
                calorias = JSON.parse(record.calorias_json)
              } else if (typeof record.calorias_json === 'object') {
                calorias = record.calorias_json
              }
              if (!calorias || typeof calorias !== 'object') return undefined

              const ejIdStr = String(ejId)
              const matchingKey = Object.keys(calorias).find(key => key.split('_')[0] === ejIdStr)
              const value = matchingKey ? calorias[matchingKey] : calorias[ejIdStr]
              return value ? Number(value) : undefined
            } catch {
              return undefined
            }
          })()

          const exerciseData: ExerciseExecution = {
            id: `${record.id}-${ejId}`,
            ejercicio_id: ejId,
            completado: isCompleted,
            fecha_ejercicio: fecha,
            nota_cliente: undefined,
            ejercicio_nombre: nombre || defaultNombre,
            actividad_titulo: actividadTitulo,
            actividad_id: record.actividad_id,
            enrollment_id: enrollmentId,
            version: version,
            ejercicioKeys: ejercicioKeys,
            minutosJson: record.minutos_json,
            caloriasJson: record.calorias_json,
            detalle_series: detalleSeriesValue,
            duracion,
            calorias_estimadas
          }

          processedData[fecha].exercises.push(exerciseData)
          processedData[fecha].exerciseCount += 1
          if (isCompleted) {
            processedData[fecha].completedCount += 1
          }

          const mins = Number(duracion ?? 0) || 0
          if (mins > 0) {
            processedData[fecha].totalMinutes += mins
          }
        })
      })

      // Procesar datos por día desde progreso_cliente_nutricion (platos)
      nutritionRecords?.forEach((record: any) => {
        const fecha = record.fecha

        if (!processedData[fecha]) {
          processedData[fecha] = {
            date: fecha,
            exerciseCount: 0,
            completedCount: 0,
            totalMinutes: 0,
            exercises: [],
            activities: []
          }
        }

        // Parsear pendientes/completados preservando ocurrencia (orden/bloque)
        let completadosKeys: string[] = []
        let pendientesKeys: string[] = []
        let pendientesItems: Array<{ id: number; orden: number; bloque: number }> = []
        let completadosItems: Array<{ id: number; orden: number; bloque: number }> = []
        try {
          const rawCompleted = typeof record.ejercicios_completados === 'string'
            ? JSON.parse(record.ejercicios_completados || '{}')
            : record.ejercicios_completados
          const rawPending = typeof record.ejercicios_pendientes === 'string'
            ? JSON.parse(record.ejercicios_pendientes || '{}')
            : record.ejercicios_pendientes

          const isNewSchema = (v: any) => v && typeof v === 'object' && !Array.isArray(v) && Array.isArray(v.ejercicios)

          if (isNewSchema(rawPending)) {
            pendientesItems = (rawPending.ejercicios || []).map((x: any) => ({
              id: Number(x?.id),
              orden: Number(x?.orden),
              bloque: Number(x?.bloque)
            })).filter((x: any) => Number.isFinite(x.id) && Number.isFinite(x.orden) && Number.isFinite(x.bloque))
          }

          if (isNewSchema(rawCompleted)) {
            completadosItems = (rawCompleted.ejercicios || []).map((x: any) => ({
              id: Number(x?.id),
              orden: Number(x?.orden),
              bloque: Number(x?.bloque)
            })).filter((x: any) => Number.isFinite(x.id) && Number.isFinite(x.orden) && Number.isFinite(x.bloque))
          }

          if (Array.isArray(rawCompleted)) {
            completadosKeys = rawCompleted.map((k: any) => String(k))
          } else if (rawCompleted && typeof rawCompleted === 'object') {
            completadosKeys = Object.keys(rawCompleted)
          }

          if (Array.isArray(rawPending)) {
            pendientesKeys = rawPending.map((k: any) => String(k))
          } else if (rawPending && typeof rawPending === 'object') {
            pendientesKeys = Object.keys(rawPending)
          }
        } catch {
          completadosKeys = []
          pendientesKeys = []
          pendientesItems = []
          completadosItems = []
        }

        // Parsear receta/macros (contienen nombre/minutos/calorias por key)
        let macrosData: any = null
        try {
          macrosData = typeof record.macros === 'string' ? JSON.parse(record.macros) : record.macros
        } catch {
          macrosData = null
        }

        const completionKeySet = new Set(
          completadosItems.map(i => `${i.id}_${i.orden}_${i.bloque}`)
        )

        const itemsUnique: Array<{ id: number; orden: number; bloque: number }> = (() => {
          if (pendientesItems.length > 0 || completadosItems.length > 0) {
            const all = [...pendientesItems, ...completadosItems]
            const seen = new Set<string>()
            return all.filter((i) => {
              const k = `${i.id}_${i.orden}_${i.bloque}`
              if (seen.has(k)) return false
              seen.add(k)
              return true
            })
          }
          return []
        })()

        if (itemsUnique.length > 0) {
          itemsUnique
            .sort((a, b) => (a.bloque - b.bloque) || (a.orden - b.orden))
            .forEach((item) => {
              const key = `${item.id}_${item.orden}`
              const completionKey = `${item.id}_${item.orden}_${item.bloque}`
              const isCompleted = completionKeySet.has(completionKey)

              const nombreFromMap = nombresMap.get(String(item.id))
              const nombre = nombreFromMap || `Plato ${item.id}`

              const minutos = macrosData?.[key]?.minutos
              const kcal = macrosData?.[key]?.calorias

              const enrollmentForActivity = pickEnrollmentForDate(allEnrollments, record.actividad_id, fecha)
              const enrollmentId = enrollmentForActivity?.id
              const version = enrollmentId ? enrollmentVersions.get(enrollmentId) : undefined
              const actividadTitulo = record.actividad_id ? actividadTitulos.get(String(record.actividad_id)) : undefined

              const exerciseData: ExerciseExecution = {
                id: `nut-${record.id}-${key}-${item.bloque}`,
                ejercicio_id: String(item.id),
                completado: isCompleted,
                fecha_ejercicio: fecha,
                ejercicio_nombre: nombre,
                actividad_titulo: actividadTitulo,
                actividad_id: record.actividad_id,
                enrollment_id: enrollmentId,
                version,
                nutrition_record_id: String(record.id),
                nutrition_key: String(key),
                nutrition_bloque: item.bloque,
                nutrition_orden: item.orden,
                is_nutricion: true,
                nutricion_macros: {
                  proteinas: macrosData?.[key]?.proteinas !== undefined ? Number(macrosData?.[key]?.proteinas) : undefined,
                  carbohidratos: macrosData?.[key]?.carbohidratos !== undefined ? Number(macrosData?.[key]?.carbohidratos) : undefined,
                  grasas: macrosData?.[key]?.grasas !== undefined ? Number(macrosData?.[key]?.grasas) : undefined,
                  calorias: kcal !== undefined && kcal !== null ? Number(kcal) : undefined,
                  minutos: minutos !== undefined && minutos !== null ? Number(minutos) : undefined
                },
                duracion: minutos !== undefined && minutos !== null ? Number(minutos) : undefined,
                calorias_estimadas: kcal !== undefined && kcal !== null ? Number(kcal) : undefined,
                detalle_series: null
              }

              processedData[fecha].exercises.push(exerciseData)
              processedData[fecha].exerciseCount += 1
              if (isCompleted) {
                processedData[fecha].completedCount += 1
              }

              const mins = Number(minutos ?? 0) || 0
              if (mins > 0) {
                processedData[fecha].totalMinutes += mins
              }
            })
        } else {
          const keysUnique = Array.from(new Set([...completadosKeys, ...pendientesKeys]))
          keysUnique.forEach((key: string) => {
            const baseId = key.split('_')[0]
            const isCompleted = completadosKeys.includes(key)

            const nombreFromMap = nombresMap.get(String(baseId))
            const nombre = nombreFromMap || `Plato ${baseId}`

            const minutos = macrosData?.[key]?.minutos
            const kcal = macrosData?.[key]?.calorias

            const enrollmentForActivity = pickEnrollmentForDate(allEnrollments, record.actividad_id, fecha)
            const enrollmentId = enrollmentForActivity?.id
            const version = enrollmentId ? enrollmentVersions.get(enrollmentId) : undefined
            const actividadTitulo = record.actividad_id ? actividadTitulos.get(String(record.actividad_id)) : undefined

            const exerciseData: ExerciseExecution = {
              id: `nut-${record.id}-${key}`,
              ejercicio_id: String(baseId),
              completado: isCompleted,
              fecha_ejercicio: fecha,
              ejercicio_nombre: nombre,
              actividad_titulo: actividadTitulo,
              actividad_id: record.actividad_id,
              enrollment_id: enrollmentId,
              version,
              nutrition_record_id: String(record.id),
              nutrition_key: String(key),
              is_nutricion: true,
              nutricion_macros: {
                proteinas: macrosData?.[key]?.proteinas !== undefined ? Number(macrosData?.[key]?.proteinas) : undefined,
                carbohidratos: macrosData?.[key]?.carbohidratos !== undefined ? Number(macrosData?.[key]?.carbohidratos) : undefined,
                grasas: macrosData?.[key]?.grasas !== undefined ? Number(macrosData?.[key]?.grasas) : undefined,
                calorias: kcal !== undefined && kcal !== null ? Number(kcal) : undefined,
                minutos: minutos !== undefined && minutos !== null ? Number(minutos) : undefined
              },
              duracion: minutos !== undefined && minutos !== null ? Number(minutos) : undefined,
              calorias_estimadas: kcal !== undefined && kcal !== null ? Number(kcal) : undefined,
              detalle_series: null
            }

            processedData[fecha].exercises.push(exerciseData)
            processedData[fecha].exerciseCount += 1
            if (isCompleted) {
              processedData[fecha].completedCount += 1
            }

            const mins = Number(minutos ?? 0) || 0
            if (mins > 0) {
              processedData[fecha].totalMinutes += mins
            }
          })
        }
      })

      // ✅ Calendar events del cliente (otras ocupaciones) - sumar al total del día
      const eventsMinutesByDate: Record<string, number> = {}
      try {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        const monthEndExclusive = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)

        const { data: parts, error: partsErr } = await supabase
          .from('calendar_event_participants')
          .select('event_id')
          .eq('client_id', clientId)

        if (partsErr) {
          console.warn('⚠️ [CLIENT CALENDAR] Error obteniendo calendar_event_participants:', partsErr)
        }

        const eventIds = Array.from(
          new Set(
            (parts || [])
              .map((p: any) => String(p?.event_id || ''))
              .filter((id: string) => !!id)
          )
        )

        const eventsRes = eventIds.length
          ? await supabase
            .from('calendar_events')
            .select('id, start_time, end_time')
            .in('id', eventIds)
            .gte('start_time', monthStart.toISOString())
            .lt('start_time', monthEndExclusive.toISOString())
          : { data: [], error: null }

        if ((eventsRes as any)?.error) {
          console.warn('⚠️ [CLIENT CALENDAR] Error obteniendo calendar_events:', (eventsRes as any).error)
        }

        const events = Array.isArray((eventsRes as any)?.data) ? (eventsRes as any).data : []
        events.forEach((ev: any) => {
          if (!ev?.start_time) return
          const start = new Date(String(ev.start_time))
          if (Number.isNaN(start.getTime())) return
          const end = ev.end_time ? new Date(String(ev.end_time)) : null
          const mins = (() => {
            if (end && !Number.isNaN(end.getTime())) {
              const diff = (end.getTime() - start.getTime()) / 60000
              return diff > 0 ? diff : 0
            }
            return 30
          })()
          const dayKey = start.toISOString().split('T')[0]
          if (!dayKey) return
          const add = Math.round(mins)
          if (!eventsMinutesByDate[dayKey]) eventsMinutesByDate[dayKey] = 0
          eventsMinutesByDate[dayKey] += add
        })

        Object.keys(eventsMinutesByDate).forEach((dayKey) => {
          const mins = Number(eventsMinutesByDate[dayKey] || 0) || 0
          if (mins <= 0) return

          // Consideramos estos minutos como "otras actividades"
          fechasConRegistros.add(dayKey)
          if (!processedData[dayKey]) {
            processedData[dayKey] = {
              date: dayKey,
              exerciseCount: 0,
              completedCount: 0,
              totalMinutes: 0,
              exercises: [],
              activities: []
            }
          }
          processedData[dayKey].totalMinutes += mins
        })
      } catch (e) {
        console.warn('⚠️ [CLIENT CALENDAR] Error cargando calendar events:', e)
      }

      // ✅ Solo mostrar días con registros reales, NO agregar planificación futura
      // Filtrar processedData para incluir solo días con registros reales
      const processedDataFiltered: { [key: string]: DayData } = {}
      Object.keys(processedData).forEach(fecha => {
        if (fechasConRegistros.has(fecha)) {
          processedDataFiltered[fecha] = processedData[fecha]
        }
      })

      setDayData(processedDataFiltered)
      setOtherMinutesByDate(eventsMinutesByDate)

      // Calcular la última ejercitación (último día que completó al menos un ejercicio)
      const lastWorkoutDate = calculateLastWorkoutDate(processedDataFiltered)
      if (onLastWorkoutUpdate) {
        onLastWorkoutUpdate(lastWorkoutDate)
      }
    } catch (error) {
      console.error('❌ [CLIENT CALENDAR] Error general:', error)
    } finally {
      setLoading(false)
    }
  }

  // CÓDIGO COMENTADO: Ya no agregamos planificación futura automáticamente
  // Solo mostramos días con registros reales en progreso_cliente o progreso_cliente_nutricion
  /*
      // ✅ Cargar planificación semanal desde planificacion_ejercicios para cada actividad
      if (enrollments && enrollments.length > 0) {
        const currentMonth = currentDate.getMonth()
        const currentYear = currentDate.getFullYear()
        const monthStart = new Date(currentYear, currentMonth, 1)
        const monthEnd = new Date(currentYear, currentMonth + 1, 0)

        for (const enrollment of enrollments) {
          if (!enrollment.start_date || !enrollment.activity_id) continue

          const startDate = new Date(enrollment.start_date)
          const actividadId = enrollment.activity_id

          // ✅ Obtener planificación semanal para esta actividad
          const { data: planificacion, error: planError } = await supabase
            .from('planificacion_ejercicios')
            .select('*')
            .eq('actividad_id', actividadId)
            .order('numero_semana', { ascending: true })

          if (planError) {
            console.warn(`⚠️ [CLIENT CALENDAR] Error obteniendo planificación para actividad ${actividadId}:`, planError)
            continue
          }

          if (!planificacion || planificacion.length === 0) {
            console.log(`ℹ️ [CLIENT CALENDAR] No hay planificación para actividad ${actividadId}`)
            continue
          }

          // ✅ Recopilar IDs de la planificación
          planificacion.forEach((semana: any) => {
            const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
            diasSemana.forEach((dia: string) => {
              const diaData = semana[dia]
              if (!diaData) return

              let ejerciciosDelDia: any[] = []
              try {
                if (typeof diaData === 'string') {
                  ejerciciosDelDia = JSON.parse(diaData)
                } else if (Array.isArray(diaData)) {
                  ejerciciosDelDia = diaData
                } else if (diaData && typeof diaData === 'object') {
                  ejerciciosDelDia = (diaData as any).ejercicios || (diaData as any).exercises || []
                }
              } catch (err) {
                // Ignorar errores de parsing
              }

              ejerciciosDelDia.forEach((ej: any) => {
                const ejId = String(ej.id || ej.ejercicioId || ej.ejercicio_id)
                if (ejId) planificacionIds.add(ejId)
              })
            })
          })

          // ✅ Obtener períodos para calcular semanas totales
          const { data: periodosData } = await supabase
            .from('periodos')
            .select('cantidad_periodos')
            .eq('actividad_id', actividadId)
            .single()

          const cantidadPeriodos = periodosData?.cantidad_periodos || 1
          const maxSemanasPlanificacion = Math.max(...planificacion.map((p: any) => p.numero_semana))

          // ✅ Obtener tipo de actividad
          const actividadType = actividadTypes.get(actividadId)
          
          // ✅ Si no tenemos el tipo, obtenerlo
          if (!actividadType && actividadId) {
            const { data: actData } = await supabase
              .from('activities')
              .select('type')
              .eq('id', actividadId)
              .single()
            
            if (actData) {
              actividadTypes.set(actividadId, actData.type)
            }
          }

          // ✅ Procesar cada día del mes actual
          for (let day = 1; day <= monthEnd.getDate(); day++) {
            const fecha = new Date(currentYear, currentMonth, day)
            const fechaStr = fecha.toISOString().split('T')[0]

            // Solo procesar fechas futuras o iguales a start_date
            if (fecha < startDate) continue

            // Calcular semana del ciclo
            const diffDays = Math.floor((fecha.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
            const totalWeekNumber = Math.floor(diffDays / 7) + 1
            const weekInCycle = ((totalWeekNumber - 1) % maxSemanasPlanificacion) + 1

            // Obtener día de la semana (0 = domingo, 1 = lunes, ..., 6 = sábado)
            const dayOfWeek = fecha.getDay()
            const diasMap: Record<number, string> = {
              0: 'domingo',
              1: 'lunes',
              2: 'martes',
              3: 'miercoles',
              4: 'jueves',
              5: 'viernes',
              6: 'sabado'
            }
            const diaColumna = diasMap[dayOfWeek]

            // ✅ Obtener planificación para esta semana y día
            const semanaPlanificacion = planificacion.find(p => p.numero_semana === weekInCycle)
            if (!semanaPlanificacion || !semanaPlanificacion[diaColumna]) continue

            let ejerciciosDelDia: any[] = []
            try {
              const diaData = semanaPlanificacion[diaColumna]
              if (typeof diaData === 'string') {
                ejerciciosDelDia = JSON.parse(diaData)
              } else if (Array.isArray(diaData)) {
                ejerciciosDelDia = diaData
              } else if (diaData && typeof diaData === 'object') {
                // Si es un objeto con estructura { ejercicios: [...] }
                ejerciciosDelDia = (diaData as any).ejercicios || (diaData as any).exercises || []
              }
            } catch (err) {
              console.warn(`⚠️ Error parseando planificación para ${fechaStr}:`, err)
              continue
            }

            if (!Array.isArray(ejerciciosDelDia) || ejerciciosDelDia.length === 0) continue

            // ✅ Inicializar día si no existe
            if (!processedData[fechaStr]) {
              processedData[fechaStr] = {
                date: fechaStr,
                exerciseCount: 0,
                completedCount: 0,
                exercises: [],
                activities: []
              }
            }

            // ✅ Agregar ejercicios/platos planificados
            ejerciciosDelDia.forEach((ej: any) => {
              const ejId = String(ej.id || ej.ejercicioId || ej.ejercicio_id)
              if (!ejId) return

              // Verificar si ya existe en processedData (desde progreso_cliente)
              const existe = processedData[fechaStr].exercises.some(
                ex => String(ex.ejercicio_id) === ejId
              )

              if (!existe) {
                const nombre = nombresMap.get(ejId)
                const defaultNombre = actividadType === 'nutricion' || actividadType === 'nutrition_program'
                  ? `Plato ${ejId}`
                  : `Ejercicio ${ejId}`

                // ✅ Obtener enrollment_id y versión para esta actividad
                const enrollmentForActivity = enrollments.find(e => e.activity_id === actividadId)
                const enrollmentId = enrollmentForActivity?.id
                const version = enrollmentId ? enrollmentVersions.get(enrollmentId) : undefined
                const actividadTitulo = actividadTitulos.get(actividadId)

                const exerciseData: ExerciseExecution = {
                  id: `plan-${actividadId}-${fechaStr}-${ejId}`,
                  ejercicio_id: ejId,
                  completado: false, // No completado aún (solo planificado)
                  fecha_ejercicio: fechaStr,
                  duracion: undefined,
                  calorias_estimadas: undefined,
                  nota_cliente: undefined,
                  ejercicio_nombre: nombre || defaultNombre,
                  actividad_titulo: actividadTitulo,
                  actividad_id: actividadId,
                  enrollment_id: enrollmentId,
                  version: version,
                  detalle_series: null
                }

                processedData[fechaStr].exercises.push(exerciseData)
                processedData[fechaStr].exerciseCount += 1
              }
            })
          }
        }
      }

      */

  // Obtener datos de ejercicios del cliente
  useEffect(() => {
    if (clientId) {
      fetchClientCalendarSummary()
    }
  }, [clientId, supabase, currentDate]) // ✅ Agregar currentDate para recargar cuando cambia el mes

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExerciseDropdown) {
        const target = event.target as HTMLElement
        if (!target.closest('.exercise-dropdown')) {
          setShowExerciseDropdown(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showExerciseDropdown])

  // Navegación del calendario
  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const toggleMonthPicker = () => {
    setMonthPickerYear(currentDate.getFullYear())
    setShowMonthPicker((prev) => !prev)
  }

  const handleSelectMonth = (monthIndex: number) => {
    setCurrentDate(new Date(monthPickerYear, monthIndex, 1))
    setShowMonthPicker(false)
  }

  // Generar días del mes
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const currentDay = new Date(startDate)

    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay))
      currentDay.setDate(currentDay.getDate() + 1)
    }

    return days
  }

  // Obtener datos del día
  const getDayData = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    return filteredDayData[dateString]
  }

  // Manejar click en día
  const handleDayClick = (date: Date) => {
    if (isSelectingNewDate) {
      // Modo de selección de nueva fecha
      setTargetDayForEdit(date)
      setNewDate(date)
      setShowConfirmModal(true)
      return
    }

    // Modo normal - mostrar ejercicios del día (aunque esté vacío)
    setSelectedDate(date)
    setSelectedDayExercises([])
    setExpandedActivityKeys({})
    setSelectedDayForEdit(null)
    setTargetDayForEdit(null)
  }

  // Auto-scroll al detalle del día cuando se selecciona
  useEffect(() => {
    if (!selectedDate) return
    if (isSelectingNewDate) return
    onDaySelected?.()
    const node = dayDetailRef?.current
    if (node) {
      // Esperar a que el DOM pinte el panel
      requestAnimationFrame(() => {
        node.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }, [selectedDate, isSelectingNewDate, onDaySelected, dayDetailRef])

  useEffect(() => {
    if (!selectedDate) return
    // No auto-cargamos detalle acá; se hace lazy al expandir una actividad.
    setSelectedDayExercises([])
  }, [selectedDate])

  // Formatear fecha
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: '2-digit',
      month: 'short',
      day: 'numeric'
    })
  }

  // Obtener nombre del día de la semana
  const getDayName = (dayOfWeek: number) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    return days[dayOfWeek]
  }

  // Obtener plural correcto del día de la semana
  const getDayNamePlural = (dayOfWeek: number) => {
    const days = ['Domingos', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábados']
    return days[dayOfWeek]
  }

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  // Función para aplicar cambios en cascada (futuro)
  const handleApplyCascade = async (scope: 'same_day' | 'future_all') => {
    if (!cascadeModal) return
    setLoading(true)

    try {
      const { type, mode, sourceDate, payload } = cascadeModal
      const nextDay = new Date(sourceDate)
      nextDay.setDate(nextDay.getDate() + 1)
      const startDateStr = nextDay.toISOString().split('T')[0]
      const sourceDayIndex = new Date(sourceDate + 'T00:00:00').getDay()

      const updates: any[] = []

      if (type === 'fitness') {
        console.log(`Cascade Fitness: Fetching rows >= ${startDateStr}`)
        // Fetch all future progress
        const { data: rows, error } = await supabase
          .from('progreso_cliente')
          .select('*')
          .eq('cliente_id', clientId)
          .gte('fecha', startDateStr)

        if (error) {
          console.error('Cascade Fetch Error:', error)
          throw error
        }
        if (!rows) return

        for (const row of rows) {
          const rowDate = new Date(row.fecha + 'T00:00:00')
          const rowDayIndex = rowDate.getDay()

          // Filter by Day of Week
          if (scope === 'same_day' && rowDayIndex !== sourceDayIndex) continue

          // Parse JSONs
          const detalles = typeof row.detalles_series === 'string' ? JSON.parse(row.detalles_series) : (row.detalles_series || {})
          const minutos = typeof row.minutos_json === 'string' ? JSON.parse(row.minutos_json) : (row.minutos_json || {})
          const calorias = typeof row.calorias_json === 'string' ? JSON.parse(row.calorias_json) : (row.calorias_json || {})

          let modified = false

          // Swap Logic
          if (mode === 'swap') {
            // payload: { originalId, newId, validSeries }
            // originalId might be '1042_1' or '1042'
            const oldBase = payload.originalId ? String(payload.originalId).split('_')[0] : null
            const newBase = String(payload.newId).split('_')[0]

            if (oldBase && newBase) {
              // Find keys starting with oldBase
              const detailKeys = Object.keys(detalles).filter(k => k.split('_')[0] === oldBase)

              if (detailKeys.length > 0) {
                modified = true
                // Remove old keys and add new keys
                detailKeys.forEach(k => {
                  delete detalles[k]
                  delete minutos[k]
                  delete calorias[k]
                })

                // Add new keys based on payload.validSeries (if provided) or just mapping?
                // The user wants to APPLY the change. So we copy the new configuration.
                if (payload.validSeries && Array.isArray(payload.validSeries)) {
                  payload.validSeries.forEach((serie: any, idx: number) => {
                    const newKey = `${newBase}_${idx + 1}`
                    detalles[newKey] = {
                      orden: idx + 1,
                      bloque: idx + 1,
                      ejercicio_id: parseInt(newBase),
                      detalle_series: `(${serie.peso || 0}-${serie.repeticiones}-${serie.series})`
                    }
                    if (serie.minutos) minutos[newKey] = parseInt(serie.minutos)
                    if (serie.calorias) calorias[newKey] = parseInt(serie.calorias)
                  })
                }
              }
            }
          }
          // Update Logic
          else if (mode === 'update') {
            // payload: { newId, validSeries }
            const targetBase = String(payload.newId).split('_')[0]

            // Check if this day HAS this exercise
            const detailKeys = Object.keys(detalles).filter(k => k.split('_')[0] === targetBase)

            // If scope is 'future_all', we only update rows that HAVE the exercise.
            // If scope is 'same_day' and it doesn't have it, we skip? Yes.
            if (detailKeys.length > 0) {
              modified = true
              // Update the existing keys with new data
              // Cleaning old keys for this base first to handle block count change
              detailKeys.forEach(k => {
                delete detalles[k]
                delete minutos[k]
                delete calorias[k]
              })

              if (payload.validSeries && Array.isArray(payload.validSeries)) {
                payload.validSeries.forEach((serie: any, idx: number) => {
                  const newKey = `${targetBase}_${idx + 1}`
                  detalles[newKey] = {
                    orden: idx + 1,
                    bloque: idx + 1,
                    ejercicio_id: parseInt(targetBase),
                    detalle_series: `(${serie.peso || 0}-${serie.repeticiones}-${serie.series})`
                  }
                  if (serie.minutos) minutos[newKey] = parseInt(serie.minutos)
                  if (serie.calorias) calorias[newKey] = parseInt(serie.calorias)
                })
              }
            }
          }

          if (modified) {
            updates.push({
              ...row,
              detalles_series: detalles,
              minutos_json: minutos,
              calorias_json: calorias
            })
          }
        }

        if (updates.length > 0) {
          const { error: upsertError } = await supabase.from('progreso_cliente').upsert(updates)
          if (upsertError) throw upsertError
        }

      } else if (type === 'nutrition') {
        console.log(`Cascade Nutrition: Fetching rows >= ${startDateStr}`)
        const { data: rows, error } = await supabase
          .from('progreso_cliente_nutricion')
          .select('*')
          .eq('cliente_id', clientId)
          .gte('fecha', startDateStr)

        if (error) throw error
        if (!rows) return

        for (const row of rows) {
          const rowDate = new Date(row.fecha + 'T00:00:00')
          const rowDayIndex = rowDate.getDay()

          if (scope === 'same_day' && rowDayIndex !== sourceDayIndex) continue

          // Helper to find the container and key for a specific Plate ID
          const macros = typeof row.macros === 'string' ? JSON.parse(row.macros) : (row.macros || {})
          const ingredientes = typeof row.ingredientes === 'string' ? JSON.parse(row.ingredientes) : (row.ingredientes || {})
          const pendientes = typeof row.ejercicios_pendientes === 'string' ? JSON.parse(row.ejercicios_pendientes) : (row.ejercicios_pendientes || {})
          const completados = typeof row.ejercicios_completados === 'string' ? JSON.parse(row.ejercicios_completados) : (row.ejercicios_completados || {})

          let modified = false

          // The structure can be:
          // 1. { "0": { id: 753, ... }, "1": ... } (Direct object map)
          // 2. { ejercicios: { "0": { id: 753 } ... } } (Wrapped object)
          // 3. { ejercicios: [ { id: 753 } ... ] } (Wrapped array)

          let targetKey: string | null = null
          let containerType: 'pendientes' | 'completados' | null = null
          let innerKey: string | null = null // Key inside 'ejercicios' or top level
          let foundItem: any = null

          const searchId = mode === 'swap' ? payload.oldId : payload.newId
          const searchIdStr = String(searchId)

          // Recursive finder function returns { containerObj, key, item }
          const findInContainer = (container: any): { subContainer: any, key: string, item: any } | null => {
            if (!container) return null

            // Direct check (Flat structure or "0", "1" keys)
            for (const k of Object.keys(container)) {
              const val = container[k]
              if (val && typeof val === 'object') {
                const valId = val.id !== undefined ? val.id : val.ejercicio_id
                console.log(`Cascade Check: ${k} -> ID: ${valId} vs Target: ${searchIdStr}`)
                if (String(valId) === searchIdStr) {
                  return { subContainer: container, key: k, item: val }
                }
              }
            }

            // Check "ejercicios" wrapper
            if (container.ejercicios) {
              console.log('Cascade: Checking "ejercicios" wrapper in', containerType)
              if (Array.isArray(container.ejercicios)) {
                for (let idx = 0; idx < container.ejercicios.length; idx++) {
                  const x = container.ejercicios[idx]
                  const valId = x.id || x.ejercicio_id
                  console.log(`Cascade Array Check [${idx}] -> ID: ${valId}`)
                  if (String(valId) === searchIdStr) return { subContainer: container.ejercicios, key: String(idx), item: x }
                }
              } else if (typeof container.ejercicios === 'object') {
                for (const k of Object.keys(container.ejercicios)) {
                  const val = container.ejercicios[k]
                  const valId = val.id !== undefined ? val.id : val.ejercicio_id
                  console.log(`Cascade Object Check [${k}] -> ID: ${valId}`)
                  if (String(valId) === searchIdStr) {
                    return { subContainer: container.ejercicios, key: k, item: val }
                  }
                }
              }
            }
            return null
          }

          const foundPending = findInContainer(pendientes)
          if (foundPending) console.log('Cascade: Found in Pending')

          if (foundPending) {
            containerType = 'pendientes'
            foundItem = foundPending.item
            innerKey = foundPending.key
            // The macro key usually combines ID + Block/Index. e.g. "753_3".
            // We need to deduce the macro key associated with this item.
            // We can check the `macros` object for a key starting with `ID_`.
          } else {
            const foundCompleted = findInContainer(completados)
            if (foundCompleted) {
              containerType = 'completados'
              foundItem = foundCompleted.item
              innerKey = foundCompleted.key
            }
          }

          if (containerType && foundItem) {
            console.log(`Cascade: Match Confirmed in ${row.fecha}! Key: ${innerKey}`)
            modified = true

            // Deduce Macro Key: Look for key in macros that matches `ID_Block` or just `ID_`
            // The item might have 'bloque' property.
            // User data: "753_3": {...}. Item has { "id": 753, "bloque": 1, "orden": 3 }. 
            // Wait, the key is `753_3`. Is 3 the 'orden'?
            // "orden": 3. Yes.
            // So key pattern is likely `${id}_${orden}`.
            const currentMacroKey = `${searchId}_${foundItem.orden}`
            // Just in case, try to find strictly in macros if not found standard way
            const existingMacroKey = Object.keys(macros).find(k => k === currentMacroKey) || Object.keys(macros).find(k => k.startsWith(`${searchId}_`))

            if (mode === 'swap') {
              // Update ID in the item
              foundItem.id = Number(payload.newId) // Update 'id'
              if (foundItem.ejercicio_id !== undefined) foundItem.ejercicio_id = Number(payload.newId) // Update 'ejercicio_id' if exists

              // Determine NEW Macro Key
              // If we keep the same 'orden', the new key is `NEWID_ORDEN`.
              const newMacroKey = `${payload.newId}_${foundItem.orden}`

              // Swap Macros
              if (existingMacroKey) {
                delete macros[existingMacroKey]
                macros[newMacroKey] = payload.macros
              } else {
                // If old macro key not found, just add new one
                macros[newMacroKey] = payload.macros
              }

              // Swap Ingredients
              if (existingMacroKey && ingredientes[existingMacroKey]) {
                delete ingredientes[existingMacroKey]
              }
              if (payload.ingredients) ingredientes[newMacroKey] = payload.ingredients

            } else {
              // Update Mode
              // Update Macros for existing key
              if (existingMacroKey) {
                macros[existingMacroKey] = { ...macros[existingMacroKey], ...payload.macros }
                if (payload.ingredients) ingredientes[existingMacroKey] = payload.ingredients
              }
            }
          }

          if (modified) {
            updates.push({
              ...row,
              macros,
              ingredientes,
              ejercicios_pendientes: pendientes,
              ejercicios_completados: completados
            })
          }
        }

        if (updates.length > 0) {
          console.log(`Cascade: Updating ${updates.length} rows.`)
          const { error: upsertError } = await supabase.from('progreso_cliente_nutricion').upsert(updates)
          if (upsertError) throw upsertError
        }
      }

    } catch (e) {
      console.error('Error applying cascade:', e)
    } finally {
      // Invalidate Cache and Refresh
      setActivityDetailsByKey({})
      await fetchClientCalendarSummary()

      // Force reload of current day details if open
      if (selectedDate) {
        const dateStr = selectedDate.toISOString().split('T')[0]
        const uniqueActs = new Set(selectedDayExercises.map(e => e.actividad_id).filter(id => id !== undefined && id !== null))
        for (const actId of Array.from(uniqueActs)) {
          await loadDayActivityDetails(dateStr, Number(actId))
        }
      }

      setLoading(false)
      setLoading(false)
      // Cleanup
      // [MOD] Mantener la edición activa tras el guardado
      // if (cascadeModal?.type === 'fitness') {
      //   handleCancelEditSeries()
      // } else {
      //   handleCancelNutrition()
      // }
      // setCascadeModal(null)
      // NOTA: setCascadeModal(null) se debe llamar para cerrar el modal, 
      // pero NO cancelar la edición.
      setCascadeModal(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7939]"></div>
        <span className="ml-2 text-sm text-gray-400">Cargando calendario...</span>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Navegación del mes y resumen lado a lado */}
      <div className="flex items-center gap-4">
        {/* Navegación del mes - 50% */}
        <div className="flex-1 flex items-center justify-center gap-2">
          <button
            onClick={showMonthPicker ? () => setMonthPickerYear((y) => y - 1) : goToPreviousMonth}
            className="p-1.5 hover:bg-[#FF7939]/20 rounded-lg transition-all duration-200 group"
          >
            <ChevronLeft className="h-4 w-4 text-gray-400 group-hover:text-[#FF7939]" />
          </button>
          <button
            type="button"
            onClick={toggleMonthPicker}
            className="text-sm font-semibold text-white min-w-[120px] text-center hover:bg-[#FF7939]/10 rounded-lg px-2 py-1 transition-colors"
          >
            {showMonthPicker ? monthPickerYear : `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
          </button>
          <button
            onClick={showMonthPicker ? () => setMonthPickerYear((y) => y + 1) : goToNextMonth}
            className="p-1.5 hover:bg-[#FF7939]/20 rounded-lg transition-all duration-200 group"
          >
            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#FF7939]" />
          </button>
        </div>

        {/* Resumen minimalista - 50% */}
        <div className="flex-1 flex items-center justify-center gap-3">
          {Object.keys(dayData).length > 0 ? (
            <>
              <div className="text-center">
                <div className="text-sm font-bold">
                  <span className="text-white">
                    {Object.values(dayData).reduce((sum, day) => sum + day.completedCount, 0)}
                  </span>
                  <span className="text-[#FF7939]">
                    /{Object.values(dayData).reduce((sum, day) => sum + day.exerciseCount, 0)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">Ejercicios</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold">
                  <span className="text-white">
                    {Object.values(dayData).filter(day => day.completedCount === day.exerciseCount && day.exerciseCount > 0).length}
                  </span>
                  <span className="text-[#FF7939]">
                    /{Object.keys(dayData).length}
                  </span>
                </div>
                <div className="text-xs text-gray-500">Días</div>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="text-xs text-gray-500">Sin ejercicios</div>
            </div>
          )}
        </div>
      </div>

      {showMonthPicker && (
        <div className="w-full">
          <div className="w-full overflow-x-auto">
            <div className="flex gap-2 whitespace-nowrap pb-1">
              {monthNames.map((m, idx) => {
                const isCurrent = monthPickerYear === currentDate.getFullYear() && idx === currentDate.getMonth()
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleSelectMonth(idx)}
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${isCurrent ? 'bg-[#FF7939] text-white' : 'bg-zinc-800/60 text-gray-300 hover:bg-zinc-700/60'
                      }`}
                  >
                    {m}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Calendario sin frame */}
      <div className="w-full">
        {/* Días de la semana sin fondo */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs font-semibold text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Días del mes compactos */}
        <div className="grid grid-cols-7 gap-1">
          {generateCalendarDays().map((date, index) => {
            const isCurrentMonth = date.getMonth() === currentDate.getMonth()
            const isToday = date.toDateString() === new Date().toDateString()
            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString()
            const dayData = getDayData(date)
            const hasExercises = dayData && dayData.exerciseCount > 0
            const isCompleted = dayData && dayData.completedCount === dayData.exerciseCount

            // Estados de selección para edición de fechas
            const isSelectedForEdit = selectedDayForEdit && date.toDateString() === selectedDayForEdit.toDateString()
            const isTargetForEdit = targetDayForEdit && date.toDateString() === targetDayForEdit.toDateString()
            const isTargetHasExercises = targetDayForEdit && getDayData(targetDayForEdit) && getDayData(targetDayForEdit)!.exerciseCount > 0

            return (
              <button
                key={index}
                onClick={() => handleDayClick(date)}
                className={`
                  relative p-2 text-sm rounded-lg transition-all duration-300 min-h-[50px] flex flex-col items-center justify-start group
                  ${!isCurrentMonth ? 'text-gray-600 bg-transparent' : 'text-white'}
                  ${isSelected && !isSelectedForEdit && !isTargetForEdit ? 'bg-[#FF7939]/20 backdrop-blur-md border border-[#FF7939]/50 text-white shadow-[0_0_15px_rgba(255,121,57,0.3)]' : ''}
                  ${isSelectedForEdit ? 'bg-[#FF7939]/30 border-2 border-[#FF7939] text-white' : ''}
                  ${isTargetForEdit ? 'bg-white text-black border-2 border-white' : ''}
                  ${hasExercises && !isToday && !isSelectedForEdit && !isTargetForEdit ? 'bg-zinc-800/50 hover:bg-zinc-700/70 cursor-pointer border border-zinc-600/30' : ''}
                  ${!hasExercises && !isToday && !isSelectedForEdit && !isTargetForEdit && isCurrentMonth ? 'hover:bg-zinc-800/30 cursor-pointer' : ''}
                `}
              >
                {/* Indicador HOY: círculo naranja con H */}
                {isToday && (
                  <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#FF7939] text-white text-[10px] font-bold flex items-center justify-center">
                    H
                  </div>
                )}

                {/* Número del día siempre en la misma posición */}
                <div className={`text-center font-semibold text-sm leading-none pt-1 ${isSelected ? 'text-white' :
                  isTargetForEdit ? 'text-black' :
                    isSelectedForEdit ? 'text-white' :
                      isCurrentMonth ? 'text-white' : 'text-gray-600'
                  }`}>
                  {date.getDate()}
                </div>

                {/* Tiempo total siempre en la misma posición */}
                <div className="mt-1 h-5 flex items-center justify-center">
                  {hasExercises ? (
                    <div className={`
                      text-xs font-bold px-1.5 py-0.5 rounded-full transition-all duration-200 leading-none
                      ${isTargetForEdit
                        ? 'bg-black text-white shadow-sm'
                        : isCompleted
                          ? 'bg-[#FF7939] text-white shadow-sm'
                          : 'bg-zinc-700 text-gray-300 group-hover:bg-zinc-600'
                      }
                    `}>
                      {formatMinutesCompact(dayData.totalMinutes) || dayData.exerciseCount}
                    </div>
                  ) : (
                    <div className="h-4"></div>
                  )}
                </div>

                {/* Indicador de hover */}
                {hasExercises && (
                  <div className="absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-[#FF7939]/30 transition-all duration-200 pointer-events-none"></div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {activityFilterOptions.length > 0 && (
        <div className="w-full overflow-x-auto">
          <div className="flex gap-2 whitespace-nowrap pb-1">
            <button
              type="button"
              onClick={() => setActiveEnrollmentFilterId(null)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${!activeEnrollmentFilterId
                ? 'bg-[#FF7939] text-white'
                : 'bg-zinc-800/60 text-gray-300 hover:bg-zinc-700/60'
                }`}
            >
              Todas
            </button>
            {activityFilterOptions.map(opt => (
              <button
                key={opt.enrollment_id}
                type="button"
                onClick={() => setActiveEnrollmentFilterId(opt.enrollment_id)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${activeEnrollmentFilterId === opt.enrollment_id
                  ? 'bg-[#FF7939] text-white'
                  : 'bg-zinc-800/60 text-gray-300 hover:bg-zinc-700/60'
                  }`}
              >
                {opt.title} v{opt.version}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Indicador de modo de selección */}
      {isSelectingNewDate && (
        <div className="text-center">
          <div className="text-xs text-[#FF7939] font-medium">
            Selecciona nueva fecha
          </div>
        </div>
      )}

      {/* Detalle del día seleccionado */}
      {selectedDate && (
        <div className="w-full" ref={dayDetailRef}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#FF7939]" />
              <h4 className="font-semibold text-sm text-white">{formatDate(selectedDate)}</h4>
            </div>
            <button
              onClick={() => handleEditDate(selectedDate)}
              className={`flex items-center gap-1 px-2 py-1 text-sm font-medium rounded-lg transition-colors ${isSelectingNewDate
                ? 'bg-[#FF7939] text-white'
                : 'text-[#FF7939] hover:bg-[#FF7939]/10'
                }`}
            >
              <RotateCcw className="h-4 w-4" />
              {isSelectingNewDate ? 'Cancelar' : 'Fecha'}
            </button>
          </div>

          {(() => {
            const dayStr = selectedDate.toISOString().split('T')[0]
            const rows = summaryRowsByDate?.[dayStr] || []

            const totalMins = rows.reduce((acc, r) => acc + (Number(r.total_mins ?? 0) || 0), 0)
            const ownedMins = rows.reduce((acc, r) => {
              const isActivityRow = r.activity_id !== null && r.activity_id !== undefined
              if (!isActivityRow) return acc
              if (!currentCoachId) return acc + (Number(r.total_mins ?? 0) || 0)
              const isOwned = r.coach_id && String(r.coach_id) === String(currentCoachId)
              return isOwned ? acc + (Number(r.total_mins ?? 0) || 0) : acc
            }, 0)
            const otherMinsTotal = Math.max(0, totalMins - ownedMins)

            const hasAny = rows.length > 0
            if (!hasAny) {
              return <div className="text-sm text-gray-500">Sin actividades para este día</div>
            }

            const ownedActivityRows = rows.filter((r) => {
              const isActivityRow = r.activity_id !== null && r.activity_id !== undefined
              // [MOD] Incluir meets/eventos en "Tus programas" SOLO si coincide el coach
              if (r.calendar_event_id) {
                if (!currentCoachId) return true // Show all if context is ambiguous (or change to false if strict)
                return r.coach_id && String(r.coach_id) === String(currentCoachId)
              }

              if (!isActivityRow) return false
              if (!currentCoachId) return true
              return r.coach_id && String(r.coach_id) === String(currentCoachId)
            })

            const otherRows = rows.filter((r) => {
              const isActivityRow = r.activity_id !== null && r.activity_id !== undefined
              // [MOD] Excluir meets de Otras Actividades SI son del coach actual (ya estan en owned)
              if (r.calendar_event_id) {
                if (!currentCoachId) return false
                return !(r.coach_id && String(r.coach_id) === String(currentCoachId))
              }

              if (!isActivityRow) return true // calendar event (meet/other) without owning logic match
              if (!currentCoachId) return false
              return !(r.coach_id && String(r.coach_id) === String(currentCoachId))
            })

            const otherMeetRows = otherRows.filter((r) => r.calendar_event_id)

            const renderSummaryRow = (row: ClientDaySummaryRow, allowExpand: boolean) => {
              const minutes = Number(row.total_mins ?? 0) || 0
              const title = row.activity_title || (row.activity_id ? `Actividad ${row.activity_id}` : 'Evento')

              const activityId = row.activity_id !== null && row.activity_id !== undefined ? Number(row.activity_id) : null
              const eventId = row.calendar_event_id

              // Expanded Key can now be Activity or Event
              const expandedKey = activityId
                ? `${dayStr}::${String(activityId)}`
                : (eventId ? `${dayStr}::event::${eventId}` : null)

              const expanded = expandedKey ? !!expandedActivityKeys?.[expandedKey] : false
              const canExpand = allowExpand && (!!activityId || !!eventId)

              return (
                <div key={row.id} className="space-y-2 border-b border-zinc-700/30 pb-3 last:border-b-0">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!canExpand || !expandedKey) return
                      const next = !expanded
                      setExpandedActivityKeys((prev) => ({ ...prev, [expandedKey!]: next }))
                      if (next) {
                        if (activityId) await loadDayActivityDetails(dayStr, activityId)
                        if (eventId) await loadEventDetails(eventId)
                      }
                    }}
                    className={`w-full flex items-center justify-between group ${canExpand ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Línea vertical naranja */}
                      <div className={`w-1 h-8 rounded-full transition-colors ${expanded ? 'bg-[#FF7939]' : 'bg-zinc-700 group-hover:bg-[#FF7939]/50'}`}></div>

                      <div className="text-sm font-semibold text-gray-200 text-left">
                        {title}
                      </div>

                      {/* Flecha naranja simple */}
                      {canExpand && (
                        <ChevronRight className={`h-4 w-4 text-[#FF7939] transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
                      )}
                    </div>
                    <div className="text-xs text-gray-400">{formatMinutesCompact(minutes) || '0m'}</div>
                  </button>

                  {canExpand && expandedKey && expanded ? (
                    <div className="space-y-2">
                      {/* Render Event Details if Event */}
                      {eventId && eventDetailsByKey[eventId] && (
                        <div className="pl-4 pr-2 py-2 text-sm text-gray-300 space-y-1 bg-zinc-800/20 rounded-lg">
                          <div className="flex gap-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>
                              {new Date(eventDetailsByKey[eventId].start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                              {new Date(eventDetailsByKey[eventId].end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {eventDetailsByKey[eventId].description && (
                            <div className="text-gray-400 text-xs italic">
                              {eventDetailsByKey[eventId].description}
                            </div>
                          )}
                          {eventDetailsByKey[eventId].meet_link && (
                            <a
                              href={eventDetailsByKey[eventId].meet_link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#FF7939] hover:underline text-xs flex items-center gap-1 mt-1"
                            >
                              Unirse a la llamada ↗
                            </a>
                          )}
                          <button
                            onClick={() => router.push(`/?tab=calendar&eventId=${eventId}`)}
                            className="mt-3 text-xs bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-1.5 rounded flex items-center gap-2 w-fit transition-colors"
                          >
                            Ir al detalle <Calendar className="h-3 w-3" />
                          </button>
                        </div>
                      )}

                      {/* Render Activity Details as before */}
                      {activityId && (() => {
                        const items = activityDetailsByKey?.[expandedKey] || []
                        return items.length > 0 ? (
                          <div className="space-y-0">
                            {items.map((exercise) => {
                              const seriesBlocks = getSeriesBlocks(
                                exercise.detalle_series,
                                exercise.duracion,
                                exercise.ejercicio_id,
                                exercise.minutosJson
                              )
                              const isCompleted = exercise.completado
                              const activityIdStr =
                                exercise.actividad_id !== undefined && exercise.actividad_id !== null
                                  ? String(exercise.actividad_id)
                                  : null
                              const nutritionPlateOptions = activityIdStr ? (nutritionPlateOptionsByActivity[activityIdStr] || []) : []
                              const canEditNutrition = exercise.is_nutricion ? canEditNutritionForDay(exercise) : false

                              return (
                                <div
                                  key={exercise.id}
                                  className="w-full flex items-start gap-3 py-3 border-b border-zinc-700/30 last:border-b-0 group"
                                >
                                  <div className="flex items-center justify-center w-10 pt-1 shrink-0">
                                    <Flame className={`h-5 w-5 ${isCompleted ? 'text-[#FF7939]' : 'text-gray-600'}`} />
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    {editingExerciseId === exercise.id ? (
                                      <div className="relative mb-1 exercise-dropdown">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.preventDefault()
                                            setShowExerciseDropdown(!showExerciseDropdown)
                                          }}
                                          className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-white bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg hover:bg-[#3A3A3A] transition-colors"
                                        >
                                          <span>{exercise.ejercicio_nombre}</span>
                                          <ChevronDown
                                            className={`h-4 w-4 transition-transform ${showExerciseDropdown ? 'rotate-180' : ''}`}
                                          />
                                        </button>

                                        {showExerciseDropdown && (
                                          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[#1E1E1E] border border-[#3A3A3A] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {availableExercises.length > 0 ? (
                                              availableExercises.map((ex) => (
                                                <button
                                                  type="button"
                                                  key={ex.id}
                                                  onClick={(e) => {
                                                    e.preventDefault()
                                                    handleChangeExercise(String(ex.id))
                                                  }}
                                                  className={`w-full px-3 py-2 text-left text-sm hover:bg-[#3A3A3A] transition-colors ${String(ex.id) === String(exercise.ejercicio_id)
                                                    ? 'bg-[#FF7939]/20 text-[#FF7939]'
                                                    : 'text-white'
                                                    }`}
                                                >
                                                  {ex.nombre_ejercicio}
                                                </button>
                                              ))
                                            ) : (
                                              <div className="px-3 py-2 text-sm text-gray-400">No hay ejercicios disponibles</div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="text-sm font-semibold text-gray-300 truncate">{exercise.ejercicio_nombre}</div>
                                        {(() => {
                                          const canEdit = exercise.is_nutricion
                                            ? canEditNutritionForDay(exercise)
                                            : canEditFitnessForDay(exercise)

                                          if (!canEdit) return null

                                          return (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (exercise.is_nutricion) {
                                                  handleEditNutrition(exercise)
                                                } else {
                                                  setEditingExerciseId(exercise.id)
                                                  setEditingOriginalExercise({ ...exercise })
                                                  if (exercise.actividad_id) {
                                                    loadAvailableExercises(Number(exercise.actividad_id))
                                                  }
                                                }
                                              }}
                                              className="p-1 text-zinc-600 hover:text-[#FF7939] hover:bg-[#FF7939]/10 rounded transition-colors"
                                              title="Editar"
                                            >
                                              <Edit className="h-3.5 w-3.5" />
                                            </button>
                                          )
                                        })()}
                                      </div>
                                    )}

                                    <div className="flex flex-wrap items-center gap-3 mt-1">
                                      {exercise.duracion ? <span className="text-xs text-gray-500">{exercise.duracion} min</span> : null}
                                      {exercise.calorias_estimadas ? (
                                        <span className="text-xs text-gray-500">{exercise.calorias_estimadas} kcal</span>
                                      ) : null}

                                      {/* Macros - Only for Nutrition */}
                                      {exercise.is_nutricion && exercise.nutricion_macros && (
                                        <div className="flex items-center gap-2 text-xs text-[#FF7939]">
                                          {exercise.nutricion_macros.proteinas !== undefined && <span>P {exercise.nutricion_macros.proteinas}g</span>}
                                          {exercise.nutricion_macros.grasas !== undefined && <span>G {exercise.nutricion_macros.grasas}g</span>}
                                          {exercise.nutricion_macros.carbohidratos !== undefined && <span>C {exercise.nutricion_macros.carbohidratos}g</span>}
                                        </div>
                                      )}
                                    </div>

                                    {exercise.detalle_series ? (
                                      <div className="text-xs text-gray-500 mt-1">{exercise.detalle_series}</div>
                                    ) : null}

                                    {exercise.is_nutricion ? (
                                      <div className="mt-2">
                                        {editingNutritionId === exercise.id && editingNutritionMacros ? (
                                          <div className="flex flex-wrap gap-2 items-end">
                                            <div className="flex flex-col min-w-[180px]">
                                              <label className="text-[10px] text-gray-500 mb-0.5">Plato</label>
                                              <select
                                                value={editingNutritionPlateId || ''}
                                                onChange={(e) => {
                                                  const nextPlateId = e.target.value
                                                  setEditingNutritionPlateId(nextPlateId)

                                                  const selectedPlate = nutritionPlateOptions.find(
                                                    (p: any) => String(p?.id) === String(nextPlateId)
                                                  )
                                                  if (!selectedPlate) return

                                                  setEditingNutritionMacros((prev) => {
                                                    if (!prev) return prev
                                                    const next = {
                                                      ...prev,
                                                      proteinas:
                                                        selectedPlate?.proteinas !== undefined && selectedPlate?.proteinas !== null
                                                          ? String(selectedPlate.proteinas)
                                                          : '',
                                                      carbohidratos:
                                                        selectedPlate?.carbohidratos !== undefined && selectedPlate?.carbohidratos !== null
                                                          ? String(selectedPlate.carbohidratos)
                                                          : '',
                                                      grasas:
                                                        selectedPlate?.grasas !== undefined && selectedPlate?.grasas !== null
                                                          ? String(selectedPlate.grasas)
                                                          : '',
                                                      calorias:
                                                        selectedPlate?.calorias !== undefined && selectedPlate?.calorias !== null
                                                          ? String(selectedPlate.calorias)
                                                          : (
                                                            selectedPlate?.calorías !== undefined && selectedPlate?.calorías !== null
                                                              ? String(selectedPlate.calorías)
                                                              : ''
                                                          ),
                                                      minutos:
                                                        selectedPlate?.minutos !== undefined && selectedPlate?.minutos !== null
                                                          ? String(selectedPlate.minutos)
                                                          : ''
                                                    }
                                                    return next
                                                  })
                                                }}
                                                className="w-full px-2 py-1 text-xs bg-[#2A2A2A] border border-[#3A3A3A] rounded text-white"
                                              >
                                                <option value="">Seleccionar</option>
                                                {nutritionPlateOptions.map((p: any) => (
                                                  <option key={String(p.id)} value={String(p.id)}>
                                                    {p.nombre_plato || p.nombre || `Plato ${p.id}`}
                                                  </option>
                                                ))}
                                              </select>
                                            </div>
                                            <div className="flex flex-col">
                                              <label className="text-[10px] text-gray-500 mb-0.5">Prot (g)</label>
                                              <input
                                                type="number"
                                                value={editingNutritionMacros.proteinas}
                                                onChange={(e) =>
                                                  setEditingNutritionMacros((prev) =>
                                                    prev ? { ...prev, proteinas: e.target.value } : prev
                                                  )
                                                }
                                                className="w-16 px-2 py-1 text-xs bg-[#2A2A2A] border border-[#3A3A3A] rounded text-white"
                                              />
                                            </div>
                                            <div className="flex flex-col">
                                              <label className="text-[10px] text-gray-500 mb-0.5">Carb (g)</label>
                                              <input
                                                type="number"
                                                value={editingNutritionMacros.carbohidratos}
                                                onChange={(e) =>
                                                  setEditingNutritionMacros((prev) =>
                                                    prev ? { ...prev, carbohidratos: e.target.value } : prev
                                                  )
                                                }
                                                className="w-16 px-2 py-1 text-xs bg-[#2A2A2A] border border-[#3A3A3A] rounded text-white"
                                              />
                                            </div>
                                            <div className="flex flex-col">
                                              <label className="text-[10px] text-gray-500 mb-0.5">Grasas (g)</label>
                                              <input
                                                type="number"
                                                value={editingNutritionMacros.grasas}
                                                onChange={(e) =>
                                                  setEditingNutritionMacros((prev) => (prev ? { ...prev, grasas: e.target.value } : prev))
                                                }
                                                className="w-16 px-2 py-1 text-xs bg-[#2A2A2A] border border-[#3A3A3A] rounded text-white"
                                              />
                                            </div>
                                            <div className="flex flex-col">
                                              <label className="text-[10px] text-gray-500 mb-0.5">Kcal</label>
                                              <input
                                                type="number"
                                                value={editingNutritionMacros.calorias}
                                                onChange={(e) =>
                                                  setEditingNutritionMacros((prev) =>
                                                    prev ? { ...prev, calorias: e.target.value } : prev
                                                  )
                                                }
                                                className="w-16 px-2 py-1 text-xs bg-[#2A2A2A] border border-[#3A3A3A] rounded text-white"
                                              />
                                            </div>
                                            <div className="flex flex-col">
                                              <label className="text-[10px] text-gray-500 mb-0.5">Min</label>
                                              <input
                                                type="number"
                                                value={editingNutritionMacros.minutos}
                                                onChange={(e) =>
                                                  setEditingNutritionMacros((prev) =>
                                                    prev ? { ...prev, minutos: e.target.value } : prev
                                                  )
                                                }
                                                className="w-16 px-2 py-1 text-xs bg-[#2A2A2A] border border-[#3A3A3A] rounded text-white"
                                              />
                                            </div>
                                            <div className="flex items-center gap-1 mt-auto pb-1">
                                              <button
                                                onClick={() => handleOpenIngredients(exercise)}
                                                className="px-3 py-1.5 bg-[#2A2A2A] border border-[#3A3A3A] text-gray-300 hover:text-white hover:border-[#FF7939] hover:bg-[#FF7939]/10 rounded-md text-xs font-medium transition-all flex items-center gap-2"
                                              >
                                                <List className="w-3 h-3" />
                                                Ingredientes
                                              </button>
                                            </div>

                                            <div className="flex items-center gap-2 ml-auto">
                                              <button
                                                type="button"
                                                onClick={() => handleSaveNutrition(exercise)}
                                                disabled={!canEditNutrition}
                                                className={`p-1 rounded transition-colors ${canEditNutrition ? 'text-[#FF7939] hover:bg-[#FF7939]/10' : 'text-gray-600 cursor-not-allowed'
                                                  }`}
                                                title="Guardar"
                                              >
                                                <Save className="h-4 w-4" />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={handleCancelNutrition}
                                                className="p-1 rounded text-gray-400 hover:text-white hover:bg-zinc-700/40 transition-colors"
                                                title="Cancelar"
                                              >
                                                <X className="h-4 w-4" />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  if (!canEditNutrition) return
                                                  setConfirmDeleteNutritionId(exercise.id)
                                                }}
                                                disabled={!canEditNutrition}
                                                className={`p-1 rounded transition-colors ${canEditNutrition ? 'text-red-500 hover:bg-red-500/10' : 'text-gray-600 cursor-not-allowed'
                                                  }`}
                                                title="Eliminar"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </button>
                                            </div>
                                          </div>
                                        ) : null}
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">Cargando detalle...</div>
                        )
                      })()}
                    </div>
                  ) : null}
                </div>
              )
            }

            return (
              <div className="space-y-3">
                <div className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/30">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#FF7939] font-medium">Tus programas</span>
                    <span className="text-[#FF7939] font-semibold">{formatMinutesCompact(ownedMins) || '0m'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-gray-400">Otras actividades</span>
                    <span className="text-gray-200 font-semibold">{formatMinutesCompact(otherMinsTotal) || '0m'}</span>
                  </div>
                </div>

                {ownedActivityRows.length > 0 && (
                  <div className="space-y-3">
                    {ownedActivityRows.map((r) => renderSummaryRow(r, true))}
                  </div>
                )}

                {otherMeetRows.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Otras actividades</div>
                    {otherMeetRows.map((r) => renderSummaryRow(r, false))}
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}

      {/* Modal de confirmación */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-sm border border-zinc-700/30">
            <div className="flex items-center gap-2 mb-4">
              <RotateCcw className="h-5 w-5 text-[#FF7939]" />
              <h3 className="font-semibold text-lg text-white">Confirmar Cambio</h3>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-gray-300">
                ¿Estás seguro de que quieres cambiar la fecha de los ejercicios?
              </div>

              <div className="bg-zinc-800/50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Fecha actual:</span>
                  <span className="text-white">{editingDate && formatDate(editingDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Nueva fecha:</span>
                  <span className="text-[#FF7939]">{newDate && formatDate(newDate)}</span>
                </div>
              </div>

              {/* Advertencia si el día de destino ya tiene ejercicios */}
              {newDate && getDayData(newDate) && getDayData(newDate)!.exerciseCount > 0 && (
                <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <div className="text-sm text-amber-200">
                      <div className="font-medium">¡Atención!</div>
                      <div className="text-xs text-amber-300 mt-1">
                        El {formatDate(newDate)} ya tiene {getDayData(newDate)!.exerciseCount} ejercicio(s) programado(s)
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {editingDate && (
                <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/30">
                  <div className="font-medium text-white text-sm mb-2">Aplicar a actividades</div>
                  <div className="space-y-2">
                    {(() => {
                      const dayStr = editingDate.toISOString().split('T')[0]
                      const exs = dayData?.[dayStr]?.exercises || []
                      const sumRows = summaryRowsByDate?.[dayStr] || []

                      const map = new Map<string, { id: string; label: string }>()

                      // Preferimos lo ya cargado por detalle (si existe)
                      for (const ex of exs) {
                        const id = ex.actividad_id !== undefined && ex.actividad_id !== null ? String(ex.actividad_id) : ''
                        if (!id) continue
                        const title = ex.actividad_titulo || `Actividad ${id}`
                        const ver = ex.version && ex.version > 1 ? ` v${ex.version}` : ''
                        const label = `${title}${ver}`
                        if (!map.has(id)) map.set(id, { id, label })
                      }

                      // Si todavía no hay detalle cargado, usamos la view
                      if (map.size === 0) {
                        for (const r of sumRows) {
                          const id = r.activity_id !== undefined && r.activity_id !== null ? String(r.activity_id) : ''
                          if (!id) continue
                          const title = r.activity_title || `Actividad ${id}`
                          const label = `${title}`
                          if (!map.has(id)) map.set(id, { id, label })
                        }
                      }

                      const opts = Array.from(map.values())
                      if (opts.length === 0) {
                        return <div className="text-xs text-gray-400">No hay actividades detectadas para este día.</div>
                      }

                      return opts.map((opt) => {
                        const checked = selectedActivityIdsForDateChange.includes(opt.id)
                        return (
                          <label key={opt.id} className="flex items-center gap-2 text-sm text-gray-200">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? Array.from(new Set([...(selectedActivityIdsForDateChange || []), opt.id]))
                                  : (selectedActivityIdsForDateChange || []).filter((x) => x !== opt.id)
                                setSelectedActivityIdsForDateChange(next)
                              }}
                            />
                            <span className="text-gray-300">{opt.label}</span>
                          </label>
                        )
                      })
                    })()}
                  </div>
                </div>
              )}

              {/* Opción para aplicar a todos los días de la misma semana */}
              {editingDate && newDate && editingDate.getDay() !== newDate.getDay() && (
                <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/30">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-white text-sm">
                        Aplicar a todos los {getDayNamePlural(editingDate.getDay())}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Cambiará todos los {getDayNamePlural(editingDate.getDay())} a {getDayNamePlural(newDate.getDay())}
                      </div>
                    </div>
                    <Switch
                      checked={applyToAllSameDays}
                      onCheckedChange={setApplyToAllSameDays}
                      className="h-5 w-9 data-[state=checked]:bg-[#FF7939] data-[state=unchecked]:bg-[#FF7939]/20"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowConfirmModal(false)
                    setApplyToAllSameDays(false)
                  }}
                  className="flex-1 px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmUpdateDate}
                  className="flex-1 px-4 py-2 bg-[#FF7939] text-white rounded-lg hover:bg-[#FF7939]/80 transition-colors"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cascada (Aplicar cambios a futuro) */}
      {cascadeModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
          <div className="bg-[#1E1E1E] rounded-2xl p-6 w-full max-w-sm border border-[#3A3A3A] shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#FF7939]/20 flex items-center justify-center">
                <Save className="h-5 w-5 text-[#FF7939]" />
              </div>
              <h3 className="font-semibold text-lg text-white">Cambio Guardado</h3>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-gray-300 leading-relaxed">
                Has modificado <span className="text-white font-medium">{cascadeModal.itemName}</span>.
                <br />
                ¿Te gustaría aplicar este cambio a otros días?
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => {
                    setCascadeModal(null)
                    // [MOD] Mantener la edición activa tras el guardado
                    // if (cascadeModal.type === 'fitness') handleCancelEditSeries()
                    // else handleCancelNutrition()
                  }}
                  className="w-full py-3 px-4 bg-[#2A2A2A] text-gray-300 rounded-xl hover:bg-[#3A3A3A] hover:text-white transition-colors text-sm font-medium text-left flex items-center justify-between group"
                >
                  <span>Solo este día</span>
                  <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-white transition-colors" />
                </button>

                <button
                  onClick={() => handleApplyCascade('same_day')}
                  className="w-full py-3 px-4 bg-[#2A2A2A] text-[#FF7939] rounded-xl hover:bg-[#FF7939] hover:text-white transition-all duration-300 text-sm font-medium text-left flex items-center justify-between group"
                >
                  <div className="flex flex-col">
                    <span>Todos los {getDayNamePlural(new Date(cascadeModal.sourceDate + 'T00:00:00').getDay())}</span>
                    <span className="text-[10px] opacity-70 font-normal">Aplicar a futuros {cascadeModal.sourceDayName}s</span>
                  </div>
                  <Save className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </button>

                <button
                  onClick={() => handleApplyCascade('future_all')}
                  className="w-full py-3 px-4 bg-[#2A2A2A] text-gray-300 rounded-xl hover:bg-[#3A3A3A] hover:text-white transition-colors text-sm font-medium text-left flex items-center justify-between group"
                >
                  <div className="flex flex-col">
                    <span>Todos los días futuros</span>
                    <span className="text-[10px] text-gray-500 group-hover:text-gray-400 font-normal">Donde aparezca este ejercicio/plato</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-white transition-colors" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ingredients Modal */}
      {showIngredientsModal && editingNutritionExercise && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1E1E1E] w-full max-w-lg rounded-2xl border border-[#3A3A3A] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-[#3A3A3A] flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Editar Ingredientes</h3>
              <button onClick={() => setShowIngredientsModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {editingIngredientsList.map((ing, idx) => (
                <div key={ing._key || idx} className="flex gap-2 items-center">
                  <input
                    placeholder="Cant."
                    value={ing.cantidad}
                    onChange={(e) => {
                      const next = [...editingIngredientsList]
                      next[idx].cantidad = e.target.value
                      setEditingIngredientsList(next)
                    }}
                    className="w-16 bg-[#2A2A2A] border border-[#3A3A3A] rounded px-2 py-1 text-sm text-white"
                  />
                  <input
                    placeholder="Unidad"
                    value={ing.unidad}
                    onChange={(e) => {
                      const next = [...editingIngredientsList]
                      next[idx].unidad = e.target.value
                      setEditingIngredientsList(next)
                    }}
                    className="w-16 bg-[#2A2A2A] border border-[#3A3A3A] rounded px-2 py-1 text-sm text-white"
                  />
                  <input
                    placeholder="Nombre"
                    value={ing.nombre}
                    onChange={(e) => {
                      const next = [...editingIngredientsList]
                      next[idx].nombre = e.target.value
                      setEditingIngredientsList(next)
                    }}
                    className="flex-1 bg-[#2A2A2A] border border-[#3A3A3A] rounded px-2 py-1 text-sm text-white"
                  />
                  <button
                    onClick={() => {
                      setEditingIngredientsList(prev => prev.filter((_, i) => i !== idx))
                    }}
                    className="p-1 text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const newKey = `new_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
                    setEditingIngredientsList(prev => [...prev, { _key: newKey, nombre: '', cantidad: '', unidad: '' }])
                  }}
                  className="text-xs text-[#FF7939] hover:underline"
                >
                  + Agregar Ingrediente
                </button>
              </div>
            </div>

            <div className="p-4 border-t border-[#3A3A3A] flex justify-end gap-2">
              <button
                onClick={() => setShowIngredientsModal(false)}
                className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (!editingNutritionExercise) return
                  // Convert list back to object
                  const ingObj: any = {}
                  editingIngredientsList.forEach((ing, i) => {
                    const key = ing._key && !ing._key.startsWith('new_') ? ing._key : String(i)
                    ingObj[key] = { nombre: ing.nombre, cantidad: ing.cantidad, unidad: ing.unidad }
                  })

                  await handleSaveNutrition(editingNutritionExercise, { ingredientes: ingObj })
                  setShowIngredientsModal(false)
                }}
                className="px-4 py-2 rounded-lg bg-[#FF7939] text-white font-medium hover:bg-[#ff8a50] transition-colors shadow-lg shadow-[#FF7939]/20"
              >
                Guardar Ingredientes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
