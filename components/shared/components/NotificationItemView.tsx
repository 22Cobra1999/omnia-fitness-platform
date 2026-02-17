import React from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Clock, CheckCircle2, XCircle, Ban } from 'lucide-react'
import { NotificationItem, Role } from '../hooks/useMeetNotificationsLogic'

interface NotificationItemViewProps {
    item: NotificationItem
    role: Role
    userId: string
    actingId: string | null
    onOpenMeet: (eventId: string) => void
    onUpdateRsvp: (it: NotificationItem, status: 'confirmed' | 'declined') => Promise<void>
    onRespondToReschedule: (it: NotificationItem, action: 'accepted' | 'rejected') => Promise<void>
    describe: (it: NotificationItem) => string
}

export function NotificationItemView({
    item,
    role,
    userId,
    actingId,
    onOpenMeet,
    onUpdateRsvp,
    onRespondToReschedule,
    describe
}: NotificationItemViewProps) {
    const start = new Date(item.startTime)
    const end = item.endTime ? new Date(item.endTime) : null
    const timeLabel = `${format(start, 'HH:mm')}${end && !Number.isNaN(end.getTime()) ? ` – ${format(end, 'HH:mm')}` : ''}`
    const dateLabel = format(start, "dd MMM", { locale: es })
    const pending = item.rsvpStatus === 'pending'
    const isRescheduleRequest = !!item.reschedulePending && item.reschedulePending.requestedByUserId !== userId
    const isRescheduleResolved = item.reschedulePending?.status === 'accepted' || item.reschedulePending?.status === 'rejected' || item.reschedulePending?.status === 'declined'
    const isActing = actingId === item.id

    const getStatusVisuals = () => {
        if (item.reschedulePending) {
            if (item.reschedulePending.status === 'accepted') return { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' }
            if (item.reschedulePending.status === 'rejected' || item.reschedulePending.status === 'declined') return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' }
            return { icon: Clock, color: 'text-[#FF7939]', bg: 'bg-[#FF7939]/10', border: 'border-[#FF7939]/30' }
        }
        if (item.rsvpStatus === 'confirmed' || item.rsvpStatus === 'accepted') return { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' }
        if (item.rsvpStatus === 'declined') return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' }
        if (item.rsvpStatus === 'cancelled') return { icon: Ban, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' }
        return { icon: Clock, color: 'text-[#FF7939]', bg: 'bg-[#FF7939]/10', border: 'border-[#FF7939]/30' }
    }

    const visuals = getStatusVisuals()
    const StatusIcon = visuals.icon

    // Determine if current user should see action buttons
    const isSentByMe = item.invitedByUserId ? item.invitedByUserId === userId : item.isCreator
    const isClientSentRequest = role === 'client' && item.invitedByRole === 'client'
    const isMyRescheduleRequest = isRescheduleRequest && item.reschedulePending?.requestedByUserId === userId
    const shouldHideActions = isSentByMe || isClientSentRequest || isMyRescheduleRequest

    return (
        <div className={`rounded-xl border ${visuals.border} ${visuals.bg} px-3 py-2 animate-in fade-in slide-in-from-right-2 duration-300`}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-white truncate">{item.title}</div>
                    <div className="mt-0.5 text-xs text-white/65 truncate">{describe(item)}</div>
                    {item.reschedulePending ? (
                        <div className="mt-1 space-y-0.5">
                            <div className="text-[11px] text-[#FFB366] font-medium">
                                {format(new Date(item.reschedulePending.toStartTime), "d 'de' MMM", { locale: es })} · {format(new Date(item.reschedulePending.toStartTime), 'HH:mm')}
                                {item.reschedulePending.toEndTime && !Number.isNaN(new Date(item.reschedulePending.toEndTime).getTime()) && ` – ${format(new Date(item.reschedulePending.toEndTime), 'HH:mm')}`}
                            </div>
                            <div className="text-[10px] text-white/30 line-through">
                                {format(new Date(item.reschedulePending.fromStartTime), "d 'de' MMM", { locale: es })} · {format(new Date(item.reschedulePending.fromStartTime), 'HH:mm')}
                            </div>
                            {item.reschedulePending.note && item.reschedulePending.note.trim().length > 0 && (
                                <div className="text-[11px] text-white/60 truncate">Nota: {item.reschedulePending.note}</div>
                            )}
                        </div>
                    ) : (
                        <div className="mt-1 text-xs text-white/55">{dateLabel} · {timeLabel}</div>
                    )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusIcon className={`h-4 w-4 ${visuals.color}`} />
                    <button
                        type="button"
                        onClick={() => onOpenMeet(item.eventId)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${pending || (isRescheduleRequest && !isRescheduleResolved)
                                ? 'border border-[#FF7939]/60 text-[#FFB366] hover:bg-[#FF7939]/10'
                                : 'border border-white/10 text-white/60 hover:bg-white/5'
                            }`}
                    >
                        Ver
                    </button>
                </div>
            </div>

            {(pending || (isRescheduleRequest && !isRescheduleResolved)) && !shouldHideActions && (
                <div className="mt-2 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        disabled={isActing}
                        onClick={() => isRescheduleRequest ? onRespondToReschedule(item, 'rejected') : onUpdateRsvp(item, 'declined')}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold border border-white/15 text-white/80 hover:bg-white/10 disabled:opacity-50 transition-colors"
                    >
                        Rechazar
                    </button>
                    <button
                        type="button"
                        disabled={isActing}
                        onClick={() => isRescheduleRequest ? onRespondToReschedule(item, 'accepted') : onUpdateRsvp(item, 'confirmed')}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold border border-[#FF7939]/60 text-[#FFB366] hover:bg-[#FF7939]/10 disabled:opacity-50 transition-colors"
                    >
                        Aceptar
                    </button>
                </div>
            )}
        </div>
    )
}
