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
    streak: number
    pendingCount: number | null
    nextSessionDate: string | null
    nextActivity: any
    isFinished: boolean
    progress: number
    hasStarted: boolean
    isFuture?: boolean
    daysToStart?: number
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
        const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        return `${d.getDate()} ${months[d.getMonth()]}`;
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
    streak,
    pendingCount,
    nextSessionDate,
    nextActivity,
    isFinished,
    progress,
    hasStarted,
    isFuture,
    daysToStart,
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
            "flex-1 flex flex-col h-full min-h-0 relative z-30 px-2 rounded-b-[2.8rem]",
            size === "small" ? "pb-2" : "pb-2"
        )}>
            {/* Removed solid background and divider to allow header gradient to merge smoothly */}

            <div className={cn("flex-1 flex flex-col gap-5 px-1 pt-6", daysInfo.isExpired && "grayscale opacity-60")}>

                {/* 1. Dynamic Pill (EMPEZAR, HOY or PRÓXIMA) */}
                <div className="flex items-center justify-between gap-1 px-1">
                    {isFinished ? (
                        /* FINALIZADAS Pill */
                        <div className="flex items-center gap-1 bg-white/10 backdrop-blur-xl border border-white/10 px-1.5 py-0.5 rounded-full shadow-lg shrink-0 mr-auto scale-[0.8] origin-left">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                            <span className="text-[9px] font-black text-white tracking-widest uppercase whitespace-nowrap">
                                {(() => {
                                    if (daysInfo.isExpired) return 'VENCIDA';
                                    const startDeadline = (enrollment as any).start_deadline;
                                    if (startDeadline && !enrollment.start_date) {
                                        const deadline = new Date(startDeadline);
                                        deadline.setHours(0, 0, 0, 0);
                                        const todayObj = new Date();
                                        todayObj.setHours(0, 0, 0, 0);
                                        if (todayObj > deadline) return 'VENCIDA';
                                    }
                                    const expDate = (enrollment as any).expiration_date;
                                    return expDate ? `VENCE EL: ${formatDM(expDate)}` : `VENCE EL: ${formatDM(enrollment.program_end_date)}`;
                                })()}
                            </span>
                        </div>
                    ) : isFuture ? (
                        /* EMPEZAR Pill - Extra compact to fit desktop card width */
                        <div className="flex items-center bg-[#FF7939]/30 backdrop-blur-xl border border-[#FF7939]/40 px-2 py-0.5 rounded-full shadow-lg shrink-0 mx-auto scale-[0.78] max-w-[95%]">
                            <span className="text-[8.5px] font-black text-white tracking-wider uppercase whitespace-nowrap">
                                EMPEZAR ANTES DE: {(enrollment as any).start_deadline ? formatDM((enrollment as any).start_deadline) : '--/--'}
                            </span>
                        </div>
                    ) : pendingCount && pendingCount > 0 ? (
                        /* HOY Pill */
                        <div className="flex items-center gap-1 bg-[#FF7939]/30 backdrop-blur-xl border border-[#FF7939]/40 px-1.5 py-0.5 rounded-full shadow-lg shrink-0 mr-auto scale-[0.8] origin-left">
                            <Zap className="w-3 h-3 text-white fill-white" />
                            <span className="text-[9px] font-black text-white tracking-widest uppercase whitespace-nowrap">
                                HOY {pendingCount}
                            </span>
                        </div>
                    ) : (
                        /* PRÓXIMA / ÚLTIMA Pill - Replaces HOY when no activities today */
                        <div className="flex items-center gap-1 bg-[#FF7939]/30 backdrop-blur-xl border border-[#FF7939]/40 px-1.5 py-0.5 rounded-full shadow-lg shrink-0 mr-auto scale-[0.8] origin-left">
                            <Calendar className="w-3 h-3 text-white" />
                            <span className="text-[9px] font-black text-white tracking-widest uppercase whitespace-nowrap">
                                {nextSessionDate ? `PRÓXIMA: ${formatDM(nextSessionDate)}` : 'ÚLTIMA SESIÓN'}
                            </span>
                        </div>
                    )}

                    {/* Proxima context (Right side) - Only if not showing in pill */
                        (!isFuture && !isFinished && pendingCount && pendingCount > 0) && (
                            <div className="flex items-center gap-1.5 opacity-60 scale-[0.75] origin-right">
                                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                                    {nextSessionDate ? 'PRÓXIMA:' : 'ÚLTIMA:'}
                                </span>
                                <span className="text-[9px] font-black text-white tracking-tighter whitespace-nowrap">
                                    {nextSessionDate ? formatDM(nextSessionDate) : 'HOY'}
                                </span>
                            </div>
                        )}
                </div>

                {/* 2. Dates Row - No frame, lighter labels */}
                <div className="flex flex-col gap-1 px-1 -mt-3.5">
                    <div className="flex justify-between items-center px-1">
                        <div className="flex flex-col">
                            <span className="text-zinc-500 font-bold uppercase text-[6px] tracking-[0.2em] opacity-40">
                                {isFuture ? 'Compra' : 'Inicio'}
                            </span>
                            <span className="text-zinc-400 font-extrabold text-[11px]">
                                {isFuture ? formatDM(enrollment.created_at) : formatDM(enrollment.start_date)}
                            </span>
                        </div>

                        <div className="flex flex-col items-end">
                            <span className="text-zinc-500 font-bold uppercase text-[6px] tracking-[0.2em] opacity-40">Fin</span>
                            <span className="text-zinc-400 font-extrabold text-[11px]">{formatDM(enrollment.program_end_date)}</span>
                        </div>
                    </div>

                    {/* Larger Progress Percent below dates - Only for "Finalizadas" */}
                    {isFinished && typeof progress === 'number' && (
                        <div className="flex items-center justify-center -mt-1">
                            <span className="text-xl font-black text-orange-400 drop-shadow-md">
                                {Math.round(progress)}%
                            </span>
                        </div>
                    )}
                </div>

                {/* 3. Streak Counter (Racha) - Side-by-side design + RACHA label below */}
                {(streak > 0 || (pendingCount === 0 && hasStarted)) && (
                    <div className="flex flex-col items-center justify-center -mt-4">
                        <div className="relative group transition-all duration-500 active:scale-95 flex flex-col items-center">
                            {/* Premium dark squircle frame */}
                            <div className={cn(
                                "bg-[#1A0F0A]/90 backdrop-blur-2xl rounded-2xl shadow-2xl transition-all duration-500 border border-[#FF7939]/20 shadow-black/80 flex items-center gap-2.5 px-3 py-1.5",
                            )}>
                                <Flame className="h-5 w-5 text-[#FF7939] fill-[#FF7939]" strokeWidth={2.5} />

                                {streak > 1 && (
                                    <span className="text-[#FF7939] font-black text-base leading-none translate-y-[0.5px]">
                                        {streak}
                                    </span>
                                )}
                            </div>
                            {/* RACHA Label outside frame */}
                            <span className="text-[#FF7939] font-black text-[8px] uppercase tracking-[0.25em] mt-1 opacity-90">
                                RACHA
                            </span>
                        </div>
                    </div>
                )}

                {/* Extra View states (Coach View / Finished) if applicable */}
                {isCoachView && (
                    <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-3 mt-auto">
                        <div className="bg-white/5 rounded-2xl p-2 text-center border border-white/5">
                            <span className="text-[7px] text-zinc-500 font-extrabold uppercase tracking-widest block mb-1">Días OK</span>
                            <span className="text-[10px] font-black text-orange-400">{daysCompleted ?? 0}</span>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-2 text-center border border-white/5 opacity-50">
                            <span className="text-[7px] text-zinc-500 font-extrabold uppercase tracking-widest block mb-1">Items</span>
                            <span className="text-[10px] font-black text-zinc-400">{itemsCompletedTotal ?? 0}</span>
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
            <div className="mt-2 flex justify-center opacity-30">
                <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" />
            </div>
        );
    }
    return <div className="mt-2 h-3" />;
}
