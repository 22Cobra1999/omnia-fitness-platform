"use client"

import { useState } from "react"
import { CalendarIcon, Clock, X, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from '@/lib/supabase-browser'
import { toast } from "@/components/ui/use-toast"
import { useActivitiesStore } from "@/hooks/use-activities-store"

interface Activity {
  id: number
  title: string
  type: string
  coach_id: string
  duration: number
}

interface AddToCalendarButtonProps {
  activity: Activity
}

export function AddToCalendarButton({ activity }: AddToCalendarButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>(formatDateForInput(new Date()))
  const [selectedTime, setSelectedTime] = useState("09:00")
  const [reminderMinutes, setReminderMinutes] = useState<number>(30) // Recordatorio por defecto 30 minutos antes
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  const { addRecentActivity } = useActivitiesStore?.() || { addRecentActivity: () => {} }

  // Generar opciones de tiempo (cada 30 minutos)
  const timeOptions = []
  for (let hour = 6; hour < 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const formattedHour = hour.toString().padStart(2, "0")
      const formattedMinute = minute.toString().padStart(2, "0")
      timeOptions.push(`${formattedHour}:${formattedMinute}`)
    }
  }

  // Función para formatear fecha para el input
  function formatDateForInput(date: Date): string {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const day = date.getDate().toString().padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  // Opciones de recordatorio
  const reminderOptions = [
    { label: "Sin recordatorio", value: 0 },
    { label: "15 minutos antes", value: 15 },
    { label: "30 minutos antes", value: 30 },
    { label: "1 hora antes", value: 60 },
    { label: "3 horas antes", value: 180 },
    { label: "1 día antes", value: 1440 },
  ]

  const handleAddToCalendar = async () => {
    setIsLoading(true)
    try {
      // Obtener el usuario actual
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error("No se pudo obtener el usuario actual")
      }

      // Parsear la fecha y hora seleccionadas
      const [year, month, day] = selectedDate.split("-").map(Number)
      const [hours, minutes] = selectedTime.split(":").map(Number)

      // Crear objeto de fecha en UTC
      const startDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0))

      // Calcular fecha de fin (añadir duración a la fecha de inicio)
      const endDate = new Date(startDate.getTime())
      endDate.setMinutes(endDate.getMinutes() + activity.duration)

      // Calcular fecha del recordatorio si está configurado
      const reminderDate = reminderMinutes > 0 ? new Date(startDate.getTime() - reminderMinutes * 60 * 1000) : null

      console.log("Fecha seleccionada:", selectedDate)
      console.log("Hora seleccionada:", selectedTime)
      console.log("Fecha resultante (UTC):", startDate.toISOString())
      console.log("Fecha fin (UTC):", endDate.toISOString())
      console.log("Recordatorio (UTC):", reminderDate?.toISOString())

      // Verificar que la tabla tenga la columna reminder_time
      let hasReminderColumn = false
      try {
        const { data: tableInfo, error: tableError } = await supabase
          .from("calendar_events")
          .select("reminder_time")
          .limit(1)

        hasReminderColumn = !tableError
      } catch (e) {
        console.log("La tabla no tiene columna reminder_time")
      }

      // Crear evento en el calendario
      const eventData: any = {
        coach_id: activity.coach_id,
        client_id: user.id,
        title: activity.title,
        description: `Sesión programada de ${activity.title}`,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        event_type: activity.type || "fitness",
        status: "scheduled",
        activity_id: activity.id,
      }

      // Añadir el recordatorio si la columna existe
      if (hasReminderColumn && reminderDate) {
        eventData.reminder_time = reminderDate.toISOString()
      }

      const { error } = await supabase.from("calendar_events").insert([eventData])

      if (error) {
        throw error
      }

      // También registrar en recent_activities con todos los campos obligatorios
      const { data: recentActivity, error: recentError } = await supabase
        .from("recent_activities")
        .insert([
          {
            user_id: user.id,
            name: `${activity.title} (Programado)`,
            category: activity.type || "fitness",
            timestamp: startDate.toISOString(),
            color: "#FF7939",
            value: 1, // Valor predeterminado
            unit: "sesión", // Unidad predeterminada
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            duration: activity.duration,
            sets: 1, // Valor predeterminado para sets
          },
        ])
        .select()
        .single()

      if (recentError) {
        console.error("Error al registrar en actividades recientes:", recentError)
      } else if (recentActivity && addRecentActivity) {
        // Actualizar el store con la nueva actividad reciente
        addRecentActivity(recentActivity)
      }

      toast({
        title: "Actividad añadida al calendario",
        description: `Has programado ${activity.title} para el ${new Date(selectedDate).toLocaleDateString()} a las ${selectedTime}`,
      })

      setIsModalOpen(false)
    } catch (error: any) {
      console.error("Error al añadir la actividad al calendario:", error)
      toast({
        title: "Error",
        description:
          error.message || "No se pudo añadir la actividad al calendario. Por favor, intenta de nuevo más tarde.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)} variant="outline" className="flex items-center gap-2" size="sm">
        <CalendarIcon className="h-4 w-4" />
        Añadir al calendario
      </Button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center p-4">
          <div className="bg-[#1E1E1E] rounded-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-lg font-medium text-white">Añadir al Calendario</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              <div className="mb-4">
                <h4 className="text-lg font-medium text-white mb-2">{activity.title}</h4>
                <p className="text-gray-300 mb-4">
                  Selecciona la fecha y hora para añadir esta actividad a tu calendario.
                </p>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-1">
                      Fecha
                    </label>
                    <input
                      type="date"
                      id="date"
                      className="w-full bg-[#2A2A2A] border border-gray-700 rounded-md p-2 text-white"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={formatDateForInput(new Date())}
                    />
                  </div>

                  <div>
                    <label htmlFor="time" className="block text-sm font-medium text-gray-300 mb-1">
                      Hora
                    </label>
                    <select
                      id="time"
                      className="w-full bg-[#2A2A2A] border border-gray-700 rounded-md p-2 text-white"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Nueva sección de recordatorio */}
                  <div>
                    <label htmlFor="reminder" className="block text-sm font-medium text-gray-300 mb-1">
                      <Bell className="h-4 w-4 inline mr-1" />
                      Recordatorio
                    </label>
                    <select
                      id="reminder"
                      className="w-full bg-[#2A2A2A] border border-gray-700 rounded-md p-2 text-white"
                      value={reminderMinutes}
                      onChange={(e) => setReminderMinutes(Number(e.target.value))}
                    >
                      {reminderOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-[#2A2A2A] rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-300">
                        {new Date(selectedDate).toLocaleDateString(undefined, {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-300">
                        {selectedTime} - {calculateEndTime(selectedTime, activity.duration)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-800 flex justify-end space-x-3">
              <button
                className="px-4 py-2 rounded-lg bg-[#2A2A2A] text-white"
                onClick={() => setIsModalOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </button>
              <Button
                className="bg-[#FF7939] hover:bg-[#E66829] text-white"
                onClick={handleAddToCalendar}
                disabled={isLoading}
              >
                {isLoading ? "Añadiendo..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Función para calcular la hora de finalización
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(":").map(Number)
  const startDate = new Date()
  startDate.setHours(hours, minutes, 0, 0)

  const endDate = new Date(startDate)
  endDate.setMinutes(endDate.getMinutes() + durationMinutes)

  return endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}
