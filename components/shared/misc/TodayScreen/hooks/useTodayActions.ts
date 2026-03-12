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

            // 1. INSTANT OPTIMISTIC UPDATE
            setActivities((prev: any) => prev.map((a: any) => a.id === activityKey ? { ...a, done: !a.done } : a));

            // 2. BACKGROUND SYNC (Optimized for speed)
            const syncRemote = async () => {
                try {
                    let response;
                    let retryCount = 0;
                    const maxRetries = 2;

                    while (retryCount < maxRetries) {
                        try {
                            response = await fetch(`/api/toggle-exercise`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload)
                            });
                            if (response.ok) break;
                        } catch (e) {
                            console.warn(`[toggleExerciseSimple] Background sync fail`);
                        }
                        retryCount++;
                        if (retryCount < maxRetries) await new Promise(r => setTimeout(r, 800));
                    }

                    if (!response || !response.ok) {
                        // 4. REVERT: If it truly failed after retries, show truth
                        setActivities((prev: any) => prev.map((a: any) => a.id === activityKey ? { ...a, done: !a.done } : a));
                        console.error('❌ Sync failed definitively - reverting UI');
                    } else {
                        // 3. LOW-PRIORITY REFRESH
                        refreshDayStatuses();
                        if (fetchActivities) fetchActivities({ silent: true });
                    }
                } catch (e) {
                    setActivities((prev: any) => prev.map((a: any) => a.id === activityKey ? { ...a, done: !a.done } : a));
                    console.error('❌ Sync network crash - reverting UI:', e);
                }
            };

            syncRemote();
            return;
        } catch (e) {
            console.error('❌ [toggleExerciseSimple] Error:', e);
            // Revert on error if needed
        }
    }, [user, activities, activityId, enrollment, programInfo, setActivities, refreshDayStatuses, fetchActivities]);

    const toggleBlockCompletion = React.useCallback(async (blockNumber: number, selectedDate: Date) => {
        const blockActivities = activities.filter((a: any) => a.bloque === blockNumber);
        if (blockActivities.length === 0) return;

        const isCurrentlyCompleted = blockActivities.every((a: any) => a.done);

        // 1. OPTIMISTIC BULK UPDATE
        setActivities((prev: any) => prev.map((a: any) =>
            a.bloque === blockNumber ? { ...a, done: !isCurrentlyCompleted } : a
        ));

        // 2. BACKGROUND BULK SYNC
        const syncBulk = async () => {
            try {
                const { getBuenos_AiresDateString } = require('@/utils/date-utils'); // Fixed typo if any, should match project date utils
                const getBADate = (d: Date) => {
                    try { return require('@/utils/date-utils').getBuenosAiresDateString(d); } catch { return d.toISOString().split('T')[0]; }
                };
                const currentDate = getBADate(selectedDate);

                const exercises = blockActivities.map(a => ({
                    id: a.ejercicio_id || a.exercise_id,
                    bloque: a.bloque || 1,
                    orden: a.orden || 1
                }));

                const payload = {
                    exercises,
                    fecha: currentDate,
                    categoria: programInfo?.categoria || enrollment?.activity?.categoria,
                    activityId: Number(activityId),
                    enrollmentId: enrollment?.id
                };

                const response = await fetch(`/api/toggle-exercise`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    // Revert if failed
                    setActivities((prev: any) => prev.map((a: any) =>
                        a.bloque === blockNumber ? { ...a, done: isCurrentlyCompleted } : a
                    ));
                } else {
                    refreshDayStatuses();
                    if (fetchActivities) fetchActivities({ silent: true });
                }
            } catch (e) {
                console.error('❌ Bulk sync failed:', e);
                setActivities((prev: any) => prev.map((a: any) =>
                    a.bloque === blockNumber ? { ...a, done: isCurrentlyCompleted } : a
                ));
            }
        };

        syncBulk();
    }, [activities, user, enrollment, programInfo, setActivities, refreshDayStatuses, fetchActivities]);

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
        goToToday,
        fetchActivities
    }), [
        toggleExerciseSimple,
        toggleBlockCompletion,
        isBlockCompleted,
        handlePrevDay,
        handleNextDay,
        goToToday,
        fetchActivities
    ]);
}
