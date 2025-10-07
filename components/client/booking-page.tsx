"use client"

import { BookingCalendar } from "@/components/client/booking-calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, MapPin, Clock, Users } from "lucide-react"

interface BookingPageProps {
  coachId: string
  clientId: string
  activityId: number
  coachData?: {
    name: string
    avatar?: string
    rating?: number
    location?: string
    specialties?: string[]
    experience?: string
  }
  activityData?: {
    title: string
    description?: string
    duration?: number
    price?: number
  }
}

export function BookingPage({ coachId, clientId, activityId, coachData, activityData }: BookingPageProps) {
  const handleBookingComplete = () => {
    // Redirigir o mostrar mensaje de éxito
    console.log("Booking completed successfully")
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Programar Consulta</h1>
          <p className="text-gray-600 mt-2">Selecciona el mejor horario para tu consulta</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Información del coach y actividad */}
        <div className="space-y-4">
          {/* Información del coach */}
          {coachData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tu Coach</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={coachData.avatar || "/placeholder.svg"} alt={coachData.name} />
                    <AvatarFallback>{coachData.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{coachData.name}</h3>

                    {coachData.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{coachData.rating}</span>
                      </div>
                    )}

                    {coachData.location && (
                      <div className="flex items-center gap-1 mt-1 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{coachData.location}</span>
                      </div>
                    )}

                    {coachData.experience && (
                      <div className="flex items-center gap-1 mt-1 text-gray-600">
                        <Users className="h-4 w-4" />
                        <span className="text-sm">{coachData.experience}</span>
                      </div>
                    )}
                  </div>
                </div>

                {coachData.specialties && coachData.specialties.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Especialidades</h4>
                    <div className="flex flex-wrap gap-1">
                      {coachData.specialties.map((specialty, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Información de la actividad */}
          {activityData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actividad</CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold">{activityData.title}</h3>

                {activityData.description && <p className="text-sm text-gray-600 mt-2">{activityData.description}</p>}

                <div className="flex items-center justify-between mt-4">
                  {activityData.duration && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">{activityData.duration} min</span>
                    </div>
                  )}

                  {activityData.price && (
                    <div className="text-lg font-semibold text-green-600">${activityData.price}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Información importante */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información Importante</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <h4 className="font-medium">Política de Cancelación</h4>
                <p className="text-gray-600">Puedes cancelar hasta 24 horas antes de la consulta sin penalización.</p>
              </div>

              <div className="text-sm">
                <h4 className="font-medium">Duración de la Consulta</h4>
                <p className="text-gray-600">Cada consulta tiene una duración de 30 minutos.</p>
              </div>

              <div className="text-sm">
                <h4 className="font-medium">Preparación</h4>
                <p className="text-gray-600">
                  Prepara tus preguntas con anticipación para aprovechar al máximo tu tiempo.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendario de reservas */}
        <div className="lg:col-span-2">
          <BookingCalendar
            coachId={coachId}
            clientId={clientId}
            activityId={activityId}
            onBookingComplete={handleBookingComplete}
          />
        </div>
      </div>
    </div>
  )
}
