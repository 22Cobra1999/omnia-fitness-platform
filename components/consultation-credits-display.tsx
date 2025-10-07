"use client"

import { useState } from "react"
import type { ConsultationCredit } from "@/types/consultation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Video, MessageSquare, Calendar, Clock, User } from "lucide-react"
import { ConsultationBookingModal } from "./consultation-booking-modal"
import { useRouter } from "next/navigation"

interface ConsultationCreditsDisplayProps {
  credits: ConsultationCredit[]
  activityId: number
  coachId: string
  onBookConsultation: (bookingData: any) => Promise<void>
  isLoading?: boolean
  onNavigateToCalendar?: () => void // Agregar esta prop
}

export function ConsultationCreditsDisplay({
  credits,
  activityId,
  coachId,
  onBookConsultation,
  isLoading = false,
  onNavigateToCalendar,
}: ConsultationCreditsDisplayProps) {
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [selectedConsultationType, setSelectedConsultationType] = useState<"message" | "videocall">("videocall")
  const router = useRouter()

  const videocallCredits = credits.find((c) => c.consultation_type === "videocall")
  const messageCredits = credits.find((c) => c.consultation_type === "message")

  const handleBookConsultation = (consultationType: "message" | "videocall") => {
    if (onNavigateToCalendar) {
      onNavigateToCalendar()
    } else {
      router.push("/mobile?tab=calendar")
    }
  }

  const handleConfirmBooking = async (bookingData: any) => {
    await onBookConsultation({
      ...bookingData,
      consultation_type: selectedConsultationType,
      activity_id: activityId,
      coach_id: coachId,
    })
    setShowBookingModal(false)
  }

  if (isLoading) {
    return (
      <Card className="bg-[#1E1E1E] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <User className="h-5 w-5 mr-2 text-[#FF7939]" />
            Consultas Incluidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-gray-700 rounded"></div>
            <div className="h-16 bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (credits.length === 0) {
    return (
      <Card className="bg-[#1E1E1E] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <User className="h-5 w-5 mr-2 text-[#FF7939]" />
            Consultas Incluidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-center py-4">No tienes consultas disponibles para esta actividad</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-[#1E1E1E] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <User className="h-5 w-5 mr-2 text-[#FF7939]" />
            Consultas Incluidas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Videollamadas */}
          {videocallCredits && (
            <div className="bg-[#2A2A2A] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Video className="h-5 w-5 mr-2 text-[#FF7939]" />
                  <span className="font-medium text-white">Videollamadas</span>
                </div>
                <Badge
                  variant={videocallCredits.remaining_sessions > 0 ? "default" : "secondary"}
                  className={videocallCredits.remaining_sessions > 0 ? "bg-[#FF7939]" : ""}
                >
                  {videocallCredits.remaining_sessions} de {videocallCredits.total_sessions}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Sesiones restantes
                  </div>
                </div>

                <Button
                  size="sm"
                  className="bg-[#FF7939] hover:bg-[#E66829]"
                  disabled={videocallCredits.remaining_sessions <= 0}
                  onClick={() => handleBookConsultation("videocall")}
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Programar
                </Button>
              </div>
            </div>
          )}

          {/* Mensajes */}
          {messageCredits && (
            <div className="bg-[#2A2A2A] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-[#FF7939]" />
                  <span className="font-medium text-white">Consultas por Mensaje</span>
                </div>
                <Badge
                  variant={messageCredits.remaining_sessions > 0 ? "default" : "secondary"}
                  className={messageCredits.remaining_sessions > 0 ? "bg-[#FF7939]" : ""}
                >
                  {messageCredits.remaining_sessions} de {messageCredits.total_sessions}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Días restantes
                  </div>
                </div>

                <Button
                  size="sm"
                  className="bg-[#FF7939] hover:bg-[#E66829]"
                  disabled={messageCredits.remaining_sessions <= 0}
                  onClick={() => handleBookConsultation("message")}
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Programar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ConsultationBookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onConfirm={handleConfirmBooking}
        consultationType={selectedConsultationType}
        coachId={coachId}
      />
    </>
  )
}
