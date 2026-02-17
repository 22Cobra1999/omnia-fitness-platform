
import * as React from 'react';
import { Pencil, X } from 'lucide-react';
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
    propagateAlways: boolean;
    setPropagateAlways: (value: boolean) => void;
}

export function FitnessSeriesList({
    selectedVideo,
    isEditingSeries,
    setIsEditingSeries,
    editedSeries,
    setEditedSeries,
    handleStartEditing,
    handleSaveSeries,
    isSaving,
    propagateAlways,
    setPropagateAlways
}: FitnessSeriesListProps) {

    // Determine which series array to use
    // If not editing, parse from video. If editing, use local state.
    const displaySeries = isEditingSeries
        ? editedSeries
        : parseSeries(selectedVideo.detalle_series || selectedVideo.series);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', position: 'relative' }}>
            {/* Edit Button (Top Right) */}
            {!isEditingSeries && (
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
            )}

            {/* Editing Controls */}
            {isEditingSeries && (
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

            {/* List */}
            {displaySeries.map((s: any, idx: number) => (
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

            {/* Add Block Button */}
            {isEditingSeries && (
                <button
                    onClick={() => setEditedSeries([...editedSeries, { id: editedSeries.length + 1, reps: '10', kg: '0', sets: '1' }])}
                    style={{ marginTop: 10, color: '#FF6A1A', fontSize: 13, fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                    + Añadir bloque de series
                </button>
            )}
        </div>
    );
}
