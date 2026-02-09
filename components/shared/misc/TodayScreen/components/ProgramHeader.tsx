import React, { useState } from 'react';
import { CalendarClock, RotateCcw, Minus, ArrowLeft } from 'lucide-react';

interface ProgramHeaderProps {
    programInfo: any;
    enrollment: any;
    meetCreditsAvailable: number | null;
    hasUserSubmittedSurvey: boolean;
    onScheduleMeet: () => void;
    onOpenSurvey: () => void;
    onBack?: () => void;
}

export const ProgramHeader: React.FC<ProgramHeaderProps> = ({
    programInfo,
    enrollment,
    meetCreditsAvailable,
    hasUserSubmittedSurvey,
    onScheduleMeet,
    onOpenSurvey,
    onBack
}) => {
    const [descriptionExpanded, setDescriptionExpanded] = useState(false);

    // Extract objectives
    const objectives = React.useMemo(() => {
        // Basic logic to extract objectives (simplified for now, mimicking original)
        const src: any = enrollment?.activity || programInfo || null;
        let list: any = src?.objetivos;
        if (!list || !Array.isArray(list)) list = [];
        return list.map((o: any) => String(o ?? '').trim()).filter((o: string) => o && o.length > 2);
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
            padding: '28px 28px',
            marginBottom: 32,
            marginTop: -8,
            marginLeft: '-24px',
            marginRight: '-24px',
            width: 'calc(100% + 48px)',
            position: 'relative',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        }}>
            {/* Top Controls Row */}
            <div style={{
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%'
            }}>
                {/* Back Button (Robert Implementation) */}
                {onBack && (
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                )}
                {!onBack && <div />}

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
                            {(Number.isFinite(meetCreditsAvailable as any) ? meetCreditsAvailable : 0)} meet disponibles
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

            {/* Title */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: 12,
                gap: 8
            }}>
                <h1 style={{
                    margin: '0',
                    fontSize: 24,
                    lineHeight: 1.3,
                    fontWeight: 800,
                    color: '#fff',
                    textAlign: 'center',
                    width: '100%',
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                }}>
                    {programInfo?.title || 'Programa'}
                </h1>

                {/* Badges */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    justifyContent: 'center',
                    width: '100%',
                    flexWrap: 'wrap'
                }}>
                    <span style={{
                        padding: '3px 8px',
                        background: programInfo?.categoria === 'nutricion' ? 'rgba(255, 230, 150, 0.08)' : 'rgba(255, 180, 130, 0.08)',
                        borderRadius: 20,
                        border: programInfo?.categoria === 'nutricion' ? '1px solid rgba(255, 230, 150, 0.15)' : '1px solid rgba(255, 180, 130, 0.15)',
                        color: programInfo?.categoria === 'nutricion' ? '#FFE4B5' : '#FFDAB9',
                        fontSize: 9,
                        fontWeight: 600,
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                        {programInfo?.categoria === 'fitness' ? 'Fitness' : programInfo?.categoria === 'nutricion' ? 'Nutrición' : 'Programa'}
                    </span>
                    {/* Difficulty Badge Logic would go here */}
                </div>

                {/* Location Logic would go here */}
            </div>

            {/* Objectives */}
            {objectives.length > 0 && (
                <div style={{
                    display: 'flex', gap: 6, overflowX: 'auto', width: '100%', paddingBottom: 2, justifyContent: 'center', flexWrap: 'wrap'
                }}>
                    {objectives.map((objetivo: string, idx: number) => (
                        <span key={`${objetivo}-${idx}`} style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0
                        }}>
                            {objetivo}
                        </span>
                    ))}
                </div>
            )}

            {/* Description */}
            {programInfo?.description && (
                <div style={{ marginTop: 12, marginBottom: 8 }}>
                    <p style={{
                        margin: 0, fontSize: 14, lineHeight: 1.5, color: 'rgba(255, 255, 255, 0.9)',
                        display: '-webkit-box', WebkitLineClamp: descriptionExpanded ? 999 : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textAlign: 'center'
                    }}>
                        {programInfo.description}
                    </p>
                    {programInfo.description.length > 100 && (
                        <button
                            onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                            style={{
                                marginTop: 8, background: 'transparent', border: 'none', color: '#FF6A00',
                                fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: 0, textAlign: 'right', width: '100%', display: 'block'
                            }}
                        >
                            {descriptionExpanded ? 'Ver menos' : 'Ver más >'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
