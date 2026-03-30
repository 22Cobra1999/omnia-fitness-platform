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

    const toggleExerciseSimple = React.useCallback(async (activityKey: string, dateArg?: Date) => {
        if (!user) return;
        const sDate = dateArg || new Date();

        // Robust lookup: try direct ID match, then composite key match
        const activity = activities.find((a: Activity) =>
            String(a.id) === String(activityKey) ||
            `${a.exercise_id}_${a.bloque || 1}_${a.orden || 1}` === String(activityKey)
        );

        if (!activity) {
            console.warn('⚠️ [toggleExerciseSimple] Activity not found:', activityKey, 'in list of', activities.length);
            return;
        }

        try {
            const { getBuenosAiresDateString } = require('@/utils/date-utils');
            const currentDate = getBuenosAiresDateString(sDate);

            const isNutrition = [
                String((programInfo as any)?.categoria).toLowerCase(),
                String((programInfo as any)?.categoria_id).toLowerCase(),
                String((enrollment as any)?.activity?.categoria).toLowerCase(),
                String((enrollment as any)?.activity?.categoria_id).toLowerCase()
            ].some(s => s.includes('nutricion') || s === '7' || s === 'nutrición') || activities.some(a => 
                String((a as any).categoria).toLowerCase().includes('nutricion') || 
                String((a as any).categoria_id) === '7' ||
                String((a as any).type).toLowerCase() === 'nutricion'
            );

            const payload = {
                executionId: activity.ejercicio_id || activity.exercise_id,
                bloque: activity.bloque || 1,
                orden: activity.orden || 1,
                fecha: currentDate,
                categoria: programInfo?.categoria || enrollment?.activity?.categoria,
                activityId: Number(activityId),
                enrollmentId: enrollment?.id,
                isNutrition
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

    const toggleBlockCompletion = React.useCallback(async (blockNumber: number, dateArg?: Date) => {
        const sDate = dateArg || new Date();
        const blockActivities = activities.filter((a: any) => String(a.bloque) === String(blockNumber));
        if (blockActivities.length === 0) return;

        const isCurrentlyCompleted = blockActivities.every((a: any) => a.done);
        console.log('🔄 [toggleBlockCompletion] Block:', blockNumber, 'Activities found:', blockActivities.length, 'IsCompleted:', isCurrentlyCompleted);

        // 1. OPTIMISTIC BULK UPDATE
        setActivities((prev: any) => prev.map((a: any) => {
            const match = String(a.bloque) === String(blockNumber);
            if (match) console.log('✅ [toggleBlockCompletion] Matching activity:', a.id, 'New done:', !isCurrentlyCompleted);
            return match ? { ...a, done: !isCurrentlyCompleted } : a;
        }));

        // 2. BACKGROUND BULK SYNC
        const syncBulk = async () => {
            try {
                const { getBuenos_AiresDateString } = require('@/utils/date-utils'); // Fixed typo if any, should match project date utils
                const getBADate = (d: Date) => {
                    try { return require('@/utils/date-utils').getBuenosAiresDateString(d); } catch { return d.toISOString().split('T')[0]; }
                };
                const currentDate = getBADate(sDate);

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
                console.log('🚀 [toggleBlockCompletion] Sending payload:', payload);

                const response = await fetch(`/api/toggle-exercise`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();
                console.log('🏁 [toggleBlockCompletion] API Response:', response.status, result);

                if (!response.ok) {
                    console.error('❌ [toggleBlockCompletion] Sync failed:', result.error);
                    // Rollback or refetch
                    setActivities((prev: any) => prev.map((a: any) =>
                        String(a.bloque) === String(blockNumber) ? { ...a, done: isCurrentlyCompleted } : a
                    ));
                    if (fetchActivities) fetchActivities({ silent: true });
                } else {
                    refreshDayStatuses();
                    if (fetchActivities) fetchActivities({ silent: true });
                }
            } catch (e) {
                console.error('❌ Bulk sync failed:', e);
                setActivities((prev: any) => prev.map((a: any) =>
                    String(a.bloque) === String(blockNumber) ? { ...a, done: isCurrentlyCompleted } : a
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
