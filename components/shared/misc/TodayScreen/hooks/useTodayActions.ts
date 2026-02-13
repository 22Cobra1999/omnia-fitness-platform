import * as React from 'react';

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
}: any) {

    const toggleExerciseSimple = async (activityKey: string, selectedDate: Date) => {
        if (!user) return;

        // Robust lookup: try direct ID match, then composite key match
        const activity = activities.find((a: any) =>
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
                bloque: activity.bloque,
                orden: activity.orden,
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
    };

    const toggleBlockCompletion = async (blockNumber: number, selectedDate: Date) => {
        const blockActivities = activities.filter((a: any) => a.bloque === blockNumber);
        const isCurrentlyCompleted = blockActivities.length > 0 && blockActivities.every((a: any) => a.done);

        // Toggle all in this block
        for (const act of blockActivities) {
            if (act.done === isCurrentlyCompleted) {
                await toggleExerciseSimple(act.id, selectedDate);
            }
        }
    };

    const handlePrevDay = (currentDate: Date) => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() - 1);
        setSelectedDate(d);
    };

    const handleNextDay = (currentDate: Date) => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + 1);
        setSelectedDate(d);
    };

    const goToToday = () => {
        setSelectedDate(new Date());
    };

    const isBlockCompleted = (blockNumber: number) => {
        const blockActivities = activities.filter((a: any) => a.bloque === blockNumber);
        return blockActivities.length > 0 && blockActivities.every((a: any) => a.done);
    };

    return {
        toggleExerciseSimple,
        toggleBlockCompletion,
        isBlockCompleted,
        handlePrevDay,
        handleNextDay,
        goToToday
    };
}
