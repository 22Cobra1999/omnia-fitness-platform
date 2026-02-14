
import React from 'react'
import { format, startOfWeek, isToday } from 'date-fns'
// ... existing log logic ...
import { es } from 'date-fns/locale'
import { Calendar as CalendarIcon, Globe, RotateCcw, X, Video, AlertTriangle } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from "@/components/ui/use-toast"
import { MeetDetailHeader } from './components/meet-detail/MeetDetailHeader'
import { MeetDetailInfo } from './components/meet-detail/MeetDetailInfo'
import { MeetDetailParticipants } from './components/meet-detail/MeetDetailParticipants'
import { MeetDetailActions } from './components/meet-detail/MeetDetailActions'
import { MeetDetailConfirmations } from './components/meet-detail/MeetDetailConfirmations'

// Interface for dependencies passed from parent
interface MeetDetailModalProps {
    selectedMeetEvent: any
    setSelectedMeetEvent: (event: any | null) => void
    pendingReschedule: any
    setPendingReschedule: React.Dispatch<React.SetStateAction<any>>
    selectedMeetParticipants: any[]
    coachProfiles: any[]
    authUserId: string | null

    // State from parent for updates
    meetEventsByDate: any
    setMeetEventsByDate: React.Dispatch<React.SetStateAction<any>>

    selectedMeetRsvpStatus: string
    setSelectedMeetRsvpStatus: (status: string) => void

    selectedMeetRsvpLoading: boolean
    setSelectedMeetRsvpLoading: (loading: boolean) => void

    // For Reschedule Context
    setRescheduleContext: (ctx: any) => void
    handlePickCoachForMeet: (coachId: string) => void
    setMeetViewMode: (mode: 'month' | 'week' | 'day_split') => void
    setMeetWeekStart: (date: Date) => void

    // Optional: New reschedule handler
    onReschedule?: (meet: any) => void
    onCancelRescheduleRequest?: (eventId: string) => Promise<void>
}

