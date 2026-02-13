
import React from 'react'
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon, Clock } from "lucide-react"

interface CalendarRescheduleModalProps {
    rescheduleContext: any
    reschedulePreview: any
    setReschedulePreview: (p: any) => void
    setRescheduleContext: (c: any) => void
    setMeetViewMode: (m: 'month' | 'week' | 'day_split') => void
    setSelectedMeetEvent: (e: any) => void
    supabase: any
}

export function CalendarRescheduleModal({
    rescheduleContext,
    reschedulePreview,
    setReschedulePreview,
    setRescheduleContext,
    setMeetViewMode,
    setSelectedMeetEvent,
    supabase
}: CalendarRescheduleModalProps) {

    if (!rescheduleContext || !reschedulePreview) return null

    const handleSendRequest = async () => {
        try {
            const { data: auth } = await supabase.auth.getUser()
            const user = auth?.user
            if (!user?.id) return

            const { error } = await (supabase
                .from('calendar_event_reschedule_requests') as any)
                .insert({
                    event_id: rescheduleContext.eventId,
                    requested_by_user_id: user.id,
                    requested_by_role: 'client',
                    from_start_time: rescheduleContext.fromStart,
                    from_end_time: rescheduleContext.fromEnd,
                    to_start_time: reschedulePreview.toStartIso,
                    to_end_time: reschedulePreview.toEndIso,
                    note: reschedulePreview.note?.trim() ? reschedulePreview.note.trim() : null,
                    status: 'pending',
                })

            if (error) return

            setReschedulePreview(null)
            setRescheduleContext(null)
            setMeetViewMode('month')
            setSelectedMeetEvent(rescheduleContext.snapshot)
        } catch (error) {
            console.error('Error sending reschedule request:', error)
        }
    }

    return (
        <div
            className="fixed inset-0 z-[75] bg-black/60 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            onClick={() => setReschedulePreview(null)}
        >
            <div
                className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-5"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <div className="text-white font-semibold text-xl">Confirmar reprogramación</div>
                    <button
                        type="button"
                        onClick={() => setReschedulePreview(null)}
                        className="w-8 h-8 rounded-full hover:bg-white/10 text-white flex items-center justify-center"
                        aria-label="Cerrar"
                    >
                        <span className="text-xl leading-none">×</span>
                    </button>
                </div>

                <div className="mt-3 text-sm text-white/70">
                    Revisá el nuevo horario antes de enviar la solicitud.
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 bg-black/30 border border-[#FF7939]/30 rounded-lg px-3 py-2 text-sm text-gray-200">
                        <CalendarIcon className="h-4 w-4 text-[#FFB366]" />
                        <span className="font-medium">{format(new Date(reschedulePreview.toStartIso), 'dd MMM yyyy', { locale: es })}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-black/30 border border-[#FF7939]/30 rounded-lg px-3 py-2 text-sm text-gray-200">
                        <Clock className="h-4 w-4 text-[#FFB366]" />
                        <span className="font-medium">
                            {(() => {
                                const a = new Date(reschedulePreview.toStartIso)
                                const b = new Date(reschedulePreview.toEndIso)
                                return `${format(a, 'HH:mm')} – ${format(b, 'HH:mm')}`
                            })()}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/55">
                        <CalendarIcon className="h-4 w-4 text-white/45" />
                        <span className="line-through">{format(new Date(rescheduleContext.fromStart), 'dd MMM yyyy', { locale: es })}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/55">
                        <Clock className="h-4 w-4 text-white/45" />
                        <span className="line-through">
                            {(() => {
                                const a = new Date(rescheduleContext.fromStart)
                                const b = rescheduleContext.fromEnd ? new Date(rescheduleContext.fromEnd) : null
                                return `${format(a, 'HH:mm')}${b && !Number.isNaN(b.getTime()) ? ` – ${format(b, 'HH:mm')}` : ''}`
                            })()}
                        </span>
                    </div>
                </div>

                <div className="mt-4">
                    <div className="text-base font-semibold text-white">Nota (opcional)</div>
                    <textarea
                        value={reschedulePreview.note}
                        onChange={(e) => setReschedulePreview((p: any) => (p ? { ...p, note: e.target.value } : p))}
                        className="mt-2 w-full rounded-xl bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-[#FF7939]/60"
                        rows={3}
                        placeholder="Dejá un mensaje para tu coach..."
                    />
                </div>

                <div className="mt-4 flex flex-col gap-2">
                    <button
                        type="button"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#FF7939] text-black text-sm font-semibold hover:opacity-95 transition-opacity"
                        onClick={handleSendRequest}
                    >
                        Enviar solicitud
                    </button>

                    <button
                        type="button"
                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-sm border border-white/15 hover:bg-zinc-800 transition-colors"
                        onClick={() => setReschedulePreview(null)}
                    >
                        Volver
                    </button>
                </div>
            </div>
        </div>
    )
}
