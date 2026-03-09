import { Badge } from "@/components/ui/badge"
import { Star, Calendar, Clock, CheckCircle2, Flame, Play, Video, Zap } from "lucide-react"
import { cn } from "@/lib/utils/utils"
import { getCategoryBadge, getTypeBadge, formatDate } from "../utils"

interface PurchasedActivityCardContentProps {
    activity: any
    enrollment: any
    size: "small" | "medium" | "large"
    isCoachView: boolean
    daysInfo: any
    pendingCount: number | null
    nextSessionDate: string | null
    nextActivity: any
    isFinished: boolean
    progress: number
    hasStarted: boolean
    // Coach View Overrides
    daysCompleted?: number
    daysPassed?: number
    daysMissed?: number
    daysRemainingFuture?: number
    itemsCompletedTotal?: number
    itemsDebtPast?: number
    itemsPendingToday?: number
}

const formatDM = (date: string) => {
    if (!date) return '';
    try {
        const d = new Date(date);
        return `${d.getDate()}/${d.getMonth() + 1}`;
    } catch {
        return '';
    }
}

export function PurchasedActivityCardContent({
    activity,
    enrollment,
    size,
    isCoachView,
    daysInfo,
    pendingCount,
    nextSessionDate,
    nextActivity,
    isFinished,
    progress,
    hasStarted,
    daysCompleted,
    daysPassed,
    daysMissed,
    daysRemainingFuture,
    itemsCompletedTotal,
    itemsDebtPast,
    itemsPendingToday
}: PurchasedActivityCardContentProps) {
    // Percentage for placement markers
    const start = new Date(enrollment.start_date || activity.program_start_date).getTime()
    const end = new Date(enrollment.program_end_date || activity.program_end_date).getTime()
    const next = nextSessionDate ? new Date(nextSessionDate).getTime() : null
    const nextPercent = (next && end > start) ? Math.min(Math.max(((next - start) / (end - start)) * 100, 5), 95) : null
    const hoyPercent = Math.min(Math.max(progress, 5), 95);

    return (
        <div className={cn(
            "flex-1 flex flex-col h-full min-h-0 relative -mt-5 z-30",
            size === "small" ? "p-2 px-3" : "p-3 py-1"
        )}>
            {/* Glassmorphism Body */}
            <div className="flex-1 flex flex-col bg-zinc-950/70 backdrop-blur-2xl border border-white/5 rounded-3xl p-4 shadow-2xl overflow-hidden">

                {/* 1. Coach Info */}
                {!isCoachView && (
                    <div className={cn("pb-2 mb-3 border-b border-white/5", daysInfo.isExpired && "grayscale opacity-60")}>
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                                <span className="text-[8px] font-black text-zinc-500">{(activity.coach_name?.[0] || 'C').toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0 flex items-center gap-2">
                                <p className="text-[11px] font-black text-zinc-300 truncate tracking-tight">{activity.coach_name || 'Coach'}</p>
                                {(activity.coach_rating && activity.coach_rating > 0) && (
                                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                        <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                                        <span>{activity.coach_rating.toFixed(1)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. Badges Overlay - smaller */}
                <div className={cn("flex flex-row items-center gap-2 mb-4 overflow-hidden whitespace-nowrap", daysInfo.isExpired && "grayscale opacity-60")}>
                    <Badge variant="outline" className="bg-[#FF7939]/5 border-[#FF7939]/30 text-[#FF7939] text-[8px] px-1.5 h-4 font-black tracking-wider uppercase shrink-0">
                        {getCategoryBadge(activity.categoria)}
                    </Badge>
                    {nextActivity && (
                        <Badge variant="outline" className="bg-zinc-800/30 border-white/5 text-zinc-400 text-[8px] px-1.5 h-4 font-bold tracking-wider uppercase shrink-0 max-w-[100px] truncate">
                            {nextActivity.title}
                        </Badge>
                    )}
                </div>

                {/* 3. Info Dinámica */}
                <div className={cn("flex-1 flex flex-col gap-2", daysInfo.isExpired && "grayscale opacity-60")}>
                    {isCoachView && (
                        <CoachViewStats
                            activity={activity}
                            daysCompleted={daysCompleted}
                            daysPassed={daysPassed}
                            daysMissed={daysMissed}
                            daysRemainingFuture={daysRemainingFuture}
                            itemsCompletedTotal={itemsCompletedTotal}
                            itemsDebtPast={itemsDebtPast}
                            itemsPendingToday={itemsPendingToday}
                        />
                    )}

                    {/* 3.1 Pestaña Por Empezar */}
                    {!hasStarted && !isFinished && enrollment.start_deadline && (
                        <div className="flex flex-col items-center justify-center py-6">
                            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.2em] mb-1 opacity-70">Empezar antes de</span>
                            <span className="text-3xl font-black text-[#FF7939] drop-shadow-lg">{formatDM(enrollment.start_deadline)}</span>
                        </div>
                    )}

                    {/* 3.2 Timeline UI - Pestaña En Curso */}
                    {hasStarted && !isFinished && (
                        <div className="flex flex-col h-full">
                            {/* HOY and PROX row - matching the mockup's lightning style */}
                            <div className="flex justify-between items-start mb-6 px-1">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1 sm:gap-1.5 mb-1.5">
                                        <div className="w-5 h-5 rounded-full bg-[#FF7939]/10 flex items-center justify-center border border-[#FF7939]/20 shadow-inner">
                                            <Zap className="w-3 h-3 text-[#FF7939] fill-[#FF7939]" />
                                        </div>
                                        <span className="text-[10px] font-black text-[#FF7939] uppercase tracking-widest">HOY</span>
                                    </div>
                                    <span className="text-3xl font-black text-white leading-none drop-shadow-sm">{pendingCount || 0}</span>
                                </div>
                                <div className="flex flex-col items-end pt-1">
                                    <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1.5 opacity-80">Próxima</span>
                                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-800/40 rounded-full border border-white/5">
                                        <Calendar className="w-3 h-3 text-zinc-500" />
                                        <span className="text-[11px] font-black text-zinc-300">{nextSessionDate ? formatDM(nextSessionDate) : '--/--'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline Graphic - Centered in remaining space */}
                            <div className="mt-auto relative px-2 h-16 flex flex-col justify-center">
                                {/* Base Thick Line */}
                                <div className="absolute left-0 right-0 h-[4px] bg-zinc-800/80 top-1/2 -translate-y-1/2 rounded-full shadow-inner" />

                                <div className="relative h-px flex items-center">
                                    {/* Start Dot - Fixed Orange for Inicio */}
                                    <div className="absolute left-0 w-3.5 h-3.5 rounded-full bg-[#FF7939] ring-2 ring-zinc-950 shadow-[0_0_10px_rgba(255,121,57,0.4)] -translate-x-1/2" />

                                    {/* Future dots - subtle counting markers */}
                                    {daysRemainingFuture && daysRemainingFuture > 0 && (
                                        Array.from({ length: Math.min(daysRemainingFuture, 5) }).map((_, i) => {
                                            const dotPercent = hoyPercent + ((92 - hoyPercent) / (Math.min(daysRemainingFuture, 5) + 1)) * (i + 1);
                                            return (
                                                <div
                                                    key={i}
                                                    className="absolute w-2 h-2 rounded-full bg-zinc-700/60 ring-1 ring-zinc-900"
                                                    style={{ left: `${dotPercent}%`, transform: 'translateX(-50%)' }}
                                                />
                                            );
                                        })
                                    )}

                                    {/* Prox marker - distinct if exists */}
                                    {nextPercent !== null && nextPercent > hoyPercent && (
                                        <div
                                            className="absolute w-3 h-3 rounded-full bg-zinc-400 ring-2 ring-zinc-950 shadow-lg"
                                            style={{ left: `${nextPercent}%`, transform: 'translateX(-50%)' }}
                                        />
                                    )}

                                    {/* End Dot */}
                                    <div className="absolute right-0 w-3.5 h-3.5 rounded-full bg-zinc-800 ring-2 ring-zinc-950 translate-x-1/2" />
                                </div>

                                {/* Labels below axes */}
                                <div className="absolute top-[calc(50%+16px)] left-0 right-0 flex justify-between items-center px-0">
                                    <div className="flex flex-col items-start gap-0.5">
                                        <span className="text-[7px] text-zinc-600 font-black uppercase tracking-tighter">Inicio</span>
                                        <span className="text-[11px] text-white font-black leading-none">{formatDM(enrollment.start_date)}</span>
                                    </div>
                                    <div className="flex flex-col items-end gap-0.5">
                                        <span className="text-[7px] text-zinc-600 font-black uppercase tracking-tighter">Fin</span>
                                        <span className="text-[11px] text-white font-black leading-none">{formatDM(enrollment.program_end_date)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3.3 Finalizadas UI */}
                    {isFinished && (
                        <div className="flex flex-col gap-6 py-4">
                            <div className="flex flex-col items-center justify-center p-6 bg-orange-500/5 rounded-3xl border border-orange-500/10 shadow-inner">
                                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] mb-2 opacity-50">Actividad Finalizada</span>
                                <span className="text-4xl font-black text-[#FF7939] drop-shadow-md">{progress}%</span>
                            </div>
                            <div className="flex justify-between items-center px-2">
                                <div className="flex flex-col">
                                    <span className="text-[7px] text-zinc-550 font-black uppercase tracking-widest">Inicio</span>
                                    <span className="text-sm font-black text-zinc-100">{formatDM(enrollment.start_date)}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[7px] text-zinc-550 font-black uppercase tracking-widest">Fin</span>
                                    <span className="text-sm font-black text-zinc-100">{formatDM(enrollment.program_end_date)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. Footer Placeholder - extra clean */}
                <PurchasedActivityCardFooter
                    isFinished={isFinished}
                    progress={progress}
                />
            </div>
        </div>
    )
}

function CoachViewStats({
    activity,
    daysCompleted,
    daysPassed,
    daysMissed,
    daysRemainingFuture,
    itemsCompletedTotal,
    itemsDebtPast,
    itemsPendingToday
}: any) {
    return (
        <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 shadow-inner flex flex-col items-center justify-center text-center">
                <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest block mb-1">Días OK</span>
                <span className="text-lg font-black text-[#FF7939] leading-none">{daysCompleted ?? 0}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 shadow-inner flex flex-col items-center justify-center text-center opacity-60">
                <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest block mb-1">Items Totales</span>
                <span className="text-lg font-black text-zinc-300 leading-none">{itemsCompletedTotal ?? 0}</span>
            </div>
        </div>
    );
}

function PurchasedActivityCardFooter({ isFinished, progress }: any) {
    if (isFinished || progress >= 100) {
        return (
            <div className="mt-auto py-2 flex justify-center opacity-30 group-hover:opacity-100 transition-opacity duration-300">
                <div className="h-1 w-8 bg-[#FF7939] rounded-full" />
            </div>
        );
    }
    return null;
}
