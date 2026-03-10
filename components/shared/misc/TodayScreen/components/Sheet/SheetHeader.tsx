import * as React from 'react';
import { Flame, Clock, Zap } from 'lucide-react';
import { getWeekNumber } from '../../utils/calendar-utils';

interface SheetHeaderProps {
    activities?: any[];
    isSheetExpanded: boolean;
    selectedDate: Date;
    goToToday?: () => void;
    handlePrevDay?: () => void;
    handleNextDay?: () => void;
    title?: string;
}

export function SheetHeader({
    activities = [],
    isSheetExpanded,
    selectedDate,
    goToToday,
    handlePrevDay,
    handleNextDay,
    title
}: SheetHeaderProps) {
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
                <div style={{ flexShrink: 0 }}>
                    <div style={{
                        fontSize: 'clamp(16px, 4.5vw, 20px)',
                        fontWeight: 800,
                        color: '#FFFFFF',
                        letterSpacing: '-0.02em'
                    }}>
                        {title || 'Actividades de hoy'}
                    </div>
                </div>

                {activities.length > 0 && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'clamp(6px, 2vw, 12px)',
                        flexShrink: 0
                    }}>
                        {activities.every(a => a.done) ? (
                            <div style={{
                                color: '#22C55E',
                                fontSize: 11,
                                fontWeight: 900,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                Completado
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Zap size={15} color="#FF7939" fill="#FF7939" />
                                    <span style={{ fontSize: 'clamp(12px, 3.5vw, 15px)', fontWeight: 900, color: '#FFFFFF' }}>
                                        {activities.filter(a => !a.done).length}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Flame size={15} color="#FF7939" fill="none" />
                                    <span style={{ fontSize: 'clamp(12px, 3.5vw, 15px)', fontWeight: 800, color: '#FFFFFF' }}>
                                        {activities.filter(a => !a.done).reduce((acc: number, curr: any) => acc + (curr.calorias || 0), 0)}
                                        <span style={{ fontSize: '0.85em', opacity: 0.8, marginLeft: 1 }}>kcal</span>
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Clock size={15} color="#9CA3AF" />
                                    <span style={{ fontSize: 'clamp(12px, 3.5vw, 15px)', fontWeight: 800, color: '#FFFFFF' }}>
                                        {activities.filter(a => !a.done).reduce((acc: number, curr: any) => acc + (curr.minutos || 0), 0)}'
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                )}
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
