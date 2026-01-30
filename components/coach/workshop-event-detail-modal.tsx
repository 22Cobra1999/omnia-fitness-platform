'use client'

import { useState, useEffect } from 'react'
import { X, Calendar as CalendarIcon, Clock, Video, FileText, Upload, Users, Trash2, Lock, Eye, RefreshCw, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { createClient } from '@/lib/supabase/supabase-client'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils/utils'

interface CalendarEvent {
  id: string
  title: string
  start_time: string
  end_time: string
  event_type: 'workshop' | 'consultation' | 'other'
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
  meet_link?: string
  meet_link_id?: string
  google_event_id?: string
  activity_id?: number
  description?: string
  notes?: string
  max_participants?: number
  current_participants?: number
}

interface WorkshopEventDetailModalProps {
  event: CalendarEvent | null
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export function WorkshopEventDetailModal({ event, isOpen, onClose, onUpdate }: WorkshopEventDetailModalProps) {
  const [loading, setLoading] = useState(false)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [editingDate, setEditingDate] = useState(false)
  const [editingTime, setEditingTime] = useState(false)
  const [editingDescription, setEditingDescription] = useState(false)

  // Estados para los campos editables
  const [eventDate, setEventDate] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [description, setDescription] = useState('')
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfFileName, setPdfFileName] = useState<string | null>(null)
  const [participants, setParticipants] = useState<Array<{ name: string; isCoach: boolean }>>([])
  const [showDeletePdfDialog, setShowDeletePdfDialog] = useState(false)
  const [deletingPdf, setDeletingPdf] = useState(false)
  const [showPdfViewer, setShowPdfViewer] = useState(false)

  // Estados para valores originales (para restaurar si se cancela sin guardar)
  const [originalEventDate, setOriginalEventDate] = useState('')
  const [originalSelectedDate, setOriginalSelectedDate] = useState<Date | undefined>(undefined)
  const [originalStartTime, setOriginalStartTime] = useState('')
  const [originalEndTime, setOriginalEndTime] = useState('')
  const [originalDescription, setOriginalDescription] = useState('')

  const supabase = createClient()

  // Cargar datos del evento y taller_detalles
  useEffect(() => {
    if (event && isOpen) {
      const start = parseISO(event.start_time)
      const end = parseISO(event.end_time)

      const dateStr = format(start, 'yyyy-MM-dd')
      const initialStartTime = format(start, 'HH:mm')
      const initialEndTime = format(end, 'HH:mm')
      const initialDescription = event.description || event.notes || ''

      // Establecer valores actuales
      setEventDate(dateStr)
      setSelectedDate(start)
      setStartTime(initialStartTime)
      setEndTime(initialEndTime)
      setDescription(initialDescription)

      // Guardar valores originales para poder restaurarlos si se cancela
      setOriginalEventDate(dateStr)
      setOriginalSelectedDate(start)
      setOriginalStartTime(initialStartTime)
      setOriginalEndTime(initialEndTime)
      setOriginalDescription(initialDescription)

      // Cargar PDF y participantes desde taller_detalles
      loadWorkshopDetails()
    }
  }, [event, isOpen])

  // Sincronizar selectedDate con eventDate cuando cambia
  useEffect(() => {
    if (selectedDate) {
      setEventDate(format(selectedDate, 'yyyy-MM-dd'))
    }
  }, [selectedDate])

  const loadWorkshopDetails = async () => {
    if (!event?.activity_id) return

    try {
      // Extraer nombre del tema del título del evento
      const topicName = event.title.replace(/^Taller:\s*/i, '').trim()

      // Obtener todos los taller_detalles activos para este actividad_id
      const { data: allTopics, error: topicsError } = await supabase
        .from('taller_detalles')
        .select('id, nombre, pdf_url, pdf_file_name, descripcion, activo')
        .eq('actividad_id', event.activity_id)
        .eq('activo', true)

      console.log('🔍 Buscando PDF para evento:', {
        activityId: event.activity_id,
        eventTitle: event.title,
        topicName: topicName,
        allTopicsFound: allTopics
      })

      if (!topicsError && allTopics && allTopics.length > 0) {
        // Buscar coincidencia exacta primero (normalizando espacios y case)
        let matchingTopic = allTopics.find((topic: any) =>
          topic.nombre?.trim() === topicName.trim()
        )

        // Si no hay coincidencia exacta, buscar case-insensitive
        if (!matchingTopic) {
          matchingTopic = allTopics.find((topic: any) =>
            topic.nombre?.toLowerCase().trim() === topicName.toLowerCase().trim()
          )
        }

        // Si aún no hay coincidencia, buscar por coincidencia parcial
        if (!matchingTopic) {
          matchingTopic = allTopics.find((topic: any) => {
            const topicNameLower = topicName.toLowerCase().trim()
            const topicNombreLower = topic.nombre?.toLowerCase().trim() || ''
            return topicNombreLower.includes(topicNameLower) ||
              topicNameLower.includes(topicNombreLower)
          })
        }

        if (matchingTopic) {
          console.log('✅ Tema encontrado:', {
            nombre: matchingTopic.nombre,
            pdfUrl: matchingTopic.pdf_url,
            pdfFileName: matchingTopic.pdf_file_name
          })
          setPdfUrl(matchingTopic.pdf_url || null)
          setPdfFileName(matchingTopic.pdf_file_name || null)
          if (matchingTopic.descripcion && !description) {
            setDescription(matchingTopic.descripcion)
          }
        } else {
          console.log('❌ No se encontró ningún tema coincidente para:', topicName)
          console.log('📋 Temas disponibles:', allTopics.map((t: any) => t.nombre))
        }
      } else if (topicsError) {
        console.error('❌ Error buscando taller_detalles:', topicsError)
      } else {
        console.log('⚠️ No se encontraron temas activos para la actividad:', event.activity_id)
      }

      // Obtener el coach_id de la actividad
      const { data: activity, error: activityError } = await supabase
        .from('activities')
        .select('coach_id')
        .eq('id', event.activity_id)
        .single()

      // Obtener participantes (clientes inscritos en este taller)
      const { data: participantes, error: participantesError } = await supabase
        .from('ejecuciones_taller')
        .select('cliente_id')
        .eq('actividad_id', event.activity_id)
        .not('cliente_id', 'is', null)

      if (!participantesError && participantes && participantes.length > 0) {
        // Obtener nombres de los perfiles
        const clientIds = participantes.map((p: any) => p.cliente_id)
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, full_name')
          .in('id', clientIds)

        if (!profilesError && profiles) {
          const coachId = activity?.coach_id
          const participantesList = profiles
            .map((p: { id: string; full_name: string | null }) => ({
              name: p.full_name || 'Sin nombre',
              isCoach: coachId && p.id === coachId
            }))
            .filter((p: { name: string; isCoach: boolean }) => p.name !== 'Sin nombre')
          setParticipants(participantesList)
        }
      } else {
        // Si no hay participantes pero hay un coach, mostrarlo
        if (activity?.coach_id) {
          const { data: coachProfile } = await supabase
            .from('user_profiles')
            .select('full_name')
            .eq('id', activity.coach_id)
            .single()

          if (coachProfile?.full_name) {
            setParticipants([{ name: coachProfile.full_name, isCoach: true }])
          }
        }
      }
    } catch (error) {
      console.error('Error cargando detalles del taller:', error)
    }
  }

  const handleSaveChanges = async () => {
    if (!event) return

    setLoading(true)
    try {
      const newStart = new Date(`${eventDate}T${startTime}:00`)
      const newEnd = new Date(`${eventDate}T${endTime}:00`)

      if (newEnd <= newStart) {
        toast.error('La hora de fin debe ser posterior a la hora de inicio')
        setLoading(false)
        return
      }

      // Actualizar calendar_events
      const { error: calendarError, data: updatedEvent } = await supabase
        .from('calendar_events')
        .update({
          start_time: newStart.toISOString(),
          end_time: newEnd.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', event.id)
        .select()
        .single()

      if (calendarError) throw calendarError

      // Si el evento tiene google_event_id, actualizarlo también en Google Calendar
      if (event.google_event_id) {
        try {
          const updateResponse = await fetch('/api/google/calendar/update-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventId: event.id,
              startTime: newStart.toISOString(),
              endTime: newEnd.toISOString(),
              title: event.title,
              description: description
            }),
            credentials: 'include'
          })

          const updateResult = await updateResponse.json()

          if (updateResponse.ok && updateResult.success) {
            console.log('✅ Evento actualizado en Google Calendar')
          } else {
            console.warn('⚠️ No se pudo actualizar en Google Calendar:', updateResult.error)
            // No fallar la operación si Google Calendar falla
          }
        } catch (googleError: any) {
          console.error('Error actualizando en Google Calendar:', googleError)
          // No fallar la operación si Google Calendar falla
        }
      }

      // Actualizar descripción en taller_detalles si existe activity_id
      if (event.activity_id) {
        const { error: tallerError } = await supabase
          .from('taller_detalles')
          .update({
            descripcion: description,
            updated_at: new Date().toISOString(),
          })
          .eq('actividad_id', event.activity_id)
          .eq('activo', true)

        if (tallerError) {
          console.warn('Error actualizando descripción en taller_detalles:', tallerError)
        }
      }

      // Actualizar los estados locales con los nuevos valores
      if (updatedEvent) {
        const updatedStart = parseISO(updatedEvent.start_time)
        const updatedEnd = parseISO(updatedEvent.end_time)
        const dateStr = format(updatedStart, 'yyyy-MM-dd')

        setEventDate(dateStr)
        setSelectedDate(updatedStart)
        setStartTime(format(updatedStart, 'HH:mm'))
        setEndTime(format(updatedEnd, 'HH:mm'))

        // Actualizar valores originales con los nuevos valores guardados
        setOriginalEventDate(dateStr)
        setOriginalSelectedDate(updatedStart)
        setOriginalStartTime(format(updatedStart, 'HH:mm'))
        setOriginalEndTime(format(updatedEnd, 'HH:mm'))
        setOriginalDescription(description)
      }

      toast.success('Cambios guardados correctamente')
      setEditingDate(false)
      setEditingTime(false)
      setEditingDescription(false)

      // Notificar al componente padre para que recargue eventos
      await onUpdate()

      // No cerrar automáticamente - dejar que el usuario cierre manualmente
    } catch (error: any) {
      console.error('Error guardando cambios:', error)
      toast.error('Error al guardar los cambios')
    } finally {
      setLoading(false)
    }
  }

  const handlePdfUpload = async (file: File) => {
    if (!event?.activity_id) {
      toast.error('No se puede subir PDF sin actividad asociada')
      return
    }

    setUploadingPdf(true)
    setUploadProgress(0)

    // Simular progreso durante la subida
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    try {
      // Obtener coach_id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        clearInterval(progressInterval)
        setUploadProgress(0)
        toast.error('No se pudo obtener el usuario')
        return
      }

      // Subir archivo a Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${event.activity_id}-${Date.now()}.${fileExt}`
      const filePath = `coaches/${user.id}/pdfs/${fileName}`

      setUploadProgress(30)
      const { error: uploadError } = await supabase.storage
        .from('product-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      setUploadProgress(70)

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('product-media')
        .getPublicUrl(filePath)

      setUploadProgress(85)

      // Extraer nombre del tema del título del evento
      const topicName = event.title.replace(/^Taller:\s*/i, '').trim()

      // Actualizar taller_detalles solo para este tema específico
      const { error: updateError } = await supabase
        .from('taller_detalles')
        .update({
          pdf_url: publicUrl,
          pdf_file_name: file.name,
          updated_at: new Date().toISOString(),
        })
        .eq('actividad_id', event.activity_id)
        .eq('nombre', topicName) // Actualizar solo el tema específico
        .eq('activo', true)

      if (updateError) throw updateError

      setUploadProgress(100)
      clearInterval(progressInterval)

      setPdfUrl(publicUrl)
      setPdfFileName(file.name)
      toast.success('PDF actualizado correctamente')

      // Esperar un momento para que el usuario vea el 100%
      setTimeout(() => {
        setUploadProgress(0)
        onUpdate()
      }, 500)
    } catch (error: any) {
      clearInterval(progressInterval)
      setUploadProgress(0)
      console.error('Error subiendo PDF:', error)
      toast.error('Error al subir el PDF')
    } finally {
      setUploadingPdf(false)
    }
  }

  const handleJoinMeeting = () => {
    if (event?.meet_link) {
      window.open(event.meet_link, '_blank')
    } else {
      toast.error('No hay enlace de reunión disponible')
    }
  }

  const handleViewPdf = () => {
    if (pdfUrl) {
      setShowPdfViewer(true)
    } else {
      toast.error('No hay PDF disponible')
    }
  }

  // URL del PDF con parámetros para deshabilitar descarga (si el servidor lo soporta)
  const getPdfViewerUrl = (url: string) => {
    // Agregar parámetros para que el visor no muestre opciones de descarga
    // Nota: Esto depende del visor de PDF del navegador
    return `${url}#toolbar=0&navpanes=0&scrollbar=1`
  }

  // Función para restaurar valores originales si se cierra sin guardar
  const restoreOriginalValues = () => {
    setEventDate(originalEventDate)
    setSelectedDate(originalSelectedDate)
    setStartTime(originalStartTime)
    setEndTime(originalEndTime)
    setDescription(originalDescription)
    setEditingDate(false)
    setEditingTime(false)
    setEditingDescription(false)
  }

  // Manejar cierre del modal - restaurar valores si no se guardaron
  const handleClose = () => {
    restoreOriginalValues()
    onClose()
  }

  const handleDeletePdf = async () => {
    if (!event?.activity_id || !pdfUrl) return

    setDeletingPdf(true)
    try {
      // Extraer nombre del tema del título del evento
      const topicName = event.title.replace(/^Taller:\s*/i, '').trim()

      // Actualizar taller_detalles para eliminar el PDF
      const { error: updateError } = await supabase
        .from('taller_detalles')
        .update({
          pdf_url: null,
          pdf_file_name: null,
          updated_at: new Date().toISOString(),
        })
        .eq('actividad_id', event.activity_id)
        .eq('nombre', topicName)
        .eq('activo', true)

      if (updateError) throw updateError

      setPdfUrl(null)
      setPdfFileName(null)
      setShowDeletePdfDialog(false)
      toast.success('PDF eliminado correctamente')
      onUpdate()
    } catch (error: any) {
      console.error('Error eliminando PDF:', error)
      toast.error('Error al eliminar el PDF')
    } finally {
      setDeletingPdf(false)
    }
  }

  if (!event || !isOpen) return null

  // Extraer nombre del tema (sin "Taller: ")
  const topicName = event.title.replace(/^Taller:\s*/i, '')
  const workshopName = 'Taller de meditación' // Esto debería venir del activity_name o similar

  // Formatear fecha en español
  const formattedDate = eventDate
    ? format(parseISO(`${eventDate}T00:00:00`), "EEEE d 'de' MMMM", { locale: es })
      .replace(/^\w/, (c) => c.toUpperCase())
    : ''

  // Formatear horario
  const formattedTime = startTime && endTime
    ? `${startTime}–${endTime} (GMT-3)`
    : ''

  const isEventPast = (() => {
    if (!eventDate || !endTime) return false
    // Simple string comparison for date might suffice if ISO 'yyyy-mm-dd' but let's be robust
    const endDateTime = new Date(`${eventDate}T${endTime}:00`)
    return endDateTime < new Date()
  })()

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="relative w-full max-w-md mx-4 rounded-xl transition-transform max-h-[85vh] flex flex-col"
        style={{ backgroundColor: '#111111' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 hover:bg-zinc-800 rounded-lg transition-colors z-10"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5 text-gray-400 hover:text-white" />
        </button>

        <div className="flex-1 overflow-y-auto p-4 px-5 pb-24">
          <div className="space-y-4">
            {/* Título y subtítulo */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white mb-0.5 leading-tight">
                    {topicName}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {workshopName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white text-black">
                  <Users className="h-3 w-3" />
                  Taller
                </span>
                {(event.max_participants || 0) > 1 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-gray-300">
                    <Users className="h-3 w-3" />
                    Grupal
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#FF7939] text-black">
                  <Globe className="h-3 w-3" />
                  Online
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-white">
                  <Users className="h-3 w-3" />
                  {participants.length}/{event.max_participants || 10}
                </span>
              </div>
            </div>

            {/* Fecha y Horario Compacto */}
            <div>
              {/* Modo Edición (Solo si no es pasado) */}
              {(!isEventPast && (editingDate || editingTime)) ? (
                <div className="space-y-2 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                  {/* Date Editor */}
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "flex-1 justify-start text-left font-normal bg-zinc-950 border-zinc-700 text-white hover:bg-zinc-800 h-8 text-xs",
                            !selectedDate && "text-gray-400"
                          )}
                        >
                          {selectedDate ? format(selectedDate, "EEEE d 'de' MMMM", { locale: es }) : <span>Seleccionar fecha</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-700" align="start">
                        <div className="p-3">
                          {/* Calendar Grid - reusing existing logic structure implicitly or simplified */}
                          <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: 35 }, (_, i) => {
                              const date = new Date(selectedDate || new Date())
                              const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
                              const startDate = new Date(firstDay); startDate.setDate(startDate.getDate() - startDate.getDay())
                              const currentDate = new Date(startDate); currentDate.setDate(startDate.getDate() + i)
                              const isSelected = selectedDate && currentDate.toDateString() === selectedDate.toDateString()
                              return (
                                <button
                                  key={i}
                                  onClick={() => { setSelectedDate(new Date(currentDate)); }}
                                  className={cn("h-7 w-7 rounded-md text-xs", isSelected && "bg-[#FF7939] text-black font-bold", !isSelected && "text-gray-400 hover:text-white")}
                                >
                                  {currentDate.getDate()}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  {/* Time Editor */}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="flex-1 h-8 bg-zinc-950 border-zinc-700 text-white text-xs" />
                    <span className="text-gray-500">-</span>
                    <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="flex-1 h-8 bg-zinc-950 border-zinc-700 text-white text-xs" />
                  </div>
                  {/* Actions */}
                  <div className="flex justify-end pt-1">
                    <Button
                      size="sm" variant="ghost" className="h-6 text-xs text-gray-400 hover:text-white"
                      onClick={() => {
                        setEditingDate(false); setEditingTime(false);
                        setStartTime(originalStartTime); setEndTime(originalEndTime); setSelectedDate(originalSelectedDate);
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                /* Modo Visualización (Pasado o Presente no editando) */
                <div
                  className={cn(
                    "flex items-center justify-between py-1 transition-colors rounded-lg",
                    !isEventPast && "cursor-pointer hover:bg-zinc-900/40 -mx-2 px-2"
                  )}
                  onClick={() => { if (!isEventPast) { setEditingDate(true); setEditingTime(true); } }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-[#FF7939]">
                      <CalendarIcon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white leading-tight">
                        {formattedDate || 'Sin fecha'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formattedTime || 'Sin horario'}
                      </span>
                    </div>
                  </div>
                  {!isEventPast && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 hover:text-white">
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Descripción del tema */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                Descripcióm
              </label>
              {editingDescription && !isEventPast ? (
                <div className="space-y-2">
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="En esta sesión trabajaremos articulaciones..."
                    className="bg-zinc-900 border-zinc-700 text-white text-sm min-h-[100px] resize-none focus-visible:ring-[#FF7939]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={() => {
                        setDescription(originalDescription)
                        setEditingDescription(false)
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white h-8"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className={`min-h-[20px] transition-colors ${!isEventPast
                    ? 'cursor-pointer p-3 -mx-3 rounded-lg hover:bg-zinc-900/50 border border-transparent hover:border-zinc-800'
                    : ''
                    }`}
                  onClick={() => !isEventPast && setEditingDescription(true)}
                >
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {description || 'Sin descripción'}
                  </p>
                </div>
              )}
            </div>

            {/* Botón Unirse a la reunión */}
            <Button
              onClick={handleJoinMeeting}
              disabled={!event.meet_link}
              className="w-full h-7 text-[10px] font-bold rounded-lg uppercase tracking-wider"
              style={{ backgroundColor: '#FF7939', color: '#000' }}
            >
              <Globe className="h-2.5 w-2.5 mr-1" />
              Unirse a la reunión
            </Button>

            {/* Sección PDF adjunto (Vista Compacta) */}
            <div>
              {pdfFileName && pdfUrl ? (
                <div className="flex items-center justify-between p-2 bg-zinc-900/50 rounded-lg border border-zinc-800">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded bg-[#FF7939]/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-3.5 w-3.5 text-[#FF7939]" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-medium text-white truncate max-w-[150px]" title={pdfFileName}>{pdfFileName}</span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-tight">Documento</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleViewPdf}
                    size="sm" variant="ghost"
                    className="h-7 px-2 text-[#FF7939] hover:bg-[#FF7939]/10 flex items-center gap-1.5"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase">Ver PDF</span>
                  </Button>
                </div>
              ) : null}
            </div>

            {/* Diálogo de confirmación para eliminar PDF */}
            <AlertDialog open={showDeletePdfDialog} onOpenChange={setShowDeletePdfDialog}>
              <AlertDialogContent className="bg-[#111111] border-zinc-800">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Eliminar PDF</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400">
                    ¿Estás seguro de que deseas eliminar el archivo "{pdfFileName}"? Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    className="bg-zinc-800 text-white hover:bg-zinc-700 border-zinc-700"
                    disabled={deletingPdf}
                  >
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeletePdf}
                    disabled={deletingPdf}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {deletingPdf ? 'Eliminando...' : 'Eliminar'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Modal de visualización de PDF */}
            {showPdfViewer && pdfUrl && (
              <div
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95"
                onClick={() => setShowPdfViewer(false)}
              >
                <div
                  className="relative w-full h-full max-w-6xl max-h-[95vh] m-4 bg-[#111111] rounded-lg border border-zinc-800 flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header del modal */}
                  <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-[#FF7939]" />
                      <h3 className="text-white font-semibold truncate">{pdfFileName}</h3>
                    </div>
                    <button
                      onClick={() => setShowPdfViewer(false)}
                      className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                      aria-label="Cerrar"
                    >
                      <X className="h-5 w-5 text-gray-400 hover:text-white" />
                    </button>
                  </div>

                  {/* Visor de PDF */}
                  <div className="flex-1 overflow-hidden">
                    <iframe
                      src={getPdfViewerUrl(pdfUrl)}
                      className="w-full h-full border-0"
                      title={pdfFileName || 'PDF'}
                      style={{
                        pointerEvents: 'auto'
                      }}
                    />
                  </div>

                  {/* Footer con advertencia */}
                  <div className="p-3 border-t border-zinc-800 bg-zinc-900/50">
                    <p className="text-xs text-gray-400 text-center">
                      Este documento es solo para visualización
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sección Participantes */}
            <div className="space-y-3 pt-2 border-t border-zinc-800">
              <h3 className="text-sm font-medium text-white">
                Participantes ({participants.filter(p => !p.isCoach).length})
              </h3>
              {participants.some(p => !p.isCoach) ? (
                <ul className="space-y-1.5">
                  {participants
                    .filter(p => !p.isCoach) // Hide coach to avoid confusion with clients
                    .map((participant, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-gray-300">
                        <span className="text-[#FF7939]">•</span>
                        <span>{participant.name}</span>
                      </li>
                    ))}
                </ul>
              ) : (
                <div className="py-2">
                  <p className="text-sm text-gray-500 font-medium italic">No hay participantes registrados</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botón Guardar cambios - Flotante */}
        {!isEventPast && (
          <div className="absolute bottom-12 right-6 z-20">
            <Button
              onClick={handleSaveChanges}
              disabled={loading}
              className="h-9 px-5 font-medium rounded-full shadow-lg"
              style={{ backgroundColor: '#FF7939', color: '#000' }}
            >
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

