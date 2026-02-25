import React, { useState, useEffect } from 'react';
import { Play, Check, Flame, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils/utils';

interface ActivityItem {
    id: string;
    title: string;
    subtitle: string;
    done?: boolean;
    type?: string;
    duration?: number;
    calorias?: number | null;
    video_url?: string | null;
    minutos?: number | null;
    bloque?: number;
    detalle_series?: string;
    series?: string;
}

interface TodayActivityListProps {
    activities: ActivityItem[];
    isLoading: boolean;
    onActivityClick: (activity: ActivityItem) => void;
    onToggleActivity: (id: string) => void;
}

const formatSubtitle = (subtitle: string) => {
    if (!subtitle || subtitle === 'Sin especificar') return '';

    // Si parece JSON, intentar parsearlo
    if (subtitle.startsWith('{') || subtitle.startsWith('[')) {
        try {
            const data = JSON.parse(subtitle);
            if (typeof data === 'object') {
                const s = data.series || data.sets || data.s || '';
                const r = data.reps || data.repeticiones || data.r || '';
                const l = data.load_kg || data.peso || data.load || data.kg || '';

                const parts = [];
                if (s) parts.push(`${s} series`);
                if (r) parts.push(`${r} reps`);
                if (l) parts.push(`${l}kg`);

                if (parts.length > 0) return parts.join(' • ');
            }
        } catch (e) {
            // No es JSON válido, seguir
        }
    }

    // Si es un string "legacy" o crudo, limpiar prefijos comunes
    return subtitle.replace(/^R:/, '').replace(/^P:/, '').trim();
};

export const TodayActivityList: React.FC<TodayActivityListProps> = ({
    activities,
    isLoading,
    onActivityClick,
    onToggleActivity
}) => {
    const activitiesByBlock: Record<number, ActivityItem[]> = {};
    const [expandedBlocks, setExpandedBlocks] = useState<Record<number, boolean>>({});
    const [isInitialized, setIsInitialized] = useState(false);

    activities.forEach(act => {
        const block = (act as any).bloque || 1;
        if (!activitiesByBlock[block]) activitiesByBlock[block] = [];
        activitiesByBlock[block].push(act);
    });

    useEffect(() => {
        if (!isInitialized && activities.length > 0) {
            const initial: Record<number, boolean> = {};
            Object.keys(activitiesByBlock).forEach(k => {
                initial[Number(k)] = true;
            });
            setExpandedBlocks(initial);
            setIsInitialized(true);
        }
    }, [activities, isInitialized]);

    const toggleBlock = (blockId: number) => {
        setExpandedBlocks(prev => ({ ...prev, [blockId]: !prev[blockId] }));
    };

    if (isLoading) {
        return (
            <div className="flex flex-col gap-4 px-6 mt-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
                ))}
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#FF6A00]/20 to-[#FF7939]/20 border border-[#FF7939]/30 rounded-full flex items-center justify-center mb-8 backdrop-blur-xl">
                    <span className="text-3xl">📅</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Día de descanso</h3>
                <p className="text-white/40 text-sm max-w-[200px]">No hay actividades programadas para hoy. ¡Aprovecha para recuperar!</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col px-5 pb-32 pt-2">
            <div className="flex items-center justify-between mb-6 px-1">
                <div className="flex flex-col">
                    <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">
                        Training
                    </h2>
                    <div className="h-1 w-8 bg-[#FF7939] rounded-full mt-1" />
                </div>

                <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl backdrop-blur-xl">
                    <Flame size={16} className="text-[#FF7939]" />
                    <span className="text-sm font-black text-white">
                        {activities.filter(a => a.done).length}/{activities.length}
                    </span>
                </div>
            </div>

            {Object.keys(activitiesByBlock).sort().map((blockIdStr) => {
                const blockId = Number(blockIdStr);
                const blockActivities = activitiesByBlock[blockId];
                const isExpanded = expandedBlocks[blockId] ?? true;
                const completedCount = blockActivities.filter(a => a.done).length;
                const isBlockCompleted = completedCount === blockActivities.length;
                const isActiveBlock = !isBlockCompleted && isExpanded;

                return (
                    <div key={blockId} className="mb-6">
                        <div
                            onClick={() => toggleBlock(blockId)}
                            className={cn(
                                "flex items-center justify-between p-4 rounded-3xl transition-all duration-300 cursor-pointer mb-3",
                                isActiveBlock
                                    ? "bg-white/10 border border-[#FF7939]/30 shadow-[0_8px_20px_rgba(255,121,57,0.1)]"
                                    : "bg-white/5 border border-white/5"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300",
                                    isBlockCompleted ? "bg-[#FF7939]/20" : "bg-white/5"
                                )}>
                                    <span className={cn(
                                        "text-sm font-black",
                                        isBlockCompleted ? "text-[#FF7939]" : "text-white/40"
                                    )}>
                                        {blockId}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-[#FF7939]/60 uppercase tracking-widest leading-none mb-1">
                                        Bloque
                                    </span>
                                    <span className="text-sm font-bold text-white tracking-tight">
                                        {blockActivities.length} {blockActivities.length === 1 ? 'Ejercicio' : 'Ejercicios'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex flex-col items-end mr-1">
                                    <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">Progreso</div>
                                    <div className="text-xs font-bold text-white/60">{completedCount}/{blockActivities.length}</div>
                                </div>
                                <div className={cn(
                                    "p-1.5 rounded-full transition-all duration-300",
                                    isExpanded ? "rotate-180 text-white" : "text-white/20"
                                )}>
                                    <ChevronDown size={18} />
                                </div>
                            </div>
                        </div>

                        {isExpanded && (
                            <div className="flex flex-col gap-3 ml-2">
                                {blockActivities.map((activity, idx) => {
                                    const isDone = activity.done;
                                    const formattedSubtitle = formatSubtitle(activity.subtitle);

                                    return (
                                        <div
                                            key={activity.id}
                                            className="relative flex items-center group"
                                        >
                                            {/* Line connector */}
                                            {idx < blockActivities.length - 1 && (
                                                <div className="absolute left-[23px] top-[40px] w-0.5 h-full bg-white/5 group-hover:bg-[#FF7939]/20 transition-all" />
                                            )}

                                            <button
                                                onClick={() => onActivityClick(activity)}
                                                className={cn(
                                                    "flex-1 flex items-center gap-4 p-4 rounded-[28px] transition-all duration-300",
                                                    isDone ? "bg-white/[0.02]" : "bg-white/5 hover:bg-white/[0.08]"
                                                )}
                                            >
                                                {/* Status Indicator */}
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onToggleActivity(activity.id);
                                                    }}
                                                    className={cn(
                                                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500",
                                                        isDone
                                                            ? "bg-[#FF7939] border-[#FF7939] shadow-[0_4px_15px_rgba(255,121,57,0.4)]"
                                                            : "bg-black/20 border-white/10 text-white/20"
                                                    )}
                                                >
                                                    {isDone ? (
                                                        <Check size={20} className="text-white stroke-[3]" />
                                                    ) : (
                                                        <Play size={18} className="text-white/40 group-hover:text-white transition-colors" />
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0 py-1">
                                                    <div className="flex flex-col gap-0.5">
                                                        <h4 className={cn(
                                                            "text-[15px] font-bold leading-tight transition-all duration-300",
                                                            isDone ? "text-white/30 line-through" : "text-white"
                                                        )}>
                                                            {activity.title}
                                                        </h4>

                                                        {formattedSubtitle && (
                                                            <div className="flex items-center gap-2">
                                                                <span className={cn(
                                                                    "text-xs font-black uppercase tracking-tighter transition-all duration-300",
                                                                    isDone ? "text-[#FF7939]/30" : "text-[#FF7939]"
                                                                )}>
                                                                    {formattedSubtitle}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-3 mt-2">
                                                        {activity.calorias && (
                                                            <div className="flex items-center gap-1">
                                                                <Flame size={12} className="text-white/20" />
                                                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{activity.calorias} kcal</span>
                                                            </div>
                                                        )}
                                                        {(activity.minutos || activity.duration) && (
                                                            <div className="flex items-center gap-1">
                                                                <Clock size={12} className="text-white/20" />
                                                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{activity.minutos || activity.duration} min</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Check indicator small */}
                                                {!isDone && activity.video_url && (
                                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/10 group-hover:text-[#FF7939]/40 transition-all">
                                                        <Play size={12} fill="currentColor" />
                                                    </div>
                                                )}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}

            <div className="h-20 w-full" />
        </div>
    );
};
