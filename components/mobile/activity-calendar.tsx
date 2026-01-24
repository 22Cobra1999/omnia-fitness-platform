"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, RotateCcw, ArrowRight, Calendar, AlertTriangle } from "lucide-react"
import { useClientMetrics } from '@/hooks/client/use-client-metrics'
import { createSupabaseClient } from "@/lib/supabase/supabase-client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface ActivityCalendarProps {
  userId?: string
}

interface DayData {
  date: string
  day: number
  kcal: number
  minutes: number
  exercises: number
  kcalTarget: number
  minutesTarget: number
  exercisesTarget: number
}

const ActivityCalendar = ({ userId }: ActivityCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [activityFilter, setActivityFilter] = useState<'fitness' | 'nutricion'>('fitness')
  const { weeklyData, loading, refetch } = useClientMetrics(userId, activityFilter, currentDate)
  const [monthlyData, setMonthlyData] = useState<DayData[]>([])

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false)
  const [sourceDate, setSourceDate] = useState<Date | null>(null)
  const [targetDate, setTargetDate] = useState<Date | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [applyToAllSameDays, setApplyToAllSameDays] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const supabase = createSupabaseClient()

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ]

  const dayNames = ["D", "L", "M", "M", "J", "V", "S"]

  useEffect(() => {
    if (userId) {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)

      const startStr = `${year}-${String(month + 1).padStart(2, '0')}-01`
      const endStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`

      refetch(startStr, endStr)
    }
  }, [userId, currentDate, activityFilter])

  useEffect(() => {
    if (weeklyData) {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const firstDayOfMonth = new Date(year, month, 1).getDay()

      const days: DayData[] = []

      // Fill empty days at start
      for (let i = 0; i < firstDayOfMonth; i++) {
        days.push({
          date: "",
          day: 0,
          kcal: 0,
          minutes: 0,
          exercises: 0,
          kcalTarget: 500,
          minutesTarget: 60,
          exercisesTarget: 3
        })
      }

      // Map real data
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const dayData = weeklyData.find(d => d.date === dateStr)

        days.push({
          date: dateStr,
          day,
          kcal: dayData?.kcal || 0,
          minutes: dayData?.minutes || 0,
          exercises: dayData?.exercises || 0,
          kcalTarget: dayData?.kcalTarget || 500,
          minutesTarget: dayData?.minutesTarget || 60,
          exercisesTarget: dayData?.target || 3
        })
      }

      setMonthlyData(days)
    }
  }, [weeklyData, currentDate])

  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const toggleEditMode = () => {
    if (isEditing) {
      setIsEditing(false)
      setSourceDate(null)
      setTargetDate(null)
      setShowConfirmModal(false)
    } else {
      setIsEditing(true)
      setSourceDate(null)
      setTargetDate(null)
    }
  }

  const handleDayClick = (dateStr: string) => {
    if (!isEditing || !dateStr) return

    const [y, m, d] = dateStr.split('-').map(Number)
    const dateObj = new Date(y, m - 1, d)

    if (!sourceDate) {
      setSourceDate(dateObj)
    } else {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      setTargetDate(dateObj)
      setShowConfirmModal(true)
    }
  }

  const handleConfirmUpdate = async () => {
    if (!userId || !sourceDate || !targetDate) return

    setIsUpdating(true)
    try {
      const sourceStr = sourceDate.toISOString().split('T')[0]
      const targetStr = new Date(targetDate.getTime() - (targetDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0]

      const { error: errorProg } = await (supabase
        .from('progreso_cliente') as any)
        .update({ fecha: targetStr })
        .eq('cliente_id', userId)
        .eq('fecha', sourceStr)

      const { error: errorNut } = await (supabase
        .from('progreso_cliente_nutricion') as any)
        .update({ fecha: targetStr })
        .eq('cliente_id', userId)
        .eq('fecha', sourceStr)

      if (errorProg || errorNut) throw new Error('Error al mover actividades')

      if (applyToAllSameDays) {
        const { data: futureProgress } = await supabase
          .from('progreso_cliente')
          .select('id, fecha')
          .eq('cliente_id', userId)
          .gt('fecha', sourceStr)

        if (futureProgress && futureProgress.length > 0) {
          const dayOfWeek = sourceDate.getDay()
          const diffTime = targetDate.getTime() - sourceDate.getTime()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

          const updates = futureProgress.filter((item: any) => {
            const d = new Date(item.fecha)
            const dLocal = new Date(d.getTime() + (d.getTimezoneOffset() * 60000))
            return dLocal.getDay() === dayOfWeek
          }).map((item: any) => {
            const d = new Date(item.fecha)
            const newD = new Date(d.getTime() + (diffDays * 24 * 60 * 60 * 1000))
            return {
              id: item.id,
              fecha: newD.toISOString().split('T')[0]
            }
          })

          if (updates.length > 0) {
            await (supabase.from('progreso_cliente') as any).upsert(updates)

            const { data: futureNut } = await supabase
              .from('progreso_cliente_nutricion')
              .select('id, fecha')
              .eq('cliente_id', userId)
              .gt('fecha', sourceStr)

            if (futureNut && futureNut.length > 0) {
              const nutUpdates = futureNut.filter((item: any) => {
                const d = new Date(item.fecha)
                const dLocal = new Date(d.getTime() + (d.getTimezoneOffset() * 60000))
                return dLocal.getDay() === dayOfWeek
              }).map((item: any) => {
                const d = new Date(item.fecha)
                const newD = new Date(d.getTime() + (diffDays * 24 * 60 * 60 * 1000))
                return {
                  id: item.id,
                  fecha: newD.toISOString().split('T')[0]
                }
              })
              if (nutUpdates.length > 0) {
                await (supabase.from('progreso_cliente_nutricion') as any).upsert(nutUpdates)
              }
            }
          }
        }
      }

      setIsEditing(false)
      setSourceDate(null)
      setTargetDate(null)
      setShowConfirmModal(false)

      if (typeof window !== 'undefined') {
        window.location.reload()
      }

    } catch (error) {
      console.error('Error updating dates:', error)
      alert('Hubo un error al cambiar la fecha. Inténtalo de nuevo.')
    } finally {
      setIsUpdating(false)
    }
  }

  const ActivityRing = ({ progress, color, size = 36 }: { progress: number, color: string, size?: number }) => {
    const safeProgress = isNaN(progress) || !isFinite(progress) ? 0 : Math.max(0, Math.min(100, progress))
    const radius = (size - 8) / 2
    const circumference = 2 * Math.PI * radius
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (safeProgress / 100) * circumference

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(75, 85, 99, 0.3)"
            strokeWidth="2"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
            style={{
              filter: `drop-shadow(0 0 3px ${color}40)`
            }}
          />
        </svg>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const getDayName = (dayIndex: number) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    return days[dayIndex] || ''
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="space-y-4 max-w-full overflow-x-hidden">
        {/* Filtros de Categoría */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <button
            onClick={() => setActivityFilter('fitness')}
            className={`text-xs px-4 py-1.5 rounded-full font-medium transition-all ${activityFilter === 'fitness'
              ? 'bg-black text-[#FF7939] ring-1 ring-[#FF7939]/30'
              : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
              }`}
          >
            Fitness
          </button>
          <button
            onClick={() => setActivityFilter('nutricion')}
            className={`text-xs px-4 py-1.5 rounded-full font-medium transition-all ${activityFilter === 'nutricion'
              ? 'bg-white text-[#FF7939]'
              : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
              }`}
          >
            Nutrición
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousMonth}
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-400" />
            </button>

            <h4 className="text-lg font-semibold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h4>

            <button
              onClick={goToNextMonth}
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {isEditing && (
          <div className="bg-[#FF7939]/10 border border-[#FF7939]/20 rounded-lg p-2 text-center text-xs text-[#FF7939] animate-in fade-in slide-in-from-top-2">
            {!sourceDate
              ? "Selecciona el día que quieres mover"
              : "Ahora selecciona el día destino"}
          </div>
        )}

        <div className="grid grid-cols-7 gap-1 mb-2 w-full px-1">
          {dayNames.map((day, index) => (
            <div key={index} className="text-center text-[10px] sm:text-sm text-gray-400 font-medium py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {monthlyData.map((day, index) => {
            if (day.day === 0) {
              return <div key={index} className="h-20"></div>
            }

            const kcalProgress = day.kcalTarget > 0 ? (day.kcal / day.kcalTarget) * 100 : 0
            const minutesProgress = day.minutesTarget > 0 ? (day.minutes / day.minutesTarget) * 100 : 0
            const exercisesProgress = day.exercisesTarget > 0 ? (day.exercises / day.exercisesTarget) * 100 : 0

            const parsedDate = day.date ? new Date(parseInt(day.date.split('-')[0]), parseInt(day.date.split('-')[1]) - 1, parseInt(day.date.split('-')[2])) : null

            const isToday = new Date().toDateString() === parsedDate?.toDateString()
            const isSource = sourceDate && parsedDate && sourceDate.toDateString() === parsedDate.toDateString()

            return (
              <div
                key={day.date}
                onClick={() => day.date && handleDayClick(day.date)}
                className={`h-20 flex flex-col items-center justify-center space-y-1 rounded-xl transition-all relative ${isEditing && day.date ? 'cursor-pointer hover:bg-white/5' : ''
                  } ${isSource ? 'bg-[#FF7939]/20 ring-1 ring-[#FF7939]' : ''
                  }`}
              >
                {isSource && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF7939] rounded-full flex items-center justify-center text-[8px] font-bold text-white z-10">
                    1
                  </div>
                )}

                <div className={`text-xs font-medium transition-colors ${isToday
                  ? 'text-white bg-red-500 rounded-full w-6 h-6 flex items-center justify-center shadow-md'
                  : isSource
                    ? 'text-[#FF7939] font-bold'
                    : 'text-gray-300'
                  }`}>
                  {day.day}
                </div>

                <div
                  className="flex justify-center relative transition-opacity"
                  style={{ width: 40, height: 40 }}
                >
                  {/* Anillo exterior - Kcal */}
                  <ActivityRing
                    progress={kcalProgress}
                    color="#FF6A00"
                    size={40}
                  />

                  {/* Anillo medio - Minutos */}
                  {day.minutesTarget > 0 && (
                    <div className="absolute top-1 left-1">
                      <ActivityRing
                        progress={minutesProgress}
                        color="#FF8C42"
                        size={32}
                      />
                    </div>
                  )}

                  {/* Anillo interior - Ejercicios/Platos */}
                  <div className={`absolute ${day.minutesTarget > 0 ? 'top-2 left-2' : 'top-1 left-1'}`}>
                    <ActivityRing
                      progress={exercisesProgress}
                      color="#FFFFFF"
                      size={day.minutesTarget > 0 ? 24 : 32}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="bg-[#1A1C1F] border-zinc-800 text-white w-[90%] max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg">Mover actividades</DialogTitle>
            <DialogDescription className="text-gray-400">
              ¿Estás seguro que quieres cambiar la fecha de estas actividades?
            </DialogDescription>
          </DialogHeader>

          <div className="bg-[#141414] rounded-xl p-4 my-2 border border-zinc-800 flex items-center justify-between">
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500 uppercase">De</span>
              <span className="text-xl font-bold text-white">{sourceDate?.getDate()}</span>
              <span className="text-xs text-[#FF7939]">{sourceDate && getDayName(sourceDate.getDay())}</span>
            </div>

            <ArrowRight className="text-gray-600" />

            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500 uppercase">A</span>
              <span className="text-xl font-bold text-white">{targetDate?.getDate()}</span>
              <span className="text-xs text-green-500">{targetDate && getDayName(targetDate.getDay())}</span>
            </div>
          </div>

          {sourceDate && (
            <div className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Checkbox
                id="apply-all"
                checked={applyToAllSameDays}
                onCheckedChange={(checked) => setApplyToAllSameDays(checked as boolean)}
                className="mt-0.5 border-blue-400 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white"
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="apply-all"
                  className="text-sm font-medium leading-none text-blue-100 cursor-pointer"
                >
                  Mover todos los {getDayName(sourceDate.getDay())}s futuros
                </Label>
                <p className="text-xs text-blue-200/70">
                  Esto aplicará el mismo cambio a todos los {getDayName(sourceDate.getDay())}s en el futuro.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:justify-end mt-2">
            <Button variant="ghost" onClick={() => setShowConfirmModal(false)} className="flex-1 text-gray-400 hover:text-white">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmUpdate}
              disabled={isUpdating}
              className="flex-1 bg-[#FF7939] hover:bg-[#FF6A00] text-white"
            >
              {isUpdating ? 'Guardando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ActivityCalendar
