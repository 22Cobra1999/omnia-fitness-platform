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
            "flex-1 flex flex-col h-full min-h-0 relative",
            size === "small" ? "p-2 px-3" : "p-4"
        )}>
            {/* 1. Título con filtro condicional */}
            <div className={cn("mb-1", daysInfo.isExpired && "grayscale opacity-60")}>
                <h3 className={cn(
                    "text-white font-bold leading-tight h-[2.5em] overflow-hidden line-clamp-2",
                    size === "small" ? "text-sm" : "text-base"
                )}>
                    {activity.title}
                </h3>
            </div>

            {/* 2. Coach Info con filtro */}
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


            {/* 3. Badges com filtro */}
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

            {/* 4. Info Dinámica (Progreso / Fechas / Pendientes) */}
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

                {/* 4.1 "Empezar antes de" or "CADUCADO" - Strictly for To Start / Pending Activity */}
                {!hasStarted && enrollment.start_deadline && (
                    <div className="mb-4">
                        {new Date(enrollment.start_deadline) < new Date() ? (
                            <div className="flex items-center gap-1.5 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                                <Clock className="w-3.5 h-3.5 text-red-500" />
                                <span className="text-[10px] text-red-500 font-black uppercase tracking-tight">CADUCADO</span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-0.5 bg-orange-500/5 p-2 rounded-lg border border-orange-500/10">
                                <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">Empezar antes de</span>
                                <span className="text-[#FF7939] text-xs font-black">{formatDate(enrollment.start_deadline)}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* 4.2 Timeline UI - For started or finished activities */}
                {(hasStarted || isFinished) && (
                    <div className="flex flex-col gap-4 mt-2 mb-4">
                        {/* Timeline Labels and Axis */}
                        <div className="relative pt-10 px-1">
                            {/* Horizontal Axis Line */}
                            <div className="absolute top-[50px] left-0 right-0 h-[1.5px] bg-zinc-800" />

                            <div className="flex justify-between items-start relative z-10">
                                {/* Inicio */}
                                <div className="flex flex-col items-start gap-1">
                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-black" />
                                    <div className="flex flex-col mt-1">
                                        <span className="text-[8px] text-zinc-500 font-bold uppercase">Inicio</span>
                                        <span className="text-[10px] text-zinc-300 font-medium">{formatDate(enrollment.start_date)}</span>
                                    </div>
                                </div>

                                {/* Fin */}
                                <div className="flex flex-col items-end gap-1">
                                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-black" />
                                    <div className="flex flex-col mt-1 items-end">
                                        <span className="text-[8px] text-zinc-500 font-bold uppercase">Fin</span>
                                        <span className="text-[10px] text-zinc-300 font-medium">{formatDate(enrollment.program_end_date)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Hoy - Moving Progress Marker */}
                            {hasStarted && !isFinished && (
                                <div
                                    className="absolute top-0 flex flex-col items-center z-20 transition-all duration-700 pointer-events-none"
                                    style={{
                                        left: `${Math.min(Math.max(progress, 5), 95)}%`,
                                        transform: 'translateX(-50%)'
                                    }}
                                >
                                    <span className="text-[12px] text-[#FF7939] font-black leading-none mb-1.5">{progress}%</span>
                                    <div className="w-3.5 h-3.5 rounded-full bg-[#FF7939] ring-4 ring-black shadow-[0_0_10px_rgba(255,121,57,0.4)]" />
                                    <div className="flex flex-col mt-1.5 items-center">
                                        <span className="text-[9px] text-[#FF7939] font-black uppercase tracking-tighter">Hoy</span>
                                        {pendingCount !== null && pendingCount > 0 && (
                                            <span className="text-[10px] text-white font-bold whitespace-nowrap">{pendingCount} hoy</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Secondary Info (Next Session / Next Activity) */}
                        <div className="flex flex-col gap-1.5 min-h-[40px]">
                            {hasStarted && !isFinished && nextSessionDate && (
                                <div className="flex items-center gap-1.5 text-[10px]">
                                    <Calendar className="w-3 h-3 text-[#FF7939]/70" />
                                    <span className="text-zinc-400 font-medium">Siguiente:</span>
                                    <span className="text-[#FF7939] font-black">{formatDate(nextSessionDate)}</span>
                                </div>
                            )}

                            {hasStarted && !isFinished && nextActivity && (
                                <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 bg-zinc-900/50 p-1.5 rounded-md border border-zinc-800/30">
                                    <Play className="w-2.5 h-2.5 text-zinc-400" />
                                    <span className="truncate opacity-80">
                                        {nextActivity.title}
                                    </span>
                                </div>
                            )}

                            {/* Expiration - Strictly for Finished Activity */}
                            {isFinished && daysInfo.expirationDate instanceof Date && !isNaN(daysInfo.expirationDate.getTime()) && (
                                <div className="flex items-center justify-between text-[10px] mt-1 p-2 bg-zinc-900/50 rounded-lg border border-zinc-800/30">
                                    <div className="flex items-center gap-1 text-gray-500 font-bold uppercase tracking-tighter">
                                        <Clock className="w-2.5 h-2.5" />
                                        <span>{daysInfo.isExpired ? "Venció" : "Vence"}</span>
                                    </div>
                                    <span className={cn("font-medium", daysInfo.isExpired ? "text-red-400" : "text-zinc-400")}>
                                        {formatDate(daysInfo.expirationDate.toISOString())}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 5. Footer (Progress - Simplified) */}
            <PurchasedActivityCardFooter
                activityType={activity.type}
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

function PurchasedActivityCardFooter({ activityType, isFinished, progress }: any) {
    if (isFinished || progress >= 100) {
        return (
            <div className="mt-auto pt-3 border-t border-zinc-800/20 text-center">
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Actividad Completada</span>
            </div>
        );
    }

    return null;
}
