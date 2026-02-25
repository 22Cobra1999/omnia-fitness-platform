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
        <div style={{ padding: '0px 20px 0px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255, 255, 255, 0.6)' }}>
                        {title || 'Actividades de hoy'}
                    </div>
                </div>
                {activities.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255, 255, 255, 0.03)', padding: '6px 12px', borderRadius: 20, border: '1px solid #FF7939', backdropFilter: 'blur(10px)' }}>
                            <Zap size={14} color="#FF7939" />
                            <span style={{ fontSize: 13, fontWeight: 900, color: '#FFFFFF' }}>
                                {activities.length}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255, 121, 57, 0.05)', padding: '6px 12px', borderRadius: 20, border: '1px solid #FF7939', backdropFilter: 'blur(10px)' }}>
                            <Flame size={14} color="#FF7939" />
                            <span style={{ fontSize: 12, fontWeight: 800, color: '#FFFFFF' }}>
                                {(activities || []).reduce((acc: number, curr: any) => acc + (curr.calorias || 0), 0)} kcal
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255, 255, 255, 0.05)', padding: '6px 12px', borderRadius: 20, border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
                            <Clock size={15} color="#9CA3AF" />
                            <span style={{ fontSize: 12, fontWeight: 800, color: '#FFFFFF' }}>
                                {(activities || []).reduce((acc: number, curr: any) => acc + (curr.minutos || 0), 0)}'
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
