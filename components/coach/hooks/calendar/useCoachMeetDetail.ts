import React from "react"
import { createClient } from "@/lib/supabase/supabase-client"

export function useCoachMeetDetail(selectedMeetEvent: any, coachId: string | null) {
    const supabase = createClient()
    const [selectedMeetParticipants, setSelectedMeetParticipants] = React.useState<any[]>([])
    const [pendingReschedule, setPendingReschedule] = React.useState<any>(null)
    const [selectedMeetRsvpStatus, setSelectedMeetRsvpStatus] = React.useState('pending')
    const [selectedMeetRsvpLoading, setSelectedMeetRsvpLoading] = React.useState(false)

    // Sincronizar estado local al seleccionar un evento
    React.useEffect(() => {
        if (selectedMeetEvent) {
            // Inicializar con la data que ya tenemos para evitar parpadeo
            setPendingReschedule(selectedMeetEvent.pending_reschedule || null)
            setSelectedMeetRsvpStatus(selectedMeetEvent.rsvp_status || 'pending')
        }
    }, [selectedMeetEvent])

    // Load participants and reschedule when meet is selected
    React.useEffect(() => {
        if (!selectedMeetEvent) {
            setSelectedMeetParticipants([])
            setPendingReschedule(null)
            return
        }

        const loadMeetDetails = async () => {
            try {
                const actualEventId = selectedMeetEvent.is_ghost ? selectedMeetEvent.original_event_id : selectedMeetEvent.id
                console.log('🔍 Loading meet details for:', actualEventId)

                // Load participants with their profiles
                const { data: participants, error: participantsError } = await supabase
                    .from('calendar_event_participants')
                    .select('id, user_id, role, rsvp_status, is_creator, invited_by_user_id')
                    .eq('event_id', actualEventId)

                if (participantsError) {
                    console.error('❌ Error loading participants:', participantsError)
                }

                console.log('👥 Participants found:', participants?.length || 0, participants)

                // Load profiles for all participants
                const participantIds = participants?.map((p: any) => p.user_id).filter(Boolean) || []

                // Also include coach
                if (selectedMeetEvent.coach_id && !participantIds.includes(selectedMeetEvent.coach_id)) {
                    participantIds.push(selectedMeetEvent.coach_id)
                }

                console.log('🔍 Loading profiles for IDs:', participantIds)

                const { data: profiles, error: profilesError } = await supabase
                    .from('user_profiles')
                    .select('id, full_name, avatar_url, email')
                    .in('id', participantIds)

                if (profilesError) {
                    console.error('❌ Error loading profiles:', profilesError)
                }

                console.log('👤 Profiles loaded:', profiles?.length || 0, profiles)

                // Map participants with their profile data
                const participantsWithProfiles = (participants || []).map((p: any) => {
                    const profile = profiles?.find((prof: any) => prof.id === p.user_id)
                    const isCoach = String(p.user_id) === String(selectedMeetEvent.coach_id)

                    // STRICT LOGIC: Trust DB columns first
                    const dbRole = p.role ? p.role.toLowerCase() : null
                    const effectiveRole = dbRole === 'coach' ? 'coach' : (isCoach ? 'coach' : 'client')

                    // Organizer if: 
                    // 1. invited_by_user_id == user_id (Self-invited)
                    // 2. is_creator is true
                    // 3. Fallback: Coach if invited_by_user_id is NULL
                    const isInviter = p.invited_by_user_id && String(p.user_id) === String(p.invited_by_user_id)
                    const isOrganizer = isInviter || p.is_creator || (isCoach && !p.invited_by_user_id)

                    return {
                        ...p,
                        name: profile?.full_name || 'Usuario',
                        avatar_url: profile?.avatar_url,
                        client_id: p.user_id,
                        role: effectiveRole,
                        is_organizer: isOrganizer
                    }
                })

                console.log('✅ Participants with profiles (Mapped):', participantsWithProfiles)

                // Add coach as host if not already in participants
                const coachProfile = profiles?.find((p: any) => p.id === selectedMeetEvent.coach_id)
                const coachInParticipants = participantsWithProfiles.some((p: any) => String(p.user_id) === String(selectedMeetEvent.coach_id))

                if (!coachInParticipants && coachProfile) {
                    console.log('➕ Adding coach as participant:', coachProfile)
                    participantsWithProfiles.push({
                        id: selectedMeetEvent.coach_id,
                        user_id: selectedMeetEvent.coach_id,
                        client_id: selectedMeetEvent.coach_id,
                        name: coachProfile.full_name || 'Coach',
                        avatar_url: coachProfile.avatar_url,
                        rsvp_status: 'accepted',
                        role: 'coach',
                        participant_role: 'coach',
                        is_organizer: true,
                        is_creator: false,
                        invited_by_user_id: selectedMeetEvent.coach_id
                    })
                }

                setSelectedMeetParticipants(participantsWithProfiles)

                // Find my RSVP status
                const myParticipation = participantsWithProfiles.find((p: any) => p.user_id === coachId)
                if (myParticipation) {
                    setSelectedMeetRsvpStatus(myParticipation.rsvp_status || 'pending')
                } else {
                    // Coach is always accepted
                    setSelectedMeetRsvpStatus('accepted')
                }

                // Load reschedule (pending to show suggest, accepted to show history)
                const { data: reschedule } = await supabase
                    .from('calendar_event_reschedule_requests')
                    .select('*')
                    .eq('event_id', actualEventId)
                    .in('status', ['pending', 'accepted'])
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle()

                if (reschedule) {
                    setPendingReschedule(reschedule)
                }
            } catch (err) {
                console.error('Error loading meet details:', err)
            }
        }

        loadMeetDetails()
    }, [selectedMeetEvent, coachId])

    return {
        selectedMeetParticipants,
        setSelectedMeetParticipants,
        pendingReschedule,
        setPendingReschedule,
        selectedMeetRsvpStatus,
        setSelectedMeetRsvpStatus,
        selectedMeetRsvpLoading,
        setSelectedMeetRsvpLoading
    }
}
