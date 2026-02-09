import * as React from 'react';
import { Flame } from 'lucide-react';

interface EmptyStateProps {
    isDayLoading: boolean;
    activities: any[];
    nextAvailableActivity: any;
    goToNextActivity: () => void;
    snapToCollapsed: () => void;
    handleOpenSurveyModal: () => void;
}

export function EmptyState({
    isDayLoading,
    activities,
    nextAvailableActivity,
    goToNextActivity,
    snapToCollapsed,
    handleOpenSurveyModal
}: EmptyStateProps) {
    if (isDayLoading) {
        if (activities.length > 0) return <div style={{ position: 'absolute', top: 10, right: 20, zIndex: 10 }}><Flame size={20} className="animate-pulse text-[#FF7939]" /></div>;
        else return <div style={{ padding: '60px 20px', display: 'flex', justifyContent: 'center', width: '100%' }}><Flame size={40} className="animate-pulse text-[#FF7939]" /></div>
    }

    if (activities.length > 0) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, background: 'linear-gradient(135deg, #FF6A00 0%, #FF7939 100%)', borderRadius: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32, fontSize: 32, fontWeight: 'bold', color: '#000' }}>📅</div>

            {nextAvailableActivity ? (
                <>
                    <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 600, margin: '0 0 16px 0' }}>No hay actividades para este día</h3>
                    <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 14, margin: '0 0 32px 0' }}>It's rest day! Or... {nextAvailableActivity.date}</p>
                    <button onClick={goToNextActivity} style={{ background: 'linear-gradient(135deg, #FF6A00 0%, #FF7939 100%)', color: '#000', border: 'none', padding: '16px 32px', borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease' }}>Ir a actividad</button>
                </>
            ) : (
                <>
                    <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 600, margin: '0 0 32px 0' }}>Programa finalizado</h3>
                    <button onClick={() => { snapToCollapsed(); handleOpenSurveyModal(); }} style={{ marginTop: 8, background: 'linear-gradient(135deg, #FF6A00 0%, #FF7939 100%)', color: '#000', border: 'none', padding: '12px 32px', borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Calificar Programa</button>
                </>
            )}
        </div>
    );
}
