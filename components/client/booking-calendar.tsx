"use client"

import { useState, useEffect } from "react"
import { useBookingSlots } from "@/hooks/use-booking-slots"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { format, addDays, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, Clock, Loader2, Video, MessageSquare } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import type { AvailabilitySlot } from "@/types/availability"
import { Skeleton } from "@/components/ui/skeleton"

interface BookingCalendarProps {
  coachId: string
  clientId: string
  activityId: number
  consultationType?: "videocall" | "message"
  onBookingComplete?: () => void
}

export function BookingCalendar({
  coachId,
  clientId,
  activityId,
  consultationType = "videocall",
  onBookingComplete,
}: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null)
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const [notes, setNotes] = useState("")
  const [currentConsultationType, setCurrentConsultationType] = useState(consultationType)

  const { availableSlots, isLoading, isBooking, error, fetchAvailableSlots, bookSlot } = useBookingSlots(coachId)

  // Cargar slots disponibles cuando cambie la fecha o tipo de consulta
  useEffect(() => {
    if (selectedDate) {
      const startDate = format(selectedDate, "yyyy-MM-dd")
      const endDate = format(addDays(selectedDate, 6), "yyyy-MM-dd") // Cargar una semana
      fetchAvailableSlots(startDate, endDate, currentConsultationType)
    }
  }, [selectedDate, currentConsultationType, fetchAvailableSlots])

  // Obtener slots para la fecha seleccionada
  const slotsForSelectedDate = selectedDate
    ? availableSlots.filter((slot) => isSameDay(new Date(slot.date), selectedDate))
    : []

  const handleSlotSelect = (slot: AvailabilitySlot) => {
    setSelectedSlot(slot)
    setShowBookingDialog(true)
  }

  const handleBooking = async () => {
    if (!selectedSlot) return

    try {
      await bookSlot({
        coach_id: coachId,
        client_id: clientId,
        activity_id: activityId,
        date: selectedSlot.date,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        consultation_type: currentConsultationType,
        notes,
      })

      setShowBookingDialog(false)
      setSelectedSlot(null)
      setNotes("")
      onBookingComplete?.()
    } catch (error) {
      console.error("Error booking slot:", error)
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Programar Consulta</CardTitle>
        <CardDescription>Selecciona una fecha y horario disponible para tu consulta</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={currentConsultationType} onValueChange={(value) => setCurrentConsultationType(value as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="videocall" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Videollamada
            </TabsTrigger>
            <TabsTrigger value="message" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Mensaje
            </TabsTrigger>
          </TabsList>

          <TabsContent value={currentConsultationType} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Calendario */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Selecciona una fecha
                </h3>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
                  className="rounded-md border"
                />
              </div>

              {/* Horarios disponibles */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horarios disponibles
                </h3>

                {selectedDate ? (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600 mb-3">
                      {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: es })}
                    </div>

                    {isLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : error ? (
                      <div className="p-4 bg-red-50 text-red-800 rounded-md text-sm">{error}</div>
                    ) : slotsForSelectedDate.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-gray-300 rounded-md">
                        <Clock className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-500">No hay horarios disponibles para esta fecha</p>
                        <p className="text-sm text-gray-400 mt-1">Intenta seleccionar otra fecha</p>
                      </div>
                    ) : (
                      <div className="grid gap-2 max-h-64 overflow-y-auto">
                        {slotsForSelectedDate.map((slot) => (
                          <Button
                            key={slot.id}
                            variant="outline"
                            className="justify-start h-auto p-3"
                            onClick={() => handleSlotSelect(slot)}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {slot.start_time} - {slot.end_time}
                                </span>
                              </div>
                              <Badge variant="secondary">
                                {currentConsultationType === "videocall" ? "Videollamada" : "Mensaje"}
                              </Badge>
                            </div>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed border-gray-300 rounded-md">
                    <CalendarIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">Selecciona una fecha para ver los horarios disponibles</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Dialog de confirmación de reserva */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Reserva</DialogTitle>
            <DialogDescription>
              Estás a punto de programar una consulta. Revisa los detalles antes de confirmar.
            </DialogDescription>
          </DialogHeader>

          {selectedSlot && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-md">
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Fecha:</span>
                    <span>{format(new Date(selectedSlot.date), "dd 'de' MMMM, yyyy", { locale: es })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Horario:</span>
                    <span>
                      {selectedSlot.start_time} - {selectedSlot.end_time}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Tipo:</span>
                    <Badge variant={currentConsultationType === "videocall" ? "default" : "secondary"}>
                      {currentConsultationType === "videocall" ? "Videollamada" : "Mensaje"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium">
                  Notas adicionales (opcional)
                </label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe brevemente el motivo de tu consulta o cualquier información relevante..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookingDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleBooking} disabled={isBooking}>
              {isBooking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar Reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