export function MeetDetailModal({
    selectedMeetEvent,
    setSelectedMeetEvent,
    pendingReschedule,
    setPendingReschedule,
    selectedMeetParticipants,
    coachProfiles,
    authUserId,
    setMeetEventsByDate,
    selectedMeetRsvpStatus,
    setSelectedMeetRsvpStatus,
    selectedMeetRsvpLoading,
    setSelectedMeetRsvpLoading,
    setRescheduleContext,
    handlePickCoachForMeet,
    setMeetViewMode,
    setMeetWeekStart,
    onReschedule,
    onCancelRescheduleRequest
}: MeetDetailModalProps) {
    const supabase = createClientComponentClient()
    const { toast } = useToast()
    const [showCancelConfirm, setShowCancelConfirm] = React.useState(false)
    const [showWorkshopRescheduleWarning, setShowWorkshopRescheduleWarning] = React.useState(false)

    // Logic extracted from IIFE
    const effectivePendingReschedule = pendingReschedule || (selectedMeetEvent as any).pending_reschedule
    const start = new Date(selectedMeetEvent.start_time)
    const actualEventId = selectedMeetEvent.is_ghost ? selectedMeetEvent.original_event_id : selectedMeetEvent.id
    const end = selectedMeetEvent.end_time ? new Date(selectedMeetEvent.end_time) : null
    const timeLabel = `${format(start, 'HH:mm')}${end && !Number.isNaN(end.getTime()) ? ` – ${format(end, 'HH:mm')}` : ''}`
    const dateLabel = format(start, "EEEE d 'de' MMMM", { locale: es })
    const coachProfile = coachProfiles.find((c) => c.id === String(selectedMeetEvent.coach_id))

    const nowMs = Date.now()
    const startMs = start.getTime()

    // Determine if the meet is pending coach approval (Created by me + Coach hasn't accepted yet)
    const enrichedParticipants = [...selectedMeetParticipants]
    if (selectedMeetEvent?.coach_id && !enrichedParticipants.some(p => String(p.user_id) === String(selectedMeetEvent.coach_id))) {
        const cp = coachProfiles.find(c => String(c.id) === String(selectedMeetEvent.coach_id))
        enrichedParticipants.push({
            id: `injected-coach-${selectedMeetEvent.coach_id}`,
            user_id: selectedMeetEvent.coach_id,
            name: cp?.full_name || 'Coach',
            full_name: cp?.full_name || 'Coach',
            avatar_url: cp?.avatar_url || null,
            is_organizer: false,
            rsvp_status: 'pending'
        })
    }

    const coachParticipant = enrichedParticipants.find(p => String(p.user_id) === String(selectedMeetEvent.coach_id))
    const isCoachAccepted = coachParticipant && ['accepted', 'confirmed'].includes(coachParticipant.rsvp_status)
    const isPendingApproval = (selectedMeetEvent.invited_by_user_id === authUserId) && !isCoachAccepted

    // Allow edit if:
    // 1. Time > 24 hours
    // 2. OR it's a pending request I sent that hasn't been accepted yet (no confirmed commitment/cost yet)
    const canEditRsvp = (Number.isFinite(startMs) && (startMs - nowMs) > (24 * 60 * 60 * 1000)) || isPendingApproval

    // NOTE: isConfirmed/isDeclined logic here refers to the EVENT status for display, 
    // but we also have local user RSVP status logic for actions.
    // The 'status' field on event might be 'scheduled', 'cancelled', 'rescheduled'.
    const isCancelled = selectedMeetEvent.status === 'cancelled'
    const isRescheduled = selectedMeetEvent.status === 'rescheduled'

    // User's personal status
    const myRsvp = selectedMeetRsvpStatus

    const isPast = startMs < nowMs
    const isWorkshop = selectedMeetEvent.event_type === 'workshop'
    const isGrupal = (selectedMeetEvent.max_participants && selectedMeetEvent.max_participants > 1) || isWorkshop || selectedMeetParticipants.length > 2

    // Helper to update RSVP in DB and locally
    const updateMeetStatus = async (eventId: string, newStatus: string) => {
        console.log('[MeetDetailModal] updateMeetStatus START', { eventId, newStatus, authUserId })
        try {
            if (!authUserId) {
                console.warn('[MeetDetailModal] No authUserId, aborting')
                return
            }

            console.log('[MeetDetailModal] Calling RPC update_rsvp_and_credits...')
            const { data: rpcData, error: rpcError } = await supabase.rpc('update_rsvp_and_credits', {
                p_event_id: eventId,
                p_user_id: authUserId,
                p_status: newStatus
            })

            if (rpcError) {
                console.error('[MeetDetailModal] RPC FAILED:', rpcError)
                throw rpcError
            }
            console.log('[MeetDetailModal] RPC SUCCESS. Result:', rpcData)

            // Show toast for credit refund
            if (rpcData && rpcData.credits_returned > 0) {
                toast({
                    title: "Crédito devuelto",
                    description: "Has recuperado 1 crédito por cancelar con anticipación.",
                    className: "border-green-500/20 bg-green-500/10 text-green-500"
                })
            } else if (newStatus === 'declined' || newStatus === 'cancelled') {
                // Late cancellation -> Lost credit warning toast was already shown? No, this is result.
                // Maybe show "No se devolvió el crédito" if expected?
                // Let's keep it simple: only positive feedback for refund.
            }

            // IF ACCEPTING, ALSO ENSURE EVENT IS NOT CANCELLED
            if ((newStatus === 'accepted' || newStatus === 'confirmed') && selectedMeetEvent.status === 'cancelled') {
                // Try to un-cancel event in DB
                const { error: revError } = await (supabase.from('calendar_events') as any)
                    .update({
                        status: 'confirmed', // or scheduled
                        lifecycle_data: {
                            ...selectedMeetEvent.lifecycle_data,
                            cancelled_at: null,
                            cancelled_by: null
                        }
                    })
                    .eq('id', eventId)

                if (revError) console.error('Error reviving event:', revError)
            }

            console.log('[MeetDetailModal] Updating local state...')
            const dateKey = format(start, 'yyyy-MM-dd')
            setMeetEventsByDate((prev: any) => {
                const dayEvents = prev[dateKey] || []
                return {
                    ...prev,
                    [dateKey]: dayEvents.map((e: any) => (e.id === actualEventId || e.original_event_id === actualEventId)
                        ? {
                            ...e,
                            rsvp_status: newStatus,
                            // If reviving, update status locally too
                            status: (newStatus === 'accepted' || newStatus === 'confirmed') && e.status === 'cancelled' ? 'confirmed' : e.status
                        }
                        : e
                    )
                }
            })
            if ((newStatus === 'accepted' || newStatus === 'confirmed') && selectedMeetEvent.status === 'cancelled') {
                // Update modal state immediately
                setSelectedMeetEvent((prev: any) => ({ ...prev, status: 'confirmed' }))
            }

            setSelectedMeetRsvpStatus(newStatus)
            console.log('[MeetDetailModal] Local state updated.')
        } catch (e) {
            console.error('[MeetDetailModal] CRITICAL Error updating meet status:', e)
            toast({
                variant: "destructive",
                title: "Error actualizando estado",
                description: "No se pudo actualizar tu asistencia. Intentalo de nuevo. (Revisa la consola)",
            })
            throw e
        }
    }


    const handleRescheduleClick = () => {
        if (isWorkshop && onReschedule) {
            setShowWorkshopRescheduleWarning(true)
        } else if (onReschedule) {
            onReschedule(selectedMeetEvent)
        } else {
            handleSuggestNewTime()
        }
    }

    // Rewrite safe handleAcceptReschedule for toast
    const safeHandleAcceptReschedule = async () => {
        if (!pendingReschedule || !selectedMeetEvent) return
        try {
            setSelectedMeetRsvpLoading(true)
            const { error: reqErr } = await (supabase
                .from('calendar_event_reschedule_requests') as any)
                .update({ status: 'accepted' })
                .eq('id', pendingReschedule.id)
            if (reqErr) throw reqErr

            const { error: evtErr } = await (supabase
                .from('calendar_events') as any)
                .update({
                    start_time: pendingReschedule.to_start_time,
                    end_time: pendingReschedule.to_end_time,
                    status: 'confirmed'
                })
                .eq('id', actualEventId)
            if (evtErr) throw evtErr

            // Local state update
            const startDt = new Date(pendingReschedule.to_start_time)
            const oldStartDt = new Date(pendingReschedule.from_start_time)
            const newKey = format(startDt, 'yyyy-MM-dd')
            const oldKey = format(oldStartDt, 'yyyy-MM-dd')

            setMeetEventsByDate((prev: any) => {
                const updatedMap = { ...prev }
                if (updatedMap[oldKey]) {
                    updatedMap[oldKey] = updatedMap[oldKey].filter((e: any) => e.id !== actualEventId)
                }
                const updatedEvent = {
                    ...selectedMeetEvent,
                    start_time: pendingReschedule.to_start_time,
                    end_time: pendingReschedule.to_end_time,
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
        if (!pendingReschedule) return
        try {
            setSelectedMeetRsvpLoading(true)
            const { error } = await (supabase
                .from('calendar_event_reschedule_requests') as any)
                .update({ status: 'declined' })
                .eq('id', pendingReschedule.id)
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
            // Toast is now handled in updateMeetStatus if needed, but let's keep success toast here for specific action feedback
            toast({
                title: "¡Estás dentro!",
                description: "Has confirmado tu asistencia a la reunión.",
                className: "border-orange-500/20 bg-orange-500/10 text-orange-500" // Orange theme requested
            })
            setSelectedMeetEvent(null)
        } catch (e) {
            // Error toast handled in updateMeetStatus
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
            // Toast handled in updateMeetStatus
        } finally {
            setSelectedMeetRsvpLoading(false)
        }
    }

    const handleCancel = async () => {
        setShowCancelConfirm(true)
    }

    const confirmCancel = async () => {
        try {
            setSelectedMeetRsvpLoading(true)
            setSelectedMeetRsvpStatus('declined')
            await updateMeetStatus(String(actualEventId), 'declined')
            toast({
                title: "Asistencia cancelada",
                description: "Hemos actualizado tu estado para esta reunión.",
            })
            setSelectedMeetEvent(null)
            setShowCancelConfirm(false)
        } catch (e) {
            // Toast handled in updateMeetStatus
        } finally {
            setSelectedMeetRsvpLoading(false)
        }
    }

    const handleSuggestNewTime = () => {
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

    // Find host with better fallback for broken data
    const hostParticipant = enrichedParticipants.find(p => p.is_organizer === true) ||
        enrichedParticipants.find(p => String(p.user_id) === String(selectedMeetEvent.invited_by_user_id)) ||
        enrichedParticipants[0]

    // Filter out organizer from guests list
    const guests = enrichedParticipants.map(p => {
        // If name is missing or a generic placeholder, try to find it in coachProfiles
        if (!p.name || p.name === 'Participante' || p.name === 'Coach') {
            const cp = coachProfiles.find(c => String(c.id) === String(p.user_id))
            if (cp) return { ...p, name: cp.full_name, avatar_url: cp.avatar_url || p.avatar_url }
        }
        return p
    }).filter(p => String(p.user_id) !== String(hostParticipant?.user_id))

    const organizerName = (() => {
        if (!hostParticipant) return 'Organizador'
        // If it's ME
        if (String(hostParticipant.user_id) === String(authUserId)) {
            return hostParticipant.full_name && hostParticipant.full_name !== 'Participante' ? hostParticipant.full_name :
                (hostParticipant.name && hostParticipant.name !== 'Participante' ? hostParticipant.name : 'Tú')
        }
        // If it's a known coach
        const cp = coachProfiles.find(c => String(c.id) === String(hostParticipant.user_id))
        if (cp) return cp.full_name

        return hostParticipant.full_name || hostParticipant.name || 'Participante'
    })()

    const requestorName = (() => {
        if (!pendingReschedule?.requested_by_user_id) return ''
        if (pendingReschedule.requested_by_user_id === authUserId) return 'Tú'
        const cp = coachProfiles.find(c => String(c.id) === String(pendingReschedule.requested_by_user_id))
        if (cp) return cp.full_name
        const p = enrichedParticipants.find(part => String(part.user_id) === String(pendingReschedule.requested_by_user_id))
        return p?.name || 'Usuario'
    })()

    const showRescheduleHistory = pendingReschedule && (
        pendingReschedule.status === 'pending' ||
        (pendingReschedule.status === 'accepted' && pendingReschedule.from_start_time !== selectedMeetEvent.start_time)
    )

    // Determine if current user sent this invitation
    const isSentByMe = String(selectedMeetEvent.invited_by_user_id) === String(authUserId)

    // Check if any participant has pending status
    const hasPendingParticipants = enrichedParticipants.some(p =>
        p.rsvp_status === 'pending' && String(p.user_id) !== String(selectedMeetEvent.coach_id)
    )

    console.log('[MeetDetailModal] Status Check:', {
        title: selectedMeetEvent.title,
        id: selectedMeetEvent.id,
        isCancelled,
        isRescheduled,
        pendingRescheduleStatus: effectivePendingReschedule?.status,
        hasPendingParticipants,
        myRsvp,
        invitedByUserId: selectedMeetEvent.invited_by_user_id,
        isCoachAccepted,
        participantCount: enrichedParticipants.length
    })

    const timingStatusLabel = (() => {
        if (isCancelled) return { label: 'Cancelada', color: 'text-red-400 bg-red-500/10 border-red-500/20' }
        if (isPast) return { label: 'Finalizada', color: 'text-gray-400 bg-white/5 border-white/10' }

        // If coach NOT accepted, it's Pendiente
        if (selectedMeetEvent.event_type === 'meet' && !isCoachAccepted) {
            return { label: 'Pendiente', color: 'text-[#FFB366] bg-[#FFB366]/10 border-[#FFB366]/20' }
        }

        if (effectivePendingReschedule?.status === 'pending') return { label: 'Cambio Solicitado', color: 'text-red-400 bg-red-500/10 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]' }
        if (isRescheduled) return { label: 'Reprogramada', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' }
        if (myRsvp === 'declined' || myRsvp === 'cancelled') return { label: 'Rechazada', color: 'text-red-400 bg-red-500/10 border-red-500/20' }
        // If there are pending participants, show 'Pendiente'
        if (hasPendingParticipants) return { label: 'Pendiente', color: 'text-[#FFB366] bg-[#FFB366]/10 border-[#FFB366]/20' }
        // If my RSVP is pending, show 'Pendiente'
        if (myRsvp === 'pending') return { label: 'Pendiente', color: 'text-[#FFB366] bg-[#FFB366]/10 border-[#FFB366]/20' }
        return { label: 'Confirmada', color: 'text-[#FF7939] bg-[#FF7939]/10 border-[#FF7939]/20 shadow-[0_0_15px_rgba(255,121,57,0.15)]' }
    })()

    console.log('[MeetDetailModal] timingStatusLabel:', timingStatusLabel)

    // Derived state for action buttons (based on myRsvp)
    const isMyRsvpConfirmed = myRsvp === 'accepted' || myRsvp === 'confirmed'
    const isMyRsvpDeclined = myRsvp === 'declined' || myRsvp === 'cancelled'

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            onClick={() => setSelectedMeetEvent(null)}
        >
            <div
                className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-5 overflow-y-auto max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <MeetDetailHeader
                    title={selectedMeetEvent.title}
                    timingStatusLabel={timingStatusLabel}
                    isWorkshop={isWorkshop}
                    onClose={() => setSelectedMeetEvent(null)}
                />

                <div className="space-y-8">
                    <MeetDetailInfo
                        dateLabel={dateLabel}
                        timeLabel={timeLabel}
                        pendingReschedule={effectivePendingReschedule}
                        isCancelled={isCancelled}
                        isMyRequest={effectivePendingReschedule?.requested_by_user_id === authUserId}
                    />

                    <MeetDetailParticipants
                        hostParticipant={hostParticipant}
                        coachProfile={coachProfile}
                        coachProfiles={coachProfiles}
                        guests={guests}
                        selectedMeetEvent={selectedMeetEvent}
                        authUserId={authUserId}
                        organizerName={organizerName}
                    />

                    {selectedMeetEvent.description && (
                        <div>
                            <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Notas</div>
                            <p className="text-sm text-gray-400 leading-relaxed italic border-l-2 border-white/5 pl-4">
                                "{selectedMeetEvent.description}"
                            </p>
                        </div>
                    )}

                    {!canEditRsvp && !isMyRsvpConfirmed && !isCancelled && !isPast && (
                        <div className="text-[10px] text-white/20 text-center uppercase tracking-widest bg-white/[0.02] py-2 rounded-lg border border-white/5">
                            Edición deshabilitada (faltan menos de 24hs)
                        </div>
                    )}

                    <MeetDetailActions
                        isMyRsvpConfirmed={isMyRsvpConfirmed}
                        isCancelled={isCancelled}
                        isPast={isPast}
                        selectedMeetEvent={selectedMeetEvent}
                        pendingReschedule={effectivePendingReschedule}
                        authUserId={authUserId}
                        selectedMeetRsvpLoading={selectedMeetRsvpLoading}
                        canEditRsvp={canEditRsvp}
                        onAcceptReschedule={safeHandleAcceptReschedule}
                        onDeclineReschedule={safeHandleDeclineReschedule}
                        onRescheduleClick={handleRescheduleClick}
                        onCancelRescheduleRequest={async () => {
                            try {
                                setSelectedMeetRsvpLoading(true)
                                if (onCancelRescheduleRequest) {
                                    await onCancelRescheduleRequest(String(actualEventId))
                                } else {
                                    // Default logic: Delete pending request
                                    const { error } = await supabase
                                        .from('calendar_event_reschedule_requests')
                                        .delete()
                                        .eq('id', effectivePendingReschedule.id)
                                    if (error) throw error
                                }

                                const dateKey = format(start, 'yyyy-MM-dd')
                                setMeetEventsByDate((prev: any) => {
                                    const dayEvents = prev[dateKey] || []
                                    return {
                                        ...prev,
                                        [dateKey]: dayEvents.map((e: any) => (e.id === actualEventId || e.original_event_id === actualEventId)
                                            ? { ...e, pending_reschedule: null }
                                            : e
                                        )
                                    }
                                })
                                setPendingReschedule(null)

                                setSelectedMeetEvent(null)
                                toast({
                                    title: "Solicitud anulada",
                                    description: "Tu pedido de cambio ha sido cancelado.",
                                })
                            } catch (err) {
                                console.error('Error cancelling reschedule:', err)
                                toast({
                                    variant: "destructive",
                                    title: "Error",
                                    description: "No se pudo cancelar la solicitud.",
                                })
                            } finally {
                                setSelectedMeetRsvpLoading(false)
                            }
                        }}
                        onAcceptInvitation={handleAccept}
                        onDeclineInvitation={handleDecline}
                        onSuggestNewTime={handleSuggestNewTime}
                        onCancelParticipation={handleCancel}
                        isSentByMe={isSentByMe}
                        myRsvp={myRsvp}
                        isMyRsvpDeclined={isMyRsvpDeclined}
                        onReschedule={onReschedule}
                        isCoachAccepted={isCoachAccepted}
                    />
                </div>
            </div>

            <MeetDetailConfirmations
                showCancelConfirm={showCancelConfirm}
                setShowCancelConfirm={setShowCancelConfirm}
                confirmCancel={confirmCancel}
                selectedMeetRsvpLoading={selectedMeetRsvpLoading}
                showWorkshopRescheduleWarning={showWorkshopRescheduleWarning}
                setShowWorkshopRescheduleWarning={setShowWorkshopRescheduleWarning}
                onReschedule={onReschedule}
                selectedMeetEvent={selectedMeetEvent}
            />
        </div>
    )
}
