
import React from 'react'
import { format, addDays } from "date-fns"
import { es } from "date-fns/locale"
import { Clock, ChevronLeft, ChevronRight, Video, XCircle, Flame, Utensils } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatMinutes, START_HOUR, END_HOUR, TOTAL_MINS, getTop, getHeight, coalesceSlots } from "../utils"

interface CalendarDaySplitViewProps {
    selectedDate: Date
    setSelectedDate: React.Dispatch<React.SetStateAction<Date | null>>
    setMeetViewMode: (mode: 'month' | 'week' | 'day_split') => void
    rescheduleContext: any
    setRescheduleContext: (ctx: any) => void
    setSelectedMeetRequest: (req: any) => void
    setSelectedMeetEvent: (evt: any) => void
    activitiesByDate: Record<string, any[]>
    dayMinutesByDate: Record<string, any>
    renderClientEvents: (dayKey: string) => React.ReactNode
    getSlotsForDate: (d: Date, durationMinutes?: number) => string[]
    handleTimelineClick: (e: any, start: string, end: string, dayKey: string) => void
    selectedMeetRequest: any
    selectedConsultationType: 'express' | 'puntual' | 'profunda'
    setSelectedConsultationType: (t: 'express' | 'puntual' | 'profunda') => void
    coachConsultations: any
    isPaidMeetFlow: boolean
    meetCreditsByCoachId: Record<string, number>
    meetPurchasePaid: boolean
    scheduleMeetContext: any
    coachProfiles: any[]
    selectedCoachId: string | null
    authUserId: string | null
    supabase: any
    setSuccessModalData: (data: any) => void
    setShowSuccessModal: (show: boolean) => void
    setSelectedMeetRsvpLoading: (loading: boolean) => void
    handleClearCoachForMeet: () => void
    createCheckoutProPreference: any
    redirectToMercadoPagoCheckout: any
    onSetScheduleMeetContext?: (ctx: any) => void
    selectedMeetRsvpLoading: boolean
    setMeetEventsByDate: React.Dispatch<React.SetStateAction<any>>
    onEventUpdated?: () => Promise<void>
}

