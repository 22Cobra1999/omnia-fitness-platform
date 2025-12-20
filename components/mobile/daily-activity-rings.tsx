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
}

interface DailyActivityRingsProps {
  userId?: string
  selectedDate?: string
  onSelectDay?: (day: DailyMetrics) => void
}

export function DailyActivityRings({ userId, selectedDate, onSelectDay }: DailyActivityRingsProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [dailyData, setDailyData] = useState<DailyMetrics[]>([])
  const [loading, setLoading] = useState(false)
  
  // Usar el hook existente para obtener datos reales - sin filtrar por categoría para mostrar todos los días
  const { weeklyData, loading: metricsLoading } = useClientMetrics(userId, undefined)

  useEffect(() => {
    if (userId && weeklyData.length > 0) {
      processWeeklyData()
    }
  }, [userId, currentWeek, weeklyData])

  const processWeeklyData = () => {
    setLoading(true)
    try {
      // Calcular inicio y fin de la semana actual
      const startOfWeek = new Date(currentWeek)
      const day = startOfWeek.getDay()
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
      startOfWeek.setDate(diff)
      startOfWeek.setHours(0, 0, 0, 0)

      const weekData: DailyMetrics[] = []
      const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek)
        date.setDate(startOfWeek.getDate() + i)
        const dateString = date.toISOString().split('T')[0]
        
        // Buscar datos reales para este día (comparar por fecha)
        const dayData = weeklyData.find(d => d.date === dateString)
        
        console.log('📊 DailyActivityRings: Procesando día', {
          dayData: dayData,
          weeklyDataLength: weeklyData.length,
          sampleWeeklyData: weeklyData[0]
        })
        
        weekData.push({
          date: dateString,
          dayName: dayNames[i],
          kcal: dayData?.kcal || 0,
          kcalTarget: 500, // Meta diaria
          minutes: dayData?.minutes || 0,
          minutesTarget: 60, // Meta diaria
          exercises: dayData?.exercises || 0,
          exercisesTarget: 3 // Meta diaria
        })
      }
      
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
    setCurrentWeek(newWeek)
  }

  const goToNextWeek = () => {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(currentWeek.getDate() + 7)
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

  const calculateOverallProgress = (day: DailyMetrics) => {
    const kcalProgress = (day.kcal / day.kcalTarget) * 100
    const minutesProgress = (day.minutes / day.minutesTarget) * 100
    const exercisesProgress = (day.exercises / day.exercisesTarget) * 100
    
    return Math.round((kcalProgress + minutesProgress + exercisesProgress) / 3)
  }

  const ActivityRing = ({ progress, color, size = 36 }: { progress: number, color: string, size?: number }) => {
    const radius = (size - 8) / 2
    const circumference = 2 * Math.PI * radius
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (progress / 100) * circumference

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
            stroke="rgba(75, 85, 99, 0.2)"
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

  if (loading || metricsLoading) {
    return (
      <div className="text-center py-4 text-gray-400">
        Cargando datos semanales...
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Navegación semanal */}
      <div className="flex items-center justify-center gap-2">
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
      </div>

      {/* Grid de anillos diarios */}
      <div className="grid grid-cols-7 gap-2">
        {dailyData.map((day, index) => {
          const kcalProgress = Math.min((day.kcal / day.kcalTarget) * 100, 100)
          const minutesProgress = Math.min((day.minutes / day.minutesTarget) * 100, 100)
          const exercisesProgress = Math.min((day.exercises / day.exercisesTarget) * 100, 100)
          
          return (
            <div
              key={day.date}
              className="text-center cursor-pointer flex flex-col items-center"
              onClick={() => onSelectDay && onSelectDay(day)}
            >
              {/* Inicial del día - Perfectamente centrada arriba */}
              <div className="text-gray-400 text-xs font-medium mb-2 h-3 flex items-center justify-center w-full">
                {day.dayName.charAt(0)}
              </div>
              
              {/* Anillos apilados */}
              <div
                className="flex justify-center relative"
                style={{ width: 40, height: 40 }}
              >
                {/* Anillo exterior - Kcal */}
                <ActivityRing 
                  progress={kcalProgress} 
                  color="#FF6A00" 
                  size={40}
                />
                {/* Anillo medio - Minutos */}
                <div className="absolute top-1 left-1">
                  <ActivityRing 
                    progress={minutesProgress} 
                    color="#FF8C42" 
                    size={32}
                  />
                </div>
                {/* Anillo interior - Ejercicios */}
                <div className="absolute top-2 left-2">
                  <ActivityRing 
                    progress={exercisesProgress} 
                    color="#FFFFFF" 
                    size={24}
                  />
                </div>
                {/* Indicador de selección */}
                {selectedDate === day.date && (
                  <div className="absolute inset-0 rounded-full ring-2 ring-[#FF6A00]/70" />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
