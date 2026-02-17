
import * as React from 'react';
import { Clock, Flame, Zap } from 'lucide-react';
import { FitnessSeriesList } from './FitnessSeriesList';

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
    );
}
