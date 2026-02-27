import * as React from 'react';

import { Activity, Enrollment, ProgramInfo } from '../types';

interface UseTodayActionsProps {
    user: { id: string } | null;
    activityId: string;
    enrollment: Enrollment | null;
    programInfo: ProgramInfo | null;
    activities: Activity[];
    setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
    refreshDayStatuses: () => Promise<void>;
    setSelectedDate: (d: Date) => void;
    fetchActivities?: (options?: { silent?: boolean }) => Promise<void>;
}

export function useTodayActions({
    user,
    activityId,
    enrollment,
    programInfo,
    activities,
    setActivities,
    refreshDayStatuses,
    setSelectedDate,
    fetchActivities
}: UseTodayActionsProps) {

    const toggleExerciseSimple = React.useCallback(async (activityKey: string, selectedDate: Date) => {
        if (!user) return;

        // Robust lookup: try direct ID match, then composite key match
        const activity = activities.find((a: Activity) =>
            a.id === activityKey ||
            `${a.exercise_id}_${a.bloque}_${a.orden}` === activityKey
        );

        if (!activity) {
            console.warn('⚠️ [toggleExerciseSimple] Activity not found:', activityKey, 'in list of', activities.length);
            return;
        }

        try {
            const { getBuenosAiresDateString } = require('@/utils/date-utils');
            const currentDate = getBuenosAiresDateString(selectedDate);

            const payload = {
                executionId: activity.ejercicio_id || activity.exercise_id,
                bloque: activity.bloque || 1,
                orden: activity.orden || 1,
                fecha: currentDate,
                categoria: programInfo?.categoria || enrollment?.activity?.categoria,
                activityId: Number(activityId),
                enrollmentId: enrollment?.id
            };

            console.log('🔄 [toggleExerciseSimple] Toggling exercise:', payload);

            // Optimistic Update
            setActivities((prev: any) => prev.map((a: any) => a.id === activityKey ? { ...a, done: !a.done } : a));

            const response = await fetch('/api/toggle-exercise', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            console.log('✅ [toggleExerciseSimple] Response:', result);

            // Refresh data silently
            refreshDayStatuses();
            if (fetchActivities) {
                await fetchActivities({ silent: true });
            }
        } catch (e) {
            console.error('❌ [toggleExerciseSimple] Error:', e);
            // Revert on error if needed
        }
    }, [user, activities, activityId, enrollment, programInfo, setActivities, refreshDayStatuses, fetchActivities]);

    const toggleBlockCompletion = React.useCallback(async (blockNumber: number, selectedDate: Date) => {
        const blockActivities = activities.filter((a: any) => a.bloque === blockNumber);
        const isCurrentlyCompleted = blockActivities.length > 0 && blockActivities.every((a: any) => a.done);

        // Toggle all in this block
        for (const act of blockActivities) {
            if (act.done === isCurrentlyCompleted) {
                await toggleExerciseSimple(act.id, selectedDate);
            }
        }
    }, [activities, toggleExerciseSimple]);

    const handlePrevDay = React.useCallback((currentDate: Date) => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() - 1);
        setSelectedDate(d);
    }, [setSelectedDate]);

    const handleNextDay = React.useCallback((currentDate: Date) => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + 1);
        setSelectedDate(d);
    }, [setSelectedDate]);

    const goToToday = React.useCallback(() => {
        setSelectedDate(new Date());
    }, [setSelectedDate]);

    const isBlockCompleted = React.useCallback((blockNumber: number) => {
        const blockActivities = activities.filter((a: any) => a.bloque === blockNumber);
        return blockActivities.length > 0 && blockActivities.every((a: any) => a.done);
    }, [activities]);

    return React.useMemo(() => ({
        toggleExerciseSimple,
        toggleBlockCompletion,
        isBlockCompleted,
        handlePrevDay,
        handleNextDay,
        goToToday
    }), [
        toggleExerciseSimple,
        toggleBlockCompletion,
        isBlockCompleted,
        handlePrevDay,
        handleNextDay,
        goToToday
    ]);
}
