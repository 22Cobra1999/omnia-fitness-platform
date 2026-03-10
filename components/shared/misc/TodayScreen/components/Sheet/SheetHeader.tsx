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
                        fontSize: 'clamp(11px, 3.5vw, 13px)',
                        fontWeight: 900,
                        color: 'rgba(255,255,255,0.7)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
                    }}>
                        ACTIVIDADES
                    </div>
                </div>

                {activities.length > 0 && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'clamp(6px, 2vw, 12px)',
                        flexShrink: 0
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Flame size={14} color="#FF7939" fill="#FF7939" />
                            <span style={{ fontSize: 'clamp(13px, 4vw, 15px)', fontWeight: 900, color: '#FFFFFF' }}>
                                {activities.reduce((acc: number, curr: any) => acc + Number(curr.calorias || 0), 0) - activities.filter(a => a.done).reduce((acc: number, curr: any) => acc + Number(curr.calorias || 0), 0)}
                                <span style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginLeft: 2, textTransform: 'uppercase' }}>KCAL</span>
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={14} color="#FFFFFF" strokeWidth={2.5} />
                            <span style={{ fontSize: 'clamp(13px, 4vw, 15px)', fontWeight: 900, color: '#FFFFFF' }}>
                                {activities.reduce((acc: number, curr: any) => acc + Number(curr.minutos || 0), 0) - activities.filter(a => a.done).reduce((acc: number, curr: any) => acc + Number(curr.minutos || 0), 0)}
                                <span style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginLeft: 2, textTransform: 'uppercase' }}>MIN</span>
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Zap size={14} color="#FF7939" fill="#FF7939" />
                            <span style={{ fontSize: 'clamp(13px, 4vw, 15px)', fontWeight: 900, color: '#FFFFFF' }}>
                                {activities.length - activities.filter(a => a.done).length}
                                <span style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginLeft: 2, textTransform: 'uppercase' }}>EJS</span>
                            </span>
                        </div>
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
