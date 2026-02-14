
import React from 'react'
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon, Clock, Globe } from "lucide-react"

interface CalendarBookingModalProps {
    selectedMeetRequest: any
    setSelectedMeetRequest: (req: any) => void
    meetViewMode: 'month' | 'week' | 'day_split'
    setMeetViewMode: (mode: 'month' | 'week' | 'day_split') => void
    coachProfiles: any[]
    meetCreditsByCoachId: Record<string, number>
    isPaidMeetFlow: boolean
    purchaseContext: any
    meetPurchasePaid: boolean
    onSetScheduleMeetContext: (ctx: any) => void
    authUserId: string | null
    selectedCoachId: string | null
    selectedCoachProfile: any
    rescheduleContext: any
    setRescheduleContext: (ctx: any) => void
    setReschedulePreview: (prev: any) => void
    handleClearCoachForMeet: () => void
    setSuccessModalData: (data: any) => void
    setShowSuccessModal: (show: boolean) => void
    supabase: any
    createCheckoutProPreference: (actId: string) => Promise<any>
    redirectToMercadoPagoCheckout: (url: string, actId: string, prefId: string) => void
    scheduleMeetContext: any
}

export function CalendarBookingModal({
    selectedMeetRequest,
    setSelectedMeetRequest,
    meetViewMode,
    setMeetViewMode,
    coachProfiles,
    meetCreditsByCoachId,
    isPaidMeetFlow,
    purchaseContext,
    meetPurchasePaid,
    onSetScheduleMeetContext,
    authUserId,
    selectedCoachId,
    selectedCoachProfile,
    rescheduleContext,
    setRescheduleContext,
    setReschedulePreview,
    handleClearCoachForMeet,
    setSuccessModalData,
    setShowSuccessModal,
    supabase,
    createCheckoutProPreference,
    redirectToMercadoPagoCheckout,
    scheduleMeetContext
}: CalendarBookingModalProps) {

    if (!selectedMeetRequest || meetViewMode === 'day_split') return null

    const coachName = coachProfiles.find((c) => c.id === String(selectedMeetRequest.coachId))?.full_name || 'Coach'
    const creditsAvailable = Number(meetCreditsByCoachId?.[String(selectedMeetRequest.coachId)] ?? 0)
    const dateLabel = format(new Date(`${selectedMeetRequest.dayKey}T00:00:00`), 'dd MMM yyyy', { locale: es })
    const durationMins = isPaidMeetFlow
        ? (Number(purchaseContext?.durationMinutes ?? 30) || 30)
        : 30

    const [h, m] = selectedMeetRequest.timeHHMM.split(':').map((x: string) => parseInt(x, 10))
    const total = (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0) + durationMins
    const hh = Math.floor(total / 60)
    const mm = total % 60
    const timeLabel = `${selectedMeetRequest.timeHHMM} – ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`

    const canConfirm = isPaidMeetFlow ? meetPurchasePaid : creditsAvailable > 0

    const handleConfirm = async () => {
        if (!authUserId || !selectedCoachId || !canConfirm) return

        if (rescheduleContext) {
            const startIso = new Date(`${selectedMeetRequest.dayKey}T${selectedMeetRequest.timeHHMM}:00`).toISOString()
            const duration = Number(rescheduleContext.durationMinutes ?? 30) || 30
            const endIso = new Date(new Date(startIso).getTime() + duration * 60 * 1000).toISOString()

            try {
                const { data: participantData } = await (supabase
                    .from('calendar_event_participants') as any)
                    .select('rsvp_status, invited_by_user_id')
                    .eq('event_id', rescheduleContext.eventId)
                    .eq('user_id', authUserId)
                    .single()

                if (participantData?.rsvp_status === 'pending' && participantData?.invited_by_user_id === authUserId) {
                    const { error: updateError } = await (supabase
                        .from('calendar_events') as any)
                        .update({ start_time: startIso, end_time: endIso })
                        .eq('id', rescheduleContext.eventId)

                    if (updateError) return

                    setRescheduleContext(null)
                    setReschedulePreview(null)
                    setMeetViewMode('month')
                    setSelectedMeetRequest(null)
                    handleClearCoachForMeet()

                    const coachName = selectedCoachProfile?.full_name || 'Coach'
                    const dateFormatted = format(new Date(startIso), "EEEE d 'de' MMMM", { locale: es })
                    const [sh, sm] = selectedMeetRequest.timeHHMM.split(':').map(Number)
                    const sMins = sh * 60 + sm
                    const eMins = sMins + duration
                    const eH = Math.floor(eMins / 60)
                    const eM = eMins % 60
                    const endTime = `${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}`

                    setSuccessModalData({
                        coachName,
                        date: dateFormatted,
                        time: `${selectedMeetRequest.timeHHMM} – ${endTime}`,
                        duration,
                        message: "Solicitud enviada al coach, espera a que confirme..."
                    })
                    setShowSuccessModal(true)
                    return
                }
            } catch (error) {
                console.error('Error checking meet status:', error)
            }

            setReschedulePreview({
                dayKey: selectedMeetRequest.dayKey,
                timeHHMM: selectedMeetRequest.timeHHMM,
                toStartIso: startIso,
                toEndIso: endIso,
                note: '',
            })
            return
        }

        // New Meet Event
        try {
            const startIso = new Date(`${selectedMeetRequest.dayKey}T${selectedMeetRequest.timeHHMM}:00`).toISOString()
            const duration = isPaidMeetFlow ? (Number(purchaseContext?.durationMinutes ?? 30) || 30) : 30
            const endIso = new Date(new Date(startIso).getTime() + duration * 60 * 1000).toISOString()

            const payload = {
                coach_id: selectedMeetRequest.coachId,
                title: selectedMeetRequest.title,
                description: selectedMeetRequest.description || null,
                start_time: startIso,
                end_time: endIso,
                event_type: 'consultation',
                status: 'scheduled',
                created_by_user_id: authUserId,
                activity_id: scheduleMeetContext?.activityId ? Number(scheduleMeetContext.activityId) : null,
            };

            const { data: newEvent, error } = await (supabase.from('calendar_events') as any).insert(payload).select('id').single()
            if (error || !newEvent?.id) return

            await (supabase.from('calendar_event_participants') as any).insert({
                event_id: newEvent.id,
                user_id: authUserId,
                rsvp_status: 'pending',
                invited_by_user_id: authUserId,
                invited_by_role: 'client',
            })

            const cName = selectedCoachProfile?.full_name || 'Coach'
            const dFormatted = format(new Date(payload.start_time), "EEEE d 'de' MMMM", { locale: es })
            const [sh, sm] = selectedMeetRequest.timeHHMM.split(':').map(Number)
            const sMins = sh * 60 + sm
            const eMins = sMins + duration
            const eH = Math.floor(eMins / 60)
            const eM = eMins % 60
            const endTime = `${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}`

            setSuccessModalData({
                coachName: cName,
                date: dFormatted,
                time: `${selectedMeetRequest.timeHHMM} – ${endTime}`,
                duration,
            })

            setMeetViewMode('month')
            setSelectedMeetRequest(null)
            if (onSetScheduleMeetContext) onSetScheduleMeetContext(null)
            setShowSuccessModal(true)
        } catch (error) {
            console.error('Error creating new meet:', error)
        }
    }

    const handlePayment = async () => {
        const actId = scheduleMeetContext?.activityId ? String(scheduleMeetContext.activityId) : null
        if (!actId) return
        try {
            sessionStorage.setItem('pending_meet_booking', JSON.stringify({
                coachId: String(selectedMeetRequest.coachId),
                activityId: actId,
                dayKey: selectedMeetRequest.dayKey,
                timeHHMM: selectedMeetRequest.timeHHMM,
                durationMinutes: Number(purchaseContext?.durationMinutes ?? 30) || 30,
            }))
        } catch { }
        const res = await createCheckoutProPreference(actId)
        if (res?.success && res?.initPoint) {
            redirectToMercadoPagoCheckout(res.initPoint, actId, res.preferenceId)
        }
    }

    return (
        <div
            className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            onClick={() => setSelectedMeetRequest(null)}
        >
            <div
                className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-5"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0 pt-1">
                        <h2 className="text-xl font-bold text-white mb-0.5 leading-tight">
                            {rescheduleContext ? 'Reprogramar' : 'Solicitud de Meet'}
                        </h2>
                        <div className="flex items-center gap-1.5 mt-2">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white text-black">Meet</span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#FF7939] text-black">
                                <Globe className="h-2.5 w-2.5" /> ONLINE
                            </span>
                        </div>
                    </div>
                    <button type="button" onClick={() => setSelectedMeetRequest(null)} className="w-8 h-8 rounded-full hover:bg-white/10 text-white flex items-center justify-center transition-colors -mt-1 -mr-1">
                        <span className="text-xl leading-none">&times;</span>
                    </button>
                </div>

                <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-3 px-1 py-1">
                        <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-[#FF7939] flex-shrink-0">
                            <CalendarIcon className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-white leading-tight capitalize">{dateLabel}</span>
                            <span className="text-xs text-gray-400">{timeLabel} (GMT-3)</span>
                        </div>
                    </div>

                    <div className="border-t border-dashed border-white/10" />

                    <div>
                        <div className="text-sm font-semibold text-white mb-2">Organizador</div>
                        <div className="px-3 py-3 flex items-center justify-between gap-3 bg-black/20 border border-white/10 rounded-xl">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center">
                                        {selectedCoachProfile?.avatar_url ? (
                                            <img src={selectedCoachProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-bold text-white uppercase">{coachName.substring(0, 2)}</span>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#FF7939] border-2 border-zinc-950" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-white text-sm font-medium leading-tight truncate">{coachName}</div>
                                    <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Coach Principal</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="text-sm font-semibold text-white">Nombre de la meet</div>
                        <input
                            value={selectedMeetRequest.title}
                            readOnly={!!rescheduleContext}
                            onChange={(e) => setSelectedMeetRequest((prev: any) => prev ? { ...prev, title: e.target.value } : prev)}
                            className={`mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF7939] transition-colors ${rescheduleContext ? 'opacity-50 cursor-not-allowed' : ''}`}
                            placeholder="Ej: Check rápido · Dudas de rutina"
                        />
                    </div>

                    <div>
                        <div className="text-sm font-semibold text-white">
                            {rescheduleContext ? 'Agregar detalle de cambio' : 'Notas adicionales'}
                        </div>
                        <textarea
                            value={selectedMeetRequest.description}
                            onChange={(e) => setSelectedMeetRequest((prev: any) => prev ? { ...prev, description: e.target.value } : prev)}
                            className="mt-2 w-full min-h-[96px] rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF7939] transition-colors resize-none"
                            placeholder={rescheduleContext ? "Explicá brevemente por qué solicitás el cambio..." : "¿Sobre qué te gustaría hablar en esta sesión?..."}
                        />
                    </div>

                    <div className="mt-4">
                        <div className="text-base font-semibold text-white">{isPaidMeetFlow ? 'Resumen de pago' : (rescheduleContext ? 'Duración' : 'Esto consumirá 1 crédito')}</div>
                        {isPaidMeetFlow ? (
                            <div className="mt-1 text-sm text-white/70">
                                Total: <span className="text-white/90 font-semibold">${Number(purchaseContext?.price ?? 0) || 0}</span> · Duración: <span className="text-white/90 font-semibold">{Number(purchaseContext?.durationMinutes ?? 30) || 30} min</span>
                            </div>
                        ) : (
                            <div className="mt-1 text-sm text-white/70">
                                {rescheduleContext ? (
                                    <span>Duración actual: <span className="text-white/90 font-semibold">{Number(purchaseContext?.durationMinutes ?? 30) || 30} min</span></span>
                                ) : (
                                    <span>Tenés <span className="text-white/90 font-semibold">{Number.isFinite(creditsAvailable) ? creditsAvailable : 0}</span> créditos disponibles con este coach.</span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                        {isPaidMeetFlow && !meetPurchasePaid && (
                            <button
                                type="button"
                                disabled={!(scheduleMeetContext?.activityId)}
                                className={scheduleMeetContext?.activityId ? 'w-full px-4 py-2.5 rounded-xl bg-[#FF7939] text-black text-sm font-semibold hover:opacity-95 transition-opacity' : 'w-full px-4 py-2.5 rounded-xl bg-white/10 text-white/70 text-sm font-semibold border border-white/15 cursor-not-allowed'}
                                onClick={handlePayment}
                            >
                                Pagar
                            </button>
                        )}

                        <button
                            type="button"
                            disabled={!canConfirm}
                            className={canConfirm ? 'w-full px-4 py-2.5 rounded-xl bg-[#FF7939] text-black text-sm font-semibold hover:opacity-95 transition-opacity' : 'w-full px-4 py-2.5 rounded-xl bg-white/10 text-white/70 text-sm font-semibold border border-white/15 cursor-not-allowed'}
                            onClick={handleConfirm}
                        >
                            {rescheduleContext ? 'Revisar cambio' : 'Confirmar solicitud'}
                        </button>

                        {!canConfirm && !isPaidMeetFlow && (
                            <div className="text-[11px] text-white/55">No tenés créditos disponibles para solicitar este meet.</div>
                        )}

                        <button
                            type="button"
                            className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-sm border border-white/15 hover:bg-zinc-800 transition-colors"
                            onClick={() => setSelectedMeetRequest(null)}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
