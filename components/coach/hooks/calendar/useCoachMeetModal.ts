import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/supabase-client"
import { toast } from 'sonner'
import { format, parseISO, differenceInMinutes } from "date-fns"
import { CalendarEvent } from "@/components/coach/coach-calendar-screen"

export function useCoachMeetModal(coachId: string | null, onEventSuccess: () => Promise<void>) {
    const [showCreateEventModal, setShowCreateEventModal] = useState(false)
    const [createEventLoading, setCreateEventLoading] = useState(false)
    const [meetModalMode, setMeetModalMode] = useState<'create' | 'edit'>('create')
    const [editingEventId, setEditingEventId] = useState<string | null>(null)
    const [editingEventMeetLink, setEditingEventMeetLink] = useState<string | null>(null)
    const [editingEventGoogleId, setEditingEventGoogleId] = useState<string | null>(null)
    const [isMeetEditing, setIsMeetEditing] = useState(false)
    const [showDeleteMeetDialog, setShowDeleteMeetDialog] = useState(false)

    const [clientsForMeet, setClientsForMeet] = useState<any[]>([])
    const [meetParticipants, setMeetParticipants] = useState<any[]>([])
    const [newEventTitle, setNewEventTitle] = useState('')
    const [newEventNotes, setNewEventNotes] = useState('')
    const [newEventDate, setNewEventDate] = useState<string>('')
    const [newEventStartTime, setNewEventStartTime] = useState<string>('')
    const [newEventEndTime, setNewEventEndTime] = useState<string>('')
    const [selectedClientIds, setSelectedClientIds] = useState<string[]>([])
    const [newEventIsFree, setNewEventIsFree] = useState(true)
    const [newEventPrice, setNewEventPrice] = useState<string>('')
    const [showClientPicker, setShowClientPicker] = useState(false)
    const [clientSearch, setClientSearch] = useState('')
    const [newEventStatus, setNewEventStatus] = useState<'scheduled' | 'completed' | 'cancelled' | 'rescheduled'>('scheduled')

    const supabase = createClient()

    const pad2 = (n: number) => String(n).padStart(2, '0')

    const getDefaultStartTime = useCallback(() => {
        const now = new Date()
        now.setMinutes(0, 0, 0)
        now.setHours(now.getHours() + 1)
        return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`
    }, [])

    const getDefaultEndTime = useCallback((startTime: string) => {
        const [h, m] = startTime.split(':').map((v) => Number(v))
        const end = new Date()
        end.setHours(h, m || 0, 0, 0)
        end.setHours(end.getHours() + 1)
        return `${pad2(end.getHours())}:${pad2(end.getMinutes())}`
    }, [])

    const ensureClientsLoaded = useCallback(async () => {
        try {
            const res = await fetch('/api/coach/clients', { credentials: 'include' })
            const data = await res.json().catch(() => null)
            const list = Array.isArray(data?.clients) ? data.clients : []
            setClientsForMeet(
                list.map((c: any) => ({
                    id: String(c?.id || ''),
                    name: String(c?.name || 'Cliente'),
                    email: String(c?.email || ''),
                    avatar_url: c?.avatar_url || null,
                    status: c?.status,
                    meet_credits_available: Number(
                        c?.meet_credits_available ?? c?.credits_available ?? c?.available_meet_credits ?? 0
                    ),
                })).filter((c: any) => !!c.id)
            )
        } catch {
            setClientsForMeet([])
        }
    }, [])

    const openCreateEventModal = async (event?: CalendarEvent, selectedDate?: Date | null) => {
        if (event && event.event_type === 'consultation') {
            const start = parseISO(event.start_time)
            const end = parseISO(event.end_time)

            setMeetModalMode('edit')
            setEditingEventId(event.id)
            setEditingEventMeetLink(event.meet_link || null)
            setEditingEventGoogleId(event.google_event_id || null)
            setIsMeetEditing(false)

            setNewEventDate(format(start, 'yyyy-MM-dd'))
            setNewEventStartTime(format(start, 'HH:mm'))
            setNewEventEndTime(format(end, 'HH:mm'))
            setNewEventTitle(event.title || '')
            setNewEventNotes(String(event.description || ''))
            setNewEventStatus(event.status || 'scheduled')

            supabase
                .from('calendar_event_reschedule_requests')
                .select('id')
                .eq('event_id', event.id)
                .eq('status', 'accepted')
                .limit(1)
                .then(({ data }) => {
                    if (data && data.length > 0) {
                        setNewEventStatus('rescheduled')
                    }
                })

            try {
                const { data: parts, error: partsErr } = await supabase
                    .from('calendar_event_participants')
                    .select('client_id, rsvp_status, payment_status, payment_id')
                    .eq('event_id', event.id)

                if (!partsErr && Array.isArray(parts)) {
                    const ids = parts
                        .map((p: any) => String(p?.client_id || ''))
                        .filter((id: string) => !!id)

                    if (event.client_id && !ids.includes(event.client_id)) {
                        ids.push(event.client_id)
                    }

                    setSelectedClientIds(ids)
                    setMeetParticipants(
                        parts
                            .map((p: any) => ({
                                client_id: String(p?.client_id || ''),
                                rsvp_status: p?.rsvp_status,
                                payment_status: p?.payment_status,
                                payment_id: p?.payment_id ?? null,
                            }))
                            .filter((p: any) => !!p.client_id)
                    )

                    const missingIds = parts.map((p: any) => p.client_id).filter(cid => !!cid)
                    if (missingIds.length > 0) {
                        supabase.from('user_profiles').select('id, full_name, avatar_url').in('id', missingIds)
                            .then(async ({ data }: { data: any[] | null }) => {
                                if (data && data.length > 0) {
                                    let creditsMap: Record<string, number> = {}
                                    if (coachId) {
                                        const { data: ledger } = await supabase
                                            .from('client_meet_credits_ledger')
                                            .select('client_id, meet_credits_available')
                                            .eq('coach_id', coachId)
                                            .in('client_id', missingIds)

                                        if (ledger) {
                                            ledger.forEach((l: any) => {
                                                creditsMap[l.client_id] = Number(l.meet_credits_available || 0)
                                            })
                                        }
                                    }

                                    setClientsForMeet(prev => {
                                        const newClients = data.map((d: any) => ({
                                            id: d.id,
                                            name: d.full_name || 'Cliente',
                                            email: '',
                                            avatar_url: d.avatar_url,
                                            status: 'active',
                                            meet_credits_available: creditsMap[d.id] || 0
                                        }))
                                        const prevMap = new Map(prev.map((c: any) => [c.id, c]))
                                        newClients.forEach((c: any) => prevMap.set(c.id, c))
                                        return Array.from(prevMap.values())
                                    })
                                }
                            })
                    }
                }
            } catch {
                setSelectedClientIds([])
                setMeetParticipants([])
            }
            setNewEventIsFree(true)
            setNewEventPrice('')
            setShowClientPicker(false)
            setClientSearch('')
            setShowCreateEventModal(true)

            if (clientsForMeet.length === 0) ensureClientsLoaded().catch(() => { })
            return
        }

        setMeetModalMode('create')
        setEditingEventId(null)
        setEditingEventMeetLink(null)
        setEditingEventGoogleId(null)
        setIsMeetEditing(true)

        const baseDate = selectedDate || new Date()
        setNewEventDate(format(baseDate, 'yyyy-MM-dd'))
        const defaultStart = getDefaultStartTime()
        setNewEventStartTime(defaultStart)
        setNewEventEndTime(getDefaultEndTime(defaultStart))
        setNewEventTitle('')
        setNewEventNotes('')
        setSelectedClientIds([])
        setNewEventIsFree(true)
        setNewEventPrice('')
        setShowClientPicker(false)
        setClientSearch('')
        setShowCreateEventModal(true)

        if (clientsForMeet.length === 0) ensureClientsLoaded().catch(() => { })
    }

    const closeCreateEventModal = () => {
        setShowCreateEventModal(false)
        setMeetModalMode('create')
        setEditingEventId(null)
        setEditingEventMeetLink(null)
        setEditingEventGoogleId(null)
        setIsMeetEditing(false)
        setShowDeleteMeetDialog(false)
    }

    const deleteMeeting = async () => {
        if (meetModalMode !== 'edit' || !editingEventId) return
        setCreateEventLoading(true)
        try {
            const { error } = await supabase.from('calendar_events').delete().eq('id', editingEventId)
            if (error) {
                toast.error(error.message || 'No se pudo eliminar la reunión')
                return
            }
            toast.success('Reunión eliminada')
            closeCreateEventModal()
            await onEventSuccess()
        } finally {
            setCreateEventLoading(false)
        }
    }

    const handleCreateEvent = async () => {
        if (!coachId) return
        if (!newEventTitle.trim()) {
            toast.error('Ingresá un tema')
            return
        }
        if (meetModalMode === 'create' && selectedClientIds.length === 0) {
            toast.error('Seleccioná un cliente')
            return
        }
        if (!newEventDate) {
            toast.error('Seleccioná una fecha')
            return
        }

        const finalStartTime = newEventStartTime || getDefaultStartTime()
        const finalEndTime = newEventEndTime || getDefaultEndTime(finalStartTime)
        const startISO = new Date(`${newEventDate}T${finalStartTime}:00`).toISOString()
        const endISO = new Date(`${newEventDate}T${finalEndTime}:00`).toISOString()

        setCreateEventLoading(true)
        try {
            if (meetModalMode === 'edit' && editingEventId) {
                const { error: updateError } = await supabase
                    .from('calendar_events')
                    .update({
                        title: newEventTitle.trim(),
                        start_time: startISO,
                        end_time: endISO,
                        description: newEventNotes.trim() ? newEventNotes.trim() : null,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', editingEventId)

                if (updateError) {
                    toast.error(updateError.message || 'No se pudo actualizar el evento')
                    return
                }

                if (editingEventGoogleId) {
                    try {
                        await fetch('/api/google/calendar/update-event', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({
                                eventId: editingEventId,
                                startTime: startISO,
                                endTime: endISO,
                                title: newEventTitle.trim(),
                                description: newEventNotes.trim() ? newEventNotes.trim() : undefined,
                            }),
                        })
                    } catch { }
                }

                closeCreateEventModal()
                toast.success('Cambios guardados')
                await onEventSuccess()
                return
            }

            const normalizedPrice = newEventIsFree
                ? null
                : (String(newEventPrice || '').trim() ? Number(newEventPrice) : 0)

            const { data: insertedEvent, error } = await supabase
                .from('calendar_events')
                .insert({
                    coach_id: coachId,
                    created_by_user_id: coachId,
                    title: newEventTitle.trim(),
                    start_time: startISO,
                    end_time: endISO,
                    event_type: 'consultation',
                    status: 'scheduled',
                    description: newEventNotes.trim() ? newEventNotes.trim() : null,
                    pricing_data: {
                        is_free: newEventIsFree,
                        price: normalizedPrice,
                        currency: 'ARS',
                    },
                    google_meet_data: {},
                    relations_data: {},
                    timing_data: {},
                    lifecycle_data: {},
                } as any)
                .select('id')
                .maybeSingle()

            if (error || !insertedEvent?.id) {
                console.error('❌ Error creating event:', error)
                toast.error(error?.message || 'No se pudo crear el evento')
                return
            }

            const participantRows = [
                {
                    event_id: insertedEvent.id,
                    client_id: coachId,
                    rsvp_status: 'confirmed',
                    payment_status: 'free',
                    participant_role: 'coach',
                    is_host: true,
                    invited_by_role: 'coach',
                    invited_by_user_id: coachId,
                },
                ...selectedClientIds.map((clientId) => {
                    const clientData = clientsForMeet.find(c => c.id === clientId)
                    const availableCredits = clientData?.meet_credits_available || 0
                    const minutes = differenceInMinutes(parseISO(endISO), parseISO(startISO))
                    const cost = Math.ceil(minutes / 15)

                    let paymentStatus = 'unpaid'
                    if (availableCredits >= cost) {
                        paymentStatus = 'credit_deduction'
                    } else if (newEventIsFree) {
                        paymentStatus = 'free'
                    }

                    return {
                        event_id: insertedEvent.id,
                        client_id: clientId,
                        rsvp_status: 'pending',
                        payment_status: paymentStatus,
                        participant_role: 'client',
                        is_host: false,
                        invited_by_role: 'coach',
                        invited_by_user_id: coachId,
                    }
                }),
            ]

            const { error: partErr } = await supabase
                .from('calendar_event_participants')
                .upsert(participantRows as any, { onConflict: 'event_id,client_id' })

            if (partErr) {
                await supabase.from('calendar_events').delete().eq('id', insertedEvent.id)
                toast.error(partErr.message || 'No se pudo enviar la solicitud al cliente')
                return
            }

            for (const clientId of selectedClientIds) {
                const clientData = clientsForMeet.find(c => c.id === clientId)
                const availableCredits = clientData?.meet_credits_available || 0
                const minutes = differenceInMinutes(parseISO(endISO), parseISO(startISO))
                const cost = Math.ceil(minutes / 15)

                if (availableCredits > 0 && availableCredits < cost) {
                    await supabase.rpc('deduct_client_credits', {
                        p_client_id: clientId,
                        p_amount: availableCredits,
                        p_event_id: insertedEvent.id,
                        p_description: `Pago parcial reserva (Req: ${cost}, Disp: ${availableCredits})`
                    })
                }
            }

            closeCreateEventModal()
            toast.success('Evento creado')

            try {
                await fetch('/api/google/calendar/create-meet', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ eventId: insertedEvent.id }),
                })
            } catch { }

            await onEventSuccess()
        } finally {
            setCreateEventLoading(false)
        }
    }

    return {
        showCreateEventModal,
        setShowCreateEventModal,
        createEventLoading,
        meetModalMode,
        editingEventId,
        editingEventMeetLink,
        editingEventGoogleId,
        isMeetEditing,
        setIsMeetEditing,
        showDeleteMeetDialog,
        setShowDeleteMeetDialog,
        clientsForMeet,
        setClientsForMeet,
        meetParticipants,
        newEventTitle,
        setNewEventTitle,
        newEventNotes,
        setNewEventNotes,
        newEventDate,
        setNewEventDate,
        newEventStartTime,
        setNewEventStartTime,
        newEventEndTime,
        setNewEventEndTime,
        selectedClientIds,
        setSelectedClientIds,
        newEventIsFree,
        setNewEventIsFree,
        newEventPrice,
        setNewEventPrice,
        showClientPicker,
        setShowClientPicker,
        clientSearch,
        setClientSearch,
        newEventStatus,
        openCreateEventModal,
        closeCreateEventModal,
        deleteMeeting,
        handleCreateEvent,
        ensureClientsLoaded
    }
}
