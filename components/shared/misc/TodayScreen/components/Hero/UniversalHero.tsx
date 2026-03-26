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
        
        // Row 1 should be wider (more words)
        return {
            row1: words.slice(0, 4).join(' '),
            row2: words.slice(4, 7).join(' '),
            row3: words.slice(7).join(' ')
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
            // TOP PADDING: compensation for the negative margin to keep content position stable
            padding: isMobile ? '8px 20px 12px' : '62px 32px 14px', 
            minHeight: '13vh', 
            marginBottom: 0,
            // HERO FRAME HEIGHT ADJUSTMENT: Bleed background up behind the header
            marginTop: isMobile ? -48 : -100, 
            marginLeft: '-24px',
            marginRight: '-24px',
            width: 'calc(100% + 48px)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        }}>
            {/* Header row */}
            <div style={{
                marginBottom: 4, 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%'
            }}>
                {onBack ? (
                    <button onClick={onBack} style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                        <ChevronLeft size={18} />
                    </button>
                ) : <div />}

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ padding: '3px 10px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 12, color: isPlanFinished ? '#FF7939' : 'rgba(255, 255, 255, 0.6)', fontSize: 9, fontWeight: 800, textTransform: 'uppercase' }}>
                        {isPlanFinished ? 'EXPIRA: ' : 'FINALIZA: '}
                        {programEndDate ? programEndDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '-'}
                    </div>
                </div>
            </div>

            {/* Content Row: Hierarchy */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                marginBottom: 6,
                marginTop: isMobile ? 0 : -8 // Maintain internal shift for compactness
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: isMobile ? '100%' : '75%' }}>
                    <span style={{
                        fontSize: isMobile ? 20 : 24, 
                        fontWeight: 900,
                        color: '#fff',
                        opacity: 0.9,
                        lineHeight: 1, 
                        textTransform: 'uppercase',
                        letterSpacing: '-0.04em',
                        display: 'block',
                        maxWidth: '95%', 
                        marginBottom: 1
                    }}>
                        {titleRows.row1}
                    </span>
                    {titleRows.row2 && (
                        <span style={{
                            fontSize: isMobile ? 14 : 18, 
                            fontWeight: 600,
                            color: 'rgba(255, 255, 255, 0.6)',
                            lineHeight: 1, 
                            textTransform: 'uppercase',
                            letterSpacing: '-0.02em',
                            display: 'block',
                            maxWidth: '75%', 
                            marginBottom: 1
                        }}>
                            {titleRows.row2}
                        </span>
                    )}
                    {titleRows.row3 && (
                        <span style={{
                            fontSize: isMobile ? 11 : 12, 
                            fontWeight: 300,
                            color: 'rgba(255, 255, 255, 0.4)',
                            lineHeight: 1, 
                            textTransform: 'uppercase',
                            letterSpacing: '0.02em',
                            display: 'block',
                            maxWidth: '60%' 
                        }}>
                            {titleRows.row3}
                        </span>
                    )}
                </div>
                
                {programInfo?.description && (
                    <p style={{
                        margin: '6px auto 0',
                        fontSize: isMobile ? 11 : 12, 
                        fontWeight: 400,
                        color: 'rgba(255, 255, 255, 0.35)', 
                        lineHeight: 1.3, 
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
                        style={{ background: 'transparent', border: 'none', color: '#FF6A00', fontSize: 10, fontWeight: 800, cursor: 'pointer', padding: '2px 0', textTransform: 'uppercase' }}
                    >
                        {descriptionExpanded ? 'Ver menos' : 'Ver más'}
                    </button>
                )}
            </div>

            {/* Centered Tags Row */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                justifyContent: 'center', 
                flexWrap: 'wrap',
                marginTop: 2
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
                        icon = <Calendar size={9} className="mr-1 inline" />;
                        color = '#FF7939';
                        border = 'rgba(255, 121, 57, 0.4)';
                    } else if (isDoc) {
                        label = 'Documento';
                        icon = <FileText size={9} className="mr-1 inline" />;
                        color = '#38BDF8';
                        border = 'rgba(56, 189, 248, 0.4)';
                    }

                    return (
                        <span style={{ 
                            display: 'flex', alignItems: 'center', padding: '3px 10px', 
                            background: 'rgba(255,255,255,0.03)', 
                            backdropFilter: 'blur(12px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(12px) saturate(180%)',
                            borderRadius: 20, border: `1px solid ${border}`, 
                            color: color, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' 
                        }}>
                            {icon}{label}
                        </span>
                    );
                })()}

                {programInfo?.difficulty && (
                    <span style={{ 
                        padding: '3px 10px', 
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
                        fontSize: 9, fontWeight: 800, textTransform: 'uppercase' 
                    }}>
                        {programInfo.difficulty}
                    </span>
                )}
            </div>
        </div>
    );
}
