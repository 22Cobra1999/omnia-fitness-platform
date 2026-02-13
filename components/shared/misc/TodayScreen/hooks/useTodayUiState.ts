import * as React from 'react';
import { useMotionValue } from 'framer-motion';

export function useTodayUiState() {
    const [vh, setVh] = React.useState<number>(typeof window !== 'undefined' ? window.innerHeight : 800);
    const [loading, setLoading] = React.useState(true);
    const [isDayLoading, setIsDayLoading] = React.useState(false);

    // UI Expand/Collapse States
    const [isVideoExpanded, setIsVideoExpanded] = React.useState(false);
    const [activeExerciseTab, setActiveExerciseTab] = React.useState<'Técnica' | 'Equipamiento' | 'Músculos' | 'Series'>('Técnica');
    const [collapsedBlocks, setCollapsedBlocks] = React.useState<Set<number>>(new Set([2, 3, 4, 5, 6, 7, 8, 9, 10]));
    const [calendarExpanded, setCalendarExpanded] = React.useState(false);

    // Motion Values
    const videoExpandY = useMotionValue(0);
    const videoExpandX = useMotionValue(0);

    // Modal States
    const [showStartModal, setShowStartModal] = React.useState(false);
    const [showStartInfoModal, setShowStartInfoModal] = React.useState(false);
    const [showSurveyModal, setShowSurveyModal] = React.useState(false);
    const [showConfirmModal, setShowConfirmModal] = React.useState<any>(false);
    const [selectedHorario, setSelectedHorario] = React.useState<any>(null);
    const [isRatingModalOpen, setIsRatingModalOpen] = React.useState(false);

    // Feedback States
    const [calendarMessage, setCalendarMessage] = React.useState<string | null>(null);
    const [isUpdating, setIsUpdating] = React.useState(false);

    // Orientation/Touch (Placeholder for consistency)
    const [touchStart, setTouchStart] = React.useState<{ x: number, y: number } | null>(null);
    const [touchEnd, setTouchEnd] = React.useState<{ x: number, y: number } | null>(null);

    React.useEffect(() => {
        const updateVh = () => {
            const height = window.innerHeight || document.documentElement.clientHeight || 800;
            setVh(height);
        };
        updateVh();
        window.addEventListener('resize', updateVh);
        return () => window.removeEventListener('resize', updateVh);
    }, []);

    const toggleBlock = (blockNumber: number) => {
        setCollapsedBlocks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(blockNumber)) newSet.delete(blockNumber);
            else newSet.add(blockNumber);
            return newSet;
        });
    };

    return {
        vh,
        loading,
        setLoading,
        isDayLoading,
        setIsDayLoading,
        isVideoExpanded,
        setIsVideoExpanded,
        activeExerciseTab,
        setActiveExerciseTab,
        collapsedBlocks,
        setCollapsedBlocks,
        calendarExpanded,
        setCalendarExpanded,
        videoExpandY,
        videoExpandX,
        showStartModal,
        setShowStartModal,
        showStartInfoModal,
        setShowStartInfoModal,
        showSurveyModal,
        setShowSurveyModal,
        showConfirmModal,
        setShowConfirmModal,
        selectedHorario,
        setSelectedHorario,
        isRatingModalOpen,
        setIsRatingModalOpen,
        calendarMessage,
        setCalendarMessage,
        isUpdating,
        setIsUpdating,
        touchStart,
        setTouchStart,
        touchEnd,
        setTouchEnd,
        toggleBlock
    };
}
