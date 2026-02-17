'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/supabase-client'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

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

interface UseWorkshopDetailLogicProps {
    event: CalendarEvent | null
    isOpen: boolean
    onClose: () => void
    onUpdate: () => void
}

export function useWorkshopDetailLogic({ event, isOpen, onClose, onUpdate }: UseWorkshopDetailLogicProps) {
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
                    setPdfUrl(matchingTopic.pdf_url || null)
                    setPdfFileName(matchingTopic.pdf_file_name || null)
                    if (matchingTopic.descripcion && !description) {
                        setDescription(matchingTopic.descripcion)
                    }
                }
            }

            // Obtener el coach_id de la actividad
            const { data: activity } = await supabase
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
            } else if (activity?.coach_id) {
                // Si no hay participantes pero hay un coach, mostrarlo
                const { data: coachProfile } = await supabase
                    .from('user_profiles')
                    .select('full_name')
                    .eq('id', activity.coach_id)
                    .single()

                if (coachProfile?.full_name) {
                    setParticipants([{ name: coachProfile.full_name, isCoach: true }])
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
                    await fetch('/api/google/calendar/update-event', {
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
                } catch (googleError) {
                    console.error('Error actualizando en Google Calendar:', googleError)
                }
            }

            // Actualizar descripción en taller_detalles si existe activity_id
            if (event.activity_id) {
                await supabase
                    .from('taller_detalles')
                    .update({
                        descripcion: description,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('actividad_id', event.activity_id)
                    .eq('activo', true)
            }

            // Actualizar los estados locales
            if (updatedEvent) {
                const updatedStart = parseISO(updatedEvent.start_time)
                const updatedEnd = parseISO(updatedEvent.end_time)
                const dateStr = format(updatedStart, 'yyyy-MM-dd')

                setEventDate(dateStr)
                setSelectedDate(updatedStart)
                setStartTime(format(updatedStart, 'HH:mm'))
                setEndTime(format(updatedEnd, 'HH:mm'))

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

            await onUpdate()
        } catch (error) {
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

        const progressInterval = setInterval(() => {
            setUploadProgress(prev => (prev >= 90 ? 90 : prev + 10))
        }, 200)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                clearInterval(progressInterval)
                setUploadProgress(0)
                toast.error('No se pudo obtener el usuario')
                return
            }

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
            const { data: { publicUrl } } = supabase.storage.from('product-media').getPublicUrl(filePath)

            setUploadProgress(85)
            const topicName = event.title.replace(/^Taller:\s*/i, '').trim()

            const { error: updateError } = await supabase
                .from('taller_detalles')
                .update({
                    pdf_url: publicUrl,
                    pdf_file_name: file.name,
                    updated_at: new Date().toISOString(),
                })
                .eq('actividad_id', event.activity_id)
                .eq('nombre', topicName)
                .eq('activo', true)

            if (updateError) throw updateError

            setUploadProgress(100)
            clearInterval(progressInterval)

            setPdfUrl(publicUrl)
            setPdfFileName(file.name)
            toast.success('PDF actualizado correctamente')

            setTimeout(() => {
                setUploadProgress(0)
                onUpdate()
            }, 500)
        } catch (error) {
            clearInterval(progressInterval)
            setUploadProgress(0)
            console.error('Error subiendo PDF:', error)
            toast.error('Error al subir el PDF')
        } finally {
            setUploadingPdf(false)
        }
    }

    const handleDeletePdf = async () => {
        if (!event?.activity_id || !pdfUrl) return

        setDeletingPdf(true)
        try {
            const topicName = event.title.replace(/^Taller:\s*/i, '').trim()

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
        } catch (error) {
            console.error('Error eliminando PDF:', error)
            toast.error('Error al eliminar el PDF')
        } finally {
            setDeletingPdf(false)
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

    const getPdfViewerUrl = (url: string) => `${url}#toolbar=0&navpanes=0&scrollbar=1`

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

    const handleClose = () => {
        restoreOriginalValues()
        onClose()
    }

    // Derived data
    const topicName = event?.title?.replace(/^Taller:\s*/i, '') || ''
    const workshopName = 'Taller' // This could be improved if we had activity_name

    const formattedDate = eventDate
        ? format(parseISO(`${eventDate}T00:00:00`), "EEEE d 'de' MMMM", { locale: es })
            .replace(/^\w/, (c) => c.toUpperCase())
        : ''

    const formattedTime = startTime && endTime ? `${startTime}–${endTime} (GMT-3)` : ''

    const isEventPast = (() => {
        if (!eventDate || !endTime) return false
        const endDateTime = new Date(`${eventDate}T${endTime}:00`)
        return endDateTime < new Date()
    })()

    return {
        loading,
        uploadingPdf,
        uploadProgress,
        editingDate,
        setEditingDate,
        editingTime,
        setEditingTime,
        editingDescription,
        setEditingDescription,
        eventDate,
        selectedDate,
        setSelectedDate,
        startTime,
        setStartTime,
        endTime,
        setEndTime,
        description,
        setDescription,
        pdfUrl,
        pdfFileName,
        participants,
        showDeletePdfDialog,
        setShowDeletePdfDialog,
        deletingPdf,
        showPdfViewer,
        setShowPdfViewer,
        handleSaveChanges,
        handlePdfUpload,
        handleDeletePdf,
        handleJoinMeeting,
        handleViewPdf,
        getPdfViewerUrl,
        handleClose,
        topicName,
        workshopName,
        formattedDate,
        formattedTime,
        isEventPast
    }
}
