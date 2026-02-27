import * as React from 'react';
import { Flame } from 'lucide-react';

interface EmptyStateProps {
    isDayLoading: boolean;
    activities: any[];
    nextAvailableActivity: any;
    goToNextActivity: () => void;
    snapToCollapsed: () => void;
    handleOpenSurveyModal: () => void;
    isExpired?: boolean;
}

export function EmptyState({
    isDayLoading,
    activities,
    nextAvailableActivity,
    goToNextActivity,
    snapToCollapsed,
    handleOpenSurveyModal,
    isExpired = false
}: EmptyStateProps) {
    if (isDayLoading) {
        if (activities.length > 0) return <div style={{ position: 'absolute', top: 10, right: 20, zIndex: 10 }}><Flame size={20} className="animate-pulse text-[#FF7939]" /></div>;
        else return (
            <div style={{ padding: '80px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, width: '100%', textAlign: 'center' }}>
                <div className="relative flex items-center justify-center w-[120px] h-[120px]">
                    <div className="absolute blur-[20px] opacity-60 scale-[1.5]">
                        <Flame size={60} color="#FF7939" fill="#FF7939" />
                    </div>
                    <div className="relative z-10">
                        <Flame size={80} color="#FF7939" fill="#FF7939" className="animate-soft-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    if (activities.length > 0) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, background: 'rgba(255, 121, 57, 0.1)', borderRadius: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32, fontSize: 32, fontWeight: 'bold' }}>
                <Flame size={40} color="#FF7939" fill="#FF7939" />
            </div>

            {nextAvailableActivity ? (
                <>
                    <h3 style={{ color: '#fff', fontSize: 24, fontWeight: 900, margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>No hay actividades</h3>
                    <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: 13, fontWeight: 700, margin: '0 0 32px 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Próxima sesión: {nextAvailableActivity.dayName} {nextAvailableActivity.date.split('-').reverse().slice(0, 2).join('/')}</p>
                    <button
                        onClick={goToNextActivity}
                        style={{
                            background: '#FF7939', color: '#fff', border: 'none',
                            padding: '18px 40px', borderRadius: 20, fontSize: 16, fontWeight: 800,
                            cursor: 'pointer', transition: 'all 0.2s ease',
                            boxShadow: '0 10px 30px rgba(255,121,57,0.3)',
                            textTransform: 'uppercase', letterSpacing: '0.05em'
                        }}
                    >
                        Ir a actividad
                    </button>
                </>
            ) : (
                <>
                    <h3 style={{ color: '#fff', fontSize: 22, fontWeight: 900, margin: '0 0 12px 0', textTransform: 'uppercase' }}>
                        {isExpired ? 'Programa finalizado' : 'No hay actividades hoy'}
                    </h3>
                    {isExpired && (
                        <button
                            onClick={() => { snapToCollapsed(); handleOpenSurveyModal(); }}
                            style={{
                                marginTop: 12, background: 'linear-gradient(135deg, #FF6A00 0%, #FF7939 100%)',
                                color: '#fff', border: 'none', padding: '16px 40px', borderRadius: 20,
                                fontSize: 15, fontWeight: 800, cursor: 'pointer',
                                boxShadow: '0 10px 30px rgba(255,121,57,0.3)',
                                textTransform: 'uppercase'
                            }}
                        >
                            Calificar Programa
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
