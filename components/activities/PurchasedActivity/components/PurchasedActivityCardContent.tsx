import { Badge } from "@/components/ui/badge"
import { Star, Calendar, Clock, CheckCircle2, Flame, Play, Video } from "lucide-react"
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
            size === "small" ? "p-2.5" : "p-4"
        )}>
            {/* 1. Título con filtro condicional */}
            <div className={cn("mb-2", daysInfo.isExpired && "grayscale opacity-60")}>
                <h3 className="text-white font-bold leading-tight text-base h-[2.5em] overflow-hidden line-clamp-2">
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
            <div className={cn("flex flex-row items-center gap-2 mb-3 overflow-hidden whitespace-nowrap", daysInfo.isExpired && "grayscale opacity-60")}>
                <Badge variant="outline" className="bg-transparent border-[#FF7939] text-[#FF7939] text-[9px] px-1.5 h-4 font-bold tracking-wider uppercase shrink-0">
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

                {/* Date Milestones */}
                <div className="flex flex-col gap-1 pt-2 mt-4 border-t border-zinc-800/40">
                    {enrollment.start_date && (
                        <div className="flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-1 text-gray-500 font-bold uppercase tracking-tighter">
                                <Calendar className="w-2.5 h-2.5 text-blue-500" />
                                <span>Inicio</span>
                            </div>
                            <span className="text-zinc-300 font-medium">{formatDate(enrollment.start_date)}</span>
                        </div>
                    )}

                    {enrollment.program_end_date && (
                        <div className="flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-1 text-gray-500 font-bold uppercase tracking-tighter">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>Fin</span>
                            </div>
                            <span className="text-zinc-300 font-medium">{formatDate(enrollment.program_end_date)}</span>
                        </div>
                    )}

                    {daysInfo.expirationDate && (
                        <div className="flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-1 text-gray-500 font-bold uppercase tracking-tighter">
                                <Clock className="w-2.5 h-2.5" />
                                <span>Vence</span>
                            </div>
                            <span className={cn("font-medium", daysInfo.isExpired ? "text-red-400" : "text-zinc-400")}>
                                {formatDate(daysInfo.expirationDate.toISOString())}
                            </span>
                        </div>
                    )}
                </div>

                {/* Pending Actions */}
                {hasStarted && !isCoachView && (
                    <div className="flex flex-col gap-0.5 mt-0.5">
                        {(activity.type?.toLowerCase() === 'program' || activity.type?.toLowerCase() === 'programa') && (
                            (pendingCount !== null && pendingCount > 0) ? (
                                <div className="flex items-center gap-1.5">
                                    <Flame className="w-3.5 h-3.5 text-[#FF7939]" fill="#FF7939" />
                                    <span className="text-[11px] text-white font-medium">
                                        {pendingCount} ejercicios/platos hoy
                                    </span>
                                </div>
                            ) : null
                        )}

                        {nextSessionDate && (
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                                <Calendar className="w-3 h-3 text-blue-500" />
                                <span>Sig: <span className="text-white font-medium">{formatDate(nextSessionDate)}</span></span>
                            </div>
                        )}
                    </div>
                )}

                {hasStarted && nextActivity && !isFinished && progress < 100 && !isCoachView && (
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-400 bg-gray-800/30 p-1 rounded-md">
                        <Play className="w-2.5 h-2.5 text-[rgb(0,255,128)]" />
                        <span className="truncate">
                            <span className="font-medium text-white">Próximo:</span> {nextActivity.title}
                        </span>
                    </div>
                )}
            </div>

            {/* 5. Footer (Progress) */}
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
            <div className="flex flex-col gap-1.5">
                <div className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 mb-0.5 px-0.5">Items</div>
                <div className="flex flex-col text-[11px] text-zinc-400 gap-1.5 px-1">
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
        <div className="flex flex-col gap-3 mb-2 border-t border-zinc-800/20 pt-2.5">
            <div className="flex flex-col gap-1.5">
                <div className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 mb-0.5 px-0.5">Días</div>
                <div className="flex flex-col text-[11px] text-zinc-400 gap-1.5 px-1">
                    <div className="flex justify-between items-center text-orange-200">
                        <span>Completados:</span>
                        <span className="font-bold text-orange-300">{daysCompleted ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span>En curso:</span>
                        <span className="text-zinc-300 font-medium">{daysPassed ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center opacity-80 text-red-400/60">
                        <span>Ausente:</span>
                        <span className="font-medium">{daysMissed ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center opacity-70">
                        <span>Próximos:</span>
                        <span className="text-zinc-500 font-medium">{daysRemainingFuture ?? 0}</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-1.5 border-t border-zinc-800/10 pt-2">
                <div className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 mb-0.5 px-0.5">Items</div>
                <div className="flex flex-col text-[11px] text-zinc-400 gap-1.5 px-1">
                    <div className="flex justify-between items-center text-orange-200">
                        <span>Completados:</span>
                        <span className="font-bold text-orange-300">{itemsCompletedTotal ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center opacity-80 text-red-400/60">
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
    const isDocOrWorkshop = activityType?.toLowerCase().includes('document') ||
        activityType?.toLowerCase().includes('taller') ||
        activityType?.toLowerCase().includes('workshop');

    if (isDocOrWorkshop && (isFinished || progress >= 100)) {
        return (
            <div className="mt-auto pt-1.5 border-t border-zinc-800/20 relative">
                <div className="h-0.5 bg-zinc-800/50 rounded-full overflow-hidden">
                    <div className="h-full bg-[#FF7939] rounded-full" style={{ width: '100%' }} />
                </div>
                <div className="flex justify-between items-center text-[11px]">
                    <span className="text-white font-medium">Finalizado</span>
                    <span className="text-[#FF7939] font-bold">{progress}%</span>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-auto pt-1.5 border-t border-zinc-800/20 relative">
            <div className="flex justify-between text-[11px] mb-1 text-[#FF7939]">
                <span className="text-[9px] font-bold uppercase tracking-wider">Progreso</span>
                <span className="font-black text-[12px]">{progress}%</span>
            </div>
            <div className="h-0.5 bg-zinc-800/50 rounded-full overflow-hidden mb-1">
                <div
                    className="h-full bg-[#FF7939] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(255,121,57,0.3)]"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
