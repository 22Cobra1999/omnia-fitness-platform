"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Video, MessageSquare, Calendar, Clock, X } from "lucide-react"

interface ConsultationBookingModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (bookingData: any) => Promise<void>
  consultationType: "message" | "videocall"
  coachId: string
}

export function ConsultationBookingModal({
  isOpen,
  onClose,
  onConfirm,
  consultationType,
  coachId,
}: ConsultationBookingModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    preferred_date: "",
    preferred_time: "",
    duration: consultationType === "videocall" ? 60 : 1440, // 60 min para video, 1 día para mensaje
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.preferred_date || !formData.preferred_time) {
      return
    }

    setIsLoading(true)
    try {
      await onConfirm(formData)
      setFormData({
        preferred_date: "",
        preferred_time: "",
        duration: consultationType === "videocall" ? 60 : 1440,
        notes: "",
      })
    } catch (error) {
      console.error("Error booking consultation:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getMinDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split("T")[0]
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1E1E1E] text-white border-gray-800 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center">
              {consultationType === "videocall" ? (
                <Video className="h-5 w-5 mr-2 text-[#FF7939]" />
              ) : (
                <MessageSquare className="h-5 w-5 mr-2 text-[#FF7939]" />
              )}
              <span>Programar {consultationType === "videocall" ? "Videollamada" : "Consulta por Mensaje"}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="preferred_date">Fecha preferida</Label>
            <Input
              id="preferred_date"
              type="date"
              min={getMinDate()}
              value={formData.preferred_date}
              onChange={(e) => setFormData((prev) => ({ ...prev, preferred_date: e.target.value }))}
              className="bg-[#2A2A2A] border-gray-700 focus:border-[#FF7939] text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferred_time">
              {consultationType === "videocall" ? "Hora preferida" : "Hora de inicio"}
            </Label>
            <Input
              id="preferred_time"
              type="time"
              value={formData.preferred_time}
              onChange={(e) => setFormData((prev) => ({ ...prev, preferred_time: e.target.value }))}
              className="bg-[#2A2A2A] border-gray-700 focus:border-[#FF7939] text-white"
              required
            />
          </div>

          {consultationType === "videocall" && (
            <div className="space-y-2">
              <Label htmlFor="duration">Duración</Label>
              <Select
                value={formData.duration.toString()}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, duration: Number.parseInt(value) }))}
              >
                <SelectTrigger className="bg-[#2A2A2A] border-gray-700 focus:border-[#FF7939] text-white">
                  <SelectValue placeholder="Seleccionar duración" />
                </SelectTrigger>
                <SelectContent className="bg-[#2A2A2A] border-gray-700 text-white">
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="45">45 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="90">1.5 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notas adicionales (opcional)</Label>
            <Textarea
              id="notes"
              placeholder={`Describe brevemente el tema de tu ${consultationType === "videocall" ? "videollamada" : "consulta"}...`}
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              className="bg-[#2A2A2A] border-gray-700 focus:border-[#FF7939] text-white min-h-[80px]"
            />
          </div>

          <div className="bg-[#2A2A2A] rounded-lg p-3 text-sm text-gray-300">
            <div className="flex items-center mb-2">
              <Calendar className="h-4 w-4 mr-2 text-[#FF7939]" />
              <span className="font-medium">Información importante:</span>
            </div>
            <ul className="space-y-1 text-xs">
              <li>• El coach confirmará la disponibilidad en las próximas 24 horas</li>
              <li>• Puedes cancelar hasta 2 horas antes sin penalización</li>
              {consultationType === "videocall" && <li>• Recibirás un enlace de videollamada por email</li>}
            </ul>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} className="text-gray-400">
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-[#FF7939] hover:bg-[#E66829]"
              disabled={isLoading || !formData.preferred_date || !formData.preferred_time}
            >
              {isLoading ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Programando...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Programar {consultationType === "videocall" ? "Videollamada" : "Consulta"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
