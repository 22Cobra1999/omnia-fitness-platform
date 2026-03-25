import * as React from 'react';
import { ChevronLeft, Calendar, FileText, Star } from 'lucide-react';

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

    // Calcular fecha real del plan 
    const programEndDate = React.useMemo(() => {
        if (!enrollment?.start_date) return null;
        const totalWeeks = programInfo?.semanas_totales || programInfo?.duration_weeks || 4;
        const startDate = new Date(enrollment.start_date + 'T12:00:00'); 
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + (totalWeeks * 7));
        return endDate;
    }, [enrollment?.start_date, programInfo]);

    const isPlanFinished = React.useMemo(() => {
        if (!programEndDate) return false;
        return programEndDate < new Date();
    }, [programEndDate]);

    // Split title into hierarchy like ActivityCard
    const titleRows = React.useMemo(() => {
        const title = programInfo?.title || 'Actividad';
        const words = title.split(' ');
        if (words.length <= 1) return { row1: title, row2: '', row3: '' };
        
        return {
            row1: words.slice(0, 2).join(' '),
            row2: words.slice(2, 5).join(' '),
            row3: words.slice(5).join(' ')
        };
    }, [programInfo?.title]);

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
            {/* Header row: Back / Badge / Rate (Button REMOVED per request) */}
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
                    <div style={{ padding: '4px 12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 12, color: isPlanFinished ? '#FF7939' : 'rgba(255, 255, 255, 0.6)', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>
                        {isPlanFinished ? 'EXPIRA: ' : 'FINALIZA: '}
                        {programEndDate ? programEndDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '-'}
                    </div>
                </div>
            </div>

            {/* Content Row: SAME Hierarchy as Activity Cards */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                marginBottom: 10
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: isMobile ? '100%' : '60%' }}>
                    <span style={{
                        fontSize: isMobile ? 22 : 28,
                        fontWeight: 900,
                        color: '#fff',
                        opacity: 0.9,
                        lineHeight: 1.1,
                        textTransform: 'uppercase',
                        letterSpacing: '-0.04em',
                        display: 'block',
                        marginBottom: 1
                    }}>
                        {titleRows.row1}
                    </span>
                    {titleRows.row2 && (
                        <span style={{
                            fontSize: isMobile ? 16 : 20,
                            fontWeight: 600,
                            color: 'rgba(255, 255, 255, 0.6)',
                            lineHeight: 1.1,
                            textTransform: 'uppercase',
                            letterSpacing: '-0.02em',
                            display: 'block',
                            marginBottom: 2
                        }}>
                            {titleRows.row2}
                        </span>
                    )}
                    {titleRows.row3 && (
                        <span style={{
                            fontSize: isMobile ? 12 : 14,
                            fontWeight: 300,
                            color: 'rgba(255, 255, 255, 0.4)',
                            lineHeight: 1.1,
                            textTransform: 'uppercase',
                            letterSpacing: '0.02em',
                            display: 'block'
                        }}>
                            {titleRows.row3}
                        </span>
                    )}
                </div>
                
                {programInfo?.description && (
                    <p style={{
                        margin: '12px auto 0',
                        fontSize: isMobile ? 12 : 13,
                        fontWeight: 400,
                        color: 'rgba(255, 255, 255, 0.35)', // Finer and clearer secondary text
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

            {/* Centered Tags Row - MORE GLASSMORPHISM */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                justifyContent: 'center', 
                flexWrap: 'wrap',
                marginTop: 6
            }}>
                {(() => {
                    const type = (programInfo?.type || programInfo?.categoria || '').toLowerCase();
                    const isWorkshop = type.includes('workshop') || type.includes('taller');
                    const isDoc = type.includes('document');

                    let label = 'Programa';
                    let icon = null;
                    let color = '#fff';
                    let border = 'rgba(255, 255, 255, 0.15)';

                    if (isWorkshop) {
                        label = 'Taller';
                        icon = <Calendar size={10} className="mr-1 inline" />;
                        color = '#FF7939';
                        border = 'rgba(255, 121, 57, 0.4)';
                    } else if (isDoc) {
                        label = 'Documento';
                        icon = <FileText size={10} className="mr-1 inline" />;
                        color = '#38BDF8';
                        border = 'rgba(56, 189, 248, 0.4)';
                    }

                    return (
                        <span style={{ 
                            display: 'flex', alignItems: 'center', padding: '4px 12px', 
                            background: 'rgba(255,255,255,0.03)', 
                            backdropFilter: 'blur(12px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(12px) saturate(180%)',
                            borderRadius: 20, border: `1px solid ${border}`, 
                            color: color, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' 
                        }}>
                            {icon}{label}
                        </span>
                    );
                })()}

                {programInfo?.difficulty && (
                    <span style={{ 
                        padding: '4px 12px', 
                        background: 'rgba(255,255,255,0.03)', 
                        backdropFilter: 'blur(12px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(12px) saturate(180%)',
                        borderRadius: 20, 
                        border: `1px solid ${
                            programInfo.difficulty.toLowerCase().includes('adv') ? 'rgba(239, 68, 68, 0.4)' : 
                            programInfo.difficulty.toLowerCase().includes('med') || programInfo.difficulty.toLowerCase().includes('int') ? 'rgba(255, 121, 57, 0.4)' : 
                            'rgba(255, 228, 181, 0.4)'
                        }`, 
                        color: 
                            programInfo.difficulty.toLowerCase().includes('adv') ? '#EF4444' : 
                            programInfo.difficulty.toLowerCase().includes('med') || programInfo.difficulty.toLowerCase().includes('int') ? '#FF7939' : 
                            '#FFE4B5',
                        fontSize: 10, fontWeight: 800, textTransform: 'uppercase' 
                    }}>
                        {programInfo.difficulty}
                    </span>
                )}
            </div>
        </div>
    );
}
