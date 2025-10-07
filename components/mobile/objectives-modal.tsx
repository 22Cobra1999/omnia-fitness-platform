import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Target, X, Plus, Edit, Trash2 } from "lucide-react"

interface ObjectivesModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Exercise {
  id: string
  exercise_title: string
  unit: string
  value_1?: number
  value_2?: number
  value_3?: number
  value_4?: number
  date_1?: string
  date_2?: string
  date_3?: string
  date_4?: string
}

export function ObjectivesModal({ isOpen, onClose }: ObjectivesModalProps) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingRecord, setEditingRecord] = useState<string | null>(null)
  
  // Formulario para nuevo ejercicio
  const [newExercise, setNewExercise] = useState({
    title: "",
    unit: "",
    current_value: ""
  })
  
  const [timeValue, setTimeValue] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  })
  
  // Formulario para nuevo record
  const [newRecord, setNewRecord] = useState({
    exercise_title: "",
    current_value: "",
    notes: ""
  })
  
  // Formulario para editar record
  const [editRecord, setEditRecord] = useState({
    id: "",
    current_value: "",
    notes: ""
  })

  const unitOptions = [
    { value: "kg", label: "kg" },
    { value: "tiempo", label: "tiempo" },
    { value: "km", label: "km" },
    { value: "m", label: "m" },
    { value: "cm", label: "cm" },
    { value: "reps", label: "reps" },
    { value: "sets", label: "sets" },
    { value: "cal", label: "cal" }
  ]

  // Cargar ejercicios al abrir el modal
  useEffect(() => {
    if (isOpen) {
      fetchExercises()
    }
  }, [isOpen])

  const fetchExercises = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/profile/exercise-progress')
      if (response.ok) {
        const data = await response.json()
        setExercises(data.exercises || [])
      }
    } catch (error) {
      console.error('Error fetching exercises:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddExercise = async () => {
    if (!newExercise.title || !newExercise.unit) return
    
    let valueToSend = newExercise.current_value
    
    // Si la unidad es "tiempo", convertir a segundos
    if (newExercise.unit === "tiempo") {
      valueToSend = convertTimeToSeconds(timeValue.hours, timeValue.minutes, timeValue.seconds).toString()
    }
    
    if (!valueToSend || valueToSend === "0") return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/profile/exercise-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_title: newExercise.title,
          unit: newExercise.unit,
          value: valueToSend
        })
      })

      if (response.ok) {
        setNewExercise({ title: "", unit: "", current_value: "" })
        setTimeValue({ hours: 0, minutes: 0, seconds: 0 })
        setShowAddForm(false)
        fetchExercises()
      }
    } catch (error) {
      console.error('Error adding exercise:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddValue = async (exerciseId: string, value: string) => {
    if (!value) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/profile/exercise-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_id: exerciseId,
          value: parseFloat(value)
        })
      })

      if (response.ok) {
        setNewRecord({ exercise_title: "", current_value: "", notes: "" })
        setTimeValue({ hours: 0, minutes: 0, seconds: 0 })
        fetchExercises()
      }
    } catch (error) {
      console.error('Error adding value:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditValue = async (exerciseId: string, valueIndex: number, value: string) => {
    if (!value) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/profile/exercise-progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: exerciseId,
          value_index: valueIndex,
          value: parseFloat(value)
        })
      })

      if (response.ok) {
        setEditingRecord(null)
        setEditRecord({ id: "", current_value: "", notes: "" })
        fetchExercises()
      }
    } catch (error) {
      console.error('Error editing value:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteExercise = async (exerciseId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/profile/exercise-progress?id=${exerciseId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchExercises()
      }
    } catch (error) {
      console.error('Error deleting exercise:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit'
    })
  }

  // Funciones para manejar tiempo
  const formatTimeToString = (hours: number, minutes: number, seconds: number) => {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const parseTimeFromString = (timeString: string) => {
    const parts = timeString.split(':')
    return {
      hours: parseInt(parts[0]) || 0,
      minutes: parseInt(parts[1]) || 0,
      seconds: parseInt(parts[2]) || 0
    }
  }

  const convertTimeToSeconds = (hours: number, minutes: number, seconds: number) => {
    return hours * 3600 + minutes * 60 + seconds
  }

  const convertSecondsToTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return { hours, minutes, seconds }
  }

  const formatValueForDisplay = (value: number, unit: string) => {
    if (unit === "tiempo" && value) {
      const time = convertSecondsToTime(value)
      return formatTimeToString(time.hours, time.minutes, time.seconds)
    }
    return value?.toString() || "0"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[500px] mx-auto bg-[#1A1C1F] border-gray-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <Target className="h-5 w-5 text-[#FF6A00]" />
            Progreso de Ejercicios
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6">
          {/* Botón para agregar nuevo ejercicio */}
          {!showAddForm && (
            <Button
              onClick={() => setShowAddForm(true)}
              className="w-full bg-[#FF6A00] hover:bg-[#FF8C42] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Nuevo Ejercicio
            </Button>
          )}

          {/* Formulario para nuevo ejercicio */}
          {showAddForm && (
            <div className="bg-gray-800 p-4 rounded-lg space-y-4">
              <h3 className="text-lg font-medium text-white">Nuevo Ejercicio</h3>
              
              <div className="space-y-2">
                <Label className="text-white font-medium">Título del ejercicio</Label>
                <Input
                  placeholder="Ej: Press militar, Correr, Sentadilla..."
                  value={newExercise.title}
                  onChange={(e) => setNewExercise({...newExercise, title: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white font-medium">Unidad</Label>
                <Select value={newExercise.unit} onValueChange={(value) => setNewExercise({...newExercise, unit: value})}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Selecciona unidad" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {unitOptions.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value} className="text-white">
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white font-medium">Valor inicial</Label>
                {newExercise.unit === "tiempo" ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        value={timeValue.hours}
                        onChange={(e) => setTimeValue({...timeValue, hours: parseInt(e.target.value) || 0})}
                        className="w-16 bg-gray-700 border-gray-600 text-white text-center"
                        placeholder="00"
                      />
                      <span className="text-gray-400">h</span>
                    </div>
                    <span className="text-gray-400">:</span>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={timeValue.minutes}
                        onChange={(e) => setTimeValue({...timeValue, minutes: parseInt(e.target.value) || 0})}
                        className="w-16 bg-gray-700 border-gray-600 text-white text-center"
                        placeholder="00"
                      />
                      <span className="text-gray-400">m</span>
                    </div>
                    <span className="text-gray-400">:</span>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={timeValue.seconds}
                        onChange={(e) => setTimeValue({...timeValue, seconds: parseInt(e.target.value) || 0})}
                        className="w-16 bg-gray-700 border-gray-600 text-white text-center"
                        placeholder="00"
                      />
                      <span className="text-gray-400">s</span>
                    </div>
                  </div>
                ) : (
                  <Input
                    type="number"
                    placeholder="0"
                    value={newExercise.current_value}
                    onChange={(e) => setNewExercise({...newExercise, current_value: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddExercise}
                  disabled={!newExercise.title || !newExercise.unit || (newExercise.unit === "tiempo" ? (timeValue.hours === 0 && timeValue.minutes === 0 && timeValue.seconds === 0) : !newExercise.current_value) || isLoading}
                  className="flex-1 bg-[#FF6A00] hover:bg-[#FF8C42] text-white"
                >
                  {isLoading ? "Guardando..." : "Crear"}
                </Button>
              </div>
            </div>
          )}

          {/* Lista de ejercicios */}
          {exercises.length > 0 && (
            <div className="space-y-4">
              {exercises.map((exercise) => {
                const values = [exercise.value_1, exercise.value_2, exercise.value_3, exercise.value_4]
                const dates = [exercise.date_1, exercise.date_2, exercise.date_3, exercise.date_4]
                const hasEmptySlot = values.some(v => v === null || v === undefined)
                
                return (
                  <div key={exercise.id} className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium text-white">
                        {exercise.exercise_title} ({exercise.unit})
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteExercise(exercise.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Tabla de progreso simplificada */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-600">
                            <th className="text-left py-2 text-gray-300">Actual</th>
                            {values.map((value, index) => (
                              <th key={index} className="text-center py-2 text-gray-300">
                                {dates[index] ? formatDate(dates[index]) : `Valor ${index + 1}`}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="py-2 text-white font-medium">
                              {formatValueForDisplay(values[0], exercise.unit)} {exercise.unit !== "tiempo" ? exercise.unit : ""}
                            </td>
                            {values.map((value, index) => (
                              <td key={index} className="text-center py-2">
                                <div className="flex items-center justify-center gap-1">
                                  <span className="text-white">
                                    {editingRecord === `${exercise.id}-${index}` ? (
                                      <Input
                                        type="number"
                                        value={editRecord.current_value}
                                        onChange={(e) => setEditRecord({...editRecord, current_value: e.target.value})}
                                        className="w-16 h-6 text-xs bg-gray-700 border-gray-600 text-white"
                                      />
                                    ) : (
                                      value ? formatValueForDisplay(value, exercise.unit) : "-"
                                    )}
                                  </span>
                                  <div className="flex gap-1">
                                    {editingRecord === `${exercise.id}-${index}` ? (
                                      <>
                                        <Button
                                          size="sm"
                                          onClick={() => handleEditValue(exercise.id, index + 1, editRecord.current_value)}
                                          className="h-4 w-4 p-0 bg-green-600 hover:bg-green-700"
                                        >
                                          ✓
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={() => setEditingRecord(null)}
                                          className="h-4 w-4 p-0 bg-gray-600 hover:bg-gray-700"
                                        >
                                          ✕
                                        </Button>
                                      </>
                                    ) : (
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          setEditingRecord(`${exercise.id}-${index}`)
                                          setEditRecord({
                                            id: `${exercise.id}-${index}`,
                                            current_value: value?.toString() || "",
                                            notes: ""
                                          })
                                        }}
                                        className="h-4 w-4 p-0 bg-blue-600 hover:bg-blue-700"
                                      >
                                        <Edit className="h-2 w-2" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                      
                      {/* Botón para agregar nuevo valor */}
                      {hasEmptySlot && (
                        <div className="mt-3 flex justify-center">
                          {newRecord.exercise_title === exercise.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                placeholder="Nuevo valor"
                                value={newRecord.current_value}
                                onChange={(e) => setNewRecord({...newRecord, current_value: e.target.value})}
                                className="w-24 h-8 text-xs bg-gray-700 border-gray-600 text-white"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleAddValue(exercise.id, newRecord.current_value)}
                                className="h-8 px-3 bg-green-600 hover:bg-green-700"
                              >
                                ✓
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => setNewRecord({exercise_title: "", current_value: "", notes: ""})}
                                className="h-8 px-3 bg-gray-600 hover:bg-gray-700"
                              >
                                ✕
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => setNewRecord({...newRecord, exercise_title: exercise.id})}
                              className="bg-[#FF6A00] hover:bg-[#FF8C42] text-white"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Agregar Valor
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Estado vacío */}
          {exercises.length === 0 && !showAddForm && (
            <div className="text-center py-8 text-gray-400">
              <Target className="h-12 w-12 mx-auto mb-4 text-gray-600" />
              <p>No tienes ejercicios registrados</p>
              <p className="text-sm">Agrega tu primer ejercicio para comenzar a trackear tu progreso</p>
            </div>
          )}
        </div>

        {/* Botón cerrar */}
        <div className="pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

