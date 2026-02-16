import React, { useState, useEffect } from 'react'
import { format, startOfWeek, differenceInHours } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar as CalendarIcon, X, Users, Clock, CheckCircle2, XCircle, RotateCcw } from 'lucide-react'
import { createClient } from '@/lib/supabase/supabase-client'
import { toast } from 'sonner'

interface CoachMeetDetailModalProps {
    event: any
    onClose: () => void
    onSuggestNewTime?: (event: any) => void
    onRefresh?: () => void
}

export function CoachMeetDetailModal({
    event,
    onClose,
    onSuggestNewTime,
    onRefresh
}: CoachMeetDetailModalProps) {
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [participants, setParticipants] = useState<any[]>([])
    const [pendingReschedule, setPendingReschedule] = useState<any>(null)

    useEffect(() => {
        loadParticipants()
        loadPendingReschedule()
    }, [event.id])

    const loadParticipants = async () => {
        try {
            const { data, error } = await supabase
                .from('calendar_event_participants')
                .select(`
          *,
          user:user_id (
            id,
            full_name,
            avatar_url
          )
        `)
                .eq('event_id', event.id)

            if (error) throw error
            setParticipants(data || [])
        } catch (err) {
            console.error('Error loading participants:', err)
        }
    }

    const loadPendingReschedule = async () => {
        try {
            const { data, error } = await supabase
                .from('calendar_event_reschedule_requests')
                .select('*')
                .eq('event_id', event.id)
                .eq('status', 'pending')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            if (error) throw error
            setPendingReschedule(data)
        } catch (err) {
            console.error('Error loading reschedule:', err)
        }
    }

    const handleAccept = async () => {
        try {
            setLoading(true)

            // Update event status to confirmed
            const { error } = await supabase
                .from('calendar_events')
                .update({ status: 'scheduled' })
                .eq('id', event.id)

            if (error) throw error

            toast.success('Meet confirmada', {
                description: 'Has aceptado la solicitud de reunión.'
            })

            if (onRefresh) onRefresh()
            onClose()
        } catch (err) {
            console.error('Error accepting meet:', err)
            toast.error('Error al aceptar', {
                description: 'No se pudo confirmar la reunión.'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleReject = async () => {
        try {
            setLoading(true)

            // Update event status to cancelled
            const { error } = await supabase
                .from('calendar_events')
                .update({ status: 'cancelled' })
                .eq('id', event.id)

            if (error) throw error

            toast.success('Meet rechazada', {
                description: 'Has rechazado la solicitud de reunión.'
            })

            if (onRefresh) onRefresh()
            onClose()
        } catch (err) {
            console.error('Error rejecting meet:', err)
            toast.error('Error al rechazar', {
                description: 'No se pudo rechazar la reunión.'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleAcceptReschedule = async () => {
        if (!pendingReschedule) return

        try {
            setLoading(true)

            // Update reschedule request status
            const { error: reqErr } = await supabase
                .from('calendar_event_reschedule_requests')
                .update({ status: 'accepted' })
                .eq('id', pendingReschedule.id)

            if (reqErr) throw reqErr

            // Update event times
            const { error: evtErr } = await supabase
                .from('calendar_events')
                .update({
                    start_time: pendingReschedule.to_start_time,
                    end_time: pendingReschedule.to_end_time,
                    status: 'scheduled'
                })
                .eq('id', event.id)

            if (evtErr) throw evtErr

            toast.success('Cambio aceptado', {
                description: 'La reunión se ha reprogramado correctamente.'
            })

            if (onRefresh) onRefresh()
            onClose()
        } catch (err) {
            console.error('Error accepting reschedule:', err)
            toast.error('Error', {
                description: 'No se pudo aceptar el cambio de horario.'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleRejectReschedule = async () => {
        if (!pendingReschedule) return

        try {
            setLoading(true)

            const { error } = await supabase
                .from('calendar_event_reschedule_requests')
                .update({ status: 'declined' })
                .eq('id', pendingReschedule.id)

            if (error) throw error

            toast.success('Cambio rechazado', {
                description: 'Se ha mantenido el horario original.'
            })

            setPendingReschedule(null)
            if (onRefresh) onRefresh()
        } catch (err) {
            console.error('Error rejecting reschedule:', err)
            toast.error('Error', {
                description: 'No se pudo rechazar el cambio.'
            })
        } finally {
            setLoading(false)
        }
    }

    const start = new Date(event.start_time)
    const end = event.end_time ? new Date(event.end_time) : null
    const timeLabel = `${format(start, 'HH:mm')}${end && !Number.isNaN(end.getTime()) ? ` – ${format(end, 'HH:mm')}` : ''}`
    const dateLabel = format(start, "EEEE d 'de' MMMM", { locale: es })

    const isCancelled = event.status === 'cancelled'
    const isPending = event.status === 'pending' || !event.status
    const isConfirmed = event.status === 'scheduled'
    const isPast = start.getTime() < Date.now()
    const hoursUntilMeet = differenceInHours(start, new Date())
    const isToday = hoursUntilMeet >= 0 && hoursUntilMeet < 24

    // Find my participant data (Coach)
    const myParticipant = participants.find(p => p.user_id === event.coach_id)
    const myRsvp = myParticipant?.rsvp_status || 'pending'
    const isMyRsvpPending = myRsvp === 'pending'

    // Count confirmations
    const confirmedCount = participants.filter(p => p.rsvp_status === 'accepted' || p.rsvp_status === 'confirmed').length
    const totalCount = participants.length
    const allConfirmed = confirmedCount === totalCount && totalCount > 0

    // Standardized Status Label Colors (Semaforo)
    const statusLabel = (() => {
        if (isCancelled) return { label: 'Cancelada', color: 'text-red-500 bg-red-500/10 border-red-500/20' }
        if (isPast) return { label: 'Finalizada', color: 'text-gray-400 bg-white/5 border-white/10 shadow-none' }
        if (pendingReschedule?.status === 'pending') return { label: 'Cambio Solicitado', color: 'text-red-500 bg-red-500/10 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]' }
        if (event.status === 'rescheduled') return { label: 'Reprogramada', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' }

        if (isPending) return { label: 'Pendiente (Solicitud)', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' }

        // If scheduled but waiting for others
        if (!allConfirmed) {
            // Differentiate: If *I* am pending, show "Pendiente". If I am accepted but others pending, show "Invitación Enviada"
            if (isMyRsvpPending) return { label: 'Pendiente (Acción req.)', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' }
            return { label: 'Invitación Enviada', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' }
        }

        return { label: 'Confirmada', color: 'text-[#FF7939] bg-[#FF7939]/10 border-[#FF7939]/20 shadow-[0_0_15px_rgba(255,121,57,0.15)]' }
    })()

    // 24h rule fix: Allow actions if RSVP is pending even if < 24h
    const isUnder24h = hoursUntilMeet < 24 && hoursUntilMeet >= 0
    // Fix: Allow if my RSVP is currently pending, regardless of time
    const canPerformActions = !isPast && (!isUnder24h || isPending || isMyRsvpPending)

    return (
        <div
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-5 overflow-y-auto max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div className="flex flex-col gap-2.5">
                        <h2 className="text-3xl font-bold text-white tracking-tight leading-none">
                            {event.title || 'Reunión'}
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className={statusLabel.color + " text-[9px] font-black uppercase tracking-[0.1em] px-2.5 py-1 rounded-full border shadow-sm"}>
                                {statusLabel.label}
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-[0.1em] px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-white/40">
                                {event.event_type === 'workshop' ? 'Workshop' : 'Meet'}
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-10 h-10 rounded-full hover:bg-white/5 text-white/30 hover:text-white flex items-center justify-center transition-all -mr-2"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Date/Time */}
                    <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-2xl bg-zinc-900 border flex items-center justify-center flex-shrink-0 ${isCancelled ? 'border-red-500/20 text-red-500' : 'border-white/10 text-[#FF7939]'}`}>
                            <CalendarIcon size={22} strokeWidth={1.5} />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-base font-semibold text-white capitalize leading-tight">
                                {dateLabel}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-400 font-medium">
                                    {timeLabel}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">GMT-3</span>
                            </div>
                        </div>
                    </div>

                    {/* Pending Reschedule Notice */}
                    {pendingReschedule?.status === 'pending' && (
                        <div className="bg-[#FFB366]/10 border border-[#FFB366]/20 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <RotateCcw className="w-5 h-5 text-[#FFB366] flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-[#FFB366] mb-1">Cambio de horario sugerido</div>
                                    <div className="text-xs text-white/60">
                                        Nuevo horario: {format(new Date(pendingReschedule.to_start_time), "d 'de' MMM 'a las' HH:mm", { locale: es })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Participants */}
                    {participants.length > 0 && (
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center flex-shrink-0 text-white/70">
                                <Users size={22} strokeWidth={1.5} />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-semibold text-white mb-2">Participantes</div>
                                <div className="space-y-2">
                                    {participants.map((p) => (
                                        <div key={p.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {p.user?.avatar_url ? (
                                                    <img src={p.user.avatar_url} alt={p.user.full_name} className="w-6 h-6 rounded-full" />
                                                ) : (
                                                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center">
                                                        <Users className="w-3 h-3 text-zinc-500" />
                                                    </div>
                                                )}
                                                <span className="text-xs text-white/70">
                                                    {p.user?.full_name || 'Usuario'}
                                                    {String(p.user_id) === String(p.invited_by_user_id) && <span className="ml-1 text-[9px] text-zinc-500">(Organizador)</span>}
                                                </span>
                                            </div>
                                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${(() => {
                                                const pRsvp = isCancelled ? 'cancelled' : p.rsvp_status;
                                                return (pRsvp === 'accepted' || pRsvp === 'confirmed')
                                                    ? 'bg-[#FF7939]/10 text-[#FF7939] border border-[#FF7939]/20'
                                                    : (pRsvp === 'declined' || pRsvp === 'cancelled')
                                                        ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                        : 'bg-white/5 text-white/40 border border-white/10'
                                            })()}`}>
                                                {(() => {
                                                    const pRsvp = isCancelled ? 'cancelled' : p.rsvp_status;
                                                    return (pRsvp === 'accepted' || pRsvp === 'confirmed') ? 'Confirmado' : (pRsvp === 'declined' || pRsvp === 'cancelled' ? 'Cancelado' : 'Pendiente')
                                                })()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {event.description && (
                        <div className="text-sm text-gray-400 bg-white/5 rounded-xl p-4 border border-white/5">
                            {event.description}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-3 pt-4">
                        {isUnder24h && !isPending && !isCancelled && isConfirmed && !isMyRsvpPending && (
                            <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 border border-white/5 text-gray-500 text-[10px] uppercase font-black tracking-widest text-center">
                                <Clock className="w-3 h-3" />
                                Edición deshabilitada (faltan menos de 24hs)
                            </div>
                        )}

                        {/* Pending Reschedule Actions */}
                        {pendingReschedule?.status === 'pending' && (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleAcceptReschedule}
                                    disabled={loading || !canPerformActions}
                                    className="flex-1 h-12 rounded-2xl bg-[#FF7939] text-black font-bold hover:bg-[#FF7939]/90 transition-all disabled:opacity-50"
                                >
                                    Aceptar Cambio
                                </button>
                                <button
                                    onClick={handleRejectReschedule}
                                    disabled={loading || !canPerformActions}
                                    className="flex-1 h-12 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all disabled:opacity-50"
                                >
                                    Rechazar
                                </button>
                            </div>
                        )}

                        {/* Initial Pending Actions (Coach hasn't responded yet) */}
                        {isPending && !pendingReschedule && !isCancelled && (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleAccept}
                                    disabled={loading || !canPerformActions}
                                    className="flex-1 h-12 rounded-2xl bg-[#FF7939] text-black font-bold hover:bg-[#FF7939]/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                    Aceptar
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={loading || !canPerformActions}
                                    className="flex-1 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold hover:bg-red-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <XCircle className="w-5 h-5" />
                                    Rechazar
                                </button>
                            </div>
                        )}

                        {/* Suggest New Time (available for pending or confirmed) */}
                        {!isCancelled && !isPast && onSuggestNewTime && (
                            <button
                                onClick={() => {
                                    onClose()
                                    onSuggestNewTime(event)
                                }}
                                disabled={loading}
                                className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <RotateCcw className="w-5 h-5" />
                                Sugerir Nuevo Horario
                            </button>
                        )}

                        {/* Join Button (only show on the day of the meet and if all confirmed) */}
                        {!isCancelled && !isPast && isConfirmed && allConfirmed && isToday && event.meet_link && (
                            <button
                                onClick={() => window.open(event.meet_link, '_blank')}
                                className="w-full h-12 rounded-2xl bg-[#FF7939] text-black font-bold hover:bg-[#FF7939]/90 transition-all shadow-[0_4px_12px_rgba(255,121,57,0.2)]"
                            >
                                Unirse a la Meet
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
