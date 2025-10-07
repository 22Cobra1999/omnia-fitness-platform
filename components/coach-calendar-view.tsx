"use client"

import { useState, useEffect } from "react"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  Plus,
  X,
  Search,
  Filter,
  CalendarDays,
  CalendarRange,
  CalendarClock,
  ArrowUpRight,
  Dumbbell,
} from "lucide-react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
  isToday,
} from "date-fns"
import { es } from "date-fns/locale"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import React from "react"

// Tipos de datos
interface Client {
  id: string
  name: string
  avatar?: string
  goal: string
  progress: number
  lastSession?: string
  nextSession?: string
}

interface Appointment {
  id: string
  title: string
  clientId: string
  clientName: string
  clientAvatar?: string
  date: string
  startTime: string
  endTime: string
  type: "fitness" | "nutrition" | "consultation" | "assessment"
  status: "scheduled" | "completed" | "cancelled"
  notes?: string
  location?: string
  color: string
}

// Datos de ejemplo
const SAMPLE_CLIENTS: Client[] = [
  {
    id: "1",
    name: "Emma Wilson",
    avatar: "/diverse-group.png",
    goal: "Weight Loss",
    progress: 68,
    lastSession: "2025-05-10",
    nextSession: "2025-05-17",
  },
  {
    id: "2",
    name: "John Davis",
    avatar: "/diverse-group.png",
    goal: "Muscle Gain",
    progress: 45,
    lastSession: "2025-05-12",
    nextSession: "2025-05-19",
  },
  {
    id: "3",
    name: "Sarah Miller",
    avatar: "/diverse-group.png",
    goal: "Toning",
    progress: 92,
    lastSession: "2025-05-14",
    nextSession: "2025-05-21",
  },
  {
    id: "4",
    name: "Mike Johnson",
    avatar: "/diverse-group.png",
    goal: "Weight Loss",
    progress: 32,
    lastSession: "2025-05-08",
    nextSession: "2025-05-15",
  },
  {
    id: "5",
    name: "Lisa Brown",
    avatar: "/diverse-group.png",
    goal: "Fitness",
    progress: 78,
    lastSession: "2025-05-11",
    nextSession: "2025-05-18",
  },
]

const SAMPLE_APPOINTMENTS: Appointment[] = [
  {
    id: "1",
    title: "Weight Training",
    clientId: "1",
    clientName: "Emma Wilson",
    clientAvatar: "/diverse-group.png",
    date: "2025-05-17",
    startTime: "10:00",
    endTime: "11:00",
    type: "fitness",
    status: "scheduled",
    notes: "Focus on upper body",
    location: "Gym A",
    color: "#FF7939",
  },
  {
    id: "2",
    title: "Nutrition Plan",
    clientId: "2",
    clientName: "John Davis",
    clientAvatar: "/diverse-group.png",
    date: "2025-05-19",
    startTime: "14:00",
    endTime: "15:00",
    type: "nutrition",
    status: "scheduled",
    notes: "Review meal plan progress",
    location: "Online",
    color: "#4CAF50",
  },
  {
    id: "3",
    title: "HIIT Session",
    clientId: "3",
    clientName: "Sarah Miller",
    clientAvatar: "/diverse-group.png",
    date: "2025-05-21",
    startTime: "16:00",
    endTime: "17:00",
    type: "fitness",
    status: "scheduled",
    location: "Gym B",
    color: "#FF7939",
  },
  {
    id: "4",
    title: "Initial Assessment",
    clientId: "4",
    clientName: "Mike Johnson",
    clientAvatar: "/diverse-group.png",
    date: "2025-05-15",
    startTime: "09:00",
    endTime: "10:00",
    type: "assessment",
    status: "scheduled",
    notes: "First session - measure baseline",
    location: "Office",
    color: "#2196F3",
  },
  {
    id: "5",
    title: "Progress Review",
    clientId: "5",
    clientName: "Lisa Brown",
    clientAvatar: "/diverse-group.png",
    date: "2025-05-18",
    startTime: "11:00",
    endTime: "12:00",
    type: "consultation",
    status: "scheduled",
    notes: "Monthly progress check",
    location: "Online",
    color: "#9C27B0",
  },
  {
    id: "6",
    title: "Cardio Session",
    clientId: "1",
    clientName: "Emma Wilson",
    clientAvatar: "/diverse-group.png",
    date: "2025-05-24",
    startTime: "10:00",
    endTime: "11:00",
    type: "fitness",
    status: "scheduled",
    location: "Park",
    color: "#FF7939",
  },
  {
    id: "7",
    title: "Strength Training",
    clientId: "2",
    clientName: "John Davis",
    clientAvatar: "/diverse-group.png",
    date: "2025-05-26",
    startTime: "15:00",
    endTime: "16:00",
    type: "fitness",
    status: "scheduled",
    location: "Gym A",
    color: "#FF7939",
  },
]

