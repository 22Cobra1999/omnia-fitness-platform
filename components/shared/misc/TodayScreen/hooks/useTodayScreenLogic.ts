import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from "@/contexts/auth-context";
import { createClient } from '@/lib/supabase/supabase-client';
import {
    createBuenosAiresDate,
    getCurrentBuenosAiresDate,
    getTodayBuenosAiresString,
    getBuenosAiresDateString
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
    const { user } = useAuth() as { user: { id: string; level: string } | null };
    const supabase = createClient();

    // 1. Centralized States
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    useEffect(() => {
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
    const [selectedVideo, setSelectedVideo] = useState<any>(null);
    const [currentMonth, setCurrentMonth] = useState(selectedDate);

    // 2. Initialize Sub-hooks
    const ui = useTodayUiState();
    const data = useTodayDataLoaders(user, activityId, enrollmentId);
    const workshop = useWorkshopLogic(user, activityId, data.enrollment, data.programInfo);
    const editing = useExerciseEditing();

    // Define fetchActivities before actions
    const fetchActivities = useCallback(async (options?: { silent?: boolean }) => {
        if (!options?.silent) ui.setIsDayLoading(true);
        const result = await data.loadTodayActivities(selectedDate);
        data.setActivities(result.activities);
        data.setBlockNames(result.blockNames);
        if (!options?.silent) ui.setIsDayLoading(false);
        ui.setLoading(false);
        // Desactivar estado de inicialización tras la primera carga exitosa
        if (result.activities.length > 0) {
            console.log(`✅ [useTodayScreenLogic] Actividades cargadas correctamente (${result.activities.length}). Saliendo de inicialización.`);
            ui.setIsInitializing(false);
        } else {
            console.log(`⚠️ [useTodayScreenLogic] No hay actividades para la fecha seleccionada (${selectedDate.toISOString().split('T')[0]}).`);
            // Si el día está cargando y no hay actividades, igual quitamos el overlay de inicialización
            // porque la generación de progreso ya terminó, solo que este día específico está vacío (quizás descanso o precarga).
            ui.setIsInitializing(false);
        }
    }, [
        selectedDate,
        data.loadTodayActivities,
        data.setActivities,
        data.setBlockNames,
        ui.setIsDayLoading,
        ui.setIsInitializing,
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
    
    // Initialization Progress Simulation
    useEffect(() => {
        let interval: any;
        if (ui.isInitializing) {
            ui.setInitializationProgress(0);
            interval = setInterval(() => {
                ui.setInitializationProgress(prev => {
                    if (prev >= 92) return prev; // Limit to 92 until real completion
                    const inc = Math.random() * 8;
                    return Math.min(prev + inc, 92);
                });
            }, 600);
        } else {
            ui.setInitializationProgress(0);
            if (interval) clearInterval(interval);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [ui.isInitializing, ui.setInitializationProgress]);

    // Sync enrollment on back or external changes
    useEffect(() => {
        data.loadProgramInfo();
    }, [user?.id, activityId, data.loadProgramInfo]);

    // Load Today Activities
    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    // Workshop Loaders
    useEffect(() => {
        if (data.enrollment) {
            workshop.loadWorkshopData();
        }
    }, [data.enrollment, workshop.loadWorkshopData]);

    // Day Statuses
    useEffect(() => {
        data.refreshDayStatuses();
    }, [currentMonth, data.enrollment, data.refreshDayStatuses]);

    // Check if start modal should be shown
    useEffect(() => {
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
    useEffect(() => {
        data.loadMeetCredits();
    }, [data.programInfo, data.loadMeetCredits]);

    // --- Specific Actions (Coordinators) ---

    const openVideo = useCallback((videoUrl: string, activity: any) => {
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
            equipo: activity.equipo || activity.equipment || activity.exercise?.equipment || activity.exercise?.equipo,
            body_parts: activity.body_parts || activity.exercise?.body_parts,
            isPast
        });
        ui.setIsVideoExpanded(true);
    }, [selectedDate, activityId, data.backgroundImage, ui.setIsVideoExpanded]);

    const navigateActivity = useCallback((direction: number) => {
        if (!selectedVideo || !data.activities || data.activities.length === 0) return;

        const targetExId = Number(selectedVideo.exerciseId);
        const targetB = Number(selectedVideo.bloque);
        const targetO = Number(selectedVideo.orden);

        const currentIndex = data.activities.findIndex((a: any) => {
            const aExId = Number(a.exercise_id || a.exerciseId || (typeof a.id === 'string' ? a.id.split('-')[1] : a.id));
            const aB = Number(a.bloque || 1);
            const aO = Number(a.orden || 0);

            // Match exercise, block and order for precision
            return aExId === targetExId && aB === targetB && aO === targetO;
        });

        if (currentIndex === -1) {
            console.warn("Could not find current activity in list", { targetExId, targetB, targetO });
            // Fallback to ID comparison if precision fails
            const fallbackIndex = data.activities.findIndex((a: any) => a.id === selectedVideo.id);
            if (fallbackIndex === -1) return;

            const nextIdx = (fallbackIndex + direction + data.activities.length) % data.activities.length;
            const next = data.activities[nextIdx];
            if (next) openVideo(next.video_url || '', next);
            return;
        }

        const nextIndex = (currentIndex + direction + data.activities.length) % data.activities.length;
        const nextActivity = data.activities[nextIndex];

        if (nextActivity) {
            openVideo(nextActivity.video_url || '', nextActivity);
        }
    }, [selectedVideo, data.activities, openVideo]);

    const collapseVideo = useCallback(() => {
        ui.setIsVideoExpanded(false);
        setSelectedVideo(null);
        ui.videoExpandY.set(0);
    }, [ui.setIsVideoExpanded, ui.videoExpandY]);

    const handleConfirmAsistencia = useCallback(async () => {
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

    const handleEditarReservacion = useCallback(async (temaId: number) => {
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

    const handleConfirmUpdate = useCallback(async () => {
        ui.setIsUpdating(true);
        setTimeout(() => {
            ui.setIsUpdating(false);
            ui.setShowConfirmModal(false);
            ui.setCalendarMessage("Actividades reprogramadas");
            setTimeout(() => ui.setCalendarMessage(null), 3000);
        }, 1000);
    }, [ui.setIsUpdating, ui.setShowConfirmModal, ui.setCalendarMessage]);

    // Helpers
    const isTemaFinalizado = useCallback((temaId: number) => {
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

    const isWorkshopExpired = useCallback(() => {
        if (!data.enrollment?.expiration_date) return false;
        const expDate = new Date(data.enrollment.expiration_date);
        return expDate < new Date();
    }, [data.enrollment]);

    const isProgramExpired = useMemo(() => {
        if (!data.enrollment?.expiration_date || !data.enrollment?.start_date) return false;

        const expDateStr = data.enrollment.expiration_date.split('T')[0];
        const todayStr = getTodayBuenosAiresString();

        // 1. Si la suscripción expiró por fecha de expiración técnica (días de acceso)
        if (todayStr > expDateStr) return true;

        // 2. Si el estado es finalizada, ya no mostramos el programa (sino la encuesta)
        // Pero el usuario pidió que si finaliza HOY, se vea HOY y la encuesta mañana.
        if (data.enrollment?.status === 'finalizada' && todayStr > getBuenosAiresDateString(new Date((data.enrollment as any).updated_at || todayStr))) {
            return true;
        }

        // 3. Si ya pasamos todas las semanas del programa
        const totalWeeks = data.programInfo?.semanas_totales || data.programInfo?.duration_weeks || 4;
        const currentWeek = getWeekNumber(selectedDate, data.enrollment?.start_date);

        if (currentWeek > totalWeeks) {
            // Verificamos si realmente ya pasó el último día de la última semana
            const startDate = new Date(data.enrollment.start_date + 'T00:00:00');
            const lastDayOfProgram = new Date(startDate);
            lastDayOfProgram.setDate(startDate.getDate() + (totalWeeks * 7) - 1); // El último día es (start + totalWeeks*7 - 1)
            
            const lastDayStr = getBuenosAiresDateString(lastDayOfProgram);
            if (todayStr > lastDayStr) return true;
        }

        return false;
    }, [data.enrollment?.expiration_date, data.enrollment?.start_date, data.enrollment?.status, (data.enrollment as any)?.updated_at, data.programInfo, selectedDate]);

    const finalActions = useMemo(() => ({
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
                        console.error('❌ [useTodayScreenLogic] Error initializing progress:', errData);
                        alert('Error al inicializar progreso.');
                    } else {
                        console.log('✅ [useTodayScreenLogic] Progreso inicializado con éxito (Today)');
                    }

                    await data.loadProgramInfo();
                    // Refrescar actividades explícitamente después de que el estado de enrollment se actualice
                    setTimeout(async () => {
                        console.log('🔄 [useTodayScreenLogic] Ejecutando fetchActivities post-inicialización (Today)...');
                        await fetchActivities();
                    }, 800);
                }
            } catch (e) {
                console.error('❌ [useTodayScreenLogic] Exception in handleStartToday:', e);
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
                    console.error('❌ [useTodayScreenLogic] Error initializing progress:', errData);
                    alert('Error al inicializar progreso. Revisa la consola para más detalles.');
                } else {
                    console.log('✅ [useTodayScreenLogic] Progreso inicializado con éxito');
                }

                await data.loadProgramInfo();
                // Refrescar actividades explícitamente después de que el estado de enrollment se actualice
                setTimeout(async () => {
                    console.log('🔄 [useTodayScreenLogic] Ejecutando fetchActivities post-inicialización...');
                    await fetchActivities();
                }, 800);
            }
        } catch (e) {
            console.error('❌ [useTodayScreenLogic] Exception in handleStartOnFirstDay:', e);
        } finally {
            ui.setIsDayLoading(false);
        }
    },
        setCalendarMessage: ui.setCalendarMessage,
        setShowOnboardingModal: ui.setShowOnboardingModal,
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
        refreshDayStatuses: data.refreshDayStatuses,
        fetchActivities: (options?: any) => fetchActivities(options),
        goToToday: () => actions.goToToday(),
        onNext: () => navigateActivity(1),
        onPrev: () => navigateActivity(-1),
        goToNextActivity: () => {
            const todayStr = selectedDate.toISOString().split('T')[0];
            const dates = Object.keys(data.dayStatuses).sort();
            let nextDateStr = dates.find(d => d > todayStr && (data.dayStatuses[d] === 'not-started' || data.dayStatuses[d] === 'started'));

            if (!nextDateStr) {
                const nextDay = new Date(selectedDate);
                nextDay.setDate(selectedDate.getDate() + 1);
                nextDateStr = nextDay.toISOString().split('T')[0];
            }

            if (nextDateStr) {
                setSelectedDate(new Date(nextDateStr + 'T12:00:00'));
            }
        },
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

    const nextAvailableActivity = useMemo(() => {
        if (!data.dayStatuses) return null;
        const dates = Object.keys(data.dayStatuses).sort();
        const todayStr = selectedDate.toISOString().split('T')[0];

        // Find next day with explicit "pending" or "started" status
        let nextDateStr = dates.find(d => d > todayStr && (data.dayStatuses[d] === 'not-started' || data.dayStatuses[d] === 'started'));

        // Fallback: If no explicit status found but it's not expired, assume next calendar day
        if (!nextDateStr && !isProgramExpired) {
            const nextDay = new Date(selectedDate);
            nextDay.setDate(selectedDate.getDate() + 1);
            nextDateStr = nextDay.toISOString().split('T')[0];
        }

        if (nextDateStr) {
            const nextDate = new Date(nextDateStr + 'T12:00:00');
            return {
                date: nextDateStr,
                dayName: getDayName(nextDate),
                fullDate: nextDate
            };
        }
        return null;
    }, [data.dayStatuses, selectedDate, isProgramExpired]);

    const state = useMemo(() => ({
        vh: ui.vh,
        loading: ui.loading,
        isDayLoading: ui.isDayLoading,
        isInitializing: ui.isInitializing,
        initializationProgress: ui.initializationProgress,
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
        isOnboardingLoading: data.isOnboardingLoading,
        isProfileComplete: data.isProfileComplete,
        showOnboardingModal: ui.showOnboardingModal,
        ...workshop,
        ...editing,
        selectedDate,
        selectedVideo,
        currentMonth,
        weekNumber: getWeekNumber(selectedDate, data.enrollment?.start_date),
        dayName: getDayName(selectedDate),
        firstDayOfActivity: data.enrollment?.start_date ? getDayName(new Date(data.enrollment.start_date)) : '',
        nextAvailableActivity,
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
        currentMonth,
        nextAvailableActivity
    ]);

    const helpers = useMemo(() => ({
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

    return useMemo(() => ({
        state,
        actions: finalActions,
        helpers
    }), [state, finalActions, helpers]);
}
