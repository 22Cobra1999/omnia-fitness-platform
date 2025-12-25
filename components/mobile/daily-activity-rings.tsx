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
}

export function DailyActivityRings({ userId, selectedDate, category = 'fitness', onSelectDay }: DailyActivityRingsProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [dailyData, setDailyData] = useState<DailyMetrics[]>([])
  const [loading, setLoading] = useState(false)
  const [dynamicTargets, setDynamicTargets] = useState({ kcal: 500, minutes: 60, exercises: 3, plates: 4 })
  const [highlightedDay, setHighlightedDay] = useState<string | null>(selectedDate || null)
  
  // Usar el hook existente para obtener datos reales con filtro de categoría
  const { weeklyData, loading: metricsLoading } = useClientMetrics(userId, category)

  // Obtener metas dinámicas desde el endpoint
  useEffect(() => {
    if (userId) {
      fetchDynamicTargets()
    }
  }, [userId, category])

  const fetchDynamicTargets = async () => {
    try {
      console.log('🎯 [DAILY_RINGS] Solicitando targets para category:', category);
      const response = await fetch(`/api/client/targets?category=${category}`)
      console.log('🎯 [DAILY_RINGS] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json()
        console.log('🎯 [DAILY_RINGS] Response completa:', data);
        console.log('🎯 [DAILY_RINGS] Response targets:', data.targets);
        console.log('🎯 [DAILY_RINGS] Response source:', data.source);
        const { targets } = data
        setDynamicTargets(targets)
        console.log('🎯 DailyActivityRings: Metas dinámicas cargadas:', targets)
      } else {
        console.error('🎯 [DAILY_RINGS] Error response:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('🎯 [DAILY_RINGS] Error obteniendo metas dinámicas:', error)
    }
  }

  useEffect(() => {
    if (userId && weeklyData.length > 0) {
      processWeeklyData()
    }
  }, [userId, currentWeek, weeklyData])

  const processWeeklyData = () => {
    setLoading(true)
    try {
      const weekData: DailyMetrics[] = []
      const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
      
      // weeklyData ya viene como semana actual (Lun-Dom) desde useClientMetrics
      weeklyData.slice(0, 7).forEach((dayData, index) => {
        const dateString = dayData.date
        
        console.log('📊 DailyActivityRings: Procesando día real', {
          dateString,
          dayData,
          hasData: !!dayData
        })
        
        weekData.push({
          date: dateString,
          dayName: dayNames[index % 7], // Ajustar día de la semana
          kcal: dayData?.kcal || 0,
          kcalTarget: dynamicTargets.kcal,
          minutes: dayData?.minutes || 0,
          minutesTarget: dynamicTargets.minutes,
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

  const getRingLabel = (category: string, index: number) => {
    if (category === 'nutricion') {
      return index === 2 ? 'Platos' : index === 1 ? '' : 'Kcal'
    }
    return index === 2 ? 'Ejerc' : index === 1 ? 'Min' : 'Kcal'
  }

  const shouldShowMiddleRing = (category: string, minutesTarget: number) => {
    return category !== 'nutricion' && minutesTarget > 0
  }

  const ActivityRing = ({ progress, color, size = 36 }: { progress: number, color: string, size?: number }) => {
    // Corregir NaN y valores inválidos
    const safeProgress = isNaN(progress) || !isFinite(progress) ? 0 : Math.max(0, Math.min(100, progress));
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
          const minutesProgress = day.minutesTarget > 0 ? Math.min((day.minutes / day.minutesTarget) * 100, 100) : 0
          const exercisesProgress = Math.min((day.exercises / day.exercisesTarget) * 100, 100)
          const isHighlighted = highlightedDay === day.date
          
          return (
            <div
              key={day.date}
              className={`text-center cursor-pointer flex flex-col items-center rounded-lg p-1 transition-all ${
                isHighlighted ? 'bg-blue-600/20 ring-2 ring-blue-400' : 'hover:bg-gray-800/50'
              }`}
              onClick={() => {
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
                className="flex justify-center relative"
                style={{ width: 40, height: 40 }}
              >
                {/* Anillo exterior - Kcal */}
                <ActivityRing 
                  progress={kcalProgress} 
                  color="#FF6A00" 
                  size={40}
                />
                
                {/* Anillo medio - Minutos (solo si aplica) */}
                {shouldShowMiddleRing(day.category || 'fitness', day.minutesTarget) && (
                  <div className="absolute top-1 left-1">
                    <ActivityRing 
                      progress={minutesProgress} 
                      color="#FF8C42" 
                      size={32}
                    />
                  </div>
                )}
                
                {/* Anillo interior - Ejercicios/Platos */}
                <div className={`absolute ${shouldShowMiddleRing(day.category || 'fitness', day.minutesTarget) ? 'top-2 left-2' : 'top-1 left-1'}`}>
                  <ActivityRing 
                    progress={exercisesProgress} 
                    color="#FFFFFF" 
                    size={shouldShowMiddleRing(day.category || 'fitness', day.minutesTarget) ? 24 : 32}
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
