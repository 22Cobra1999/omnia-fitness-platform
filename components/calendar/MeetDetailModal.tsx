
import React from 'react'
import { format, startOfWeek, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar as CalendarIcon, Globe, RotateCcw, X, Video, AlertTriangle } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from "@/components/ui/use-toast"

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
    const start = new Date(selectedMeetEvent.start_time)
    const actualEventId = selectedMeetEvent.is_ghost ? selectedMeetEvent.original_event_id : selectedMeetEvent.id
    const end = selectedMeetEvent.end_time ? new Date(selectedMeetEvent.end_time) : null
    const timeLabel = `${format(start, 'HH:mm')}${end && !Number.isNaN(end.getTime()) ? ` – ${format(end, 'HH:mm')}` : ''}`
    const dateLabel = format(start, "EEEE d 'de' MMMM", { locale: es })
    const coachProfile = coachProfiles.find((c) => c.id === String(selectedMeetEvent.coach_id))

    const nowMs = Date.now()
    const startMs = start.getTime()
    const canEditRsvp = Number.isFinite(startMs) && (startMs - nowMs) > (24 * 60 * 60 * 1000)

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
        try {
            if (!authUserId) return

            const { data: existing } = await (supabase.from('calendar_event_participants') as any)
                .select('id')
                .eq('event_id', eventId)
                .eq('client_id', authUserId)
                .single()

            if (existing) {
                await (supabase.from('calendar_event_participants') as any)
                    .update({ rsvp_status: newStatus })
                    .eq('id', existing.id)
            } else {
                await (supabase.from('calendar_event_participants') as any)
                    .insert({ event_id: eventId, client_id: authUserId, rsvp_status: newStatus, payment_status: 'unpaid' })
            }

            const dateKey = format(start, 'yyyy-MM-dd')
            setMeetEventsByDate((prev: any) => {
                const dayEvents = prev[dateKey] || []
                return {
                    ...prev,
                    [dateKey]: dayEvents.map((e: any) => (e.id === actualEventId || e.original_event_id === actualEventId) ? { ...e, rsvp_status: newStatus } : e)
                }
            })
            setSelectedMeetRsvpStatus(newStatus)
        } catch (e) {
            console.error('Error updating meet status:', e)
            toast({
                variant: "destructive",
                title: "Error actualizando estado",
                description: "No se pudo actualizar tu asistencia. Intentalo de nuevo.",
            })
            throw e // Re-throw to handle specific UI rollback if needed in caller
        }
    }


    const handleRescheduleClick = () => {
        if (isWorkshop && onReschedule) {
            setShowWorkshopRescheduleWarning(true)
        } else if (onReschedule) {
            onReschedule(selectedMeetEvent)
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
                    status: 'rescheduled'
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
            toast({
                title: "¡Estás dentro!",
                description: "Has confirmado tu asistencia a la reunión.",
            })
            setSelectedMeetEvent(null)
        } catch (e) {
            // Toast handled in updateMeetStatus
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
            setSelectedMeetRsvpStatus('cancelled')
            await updateMeetStatus(String(actualEventId), 'cancelled')
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

    const hostParticipant = selectedMeetParticipants.find(p => p.is_organizer === true)
    // Filter out organizer from guests list
    const guests = selectedMeetParticipants.filter(p => p.is_organizer !== true)
    const organizerName = hostParticipant?.name || 'Organizador'

    const requestorName = (() => {
        if (!pendingReschedule?.requested_by_user_id) return ''
        if (pendingReschedule.requested_by_user_id === authUserId) return 'Tú'
        const cp = coachProfiles.find(c => c.id === pendingReschedule.requested_by_user_id)
        if (cp) return cp.full_name
        const p = selectedMeetParticipants.find(part => String(part.client_id) === String(pendingReschedule.requested_by_user_id))
        return p?.name || 'En el Coach'
    })()

    const showRescheduleHistory = pendingReschedule && (
        pendingReschedule.status === 'pending' ||
        (pendingReschedule.status === 'accepted' && pendingReschedule.from_start_time !== selectedMeetEvent.start_time)
    )

    // Determine if current user sent this invitation
    const isSentByMe = selectedMeetEvent.invited_by_user_id === authUserId

    // Check if any participant has pending status
    const hasPendingParticipants = selectedMeetParticipants.some(p =>
        p.rsvp_status === 'pending' && String(p.client_id) !== String(selectedMeetEvent.coach_id)
    )

    const timingStatusLabel = (() => {
        if (isCancelled) return { label: 'Cancelada', color: 'text-red-400 bg-red-500/10 border-red-500/20' }
        if (selectedMeetEvent.is_ghost) return { label: 'Propuesta', color: 'text-[#FFB366] bg-[#FFB366]/10 border-[#FFB366]/20' }
        if (pendingReschedule?.status === 'pending') return { label: 'Sugerida', color: 'text-[#FFB366] bg-[#FFB366]/10 border-[#FFB366]/20' }
        if (isRescheduled) return { label: 'Reprogramada', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' }
        // If there are pending participants, show 'Pendiente'
        if (hasPendingParticipants) return { label: 'Pendiente', color: 'text-[#FFB366] bg-[#FFB366]/10 border-[#FFB366]/20' }
        // If my RSVP is pending, show 'Pendiente'
        if (myRsvp === 'pending') return { label: 'Pendiente', color: 'text-[#FFB366] bg-[#FFB366]/10 border-[#FFB366]/20' }
        return { label: 'Confirmada', color: 'text-[#FF7939] bg-[#FF7939]/10 border-[#FF7939]/20' }
    })()

    // Derived state for action buttons (based on myRsvp)
    const isMyRsvpConfirmed = myRsvp === 'accepted' || myRsvp === 'confirmed'
    const isMyRsvpDeclined = myRsvp === 'declined'

    return (
        <div
            className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            onClick={() => setSelectedMeetEvent(null)}
        >
            <div
                className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-5 overflow-y-auto max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between mb-6">
                    <div className="flex flex-col gap-2.5">
                        <h2 className="text-3xl font-bold text-white tracking-tight leading-none">
                            {selectedMeetEvent.title || 'Reunión'}
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className={timingStatusLabel.color + " text-[9px] font-black uppercase tracking-[0.1em] px-2.5 py-1 rounded-full border shadow-sm"}>
                                {timingStatusLabel.label}
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-[0.1em] px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-white/40">
                                {isWorkshop ? 'Workshop' : 'Meet'}
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setSelectedMeetEvent(null)}
                        className="w-10 h-10 rounded-full hover:bg-white/5 text-white/30 hover:text-white flex items-center justify-center transition-all -mr-2"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-8">
                    {/* COMPACT DATE/TIME */}
                    <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-2xl bg-zinc-900 border flex items-center justify-center flex-shrink-0 ${isCancelled ? 'border-red-500/20 text-red-500' : 'border-white/10 text-[#FF7939]'}`}>
                            <CalendarIcon size={22} strokeWidth={1.5} />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-baseline gap-2">
                                <span className="text-base font-semibold text-white capitalize leading-tight">
                                    {dateLabel}
                                </span>
                                {(selectedMeetEvent.is_ghost || pendingReschedule?.status === 'accepted' || pendingReschedule?.status === 'pending') && pendingReschedule && (
                                    <span className="text-xs text-white/20 line-through font-medium">
                                        {format(new Date(pendingReschedule.from_start_time), "d 'de' MMM", { locale: es })}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-400 font-medium">
                                    {timeLabel}
                                </span>
                                {(selectedMeetEvent.is_ghost || pendingReschedule?.status === 'accepted' || pendingReschedule?.status === 'pending') && pendingReschedule && (
                                    <span className="text-[11px] text-white/20 line-through">
                                        {format(new Date(pendingReschedule.from_start_time), "HH:mm")}
                                    </span>
                                )}
                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">GMT-3</span>
                            </div>
                        </div>
                    </div>

                    {pendingReschedule?.status === 'pending' && (
                        <div className="flex flex-col gap-2 p-3 rounded-xl bg-[#FFB366]/5 border border-[#FFB366]/10 w-full">
                            <div className="text-[10px] font-black text-[#FFB366] uppercase tracking-widest flex items-center gap-1.5">
                                <RotateCcw size={12} />
                                PROPUESTA DE CAMBIO
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-white">
                                    {format(new Date(pendingReschedule.to_start_time), "EEEE d 'de' MMMM", { locale: es })}
                                </span>
                                <span className="text-[11px] text-gray-400">
                                    {format(new Date(pendingReschedule.to_start_time), "HH:mm")} – {format(new Date(pendingReschedule.to_end_time), "HH:mm")}
                                </span>
                            </div>
                            {pendingReschedule.reason && (
                                <div className="text-[11px] text-white/50 italic leading-relaxed border-t border-white/5 pt-2 mt-1">
                                    "{pendingReschedule.reason}"
                                </div>
                            )}
                        </div>
                    )}

                    {/* MINIMALIST PARTICIPANTS */}
                    <div>
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Participantes</div>
                        <div className="grid grid-cols-1 gap-4 text-sm">
                            {/* Coach */}
                            <div className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        {hostParticipant?.avatar_url || coachProfile?.avatar_url ? (
                                            <img
                                                src={hostParticipant?.avatar_url || coachProfile?.avatar_url || ''}
                                                className="w-8 h-8 rounded-full object-cover bg-zinc-800"
                                                alt="Organizador"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                                                {organizerName.substring(0, 2)}
                                            </div>
                                        )}
                                        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-950 ${selectedMeetEvent.is_ghost ? 'bg-[#FFB366]' : 'bg-[#FF7939]'}`} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white font-medium">{organizerName}</span>
                                        <span className="text-[9px] text-[#FF7939] font-black uppercase tracking-widest">Organizador</span>
                                    </div>
                                </div>
                                <div className={`text-xs font-bold ${selectedMeetEvent.is_ghost ? 'text-[#FFB366]' : 'text-[#FF7939]'}`}>
                                    {selectedMeetEvent.is_ghost ? 'Pendiente' : 'Reserva'}
                                </div>
                            </div>

                            {/* Guests */}
                            {guests.map(p => {
                                const isMe = String(p.client_id) === String(authUserId);
                                const statusColor = (p.rsvp_status === 'confirmed' || p.rsvp_status === 'accepted') ? 'bg-[#FF7939]' : (p.rsvp_status === 'declined' || p.rsvp_status === 'cancelled' ? 'bg-red-500' : 'bg-[#FFB366]');
                                const statusText = (p.rsvp_status === 'confirmed' || p.rsvp_status === 'accepted') ? 'Confirmado' : (p.rsvp_status === 'declined' || p.rsvp_status === 'cancelled' ? 'Rechazado' : 'Pendiente');
                                const statusTextColor = (p.rsvp_status === 'confirmed' || p.rsvp_status === 'accepted') ? 'text-[#FF7939]' : (p.rsvp_status === 'declined' || p.rsvp_status === 'cancelled' ? 'text-red-500' : 'text-[#FFB366]');

                                return (
                                    <div key={p.id} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                {p.avatar_url ? (
                                                    <img src={p.avatar_url} className="w-8 h-8 rounded-full object-cover bg-zinc-800" alt={p.name} />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                                                        {p.name.substring(0, 2)}
                                                    </div>
                                                )}
                                                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-950 ${statusColor}`} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-white font-medium">{p.name} {isMe ? '(Tú)' : ''}</span>
                                                <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Invitado</span>
                                            </div>
                                        </div>
                                        <div className={`text-xs font-bold ${statusTextColor}`}>{statusText}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* COMPACT NOTES */}
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

                    <div className="pt-2 flex flex-col gap-2">
                        {isMyRsvpConfirmed && !isCancelled && !isPast && selectedMeetEvent.meet_link ? (
                            <button
                                type="button"
                                onClick={() => window.open(String(selectedMeetEvent.meet_link), '_blank')}
                                className="w-full h-10 px-4 rounded-xl bg-[#FF7939] text-black text-[11px] font-bold uppercase tracking-wider hover:bg-[#ff8a55] transition-colors flex items-center justify-center gap-2"
                                title="Unirse a la reunión"
                            >
                                <Globe className="h-4 w-4" />
                                Unirse a la reunión
                            </button>
                        ) : null}

                        {/* Special case: Pending Reschedule UI overlaps or replaces buttons */}
                        {pendingReschedule && pendingReschedule.status === 'pending' ? (
                            <div className="flex flex-col gap-2 mt-2 p-4 rounded-2xl bg-[#FF7939]/5 border border-[#FF7939]/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="text-[10px] font-extrabold text-[#FFB366] uppercase tracking-[0.1em] mb-2 flex items-center gap-2">
                                    {pendingReschedule.requested_by_user_id === authUserId ? 'Tu solicitud de cambio' : 'Propuesta de cambio recibida'}
                                </div>

                                {pendingReschedule.requested_by_user_id !== authUserId ? (
                                    <div className="flex flex-col gap-2">
                                        <button
                                            type="button"
                                            disabled={selectedMeetRsvpLoading}
                                            onClick={safeHandleAcceptReschedule}
                                            className="w-full px-4 py-2.5 rounded-xl bg-[#FF7939] text-black text-sm font-bold hover:brightness-110 transition-all disabled:opacity-60"
                                        >
                                            Aceptar Cambio
                                        </button>
                                        <button
                                            type="button"
                                            disabled={selectedMeetRsvpLoading}
                                            onClick={safeHandleDeclineReschedule}
                                            className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-medium border border-white/10 hover:bg-zinc-800 transition-colors disabled:opacity-60 text-center"
                                        >
                                            Rechazar este cambio
                                        </button>
                                        <div className="text-[10px] text-gray-500 text-center mt-1">
                                            Si rechazás, la meet se mantiene en el horario original.
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <div className="text-[10px] text-white/40 text-center uppercase tracking-widest font-bold">
                                            Esperando respuesta del {selectedMeetEvent.coach_id === authUserId ? 'cliente' : 'coach'}...
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                disabled={selectedMeetRsvpLoading}
                                                onClick={handleRescheduleClick}
                                                className="px-3 py-2 rounded-xl bg-zinc-800 text-white text-[11px] font-bold border border-white/5 hover:bg-zinc-700 transition-colors"
                                            >
                                                Nuevo cambio
                                            </button>
                                            <button
                                                type="button"
                                                disabled={selectedMeetRsvpLoading}
                                                onClick={async () => {
                                                    if (onCancelRescheduleRequest) {
                                                        try {
                                                            setSelectedMeetRsvpLoading(true)
                                                            await onCancelRescheduleRequest(String(actualEventId))
                                                            setSelectedMeetEvent(null)
                                                            toast({
                                                                title: "Solicitud anulada",
                                                                description: "Tu pedido de cambio ha sido cancelado.",
                                                            })
                                                        } catch (err) {
                                                            // error handled in hook
                                                        } finally {
                                                            setSelectedMeetRsvpLoading(false)
                                                        }
                                                    }
                                                }}
                                                className="px-3 py-2 rounded-xl bg-red-500/10 text-red-400 text-[11px] font-bold border border-red-500/20 hover:bg-red-500/20 transition-colors"
                                            >
                                                Anular pedido
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* If I sent the invitation and it's pending, show cancel/modify options */}
                                {isSentByMe && myRsvp === 'pending' && !isCancelled && !isPast && (
                                    <div className="flex flex-col gap-2">
                                        <button
                                            type="button"
                                            disabled={selectedMeetRsvpLoading || !canEditRsvp}
                                            onClick={handleSuggestNewTime}
                                            className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 text-white text-sm hover:bg-zinc-700 transition-colors disabled:opacity-60"
                                        >
                                            Modificar horario
                                        </button>
                                        <button
                                            type="button"
                                            disabled={selectedMeetRsvpLoading || !canEditRsvp}
                                            onClick={handleCancel}
                                            className="w-full px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-sm font-semibold border border-red-500/20 hover:bg-red-500/20 transition-colors"
                                        >
                                            Cancelar solicitud
                                        </button>
                                    </div>
                                )}

                                {/* If I received the invitation and it's pending, show accept/reject options */}
                                {!isSentByMe && !isMyRsvpConfirmed && !isCancelled && !isMyRsvpDeclined && !isPast && (
                                    <div className="flex flex-col gap-2">
                                        <button
                                            type="button"
                                            disabled={selectedMeetRsvpLoading || !canEditRsvp}
                                            onClick={handleAccept}
                                            className="w-full px-4 py-2.5 rounded-xl bg-[#FF7939] text-black text-sm font-semibold hover:opacity-95 transition-opacity disabled:opacity-60"
                                        >
                                            Aceptar invitación
                                        </button>
                                        <button
                                            type="button"
                                            disabled={selectedMeetRsvpLoading || !canEditRsvp}
                                            onClick={handleSuggestNewTime}
                                            className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 text-white text-sm hover:bg-zinc-700 transition-colors disabled:opacity-60"
                                        >
                                            Sugerir nuevo horario
                                        </button>
                                        <button
                                            type="button"
                                            disabled={selectedMeetRsvpLoading || !canEditRsvp}
                                            onClick={handleDecline}
                                            className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-sm border border-white/15 hover:bg-zinc-800 transition-colors disabled:opacity-60 text-center"
                                        >
                                            Rechazar
                                        </button>
                                    </div>
                                )}

                                {isMyRsvpDeclined && !isPast && (
                                    <div className="flex flex-col gap-2">
                                        <button
                                            type="button"
                                            disabled={selectedMeetRsvpLoading || !canEditRsvp}
                                            onClick={handleAccept}
                                            className="w-full px-4 py-2.5 rounded-xl bg-[#FF7939] text-black text-sm font-semibold hover:opacity-95 transition-opacity disabled:opacity-60"
                                        >
                                            Reconsiderar y Aceptar
                                        </button>
                                        <button
                                            type="button"
                                            disabled={selectedMeetRsvpLoading || !canEditRsvp}
                                            onClick={handleSuggestNewTime}
                                            className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 text-white text-sm hover:bg-zinc-700 transition-colors disabled:opacity-60"
                                        >
                                            Sugerir otro horario
                                        </button>
                                    </div>
                                )}

                                {((isMyRsvpConfirmed && !isCancelled && !isPast) || (onReschedule && !isCancelled && !isPast)) && (
                                    <div className="flex flex-col gap-2">
                                        {(() => {
                                            const meetLink = selectedMeetEvent.meet_link || selectedMeetEvent.google_meet_data?.meet_link;
                                            if (!meetLink) return null;

                                            if (isToday(start)) {
                                                return (
                                                    <button
                                                        type="button"
                                                        onClick={() => window.open(String(meetLink), '_blank')}
                                                        className="w-full px-4 py-2.5 rounded-xl bg-[#FF7939] text-black text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                                    >
                                                        <Video size={16} />
                                                        Unirse a la Meet
                                                    </button>
                                                );
                                            }

                                            if (!isPast) {
                                                return (
                                                    <div className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[11px] text-white/40 text-center font-medium">
                                                        Link disponible el día de la meet
                                                    </div>
                                                );
                                            }

                                            return null;
                                        })()}
                                        <button
                                            type="button"
                                            disabled={selectedMeetRsvpLoading || (!onReschedule && !canEditRsvp)}
                                            onClick={handleRescheduleClick}
                                            className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 text-white text-sm hover:bg-zinc-700 transition-colors disabled:opacity-60"
                                        >
                                            Reprogramar
                                        </button>
                                        <button
                                            type="button"
                                            disabled={selectedMeetRsvpLoading || !canEditRsvp}
                                            onClick={handleCancel}
                                            className="w-full px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-sm font-semibold border border-red-500/20 hover:bg-red-500/20 transition-colors"
                                        >
                                            Cancelar mi asistencia
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Cancel Confirmation Modal */}
            {showCancelConfirm && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-2">Cancelar meet</h3>
                        <p className="text-white/60 text-sm mb-6">
                            ¿Estás seguro que querés cancelar esta meet? Esta acción no se puede deshacer.
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowCancelConfirm(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 text-white text-sm font-semibold hover:bg-zinc-700 transition-colors"
                            >
                                Volver
                            </button>
                            <button
                                type="button"
                                onClick={confirmCancel}
                                disabled={selectedMeetRsvpLoading}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-sm font-semibold border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-60"
                            >
                                {selectedMeetRsvpLoading ? 'Cancelando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Workshop Reschedule Warning */}
            {showWorkshopRescheduleWarning && (
                <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
                    <div className="bg-zinc-950 border border-[#FFB366]/20 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
                        <div className="w-16 h-16 rounded-full bg-[#FFB366]/10 flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-[#FFB366]" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Aviso de Reputación</h3>
                        <p className="text-sm text-white/60 leading-relaxed mb-8">
                            Reprogramar un taller grupal puede afectar negativamente tu reputación como coach. Asegurate de que el cambio sea estrictamente necesario ya que impacta en múltiples participantes.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    setShowWorkshopRescheduleWarning(false)
                                    if (onReschedule) onReschedule(selectedMeetEvent)
                                }}
                                className="w-full py-4 rounded-2xl bg-[#FFB366] text-black font-bold text-sm hover:opacity-90 transition-opacity"
                            >
                                Entendido, Reprogramar
                            </button>
                            <button
                                onClick={() => setShowWorkshopRescheduleWarning(false)}
                                className="w-full py-4 rounded-2xl bg-white/5 text-white/60 font-medium text-sm hover:bg-white/10 transition-colors"
                            >
                                Volver atrás
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
