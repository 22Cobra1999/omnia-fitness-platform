import * as React from 'react';
import { CalendarClock, ChevronLeft, Calendar, FileText, Star } from 'lucide-react';

interface UniversalHeroProps {
    programInfo: any;
    enrollment: any;
    meetCreditsAvailable: number | null;
    hasUserSubmittedSurvey: boolean;
    onScheduleMeet: () => void;
    onOpenSurvey: () => void;
    onBack?: () => void;
    isExpired?: boolean;
    isMobile?: boolean;
}

export function UniversalHero({
    programInfo,
    enrollment,
    meetCreditsAvailable,
    hasUserSubmittedSurvey,
    onScheduleMeet,
    onOpenSurvey,
    onBack,
    isExpired = false,
    isMobile = false
}: UniversalHeroProps) {
    const [descriptionExpanded, setDescriptionExpanded] = React.useState(false);

    // Helper para objetivos 
    const objetivos = React.useMemo(() => {
        const src: any = enrollment?.activity || programInfo || null
        let list: any = src?.objetivos
        if (!list || !Array.isArray(list)) list = []
        return (Array.isArray(list) ? list : [])
            .map((o: any) => String(o ?? '').trim())
            .filter((o: string) => o && o.length > 2);
    }, [enrollment?.activity, programInfo]);

    // Calcular fecha real del plan (no de expiración de suscripción)
    const programEndDate = React.useMemo(() => {
        if (!enrollment?.start_date) return null;
        const totalWeeks = programInfo?.semanas_totales || programInfo?.duration_weeks || 4;
        const startDate = new Date(enrollment.start_date + 'T12:00:00'); // Use mid-day to avoid TZ shifts
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + (totalWeeks * 7));
        return endDate;
    }, [enrollment?.start_date, programInfo]);

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(10px) saturate(150%)',
            WebkitBackdropFilter: 'blur(10px) saturate(150%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
            padding: isMobile ? '12px 20px 16px' : '20px 32px 20px',
            minHeight: '18vh', 
            marginBottom: 6,
            marginTop: -44,
            marginLeft: '-24px',
            marginRight: '-24px',
            width: 'calc(100% + 48px)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        }}>
            {/* Header row: Back / Badge / Rate */}
            <div style={{
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%'
            }}>
                {onBack ? (
                    <button onClick={onBack} style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                        <ChevronLeft size={20} />
                    </button>
                ) : <div />}

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isExpired ? (
                        <>
                            {!hasUserSubmittedSurvey && (
                                <button onClick={onOpenSurvey} style={{ padding: '4px 12px', background: 'rgba(255, 106, 0, 0.2)', border: '1px solid #FF6A00', borderRadius: 12, color: '#FF6A00', fontSize: 11, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase' }}>
                                    <Star size={12} fill="#FF6A00" className="inline mr-1" /> Calificar
                                </button>
                            )}
                        </>
                    ) : (
                        <div style={{ padding: '4px 12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 12, color: 'rgba(255, 255, 255, 0.6)', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>
                            PLAN: {programEndDate ? programEndDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '-'}
                        </div>
                    )}
                </div>
            </div>

            {/* Compact Header: Title + Subtitle style */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                marginBottom: 10
            }}>
                <h1 style={{
                    margin: '0',
                    fontSize: isMobile ? 18 : 22,
                    fontWeight: 700,
                    color: '#fff',
                    lineHeight: 1.1,
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    textShadow: '0 4px 8px rgba(0,0,0,0.3)'
                }}>
                    {programInfo?.title || 'Actividad'}
                </h1>
                
                {programInfo?.description && (
                    <p style={{
                        margin: '4px 0 0 0',
                        fontSize: isMobile ? 11 : 12,
                        fontWeight: 400,
                        color: 'rgba(255, 255, 255, 0.4)',
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: descriptionExpanded ? 999 : 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        maxWidth: '85%'
                    }}>
                        {programInfo.description}
                    </p>
                )}

                {programInfo?.description && programInfo.description.length > 80 && (
                    <button
                        onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                        style={{ background: 'transparent', border: 'none', color: '#FF6A00', fontSize: 11, fontWeight: 800, cursor: 'pointer', padding: '4px 0', textTransform: 'uppercase' }}
                    >
                        {descriptionExpanded ? 'Ver menos' : 'Ver más'}
                    </button>
                )}
            </div>

            {/* Tags Row */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                justifyContent: isMobile ? 'center' : 'flex-start',
                flexWrap: 'wrap'
            }}>
                {(() => {
                    const type = (programInfo?.type || programInfo?.categoria || '').toLowerCase();
                    const isWorkshop = type.includes('workshop') || type.includes('taller');
                    const isDoc = type.includes('document');

                    let label = 'Programa';
                    let icon = null;
                    let color = '#FFDAB9';
                    let border = '1px solid rgba(255, 180, 130, 0.2)';

                    if (isWorkshop) {
                        label = 'Taller';
                        icon = <Calendar size={10} className="mr-1 inline" />;
                        color = '#FF7939';
                        border = '1px solid #FF7939';
                    } else if (isDoc) {
                        label = 'Documento';
                        icon = <FileText size={10} className="mr-1 inline" />;
                        color = '#38BDF8';
                        border = '1px solid #38BDF8';
                    }

                    return (
                        <span style={{ display: 'flex', alignItems: 'center', padding: '3px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: 20, border: border, color: color, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {icon}{label}
                        </span>
                    );
                })()}

                {programInfo?.difficulty && (
                    <span style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255, 255, 255, 0.6)', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>
                        {programInfo.difficulty}
                    </span>
                )}
            </div>
        </div>
    );
}
