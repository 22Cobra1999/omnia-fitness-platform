'use client'

import { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/supabase-client"
import { Calendar, Clock, Video, ExternalLink, Users, RefreshCw } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, addDays, subDays } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from 'sonner'
// Google components removed - functionality to be reimplemented if needed
// import { ConnectGoogleButton } from "@/components/google/ConnectGoogleButton"
// import { MeetingJoinButton } from "@/components/google/MeetingJoinButton"
import { WorkshopEventModal } from "./workshop-event-modal"
import { WorkshopEventDetailModal } from "./workshop-event-detail-modal"

interface CalendarEvent {
  id: string
  title: string
  start_time: string
  end_time: string
  event_type: 'workshop' | 'consultation' | 'other'
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
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
  notes?: string
  max_participants?: number
  current_participants?: number
  activity_name?: string
  // Google Calendar fields
  is_google_event?: boolean
  source?: string
  location?: string
  attendees?: Array<{ email: string; displayName?: string }>
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
  const [viewMode, setViewMode] = useState<'month' | 'today'>('month') // ✅ Vista: mes o hoy
  const [syncing, setSyncing] = useState(false)

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

  // Obtener eventos del coach (Omnia + Google Calendar)
  const getCoachEvents = useCallback(async () => {
    try {
      setLoading(true)

      // 1. Obtener usuario actual
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        console.error('Error obteniendo usuario:', userError)
        setLoading(false)
        setEvents([])
        return
      }

      setCoachId(user.id)

      // 2. Obtener eventos del calendario del coach para el mes actual
      // Usar UTC para evitar problemas de timezone en producción
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)
      const monthNum = currentDate.getMonth()
      const year = currentDate.getFullYear()
      
      // Asegurar que las fechas estén en formato ISO correcto
      const monthStartISO = monthStart.toISOString()
      const monthEndISO = monthEnd.toISOString()

      // Obtener eventos de Omnia
      let calendarEvents: any[] = []
      try {
        const { data, error: eventsError } = await supabase
          .from('calendar_events')
          .select(`
            id,
            title,
            start_time,
            end_time,
            event_type,
            status,
            client_id,
            activity_id,
            meet_link,
            meet_link_id,
            google_event_id,
            attendance_tracked
          `)
          .eq('coach_id', user.id)
          .gte('start_time', monthStartISO)
          .lte('start_time', monthEndISO)
          .order('start_time', { ascending: true })

        if (eventsError) {
          console.error("Error getting events from Supabase:", eventsError)
          console.warn("⚠️ Continuando sin eventos de Omnia. Intentando cargar eventos de Google Calendar...")
          calendarEvents = []
        } else {
          calendarEvents = data || []
        }
      } catch (supabaseError: any) {
        console.error("Error inesperado obteniendo eventos de Supabase:", supabaseError)
        calendarEvents = []
      }

      // Obtener eventos de Google Calendar en paralelo
      let googleEvents: CalendarEvent[] = []
      try {
        // Usar timeout para evitar que la request se cuelgue
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 segundos timeout (reducido para producción)
        
        // Construir URL absoluta para producción
        const baseUrl = typeof window !== 'undefined' 
          ? window.location.origin 
          : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        
        const googleResponse = await fetch(
          `${baseUrl}/api/google/calendar/events?monthNum=${monthNum}&year=${year}`,
          { 
            credentials: 'include',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
            },
            cache: 'no-store' // Evitar cache en producción
          }
        )
        
        clearTimeout(timeoutId)
        
        if (!googleResponse.ok) {
          // Si la respuesta no es exitosa, intentar leer el JSON para obtener el mensaje de error
          try {
            const errorData = await googleResponse.json()
            console.warn("⚠️ Error en respuesta de Google Calendar:", {
              status: googleResponse.status,
              error: errorData.error,
              needsReconnect: errorData.needsReconnect,
              connected: errorData.connected
            })
            if (errorData.needsReconnect) {
              setGoogleConnected(false)
              console.warn("⚠️ Google Calendar requiere reconexión. Ve al perfil para reconectar.")
            }
          } catch (parseError) {
            console.warn(`⚠️ Error HTTP ${googleResponse.status} obteniendo eventos de Google Calendar. El calendario continuará funcionando sin eventos de Google.`)
          }
          setGoogleConnected(false)
        } else {
          try {
            const googleData = await googleResponse.json()
            
            if (googleData.success && googleData.events) {
              googleEvents = googleData.events.map((event: any) => ({
                ...event,
                is_google_event: true,
                source: 'google_calendar',
              }))
              setGoogleConnected(true)
              console.log(`📅 Eventos de Google Calendar obtenidos: ${googleEvents.length}`)
            } else if (googleData.connected === false) {
              setGoogleConnected(false)
            } else if (googleData.needsReconnect) {
              setGoogleConnected(false)
              console.warn("⚠️ Google Calendar requiere reconexión:", googleData.error || 'Token expirado o inválido')
              // Mostrar mensaje más específico al usuario
              if (googleData.error) {
                console.error("Detalle del error:", googleData.error)
              }
            }
          } catch (jsonError) {
            console.warn("⚠️ Error parseando respuesta de Google Calendar. Continuando sin eventos de Google.")
            setGoogleConnected(false)
          }
        }
      } catch (googleError: any) {
        // Manejar diferentes tipos de errores
        if (googleError.name === 'AbortError') {
          console.warn("⏱️ Timeout obteniendo eventos de Google Calendar. El calendario continuará funcionando.")
        } else if (googleError.message?.includes('fetch')) {
          console.warn("⚠️ Error de red obteniendo eventos de Google Calendar. El calendario continuará funcionando con eventos de Omnia.")
        } else {
          console.error("❌ Error obteniendo eventos de Google Calendar:", googleError.message || googleError)
        }
        // No fallar si Google Calendar no está disponible - el calendario debe funcionar solo con eventos de Omnia
        setGoogleConnected(false)
      }

