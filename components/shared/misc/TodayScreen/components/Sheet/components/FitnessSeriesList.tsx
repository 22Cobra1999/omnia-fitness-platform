
import * as React from 'react';
import { Pencil, X, Zap, Check, Trash2 } from 'lucide-react';
import { parseSeries } from '../../../utils/parsers';

interface FitnessSeriesListProps {
    selectedVideo: any;
    isEditingSeries: boolean;
    setIsEditingSeries: (value: boolean) => void;
    editedSeries: any[];
    setEditedSeries: (series: any[]) => void;
    handleStartEditing: () => void;
    handleSaveSeries: () => void;
    isSaving: boolean;
}

export function FitnessSeriesList({
    selectedVideo,
    isEditingSeries,
    setIsEditingSeries,
    editedSeries,
    setEditedSeries,
    handleStartEditing,
    handleSaveSeries,
    isSaving
}: FitnessSeriesListProps) {

    // Determine which series array to use
    // If not editing, parse from video. If editing, use local state.
    const displaySeries = isEditingSeries
        ? editedSeries
        : parseSeries(selectedVideo.detalle_series || selectedVideo.series);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', position: 'relative' }}>
            {/* Edit Button - Fixed in corner */}
            {!selectedVideo.isPast && (
                <div style={{ position: 'absolute', top: -55, right: 0, zIndex: 20 }}>
                    {!isEditingSeries ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleStartEditing(); }}
                            style={{
                                width: 44, height: 44, borderRadius: 14,
                                background: 'rgba(255, 121, 57, 0.15)', backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 121, 57, 0.25)', color: '#FF7939',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                transition: 'all 0.2s ease', boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
                            }}
                        >
                            <Pencil size={20} />
                        </button>
                    ) : (
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                onClick={() => setIsEditingSeries(false)}
                                style={{
                                    width: 44, height: 44, borderRadius: 14,
                                    background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', cursor: 'pointer', backdropFilter: 'blur(10px)'
                                }}
                            >
                                <X size={20} />
                            </button>
                            <button
                                onClick={handleSaveSeries}
                                disabled={isSaving}
                                style={{
                                    width: 44, height: 44, borderRadius: 14,
                                    background: '#FF7939', border: 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', cursor: 'pointer', opacity: isSaving ? 0.7 : 1,
                                    boxShadow: '0 8px 20px rgba(255,121,57,0.3)'
                                }}
                            >
                                {isSaving ? <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> : <Check size={20} strokeWidth={3} />}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Explanatory Phrase for Apply Always */}
            {isEditingSeries && (
                <div style={{ padding: '0 4px', marginBottom: 4 }}>
                    <p style={{ color: '#FF7939', fontSize: 13, fontWeight: 700, fontStyle: 'italic', margin: 0, opacity: 0.9 }}>
                        Activa el rayo para que tus nuevos récords se mantengan en los próximos días de este ejercicio.
                    </p>
                </div>
            )}

            {/* List */}
            {displaySeries.map((s: any, idx: number) => (
                <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '18px 24px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    borderRadius: 24,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    width: '100%',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                    transition: 'all 0.3s ease'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                        {/* Lightning Toggle */}
                        {isEditingSeries && (
                            <button
                                onClick={() => {
                                    const copy = [...editedSeries];
                                    copy[idx].propagate = !copy[idx].propagate;
                                    setEditedSeries(copy);
                                }}
                                style={{
                                    width: 32, height: 32, borderRadius: 10,
                                    background: s.propagate ? 'rgba(255, 121, 57, 0.2)' : 'rgba(255,255,255,0.05)',
                                    border: s.propagate ? '1.5px solid #FF7939' : '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                    transition: 'all 0.2s ease', color: s.propagate ? '#FF7939' : 'rgba(255,255,255,0.2)'
                                }}
                            >
                                <Zap size={16} fill={s.propagate ? "currentColor" : "none"} />
                            </button>
                        )}

                        {/* Series Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            {isEditingSeries ? (
                                <input
                                    type="number"
                                    value={s.sets}
                                    onChange={(e) => {
                                        const copy = [...editedSeries];
                                        copy[idx].sets = e.target.value;
                                        setEditedSeries(copy);
                                    }}
                                    style={{ width: 44, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 18, fontWeight: 800, textAlign: 'center', padding: '6px 0' }}
                                />
                            ) : (
                                <span style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 900 }}>{s.sets}</span>
                            )}
                            <div style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', marginTop: 4, letterSpacing: '0.1em' }}>Series</div>
                        </div>

                        {/* Reps Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginLeft: 8 }}>
                            {isEditingSeries ? (
                                <input
                                    type="text"
                                    value={s.reps}
                                    onChange={(e) => {
                                        const copy = [...editedSeries];
                                        copy[idx].reps = e.target.value;
                                        setEditedSeries(copy);
                                    }}
                                    style={{ width: 54, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 18, fontWeight: 800, textAlign: 'center', padding: '6px 0' }}
                                />
                            ) : (
                                <div style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 900 }}>{s.reps || '-'}</div>
                            )}
                            <div style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', marginTop: 4, letterSpacing: '0.1em' }}>Reps</div>
                        </div>
                    </div>

                    {/* Peso Column (Right Aligned) */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        {isEditingSeries ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <input
                                    type="text"
                                    value={s.kg}
                                    onChange={(e) => {
                                        const copy = [...editedSeries];
                                        copy[idx].kg = e.target.value;
                                        setEditedSeries(copy);
                                    }}
                                    style={{ width: 60, background: 'rgba(255,121,57,0.15)', border: '1.5px solid rgba(255,121,57,0.3)', borderRadius: 10, color: '#FF7939', fontSize: 20, fontWeight: 900, textAlign: 'center', padding: '8px 4px' }}
                                />
                                <span style={{ color: '#FF7939', fontSize: 16, fontWeight: 900 }}>kg</span>
                            </div>
                        ) : (
                            <div style={{ color: '#FF7939', fontSize: 24, fontWeight: 900 }}>{s.kg ? `${s.kg}kg` : '-'}</div>
                        )}
                        <div style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Peso Máximo</div>
                    </div>

                    {/* Actions Column */}
                    {isEditingSeries && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginLeft: 20 }}>
                            <button
                                onClick={() => {
                                    if (confirm('¿Eliminar este bloque de series?')) {
                                        const copy = [...editedSeries];
                                        copy.splice(idx, 1);
                                        setEditedSeries(copy);
                                    }
                                }}
                                style={{ background: 'rgba(255,0,0,0.1)', border: 'none', color: '#ff4444', padding: '8px', borderRadius: 10, cursor: 'pointer' }}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    )}
                </div>
            ))}

            {/* Add Block Button */}
            {isEditingSeries && (
                <button
                    onClick={() => setEditedSeries([...editedSeries, { id: editedSeries.length + 1, reps: '10', kg: '0', sets: '1', propagate: true }])}
                    style={{
                        marginTop: 12, display: 'flex', alignItems: 'center', gap: 8,
                        color: '#FF7939', fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                        background: 'rgba(255,121,57,0.1)', padding: '12px 20px', borderRadius: 16,
                        border: '1px dashed rgba(255,121,57,0.4)', cursor: 'pointer', transition: 'all 0.2s ease'
                    }}
                >
                    + Añadir bloque de series
                </button>
            )}
        </div>
    );
}
