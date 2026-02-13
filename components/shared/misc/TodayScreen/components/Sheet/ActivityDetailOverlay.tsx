import * as React from 'react';
import { motion } from 'framer-motion';
import { Flame, Clock, Zap, ShoppingCart, Loader2, X, Pencil } from 'lucide-react';
import { UniversalVideoPlayer } from '@/components/shared/video/universal-video-player';
import { parseSeries } from '../../utils/parsers';

interface ActivityDetailOverlayProps {
    selectedVideo: any;
    onClose: () => void;
    toggleExerciseSimple: (id: string) => void;
    programInfo: any;
    enrollment: any;
    activityId?: string;
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
    activityId,
    onNext,
    onPrev
}: ActivityDetailOverlayProps) {

    // Local state for tabs
    const [isVideoPanelExpanded, setIsVideoPanelExpanded] = React.useState(false);
    const [activeMealTab, setActiveMealTab] = React.useState<'Ingredientes' | 'Instrucciones'>('Ingredientes');
    const [activeExerciseTab, setActiveExerciseTab] = React.useState<string>('Series');
    const [isEditingSeries, setIsEditingSeries] = React.useState(false);
    const [editedSeries, setEditedSeries] = React.useState<any[]>([]);
    const [isSaving, setIsSaving] = React.useState(false);
    const [propagateAlways, setPropagateAlways] = React.useState(true);
    const [isToggling, setIsToggling] = React.useState(false);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    // Logic for returning to defaults when video changes
    React.useEffect(() => {
        // Manual expand: show play button first
        setIsVideoPanelExpanded(false);

        setActiveMealTab('Ingredientes');
        setActiveExerciseTab('Series');
        setIsEditingSeries(false);

        // Reset scroll to top
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [selectedVideo?.id, selectedVideo?.exerciseId]);

    const handleStartEditing = () => {
        console.log('📝 [ActivityDetailOverlay] Starting edit mode for video:', selectedVideo);
        const series = parseSeries(selectedVideo.detalle_series || selectedVideo.series);
        console.log('📝 [ActivityDetailOverlay] Parsed series:', series);
        setEditedSeries(series.map(s => ({ ...s })));
        setIsEditingSeries(true);
    };

    const handleSaveSeries = async () => {
        if (!selectedVideo || isSaving) return;
        setIsSaving(true);
        console.log('💾 [ActivityDetailOverlay] handleSaveSeries triggered');
        try {
            const { getBuenosAiresDateString } = require('@/utils/date-utils');
            const fechaString = getBuenosAiresDateString(new Date());

            // Robust ID extraction
            const getNumericId = (act: any) => {
                if (act.exerciseId && !isNaN(Number(act.exerciseId))) return Number(act.exerciseId);
                if (act.exercise_id && !isNaN(Number(act.exercise_id))) return Number(act.exercise_id);
                if (act.ejercicio_id && !isNaN(Number(act.ejercicio_id))) return Number(act.ejercicio_id);
                const idStr = String(act.id || '');
                if (idStr.includes('-')) return Number(idStr.split('-')[1]);
                if (idStr.includes('_')) return Number(idStr.split('_')[0]);
                return Number(idStr);
            };

            const ejId = getNumericId(selectedVideo);
            const actId = Number(activityId || selectedVideo.activity_id || enrollment?.actividad_id || enrollment?.activity_id);
            const targetFecha = selectedVideo.date || selectedVideo.fecha || fechaString;

            console.log('💾 [ActivityDetailOverlay] Extracted params:', { ejId, actId, targetFecha, originalId: selectedVideo.id });

            if (!ejId || isNaN(actId)) {
                console.error('❌ [ActivityDetailOverlay] Missing required params:', { ejId, actId, targetFecha });
                alert('Error: Faltan parámetros (ejercicioId o activityId). Por favor reporte este error.');
                setIsSaving(false);
                return;
            }

            const payload = {
                ejercicioId: ejId,
                bloque: selectedVideo.bloque || 1,
                orden: selectedVideo.orden || 0,
                fecha: targetFecha,
                activityId: actId,
                propagateAlways,
                series: editedSeries.map(s => ({
                    reps: String(s.reps || '0'),
                    kg: String(s.kg || '0'),
                    series: String(s.sets || '1')
                }))
            };

            console.log('💾 [ActivityDetailOverlay] Save Payload:', payload);

            const response = await fetch('/api/update-exercise-series', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            console.log('💾 [ActivityDetailOverlay] Save Response:', result);

            if (result.success) {
                selectedVideo.detalle_series = editedSeries.map(s => ({
                    repeticiones: s.reps,
                    peso: s.kg,
                    series: s.sets
                }));
                setIsEditingSeries(false);
            } else {
                alert(result.error || 'Error al guardar');
            }
        } catch (e) {
            console.error('❌ Error saving series:', e);
            alert('Error de conexión al guardar');
        } finally {
            setIsSaving(false);
        }
    };


    if (!selectedVideo) return null;

    const isNutrition = programInfo?.categoria === 'nutricion' || enrollment?.activity?.categoria === 'nutricion' || selectedVideo.categoria === 'nutricion';

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
                position: 'fixed', top: 56, left: 0, right: 0, bottom: 64, zIndex: 45,
                backgroundColor: '#000000', display: 'flex', flexDirection: 'column',
                boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
                borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden'
            }}
        >
            {/* Background and Overlay styles */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `url(${selectedVideo.coverImageUrl || (selectedVideo as any).image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.7, filter: 'blur(12px) brightness(0.6)', zIndex: 0, transform: 'scale(1.1)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: isVideoPanelExpanded ? 'linear-gradient(180deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.95) 100%)' : 'linear-gradient(180deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.6) 40%, rgba(0, 0, 0, 0.9) 100%)', zIndex: 1, pointerEvents: 'none' }} />

            {/* Header */}
            <div style={{ padding: '16px 20px 0', flexShrink: 0, position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button onClick={onClose} style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', borderRadius: 12, color: '#FF7939', fontSize: 24, cursor: 'pointer' }}>←</button>

                {/* Completion Status (Top Right) */}
                <div
                    onClick={async () => {
                        if (isToggling) return;
                        setIsToggling(true);
                        const wasDone = selectedVideo.done || selectedVideo.completed;
                        try {
                            // Use the unique ID from the activities list
                            await toggleExerciseSimple(selectedVideo.id);
                            // Auto-advance if we just marked it as done
                            if (!wasDone) {
                                setTimeout(onNext, 300);
                            }
                        } finally {
                            setTimeout(() => setIsToggling(false), 500);
                        }
                    }}
                    style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        cursor: isToggling ? 'default' : 'pointer', paddingRight: 4, zIndex: 100,
                        opacity: isToggling ? 0.7 : 1
                    }}
                >
                    <Flame
                        size={30}
                        fill={(selectedVideo.done || selectedVideo.completed) ? "#FF7939" : "transparent"}
                        color="#FF7939"
                        strokeWidth={2}
                        className={isToggling ? "animate-pulse" : ""}
                    />
                    <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {(selectedVideo.done || selectedVideo.completed) ? 'Completado' : 'Pendiente'}
                    </span>
                </div>
            </div>

            {/* Title */}
            <div style={{ padding: '4px 20px 0', flexShrink: 0, position: 'relative', zIndex: 10, textAlign: 'center' }}>
                <h1 style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                    {selectedVideo.exerciseName || selectedVideo.title || selectedVideo.nombre_ejercicio}
                </h1>
            </div>

            {/* Content Container */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', zIndex: 5 }}>
                <div
                    ref={scrollRef}
                    className={isNutrition ? 'hide-scrollbar' : 'orange-glass-scrollbar'}
                    style={{ flex: 1, overflowY: 'auto', padding: '0 20px 250px', display: 'flex', flexDirection: 'column', gap: 20, position: 'relative' }}
                >

                    {/* Play Button Icon - RE-ADDED */}
                    {!isVideoPanelExpanded && selectedVideo.url && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 30, marginBottom: 10 }}>
                            <button
                                onClick={() => setIsVideoPanelExpanded(true)}
                                style={{
                                    width: 76, height: 76, borderRadius: '50%',
                                    background: 'rgba(255, 121, 57, 0.15)',
                                    border: '2px solid #FF7939',
                                    backdropFilter: 'blur(20px)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', zIndex: 20,
                                    boxShadow: '0 0 40px rgba(255,121,57,0.3)'
                                }}
                            >
                                <div style={{ width: 0, height: 0, borderTop: '12px solid transparent', borderBottom: '12px solid transparent', borderLeft: '20px solid #FF7939', marginLeft: 8 }} />
                            </button>
                        </div>
                    )}

                    {/* Expanded Video Panel - Forced Visibility */}
                    {isVideoPanelExpanded && selectedVideo.url && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                width: '100%',
                                aspectRatio: '16/9',
                                minHeight: '280px',
                                marginTop: 12,
                                borderRadius: 18,
                                background: '#000',
                                position: 'relative',
                                overflow: 'hidden',
                                zIndex: 10,
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                boxShadow: '0 12px 40px rgba(0,0,0,0.6)'
                            }}
                        >
                            <UniversalVideoPlayer videoUrl={selectedVideo.url} autoPlay={true} controls={true} className="w-full h-full" disableDownload={true} />
                            <button onClick={() => setIsVideoPanelExpanded(false)} style={{ position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 30 }}><X size={18} /></button>
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
                                                        let list: any[] = [];
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
                                    {(selectedVideo.duration != null || selectedVideo.minutos != null) && (
                                        <>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}> <Clock size={16} color="rgba(255, 255, 255, 0.7)" /> <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 13, fontWeight: 500 }}>{selectedVideo.duration || selectedVideo.minutos} min</span> </div>
                                            {(selectedVideo.calorias != null || selectedVideo.type || selectedVideo.tipo) && <div style={{ width: 1, height: 20, background: 'rgba(255, 255, 255, 0.1)' }}></div>}
                                        </>
                                    )}
                                    {selectedVideo.calorias != null && (
                                        <>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}> <Flame size={16} color="#FF6A1A" /> <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 13, fontWeight: 500 }}>~{selectedVideo.calorias} kcal</span> </div>
                                            {(selectedVideo.type || selectedVideo.tipo) && <div style={{ width: 1, height: 20, background: 'rgba(255, 255, 255, 0.1)' }}></div>}
                                        </>
                                    )}
                                    {(selectedVideo.type || selectedVideo.tipo) && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}> <Zap size={16} color="rgba(255, 255, 255, 0.7)" /> <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 13, fontWeight: 500 }}>{selectedVideo.type || selectedVideo.tipo}</span> </div>
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
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', position: 'relative' }}>
                                                {/* Edit All Series Button or Save/Cancel */}
                                                {!isEditingSeries ? (
                                                    <div style={{ position: 'absolute', top: 5, right: 0, zIndex: 10 }}>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleStartEditing(); }}
                                                            style={{
                                                                width: 38, height: 38, borderRadius: '50%',
                                                                background: 'rgba(255, 106, 26, 0.15)', backdropFilter: 'blur(10px)',
                                                                border: '1px solid rgba(255, 106, 26, 0.3)', color: '#FF6A1A',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                                                boxShadow: '0 4px 12px rgba(255, 106, 26, 0.2)'
                                                            }}
                                                        >
                                                            <Pencil size={18} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 360, marginBottom: 16, gap: 12 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                                            <button onClick={() => setIsEditingSeries(false)} style={{ background: 'rgba(255, 255, 255, 0.05)', border: 'none', borderRadius: 8, padding: '8px 16px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                                                            <button onClick={handleSaveSeries} disabled={isSaving} style={{ background: '#FF6A1A', border: 'none', borderRadius: 8, padding: '8px 16px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: isSaving ? 0.7 : 1 }}>
                                                                {isSaving ? 'Guardando...' : 'Guardar'}
                                                            </button>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, cursor: 'pointer' }} onClick={() => setPropagateAlways(!propagateAlways)}>
                                                            <div style={{ width: 18, height: 18, borderRadius: 4, background: propagateAlways ? '#FF6A1A' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                {propagateAlways && <X size={14} color="#fff" style={{ transform: 'rotate(45deg)' }} />}
                                                            </div>
                                                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Aplicar siempre a este ejercicio</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {(isEditingSeries ? editedSeries : parseSeries(selectedVideo.detalle_series || selectedVideo.series)).map((s: any, idx: number) => (
                                                    <div key={idx} style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: '12px 14px',
                                                        background: 'rgba(255, 255, 255, 0.05)',
                                                        borderRadius: 14,
                                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                                        width: '100%',
                                                        maxWidth: 330
                                                    }}>
                                                        {/* Index */}
                                                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255, 106, 26, 0.15)', color: '#FF6A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{idx + 1}</div>

                                                        {/* Sets Column */}
                                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
                                                            {isEditingSeries ? (
                                                                <input
                                                                    type="number"
                                                                    value={s.sets}
                                                                    onChange={(e) => {
                                                                        const copy = [...editedSeries];
                                                                        copy[idx].sets = e.target.value;
                                                                        setEditedSeries(copy);
                                                                    }}
                                                                    style={{ width: 40, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 4, color: '#fff', fontSize: 14, textAlign: 'center', padding: '2px 0' }}
                                                                />
                                                            ) : (
                                                                <span style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 600 }}>{s.sets}</span>
                                                            )}
                                                            <div style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: 9, textTransform: 'uppercase', marginTop: 2 }}>Series</div>
                                                        </div>

                                                        {/* Reps Column */}
                                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
                                                            {isEditingSeries ? (
                                                                <input
                                                                    type="text"
                                                                    value={s.reps}
                                                                    onChange={(e) => {
                                                                        const copy = [...editedSeries];
                                                                        copy[idx].reps = e.target.value;
                                                                        setEditedSeries(copy);
                                                                    }}
                                                                    style={{ width: 45, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 4, color: '#fff', fontSize: 14, fontWeight: 700, textAlign: 'center', padding: '2px 0' }}
                                                                />
                                                            ) : (
                                                                <div style={{ color: '#FFFFFF', fontSize: 15, fontWeight: 700 }}>{s.reps || '-'}</div>
                                                            )}
                                                            <div style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: 9, textTransform: 'uppercase', marginTop: 2 }}>Reps</div>
                                                        </div>

                                                        {/* Peso Column */}
                                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
                                                            {isEditingSeries ? (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                                    <input
                                                                        type="text"
                                                                        value={s.kg}
                                                                        onChange={(e) => {
                                                                            const copy = [...editedSeries];
                                                                            copy[idx].kg = e.target.value;
                                                                            setEditedSeries(copy);
                                                                        }}
                                                                        style={{ width: 40, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 4, color: '#FF6A1A', fontSize: 14, fontWeight: 700, textAlign: 'center', padding: '2px 0' }}
                                                                    />
                                                                    <span style={{ color: '#FF6A1A', fontSize: 12, fontWeight: 700 }}>kg</span>
                                                                </div>
                                                            ) : (
                                                                <div style={{ color: '#FF6A1A', fontSize: 15, fontWeight: 700 }}>{s.kg ? `${s.kg}kg` : '-'}</div>
                                                            )}
                                                            <div style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: 9, textTransform: 'uppercase', marginTop: 2 }}>Peso</div>
                                                        </div>

                                                        {/* Delete Block */}
                                                        {isEditingSeries && (
                                                            <button
                                                                onClick={() => {
                                                                    if (confirm('¿Eliminar este bloque de series?')) {
                                                                        const copy = [...editedSeries];
                                                                        copy.splice(idx, 1);
                                                                        setEditedSeries(copy);
                                                                    }
                                                                }}
                                                                style={{ background: 'transparent', border: 'none', color: 'rgba(255, 255, 255, 0.2)', padding: '0 4px', cursor: 'pointer' }}
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                {isEditingSeries && (
                                                    <button
                                                        onClick={() => setEditedSeries([...editedSeries, { id: editedSeries.length + 1, reps: '10', kg: '0', sets: '1' }])}
                                                        style={{ marginTop: 10, color: '#FF6A1A', fontSize: 13, fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer' }}
                                                    >
                                                        + Añadir bloque de series
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        {activeExerciseTab === 'Técnica' && (
                                            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                                {selectedVideo.description || selectedVideo.descripcion || selectedVideo.exercise?.description || selectedVideo.exercise?.descripcion || 'Sin descripción disponible.'}
                                            </p>
                                        )}
                                        {activeExerciseTab === 'Equipamiento' && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                {(selectedVideo.equipment || selectedVideo.exercise?.equipment || selectedVideo.equipo)?.split(';').map((e: string, i: number) => e.trim() && <span key={i} style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: '6px 12px', fontSize: 13, color: 'rgba(255, 255, 255, 0.9)' }}>{e.trim()}</span>)}
                                                {!(selectedVideo.equipment || selectedVideo.exercise?.equipment || selectedVideo.equipo) && <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 14 }}>No especificado</span>}
                                            </div>
                                        )}
                                        {activeExerciseTab === 'Músculos' && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                {(selectedVideo.body_parts || selectedVideo.exercise?.body_parts)?.split(';').map((e: string, i: number) => e.trim() && <span key={i} style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: '6px 12px', fontSize: 13, color: 'rgba(255, 255, 255, 0.9)' }}>{e.trim()}</span>)}
                                                {!(selectedVideo.body_parts || selectedVideo.exercise?.body_parts) && <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 14 }}>No especificado</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* Split Navigation Buttons (Corners) - MOVED HIGHER */}
            <button
                onClick={(e) => { e.stopPropagation(); onPrev(); }}
                style={{
                    position: 'fixed', bottom: 120, left: 24, zIndex: 10000,
                    width: 58, height: 58, borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(25px)',
                    border: '1.5px solid #FF7939',
                    color: '#FF7939',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)', transition: 'all 0.2s ease'
                }}
            >
                <span style={{ fontSize: 28, fontWeight: 700 }}>←</span>
            </button>

            <button
                onClick={(e) => { e.stopPropagation(); onNext(); }}
                style={{
                    position: 'fixed', bottom: 120, right: 24, zIndex: 10000,
                    width: 58, height: 58, borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(25px)',
                    border: '1.5px solid #FF7939',
                    color: '#FF7939',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)', transition: 'all 0.2s ease'
                }}
            >
                <span style={{ fontSize: 28, fontWeight: 700 }}>→</span>
            </button>
        </motion.div>
    );
}
