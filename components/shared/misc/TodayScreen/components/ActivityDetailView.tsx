import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, Clock, Zap, ShoppingCart } from 'lucide-react';
import { UniversalVideoPlayer } from '@/components/shared/video/universal-video-player';

// Importante: parseSeries lógica helper
const parseSeries = (seriesString: string) => {
    if (!seriesString || seriesString === 'Sin especificar') return [];
    // Simple mock logic for series parsing if complex logic is needed, 
    // we should extract the utility properly.
    // Assuming simple string or JSON array parsing for now.
    try {
        if (seriesString.startsWith('[')) return JSON.parse(seriesString);
        return [{ text: seriesString }]; // Fallback
    } catch {
        return seriesString.split(',').map(s => ({ text: s.trim() }));
    }
};

interface ActivityDetailViewProps {
    activity: any;
    programInfo: any;
    onClose: () => void;
}

export const ActivityDetailView: React.FC<ActivityDetailViewProps> = ({
    activity,
    programInfo,
    onClose
}) => {
    const [isVideoPanelExpanded, setIsVideoPanelExpanded] = useState(false);
    const [activeMealTab, setActiveMealTab] = useState<'Ingredientes' | 'Instrucciones'>('Ingredientes');
    const [activeExerciseTab, setActiveExerciseTab] = useState('Técnica');

    // Auto-expand video if user clicks play implies parent managed state, 
    // but here we manage local expansion.

    const isNutrition = programInfo?.categoria === 'nutricion' || activity?.categoria === 'nutricion';

    return (
        <div
            className="fixed inset-0 z-[99999] bg-[#0F1012] flex flex-col h-full w-full"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999 }} // Force top layer
        >
            {/* Background Image Blurring */}
            {activity.coverImageUrl && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '45vh',
                    backgroundImage: `url(${activity.coverImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center',
                    opacity: 0.3, filter: 'blur(40px)', zIndex: 0, pointerEvents: 'none', maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)'
                }} />
            )}

            {/* HeaderNav */}
            <div style={{ padding: '12px 20px 0', zIndex: 10, display: 'flex', alignItems: 'center' }}>
                <button
                    onClick={onClose}
                    style={{
                        width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 12, cursor: 'pointer',
                        color: '#FF6A1A', fontSize: 24
                    }}
                >
                    ←
                </button>
            </div>

            {/* Title */}
            <div style={{ padding: '4px 20px 10px', zIndex: 10, display: 'flex', justifyContent: 'center' }}>
                <h1 style={{
                    color: 'rgba(255, 255, 255, 0.9)', fontSize: 22, fontWeight: 700, margin: 0,
                    textAlign: 'center', textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                }}>
                    {activity.exerciseName || activity.title}
                </h1>
            </div>

            {/* Scrollable Content */}
            <div
                className={isNutrition ? 'hide-scrollbar' : 'orange-glass-scrollbar'}
                style={{
                    flex: 1, overflowY: 'auto', padding: '0 20px 100px', display: 'flex', flexDirection: 'column', gap: 20, zIndex: 1
                }}
            >
                {/* Main Play Button (if not expanded) */}
                {!isVideoPanelExpanded && activity.url && (
                    <div className="flex justify-center mt-4 mb-4">
                        <button
                            onClick={() => setIsVideoPanelExpanded(true)}
                            style={{
                                width: 64, height: 64, borderRadius: '50%', background: 'rgba(255, 106, 26, 0.2)',
                                border: '2px solid rgba(255, 106, 26, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backdropFilter: 'blur(10px)', boxShadow: '0 0 20px rgba(255, 106, 26, 0.2)'
                            }}
                        >
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                <path d="M8 5V19L19 12L8 5Z" fill="#FF6A1A" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Expanded Video Panel */}
                <AnimatePresence>
                    {isVideoPanelExpanded && activity.url && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 260, opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="relative w-full rounded-xl overflow-hidden bg-black shadow-2xl border border-white/10"
                        >
                            <UniversalVideoPlayer
                                videoUrl={activity.url}
                                autoPlay={true}
                                controls={true}
                                className="w-full h-full"
                            />
                            <button
                                onClick={() => setIsVideoPanelExpanded(false)}
                                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white/70 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Info & Stats */}
                {isNutrition ? (
                    // Nutrition Layout
                    <div className="flex flex-col gap-6">
                        {/* Macro Wrapper */}
                        <div className="flex justify-center gap-4 text-sm font-medium text-white/80 bg-white/5 p-3 rounded-xl backdrop-blur-md border border-white/5 mx-auto">
                            {activity.calorias && (
                                <div className="flex items-center gap-2">
                                    <Flame size={14} className="text-orange-500" />
                                    {activity.calorias} kcal
                                </div>
                            )}
                            {activity.minutos && (
                                <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                                    <Clock size={14} className="text-blue-400" />
                                    {activity.minutos} min
                                </div>
                            )}
                        </div>

                        {/* Ingredients / Instructions Tabs */}
                        <div className="flex gap-6 border-b border-white/10 pb-0">
                            <button
                                onClick={() => setActiveMealTab('Ingredientes')}
                                className={`pb-3 text-sm font-semibold transition-colors ${activeMealTab === 'Ingredientes' ? 'text-[#FF6A1A] border-b-2 border-[#FF6A1A]' : 'text-white/50'}`}
                            >
                                Ingredientes
                            </button>
                            <button
                                onClick={() => setActiveMealTab('Instrucciones')}
                                className={`pb-3 text-sm font-semibold transition-colors ${activeMealTab === 'Instrucciones' ? 'text-[#FF6A1A] border-b-2 border-[#FF6A1A]' : 'text-white/50'}`}
                            >
                                Instrucciones
                            </button>
                        </div>

                        <div className="min-h-[200px]">
                            {activeMealTab === 'Ingredientes' && (
                                <ul className="space-y-3">
                                    {/* Parsing logic simplified for visual check */}
                                    {(Array.isArray(activity.ingredientes) ? activity.ingredientes : [activity.ingredientes])
                                        .map((ing: any, i: number) => (
                                            <li key={i} className="flex items-start gap-3 text-white/80 text-sm">
                                                <ShoppingCart size={14} className="mt-1 text-orange-500 shrink-0" />
                                                <span>{typeof ing === 'string' ? ing : (ing?.nombre || JSON.stringify(ing))}</span>
                                            </li>
                                        ))}
                                </ul>
                            )}
                            {activeMealTab === 'Instrucciones' && (
                                <div className="space-y-4 text-white/80 text-sm leading-relaxed whitespace-pre-line">
                                    {activity.receta || "No hay instrucciones disponibles."}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    // Fitness Layout
                    <div className="flex flex-col gap-6">
                        {/* Stats Bar */}
                        <div className="flex justify-center gap-4 py-3 px-4 bg-white/5 rounded-xl backdrop-blur border border-white/5 w-fit mx-auto">
                            {activity.duration && (
                                <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
                                    <Clock size={14} className="text-white/60" />
                                    {activity.duration} min
                                </div>
                            )}
                            {activity.calorias && (
                                <div className="flex items-center gap-2 text-white/90 text-sm font-medium border-l border-white/10 pl-4">
                                    <Flame size={14} className="text-orange-500" />
                                    ~{activity.calorias} kcal
                                </div>
                            )}
                            {activity.tipo && (
                                <div className="flex items-center gap-2 text-white/90 text-sm font-medium border-l border-white/10 pl-4">
                                    <Zap size={14} className="text-yellow-400" />
                                    {activity.tipo}
                                </div>
                            )}
                        </div>

                        {/* Logic Tabs: Technique | Equipment | Muscles */}
                        <div className="flex border-b border-white/10">
                            {['Técnica', 'Equipamiento', 'Músculos'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveExerciseTab(tab)}
                                    className={`flex-1 pb-3 text-sm font-medium transition-colors ${activeExerciseTab === tab ? 'text-white border-b-2 border-[#FF6A1A]' : 'text-white/50'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="min-h-[100px] text-white/70 text-sm leading-relaxed">
                            {activeExerciseTab === 'Técnica' && (
                                <p>{activity.description || "Sin descripción de técnica."}</p>
                            )}
                            {activeExerciseTab === 'Equipamiento' && (
                                <p>{activity.equipment || "Sin equipamiento específico."}</p>
                            )}
                            {activeExerciseTab === 'Músculos' && (
                                <p>{activity.muscles || "Cuerpo completo."}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
