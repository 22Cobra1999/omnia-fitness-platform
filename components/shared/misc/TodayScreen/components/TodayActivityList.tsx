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
                    <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#FF6A00] to-[#FF7939] rounded-full flex items-center justify-center mb-8">
                    <span className="text-3xl">📅</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-4">No hay actividades para este día</h3>
                <p className="text-white/40 text-sm">Próxima actividad: Pronto</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col px-5 pb-32 pt-2">
            {/* Header de Resumen (Copiado del Original) */}
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="text-lg font-bold text-white/60">
                    Actividades de hoy
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(255, 121, 57, 0.2)',
                    padding: '6px 12px',
                    borderRadius: 20,
                    border: '1px solid rgba(255, 121, 57, 0.3)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)'
                }}>
                    <Flame size={18} color="#FF7939" strokeWidth={2} />
                    <span className="text-[13px] font-bold text-white">
                        {activities.length}
                    </span>
                </div>
            </div>

            {Object.keys(activitiesByBlock).sort().map((blockIdStr) => {
                const blockId = Number(blockIdStr);
                const blockActivities = activitiesByBlock[blockId];
                const isExpanded = expandedBlocks[blockId] ?? true;
                const isBlockCompleted = blockActivities.every(a => a.done);
                // Active block logic simulation
                const isActiveBlock = !isBlockCompleted;

                return (
                    <div key={blockId} className="mb-4">
                        {/* Header Colapsable (Estilo Original) */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 16px',
                                background: isActiveBlock ? 'rgba(255, 107, 53, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                                border: isActiveBlock ? '1px solid rgba(255, 107, 53, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: 12,
                                transition: 'all 0.2s ease',
                                cursor: 'default'
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <span style={{
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: isActiveBlock ? '#FF6B35' : '#FFFFFF'
                                }}>
                                    {`Bloque ${blockId}`}
                                </span>
                                <span style={{
                                    fontSize: 12,
                                    color: isActiveBlock ? 'rgba(255, 107, 53, 0.8)' : 'rgba(255, 255, 255, 0.6)'
                                }}>
                                    {blockActivities.length} {blockActivities.length === 1 ? 'ejercicio' : 'ejercicios'}
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Fuego de bloque completado */}
                                <div
                                    className="p-1"
                                    onClick={(e) => { e.stopPropagation(); /* Logic to complete block? */ }}
                                >
                                    <Flame size={22} fill={isBlockCompleted ? '#FF7939' : 'none'} color={isBlockCompleted ? '#FF7939' : 'rgba(255,255,255,0.4)'} />
                                </div>

                                {/* Toggle Arrow */}
                                <div
                                    onClick={() => toggleBlock(blockId)}
                                    className="p-1 cursor-pointer text-white/60 hover:text-white"
                                >
                                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </div>
                            </div>
                        </div>

                        {/* Lista de Actividades (Style Original: Transparent, No Borders) */}
                        {isExpanded && (
                            <div className="flex flex-col gap-2 mt-2">
                                {blockActivities.map((activity) => {
                                    const isDone = activity.done;

                                    return (
                                        <button
                                            key={activity.id}
                                            onClick={() => onActivityClick(activity)}
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                background: 'transparent',
                                                border: 'none',
                                                borderRadius: 8,
                                                textAlign: 'left',
                                                transition: 'all 0.2s ease'
                                            }}
                                            className="hover:bg-white/5 active:scale-[0.99] group"
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* FUEGO para el item (Pending = Grey Outline, Done = Orange) */}
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onToggleActivity(activity.id);
                                                    }}
                                                    className="p-1 rounded shrink-0"
                                                    style={{
                                                        color: isDone ? '#FF7939' : 'rgba(255, 255, 255, 0.4)'
                                                    }}
                                                >
                                                    <Flame size={20} />
                                                </div>

                                                <div className="flex-1 min-w-0 flex flex-col gap-1">
                                                    <div className="flex justify-between items-start gap-3">
                                                        <span className="text-[15px] font-semibold text-white leading-tight">
                                                            {activity.title}
                                                        </span>
                                                        {/* Metadata alineada a la derecha */}
                                                        <div className="flex flex-col items-end shrink-0 gap-0.5">
                                                            {(activity.minutos || activity.duration) && (
                                                                <span className="text-white/90 text-xs font-medium bg-white/5 px-1.5 py-0.5 rounded">
                                                                    {activity.minutos || activity.duration} min
                                                                </span>
                                                            )}
                                                            {activity.calorias && (
                                                                <span className="text-orange-500/80 text-[10px] font-medium">
                                                                    {activity.calorias} kcal
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Subtitle / Series Info simulated style */}
                                                    {activity.subtitle && (
                                                        <span className="text-[13px] text-white/50 truncate">
                                                            {activity.subtitle}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Espacio final */}
            <div className="h-12 w-full" />
        </div>
    );
};
