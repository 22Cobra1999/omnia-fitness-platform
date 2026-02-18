interface UseMeetRsvpLogicProps {
    updateMeetStatus: (eventId: string, newStatus: string) => Promise<void>
    setSelectedMeetRsvpLoading: (val: boolean) => void
    setSelectedMeetEvent: (event: any) => void
    toast: any
    actualEventId: string | number
}

export function useMeetRsvpLogic({
    updateMeetStatus,
    setSelectedMeetRsvpLoading,
    setSelectedMeetEvent,
    toast,
    actualEventId
}: UseMeetRsvpLogicProps) {
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

    return {
        handleAccept,
        handleDecline
    }
}
