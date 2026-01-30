import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Edit, Check, X, Minus, Save, Weight, Clock } from 'lucide-react'

interface Exercise {
  id: string
  exercise_title: string
  unit: string
  objective?: number
  current_value?: number
  created_at?: string
  updated_at?: string
}

interface ExerciseProgressListProps {
  userId?: string
  isEditing?: boolean
}

export interface ExerciseProgressListRef {
  saveChanges: () => Promise<void>
  cancelEditing: () => void
}

export const ExerciseProgressList = forwardRef<ExerciseProgressListRef, ExerciseProgressListProps>(({ userId, isEditing: externalIsEditing }, ref) => {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(false)
  const [internalIsEditing, setInternalIsEditing] = useState(false)
  const [editData, setEditData] = useState<{ [key: string]: { title: string, current: string, objective: string } }>({})

  const isEditing = externalIsEditing !== undefined ? externalIsEditing : internalIsEditing

  useImperativeHandle(ref, () => ({
    saveChanges: async () => {
      await saveChanges()
    },
    cancelEditing: () => {
      cancelEditing()
    }
  }))

  useEffect(() => {
    if (externalIsEditing === true && !internalIsEditing) {
      startEditing() // Initialize edit data
      setInternalIsEditing(true)
    } else if (externalIsEditing === false && internalIsEditing) {
      cancelEditing()
    }
  }, [externalIsEditing])

  useEffect(() => {
    if (userId) {
      fetchExercises()
    }
  }, [userId])


  const fetchExercises = async () => {
    setLoading(true)
    try {
      const url = userId ? `/api/profile/exercise-progress?userId=${userId}` : '/api/profile/exercise-progress'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setExercises(data.exercises || [])
      } else {
        const errorData = await response.json()
        console.error('Error fetching exercises:', errorData)

        // Si la tabla no existe, mostrar mensaje
        if (errorData.code === '42P01' || errorData.details?.includes('does not exist')) {
          console.log('Table does not exist')
        }
      }
    } catch (error) {
      console.error('Error fetching exercises:', error)
    } finally {
      setLoading(false)
    }
  }


  const convertSecondsToTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return { hours, minutes, seconds }
  }

  const formatTimeToString = (hours: number, minutes: number, seconds: number) => {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const formatValueForDisplay = (value: number, unit: string) => {
    if (unit === "tiempo" && value) {
      const time = convertSecondsToTime(value)
      return formatTimeToString(time.hours, time.minutes, time.seconds)
    }
    return value?.toString() || "0"
  }

  const startEditing = () => {
    const newEditData: { [key: string]: { title: string, current: string, objective: string } } = {}

    exercises.forEach(exercise => {
      // Para edición, mantener el formato original sin conversiones
      let currentValue = ""
      let objectiveValue = ""

      if (exercise.current_value) {
        if (exercise.unit === "tiempo") {
          // Para tiempo, mantener el formato HH:MM:SS
          currentValue = formatValueForDisplay(exercise.current_value, exercise.unit)
        } else {
          currentValue = exercise.current_value.toString()
        }
      }

      if (exercise.objective) {
        if (exercise.unit === "tiempo") {
          // Para tiempo, mantener el formato HH:MM:SS
          objectiveValue = formatValueForDisplay(exercise.objective, exercise.unit)
        } else {
          objectiveValue = exercise.objective.toString()
        }
      }

      newEditData[exercise.id] = {
        title: exercise.exercise_title,
        current: currentValue,
        objective: objectiveValue
      }
    })

    setEditData(newEditData)
    // Only set internal state if not controlled or if sync needed
    setInternalIsEditing(true)
  }

  const saveChanges = async () => {
    setLoading(true)
    try {
      if (userId) {
        // Use coach specific API for batch update
        const objectives = Object.entries(editData).map(([id, data]) => {
          const exercise = exercises.find(e => e.id === id)

          let currentValue = data.current
          let objectiveValue = data.objective

          if (exercise?.unit === "tiempo") {
            if (data.current && data.current.includes(':')) {
              const [h, m, s] = data.current.split(':').map(Number)
              currentValue = (h * 3600 + m * 60 + s).toString()
            }
            if (data.objective && data.objective.includes(':')) {
              const [h, m, s] = data.objective.split(':').map(Number)
              objectiveValue = (h * 3600 + m * 60 + s).toString()
            }
          }

          return {
            id,
            exercise_title: data.title,
            current_value: parseFloat(currentValue || '0'),
            objective: parseFloat(objectiveValue || '0'),
            unit: exercise?.unit
          }
        })

        await fetch(`/api/coach/clients/${userId}/objectives`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ objectives })
        })
      } else {
        // Individual profile updates (Existing logic)
        const savePromises = Object.entries(editData).map(async ([exerciseId, data]) => {
          const exercise = exercises.find(e => e.id === exerciseId)
          if (!exercise) return

          let currentValue = data.current
          let objectiveValue = data.objective

          if (exercise.unit === "tiempo") {
            if (data.current && data.current.includes(':')) {
              const [hours, minutes, seconds] = data.current.split(':').map(Number)
              currentValue = (hours * 3600 + minutes * 60 + seconds).toString()
            }
            if (data.objective && data.objective.includes(':')) {
              const [hours, minutes, seconds] = data.objective.split(':').map(Number)
              objectiveValue = (hours * 3600 + minutes * 60 + seconds).toString()
            }
          }

          if (data.title !== exercise.exercise_title) {
            await fetch('/api/profile/exercise-progress', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: exerciseId, exercise_title: data.title })
            })
          }
          if (data.current && currentValue !== exercise.current_value?.toString()) {
            await fetch('/api/profile/exercise-progress', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: exerciseId, current_value: parseFloat(currentValue) })
            })
          }
          if (data.objective && objectiveValue !== exercise.objective?.toString()) {
            await fetch('/api/profile/exercise-progress', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: exerciseId, objective: parseFloat(objectiveValue) })
            })
          }
        })
        await Promise.all(savePromises)
      }

      await fetchExercises()
      setInternalIsEditing(false)
    } catch (error) {
      console.error('Error saving changes:', error)
    } finally {
      setLoading(false)
    }
  }

  const cancelEditing = () => {
    setInternalIsEditing(false)
    setEditData({})
  }

  const deleteExercise = async (exerciseId: string) => {
    try {
      const response = await fetch('/api/profile/exercise-progress', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: exerciseId })
      })

      if (response.ok) {
        // Remover del estado local
        setExercises(exercises.filter(e => e.id !== exerciseId))
        // Limpiar datos de edición si existe
        const newEditData = { ...editData }
        delete newEditData[exerciseId]
        setEditData(newEditData)
      } else {
        console.error('Error eliminando ejercicio')
      }
    } catch (error) {
      console.error('Error eliminando ejercicio:', error)
    }
  }

  const updateEditData = (exerciseId: string, field: 'title' | 'current' | 'objective', value: string) => {
    setEditData(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [field]: value
      }
    }))
  }

  if (loading && exercises.length === 0) {
    return (
      <div className="text-center py-4 text-gray-400">
        Cargando ejercicios...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Eliminado botón redundante 'Editar Objetivos' que aparecía internamente */}

      <div className="overflow-x-auto pb-4 -mx-1 px-1 custom-scrollbar">
        <div className="flex gap-3 min-w-max">
          {exercises.map((exercise) => {
            return (
              <div key={exercise.id} className="bg-white/5 rounded-2xl p-3 relative flex flex-col justify-between border-l-2 border-transparent hover:border-l-[#FF6A00] hover:bg-white/10 transition-all w-[140px] h-[100px] group">
                {isEditing && (
                  <button
                    onClick={() => deleteExercise(exercise.id)}
                    className="absolute top-1 right-1 text-gray-400 hover:text-[#FF7939] transition-colors bg-black/50 rounded-full p-0.5"
                    style={{ zIndex: 10 }}
                    title="Eliminar objetivo"
                  >
                    <Minus className="h-3 w-3" strokeWidth={3} />
                  </button>
                )}

                {/* Título */}
                <div className="mb-1 w-full">
                  {isEditing ? (
                    <Input
                      value={editData[exercise.id]?.title || ""}
                      onChange={(e) => updateEditData(exercise.id, 'title', e.target.value)}
                      className="bg-transparent border-0 border-b border-gray-600/30 text-white text-[10px] font-bold h-5 px-0 w-full"
                      placeholder="Nombre"
                    />
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#FF6A00] opacity-70 group-hover:opacity-100 transition-opacity"></div>
                      <span className="text-[10px] uppercase text-gray-400 font-bold block leading-tight truncate w-full">{exercise.exercise_title || exercise.exercise_title}</span>
                    </div>
                  )}
                </div>

                {/* Valores */}
                <div className="mt-auto">
                  <div className="flex flex-col items-start gap-0.5">
                    {isEditing ? (
                      <div className="flex gap-1 items-center">
                        <Input
                          value={editData[exercise.id]?.current || ""}
                          onChange={(e) => updateEditData(exercise.id, 'current', e.target.value)}
                          className="w-10 h-5 bg-transparent border-0 border-b border-gray-600/30 text-sm font-bold text-white px-0 text-center"
                        />
                        <span className="text-[10px] text-gray-600">/</span>
                        <Input
                          value={editData[exercise.id]?.objective || ""}
                          onChange={(e) => updateEditData(exercise.id, 'objective', e.target.value)}
                          className="w-10 h-5 bg-transparent border-0 border-b border-gray-600/30 text-[10px] text-gray-400 px-0 text-center"
                        />
                      </div>
                    ) : (
                      <>
                        {/* Meta (Grande) */}
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-bold text-white leading-none">
                            {exercise.objective ? formatValueForDisplay(exercise.objective, exercise.unit) : "-"}
                            <span className="text-[10px] font-normal text-gray-500 ml-0.5">
                              {exercise.unit === 'kg' ? <Weight className="h-3 w-3 inline" /> : (exercise.unit === 'min' || exercise.unit === 'tiempo') ? <Clock className="h-3 w-3 inline" /> : exercise.unit}
                            </span>
                          </span>
                        </div>

                        {/* Actual (Pequeño Naranja) */}
                        <div className="text-[10px] text-[#FF6A00] font-medium flex items-center gap-1 mt-0.5">
                          <span className="opacity-80">Actual:</span>
                          <span className="font-bold flex items-center gap-0.5">
                            {formatValueForDisplay(exercise.current_value || 0, exercise.unit)}
                          </span>
                        </div>
                      </>
                    )}

                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})
