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
}

export function UniversalHero({
    programInfo,
    enrollment,
    meetCreditsAvailable,
    hasUserSubmittedSurvey,
    onScheduleMeet,
    onOpenSurvey,
    onBack,
    isExpired = false
}: UniversalHeroProps) {
    const [descriptionExpanded, setDescriptionExpanded] = React.useState(false);

    // Helper para objetivos (logic moved to hook/component in original, keeping simple here or use prop)
    const objetivos = React.useMemo(() => {
        const src: any = enrollment?.activity || programInfo || null
        let list: any = src?.objetivos

        if (!list || !Array.isArray(list)) {
            list = []
            const ws = src?.workshop_type
            if (ws) {
                // Logic for workshop parsing from original line 180+
                // Kept simplified for now
            }
        }
        const valid = (Array.isArray(list) ? list : [])
            .map((o: any) => String(o ?? '').trim())
            .filter((o: string) => o && o !== 'Enel' && o !== 'Ene' && o.length > 2);

        return valid;
    }, [enrollment?.activity, programInfo]);

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(10px) saturate(150%)',
            WebkitBackdropFilter: 'blur(10px) saturate(150%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
            padding: '65px 24px 24px',
            marginBottom: 24,
            marginTop: -55,
            marginLeft: '-24px',
            marginRight: '-24px',
            width: 'calc(100% + 48px)',
            position: 'relative',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            filter: isExpired ? 'grayscale(1) opacity(0.8)' : 'none'
        }}>
            {/* Flecha de retorno y botón de calificación al mismo nivel */}
            <div style={{
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%'
            }}>
                {onBack ? (
                    <button
                        onClick={onBack}
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '50%',
                            width: 36,
                            height: 36,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#fff',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <ChevronLeft size={22} />
                    </button>
                ) : <div />}

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                        onClick={onScheduleMeet}
                        style={{
                            padding: '4px 10px',
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            background: 'rgba(255, 255, 255, 0.10)',
                            border: '1px solid rgba(255, 106, 0, 0.35)',
                            borderRadius: 12,
                            color: '#FFFFFF',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            flexShrink: 0,
                            backdropFilter: 'blur(14px)',
                            WebkitBackdropFilter: 'blur(14px)'
                        }}
                    >
                        <CalendarClock size={14} color="#FF6A00" />
                        <span>
                            {(Number.isFinite(meetCreditsAvailable as any) ? meetCreditsAvailable : 0)} {(enrollment?.activity?.categoria === 'nutricion' || programInfo?.categoria === 'nutricion') ? 'consultas' : 'meets'}
                        </span>
                    </button>

                    {!hasUserSubmittedSurvey && (
                        <button
                            onClick={onOpenSurvey}
                            style={{
                                padding: '4px 10px',
                                height: 24,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                justifyContent: 'center',
                                background: 'rgba(255, 106, 0, 0.1)',
                                border: '1px solid rgba(255, 106, 0, 0.3)',
                                borderRadius: 12,
                                color: '#FF6A00',
                                fontSize: 11,
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                flexShrink: 0
                            }}
                        >
                            <Star size={12} fill="#FF6A00" />
                            Calificar
                        </button>
                    )}
                    {hasUserSubmittedSurvey && (
                        <div
                            style={{
                                padding: '4px 10px',
                                height: 24,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(34, 197, 94, 0.1)',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                borderRadius: 12,
                                color: '#22C55E',
                                fontSize: 11,
                                fontWeight: 500,
                                flexShrink: 0
                            }}
                        >
                            ✓ Calificado
                        </div>
                    )}
                </div>
            </div>

            {/* Título centrado y grande */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: 16,
                gap: 12
            }}>
                <h1 style={{
                    margin: '0',
                    fontSize: 28,
                    lineHeight: 1.2,
                    fontWeight: 900,
                    color: '#fff',
                    textAlign: 'center',
                    width: '100%',
                    textShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                    letterSpacing: '-0.02em'
                }}>
                    {programInfo?.title || 'Actividad'}
                </h1>

                {isExpired && (
                    <div style={{
                        marginTop: -4,
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: 12,
                        padding: '2px 10px',
                        color: '#EF4444',
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase'
                    }}>
                        Programa Expirado
                    </div>
                )}

                {/* Categoría y Tags */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    justifyContent: 'center',
                    width: '100%',
                    flexWrap: 'wrap'
                }}>
                    {(() => {
                        const type = (programInfo?.type || programInfo?.categoria || '').toLowerCase();
                        const isWorkshop = type.includes('workshop') || type.includes('taller');
                        const isDoc = type.includes('document');
                        const isNutri = type.includes('nutricion');

                        let label = 'Programa';
                        let icon = null;
                        let color = '#FFDAB9';
                        let bg = 'rgba(255, 180, 130, 0.08)';
                        let border = '1px solid rgba(255, 180, 130, 0.15)';

                        if (isWorkshop) {
                            label = 'Taller';
                            icon = <Calendar size={10} className="mr-1" />;
                            color = '#FF7939';
                            bg = 'rgba(255, 121, 57, 0.1)';
                            border = '1px solid rgba(255, 121, 57, 0.2)';
                        } else if (isDoc) {
                            label = 'Documento';
                            icon = <FileText size={10} className="mr-1" />;
                            color = '#38BDF8';
                            bg = 'rgba(56, 189, 248, 0.1)';
                            border = '1px solid rgba(56, 189, 248, 0.2)';
                        } else if (isNutri) {
                            label = 'Nutrición';
                            color = '#FFE4B5';
                            bg = 'rgba(255, 230, 150, 0.08)';
                            border = '1px solid rgba(255, 230, 150, 0.15)';
                        }

                        return (
                            <span style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '4px 10px',
                                background: bg,
                                borderRadius: 12,
                                border: border,
                                color: color,
                                fontSize: 10,
                                fontWeight: 700,
                                backdropFilter: 'blur(8px)',
                                WebkitBackdropFilter: 'blur(8px)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em'
                            }}>
                                {icon}
                                {label}
                            </span>
                        );
                    })()}

                    {programInfo?.difficulty && (
                        <span style={{
                            padding: '4px 10px',
                            background: (programInfo?.difficulty || '').toLowerCase().includes('adv') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                            borderRadius: 12,
                            border: (programInfo?.difficulty || '').toLowerCase().includes('adv') ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(255, 255, 255, 0.1)',
                            color: (programInfo?.difficulty || '').toLowerCase().includes('adv') ? '#EF4444' : 'rgba(255, 255, 255, 0.6)',
                            fontSize: 10,
                            fontWeight: 700,
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em'
                        }}>
                            {programInfo?.difficulty}
                        </span>
                    )}
                </div>

                {/* Objetivos */}
                {objetivos.length > 0 && (
                    <div style={{
                        display: 'flex',
                        gap: 8,
                        overflowX: 'auto',
                        width: '100%',
                        padding: '4px 0',
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                    }}>
                        {objetivos.map((objetivo: string, idx: number) => (
                            <span key={`${objetivo}-${idx}`} style={{
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                color: 'rgba(255, 255, 255, 0.5)',
                                fontSize: 11,
                                fontWeight: 500,
                                padding: '4px 12px',
                                borderRadius: 999,
                                transition: 'all 0.2s ease'
                            }}>
                                {objetivo}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {programInfo?.description && (
                <div style={{ marginTop: 12, marginBottom: 8 }}>
                    <p style={{
                        margin: 0,
                        fontSize: 14,
                        lineHeight: 1.5,
                        color: 'rgba(255, 255, 255, 0.9)',
                        display: '-webkit-box',
                        WebkitLineClamp: descriptionExpanded ? 999 : 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textAlign: 'center'
                    }}>
                        {programInfo.description}
                    </p>
                    {programInfo.description.length > 100 && (
                        <button
                            onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                            style={{
                                marginTop: 8,
                                background: 'transparent',
                                border: 'none',
                                color: '#FF6A00',
                                fontSize: 13,
                                fontWeight: 500,
                                cursor: 'pointer',
                                padding: 0,
                                textAlign: 'right',
                                width: '100%',
                                display: 'block'
                            }}
                        >
                            {descriptionExpanded ? 'Ver menos' : 'Ver más >'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
