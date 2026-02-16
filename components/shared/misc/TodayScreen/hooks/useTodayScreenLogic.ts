import * as React from 'react';
import { useAuth } from "@/contexts/auth-context";
import { createClient } from '@/lib/supabase/supabase-client';
import {
    createBuenosAiresDate,
    getCurrentBuenosAiresDate
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
    const [selectedDate, setSelectedDate] = React.useState<Date>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('selectedActivityDate');
            if (saved) {
                const date = new Date(saved);
                if (!isNaN(date.getTime())) {
                    localStorage.removeItem('selectedActivityDate');
                    return date;
                }
            }
        }
        return new Date();
    });
    const [selectedVideo, setSelectedVideo] = React.useState<any>(null);
    const [currentMonth, setCurrentMonth] = React.useState(selectedDate);

    // 2. Initialize Sub-hooks
    const ui = useTodayUiState();
    const data = useTodayDataLoaders(user, activityId);
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

    // Credits
    React.useEffect(() => {
        data.loadMeetCredits();
    }, [data.programInfo, data.loadMeetCredits]);

    // --- Specific Actions (Coordinators) ---

    const openVideo = (videoUrl: string, activity: any) => {
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

        setSelectedVideo({
            url: videoUrl,
            exerciseName: activity.title || activity.nombre_ejercicio || activity.nombre,
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
            minutos: activity.minutos || activity.duracion_min || activity.duration,
            duration: activity.minutos || activity.duracion_min || activity.duration,
            tipo: activity.tipo || activity.type,
            type: activity.tipo || activity.type
        });
        ui.setIsVideoExpanded(true);
    };

    const navigateActivity = (direction: number) => {
        if (!selectedVideo || !data.activities || data.activities.length === 0) return;

        // Find current index using multiple potential ID fields for better robustness
        const targetId = selectedVideo.id || selectedVideo.exerciseId;
        const currentIndex = data.activities.findIndex((a: any) => a.id === targetId || a.exerciseId === targetId);

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
    };

    const collapseVideo = () => {
        ui.setIsVideoExpanded(false);
        setSelectedVideo(null);
        ui.videoExpandY.set(0);
    };

    const handleConfirmAsistencia = async () => {
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
    };

    const handleEditarReservacion = async (temaId: number) => {
        if (!workshop.ejecucionId) return;
        try {
            await supabase.from('taller_progreso_temas')
                .update({ fecha_seleccionada: null, horario_seleccionado: null, confirmo_asistencia: false, estado: 'pendiente' } as any)
                .eq('ejecucion_id', workshop.ejecucionId)
                .eq('tema_id', temaId);
            workshop.loadWorkshopData();
            data.refreshDayStatuses();
        } catch (e) { console.error(e); }
    };

    const handleConfirmUpdate = async () => {
        ui.setIsUpdating(true);
        setTimeout(() => {
            ui.setIsUpdating(false);
            ui.setShowConfirmModal(false);
            ui.setCalendarMessage("Actividades reprogramadas");
            setTimeout(() => ui.setCalendarMessage(null), 3000);
        }, 1000);
    };

    // Helpers
    const isTemaFinalizado = (temaId: number) => {
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
    };

    const isWorkshopExpired = () => {
        if (!data.enrollment?.expiration_date) return false;
        const expDate = new Date(data.enrollment.expiration_date);
        return expDate < new Date();
    };

    const finalActions = {
        ...actions,
        setSelectedDate,
        setCurrentMonth,
        openVideo,
        collapseVideo,
        toggleExerciseSimple: async (id: string) => {
            // Optimistically update selectedVideo locally to reflect completion in the Detail Overlay immediately
            if (selectedVideo && (selectedVideo.id === id || selectedVideo.exerciseId === id)) {
                setSelectedVideo((prev: any) => ({
                    ...prev,
                    done: !prev?.done,
                    completed: !prev?.completed
                }));
            }
            await actions.toggleExerciseSimple(id, selectedDate);
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
        setShowStartModal: ui.setShowStartModal,
        handleOpenSurveyModal: () => ui.setShowSurveyModal(true),
        handleCloseSurveyModal: () => ui.setShowSurveyModal(false),
        handleSurveyComplete: () => { ui.setShowSurveyModal(false); },
        handleStartToday: () => { ui.setShowStartInfoModal(false); },
        handleStartOnFirstDay: () => { ui.setShowStartInfoModal(false); },
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
        goToNextActivity: () => { }, // TODO: Implement if needed
        handleStartActivity: () => { }, // TODO
    };

    return {
        state: {
            vh: ui.vh,
            loading: ui.loading,
            isDayLoading: ui.isDayLoading,
            isVideoExpanded: ui.isVideoExpanded,
            activeExerciseTab: ui.activeExerciseTab,
            collapsedBlocks: ui.collapsedBlocks,
            calendarExpanded: ui.calendarExpanded,
            videoExpandY: ui.videoExpandY,
            videoExpandX: ui.videoExpandX,
            showStartModal: ui.showStartModal,
            showStartInfoModal: ui.showStartInfoModal,
            showSurveyModal: ui.showSurveyModal,
            showConfirmModal: ui.showConfirmModal,
            isRatingModalOpen: ui.isRatingModalOpen,
            calendarMessage: ui.calendarMessage,
            isUpdating: ui.isUpdating,
            isRated: data.isRated,
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
            nextAvailableActivity: null, // TODO: Logic to find next available
            progressData: { courseProgress: 0, completedProgress: 0, todayProgress: 0, totalDays: 40 }
        },
        actions: finalActions,
        helpers: {
            getWeekNumber: (d: Date) => getWeekNumber(d, data.enrollment?.start_date),
            getDayName,
            calculateExerciseDayForDate: (d: Date) => calculateExerciseDayForDate(d, data.enrollment?.start_date || new Date()),
            isTemaFinalizado,
            isWorkshopExpired,
            getAttendanceSummary: () => ({
                totalTopics: workshop.workshopTemas.length,
                attendedTopics: workshop.temasCubiertos.filter(t => t.asistio).length
            })
        }
    };
}