      // Combinar eventos de Omnia y Google Calendar
      let allEvents: CalendarEvent[] = []

      // Procesar eventos de Omnia
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

        // Formatear eventos de Omnia con nombres de clientes y actividades
        const formattedOmniaEvents = calendarEvents.map(event => ({
          ...event,
          client_name: event.client_id ? clientNames[event.client_id] : undefined,
          product_name: event.activity_id ? activityNames[event.activity_id] : undefined,
          is_google_event: false,
          source: 'omnia',
        }))

        allEvents = [...formattedOmniaEvents]
      }

      // Agregar eventos de Google Calendar
      allEvents = [...allEvents, ...googleEvents]

      // Ordenar todos los eventos por fecha/hora
      allEvents.sort((a, b) => {
        const dateA = new Date(a.start_time).getTime()
        const dateB = new Date(b.start_time).getTime()
        return dateA - dateB
      })

      console.log(`📊 Total eventos: ${allEvents.length} (Omnia: ${calendarEvents?.length || 0}, Google: ${googleEvents.length})`)
      setEvents(allEvents)

      // Si hay un evento seleccionado, actualizarlo con los datos frescos
      // Esto se hace después de que todos los eventos se hayan cargado
      setSelectedEvent(prevEvent => {
        if (!prevEvent) return null
        const updatedEvent = allEvents.find(e => e.id === prevEvent.id)
        return updatedEvent || prevEvent
      })

      // Crear Meets automáticamente para eventos de taller que no tienen Meet
      // Solo si Google Calendar está conectado y estamos en el cliente (no durante build)
      // Esto se desactiva durante el build para evitar timeouts
      if (
        typeof window !== 'undefined' && 
        googleConnected && 
        calendarEvents && 
        calendarEvents.length > 0
      ) {
        const eventosSinMeet = calendarEvents.filter(
          (e: any) => 
            e.event_type === 'workshop' && 
            !e.meet_link && 
            !e.google_event_id
        );

        if (eventosSinMeet.length > 0) {
          console.log(`🔗 Creando Meets automáticamente para ${eventosSinMeet.length} talleres...`);
          
          // Crear Meets en paralelo (sin bloquear la UI)
          // Usar Promise.all para evitar múltiples recargas
          Promise.all(
            eventosSinMeet.map(async (event: any) => {
              try {
                const response = await fetch('/api/google/calendar/auto-create-meet', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ eventId: event.id }),
                });

                const result = await response.json();
                if (result.success) {
                  console.log(`✅ Meet creado automáticamente para: ${event.title}`);
                  return true;
                } else {
                  console.log(`⚠️  Meet no creado para: ${event.title} - ${result.message || 'Error desconocido'}`);
                  return false;
                }
              } catch (error: any) {
                console.error(`❌ Error creando Meet para: ${event.title}`, error);
                return false;
              }
            })
          ).then((results) => {
            // Solo recargar si al menos uno fue exitoso
            if (results.some(r => r === true)) {
              setTimeout(() => {
                getCoachEvents();
              }, 2000); // Aumentado a 2 segundos para evitar loops
            }
          });
        }
      }

    } catch (err: any) {
      console.error("❌ Error in getCoachEvents:", err)
      // Mostrar error al usuario solo si es crítico
      if (err?.message?.includes('fetch') || err?.name === 'TypeError') {
        console.error("❌ Error de red al cargar eventos del calendario")
      }
      // Asegurar que siempre tengamos un array de eventos, incluso si está vacío
      // Esto previene errores de renderizado en producción
      // IMPORTANTE: En producción, el calendario debe funcionar incluso con errores
      setEvents([])
    } finally {
      // Siempre desactivar loading, incluso si hay errores
      // Esto es crítico para que la UI no se quede en estado de carga
      setLoading(false)
      console.log('✅ Loading desactivado en getCoachEvents')
    }
  }, [supabase, currentDate, googleConnected])

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
    // Cargar eventos al montar el componente
    // getCoachEvents ya maneja la obtención del usuario
    getCoachEvents()
    checkGoogleConnection()
  }, [currentDate]) // Solo recargar cuando cambia el mes

  // Efecto separado para verificar conexión de Google cuando cambia el usuario
  useEffect(() => {
    checkGoogleConnection()
  }, [checkGoogleConnection])

  // Navegar entre meses
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1))

  // Manejar click en evento
  const handleEventClick = (event: CalendarEvent) => {
    // Solo abrir modal para eventos de taller (workshop)
    if (event.event_type === 'workshop') {
      setSelectedEvent(event)
      setShowEventModal(true)
    }
  }

  const handleEventUpdate = useCallback(async () => {
    // Recargar eventos después de actualizar
    await getCoachEvents()
    
    // No actualizar selectedEvent aquí porque el modal se cerrará
    // y selectedEvent se limpiará en handleCloseModal
  }, [getCoachEvents])

  // Manejar cerrar modal
  const handleCloseModal = () => {
    setShowEventModal(false)
    // Limpiar el evento seleccionado para evitar mostrar datos antiguos
    setSelectedEvent(null)
  }

  // Manejar conectar Google
  const handleConnectGoogle = () => {
    checkGoogleConnection()
  }

  // Sincronizar con Google Calendar
  const handleSyncGoogleCalendar = async () => {
    if (!googleConnected) {
      toast.error('Google Calendar no está conectado')
      return
    }

    setSyncing(true)
    try {
      // Crear un AbortController para timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 segundos timeout

      const response = await fetch('/api/google/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || `Error ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        const errorMsg = result.errors && result.errors.length > 0 
          ? ` (${result.errors.length} errores)` 
          : ''
        toast.success(`Sincronización completada: ${result.synced || 0} eventos sincronizados${errorMsg}`)
        // Recargar eventos después de sincronizar
        await getCoachEvents()
      } else {
        toast.error(result.error || 'Error al sincronizar con Google Calendar')
      }
    } catch (error: any) {
      console.error('Error sincronizando:', error)
      if (error.name === 'AbortError') {
        toast.error('La sincronización tardó demasiado. Intenta de nuevo con menos eventos.')
      } else {
        toast.error(error.message || 'Error al sincronizar con Google Calendar')
      }
    } finally {
      setSyncing(false)
    }
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
  
  // Fecha para la vista "hoy" - usar selectedDate si existe y estamos en vista hoy, sino usar hoy
  const viewDate = viewMode === 'today' ? (selectedDate || new Date()) : new Date()
  const todayEvents = getEventsForDate(viewDate)

  // Función para cambiar la vista
  const toggleView = () => {
    if (viewMode === 'month') {
      setViewMode('today')
      if (!selectedDate) {
        setSelectedDate(new Date()) // Seleccionar hoy cuando cambiamos a vista hoy
      }
    } else {
      setViewMode('month')
    }
  }

  // Función para ir a hoy
  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
    if (viewMode === 'month') {
      setViewMode('today')
    }
  }

  // Funciones para navegar días en vista "hoy"
  const goToPreviousDay = () => {
    const newDate = subDays(viewDate, 1)
    setSelectedDate(newDate)
  }

  const goToNextDay = () => {
    const newDate = addDays(viewDate, 1)
    setSelectedDate(newDate)
  }

  // Generar horas del día (00:00 a 23:00)
  const hoursOfDay = Array.from({ length: 24 }, (_, i) => i)

  // Obtener eventos para una hora específica del día seleccionado
  const getEventsForHour = (hour: number) => {
    const dateToCheck = new Date(viewDate)
    dateToCheck.setHours(0, 0, 0, 0)
    return todayEvents.filter(event => {
      const eventDate = new Date(event.start_time)
      return eventDate.getHours() === hour && isSameDay(eventDate, viewDate)
    })
  }

  return (
    <div className="h-screen bg-[#121212] overflow-y-auto pb-20">
      <div className="p-4">
        {/* Botón de vista Hoy/Mes y Sincronizar - Centrado */}
        <div className="mb-6 flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            onClick={viewMode === 'month' ? goToToday : toggleView}
            className="text-[#FF7939] hover:bg-transparent hover:text-[#FF7939] font-light text-sm px-2 py-1 h-auto"
          >
            {viewMode === 'month' ? 'Hoy' : 'Mes'}
          </Button>
          {googleConnected && (
            <Button
              variant="ghost"
              onClick={handleSyncGoogleCalendar}
              disabled={syncing}
              className="text-[#FF7939] hover:bg-transparent hover:text-[#FF7939] font-light text-sm px-2 py-1 h-auto flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sincronizar'}
            </Button>
          )}
        </div>

        {/* Vista Mes */}
        {viewMode === 'month' && (
          <>
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
              <h2 className="text-lg font-semibold text-[#FFB366] capitalize">
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
                const googleEvents = dayEvents.filter(e => e.is_google_event || e.source === 'google_calendar')
                const omniaEvents = dayEvents.filter(e => !e.is_google_event && e.source !== 'google_calendar')
                const googleCount = googleEvents.length
                const omniaCount = omniaEvents.length
                const hasEvents = dayEvents.length > 0
                const isSelected = selectedDate && isSameDay(day, selectedDate)
                const isTodayDate = isToday(day)

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      aspect-square p-2 rounded-lg text-sm font-medium transition-colors flex flex-col items-center justify-center
                      ${isSelected ? 'bg-[#FF7939] text-white' : ''}
                      ${isTodayDate && !isSelected ? 'bg-zinc-800 text-white' : ''}
                      ${!isSelected && !isTodayDate ? 'text-gray-400 hover:bg-zinc-800' : ''}
                    `}
                  >
                    <div className="text-center">{format(day, 'd')}</div>
                    {hasEvents && (
                      <div className="flex items-center justify-center gap-1 mt-0.5">
                        {googleCount > 0 && (
                          <span className="text-[10px] font-semibold text-blue-400 leading-none">
                            {googleCount}
                          </span>
                        )}
                        {omniaCount > 0 && (
                          <span className="text-[10px] font-semibold text-[#FF7939] leading-none">
                            {omniaCount}
                          </span>
                        )}
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
              <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                  <span className="text-[#FFB366] font-medium">
                    {events.filter(e => e.is_google_event || e.source === 'google_calendar').length}
                  </span>
                  <span className="text-gray-400">Calendar</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[#FF7939] font-medium">
                    {events.filter(e => !e.is_google_event && e.source !== 'google_calendar').length}
                </span>
                  <span className="text-gray-400">Omnia</span>
              </div>
              </div>
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
                  {selectedDateEvents.map(event => {
                    const isGoogleEvent = event.is_google_event || event.source === 'google_calendar'
                    return (
                      <div
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                        className={`p-2 rounded-lg border transition-colors cursor-pointer hover:bg-zinc-800/80 ${
                          isGoogleEvent
                            ? 'bg-blue-950/30 border-blue-700/50 hover:border-blue-600/70'
                            : 'bg-zinc-800/60 border-zinc-700/30 hover:border-[#FF7939]/40'
                        }`}
                      >
                        {/* Diseño mejorado y más limpio */}
                        <div className="space-y-3">
                          {/* Header: Producto y título */}
                          <div className="space-y-1">
                            {isGoogleEvent && (
                              <div className="flex items-center gap-1 mb-1">
                                <Calendar className="h-3 w-3 text-blue-400" />
                                <div className="text-xs text-blue-400 font-medium">Google Calendar</div>
                              </div>
                            )}
                            {event.product_name && !isGoogleEvent && (
                              <div className="text-xs text-[#FF7939] font-medium uppercase tracking-wide">
                                {event.product_name}
                              </div>
                            )}
                            <h3 className="font-semibold text-white text-sm leading-tight">
                              {event.title}
                            </h3>
                            {event.location && isGoogleEvent && (
                              <div className="text-xs text-gray-400">{event.location}</div>
                            )}
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
                              
                              {/* Participantes - Solo para eventos de Omnia */}
                              {!isGoogleEvent && (
                                <div className="flex items-center gap-1 text-gray-300">
                                  <Users className="h-3 w-3" />
                                  <span className="font-medium">
                                    {event.current_participants || 0}/{event.max_participants || 'N/A'}
                                  </span>
                                </div>
                              )}
                              
                              {/* Tipo - Solo para eventos de Omnia */}
                              {!isGoogleEvent && (
                                <div className="px-2 py-0.5 rounded-full bg-zinc-700 text-gray-300 text-xs font-medium">
                                  {event.event_type === 'workshop' ? 'Taller' : 
                                   event.event_type === 'consultation' ? 'Programa' : 
                                   event.event_type === 'other' ? 'Doc' : event.event_type}
                                </div>
                              )}
                              
                              {/* Badge para eventos de Google */}
                              {isGoogleEvent && (
                                <div className="px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-300 text-xs font-medium">
                                  Google
                                </div>
                              )}
                            </div>
                            
                            {/* Meet Link - Solo mostrar si es un link válido de Google Meet */}
                            {event.meet_link && 
                             event.meet_link.includes('meet.google.com/') && 
                             !event.meet_link.includes('test-') && 
                             !event.meet_link.includes('xxx-') && (
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.open(event.meet_link, '_blank')
                                }}
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 gap-1.5 hover:bg-[#FF7939]/20 rounded-lg transition-colors text-[#FF7939]"
                                title="Abrir Google Meet"
                              >
                                <Video className="h-3.5 w-3.5" />
                                <span className="text-xs font-medium">Meet</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
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
          </>
        )}

        {/* Vista Hoy - Detalle de franja horaria */}
        {viewMode === 'today' && (
          <div className="space-y-4">
            {/* Header de hoy - Con navegación */}
            <div className="mb-6 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPreviousDay}
                className="text-white hover:bg-zinc-800"
              >
                ←
              </Button>
              <h2 className="text-lg font-semibold text-[#FFB366] capitalize">
                {format(viewDate, "EEEE, d 'de' MMMM", { locale: es })}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToNextDay}
                className="text-white hover:bg-zinc-800"
              >
                →
              </Button>
            </div>

            {/* Calendario de horas */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-0">
                {todayEvents.length === 0 ? (
                  // Vista colapsada: solo mostrar horarios clave si no hay eventos
                  <div className="divide-y divide-zinc-800">
                    {[6, 12, 18, 24].map(hour => {
                      const displayHour = hour === 24 ? 0 : hour
                      const hourStart = new Date(viewDate)
                      hourStart.setHours(displayHour, 0, 0, 0)
                      const now = new Date()
                      const isPast = hourStart < now && !isSameDay(hourStart, now) || (isSameDay(hourStart, now) && hourStart < now)
                      const isCurrentHour = isSameDay(hourStart, now) && now.getHours() === displayHour

                      return (
                        <div
                          key={hour}
                          className={`
                            min-h-[60px] p-3 flex gap-4 items-center
                            ${isPast ? 'opacity-50' : ''}
                            ${isCurrentHour ? 'bg-zinc-800/30' : ''}
                          `}
                        >
                          {/* Hora */}
                          <div className="w-16 flex-shrink-0">
                            <div className="text-sm font-medium text-gray-400">
                              {format(hourStart, 'HH:mm')}
                            </div>
                          </div>

                          {/* Sin eventos */}
                          <div className="flex-1">
                            <div className="text-xs text-gray-600">Sin eventos</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  // Vista completa: mostrar horarios clave (6am, 12pm, 6pm, 12am) más horarios de eventos
                  <div className="divide-y divide-zinc-800">
                    {(() => {
                      // Obtener horarios únicos de los eventos
                      const eventHours = new Set<number>()
                      todayEvents.forEach(event => {
                        const eventDate = new Date(event.start_time)
                        if (isSameDay(eventDate, viewDate)) {
                          eventHours.add(eventDate.getHours())
                        }
                      })

                      // Horarios clave: 6am, 12pm, 6pm, 12am (0)
                      const keyHours = [6, 12, 18, 0]
                      
                      // Combinar horarios clave con horarios de eventos, eliminar duplicados
                      const allHoursSet = new Set([...keyHours, ...eventHours])
                      
                      // Separar horarios antes y después de medianoche
                      const hoursBeforeMidnight = Array.from(allHoursSet).filter(h => h !== 0).sort((a, b) => a - b)
                      const midnight = allHoursSet.has(0) ? [0] : []
                      
                      // Ordenar: todos los horarios antes de medianoche, luego 00:00 al final
                      const allHoursOrdered = [...hoursBeforeMidnight, ...midnight]

                      return allHoursOrdered.map(hour => {
                      const hourEvents = getEventsForHour(hour)
                      const hourStart = new Date(viewDate)
                      hourStart.setHours(hour, 0, 0, 0)
                      const hourEnd = new Date(viewDate)
                      hourEnd.setHours(hour, 59, 59, 999)
                      const now = new Date()
                      const isPast = hourEnd < now && !isSameDay(hourEnd, now) || (isSameDay(hourEnd, now) && hourEnd < now)
                      const isCurrentHour = isSameDay(viewDate, now) && now.getHours() === hour
                        const isKeyHour = keyHours.includes(hour)

                      return (
                        <div
                          key={hour}
                          className={`
                            min-h-[80px] p-3 flex gap-4
                            ${isPast ? 'opacity-50' : ''}
                            ${isCurrentHour ? 'bg-zinc-800/30' : ''}
                          `}
                        >
                          {/* Hora */}
                          <div className="w-16 flex-shrink-0">
                              <div className={`text-sm font-medium ${isKeyHour ? 'text-gray-300' : 'text-gray-400'}`}>
                              {format(hourStart, 'HH:mm')}
                            </div>
                          </div>

                          {/* Eventos de esta hora */}
                          <div className="flex-1 space-y-2">
                            {hourEvents.length === 0 ? (
                              <div className="text-xs text-gray-600">Sin eventos</div>
                            ) : (
                              hourEvents.map(event => {
                                const isGoogleEvent = event.is_google_event || event.source === 'google_calendar'
                                return (
                                  <div
                                    key={event.id}
                                    onClick={() => handleEventClick(event)}
                                    className={`p-3 rounded-lg border transition-colors cursor-pointer hover:bg-zinc-800/80 ${
                                      isGoogleEvent
                                        ? 'bg-blue-950/30 border-blue-700/50 hover:border-blue-600/70'
                                        : 'bg-zinc-800/60 border-zinc-700/30 hover:border-[#FF7939]/40'
                                    }`}
                                  >
                                    <div className="space-y-2">
                                      {/* Header: Producto y título */}
                                      <div className="space-y-1">
                                        {isGoogleEvent && (
                                          <div className="flex items-center gap-1 mb-1">
                                            <Calendar className="h-3 w-3 text-blue-400" />
                                            <div className="text-xs text-blue-400 font-medium">Google Calendar</div>
                                          </div>
                                        )}
                                        {event.product_name && !isGoogleEvent && (
                                          <div className="text-xs text-[#FF7939] font-medium uppercase tracking-wide">
                                            {event.product_name}
                                          </div>
                                        )}
                                        <h3 className="font-semibold text-white text-sm leading-tight">
                                          {event.title}
                                        </h3>
                                        {event.location && isGoogleEvent && (
                                          <div className="text-xs text-gray-400">{event.location}</div>
                                        )}
                                      </div>
                                      
                                      {/* Info bar: Compacta y organizada */}
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-xs">
                                          {/* Horario completo */}
                                          <div className="flex items-center gap-1 text-gray-300">
                                            <Clock className="h-3 w-3" />
                                            <span className="font-mono">
                                              {format(new Date(event.start_time), 'HH:mm')}-{format(new Date(event.end_time), 'HH:mm')}
                                            </span>
                                          </div>
                                          
                                          {/* Participantes - Solo para eventos de Omnia */}
                                          {!isGoogleEvent && (
                                            <div className="flex items-center gap-1 text-gray-300">
                                              <Users className="h-3 w-3" />
                                              <span className="font-medium">
                                                {event.current_participants || 0}/{event.max_participants || 'N/A'}
                                              </span>
                                            </div>
                                          )}
                                          
                                          {/* Tipo - Solo para eventos de Omnia */}
                                          {!isGoogleEvent && (
                                            <div className="px-2 py-0.5 rounded-full bg-zinc-700 text-gray-300 text-xs font-medium">
                                              {event.event_type === 'workshop' ? 'Taller' : 
                                               event.event_type === 'consultation' ? 'Programa' : 
                                               event.event_type === 'other' ? 'Doc' : event.event_type}
                                            </div>
                                          )}
                                          
                                          {/* Badge para eventos de Google */}
                                          {isGoogleEvent && (
                                            <div className="px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-300 text-xs font-medium">
                                              Google
                                            </div>
                                          )}
                                        </div>
                                        
                                        {/* Meet Link - Solo mostrar si es un link válido de Google Meet */}
                                        {event.meet_link && 
                                         event.meet_link.includes('meet.google.com/') && 
                                         !event.meet_link.includes('test-') && 
                                         !event.meet_link.includes('xxx-') && (
                                          <Button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              window.open(event.meet_link, '_blank')
                                            }}
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 px-2 gap-1.5 hover:bg-[#FF7939]/20 rounded-lg transition-colors text-[#FF7939]"
                                            title="Abrir Google Meet"
                                          >
                                            <Video className="h-3.5 w-3.5" />
                                            <span className="text-xs font-medium">Meet</span>
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )
                              })
                            )}
                          </div>
                        </div>
                      )
                    })
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resumen de hoy */}
            {todayEvents.length > 0 && (
              <Card className="bg-zinc-900/50 border border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#FF7939]" />
                      <span className="text-sm font-medium text-white">Resumen de Hoy</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-blue-400 font-medium">
                          {todayEvents.filter(e => e.is_google_event || e.source === 'google_calendar').length}
                        </span>
                        <span className="text-gray-400">de calendar</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[#FF7939] font-medium">
                          {todayEvents.filter(e => !e.is_google_event && e.source !== 'google_calendar').length}
                        </span>
                        <span className="text-gray-400">eventos de omnia</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Modal para editar eventos de taller */}
        {selectedEvent && selectedEvent.event_type === 'workshop' && (
          <WorkshopEventDetailModal
            event={selectedEvent}
            isOpen={showEventModal}
            onClose={handleCloseModal}
            onUpdate={handleEventUpdate}
          />
        )}
      </div>
    </div>
  )
}