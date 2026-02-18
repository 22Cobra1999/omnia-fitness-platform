import { format } from 'date-fns'

interface UseMeetPersistenceLogicProps {
    supabase: any
    setSelectedMeetParticipants: (participants: any[]) => void
    setSelectedMeetEvent: (event: any) => void
    setSelectedMeetRsvpStatus: (status: string) => void
    setMeetEventsByDate: (updater: any) => void
    toast: any
    authUserId: string | null
    selectedMeetEvent: any
    isConfirmed: boolean
    isGrupal: boolean
    start: Date
    actualEventId: string | number
}

export function useMeetPersistenceLogic({
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
    actualEventId
}: UseMeetPersistenceLogicProps) {
    const loadMeet = async () => {
        try {
            console.log('[useMeetPersistenceLogic] Refreshing meet data for:', actualEventId);
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
            console.error('[useMeetPersistenceLogic] Error refreshing meet data:', e);
        }
    }

    const updateMeetStatus = async (eventId: string, newStatus: string) => {
        try {
            console.log('[useMeetPersistenceLogic] updateMeetStatus called:', eventId, newStatus)

            let updatedEventStatus = selectedMeetEvent?.status;

            if (newStatus === 'accepted') {
                const { data: rpcData, error: rpcError } = await supabase.rpc('accept_meet_invitation', {
                    p_event_id: eventId,
                    p_user_id: authUserId
                })

                if (rpcError) throw rpcError

                if (rpcData?.success === false) {
                    throw new Error(rpcData.message || 'Error en el servidor')
                }

                if (rpcData?.event_status) {
                    updatedEventStatus = rpcData.event_status;
                }
            } else {
                const { error: partError } = await (supabase
                    .from('calendar_event_participants') as any)
                    .update({ rsvp_status: newStatus })
                    .eq('event_id', eventId)
                    .eq('user_id', authUserId)

                if (partError) throw partError
            }

            setSelectedMeetRsvpStatus(newStatus)
            if (updatedEventStatus !== selectedMeetEvent?.status) {
                setSelectedMeetEvent((prev: any) => (prev ? { ...prev, status: updatedEventStatus } : null))
            }

            const dateKey = format(start, 'yyyy-MM-dd')
            setMeetEventsByDate((prev: any) => {
                const dayEvents = prev[dateKey] || []
                return {
                    ...prev,
                    [dateKey]: dayEvents.map((e: any) => {
                        const isMatch = String(e.id) === String(eventId) || String(e.original_event_id) === String(eventId);
                        if (isMatch) {
                            return {
                                ...e,
                                rsvp_status: newStatus,
                                status: updatedEventStatus,
                                participants: (e.participants || []).map((p: any) =>
                                    String(p.user_id) === String(authUserId) ? { ...p, rsvp_status: newStatus } : p
                                )
                            }
                        }
                        return e;
                    })
                }
            })
        } catch (e) {
            console.error('[useMeetPersistenceLogic] CRITICAL Error updating meet status:', e)
            toast({
                variant: "destructive",
                title: "Error actualizando estado",
                description: "No se pudo actualizar tu asistencia. Intentalo de nuevo.",
            })
            throw e
        }
    }

    const confirmCancel = async (setSelectedMeetRsvpLoading: (val: boolean) => void, setShowCancelConfirm: (val: boolean) => void) => {
        try {
            setSelectedMeetRsvpLoading(true)

            const dateKey = format(start, 'yyyy-MM-dd')

            if (!isConfirmed && !isGrupal) {
                console.log('[useMeetPersistenceLogic] Unconfirmed meet, performing HARD DELETE')
                const { error: deleteError } = await supabase
                    .from('calendar_events')
                    .delete()
                    .eq('id', actualEventId)

                if (deleteError) throw deleteError

                setMeetEventsByDate((prev: any) => {
                    const dayEvents = prev[dateKey] || []
                    return {
                        ...prev,
                        [dateKey]: dayEvents.filter((e: any) => String(e.id) !== String(actualEventId))
                    }
                })

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

                    if (eventError) {
                        console.error('Error cancelling event:', eventError)
                    } else {
                        setMeetEventsByDate((prev: any) => {
                            const dayEvents = prev[dateKey] || []
                            return {
                                ...prev,
                                [dateKey]: dayEvents.map((e: any) =>
                                    (String(e.id) === String(actualEventId) || String(e.original_event_id) === String(actualEventId))
                                        ? { ...e, status: 'cancelled' }
                                        : e
                                )
                            }
                        })
                    }
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

    return {
        loadMeet,
        updateMeetStatus,
        confirmCancel
    }
}
