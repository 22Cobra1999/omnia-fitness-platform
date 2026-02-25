import * as React from 'react';
import { createClient } from '@/lib/supabase/supabase-client';
import {
    getBuenosAiresDateString,
    createBuenosAiresDate,
    getCurrentBuenosAiresDate,
    getTodayBuenosAiresString
} from '@/utils/date-utils';
import { Activity } from '../types';
import { calculateExerciseDayForDate, loadDayStatusesAsMap } from '../utils/calendar-utils';

export function useTodayDataLoaders(user: any, activityId: string, enrollmentId?: string | null) {
    const supabase = createClient();
    const [programInfo, setProgramInfo] = React.useState<any>(null);
    const [enrollment, setEnrollment] = React.useState<any>(null);
    const [backgroundImage, setBackgroundImage] = React.useState<string>('');
    const [activities, setActivities] = React.useState<Activity[]>([]);
    const [blockNames, setBlockNames] = React.useState<Record<string, string>>({});
    const [dayStatuses, setDayStatuses] = React.useState<{ [key: string]: string }>({});
    const [dayCounts, setDayCounts] = React.useState({ completed: 0, pending: 0, started: 0 });
    const [meetCreditsAvailable, setMeetCreditsAvailable] = React.useState<number | null>(null);
    const [backgroundImageLoaded, setBackgroundImageLoaded] = React.useState(false);
    const [isRated, setIsRated] = React.useState(false);

    const loadProgramInfo = React.useCallback(async () => {
        if (!user || !activityId) return;

        try {
            // Parallel fetch for speed
            const [activityRes, purchaseRes, mediaRes] = await Promise.all([
                supabase.from("activities").select("*").eq("id", activityId).single(),
                fetch(`/api/activities/${activityId}/purchase-status`).then(r => r.json()),
                supabase.from("activity_media").select("image_url").eq("activity_id", activityId).limit(1)
            ]);

            // 1. Set Program Info
            if (activityRes.data) setProgramInfo(activityRes.data);

            // 2. Set Background Image
            if (mediaRes.data?.[0]?.image_url) {
                setBackgroundImage(mediaRes.data[0].image_url);
                setBackgroundImageLoaded(true);
            }

            // 3. Process Enrollment
            const result = purchaseRes;
            if (result.success && result.data.enrollments?.length > 0) {
                // Priority: URL enrollmentId > Most recent active > Most recent
                let targetEnrollmentId = enrollmentId;

                const sortedEnrollments = [...result.data.enrollments].sort((a: any, b: any) => {
                    const statusA = a.status === 'activa' ? 0 : 1;
                    const statusB = b.status === 'activa' ? 0 : 1;
                    if (statusA !== statusB) return statusA - statusB;
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                });

                const enr = targetEnrollmentId
                    ? sortedEnrollments.find(e => String(e.id) === String(targetEnrollmentId)) || sortedEnrollments[0]
                    : sortedEnrollments[0];

                console.log("✅ [TodayDataLoaders] Selected enrollment:", enr.id, "Status:", enr.status, "Exp:", enr.expiration_date, "Start:", enr.start_date);

                // Check for survey if enrolled
                const { data: survey } = await supabase
                    .from('activity_surveys')
                    .select('*')
                    .eq('enrollment_id', enr.id)
                    .maybeSingle();

                const enrichedEnrollment = {
                    ...enr,
                    rating_coach: survey?.coach_method_rating || null,
                    feedback_text: survey?.comments || null,
                    difficulty_rating: survey?.difficulty_rating || null,
                    would_repeat: survey?.would_repeat,
                    calificacion_omnia: survey?.calificacion_omnia || null,
                    comentarios_omnia: survey?.comments || null,
                    workshop_version: survey?.workshop_version || null
                };

                setEnrollment(enrichedEnrollment);
                setIsRated(Boolean(enrichedEnrollment.rating_coach || enrichedEnrollment.feedback_text));

                if (enr.expiration_date) {
                    const todayStr = getTodayBuenosAiresString();
                    if (enr.expiration_date < todayStr) {
                        fetch(`/api/activities/${activityId}/snapshot-expired`, { method: 'POST' })
                            .catch(err => console.error("Error creating snapshot", err));
                    }
                }
            } else {
                // Last ditch fallback if purchase-status didn't give us what we need
                const { data: fallbackEnrollment } = await supabase
                    .from('activity_enrollments')
                    .select('*')
                    .eq('client_id', user.id)
                    .eq('activity_id', activityId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (fallbackEnrollment) {
                    const { data: survey } = await supabase
                        .from('activity_surveys')
                        .select('*')
                        .eq('enrollment_id', fallbackEnrollment.id)
                        .maybeSingle();

                    const enrichedFallback = {
                        ...fallbackEnrollment,
                        rating_coach: survey?.coach_method_rating || null,
                        feedback_text: survey?.comments || null,
                        difficulty_rating: survey?.difficulty_rating || null,
                        would_repeat: survey?.would_repeat,
                        calificacion_omnia: survey?.calificacion_omnia || null,
                        comentarios_omnia: survey?.comentarios_omnia || null,
                        workshop_version: survey?.workshop_version || null
                    };

                    setEnrollment(enrichedFallback);
                    setIsRated(Boolean(enrichedFallback.rating_coach || enrichedFallback.feedback_text));
                }
            }
        } catch (e) {
            console.error("❌ [TodayDataLoaders] Error in parallel load:", e);
        }
    }, [user, activityId, enrollmentId, supabase, setProgramInfo, setEnrollment, setBackgroundImage, setBackgroundImageLoaded, setIsRated]);

    const loadTodayActivities = React.useCallback(async (selectedDate: Date) => {
        if (!user || !activityId || !enrollment || !enrollment.start_date) return { activities: [], blockNames: {} };

        const startDateString = getBuenosAiresDateString(new Date(enrollment.start_date));
        const selectedDateString = getBuenosAiresDateString(selectedDate);
        const exerciseDay = calculateExerciseDayForDate(selectedDateString, startDateString);

        if (!exerciseDay) {
            console.warn("⚠️ [TodayDataLoaders] No exerciseDay calculated for", selectedDateString, "from start", startDateString);
            return { activities: [], blockNames: {} };
        }

        try {
            console.log(`🔍 [TodayDataLoaders] Fetching activities: dia=${exerciseDay}, date=${selectedDateString}, enrollmentId=${enrollment.id}`);
            const response = await fetch(`/api/activities/today?dia=${exerciseDay}&fecha=${selectedDateString}&activityId=${activityId}&enrollmentId=${enrollment.id}`);
            const result = await response.json();

            if (result.success && result.data.activities) {
                const categoria = result.data?.activity?.categoria || programInfo?.categoria || 'fitness';
                const mapped = result.data.activities.map((item: any, index: number) => {
                    const realExerciseId = Number(item.exercise_id || item.ejercicio_id || (typeof item.id === 'string' && item.id.includes('-') ? item.id.split('-')[1] : item.id));

                    return {
                        ...item,
                        id: item.id || `${realExerciseId}_${item.bloque || 1}_${item.orden || index}`,
                        title: categoria === 'nutricion' ? (item.nombre_plato || item.title) : (item.nombre_ejercicio || item.name),
                        type: item.tipo || 'general',
                        done: Boolean(item.completed || item.done),
                        bloque: Number(item.bloque || 1),
                        orden: Number(item.orden || index),
                        exercise_id: realExerciseId,
                        ejercicio_id: realExerciseId,
                        reps: item.reps ?? item.reps_num ?? item.repeticiones,
                        sets: item.sets ?? item.series_num ?? item.series,
                        peso: item.peso ?? item.kg,
                        kg: item.kg ?? item.peso
                    };
                });
                return { activities: mapped, blockNames: result.data.blockNames || {} };
            }
        } catch (e) {
            console.error("Error loading activities", e);
        }
        return { activities: [], blockNames: {} };
    }, [user, activityId, enrollment, programInfo]);

    const refreshDayStatuses = React.useCallback(async () => {
        if (!user || !activityId || !enrollment?.start_date) return;
        const { statuses, counts } = await loadDayStatusesAsMap(user.id, activityId, enrollment);
        setDayStatuses(statuses);
        setDayCounts(counts);
    }, [user, activityId, enrollment]);

    const loadMeetCredits = React.useCallback(async () => {
        if (!user || !programInfo?.coach_id) return;
        try {
            const { data, error } = await supabase
                .from('coach_clients')
                .select('meet_credits')
                .eq('client_id', user.id)
                .eq('coach_id', programInfo.coach_id)
                .maybeSingle();
            if (!error && data) setMeetCreditsAvailable(data.meet_credits || 0);
        } catch {
            // Table might not exist or no relationship — not a breaking error
        }
    }, [user, programInfo]);

    return React.useMemo(() => ({
        programInfo,
        enrollment,
        setEnrollment,
        backgroundImage,
        activities,
        setActivities,
        blockNames,
        setBlockNames,
        dayStatuses,
        dayCounts,
        meetCreditsAvailable,
        isRated,
        setIsRated,
        loadProgramInfo,
        loadTodayActivities,
        refreshDayStatuses,
        loadMeetCredits
    }), [
        programInfo,
        enrollment,
        backgroundImage,
        activities,
        blockNames,
        dayStatuses,
        dayCounts,
        meetCreditsAvailable,
        isRated,
        loadProgramInfo,
        loadTodayActivities,
        refreshDayStatuses,
        loadMeetCredits
    ]);
}