// Componente principal
export function CoachCalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [view, setView] = useState<"month" | "week" | "day">("month")
  const [appointments, setAppointments] = useState<Appointment[]>(SAMPLE_APPOINTMENTS)
  const [clients, setClients] = useState<Client[]>(SAMPLE_CLIENTS)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string | null>(null)
  // Añadir un estado de carga
  const [isLoading, setIsLoading] = useState(true)

  // Modificar el useEffect para incluir un mejor manejo de carga
  useEffect(() => {
    // Simular un tiempo de carga para mostrar el estado de carga
    const loadData = async () => {
      setIsLoading(true)
      // Pequeño retraso para asegurar que el estado de carga se muestre
      await new Promise((resolve) => setTimeout(resolve, 300))
      setIsLoading(false)
    }

    loadData()
  }, [currentDate, view])

  // Añadir esta línea cerca del inicio del componente:
  const memoizedMonthView = React.useMemo(() => renderMonthView(), [currentDate, appointments])

  // Función para obtener las citas del día seleccionado
  const getDayAppointments = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd")
    return appointments.filter((appointment) => appointment.date === dateString)
  }

  // Función para obtener las citas de la semana seleccionada
  const getWeekAppointments = (date: Date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 }) // Semana comienza el lunes
    const end = endOfWeek(date, { weekStartsOn: 1 })

    const days = []
    let day = start

    while (day <= end) {
      days.push(day)
      day = addDays(day, 1)
    }

    return days.map((day) => ({
      date: day,
      appointments: getDayAppointments(day),
    }))
  }

  // Función para obtener los días del mes actual
  const getMonthDays = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const days = []
    let day = startDate

    while (day <= endDate) {
      days.push(day)
      day = addDays(day, 1)
    }

    return days
  }

  // Función para navegar al mes anterior
  const prevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  // Función para navegar al mes siguiente
  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  // Función para navegar a hoy
  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  // Función para manejar la selección de una fecha
  const handleDateClick = (day: Date) => {
    setSelectedDate(day)
    if (view === "month") {
      setView("day")
    }
  }

  // Función para manejar la selección de una cita
  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setShowAppointmentModal(true)
  }

  // Función para agregar una nueva cita
  const handleAddAppointment = () => {
    setShowAddModal(true)
  }

  // Función para cerrar el modal de cita
  const closeAppointmentModal = () => {
    setSelectedAppointment(null)
    setShowAppointmentModal(false)
  }

  // Función para cerrar el modal de agregar cita
  const closeAddModal = () => {
    setShowAddModal(false)
  }

  // Función para obtener el cliente por ID
  const getClientById = (id: string) => {
    return clients.find((client) => client.id === id)
  }

  // Renderizar la vista de mes
  const renderMonthView = () => {
    const days = getMonthDays()
    const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

    return (
      <div className="bg-black text-white">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day, index) => (
            <div key={index} className="text-center text-xs text-gray-400 py-1">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const dayAppointments = getDayAppointments(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isSelected = isSameDay(day, selectedDate)
            const isTodayDate = isToday(day)

            return (
              <div
                key={index}
                className={`
                  min-h-[60px] p-1 rounded-md relative
                  ${isCurrentMonth ? "bg-zinc-900" : "bg-zinc-950 opacity-40"}
                  ${isSelected ? "ring-1 ring-[#FF7939]" : ""}
                  ${isTodayDate ? "bg-zinc-800" : ""}
                `}
                onClick={() => handleDateClick(day)}
              >
                <div
                  className={`
                  text-xs font-medium mb-1 flex justify-center items-center h-5 w-5 rounded-full
                  ${isTodayDate ? "bg-[#FF7939] text-white" : "text-gray-300"}
                  ${isSelected && !isTodayDate ? "bg-zinc-800" : ""}
                `}
                >
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {dayAppointments.slice(0, 2).map((appointment, idx) => (
                    <div
                      key={idx}
                      className="text-[8px] truncate px-1 py-0.5 rounded-sm"
                      style={{ backgroundColor: `${appointment.color}30` }}
                    >
                      <div className="flex items-center">
                        <div className="w-1 h-1 rounded-full mr-1" style={{ backgroundColor: appointment.color }}></div>
                        <span style={{ color: appointment.color }}>
                          {appointment.startTime} {appointment.clientName}
                        </span>
                      </div>
                    </div>
                  ))}
                  {dayAppointments.length > 2 && (
                    <div className="text-[8px] text-gray-400 text-center">+{dayAppointments.length - 2} más</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Renderizar la vista de semana
  const renderWeekView = () => {
    const weekDays = getWeekAppointments(selectedDate)
    const hours = Array.from({ length: 12 }, (_, i) => i + 8) // 8am a 8pm

    return (
      <div className="bg-black text-white overflow-x-auto">
        <div className="flex min-w-[700px]">
          <div className="w-16 flex-shrink-0"></div>
          {weekDays.map((day, index) => (
            <div
              key={index}
              className={`
                flex-1 text-center py-2 text-sm font-medium
                ${isSameDay(day.date, new Date()) ? "text-[#FF7939]" : "text-gray-300"}
              `}
            >
              <div>{format(day.date, "EEE", { locale: es })}</div>
              <div
                className={`
                  mx-auto mt-1 flex items-center justify-center w-7 h-7 rounded-full
                  ${isSameDay(day.date, selectedDate) ? "bg-[#FF7939] text-white" : ""}
                  ${isSameDay(day.date, new Date()) && !isSameDay(day.date, selectedDate) ? "border border-[#FF7939]" : ""}
                `}
                onClick={() => setSelectedDate(day.date)}
              >
                {format(day.date, "d")}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 relative min-w-[700px]">
          {hours.map((hour) => (
            <div key={hour} className="flex h-14 border-t border-zinc-800">
              <div className="w-16 flex-shrink-0 -mt-3 pr-2 text-right">
                <span className="text-xs text-gray-500">{hour}:00</span>
              </div>

              {weekDays.map((day, dayIndex) => {
                const hourAppointments = day.appointments.filter(
                  (app) => Number.parseInt(app.startTime.split(":")[0]) === hour,
                )

                return (
                  <div key={dayIndex} className="flex-1 relative border-l border-zinc-900">
                    {hourAppointments.map((appointment, idx) => {
                      const startHour = Number.parseInt(appointment.startTime.split(":")[0])
                      const startMinute = Number.parseInt(appointment.startTime.split(":")[1])
                      const endHour = Number.parseInt(appointment.endTime.split(":")[0])
                      const endMinute = Number.parseInt(appointment.endTime.split(":")[1])

                      const durationHours = endHour - startHour + (endMinute - startMinute) / 60
                      const height = durationHours * 56 // 56px por hora

                      return (
                        <div
                          key={idx}
                          className="absolute left-0 right-0 mx-1 rounded-md p-1 overflow-hidden cursor-pointer"
                          style={{
                            top: `${(startMinute / 60) * 56}px`,
                            height: `${height}px`,
                            backgroundColor: `${appointment.color}20`,
                            borderLeft: `3px solid ${appointment.color}`,
                          }}
                          onClick={() => handleAppointmentClick(appointment)}
                        >
                          <div className="text-xs font-medium truncate" style={{ color: appointment.color }}>
                            {appointment.startTime} - {appointment.clientName}
                          </div>
                          <div className="text-[10px] text-gray-400 truncate">{appointment.title}</div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Renderizar la vista de día
  const renderDayView = () => {
    const dayAppointments = getDayAppointments(selectedDate)
    const hours = Array.from({ length: 12 }, (_, i) => i + 8) // 8am a 8pm

    return (
      <div className="bg-black text-white">
        <div className="mb-4">
          <h3 className="text-lg font-medium">{format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}</h3>
          <p className="text-sm text-gray-400">
            {dayAppointments.length} {dayAppointments.length === 1 ? "sesión" : "sesiones"} programadas
          </p>
        </div>

        <div className="space-y-4">
          {dayAppointments.length > 0 ? (
            dayAppointments
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((appointment, index) => {
                const client = getClientById(appointment.clientId)

                return (
                  <div
                    key={index}
                    className="bg-zinc-900 rounded-lg p-3 border-l-4 cursor-pointer"
                    style={{ borderLeftColor: appointment.color }}
                    onClick={() => handleAppointmentClick(appointment)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{appointment.title}</h4>
                        <div className="flex items-center text-sm text-gray-400">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>
                            {appointment.startTime} - {appointment.endTime}
                          </span>
                          {appointment.location && (
                            <>
                              <span className="mx-1">•</span>
                              <span>{appointment.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge
                        className="text-xs"
                        style={{
                          backgroundColor: `${appointment.color}20`,
                          color: appointment.color,
                        }}
                      >
                        {appointment.type}
                      </Badge>
                    </div>

                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage
                          src={appointment.clientAvatar || "/placeholder.svg"}
                          alt={appointment.clientName}
                        />
                        <AvatarFallback>{appointment.clientName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{appointment.clientName}</div>
                        {client && (
                          <div className="flex items-center">
                            <div className="text-xs text-gray-400 mr-2">{client.goal}</div>
                            <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${client.progress}%`,
                                  backgroundColor:
                                    client.progress > 66 ? "#4CAF50" : client.progress > 33 ? "#FFC107" : "#FF5252",
                                }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {appointment.notes && (
                      <div className="mt-2 text-xs text-gray-400 bg-zinc-950 p-2 rounded">{appointment.notes}</div>
                    )}
                  </div>
                )
              })
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-gray-600 mb-3" />
              <h4 className="text-lg font-medium mb-2">No hay sesiones programadas</h4>
              <p className="text-sm text-gray-400 mb-4">No tienes ninguna sesión programada para este día</p>
              <Button className="bg-[#FF7939] hover:bg-[#FF7939]/90" onClick={handleAddAppointment}>
                <Plus className="w-4 h-4 mr-1" />
                Agregar sesión
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Renderizar el modal de detalles de cita
  const renderAppointmentModal = () => {
    if (!selectedAppointment) return null

    const client = getClientById(selectedAppointment.clientId)

    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="bg-zinc-900 rounded-xl w-full max-w-md">
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
            <h3 className="text-lg font-medium">Detalles de la sesión</h3>
            <Button variant="ghost" size="icon" onClick={closeAppointmentModal}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-4">
            <div className="mb-4">
              <h4 className="text-xl font-medium">{selectedAppointment.title}</h4>
              <Badge
                className="mt-1"
                style={{
                  backgroundColor: `${selectedAppointment.color}20`,
                  color: selectedAppointment.color,
                }}
              >
                {selectedAppointment.type}
              </Badge>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center">
                <Clock className="w-4 h-4 text-gray-400 mr-2" />
                <div>
                  <div className="font-medium">
                    {format(parseISO(selectedAppointment.date), "EEEE, d 'de' MMMM", { locale: es })}
                  </div>
                  <div className="text-sm text-gray-400">
                    {selectedAppointment.startTime} - {selectedAppointment.endTime}
                  </div>
                </div>
              </div>

              {selectedAppointment.location && (
                <div className="flex items-start">
                  <div className="w-4 h-4 text-gray-400 mr-2 mt-0.5">📍</div>
                  <div>
                    <div className="font-medium">Ubicación</div>
                    <div className="text-sm text-gray-400">{selectedAppointment.location}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-zinc-800 rounded-lg p-3 mb-4">
              <div className="flex items-center mb-3">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage
                    src={selectedAppointment.clientAvatar || "/placeholder.svg"}
                    alt={selectedAppointment.clientName}
                  />
                  <AvatarFallback>{selectedAppointment.clientName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{selectedAppointment.clientName}</div>
                  {client && <div className="text-sm text-gray-400">{client.goal}</div>}
                </div>
                <Button variant="ghost" size="icon" className="ml-auto">
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </div>

              {client && (
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Progreso</span>
                      <span>{client.progress}%</span>
                    </div>
                    <Progress
                      value={client.progress}
                      className="h-1.5"
                      indicatorClassName={
                        client.progress > 66 ? "bg-green-500" : client.progress > 33 ? "bg-yellow-500" : "bg-red-500"
                      }
                    />
                  </div>

                  <div className="flex justify-between text-sm">
                    <div>
                      <div className="text-gray-400">Última sesión</div>
                      <div>
                        {client.lastSession ? format(parseISO(client.lastSession), "d MMM", { locale: es }) : "N/A"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-400">Próxima sesión</div>
                      <div>
                        {client.nextSession ? format(parseISO(client.nextSession), "d MMM", { locale: es }) : "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {selectedAppointment.notes && (
              <div className="mb-4">
                <h5 className="font-medium mb-1">Notas</h5>
                <div className="text-sm text-gray-300 bg-zinc-800 p-3 rounded-lg">{selectedAppointment.notes}</div>
              </div>
            )}

            <div className="flex space-x-2 mt-4">
              <Button className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white" onClick={closeAppointmentModal}>
                Editar
              </Button>
              <Button className="flex-1 bg-[#FF7939] hover:bg-[#FF7939]/90 text-white" onClick={closeAppointmentModal}>
                Iniciar sesión
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Renderizar el modal de agregar cita
  const renderAddModal = () => {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="bg-zinc-900 rounded-xl w-full max-w-md">
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
            <h3 className="text-lg font-medium">Agregar nueva sesión</h3>
            <Button variant="ghost" size="icon" onClick={closeAddModal}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Título</label>
              <Input placeholder="Ej: Entrenamiento de fuerza" className="bg-zinc-800 border-zinc-700" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Fecha</label>
                <Input
                  type="date"
                  defaultValue={format(selectedDate, "yyyy-MM-dd")}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Hora</label>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="time" defaultValue="10:00" className="bg-zinc-800 border-zinc-700" />
                  <Input type="time" defaultValue="11:00" className="bg-zinc-800 border-zinc-700" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Cliente</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input placeholder="Buscar cliente..." className="bg-zinc-800 border-zinc-700 pl-9" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Tipo</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="justify-start border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
                >
                  <Dumbbell className="w-4 h-4 mr-2 text-[#FF7939]" />
                  Fitness
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="justify-start border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
                >
                  <Users className="w-4 h-4 mr-2 text-[#4CAF50]" />
                  Nutrición
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Ubicación</label>
              <Input placeholder="Ej: Gimnasio A, Online, etc." className="bg-zinc-800 border-zinc-700" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Notas</label>
              <textarea
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 text-white h-20"
                placeholder="Agregar notas sobre esta sesión..."
              ></textarea>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <Button variant="outline" className="border-zinc-700" onClick={closeAddModal}>
                Cancelar
              </Button>
              <Button className="bg-[#FF7939] hover:bg-[#FF7939]/90" onClick={closeAddModal}>
                Guardar
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderView = () => {
    switch (view) {
      case "month":
        return memoizedMonthView
      case "week":
        return renderWeekView()
      case "day":
        return renderDayView()
      default:
        return memoizedMonthView
    }
  }

  // Añadir este código justo antes del return principal:
  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-black text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Calendario</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mb-4"></div>
          <p className="text-gray-400 animate-pulse">Cargando calendario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-black text-white">
      {/* Encabezado */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Calendario</h1>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="h-8 px-2 border-zinc-800 bg-zinc-900" onClick={goToToday}>
              Hoy
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 border-zinc-800 bg-zinc-900" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 border-zinc-800 bg-zinc-900" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">{format(currentDate, "MMMM yyyy", { locale: es })}</h2>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 px-3 ${view === "month" ? "bg-zinc-800" : ""}`}
              onClick={() => setView("month")}
            >
              <CalendarDays className="h-4 w-4 mr-1" />
              Mes
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 px-3 ${view === "week" ? "bg-zinc-800" : ""}`}
              onClick={() => setView("week")}
            >
              <CalendarRange className="h-4 w-4 mr-1" />
              Semana
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 px-3 ${view === "day" ? "bg-zinc-800" : ""}`}
              onClick={() => setView("day")}
            >
              <CalendarClock className="h-4 w-4 mr-1" />
              Día
            </Button>
          </div>
        </div>

        <div className="flex items-center mb-4">
          <div className="relative flex-1 mr-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input
              placeholder="Buscar cliente o sesión..."
              className="bg-zinc-900 border-zinc-800 pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 border-zinc-800 bg-zinc-900">
                <Filter className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 bg-zinc-900 border-zinc-800">
              <div className="space-y-2">
                <h4 className="font-medium mb-2">Filtrar por tipo</h4>
                <div className="space-y-1">
                  <Button variant="ghost" className="w-full justify-start" onClick={() => setFilterType(null)}>
                    Todos
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => setFilterType("fitness")}>
                    <Dumbbell className="h-4 w-4 mr-2 text-[#FF7939]" />
                    Fitness
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => setFilterType("nutrition")}>
                    <Users className="h-4 w-4 mr-2 text-[#4CAF50]" />
                    Nutrición
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 overflow-y-auto p-4">{renderView()}</div>

      {/* Botón flotante para agregar */}
      <div className="fixed bottom-24 right-4">
        <Button
          className="h-14 w-14 rounded-full bg-[#FF7939] hover:bg-[#FF7939]/90 shadow-lg"
          onClick={handleAddAppointment}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Modales */}
      {showAppointmentModal && renderAppointmentModal()}
      {showAddModal && renderAddModal()}
    </div>
  )
}
