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
            "flex-1 flex flex-col h-full min-h-0 relative z-30",
            size === "small" ? "p-3 px-4" : "p-4 py-2"
        )}>
            {/* Divider Line */}
            <div className="w-full h-px bg-white/5 mb-4" />

            <div className={cn("flex flex-col gap-4", daysInfo.isExpired && "grayscale opacity-60")}>
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

                {/* Info Dinámica - Mockup style */}
                {hasStarted && !isFinished && (
                    <div className="flex flex-col gap-6">
                        {/* HOY and PROX row - Zap Pill style */}
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2 bg-[#FF7939] px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(255,121,57,0.3)]">
                                <Zap className="w-3.5 h-3.5 text-white fill-white" />
                                <span className="text-[11px] font-black text-white tracking-widest uppercase">HOY {pendingCount || 0}</span>
                            </div>
                            <div className="flex items-center gap-1.5 opacity-60">
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">PRÓXIMA:</span>
                                <span className="text-[11px] font-black text-zinc-300">{nextSessionDate ? formatDM(nextSessionDate) : '--/--'}</span>
                                <span className="text-zinc-500 font-bold ml-1 text-xs">{'>'}</span>
                            </div>
                        </div>

                        {/* Line With Dots Graph - matching mockup orange segment and gray rest */}
                        <div className="relative px-2 h-10 flex flex-col justify-center">
                            {/* Unified track */}
                            <div className="absolute left-0 right-0 h-[4px] bg-zinc-800/80 top-1/2 -translate-y-1/2 rounded-full overflow-hidden">
                                {/* Optional orange fill progress line if user wants it, but dots are key here */}
                                {/* <div className="h-full bg-orange-500/80" style={{ width: `${progress}%` }} /> */}
                            </div>

                            <div className="relative h-px flex items-center">
                                {/* Dots logic based on mockup (orange for current/passed, gray for future) */}
                                {[...Array(10)].map((_, i) => {
                                    const dotPercent = (i / 9) * 100;
                                    const isCompleted = dotPercent <= progress;
                                    return (
                                        <div
                                            key={i}
                                            className={cn(
                                                "absolute w-2 h-2 rounded-full ring-1 ring-zinc-950/50",
                                                isCompleted ? "bg-[#FF7939] shadow-[0_0_8px_rgba(255,121,57,0.4)]" : "bg-zinc-600/80"
                                            )}
                                            style={{ left: `${dotPercent}%`, transform: 'translateX(-50%)' }}
                                        />
                                    );
                                })}
                            </div>

                            {/* Dates Below - matching INICIO DD/MM     FIN DD/MM */}
                            <div className="absolute top-[calc(50%+16px)] left-0 right-0 flex justify-between items-center px-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] text-zinc-550 font-black uppercase tracking-tight">Inicio</span>
                                    <span className="text-[11px] text-zinc-300 font-black leading-none">{formatDM(enrollment.start_date)}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] text-zinc-550 font-black uppercase tracking-tight">Fin</span>
                                    <span className="text-[11px] text-zinc-300 font-black leading-none">{formatDM(enrollment.program_end_date)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Finalizadas - cleanup */}
                {isFinished && (
                    <div className="flex flex-col gap-4 py-4 px-2">
                        <div className="flex flex-col items-center justify-center p-6 bg-orange-500/5 rounded-3xl border border-white/5">
                            <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest block mb-2 opacity-50">Actividad Finalizada</span>
                            <span className="text-4xl font-black text-orange-400 drop-shadow-md">{progress}%</span>
                        </div>
                        <div className="flex justify-between items-center opacity-60">
                            <div className="flex items-center gap-2">
                                <span className="text-[8px] text-zinc-600 font-black uppercase tracking-tight">Inicio</span>
                                <span className="text-xs font-black text-zinc-300">{formatDM(enrollment.start_date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[8px] text-zinc-600 font-black uppercase tracking-tight">Fin</span>
                                <span className="text-xs font-black text-zinc-300">{formatDM(enrollment.program_end_date)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Por Empezar - cleanup */}
                {!hasStarted && !isFinished && enrollment.start_deadline && (
                    <div className="py-8 flex flex-col items-center justify-center bg-zinc-900/40 rounded-3xl border border-white/5 mx-2 shadow-inner">
                        <span className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em] mb-2 opacity-40">Empezar antes de</span>
                        <span className="text-3xl font-black text-orange-400">{formatDM(enrollment.start_deadline)}</span>
                    </div>
                )}
            </div>

            {/* Footer Placeholders */}
            <PurchasedActivityCardFooter isFinished={isFinished} progress={progress} />
        </div>
    )
}

function CoachViewStats({ daysCompleted, itemsCompletedTotal }: any) {
    return (
        <div className="grid grid-cols-2 gap-2 mb-2 px-2">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center">
                <span className="text-[8px] text-zinc-500 font-bold uppercase block mb-1">Días OK</span>
                <span className="text-lg font-black text-orange-400 leading-none">{daysCompleted ?? 0}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center opacity-50">
                <span className="text-[8px] text-zinc-500 font-bold uppercase block mb-1">Items Tot</span>
                <span className="text-lg font-black text-zinc-400 leading-none">{itemsCompletedTotal ?? 0}</span>
            </div>
        </div>
    );
}

function PurchasedActivityCardFooter({ isFinished, progress }: any) {
    if (isFinished || progress >= 100) {
        return (
            <div className="mt-auto py-4 flex justify-center opacity-0 group-hover:opacity-40 transition-all duration-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" />
            </div>
        );
    }
    return null;
}
