import * as React from 'react';
import { Flame, Clock, Zap, UtensilsCrossed } from 'lucide-react';
import { getWeekNumber } from '../../utils/calendar-utils';
import { parseSeries } from '../../utils/parsers';

interface SheetHeaderProps {
    activities?: any[];
    isSheetExpanded: boolean;
    selectedDate: Date;
    goToToday?: () => void;
    handlePrevDay?: () => void;
    handleNextDay?: () => void;
    title?: string;
    programInfo?: any;
    enrollment?: any;
}

export function SheetHeader({
    activities = [],
    isSheetExpanded,
    selectedDate,
    goToToday,
    handlePrevDay,
    handleNextDay,
    title,
    programInfo,
    enrollment
}: SheetHeaderProps) {
    const isNutrition = [
        String(programInfo?.categoria).toLowerCase(),
        String(programInfo?.categoria_id).toLowerCase(),
        String(enrollment?.activity?.categoria).toLowerCase(),
        String(enrollment?.activity?.categoria_id).toLowerCase()
    ].some(s => s.includes('nutricion') || s === '7' || s === 'nutrición') || activities.some(a => 
        String(a.categoria).toLowerCase().includes('nutricion') || 
        String(a.categoria_id) === '7' ||
        String(a.category).toLowerCase().includes('nutrition')
    );

    return (
        <div style={{ padding: '8px 20px 0px' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: isSheetExpanded ? 16 : 8,
                marginTop: 0,
                flexWrap: 'nowrap',
                gap: 8
            }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                        fontSize: '11px',
                        fontWeight: 900,
                        color: 'rgba(255,255,255,0.4)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        flexShrink: 0
                    }}>
                        ACTIVIDADES
                    </div>

                    {activities.length > 0 && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginLeft: 'auto'
                        }}>
                            {/* KCAL Stat */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Flame size={10} color="#FF7939" fill="#FF7939" />
                                <span style={{ fontSize: '13px', fontVariantNumeric: 'tabular-nums', fontWeight: 900, color: '#FFFFFF' }}>
                                    {activities.reduce((acc: number, curr: any) => acc + Number(curr.calorias || 0), 0)}
                                    <span style={{ fontSize: '7px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginLeft: 2 }}>KCAL</span>
                                </span>
                            </div>
                            {/* PRS / PLATOS Stat */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                {isNutrition ? (
                                    <>
                                        <UtensilsCrossed size={10} color="#FF7939" fill="#FF7939" />
                                        <span style={{ fontSize: '13px', fontVariantNumeric: 'tabular-nums', fontWeight: 900, color: '#FFFFFF' }}>
                                            {activities.length}
                                            <span style={{ fontSize: '7px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginLeft: 2 }}>PLATOS</span>
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <Zap size={10} color="#FF7939" fill="#FF7939" />
                                        <span style={{ fontSize: '13px', fontVariantNumeric: 'tabular-nums', fontWeight: 900, color: '#FFFFFF' }}>
                                            {activities.reduce((acc: number, curr: any) => {
                                                const parsed = parseSeries(curr.detalle_series || curr.series);
                                                return acc + parsed.reduce((as: number, cs: any) => as + (Number(cs.sets) || 1), 0);
                                            }, 0)}
                                            <span style={{ fontSize: '7px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginLeft: 2 }}>PRS</span>
                                        </span>
                                    </>
                                )}
                            </div>
                            {/* MIN Stat */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Clock size={10} color="#FFFFFF" strokeWidth={2.5} />
                                <span style={{ fontSize: '13px', fontVariantNumeric: 'tabular-nums', fontWeight: 900, color: '#FFFFFF' }}>
                                    {activities.reduce((acc: number, curr: any) => acc + Number(curr.minutos || 0), 0)}
                                    <span style={{ fontSize: '7px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginLeft: 2 }}>MIN</span>
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isSheetExpanded && goToToday && handlePrevDay && handleNextDay && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
                    <button onClick={goToToday} style={{ fontSize: 12, padding: '8px 12px', background: 'rgba(255, 106, 0, 0.15)', border: '1px solid rgba(255, 106, 0, 0.3)', borderRadius: 12, color: '#FF6A00', cursor: 'pointer', transition: 'all 0.2s ease', fontWeight: 600 }}>Hoy</button>
                    <button onClick={handlePrevDay} style={{ fontSize: 12, padding: '8px 12px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: 12, color: '#fff', cursor: 'pointer', transition: 'all 0.2s ease' }}>‹</button>
                    <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>
                        {selectedDate.getDate()} de {selectedDate.toLocaleDateString('es-ES', { month: 'long' })}
                    </span>
                    <button onClick={handleNextDay} style={{ fontSize: 12, padding: '8px 12px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: 12, color: '#fff', cursor: 'pointer', transition: 'all 0.2s ease' }}>›</button>
                </div>
            )}
        </div>
    );
}
