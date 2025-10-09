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
import { CoachCalendarMonthly } from "./coach-calendar-monthly"
import { createClient } from '@/lib/supabase-browser'
import { useAuth } from '../../contexts/auth-context'

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
  const { user } = useAuth()
  const supabase = createClient()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>("month")
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isQuickEventModalOpen, setIsQuickEventModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState<EventType | "all">("all")
  const [loading, setLoading] = useState(true)
  const [isUpcomingCollapsed, setIsUpcomingCollapsed] = useState(false)

  // Función para manejar el clic en una actividad
  const handleActivityClick = (activityId: string) => {
    console.log('🎯 [CoachCalendarView] Navegando a actividad:', activityId)
    
    // Guardar el activityId en localStorage para que otros componentes lo lean
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedActivityFromCalendar', activityId)
      console.log('💾 [CoachCalendarView] ActivityId guardado en localStorage:', activityId)
    }
    
    // Aquí podrías agregar navegación a una vista de detalles de la actividad
    // Por ejemplo: router.push(`/activity/${activityId}`)
  }

  // Quick event templates
  const quickEvents: QuickEvent[] = [
    { title: "Entrenamiento Personal", duration: 60, type: "session", color: "bg-green-500" },
    { title: "Evaluación Física", duration: 45, type: "assessment", color: "bg-blue-500" },
    { title: "Consulta Nutricional", duration: 30, type: "consultation", color: "bg-purple-500" },
    { title: "Seguimiento", duration: 20, type: "followup", color: "bg-orange-500" },
    { title: "Taller Grupal", duration: 90, type: "workshop", color: "bg-pink-500" },
  ]

  // Eventos reales desde la base de datos
  const [events, setEvents] = useState<Event[]>([])

  // Función para cargar eventos reales desde taller_detalles
  const loadRealEvents = async () => {
    if (!user) return

    try {
      setLoading(true)
      console.log('📅 [CoachCalendarView] Cargando eventos reales del coach')

      // Obtener actividades del coach
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('id, title, type')
        .eq('coach_id', user.id)

      if (activitiesError) {
        console.error('❌ [CoachCalendarView] Error obteniendo actividades:', activitiesError)
        return
      }

      if (!activities || activities.length === 0) {
        console.log('⚠️ [CoachCalendarView] No se encontraron actividades del coach')
        setEvents([])
        return
      }

      const activityIds = activities.map(a => a.id)

      // Obtener detalles de talleres
      const { data: tallerDetalles, error: tallerError } = await supabase
        .from('taller_detalles')
        .select('*')
        .in('actividad_id', activityIds)

      if (tallerError) {
        console.error('❌ [CoachCalendarView] Error obteniendo detalles de talleres:', tallerError)
        setEvents([])
        return
      }

      // Convertir datos de taller_detalles a eventos
      const realEvents: Event[] = []

      if (tallerDetalles && tallerDetalles.length > 0) {
        tallerDetalles.forEach(taller => {
          const actividad = activities.find(a => a.id === taller.actividad_id)
          if (!actividad) return

          // Procesar horarios originales
          if (taller.originales?.fechas_horarios && Array.isArray(taller.originales.fechas_horarios)) {
            taller.originales.fechas_horarios.forEach((horario: any, index: number) => {
              const startTime = parseISO(`${horario.fecha}T${horario.hora_inicio}:00`)
              const endTime = parseISO(`${horario.fecha}T${horario.hora_fin}:00`)
              
              realEvents.push({
                id: `original-${taller.id}-${index}`,
                title: taller.nombre || actividad.title,
                clientName: `Grupo ${taller.nombre || 'Taller'}`,
                clientId: `taller-${taller.id}`,
                start: startTime,
                end: endTime,
                type: "workshop",
                color: "bg-pink-500",
                status: "confirmed",
                notes: taller.descripcion || `Taller: ${taller.nombre}`,
                location: "Estudio",
                isOnline: false,
                productId: actividad.id.toString(),
                productName: actividad.title,
                price: 0
              })
            })
          }

        })
      }

      // Ordenar eventos por fecha
      realEvents.sort((a, b) => a.start.getTime() - b.start.getTime())
      
      setEvents(realEvents)
      console.log('✅ [CoachCalendarView] Eventos cargados:', realEvents.length)

    } catch (error) {
      console.error('❌ [CoachCalendarView] Error cargando eventos:', error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  // Cargar eventos cuando se monta el componente
  useEffect(() => {
    loadRealEvents()
  }, [user?.id])

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
    return <CoachCalendarMonthly onActivityClick={handleActivityClick} />
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
      {/* Sección Próximamente - Compacta y Colapsable */}
      <div className="bg-[#1A1A1A] rounded-xl border border-gray-800">
        <div 
          className="flex items-center justify-between p-2 cursor-pointer hover:bg-[#2A2A2A] transition-colors"
          onClick={() => setIsUpcomingCollapsed(!isUpcomingCollapsed)}
        >
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium">Próximamente</h1>
            {upcomingEvents.length > 0 && (
              <span className="bg-[#FF7939] text-white text-xs px-1.5 py-0.5 rounded-full">
                {upcomingEvents.length}
              </span>
            )}
          </div>
          <div className={`transition-transform ${isUpcomingCollapsed ? 'rotate-180' : ''}`}>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Lista compacta de próximas actividades - Colapsable */}
        {!isUpcomingCollapsed && (
          <div className="px-2 pb-2">
            {loading ? (
              <div className="text-center text-gray-400 text-xs py-2">
                Cargando...
              </div>
            ) : upcomingEvents.length > 0 ? (
              <div className="space-y-1">
                {upcomingEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className="bg-[#2A2A2A] rounded p-2 cursor-pointer hover:bg-[#3A3A3A] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium text-xs truncate">
                          {event.title}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {format(event.start, "dd/MM", { locale: es })} • {format(event.start, "HH:mm")}-{format(event.end, "HH:mm")}
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(event.status)} ml-2`}></div>
                    </div>
                  </div>
                ))}
                {upcomingEvents.length > 3 && (
                  <div className="text-center text-gray-500 text-xs py-1">
                    +{upcomingEvents.length - 3} más
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-400 text-xs py-2">
                No hay actividades próximas
              </div>
            )}
          </div>
        )}
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
