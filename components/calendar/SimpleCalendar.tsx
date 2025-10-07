"use client"

import React, { useState, useEffect } from "react"
import { createClient } from '@/lib/supabase-browser'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"

interface SimpleCalendarProps {
  clientId: string
}

interface CalendarEvent {
  id: string
  title: string
  date: string
  type: 'fitness' | 'nutrition' | 'consultation'
  time?: string
  scheduledDay?: string // Día de la semana programado (ej: "lunes")
  exerciseCount?: number // Cantidad de ejercicios para ese día
  weeks?: number[] // Semanas del programa que tienen ejercicios
}

export function SimpleCalendar({ clientId }: SimpleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>([])
  const supabase = createClient()


  // Obtener actividades del cliente
  useEffect(() => {
    const fetchClientActivities = async () => {
      try {
        setLoading(true)
        
        // Obtener enrollments del cliente (consulta simplificada)
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from("activity_enrollments")
          .select(`
            id,
            activity_id,
            start_date,
            status
          `)
          .eq("client_id", clientId)
          .eq("status", "active")

        if (enrollmentsError) {
          console.error("Error fetching enrollments:", enrollmentsError)
          setEvents([])
          return
        }

        // Obtener actividades por separado para evitar problemas de relaciones
        const activityIds = enrollments?.map(e => e.activity_id) || []
        let activities: any[] = []
        
        if (activityIds.length > 0) {
          const { data: activitiesData, error: activitiesError } = await supabase
            .from("activities")
            .select("id, title, type")
            .in("id", activityIds)

          if (activitiesError) {
            console.error("Error fetching activities:", activitiesError)
            setEvents([])
            return
          }
          
          activities = activitiesData || []
        }

        // Convertir enrollments a eventos del calendario
        const calendarEvents: CalendarEvent[] = []
        
        for (const enrollment of enrollments || []) {
          const activity = activities.find(a => a.id === enrollment.activity_id)
          if (activity) {
            
            // Determinar si es fitness basándose en el tipo o el título
            const isFitness = activity.type?.includes('fitness') || 
                             activity.title?.toLowerCase().includes('fuerza') ||
                             activity.title?.toLowerCase().includes('resistencia') ||
                             activity.title?.toLowerCase().includes('ejercicio') ||
                             activity.title?.toLowerCase().includes('workout') ||
                             activity.title?.toLowerCase().includes('fitness')
            
            
            // Solo procesar actividades de fitness que tienen ejercicios
            if (isFitness) {
              // Consultar ejercicios para esta actividad
              
              const { data: exercises, error: exercisesError } = await supabase
                .from("organizacion_ejercicios")
                .select(`
                  id,
                  semana,
                  dia,
                  ejercicio:ejercicios_detalles!inner(nombre_ejercicio)
                `)
                .eq("activity_id", activity.id)

              if (exercisesError) {
                console.error("❌ Error fetching exercises:", exercisesError)
                continue
              }
              
              
              // Si no hay ejercicios, continuar con la siguiente actividad
              if (!exercises || exercises.length === 0) {
                continue
              }

              // Agrupar ejercicios por día y semana
              const exercisesByDay: { [key: string]: { count: number, weeks: Set<number> } } = {}
              
              
              for (const exercise of exercises || []) {
                const day = exercise.dia
                const week = exercise.semana
                const exerciseName = exercise.ejercicio?.nombre_ejercicio || "Ejercicio"
                
                if (day && week) {
                  const dayName = getDayNameFromNumber(day)
                  if (!exercisesByDay[dayName]) {
                    exercisesByDay[dayName] = { count: 0, weeks: new Set() }
                  }
                  exercisesByDay[dayName].count += 1
                  exercisesByDay[dayName].weeks.add(week)
                }
              }
              

              // Crear eventos solo para días que tienen ejercicios
              for (const [day, dayData] of Object.entries(exercisesByDay)) {
                if (dayData.count > 0) {
                  const weeksArray = Array.from(dayData.weeks).sort((a, b) => a - b)
                  const newEvent = {
                    id: `enrollment-${enrollment.id}-${day}`,
                    title: activity.title,
                    date: enrollment.start_date,
                    type: 'fitness' as const,
                    scheduledDay: day,
                    exerciseCount: dayData.count,
                    weeks: weeksArray
                  }
                  calendarEvents.push(newEvent)
                }
              }
            } else if (activity.type?.includes('nutrition')) {
              // Nutrición: todos los días
              const scheduledDays = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
              
              for (const day of scheduledDays) {
                const newEvent = {
                  id: `enrollment-${enrollment.id}-${day}`,
                  title: activity.title,
                  date: enrollment.start_date,
                  type: 'nutrition' as const,
                  scheduledDay: day,
                  exerciseCount: 1 // Nutrición tiene 1 tarea por día
                }
                calendarEvents.push(newEvent)
              }
            } else {
              // Consultas: lunes, miércoles, viernes
              const scheduledDays = ['lunes', 'miércoles', 'viernes']
              
              for (const day of scheduledDays) {
                const newEvent = {
                  id: `enrollment-${enrollment.id}-${day}`,
                  title: activity.title,
                  date: enrollment.start_date,
                  type: 'consultation' as const,
                  scheduledDay: day,
                  exerciseCount: 1 // Consultas tienen 1 tarea por día
                }
                calendarEvents.push(newEvent)
              }
            }
          }
        }

        setEvents(calendarEvents)
      } catch (error) {
        console.error("Error fetching activities:", error)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    if (clientId) {
      fetchClientActivities()
    }
  }, [clientId, supabase])

  // Navegación del calendario
  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  // Obtener días del mes
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Días vacíos del mes anterior
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }
    
    return days
  }

  // Obtener eventos para una fecha específica
  const getEventsForDate = (day: number) => {
    if (!day) return []
    
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(event => event.date.startsWith(dateStr))
  }

  // Obtener el día de la semana para una fecha específica
  const getDayOfWeek = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    return date.getDay() // 0 = Domingo, 1 = Lunes, etc.
  }

  // Obtener nombre del día de la semana (para getDayOfWeek que devuelve 0-6)
  const getDayName = (dayNumber: number) => {
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
    return days[dayNumber]
  }

  // Obtener nombre del día de la semana (para el nuevo esquema que usa 1-7)
  const getDayNameFromNumber = (dayNumber: number): string => {
    const dayNames = ['', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
    return dayNames[dayNumber] || ''
  }

  // Contar actividades programadas para un día específico
  const getActivitiesCountForDay = (day: number) => {
    if (!day) return 0
    
    const dayOfWeek = getDayOfWeek(day)
    const dayName = getDayName(dayOfWeek)
    
    // Contar actividades únicas que están programadas para este día de la semana
    const uniqueActivities = new Set<string>()
    
    for (const event of events) {
      // Si la actividad está programada para este día de la semana
      if (event.scheduledDay === dayName) {
        uniqueActivities.add(event.title) // Usar título como identificador único
      }
    }
    
    return uniqueActivities.size
  }

  // Manejar selección de día
  const handleDayClick = (day: number) => {
    if (!day) return
    
    setSelectedDay(day)
    
    // Obtener actividades para el día seleccionado
    const dayOfWeek = getDayOfWeek(day)
    const dayName = getDayName(dayOfWeek)
    
    
    const dayEvents = events.filter(event => event.scheduledDay === dayName)
    
    // Agrupar actividades por nombre y sumar ejercicios
    const groupedEvents: CalendarEvent[] = []
    const activityGroups: { [key: string]: CalendarEvent } = {}
    
    for (const event of dayEvents) {
      if (activityGroups[event.title]) {
        // Si ya existe, sumar los ejercicios
        activityGroups[event.title].exerciseCount = (activityGroups[event.title].exerciseCount || 0) + (event.exerciseCount || 0)
      } else {
        // Crear nueva entrada
        activityGroups[event.title] = { ...event }
      }
    }
    
    // Convertir a array
    setSelectedDayEvents(Object.values(activityGroups))
  }

  // Verificar si es hoy
  const isToday = (day: number) => {
    const today = new Date()
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear()
  }

  const days = getDaysInMonth(currentDate)
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#121212]">
        <div className="text-white">Cargando calendario...</div>
      </div>
    )
  }

  return (
    <div className="bg-[#121212] text-white p-4">
      {/* Header del calendario */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-400">
            {day}
          </div>
        ))}
      </div>

      {/* Calendario */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const dayEvents = getEventsForDate(day || 0)
          const activitiesCount = getActivitiesCountForDay(day || 0)
          const isCurrentDay = isToday(day || 0)
          const isSelected = selectedDay === day
          
          return (
            <div
              key={index}
              onClick={() => day && handleDayClick(day)}
              className={`
                min-h-[60px] p-1 border border-gray-800 rounded-lg cursor-pointer transition-all
                ${day ? 'bg-[#1E1E1E] hover:bg-[#2A2A2A]' : 'bg-transparent'}
                ${isCurrentDay ? 'ring-2 ring-orange-500' : ''}
                ${isSelected ? 'ring-2 ring-blue-500 bg-blue-900/20' : ''}
              `}
            >
              {day && (
                <>
                  <div className="flex items-center justify-between">
                    <div className={`text-sm font-medium ${isCurrentDay ? 'text-orange-500' : 'text-white'}`}>
                      {day}
                    </div>
                    {activitiesCount > 0 && (
                      <div className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {activitiesCount}
                      </div>
                    )}
                  </div>
                  
                  {/* Eventos del día */}
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        className={`
                          text-xs px-1 py-0.5 rounded truncate
                          ${event.type === 'fitness' ? 'bg-blue-600' : 
                            event.type === 'nutrition' ? 'bg-green-600' : 'bg-purple-600'}
                        `}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-400">
                        +{dayEvents.length - 2} más
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-600 rounded"></div>
          <span>Fitness</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-600 rounded"></div>
          <span>Nutrición</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-600 rounded"></div>
          <span>Consultas</span>
        </div>
      </div>

      {/* Actividades del día seleccionado */}
      {selectedDay && (
        <div className="mt-6 p-4 bg-[#1E1E1E] rounded-lg border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">
            Actividades para el {selectedDay} de {currentDate.toLocaleDateString('es-ES', { month: 'long' })} ({getDayName(getDayOfWeek(selectedDay))})
          </h3>
          
          {selectedDayEvents.length > 0 ? (
            <div className="space-y-3">
              {selectedDayEvents.map((event, index) => (
                <div
                  key={`${event.id}-${index}`}
                  className={`
                    p-3 rounded-lg border-l-4
                    ${event.type === 'fitness' ? 'border-blue-500 bg-blue-900/10' : 
                      event.type === 'nutrition' ? 'border-green-500 bg-green-900/10' : 
                      'border-purple-500 bg-purple-900/10'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-white">{event.title}</h4>
                      <p className="text-sm text-gray-400">
                        {event.exerciseCount && event.exerciseCount > 1 
                          ? `${event.exerciseCount} tareas para hoy`
                          : event.exerciseCount === 1 
                            ? '1 tarea para hoy'
                            : 'Sin tareas programadas'
                        }
                      </p>
                      {event.weeks && event.weeks.length > 0 && (
                        <p className="text-xs text-orange-400 mt-1">
                          Semanas: {event.weeks.join(', ')}
                        </p>
                      )}
                    </div>
                    <div className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${event.type === 'fitness' ? 'bg-blue-600 text-white' : 
                        event.type === 'nutrition' ? 'bg-green-600 text-white' : 
                        'bg-purple-600 text-white'}
                    `}>
                      {event.type === 'fitness' ? 'Fitness' : 
                       event.type === 'nutrition' ? 'Nutrición' : 'Consulta'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-lg mb-2">📅</div>
              <p className="text-gray-400">No hay actividades programadas para este día</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}




