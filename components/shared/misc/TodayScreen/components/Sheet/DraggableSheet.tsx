import * as React from 'react';
import { motion, DragControls, useMotionValue } from 'framer-motion';
import { SheetHeader } from './SheetHeader';
import { TodayActivityList } from './TodayActivityList';
import { EmptyState } from './EmptyState';
import { ActivityDetailOverlay } from './ActivityDetailOverlay';

// Constants
const EXPANDED = '95vh'; // Approx
const COLLAPSED_HEIGHT_OFFSET = 160; // Needs to match Logic Vh - collapsedY

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
}

export function DraggableSheet({
    y, dragControls, vh,
    activities = [], selectedDate = new Date(), programInfo, enrollment,
    isDayLoading = false, nextAvailableActivity,
    goToToday, goToNextActivity, handlePrevDay, handleNextDay, handleOpenSurveyModal,
    selectedVideo, setSelectedVideo, isVideoExpanded = false, setIsVideoExpanded,
    blockNames, collapsedBlocks, toggleBlock, toggleBlockCompletion, isBlockCompleted, toggleExerciseSimple, openVideo,
    onNext, onPrev,
    title, children
}: DraggableSheetProps) {

    const EXPANDED_H = Math.max(Math.round(vh * 0.95), 620);
    const MID_H = Math.max(Math.round(vh * 0.70), 500);
    const COLLAPSED_H = 160;

    const collapsedY = EXPANDED_H - COLLAPSED_H;
    const midY = EXPANDED_H - MID_H;

    // Snapshot logic for drag end
    const onDragEnd = (_: any, info: { velocity: { y: number }; offset: { y: number } }) => {
        const current = y.get();
        const projected = current + info.velocity.y * 0.25;

        // Points
        const points = [40, midY, collapsedY]; // 40 top offset
        const nearest = points.reduce((best, p) => {
            return Math.abs(p - projected) < Math.abs(best - projected) ? p : best;
        }, points[0]);

        y.set(nearest); // Ideally animate
    };

    const snapTo = (val: number) => y.set(val);

    // Derived
    const [expandedState, setExpandedState] = React.useState(false);

    React.useEffect(() => {
        const unsub = y.on("change", (latest: number) => {
            // Original logic: openness > 0.3. Openness = map(y, [40, collapsedY], [1, 0]) approx
            // If y is small (near 40), it's expanded.
            setExpandedState(latest < midY);
        });
        return unsub;
    }, [y, midY]);


    return (
        <motion.div
            drag="y"
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 40, bottom: collapsedY }}
            dragElastic={0.08}
            onDragEnd={onDragEnd}
            style={{
                y,
                position: 'fixed', left: 0, right: 0, bottom: 0,
                height: '95vh', maxHeight: '100vh', minHeight: collapsedY, // Or just tall enough
                background: 'rgba(15, 16, 18, 0.98)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                borderTopLeftRadius: 32, borderTopRightRadius: 32,
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.4)',
                display: 'flex', flexDirection: 'column', zIndex: 200, overflow: 'hidden'
            }}
        >
            {/* Handle */}
            <div onPointerDown={(e) => { dragControls.start(e) }} onClick={() => snapTo(expandedState ? collapsedY : 40)}
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

                    <div className="orange-glass-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 200px', minHeight: 0 }}>
                        {children ? children : (
                            <>
                                <EmptyState
                                    isDayLoading={isDayLoading} activities={activities} nextAvailableActivity={nextAvailableActivity}
                                    goToNextActivity={goToNextActivity || (() => { })} snapToCollapsed={() => snapTo(collapsedY)} handleOpenSurveyModal={handleOpenSurveyModal || (() => { })}
                                />

                                {activities.length > 0 && (
                                    <TodayActivityList
                                        activities={activities} blockNames={blockNames} collapsedBlocks={collapsedBlocks}
                                        toggleBlock={toggleBlock} toggleBlockCompletion={toggleBlockCompletion}
                                        isBlockCompleted={isBlockCompleted} programInfo={programInfo} enrollment={enrollment}
                                        openVideo={openVideo} toggleExerciseSimple={toggleExerciseSimple}
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
