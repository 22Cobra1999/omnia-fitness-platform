// Ejemplo de cómo actualizar SimpleCalendar para usar personalizaciones
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'

interface SimpleCalendarProps {
  clientId: string
}

interface CalendarEvent {
  id: string
  title: string
  date: string
  type: 'fitness' | 'nutrition' | 'consultation'
  time?: string
  scheduledDay?: string
  exerciseCount?: number
  customizations?: ClientExerciseCustomization[]
}

interface ClientExerciseCustomization {
  id: number
  fitness_exercise_id: number
  detalle_series: string        // Formato: "(3x12@50kg)" o "(4x8-10@60kg);(3x12@55kg)"
  duracion_min: number
  one_rm: number
  calorias: number
  completed: boolean
  nota_cliente: string
  nombre_actividad: string
}

export function SimpleCalendarWithCustomizations({ clientId }: SimpleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>([])
  const supabase = createClient()

  // Función para convertir número de día a nombre (para el nuevo esquema que usa 1-7)
  const getDayNameFromNumber = (dayNumber: number): string => {
    const dayNames = ['', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
    return dayNames[dayNumber] || ''
  }

  // Obtener actividades del cliente con personalizaciones
  useEffect(() => {
    const fetchClientActivities = async () => {
      try {
        setLoading(true)
        
        // 1. Obtener enrollments del cliente
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

        // 2. Obtener actividades
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

        // 3. Crear eventos con personalizaciones
        const calendarEvents: CalendarEvent[] = []
        
        for (const enrollment of enrollments || []) {
          const activity = activities.find(a => a.id === enrollment.activity_id)
          if (activity) {
            
            // Determinar si es fitness
            const isFitness = activity.type?.includes('fitness') || 
                             activity.title?.toLowerCase().includes('fuerza') ||
                             activity.title?.toLowerCase().includes('resistencia') ||
                             activity.title?.toLowerCase().includes('ejercicio') ||
                             activity.title?.toLowerCase().includes('workout') ||
                             activity.title?.toLowerCase().includes('fitness')
            
            if (isFitness) {
              // Consultar ejecuciones de ejercicios - NUEVO ESQUEMA
              const { data: executions, error: executionsError } = await supabase
                .from("ejecuciones_ejercicio")
                .select(`
                  id,
                  ejercicio_id,
                  duracion,
                  calorias_estimadas,
                  completado,
                  nota_cliente,
                  fecha_ejecucion,
                  organizacion:organizacion_ejercicios!inner(
                    id,
                    semana,
                    dia,
                    activity_id,
                    ejercicio:ejercicios_detalles!inner(
                      id,
                      nombre_ejercicio
                    )
                  )
                `)
                .eq("organizacion.activity_id", activity.id)

              if (executionsError) {
                console.error("Error fetching executions:", executionsError)
                continue
              }


              // Agrupar por día - NUEVO ESQUEMA
              const executionsByDay: { [key: string]: any[] } = {}
              
              for (const execution of executions || []) {
                const day = execution.organizacion?.dia
                if (day) {
                  const dayName = getDayNameFromNumber(day)
                  if (!executionsByDay[dayName]) {
                    executionsByDay[dayName] = []
                  }
                  executionsByDay[dayName].push({
                    id: execution.id,
                    ejercicio_id: execution.ejercicio_id,
                    duracion: execution.duracion,
                    calorias_estimadas: execution.calorias_estimadas,
                    completado: execution.completado,
                    nota_cliente: execution.nota_cliente,
                    fecha_ejecucion: execution.fecha_ejecucion,
                    nombre_ejercicio: execution.organizacion?.ejercicio?.nombre_ejercicio
                  })
                }
              }

              // Crear eventos para días con ejecuciones
              for (const [day, dayExecutions] of Object.entries(executionsByDay)) {
                if (dayExecutions.length > 0) {
                  calendarEvents.push({
                    id: `enrollment-${enrollment.id}-${day}`,
                    title: activity.title,
                    date: enrollment.start_date,
                    type: 'fitness',
                    scheduledDay: day,
                    exerciseCount: dayExecutions.length,
                    customizations: dayExecutions
                  })
                }
              }
            }
            // ... resto de la lógica para nutrición y consultas
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

    fetchClientActivities()
  }, [clientId, supabase])

  // ... resto de las funciones del calendario

  return (
    <div className="p-4 bg-[#0F1012] text-white min-h-screen">
      <h2 className="text-2xl font-bold mb-6">Calendario con Personalizaciones</h2>
      
      {loading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : (
        <>
          {/* Calendario */}
          <div className="grid grid-cols-7 gap-1">
            {/* ... implementación del calendario */}
          </div>

          {/* Actividades del día seleccionado con personalizaciones */}
          {selectedDay && selectedDayEvents.length > 0 && (
            <div className="mt-6 p-4 bg-[#1E1E1E] rounded-lg border border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-4">
                Actividades para el {selectedDay} de {currentDate.toLocaleDateString('es-ES', { month: 'long' })}
              </h3>
              
              {selectedDayEvents.map((event, index) => (
                <div key={index} className="mb-4 p-3 rounded-lg border-l-4 border-blue-500 bg-blue-900/10">
                  <h4 className="font-medium text-white">{event.title}</h4>
                  <p className="text-sm text-gray-400">
                    {event.exerciseCount} ejercicios personalizados
                  </p>
                  
                  {/* Mostrar personalizaciones */}
                  {event.customizations && (
                    <div className="mt-2 space-y-2">
                      {event.customizations.map((customization) => (
                        <div key={customization.id} className="text-xs bg-gray-800 p-2 rounded">
                          <div className="font-medium">{customization.nombre_actividad}</div>
                          <div className="text-gray-400">
                            Detalle: {customization.detalle_series || 'N/A'} | 
                            Duración: {customization.duracion_min || 'N/A'} min | 
                            1RM: {customization.one_rm || 'N/A'} kg
                          </div>
                          <div className="text-gray-400">
                            Estado: {customization.completed ? '✅ Completado' : '⏳ Pendiente'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}




