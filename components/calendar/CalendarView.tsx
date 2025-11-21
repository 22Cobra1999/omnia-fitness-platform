"use client"

import { useState, useEffect } from "react"
import { createClient } from '@/lib/supabase/supabase-client'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CalendarViewProps {
  activityIds: string[]
  onActivityClick: (activityId: string) => void
}

export default function CalendarView({ activityIds, onActivityClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [activitiesByDate, setActivitiesByDate] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchActivities = async () => {
      if (activityIds.length === 0) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const activitiesMap: Record<string, any[]> = {}

        // Obtener progreso del cliente para cada actividad
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        for (const activityId of activityIds) {
          const { data: progress } = await supabase
            .from('progreso_cliente')
            .select('fecha, actividad_id')
            .eq('actividad_id', activityId)
            .eq('cliente_id', user.id)
            .gte('fecha', startOfMonth(currentDate).toISOString().split('T')[0])
            .lte('fecha', endOfMonth(currentDate).toISOString().split('T')[0])

          if (progress) {
            progress.forEach((p) => {
              const dateKey = p.fecha.split('T')[0]
              if (!activitiesMap[dateKey]) {
                activitiesMap[dateKey] = []
              }
              activitiesMap[dateKey].push({ id: activityId, fecha: p.fecha })
            })
          }
        }

        setActivitiesByDate(activitiesMap)
      } catch (error) {
        console.error('Error fetching activities:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [activityIds, currentDate, supabase])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const previousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    const dateKey = format(date, 'yyyy-MM-dd')
    const activities = activitiesByDate[dateKey] || []
    if (activities.length > 0) {
      onActivityClick(activities[0].id)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white">Cargando calendario...</div>
      </div>
    )
  }

  return (
    <div className="p-4 text-white">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={previousMonth} className="text-white">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-bold">
          {format(currentDate, 'MMMM yyyy', { locale: es })}
        </h2>
        <Button variant="ghost" onClick={nextMonth} className="text-white">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-gray-400">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {daysInMonth.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const activities = activitiesByDate[dateKey] || []
          const hasActivities = activities.length > 0
          const isSelected = selectedDate && isSameDay(day, selectedDate)

          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDateClick(day)}
              className={`
                aspect-square p-2 rounded-lg border transition-colors
                ${isToday(day) ? 'border-[#FF7939] bg-[#FF7939]/10' : 'border-gray-700'}
                ${isSelected ? 'bg-[#FF7939]/20 border-[#FF7939]' : ''}
                ${hasActivities ? 'bg-[#FF7939]/30 hover:bg-[#FF7939]/40' : 'hover:bg-gray-800'}
                text-white text-sm
              `}
            >
              <div className="flex flex-col items-center">
                <span>{format(day, 'd')}</span>
                {hasActivities && (
                  <div className="w-1.5 h-1.5 bg-[#FF7939] rounded-full mt-1" />
                )}
              </div>
            </button>
          )
        })}
      </div>

      {selectedDate && activitiesByDate[format(selectedDate, 'yyyy-MM-dd')] && (
        <div className="mt-4 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">
            Actividades para {format(selectedDate, 'dd/MM/yyyy', { locale: es })}
          </h3>
          <div className="space-y-2">
            {activitiesByDate[format(selectedDate, 'yyyy-MM-dd')].map((activity, index) => (
              <button
                key={index}
                onClick={() => onActivityClick(activity.id)}
                className="w-full text-left p-2 bg-gray-700 rounded hover:bg-gray-600"
              >
                Actividad {activity.id}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
























