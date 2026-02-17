import React from 'react'
import { format, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { RotateCcw, X, AlertTriangle } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from "@/components/ui/use-toast"
import { MeetDetailHeader } from './components/meet-detail/MeetDetailHeader'
import { MeetDetailInfo } from './components/meet-detail/MeetDetailInfo'
import { MeetDetailParticipants } from './components/meet-detail/MeetDetailParticipants'
import { MeetDetailActions } from './components/meet-detail/MeetDetailActions'
import { MeetDetailConfirmations } from './components/meet-detail/MeetDetailConfirmations'
import { WorkshopRescheduleWarningModal } from './components/WorkshopRescheduleWarningModal'
import { useMeetDetailLogic } from './hooks/useMeetDetailLogic'

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
    setSelectedMeetParticipants: (participants: any[]) => void
}

export function MeetDetailModal({
    selectedMeetEvent,
    setSelectedMeetEvent,
    pendingReschedule,
    setPendingReschedule,
    selectedMeetParticipants,
    setSelectedMeetParticipants,
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

    const {
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
        isWorkshop,
        myRsvp,
        canEditRsvp,
        timingStatusLabel,
        isMyRsvpConfirmed,
        isMyRsvpDeclined,
        loadMeet,
        actualEventId,
        start
    } = useMeetDetailLogic({
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
        selectedStatus: selectedMeetRsvpStatus
    })

    // Filter out organizer from guests list
    const guests = enrichedParticipants.map((p: any) => {
        if (!p.name || p.name === 'Participante' || p.name === 'Coach') {
            const cp = coachProfiles.find(c => String(c.id) === String(p.user_id))
            if (cp) return { ...p, name: cp.full_name, avatar_url: cp.avatar_url || p.avatar_url }
        }
        return p
    }).filter((p: any) => String(p.user_id) !== String(hostParticipant?.user_id))

    const organizerName = (() => {
        if (!hostParticipant) return 'Organizador'
        if (String(hostParticipant.user_id) === String(authUserId)) {
            return hostParticipant.full_name && hostParticipant.full_name !== 'Participante' ? hostParticipant.full_name :
                (hostParticipant.name && hostParticipant.name !== 'Participante' ? hostParticipant.name : 'Tú')
        }
        const cp = coachProfiles.find(c => String(c.id) === String(hostParticipant.user_id))
        if (cp) return cp.full_name
        return hostParticipant.full_name || hostParticipant.name || 'Participante'
    })()

    const isSentByMe = String(selectedMeetEvent.invited_by_user_id) === String(authUserId)
    const coachParticipant = enrichedParticipants.find((p: any) => String(p.user_id) === String(selectedMeetEvent.coach_id))
    const isCoachAccepted = coachParticipant && ['accepted', 'confirmed'].includes(coachParticipant.rsvp_status)

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
                        selectedMeetEvent={selectedMeetEvent}
                    />

                    <MeetDetailParticipants
                        hostParticipant={hostParticipant}
                        coachProfile={coachProfiles.find((c) => c.id === String(selectedMeetEvent.coach_id))}
                        coachProfiles={coachProfiles}
                        guests={guests}
                        selectedMeetEvent={selectedMeetEvent}
                        authUserId={authUserId}
                        organizerName={organizerName}
                        eventStatus={isCancelled ? 'cancelled' : (isPast ? 'past' : selectedMeetEvent.status)}
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
                        onCancelParticipation={() => setShowCancelConfirm(true)}
                        isSentByMe={isSentByMe}
                        myRsvp={myRsvp}
                        isMyRsvpDeclined={isMyRsvpDeclined}
                        onRefresh={loadMeet}
                        isCoachAccepted={isCoachAccepted}
                        isConfirmed={isConfirmed}
                        isWorkshop={isWorkshop}
                        isCoach={isCoach}
                    />
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

                <WorkshopRescheduleWarningModal
                    isOpen={showWorkshopRescheduleWarning}
                    onClose={() => setShowWorkshopRescheduleWarning(false)}
                    onConfirm={() => {
                        setShowWorkshopRescheduleWarning(false)
                        if (onReschedule) onReschedule(selectedMeetEvent)
                    }}
                    workshopTitle={selectedMeetEvent.title || 'Taller'}
                    participantCount={enrichedParticipants.length}
                />
            </div>
        </div>
    )
}
