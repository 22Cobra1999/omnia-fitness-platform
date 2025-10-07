"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, X } from 'lucide-react'

interface QuickExerciseAddProps {
  onAdd: (exercise: { title: string; unit: string; value: string }) => void
  onCancel: () => void
}

export function QuickExerciseAdd({ onAdd, onCancel }: QuickExerciseAddProps) {
  const [exercise, setExercise] = useState({
    title: "",
    unit: "",
    value: ""
  })

  const [timeValue, setTimeValue] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
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

  const convertTimeToSeconds = (hours: number, minutes: number, seconds: number) => {
    return hours * 3600 + minutes * 60 + seconds
  }

  const handleSubmit = () => {
    if (!exercise.title || !exercise.unit) return

    let valueToSend = exercise.value
    
    if (exercise.unit === "tiempo") {
      valueToSend = convertTimeToSeconds(timeValue.hours, timeValue.minutes, timeValue.seconds).toString()
    }

    if (!valueToSend || valueToSend === "0") return

    onAdd({
      title: exercise.title,
      unit: exercise.unit,
      value: valueToSend
    })
  }

  const isDisabled = !exercise.title || !exercise.unit || 
    (exercise.unit === "tiempo" ? (timeValue.hours === 0 && timeValue.minutes === 0 && timeValue.seconds === 0) : !exercise.value)

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 border border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-lg">Nuevo Ejercicio</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="text-gray-400 hover:text-white p-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {/* Título del ejercicio */}
        <div>
          <Input
            placeholder="Ej: Press militar, Correr, Sentadilla..."
            value={exercise.title}
            onChange={(e) => setExercise({...exercise, title: e.target.value})}
            className="bg-gray-700/50 border-gray-600/50 text-white rounded-xl h-12 px-4 focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]"
          />
        </div>

        {/* Unidad */}
        <div>
          <Select value={exercise.unit} onValueChange={(value) => setExercise({...exercise, unit: value})}>
            <SelectTrigger className="bg-gray-700/50 border-gray-600/50 text-white rounded-xl h-12 px-4 focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]">
              <SelectValue placeholder="Selecciona unidad" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600 rounded-xl">
              {unitOptions.map((unit) => (
                <SelectItem key={unit.value} value={unit.value} className="text-white hover:bg-gray-700">
                  {unit.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Valor */}
        <div>
          {exercise.unit === "tiempo" ? (
            <div className="flex items-center justify-center gap-3 bg-gray-700/30 rounded-xl p-4">
              <div className="flex flex-col items-center gap-1">
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={timeValue.hours}
                  onChange={(e) => setTimeValue({...timeValue, hours: parseInt(e.target.value) || 0})}
                  className="w-16 bg-gray-600/50 border-gray-500 text-white text-center rounded-lg h-10 focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]"
                  placeholder="00"
                />
                <span className="text-gray-400 text-xs">horas</span>
              </div>
              <span className="text-gray-400 text-xl">:</span>
              <div className="flex flex-col items-center gap-1">
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={timeValue.minutes}
                  onChange={(e) => setTimeValue({...timeValue, minutes: parseInt(e.target.value) || 0})}
                  className="w-16 bg-gray-600/50 border-gray-500 text-white text-center rounded-lg h-10 focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]"
                  placeholder="00"
                />
                <span className="text-gray-400 text-xs">min</span>
              </div>
              <span className="text-gray-400 text-xl">:</span>
              <div className="flex flex-col items-center gap-1">
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={timeValue.seconds}
                  onChange={(e) => setTimeValue({...timeValue, seconds: parseInt(e.target.value) || 0})}
                  className="w-16 bg-gray-600/50 border-gray-500 text-white text-center rounded-lg h-10 focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]"
                  placeholder="00"
                />
                <span className="text-gray-400 text-xs">seg</span>
              </div>
            </div>
          ) : (
            <Input
              type="number"
              placeholder="0"
              value={exercise.value}
              onChange={(e) => setExercise({...exercise, value: e.target.value})}
              className="bg-gray-700/50 border-gray-600/50 text-white rounded-xl h-12 px-4 focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]"
            />
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 border-gray-600/50 text-gray-300 hover:bg-gray-700/50 rounded-xl h-12"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isDisabled}
            className="flex-1 bg-gradient-to-r from-[#FF6A00] to-[#FF8C42] hover:from-[#FF8C42] hover:to-[#FF6A00] text-white rounded-xl h-12 font-semibold shadow-lg transition-all duration-300"
          >
            Agregar
          </Button>
        </div>
      </div>
    </div>
  )
}
