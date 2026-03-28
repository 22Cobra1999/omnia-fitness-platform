import * as React from 'react';
import { Flame, ShoppingBasket, Utensils, Info, Clock } from 'lucide-react';

interface NutritionInfoProps {
    selectedVideo: any;
    activeMealTab: 'Macros' | 'Ingredientes' | 'Receta';
    setActiveMealTab: (tab: 'Macros' | 'Ingredientes' | 'Receta') => void;
}

export function NutritionInfo({
    selectedVideo,
    activeMealTab,
    setActiveMealTab
}: NutritionInfoProps) {
    // Determine initial tab if not set or if current tab is invalid for new props
    React.useEffect(() => {
        if (!activeMealTab || (activeMealTab as any) === 'Instrucciones') {
            setActiveMealTab('Macros');
        }
    }, []);

    const ingredients = React.useMemo(() => {
        let list: any[] = [];
        let ing = selectedVideo.ingredientes || selectedVideo.ingredients;
        
        // Try to parse if it's a JSON string
        if (typeof ing === 'string' && (ing.trim().startsWith('[') || ing.trim().startsWith('{'))) {
            try {
                ing = JSON.parse(ing);
            } catch (e) {
                console.error('Error parsing ingredients JSON:', e);
            }
        }

        if (Array.isArray(ing)) {
            list = ing.map(i => {
                if (typeof i === 'object' && i !== null) {
                    return `${i.nombre || i.name || ''} ${i.cantidad || i.amount || ''} ${i.unidad || i.unit || ''}`.trim();
                }
                return String(i);
            });
        } else if (typeof ing === 'string') {
            // Support both semicolon and newlines as separators
            list = ing.split(/[;\n]/).map(s => s.trim()).filter(Boolean);
        }
        return list;
    }, [selectedVideo.ingredientes, selectedVideo.ingredients]);

    const steps = React.useMemo(() => {
        const receta = selectedVideo.receta || '';
        if (!receta) return [];
        // Support both semicolon and newlines as separators for steps
        return receta.split(/[;\n]/).map((p: string) => p.trim()).filter(Boolean);
    }, [selectedVideo.receta]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, width: '100%' }}>
            {/* Metrics Pill (Min & Kcal) */}
            <div style={{ 
                margin: '10px auto 25px', 
                padding: '10px 24px', 
                background: 'rgba(255, 255, 255, 0.03)', 
                backdropFilter: 'blur(30px)', 
                borderRadius: 100, 
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex', 
                alignItems: 'center', 
                gap: 20, 
                boxShadow: '0 10px 40px rgba(0,0,0,0.4)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={14} className="text-white/30" />
                    <span style={{ color: '#fff', fontSize: 13, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                        {selectedVideo.minutos || 0} MIN
                    </span>
                </div>
                <div style={{ width: 1, height: 14, background: 'rgba(255, 255, 255, 0.1)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Flame size={14} className="text-[#FF7939]" fill="currentColor" />
                    <span style={{ color: '#fff', fontSize: 13, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                        ~{selectedVideo.calorias || 0} KCAL
                    </span>
                </div>
            </div>

            {/* Premium Tabs */}
            <div style={{ 
                display: 'flex', 
                background: 'rgba(0,0,0,0.4)', 
                padding: 4, 
                borderRadius: 16, 
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                marginBottom: 24,
                margin: '0 4px 24px'
            }}>
                {(['Macros', 'Ingredientes', 'Receta'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveMealTab(tab)}
                        style={{
                            flex: 1,
                            padding: '10px 0',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            fontStyle: 'italic',
                            letterSpacing: '0.05em',
                            transition: 'all 0.3s ease',
                            background: activeMealTab === tab ? (tab === 'Macros' ? '#FF7939' : 'rgba(255,255,255,0.1)') : 'transparent',
                            color: activeMealTab === tab ? '#fff' : 'rgba(255,255,255,0.4)',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: activeMealTab === tab ? '0 10px 25px rgba(0,0,0,0.4)' : 'none'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content Container */}
            <div style={{ minHeight: 300, transition: 'all 0.4s ease' }}>
                {activeMealTab === 'Macros' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.5s ease' }}>
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 16, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', color: '#fff' }}>Macros</span>
                                <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
                                    {Number(selectedVideo.proteinas || 0) > 30 ? 'ALTO EN PROT' : 'BALANCEADO'}
                                </span>
                            </div>

                            {/* Macro Bars */}
                            <div style={{ display: 'flex', gap: 6, height: 8 }}>
                                <div style={{ flex: 1, background: '#FF7939', borderRadius: 99, boxShadow: '0 0 15px rgba(255,121,57,0.3)' }} />
                                <div style={{ flex: 1, background: '#F5D5AE', borderRadius: 99, opacity: 0.8 }} />
                                <div style={{ flex: 1, background: '#93C5FD', borderRadius: 99, opacity: 0.8 }} />
                            </div>

                            {/* Values */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ display: 'block', color: '#fff', fontSize: 20, fontStyle: 'italic', fontWeight: 900 }}>{selectedVideo.proteinas || 0}g</span>
                                    <span style={{ fontSize: 9, color: '#FF7939', fontWeight: 900, textTransform: 'uppercase', marginTop: 4, display: 'block' }}>Prot</span>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ display: 'block', color: '#fff', fontSize: 20, fontStyle: 'italic', fontWeight: 900 }}>{selectedVideo.grasas || 0}g</span>
                                    <span style={{ fontSize: 9, color: '#F5D5AE', fontWeight: 900, textTransform: 'uppercase', marginTop: 4, display: 'block' }}>Grasas</span>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ display: 'block', color: '#fff', fontSize: 20, fontStyle: 'italic', fontWeight: 900 }}>{selectedVideo.carbohidratos || 0}g</span>
                                    <span style={{ fontSize: 9, color: '#93C5FD', fontWeight: 900, textTransform: 'uppercase', marginTop: 4, display: 'block' }}>Carbs</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeMealTab === 'Ingredientes' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeIn 0.5s ease' }}>
                        {ingredients.length > 0 ? (
                            ingredients.map((ing, idx) => (
                                <div key={idx} style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 16, 
                                    background: 'rgba(255,255,255,0.03)', 
                                    padding: '14px 18px', 
                                    borderRadius: 16, 
                                    border: '1px solid rgba(255,255,255,0.05)' 
                                }}>
                                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255, 121, 57, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ShoppingBasket size={14} className="text-[#FF7939]" />
                                    </div>
                                    <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 700, fontStyle: 'italic', textTransform: 'uppercase' }}>{ing}</span>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.3 }}>
                                <Info size={32} style={{ margin: '0 auto 12px' }} />
                                <p style={{ fontSize: 12, fontWeight: 600 }}>Sin ingredientes registrados.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeMealTab === 'Receta' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.5s ease' }}>
                        {steps.length > 0 ? (
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                                {steps.map((step: string, idx: number) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                        <div style={{ 
                                            flexShrink: 0, 
                                            width: 24, 
                                            height: 24, 
                                            borderRadius: 99, 
                                            background: 'rgba(255, 121, 57, 0.2)', 
                                            border: '1px solid rgba(255, 121, 57, 0.3)', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            marginTop: 2
                                        }}>
                                            <span style={{ fontSize: 10, fontWeight: 900, color: '#FF7939', fontStyle: 'italic' }}>{idx + 1}</span>
                                        </div>
                                        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 500, lineHeight: 1.6 }}>{step}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.3 }}>
                                <Utensils size={32} style={{ margin: '0 auto 12px' }} />
                                <p style={{ fontSize: 12, fontWeight: 600 }}>Sin instrucciones de receta.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
