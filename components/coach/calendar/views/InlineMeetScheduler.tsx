import React, { useState, useMemo } from 'react'
import { format, parse, addMinutes, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { Clock, Check, Video, GraduationCap, Calendar as CalendarIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils/utils'

interface InlineMeetSchedulerProps {
    selectedDate: Date
    existingEvents: any[]
    onConfirm: (startTime: string, durationMinutes: number) => void
    onCancel: () => void
    checkOverlap: (date: Date, startTime: string, durationMinutes: number) => boolean
    meetTitle?: string // For rescheduling
    isRescheduling?: boolean
    previewClientName?: string
}

export function InlineMeetScheduler({
    selectedDate,
    existingEvents,
    onConfirm,
    onCancel,
    checkOverlap,
    meetTitle = 'Meet nueva',
    isRescheduling = false,
    previewClientName
}: InlineMeetSchedulerProps) {
    const [startTime, setStartTime] = useState('')
    const [selectedDuration, setSelectedDuration] = useState(30)

    const durations = [
        { value: 15, label: '15' },
        { value: 30, label: '30' },
        { value: 60, label: '60' }
    ]

    const hasOverlap = useMemo(() => {
        if (!startTime || !/^\d{2}:\d{2}$/.test(startTime)) return false
        return checkOverlap(selectedDate, startTime, selectedDuration)
    }, [startTime, selectedDuration, selectedDate, checkOverlap])

    // Create preview event
    const previewEvent = useMemo(() => {
        if (!startTime || !/^\d{2}:\d{2}$/.test(startTime)) return null

        try {
            const startDateTime = parse(startTime, 'HH:mm', selectedDate)
            const endDateTime = addMinutes(startDateTime, selectedDuration)

            return {
                id: 'preview',
                title: meetTitle,
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                isPreview: true,
                event_type: 'consultation',
                client_name: previewClientName
            }
        } catch {
            return null
        }
    }, [startTime, selectedDuration, selectedDate, meetTitle, previewClientName])

    // Combine and split events
    const { meetEvents, otherEvents, clientEvents } = useMemo(() => {
        const meets: any[] = []
        const others: any[] = []
        const clients: any[] = []

        // Preview always goes to meets (coach)
        if (previewEvent) meets.push(previewEvent)

        existingEvents.forEach(e => {
            if (e.is_client_event) {
                clients.push(e)
            } else if (e.event_type === 'consultation' || e.event_type === 'workshop') {
                meets.push(e)
            } else {
                others.push(e)
            }
        })

        const sorter = (a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()

        return {
            meetEvents: meets.sort(sorter),
            otherEvents: others.sort(sorter),
            clientEvents: clients.sort(sorter)
        }
    }, [existingEvents, previewEvent])

    const isTimeValid = () => {
        return true
    }

    const isBookingAllowed = isTimeValid()

    const handleConfirm = () => {
        if (!startTime || !/^\d{2}:\d{2}$/.test(startTime)) return
        onConfirm(startTime, selectedDuration)
    }

    const isValidTime = startTime && /^\d{2}:\d{2}$/.test(startTime)

    const dateLabel = useMemo(() => {
        const raw = format(selectedDate, "eeee d 'de' MMMM", { locale: es });
        return raw.charAt(0).toUpperCase() + raw.slice(1);
    }, [selectedDate])

    // Helper for button label
    const getButtonLabel = (m: any) => {
        if (m.isPreview) return 'Preview'
        if (m.status === 'cancelled') return 'Cancelada'
        if (m.rsvp_status === 'declined' || m.rsvp_status === 'cancelled') return 'Rechazada'
        
        const start = new Date(m.start_time)
        const end = m.end_time ? new Date(m.end_time) : new Date(start.getTime() + (60 * 60 * 1000))
        const now = new Date()
        
        const isPast = (end.getTime() + (120 * 60 * 1000)) < now.getTime()
        const isOngoing = now >= start && now <= end

        if (isPast) return 'Finalizada'
        if (isOngoing) return 'En curso'
        if (m.meet_link || m.google_meet_data?.meet_link) return 'Unirse'
        if (m.my_rsvp === 'pending') return 'Aceptar'
        
        if (m.status === 'scheduled' || m.status === 'rescheduled') {
            const confirmed = m.confirmed_participants || 0
            const total = m.total_guests || 0
            if (total > 1 && confirmed < total) return `Inv. (${confirmed}/${total})`
            return 'Confirmada'
        }

        return 'Ver'
    }

    const renderMeetCard = (m: any, index: number) => {
        const start = new Date(m.start_time)
        const end = m.end_time ? new Date(m.end_time) : null
        const label = `${format(start, 'HH:mm')}${end && !Number.isNaN(end.getTime()) ? ` – ${format(end, 'HH:mm')}` : ''}`
        const isUrgent = m.status === 'cancelled' || m.rsvp_status === 'declined' || (m as any).pending_reschedule?.status === 'pending'
        const isPreview = m.isPreview

        return (
            <div
                key={m.id || `meet-${index}`}
                className={cn(
                    "w-full rounded-xl border p-2.5 flex items-center justify-between gap-3 transition-all duration-200 select-none",
                    isPreview
                        ? 'border-[#FF7939]/30 bg-[#FF7939]/5 shadow-md shadow-[#FF7939]/5'
                        : isUrgent
                            ? 'border-red-500/20 bg-red-500/5 opacity-80'
                            : m.is_ghost
                                ? 'border-[#FF7939]/20 bg-[#FF7939]/5 border-dashed'
                                : 'border-white/5 bg-white/[0.02]'
                )}
            >
                <div className="w-full flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-start gap-2.5 min-w-0">
                        <div className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                            isPreview ? 'bg-[#FF7939]/20 text-[#FF7939] border border-[#FF7939]/30' :
                                isUrgent ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                                    (m.event_type === 'workshop' ? 'bg-rose-500/5 text-rose-300 border border-rose-500/20' :
                                        'bg-white/5 text-white/40 border border-white/5')
                        )}>
                            {m.event_type === 'workshop' ? <GraduationCap className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                        </div>

                        <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex flex-col gap-1 min-w-0">
                                <div className={cn(
                                    "text-[11px] font-[1000] uppercase italic tracking-tight leading-none truncate mb-1",
                                    isPreview ? 'text-[#FF7939]' : 'text-white/95'
                                )}>
                                    {m.title ? String(m.title).replace(/^Taller:\s*/i, '') : (m.event_type === 'workshop' ? 'Taller' : 'Meet')}
                                    {isPreview && ' (Nueva)'}
                                </div>

                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <div className="text-[8.5px] text-white/30 font-bold uppercase tracking-widest leading-none whitespace-nowrap">
                                            {label}
                                        </div>
                                        {m.client_name && (
                                            <>
                                                <div className="w-0.5 h-0.5 rounded-full bg-white/20 shrink-0" />
                                                <div className="text-[8.5px] text-[#FF7939] font-[1000] uppercase leading-none truncate max-w-[120px]">
                                                    {m.client_name}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        disabled
                                        className={cn(
                                            "h-5 px-3 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all",
                                            isPreview 
                                                ? 'border-[#FF7939] text-[#FF7939] bg-[#FF7939]/10' 
                                                : isUrgent
                                                    ? 'border-red-500/30 text-red-400 bg-red-500/5'
                                                    : 'border-white/10 text-white/50 bg-white/5'
                                        )}
                                    >
                                        {getButtonLabel(m)}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const renderOtherCard = (event: any, index: number) => {
        const start = new Date(event.start_time)
        const end = event.end_time ? new Date(event.end_time) : null
        const label = `${format(start, 'HH:mm')}${end && !Number.isNaN(end.getTime()) ? ` – ${format(end, 'HH:mm')}` : ''}`

        return (
            <div
                key={event.id || `other-${index}`}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-white/5 text-white/70 border border-white/10">
                        <CalendarIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-white truncate leading-snug">{event.title || 'Evento'}</div>
                        <div className="text-[11px] text-white/50 font-medium">{label}</div>
                    </div>
                </div>
            </div>
        )
    }

    const renderClientCard = (e: any, index: number) => {
        const start = new Date(e.start_time)
        const end = e.end_time ? new Date(e.end_time) : null
        return (
            <div key={e.id || `client-${index}`} className="w-full rounded-2xl border border-[#FFB366]/20 bg-[#FFB366]/5 px-4 py-3 opacity-90">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-[#FFB366]/10 text-[#FFB366] border border-[#FFB366]/20">
                        <CalendarIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-white/90 truncate">{e.title || 'Ocupado (Cliente)'}</div>
                        <div className="text-[11px] text-[#FFB366]/70 font-medium">
                            {format(start, 'HH:mm')} - {end ? format(end, 'HH:mm') : ''}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header: Select Time */}
            <div className="bg-[#FF7939]/10 border border-[#FF7939]/20 rounded-xl p-3 mb-4">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-[#FF7939] font-bold flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {isRescheduling ? 'Selecciona el nuevo horario' : 'Selecciona el horario'}
                    </p>
                    <button onClick={onCancel} className="text-[#FF7939]/70 hover:text-[#FF7939]">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Inputs */}
                <div className="flex items-center gap-3">
                    <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className={`flex-1 px-4 py-2.5 bg-black/40 border rounded-xl text-white focus:outline-none transition-all ${hasOverlap ? 'border-red-500/30' : 'border-[#FF7939]/30 focus:border-[#FF7939]/50'}`}
                        placeholder="12:00"
                    />
                    <div className="flex gap-2">
                        {durations.map((duration) => (
                            <button
                                key={duration.value}
                                onClick={() => setSelectedDuration(duration.value)}
                                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all min-w-[50px] ${selectedDuration === duration.value ? 'bg-[#FF7939] text-black' : 'bg-black/40 text-white/70 border border-white/10'}`}
                            >
                                {duration.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Confirm Button */}
                {isValidTime && (
                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2.5 rounded-xl text-sm font-bold bg-white/5 text-white/70 hover:bg-white/10 border border-white/10 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!isBookingAllowed}
                            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 
                            ${!isBookingAllowed
                                    ? 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
                                    : hasOverlap ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-[#FF7939] text-black hover:bg-[#FF7939]/90 shadow-[#FF7939]/20'
                                }`}
                        >
                            {hasOverlap ? 'Confirmar (Superposición)' : 'Confirmar horario'}
                        </button>
                    </div>
                )}
            </div>

            {/* Activities Header */}
            <div className="flex items-center gap-2 mb-4 mt-8">
                <h3 className="text-base font-semibold text-white/95">
                    Actividades · {dateLabel}
                </h3>
            </div>

            {/* Meet Events */}
            {meetEvents.length > 0 && (
                <div className="mb-4">
                    <div className="text-[11px] tracking-widest text-white/45 mb-2 uppercase">Meet</div>
                    <div className="space-y-2">
                        {meetEvents.map(renderMeetCard)}
                    </div>
                </div>
            )}

            {/* Other Events */}
            {otherEvents.length > 0 && (
                <div className="mb-4">
                    <div className="text-[11px] tracking-widest text-white/45 mb-2 uppercase">Otros Eventos</div>
                    <div className="space-y-2">
                        {otherEvents.map(renderOtherCard)}
                    </div>
                </div>
            )}

            {/* Client Events */}
            {clientEvents.length > 0 && (
                <div className="mt-8 pt-6 border-t border-dashed border-white/10">
                    <h3 className="text-sm font-bold text-[#FFB366] mb-3 flex items-center gap-2 uppercase tracking-wider">
                        Actividades del Cliente
                        <span className="text-xs font-normal text-[#FFB366]/50 bg-[#FFB366]/10 px-2 py-0.5 rounded-full">
                            {clientEvents.length}
                        </span>
                    </h3>
                    <div className="space-y-2">
                        {clientEvents.map(renderClientCard)}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {meetEvents.length === 0 && otherEvents.length === 0 && clientEvents.length === 0 && (
                <div className="text-center py-8 text-white/40 text-sm italic">
                    No hay actividades programadas
                </div>
            )}
        </div>
    )
}
