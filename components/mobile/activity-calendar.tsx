"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useClientMetrics } from "@/hooks/use-client-metrics"

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
  const { weeklyData, loading } = useClientMetrics(userId)
  const [monthlyData, setMonthlyData] = useState<DayData[]>([])

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ]

  const dayNames = ["D", "L", "M", "M", "J", "V", "S"]

  useEffect(() => {
    if (weeklyData && weeklyData.length > 0) {
      // Procesar datos para el mes actual
      const currentMonth = currentDate.getMonth()
      const currentYear = currentDate.getFullYear()
      
      // Filtrar datos del mes actual
      const monthData = weeklyData.filter(day => {
        const dayDate = new Date(day.date)
        return dayDate.getMonth() === currentMonth && dayDate.getFullYear() === currentYear
      })

      // Crear array de días del mes
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
      
      const days: DayData[] = []
      
      // Días vacíos al inicio del mes
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
      
      // Días del mes
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const dayData = monthData.find(d => d.date === dateStr)
        
        days.push({
          date: dateStr,
          day,
          kcal: dayData?.kcal || 0,
          minutes: dayData?.minutes || 0,
          exercises: dayData?.exercises || 0,
          kcalTarget: 500,
          minutesTarget: 60,
          exercisesTarget: 3
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

  const ActivityRing = ({ progress, color, size = 20 }: { progress: number, color: string, size?: number }) => {
    const radius = (size - 4) / 2
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
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(75, 85, 99, 0.2)"
            strokeWidth="2"
            fill="none"
          />
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

  return (
    <div className="space-y-4">
      {/* Header del mes */}
      <div className="flex items-center justify-between">
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

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day, index) => (
          <div key={index} className="text-center text-sm text-gray-400 font-medium py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendario */}
      <div className="grid grid-cols-7 gap-1">
        {monthlyData.map((day, index) => {
          if (day.day === 0) {
            return <div key={index} className="h-20"></div>
          }

          const kcalProgress = Math.min((day.kcal / day.kcalTarget) * 100, 100)
          const minutesProgress = Math.min((day.minutes / day.minutesTarget) * 100, 100)
          const exercisesProgress = Math.min((day.exercises / day.exercisesTarget) * 100, 100)
          
          const isToday = new Date().toDateString() === new Date(day.date).toDateString()
          
          return (
            <div key={day.date} className="h-20 flex flex-col items-center justify-center space-y-1">
              {/* Número del día */}
              <div className={`text-xs font-medium ${isToday ? 'text-white bg-red-500 rounded-full w-6 h-6 flex items-center justify-center' : 'text-gray-300'}`}>
                {day.day}
              </div>
              
              {/* Anillos de actividad */}
              <div className="flex justify-center relative" style={{ width: 40, height: 40 }}>
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
                    color="#00D4AA" 
                    size={32}
                  />
                </div>
                {/* Anillo interior - Ejercicios */}
                <div className="absolute top-2 left-2">
                  <ActivityRing 
                    progress={exercisesProgress} 
                    color="#8B5CF6" 
                    size={24}
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

export default ActivityCalendar
