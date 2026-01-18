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
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: exerciseId,
          current_value: parseFloat(value)
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

  const formatValueForDisplay = (value: number | undefined | null, unit: string) => {
    if (unit === "tiempo" && value) {
      const time = convertSecondsToTime(value)
      return formatTimeToString(time.hours, time.minutes, time.seconds)
    }
    return value?.toString() || "0"
  }

  // Helper to get unit label
  const getUnitLabel = (unitValue: string) => {
    return unitOptions.find(u => u.value === unitValue)?.label || unitValue
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[500px] mx-auto bg-[#1A1C1F] border border-white/10 text-white max-h-[90vh] overflow-y-auto p-0 rounded-3xl shadow-2xl">
        <DialogHeader className="p-5 border-b border-white/5 bg-white/5 flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Target className="h-5 w-5 text-[#FF6A00]" />
            Objetivos
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white rounded-full h-8 w-8 p-0 hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="p-5 space-y-6">
          {/* Botón para agregar nuevo ejercicio - Solo visible si no hay form activo */}
          {!showAddForm && (
            <Button
              onClick={() => setShowAddForm(true)}
              className="w-full bg-[#FF6A00] hover:bg-[#FF6A00]/90 text-white h-12 rounded-xl font-semibold shadow-lg shadow-[#FF6A00]/20 flex items-center justify-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Nuevo Objetivo
            </Button>
          )}

          {/* Formulario para nuevo ejercicio */}
          {showAddForm && (
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-white">Nuevo Objetivo</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)} className="h-8 w-8 p-0 rounded-full hover:bg-white/10">
                  <X className="h-4 w-4 text-gray-400" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-400 uppercase tracking-wide ml-1">Ejercicio</Label>
                  <Input
                    placeholder="Ej: Press Banca, Correr 5k..."
                    value={newExercise.title}
                    onChange={(e) => setNewExercise({ ...newExercise, title: e.target.value })}
                    className="bg-[#0F1012] border-white/10 text-white h-11 rounded-xl focus-visible:ring-[#FF6A00]/50 focus-visible:border-[#FF6A00]/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-400 uppercase tracking-wide ml-1">Unidad</Label>
                    <Select value={newExercise.unit} onValueChange={(value) => setNewExercise({ ...newExercise, unit: value })}>
                      <SelectTrigger className="bg-[#0F1012] border-white/10 text-white h-11 rounded-xl focus:ring-[#FF6A00]/50 focus:border-[#FF6A00]/50">
                        <SelectValue placeholder="Unidad" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1C1F] border-white/10 text-white rounded-xl">
                        {unitOptions.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value} className="text-white hover:bg-white/10 cursor-pointer">
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-400 uppercase tracking-wide ml-1">Valor Inicial</Label>
                    {newExercise.unit === "tiempo" ? (
                      <div className="flex items-center gap-1 bg-[#0F1012] border border-white/10 rounded-xl px-2 h-11">
                        <Input
                          type="number"
                          min="0"
                          value={timeValue.hours || ''}
                          onChange={(e) => setTimeValue({ ...timeValue, hours: parseInt(e.target.value) || 0 })}
                          className="w-full bg-transparent border-none text-center p-0 h-full focus-visible:ring-0"
                          placeholder="HH"
                        />
                        <span className="text-gray-500">:</span>
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          value={timeValue.minutes || ''}
                          onChange={(e) => setTimeValue({ ...timeValue, minutes: parseInt(e.target.value) || 0 })}
                          className="w-full bg-transparent border-none text-center p-0 h-full focus-visible:ring-0"
                          placeholder="MM"
                        />
                        <span className="text-gray-500">:</span>
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          value={timeValue.seconds || ''}
                          onChange={(e) => setTimeValue({ ...timeValue, seconds: parseInt(e.target.value) || 0 })}
                          className="w-full bg-transparent border-none text-center p-0 h-full focus-visible:ring-0"
                          placeholder="SS"
                        />
                      </div>
                    ) : (
                      <Input
                        type="number"
                        placeholder="0"
                        value={newExercise.current_value}
                        onChange={(e) => setNewExercise({ ...newExercise, current_value: e.target.value })}
                        className="bg-[#0F1012] border-white/10 text-white h-11 rounded-xl focus-visible:ring-[#FF6A00]/50 focus-visible:border-[#FF6A00]/50"
                      />
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 h-11 rounded-xl border-white/10 bg-transparent text-gray-300 hover:bg-white/5 hover:text-white"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAddExercise}
                    disabled={!newExercise.title || !newExercise.unit || (newExercise.unit === "tiempo" ? (timeValue.hours === 0 && timeValue.minutes === 0 && timeValue.seconds === 0) : !newExercise.current_value) || isLoading}
                    className="flex-1 h-11 rounded-xl bg-[#FF6A00] hover:bg-[#FF6A00]/90 text-white shadow-lg shadow-[#FF6A00]/20"
                  >
                    {isLoading ? "Guardando..." : "Crear"}
                  </Button>
                </div>
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
                const lastValue = values.find(v => v !== null && v !== undefined)

                return (
                  <div key={exercise.id} className="bg-white/[0.03] border border-white/5 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white capitalize">
                          {exercise.exercise_title}
                        </h3>
                        <p className="text-xs text-[#FF6A00] font-medium uppercase tracking-wider mt-0.5">
                          {getUnitLabel(exercise.unit)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteExercise(exercise.id)}
                        className="text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Visualización de progreso minimalista */}
                    <div className="grid grid-cols-5 gap-2 text-center text-xs">
                      <div className="text-gray-500 font-medium uppercase tracking-wider text-[10px] mb-1 col-span-1 text-left">Actual</div>
                      <div className="text-gray-500 font-medium uppercase tracking-wider text-[10px] mb-1">Registro 1</div>
                      <div className="text-gray-500 font-medium uppercase tracking-wider text-[10px] mb-1">Registro 2</div>
                      <div className="text-gray-500 font-medium uppercase tracking-wider text-[10px] mb-1">Registro 3</div>
                      <div className="text-gray-500 font-medium uppercase tracking-wider text-[10px] mb-1">Registro 4</div>

                      {/* Fila de valores */}
                      <div className="col-span-1 text-left font-bold text-white text-base">
                        {formatValueForDisplay(values[0], exercise.unit) || '-'}
                        <span className="text-[10px] text-gray-500 font-normal ml-1">{exercise.unit !== 'tiempo' ? exercise.unit : ''}</span>
                      </div>

                      {values.map((value, index) => (
                        <div key={index} className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/[0.02] border border-white/5 relative group">
                          {editingRecord === `${exercise.id}-${index}` ? (
                            <div className="absolute inset-0 bg-[#1A1C1F] z-10 flex items-center justify-center gap-1 p-1 rounded-lg border border-[#FF6A00]/50">
                              <Input
                                type="text"
                                value={editRecord.current_value}
                                onChange={(e) => setEditRecord({ ...editRecord, current_value: e.target.value })}
                                className="h-full w-full bg-transparent border-none text-center text-xs p-0 focus-visible:ring-0 text-white"
                                autoFocus
                              />
                              <div className="flex flex-col gap-0.5">
                                <button onClick={() => handleEditValue(exercise.id, index + 1, editRecord.current_value)} className="text-green-500 hover:text-green-400"><span className="sr-only">Guardar</span>✓</button>
                                <button onClick={() => setEditingRecord(null)} className="text-red-500 hover:text-red-400"><span className="sr-only">Cancelar</span>✕</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <span className="text-white font-medium">{value ? formatValueForDisplay(value, exercise.unit) : "-"}</span>
                              {dates[index] && <span className="text-[8px] text-gray-500 mt-0.5">{formatDate(dates[index])}</span>}

                              {/* Botón editar (hover) */}
                              {value && (
                                <button
                                  onClick={() => {
                                    setEditingRecord(`${exercise.id}-${index}`)
                                    setEditRecord({
                                      id: `${exercise.id}-${index}`,
                                      current_value: value?.toString() || "",
                                      notes: ""
                                    })
                                  }}
                                  className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-[#FF6A00] transition-opacity"
                                >
                                  <Edit className="w-2 h-2" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Input para agregar valor */}
                    {hasEmptySlot && (
                      <div className="mt-4 pt-3 border-t border-white/5">
                        {newRecord.exercise_title === exercise.id ? (
                          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                            <div className="flex-1 relative">
                              <Input
                                type="number"
                                placeholder={exercise.unit === 'tiempo' ? "Segundos totales" : "Nuevo valor"}
                                value={newRecord.current_value}
                                onChange={(e) => setNewRecord({ ...newRecord, current_value: e.target.value })}
                                className="bg-[#0F1012] border-[#FF6A00]/50 text-white h-10 rounded-lg pr-12 focus-visible:ring-[#FF6A00]/20"
                                autoFocus
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                                {exercise.unit}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleAddValue(exercise.id, newRecord.current_value)}
                              className="h-10 px-4 bg-[#FF6A00] hover:bg-[#FF6A00]/90 text-white rounded-lg"
                            >
                              Guardar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setNewRecord({ exercise_title: "", current_value: "", notes: "" })}
                              className="h-10 w-10 p-0 text-gray-400 hover:text-white"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => setNewRecord({ ...newRecord, exercise_title: exercise.id, current_value: "" })}
                            variant="ghost"
                            className="w-full h-10 border border-dashed border-white/10 hover:bg-white/5 text-gray-400 hover:text-[#FF6A00] rounded-xl text-xs font-medium uppercase tracking-wide transition-all"
                          >
                            + Registrar nuevo progreso
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Estado vacío */}
          {exercises.length === 0 && !showAddForm && (
            <div className="text-center py-12 px-4 border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-white font-medium mb-1">Sin objetivos activos</p>
              <p className="text-sm text-gray-500">Define tus metas para realizar un seguimiento efectivo.</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-white/5 bg-white/5">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full h-12 rounded-xl border-white/10 bg-transparent text-gray-300 hover:bg-white/5 hover:text-white"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

