import React, { useState, useEffect } from 'react';
import { motion, DragControls, useMotionValue, animate } from 'framer-motion';
import { SheetHeader } from './SheetHeader';
import { TodayActivityList } from './TodayActivityList';
import { EmptyState } from './EmptyState';
import { ActivityDetailOverlay } from './ActivityDetailOverlay';

// Constants
const EXPANDED = '95vh'; // Approx
const COLLAPSED_HEIGHT_OFFSET = 210; // Needs to match Logic Vh - collapsedY

interface DraggableSheetProps {
    // Motion
    y: any;
    dragControls: DragControls;
    vh: number;

    // Data & Actions from Logic (Optional for reuse)
    activities?: any[];
    selectedDate?: Date;
    programInfo?: any;
    enrollment?: any;

    // Sheet State
    isDayLoading?: boolean;
    nextAvailableActivity?: any;
    isExpired?: boolean;
    isRated?: boolean;

    // Actions
    goToToday?: () => void;
    goToNextActivity?: () => void;
    handlePrevDay?: () => void;
    handleNextDay?: () => void;
    handleOpenSurveyModal?: () => void;

    // Selection
    selectedVideo?: any;
    setSelectedVideo?: (v: any) => void;
    isVideoExpanded?: boolean;
    setIsVideoExpanded?: (v: boolean) => void;

    // List Actions
    blockNames?: any;
    collapsedBlocks?: any;
    toggleBlock?: any;
    toggleBlockCompletion?: any;
    isBlockCompleted?: any;
    toggleExerciseSimple?: any;
    openVideo?: any;
    onNext?: () => void;
    onPrev?: () => void;

    // Extra
    title?: string;
    children?: React.ReactNode;
    meetCreditsAvailable?: number | null;
    onScheduleMeet?: () => void;
}

export function DraggableSheet({
    y, dragControls, vh,
    activities = [], selectedDate = new Date(), programInfo, enrollment,
    isDayLoading = false, nextAvailableActivity, isExpired = false, isRated = false,
    goToToday, goToNextActivity, handlePrevDay, handleNextDay, handleOpenSurveyModal,
    selectedVideo, setSelectedVideo, isVideoExpanded = false, setIsVideoExpanded,
    blockNames, collapsedBlocks, toggleBlock, toggleBlockCompletion, isBlockCompleted, toggleExerciseSimple, openVideo,
    onNext, onPrev,
    title, children,
    meetCreditsAvailable, onScheduleMeet
}: DraggableSheetProps) {

    const TOP_SNAP = 160; // Match layout
    const COLLAPSED_H = vh * 0.08; // Hide it more (peek 8%) as requested
    const collapsedY = vh - COLLAPSED_H;

    // Snapshot logic for drag end - Binary (Snap to Top or Bottom)
    const onDragEnd = (_: any, info: { velocity: { y: number }; offset: { y: number } }) => {
        const current = y.get();
        const velocity = info.velocity.y;

        // Use velocity + current position to determine intent
        let target = collapsedY;
        if (velocity < -200) {
            target = TOP_SNAP;
        } else if (velocity > 200) {
            target = collapsedY;
        } else {
            // No strong velocity, snap to nearest
            target = current < (collapsedY * 0.6) ? TOP_SNAP : collapsedY;
        }

        animate(y, target, {
            type: "spring",
            stiffness: 300,
            damping: 30,
            velocity: velocity
        });
    };

    const toggleSheet = () => {
        const current = y.get();
        const target = current < (collapsedY * 0.8) ? collapsedY : TOP_SNAP;
        animate(y, target, { type: "spring", stiffness: 300, damping: 30 });
    };

    // Derived
    const [expandedState, setExpandedState] = useState(false);

    useEffect(() => {
        const unsub = y.on("change", (latest: number) => {
            setExpandedState(latest < (collapsedY * 0.7));
        });
        return unsub;
    }, [y, collapsedY]);


    return (
        <motion.div
            drag="y"
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: TOP_SNAP, bottom: collapsedY }}
            dragElastic={0.05}
            dragMomentum={false}
            onDragEnd={onDragEnd}
            style={{
                y,
                position: 'fixed',
                left: '50%',
                x: '-50%',
                width: '100%',
                maxWidth: 'none',
                bottom: 0,
                height: '100vh',
                background: 'rgba(15, 16, 18, 0.98)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                borderTopLeftRadius: 32, borderTopRightRadius: 32,
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.4)',
                display: 'flex', flexDirection: 'column', zIndex: 1100, overflow: 'hidden'
            }}
        >
            {/* Handle */}
            <div onPointerDown={(e) => { dragControls.start(e) }} onClick={toggleSheet}
                style={{ display: 'grid', placeItems: 'center', paddingTop: 10, paddingBottom: 2, flexShrink: 0, touchAction: 'none', cursor: 'grab', width: '100%', height: 30 }}>
                <div style={{ width: 56, height: 5, borderRadius: 999, background: 'rgba(255, 121, 57, 0.6)' }}></div >
            </div>

            {/* Main Content (Hidden if video expanded) */}
            {!isVideoExpanded && (
                <>
                    <SheetHeader
                        activities={activities}
                        isSheetExpanded={expandedState}
                        selectedDate={selectedDate}
                        goToToday={goToToday}
                        handlePrevDay={handlePrevDay}
                        handleNextDay={handleNextDay}
                        title={title}
                    />

                    <div className="orange-glass-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px 0px 200px', minHeight: 0 }}>
                        {children ? children : (
                            <>
                                <EmptyState
                                    isDayLoading={isDayLoading} activities={activities} nextAvailableActivity={nextAvailableActivity}
                                    goToNextActivity={goToNextActivity || (() => { })} snapToCollapsed={() => animate(y, collapsedY, { type: "spring", stiffness: 300, damping: 30 })} handleOpenSurveyModal={handleOpenSurveyModal || (() => { })}
                                    isExpired={isExpired}
                                />

                                {activities.length > 0 && (
                                    <TodayActivityList
                                        activities={activities} blockNames={blockNames} collapsedBlocks={collapsedBlocks}
                                        toggleBlock={toggleBlock} toggleBlockCompletion={toggleBlockCompletion}
                                        isBlockCompleted={isBlockCompleted} programInfo={programInfo} enrollment={enrollment}
                                        openVideo={openVideo} toggleExerciseSimple={toggleExerciseSimple}
                                        isExpired={isExpired} isRated={isRated}
                                        handleOpenSurveyModal={handleOpenSurveyModal}
                                        meetCreditsAvailable={meetCreditsAvailable}
                                        onScheduleMeet={onScheduleMeet}
                                    />
                                )}
                            </>
                        )}
                    </div>
                </>
            )}
        </motion.div>
    );
}
