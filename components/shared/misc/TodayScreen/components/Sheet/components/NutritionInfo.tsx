
import * as React from 'react';
import { Flame, ShoppingCart } from 'lucide-react';

interface NutritionInfoProps {
    selectedVideo: any;
    activeMealTab: 'Ingredientes' | 'Instrucciones';
    setActiveMealTab: (tab: 'Ingredientes' | 'Instrucciones') => void;
}

export function NutritionInfo({
    selectedVideo,
    activeMealTab,
    setActiveMealTab
}: NutritionInfoProps) {
    return (
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
    );
}
