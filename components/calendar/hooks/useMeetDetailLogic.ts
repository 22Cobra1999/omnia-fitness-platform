import React from 'react'
import { format, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from "@/components/ui/use-toast"

export function useMeetDetailLogic({
    selectedMeetEvent,
    setSelectedMeetEvent,
    pendingReschedule,
    setPendingReschedule,
    selectedMeetParticipants,
    setSelectedMeetParticipants,
    coachProfiles,
    authUserId,
    setMeetEventsByDate,
    setSelectedMeetRsvpStatus,
    setSelectedMeetRsvpLoading,
    setRescheduleContext,
    handlePickCoachForMeet,
    setMeetViewMode,
    setMeetWeekStart,
    onReschedule,
    selectedStatus
}: any) {
    const supabase = createClientComponentClient()
    const { toast } = useToast()
    const [showCancelConfirm, setShowCancelConfirm] = React.useState(false)
    const [showWorkshopRescheduleWarning, setShowWorkshopRescheduleWarning] = React.useState(false)

    // Derived Data
    const effectivePendingReschedule = pendingReschedule || (selectedMeetEvent as any).pending_reschedule
    const start = new Date(selectedMeetEvent.start_time)
    const actualEventId = selectedMeetEvent.is_ghost ? selectedMeetEvent.original_event_id : selectedMeetEvent.id
    const end = selectedMeetEvent.end_time ? new Date(selectedMeetEvent.end_time) : null
    const timeLabel = `${format(start, 'HH:mm')}${end && !Number.isNaN(end.getTime()) ? ` – ${format(end, 'HH:mm')}` : ''}`
    const dateLabel = format(start, "EEEE d 'de' MMMM", { locale: es })

    // Permission checks
    const isGrupal = selectedMeetEvent.event_type === 'workshop'
    const isOwner = selectedMeetEvent.created_by_user_id === authUserId
    const isCoach = authUserId === selectedMeetEvent.coach_id

    // Status Logic
    const enrichedParticipants = React.useMemo(() => {
        const base = [...selectedMeetParticipants]
        if (selectedMeetEvent?.coach_id && !base.some(p => String(p.user_id) === String(selectedMeetEvent.coach_id))) {
            const cp = coachProfiles.find((c: any) => String(c.id) === String(selectedMeetEvent.coach_id))
            const isCoachOrganizer = !selectedMeetEvent.invited_by_user_id || String(selectedMeetEvent.invited_by_user_id) === String(selectedMeetEvent.coach_id);

            base.push({
                id: `injected-coach-${selectedMeetEvent.coach_id}`,
                user_id: selectedMeetEvent.coach_id,
                name: cp?.full_name || 'Coach',
                full_name: cp?.full_name || 'Coach',
                avatar_url: cp?.avatar_url || null,
                is_organizer: isCoachOrganizer,
                rsvp_status: isCoachOrganizer ? 'confirmed' : 'pending',
                role: 'coach'
            })
        }
        return base
    }, [selectedMeetParticipants, selectedMeetEvent, coachProfiles])

    const coachParticipant = enrichedParticipants.find(p => String(p.user_id) === String(selectedMeetEvent.coach_id))
    const isCoachAccepted = coachParticipant && ['accepted', 'confirmed'].includes(coachParticipant.rsvp_status)
    const isPendingApproval = (selectedMeetEvent.invited_by_user_id === authUserId) && !isCoachAccepted
    const hasPendingParticipants = React.useMemo(() => {
        return enrichedParticipants.some(p => p.rsvp_status === 'pending')
    }, [enrichedParticipants])

    const isConfirmed = !hasPendingParticipants

    const nowMs = Date.now()
    const startMs = start.getTime()
    const isPast = startMs < nowMs

    // Status Labels and logic
    const isCancelled = selectedMeetEvent.status === 'cancelled'
    const isRescheduled = selectedMeetEvent.status === 'rescheduled'
    const myRsvp = selectedStatus // use the passed prop

    const canEditRsvp = (Number.isFinite(startMs) && startMs > nowMs) && (
        ((startMs - nowMs) > (24 * 60 * 60 * 1000)) ||
        isPendingApproval ||
        myRsvp === 'pending'
    )

    const isMyRsvpConfirmed = ['accepted', 'confirmed'].includes(myRsvp)
    const isMyRsvpDeclined = myRsvp === 'declined'

    const timingStatusLabel = React.useMemo(() => {
        if (isCancelled) return { label: 'Cancelada', color: 'text-red-400 bg-red-500/10 border-red-500/20' }
        if (isPast) return { label: 'Finalizada', color: 'text-gray-400 bg-white/5 border-white/10' }
        if (effectivePendingReschedule?.status === 'pending') return { label: 'Cambio Solicitado', color: 'text-red-400 bg-red-500/10 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]' }
        if (isRescheduled) return { label: 'Reprogramada', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' }

        if (myRsvp === 'declined' || myRsvp === 'cancelled') return { label: 'Rechazada', color: 'text-red-400 bg-red-500/10 border-red-500/20' }

        if (hasPendingParticipants || myRsvp === 'pending') {
            return { label: 'Pendiente', color: 'text-[#FFB366] bg-[#FFB366]/10 border-[#FFB366]/20' }
        }

        return { label: 'Confirmada', color: 'text-[#FF7939] bg-[#FF7939]/10 border-[#FF7939]/20 shadow-[0_0_15px_rgba(255,121,57,0.15)]' }
    }, [isCancelled, isPast, effectivePendingReschedule, isRescheduled, myRsvp, hasPendingParticipants])

    // Finding host
    const hostParticipant = React.useMemo(() => {
        return enrichedParticipants.find(p => String(p.user_id) === String(selectedMeetEvent.invited_by_user_id)) ||
            enrichedParticipants.find(p => p.is_organizer === true) ||
            enrichedParticipants[0]
    }, [enrichedParticipants, selectedMeetEvent])

    // Persistence Actions
    const loadMeet = async () => {
        try {
            console.log('[useMeetDetailLogic] Refreshing meet data for:', actualEventId);
            const { data, error } = await supabase
                .from('calendar_events')
                .select(`
                    id,
                    title,
                    description,
                    start_time,
                    end_time,
                    status,
                    event_type,
                    meet_link,
                    coach_id,
                    created_by_user_id,
                    price,
                    currency,
                    is_free,
                    meet_participants:calendar_event_participants (
                        user_id,
                        rsvp_status,
                        payment_status,
                        is_organizer,
                        is_creator,
                        role,
                        invited_by_user_id,
                        user_profiles (
                            id,
                            full_name,
                            avatar_url
                        )
                    )
                `)
                .eq('id', actualEventId)
                .single();

            if (error) throw error;

            const mappedParticipants = (data.meet_participants || []).map((p: any) => ({
                id: p.user_id,
                user_id: p.user_id,
                name: p.user_profiles?.full_name || 'Usuario',
                avatar_url: p.user_profiles?.avatar_url,
                rsvp_status: p.rsvp_status,
                payment_status: p.payment_status,
                is_organizer: p.is_organizer || p.is_creator,
                role: p.role || (String(p.user_id) === String(data.coach_id) ? 'coach' : 'client'),
                invited_by_user_id: p.invited_by_user_id
            }));

            setSelectedMeetParticipants(mappedParticipants);
            setSelectedMeetEvent((prev: any) => ({
                ...prev,
                ...data,
                meet_participants: mappedParticipants
            }));
        } catch (e) {
            console.error('[useMeetDetailLogic] Error refreshing meet data:', e);
        }
    }

    const updateMeetStatus = async (eventId: string, newStatus: string) => {
        try {
            console.log('[useMeetDetailLogic] updateMeetStatus called:', eventId, newStatus)
            const { error: partError } = await (supabase
                .from('calendar_event_participants') as any)
                .update({ rsvp_status: newStatus })
                .eq('event_id', eventId)
                .eq('user_id', authUserId)

            if (partError) throw partError

            if (newStatus === 'accepted' && !isGrupal) {
                const { error: eventError } = await supabase
                    .from('calendar_events')
                    .update({ status: 'confirmed' })
                    .eq('id', eventId)
                if (eventError) throw eventError
                setSelectedMeetEvent((prev: any) => ({ ...prev, status: 'confirmed' }))
            }

            setSelectedMeetRsvpStatus(newStatus)
        } catch (e) {
            console.error('[useMeetDetailLogic] CRITICAL Error updating meet status:', e)
            toast({
                variant: "destructive",
                title: "Error actualizando estado",
                description: "No se pudo actualizar tu asistencia. Intentalo de nuevo.",
            })
            throw e
        }
    }

    const safeHandleAcceptReschedule = async () => {
        if (!effectivePendingReschedule || !selectedMeetEvent) return
        try {
            setSelectedMeetRsvpLoading(true)
            const { error: reqErr } = await (supabase
                .from('calendar_event_reschedule_requests') as any)
                .update({ status: 'accepted' })
                .eq('id', effectivePendingReschedule.id)
            if (reqErr) throw reqErr

            const { error: evtErr } = await (supabase
                .from('calendar_events') as any)
                .update({
                    start_time: effectivePendingReschedule.to_start_time,
                    end_time: effectivePendingReschedule.to_end_time,
                    status: 'confirmed'
                })
                .eq('id', actualEventId)
            if (evtErr) throw evtErr

            const startDt = new Date(effectivePendingReschedule.to_start_time)
            const oldStartDt = new Date(effectivePendingReschedule.from_start_time)
            const newKey = format(startDt, 'yyyy-MM-dd')
            const oldKey = format(oldStartDt, 'yyyy-MM-dd')

            setMeetEventsByDate((prev: any) => {
                const updatedMap = { ...prev }
                if (updatedMap[oldKey]) {
                    updatedMap[oldKey] = updatedMap[oldKey].filter((e: any) => String(e.id) !== String(actualEventId))
                }
                const updatedEvent = {
                    ...selectedMeetEvent,
                    start_time: effectivePendingReschedule.to_start_time,
                    end_time: effectivePendingReschedule.to_end_time,
                    status: 'rescheduled'
                }
                updatedMap[newKey] = [...(updatedMap[newKey] || []), updatedEvent]
                return updatedMap
            })

            setPendingReschedule((prev: any) => prev ? { ...prev, status: 'accepted' } : null)

            toast({
                title: "Cambio aceptado",
                description: "La reunión se ha reprogramado correctamente.",
            })

            setSelectedMeetEvent(null)
        } catch (e) {
            console.error('Error accepting reschedule:', e)
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo aceptar el cambio.",
            })
        } finally {
            setSelectedMeetRsvpLoading(false)
        }
    }

    const safeHandleDeclineReschedule = async () => {
        if (!effectivePendingReschedule) return
        try {
            setSelectedMeetRsvpLoading(true)
            const { error } = await (supabase
                .from('calendar_event_reschedule_requests') as any)
                .update({ status: 'declined' })
                .eq('id', effectivePendingReschedule.id)
            if (error) throw error

            setPendingReschedule((prev: any) => prev ? { ...prev, status: 'declined' } : null)
            toast({
                title: "Cambio rechazado",
                description: "Se ha mantenido el horario original.",
            })
        } catch (e) {
            console.error('Error declining reschedule:', e)
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo rechazar el cambio.",
            })
        } finally {
            setSelectedMeetRsvpLoading(false)
        }
    }

    const handleAccept = async () => {
        try {
            setSelectedMeetRsvpLoading(true)
            await updateMeetStatus(String(actualEventId), 'accepted')
            toast({
                title: "¡Estás dentro!",
                description: "Has confirmado tu asistencia a la reunión.",
                className: "border-orange-500/20 bg-orange-500/10 text-orange-500"
            })
            setSelectedMeetEvent(null)
        } catch (e) {
            // Error handled in updateMeetStatus
        } finally {
            setSelectedMeetRsvpLoading(false)
        }
    }

    const handleDecline = async () => {
        try {
            setSelectedMeetRsvpLoading(true)
            await updateMeetStatus(String(actualEventId), 'declined')
            toast({
                title: "Asistencia rechazada",
                description: "Has indicado que no asistirás a esta reunión.",
            })
            setSelectedMeetEvent(null)
        } catch (e) {
            // Error handled in updateMeetStatus
        } finally {
            setSelectedMeetRsvpLoading(false)
        }
    }

    const confirmCancel = async () => {
        try {
            setSelectedMeetRsvpLoading(true)

            if (!isConfirmed && !isGrupal) {
                console.log('[useMeetDetailLogic] Unconfirmed meet, performing HARD DELETE')
                const { error: deleteError } = await supabase
                    .from('calendar_events')
                    .delete()
                    .eq('id', actualEventId)

                if (deleteError) throw deleteError

                toast({
                    title: "Meet eliminada",
                    description: "La invitación ha sido eliminada correctamente.",
                })
            } else {
                await updateMeetStatus(String(actualEventId), 'declined')

                if (!isGrupal && authUserId) {
                    const { error: eventError } = await supabase
                        .from('calendar_events')
                        .update({
                            status: 'cancelled',
                            cancelled_by_user_id: authUserId,
                            cancelled_at: new Date().toISOString()
                        } as any)
                        .eq('id', actualEventId)

                    if (eventError) console.error('Error cancelling event:', eventError)
                }

                toast({
                    title: "Asistencia cancelada",
                    description: "Hemos actualizado tu estado para esta reunión.",
                })
            }

            setSelectedMeetEvent(null)
            setShowCancelConfirm(false)
        } catch (e) {
            // Error handled in updateMeetStatus
        } finally {
            setSelectedMeetRsvpLoading(false)
        }
    }

    const handleRescheduleClick = () => {
        if (isGrupal && onReschedule) {
            setShowWorkshopRescheduleWarning(true)
        } else if (onReschedule) {
            onReschedule(selectedMeetEvent)
        } else {
            handleSuggestNewTime()
        }
    }

    const handleSuggestNewTime = () => {
        if (onReschedule) {
            onReschedule(selectedMeetEvent)
            return
        }

        if (!selectedMeetEvent?.coach_id) return
        const durationMinutes = (() => {
            const a = new Date(selectedMeetEvent.start_time).getTime()
            const b = selectedMeetEvent.end_time ? new Date(selectedMeetEvent.end_time).getTime() : NaN
            if (!Number.isFinite(a) || !Number.isFinite(b)) return 60
            const mins = Math.round((b - a) / 60000)
            return mins > 0 ? mins : 60
        })()

        setRescheduleContext({
            eventId: String(actualEventId),
            coachId: String(selectedMeetEvent.coach_id),
            fromStart: String(selectedMeetEvent.start_time),
            fromEnd: selectedMeetEvent.end_time ? String(selectedMeetEvent.end_time) : null,
            durationMinutes,
            requestId: effectivePendingReschedule?.id || null,
            requestedByUserId: effectivePendingReschedule?.requested_by_user_id || null,
            snapshot: {
                id: String(actualEventId),
                title: selectedMeetEvent.title ?? null,
                start_time: String(selectedMeetEvent.start_time),
                end_time: selectedMeetEvent.end_time ? String(selectedMeetEvent.end_time) : null,
                coach_id: selectedMeetEvent.coach_id ? String(selectedMeetEvent.coach_id) : null,
                meet_link: selectedMeetEvent.meet_link ? String(selectedMeetEvent.meet_link) : null,
                description: selectedMeetEvent.description ?? null,
            },
        })

        handlePickCoachForMeet(String(selectedMeetEvent.coach_id))
        setMeetViewMode('week')
        setMeetWeekStart(startOfWeek(start, { weekStartsOn: 1 }))
        setSelectedMeetEvent(null)
    }

    return {
        effectivePendingReschedule,
        timeLabel,
        dateLabel,
        isGrupal,
        isOwner,
        isCoach,
        enrichedParticipants,
        isPendingApproval,
        isConfirmed,
        hostParticipant,
        showCancelConfirm,
        setShowCancelConfirm,
        showWorkshopRescheduleWarning,
        setShowWorkshopRescheduleWarning,
        loadMeet,
        safeHandleAcceptReschedule,
        safeHandleDeclineReschedule,
        handleAccept,
        handleDecline,
        confirmCancel,
        handleRescheduleClick,
        handleSuggestNewTime,
        isCancelled,
        isRescheduled,
        isPast,
        isWorkshop: isGrupal,
        myRsvp,
        canEditRsvp,
        timingStatusLabel,
        isMyRsvpConfirmed,
        isMyRsvpDeclined,
        actualEventId,
        start
    }
}
