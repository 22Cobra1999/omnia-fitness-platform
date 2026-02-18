'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, MessageSquare, User, Zap, Globe, ThumbsUp, ThumbsDown, Activity } from 'lucide-react';
import { Enrollment } from '@/types/activity';
import { cn } from '@/lib/utils/utils';

interface SurveyViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    enrollment: Enrollment;
}

export function SurveyViewModal({
    isOpen,
    onClose,
    enrollment
}: SurveyViewModalProps) {
    if (!isOpen) return null;

    const {
        activity,
        rating_coach,
        feedback_text,
        difficulty_rating,
        would_repeat,
        calificacion_omnia,
        comentarios_omnia,
        workshop_version
    } = enrollment;

    const renderStars = (rating: number | null | undefined, max: number = 5) => {
        if (!rating) return <span className="text-[10px] text-zinc-600 font-medium">No calificado</span>;
        return (
            <div className="flex gap-1">
                {[...Array(max)].map((_, i) => (
                    <Star
                        key={i}
                        className={cn(
                            "w-3.5 h-3.5",
                            i < rating ? "text-[#FF7939] fill-[#FF7939]" : "text-zinc-800"
                        )}
                    />
                ))}
            </div>
        );
    };

    const MetricItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: React.ReactNode }) => (
        <div className="flex flex-col gap-1.5 align-start justify-start">
            <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">{label}</span>
            </div>
            <div className="pl-0.5">
                {value}
            </div>
        </div>
    );

    // Minimalist difficulty bar
    const renderDifficulty = (rating: number | null | undefined) => {
        if (!rating) return <span className="text-[10px] text-zinc-600 font-medium">N/A</span>;
        return (
            <div className="flex items-center gap-3">
                <div className="flex gap-1 h-3 items-end">
                    {[1, 2, 3, 4, 5].map((level) => (
                        <div
                            key={level}
                            className={cn(
                                "w-1 rounded-sm transition-all duration-300",
                                level <= rating ? "bg-zinc-200" : "bg-zinc-800",
                                `h-[${level * 15 + 20}%]`
                            )}
                            style={{ height: level <= rating ? `${level * 3 + 4}px` : '4px' }}
                        />
                    ))}
                </div>
                <span className="text-xs font-bold text-white">{rating}/5</span>
            </div>
        )
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                    style={{
                        background: 'rgba(0, 0, 0, 0.85)',
                        backdropFilter: 'blur(4px)',
                        WebkitBackdropFilter: 'blur(4px)'
                    }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 10 }}
                        onClick={(e) => e.stopPropagation()}
                        className="max-w-sm w-full rounded-2xl overflow-hidden flex flex-col relative bg-[#121212] border border-zinc-800 shadow-2xl"
                    >
                        {/* Clean Header */}
                        <div className="relative pt-6 px-6 pb-2 flex justify-between items-start">
                            <div className="space-y-1">
                                <h2 className="text-sm font-semibold text-white tracking-wide">Tu Experiencia</h2>
                                <p className="text-xs text-zinc-500 line-clamp-1 max-w-[240px]">{activity.title}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 -mr-2 hover:bg-white/5 rounded-full transition-colors text-zinc-500 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content Scrollable */}
                        <div className="p-6 space-y-8 overflow-y-auto max-h-[75vh] custom-scrollbar">

                            {/* Grid Clean Metrics */}
                            <div className="grid grid-cols-2 gap-y-8 gap-x-4">
                                {/* Coach Rating */}
                                <MetricItem
                                    icon={User}
                                    label="Coach"
                                    value={renderStars(rating_coach, 5)}
                                />

                                {/* Platform Rating */}
                                <MetricItem
                                    icon={Globe}
                                    label="Omnia"
                                    value={renderStars(calificacion_omnia, 5)}
                                />

                                {/* Difficulty */}
                                <MetricItem
                                    icon={Activity}
                                    label="Dificultad"
                                    value={renderDifficulty(difficulty_rating)}
                                />

                                {/* Would Repeat */}
                                <MetricItem
                                    icon={Zap}
                                    label="Repetiría"
                                    value={
                                        would_repeat !== null && would_repeat !== undefined ? (
                                            <div className="flex items-center gap-2 text-white">
                                                {would_repeat ? (
                                                    <span className="text-xs font-medium text-white flex items-center gap-1.5">
                                                        <ThumbsUp className="w-3 h-3 text-[#FF7939]" /> Sí, totalmente
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
                                                        <ThumbsDown className="w-3 h-3" /> No por ahora
                                                    </span>
                                                )}
                                            </div>
                                        ) : <span className="text-[10px] text-zinc-600 font-medium">N/A</span>
                                    }
                                />
                            </div>

                            {/* Separator - Subtle line */}
                            {(feedback_text || comentarios_omnia) && (
                                <div className="h-px bg-zinc-900 w-full" />
                            )}

                            {/* Comentarios Clean Layout */}
                            <div className="space-y-6">
                                {feedback_text && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <MessageSquare className="w-3.5 h-3.5 text-zinc-600" />
                                            <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Feedback Coach</span>
                                        </div>
                                        <div className="pl-0">
                                            <p className="text-xs text-zinc-300 leading-relaxed font-light italic opacity-90">"{feedback_text}"</p>
                                        </div>
                                    </div>
                                )}

                                {comentarios_omnia && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Globe className="w-3.5 h-3.5 text-zinc-600" />
                                            <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Feedback OMNIA</span>
                                        </div>
                                        <div className="pl-0">
                                            <p className="text-xs text-zinc-300 leading-relaxed font-light italic opacity-90">"{comentarios_omnia}"</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Version Tag at bottom if exists */}
                            {workshop_version && (
                                <div className="pt-2 flex justify-center opacity-40">
                                    <span className="text-[10px] font-mono text-zinc-600">v{workshop_version}</span>
                                </div>
                            )}

                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
