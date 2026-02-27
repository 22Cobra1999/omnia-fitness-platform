import * as React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { useActivityDetailLogic } from '../../hooks/useActivityDetailLogic';
import { ActivityVideoPlayer } from './components/ActivityVideoPlayer';
import { NutritionInfo } from './components/NutritionInfo';
import { FitnessInfo } from './components/FitnessInfo';

interface ActivityDetailOverlayProps {
    selectedVideo: any;
    onClose: () => void;
    toggleExerciseSimple: (id: string) => void;
    programInfo: any;
    enrollment: any;
    activityId?: string;
    // Navigation
    onNext: () => void;
    onPrev: () => void;
    isExpired?: boolean;
}

export function ActivityDetailOverlay({
    selectedVideo,
    onClose,
    toggleExerciseSimple,
    programInfo,
    enrollment,
    activityId,
    onNext,
    onPrev,
    isExpired = false
}: ActivityDetailOverlayProps) {

    const {
        // State
        isVideoPanelExpanded,
        setIsVideoPanelExpanded,
        activeMealTab,
        setActiveMealTab,
        activeExerciseTab,
        setActiveExerciseTab,
        isEditingSeries,
        setIsEditingSeries,
        editedSeries,
        setEditedSeries,
        isSaving,
        isToggling,
        scrollRef,
        isNutrition,

        // Actions
        handleStartEditing,
        handleSaveSeries,
        handleToggleStatus
    } = useActivityDetailLogic({
        selectedVideo,
        toggleExerciseSimple,
        onNext,
        programInfo,
        enrollment,
        activityId
    });

    if (!selectedVideo) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="activity-detail-overlay-container"
            style={{
                position: 'fixed', top: 56, left: 0, right: 0, bottom: 64, zIndex: 45,
                backgroundColor: '#000000', display: 'flex', flexDirection: 'column',
                boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
                borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden'
            }}
        >
            <style jsx>{`
                .activity-detail-overlay-container {
                    left: 0;
                    right: 0;
                    width: 100%;
                    transition: all 0.3s ease;
                }
                @media (min-width: 1024px) {
                    .activity-detail-overlay-container {
                        max-width: 850px;
                        margin: 0 auto;
                        border-left: 1px solid rgba(255,121,57,0.1);
                        border-right: 1px solid rgba(255,121,57,0.1);
                        background: rgba(10, 10, 10, 0.8) !important;
                        backdrop-filter: blur(40px);
                    }
                    .desktop-content-wrapper {
                        max-width: 700px;
                        margin: 0 auto;
                        width: 100%;
                    }
                }
            `}</style>

            {/* Background and Overlay styles */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `url(${selectedVideo.coverImageUrl || (selectedVideo as any).image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.7, filter: 'blur(12px) brightness(0.6)', zIndex: 0, transform: 'scale(1.1)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: isVideoPanelExpanded ? 'linear-gradient(180deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.95) 100%)' : 'linear-gradient(180deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.6) 40%, rgba(0, 0, 0, 0.9) 100%)', zIndex: 1, pointerEvents: 'none' }} />

            {/* Header */}
            <div style={{ padding: '16px 20px 0', flexShrink: 0, position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button onClick={onClose} style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', borderRadius: 12, color: '#FF7939', fontSize: 24, cursor: 'pointer' }}>←</button>

                {/* Completion Status (Top Right) - Replicating TodayActivityList style */}
                <div
                    onClick={isExpired ? undefined : handleToggleStatus}
                    className="group active:scale-95 transition-all duration-200"
                    style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        cursor: (isToggling || isExpired) ? 'default' : 'pointer', padding: '6px 12px', zIndex: 100,
                        opacity: (isToggling || isExpired) ? 0.7 : 1,
                        background: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)'
                    }}
                >
                    <div style={{
                        width: 44, height: 44, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: (selectedVideo.done || selectedVideo.completed) ? '#FF7939' : 'rgba(255,255,255,0.05)',
                        boxShadow: (selectedVideo.done || selectedVideo.completed) ? '0 8px 25px rgba(255,121,57,0.5)' : 'none',
                        border: (selectedVideo.done || selectedVideo.completed) ? 'none' : '1px solid rgba(255,255,255,0.1)',
                        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}>
                        <Flame
                            size={24}
                            fill={(selectedVideo.done || selectedVideo.completed) ? "white" : "none"}
                            color={(selectedVideo.done || selectedVideo.completed) ? "white" : "rgba(255,255,255,0.2)"}
                            strokeWidth={2.5}
                        />
                    </div>
                    <span style={{ color: 'white', fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {isExpired ? 'Expirado' : ((selectedVideo.done || selectedVideo.completed) ? 'Completado' : 'Marcar')}
                    </span>
                </div>
            </div>

            {/* Title */}
            <div style={{ padding: '8px 20px 0', flexShrink: 0, position: 'relative', zIndex: 10, textAlign: 'center' }}>
                <h1 style={{ color: 'rgba(255, 255, 255, 1)', fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                    {selectedVideo.exerciseName || selectedVideo.title || selectedVideo.nombre_ejercicio}
                </h1>
            </div>

            {/* Content Container */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', zIndex: 5 }}>
                <div
                    ref={scrollRef}
                    className={isNutrition ? 'hide-scrollbar' : 'orange-glass-scrollbar'}
                    style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 250px', display: 'flex', flexDirection: 'column', gap: 20, position: 'relative' }}
                >
                    <div className="desktop-content-wrapper">
                        <ActivityVideoPlayer
                            selectedVideo={selectedVideo}
                            isVideoPanelExpanded={isVideoPanelExpanded}
                            setIsVideoPanelExpanded={setIsVideoPanelExpanded}
                            isNutrition={isNutrition}
                        />

                        {/* Info Container */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 12 }}>
                            {isNutrition ? (
                                <NutritionInfo
                                    selectedVideo={selectedVideo}
                                    activeMealTab={activeMealTab}
                                    setActiveMealTab={setActiveMealTab}
                                />
                            ) : (
                                <FitnessInfo
                                    selectedVideo={selectedVideo}
                                    activeExerciseTab={activeExerciseTab}
                                    setActiveExerciseTab={setActiveExerciseTab}
                                    isEditingSeries={isEditingSeries}
                                    setIsEditingSeries={setIsEditingSeries}
                                    editedSeries={editedSeries}
                                    setEditedSeries={setEditedSeries}
                                    handleStartEditing={handleStartEditing}
                                    handleSaveSeries={handleSaveSeries}
                                    isSaving={isSaving}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Split Navigation Buttons (Corners) */}
            <button
                onClick={(e) => { e.stopPropagation(); onPrev(); }}
                style={{
                    position: 'fixed', bottom: 120, left: 24, zIndex: 10000,
                    width: 58, height: 58, borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(25px)',
                    border: '1.5px solid #FF7939',
                    color: '#FF7939',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)', transition: 'all 0.2s ease'
                }}
            >
                <span style={{ fontSize: 28, fontWeight: 700 }}>←</span>
            </button>

            <button
                onClick={(e) => { e.stopPropagation(); onNext(); }}
                style={{
                    position: 'fixed', bottom: 120, right: 24, zIndex: 10000,
                    width: 58, height: 58, borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(25px)',
                    border: '1.5px solid #FF7939',
                    color: '#FF7939',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)', transition: 'all 0.2s ease'
                }}
            >
                <span style={{ fontSize: 28, fontWeight: 700 }}>→</span>
            </button>
        </motion.div>
    );
}
