"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Plus, Calendar, Clock, Users } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { createClient } from '@/lib/supabase-browser'

interface ScheduleSession {
  id?: string
  date: string
  startTime: string
  endTime: string
  availableSlots: number
}

interface WorkshopScheduleFormProps {
  activityId: number
  existingSessions?: ScheduleSession[]
}

export function WorkshopScheduleForm({ activityId, existingSessions = [] }: WorkshopScheduleFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [sessions, setSessions] = useState<ScheduleSession[]>(
    existingSessions.length > 0 ? existingSessions : [getEmptySession()],
  )
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (existingSessions.length === 0 && activityId) {
      loadExistingSessions()
    }
  }, [activityId])

  async function loadExistingSessions() {
    try {
      const { data, error } = await supabase
        .from("calendar_events")
        .select("id, start_time, end_time, available_slots, booked_slots")
        .eq("activity_id", activityId)
        .eq("is_workshop_session", true)

      if (error) throw error

      if (data && data.length > 0) {
        const formattedSessions = data.map((session) => ({
          id: session.id,
          date: new Date(session.start_time).toISOString().split("T")[0],
          startTime: new Date(session.start_time).toTimeString().slice(0, 5),
          endTime: new Date(session.end_time).toTimeString().slice(0, 5),
          availableSlots: session.available_slots,
        }))
        setSessions(formattedSessions)
      }
    } catch (error) {
      console.error("Error loading workshop sessions:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las sesiones existentes",
        variant: "destructive",
      })
    }
  }

  function getEmptySession(): ScheduleSession {
    return {
      date: "",
      startTime: "",
      endTime: "",
      availableSlots: 10,
    }
  }

  function addSession() {
    setSessions([...sessions, getEmptySession()])
  }

  function removeSession(index: number) {
    const newSessions = [...sessions]
    newSessions.splice(index, 1)
    setSessions(newSessions.length > 0 ? newSessions : [getEmptySession()])
  }

  function updateSession(index: number, field: keyof ScheduleSession, value: string | number) {
    const newSessions = [...sessions]
    newSessions[index] = {
      ...newSessions[index],
      [field]: value,
    }
    setSessions(newSessions)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Primero, obtener información de la actividad
      const { data: activityData, error: activityError } = await supabase
        .from("activities")
        .select("title, coach_id")
        .eq("id", activityId)
        .single()

      if (activityError) throw activityError
      if (!activityData) throw new Error("No se encontró la actividad")

      // Obtener el ID del usuario actual
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuario no autenticado")

      // Verificar que el usuario sea el coach de la actividad
      if (user.id !== activityData.coach_id) {
        throw new Error("No tienes permiso para modificar esta actividad")
      }

      // Procesar cada sesión
      for (const session of sessions) {
        if (!session.date || !session.startTime || !session.endTime) {
          toast({
            title: "Error",
            description: "Por favor completa todos los campos de fecha y hora",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        const startTime = new Date(`${session.date}T${session.startTime}:00`)
        const endTime = new Date(`${session.date}T${session.endTime}:00`)

        if (startTime >= endTime) {
          toast({
            title: "Error",
            description: "La hora de inicio debe ser anterior a la hora de fin",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        // Si la sesión ya existe, actualizarla
        if (session.id) {
          const { error: updateError } = await supabase
            .from("calendar_events")
            .update({
              start_time: startTime.toISOString(),
              end_time: endTime.toISOString(),
              available_slots: session.availableSlots,
              updated_at: new Date().toISOString(),
            })
            .eq("id", session.id)

          if (updateError) throw updateError
        } else {
          // Si es una nueva sesión, crearla
          const { error: insertError } = await supabase.from("calendar_events").insert({
            activity_id: activityId,
            coach_id: activityData.coach_id,
            title: `${activityData.title} - Sesión`,
            description: `Sesión para el taller: ${activityData.title}`,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            event_type: "workshop",
            status: "scheduled",
            available_slots: session.availableSlots,
            booked_slots: 0,
            is_workshop_session: true,
          })

          if (insertError) throw insertError
        }
      }

      // Actualizar la actividad para indicar que tiene horarios disponibles
      await supabase
        .from("activities")
        .update({
          availability_type: "scheduled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", activityId)

      toast({
        title: "Éxito",
        description: "Los horarios del taller han sido guardados correctamente",
      })

      router.push(`/coach/activities/${activityId}`)
      router.refresh()
    } catch (error) {
      console.error("Error saving workshop sessions:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar los horarios del taller",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Horarios del Taller</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {sessions.map((session, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Sesión {index + 1}</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSession(index)}
                    disabled={sessions.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor={`date-${index}`} className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Fecha
                    </Label>
                    <Input
                      id={`date-${index}`}
                      type="date"
                      value={session.date}
                      onChange={(e) => updateSession(index, "date", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`slots-${index}`} className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Cupos disponibles
                    </Label>
                    <Input
                      id={`slots-${index}`}
                      type="number"
                      min="1"
                      value={session.availableSlots}
                      onChange={(e) => updateSession(index, "availableSlots", Number.parseInt(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`start-time-${index}`} className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Hora de inicio
                    </Label>
                    <Input
                      id={`start-time-${index}`}
                      type="time"
                      value={session.startTime}
                      onChange={(e) => updateSession(index, "startTime", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`end-time-${index}`} className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Hora de fin
                    </Label>
                    <Input
                      id={`end-time-${index}`}
                      type="time"
                      value={session.endTime}
                      onChange={(e) => updateSession(index, "endTime", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" className="w-full" onClick={addSession}>
              <Plus className="h-4 w-4 mr-2" />
              Añadir otra sesión
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar horarios"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
