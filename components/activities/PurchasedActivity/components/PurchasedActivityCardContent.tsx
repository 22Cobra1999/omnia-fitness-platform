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

    return (
        <div className={cn(
            "flex-1 flex flex-col h-full min-h-0 relative z-30 px-4",
            size === "small" ? "pb-3" : "pb-4"
        )}>
            {/* Horizontal Divider - extremely subtle */}
            <div className="w-full h-px bg-white/5 mb-5 opacity-40" />

            <div className={cn("flex-1 flex flex-col gap-6", daysInfo.isExpired && "grayscale opacity-60")}>

                {/* 1. HOY pill and PROXIMA row */}
                <div className="flex items-center justify-between gap-2 px-1">
                    {/* HOY Pill - Translucent (glassmorphism like flame) */}
                    <div className="flex items-center gap-2 bg-[#FF7939]/30 backdrop-blur-xl border border-[#FF7939]/20 px-3.5 py-1.5 rounded-full shadow-lg shrink-0">
                        <Zap className="w-3 h-3 text-[#FF7939] fill-[#FF7939]" />
                        <span className="text-[10px] font-black text-white tracking-widest uppercase whitespace-nowrap">
                            HOY {pendingCount ?? 0}
                        </span>
                    </div>

                    {/* PROXIMA info - Shifted text sizes */}
                    <div className="flex items-center gap-1 opacity-60 flex-shrink-0">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">PRÓXIMA:</span>
                        <span className="text-[10px] font-black text-zinc-300 tracking-tighter whitespace-nowrap">
                            {nextSessionDate ? formatDM(nextSessionDate) : '--/--'}
                        </span>
                        <span className="text-zinc-500 font-black text-xs ml-0.5 leading-none">{'>'}</span>
                    </div>
                </div>

                {/* 2. Timeline with Orange Track (representing next 7 days) */}
                <div className="relative h-[2px] mt-2 px-1">
                    {/* Background Track (Gray) */}
                    <div className="absolute inset-x-1 top-1/2 -translate-y-1/2 h-full bg-zinc-800 rounded-full" />

                    {/* Progress Track (Orange) */}
                    <div
                        className="absolute left-1 top-1/2 -translate-y-1/2 h-full bg-[#FF7939] rounded-full shadow-[0_0_10px_rgba(255,121,57,0.4)]"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />

                    {/* Dots representing 7 days grid */}
                    <div className="absolute inset-x-1 top-1/2 -translate-y-1/2 flex justify-between">
                        {[...Array(7)].map((_, i) => {
                            const dotPercent = (i / 6) * 100;
                            const isPastOrCurrent = dotPercent <= progress;

                            return (
                                <div
                                    key={i}
                                    className={cn(
                                        "w-[7px] h-[7px] rounded-full transition-all duration-300 ring-2 ring-zinc-950",
                                        isPastOrCurrent ? "bg-[#FF7939] scale-110 shadow-[0_0_8px_rgba(255,121,57,0.3)]" : "bg-zinc-700 scale-90"
                                    )}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* 3. Dates below timeline */}
                <div className="flex justify-between items-center text-[10px] px-1">
                    <div className="flex items-center gap-2">
                        <span className="text-zinc-600 font-bold uppercase text-[7px] tracking-widest">Inicio</span>
                        <span className="text-zinc-300 font-black text-[11px]">{formatDM(enrollment.start_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-zinc-600 font-bold uppercase text-[7px] tracking-widest">Fin</span>
                        <span className="text-zinc-300 font-black text-[11px]">{formatDM(enrollment.program_end_date)}</span>
                    </div>
                </div>

                {/* Extra View states (Coach View / Finished) if applicable */}
                {isCoachView && (
                    <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-3 mt-auto">
                        <div className="bg-white/5 rounded-2xl p-2.5 text-center border border-white/5">
                            <span className="text-[7.5px] text-zinc-500 font-extrabold uppercase tracking-widest block mb-0.5">Días OK</span>
                            <span className="text-xs font-black text-orange-400">{daysCompleted ?? 0}</span>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-2.5 text-center border border-white/5 opacity-50">
                            <span className="text-[7.5px] text-zinc-500 font-extrabold uppercase tracking-widest block mb-0.5">Items</span>
                            <span className="text-xs font-black text-zinc-400">{itemsCompletedTotal ?? 0}</span>
                        </div>
                    </div>
                )}
            </div>

            <PurchasedActivityCardFooter isFinished={isFinished} progress={progress} />
        </div>
    )
}

function PurchasedActivityCardFooter({ isFinished, progress }: any) {
    if (isFinished || progress >= 100) {
        return (
            <div className="mt-4 flex justify-center opacity-30">
                <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" />
            </div>
        );
    }
    return <div className="mt-4 h-3.5" />;
}
