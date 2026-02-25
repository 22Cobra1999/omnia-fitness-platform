
import * as React from 'react';
import { Clock, Flame, Zap } from 'lucide-react';
import { FitnessSeriesList } from './FitnessSeriesList';

// Robust parser for body_parts / equipo fields — handles arrays, JSON strings, comma/semicolon separated
const parseTags = (raw: any): string[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map((x: any) => (typeof x === 'string' ? x.trim() : String(x))).filter(Boolean);
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parseTags(parsed);
        } catch { }
        return raw.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
    }
    if (typeof raw === 'object') return Object.values(raw).map((x: any) => String(x)).filter(Boolean);
    return [];
};

interface FitnessInfoProps {
    selectedVideo: any;
    activeExerciseTab: string;
    setActiveExerciseTab: (tab: string) => void;

    // Editing props passed down to SeriesList
    isEditingSeries: boolean;
    setIsEditingSeries: (value: boolean) => void;
    editedSeries: any[];
    setEditedSeries: (series: any[]) => void;
    handleStartEditing: () => void;
    handleSaveSeries: () => void;
    isSaving: boolean;
    propagateAlways: boolean;
    setPropagateAlways: (value: boolean) => void;
}

export function FitnessInfo({
    selectedVideo,
    activeExerciseTab,
    setActiveExerciseTab,
    isEditingSeries,
    setIsEditingSeries,
    editedSeries,
    setEditedSeries,
    handleStartEditing,
    handleSaveSeries,
    isSaving,
    propagateAlways,
    setPropagateAlways
}: FitnessInfoProps) {

    const equipoTags = parseTags(selectedVideo.equipo || selectedVideo.equipment || selectedVideo.exercise?.equipment || selectedVideo.exercise?.equipo);
    const muscleTags = parseTags(selectedVideo.body_parts || selectedVideo.exercise?.body_parts);

    return (
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

            {/* TABS: Series | Técnica | Músculos | Equipamiento */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: 12, overflowX: 'auto' }}>
                    {[
                        (selectedVideo.detalle_series || selectedVideo.series) && selectedVideo.detalle_series !== 'Sin especificar' ? 'Series' : null,
                        'Técnica',
                        'Músculos',
                        'Equipamiento',
                    ].filter(Boolean).map((tab: any) => (
                        <button key={tab} onClick={() => setActiveExerciseTab(tab)} style={{ flexShrink: 0, padding: '12px 14px', background: 'transparent', border: 'none', borderBottom: activeExerciseTab === tab ? '2px solid #FF6A1A' : '2px solid transparent', color: activeExerciseTab === tab ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)', fontSize: 13, fontWeight: activeExerciseTab === tab ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s ease', whiteSpace: 'nowrap' }}>
                            {tab}
                        </button>
                    ))}
                </div>

                <div style={{ minHeight: 80 }}>
                    {activeExerciseTab === 'Series' && (
                        <FitnessSeriesList
                            selectedVideo={selectedVideo}
                            isEditingSeries={isEditingSeries}
                            setIsEditingSeries={setIsEditingSeries}
                            editedSeries={editedSeries}
                            setEditedSeries={setEditedSeries}
                            handleStartEditing={handleStartEditing}
                            handleSaveSeries={handleSaveSeries}
                            isSaving={isSaving}
                            propagateAlways={propagateAlways}
                            setPropagateAlways={setPropagateAlways}
                        />
                    )}
                    {(activeExerciseTab === 'Técnica' || !activeExerciseTab) && (
                        <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                            {selectedVideo.description || selectedVideo.descripcion || selectedVideo.exercise?.description || selectedVideo.exercise?.descripcion || 'Sin descripción disponible.'}
                        </p>
                    )}
                    {activeExerciseTab === 'Músculos' && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, minHeight: 40, alignContent: 'flex-start' }}>
                            {muscleTags.length > 0
                                ? muscleTags.map((tag, i) => (
                                    <span key={i} style={{ background: 'rgba(255,106,26,0.12)', borderRadius: 10, padding: '6px 14px', fontSize: 13, color: '#FF7939', border: '1px solid rgba(255,106,26,0.25)', fontWeight: 600 }}>{tag}</span>
                                ))
                                : <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontStyle: 'italic' }}>No especificado</span>
                            }
                        </div>
                    )}
                    {activeExerciseTab === 'Equipamiento' && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, minHeight: 40, alignContent: 'flex-start' }}>
                            {equipoTags.length > 0
                                ? equipoTags.map((tag, i) => (
                                    <span key={i} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 10, padding: '6px 14px', fontSize: 13, color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 500 }}>{tag}</span>
                                ))
                                : <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontStyle: 'italic' }}>No especificado</span>
                            }
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