export function CalendarDaySplitView({
    selectedDate,
    setSelectedDate,
    setMeetViewMode,
    rescheduleContext,
    setRescheduleContext,
    setSelectedMeetRequest,
    setSelectedMeetEvent,
    activitiesByDate,
    dayMinutesByDate,
    renderClientEvents,
    getSlotsForDate,
    handleTimelineClick,
    selectedMeetRequest,
    selectedConsultationType,
    setSelectedConsultationType,
    coachConsultations,
    isPaidMeetFlow,
    meetCreditsByCoachId,
    meetPurchasePaid,
    scheduleMeetContext,
    coachProfiles,
    selectedCoachId,
    authUserId,
    supabase,
    setSuccessModalData,
    setShowSuccessModal,
    setSelectedMeetRsvpLoading,
    handleClearCoachForMeet,
    createCheckoutProPreference,
    redirectToMercadoPagoCheckout,
    onSetScheduleMeetContext,
    selectedMeetRsvpLoading,
    setMeetEventsByDate,
    onEventUpdated
}: CalendarDaySplitViewProps) {

    const availableSlots = React.useMemo(() => {
        if (!selectedDate) return []
        return getSlotsForDate(selectedDate, 15)
    }, [selectedDate, getSlotsForDate])

    const isDurationValid = React.useCallback((mins: number) => {
        if (!selectedMeetRequest?.timeHHMM) return false

        let whitelistedSlots: string[] = []
        if (rescheduleContext?.fromStart && rescheduleContext?.fromEnd) {
            const start = new Date(rescheduleContext.fromStart)
            const end = new Date(rescheduleContext.fromEnd)
            const diffMins = (end.getTime() - start.getTime()) / 60000
            const originalBlocks = Math.ceil(diffMins / 15)

            const h = start.getHours()
            const m = start.getMinutes()
            let currentW = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`

            for (let k = 0; k < originalBlocks; k++) {
                whitelistedSlots.push(currentW)
                const [hh, mm] = currentW.split(':').map(Number)
                const total = hh * 60 + mm + 15
                const nextH = Math.floor(total / 60)
                const nextM = total % 60
                currentW = `${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`
            }
        }

        const blocks = Math.ceil(mins / 15)
        let current = selectedMeetRequest.timeHHMM
        for (let i = 0; i < blocks; i++) {
            if (!availableSlots.includes(current) && !whitelistedSlots.includes(current)) return false

            const [h, m] = current.split(':').map(Number)
            const nextTotal = h * 60 + m + 15
            const nextH = Math.floor(nextTotal / 60)
            const nextM = nextTotal % 60
            current = `${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`
        }
        return true
    }, [selectedMeetRequest?.timeHHMM, availableSlots, rescheduleContext])

    return (
        <div>
            {/* Header: Back + Title */}
            <div className="flex flex-col items-center justify-center mb-4 transition-all animate-in fade-in slide-in-from-top-2 relative z-10 pointer-events-auto">
                <div className="flex items-center gap-2 mb-4">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            e.nativeEvent.stopImmediatePropagation()
                            setSelectedMeetRequest(null)
                            setSelectedMeetEvent(null)
                            setMeetViewMode('week')
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseUp={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-white/50 hover:text-white transition-colors cursor-pointer relative z-10"
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Volver a semana
                    </button>

                    {rescheduleContext && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setRescheduleContext(null)
                                setMeetViewMode('month')
                                setSelectedMeetRequest(null)
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 transition-colors cursor-pointer relative z-10 ml-2"
                        >
                            <XCircle className="h-3.5 w-3.5" />
                            Cancelar reprogramación
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-6">
                    <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 text-white/50 hover:text-white hover:bg-white/10 rounded-full"
                        onClick={() => setSelectedDate(d => d ? addDays(d, -1) : d)}
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="text-white font-bold text-xl capitalize">
                        {format(selectedDate, 'EEEE d MMMM', { locale: es })}
                    </div>
                    <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 text-white/50 hover:text-white hover:bg-white/10 rounded-full"
                        onClick={() => setSelectedDate(d => d ? addDays(d, 1) : d)}
                    >
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* LEFT PANEL: TIMELINE (Slots) */}
                <div className="w-full md:w-1/2">
                    <div className="bg-transparent overflow-hidden flex flex-col relative">
                        {/* Header */}
                        <div className="flex bg-transparent">
                            <div className="w-6 flex-shrink-0" />
                            <div className="flex-1 text-center py-3">
                                {(() => {
                                    const dayKey = format(selectedDate, 'yyyy-MM-dd')
                                    const dayActs = activitiesByDate[dayKey] || []
                                    const mins = dayMinutesByDate[dayKey]

                                    // Fallback if no specific data
                                    const hasActivities = dayActs.length > 0 || (mins?.fitnessMinutesTotal || 0) > 0 || (mins?.nutritionMinutesTotal || 0) > 0 || (mins?.meetsMinutes || 0) > 0

                                    if (!hasActivities) {
                                        return (
                                            <div className="flex flex-col justify-center h-full">
                                                <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-0.5">
                                                    {format(selectedDate, 'EEEE d', { locale: es })}
                                                </div>
                                                <div className="text-sm font-bold text-zinc-600">
                                                    Sin programación
                                                </div>
                                            </div>
                                        )
                                    }

                                    return (
                                        <div className="flex flex-col justify-center h-full gap-2">
                                            <div className="flex flex-wrap justify-center gap-3">
                                                {mins?.fitnessMinutesTotal > 0 && (
                                                    <span
                                                        className={
                                                            `inline-flex items-center justify-center px-3 py-1 rounded-full border text-xs font-semibold ` +
                                                            `border-[#FF7939]/40 bg-[#FF7939]/10 text-[#FFB366]`
                                                        }
                                                    >
                                                        <Flame className="w-3.5 h-3.5 mr-1.5" />
                                                        {formatMinutes(mins.fitnessMinutesTotal)}
                                                    </span>
                                                )}
                                                {mins?.nutritionMinutesTotal > 0 && (
                                                    <span
                                                        className={
                                                            `inline-flex items-center justify-center px-3 py-1 rounded-full border text-xs font-semibold ` +
                                                            `border-[#FFB873]/40 bg-[#FFB873]/10 text-[#FFB366]`
                                                        }
                                                    >
                                                        <Utensils className="w-3.5 h-3.5 mr-1.5" />
                                                        {formatMinutes(mins.nutritionMinutesTotal)}
                                                    </span>
                                                )}
                                                {mins?.meetsMinutes > 0 && (
                                                    <span
                                                        className={
                                                            `inline-flex items-center justify-center px-3 py-1 rounded-full border text-xs font-semibold ` +
                                                            `border-[#FF7939]/30 bg-[#FF7939]/10 text-[#FFB366]`
                                                        }
                                                    >
                                                        <Video className="w-3.5 h-3.5 mr-1.5" />
                                                        {formatMinutes(mins.meetsMinutes)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })()}
                            </div>
                        </div>

                        {/* Scrollable Body */}
                        <div className="flex-1 relative">
                            <div className="flex min-h-[1000px] h-full relative">
                                {/* Time Axis */}
                                <div className="w-5 flex-shrink-0 bg-transparent text-[10px] text-white/40 font-bold text-left relative pl-1">
                                    {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => {
                                        const h = START_HOUR + i
                                        return (
                                            <div key={h} className="absolute w-full" style={{ top: `${(i * 60 / TOTAL_MINS) * 100}%` }}>
                                                <span className="relative -top-2">{h}</span>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Day Column */}
                                <div className="flex-1 relative">
                                    {/* Horizontal Lines */}
                                    {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
                                        <div key={`grid-${i}`} className="absolute w-full border-t border-white/5 pointer-events-none" style={{ top: `${(i * 60 / TOTAL_MINS) * 100}%` }} />
                                    ))}

                                    {/* Client Events */}
                                    {renderClientEvents(format(selectedDate, 'yyyy-MM-dd'))}

                                    {/* Available Blocks */}
                                    {(() => {
                                        const slots = getSlotsForDate(selectedDate)
                                        const blocks = coalesceSlots(slots)
                                        return blocks.map((block, idx) => {
                                            const startMins = Number(block.start.split(':')[0]) * 60 + Number(block.start.split(':')[1])
                                            const endMins = Number(block.end.split(':')[0]) * 60 + Number(block.end.split(':')[1])
                                            const duration = endMins - startMins

                                            // Validation: Past or < Now + 1hr
                                            const dayKey = format(selectedDate, 'yyyy-MM-dd')
                                            const slotDate = new Date(`${dayKey}T${block.start}:00`)
                                            const now = new Date()
                                            const minTime = new Date(now.getTime() + 60 * 60 * 1000) // Now + 1 hour
                                            const isBlocked = slotDate < minTime

                                            return (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={(e) => {
                                                        if (isBlocked) {
                                                            alert('No se pueden reservar turnos con menos de 1 hora de anticipación.')
                                                            e.stopPropagation()
                                                            return
                                                        }
                                                        handleTimelineClick(e, block.start, block.end, dayKey)
                                                    }}
                                                    style={{
                                                        top: `${getTop(block.start)}%`,
                                                        height: `${getHeight(duration)}%`
                                                    }}
                                                    className={`absolute left-0 right-0 mx-1 rounded-md border text-[10px] font-medium flex items-center justify-center
                                      overflow-hidden transition-all shadow-sm group
                                      ${isBlocked
                                                            ? 'bg-zinc-800/50 border-zinc-700/50 text-zinc-500 cursor-not-allowed opacity-60'
                                                            : 'bg-[#FF7939]/10 border-[#FF7939]/30 text-[#FFB366] hover:bg-[#FF7939]/20 hover:border-[#FF7939]/50 hover:scale-[1.02] z-10 hover:z-20 cursor-pointer'
                                                        }`}
                                                >
                                                    <div className="flex flex-col items-center justify-center leading-none gap-0.5 w-full h-full p-0.5">
                                                        <span className="font-bold truncate">{block.start}</span>
                                                        <span className="text-[8px] opacity-60">-</span>
                                                        <span className="font-bold truncate">{block.end}</span>
                                                    </div>
                                                </button>
                                            )
                                        })
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: BOOKING FORM */}
                <div className="w-full md:w-1/2">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 h-full flex flex-col justify-center">
                        {!selectedMeetRequest ? (
                            <div className="text-center py-12">
                                <Clock className="w-12 h-12 text-white/10 mx-auto mb-3" />
                                <h3 className="text-white/40 font-medium">Seleccioná un horario</h3>
                                <p className="text-white/20 text-sm mt-1">Elige un bloque de la izquierda para continuar.</p>
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <h3 className="text-lg font-semibold text-white mb-4">{rescheduleContext ? 'Reprogramar' : 'Solicitud de Meet'}</h3>

                                {/* TITLE INPUT */}
                                <div className="mb-5">
                                    <label className="text-xs text-white/50 font-semibold mb-2 block uppercase tracking-wide">Título</label>
                                    <input
                                        type="text"
                                        value={selectedMeetRequest.title}
                                        readOnly={!!rescheduleContext}
                                        onChange={(e) => setSelectedMeetRequest((p: any) => p ? ({ ...p, title: e.target.value }) : null)}
                                        className={`w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#FF7939]/50 transition-colors ${rescheduleContext ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        placeholder="Ej: Revisión de técnica"
                                    />
                                </div>

                                {/* DURATION SELECTOR */}
                                <div className="mb-5">
                                    <label className="text-xs text-white/50 font-semibold mb-2 block uppercase tracking-wide">Duración</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {([
                                            { id: 'express', label: '15 min', min: 15 },
                                            { id: 'puntual', label: '30 min', min: 30 },
                                            { id: 'profunda', label: '60 min', min: 60 }
                                        ] as const).map((opt) => {
                                            const isActive = selectedConsultationType === opt.id
                                            const isValid = isDurationValid(opt.min)
                                            return (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    disabled={!isValid}
                                                    onClick={() => setSelectedConsultationType(opt.id)}
                                                    className={`
                                    py-2 rounded-lg text-xs font-bold border transition-all
                                    ${isActive
                                                            ? 'bg-white text-black border-white shadow-md'
                                                            : isValid ? 'bg-transparent text-white/60 border-white/10 hover:border-white/30' : 'opacity-20 cursor-not-allowed border-transparent text-white/20'
                                                        }
                                  `}
                                                >
                                                    {opt.label}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* TIME EDITOR */}
                                <div className="mb-5">
                                    <label className="text-xs text-white/50 font-semibold mb-2 block uppercase tracking-wide">Horario</label>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <div className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2 focus-within:border-[#FF7939]/50 transition-colors">
                                                <Clock className="w-4 h-4 text-[#FF7939]" />
                                                <input
                                                    type="time"
                                                    className="bg-transparent border-none text-white text-sm font-semibold focus:outline-none w-full [color-scheme:dark]"
                                                    value={selectedMeetRequest.timeHHMM}
                                                    onChange={(e) => {
                                                        if (e.target.value) {
                                                            setSelectedMeetRequest((p: any) => p ? ({ ...p, timeHHMM: e.target.value }) : null)
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="text-white/30 font-medium">➔</div>
                                        <div className="flex-1">
                                            <div className="bg-white/5 border border-white/5 rounded-xl px-3 py-2 flex items-center justify-center gap-2">
                                                <span className="text-white/60 text-sm font-medium">
                                                    {(() => {
                                                        const mins = coachConsultations[selectedConsultationType].time
                                                        const [h, m] = selectedMeetRequest.timeHHMM.split(':').map((x: string) => parseInt(x) || 0)
                                                        const total = h * 60 + m + mins
                                                        const endH = Math.floor(total / 60) % 24
                                                        const endM = total % 60
                                                        return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* NOTE */}
                                <div className="mb-6">
                                    <label className="text-xs text-white/50 font-semibold mb-2 block uppercase tracking-wide">{rescheduleContext ? 'Agregar detalle de cambio' : 'Nota'}</label>
                                    <textarea
                                        value={selectedMeetRequest.description || ''}
                                        onChange={(e) => setSelectedMeetRequest((p: any) => p ? ({ ...p, description: e.target.value }) : null)}
                                        className="w-full h-20 bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#FF7939]/50 transition-colors resize-none"
                                        placeholder="¿Sobre qué te gustaría hablar?"
                                    />
                                </div>

                                {/* ACTION */}
                                <div className="flex flex-col gap-2">
                                    <div className="text-xs text-white/40 text-center mb-2">
                                        Se descontará {isPaidMeetFlow ? 'dinero' : `${Math.ceil(coachConsultations[selectedConsultationType].time / 15)} crédito${Math.ceil(coachConsultations[selectedConsultationType].time / 15) > 1 ? 's' : ''}`} de tu cuenta.
                                    </div>
                                    <button
                                        type="button"
                                        disabled={selectedMeetRsvpLoading || !isDurationValid(coachConsultations?.[selectedConsultationType]?.time || 0)}
                                        className="w-full py-3 rounded-xl bg-[#FF7939] text-black font-bold text-sm hover:opacity-90 transition-opacity shadow-[0_4px_12px_rgba(255,121,57,0.25)] flex items-center justify-center gap-2 disabled:opacity-50"
                                        onClick={async () => {
                                            console.log('[day_split Confirm] Button clicked', { rescheduleContext })

                                            // If we're in reschedule mode, handle differently
                                            if (rescheduleContext) {
                                                const duration = coachConsultations[selectedConsultationType].time
                                                const startIso = new Date(`${selectedMeetRequest.dayKey}T${selectedMeetRequest.timeHHMM}:00`).toISOString()
                                                const endIso = new Date(new Date(startIso).getTime() + duration * 60 * 1000).toISOString()

                                                try {
                                                    const user_id = authUserId
                                                    if (!user_id) return

                                                    // 1. Fetch MY participant data to check if I am the inviter
                                                    console.log('[day_split] Fetching my participant data for event:', rescheduleContext.eventId)
                                                    const { data: participantData, error: partError } = await (supabase
                                                        .from('calendar_event_participants') as any)
                                                        .select('invited_by_user_id, rsvp_status, is_creator')
                                                        .eq('event_id', rescheduleContext.eventId)
                                                        .eq('user_id', user_id)
                                                        .single()

                                                    if (partError) console.log('[day_split] My participant error (PGRST116 is OK):', partError)

                                                    // 2. Check coach's RSVP status
                                                    console.log('[day_split] Fetching coach participant data for coach:', rescheduleContext.coachId)
                                                    const { data: coachParticipantData, error: coachPartError } = await (supabase
                                                        .from('calendar_event_participants') as any)
                                                        .select('rsvp_status')
                                                        .eq('event_id', rescheduleContext.eventId)
                                                        .eq('user_id', rescheduleContext.coachId)
                                                        .single()

                                                    if (coachPartError) console.log('[day_split] Coach participant error (PGRST116 is OK):', coachPartError)

                                                    // If coach hasn't accepted (is pending, declined, or no record)
                                                    const isCoachAccepted = coachParticipantData && ['accepted', 'confirmed'].includes(coachParticipantData.rsvp_status)

                                                    // 1b. Fetch Event Creator as fallback
                                                    console.log('[day_split] Fetching event creator for event:', rescheduleContext.eventId)
                                                    const { data: eventData, error: eventError } = await (supabase
                                                        .from('calendar_events') as any)
                                                        .select('created_by_user_id')
                                                        .eq('id', rescheduleContext.eventId)
                                                        .single()

                                                    if (eventError) console.log('[day_split] Event creator error:', eventError)

                                                    // Verify I am the inviter using my participant row OR event creator
                                                    const amIInviter = (participantData?.is_creator === true) || (participantData?.invited_by_user_id === user_id) || (eventData?.created_by_user_id === user_id)

                                                    console.log('[day_split] PATH DECISION:', {
                                                        amIInviter,
                                                        isCoachAccepted,
                                                        myId: user_id,
                                                        invitedBy: participantData?.invited_by_user_id,
                                                        createdBy: eventData?.created_by_user_id,
                                                        coachStatus: coachParticipantData?.rsvp_status
                                                    })

                                                    if (amIInviter && !isCoachAccepted) {
                                                        console.log('[day_split] DECISION: DIRECT UPDATE')
                                                        console.log('[day_split] Update Params:', {
                                                            id: rescheduleContext.eventId,
                                                            oldStart: rescheduleContext.fromStart,
                                                            newStart: startIso
                                                        })

                                                        setSelectedMeetRsvpLoading(true)

                                                        const { data: updatedData, error: updateError } = await (supabase
                                                            .from('calendar_events') as any)
                                                            .update({
                                                                start_time: startIso,
                                                                end_time: endIso,
                                                                // If description changed, update it
                                                                ...(selectedMeetRequest.description ? { description: selectedMeetRequest.description } : {})
                                                            })
                                                            .eq('id', rescheduleContext.eventId)
                                                            .select()

                                                        if (updateError) {
                                                            console.error('[day_split] Error updating event:', updateError)
                                                            setSelectedMeetRsvpLoading(false)
                                                            alert('Error al actualizar: ' + updateError.message)
                                                            return
                                                        }

                                                        console.log('[day_split] Update Rows Affected:', updatedData?.length || 0)
                                                        if (!updatedData || updatedData.length === 0) {
                                                            console.warn('[day_split] ZERO ROWS UPDATED! Check RLS or ID.')
                                                            setSelectedMeetRsvpLoading(false)
                                                            alert('No se pudo actualizar el evento. Verifica tus permisos.')
                                                            return
                                                        }

                                                        console.log('[day_split] Updated Row Sample:', {
                                                            id: updatedData[0].id,
                                                            start: updatedData[0].start_time
                                                        })

                                                        // OPTIMISTIC UPDATE (Backup in case refetch is stale)
                                                        setMeetEventsByDate((prev: any) => {
                                                            const newData = { ...prev }
                                                            let movedEvent: any = null

                                                            Object.keys(newData).forEach(key => {
                                                                const found = newData[key]?.find((e: any) => e.id === rescheduleContext.eventId)
                                                                if (found && !movedEvent) movedEvent = { ...found }
                                                            })

                                                            // Scrub from all keys
                                                            Object.keys(newData).forEach(key => {
                                                                if (newData[key]) newData[key] = newData[key].filter((e: any) => e.id !== rescheduleContext.eventId)
                                                            })

                                                            if (movedEvent) {
                                                                movedEvent.start_time = startIso
                                                                movedEvent.end_time = endIso
                                                                if (selectedMeetRequest.description) movedEvent.description = selectedMeetRequest.description

                                                                const s = new Date(startIso)
                                                                const newKey = s.toISOString().split('T')[0]
                                                                if (!newData[newKey]) newData[newKey] = []
                                                                newData[newKey].push(movedEvent)
                                                                newData[newKey].sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                                                            }
                                                            return newData
                                                        })

                                                        // WAIT for DB Propagation (1s)
                                                        await new Promise(resolve => setTimeout(resolve, 1000))

                                                        // REFETCH Data
                                                        if (onEventUpdated) {
                                                            await onEventUpdated()
                                                        }

                                                        setRescheduleContext(null)

                                                        // Switch back
                                                        setMeetViewMode('month')
                                                        setSelectedMeetRequest(null)
                                                        setSelectedMeetRsvpLoading(false)
                                                        handleClearCoachForMeet()

                                                        const [startHour, startMin] = selectedMeetRequest.timeHHMM.split(':').map(Number)
                                                        const startMinutes = startHour * 60 + startMin
                                                        const endMinutes = startMinutes + duration
                                                        const endHour = Math.floor(endMinutes / 60)
                                                        const endMin = endMinutes % 60
                                                        const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`

                                                        setSuccessModalData({
                                                            coachName: coachProfiles.find(c => c.id === selectedCoachId)?.full_name || 'Coach',
                                                            date: format(new Date(startIso), 'dd MMM yyyy', { locale: es }),
                                                            time: `${selectedMeetRequest.timeHHMM} – ${endTime}`,
                                                            duration: duration,
                                                            message: "Cambio realizado exitosamente."
                                                        })
                                                        setShowSuccessModal(true)
                                                        return
                                                    }

                                                    console.log('[day_split] DECISION: RESCHEDULE REQUEST')
                                                    // OTHERWISE: Insert Reschedule Request (Pending Coach Approval)
                                                    // OTHERWISE: Insert or Update Reschedule Request
                                                    // Update if we own the request
                                                    if (rescheduleContext.requestId && rescheduleContext.requestedByUserId === authUserId) {
                                                        const { error: updateReqErr } = await (supabase
                                                            .from('calendar_event_reschedule_requests') as any)
                                                            .update({
                                                                to_start_time: startIso,
                                                                to_end_time: endIso,
                                                                note: selectedMeetRequest.description || null,
                                                                status: 'pending'
                                                            })
                                                            .eq('id', rescheduleContext.requestId)

                                                        if (updateReqErr) throw updateReqErr
                                                    } else {
                                                        const { error: insertError } = await (supabase
                                                            .from('calendar_event_reschedule_requests') as any)
                                                            .insert({
                                                                event_id: rescheduleContext.eventId,
                                                                requested_by_user_id: authUserId,
                                                                requested_by_role: 'client',
                                                                from_start_time: rescheduleContext.fromStart,
                                                                from_end_time: rescheduleContext.fromEnd,
                                                                to_start_time: startIso,
                                                                to_end_time: endIso,
                                                                status: 'pending',
                                                                note: selectedMeetRequest.description || null
                                                            })

                                                        if (insertError) throw insertError
                                                    }

                                                    // Success
                                                    setRescheduleContext(null)
                                                    setMeetViewMode('month')
                                                    setSelectedMeetRequest(null)
                                                    handleClearCoachForMeet()

                                                    const [startHour, startMin] = selectedMeetRequest.timeHHMM.split(':').map(Number)
                                                    const startMinutes = startHour * 60 + startMin
                                                    const endMinutes = startMinutes + duration
                                                    const endHour = Math.floor(endMinutes / 60)
                                                    const endMin = endMinutes % 60
                                                    const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`

                                                    setSuccessModalData({
                                                        coachName: coachProfiles.find(c => c.id === selectedCoachId)?.full_name || 'Coach',
                                                        date: format(new Date(startIso), 'dd MMM yyyy', { locale: es }),
                                                        time: `${selectedMeetRequest.timeHHMM} – ${endTime}`,
                                                        duration: duration,
                                                        message: "Solicitud enviada al coach, espera a que confirme..."
                                                    })
                                                    setShowSuccessModal(true)
                                                    return

                                                } catch (error) {
                                                    console.error('[day_split] Error checking meet status:', error)
                                                }
                                                return
                                            }

                                            // Original logic for creating new meets
                                            // REUSED LOGIC FROM MODAL
                                            // We need to either call the same function or duplicate the logic. 
                                            // For safety/speed, duplicating the core submission logic here.

                                            const canConfirm = !isPaidMeetFlow
                                                ? (Number(meetCreditsByCoachId?.[String(selectedMeetRequest.coachId)] ?? 0) > 0)
                                                : meetPurchasePaid

                                            console.log('[day_split] Checking confirm conditions:', {
                                                isPaidMeetFlow,
                                                meetPurchasePaid,
                                                canConfirm,
                                                credits: meetCreditsByCoachId?.[String(selectedMeetRequest.coachId)]
                                            })

                                            if (!canConfirm && !isPaidMeetFlow) {
                                                alert('No tienes créditos suficientes para agendar una sesión con este coach.')
                                                return
                                            }

                                            if (isPaidMeetFlow && !meetPurchasePaid) {
                                                // Trigger Payment Logic
                                                const actId = scheduleMeetContext?.activityId ? String(scheduleMeetContext.activityId) : null
                                                if (!actId) return

                                                const duration = coachConsultations[selectedConsultationType].time
                                                try {
                                                    sessionStorage.setItem(
                                                        'pending_meet_booking',
                                                        JSON.stringify({
                                                            coachId: String(selectedMeetRequest.coachId),
                                                            activityId: actId,
                                                            dayKey: selectedMeetRequest.dayKey,
                                                            timeHHMM: selectedMeetRequest.timeHHMM,
                                                            durationMinutes: duration,
                                                        })
                                                    )
                                                } catch { }
                                                const res = await createCheckoutProPreference(actId)
                                                if (res?.success && res?.initPoint) {
                                                    redirectToMercadoPagoCheckout(res.initPoint, actId, res.preferenceId)
                                                }
                                                return
                                            }

                                            // Perform Booking
                                            try {
                                                console.log('[day_split] Starting booking process...')
                                                setSelectedMeetRsvpLoading(true)

                                                if (!coachConsultations || !selectedConsultationType || !coachConsultations[selectedConsultationType]) {
                                                    console.error('[day_split] Missing consultation info:', { coachConsultations, selectedConsultationType })
                                                    alert('Error de configuración de consulta. Intenta recargar.')
                                                    return
                                                }

                                                const duration = coachConsultations[selectedConsultationType].time
                                                const startIso = new Date(`${selectedMeetRequest.dayKey}T${selectedMeetRequest.timeHHMM}:00`).toISOString()
                                                const endIso = new Date(new Date(startIso).getTime() + duration * 60 * 1000).toISOString()

                                                const { data: auth } = await supabase.auth.getUser()
                                                const user = auth?.user
                                                console.log('[day_split] User ID:', user?.id)

                                                if (!user?.id) return

                                                const payload = {
                                                    title: selectedMeetRequest.title || 'Meet',
                                                    description: selectedMeetRequest.description,
                                                    start_time: startIso,
                                                    end_time: endIso,
                                                    coach_id: selectedMeetRequest.coachId,
                                                    created_by_user_id: user.id,
                                                    event_type: 'consultation',
                                                    status: 'scheduled',
                                                    activity_id: scheduleMeetContext?.activityId ? Number(scheduleMeetContext.activityId) : null
                                                }
                                                console.log('[day_split] Insert payload:', payload)

                                                const { data: newEvent, error } = await (supabase.from('calendar_events') as any).insert(payload).select('id').single()

                                                console.log('[day_split] Insert result:', { newEvent, error })

                                                if (!error && newEvent?.id) {
                                                    // Insert BOTH participants: The Creator (Client) and the Guest (Coach)
                                                    const participants = [
                                                        {
                                                            event_id: newEvent.id,
                                                            user_id: user.id,
                                                            rsvp_status: 'accepted',
                                                            invited_by_user_id: user.id,
                                                            invited_by_role: 'client',
                                                            is_creator: true
                                                        },
                                                        {
                                                            event_id: newEvent.id,
                                                            user_id: selectedMeetRequest.coachId,
                                                            rsvp_status: 'pending',
                                                            invited_by_user_id: user.id,
                                                            invited_by_role: 'client',
                                                            is_creator: false
                                                        }
                                                    ]
                                                    console.log('[day_split] Participants payload:', participants)

                                                    const { error: partError } = await (supabase.from('calendar_event_participants') as any).insert(participants)

                                                    if (partError) console.error('[day_split] Participant error:', partError)

                                                    // Refresh
                                                    setMeetViewMode('month')
                                                    setSelectedMeetRequest(null)
                                                    if (onSetScheduleMeetContext) onSetScheduleMeetContext(null)
                                                    setShowSuccessModal(true)
                                                    // Calculate end time
                                                    const [startHour, startMin] = selectedMeetRequest.timeHHMM.split(':').map(Number)
                                                    const startMinutes = startHour * 60 + startMin
                                                    const endMinutes = startMinutes + duration
                                                    const endHour = Math.floor(endMinutes / 60)
                                                    const endMin = endMinutes % 60
                                                    const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`

                                                    setSuccessModalData({
                                                        coachName: coachProfiles.find(c => c.id === selectedCoachId)?.full_name || 'Coach',
                                                        date: format(new Date(startIso), 'dd MMM yyyy', { locale: es }),
                                                        time: `${selectedMeetRequest.timeHHMM} – ${endTime}`,
                                                        duration: duration
                                                    })
                                                } else {
                                                    alert('Error al reservar: ' + (error?.message || 'Desconocido'))
                                                }
                                            } catch (e) {
                                                console.error('[day_split] Booking error (catch):', e)
                                                alert('Error inesperado al reservar.')
                                            } finally {
                                                setSelectedMeetRsvpLoading(false)
                                            }
                                        }}
                                    >
                                        {selectedMeetRsvpLoading ? 'Procesando...' : (rescheduleContext ? 'Confirmar Cambio' : (isPaidMeetFlow && !meetPurchasePaid ? 'Ir a Pagar' : 'Confirmar Reserva'))}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
