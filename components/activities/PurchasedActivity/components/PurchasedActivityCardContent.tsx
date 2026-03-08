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
            "flex-1 flex flex-col h-full min-h-0 relative",
            size === "small" ? "p-2 px-3" : "p-4"
        )}>
            {/* 1. Título */}
            <div className={cn("mb-1", daysInfo.isExpired && "grayscale opacity-60")}>
                <h3 className={cn(
                    "text-white font-bold leading-tight h-[2.5em] overflow-hidden line-clamp-2",
                    size === "small" ? "text-sm" : "text-base"
                )}>
                    {activity.title}
                </h3>
            </div>

            {/* 2. Coach Info */}
            {!isCoachView && (
                <div className={cn("border-t border-b border-gray-700/30 py-2 mb-3", daysInfo.isExpired && "grayscale opacity-60")}>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                            <p className="text-xs font-medium text-gray-300 truncate">{activity.coach_name || 'Coach'}</p>
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

            {/* 3. Badges */}
            <div className={cn("flex flex-row items-center gap-2 mb-2 overflow-hidden whitespace-nowrap", daysInfo.isExpired && "grayscale opacity-60")}>
                <Badge variant="outline" className="bg-transparent border-[#FF7939] text-[#FF7939] text-[8px] px-1 h-3.5 font-bold tracking-wider uppercase shrink-0">
                    {getCategoryBadge(activity.categoria)}
                </Badge>
                {getTypeBadge(activity.type) === 'TALLER' ? (
                    <Badge variant="outline" className="bg-zinc-800/50 border-[#FADADD] text-[#FADADD] text-[9px] px-1.5 h-4 font-bold tracking-wider uppercase shrink-0">
                        TALLER
                    </Badge>
                ) : (
                    <Badge variant="outline" className="bg-zinc-800 border-zinc-700 text-zinc-300 text-[9px] px-1.5 h-4 font-bold tracking-wider uppercase shrink-0">
                        {getTypeBadge(activity.type)}
                    </Badge>
                )}
            </div>

            {/* 4. Info Dinámica */}
            <div className={cn("flex-1 flex flex-col gap-2 text-[11px] text-gray-300", daysInfo.isExpired && "grayscale opacity-60")}>
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

                {/* 4.1 "Empezar antes de" - Pestaña Por Empezar */}
                {!hasStarted && !isFinished && enrollment.start_deadline && (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        {new Date(enrollment.start_deadline) < new Date() ? (
                            <div className="flex flex-col items-center gap-1 text-red-500">
                                <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">CADUCADO</span>
                                <span className="text-sm font-bold">{formatDM(enrollment.start_deadline)}</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Empezar antes de</span>
                                <span className="text-xl font-black text-[#FF7939]">{formatDM(enrollment.start_deadline)}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* 4.2 Timeline UI - Pestaña En Curso */}
                {hasStarted && !isFinished && (
                    <div className="flex flex-col gap-2 mt-4 mb-4">
                        <div className="relative px-2 h-24 flex flex-col justify-center">
                            {/* Horizontal Axis Line */}
                            <div className="absolute left-0 right-0 h-[1.5px] bg-zinc-800 top-1/2 -translate-y-1/2" />

                            {/* Markers ON axis */}
                            <div className="relative h-px flex items-center">
                                {/* Inicio Dot */}
                                <div className="absolute left-0 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-black -translate-x-1/2" />

                                {/* Future dots (remaining) */}
                                {daysRemainingFuture && daysRemainingFuture > 1 && (
                                    Array.from({ length: Math.min(daysRemainingFuture - 1, 6) }).map((_, i) => {
                                        const dotPercent = hoyPercent + ((95 - hoyPercent) / (Math.min(daysRemainingFuture - 1, 6) + 1)) * (i + 1);
                                        if (dotPercent >= 98) return null;
                                        return (
                                            <div
                                                key={i}
                                                className="absolute w-1 h-1 rounded-full bg-zinc-700/50"
                                                style={{ left: `${dotPercent}%`, transform: 'translateX(-50%)' }}
                                            />
                                        );
                                    })
                                )}

                                {/* Prox Dot */}
                                {nextPercent !== null && (
                                    <div
                                        className="absolute w-2 h-2 rounded-full bg-zinc-500/50 ring-2 ring-black"
                                        style={{ left: `${nextPercent}%`, transform: 'translateX(-50%)' }}
                                    />
                                )}

                                {/* Hoy Dot - Orange ON line */}
                                <div
                                    className="absolute w-2.5 h-2.5 rounded-full bg-[#FF7939] ring-2 ring-black shadow-[0_0_8px_rgba(255,121,57,0.3)]"
                                    style={{ left: `${hoyPercent}%`, transform: 'translateX(-50%)' }}
                                />

                                {/* Fin Dot */}
                                <div className="absolute right-0 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-2 ring-black translate-x-1/2" />
                            </div>

                            {/* Labels Below (Words and Dates) */}
                            <div className="absolute top-[calc(50%+10px)] left-0 right-0 flex justify-between items-start px-0">
                                <div className="flex flex-col items-start">
                                    <span className="text-[7px] text-zinc-500 font-bold uppercase">Inicio</span>
                                    <span className="text-[10px] text-zinc-400 font-bold">{formatDM(enrollment.start_date)}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[7px] text-zinc-500 font-bold uppercase">Fin</span>
                                    <span className="text-[10px] text-zinc-400 font-bold">{formatDM(enrollment.program_end_date)}</span>
                                </div>
                            </div>

                            {/* Info Above Axis (Prox and Count) with perpendicular line for Hoy */}
                            <div className="absolute bottom-[calc(50%+4px)] left-0 right-0 h-10">
                                {nextPercent !== null && (
                                    <div
                                        className="absolute bottom-1 flex flex-col items-center"
                                        style={{ left: `${nextPercent}%`, transform: 'translateX(-50%)' }}
                                    >
                                        <span className="text-[7px] text-zinc-500 font-black uppercase tracking-tighter">Prox</span>
                                        <span className="text-[10px] text-zinc-500 font-bold">{formatDM(nextSessionDate!)}</span>
                                    </div>
                                )}

                                <div
                                    className="absolute bottom-[-1.5px] flex flex-col items-center h-[calc(100%+1px)] justify-end"
                                    style={{ left: `${hoyPercent}%`, transform: 'translateX(-50%)' }}
                                >
                                    {pendingCount !== null && pendingCount > 0 && (
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] text-[#FF7939] font-black leading-none mb-1">{pendingCount} hoy</span>
                                            {/* Perpendicular Line - ensure its perfectly centered */}
                                            <div className="w-[1.5px] h-4 bg-[#FF7939]/40" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Next Activity Mini-info */}
                        {nextActivity && (
                            <div className="mt-2 flex items-center gap-1.5 text-[9px] text-zinc-500 bg-zinc-900/40 p-1.5 rounded-lg border border-zinc-800/20">
                                <Play className="w-2.5 h-2.5 text-zinc-500" />
                                <span className="truncate opacity-70">Siguiente: {nextActivity.title}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* 4.3 Finalizadas UI - Sin línea de tiempo */}
                {isFinished && (
                    <div className="flex flex-col gap-6 py-6 mt-2">
                        <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold tracking-widest uppercase px-1">
                            <div className="flex flex-col gap-1.5">
                                <span>Inicio</span>
                                <span className="text-zinc-300 text-[12px] font-black">{formatDM(enrollment.start_date)}</span>
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                                <span>Fin</span>
                                <span className="text-zinc-300 text-[12px] font-black">{formatDM(enrollment.program_end_date)}</span>
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center p-6 bg-zinc-900/30 rounded-3xl border border-zinc-800/20 shadow-inner">
                            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] mb-2 opacity-50">Completado</span>
                            <span className="text-4xl font-black text-[#FF7939] drop-shadow-sm">{progress}%</span>
                        </div>

                        {daysInfo.expirationDate instanceof Date && !isNaN(daysInfo.expirationDate.getTime()) && (
                            <div className="flex items-center justify-between text-[11px] p-2.5 bg-red-500/5 rounded-xl border border-red-500/10 mx-auto w-full">
                                <div className="flex items-center gap-2 text-zinc-500 font-bold uppercase tracking-tighter">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{daysInfo.isExpired ? "Venció" : "Vence"}</span>
                                </div>
                                <span className={cn("font-black", daysInfo.isExpired ? "text-red-400" : "text-zinc-400")}>
                                    {formatDM(daysInfo.expirationDate.toISOString())}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 5. Footer */}
            <PurchasedActivityCardFooter
                isFinished={isFinished}
                progress={progress}
            />
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
            <div className="flex flex-col gap-1">
                <div className="text-[8px] uppercase tracking-wider font-bold text-zinc-500 mb-0.5 px-0.5">Items</div>
                <div className="flex flex-col text-[10px] text-zinc-400 gap-1 px-1">
                    <div className="flex justify-between items-center text-orange-200">
                        <span>Completados:</span>
                        <span className="font-bold text-orange-300">{itemsCompletedTotal ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center opacity-70">
                        <span>Restantes:</span>
                        <span className="text-zinc-400 font-medium">{itemsPendingToday ?? 0}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 mb-1 border-t border-zinc-800/20 pt-2">
            <div className="flex flex-col gap-1">
                <div className="text-[8px] uppercase tracking-wider font-bold text-zinc-500 mb-0.5 px-0.5">Días</div>
                <div className="flex flex-col text-[10px] text-zinc-400 gap-1 px-1">
                    <div className="flex justify-between items-center text-orange-200">
                        <span>Completados:</span>
                        <span className="font-bold text-orange-300">{daysCompleted ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span>En curso:</span>
                        <span className="text-zinc-300 font-medium">{daysPassed ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center opacity-80 text-red-500/60">
                        <span>Ausente:</span>
                        <span className="font-medium">{daysMissed ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center opacity-70">
                        <span>Próximos:</span>
                        <span className="text-zinc-500 font-medium">{daysRemainingFuture ?? 0}</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-1 border-t border-zinc-800/10 pt-1.5">
                <div className="text-[8px] uppercase tracking-wider font-bold text-zinc-500 mb-0.5 px-0.5">Items</div>
                <div className="flex flex-col text-[10px] text-zinc-400 gap-1 px-1">
                    <div className="flex justify-between items-center text-orange-200">
                        <span>Completados:</span>
                        <span className="font-bold text-orange-300">{itemsCompletedTotal ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center opacity-80 text-red-500/60">
                        <span>No logrados:</span>
                        <span className="font-medium">{itemsDebtPast ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center opacity-70">
                        <span>Restantes:</span>
                        <span className="text-zinc-400 font-medium">{itemsPendingToday ?? 0}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PurchasedActivityCardFooter({ isFinished, progress }: any) {
    if (isFinished || progress >= 100) {
        return (
            <div className="mt-auto pt-3 border-t border-zinc-800/20 text-center">
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Actividad Completada</span>
            </div>
        );
    }
    return null;
}
