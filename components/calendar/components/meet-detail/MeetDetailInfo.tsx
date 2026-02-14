
import React from 'react'
import { Calendar as CalendarIcon, RotateCcw } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface MeetDetailInfoProps {
    dateLabel: string
    timeLabel: string
    pendingReschedule: any
    isCancelled: boolean
    isMyRequest?: boolean
}

export const MeetDetailInfo: React.FC<MeetDetailInfoProps> = ({
    dateLabel,
    timeLabel,
    pendingReschedule,
    isCancelled,
    isMyRequest
}) => {
    return (
        <div className="space-y-8">
            <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl bg-zinc-900 border flex items-center justify-center flex-shrink-0 ${isCancelled ? 'border-red-500/20 text-red-500' : 'border-white/10 text-[#FF7939]'}`}>
                    <CalendarIcon size={22} strokeWidth={1.5} />
                </div>
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-baseline gap-2">
                        <span className="text-base font-semibold text-white capitalize leading-tight">
                            {dateLabel}
                        </span>
                        {pendingReschedule?.status === 'accepted' && (
                            <span className="text-xs text-white/20 line-through font-medium">
                                {format(new Date(pendingReschedule.from_start_time), "d 'de' MMM", { locale: es })}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400 font-medium">
                            {timeLabel}
                        </span>
                        {pendingReschedule?.status === 'accepted' && (
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
                        {isMyRequest ? 'TU SOLICITUD DE CAMBIO' : 'PROPUESTA DE CAMBIO'}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">
                            {pendingReschedule.to_start_time ? format(new Date(pendingReschedule.to_start_time), "EEEE d 'de' MMMM", { locale: es }) : ''}
                        </span>
                        <span className="text-[11px] text-gray-400">
                            {pendingReschedule.to_start_time ? format(new Date(pendingReschedule.to_start_time), "HH:mm") : ''} – {pendingReschedule.to_end_time ? format(new Date(pendingReschedule.to_end_time), "HH:mm") : ''}
                        </span>
                    </div>
                    {(pendingReschedule.reason || pendingReschedule.note) && (
                        <div className="text-[11px] text-white/50 italic leading-relaxed border-t border-white/5 pt-2 mt-1">
                            "{pendingReschedule.reason || pendingReschedule.note}"
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
