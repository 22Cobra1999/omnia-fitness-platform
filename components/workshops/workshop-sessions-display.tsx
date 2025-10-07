"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Users, AlertCircle } from "lucide-react"
import { createClient } from '@/lib/supabase-browser'
import { format, isPast } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface WorkshopSession {
  id: string
  title: string
  start_time: string
  end_time: string
  available_slots: number
  booked_slots: number
  status: string
}

interface WorkshopSessionsDisplayProps {
  activityId: number
  isEnrolled?: boolean
  userEnrollmentId?: number
}

export function WorkshopSessionsDisplay({
  activityId,
  isEnrolled = false,
  userEnrollmentId,
}: WorkshopSessionsDisplayProps) {
  const router = useRouter()
  const supabase = createClient()
  const [sessions, setSessions] = useState<WorkshopSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [enrollingSession, setEnrollingSession] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    loadSessions()
    checkUserRole()
  }, [activityId])

  async function checkUserRole() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)

        // Obtener el rol del usuario
        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("preferences")
          .eq("user_id", user.id)
          .single()

        if (profileData?.preferences?.role) {
          setUserRole(profileData.preferences.role)
        }
      }
    } catch (error) {
      console.error("Error checking user role:", error)
    }
  }

  async function loadSessions() {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("activity_id", activityId)
        .eq("is_workshop_session", true)
        .order("start_time", { ascending: true })

      if (error) throw error

      if (data) {
        setSessions(data as WorkshopSession[])
      }
    } catch (error) {
      console.error("Error loading workshop sessions:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las sesiones del taller",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleEnrollment(sessionId: string) {
    if (!userId) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para inscribirte en esta sesión",
        variant: "destructive",
      })
      return
    }

    setEnrollingSession(sessionId)

    try {
      // Si el usuario ya está inscrito en la actividad, solo actualizar la sesión
      if (isEnrolled && userEnrollmentId) {
        // Actualizar la inscripción con el ID de la sesión
        const { error: updateError } = await supabase
          .from("activity_enrollments")
          .update({
            session_id: sessionId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userEnrollmentId)

        if (updateError) throw updateError
      } else {
        // Crear una nueva inscripción
        const { error: enrollError } = await supabase.from("activity_enrollments").insert({
          activity_id: activityId,
          client_id: userId,
          session_id: sessionId,
          status: "enrolled",
          payment_status: "pending",
          progress: 0,
        })

        if (enrollError) throw enrollError
      }

      // Incrementar el contador de cupos reservados
      const { error: updateSessionError } = await supabase.rpc("increment_booked_slots", { session_id: sessionId })

      if (updateSessionError) throw updateSessionError

      toast({
        title: "¡Inscripción exitosa!",
        description: "Te has inscrito correctamente en esta sesión del taller",
      })

      // Recargar las sesiones para actualizar los cupos
      loadSessions()
      router.refresh()
    } catch (error) {
      console.error("Error enrolling in workshop session:", error)
      toast({
        title: "Error",
        description: "No se pudo completar la inscripción. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setEnrollingSession(null)
    }
  }

  function formatSessionDate(dateString: string) {
    const date = new Date(dateString)
    return format(date, "EEEE d 'de' MMMM", { locale: es })
  }

  function formatSessionTime(dateString: string) {
    const date = new Date(dateString)
    return format(date, "h:mm a")
  }

  function getSessionStatus(session: WorkshopSession) {
    if (isPast(new Date(session.end_time))) {
      return "completed"
    }
    if (session.available_slots <= session.booked_slots) {
      return "full"
    }
    return "available"
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Horarios del Taller</CardTitle>
          <CardDescription>No hay sesiones programadas para este taller</CardDescription>
        </CardHeader>
        {userRole === "coach" && (
          <CardContent>
            <Button onClick={() => router.push(`/coach/activities/${activityId}/schedule`)} className="w-full">
              Programar sesiones
            </Button>
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horarios del Taller</CardTitle>
        <CardDescription>Selecciona una sesión para inscribirte</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.map((session) => {
          const sessionStatus = getSessionStatus(session)
          const isSelected = selectedSessionId === session.id
          const remainingSlots = session.available_slots - session.booked_slots

          return (
            <div
              key={session.id}
              className={`p-4 border rounded-lg transition-all ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : sessionStatus === "completed"
                    ? "border-gray-200 bg-gray-50 opacity-60"
                    : sessionStatus === "full"
                      ? "border-yellow-200 bg-yellow-50"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300"
              }`}
              onClick={() => {
                if (sessionStatus !== "completed" && sessionStatus !== "full") {
                  setSelectedSessionId(isSelected ? null : session.id)
                }
              }}
            >
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="font-medium">{formatSessionDate(session.start_time)}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                    <span>
                      {formatSessionTime(session.start_time)} - {formatSessionTime(session.end_time)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-500" />
                    <span>
                      {sessionStatus === "full"
                        ? "No hay cupos disponibles"
                        : `${remainingSlots} ${remainingSlots === 1 ? "cupo disponible" : "cupos disponibles"}`}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-start md:items-end gap-2">
                  {sessionStatus === "completed" && (
                    <Badge variant="outline" className="bg-gray-100">
                      Finalizada
                    </Badge>
                  )}

                  {sessionStatus === "full" && (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      Completa
                    </Badge>
                  )}

                  {sessionStatus === "available" && (
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      disabled={!!enrollingSession}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (isSelected) {
                          handleEnrollment(session.id)
                        } else {
                          setSelectedSessionId(session.id)
                        }
                      }}
                    >
                      {enrollingSession === session.id ? (
                        <span className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Inscribiendo...
                        </span>
                      ) : isSelected ? (
                        "Confirmar inscripción"
                      ) : (
                        "Seleccionar"
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {isSelected && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Información importante</p>
                      <p className="text-gray-600">
                        Al inscribirte en esta sesión, estás reservando un cupo para asistir al taller en la fecha y
                        hora indicadas.
                        {!isEnrolled && " También se te inscribirá automáticamente en la actividad."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {userRole === "coach" && (
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => router.push(`/coach/activities/${activityId}/schedule`)}
          >
            Gestionar horarios
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
