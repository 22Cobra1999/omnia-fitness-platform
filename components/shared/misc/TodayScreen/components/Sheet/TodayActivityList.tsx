import * as React from 'react';
import { Flame, ChevronDown, ChevronUp, MessageSquare, Check, Play, Clock, ArrowRight, CalendarClock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { parseSeries } from '../../utils/parsers';
import { cn } from "@/lib/utils/utils";

const getActivitiesByBlocks = (activities: any[]) => {
    const blocks: Record<string, any[]> = {};
    activities.forEach(activity => {
        const blockNum = activity.bloque || 1;
        if (!blocks[blockNum]) blocks[blockNum] = [];
        blocks[blockNum].push(activity);
    });
    return blocks;
};

const getActiveBlock = (activities: any[]) => {
    const blocks = getActivitiesByBlocks(activities);
    const sortedBlockNums = Object.keys(blocks).map(Number).sort((a, b) => a - b);

    for (const num of sortedBlockNums) {
        const hasPending = blocks[num].some((a: any) => !a.done);
        if (hasPending) return num;
    }
    return sortedBlockNums[sortedBlockNums.length - 1] || 1;
};

const formatPrescription = (activity: any) => {
    const seriesData = activity.detalle_series || activity.series;
    if (!seriesData || seriesData === 'Sin especificar') return null;

    let parsed: any[] = [];
    if (typeof seriesData === 'string' && (seriesData.startsWith('{') || seriesData.startsWith('['))) {
        try {
            const data = JSON.parse(seriesData);
            const items = Array.isArray(data) ? data : [data];
            parsed = items.map(item => ({
                reps: item.reps || item.repeticiones || item.r || '',
                kg: item.kg || item.peso || item.p || item.load || '',
                sets: item.sets || item.series || item.s || ''
            }));
        } catch (e) {
            parsed = parseSeries(seriesData);
        }
    } else {
        parsed = parseSeries(seriesData);
    }

    if (!parsed || parsed.length === 0) return null;

    const first = parsed[0];
    if (!first) return null;

    const parts = [];
    if (first.sets) parts.push(`${first.sets} series`);
    if (first.reps) parts.push(`${first.reps} reps`);
    if (first.kg && first.kg !== '0') parts.push(`${first.kg}kg`);

    if (parts.length === 0) return null;
    return parts.join(' • ');
};

interface TodayActivityListProps {
    activities: any[];
    blockNames: Record<string, string>;
    collapsedBlocks: Set<number>;
    toggleBlock: (n: number) => void;
    toggleBlockCompletion: (n: number) => void;
    isBlockCompleted: (n: number) => boolean;
    programInfo: any;
    enrollment: any;
    openVideo: (url: string, ...args: any[]) => void;
    toggleExerciseSimple: (id: string) => void;
    isExpired?: boolean;
    isRated?: boolean;
    handleOpenSurveyModal?: () => void;
    meetCreditsAvailable?: number | null;
    onScheduleMeet?: () => void;
}

export function TodayActivityList({
    activities,
    blockNames,
    collapsedBlocks,
    toggleBlock,
    toggleBlockCompletion,
    isBlockCompleted,
    programInfo,
    enrollment,
    openVideo,
    toggleExerciseSimple,
    isExpired = false,
    isRated = false,
    handleOpenSurveyModal,
    meetCreditsAvailable = null,
    onScheduleMeet
}: TodayActivityListProps) {

    const groupedActivities = React.useMemo(() => {
        return activities.map(activity => {
            const seriesData = activity.detalle_series || activity.series;
            let parsed: any[] = [];

            if (typeof seriesData === 'string') {
                parsed = parseSeries(seriesData);
            } else if (Array.isArray(seriesData)) {
                parsed = seriesData.map(s => ({
                    peso: s.peso ?? s.kg ?? 0,
                    series: s.series ?? s.sets ?? 1,
                    reps: s.reps ?? s.repeticiones ?? 0,
                    done: activity.done
                }));
            }

            if (parsed.length === 0) {
                parsed = [{
                    peso: activity.peso ?? activity.kg ?? 0,
                    series: activity.sets ?? activity.qty ?? activity.series ?? 1,
                    reps: activity.reps ?? activity.repeticiones ?? 0,
                    done: activity.done
                }];
            } else {
                parsed = parsed.map(s => ({ ...s, done: activity.done }));
            }

            return {
                ...activity,
                sets_data: parsed
            };
        });
    }, [activities]);

    const blocks = getActivitiesByBlocks(groupedActivities);
    const activeBlock = getActiveBlock(groupedActivities);

    const [showFeedback, setShowFeedback] = React.useState(false);
    const survey = enrollment?.activity_surveys?.[0] || enrollment?.activity_surveys;
    const rating = survey?.coach_method_rating || 0;
    const feedback = survey?.comments || '';
    const isNutri = programInfo?.categoria === 'nutricion' || enrollment?.activity?.categoria === 'nutricion';

    return (
        <div style={{ paddingBottom: 100 }}>
            {/* Tus Coaches Section */}
            {meetCreditsAvailable !== null && onScheduleMeet && (
                <div className="mb-8 px-1">
                    <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4 ml-1">Tus Coaches</h3>
                    <div className="bg-white/[0.03] border border-white/5 rounded-[32px] p-5 flex items-center justify-between transition-all hover:bg-white/[0.05] group">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-[22px] bg-gradient-to-br from-[#FF7939] to-[#FF6A00] flex items-center justify-center text-white font-black text-xl shadow-[0_8px_20px_rgba(255,121,57,0.2)]">
                                {programInfo?.coach_name?.charAt(0) || 'C'}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-base font-bold text-white leading-none mb-1.5">{programInfo?.coach_name || 'Tu Coach'}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em]">Especialista OMNIA</span>
                                    <div className="w-1 h-1 rounded-full bg-[#FF7939]/40" />
                                    <span className="text-[10px] font-black text-[#FF7939] uppercase tracking-widest">{meetCreditsAvailable} disponibles</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onScheduleMeet}
                            className="bg-[#FF7939] text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-[0_8px_20px_rgba(255,121,57,0.3)] transition-all hover:scale-105 active:scale-95"
                        >
                            <CalendarClock size={20} />
                        </button>
                    </div>
                </div>
            )}

            {Object.entries(blocks).map(([blockNum, blockActivities]) => {
                const blockNumber = parseInt(blockNum);
                const isCollapsed = collapsedBlocks.has(blockNumber);
                const completedInBlock = blockActivities.filter(a => a.done).length;
                const isNutri = String(programInfo?.categoria).toLowerCase() === 'nutricion';
                const isActiveBlock = activeBlock === blockNumber;
                const allDone = completedInBlock === blockActivities.length;

                return (
                    <div
                        key={blockNumber}
                        id={`block-${blockNumber}`}
                        className={cn(
                            "rounded-[32px] overflow-hidden transition-all duration-500 mb-6",
                            isActiveBlock
                                ? "bg-transparent border-2 border-[#FF7939]/30 shadow-[0_10px_40px_rgba(0,0,0,0.3)]"
                                : "bg-transparent border border-white/5"
                        )}
                    >
                        {/* Simplified Block Header - No background fill */}
                        <div
                            onClick={() => toggleBlock(blockNumber)}
                            className={cn(
                                "flex items-center justify-between p-5 rounded-[24px] transition-all duration-300 cursor-pointer m-1",
                                isActiveBlock && !allDone
                                    ? "bg-white/[0.04] border border-white/5"
                                    : "bg-transparent hover:bg-white/[0.02]"
                            )}
                            style={{ filter: isExpired ? 'grayscale(1) opacity(0.8)' : 'none' }}
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleBlockCompletion(blockNumber);
                                    }}
                                    className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer",
                                        allDone ? "bg-[#FF7939] shadow-[0_4px_15px_rgba(255,121,57,0.4)]" : "bg-white/5 border border-white/10 hover:border-[#FF7939]/30"
                                    )}
                                >
                                    <Flame
                                        size={22}
                                        className={cn(allDone ? "text-white" : "text-white/20")}
                                        fill={allDone ? "currentColor" : "none"}
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <h3 className={cn(
                                            "text-sm font-bold tracking-tight transition-colors",
                                            allDone ? "text-white/40" : "text-white"
                                        )}>
                                            {blockNames[String(blockNumber)] || blockNames[blockNumber] || `Bloque ${blockNumber}`}
                                        </h3>
                                        {allDone && <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center"><Check size={10} className="text-green-500" strokeWidth={3} /></div>}
                                        {isActiveBlock && !allDone && (
                                            <span className="px-1.5 py-0.5 rounded-md bg-[#FF7939]/20 text-[#FF7939] text-[8px] font-black uppercase tracking-wider">
                                                En curso
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                                        {blockActivities.length} {isNutri ? (blockActivities.length === 1 ? 'Plato' : 'Platos') : (blockActivities.length === 1 ? 'Ejercicio' : 'Ejercicios')}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] leading-none">
                                    {completedInBlock}/{blockActivities.length}
                                </div>
                                <div className={cn(
                                    "p-1.5 rounded-full transition-all duration-300",
                                    !isCollapsed ? "rotate-0 text-white" : "rotate-180 text-white/20"
                                )}>
                                    <ChevronUp size={16} />
                                </div>
                            </div>
                        </div>

                        {/* Block Items List */}
                        {!isCollapsed && (
                            <div className="flex flex-col gap-3 mt-4">
                                {blockActivities.map((group) => {
                                    const isDone = group.done;

                                    return (
                                        <div key={group.id} className="relative flex items-center group">
                                            <button
                                                onClick={() => openVideo(group.video_url || '', group)}
                                                className={cn(
                                                    "flex-1 flex items-center gap-3 p-3 rounded-2xl transition-all duration-300",
                                                    isDone ? "bg-white/[0.01]" : "bg-white/[0.04] hover:bg-white/[0.06] active:scale-[0.98]"
                                                )}
                                                disabled={isExpired}
                                                style={{ filter: isExpired ? 'grayscale(1)' : 'none' }}
                                            >
                                                {/* Status Circle */}
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        group.sets_data.forEach((s: any) => toggleExerciseSimple(s.id));
                                                    }}
                                                    className={cn(
                                                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 active:scale-90",
                                                        isDone
                                                            ? "bg-[#FF7939] border-[#FF7939] shadow-[0_4px_15px_rgba(255,121,57,0.4)]"
                                                            : "bg-white/5 border-white/10 hover:border-[#FF7939]/30"
                                                    )}
                                                >
                                                    <Flame
                                                        size={22}
                                                        className={cn(isDone ? "text-white" : "text-white/20")}
                                                        fill={isDone ? "currentColor" : "none"}
                                                    />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col gap-1 text-left">
                                                        <h4 className={cn(
                                                            "text-sm font-bold leading-tight tracking-tight",
                                                            isDone ? "text-white/20 line-through decoration-[#FF7939]/30" : "text-white/90"
                                                        )}>
                                                            {group.title}
                                                        </h4>

                                                        {isNutri ? (
                                                            <div className="flex items-center gap-3">
                                                                {group.proteinas != null && <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">P: {group.proteinas}g</span>}
                                                                {group.carbohidratos != null && <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">C: {group.carbohidratos}g</span>}
                                                                {group.grasas != null && <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">G: {group.grasas}g</span>}
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {/* Prescription chips — Series × Reps • Peso */}
                                                                <div className="flex flex-wrap gap-1">
                                                                    {group.sets_data.map((s: any, idx: number) => {
                                                                        const isComplex = typeof s.series === 'string' && (s.series.includes('(') || s.series.includes('-'));
                                                                        if (isComplex && (s.peso === 0 || !s.peso) && (s.reps === 0 || !s.reps)) {
                                                                            return <span key={idx} className="text-[10px] font-medium text-white/20">{s.series}</span>;
                                                                        }
                                                                        return (
                                                                            <div key={idx} className={cn(
                                                                                "flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-tight",
                                                                                s.done ? "bg-[#FF7939]/10 text-[#FF7939]" : "bg-white/5 text-white/35"
                                                                            )}>
                                                                                {s.series || 0}×{s.reps || 0}
                                                                                {(s.peso != null && Number(s.peso) !== 0) && <span className="opacity-60 ml-0.5">• {s.peso}kg</span>}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>

                                                                {/* Muscles & Equipment NOT shown here — see detail tabs */}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Play button — shown when video exists */}
                                                {group.video_url ? (
                                                    <div className="shrink-0 w-8 h-8 rounded-full bg-[#FF7939]/10 border border-[#FF7939]/30 flex items-center justify-center transition-all duration-300 group-hover:bg-[#FF7939]/25 group-hover:scale-110">
                                                        <Play size={11} className="text-[#FF7939] ml-0.5" fill="currentColor" />
                                                    </div>
                                                ) : (
                                                    <div className="shrink-0 w-8 h-8 rounded-full bg-white/3 border border-white/5 flex items-center justify-center opacity-40">
                                                        <ArrowRight size={12} className="text-white/40" />
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

            {/* Calificado Section - MOVED TO HERO */}

            {/* Feedback Dialog remains similar but with premium styling */}
            <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
                <DialogContent className="bg-[#111111]/95 backdrop-blur-2xl border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] text-white w-[92%] max-w-sm rounded-[40px] p-10">
                    <DialogHeader className="items-center text-center space-y-6">
                        <div className="w-16 h-16 bg-[#FF7939]/20 rounded-[24px] flex items-center justify-center shadow-[0_10px_30px_rgba(255,121,57,0.2)]">
                            <MessageSquare className="w-8 h-8 text-[#FF7939]" />
                        </div>
                        <DialogTitle className="text-2xl font-black tracking-tight uppercase italic italic">Feedback</DialogTitle>
                    </DialogHeader>

                    <div className="mt-8 flex flex-col items-center gap-6">
                        <div className="flex gap-3">
                            {[1, 2, 3, 4, 5].map(i => (
                                <Flame
                                    key={i}
                                    size={28}
                                    className={i <= rating ? "text-[#FF7939]" : "text-white/10"}
                                    fill={i <= rating ? "currentColor" : "none"}
                                />
                            ))}
                        </div>

                        <div className="w-full bg-white/5 p-6 rounded-[24px] border border-white/10 text-center italic text-lg font-medium text-white/70">
                            "{feedback || 'Sin comentarios.'}"
                        </div>
                    </div>

                    <button
                        onClick={() => setShowFeedback(false)}
                        className="w-full mt-10 bg-[#FF7939] hover:bg-[#E66829] text-white py-5 rounded-[24px] font-black text-lg shadow-[0_10px_40px_rgba(255,121,57,0.3)] transition-all active:scale-95"
                    >
                        LISTO
                    </button>
                </DialogContent>
            </Dialog>
        </div>
    );
}
