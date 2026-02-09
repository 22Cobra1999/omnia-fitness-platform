import * as React from 'react';
import { motion } from 'framer-motion';
import { Flame, Clock, Zap, ShoppingCart, Loader2, X } from 'lucide-react';
import { UniversalVideoPlayer } from '@/components/shared/video/universal-video-player';
import { parseSeries } from '../../utils/parsers';

interface ActivityDetailOverlayProps {
    selectedVideo: any;
    onClose: () => void;
    toggleExerciseSimple: (id: string) => void;
    programInfo: any;
    enrollment: any;
    // Navigation
    onNext: () => void;
    onPrev: () => void;
}

export function ActivityDetailOverlay({
    selectedVideo,
    onClose,
    toggleExerciseSimple,
    programInfo,
    enrollment,
    onNext,
    onPrev
}: ActivityDetailOverlayProps) {

    // Local state for tabs
    const [isVideoPanelExpanded, setIsVideoPanelExpanded] = React.useState(false);
    const [activeMealTab, setActiveMealTab] = React.useState<'Ingredientes' | 'Instrucciones'>('Ingredientes');
    const [activeExerciseTab, setActiveExerciseTab] = React.useState<string>('Técnica');

    // Logic for returning to defaults when video changes
    React.useEffect(() => {
        setIsVideoPanelExpanded(false);
        setActiveMealTab('Ingredientes');
        setActiveExerciseTab('Técnica');
    }, [selectedVideo?.id]);


    if (!selectedVideo) return null;

    const isNutrition = programInfo?.categoria === 'nutricion' || enrollment?.activity?.categoria === 'nutricion' || selectedVideo.categoria === 'nutricion';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, // High Z-index
                height: '100vh', width: '100vw', backgroundColor: '#000000', display: 'flex', flexDirection: 'column'
            }}
        >
            {/* Background and Overlay styles */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `url(${selectedVideo.coverImageUrl || selectedVideo.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.55, filter: 'blur(12px) brightness(0.85)', zIndex: 0, transform: 'scale(1.1)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: isVideoPanelExpanded ? 'linear-gradient(180deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.85) 100%)' : 'linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.4) 40%, rgba(0, 0, 0, 0.8) 100%)', zIndex: 1, pointerEvents: 'none' }} />

            {/* Header */}
            <div style={{ padding: '12px 20px 0', flexShrink: 0, position: 'relative', zIndex: 10, display: 'flex', alignItems: 'flex-start' }}>
                <button onClick={onClose} style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', borderRadius: 12, color: '#FF6A1A', fontSize: 24, cursor: 'pointer', transition: 'all 0.2s ease' }}>←</button>
            </div>

            {/* Title */}
            <div style={{ padding: '4px 20px 0', flexShrink: 0, position: 'relative', zIndex: 10, textAlign: 'center' }}>
                <h1 style={{ color: 'rgba(255, 255, 255, 0.55)', fontSize: 20, fontWeight: 600, margin: 0, letterSpacing: '-0.03em', lineHeight: 1.2, textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)' }}>
                    {selectedVideo.exerciseName || selectedVideo.title}
                </h1>
            </div>

            {/* Content */}
            <div className={isNutrition ? 'hide-scrollbar' : 'orange-glass-scrollbar'} style={{ flex: 1, overflowY: 'auto', padding: '0 20px 200px', display: 'flex', flexDirection: 'column', gap: 20, position: 'relative', zIndex: 1 }}>

                {/* Play Button (only if not expanded) */}
                {!isVideoPanelExpanded && selectedVideo.url && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                        <button onClick={() => setIsVideoPanelExpanded(true)} style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255, 106, 26, 0.15)', border: '2px solid rgba(255, 106, 26, 0.3)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', zIndex: 20 }}>
                            <div style={{ width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderLeft: '14px solid #FF6A1A', marginLeft: 4 }} />
                        </button>
                    </div>
                )}

                {/* Expanded Video Panel */}
                {isVideoPanelExpanded && selectedVideo.url && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 260, opacity: 1 }} style={{ width: '100%', height: 260, marginTop: 12, borderRadius: 18, background: '#000', position: 'relative', overflow: 'hidden', zIndex: 10 }}>
                        <UniversalVideoPlayer videoUrl={selectedVideo.url} autoPlay={true} controls={true} className="w-full h-full" disableDownload={true} />
                        <button onClick={() => setIsVideoPanelExpanded(false)} style={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 30 }}><X size={16} /></button>
                    </motion.div>
                )}

                {/* Info Container */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* NUTRITION LAYOUT */}
                    {isNutrition ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                            {/* Stats Pill - Added margin top for separation */}
                            <div style={{ margin: '20px auto 20px', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.04)', backdropFilter: 'blur(20px)', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: 'fit-content', height: 36 }}>
                                {selectedVideo.minutos && (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" /><path d="M8 4V8L11 10" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" strokeLinecap="round" /></svg>
                                            <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 12, fontWeight: 500 }}>{selectedVideo.minutos} min</span>
                                        </div>
                                        {selectedVideo.calorias && <div style={{ width: 1, height: 16, background: 'rgba(255, 255, 255, 0.1)' }}></div>}
                                    </>
                                )}
                                {selectedVideo.calorias && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Flame size={14} color="#FF6A1A" />
                                        <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 12, fontWeight: 500 }}>~{selectedVideo.calorias} kcal</span>
                                    </div>
                                )}
                            </div>

                            {/* Macs */}
                            {(selectedVideo.proteinas || selectedVideo.carbohidratos || selectedVideo.grasas) && (
                                <div style={{ margin: '0 20px 20px', display: 'flex', justifyContent: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        {selectedVideo.proteinas && <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 15, fontWeight: 500 }}>P {selectedVideo.proteinas}g</span>}
                                        {selectedVideo.carbohidratos && <> <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>|</span> <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 15, fontWeight: 500 }}>C {selectedVideo.carbohidratos}g</span> </>}
                                        {selectedVideo.grasas && <> <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>|</span> <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 15, fontWeight: 500 }}>G {selectedVideo.grasas}g</span> </>}
                                    </div>
                                </div>
                            )}

                            {/* Tabs (Ingredientes/Instrucciones) - Robust Check */}
                            {((selectedVideo.ingredientes && selectedVideo.ingredientes.length > 0) || (selectedVideo.receta && selectedVideo.receta.length > 0) || (selectedVideo.ingredients && selectedVideo.ingredients.length > 0)) && (
                                <div style={{ margin: '0 20px 20px' }}>
                                    <div style={{ display: 'flex', gap: 24, marginBottom: 16, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                        {(selectedVideo.ingredientes || selectedVideo.ingredients) && <button onClick={() => setActiveMealTab('Ingredientes')} style={{ paddingBottom: 12, background: 'transparent', border: 'none', borderBottom: activeMealTab === 'Ingredientes' ? '2px solid #FF6A1A' : '2px solid transparent', color: activeMealTab === 'Ingredientes' ? '#FF6A1A' : 'rgba(255, 255, 255, 0.5)', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Ingredientes</button>}
                                        {selectedVideo.receta && <button onClick={() => setActiveMealTab('Instrucciones')} style={{ paddingBottom: 12, background: 'transparent', border: 'none', borderBottom: activeMealTab === 'Instrucciones' ? '2px solid #FF6A1A' : '2px solid transparent', color: activeMealTab === 'Instrucciones' ? '#FF6A1A' : 'rgba(255, 255, 255, 0.5)', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Instrucciones</button>}
                                    </div>
                                    <div style={{ padding: '10px 0', minHeight: 200 }}>
                                        {activeMealTab === 'Ingredientes' && (selectedVideo.ingredientes || selectedVideo.ingredients) && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                {/* Simple string or array parsing logic inline for now, can extract later */}
                                                {(() => {
                                                    let list = [];
                                                    const ing = selectedVideo.ingredientes || selectedVideo.ingredients;
                                                    if (Array.isArray(ing)) list = ing.map(i => typeof i === 'object' ? `${i.nombre || ''} ${i.cantidad || ''}${i.unidad || ''}` : String(i));
                                                    else if (typeof ing === 'string') list = ing.split(';').map(s => s.trim()).filter(s => s);
                                                    return list.map((item, i) => (
                                                        <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                                                            <ShoppingCart size={14} className="text-[#FF6A1A]" />
                                                            <span style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 14 }}>{item}</span>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        )}
                                        {activeMealTab === 'Instrucciones' && selectedVideo.receta && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                                <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selectedVideo.receta}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>
                    ) : (
                        // FITNESS LAYOUT
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {/* Stats Bar */}
                            <div style={{ marginTop: 4, padding: '12px 16px', background: 'rgba(255, 255, 255, 0.04)', backdropFilter: 'blur(20px)', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: 'fit-content', margin: '0 auto', height: 46 }}>
                                {selectedVideo.duration && (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}> <Clock size={16} color="rgba(255, 255, 255, 0.7)" /> <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 13, fontWeight: 500 }}>{selectedVideo.duration} min</span> </div>
                                        {(selectedVideo.calorias || selectedVideo.type) && <div style={{ width: 1, height: 20, background: 'rgba(255, 255, 255, 0.1)' }}></div>}
                                    </>
                                )}
                                {selectedVideo.calorias && (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}> <Flame size={16} color="#FF6A1A" /> <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 13, fontWeight: 500 }}>~{selectedVideo.calorias} kcal</span> </div>
                                        {selectedVideo.type && <div style={{ width: 1, height: 20, background: 'rgba(255, 255, 255, 0.1)' }}></div>}
                                    </>
                                )}
                                {selectedVideo.type && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}> <Zap size={16} color="rgba(255, 255, 255, 0.7)" /> <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 13, fontWeight: 500 }}>{selectedVideo.type}</span> </div>
                                )}
                            </div>

                            {/* TABS: Técnica | Equipamiento | Músculos | Series */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: 12 }}>
                                    {[
                                        (selectedVideo.detalle_series || selectedVideo.series) && selectedVideo.detalle_series !== 'Sin especificar' ? 'Series' : null,
                                        'Técnica',
                                        'Equipamiento',
                                        'Músculos'
                                    ].filter(Boolean).map((tab: any) => (
                                        <button key={tab} onClick={() => setActiveExerciseTab(tab)} style={{ flex: 1, padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: activeExerciseTab === tab ? '2px solid #FF6A1A' : '2px solid transparent', color: activeExerciseTab === tab ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)', fontSize: 14, fontWeight: activeExerciseTab === tab ? 600 : 500, cursor: 'pointer', transition: 'all 0.2s ease' }}>
                                            {tab}
                                        </button>
                                    ))}
                                </div>

                                <div style={{ minHeight: 100 }}>
                                    {activeExerciseTab === 'Series' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {parseSeries(selectedVideo.detalle_series || selectedVideo.series).map((s: any, idx: number) => (
                                                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255, 106, 26, 0.15)', color: '#FF6A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{idx + 1}</div>
                                                        <span style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 500 }}>{s.sets} {Number(s.sets) === 1 ? 'Serie' : 'Series'}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 12 }}>
                                                        <div style={{ textAlign: 'right' }}><div style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: 10, textTransform: 'uppercase' }}>Reps</div><div style={{ color: '#FFFFFF', fontSize: 15, fontWeight: 700 }}>{s.reps}</div></div>
                                                        <div style={{ width: 1, height: 24, background: 'rgba(255, 255, 255, 0.1)', alignSelf: 'center' }}></div>
                                                        <div style={{ textAlign: 'right', minWidth: 40 }}><div style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: 10, textTransform: 'uppercase' }}>Peso</div><div style={{ color: '#FF6A1A', fontSize: 15, fontWeight: 700 }}>{s.kg}kg</div></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {activeExerciseTab === 'Técnica' && <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, lineHeight: 1.6 }}>{selectedVideo.description || selectedVideo.descripcion || 'Sin descripción disponible.'}</p>}
                                    {activeExerciseTab === 'Equipamiento' && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                            {selectedVideo.equipment?.split(';').map((e: string, i: number) => e.trim() && <span key={i} style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: '6px 12px', fontSize: 13, color: 'rgba(255, 255, 255, 0.9)' }}>{e.trim()}</span>)}
                                        </div>
                                    )}
                                    {activeExerciseTab === 'Músculos' && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                            {selectedVideo.body_parts?.split(';').map((e: string, i: number) => e.trim() && <span key={i} style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: '6px 12px', fontSize: 13, color: 'rgba(255, 255, 255, 0.9)' }}>{e.trim()}</span>)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Navigation */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, padding: '20px 0', marginTop: 'auto', position: 'relative', zIndex: 50 }}>
                    <button onClick={onPrev} style={{ background: 'transparent', border: 'none', color: '#FF6A00', fontSize: 24, cursor: 'pointer' }}>←</button>
                    <button onClick={() => { toggleExerciseSimple(selectedVideo.exerciseId || selectedVideo.id); onClose(); }} style={{ padding: '10px 22px', borderRadius: 14, background: '#FF7939', border: 'none', color: '#000', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 14px rgba(255, 121, 57, 0.4)' }}>
                        Completar
                    </button>
                    <button onClick={onNext} style={{ background: 'transparent', border: 'none', color: '#FF6A00', fontSize: 24, cursor: 'pointer' }}>→</button>
                </div>
            </div>
        </motion.div>
    );
}
