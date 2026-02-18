import { useMemo } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface UseMeetDerivedStateProps {
    selectedMeetEvent: any
    selectedMeetParticipants: any[]
    coachProfiles: any[]
    authUserId: string | null
    selectedStatus: string
    pendingReschedule?: any
}

export function useMeetDerivedState({
    selectedMeetEvent,
    selectedMeetParticipants,
    coachProfiles,
    authUserId,
    selectedStatus,
    pendingReschedule
}: UseMeetDerivedStateProps) {
    const effectivePendingReschedule = pendingReschedule || selectedMeetEvent?.pending_reschedule
    const start = useMemo(() => new Date(selectedMeetEvent?.start_time), [selectedMeetEvent?.start_time])
    const end = useMemo(() => selectedMeetEvent?.end_time ? new Date(selectedMeetEvent.end_time) : null, [selectedMeetEvent?.end_time])

    const actualEventId = selectedMeetEvent?.is_ghost ? selectedMeetEvent.original_event_id : selectedMeetEvent?.id

    const timeLabel = useMemo(() => {
        if (!start || Number.isNaN(start.getTime())) return ''
        return `${format(start, 'HH:mm')}${end && !Number.isNaN(end.getTime()) ? ` – ${format(end, 'HH:mm')}` : ''}`
    }, [start, end])

    const dateLabel = useMemo(() => {
        if (!start || Number.isNaN(start.getTime())) return ''
        return format(start, "EEEE d 'de' MMMM", { locale: es })
    }, [start])

    // Permission checks
    const isGrupal = selectedMeetEvent?.event_type === 'workshop'
    const isOwner = selectedMeetEvent?.created_by_user_id === authUserId
    const isCoach = authUserId === selectedMeetEvent?.coach_id

    // Status Logic
    const enrichedParticipants = useMemo(() => {
        const base = [...(selectedMeetParticipants || [])]
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

    const coachParticipant = enrichedParticipants.find(p => String(p.user_id) === String(selectedMeetEvent?.coach_id))
    const isCoachAccepted = coachParticipant && ['accepted', 'confirmed'].includes(coachParticipant.rsvp_status)
    const isPendingApproval = (selectedMeetEvent?.invited_by_user_id === authUserId) && !isCoachAccepted

    const hasPendingParticipants = useMemo(() => {
        return enrichedParticipants.some(p => p.rsvp_status === 'pending')
    }, [enrichedParticipants])

    const isConfirmed = !hasPendingParticipants
    const nowMs = Date.now()
    const startMs = start.getTime()
    const isPast = startMs < nowMs

    const isCancelled = selectedMeetEvent?.status === 'cancelled'
    const isRescheduled = selectedMeetEvent?.status === 'rescheduled'

    const canEditRsvp = (Number.isFinite(startMs) && startMs > nowMs) && (
        ((startMs - nowMs) > (24 * 60 * 60 * 1000)) ||
        isPendingApproval ||
        selectedStatus === 'pending'
    )

    const isMyRsvpConfirmed = ['accepted', 'confirmed'].includes(selectedStatus)
    const isMyRsvpDeclined = selectedStatus === 'declined'

    const timingStatusLabel = useMemo(() => {
        if (isCancelled) {
            const cancellerId = selectedMeetEvent?.cancelled_by_user_id
            if (!cancellerId) return { label: 'Cancelada', color: 'text-red-400 bg-red-500/10 border-red-500/20' }

            if (String(cancellerId) === String(authUserId)) {
                return { label: 'Cancelada por ti', color: 'text-red-400 bg-red-500/10 border-red-500/20' }
            }

            const canceller = enrichedParticipants.find(p => String(p.user_id) === String(cancellerId))
            const cancellerRole = canceller?.role || (String(cancellerId) === String(selectedMeetEvent?.coach_id) ? 'coach' : 'cliente')

            return {
                label: `Cancelada por ${cancellerRole === 'coach' ? 'el coach' : 'el cliente'}`,
                color: 'text-red-400 bg-red-500/10 border-red-500/20'
            }
        }
        if (isPast) return { label: 'Finalizada', color: 'text-gray-400 bg-white/5 border-white/10' }
        if (effectivePendingReschedule?.status === 'pending') return { label: 'Cambio Solicitado', color: 'text-red-400 bg-red-500/10 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]' }
        if (isRescheduled) return { label: 'Reprogramada', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' }

        if (selectedStatus === 'declined' || selectedStatus === 'cancelled') return { label: 'Rechazada', color: 'text-red-400 bg-red-500/10 border-red-500/20' }

        if (hasPendingParticipants || selectedStatus === 'pending') {
            return { label: 'Pendiente', color: 'text-[#FFB366] bg-[#FFB366]/10 border-[#FFB366]/20' }
        }

        return { label: 'Confirmada', color: 'text-[#FF7939] bg-[#FF7939]/10 border-[#FF7939]/20 shadow-[0_0_15px_rgba(255,121,57,0.15)]' }
    }, [isCancelled, isPast, effectivePendingReschedule, isRescheduled, selectedStatus, hasPendingParticipants, selectedMeetEvent, authUserId, enrichedParticipants])

    const hostParticipant = useMemo(() => {
        return enrichedParticipants.find(p => String(p.user_id) === String(selectedMeetEvent?.invited_by_user_id)) ||
            enrichedParticipants.find(p => p.is_organizer === true) ||
            enrichedParticipants[0]
    }, [enrichedParticipants, selectedMeetEvent])

    return {
        effectivePendingReschedule,
        start,
        end,
        actualEventId,
        timeLabel,
        dateLabel,
        isGrupal,
        isOwner,
        isCoach,
        enrichedParticipants,
        coachParticipant,
        isCoachAccepted,
        isPendingApproval,
        hasPendingParticipants,
        isConfirmed,
        isPast,
        isCancelled,
        isRescheduled,
        canEditRsvp,
        isMyRsvpConfirmed,
        isMyRsvpDeclined,
        timingStatusLabel,
        hostParticipant
    }
}
