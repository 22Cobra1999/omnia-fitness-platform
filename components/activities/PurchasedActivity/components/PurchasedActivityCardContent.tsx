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
            "flex-1 flex flex-col h-full min-h-0 relative -mt-6 z-30",
            size === "small" ? "p-2 px-3" : "p-4"
        )}>
            {/* Glassmorphism Body */}
            <div className="flex-1 flex flex-col bg-zinc-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-4 shadow-2xl">

                {/* 1. Coach Info */}
                {!isCoachView && (
                    <div className={cn("pb-2 mb-3 border-b border-white/5", daysInfo.isExpired && "grayscale opacity-60")}>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-0 flex items-center gap-2">
                                <p className="text-xs font-black text-zinc-300 truncate tracking-tight">{activity.coach_name || 'Coach'}</p>
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

                {/* 2. Badges */}
                <div className={cn("flex flex-row items-center gap-2 mb-4 overflow-hidden whitespace-nowrap", daysInfo.isExpired && "grayscale opacity-60")}>
                    <Badge variant="outline" className="bg-zinc-800/50 border-[#FF7939]/30 text-[#FF7939] text-[8px] px-1.5 h-4 font-bold tracking-wider uppercase shrink-0">
                        {getCategoryBadge(activity.categoria)}
                    </Badge>
                    <Badge variant="outline" className="bg-zinc-800/30 border-zinc-700/50 text-zinc-400 text-[8px] px-1.5 h-4 font-bold tracking-wider uppercase shrink-0">
                        {getTypeBadge(activity.type)}
                    </Badge>
                </div>

                {/* 3. Info Dinámica */}
                <div className={cn("flex-1 flex flex-col justify-center gap-2", daysInfo.isExpired && "grayscale opacity-60")}>
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
                        <div className="flex flex-col items-center justify-center py-4">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Empezar antes de</span>
                            <span className="text-2xl font-black text-[#FF7939]">{formatDM(enrollment.start_deadline)}</span>
                        </div>
                    )}

                    {/* 3.2 Timeline UI - Pestaña En Curso */}
                    {hasStarted && !isFinished && (
                        <div className="flex flex-col">
                            {/* HOY and PROX row */}
                            <div className="flex justify-between items-end mb-6 px-1">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1">
                                        <Zap className="w-3.5 h-3.5 text-[#FF7939] fill-[#FF7939]" />
                                        <span className="text-xs font-black text-[#FF7939] uppercase tracking-tighter">HOY</span>
                                    </div>
                                    <span className="text-2xl font-black text-white leading-none mt-1">{pendingCount || 0}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter">Próxima</span>
                                    <span className="text-sm font-black text-zinc-300">{nextSessionDate ? formatDM(nextSessionDate) : '--/--'}</span>
                                </div>
                            </div>

                            {/* Timeline Graphic */}
                            <div className="relative px-2 h-14 flex flex-col justify-center">
                                {/* Base Line */}
                                <div className="absolute left-0 right-0 h-[2px] bg-zinc-800/80 top-1/2 -translate-y-1/2 rounded-full overflow-hidden">
                                    {/* Simple thick progress line */}
                                    {/* <div className="h-full bg-zinc-700" style={{ width: `${progress}%` }} /> */}
                                </div>

                                <div className="relative h-px flex items-center">
                                    {/* Start Dot */}
                                    <div className="absolute left-0 w-3 h-3 rounded-full bg-[#FF7939] ring-2 ring-zinc-900 -translate-x-1/2" />

                                    {/* Mid dots */}
                                    {daysRemainingFuture && daysRemainingFuture > 1 && (
                                        Array.from({ length: Math.min(daysRemainingFuture - 1, 4) }).map((_, i) => {
                                            const dotPercent = hoyPercent + ((90 - hoyPercent) / (Math.min(daysRemainingFuture - 1, 4) + 1)) * (i + 1);
                                            return (
                                                <div
                                                    key={i}
                                                    className="absolute w-1.5 h-1.5 rounded-full bg-zinc-700/80"
                                                    style={{ left: `${dotPercent}%`, transform: 'translateX(-50%)' }}
                                                />
                                            );
                                        })
                                    )}

                                    {/* Current/Next Marker */}
                                    {nextPercent !== null && (
                                        <div
                                            className="absolute w-2.5 h-2.5 rounded-full bg-zinc-600 ring-2 ring-zinc-900"
                                            style={{ left: `${nextPercent}%`, transform: 'translateX(-50%)' }}
                                        />
                                    )}

                                    {/* End Dot */}
                                    <div className="absolute right-0 w-3 h-3 rounded-full bg-zinc-800 ring-2 ring-zinc-900 translate-x-1/2" />
                                </div>

                                {/* Dates Below */}
                                <div className="absolute top-[calc(50%+12px)] left-0 right-0 flex justify-between items-center px-0">
                                    <div className="flex items-center gap-1">
                                        <span className="text-[8px] text-zinc-500 font-bold uppercase">Inicio</span>
                                        <span className="text-[10px] text-white font-black">{formatDM(enrollment.start_date)}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[8px] text-zinc-500 font-bold uppercase">Fin</span>
                                        <span className="text-[10px] text-white font-black">{formatDM(enrollment.program_end_date)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3.3 Finalizadas UI */}
                    {isFinished && (
                        <div className="flex flex-col gap-4 py-2">
                            <div className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-2xl border border-white/5">
                                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-1">Actividad Finalizada</span>
                                <span className="text-4xl font-black text-[#FF7939]">{progress}%</span>
                            </div>
                            <div className="flex justify-between items-center px-2">
                                <div className="flex flex-col">
                                    <span className="text-[8px] text-zinc-500 font-bold uppercase">Inicio</span>
                                    <span className="text-xs font-black text-white">{formatDM(enrollment.start_date)}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[8px] text-zinc-500 font-bold uppercase">Fin</span>
                                    <span className="text-xs font-black text-white">{formatDM(enrollment.program_end_date)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. Footer Placeholder */}
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
    const type = activity.type?.toLowerCase() || '';
    const cat = activity.categoria?.toLowerCase() || '';
    const isDocument = type.includes('document') || type.includes('documento') || cat.includes('documento');

    if (isDocument) {
        return (
            <div className="flex flex-col gap-2 mb-4">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">Completados</span>
                    <span className="text-sm font-black text-orange-400">{itemsCompletedTotal ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">Restantes</span>
                    <span className="text-sm font-black text-zinc-400">{itemsPendingToday ?? 0}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[8px] text-zinc-500 font-bold uppercase block mb-0.5">Días OK</span>
                <span className="text-sm font-black text-orange-400">{daysCompleted ?? 0}</span>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[8px] text-zinc-500 font-bold uppercase block mb-0.5">Días Off</span>
                <span className="text-sm font-black text-red-400/70">{daysMissed ?? 0}</span>
            </div>
        </div>
    );
}

function PurchasedActivityCardFooter({ isFinished, progress }: any) {
    if (isFinished || progress >= 100) {
        return (
            <div className="mt-auto pt-4 text-center opacity-50">
                <CheckCircle2 className="w-4 h-4 text-orange-400 mx-auto" />
            </div>
        );
    }
    return null;
}
