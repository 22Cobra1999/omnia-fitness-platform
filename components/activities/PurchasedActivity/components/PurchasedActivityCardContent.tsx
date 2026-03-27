import { Badge } from "@/components/ui/badge"
import { Star, Calendar, Clock, CheckCircle2, Flame, Play, Video, Zap, UtensilsCrossed } from "lucide-react"
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
    const daysIncomplete = Math.max(0, (daysPassed || 0) - (daysCompleted || 0) - (daysMissed || 0))
    const isNutrition = activity.type?.toLowerCase() === 'nutrition' || activity.type?.toLowerCase() === 'nutricion' || activity.category?.toLowerCase() === 'nutrition'

    return (
        <div className={cn(
            "flex-1 flex flex-col h-full min-h-0 relative z-30 px-2 rounded-b-[2.8rem]",
            size === "small" ? "pb-2" : "pb-2"
        )}>
            {/* Removed solid background and divider to allow header gradient to merge smoothly */}

            <div className={cn("flex-1 flex flex-col gap-3 px-1 pt-6", daysInfo.isExpired && "grayscale opacity-60")}>

                {/* Progress for Coach View - Below title */}
                {isCoachView && (
                    <div className="flex flex-col items-center gap-0.5 -mt-3 mb-4">
                        <span className="text-3xl font-[1000] text-orange-400 drop-shadow-2xl">
                            {Math.round(progress)}%
                        </span>
                        <span className="text-[7px] font-black text-white/20 tracking-[0.3em] uppercase">Progreso Real</span>
                    </div>
                )}

                {/* 1. Dynamic Pill (EMPEZAR, HOY or PRÓXIMA) */}
                <div className="flex items-center justify-between gap-1 px-1">
                    {daysInfo.isExpired && !enrollment.rating_coach ? (
                        <div className="flex items-center gap-1 bg-[#FF7939] border border-[#FF7939]/50 px-2 py-0.5 rounded-full shadow-lg shrink-0 mr-auto scale-[0.8] origin-left shadow-[#FF7939]/20">
                            <Star className="w-3 h-3 text-white fill-white" />
                            <span className="text-[9px] font-[1000] text-white tracking-widest uppercase whitespace-nowrap">CALIFICAR</span>
                        </div>
                    ) : daysInfo.isExpired ? (
                        <div className="flex items-center gap-1 bg-white/10 backdrop-blur-xl border border-white/10 px-2 py-0.5 rounded-full shadow-lg shrink-0 mr-auto scale-[0.8] origin-left opacity-90">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                            <span className="text-[9px] font-black text-white tracking-widest uppercase whitespace-nowrap">VENCIDA</span>
                        </div>
                    ) : pendingCount && pendingCount > 0 ? (
                        <div className="flex items-center gap-1.5 bg-[#FF7939]/40 backdrop-blur-xl border border-[#FF7939]/50 px-2 py-0.5 rounded-full shadow-lg shrink-0 mr-auto scale-[0.8] origin-left">
                            {isNutrition ? (
                                <UtensilsCrossed className="w-3 h-3 text-white" />
                            ) : (
                                <Zap className="w-3 h-3 text-white fill-white" />
                            )}
                            <span className="text-[9px] font-black text-white tracking-widest uppercase whitespace-nowrap">
                                HOY {pendingCount}
                            </span>
                        </div>
                    ) : nextSessionDate ? (
                        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-xl border border-white/20 px-2 py-0.5 rounded-full shadow-lg shrink-0 mr-auto scale-[0.8] origin-left">
                            <Calendar className="w-3 h-3 text-white" />
                            <span className="text-[9px] font-black text-white tracking-widest uppercase whitespace-nowrap">
                                PROX: {formatDM(nextSessionDate)}
                            </span>
                        </div>
                    ) : null}

                    {/* Proxima context (Right side) */}
                    {(!isFuture && !isFinished && !daysInfo.isExpired && pendingCount && pendingCount > 0) && (
                        <div className="flex items-center gap-1.5 opacity-40 scale-[0.75] origin-right">
                            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">PROX:</span>
                            <span className="text-[9px] font-black text-white tracking-tighter whitespace-nowrap">
                                {nextSessionDate ? formatDM(nextSessionDate) : '...'}
                            </span>
                        </div>
                    )}
                </div>

                {/* 2. Dates Row - No frame, lighter labels */}
                <div className="flex flex-col gap-2 px-1 -mt-2">
                    <div className="flex justify-between items-center px-1">
                        <div className="flex flex-col">
                            <span className="text-zinc-500 font-bold uppercase text-[6px] tracking-[0.2em] opacity-40">
                                {isFuture ? 'Compra' : 'Inicio'}
                            </span>
                            <span className="text-zinc-400 font-extrabold text-[11px] h-[14px]">
                                {isFuture ? formatDM(enrollment.created_at) : formatDM(enrollment.start_date)}
                            </span>
                        </div>

                        <div className="flex flex-col items-end">
                            <span className="text-zinc-500 font-bold uppercase text-[6px] tracking-[0.2em] opacity-40 text-right">Fin</span>
                            <span className="text-zinc-400 font-extrabold text-[11px] h-[14px] text-right">{formatDM(enrollment.program_end_date)}</span>
                        </div>
                    </div>

                    {/* MOVED: Empezar antes de (para actividades futuras) */}
                    {isFuture && (enrollment as any).start_deadline && !daysInfo.isExpired && (
                        <div className="flex items-center bg-[#FF7939]/20 backdrop-blur-xl border border-[#FF7939]/30 px-2 py-0.5 rounded-full shadow-sm mx-auto scale-[0.85] w-fit -mt-0.5">
                            <span className="text-[8px] font-black text-orange-400 tracking-wider uppercase whitespace-nowrap">
                                EMPEZAR ANTES DE: {formatDM((enrollment as any).start_deadline)}
                            </span>
                        </div>
                    )}

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
                    <div className="flex flex-col items-center justify-center -mt-4 mb-2">
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
                    <div className="flex flex-col gap-4 mt-auto pt-4 border-t border-white/5 mx-1">
                        {/* Days Section */}
                        <div className="flex flex-col gap-1.5 px-0.5">
                            <h4 className="text-[8px] font-[1000] text-white/20 uppercase tracking-[0.2em]">Días</h4>
                            <div className="flex items-center justify-between border-l border-white/10 pl-3 py-0.5">
                                <StatItem label="OK" value={daysCompleted} color="text-[#FF7939]" />
                                <div className="h-4 w-[1px] bg-white/5" />
                                <StatItem label="INC" value={daysIncomplete} color="text-yellow-200/90" />
                                <div className="h-4 w-[1px] bg-white/5" />
                                <StatItem label="AUS" value={daysMissed} color="text-red-500" />
                                <div className="h-4 w-[1px] bg-white/5" />
                                <StatItem label="PEN" value={daysRemainingFuture} color="text-white" />
                            </div>
                        </div>

                        {/* Items Section */}
                        <div className="flex flex-col gap-1.5 px-0.5">
                            <h4 className="text-[8px] font-[1000] text-white/20 uppercase tracking-[0.2em]">
                                {isNutrition ? 'Platos' : 'Ejercicios'}
                            </h4>
                            <div className="flex items-center justify-between border-l border-white/10 pl-3 py-0.5">
                                <StatItem label="OK" value={itemsCompletedTotal} color="text-[#FF7939]" />
                                <div className="h-4 w-[1px] bg-white/5" />
                                <StatItem label="NO" value={itemsDebtPast} color="text-red-500" />
                                <div className="h-4 w-[1px] bg-white/5" />
                                <StatItem label="PEN" value={itemsPendingToday} color="text-white" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <PurchasedActivityCardFooter isFinished={isFinished} progress={progress} />
        </div>
    )
}

function StatItem({ label, value, color }: { label: string, value: number | undefined, color: string }) {
    return (
        <div className="flex flex-col items-center gap-0.5">
            <span className="text-[7.5px] text-white/20 font-black uppercase tracking-tight">{label}</span>
            <span className={cn("text-sm font-[1000] leading-none", color)}>{value ?? 0}</span>
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
