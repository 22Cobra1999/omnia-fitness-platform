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
    const hoyPercent = Math.min(Math.max(progress, 2), 98);

    return (
        <div className={cn(
            "flex-1 flex flex-col h-full min-h-0 relative z-30 px-4",
            size === "small" ? "pb-4" : "pb-6"
        )}>
            {/* Horizontal Divider - extremely subtle */}
            <div className="w-full h-px bg-white/5 mb-6" />

            <div className={cn("flex-1 flex flex-col gap-8", daysInfo.isExpired && "grayscale opacity-60")}>

                {/* 1. HOY pill and PROXIMA row */}
                <div className="flex items-center justify-between gap-2">
                    {/* HOY Pill - Adjusted for better alignment */}
                    <div className="flex items-center gap-2 bg-[#FF7939] px-4 py-2 rounded-full shadow-[0_4px_16px_rgba(255,121,57,0.35)] shrink-0">
                        <Zap className="w-3.5 h-3.5 text-white fill-white" />
                        <span className="text-[11px] font-[900] text-white tracking-[0.05em] uppercase whitespace-nowrap">
                            HOY {pendingCount ?? 0}
                        </span>
                    </div>

                    {/* PROXIMA info - Ensure no overlap */}
                    <div className="flex items-center gap-1 opacity-70 flex-shrink-0">
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">PRÓXIMA:</span>
                        <span className="text-[11px] font-black text-zinc-300 tracking-tighter whitespace-nowrap">
                            {nextSessionDate ? formatDM(nextSessionDate) : '--/--'}
                        </span>
                        <span className="text-zinc-500 font-black text-xs ml-0.5 leading-none">{'>'}</span>
                    </div>
                </div>

                {/* 2. Timeline with Orange Track and Pulsing Dots */}
                <div className="relative h-[2px] mt-2 group/timeline">
                    {/* Background Track (Gray) */}
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-full bg-zinc-800 rounded-full" />

                    {/* Progress Track (Orange) */}
                    <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-full bg-[#FF7939] rounded-full shadow-[0_0_10px_rgba(255,121,57,0.5)] transition-all duration-700"
                        style={{ width: `${progress}%` }}
                    />

                    {/* Dots along the timeline - spaced evenly */}
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between">
                        {[...Array(10)].map((_, i) => {
                            const dotPercent = (i / 9) * 100;
                            const isPastOrCurrent = dotPercent <= progress;

                            return (
                                <div
                                    key={i}
                                    className={cn(
                                        "w-[8px] h-[8px] rounded-full transition-all duration-500 ring-2 ring-zinc-950",
                                        isPastOrCurrent ? "bg-[#FF7939] scale-110 shadow-[0_0_8px_rgba(255,121,57,0.4)]" : "bg-zinc-700 scale-90"
                                    )}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* 3. Dates below timeline - matched to mockup INICIO 22/2   FIN 22/3 */}
                <div className="flex justify-between items-center text-[11px] mt-1">
                    <div className="flex items-center gap-2">
                        <span className="text-zinc-500 font-[800] uppercase text-[8px] tracking-widest">Inicio</span>
                        <span className="text-zinc-200 font-[900] text-[12px]">{formatDM(enrollment.start_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-zinc-500 font-[800] uppercase text-[8px] tracking-widest">Fin</span>
                        <span className="text-zinc-200 font-[900] text-[12px]">{formatDM(enrollment.program_end_date)}</span>
                    </div>
                </div>

                {/* Extra View states (Coach View / Finished) if applicable */}
                {isCoachView && (
                    <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-3 mt-auto">
                        <div className="bg-white/5 rounded-2xl p-2 text-center border border-white/5">
                            <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest block mb-1">Días OK</span>
                            <span className="text-sm font-black text-orange-400">{daysCompleted ?? 0}</span>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-2 text-center border border-white/5 opacity-50">
                            <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest block mb-1">Items</span>
                            <span className="text-sm font-black text-zinc-400">{itemsCompletedTotal ?? 0}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Hidden marker to keep height consistent */}
            <PurchasedActivityCardFooter isFinished={isFinished} progress={progress} />
        </div>
    )
}

function PurchasedActivityCardFooter({ isFinished, progress }: any) {
    if (isFinished || progress >= 100) {
        return (
            <div className="mt-8 flex justify-center opacity-30">
                <CheckCircle2 className="w-4 h-4 text-orange-400" />
            </div>
        );
    }
    return <div className="mt-8 h-4 shrink-0" />;
}
