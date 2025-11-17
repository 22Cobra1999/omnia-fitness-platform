'use client'

import { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/supabase-client"
import { Calendar, Clock, Video, ExternalLink, Users } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
// Google components removed - functionality to be reimplemented if needed
// import { ConnectGoogleButton } from "@/components/google/ConnectGoogleButton"
// import { MeetingJoinButton } from "@/components/google/MeetingJoinButton"
// import { EventDetailModal } from "./EventDetailModal"

interface CalendarEvent {
  id: string
  title: string
  start_time: string
  end_time: string
  event_type: 'workshop' | 'consultation' | 'other'
  status: 'scheduled' | 'completed' | 'cancelled'
  consultation_type?: string
  client_id?: string
  client_name?: string
  activity_id?: number
  product_name?: string
  // Google Meet fields
  meet_link?: string
  meet_link_id?: string
  google_event_id?: string
  attendance_tracked?: boolean
  // Additional fields for modal
  description?: string
  max_participants?: number
  current_participants?: number
  activity_name?: string
}

export default function CoachCalendarScreen() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [coachId, setCoachId] = useState<string | null>(null)
  const [googleConnected, setGoogleConnected] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)

  const supabase = createClient()

  // Verificar conexión con Google
  const checkGoogleConnection = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: tokens, error } = await supabase
        .from('google_oauth_tokens')
        .select('*')
        .eq('coach_id', user.id)
        .maybeSingle()

      // Si no hay error y hay tokens, está conectado
      setGoogleConnected(!error && !!tokens)
    } catch (error) {
      console.error('Error checking Google connection:', error)
      setGoogleConnected(false)
    }
  }, [supabase])

  // Nota: La creación de Google Meet ahora es automática al crear eventos

  // Obtener eventos del coach
  const getCoachEvents = useCallback(async () => {
    try {
      setLoading(true)

      // 1. Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      setCoachId(user.id)

      // 2. Obtener eventos del calendario del coach para el mes actual
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)

      const { data: calendarEvents, error: eventsError } = await supabase
        .from('calendar_events')
        .select(`
          id,
          title,
          start_time,
          end_time,
          event_type,
          status,
          consultation_type,
          client_id,
          activity_id,
          meet_link,
          meet_link_id,
          google_event_id,
          attendance_tracked,
          product_name,
          description,
          max_participants,
          current_participants,
          activity_name
        `)
        .eq('coach_id', user.id)
        .gte('start_time', monthStart.toISOString())
        .lte('start_time', monthEnd.toISOString())
        .order('start_time', { ascending: true })

      if (eventsError) {
        console.error("Error getting events:", eventsError)
        setEvents([])
        setLoading(false)
        return
      }

      if (calendarEvents && calendarEvents.length > 0) {
        // Obtener nombres de clientes
        const clientIds = [...new Set(calendarEvents.map(e => e.client_id).filter(Boolean))]
        let clientNames: Record<string, string> = {}

        if (clientIds.length > 0) {
          const { data: clients } = await supabase
            .from('user_profiles')
            .select('id, full_name')
            .in('id', clientIds)

          if (clients) {
            clientNames = clients.reduce((acc, client) => {
              acc[client.id] = client.full_name || 'Cliente'
              return acc
            }, {} as Record<string, string>)
          }
        }

        // Obtener nombres de actividades
        const activityIds = [...new Set(calendarEvents.map(e => e.activity_id).filter(Boolean))]
        let activityNames: Record<string, string> = {}

        if (activityIds.length > 0) {
          const { data: activities } = await supabase
            .from('activities')
            .select('id, title')
            .in('id', activityIds)

          if (activities) {
            activityNames = activities.reduce((acc, activity) => {
              acc[activity.id] = activity.title || 'Actividad'
              return acc
            }, {} as Record<string, string>)
          }
        }

        // Formatear eventos con nombres de clientes y actividades
        const formattedEvents = calendarEvents.map(event => ({
          ...event,
          client_name: event.client_id ? clientNames[event.client_id] : undefined,
          // Usar product_name de la base de datos si existe, sino fallback a activityNames
          product_name: event.product_name || (event.activity_id ? activityNames[event.activity_id] : undefined),
        }))

        // Debug: Log para verificar product_name
        console.log('📊 Eventos formateados:', formattedEvents.map(e => ({
          title: e.title,
          product_name: e.product_name,
          activity_id: e.activity_id
        })))

        setEvents(formattedEvents)
      } else {
        setEvents([])
      }

    } catch (err) {
      console.error("Error in getCoachEvents:", err)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [supabase, currentDate])

  // Generar días del mes
  const daysInMonth = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    return eachDayOfInterval({ start: monthStart, end: monthEnd })
  }, [currentDate])

  // Obtener eventos para una fecha específica
  const getEventsForDate = useCallback((date: Date) => {
    return events.filter(event =>
      isSameDay(new Date(event.start_time), date)
    )
  }, [events])

  // Efectos
  useEffect(() => {
    getCoachEvents()
    checkGoogleConnection()
  }, [getCoachEvents, checkGoogleConnection])

  // Navegar entre meses
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1))

  // Manejar click en evento
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setShowEventModal(true)
  }

  // Manejar cerrar modal
  const handleCloseModal = () => {
    setShowEventModal(false)
    setSelectedEvent(null)
  }

  // Manejar conectar Google
  const handleConnectGoogle = () => {
    checkGoogleConnection()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#121212]">
        <div className="text-white">Cargando calendario...</div>
      </div>
    )
  }

  if (!coachId) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#121212]">
        <div className="text-white">Por favor inicia sesión para ver tu calendario</div>
      </div>
    )
  }

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

  return (
    <div className="h-screen bg-[#121212] overflow-y-auto pb-20">
      <div className="p-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Mi Calendario</h1>
          <p className="text-gray-400 text-sm">Gestiona tus citas y eventos</p>
        </div>

        {/* Google Meet Integration Status */}
        {!googleConnected && (
          <div className="mb-4">
            {/* Google connection button removed - to be reimplemented if needed */}
            {/* <ConnectGoogleButton onConnected={checkGoogleConnection} /> */}
          </div>
        )}

        {/* Navegación del mes */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPreviousMonth}
            className="text-white hover:bg-zinc-800"
          >
            ←
          </Button>
          <h2 className="text-lg font-semibold text-white capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextMonth}
            className="text-white hover:bg-zinc-800"
          >
            →
          </Button>
        </div>

        {/* Calendario */}
        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardContent className="p-4">
            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-400">
                  {day}
                </div>
              ))}
            </div>

            {/* Días del mes */}
            <div className="grid grid-cols-7 gap-2">
              {daysInMonth.map(day => {
                const dayEvents = getEventsForDate(day)
                const hasEvents = dayEvents.length > 0
                const isSelected = selectedDate && isSameDay(day, selectedDate)
                const isTodayDate = isToday(day)

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      aspect-square p-2 rounded-lg text-sm font-medium transition-colors
                      ${isSelected ? 'bg-[#FF7939] text-white' : ''}
                      ${isTodayDate && !isSelected ? 'bg-zinc-800 text-white' : ''}
                      ${!isSelected && !isTodayDate ? 'text-gray-400 hover:bg-zinc-800' : ''}
                      ${hasEvents && !isSelected ? 'border border-[#FF7939]' : ''}
                    `}
                  >
                    <div>{format(day, 'd')}</div>
                    {hasEvents && (
                      <div className="flex justify-center mt-1">
                        <div className="w-1 h-1 rounded-full bg-[#FF7939]"></div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Resumen de eventos - Minimalista */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#FF7939]" />
              <span className="text-sm font-medium text-white">Resumen del Mes</span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-white font-medium">{events.length}</span>
                <span className="text-gray-400">eventos</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[#FF7939] font-medium">
                  {events.filter(e => e.status === 'scheduled').length}
                </span>
                <span className="text-gray-400">programadas</span>
              </div>
              {/* TEMPORALMENTE DESHABILITADO HASTA EJECUTAR SQL */}
              {/* 
              <div className="flex items-center gap-1">
                <span className="text-blue-400 font-medium">
                  {events.filter(e => e.meet_link).length}
                </span>
                <span className="text-gray-400">con Meet</span>
              </div>
              */}
            </div>
          </div>
        </div>

        {/* Eventos del día seleccionado */}
        {selectedDate && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">
                {format(selectedDate, "d 'de' MMMM", { locale: es })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateEvents.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">
                  No hay eventos programados para este día
                </p>
              ) : (
                <div className="space-y-1">
                  {selectedDateEvents.map(event => (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className="bg-zinc-800/60 p-2 rounded-lg border border-zinc-700/30 hover:border-[#FF7939]/40 transition-colors cursor-pointer hover:bg-zinc-800/80"
                    >
                      {/* Diseño mejorado y más limpio */}
                      <div className="space-y-3">
                        {/* Header: Producto y título */}
                        <div className="space-y-1">
                          {event.product_name && (
                            <div className="text-xs text-[#FF7939] font-medium uppercase tracking-wide">
                              {event.product_name}
                            </div>
                          )}
                          <h3 className="font-semibold text-white text-sm leading-tight">
                            {event.title}
                          </h3>
                        </div>
                        
                        {/* Info bar: Compacta y organizada */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs">
                            {/* Horario */}
                            <div className="flex items-center gap-1 text-gray-300">
                              <Clock className="h-3 w-3" />
                              <span className="font-mono">
                                {format(new Date(event.start_time), 'HH:mm')}-{format(new Date(event.end_time), 'HH:mm')}
                              </span>
                            </div>
                            
                            {/* Participantes */}
                            <div className="flex items-center gap-1 text-gray-300">
                              <Users className="h-3 w-3" />
                              <span className="font-medium">
                                {event.current_participants || 0}/{event.max_participants || 'N/A'}
                              </span>
                            </div>
                            
                            {/* Tipo */}
                            <div className="px-2 py-0.5 rounded-full bg-zinc-700 text-gray-300 text-xs font-medium">
                              {event.event_type === 'workshop' ? 'Taller' : 
                               event.event_type === 'consultation' ? 'Programa' : 
                               event.event_type === 'other' ? 'Doc' : event.event_type}
                            </div>
                          </div>
                          
                          {/* Meet Link */}
                          {event.meet_link && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                window.open(event.meet_link, '_blank')
                              }}
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 hover:bg-[#FF7939]/20 rounded-lg transition-colors"
                            >
                              <ExternalLink className="h-3 w-3 text-[#FF7939]" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Mensaje cuando no hay eventos en el mes */}
        {events.length === 0 && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6 text-center">
              <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-white font-medium mb-2">No hay eventos este mes</p>
              <p className="text-gray-400 text-sm mb-4">
                Tus citas y eventos aparecerán aquí cuando los clientes reserven
              </p>
            </CardContent>
          </Card>
        )}

        {/* Modal de detalles del evento - removed, to be reimplemented if needed */}
        {/* <EventDetailModal
          event={selectedEvent}
          isOpen={showEventModal}
          onClose={handleCloseModal}
          onConnectGoogle={handleConnectGoogle}
        /> */}
      </div>
    </div>
  )
}