import * as React from 'react';
import { Flame } from 'lucide-react';
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
                <div style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255, 255, 255, 0.6)' }}>
                    {title || 'Actividades de hoy'}
                </div>
                {activities.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255, 121, 57, 0.2)', padding: '6px 12px', borderRadius: 20, border: '1px solid rgba(255, 121, 57, 0.3)', marginLeft: 32, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
                        <Flame size={18} color="#FF7939" fill="none" strokeWidth={2} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>{activities.length}</span>
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
