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

export function useTodayDataLoaders(user: any, activityId: string) {
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

        const { data: activity } = await supabase.from("activities").select("*").eq("id", activityId).single();
        if (activity) setProgramInfo(activity);

        try {
            const response = await fetch(`/api/activities/${activityId}/purchase-status`);
            const result = await response.json();
            if (result.success && result.data.enrollments?.length > 0) {
                const enr = result.data.enrollments[0];

                // Buscar calificación si existe
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
                    comentarios_omnia: survey?.comentarios_omnia || null,
                    workshop_version: survey?.workshop_version || null
                };

                setEnrollment(enrichedEnrollment);
                setIsRated(Boolean(enr.is_rated || enr.rated || enrichedEnrollment.rating_coach));

                // Check for expiration and snapshot
                if (enr.expiration_date) {
                    const todayStr = getTodayBuenosAiresString();
                    if (enr.expiration_date < todayStr) {
                        // Attempt to snapshot
                        fetch(`/api/activities/${activityId}/snapshot-expired`, { method: 'POST' })
                            .catch(err => console.error("Error creating snapshot", err));
                    }
                }
            } else {
                // Fallback: Buscar cualquier enrollment (incluso vencido/finalizado)
                const { data: fallbackEnrollment } = await supabase
                    .from('activity_enrollments')
                    .select('*')
                    .eq('client_id', user.id)
                    .eq('activity_id', activityId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (fallbackEnrollment) {
                    console.log("✅ [TodayDataLoaders] Fallback enrollment found:", fallbackEnrollment.id);
                    // Buscar calificación si existe (reusing logic)
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
                    setIsRated(Boolean(enrichedFallback.is_rated || enrichedFallback.rated || enrichedFallback.rating_coach));
                }
            }
        } catch (e) {
            console.error("Error loading enrollment", e);
        }

        const { data: media } = await supabase.from("activity_media").select("image_url").eq("activity_id", activityId).limit(1);
        if (media?.[0]?.image_url) {
            setBackgroundImage(media[0].image_url);
            setBackgroundImageLoaded(true);
        }
    }, [user, activityId]);

    const loadTodayActivities = React.useCallback(async (selectedDate: Date) => {
        if (!user || !activityId || !enrollment || !enrollment.start_date) return { activities: [], blockNames: {} };

        const startDateString = getBuenosAiresDateString(new Date(enrollment.start_date));
        const selectedDateString = getBuenosAiresDateString(selectedDate);
        const exerciseDay = calculateExerciseDayForDate(selectedDateString, startDateString);

        if (!exerciseDay) return { activities: [], blockNames: {} };

        try {
            const response = await fetch(`/api/activities/today?dia=${exerciseDay}&fecha=${selectedDateString}&activityId=${activityId}`);
            const result = await response.json();

            if (result.success && result.data.activities) {
                const categoria = result.data?.activity?.categoria || programInfo?.categoria || 'fitness';
                const mapped = result.data.activities.map((item: any, index: number) => {
                    const realExerciseId = Number(item.exercise_id || item.ejercicio_id || (typeof item.id === 'string' && item.id.includes('-') ? item.id.split('-')[1] : item.id));

                    return {
                        id: item.id || `${realExerciseId}_${item.bloque || 1}_${item.orden || index}`,
                        title: categoria === 'nutricion' ? (item.nombre_plato || item.title) : (item.nombre_ejercicio || item.name),
                        subtitle: item.formatted_series || 'Sin especificar',
                        type: item.tipo || 'general',
                        done: Boolean(item.completed || item.done),
                        bloque: Number(item.bloque || 1),
                        orden: Number(item.orden || index),
                        exercise_id: realExerciseId,
                        ejercicio_id: realExerciseId,
                        duration: item.duration,
                        minutos: item.minutos ?? item.duracion_minutos,
                        video_url: item.video_url,
                        description: item.descripcion || item.description,
                        calorias: item.calorias,
                        series: item.series,
                        detalle_series: item.detalle_series,
                        proteinas: item.proteinas,
                        carbohidratos: item.carbohidratos,
                        grasas: item.grasas,
                        receta: item.receta,
                        ingredientes: item.ingredientes,
                        body_parts: item.musculos || item.body_parts,
                        equipment: item.equipo || item.elementos,
                        reps: item.reps || item.repeticiones,
                        sets: item.sets || item.series_num || item.series,
                        kg: item.kg || item.peso
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
        const { data } = await supabase.from('coach_clients').select('meet_credits').eq('client_id', user.id).eq('coach_id', programInfo.coach_id).single();
        if (data) setMeetCreditsAvailable(data.meet_credits || 0);
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
