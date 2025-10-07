"use client"

import { useState } from "react"
import { useCoachAvailability } from "@/hooks/use-coach-availability"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarX, Clock, Plus, Trash2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"

interface AvailabilityManagerProps {
  coachId: string
}

const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

export function AvailabilityManager({ coachId }: AvailabilityManagerProps) {
  const {
    availability,
    exceptions,
    isLoading,
    error,
    addAvailability,
    updateAvailability,
    deleteAvailability,
    addException,
    deleteException,
  } = useCoachAvailability(coachId)

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showExceptionDialog, setShowExceptionDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [formData, setFormData] = useState({
    day_of_week: "1", // Lunes por defecto
    start_time: "09:00",
    end_time: "10:00",
    consultation_type: "videocall",
  })
  const [exceptionData, setExceptionData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    exception_type: "unavailable",
    start_time: "09:00",
    end_time: "10:00",
    consultation_type: "videocall",
    reason: "",
  })

  const handleAddAvailability = async () => {
    try {
      await addAvailability({
        day_of_week: Number.parseInt(formData.day_of_week),
        start_time: formData.start_time,
        end_time: formData.end_time,
        consultation_type: formData.consultation_type as any,
      })
      setShowAddDialog(false)
    } catch (error) {
      console.error("Error adding availability:", error)
    }
  }

  const handleAddException = async () => {
    try {
      await addException({
        date: exceptionData.date,
        exception_type: exceptionData.exception_type as any,
        start_time: exceptionData.exception_type === "custom_hours" ? exceptionData.start_time : null,
        end_time: exceptionData.exception_type === "custom_hours" ? exceptionData.end_time : null,
        consultation_type:
          exceptionData.exception_type === "custom_hours" ? (exceptionData.consultation_type as any) : null,
        reason: exceptionData.reason,
      })
      setShowExceptionDialog(false)
    } catch (error) {
      console.error("Error adding exception:", error)
    }
  }

  const handleDeleteAvailability = async (id: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar este horario de disponibilidad?")) {
      try {
        await deleteAvailability(id)
      } catch (error) {
        console.error("Error deleting availability:", error)
      }
    }
  }

  const handleDeleteException = async (id: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta excepción?")) {
      try {
        await deleteException(id)
      } catch (error) {
        console.error("Error deleting exception:", error)
      }
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      setExceptionData({
        ...exceptionData,
        date: format(date, "yyyy-MM-dd"),
      })
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Gestión de Disponibilidad</CardTitle>
        <CardDescription>Configura tus horarios disponibles para consultas</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="regular">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="regular">Horarios Regulares</TabsTrigger>
            <TabsTrigger value="exceptions">Excepciones</TabsTrigger>
          </TabsList>

          <TabsContent value="regular" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Horarios Semanales</h3>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Añadir Horario
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 text-red-800 rounded-md">{error}</div>
            ) : availability.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-gray-300 rounded-md">
                <Clock className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">No has configurado horarios de disponibilidad</p>
                <Button variant="outline" className="mt-4" onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir Horario
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {availability.map((slot) => (
                  <div key={slot.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border">
                    <div>
                      <div className="font-medium">{dayNames[slot.day_of_week]}</div>
                      <div className="text-sm text-gray-500">
                        {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={slot.consultation_type === "videocall" ? "default" : "outline"}>
                        {slot.consultation_type === "videocall"
                          ? "Videollamada"
                          : slot.consultation_type === "message"
                            ? "Mensaje"
                            : "Ambos"}
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteAvailability(slot.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="exceptions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Excepciones de Disponibilidad</h3>
              <Button onClick={() => setShowExceptionDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Añadir Excepción
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : exceptions.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-gray-300 rounded-md">
                <CalendarX className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">No has configurado excepciones de disponibilidad</p>
                <Button variant="outline" className="mt-4" onClick={() => setShowExceptionDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir Excepción
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {exceptions.map((exception) => (
                  <div
                    key={exception.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md border"
                  >
                    <div>
                      <div className="font-medium">
                        {format(new Date(exception.date), "dd 'de' MMMM, yyyy", { locale: es })}
                      </div>
                      <div className="text-sm text-gray-500">
                        {exception.exception_type === "unavailable" ? (
                          "No disponible"
                        ) : (
                          <>
                            {exception.start_time?.substring(0, 5)} - {exception.end_time?.substring(0, 5)}
                            {" • "}
                            {exception.consultation_type === "videocall"
                              ? "Videollamada"
                              : exception.consultation_type === "message"
                                ? "Mensaje"
                                : "Ambos"}
                          </>
                        )}
                      </div>
                      {exception.reason && <div className="text-xs text-gray-500 mt-1">{exception.reason}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={exception.exception_type === "unavailable" ? "destructive" : "default"}>
                        {exception.exception_type === "unavailable" ? "No disponible" : "Horario especial"}
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteException(exception.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Dialog para añadir disponibilidad regular */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Horario de Disponibilidad</DialogTitle>
            <DialogDescription>Configura un nuevo horario semanal para atender consultas</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="day_of_week">Día de la semana</Label>
              <Select
                value={formData.day_of_week}
                onValueChange={(value) => setFormData({ ...formData, day_of_week: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un día" />
                </SelectTrigger>
                <SelectContent>
                  {dayNames.map((day, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start_time">Hora de inicio</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end_time">Hora de fin</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="consultation_type">Tipo de consulta</Label>
              <Select
                value={formData.consultation_type}
                onValueChange={(value) => setFormData({ ...formData, consultation_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="videocall">Videollamada</SelectItem>
                  <SelectItem value="message">Mensaje</SelectItem>
                  <SelectItem value="both">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddAvailability}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para añadir excepción */}
      <Dialog open={showExceptionDialog} onOpenChange={setShowExceptionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Excepción de Disponibilidad</DialogTitle>
            <DialogDescription>Configura una excepción para un día específico</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Fecha</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="rounded-md border"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="exception_type">Tipo de excepción</Label>
              <Select
                value={exceptionData.exception_type}
                onValueChange={(value) => setExceptionData({ ...exceptionData, exception_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unavailable">No disponible</SelectItem>
                  <SelectItem value="custom_hours">Horario especial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {exceptionData.exception_type === "custom_hours" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="start_time">Hora de inicio</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={exceptionData.start_time}
                      onChange={(e) => setExceptionData({ ...exceptionData, start_time: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="end_time">Hora de fin</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={exceptionData.end_time}
                      onChange={(e) => setExceptionData({ ...exceptionData, end_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="consultation_type">Tipo de consulta</Label>
                  <Select
                    value={exceptionData.consultation_type}
                    onValueChange={(value) => setExceptionData({ ...exceptionData, consultation_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="videocall">Videollamada</SelectItem>
                      <SelectItem value="message">Mensaje</SelectItem>
                      <SelectItem value="both">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="grid gap-2">
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Textarea
                id="reason"
                value={exceptionData.reason}
                onChange={(e) => setExceptionData({ ...exceptionData, reason: e.target.value })}
                placeholder="Ej: Vacaciones, evento especial, etc."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExceptionDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddException}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
