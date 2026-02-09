import { createClient } from '@/lib/supabase/supabase-client';
import { useAuth } from "@/contexts/auth-context";
import { useState, useEffect, useCallback } from 'react';
import {
    createBuenosAiresDate,
    getBuenosAiresDateString,
    getBuenosAiresDayOfWeek,
    getBuenosAiresDayName,
    getTodayBuenosAiresString
} from '@/utils/date-utils';
import { format } from "date-fns";

export type Activity = {
    id: string;
    title: string;
    subtitle: string;
    done?: boolean;
    type?: string;
    duration?: number;
    minutos?: number | null;
    reps?: number;
    sets?: number;
    bloque?: number;
    video_url?: string | null;
    equipment?: string;
    series?: string;
    detalle_series?: any;
    description?: string;
    descripcion?: string;
    calorias?: number | null;
    body_parts?: string | null;
    intensidad?: string | null;
    proteinas?: number | null;
    carbohidratos?: number | null;
    grasas?: number | null;
    receta?: string | null;
    ingredientes?: string | null;
    ejercicio_id?: number | string;
    exercise_id?: number | string;
    orden?: number;
    order?: number;
    block?: number;
};

export const useTodayData = (activityId: string | undefined, enrollmentId: string | undefined | null) => {
    const { user } = useAuth();
    const supabase = createClient();

    // UI State
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [dayStatuses, setDayStatuses] = useState<{ [key: string]: string }>({});

    // Data State
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDayLoading, setIsDayLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [enrollment, setEnrollment] = useState<any>(null);
    const [programInfo, setProgramInfo] = useState<any>(null);
    const [meetCreditsAvailable, setMeetCreditsAvailable] = useState<number | null>(null);
    const [hasUserSubmittedSurvey, setHasUserSubmittedSurvey] = useState(false);

    // Helpers locally defined to match original logic
    const getWeekNumber = useCallback((date: Date, startDateStr: string) => {
        if (!startDateStr) return 1;

        const startDate = new Date(startDateStr + 'T00:00:00');
        startDate.setHours(0, 0, 0, 0);

        // Find Monday of start week
        const startMonday = new Date(startDate);
        const startDayOfWeek = startDate.getDay();
        const daysToMonday = startDayOfWeek === 0 ? -6 : 1 - startDayOfWeek;
        startMonday.setDate(startDate.getDate() + daysToMonday);

        // Find Monday of selected date week
        const selectedMonday = new Date(date);
        const selectedDayOfWeek = date.getDay();
        const daysToSelectedMonday = selectedDayOfWeek === 0 ? -6 : 1 - selectedDayOfWeek;
        selectedMonday.setDate(date.getDate() + daysToSelectedMonday);

        const diffTime = selectedMonday.getTime() - startMonday.getTime();
        const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
        return Math.max(1, diffWeeks + 1);
    }, []);

    const calculateExerciseDayForDate = useCallback((dateStr: string) => {
        const date = createBuenosAiresDate(dateStr);
        const dayIndex = getBuenosAiresDayOfWeek(date); // 0=Sun, 1=Mon
        return dayIndex === 0 ? 7 : dayIndex; // 1=Mon ... 7=Sun
    }, []);

    // 1. Fetch Basic Program Info & Enrollment
    const fetchProgramData = useCallback(async () => {
        if (!user || !activityId) return;

        try {
            setLoading(true);

            // Get Activity Info
            const { data: activityData, error: activityError } = await supabase
                .from('activities')
                .select('*')
                .eq('id', activityId)
                .single();

            if (activityError) throw activityError;
            setProgramInfo(activityData);

            // Get Enrollment
            let enrolData = null;
            if (enrollmentId) {
                const { data, error } = await supabase
                    .from('activity_enrollments')
                    .select('*')
                    .eq('id', enrollmentId)
                    .single();
                if (!error) enrolData = data;
            } else {
                const { data } = await supabase
                    .from('activity_enrollments')
                    .select('*')
                    .eq('client_id', user.id)
                    .eq('activity_id', activityId)
                    .maybeSingle();
                enrolData = data;
            }

            setEnrollment(enrolData);

            // Initial Date Setup: Go to Today or Start Date
            if (enrolData?.start_date) {
                // Logic to jump to relevant date could go here, 
            }

            // 4. Check Survey Status
            const { data: surveyData } = await supabase
                .from('activity_surveys')
                .select('id')
                .eq('activity_id', activityId)
                .eq('client_id', user.id)
                .maybeSingle();

            setHasUserSubmittedSurvey(!!surveyData);

            // 5. Check Meet Credits
            const { data: creditData } = await supabase
                .from('activity_enrollments')
                .select('meet_credits_total, updated_at')
                .eq('client_id', user.id)
                .eq('activity_id', activityId)
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            const credits = Number((creditData as any)?.meet_credits_total ?? 0);
            setMeetCreditsAvailable(Number.isFinite(credits) ? credits : 0);


        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching program data:', err);
        } finally {
            setLoading(false);
        }
    }, [user, activityId, enrollmentId, supabase]);

    // 2. Load Calendar Statuses (Dots)
    const loadDayStatuses = useCallback(async () => {
        if (!user || !activityId || !enrollment || !enrollment.start_date) return;

        try {
            const categoria = programInfo?.categoria || 'fitness';
            const tablaProgreso = categoria === 'nutricion' ? 'progreso_cliente_nutricion' : 'progreso_cliente';

            let query = supabase
                .from(tablaProgreso)
                .select('*')
                .eq('cliente_id', user.id)
                .not('fecha', 'is', null);

            if (enrollmentId) {
                query = query.eq('enrollment_id', enrollment.id);
            } else {
                query = query.eq('actividad_id', activityId);
            }

            const { data: progresoRecords, error } = await query;

            if (error || !progresoRecords) return;

            const newStatuses: Record<string, string> = {};

            for (const record of progresoRecords) {
                let completados = 0;
                let pendientes = 0;

                // Quick parse logic from original TodayScreen
                const countItems = (field: any) => {
                    if (!field) return 0;
                    try {
                        if (typeof field === 'string') {
                            const parsed = JSON.parse(field);
                            if (Array.isArray(parsed)) return parsed.length;
                            if (parsed.ejercicios && Array.isArray(parsed.ejercicios)) return parsed.ejercicios.length;
                            return Object.keys(parsed).length;
                        }
                        if (Array.isArray(field)) return field.length;
                        if (typeof field === 'object') {
                            if (Array.isArray((field as any).ejercicios)) return (field as any).ejercicios.length;
                            return Object.keys(field).length;
                        }
                    } catch { return 0; }
                    return 0;
                };

                completados = countItems(record.ejercicios_completados);
                pendientes = countItems(record.ejercicios_pendientes);

                const total = completados + pendientes;

                let status = 'not-started';
                if (completados === 0 && pendientes > 0) status = 'not-started';
                else if (completados === total && total > 0) status = 'completed';
                else if (completados > 0) status = 'started';
                else continue; // Skip empty days

                // Key using Buenos Aires date string logic
                const dateKey = createBuenosAiresDate(record.fecha).toDateString();
                newStatuses[dateKey] = status;
            }

            setDayStatuses(newStatuses);
        } catch (e) {
            console.error("Error loading day statuses:", e);
        }
    }, [user, activityId, enrollment, enrollmentId, programInfo, supabase]);

    // 3. Load Activities for Selected Date
    const loadTodayActivities = useCallback(async () => {
        if (!user || !activityId || !enrollment?.start_date) return;

        setIsDayLoading(true);
        try {
            const startDateString = getBuenosAiresDateString(new Date(enrollment.start_date));
            const selectedDateString = getBuenosAiresDateString(selectedDate);

            // 1-7 Day Index
            const exerciseDay = calculateExerciseDayForDate(selectedDateString);

            // API Call
            const url = `/api/activities/today?dia=${exerciseDay}&fecha=${selectedDateString}&activityId=${activityId}`;
            console.log('[useTodayData] requesting:', url);

            const response = await fetch(url);
            const result = await response.json();

            console.log('[useTodayData] response:', result);

            if (result.success && result.data?.activities) {
                const mapped = result.data.activities.map((a: any) => ({
                    ...a,
                    // Map generic fields if needed, similar to original logic
                    id: a.id || a.exercise_id,
                    title: a.nombre_ejercicio || a.name || a.title,
                }));
                // Filter duplicates if any?
                setActivities(mapped);
            } else {
                setActivities([]);
            }

        } catch (e) {
            console.error("Error loading activities:", e);
            setActivities([]);
        } finally {
            setIsDayLoading(false);
        }
    }, [user, activityId, enrollment, selectedDate, calculateExerciseDayForDate]);


    // Initial Loads
    useEffect(() => {
        fetchProgramData();
    }, [fetchProgramData]);

    useEffect(() => {
        if (enrollment) {
            loadDayStatuses();
        }
    }, [enrollment, loadDayStatuses, selectedDate]); // Reload statuses when date changes? No, statuses are global. Just on enrollment load or manual refresh. (Maybe selectedDate trigger update if we want real-time sync)

    useEffect(() => {
        if (enrollment) {
            loadTodayActivities();
        }
    }, [enrollment, loadTodayActivities]);


    return {
        // Data
        activities,
        loading,
        isDayLoading,
        error,
        programInfo,
        enrollment,
        dayStatuses,
        meetCreditsAvailable,
        hasUserSubmittedSurvey,

        // Date State
        selectedDate,
        setSelectedDate,
        currentMonth,
        setCurrentMonth,

        // Actions
        refreshData: () => {
            fetchProgramData();
            loadDayStatuses();
            loadTodayActivities();
        },

        // Helpers for UI
        getDayStatus: (date: Date) => {
            const baDate = createBuenosAiresDate(getBuenosAiresDateString(date));
            return dayStatuses[baDate.toDateString()] || 'no-exercises';
        }
    };
};
