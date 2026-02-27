
import { useState, useEffect, useRef } from 'react';
import { parseSeries } from '../utils/parsers';
import { getBuenosAiresDateString } from '@/utils/date-utils';

interface UseActivityDetailLogicProps {
    selectedVideo: any;
    toggleExerciseSimple: (id: string) => void;
    onNext: () => void;
    programInfo: any;
    enrollment: any;
    activityId?: string;
}

export function useActivityDetailLogic({
    selectedVideo,
    toggleExerciseSimple,
    onNext,
    programInfo,
    enrollment,
    activityId
}: UseActivityDetailLogicProps) {
    // Local state for tabs & UI
    const [isVideoPanelExpanded, setIsVideoPanelExpanded] = useState(false);
    const [activeMealTab, setActiveMealTab] = useState<'Ingredientes' | 'Instrucciones'>('Ingredientes');
    const [activeExerciseTab, setActiveExerciseTab] = useState<string>('Series');

    // Editing State
    const [isEditingSeries, setIsEditingSeries] = useState(false);
    const [editedSeries, setEditedSeries] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Action State
    const [isToggling, setIsToggling] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);

    const isNutrition =
        programInfo?.categoria === 'nutricion' ||
        enrollment?.activity?.categoria === 'nutricion' ||
        selectedVideo?.categoria === 'nutricion';

    // Logic for returning to defaults when video changes
    useEffect(() => {
        if (!selectedVideo) return;

        // Manual expand: show play button first
        setIsVideoPanelExpanded(false);

        setActiveMealTab('Ingredientes');
        setActiveExerciseTab('Series');
        setIsEditingSeries(false);

        // Reset scroll to top
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [selectedVideo?.id, selectedVideo?.exerciseId]);

    const handleStartEditing = () => {
        console.log('📝 [useActivityDetailLogic] Starting edit mode for video:', selectedVideo);
        const series = parseSeries(selectedVideo.detalle_series || selectedVideo.series);
        console.log('📝 [useActivityDetailLogic] Parsed series:', series);
        setEditedSeries(series.map((s: any) => ({ ...s, propagate: true })));
        setIsEditingSeries(true);
    };

    const handleSaveSeries = async () => {
        if (!selectedVideo || isSaving) return;
        setIsSaving(true);
        console.log('💾 [useActivityDetailLogic] handleSaveSeries triggered');

        try {
            const fechaString = getBuenosAiresDateString(new Date());

            // Robust ID extraction
            const getNumericId = (act: any) => {
                if (act.exerciseId && !isNaN(Number(act.exerciseId))) return Number(act.exerciseId);
                if (act.exercise_id && !isNaN(Number(act.exercise_id))) return Number(act.exercise_id);
                if (act.ejercicio_id && !isNaN(Number(act.ejercicio_id))) return Number(act.ejercicio_id);
                const idStr = String(act.id || '');
                if (idStr.includes('-')) return Number(idStr.split('-')[1]);
                if (idStr.includes('_')) return Number(idStr.split('_')[0]);
                return Number(idStr);
            };

            const ejId = getNumericId(selectedVideo);
            const actId = Number(activityId || selectedVideo.activity_id || enrollment?.actividad_id || enrollment?.activity_id);
            const targetFecha = selectedVideo.date || selectedVideo.fecha || fechaString;

            console.log('💾 [useActivityDetailLogic] Extracted params:', { ejId, actId, targetFecha, originalId: selectedVideo.id });

            if (!ejId || isNaN(actId)) {
                console.error('❌ [useActivityDetailLogic] Missing required params:', { ejId, actId, targetFecha });
                alert('Error: Faltan parámetros (ejercicioId o activityId). Por favor reporte este error.');
                setIsSaving(false);
                return;
            }

            // Simple formula to adjust kcal and minutes based on changes
            const originalSeries = parseSeries(selectedVideo.detalle_series || selectedVideo.series);
            const calculateTotalLoad = (sArray: any[]) => sArray.reduce((acc, s) => acc + (Number(s?.kg || 0) * Number(s?.reps || 0) * Number(s?.sets || 1)), 0);

            const oldLoad = calculateTotalLoad(originalSeries) || 1;
            const newLoad = calculateTotalLoad(editedSeries);
            const loadFactor = newLoad / oldLoad;

            // Kcal adjustment: scale with load but with a ceiling/floor to avoid extremes
            const adjustedKcal = selectedVideo.calorias ? Math.round(selectedVideo.calorias * Math.pow(loadFactor, 0.5)) : null;

            // Minutes adjustment: scale primarily with sets
            const oldSets = originalSeries.reduce((acc, s) => acc + Number(s?.sets || 1), 0) || 1;
            const newSets = editedSeries.reduce((acc, s) => acc + Number(s?.sets || 1), 0);
            const setsFactor = newSets / oldSets;
            const adjustedMin = selectedVideo.minutos ? Math.round(selectedVideo.minutos * setsFactor) : null;

            const payload = {
                ejercicioId: ejId,
                bloque: selectedVideo.bloque || 1,
                orden: selectedVideo.orden || 0,
                fecha: targetFecha,
                activityId: actId,
                propagateAlways: editedSeries.some(s => s.propagate),
                series: editedSeries.map(s => ({
                    reps: String(s.reps || '0'),
                    kg: String(s.kg || '0'),
                    series: String(s.sets || '1')
                })),
                adjustedKcal,
                adjustedMin
            };

            console.log('💾 [useActivityDetailLogic] Save Payload:', payload);

            const response = await fetch('/api/update-exercise-series', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            console.log('💾 [useActivityDetailLogic] Save Response:', result);

            if (result.success) {
                // Mutate the local object to reflect changes immediately
                selectedVideo.detalle_series = editedSeries.map(s => ({
                    repeticiones: s.reps,
                    peso: s.kg,
                    series: s.sets
                }));
                setIsEditingSeries(false);
            } else {
                alert(result.error || 'Error al guardar');
            }
        } catch (e) {
            console.error('❌ Error saving series:', e);
            alert('Error de conexión al guardar');
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleStatus = async () => {
        if (isToggling) return;
        setIsToggling(true);
        const wasDone = selectedVideo.done || selectedVideo.completed;
        try {
            // Use the unique ID from the activities list
            await toggleExerciseSimple(selectedVideo.id);
            // Auto-advance if we just marked it as done
            if (!wasDone) {
                setTimeout(onNext, 300);
            }
        } finally {
            setTimeout(() => setIsToggling(false), 500);
        }
    };

    return {
        // State
        isVideoPanelExpanded,
        setIsVideoPanelExpanded,
        activeMealTab,
        setActiveMealTab,
        activeExerciseTab,
        setActiveExerciseTab,
        isEditingSeries,
        setIsEditingSeries,
        editedSeries,
        setEditedSeries,
        isSaving,
        isToggling,
        scrollRef,
        isNutrition,

        // Actions
        handleStartEditing,
        handleSaveSeries,
        handleToggleStatus
    };
}
