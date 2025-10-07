"use client"

import { AvailabilityManager } from "@/components/coach/availability-manager"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, Video } from "lucide-react"

interface CoachAvailabilityPageProps {
  coachId: string
}

export function CoachAvailabilityPage({ coachId }: CoachAvailabilityPageProps) {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Disponibilidad</h1>
          <p className="text-gray-600 mt-2">
            Configura tus horarios disponibles para que los clientes puedan programar consultas contigo
          </p>
        </div>
      </div>

      {/* Información y consejos */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horarios Regulares</CardTitle>
            <Clock className="h-4 w-4 ml-auto text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Configura tus horarios semanales recurrentes para consultas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Excepciones</CardTitle>
            <Calendar className="h-4 w-4 ml-auto text-orange-600" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">
              Marca días específicos como no disponibles o con horarios especiales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tipos de Consulta</CardTitle>
            <Video className="h-4 w-4 ml-auto text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Ofrece videollamadas, mensajes o ambos tipos de consulta</p>
          </CardContent>
        </Card>
      </div>

      {/* Componente principal de gestión */}
      <AvailabilityManager coachId={coachId} />
    </div>
  )
}
