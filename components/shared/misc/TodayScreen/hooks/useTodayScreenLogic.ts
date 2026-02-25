import * as React from 'react';
import { useAuth } from "@/contexts/auth-context";
import { createClient } from '@/lib/supabase/supabase-client';
import {
    createBuenosAiresDate,
    getCurrentBuenosAiresDate,
    getTodayBuenosAiresString
} from '@/utils/date-utils';

// Sub-hooks
import { useTodayUiState } from './useTodayUiState';
import { useTodayDataLoaders } from './useTodayDataLoaders';
import { useWorkshopLogic } from './useWorkshopLogic';
import { useTodayActions } from './useTodayActions';
import { useExerciseEditing } from './useExerciseEditing';

// Utils
import { getWeekNumber, getDayName, calculateExerciseDayForDate } from '../utils/calendar-utils';

export function useTodayScreenLogic({ activityId, enrollmentId, onBack }: { activityId: string, enrollmentId?: string | null, onBack?: () => void }) {
    const { user } = useAuth();
    const supabase = createClient();

    // 1. Centralized States
    const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('selectedActivityDate');
            if (saved) {
                const date = new Date(saved);
                if (!isNaN(date.getTime())) {
                    localStorage.removeItem('selectedActivityDate');
                    setSelectedDate(date);
                }
            }
        }
    }, []);
    const [selectedVideo, setSelectedVideo] = React.useState<any>(null);
    const [currentMonth, setCurrentMonth] = React.useState(selectedDate);

    // 2. Initialize Sub-hooks
    const ui = useTodayUiState();
    const data = useTodayDataLoaders(user, activityId, enrollmentId);
    const workshop = useWorkshopLogic(user, activityId, data.enrollment, data.programInfo);
    const editing = useExerciseEditing();

    // Define fetchActivities before actions
    const fetchActivities = React.useCallback(async (options?: { silent?: boolean }) => {
        if (!options?.silent) ui.setIsDayLoading(true);
        const result = await data.loadTodayActivities(selectedDate);
        data.setActivities(result.activities);
        data.setBlockNames(result.blockNames);
        if (!options?.silent) ui.setIsDayLoading(false);
        ui.setLoading(false);
        // Desactivar estado de inicialización tras la primera carga exitosa
        if (result.activities.length > 0) {
            ui.setIsInitializing(false);
        }
    }, [
        selectedDate,
        data.loadTodayActivities,
        data.setActivities,
        data.setBlockNames,
        ui.setIsDayLoading,
        ui.setLoading
    ]);

    const actions = useTodayActions({
        user,
        activityId,
        enrollment: data.enrollment,
        programInfo: data.programInfo,
        activities: data.activities,
        setActivities: data.setActivities,
        refreshDayStatuses: data.refreshDayStatuses,
        setSelectedDate,
        fetchActivities
    });

    // 3. Effects & Coordination

    // Sync enrollment on back or external changes
    React.useEffect(() => {
        data.loadProgramInfo();
    }, [user?.id, activityId, data.loadProgramInfo]);

    // Load Today Activities
    React.useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    // Workshop Loaders
    React.useEffect(() => {
        if (data.enrollment) {
            workshop.loadWorkshopData();
        }
    }, [data.enrollment, workshop.loadWorkshopData]);

    // Day Statuses
    React.useEffect(() => {
        data.refreshDayStatuses();
    }, [currentMonth, data.enrollment, data.refreshDayStatuses]);

    // Check if start modal should be shown
    React.useEffect(() => {
        if (!data.enrollment) return;

        // Si no tiene start_date, mostrar modales de inicio
        if (!data.enrollment.start_date) {
            const today = new Date();
            const dayName = getDayName(today);

            // Siempre mostrar el modal detallado de info para que el usuario vea el contexto
            // de cuándo empieza la actividad y pueda elegir
            ui.setShowStartInfoModal(true);
        }
    }, [data.enrollment, ui.setShowStartInfoModal]);

    // Credits
    React.useEffect(() => {
        data.loadMeetCredits();
    }, [data.programInfo, data.loadMeetCredits]);

    // --- Specific Actions (Coordinators) ---

    const openVideo = React.useCallback((videoUrl: string, activity: any) => {
        console.log('🎬 [useTodayScreenLogic] openVideo:', activity);

        // Robust numeric exercise ID extraction
        const getNumericId = (act: any) => {
            if (act.exercise_id && !isNaN(Number(act.exercise_id))) return Number(act.exercise_id);
            if (act.ejercicio_id && !isNaN(Number(act.ejercicio_id))) return Number(act.ejercicio_id);
            const idStr = String(act.id || '');
            if (idStr.includes('-')) return Number(idStr.split('-')[1]);
            if (idStr.includes('_')) return Number(idStr.split('_')[0]);
            return Number(idStr);
        };

        const numericEjId = getNumericId(activity);

        const targetFecha = activity.date || selectedDate.toISOString().split('T')[0];
        const todayStr = getTodayBuenosAiresString();
        const isPast = targetFecha < todayStr;

        setSelectedVideo({
            url: videoUrl || activity.video_url || activity.url,
            exerciseName: activity.title || activity.nombre_ejercicio || activity.nombre || activity.nombre_plato,
            exerciseId: numericEjId,
            activity_id: activity.activity_id || activity.actividad_id || activityId,
            id: activity.id,
            description: activity.description || activity.descripcion || (activity.exercise?.description || activity.exercise?.descripcion),
            coverImageUrl: activity.coverImageUrl || data.backgroundImage,
            bloque: Number(activity.bloque || 1),
            orden: Number(activity.orden || 0),
            date: activity.date || selectedDate.toISOString().split('T')[0],
            detalle_series: activity.detalle_series || activity.series,
            categoria: activity.categoria || activity.tipo,
            done: Boolean(activity.done || activity.completed),
            completed: Boolean(activity.done || activity.completed),
            calorias: activity.calorias,
            minutos: activity.minutos || activity.duracion_min || activity.duration || activity.duracion_minutos,
            duration: activity.minutos || activity.duracion_min || activity.duration || activity.duracion_minutos,
            tipo: activity.tipo || activity.type,
            type: activity.tipo || activity.type,
            proteinas: activity.proteinas,
            carbohidratos: activity.carbohidratos,
            grasas: activity.grasas,
            receta: activity.receta,
            ingredientes: activity.ingredientes || activity.ingredients,
            isPast
        });
        ui.setIsVideoExpanded(true);
    }, [selectedDate, activityId, data.backgroundImage, ui.setIsVideoExpanded]);

    const navigateActivity = React.useCallback((direction: number) => {
        if (!selectedVideo || !data.activities || data.activities.length === 0) return;

        // Find current index using multiple potential ID fields for better robustness
        const targetId = selectedVideo.id;
        const targetExId = selectedVideo.exerciseId;
        const currentIndex = data.activities.findIndex((a: any) =>
            a.id === targetId ||
            a.exercise_id === targetExId ||
            a.exerciseId === targetExId ||
            (a.id === selectedVideo.exerciseId && selectedVideo.exerciseId)
        );

        if (currentIndex === -1) {
            console.warn("Could not find current activity in list", targetId);
            return;
        }

        let nextIndex = currentIndex + direction;
        // Circular navigation
        if (nextIndex < 0) nextIndex = data.activities.length - 1;
        if (nextIndex >= data.activities.length) nextIndex = 0;

        const nextActivity = data.activities[nextIndex];
        if (nextActivity) {
            openVideo(nextActivity.video_url || '', nextActivity);
        }
    }, [selectedVideo, data.activities, openVideo]);

    const collapseVideo = React.useCallback(() => {
        ui.setIsVideoExpanded(false);
        setSelectedVideo(null);
        ui.videoExpandY.set(0);
    }, [ui.setIsVideoExpanded, ui.videoExpandY]);

    const handleConfirmAsistencia = React.useCallback(async () => {
        if (!ui.showConfirmModal || !user || !data.enrollment || !workshop.ejecucionId || !ui.selectedHorario) return;
        // Logic for confirming workshop attendance...
        try {
            const { temaId, fecha, horario } = ui.selectedHorario;
            await supabase.from('taller_progreso_temas')
                .update({
                    confirmo_asistencia: true,
                    estado: 'reservado',
                    fecha_seleccionada: fecha,
                    horario_seleccionado: { hora_inicio: horario.hora_inicio, hora_fin: horario.hora_fin }
                } as any)
                .eq('ejecucion_id', workshop.ejecucionId)
                .eq('tema_id', temaId);

            ui.setShowConfirmModal(false);
            workshop.loadWorkshopData();
            data.refreshDayStatuses();
        } catch (e) { console.error(e); }
    }, [ui.showConfirmModal, user, data.enrollment, workshop.ejecucionId, ui.selectedHorario, ui.setShowConfirmModal, workshop.loadWorkshopData, data.refreshDayStatuses]);

    const handleEditarReservacion = React.useCallback(async (temaId: number) => {
        if (!workshop.ejecucionId) return;
        try {
            await supabase.from('taller_progreso_temas')
                .update({ fecha_seleccionada: null, horario_seleccionado: null, confirmo_asistencia: false, estado: 'pendiente' } as any)
                .eq('ejecucion_id', workshop.ejecucionId)
                .eq('tema_id', temaId);
            workshop.loadWorkshopData();
            data.refreshDayStatuses();
        } catch (e) { console.error(e); }
    }, [workshop.ejecucionId, workshop.loadWorkshopData, data.refreshDayStatuses]);

    const handleConfirmUpdate = React.useCallback(async () => {
        ui.setIsUpdating(true);
        setTimeout(() => {
            ui.setIsUpdating(false);
            ui.setShowConfirmModal(false);
            ui.setCalendarMessage("Actividades reprogramadas");
            setTimeout(() => ui.setCalendarMessage(null), 3000);
        }, 1000);
    }, [ui.setIsUpdating, ui.setShowConfirmModal, ui.setCalendarMessage]);

    // Helpers
    const isTemaFinalizado = React.useCallback((temaId: number) => {
        const today = getCurrentBuenosAiresDate();
        today.setHours(0, 0, 0, 0);

        const cubierto = workshop.temasCubiertos.find(t => t.tema_id === temaId);
        if (cubierto?.fecha_seleccionada) {
            const date = new Date(cubierto.fecha_seleccionada + 'T00:00:00');
            return date < today;
        }

        const pendiente = workshop.temasPendientes.find(t => t.tema_id === temaId);
        const snapshot = (pendiente as any)?.snapshot_originales;
        const horarios = snapshot?.fechas_horarios || [];

        if (horarios.length > 0) {
            const hasFutureDates = horarios.some((h: any) => {
                const hDate = new Date(h.fecha + 'T12:00:00');
                return hDate >= today;
            });
            return !hasFutureDates;
        }
        return false;
    }, [workshop.temasCubiertos, workshop.temasPendientes]);

    const isWorkshopExpired = React.useCallback(() => {
        if (!data.enrollment?.expiration_date) return false;
        const expDate = new Date(data.enrollment.expiration_date);
        return expDate < new Date();
    }, [data.enrollment]);

    const isProgramExpired = React.useMemo(() => {
        if (!data.enrollment?.expiration_date) return false;
        if (data.enrollment?.status === 'activa') return false; // Si está activa, no la damos por finalizada por fecha
        const expDateStr = data.enrollment.expiration_date; // YYYY-MM-DD
        const todayStr = getTodayBuenosAiresString();
        return todayStr > expDateStr;
    }, [data.enrollment?.expiration_date, data.enrollment?.status]);

    const finalActions = React.useMemo(() => ({
        ...actions,
        setSelectedDate,
        setCurrentMonth,
        openVideo,
        collapseVideo,
        toggleExerciseSimple: async (id: string, currentSelectedDate: Date = selectedDate) => {
            // Optimistically update selectedVideo locally to reflect completion in the Detail Overlay immediately
            if (selectedVideo && (selectedVideo.id === id || selectedVideo.exerciseId === id)) {
                setSelectedVideo((prev: any) => ({
                    ...prev,
                    done: !prev?.done,
                    completed: !prev?.completed
                }));
            }
            await actions.toggleExerciseSimple(id, currentSelectedDate);
        },
        toggleBlockCompletion: (num: number) => actions.toggleBlockCompletion(num, selectedDate),
        handlePrevDay: () => actions.handlePrevDay(selectedDate),
        handleNextDay: () => actions.handleNextDay(selectedDate),
        handleToggleDocumentProgress: workshop.handleToggleDocumentProgress,
        handleSelectHorario: (temaId: number, temaNombre: string, fecha: string, horario: any) => {
            ui.setSelectedHorario({ temaId, temaNombre, fecha, horario });
            ui.setShowConfirmModal(true);
        },
        confirmAsistencia: handleConfirmAsistencia,
        cancelConfirmacion: () => { ui.setShowConfirmModal(false); ui.setSelectedHorario(null); },
        editarReservacion: handleEditarReservacion,
        handleConfirmUpdate,
        setCalendarExpanded: ui.setCalendarExpanded,
        setIsRatingModalOpen: ui.setIsRatingModalOpen,
        setExpandedTema: workshop.setExpandedTema,
        setShowStartInfoModal: ui.setShowStartInfoModal,
        handleOpenSurveyModal: () => ui.setShowSurveyModal(true),
        handleCloseSurveyModal: () => ui.setShowSurveyModal(false),
        handleSurveyComplete: async (activityRating: number, coachRating: number, feedback: string) => {
            if (!user || !activityId || !data.enrollment) return;

            try {
                const response = await fetch(`/api/activities/${activityId}/save-survey`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        activityRating,
                        coachRating,
                        feedback,
                        enrollmentId: data.enrollment.id
                    })
                });

                if (response.ok) {
                    data.setIsRated(true);
                    ui.setShowSurveyModal(false);
                }
            } catch (error) {
                console.error('Error saving survey:', error);
            }
        },
        handleStartToday: async () => {
            if (!data.enrollment || !user) return;
            ui.setShowStartInfoModal(false);
            ui.setIsDayLoading(true);
            ui.setIsInitializing(true);

            try {
                const todayStr = getTodayBuenosAiresString();
                const { error } = await supabase
                    .from('activity_enrollments')
                    .update({ start_date: todayStr } as any)
                    .eq('id', data.enrollment.id);

                if (!error) {
                    const response = await fetch('/api/activities/initialize-progress', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            activityId: activityId,
                            clientId: user.id,
                            startDate: todayStr,
                            enrollmentId: data.enrollment.id
                        })
                    });

                    if (!response.ok) {
                        const errData = await response.json();
                        console.error('❌ Error initializing progress:', errData);
                    }

                    await data.loadProgramInfo();
                    // Refrescar actividades explícitamente después de que el estado de enrollment se actualice
                    setTimeout(async () => {
                        await fetchActivities();
                    }, 500);
                }
            } catch (e) {
                console.error(e);
            } finally {
                ui.setIsDayLoading(false);
            }
        },
        handleStartOnFirstDay: async () => {
            if (!data.enrollment || !user) return;
            ui.setShowStartInfoModal(false);
            ui.setIsDayLoading(true);
            ui.setIsInitializing(true);

            try {
                const today = new Date();

                // Normalizado para detectar el día deseado (por defecto Lunes = 1)
                const getTargetDayNum = (dayName: string) => {
                    const normalized = (dayName || 'lunes').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    if (normalized.includes('dom')) return 0;
                    if (normalized.includes('lun')) return 1;
                    if (normalized.includes('mar')) return 2;
                    if (normalized.includes('mie')) return 3;
                    if (normalized.includes('jue')) return 4;
                    if (normalized.includes('vie')) return 5;
                    if (normalized.includes('sab')) return 6;
                    return 1;
                };

                const targetDay = getTargetDayNum('lunes'); // Aquí podrías usar una config de la actividad si existiera
                const daysUntilTarget = (targetDay - today.getDay() + 7) % 7 || 7;

                const nextTargetDate = new Date(today);
                nextTargetDate.setDate(today.getDate() + daysUntilTarget);
                const nextTargetStr = nextTargetDate.toISOString().split('T')[0];

                const { error } = await supabase
                    .from('activity_enrollments')
                    .update({ start_date: nextTargetStr } as any)
                    .eq('id', data.enrollment.id);

                if (!error) {
                    const response = await fetch('/api/activities/initialize-progress', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            activityId: activityId,
                            clientId: user.id,
                            startDate: nextTargetStr,
                            enrollmentId: data.enrollment.id
                        })
                    });

                    if (!response.ok) {
                        const errData = await response.json();
                        console.error('❌ Error initializing progress:', errData);
                    }

                    await data.loadProgramInfo();
                    // Refrescar actividades explícitamente después de que el estado de enrollment se actualice
                    setTimeout(async () => {
                        await fetchActivities();
                    }, 500);
                }
            } catch (e) {
                console.error(e);
            } finally {
                ui.setIsDayLoading(false);
            }
        },
        setCalendarMessage: ui.setCalendarMessage,
        setIsEditing: editing.setIsEditing,
        setSourceDate: editing.setSourceDate,
        setTargetDate: editing.setTargetDate,
        setShowConfirmModal: ui.setShowConfirmModal,
        setIsDayLoading: ui.setIsDayLoading,
        setLoading: ui.setLoading,
        toggleBlock: ui.toggleBlock,
        isBlockCompleted: actions.isBlockCompleted,
        setIsVideoExpanded: ui.setIsVideoExpanded,
        setSelectedVideo: setSelectedVideo,
        goToToday: () => actions.goToToday(),
        onNext: () => navigateActivity(1),
        onPrev: () => navigateActivity(-1),
        goToNextActivity: () => { },
    }), [
        actions,
        selectedDate,
        selectedVideo,
        workshop,
        ui,
        editing,
        data,
        openVideo,
        collapseVideo,
        navigateActivity,
        handleConfirmAsistencia,
        handleEditarReservacion,
        handleConfirmUpdate,
        user,
        activityId,
        enrollmentId
    ]);

    const state = React.useMemo(() => ({
        vh: ui.vh,
        loading: ui.loading,
        isDayLoading: ui.isDayLoading,
        isInitializing: ui.isInitializing,
        isVideoExpanded: ui.isVideoExpanded,
        activeExerciseTab: ui.activeExerciseTab,
        collapsedBlocks: ui.collapsedBlocks,
        calendarExpanded: ui.calendarExpanded,
        videoExpandY: ui.videoExpandY,
        videoExpandX: ui.videoExpandX,
        showStartInfoModal: ui.showStartInfoModal,
        showSurveyModal: ui.showSurveyModal,
        showConfirmModal: ui.showConfirmModal,
        isRatingModalOpen: ui.isRatingModalOpen,
        calendarMessage: ui.calendarMessage,
        isUpdating: ui.isUpdating,
        isRated: data.isRated,
        isExpired: isProgramExpired,
        selectedHorario: ui.selectedHorario,
        programInfo: data.programInfo,
        enrollment: data.enrollment,
        activityId,
        backgroundImage: data.backgroundImage,
        activities: data.activities,
        blockNames: data.blockNames,
        dayStatuses: data.dayStatuses,
        dayCounts: data.dayCounts,
        meetCreditsAvailable: data.meetCreditsAvailable,
        ...workshop,
        ...editing,
        selectedDate,
        selectedVideo,
        currentMonth,
        weekNumber: getWeekNumber(selectedDate, data.enrollment?.start_date),
        dayName: getDayName(selectedDate),
        firstDayOfActivity: data.enrollment?.start_date ? getDayName(new Date(data.enrollment.start_date)) : '',
        nextAvailableActivity: null,
        progressData: { courseProgress: 0, completedProgress: 0, todayProgress: 0, totalDays: 40 }
    }), [
        ui,
        data,
        workshop,
        editing,
        isProgramExpired,
        activityId,
        selectedDate,
        selectedVideo,
        currentMonth
    ]);

    const helpers = React.useMemo(() => ({
        getWeekNumber: (d: Date) => getWeekNumber(d, data.enrollment?.start_date),
        getDayName,
        calculateExerciseDayForDate: (d: Date) => calculateExerciseDayForDate(d, data.enrollment?.start_date || new Date()),
        isTemaFinalizado,
        isWorkshopExpired,
        getAttendanceSummary: () => ({
            totalTopics: workshop.workshopTemas.length,
            attendedTopics: workshop.temasCubiertos.filter(t => t.asistio).length
        })
    }), [data.enrollment, isTemaFinalizado, isWorkshopExpired, workshop.workshopTemas, workshop.temasCubiertos]);

    return React.useMemo(() => ({
        state,
        actions: finalActions,
        helpers
    }), [state, finalActions, helpers]);
}
