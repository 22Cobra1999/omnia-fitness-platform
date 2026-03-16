import React from 'react'
import { createClient } from '@/lib/supabase/supabase-client'
import { useToast } from "@/components/ui/use-toast"
import { useMeetDerivedState } from './modules/useMeetDerivedState'
import { useMeetPersistenceLogic } from './modules/useMeetPersistenceLogic'
import { useMeetRsvpLogic } from './modules/useMeetRsvpLogic'
import { useMeetRescheduleLogic } from './modules/useMeetRescheduleLogic'

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
    const supabase = createClient()
    const { toast } = useToast()
    const [showCancelConfirm, setShowCancelConfirm] = React.useState(false)
    const [showWorkshopRescheduleWarning, setShowWorkshopRescheduleWarning] = React.useState(false)

    // Derived State
    const derivedState = useMeetDerivedState({
        selectedMeetEvent,
        selectedMeetParticipants,
        coachProfiles,
        authUserId,
        selectedStatus,
        pendingReschedule
    })

    const {
        effectivePendingReschedule,
        start,
        actualEventId,
        isGrupal,
        isConfirmed
    } = derivedState

    // Persistence Logic
    const persistence = useMeetPersistenceLogic({
        supabase,
        setSelectedMeetParticipants,
        setSelectedMeetEvent,
        setSelectedMeetRsvpStatus,
        setMeetEventsByDate,
        toast,
        authUserId,
        selectedMeetEvent,
        isConfirmed,
        isGrupal,
        start,
        actualEventId,
        selectedMeetParticipants
    })

    // RSVP Logic
    const rsvp = useMeetRsvpLogic({
        updateMeetStatus: persistence.updateMeetStatus,
        setSelectedMeetRsvpLoading,
        setSelectedMeetEvent,
        toast,
        actualEventId
    })

    // Reschedule Logic
    const reschedule = useMeetRescheduleLogic({
        supabase,
        effectivePendingReschedule,
        selectedMeetEvent,
        setSelectedMeetRsvpLoading,
        actualEventId,
        setMeetEventsByDate,
        setPendingReschedule,
        setSelectedMeetEvent,
        setRescheduleContext,
        handlePickCoachForMeet,
        setMeetViewMode,
        setMeetWeekStart,
        onReschedule,
        isGrupal,
        setShowWorkshopRescheduleWarning,
        toast,
        start
    })

    return {
        ...derivedState,
        showCancelConfirm,
        setShowCancelConfirm,
        showWorkshopRescheduleWarning,
        setShowWorkshopRescheduleWarning,
        loadMeet: persistence.loadMeet,
        safeHandleAcceptReschedule: reschedule.safeHandleAcceptReschedule,
        safeHandleDeclineReschedule: reschedule.safeHandleDeclineReschedule,
        handleAccept: rsvp.handleAccept,
        handleDecline: rsvp.handleDecline,
        confirmCancel: () => persistence.confirmCancel(setSelectedMeetRsvpLoading, setShowCancelConfirm),
        handleRescheduleClick: reschedule.handleRescheduleClick,
        handleSuggestNewTime: reschedule.handleSuggestNewTime,
        isWorkshop: isGrupal,
        myRsvp: selectedStatus
    }
}
