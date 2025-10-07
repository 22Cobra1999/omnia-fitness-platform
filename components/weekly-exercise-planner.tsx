"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2, Copy, GripVertical, ChevronUp, ChevronDown } from 'lucide-react'

interface Exercise {
  id: string
  name: string
  description?: string
  duration?: number
  type?: string
  intensity?: string
  equipment?: string
  bodyParts?: string
  calories?: number
  peso?: string
  reps?: string
  series?: string
  block?: number
}

interface WeeklySchedule {
  [weekNumber: number]: {
    [dayNumber: number]: Exercise[]
  }
}

interface WeeklyExercisePlannerProps {
  exercises: any[]
  onScheduleChange?: (schedule: WeeklySchedule) => void
  onPeriodsChange?: (periods: number) => void
  onStatsChange?: (stats: any) => void
  initialSchedule?: WeeklySchedule
  activityId?: number
  isEditing?: boolean
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

export function WeeklyExercisePlanner({ exercises, onScheduleChange, onPeriodsChange, onStatsChange, initialSchedule, activityId, isEditing }: WeeklyExercisePlannerProps) {
  // Inicializando planificador semanal
  
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>(initialSchedule || {})
  const [numberOfWeeks, setNumberOfWeeks] = useState(initialSchedule ? Object.keys(initialSchedule).length : 1)
  const [replicationCount, setReplicationCount] = useState(1)
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set())
  const [currentWeek, setCurrentWeek] = useState(1)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [showDayExercises, setShowDayExercises] = useState(false)
  const [periods, setPeriods] = useState(1)
  const [isLoadingPlanning, setIsLoadingPlanning] = useState(false)

  // Cargar planificación desde backend si estamos editando
  useEffect(() => {
    if (isEditing && activityId && activityId > 0) {
      loadPlanningFromBackend()
    }
  }, [isEditing, activityId])

