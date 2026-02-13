"use client"

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useClientMetrics } from '@/hooks/client/use-client-metrics'

interface DailyMetrics {
  date: string
  dayName: string
  kcal: number
  kcalTarget: number
  minutes: number
  minutesTarget: number
  exercises: number
  exercisesTarget: number
  category?: 'fitness' | 'nutricion'
}

interface DailyActivityRingsProps {
  userId?: string
  selectedDate?: string
  category?: 'fitness' | 'nutricion'
  onSelectDay?: (day: DailyMetrics) => void
  currentWeek?: Date
  onWeekChange?: (week: Date) => void
  headerRight?: React.ReactNode
}

export function DailyActivityRings({ userId, selectedDate, category = 'fitness', onSelectDay, currentWeek: controlledWeek, onWeekChange, headerRight }: DailyActivityRingsProps) {
  const [uncontrolledWeek, setUncontrolledWeek] = useState(new Date())
  const currentWeek = controlledWeek ?? uncontrolledWeek
  const setCurrentWeek = (d: Date) => {
    if (controlledWeek) {
      onWeekChange?.(d)
    } else {
      setUncontrolledWeek(d)
      onWeekChange?.(d)
    }
  }
  const [dailyData, setDailyData] = useState<DailyMetrics[]>([])
  const [loading, setLoading] = useState(false)
  const [highlightedDay, setHighlightedDay] = useState<string | null>(selectedDate || null)

  // Usar el hook existente para obtener datos reales con filtro de categoría
  const { weeklyData, loading: metricsLoading } = useClientMetrics(userId, category, currentWeek)

  useEffect(() => {
    if (userId && weeklyData.length > 0) {
      processWeeklyData()
    }
  }, [userId, currentWeek, weeklyData])

  /*
  useEffect(() => {
    console.log('🧿 [RINGS][DAILY] Estado actualizado:', {
      userId,
      category,
      currentWeek: currentWeek.toISOString(),
      highlightedDay,
      weeklyDataLen: weeklyData.length
    })
  }, [userId, category, currentWeek, highlightedDay, weeklyData.length])
  */

  const processWeeklyData = () => {
    setLoading(true)
    try {
      const weekData: DailyMetrics[] = []
      const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

      // weeklyData ya viene como semana actual (Lun-Dom) desde useClientMetrics
      weeklyData.slice(0, 7).forEach((dayData, index) => {
        const dateString = dayData.date

        /*
        console.log('📊 DailyActivityRings: Procesando día real', {
          dateString,
          dayData,
          hasData: !!dayData
        })
        */

        weekData.push({
          date: dateString,
          dayName: dayNames[index % 7], // Ajustar día de la semana
          kcal: dayData?.kcal || 0,
          kcalTarget: dayData?.kcalTarget || 0,
          minutes: dayData?.minutes || 0,
          minutesTarget: dayData?.minutesTarget || 0,
          exercises: dayData?.exercises || 0,
          exercisesTarget: dayData?.target || 0,
          category
        })
      })

      setDailyData(weekData)
    } catch (error) {
      console.error('Error processing weekly data:', error)
    } finally {
      setLoading(false)
    }
  }

  const goToPreviousWeek = () => {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(currentWeek.getDate() - 7)
    console.log('🧿 [RINGS][DAILY] Semana anterior', {
      category,
      from: currentWeek.toISOString(),
      to: newWeek.toISOString()
    })
    setCurrentWeek(newWeek)
  }

  const goToNextWeek = () => {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(currentWeek.getDate() + 7)
    console.log('🧿 [RINGS][DAILY] Semana siguiente', {
      category,
      from: currentWeek.toISOString(),
      to: newWeek.toISOString()
    })
    setCurrentWeek(newWeek)
  }

  const formatWeekRange = () => {
    const startOfWeek = new Date(currentWeek)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
    startOfWeek.setDate(diff)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)

    const startMonth = startOfWeek.toLocaleDateString('es-ES', { month: 'short' })
    const endMonth = endOfWeek.toLocaleDateString('es-ES', { month: 'short' })

    if (startMonth === endMonth) {
      return `${startOfWeek.getDate()}-${endOfWeek.getDate()} ${startMonth}`
    } else {
      return `${startOfWeek.getDate()} ${startMonth} - ${endOfWeek.getDate()} ${endMonth}`
    }
  }

  const getRingLabel = (category: string, index: number) => {
    if (category === 'nutricion') {
      return index === 2 ? 'Platos' : index === 1 ? '' : 'Kcal'
    }
    return index === 2 ? 'Ejerc' : index === 1 ? 'Min' : 'Kcal'
  }

  const shouldShowMiddleRing = (category: string, minutesTarget: number) => {
    return minutesTarget > 0
  }

  const ActivityRing = ({ progress, color, size = 36, strokeWidth = 3, label }: { progress: number, color: string, size?: number, strokeWidth?: number, label?: string }) => {
    const safeProgress = isNaN(progress) || !isFinite(progress) ? 0 : Math.max(0, Math.min(100, progress));
    const radius = (size - strokeWidth * 2) / 2
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (safeProgress / 100) * circumference

    // Create a unique ID for the gradient based on color
    const gradientId = `grad-${color.replace('#', '')}`

    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90 block">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={color} stopOpacity={0.6} />
            </linearGradient>
          </defs>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
          />
        </svg>
        {label && (
          <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white/90">
            {label}
          </div>
        )}
      </div>
    )
  }

  if (loading || metricsLoading) {
    return (
      <div className="text-center py-4 text-gray-400">
        Cargando datos semanales...
      </div>
    )
  }

  return (
    <div className="space-y-3 relative">
      {/* Navegación semanal */}
      <div className="flex items-center justify-center gap-2 relative">
        <Button
          onClick={goToPreviousWeek}
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white p-1 h-6 w-6"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-gray-400 text-sm min-w-[120px] text-center">
          {formatWeekRange()}
        </span>
        <Button
          onClick={goToNextWeek}
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white p-1 h-6 w-6"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Elemento extra (Calendario) a la derecha */}
        {headerRight && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            {headerRight}
          </div>
        )}
      </div>

      {/* Grid de anillos diarios */}
      <div className="grid grid-cols-7 gap-2">
        {dailyData.map((day, index) => {
          const kcalProgress = day.kcalTarget > 0 ? Math.min((day.kcal / day.kcalTarget) * 100, 100) : 0
          const minutesProgress = day.minutesTarget > 0 ? Math.min((day.minutes / day.minutesTarget) * 100, 100) : 0
          const exercisesProgress = day.exercisesTarget > 0 ? Math.min((day.exercises / day.exercisesTarget) * 100, 100) : 0
          const isHighlighted = highlightedDay === day.date

          return (
            <div
              key={day.date}
              className={`text-center cursor-pointer flex flex-col items-center rounded-lg p-1 transition-all ${isHighlighted ? 'bg-blue-600/20 ring-2 ring-blue-400' : 'hover:bg-gray-800/50'
                }`}
              onClick={() => {
                /*
                console.log('🧿 [RINGS][DAILY] Click día:', {
                  category,
                  day
                })
                */
                setHighlightedDay(day.date)
                if (onSelectDay) onSelectDay(day)
              }}
            >
              {/* Inicial del día - Perfectamente centrada arriba */}
              <div className="text-gray-400 text-xs font-medium mb-2 h-3 flex items-center justify-center w-full">
                {day.dayName.charAt(0)}
              </div>

              {/* Anillos apilados */}
              <div
                className="flex justify-center items-center relative"
                style={{ width: 44, height: 44 }}
              >
                {/* Anillo exterior - Kcal */}
                <ActivityRing
                  progress={kcalProgress}
                  color="#FF6A00"
                  size={44}
                  strokeWidth={3}
                />

                {/* Anillo medio - Minutos (solo si aplica) */}
                {shouldShowMiddleRing(day.category || 'fitness', day.minutesTarget) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ActivityRing
                      progress={minutesProgress}
                      color="#FF8C42"
                      size={34}
                      strokeWidth={3}
                    />
                  </div>
                )}

                {/* Anillo interior - Ejercicios/Platos */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <ActivityRing
                    progress={exercisesProgress}
                    color="#FFFFFF"
                    size={shouldShowMiddleRing(day.category || 'fitness', day.minutesTarget) ? 24 : 34}
                    strokeWidth={3}
                    label={category === 'nutricion' && day.exercisesTarget > 0 ? `${day.exercises}` : undefined}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
