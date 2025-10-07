"use client"

import { useState, useEffect } from "react"
import { 
  ChevronLeft, 
  ChevronRight, 
  CalendarIcon, 
  Clock, 
  Users, 
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Video,
  MessageSquare,
  MapPin,
  Star,
  CheckCircle,
  AlertCircle,
  X,
  Save,
  UserPlus,
  BookOpen,
  Target,
  TrendingUp
} from "lucide-react"
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
  isToday,
  isTomorrow,
  isYesterday,
  differenceInMinutes,
  addMinutes
} from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"

type CalendarView = "month" | "week" | "day" | "agenda"
type EventType = "session" | "consultation" | "workshop" | "assessment" | "followup"

interface Event {
  id: string
  title: string
  clientName: string
  clientId: string
  start: Date
  end: Date
  type: EventType
  color: string
  status: "confirmed" | "pending" | "cancelled" | "completed"
  notes?: string
  location?: string
  isOnline?: boolean
  productId?: string
  productName?: string
  price?: number
}

interface QuickEvent {
  title: string
  duration: number // en minutos
  type: EventType
  color: string
}

export function CoachCalendarView() {
  const { toast } = useToast()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>("agenda")
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isQuickEventModalOpen, setIsQuickEventModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState<EventType | "all">("all")

  // Quick event templates
  const quickEvents: QuickEvent[] = [
    { title: "Entrenamiento Personal", duration: 60, type: "session", color: "bg-green-500" },
    { title: "Evaluación Física", duration: 45, type: "assessment", color: "bg-blue-500" },
    { title: "Consulta Nutricional", duration: 30, type: "consultation", color: "bg-purple-500" },
    { title: "Seguimiento", duration: 20, type: "followup", color: "bg-orange-500" },
    { title: "Taller Grupal", duration: 90, type: "workshop", color: "bg-pink-500" },
  ]

  // Eventos de ejemplo mejorados
  const [events, setEvents] = useState<Event[]>([
    {
      id: "1",
      title: "Entrenamiento Personal",
      clientName: "Carlos Rodríguez",
      clientId: "client-1",
      start: parseISO(`${format(new Date(), "yyyy-MM-dd")}T10:00:00`),
      end: parseISO(`${format(new Date(), "yyyy-MM-dd")}T11:00:00`),
      type: "session",
      color: "bg-green-500",
      status: "confirmed",
      notes: "Enfoque en fuerza y resistencia",
      location: "Gimnasio Central",
      isOnline: false,
      productId: "program-1",
      productName: "Programa Fitness Pro",
      price: 50
    },
    {
      id: "2",
      title: "Evaluación Física",
      clientName: "María López",
      clientId: "client-2",
      start: parseISO(`${format(addDays(new Date(), 1), "yyyy-MM-dd")}T15:00:00`),
      end: parseISO(`${format(addDays(new Date(), 1), "yyyy-MM-dd")}T15:45:00`),
      type: "assessment",
      color: "bg-blue-500",
      status: "confirmed",
      notes: "Primera evaluación completa",
      location: "Online",
      isOnline: true,
      price: 35
    },
    {
      id: "3",
      title: "Sesión de Nutrición",
      clientName: "Juan Pérez",
      clientId: "client-3",
      start: parseISO(`${format(addDays(new Date(), 2), "yyyy-MM-dd")}T09:00:00`),
      end: parseISO(`${format(addDays(new Date(), 2), "yyyy-MM-dd")}T09:30:00`),
      type: "consultation",
      color: "bg-purple-500",
      status: "pending",
      notes: "Plan de alimentación personalizado",
      location: "Online",
      isOnline: true,
      price: 40
    },
    {
      id: "4",
      title: "Taller de Yoga",
      clientName: "Grupo A",
      clientId: "group-1",
      start: parseISO(`${format(addDays(new Date(), 3), "yyyy-MM-dd")}T18:00:00`),
      end: parseISO(`${format(addDays(new Date(), 3), "yyyy-MM-dd")}T19:30:00`),
      type: "workshop",
      color: "bg-pink-500",
      status: "confirmed",
      notes: "Yoga para principiantes",
      location: "Estudio Zen",
      isOnline: false,
      productId: "workshop-1",
      productName: "Taller de Yoga",
      price: 25
    }
  ])

  // Filtrar eventos
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = selectedFilter === "all" || event.type === selectedFilter
    return matchesSearch && matchesFilter
  })

  // Estadísticas rápidas
  const todayEvents = filteredEvents.filter(event => isSameDay(event.start, new Date()))
  const upcomingEvents = filteredEvents.filter(event => event.start > new Date()).slice(0, 5)
  const completedToday = filteredEvents.filter(event => 
    isSameDay(event.start, new Date()) && event.status === "completed"
  ).length

  const navigatePrevious = () => {
    switch (view) {
      case "month":
        setCurrentDate(subMonths(currentDate, 1))
        break
      case "week":
        setCurrentDate(subWeeks(currentDate, 1))
        break
      case "day":
        setCurrentDate(subDays(currentDate, 1))
        break
    }
  }

  const navigateNext = () => {
    switch (view) {
      case "month":
        setCurrentDate(addMonths(currentDate, 1))
        break
      case "week":
        setCurrentDate(addWeeks(currentDate, 1))
        break
      case "day":
        setCurrentDate(addDays(currentDate, 1))
        break
    }
  }

  const navigateToday = () => {
    setCurrentDate(new Date())
  }

  const handleQuickEvent = (quickEvent: QuickEvent) => {
    const newEvent: Event = {
      id: `temp-${Date.now()}`,
      title: quickEvent.title,
      clientName: "Nuevo Cliente",
      clientId: "temp-client",
      start: new Date(),
      end: addMinutes(new Date(), quickEvent.duration),
      type: quickEvent.type,
      color: quickEvent.color,
      status: "pending",
      price: 0
    }
    setSelectedEvent(newEvent)
    setIsEventModalOpen(true)
    setIsQuickEventModalOpen(false)
  }

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
    setIsEventModalOpen(true)
  }

  const getStatusColor = (status: Event["status"]) => {
    switch (status) {
      case "confirmed": return "bg-green-500"
      case "pending": return "bg-yellow-500"
      case "cancelled": return "bg-red-500"
      case "completed": return "bg-gray-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusText = (status: Event["status"]) => {
    switch (status) {
      case "confirmed": return "Confirmado"
      case "pending": return "Pendiente"
      case "cancelled": return "Cancelado"
      case "completed": return "Completado"
      default: return "Desconocido"
    }
  }

  const getTypeText = (type: EventType) => {
    switch (type) {
      case "session": return "Sesión"
      case "consultation": return "Consulta"
      case "workshop": return "Taller"
      case "assessment": return "Evaluación"
      case "followup": return "Seguimiento"
      default: return "Evento"
    }
  }

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const days = eachDayOfInterval({ start: startDate, end: endDate })

    return (
      <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-gray-800">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
            <div key={day} className="text-center text-gray-400 text-xs font-medium py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dayEvents = filteredEvents.filter((event) => isSameDay(event.start, day))
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isTodayDate = isToday(day)

            return (
              <div
                key={day.toString()}
                className={`min-h-[100px] p-2 border border-gray-800 rounded-lg cursor-pointer transition-colors hover:bg-gray-800/50 ${
                  isCurrentMonth ? "bg-[#2A2A2A]" : "bg-[#1A1A1A] opacity-50"
                } ${isTodayDate ? "ring-2 ring-orange-500" : ""}`}
                onClick={() => {
                  setCurrentDate(day)
                  setView("day")
                }}
              >
                <div className={`text-sm font-medium mb-2 ${
                  isTodayDate ? "text-orange-500" : "text-gray-300"
                }`}>
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className={`${event.color} text-white text-xs p-1 rounded truncate cursor-pointer hover:opacity-80`}
                      title={`${event.title} - ${event.clientName}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEventClick(event)
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span>{format(event.start, "HH:mm")}</span>
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(event.status)}`}></div>
                      </div>
                      <div className="truncate">{event.title}</div>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-400 text-center">
                      +{dayEvents.length - 3} más
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate)
    const weekEnd = endOfWeek(currentDate)
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

    const hours = Array.from({ length: 14 }, (_, i) => i + 7) // 7am to 9pm

    return (
      <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-gray-800 overflow-x-auto">
        <div className="grid grid-cols-8 gap-1 mb-2 min-w-[800px]">
          <div className="text-center text-gray-400 text-sm font-medium py-2">Hora</div>
          {days.map((day) => (
            <div
              key={day.toString()}
              className={`text-center text-sm font-medium py-2 ${
                isToday(day) ? "text-orange-500" : "text-gray-300"
              }`}
            >
              <div>{format(day, "EEE", { locale: es })}</div>
              <div className="text-xs text-gray-500">{format(day, "d")}</div>
            </div>
          ))}
        </div>

        {/* Vista de semana móvil simplificada */}
        <div className="space-y-2">
          {days.map((day) => {
            const dayEvents = filteredEvents.filter((event) => isSameDay(event.start, day))
            
            return (
              <div key={day.toString()} className="bg-[#1A1A1A] rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm">
                    {format(day, "EEE d MMM", { locale: es })}
                  </h3>
                  <div className="text-xs text-gray-400">
                    {dayEvents.length} eventos
                  </div>
                </div>
                
                {dayEvents.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm py-4">
                    Sin eventos
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`${event.color} text-white text-sm p-2 rounded cursor-pointer hover:opacity-80 transition-opacity`}
                        onClick={() => handleEventClick(event)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium truncate">{event.title}</div>
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(event.status)}`}></div>
                        </div>
                        <div className="text-xs opacity-90 truncate mt-1">{event.clientName}</div>
                        <div className="text-xs opacity-75 mt-1">
                          {format(event.start, "HH:mm")} - {format(event.end, "HH:mm")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderDayView = () => {
    const hours = Array.from({ length: 14 }, (_, i) => i + 7) // 7am to 9pm

    return (
      <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-gray-800">
        <div className="space-y-2">
          {hours.map((hour) => {
            const hourEvents = filteredEvents.filter(
              (event) => isSameDay(event.start, currentDate) && Number.parseInt(format(event.start, "H")) === hour,
            )

            return (
              <div key={hour} className="flex border-t border-gray-800 py-2">
                <div className="w-16 text-right pr-4 text-gray-400 text-sm font-medium">{hour}:00</div>
                <div className="flex-1 min-h-[60px] relative">
                  {hourEvents.map((event) => (
                    <div 
                      key={event.id} 
                      className={`${event.color} text-white p-3 rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity`}
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{event.title}</div>
                        <Badge variant="secondary" className="text-xs">
                          {getStatusText(event.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center text-xs mb-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {format(event.start, "HH:mm")} - {format(event.end, "HH:mm")}
                      </div>
                      <div className="flex items-center text-xs mb-1">
                        <Users className="w-3 h-3 mr-1" />
                        {event.clientName}
                      </div>
                      {event.location && (
                        <div className="flex items-center text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          {event.location} {event.isOnline && "(Online)"}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderAgendaView = () => {
    const upcomingEvents = filteredEvents
      .filter(event => event.start >= new Date())
      .sort((a, b) => a.start.getTime() - b.start.getTime())

    return (
      <div className="space-y-4">
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">No hay eventos próximos</p>
            <p className="text-sm text-gray-500">Crea tu primer evento para comenzar</p>
          </div>
        ) : (
          upcomingEvents.map((event) => (
            <div
              key={event.id}
              className={`${event.color} text-white p-3 rounded-lg cursor-pointer hover:opacity-90 transition-opacity`}
              onClick={() => handleEventClick(event)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-base truncate">{event.title}</div>
                <Badge variant="secondary" className="text-xs">
                  {getStatusText(event.status)}
                </Badge>
              </div>
              
              <div className="space-y-1 text-sm">
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-2" />
                  <span>{format(event.start, "d MMM", { locale: es })} • {format(event.start, "HH:mm")} - {format(event.end, "HH:mm")}</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-3 h-3 mr-2" />
                  <span className="truncate">{event.clientName}</span>
                </div>
                {event.location && (
                  <div className="flex items-center">
                    <MapPin className="w-3 h-3 mr-2" />
                    <span className="truncate">{event.location} {event.isOnline && "(Online)"}</span>
                  </div>
                )}
              </div>

              {event.price && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm opacity-90">${event.price}</span>
                  <div className="flex space-x-1">
                    <Button size="sm" variant="secondary" className="text-xs px-2 py-1">
                      <Video className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="secondary" className="text-xs px-2 py-1">
                      <MessageSquare className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    )
  }

  const renderView = () => {
    switch (view) {
      case "month":
        return renderMonthView()
      case "week":
        return renderWeekView()
      case "day":
        return renderDayView()
      case "agenda":
        return renderAgendaView()
      default:
        return renderWeekView()
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] text-white p-2 space-y-3">
      {/* Header móvil simplificado */}
      <div className="bg-[#1A1A1A] rounded-xl p-3 border border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold">Mi Calendario</h1>
          <Button
            onClick={() => setIsQuickEventModalOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-sm px-3 py-1"
            size="sm"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Estadísticas móviles - 2x2 grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#2A2A2A] rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-orange-500">{todayEvents.length}</div>
            <div className="text-xs text-gray-400">Hoy</div>
          </div>
          <div className="bg-[#2A2A2A] rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-green-500">{completedToday}</div>
            <div className="text-xs text-gray-400">Completados</div>
          </div>
          <div className="bg-[#2A2A2A] rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-blue-500">{upcomingEvents.length}</div>
            <div className="text-xs text-gray-400">Próximos</div>
          </div>
          <div className="bg-[#2A2A2A] rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-purple-500">
              ${filteredEvents.reduce((sum, event) => sum + (event.price || 0), 0)}
            </div>
            <div className="text-xs text-gray-400">Ingresos</div>
          </div>
        </div>
      </div>

      {/* Controles móviles simplificados */}
      <div className="bg-[#1A1A1A] rounded-xl p-3 border border-gray-800">
        {/* Navegación temporal móvil */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Button onClick={navigatePrevious} variant="outline" size="sm" className="p-2">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button onClick={navigateToday} variant="outline" size="sm" className="px-3">
              <CalendarIcon className="w-4 h-4 mr-1" />
              Hoy
            </Button>
            <Button onClick={navigateNext} variant="outline" size="sm" className="p-2">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <h2 className="text-sm font-medium text-center flex-1 mx-2">
            {view === "month" && format(currentDate, "MMM yyyy", { locale: es })}
            {view === "week" &&
              `${format(startOfWeek(currentDate), "d MMM", { locale: es })} - ${format(endOfWeek(currentDate), "d MMM", { locale: es })}`}
            {view === "day" && format(currentDate, "d MMM", { locale: es })}
            {view === "agenda" && "Próximos"}
          </h2>
        </div>

        {/* Vistas móviles - solo las más importantes */}
        <div className="flex space-x-1">
          <Button
            onClick={() => setView("agenda")}
            variant={view === "agenda" ? "default" : "outline"}
            size="sm"
            className="flex-1 text-xs"
          >
            Lista
          </Button>
          <Button
            onClick={() => setView("week")}
            variant={view === "week" ? "default" : "outline"}
            size="sm"
            className="flex-1 text-xs"
          >
            Semana
          </Button>
          <Button
            onClick={() => setView("day")}
            variant={view === "day" ? "default" : "outline"}
            size="sm"
            className="flex-1 text-xs"
          >
            Día
          </Button>
        </div>
      </div>

      {/* Contenido del calendario */}
      <div className="flex-1 overflow-y-auto">
        {renderView()}
      </div>

      {/* Modal de Quick Events */}
      <AnimatePresence>
        {isQuickEventModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setIsQuickEventModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1A1A1A] rounded-2xl w-full max-w-md border border-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <h2 className="text-xl font-bold">Crear Evento Rápido</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsQuickEventModalOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="p-6 space-y-3">
                {quickEvents.map((quickEvent) => (
                  <Button
                    key={quickEvent.title}
                    onClick={() => handleQuickEvent(quickEvent)}
                    className={`w-full justify-start p-4 h-auto ${quickEvent.color} hover:opacity-90`}
                  >
                    <div className="text-left">
                      <div className="font-medium">{quickEvent.title}</div>
                      <div className="text-sm opacity-90">{quickEvent.duration} minutos</div>
                    </div>
                  </Button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Evento */}
      <AnimatePresence>
        {isEventModalOpen && selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setIsEventModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1A1A1A] rounded-2xl w-full max-w-lg border border-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <h2 className="text-xl font-bold">{selectedEvent.title}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEventModalOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Cliente</label>
                    <div className="font-medium">{selectedEvent.clientName}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Estado</label>
                    <Badge variant="secondary">{getStatusText(selectedEvent.status)}</Badge>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Fecha</label>
                    <div className="font-medium">{format(selectedEvent.start, "EEEE d MMMM", { locale: es })}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Hora</label>
                    <div className="font-medium">{format(selectedEvent.start, "HH:mm")} - {format(selectedEvent.end, "HH:mm")}</div>
                  </div>
                  {selectedEvent.location && (
                    <div>
                      <label className="text-sm text-gray-400">Ubicación</label>
                      <div className="font-medium">{selectedEvent.location} {selectedEvent.isOnline && "(Online)"}</div>
                    </div>
                  )}
                  {selectedEvent.price && (
                    <div>
                      <label className="text-sm text-gray-400">Precio</label>
                      <div className="font-medium">${selectedEvent.price}</div>
                    </div>
                  )}
                </div>

                {selectedEvent.notes && (
                  <div>
                    <label className="text-sm text-gray-400">Notas</label>
                    <div className="bg-[#2A2A2A] p-3 rounded-lg">{selectedEvent.notes}</div>
                  </div>
                )}

                <div className="flex space-x-2 pt-4">
                  <Button className="flex-1" variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button className="flex-1" variant="outline">
                    <Video className="w-4 h-4 mr-2" />
                    Llamada
                  </Button>
                  <Button className="flex-1" variant="outline">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Mensaje
                  </Button>
                  <Button className="flex-1" variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