  const loadPlanningFromBackend = async () => {
    if (!activityId) return

    setIsLoadingPlanning(true)
    try {
      
      const response = await fetch(`/api/get-product-planning?actividad_id=${activityId}`)
      const result = await response.json()

      if (result.success && result.data) {
        const { weeklySchedule: backendSchedule, periods: backendPeriods } = result.data
        
        console.log('📅 WeeklyExercisePlanner: Datos del backend cargados', {
          semanas: Object.keys(backendSchedule).length,
          periodos: backendPeriods,
          schedule: backendSchedule
        })

        // Actualizar estado con datos del backend
        if (backendSchedule && Object.keys(backendSchedule).length > 0) {
          setWeeklySchedule(backendSchedule)
          setNumberOfWeeks(Object.keys(backendSchedule).length)
        }
        
        if (backendPeriods && backendPeriods > 0) {
          setPeriods(backendPeriods)
        }

        // Notificar al padre con los datos cargados
        if (onScheduleChange && backendSchedule) {
          onScheduleChange(backendSchedule)
        }
        if (onPeriodsChange && backendPeriods) {
          onPeriodsChange(backendPeriods)
        }
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
    if (onScheduleChange) {
      // Usar setTimeout para evitar setState durante renderizado
      const timeoutId = setTimeout(() => {
        onScheduleChange(weeklySchedule)
      }, 0)
      return () => clearTimeout(timeoutId)
    }
  }, [weeklySchedule]) // Remover onScheduleChange de las dependencias

  // Notificar al padre cuando los períodos cambien
  useEffect(() => {
    if (onPeriodsChange) {
      onPeriodsChange(periods)
    }
  }, [periods]) // Remover onPeriodsChange de las dependencias

  // Notificar al padre cuando las estadísticas cambien
  useEffect(() => {
    if (onStatsChange) {
      const stats = getPatternStats()
      console.log('🔍 DEBUG - Estadísticas calculadas en WeeklyExercisePlanner:', stats)
      // Usar setTimeout para evitar setState durante renderizado
      const timeoutId = setTimeout(() => {
        onStatsChange(stats)
      }, 0)
      return () => clearTimeout(timeoutId)
    }
  }, [weeklySchedule, numberOfWeeks, periods]) // Remover onStatsChange de las dependencias

  // Convertir datos del CSV a ejercicios
  console.log('💪 WeeklyExercisePlanner: Ejercicios disponibles', {
    exercisesLength: exercises?.length || 0,
    exercises: exercises
  })
  
  const availableExercises: Exercise[] = exercises.map((row, index) => {
    
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
        series: row[10] || ''
      }
      // Ejercicio procesado desde array
      return exercise
    }
    // Si row es un objeto, usar propiedades
    const exercise = {
    id: row.id || `exercise-${index}`, // Usar ID real si existe, sino temporal
    name: row.name || row['Nombre de la Actividad'] || row[0] || `Ejercicio ${index + 1}`,
    description: row.description || row['Descripción'] || row[1] || '',
    duration: parseInt(row.duration || row['Duración (min)'] || row[2]) || 30,
    type: row.type || row['Tipo de Ejercicio'] || row[3] || 'General',
    intensity: row.intensity || row['Nivel de Intensidad'] || row[4] || 'Media',
    equipment: row.equipment || row['Equipo Necesario'] || row[5] || 'Ninguno',
    bodyParts: row.bodyParts || row['Partes del Cuerpo'] || row[6] || '',
      calories: parseInt(row.calories || row['Calorías'] || row[7]) || 0,
      peso: row.peso || row['Peso'] || row['1RM'] || row[8] || '',
      reps: row.reps || row['Repeticiones'] || row[9] || '',
      series: row.series || row['Series'] || row['Detalle de Series (peso-repeticiones-series)'] || row[10] || ''
    }
    // Ejercicio procesado
    return exercise
  })
  
  console.log('💪 WeeklyExercisePlanner: Ejercicios procesados', {
    availableExercisesLength: availableExercises.length,
    availableExercises: availableExercises
  })
  
  // Ejercicios procesados para el planificador semanal

  // Función para formatear las series como P-R-S
  const formatSeries = (exercise: Exercise) => {
    // Si hay un campo de series completo, parsearlo
    if (exercise.series && typeof exercise.series === 'string' && exercise.series.includes('-')) {
      return exercise.series
    }
    
    if (exercise.peso && exercise.reps && exercise.series) {
      return `${exercise.peso}-${exercise.reps}-${exercise.series}`
    }
    if (exercise.peso || exercise.reps || exercise.series) {
      return [exercise.peso, exercise.reps, exercise.series].filter(Boolean).join('-')
    }
    return null
  }

  const addExerciseToDay = (weekNumber: number, dayNumber: number, exerciseId: string) => {
    const exercise = availableExercises.find(ex => ex.id === exerciseId)
    if (!exercise) return

    const newSchedule = { ...weeklySchedule }
    if (!newSchedule[weekNumber]) {
      newSchedule[weekNumber] = {}
    }
    if (!newSchedule[weekNumber][dayNumber]) {
      newSchedule[weekNumber][dayNumber] = []
    }
    
    // Agregar ejercicio (permitir duplicados)
    newSchedule[weekNumber][dayNumber].push(exercise)
    setWeeklySchedule(newSchedule)
    onScheduleChange?.(newSchedule)
  }

  const removeExerciseFromDayByIndex = (weekNumber: number, dayNumber: number, exerciseIndex: number) => {
    const newSchedule = { ...weeklySchedule }
    if (newSchedule[weekNumber]?.[dayNumber]) {
      newSchedule[weekNumber][dayNumber].splice(exerciseIndex, 1)
      setWeeklySchedule(newSchedule)
      onScheduleChange?.(newSchedule)
    }
  }

  const toggleExerciseSelection = (exerciseId: string) => {
    const newSelection = new Set(selectedExercises)
    if (newSelection.has(exerciseId)) {
      newSelection.delete(exerciseId)
    } else {
      newSelection.add(exerciseId)
    }
    setSelectedExercises(newSelection)
  }

  const selectAllExercises = () => {
    const allIds = availableExercises.map(ex => ex.id)
    const allSelected = allIds.every(id => selectedExercises.has(id))
    
    if (allSelected) {
      setSelectedExercises(new Set())
    } else {
      setSelectedExercises(new Set(allIds))
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

  const removeExerciseFromDay = (dayKey: string, exerciseId: string) => {
    setWeeklySchedule(prev => {
      const newSchedule = { ...prev }
      const dayNumber = parseInt(dayKey)
      if (newSchedule[currentWeek]?.[dayNumber]) {
        newSchedule[currentWeek][dayNumber] = newSchedule[currentWeek][dayNumber].filter((ex: Exercise) => ex.id !== exerciseId)
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
  const getPatternStats = () => {
    let totalExercises = 0
    let totalDays = 0
    const uniqueExerciseIds = new Set<string>()
    
    for (let week = 1; week <= numberOfWeeks; week++) {
      for (const day of DAYS) {
        const dayExercises = getExercisesForDay(week, day.key)
        if (dayExercises.length > 0) {
          totalExercises += dayExercises.length
          totalDays++
          
          // Agregar IDs únicos de ejercicios
          dayExercises.forEach(exercise => {
            uniqueExerciseIds.add(exercise.id)
          })
        }
      }
    }
    
    return {
      totalExercises, // Ejercicios totales (incluyendo duplicados)
      totalDays, // Sesiones (días con ejercicios)
      totalWeeks: numberOfWeeks, // Semanas
      uniqueExercises: uniqueExerciseIds.size, // Ejercicios únicos
      totalSessions: totalDays * periods,
      totalExercisesReplicated: totalExercises * periods
    }
  }

  const assignSelectedToDay = (weekNumber: number, dayNumber: number) => {
    const newSchedule = { ...weeklySchedule }
    if (!newSchedule[weekNumber]) {
      newSchedule[weekNumber] = {}
    }
    if (!newSchedule[weekNumber][dayNumber]) {
      newSchedule[weekNumber][dayNumber] = []
    }

    selectedExercises.forEach(exerciseId => {
      const exercise = availableExercises.find(ex => ex.id === exerciseId)
      if (exercise && !newSchedule[weekNumber][dayNumber].some(ex => ex.id === exerciseId)) {
        newSchedule[weekNumber][dayNumber].push(exercise)
      }
    })

    setWeeklySchedule(newSchedule)
    onScheduleChange?.(newSchedule)
  }

  const addWeek = () => {
    const newWeekNumber = numberOfWeeks + 1
    const newSchedule = { ...weeklySchedule }
    
    // Inicializar la nueva semana con días vacíos
    newSchedule[newWeekNumber] = {}
    for (let day = 1; day <= 7; day++) {
      newSchedule[newWeekNumber][day] = []
    }
    
    setWeeklySchedule(newSchedule)
    setNumberOfWeeks(prev => prev + 1)
    onScheduleChange?.(newSchedule)
  }

  const removeWeek = () => {
    if (numberOfWeeks > 1) {
      const newSchedule = { ...weeklySchedule }
      delete newSchedule[numberOfWeeks]
      setWeeklySchedule(newSchedule)
      setNumberOfWeeks(prev => prev - 1)
      onScheduleChange?.(newSchedule)
    }
  }

  const replicateWeeks = () => {
    if (replicationCount > 1) {
      const newSchedule = { ...weeklySchedule }
      const baseWeeks = Object.keys(weeklySchedule).map(Number).sort()
      
      for (let i = 1; i < replicationCount; i++) {
        baseWeeks.forEach(baseWeek => {
          const newWeekNumber = baseWeek + (numberOfWeeks * i)
          newSchedule[newWeekNumber] = { ...weeklySchedule[baseWeek] }
        })
      }
      
      setWeeklySchedule(newSchedule)
      setNumberOfWeeks(prev => prev * replicationCount)
      onScheduleChange?.(newSchedule)
    }
  }

  const getExercisesForDay = (weekNumber: number, dayNumber: number): Exercise[] => {
    const dayData = weeklySchedule[weekNumber]?.[dayNumber]
    // Si es el nuevo formato con payload, extraer ejercicios
    if (dayData && typeof dayData === 'object' && 'exercises' in dayData) {
      return (dayData as { exercises: Exercise[] }).exercises || []
    }
    // Si es el formato antiguo (array directo), devolverlo
    return Array.isArray(dayData) ? dayData : []
  }

  // Colores por tipo de ejercicio - Paleta Omnia
  const getExerciseTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'Fuerza': 'bg-[#FF7939]', // Naranja principal
      'Cardio': 'bg-white', // Blanco
      'HIIT': 'bg-black', // Negro
      'Movilidad': 'bg-orange-200', // Naranja muy claro
      'Flexibilidad': 'bg-orange-500', // Naranja medio
      'Equilibrio': 'bg-orange-800', // Naranja muy oscuro
      'Funcional': 'bg-amber-600', // Ámbar oscuro
      'General': 'bg-gray-600' // Gris para general
    }
    return colors[type] || colors['General']
  }

  // Agrupar ejercicios por tipo para cada día
  const getExercisesByTypeForDay = (weekNumber: number, dayNumber: number) => {
    const exercises = getExercisesForDay(weekNumber, dayNumber)
    const grouped: { [key: string]: Exercise[] } = {}
    
    exercises.forEach(exercise => {
      const type = exercise.type || 'General'
      if (!grouped[type]) {
        grouped[type] = []
      }
      grouped[type].push(exercise)
    })
    
    return grouped
  }

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
        {(() => {
          const stats = getPatternStats()
          return (
            <div className="space-y-2">
              <h4 className="text-white text-sm font-medium">Resumen</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Semanas:</span>
                  <span className="text-[#FF7939] font-medium">{stats.totalWeeks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sesiones:</span>
                  <span className="text-[#FF7939] font-medium">{stats.totalDays}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Ejercicios totales:</span>
                  <span className="text-[#FF7939] font-medium">{stats.totalExercises}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Ejercicios únicos:</span>
                  <span className="text-[#FF7939] font-medium">{stats.uniqueExercises}</span>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Repetir - Centrado */}
        <div className="flex flex-col items-center space-y-2 mt-4">
          <h4 className="text-white text-sm font-medium">Repetir</h4>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPeriods(Math.max(1, periods - 1))}
              className="w-6 h-6 rounded-full border-2 border-[#FF7939] text-[#FF7939] hover:bg-[#FF7939]/10 text-xs font-light transition-colors flex items-center justify-center"
            >
              -
            </button>
            <span className="text-[#FF7939] text-sm font-medium w-6 text-center">{periods}</span>
            <button
              onClick={() => setPeriods(Math.min(12, periods + 1))}
              className="w-6 h-6 rounded-full border-2 border-[#FF7939] text-[#FF7939] hover:bg-[#FF7939]/10 text-xs font-light transition-colors flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de semanas - formato compacto */}
      <div className="w-full">
        {/* Selector de semanas */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <span className="text-white text-lg font-light">Semanas:</span>
          <div className="flex flex-wrap items-center gap-2 max-w-md">
            {Array.from({ length: numberOfWeeks }, (_, index) => (
              <button
                key={index + 1}
                onClick={() => setCurrentWeek(index + 1)}
                className={`w-8 h-8 rounded-full border-2 text-sm font-light transition-colors ${
                  currentWeek === index + 1
                    ? 'border-[#FF7939] text-[#FF7939]'
                    : 'border-gray-600 text-gray-300 hover:border-gray-500'
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => {
                setNumberOfWeeks(prev => prev + 1)
                setCurrentWeek(numberOfWeeks + 1)
              }}
              className="w-8 h-8 rounded-full border-2 border-[#FF7939] text-[#FF7939] hover:bg-[#FF7939]/10 text-sm font-light transition-colors"
            >
              +
            </button>
          </div>
          
          {/* Botón eliminar semana */}
          {numberOfWeeks > 1 && (
            <button
              onClick={() => {
                // Eliminar la semana actual
                setWeeklySchedule(prev => {
                  const newSchedule = { ...prev }
                  delete newSchedule[currentWeek]
                  return newSchedule
                })
                
                // Ajustar número de semanas
                setNumberOfWeeks(prev => prev - 1)
                
                // Cambiar a la semana anterior si es necesario
                if (currentWeek > 1) {
                  setCurrentWeek(currentWeek - 1)
                } else {
                  setCurrentWeek(1)
                }
              }}
              className="w-6 h-6 rounded-full border-2 border-[#FF7939] text-[#FF7939] hover:bg-[#FF7939]/10 text-xs font-light transition-colors flex items-center justify-center"
            >
              ✕
            </button>
          )}
        </div>

        <div className="space-y-1">
          {/* Headers de días */}
          <div className="grid grid-cols-7 gap-0">
            {DAYS.map((day, index) => (
              <div 
                key={day.key} 
                className="bg-transparent p-2 text-center relative cursor-pointer hover:bg-gray-800/30 transition-colors"
                onClick={() => {
                  // Click en header del día
                  console.log('🔍 DEBUG - Click en día:', day.key, 'Ejercicios seleccionados:', selectedExercises.size)
                  
                  if (selectedExercises.size === 0) {
                    openDayExercises(day.key.toString())
                    return
                  }
                  
                  // Usar la función existente para evitar duplicación
                  assignSelectedToDay(currentWeek, day.key)
                  
                  // Limpiar selección después de agregar
                  setSelectedExercises(new Set())
                }}
              >
                <span className="text-white text-sm font-light">{day.label}</span>
                {index < 6 && (
                  <div className="absolute right-0 top-0 bottom-0 w-px bg-gray-600/30"></div>
                )}
              </div>
            ))}
          </div>

          {/* Filas dinámicas por tipo de ejercicio */}
          {(() => {
            // Obtener todos los tipos únicos de la semana actual
            const allTypes = new Set<string>()
            DAYS.forEach(day => {
              const exercisesByType = getExercisesByTypeForDay(currentWeek, day.key)
              Object.keys(exercisesByType).forEach(type => allTypes.add(type))
            })
            
            const typesArray = Array.from(allTypes)
            
            return typesArray.map((type, typeIndex) => (
              <div key={type} className="grid grid-cols-7 gap-0">
                {DAYS.map((day, dayIndex) => {
                  const exercisesByType = getExercisesByTypeForDay(currentWeek, day.key)
                  const exercises = exercisesByType[type] || []
                  
                  return (
                    <div 
                      key={`${currentWeek}-${day.key}-${type}`}
                      className="bg-gray-900/20 p-2 min-h-[40px] border border-gray-800/20 rounded-lg relative flex items-center justify-center"
                    >
                      {exercises.length > 0 ? (
                        <div className={`w-6 h-6 rounded-full ${getExerciseTypeColor(type)} flex items-center justify-center text-black text-xs font-bold pointer-events-none`}>
                          {exercises.length}
                        </div>
                      ) : null}
                      {dayIndex < 6 && (
                        <div className="absolute right-0 top-0 bottom-0 w-px bg-gray-600/30"></div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))
          })()}
          </div>
        </div>
        
      {/* Lista de ejercicios - sección debajo */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-white font-light text-lg">Selecciona ejercicios</h4>
           <button
             onClick={availableExercises.every(ex => selectedExercises.has(ex.id)) ? clearSelection : selectAllExercises}
             className="text-[#FF7939] text-sm font-light hover:text-[#FF6B35] transition-colors"
           >
             {availableExercises.every(ex => selectedExercises.has(ex.id)) ? 'Ninguno' : 'Todos'}
           </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {availableExercises.map((exercise) => (
            <div 
              key={exercise.id}
              className={`bg-gray-900/20 border rounded-lg p-2 cursor-pointer transition-colors ${
                selectedExercises.has(exercise.id)
                  ? 'border-[#FF7939] bg-[#FF7939]/10'
                  : 'border-gray-800/30 hover:bg-[#FF7939]/10 hover:border-[#FF7939]/30'
              }`}
              onClick={() => toggleExerciseSelection(exercise.id)}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${getExerciseTypeColor(exercise.type || 'General')}`}></div>
                <p className="text-gray-300 text-xs font-light truncate">{exercise.name}</p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <p className={`text-xs px-2 py-1 rounded border ${getExerciseTypeColor(exercise.type || 'General').replace('bg-', 'border-')} ${getExerciseTypeColor(exercise.type || 'General').replace('bg-', 'text-')}`}>
                  {exercise.type || 'General'}
                </p>
                {formatSeries(exercise) && (
                  <p className="text-gray-400 text-xs">
                    {formatSeries(exercise)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal para ver/editar ejercicios del día con sistema de bloques */}
      {showDayExercises && selectedDay && (
        <DayExercisesModal
          dayKey={selectedDay}
          dayLabel={DAYS.find(d => d.key === parseInt(selectedDay))?.fullLabel || ''}
          exercises={getExercisesForDay(currentWeek, parseInt(selectedDay))}
          availableExercises={availableExercises}
          onClose={closeDayExercises}
          onUpdateExercises={(payload) => {
            setWeeklySchedule(prev => {
              const newSchedule = { ...prev }
              if (!newSchedule[currentWeek]) {
                newSchedule[currentWeek] = {}
              }
              const dayNumber = parseInt(selectedDay)
              // Manejar tanto ejercicios como información de bloques
              newSchedule[currentWeek][dayNumber] = payload
              // notificar al padre para que persista en estado superior
              onScheduleChange?.(newSchedule)
              return newSchedule
            })
          }}
          weekNumber={currentWeek}
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
  onUpdateExercises: (exercises: Exercise[]) => void
  weekNumber: number
}

function DayExercisesModal({ dayKey, dayLabel, exercises, availableExercises, onClose, onUpdateExercises, weekNumber }: DayExercisesModalProps) {
  const [exercisesLocal, setExercisesLocal] = useState<Exercise[]>([])
  const [blockCount, setBlockCount] = useState(1)
  const [showAvailableExercises, setShowAvailableExercises] = useState(false)

  useEffect(() => {
    const base = (exercises || []).map((ex) => ({ ...ex, block: ex.block || 1 }))
    setExercisesLocal(base)
    
    // Calcular el número de bloques basado en los ejercicios existentes
    const maxBlock = base.length > 0 ? Math.max(...base.map(ex => ex.block || 1)) : 1
    setBlockCount(maxBlock)
  }, [exercises])

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
  }

  const saveChanges = () => {
    // Incluir información de bloques en el payload
    const payload = {
      exercises: exercisesLocal,
      blockCount: blockCount
    }
    onUpdateExercises(payload as any)
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
    // Permitir duplicados - agregar siempre
    setExercisesLocal(prev => [...prev, exercise])
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 overflow-auto">
      <div className="bg-black p-4 md:p-6 pt-20 w-screen h-full max-w-none mx-0 overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-white text-xl font-light">{dayLabel} - Semana {weekNumber}</h3>
            <p className="text-gray-400 text-sm">Organiza ejercicios en bloques</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>
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
              onClick={() => distributeEvenly(Math.min(6, blockCount + 1))}
              className="w-7 h-7 rounded-md border border-[#FF7939] text-[#FF7939] hover:bg-[#FF7939]/10 flex items-center justify-center"
            >
              +
            </button>
          </div>
          <span className="text-xs text-gray-400 text-right pl-6">Se distribuyen equitativamente</span>
        </div>

        {/* Bloques en grilla responsive para aprovechar el ancho */}
        <div className="mb-6 grid grid-cols-1 gap-4 w-full px-0">
          {exercisesLocal.length === 0 && (
            <div className="text-gray-400 text-sm col-span-full">No hay ejercicios en este día.</div>
          )}
          {Array.from({ length: blockCount }, (_, i) => i + 1).map((blockId) => {
            const items = exercisesLocal
              .map((ex, idx) => ({ ex, idx }))
              .filter(({ ex }) => (ex.block || 1) === blockId)
            return (
              <div key={`block-${blockId}`} className="bg-transparent rounded-none p-0 border-0 w-full">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white text-sm font-medium">Bloque {blockId}</h4>
                  <span className="text-xs text-gray-400">{items.length} ejercicios</span>
                </div>
                <div className="space-y-2">
                  {items.length === 0 && (
                    <div className="text-gray-500 text-xs">Vacío</div>
                  )}
                  {items.map(({ ex, idx }) => (
                    <div key={`${ex.id}-${idx}`} className="bg-gray-900/20 rounded-md p-3 transition-colors w-full">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{ex.name}</p>
                          <div className="flex flex-col gap-1 text-xs text-gray-400">
                            <span>{ex.type || 'General'}</span>
                            {ex.series && (<span>{ex.series}</span>)}
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
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Botón + ejercicios con desplegable */}
        <div className="mb-6">
          <button
            onClick={() => setShowAvailableExercises(!showAvailableExercises)}
            className="flex items-center gap-2 text-[#FF7939] hover:text-white transition-colors mb-3"
          >
            <span className="text-xl">+</span>
            <span>ejercicios</span>
          </button>
          
          {showAvailableExercises && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
              {availableExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  onClick={() => addFromAvailable(exercise)}
                  className="bg-gray-800/30 rounded-lg p-2 cursor-pointer hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getExerciseTypeColor(exercise.type || 'General')}`}></div>
                    <div className="flex-1">
                      <p className="text-white text-xs font-medium truncate">{exercise.name}</p>
                      <p className="text-gray-400 text-xs">{exercise.type || 'General'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={saveChanges}
            className="bg-[#FF7939] text-white px-6 py-2 rounded-lg hover:bg-[#FF6B35] transition-colors"
          >
            Guardar
          </button>
        </div>

      </div>
    </div>
  )
}

// Función helper para colores de ejercicios (reutilizada)
function getExerciseTypeColor(type: string) {
  const colors: { [key: string]: string } = {
    'Fuerza': 'bg-[#FF7939]',
    'Cardio': 'bg-white',
    'HIIT': 'bg-black',
    'Movilidad': 'bg-orange-200',
    'Flexibilidad': 'bg-orange-500',
    'Equilibrio': 'bg-orange-800',
    'Funcional': 'bg-amber-600',
    'General': 'bg-gray-600'
  }
  return colors[type] || colors['General']
}
