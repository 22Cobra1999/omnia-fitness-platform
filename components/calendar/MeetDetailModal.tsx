
import React from 'react'
import { format, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar as CalendarIcon, Globe, RotateCcw, X } from 'lucide-react'
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
    setMeetViewMode: (mode: 'month' | 'week' | 'day') => void
    setMeetWeekStart: (date: Date) => void
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
    setMeetWeekStart
}: MeetDetailModalProps) {
    const supabase = createClientComponentClient()
    const { toast } = useToast()

    // Logic extracted from IIFE
    const start = new Date(selectedMeetEvent.start_time)
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
                    [dateKey]: dayEvents.map((e: any) => e.id === eventId ? { ...e, rsvp_status: newStatus } : e)
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
                .eq('id', selectedMeetEvent.id)
            if (evtErr) throw evtErr

            // Local state update
            const startDt = new Date(pendingReschedule.to_start_time)
            const oldStartDt = new Date(pendingReschedule.from_start_time)
            const newKey = format(startDt, 'yyyy-MM-dd')
            const oldKey = format(oldStartDt, 'yyyy-MM-dd')

            setMeetEventsByDate((prev: any) => {
                const updatedMap = { ...prev }
                if (updatedMap[oldKey]) {
                    updatedMap[oldKey] = updatedMap[oldKey].filter((e: any) => e.id !== selectedMeetEvent.id)
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
            await updateMeetStatus(String(selectedMeetEvent.id), 'accepted')
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
            await updateMeetStatus(String(selectedMeetEvent.id), 'declined')
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
        if (!confirm('¿Estás seguro que querés cancelar esta meet?')) return
        try {
            setSelectedMeetRsvpLoading(true)
            setSelectedMeetRsvpStatus('cancelled')
            await updateMeetStatus(String(selectedMeetEvent.id), 'cancelled')
            toast({
                title: "Asistencia cancelada",
                description: "Hemos actualizado tu estado para esta reunión.",
            })
            setSelectedMeetEvent(null)
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
            eventId: String(selectedMeetEvent.id),
            coachId: String(selectedMeetEvent.coach_id),
            fromStart: String(selectedMeetEvent.start_time),
            fromEnd: selectedMeetEvent.end_time ? String(selectedMeetEvent.end_time) : null,
            durationMinutes,
            snapshot: {
                id: String(selectedMeetEvent.id),
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

    const hostParticipant = selectedMeetParticipants.find(p => String(p.client_id) === String(selectedMeetEvent.coach_id))
    // Filter out host from guests list
    const guests = selectedMeetParticipants.filter(p => String(p.client_id) !== String(selectedMeetEvent.coach_id))
    const coachNameResolved = hostParticipant?.name || coachProfile?.full_name || 'Coach'

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

    const timingStatusLabel = (() => {
        if (isCancelled) return { label: 'Cancelada', color: 'text-red-400 bg-red-500/10 border-red-500/20' }
        if (pendingReschedule?.status === 'pending') return { label: 'Sugerida', color: 'text-[#FFB366] bg-[#FFB366]/10 border-[#FFB366]/20' }
        if (isRescheduled) return { label: 'Reprogramada', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' }
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
                                {showRescheduleHistory && (
                                    <span className="text-xs text-white/20 line-through font-medium">
                                        {format(new Date(pendingReschedule.from_start_time), "d 'de' MMM", { locale: es })}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-400 font-medium">
                                    {timeLabel}
                                </span>
                                {showRescheduleHistory && (
                                    <span className="text-[11px] text-white/20 line-through">
                                        {format(new Date(pendingReschedule.from_start_time), "HH:mm")}
                                    </span>
                                )}
                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">GMT-3</span>
                            </div>

                            {pendingReschedule?.status === 'pending' && (
                                <div className="mt-2 text-[10px] text-[#FFB366] font-medium flex items-center gap-1.5">
                                    <RotateCcw size={12} />
                                    {pendingReschedule.requested_by_user_id === authUserId ? 'Sugeriste un cambio' : `${requestorName} sugirió este cambio`}
                                    {pendingReschedule.note && <span className="text-white/30 italic ml-1">"{pendingReschedule.note}"</span>}
                                </div>
                            )}
                        </div>
                    </div>

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
                                                alt="Coach"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                                                {coachNameResolved.substring(0, 2)}
                                            </div>
                                        )}
                                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#FF7939] border-2 border-zinc-950" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white font-medium">{coachNameResolved}</span>
                                        <span className="text-[9px] text-[#FF7939] font-black uppercase tracking-widest">Anfitrión</span>
                                    </div>
                                </div>
                                <div className="text-xs text-[#FF7939] font-bold">Reserva</div>
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
                                    <div className="text-xs text-white/50 bg-black/20 p-4 rounded-xl border border-white/5 text-center italic leading-relaxed">
                                        Esperando respuesta por parte de {selectedMeetEvent.coach_id === authUserId ? 'los invitados' : 'el coach'} para confirmar el nuevo horario.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                {!isMyRsvpConfirmed && !isCancelled && !isMyRsvpDeclined && !isPast && (
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

                                {isMyRsvpConfirmed && !isCancelled && !isPast && (
                                    <div className="flex flex-col gap-2">
                                        <button
                                            type="button"
                                            disabled={selectedMeetRsvpLoading || !canEditRsvp}
                                            onClick={handleSuggestNewTime}
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
        </div>
    )
}
