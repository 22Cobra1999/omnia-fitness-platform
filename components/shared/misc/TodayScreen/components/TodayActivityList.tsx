import React, { useState, useEffect } from 'react';
import { Play, Check, Flame, Clock, ChevronDown, UtensilsCrossed, CheckCircle2, Circle, Zap } from 'lucide-react';
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
    
    // New Props for Block Management
    blockNames?: Record<number, string>;
    collapsedBlocks?: Record<number, boolean>;
    toggleBlock?: (num: number) => void;
    toggleBlockCompletion?: (num: number) => void;
    isBlockCompleted?: (num: number) => boolean;
    programInfo?: any;
    enrollment?: any;
    openVideo?: (url: string, activity: any) => void;
    toggleExerciseSimple?: (id: string) => void;
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
    onToggleActivity,
    blockNames,
    collapsedBlocks,
    toggleBlock,
    toggleBlockCompletion,
    isBlockCompleted,
    programInfo,
    enrollment,
    toggleExerciseSimple
}) => {
    const isNutrition = [
        String(programInfo?.categoria).toLowerCase(),
        String(programInfo?.categoria_id).toLowerCase(),
        String(enrollment?.activity?.categoria).toLowerCase(),
        String(enrollment?.activity?.categoria_id).toLowerCase()
    ].some(s => s.includes('nutricion') || s === '7' || s === 'nutrición') || activities.some(a => 
        String((a as any).categoria).toLowerCase().includes('nutricion') || 
        String((a as any).categoria_id) === '7' ||
        String(a.type).toLowerCase() === 'nutricion'
    );
    const activitiesByBlock: Record<number, ActivityItem[]> = {};
    const [localExpandedBlocks, setLocalExpandedBlocks] = useState<Record<number, boolean>>({});
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
            setLocalExpandedBlocks(initial);
            setIsInitialized(true);
        }
    }, [activities, isInitialized, activitiesByBlock]);

    const handleToggleBlock = (blockId: number) => {
        if (toggleBlock) {
            toggleBlock(blockId);
        } else {
            setLocalExpandedBlocks(prev => ({ ...prev, [blockId]: !prev[blockId] }));
        }
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
                        {isNutrition ? 'Nutrition' : 'Training'}
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
                const isExpanded = collapsedBlocks ? !collapsedBlocks[blockId] : (localExpandedBlocks[blockId] ?? true);
                const completedCount = blockActivities.filter(a => a.done).length;
                const isBlockCompletedState = completedCount === blockActivities.length;
                const isActiveBlock = !isBlockCompletedState && isExpanded;

                return (
                    <div key={blockId} className="mb-6">
                        <div
                            className={cn(
                                "flex items-center justify-between p-4 rounded-3xl transition-all duration-300 mb-3",
                                isActiveBlock
                                    ? "bg-white/10 border border-[#FF7939]/30 shadow-[0_8px_20px_rgba(255,121,57,0.1)]"
                                    : "bg-white/5 border border-white/5"
                            )}
                        >
                            <div 
                                onClick={() => handleToggleBlock(blockId)}
                                className="flex items-center gap-4 cursor-pointer flex-1"
                            >
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleBlockCompletion?.(blockId);
                                    }}
                                    className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                        isBlockCompletedState ? "" : "bg-white/5 border border-white/10"
                                    )}
                                >
                                    {isBlockCompletedState ? (
                                        <div className="bg-[#FF7939]/30 backdrop-blur-xl rounded-full p-2 shadow-2xl transition-all duration-500 border-4 border-white/5 shadow-black/20">
                                            <Flame size={18} fill="#FF7939" stroke="#FF7939" strokeWidth={2.5} />
                                        </div>
                                    ) : (
                                        isNutrition ? <UtensilsCrossed size={18} className="text-white/20" /> : <Zap size={18} className="text-white/20" />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-[#FF7939]/60 uppercase tracking-widest leading-none mb-1">
                                        Bloque
                                    </span>
                                    <span className="text-sm font-bold text-white tracking-tight">
                                        {blockActivities.length} {blockActivities.length === 1 ? (isNutrition ? 'Plato' : 'Ejercicio') : (isNutrition ? 'Platos' : 'Ejercicios')}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="h-6 w-[1px] bg-white/10 mx-1" />
                                <div className="flex flex-col items-end mr-1">
                                    <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">Progreso</div>
                                    <div className="text-sm font-black text-[#FF7939]">
                                        {blockActivities.filter(a => a.done).length}/{blockActivities.length}
                                    </div>
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
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (toggleExerciseSimple) toggleExerciseSimple(activity.id);
                                                        else onToggleActivity(activity.id);
                                                    }}
                                                    className={cn(
                                                        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                                                        isDone ? "bg-transparent border-none shadow-none" : "bg-white/5 border border-white/10"
                                                    )}
                                                >
                                                {activity.done ? (
                                                    <div className="bg-[#FF7939]/30 backdrop-blur-xl rounded-full p-1.5 shadow-2xl transition-all duration-500 border-4 border-white/5 shadow-black/20">
                                                        <Flame size={18} fill="#FF7939" stroke="#FF7939" strokeWidth={2.5} />
                                                    </div>
                                                ) : (
                                                    isNutrition ? <UtensilsCrossed size={18} className="text-white/40 group-hover:text-white transition-colors" /> : <Zap size={18} className="text-white/40 group-hover:text-white transition-colors" />
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
                                                        {(activity.minutos !== null && activity.minutos !== undefined || activity.duration !== null && activity.duration !== undefined) && (
                                                            <div className="flex items-center gap-1">
                                                                <Clock size={12} className="text-white/20" />
                                                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                                                                    {activity.minutos ?? activity.duration} min
                                                                </span>
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
