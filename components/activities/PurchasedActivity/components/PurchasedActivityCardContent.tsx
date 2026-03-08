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

const formatDateDM = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
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
    // Percentage for placement of next session
    const start = new Date(enrollment.start_date || activity.program_start_date).getTime()
    const end = new Date(enrollment.program_end_date || activity.program_end_date).getTime()
    const next = nextSessionDate ? new Date(nextSessionDate).getTime() : null
    const nextPercent = (next && end > start) ? Math.min(Math.max(((next - start) / (end - start)) * 100, 5), 95) : null

    // Progress percentage for Hoy marker
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

                {/* 4.1 "Empezar antes de" - centrado y sin frame */}
                {!hasStarted && !isFinished && enrollment.start_deadline && (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        {new Date(enrollment.start_deadline) < new Date() ? (
                            <div className="flex flex-col items-center gap-1 text-red-500">
                                <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">CADUCADO</span>
                                <span className="text-sm font-bold">{formatDateDM(enrollment.start_deadline)}</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Empezar antes de</span>
                                <span className="text-xl font-black text-[#FF7939]">{formatDateDM(enrollment.start_deadline)}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* 4.2 Timeline UI - ONLY for active */}
                {hasStarted && !isFinished && (
                    <div className="flex flex-col gap-2 mt-4 mb-4">
                        <div className="relative pt-12 px-2 h-20">
                            {/* Horizontal Axis Line */}
                            <div className="absolute top-[52px] left-0 right-0 h-[1.5px] bg-zinc-800" />

                            <div className="flex justify-between items-start relative z-10 w-full">
                                {/* Inicio */}
                                <div className="flex flex-col items-start">
                                    <span className="text-[8px] text-zinc-500 font-bold uppercase mb-1">Inicio</span>
                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-black -ml-[1px]" />
                                    <span className="text-[9px] text-zinc-400 font-bold mt-1">{formatDateDM(enrollment.start_date)}</span>
                                </div>

                                {/* Fin */}
                                <div className="flex flex-col items-end">
                                    <span className="text-[8px] text-zinc-500 font-bold uppercase mb-1">Fin</span>
                                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-700 ring-2 ring-black -mr-[1px]" />
                                    <span className="text-[9px] text-zinc-400 font-bold mt-1">{formatDateDM(enrollment.program_end_date)}</span>
                                </div>
                            </div>

                            {/* Próximo Día Punto - Duller orange/gray */}
                            {nextPercent !== null && (
                                <div
                                    className="absolute top-[18px] flex flex-col items-center z-15 transition-all duration-700"
                                    style={{
                                        left: `${nextPercent}%`,
                                        transform: 'translateX(-50%)'
                                    }}
                                >
                                    <div className="flex flex-col items-center mb-5">
                                        <span className="text-[8px] text-zinc-500 font-bold uppercase leading-none">Prox</span>
                                        <span className="text-[9px] text-zinc-500 font-bold tabular-nums">{formatDateDM(nextSessionDate!)}</span>
                                    </div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-500/50 ring-2 ring-black shadow-sm" />
                                </div>
                            )}

                            {/* Cantidad de puntos futuros */}
                            {daysRemainingFuture && daysRemainingFuture > 1 && (
                                Array.from({ length: Math.min(daysRemainingFuture - 1, 5) }).map((_, i) => {
                                    // Linear interpolation between Prox and Fin (roughly)
                                    const dotPercent = nextPercent !== null
                                        ? nextPercent + ((95 - nextPercent) / (Math.min(daysRemainingFuture - 1, 5) + 1)) * (i + 1)
                                        : 50 + (i * 5); // Fallback

                                    if (dotPercent >= 98) return null;

                                    return (
                                        <div
                                            key={i}
                                            className="absolute top-[51.5px] w-1 h-1 rounded-full bg-zinc-700/50 z-10"
                                            style={{ left: `${dotPercent}%`, transform: 'translateX(-50%)' }}
                                        />
                                    );
                                })
                            )}

                            {/* Hoy - Moving Progress Marker with Vertical Line */}
                            <div
                                className="absolute top-[10px] bottom-[25.5px] flex flex-col items-center z-20 transition-all duration-700 pointer-events-none"
                                style={{
                                    left: `${hoyPercent}%`,
                                    transform: 'translateX(-50%)'
                                }}
                            >
                                {/* Text Count at the very top */}
                                {pendingCount !== null && pendingCount > 0 && (
                                    <div className="absolute -top-4 whitespace-nowrap bg-[#FF7939] text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow-lg animate-pulse">
                                        {pendingCount} hoy
                                    </div>
                                )}

                                {/* Vertical Perpendicular Line */}
                                <div className="w-[1.5px] h-10 bg-[#FF7939]/30 mt-1" />

                                {/* Dot on the main line */}
                                <div className="absolute top-[41px] w-3 h-3 rounded-full bg-[#FF7939] ring-4 ring-black shadow-[0_0_12px_rgba(255,121,57,0.5)]" />
                            </div>
                        </div>

                        {/* Centered Progress Percentage below timeline */}
                        <div className="flex flex-col items-center justify-center mt-2 pt-2 border-t border-zinc-800/10">
                            <span className="text-2xl font-black text-[#FF7939] leading-none mb-1">{progress}%</span>
                            <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.2em]">Progreso Actual</span>
                        </div>
                    </div>
                )}

                {/* 4.3 Finalizadas UI */}
                {isFinished && (
                    <div className="flex flex-col gap-6 py-6 mt-2">
                        <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold tracking-widest uppercase px-1">
                            <div className="flex flex-col gap-1.5">
                                <span>Inicio</span>
                                <span className="text-zinc-300 text-[12px] font-black">{formatDateDM(enrollment.start_date)}</span>
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                                <span>Fin</span>
                                <span className="text-zinc-300 text-[12px] font-black">{formatDateDM(enrollment.program_end_date)}</span>
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center p-6 bg-zinc-900/30 rounded-3xl border border-zinc-800/20 shadow-inner">
                            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] mb-2 opacity-50">Completado al</span>
                            <span className="text-4xl font-black text-[#FF7939] drop-shadow-sm">{progress}%</span>
                        </div>

                        {daysInfo.expirationDate instanceof Date && !isNaN(daysInfo.expirationDate.getTime()) && (
                            <div className="flex items-center justify-between text-[11px] p-2.5 bg-red-500/5 rounded-xl border border-red-500/10 mx-auto w-full">
                                <div className="flex items-center gap-2 text-zinc-500 font-bold uppercase tracking-tighter">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{daysInfo.isExpired ? "Venció" : "Vence"}</span>
                                </div>
                                <span className={cn("font-black", daysInfo.isExpired ? "text-red-400" : "text-zinc-400")}>
                                    {formatDateDM(daysInfo.expirationDate.toISOString())}
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
