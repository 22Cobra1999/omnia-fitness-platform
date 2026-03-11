
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

    const displaySeries = isEditingSeries
        ? editedSeries
        : parseSeries(selectedVideo.detalle_series || selectedVideo.series);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', position: 'relative' }}>
            {/* Edit Button moved to FitnessInfo.tsx */}

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
                    padding: '16px 8px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    borderRadius: 20,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    width: '100%',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Lightning Toggle (Absolute left when editing) */}
                    {isEditingSeries && (
                        <button
                            onClick={() => {
                                const copy = [...editedSeries];
                                copy[idx].propagate = !copy[idx].propagate;
                                setEditedSeries(copy);
                            }}
                            style={{
                                position: 'absolute', left: 12,
                                width: 28, height: 28, borderRadius: 8,
                                background: s.propagate ? 'rgba(255, 121, 57, 0.2)' : 'rgba(255,255,255,0.05)',
                                border: s.propagate ? '1px solid #FF7939' : '1px solid rgba(255,255,255,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                color: s.propagate ? '#FF7939' : 'rgba(255,255,255,0.2)'
                            }}
                        >
                            <Zap size={14} fill={s.propagate ? "currentColor" : "none"} />
                        </button>
                    )}

                    {/* Centered Columns Container */}
                    <div style={{ display: 'flex', flex: 1, justifyContent: 'space-evenly', alignItems: 'center', padding: isEditingSeries ? '0 40px' : '0 10px' }}>
                        
                        {/* Series Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                            {isEditingSeries ? (
                                <input
                                    type="number"
                                    value={s.sets}
                                    onChange={(e) => {
                                        const copy = [...editedSeries];
                                        copy[idx].sets = e.target.value;
                                        setEditedSeries(copy);
                                    }}
                                    style={{ width: 36, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 15, fontWeight: 800, textAlign: 'center', padding: '4px 0' }}
                                />
                            ) : (
                                <span style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 900 }}>{s.sets}</span>
                            )}
                            <div style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', marginTop: 4, letterSpacing: '0.1em' }}>Series</div>
                        </div>

                        {/* Reps Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                            {isEditingSeries ? (
                                <input
                                    type="text"
                                    value={s.reps}
                                    onChange={(e) => {
                                        const copy = [...editedSeries];
                                        copy[idx].reps = e.target.value;
                                        setEditedSeries(copy);
                                    }}
                                    style={{ width: 40, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 15, fontWeight: 800, textAlign: 'center', padding: '4px 0' }}
                                />
                            ) : (
                                <div style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 900 }}>{s.reps || '-'}</div>
                            )}
                            <div style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', marginTop: 4, letterSpacing: '0.1em' }}>Reps</div>
                        </div>

                        {/* Peso Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
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
                                        style={{ width: 44, background: 'rgba(255,121,57,0.15)', border: '1.5px solid rgba(255,121,57,0.3)', borderRadius: 8, color: '#FF7939', fontSize: 16, fontWeight: 900, textAlign: 'center', padding: '4px 2px' }}
                                    />
                                    <span style={{ color: '#FF7939', fontSize: 12, fontWeight: 900 }}>kg</span>
                                </div>
                            ) : (
                                <div style={{ color: '#FF7939', fontSize: 18, fontWeight: 900 }}>{s.kg ? `${s.kg}kg` : '-'}</div>
                            )}
                            <div style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>Peso</div>
                        </div>
                    </div>

                    {/* Delete Button (Absolute right) */}
                    {isEditingSeries && (
                        <button
                            onClick={() => {
                                if (confirm('¿Eliminar este bloque de series?')) {
                                    const copy = [...editedSeries];
                                    copy.splice(idx, 1);
                                    setEditedSeries(copy);
                                }
                            }}
                            style={{ 
                                position: 'absolute', right: 12,
                                background: 'rgba(255,0,0,0.1)', border: 'none', color: '#ff4444', 
                                padding: '6px', borderRadius: 8, cursor: 'pointer' 
                            }}
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            ))}

            {/* Add Block Button */}
            {isEditingSeries && (
                <button
                    onClick={() => setEditedSeries([...editedSeries, { id: editedSeries.length + 1, reps: '10', kg: '0', sets: '1', propagate: true }])}
                    style={{
                        marginTop: 12, display: 'flex', alignItems: 'center', gap: 8,
                        color: '#FF7939', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                        background: 'rgba(255,121,57,0.1)', padding: '10px 16px', borderRadius: 12,
                        border: '1px dashed rgba(255,121,57,0.4)', cursor: 'pointer', transition: 'all 0.2s ease',
                        justifyContent: 'center'
                    }}
                >
                    + Añadir bloque de series
                </button>
            )}
        </div>
    );
}
