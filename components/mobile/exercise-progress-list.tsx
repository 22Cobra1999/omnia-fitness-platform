"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Edit, Check, X } from 'lucide-react'

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
}

export function ExerciseProgressList({ userId }: ExerciseProgressListProps) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<{[key: string]: {title: string, current: string, objective: string}}>({})

  useEffect(() => {
    if (userId) {
      fetchExercises()
    }
  }, [userId])


  const fetchExercises = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/profile/exercise-progress')
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
    const newEditData: {[key: string]: {title: string, current: string, objective: string}} = {}
    
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
    setIsEditing(true)
  }

  const saveChanges = async () => {
    setLoading(true)
    try {
      // Guardar cada ejercicio modificado
      const savePromises = Object.entries(editData).map(async ([exerciseId, data]) => {
        const exercise = exercises.find(e => e.id === exerciseId)
        if (!exercise) return

        // Convertir tiempo a segundos si es necesario
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

        // Actualizar título del ejercicio
        if (data.title !== exercise.exercise_title) {
          await fetch('/api/profile/exercise-progress', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: exerciseId,
              exercise_title: data.title
            })
          })
        }

        // Actualizar valor actual
        if (data.current && currentValue !== exercise.current_value?.toString()) {
          await fetch('/api/profile/exercise-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_id: exerciseId,
              value: parseFloat(currentValue)
            })
          })
        }

        // Actualizar objetivo
        if (data.objective && objectiveValue !== exercise.objective?.toString()) {
          await fetch('/api/profile/exercise-progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: exerciseId,
              objective: parseFloat(objectiveValue)
            })
          })
        }
      })

      await Promise.all(savePromises)
      
      // Recargar los datos
      await fetchExercises()
      setIsEditing(false)
      
    } catch (error) {
      console.error('Error saving changes:', error)
    } finally {
      setLoading(false)
    }
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditData({})
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
    <div className="space-y-1">
      {/* Header con título y botón de editar */}
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-lg">Objetivos</h2>
        {!isEditing ? (
                  <Button
            onClick={startEditing}
            variant="ghost"
                    size="sm"
            className="text-gray-400 hover:text-white p-1 h-6 w-6"
          >
            <Edit className="h-3 w-3" />
                  </Button>
        ) : (
          <div className="flex gap-1">
                  <Button
              onClick={saveChanges}
                    size="sm"
              className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 h-6 text-xs"
                  >
              <Check className="h-3 w-3 mr-1" />
              Guardar
                  </Button>
                  <Button
              onClick={cancelEditing}
                    size="sm"
              className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 h-6 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Cancelar
                  </Button>
                </div>
              )}
            </div>

      {/* Grid 2x2 compacto */}
      <div className="grid grid-cols-2 gap-2">
        {exercises.slice(0, 4).map((exercise) => {
          
          return (
            <div key={exercise.id} className="bg-gray-800/50 rounded-lg p-2">
              {isEditing ? (
                <div className="space-y-1.5">
                  <Input
                    value={editData[exercise.id]?.title || ""}
                    onChange={(e) => updateEditData(exercise.id, 'title', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white text-sm h-7"
                    placeholder="Nombre del ejercicio"
                  />
                  <div className="space-y-1">
                    <div className="text-gray-400 text-xs">Actual</div>
                    <Input
                      value={editData[exercise.id]?.current || ""}
                      onChange={(e) => updateEditData(exercise.id, 'current', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white text-sm h-7"
                      placeholder={exercise.unit === "tiempo" ? "00:00:00" : "Valor actual"}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-gray-400 text-xs">Objetivo</div>
                    <Input
                      value={editData[exercise.id]?.objective || ""}
                      onChange={(e) => updateEditData(exercise.id, 'objective', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white text-sm h-7"
                      placeholder={exercise.unit === "tiempo" ? "00:00:00" : "Objetivo"}
                    />
                              </div>
                            </div>
                          ) : (
                <div className="space-y-1.5">
                  <h3 className="text-white font-medium text-sm truncate">
                    {exercise.exercise_title}
                  </h3>
                  
                  <div className="space-y-1">
                    <div className="text-gray-400 text-xs">Actual</div>
                    <div className="text-white font-semibold text-sm">
                      {exercise.current_value ? formatValueForDisplay(exercise.current_value, exercise.unit) : "-"}
                      {exercise.current_value && exercise.unit !== "tiempo" && ` ${exercise.unit}`}
                </div>
              </div>
                  
                  <div className="space-y-1">
                    <div className="text-gray-400 text-xs">Objetivo</div>
                    <div className="text-white font-semibold text-sm">
                      {exercise.objective ? formatValueForDisplay(exercise.objective, exercise.unit) : "-"}
                      {exercise.objective && exercise.unit !== "tiempo" && ` ${exercise.unit}`}
                    </div>
                  </div>
                </div>
            )}
          </div>
        )
      })}
      </div>
    </div>
  )
}
