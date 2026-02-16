import React, { useState, useMemo } from 'react'
import { format, parse, addMinutes, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { Clock, Check, Video, GraduationCap, Calendar as CalendarIcon, X } from 'lucide-react'

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
        if (!startTime) return false

        const now = new Date()
        const [hours, minutes] = startTime.split(':').map(Number)
        const targetDate = new Date(selectedDate)
        targetDate.setHours(hours, minutes, 0, 0)

        // No strict past check for simplicity/flexibility
        // But 2 hour notice check if needed, user didn't complain about this but let's keep logic
        if (targetDate < now) return false

        const diffHours = (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60)
        return diffHours >= 2
    }

    const isBookingAllowed = isTimeValid()

    const handleConfirm = () => {
        if (!startTime || !/^\d{2}:\d{2}$/.test(startTime)) return
        if (!isBookingAllowed) {
            alert('Debes reservar con al menos 2 horas de antelación.')
            return
        }
        onConfirm(startTime, selectedDuration)
    }

    const isValidTime = startTime && /^\d{2}:\d{2}$/.test(startTime)

    const dateLabel = useMemo(() => {
        const raw = format(selectedDate, "eeee d 'de' MMMM", { locale: es });
        return raw.charAt(0).toUpperCase() + raw.slice(1);
    }, [selectedDate])

    // Helper for button label
    const getButtonLabel = (m: any) => {
        if (m.isPreview) return 'Previsualización'
        if (m.status === 'cancelled') return 'Cancelada'
        if (m.rsvp_status === 'declined') return 'Rechazada'
        if ((m as any).pending_reschedule?.status === 'pending') return 'Cambio Solicitado'
        if (m.is_ghost) return 'Propuesta enviada'
        if (new Date(m.end_time || m.start_time) < new Date()) return 'Finalizada'
        if (isToday(new Date(m.start_time))) return 'Unirse'

        // Priority for Pending RSVP (Coach action required)
        if (m.my_rsvp === 'pending') return 'Pendiente'

        if (m.status === 'scheduled' || m.status === 'rescheduled') {
            const confirmed = m.confirmed_participants || 0
            const total = m.total_guests || 0
            if (total > 0 && confirmed < total) {
                return total > 1 ? `Inv. enviada (${confirmed}/${total})` : 'Invitación enviada'
            }
            return 'Confirmada'
        }

        return 'Confirmada'
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
                className={`
                    w-full rounded-2xl border px-4 py-3 flex items-center justify-between gap-3 transition-all duration-200 select-none
                    ${isPreview
                        ? 'border-[#FF7939]/50 bg-[#FF7939]/10 shadow-lg shadow-[#FF7939]/10'
                        : isUrgent
                            ? 'border-red-500/20 bg-red-500/5 opacity-80'
                            : m.is_ghost
                                ? 'border-[#FF7939]/20 bg-[#FF7939]/5 border-dashed'
                                : 'border-white/10 bg-white/5'
                    }
                `}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 
                        ${isPreview ? 'bg-[#FF7939]/20 text-[#FF7939]' : isUrgent ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-white/5 text-white/70 border border-white/10'}`}>
                        {m.event_type === 'workshop' ? <GraduationCap className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                        <div className={`text-sm font-bold truncate leading-snug ${isPreview ? 'text-[#FF7939]' : 'text-white'}`}>
                            {m.title || (m.event_type === 'workshop' ? 'Taller' : 'Meet')}
                            {isPreview && ' (Nueva)'}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <div className="text-[11px] text-white/50 font-medium whitespace-nowrap">
                                {label} {m.client_name && ` – ${m.client_name}`}
                            </div>
                        </div>
                    </div>
                </div>
                <button
                    type="button"
                    disabled
                    className={`
                        h-8 px-4 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all
                        ${isPreview ? 'border-[#FF7939] text-[#FF7939] bg-[#FF7939]/10' : 'border-[#FF7939]/60 text-[#FFB366] bg-[#FF7939]/5'}
                    `}
                >
                    {getButtonLabel(m)}
                </button>
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
