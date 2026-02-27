
import * as React from 'react';
import { Clock, Flame, Zap } from 'lucide-react';
import { FitnessSeriesList } from './FitnessSeriesList';
import { parseTags } from '../../../utils/parsers';

interface FitnessInfoProps {
    selectedVideo: any;
    activeExerciseTab: string;
    setActiveExerciseTab: (tab: string) => void;
    isEditingSeries: boolean;
    setIsEditingSeries: (value: boolean) => void;
    editedSeries: any[];
    setEditedSeries: (series: any[]) => void;
    handleStartEditing: () => void;
    handleSaveSeries: () => void;
    isSaving: boolean;
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
    isSaving
}: FitnessInfoProps) {

    const equipoTags = parseTags(selectedVideo.equipo || selectedVideo.equipment || selectedVideo.exercise?.equipment || selectedVideo.exercise?.equipo);
    const muscleTags = parseTags(selectedVideo.body_parts || selectedVideo.exercise?.body_parts);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', marginBottom: 30 }}>
            {/* Horizontal Stats Bar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 20,
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 24,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
                {(selectedVideo.duration != null || selectedVideo.minutos != null) && (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Clock size={20} color="rgba(255, 255, 255, 0.7)" />
                            <span style={{ color: 'rgba(255, 255, 255, 1)', fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em' }}>{selectedVideo.duration || selectedVideo.minutos} min</span>
                        </div>
                        {(selectedVideo.calorias != null || selectedVideo.type || selectedVideo.tipo) && <div style={{ width: 1, height: 28, background: 'rgba(255, 255, 255, 0.15)' }}></div>}
                    </>
                )}
                {selectedVideo.calorias != null && (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Flame size={20} color="#FF7939" fill="#FF7939" />
                            <span style={{ color: 'rgba(255, 255, 255, 1)', fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em' }}>~{selectedVideo.calorias} kcal</span>
                        </div>
                        {(selectedVideo.type || selectedVideo.tipo) && <div style={{ width: 1, height: 28, background: 'rgba(255, 255, 255, 0.15)' }}></div>}
                    </>
                )}
                {(selectedVideo.type || selectedVideo.tipo) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Zap size={20} color="#FF7939" />
                        <span style={{ color: 'rgba(255, 255, 255, 1)', fontSize: 17, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{selectedVideo.type || selectedVideo.tipo}</span>
                    </div>
                )}
            </div>

            {/* TABS: Series | Técnica | Músculos | Equipamiento */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: 16, overflowX: 'auto', gap: 8, justifyContent: 'center' }} className="hide-scrollbar">
                    {[
                        (selectedVideo.detalle_series || selectedVideo.series) && selectedVideo.detalle_series !== 'Sin especificar' ? 'Series' : null,
                        'Técnica',
                        'Músculos',
                        'Equipamiento',
                    ].filter(Boolean).map((tab: any) => (
                        <button
                            key={tab}
                            onClick={() => setActiveExerciseTab(tab)}
                            style={{
                                flexShrink: 0, padding: '16px 24px', background: 'transparent', border: 'none',
                                borderBottom: activeExerciseTab === tab ? '4px solid #FF7939' : '4px solid transparent',
                                color: activeExerciseTab === tab ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)',
                                fontSize: 18, fontWeight: activeExerciseTab === tab ? 900 : 600,
                                cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', whiteSpace: 'nowrap',
                                letterSpacing: '0.04em', textTransform: 'uppercase'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div style={{ padding: '0 8px' }}>
                    {activeExerciseTab === 'Series' && (
                        <div style={{ marginTop: 10 }}>
                            <FitnessSeriesList
                                selectedVideo={selectedVideo}
                                isEditingSeries={isEditingSeries}
                                setIsEditingSeries={setIsEditingSeries}
                                editedSeries={editedSeries}
                                setEditedSeries={setEditedSeries}
                                handleStartEditing={handleStartEditing}
                                handleSaveSeries={handleSaveSeries}
                                isSaving={isSaving}
                            />
                        </div>
                    )}

                    {activeExerciseTab === 'Técnica' && (
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(10px)',
                            borderRadius: 24, padding: 24, border: '1px solid rgba(255, 255, 255, 0.08)',
                            marginTop: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                        }}>
                            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 16, lineHeight: 1.6, fontWeight: 500 }}>
                                {selectedVideo.description || 'Sin descripción técnica disponible.'}
                            </p>
                        </div>
                    )}

                    {activeExerciseTab === 'Músculos' && (
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(10px)',
                            borderRadius: 24, padding: 24, border: '1px solid rgba(255, 255, 255, 0.08)',
                            marginTop: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                        }}>
                            {muscleTags.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                                    {muscleTags.map((tag: string) => (
                                        <span key={tag} style={{
                                            padding: '8px 16px', background: 'rgba(255, 121, 57, 0.1)',
                                            color: '#FF7939', borderRadius: 12, fontSize: 14, fontWeight: 800,
                                            border: '1px solid rgba(255, 121, 57, 0.2)', textTransform: 'uppercase', letterSpacing: '0.05em'
                                        }}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: 'rgba(255, 255, 255, 0.4)', textAlign: 'center', fontSize: 15, fontWeight: 600 }}>No especificado</p>
                            )}
                        </div>
                    )}

                    {activeExerciseTab === 'Equipamiento' && (
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(10px)',
                            borderRadius: 24, padding: 24, border: '1px solid rgba(255, 255, 255, 0.08)',
                            marginTop: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                        }}>
                            {equipoTags.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                                    {equipoTags.map((tag: string) => (
                                        <span key={tag} style={{
                                            padding: '8px 16px', background: 'rgba(255, 255, 255, 0.05)',
                                            color: '#fff', borderRadius: 12, fontSize: 14, fontWeight: 800,
                                            border: '1px solid rgba(255, 255, 255, 0.1)', textTransform: 'uppercase', letterSpacing: '0.05em'
                                        }}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: 'rgba(255, 255, 255, 0.4)', textAlign: 'center', fontSize: 15, fontWeight: 600 }}>No especificado</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
