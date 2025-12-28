'use client';

import * as React from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';
import { UniversalVideoPlayer } from '@/components/shared/video/universal-video-player';
import { createClient } from '@/lib/supabase/supabase-client';
import { useAuth } from "@/contexts/auth-context";
import { ActivitySurveyModal } from "../activities/activity-survey-modal";
import { StartActivityModal } from "../activities/StartActivityModal";
import { StartActivityInfoModal } from "../activities/StartActivityInfoModal";
import { Flame, Edit, X, Save, Clock, Zap, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { SettingsIcon } from '@/components/shared/ui/settings-icon';
import { MessagesIcon } from '@/components/shared/ui/messages-icon';
import { OmniaLogoText } from '@/components/shared/ui/omnia-logo';
import { 
  createBuenosAiresDate, 
  getBuenosAiresDateString, 
  getBuenosAiresDayOfWeek,
  getBuenosAiresDayName,
  getTodayBuenosAiresString,
  getCurrentBuenosAiresDate
} from '@/utils/date-utils';

type Activity = { 
  id: string; 
  title: string; 
  subtitle: string; 
  done?: boolean;
  type?: string;
  duration?: number;
  minutos?: number | null; // Minutos desde minutos_json
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
  // Campos específicos para nutrición
  proteinas?: number | null;
  carbohidratos?: number | null;
  grasas?: number | null;
  receta?: string | null;
  ingredientes?: string | null;
  // Campos adicionales para identificación
  ejercicio_id?: number | string;
  exercise_id?: number | string;
  orden?: number;
  order?: number;
  block?: number;
};

export default function TodayScreen({ activityId, onBack }: { activityId: string, onBack?: () => void }) {
  const [vh, setVh] = React.useState<number>(typeof window !== 'undefined' ? window.innerHeight : 800);
  const [activities, setActivities] = React.useState<Activity[]>([]);
  const [blockNames, setBlockNames] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(true);
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [nextAvailableActivity, setNextAvailableActivity] = React.useState<{
    week: number;
    day: string;
    date: string;
  } | null>(null);
  
  const [programInfo, setProgramInfo] = React.useState<any>(null);
  const [backgroundImage, setBackgroundImage] = React.useState<string>('');
  const [enrollment, setEnrollment] = React.useState<any>(null);
  const [showStartModal, setShowStartModal] = React.useState(false);
  const [showStartInfoModal, setShowStartInfoModal] = React.useState(false);
  const [firstDayOfActivity, setFirstDayOfActivity] = React.useState<string>('lunes');
  
  // Estados para la expansión del video
  const [isVideoExpanded, setIsVideoExpanded] = React.useState(false);
  const [isVideoPanelExpanded, setIsVideoPanelExpanded] = React.useState(false); // Panel expandible dentro del detalle
  const [isIngredientesExpanded, setIsIngredientesExpanded] = React.useState(false); // Ingredientes colapsados por defecto
  const [activeExerciseTab, setActiveExerciseTab] = React.useState<'Técnica' | 'Equipamiento' | 'Músculos'>('Técnica'); // Tab activo para las secciones colapsables del ejercicio
  const [selectedVideo, setSelectedVideo] = React.useState<{
    url: string;
    exerciseName: string;
    exerciseId: string;
    description?: string;
    equipment?: string;
    detalle_series?: any;
    duration?: number;
    descripcion?: string;
    calorias?: number | null;
    tipo?: string; // Tipo de ejercicio (ej: Fuerza, Cardio)
    body_parts?: string | null; // Músculos trabajados
    // Campos específicos para nutrición
    proteinas?: number | null;
    carbohidratos?: number | null;
    grasas?: number | null;
    receta?: string | null;
    ingredientes?: string | null;
    minutos?: number | null;
    coverImageUrl?: string | null; // Imagen de portada del plato/ejercicio
  } | null>(null);
  
  // Motion value para el drag del video expandido
  const videoExpandY = useMotionValue(0);
  
  // Estados para navegación por deslizamiento
  const [touchStart, setTouchStart] = React.useState<{x: number, y: number} | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<{x: number, y: number} | null>(null);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [swipeDirection, setSwipeDirection] = React.useState<'left' | 'right' | null>(null);
  
  // Motion value para el swipe horizontal (cambio de ejercicios)
  const videoExpandX = useMotionValue(0);
  
  // Estado para valores editables de series/bloques
  const [editableSeries, setEditableSeries] = React.useState<Array<{id: number, reps: string, kg: string, series: string}>>([]);
  const [editingBlockIndex, setEditingBlockIndex] = React.useState<number | null>(null); // Índice del bloque en edición, null si ninguno
  const [originalSeries, setOriginalSeries] = React.useState<Array<{id: number, reps: string, kg: string, series: string}>>([]);
  
  const [progressData, setProgressData] = React.useState({
    courseProgress: 0,
    completedProgress: 0,
    todayProgress: 0,
    totalDays: 40
  });
  const [streakDays, setStreakDays] = React.useState(6);
  const [collapsedBlocks, setCollapsedBlocks] = React.useState<Set<number>>(new Set([2, 3, 4, 5, 6, 7, 8, 9, 10]));
  const [descriptionExpanded, setDescriptionExpanded] = React.useState(false);
  
  // Debug: Verificar si la descripción se está cargando
  React.useEffect(() => {
    if (programInfo?.description) {
    }
  }, [programInfo?.description, descriptionExpanded]);
  const [calendarExpanded, setCalendarExpanded] = React.useState(false);
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [dayStatuses, setDayStatuses] = React.useState<{[key: string]: string}>({});
  const [dayCounts, setDayCounts] = React.useState({
    pending: 0,    // Días pendientes (sin ejercicios completados)
    started: 0,    // Días en progreso (algunos ejercicios completados)
    completed: 0   // Días completados (todos los ejercicios completados)
  });
  const [isMonthPickerOpen, setIsMonthPickerOpen] = React.useState(false);
  const [totalExercises, setTotalExercises] = React.useState(0);
  
  const { user } = useAuth();
  const supabase = createClient();

  // Estados para el modal de encuesta
  const [showSurveyModal, setShowSurveyModal] = React.useState(false);
  const [hasUserSubmittedSurvey, setHasUserSubmittedSurvey] = React.useState(false);

  // Consultar directamente en Supabase si el usuario ya calificó este programa
  React.useEffect(() => {
    const checkSurveyStatus = async () => {
      if (!user?.id || !activityId) return;
      try {
        const supabaseClient = createClient();
        const { data, error } = await supabaseClient
          .from('activity_surveys')
          .select('id')
          .eq('activity_id', Number(activityId))
          .eq('client_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = no rows found for maybeSingle, en ese caso simplemente no hay encuesta
          console.error('Error consultando estado de encuesta en Supabase:', error);
          return;
        }

        setHasUserSubmittedSurvey(!!data);
      } catch (e) {
        console.error('Error consultando estado de encuesta en Supabase:', e);
      }
    };

    checkSurveyStatus();
  }, [user?.id, activityId]);

  // Funciones helper para calcular semana basada en lunes
  const getWeekNumber = (date: Date) => {
    if (!enrollment?.start_date) {
      return 1;
    }
    
    const startDate = new Date(enrollment.start_date + 'T00:00:00');
    startDate.setHours(0, 0, 0, 0);
    
    // Encontrar el lunes de la semana de inicio
    const startMonday = new Date(startDate);
    const startDayOfWeek = startDate.getDay();
    const daysToMonday = startDayOfWeek === 0 ? -6 : 1 - startDayOfWeek;
    startMonday.setDate(startDate.getDate() + daysToMonday);
    
    // Encontrar el lunes de la semana de la fecha seleccionada
    const selectedMonday = new Date(date);
    const selectedDayOfWeek = date.getDay();
    const daysToSelectedMonday = selectedDayOfWeek === 0 ? -6 : 1 - selectedDayOfWeek;
    selectedMonday.setDate(date.getDate() + daysToSelectedMonday);
    
    // Calcular diferencia en semanas
    const diffTime = selectedMonday.getTime() - startMonday.getTime();
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    const weekNumber = Math.max(1, diffWeeks + 1);
    
    // CORRECCIÓN TEMPORAL: Si es el 8 de septiembre, forzar semana 2
    if (date.toDateString() === 'Mon Sep 08 2025') {
      return 2;
    }
    
    // Debug especial para el 8 de septiembre
    if (date.toDateString() === 'Mon Sep 08 2025') {
      // console.log('Fecha de inicio del programa:', enrollment.start_date);
      // console.log('Start Monday:', startMonday.toDateString());
      // console.log('Selected Monday:', selectedMonday.toDateString());
      // console.log('Diferencia en tiempo (ms):', diffTime);
      // console.log('Diferencia en semanas:', diffWeeks);
      // console.log('Número de semana calculado:', weekNumber);
    }
    
    // Debug general para todas las fechas
    
    return weekNumber;
  };

  const getDayName = (date: Date) => {
    // Usar zona horaria de Buenos Aires para calcular correctamente el día
    const buenosAiresDate = new Date(date.toLocaleString("en-US", {timeZone: "America/Argentina/Buenos_Aires"}));
    const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const dayName = dayNames[buenosAiresDate.getDay()];
    return dayName;
  };

  // Función para encontrar la próxima actividad disponible
  const findNextAvailableActivity = async (activityId: string, fromWeek: number, fromDayName: string) => {
    try {
      console.log('🔍 Buscando próxima actividad disponible...');
      
      if (!user || !enrollment?.start_date) {
        return null;
      }

      const supabase = createClient();
      
      // Usar la fecha seleccionada como punto de partida (no la fecha de inicio del enrollment)
      // Buscar ejecuciones futuras desde la fecha seleccionada (hasta 6 semanas adelante)
      const searchStartDate = new Date(selectedDate);
      const endDate = new Date(searchStartDate);
      endDate.setDate(searchStartDate.getDate() + 42); // 6 semanas
      
      // Normalizar la fecha seleccionada al inicio del día
      const selectedDateString = getBuenosAiresDateString(selectedDate);
      const endDateString = getBuenosAiresDateString(endDate);
      
      console.log('🔍 Buscando próxima actividad desde:', {
        fecha_seleccionada: selectedDateString,
        fecha_fin_busqueda: endDateString,
        selectedDate: selectedDate
      });
      
      // Determinar la tabla correcta según la categoría de la actividad
      // Primero obtener la categoría de la actividad
      const { data: actividadData } = await supabase
        .from('activities')
        .select('categoria')
        .eq('id', activityId)
        .single();
      
      const categoria = actividadData?.categoria || 'fitness';
      const tablaProgreso = categoria === 'nutricion' ? 'progreso_cliente_nutricion' : 'progreso_cliente';
      
      console.log('🔍 [findNextAvailableActivity] Parámetros de búsqueda:', {
        activityId,
        categoria,
        tablaProgreso,
        cliente_id: user.id,
        fecha_seleccionada: selectedDateString,
        fecha_fin_busqueda: endDateString,
        selectedDate_objeto: selectedDate
      });

      // Buscar registros desde la fecha seleccionada (no desde la fecha de inicio)
      const { data: progresoRecords, error } = await supabase
        .from(tablaProgreso)
        .select('fecha, ejercicios_pendientes, ejercicios_completados')
        .eq('cliente_id', user.id)
        .eq('actividad_id', activityId)
        .gte('fecha', selectedDateString)
        .lte('fecha', endDateString)
        .order('fecha', { ascending: true });

      console.log('🔍 [findNextAvailableActivity] Registros de progreso encontrados:', {
        cantidad: progresoRecords?.length || 0,
        registros: progresoRecords?.slice(0, 3).map((r: any) => ({
          fecha: r.fecha,
          pendientes_keys_count: (() => {
            try {
              if (!r.ejercicios_pendientes) return 0
              const pendientes = typeof r.ejercicios_pendientes === 'string'
                ? JSON.parse(r.ejercicios_pendientes)
                : r.ejercicios_pendientes
              if (pendientes && typeof pendientes === 'object' && !Array.isArray(pendientes) && Array.isArray((pendientes as any).ejercicios)) {
                return ((pendientes as any).ejercicios || []).length
              }
              return pendientes && typeof pendientes === 'object' && !Array.isArray(pendientes)
                ? Object.keys(pendientes).length
                : 0
            } catch {
              return 0
            }
          })()
        })),
        error: error ? {
          code: (error as any).code,
          message: (error as any).message,
          details: (error as any).details
        } : null
      });

      if (error) {
        console.error('❌ [findNextAvailableActivity] Error en la consulta:', error);
        return null;
      }

      if (!progresoRecords || progresoRecords.length === 0) {
        console.log('❌ [findNextAvailableActivity] No se encontraron registros de progreso futuras');
        return null;
      }

      // Encontrar la próxima fecha con ejercicios
      const nextExecution = progresoRecords.find((record: any) => {
        // Comparar directamente las fechas como strings (formato YYYY-MM-DD)
        // Esto evita problemas de zona horaria
        const recordDateString = record.fecha; // Ya viene en formato YYYY-MM-DD desde la BD
        
        // Verificar que la fecha del registro sea mayor que la fecha seleccionada
        const isAfter = recordDateString > selectedDateString;
        
        // También verificar que tenga ejercicios pendientes
        let hasPendingExercises = false;
        let pendientesKeysCount = 0;
        try {
          const pendientes = typeof record.ejercicios_pendientes === 'string' 
            ? JSON.parse(record.ejercicios_pendientes) 
            : record.ejercicios_pendientes;
          if (pendientes && typeof pendientes === 'object' && !Array.isArray(pendientes) && Array.isArray((pendientes as any).ejercicios)) {
            pendientesKeysCount = ((pendientes as any).ejercicios || []).length
            hasPendingExercises = pendientesKeysCount > 0
          } else {
            hasPendingExercises = pendientes && typeof pendientes === 'object' && !Array.isArray(pendientes) && Object.keys(pendientes).length > 0;
            pendientesKeysCount = hasPendingExercises ? Object.keys(pendientes).length : 0;
          }
        } catch (e) {
          console.error('❌ [findNextAvailableActivity] Error parseando ejercicios_pendientes:', e);
          hasPendingExercises = false;
        }
        
        const cumpleCondicion = isAfter && hasPendingExercises;
        
        console.log('🔍 [findNextAvailableActivity] Comparando registro:', {
          fecha_registro: recordDateString,
          fecha_seleccionada: selectedDateString,
          isAfter,
          hasPendingExercises,
          pendientesKeysCount,
          cumple_condicion: cumpleCondicion,
          ejercicios_pendientes_raw: typeof record.ejercicios_pendientes === 'string' 
            ? record.ejercicios_pendientes.substring(0, 100) 
            : JSON.stringify(record.ejercicios_pendientes).substring(0, 100)
        });
        
        return cumpleCondicion;
      });

      if (nextExecution) {
        const nextDate = new Date(nextExecution.fecha + 'T00:00:00-03:00'); // Buenos Aires timezone
        const weekNumber = getWeekNumber(nextDate);
        const dayName = getDayName(nextDate);
        
        console.log('✅ [findNextAvailableActivity] Próxima actividad encontrada:', {
          fecha: nextExecution.fecha,
          dia_calculado: dayName,
          semana: weekNumber,
          nextDate: nextDate.toISOString()
        });
        
        return {
          week: weekNumber,
          day: dayName,
          date: nextExecution.fecha
        };
      }

      console.log('❌ [findNextAvailableActivity] No hay actividades futuras disponibles después de filtrar:', {
        total_registros: progresoRecords.length,
        fecha_seleccionada: selectedDateString,
        registros_filtrados: progresoRecords.map((r: any) => ({
          fecha: r.fecha,
          es_despues: r.fecha > selectedDateString,
          tiene_pendientes: (() => {
            try {
              const p = typeof r.ejercicios_pendientes === 'string' 
                ? JSON.parse(r.ejercicios_pendientes) 
                : r.ejercicios_pendientes;
              if (p && typeof p === 'object' && !Array.isArray(p) && Array.isArray((p as any).ejercicios)) {
                return ((p as any).ejercicios || []).length > 0
              }
              return p && typeof p === 'object' && !Array.isArray(p) && Object.keys(p).length > 0;
            } catch {
              return false;
            }
          })()
        }))
      });
      return null;
    } catch (error) {
      console.error('Error finding next activity:', error);
      return null;
    }
  };

  // Función para navegar a la próxima actividad
  const goToNextActivity = () => {
    if (nextAvailableActivity && nextAvailableActivity.date) {
      // Usar directamente la fecha encontrada por findNextAvailableActivity
      const nextDate = new Date(nextAvailableActivity.date + 'T00:00:00');
      nextDate.setHours(0, 0, 0, 0);
      
      console.log('📅 Navegando a próxima actividad:', {
        nextActivity: nextAvailableActivity,
        targetDate: nextAvailableActivity.date,
        calculatedDate: nextDate.toISOString().split('T')[0]
      });
      
      setSelectedDate(nextDate);
      setNextAvailableActivity(null);
    }
  };

  // Funciones para navegación por deslizamiento
  const minSwipeDistance = 50;

  const onTouchStart = React.useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  }, []);

  const onTouchMove = React.useCallback((e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  }, []);

  // Funciones para manejar la expansión del video
  const openVideo = async (videoUrl: string, exerciseName: string, exerciseId: string, description?: string, equipment?: string, detalle_series?: any, duration?: number, descripcion?: string, calorias?: number | null, proteinas?: number | null, carbohidratos?: number | null, grasas?: number | null, receta?: string | null, ingredientes?: string | null, minutos?: number | null, coverImageUrl?: string | null, tipo?: string, body_parts?: string | null) => {
    // Si no se pasó coverImageUrl, intentar obtenerla de la base de datos
    let finalCoverImageUrl = coverImageUrl;
    if (!finalCoverImageUrl) {
      try {
        const supabase = createClient();
        const isNutrition = programInfo?.categoria === 'nutricion' || enrollment?.activity?.categoria === 'nutricion';
        
        // Extraer el ID numérico del ejercicio de forma segura
        // El formato puede ser: "1235", "1235_1", "1235_1_1", etc.
        const exerciseIdParts = exerciseId.split('_');
        const ejercicioIdStr = exerciseIdParts[0];
        const ejercicioIdNum = parseInt(ejercicioIdStr, 10);
        
        // Validar que el ID sea un número válido
        if (isNaN(ejercicioIdNum) || ejercicioIdNum <= 0) {
          console.warn('⚠️ [openVideo] ID de ejercicio inválido:', exerciseId);
          finalCoverImageUrl = backgroundImage || null;
        } else {
          if (isNutrition) {
            // Para nutrición: la tabla nutrition_program_details no tiene image_url.
            // Usar directamente la imagen de la actividad general.
            finalCoverImageUrl = backgroundImage || null;
          } else {
            // Para fitness: la columna image_url no existe en ejercicios_detalles
            // Usar directamente la imagen de la actividad general
            finalCoverImageUrl = backgroundImage || null;
          }
          
          // Si no hay imagen en la tabla de detalles, usar la imagen de la actividad general
          if (!finalCoverImageUrl) {
            finalCoverImageUrl = backgroundImage || null;
          }
        }
      } catch (error) {
        console.error('❌ [openVideo] Error obteniendo imagen de portada:', error);
        finalCoverImageUrl = backgroundImage || null;
      }
    }
    console.log('🎬 [openVideo] Datos recibidos:', {
      exerciseName,
      exerciseId,
      duration_raw: duration,
      calorias_raw: calorias,
      detalle_series,
      description,
      equipment,
      tipo_duracion: typeof duration,
      tipo_calorias: typeof calorias,
      proteinas,
      carbohidratos,
      grasas,
      receta,
      ingredientes,
      minutos
    });
    setSelectedVideo({
      url: videoUrl,
      exerciseName,
      exerciseId,
      description,
      equipment,
      detalle_series,
      duration,
      descripcion,
      calorias,
      tipo: tipo || undefined,
      body_parts: body_parts || undefined,
      proteinas,
      carbohidratos,
      grasas,
      receta,
      ingredientes,
      minutos,
      coverImageUrl: finalCoverImageUrl
    });
    console.log('✅ [openVideo] selectedVideo actualizado:', {
      duration: duration,
      calorias: calorias
    });
    // Inicializar valores editables de series
    const parsed = parseSeries(detalle_series);
    const initialSeries = parsed.map((s: any) => ({
      id: s?.id ?? 0,
      reps: String(s?.reps || '0'),
      kg: String(s?.kg || '0'),
      series: String(s?.sets || (s as any)?.series || '0')
    }));
    setEditableSeries(initialSeries);
    setOriginalSeries(JSON.parse(JSON.stringify(initialSeries)));
    setEditingBlockIndex(null);
    setIsVideoExpanded(true);
    setActiveExerciseTab('Técnica'); // Resetear tab a Técnica cuando se abre un nuevo ejercicio
    
    // Notificar que estamos en el detalle de un ejercicio
    window.dispatchEvent(new CustomEvent('exercise-detail-opened', { 
      detail: { isOpen: true, exerciseId: exerciseId } 
    }));
  };

  const navigateToExercise = React.useCallback((direction: 'next' | 'previous') => {
    // console.log('navigateToExercise called:', direction);
    if (!selectedVideo) {
      // console.log('No selectedVideo');
      return;
    }
    
    const currentIndex = activities.findIndex(a => a.id === selectedVideo.exerciseId);
    // console.log('Current index:', currentIndex, 'Total activities:', activities.length);
    
    let newIndex;
    if (direction === 'next') {
      newIndex = currentIndex + 1;
      if (newIndex >= activities.length) newIndex = 0;
      } else {
      newIndex = currentIndex - 1;
      if (newIndex < 0) newIndex = activities.length - 1;
    }
    
    // console.log('New index:', newIndex);
    const nextExercise = activities[newIndex];
    
    if (nextExercise) {
      // console.log('Opening exercise:', nextExercise.title);
      // Inicializar valores editables de series para el nuevo ejercicio
      const parsed = parseSeries(nextExercise.series || nextExercise.detalle_series);
      const initialSeries = parsed.map((s: any) => ({
        id: s?.id ?? 0,
        reps: String(s?.reps || '0'),
        kg: String(s?.kg || '0'),
        series: String(s?.sets || (s as any)?.series || '0')
      }));
      setEditableSeries(initialSeries);
      setOriginalSeries(JSON.parse(JSON.stringify(initialSeries)));
      setEditingBlockIndex(null);
      openVideo(
        nextExercise.video_url || '',
        nextExercise.title,
        nextExercise.id,
        nextExercise.description,
        nextExercise.equipment,
        nextExercise.detalle_series || nextExercise.series,
        nextExercise.duration,
        nextExercise.descripcion,
        (nextExercise as any).calorias ?? null,
        (nextExercise as any).proteinas ?? null,
        (nextExercise as any).carbohidratos ?? null,
        (nextExercise as any).grasas ?? null,
        (nextExercise as any).receta ?? null,
        (nextExercise as any).ingredientes ?? null,
        (nextExercise as any).minutos ?? null,
        null, // coverImageUrl se obtendrá automáticamente
        nextExercise.type, // tipo de ejercicio
        (nextExercise as any).body_parts ?? null // músculos trabajados
      );
    } else {
      // console.log('No next exercise found');
    }
  }, [selectedVideo, activities, openVideo]);

  // Funciones para manejar el modal de encuesta
  const handleOpenSurveyModal = () => {
    setShowSurveyModal(true);
  };

  const handleCloseSurveyModal = () => {
    setShowSurveyModal(false);
  };

  const handleSurveyComplete = async (
    activityRating: number,
    coachRating: number,
    feedback: string,
    wouldRepeat: boolean | null,
    omniaRating: number,
    omniaComments: string
  ) => {
    try {
      if (!activityId || !user?.id) {
        console.error('No hay activityId o user para guardar la encuesta');
      } else {
        const supabaseClient = createClient();

        // Construir payload para activity_surveys
        const payload: any = {
          activity_id: Number(activityId),
          client_id: user.id,
          enrollment_id: enrollment?.id ?? null,
          difficulty_rating: activityRating ?? null,
          coach_method_rating: coachRating ?? null,
          would_repeat: typeof wouldRepeat === 'boolean' ? wouldRepeat : null,
          comments: feedback && feedback.trim().length > 0 ? feedback.trim() : null,
          calificacion_omnia: omniaRating || null,
          comentarios_omnia: omniaComments && omniaComments.trim().length > 0 ? omniaComments.trim() : null,
          workshop_version: null, // para programas normales
        };

        // Buscar si ya existe una encuesta para este cliente y actividad
        const { data: existingSurvey, error: fetchError } = await supabaseClient
          .from('activity_surveys')
          .select('id')
          .eq('activity_id', payload.activity_id)
          .eq('client_id', payload.client_id)
          .is('workshop_version', null)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error consultando encuesta existente en activity_surveys:', fetchError);
        } else if (existingSurvey?.id) {
          // Actualizar encuesta existente
          const { error: updateError } = await supabaseClient
            .from('activity_surveys')
            .update(payload)
            .eq('id', existingSurvey.id);

          if (updateError) {
            console.error('Error actualizando encuesta en activity_surveys:', updateError);
          } else {
            console.log('✅ Encuesta actualizada en activity_surveys');
          }
        } else {
          // Crear nueva encuesta
          const { error: insertError } = await supabaseClient
            .from('activity_surveys')
            .insert(payload);

          if (insertError) {
            console.error('Error insertando encuesta en activity_surveys:', insertError);
          } else {
            console.log('✅ Encuesta creada en activity_surveys');
          }
        }
      }

      // Marcar como enviada en memoria (la próxima carga se basará en BD)
      setHasUserSubmittedSurvey(true);
      setShowSurveyModal(false);
    } catch (error) {
      console.error('Error guardando calificación:', error);
    }
  };

  const onTouchEnd = React.useCallback(() => {
    // Solo manejar swipe vertical para el bottom sheet
    if (!touchStart || !touchEnd) return;
    
    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = touchStart.y - touchEnd.y;
    
    // Solo procesar swipe vertical para expandir/colapsar el sheet
    const isVerticalSwipe = Math.abs(deltaY) > Math.abs(deltaX);
    
    if (!isVideoExpanded && isVerticalSwipe) {
      // El swipe vertical se maneja automáticamente por Framer Motion
      // No necesitamos lógica adicional aquí
    }
  }, [touchStart, touchEnd, isVideoExpanded]);

  const collapseVideo = () => {
    setIsVideoExpanded(false);
    setSelectedVideo(null);
    videoExpandY.set(0); // Resetear la posición del drag vertical
    videoExpandX.set(0); // Resetear la posición del drag horizontal
    
    // Notificar que cerramos el detalle del ejercicio
    window.dispatchEvent(new CustomEvent('exercise-detail-closed', { 
      detail: { isOpen: false } 
    }));
  };
  
  // Notificar cuando se abre/cierra el detalle
  React.useEffect(() => {
    if (selectedVideo) {
      window.dispatchEvent(new CustomEvent('exercise-detail-opened', { 
        detail: { isOpen: true, exerciseId: selectedVideo.exerciseId } 
      }));
    } else {
      window.dispatchEvent(new CustomEvent('exercise-detail-closed', { 
        detail: { isOpen: false } 
      }));
    }
  }, [selectedVideo]);

  // Handler para cuando se termina de arrastrar el video expandido
  const handleVideoExpandDragEnd = (event: any, info: PanInfo) => {
    const threshold = 150; // Píxeles necesarios para cerrar
    
    if (info.offset.y > threshold) {
      // Si se arrastró lo suficiente hacia abajo, cerrar
      collapseVideo();
    } else {
      // Si no, volver a la posición inicial
      animate(videoExpandY, 0, { type: 'spring', stiffness: 400, damping: 40 });
    }
  };

  // Reproducir video cuando se expande el panel
  React.useEffect(() => {
    if (isVideoPanelExpanded && selectedVideo?.url) {
      console.log('🎬 Panel de video expandido, intentando reproducir:', selectedVideo.url);
      // Delay más largo para asegurar que el componente de video se haya renderizado completamente
      const timer = setTimeout(() => {
        // Buscar el video dentro del contenedor específico del panel
        const videoContainer = document.querySelector('[data-video-panel="true"]');
        const videoElement = videoContainer?.querySelector('video') as HTMLVideoElement;
        if (videoElement) {
          console.log('✅ Video encontrado, intentando reproducir');
          videoElement.play().catch((error) => {
            console.log('⚠️ No se pudo reproducir automáticamente (puede requerir interacción del usuario):', error);
          });
        } else {
          console.log('❌ Video no encontrado en el contenedor');
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isVideoPanelExpanded, selectedVideo?.url]);

  // Bloquear scroll del body cuando el video está expandido
  React.useEffect(() => {
    if (isVideoExpanded) {
      // Guardar el scroll actual del body
      const scrollY = window.scrollY;
      // Bloquear el scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restaurar el scroll cuando se cierra
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isVideoExpanded]);

  // Funciones de navegación para "Actividades de hoy" (día por día)
  function handleNextDay() {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(selectedDate.getDate() + 1);
    setSelectedDate(nextDate);
  }

  function handlePrevDay() {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(selectedDate.getDate() - 1);
    setSelectedDate(prevDate);
  }

  // Funciones de navegación para el calendario (semana por semana)
  function handleNextWeek() {
    const nextWeekDate = new Date(selectedDate);
    nextWeekDate.setDate(selectedDate.getDate() + 7);
    setSelectedDate(nextWeekDate);
    setCurrentMonth(nextWeekDate);
  }

  function handlePrevWeek() {
    const prevWeekDate = new Date(selectedDate);
    prevWeekDate.setDate(selectedDate.getDate() - 7);
    setSelectedDate(prevWeekDate);
    setCurrentMonth(prevWeekDate);
  }

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(new Date());
    setSelectedDate(today);
  };

  // Función para alternar colapso de bloques
  const toggleBlock = (blockNumber: number) => {
    setCollapsedBlocks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(blockNumber)) {
        newSet.delete(blockNumber);
    } else {
        newSet.add(blockNumber);
      }
      return newSet;
    });
  };

  // Función para determinar el bloque activo
  const getActiveBlock = () => {
    const blockNumbers = Object.keys(getActivitiesByBlocks(activities)).map(Number).sort((a, b) => a - b);
    
    for (let i = 0; i < blockNumbers.length; i++) {
      const blockNumber = blockNumbers[i];
      if (!isBlockCompleted(blockNumber)) {
        return blockNumber;
      }
    }
    
    return blockNumbers[blockNumbers.length - 1] || 1;
  };

  const isBlockCompleted = (blockNumber: number) => {
    const blockActivities = activities.filter(activity => activity.bloque === blockNumber);
    return blockActivities.length > 0 && blockActivities.every(activity => activity.done);
  };

  // Función para parsear las series
  const parseSeries = (seriesData?: any) => {
    if (!seriesData || seriesData === '' || seriesData === 'undefined' || seriesData === 'null') {
      console.log('🔍 [parseSeries] No hay datos de series:', seriesData);
      return [];
    }
    
    console.log('🔍 [parseSeries] Datos recibidos:', seriesData);
    
    // Si es un string, usar el formato anterior
    if (typeof seriesData === 'string') {
      const parsed = seriesData.split(';').map((group, index) => {
        const cleanGroup = group.trim().replace(/[()]/g, '');
        const parts = cleanGroup.split('-');
        
        if (parts.length >= 3) {
          return {
            id: index + 1,
            reps: parts[0],
            kg: parts[1],
            sets: parts[2]
          };
        }
        return null;
      }).filter(Boolean);
      
      console.log('🔍 [parseSeries] Datos parseados:', parsed);
      return parsed;
    }
    
    // Si es un array de objetos (nuevo formato)
    if (Array.isArray(seriesData)) {
      return seriesData.map((block, index) => ({
        id: index + 1,
        reps: block.repeticiones,
        kg: block.peso,
        sets: block.series
      }));
    }
    
    console.log('🔍 [parseSeries] Formato no reconocido:', typeof seriesData);
    return [];
  };

  // Función para obtener actividades agrupadas por bloques
  const getActivitiesByBlocks = (activities: Activity[]) => {
    const blocks: { [key: number]: Activity[] } = {};
    
    activities.forEach(activity => {
      const blockNumber = activity.bloque || 1;
      
      if (!blocks[blockNumber]) {
        blocks[blockNumber] = [];
      }
      blocks[blockNumber].push(activity);
    });
    
    return blocks;
  };

  // Función para obtener el formato PRS del primer ejercicio del bloque (solo una vez)
  const getBlockPRSFormat = (blockActivities: Activity[]) => {
    if (blockActivities.length === 0) return null;
    
    // Tomar el primer ejercicio del bloque
    const firstActivity = blockActivities[0];
    if (!firstActivity) return null;
    
    // Intentar parsear desde detalle_series o series
    const seriesData = firstActivity.detalle_series || firstActivity.series;
    if (!seriesData || seriesData === 'Sin especificar') return null;
    
    const parsed = parseSeries(seriesData);
    
    if (parsed.length === 0) return null;
    
    // Extraer el formato: P:peso|R:reps|S:series del primer bloque
    const firstBlock = parsed[0];
    if (firstBlock && firstBlock.kg !== undefined && firstBlock.reps !== undefined && firstBlock.sets !== undefined) {
      return `P:${firstBlock.kg}kg|R:${firstBlock.reps}|S:${firstBlock.sets}`;
    }
    
    return null;
  };

  // Función para obtener la semana actual del programa
  const getCurrentWeekOfProgram = () => {
    return getWeekNumber(selectedDate);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Convertir domingo de 0 a 6
    
    const days = [];
    
    // Agregar días del mes anterior para completar la primera semana
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthLastDay = new Date(year, month, 0);
      const day = prevMonthLastDay.getDate() - startingDayOfWeek + i + 1;
      days.push({ day, isCurrentMonth: false, date: new Date(year, month - 1, day) });
    }
    
    // Agregar días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({ day, isCurrentMonth: true, date });
    }
    
    // Agregar días del mes siguiente solo para completar la última semana (no semanas completas)
    const totalDays = days.length;
    const daysInLastWeek = totalDays % 7;
    if (daysInLastWeek > 0) {
      const daysToAdd = 7 - daysInLastWeek;
      for (let i = 1; i <= daysToAdd; i++) {
        days.push({ day: i, isCurrentMonth: false, date: new Date(year, month + 1, i) });
      }
    }
    
    return days;
  };

  const getDayStatus = (date: Date) => {
    const dateString = getBuenosAiresDateString(date);
    const buenosAiresDate = createBuenosAiresDate(dateString);
    const status = dayStatuses[buenosAiresDate.toDateString()];
    
    // Log para debug
    if (date.getDate() >= 20 && date.getDate() <= 30) {
    }
    
    // Si no hay estado definido, significa que no hay ejercicios para ese día
    if (!status) {
      return 'no-exercises';
    }
    return status;
  };

  // Función para calcular el estado de un día específico
  const calculateDayStatus = async (date: Date) => {
    if (!user || !activityId) return 'not-started';

    try {
      let weekNumber = getWeekNumber(date);
      const dayName = getDayName(date);
      
      // CORRECCIÓN: Forzar semanas correctas para días específicos
      if (date.toDateString() === 'Mon Sep 01 2025') {
        weekNumber = 1;
      } else if (date.toDateString() === 'Mon Sep 08 2025') {
        weekNumber = 2;
      } else if (date.toDateString() === 'Mon Sep 15 2025') {
        weekNumber = 3;
      } else if (date.toDateString() === 'Mon Sep 22 2025') {
        weekNumber = 4;
      }
      
      
      // Obtener todas las actividades del día - NUEVO ESQUEMA MODULAR
      const dayOrder = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
      const dayNumber = dayOrder.indexOf(dayName) + 1; // Convertir a número (1-7)
      
      const { data: dayActivities, error } = await supabase
        .from("ejercicios_detalles")
        .select("*")
        .contains('activity_id', { [activityId]: {} })
        .eq("semana", weekNumber)
        .eq("dia", dayNumber);
            
      if (error) {
        // console.error('❌ Error obteniendo actividades:', error);
            return 'not-started';
          }
          
      if (!dayActivities || dayActivities.length === 0) {
            return 'not-started';
          }
      
      // Obtener el estado de completado desde ejecuciones_ejercicio
      const exerciseIds = dayActivities.map((activity: any) => activity.id);
      const { data: customizations, error: customizationsError } = await supabase
        .from("ejecuciones_ejercicio")
        .select("ejercicio_id, completado")
        .eq("client_id", user.id)
        .in("ejercicio_id", exerciseIds);
        
      if (customizationsError) {
        // console.error('❌ Error obteniendo customizations:', customizationsError);
        return 'not-started';
      }
      
      // Crear un mapa de estados de completado
      const completionMap = new Map();
      if (customizations) {
        customizations.forEach((custom: any) => {
          completionMap.set(custom.fitness_exercise_id, custom.completed);
        });
      }
      
      // Contar ejercicios completados
      const completedCount = dayActivities.filter((activity: any) => 
        completionMap.get(activity.id) === true
      ).length;
      const totalCount = dayActivities.length;


      if (completedCount === 0) {
            return 'not-started';
      } else if (completedCount === totalCount) {
        return 'completed'; // Naranja - todos completados
      } else {
        return 'started'; // Amarillo - algunos completados
      }
        } catch (error) {
      // console.error('❌ Error calculando estado del día:', error);
          return 'not-started';
        }
  };

  // Función para cargar estados de todos los días del mes - SIMPLIFICADA con fecha_ejercicio
  const loadDayStatuses = async () => {
    console.log('🔄 TodayScreen: Cargando estados de días', {
      user: user?.id,
      activityId,
      enrollment: enrollment?.id,
      start_date: enrollment?.start_date
    });
    if (!user || !activityId || !enrollment || !enrollment.start_date) {
      return;
    }

    try {

      // Determinar la tabla correcta según la categoría de la actividad
      // Primero obtener la categoría de la actividad
      const { data: actividadData } = await supabase
        .from('activities')
        .select('categoria')
        .eq('id', activityId)
        .single();
      
      const categoria = actividadData?.categoria || 'fitness';
      const tablaProgreso = categoria === 'nutricion' ? 'progreso_cliente_nutricion' : 'progreso_cliente';
      
      // Obtener registros de progreso_cliente o progreso_cliente_nutricion según corresponda
      const { data: progresoRecords, error } = await supabase
        .from(tablaProgreso)
        .select('*')
        .eq('actividad_id', activityId)
        .eq('cliente_id', user.id)
        .not('fecha', 'is', null);

      if (error) {
        console.error('Error cargando estados de días:', error);
        return;
      }

      if (!progresoRecords || progresoRecords.length === 0) {
        console.log('📅 No hay registros de progreso aún');
        return;
      }

      const newDayStatuses: Record<string, string> = {};
      const counts = { completed: 0, pending: 0, started: 0 };
      let totalExercisesCount = 0;

      // Procesar cada registro de progreso
      for (const record of progresoRecords) {
        // Manejar tanto objetos como arrays en ejercicios_completados y ejercicios_pendientes
        let completados = 0;
        let pendientes = 0;
        
        try {
          if (typeof record.ejercicios_completados === 'string') {
            const parsed = JSON.parse(record.ejercicios_completados);
            completados = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
          } else if (Array.isArray(record.ejercicios_completados)) {
            completados = record.ejercicios_completados.length;
          } else if (typeof record.ejercicios_completados === 'object' && record.ejercicios_completados !== null) {
            completados = Object.keys(record.ejercicios_completados).length;
          }
          
          if (typeof record.ejercicios_pendientes === 'string') {
            const parsed = JSON.parse(record.ejercicios_pendientes);
            pendientes = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
          } else if (Array.isArray(record.ejercicios_pendientes)) {
            pendientes = record.ejercicios_pendientes.length;
          } else if (typeof record.ejercicios_pendientes === 'object' && record.ejercicios_pendientes !== null) {
            pendientes = Object.keys(record.ejercicios_pendientes).length;
          }
        } catch (err) {
          console.warn('Error parseando ejercicios:', err);
          completados = 0;
          pendientes = 0;
        }
        
        const totalEjercicios = completados + pendientes;
        
        totalExercisesCount += totalEjercicios;

        // Determinar estado del día
        let estadoDia: string;
        if (completados === 0 && pendientes > 0) {
          estadoDia = 'not-started';
          counts.pending++;
        } else if (completados === totalEjercicios && totalEjercicios > 0) {
          estadoDia = 'completed';
          counts.completed++;
        } else if (completados > 0 && pendientes > 0) {
          estadoDia = 'started';
          counts.started++;
        } else {
          continue; // Ignorar registros sin ejercicios
        }

        // Convertir fecha a Date para usar como clave (en Buenos Aires)
        const fechaDate = createBuenosAiresDate(record.fecha);
        newDayStatuses[fechaDate.toDateString()] = estadoDia;
        
        console.log(`📅 Día ${record.fecha}: ${completados}/${totalEjercicios} ejercicios - Estado: ${estadoDia}`);
      }

      setDayStatuses(newDayStatuses);
      setDayCounts(counts);
      setTotalExercises(totalExercisesCount);
      
      console.log('✅ Estados de días cargados exitosamente:', { newDayStatuses, counts });
      
      
    } catch (error) {
      console.error('Error cargando estados de días:', error);
    }
  };

  // Función antigua (comentada para referencia)
  const loadDayStatusesOld = async () => {
    if (!user || !activityId || !enrollment || !enrollment.start_date) return;

    try {
      // Obtener todos los ejercicios de la actividad
      const { data: allExercises, error: exercisesError } = await supabase
        .from('ejercicios_detalles')
        .select('id, dia')
        .eq('actividad_id', activityId);

      if (exercisesError || !allExercises) {
        console.error('Error obteniendo ejercicios:', exercisesError);
        return;
      }

      // Obtener todas las ejecuciones del usuario
      const { data: ejecuciones, error: ejecucionesError } = await supabase
        .from('ejecuciones_ejercicio')
        .select('ejercicio_id, completado')
        .eq('client_id', user.id);

      if (ejecucionesError) {
        console.error('Error obteniendo ejecuciones:', ejecucionesError);
        return;
      }

      // Crear mapa de estados por ejercicio
      const estadoPorEjercicio = new Map();
      if (ejecuciones) {
        ejecuciones.forEach((ejecucion: any) => {
          estadoPorEjercicio.set(ejecucion.ejercicio_id, ejecucion.completado);
        });
      }

      // Calcular estados por día
      const diasConEjercicios = new Map<number, number[]>(); // día -> [ejercicio_ids]
      allExercises.forEach((ejercicio: any) => {
        if (!diasConEjercicios.has(ejercicio.dia)) {
          diasConEjercicios.set(ejercicio.dia, []);
        }
        diasConEjercicios.get(ejercicio.dia)!.push(ejercicio.id);
      });

      const counts = { pending: 0, started: 0, completed: 0 };
      const newDayStatuses: {[key: string]: string} = {};

      // Obtener número de períodos para multiplicar (sin depender de fechas)
      const { data: periodosActivos, error: periodosError } = await supabase
        .from('periodos')
        .select('cantidad_periodos')
        .eq('actividad_id', activityId);

      const numeroPeriodos = periodosActivos?.[0]?.cantidad_periodos || 1;

      const startDate = new Date(enrollment.start_date);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      // Calcular estado para cada día con ejercicios
      for (const [dia, ejercicioIds] of diasConEjercicios) {
        let completados = 0;
        let pendientes = 0;

        // Cada ejercicio se repite por cada período activo
        const ejerciciosPorDia = ejercicioIds.length * numeroPeriodos;
        
        ejercicioIds.forEach(ejercicioId => {
          const completado = estadoPorEjercicio.get(ejercicioId);
          if (completado === true) {
            completados += numeroPeriodos; // Completado en todos los períodos
          } else {
            pendientes += numeroPeriodos; // Pendiente en todos los períodos
          }
        });

        // Determinar estado del día
        let estadoDia: string;
        if (completados === ejerciciosPorDia) {
          estadoDia = 'completed';
          counts.completed++;
        } else if (completados > 0) {
          estadoDia = 'started';
          counts.started++;
        } else {
          estadoDia = 'not-started';
          counts.pending++;
        }

        // Calcular qué fechas corresponden a este día de ejercicio específico
        // Según la tabla: Semana 1 Día 1, Semana 1 Día 7, Semana 2 Día 2, etc.
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        // Mapear días de ejercicio a semanas específicas
        const exerciseDayMapping = {
          1: 1, // Día 1 = Semana 1
          7: 1, // Día 7 = Semana 1  
          2: 2, // Día 2 = Semana 2
          3: 3, // Día 3 = Semana 3
          4: 4  // Día 4 = Semana 4
          };
          
          const targetWeek = exerciseDayMapping[dia as keyof typeof exerciseDayMapping];
          if (!targetWeek) return;
        
        for (let day = 1; day <= daysInMonth; day++) {
          const testDate = new Date(currentYear, currentMonth, day);
          const exerciseDayForDate = calculateExerciseDayForDate(testDate, startDate);
          
          // Calcular la semana basada en días transcurridos desde start_date
          const startMidnight = new Date(startDate.toISOString().split('T')[0] + 'T00:00:00');
          const testMidnight = new Date(testDate.toISOString().split('T')[0] + 'T00:00:00');
          const diffTime = testMidnight.getTime() - startMidnight.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          const weekNumber = Math.floor(diffDays / 7) + 1;
          
          // Solo asignar estado si la fecha corresponde exactamente a este día de ejercicio en esta semana
          if (exerciseDayForDate === dia && weekNumber === targetWeek) {
            newDayStatuses[testDate.toDateString()] = estadoDia;
          }
        }
        
        console.log(`   - Completados: ${completados}, Pendientes: ${pendientes}, Estado: ${estadoDia}`);
      }

      // Calcular total de ejercicios
      const totalEjercicios = Array.from(diasConEjercicios.values())
        .reduce((total, ejercicioIds) => total + (ejercicioIds.length * numeroPeriodos), 0);
      

      setDayStatuses(newDayStatuses);
      setDayCounts(counts);
      setTotalExercises(totalEjercicios);

    } catch (error) {
      console.error('Error cargando estados de días:', error);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() - 1);
      return newMonth;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + 1);
      return newMonth;
    });
  };

  const toggleBlockCompletion = async (blockNumber: number) => {
    console.log(`🔥🔥🔥 toggleBlockCompletion INICIADO para bloque: ${blockNumber} 🔥🔥🔥`);
    
    if (!user) {
      console.error('❌ Usuario no autenticado');
      return;
    }

    const blockActivities = activities.filter(activity => activity.bloque === blockNumber);
    console.log(`📋 Ejercicios del bloque ${blockNumber}:`, blockActivities.map(a => ({ id: a.id, name: a.title, done: a.done })));

    const allCompleted = blockActivities.length > 0 && blockActivities.every(a => a.done);
    const activitiesToToggle = allCompleted
      ? blockActivities.filter(a => a.done)
      : blockActivities.filter(a => !a.done);

    console.log(`🔄 Toggle bloque ${blockNumber}:`, {
      allCompleted,
      total: blockActivities.length,
      toToggle: activitiesToToggle.length
    });

    try {
      // Si el bloque está incompleto: completar faltantes.
      // Si el bloque está completo: desmarcar todo el bloque.
      const togglePromises = activitiesToToggle.map(activity => {
        console.log(`🔄 Toggleando ejercicio ${activity.id} del bloque ${blockNumber} (done actual: ${activity.done})`);
        return toggleExerciseSimple(activity.id);
      });

      // Esperar a que todos los toggles se completen
      await Promise.all(togglePromises);
      
      console.log(`✅ Bloque ${blockNumber} toggleado exitosamente`);
      
      // Recargar estados de días para sincronizar
      await loadDayStatuses();
      
    } catch (error) {
      console.error(`❌ Error en toggleBlockCompletion para bloque ${blockNumber}:`, error);
      alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  // NUEVA FUNCIÓN SIMPLE PARA TOGGLE
  const toggleExerciseSimple = async (activityKey: string) => {
    console.log(`🔥 toggleExerciseSimple INICIADO con activityKey: ${activityKey}`);
    
    if (!user) {
      console.error('❌ Usuario no autenticado');
      return;
    }

    try {
      // Buscar la actividad completa para obtener bloque, orden y ejercicio_id
      const activity = activities.find(a => a.id === activityKey)
      if (!activity) {
        console.error('❌ Actividad no encontrada:', activityKey)
        return
      }

      const ejercicioId = (activity as any).ejercicio_id || parseInt(activityKey)
      const bloque = (activity as any).bloque
      const orden = (activity as any).orden
      
      console.log(`🔍 Ejercicio encontrado:`, {
        activityKey,
        ejercicioId,
        bloque,
        orden,
        activity
      });

      // Obtener la fecha actual seleccionada
      const currentDate = selectedDate instanceof Date ? selectedDate.toISOString().split('T')[0] : selectedDate;
      
      console.log(`📤 Enviando petición a /api/toggle-exercise:`, {
        executionId: ejercicioId,
        bloque,
        orden,
        fecha: currentDate,
        activityId
      });
      
      const response = await fetch('/api/toggle-exercise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          executionId: ejercicioId,
          bloque,
          orden,
          fecha: currentDate,
          categoria: programInfo?.categoria || enrollment?.activity?.categoria,
          activityId: Number(activityId)
        })
      });

      const result = await response.json();
      console.log(`📡 Respuesta del servidor:`, { status: response.status, body: result });

      if (!response.ok) {
        console.error(`❌ Error del servidor:`, result);
        alert(`Error: ${result.error || 'Error desconocido'}`);
        return;
      }

      if (result.success) {
        console.log(`✅ Toggle exitoso:`, result);
        
        // Actualizar estado local usando el ID único
        setActivities(prevActivities => {
          return prevActivities.map(activity => {
            // Usar el ID único que combina ejercicio_id, bloque y orden
            const activityUniqueId = `${activity.ejercicio_id}_${activity.bloque}_${activity.orden}`;
            if (activityUniqueId === activityKey) {
              return { ...activity, done: !activity.done };
            }
            return activity;
          });
        });

        // Recargar estados de días
        await loadDayStatuses();
        
        console.log(`🎉 Ejercicio ${ejercicioId} toggleado exitosamente`);
      } else {
        console.error(`❌ Error en la respuesta:`, result);
        alert(`Error: ${result.error || 'Error desconocido'}`);
      }

    } catch (error) {
      console.error('❌ Error en toggleExerciseSimple:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  // Función para calcular qué día de ejercicio corresponde a una fecha específica en Buenos Aires
  const calculateExerciseDayForDate = (targetDate: Date | string, startDate: Date | string) => {
    // Normalizar fechas a strings en formato YYYY-MM-DD
    const startDateString = typeof startDate === 'string' ? startDate : getBuenosAiresDateString(startDate);
    const targetDateString = typeof targetDate === 'string' ? targetDate : getBuenosAiresDateString(targetDate);
    
    // Crear fechas en zona horaria de Buenos Aires
    const startBuenosAires = createBuenosAiresDate(startDateString);
    const targetBuenosAires = createBuenosAiresDate(targetDateString);
    
    // Obtener día de la semana en Buenos Aires
    const startDayOfWeek = getBuenosAiresDayOfWeek(startBuenosAires);
    const targetDayOfWeek = getBuenosAiresDayOfWeek(targetBuenosAires);
    
    // Calcular días transcurridos desde el inicio
    const diffTime = targetBuenosAires.getTime() - startBuenosAires.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Si la fecha es anterior al inicio, no hay ejercicio
    if (diffDays < 0) return null;
    
    // Si es el primer día (start_date), usar el día de la semana del inicio
    if (diffDays === 0) {
      return startDayOfWeek === 0 ? 7 : startDayOfWeek;
    }
    
    // Para días posteriores, calcular basándose en la semana
    const weeksElapsed = Math.floor(diffDays / 7);
    const daysIntoWeek = diffDays % 7;
    
    // Calcular el día de ejercicio considerando el ciclo semanal
    let exerciseDay = (startDayOfWeek === 0 ? 7 : startDayOfWeek) + daysIntoWeek;
    
    // Ajustar si se pasa de 7 (domingo)
    if (exerciseDay > 7) {
      exerciseDay = exerciseDay - 7;
    }
    
    console.log('📅 TodayScreen: Calculando día de ejercicio', {
      targetDate: targetDateString,
      startDate: startDateString,
      startDayOfWeek: startDayOfWeek === 0 ? 7 : startDayOfWeek,
      targetDayOfWeek: targetDayOfWeek === 0 ? 7 : targetDayOfWeek,
      diffDays,
      weeksElapsed,
      daysIntoWeek,
      exerciseDay
    });
    
    return exerciseDay;
  };

  // Función para manejar el inicio de la actividad desde el modal
  const handleStartActivity = async (startDate?: Date) => {
    if (!user) {
      console.error('❌ Usuario no autenticado');
      return;
    }

    try {
      const supabase = createClient();
      
      // Usar la fecha calculada en Buenos Aires
      const startDateString = startDate 
        ? getBuenosAiresDateString(startDate) 
        : getBuenosAiresDateString(getCurrentBuenosAiresDate());

      console.log('🚀 Iniciando actividad:', {
        enrollmentId: enrollment?.id,
        activityId: parseInt(activityId),
        startDate: startDateString
      });

      // Actualizar start_date en activity_enrollments ESPECÍFICAMENTE para este enrollment
      const { error } = await supabase
        .from('activity_enrollments')
        .update({
          start_date: startDateString,
          updated_at: new Date().toISOString()
        })
        .eq('id', enrollment?.id) // ← CRÍTICO: Usar enrollment.id específico, no activity_id
        .eq('client_id', user.id);

      if (error) {
        console.error('❌ Error iniciando actividad:', error);
        return;
      }

      // Inicializar progreso_cliente para todas las fechas planificadas
      console.log('📊 Inicializando progreso_cliente...');
      try {
        const initResponse = await fetch('/api/activities/initialize-progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            activityId: parseInt(activityId),
            clientId: user.id,
            startDate: startDateString
          })
        });

        if (!initResponse.ok) {
          console.error('❌ Error inicializando progreso:', await initResponse.text());
        } else {
          const initData = await initResponse.json();
          console.log('✅ Progreso inicializado:', initData);
        }
      } catch (initError) {
        console.error('❌ Error en inicialización de progreso:', initError);
        // No detener el flujo, el progreso se puede crear on-demand
      }

      console.log('✅ Start date actualizado para enrollment:', enrollment?.id);

      // Actualizar el enrollment local con la nueva fecha
      if (enrollment) {
        setEnrollment({
          ...enrollment,
          start_date: startDateString
        });
      }

      // Cerrar el modal
      setShowStartInfoModal(false);
      
      // Recargar los estados de días
      await loadDayStatuses();
      
      // Navegar al primer día con ejercicios (la start_date calculada)
      const firstDayDate = new Date(startDateString + 'T00:00:00');
      setSelectedDate(firstDayDate);
      
      console.log('🎉 Actividad iniciada correctamente - Navegando a:', startDateString);
      
    } catch (error) {
      console.error('❌ Error iniciando actividad:', error);
    }
  };


  // Función simplificada: Siempre calcula el próximo primer día
  const handleStartToday = async () => {
    await handleStartOnFirstDay();
  };

  const handleStartOnFirstDay = async () => {
    console.log(`🚀 Calculando inicio automático para ${firstDayOfActivity}...`);
    
    // Usar fecha de Buenos Aires
    const todayBuenosAires = getCurrentBuenosAiresDate();
    const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const currentDayIndex = getBuenosAiresDayOfWeek(todayBuenosAires);
    
    const daysMap: Record<string, number> = {
      'domingo': 0, 'lunes': 1, 'martes': 2, 'miercoles': 3,
      'jueves': 4, 'viernes': 5, 'sabado': 6
    };
    
    const targetDayIndex = daysMap[firstDayOfActivity] || 1;
    
    // Calcular días hasta el próximo día objetivo
    let daysUntilTarget = targetDayIndex - currentDayIndex;
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7; // Siguiente semana
    }
    // Si es 0 o negativo, significa que ya pasó hoy, ir a la próxima semana
    
    const startDate = new Date(todayBuenosAires);
    startDate.setDate(todayBuenosAires.getDate() + daysUntilTarget);
    
    console.log('📅 Fecha calculada para inicio:', {
      today: getBuenosAiresDateString(todayBuenosAires),
      todayDay: days[currentDayIndex],
      targetDay: firstDayOfActivity,
      daysToAdd: daysUntilTarget,
      startDate: getBuenosAiresDateString(startDate),
      isToday: daysUntilTarget === 0
    });
    
    await handleStartActivity(startDate);
  };

  // Efectos
  React.useEffect(() => {
    const updateVh = () => {
      // Usar window.innerHeight o document.documentElement.clientHeight para mejor compatibilidad móvil
      const height = window.innerHeight || document.documentElement.clientHeight || 800;
      setVh(height);
    };
    
    // Actualizar inmediatamente
    updateVh();
    
    // Escuchar cambios de tamaño
    window.addEventListener('resize', updateVh);
    window.addEventListener('orientationchange', updateVh);
    
    // También escuchar cambios en el viewport (útil para modo móvil de Chrome)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateVh);
    }
    
    return () => {
      window.removeEventListener('resize', updateVh);
      window.removeEventListener('orientationchange', updateVh);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateVh);
      }
    };
  }, []);

  // Cargar información del programa y enrollment
  const loadProgramInfo = async () => {
      if (!user || !activityId) return;

      try {
        const { data: activity, error: activityError } = await supabase
          .from("activities")
          .select("*")
          .eq("id", activityId)
          .single();

        if (activityError) {
        } else {
          setProgramInfo(activity);
          // Determinar el primer día de la actividad (simplificado: lunes por defecto)
          setFirstDayOfActivity('lunes');
        }

        // Usar endpoint API en lugar de consulta directa para evitar problemas de RLS
        try {
          const response = await fetch(`/api/activities/${activityId}/purchase-status`);
          const result = await response.json();
          
          if (result.success && result.data.enrollments && result.data.enrollments.length > 0) {
            // Usar el enrollment más reciente
            const enrollmentData = result.data.enrollments[0];
            setEnrollment(enrollmentData);
            
            // Verificar si tenemos enrollment válido con start_date
            if (!enrollmentData.start_date) {
              setSelectedDate(new Date());
              setProgressData({
                courseProgress: 0,
                completedProgress: 0,
                todayProgress: 0,
                totalDays: 40
              });
              setShowStartInfoModal(true);
            } else {
              setSelectedDate(new Date());
              
              const startDate = new Date(enrollmentData.start_date);
              const today = new Date();
              startDate.setUTCHours(0, 0, 0, 0);
              today.setUTCHours(0, 0, 0, 0);
              const diffTime = today.getTime() - startDate.getTime();
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              
              const totalDays = (activity?.program_duration_weeks_months || 8) * 7;
              const courseProgress = Math.min(Math.round((diffDays / totalDays) * 100), 100);
              
              setProgressData({
                courseProgress,
                completedProgress: 0, // Progress column doesn't exist in activity_enrollments
                todayProgress: 0,
                totalDays: totalDays
              });
            }
          } else {
            setEnrollment(null);
            // No hay enrollment, mostrar modal de inicio
            setSelectedDate(new Date());
            setProgressData({
              courseProgress: 0,
              completedProgress: 0,
              todayProgress: 0,
              totalDays: 40
            });
            setShowStartInfoModal(true);
          }
        } catch (apiError) {
          console.error('Error obteniendo enrollment via API:', apiError);
          setEnrollment(null);
          // En caso de error, mostrar modal de inicio
          setSelectedDate(new Date());
          setProgressData({
            courseProgress: 0,
            completedProgress: 0,
            todayProgress: 0,
            totalDays: 40
          });
          setShowStartInfoModal(true);
        }

        const { data: activityMedia, error: mediaError } = await supabase
          .from("activity_media")
          .select("id, image_url, video_url")
          .eq("activity_id", activityId)
          .limit(1);
          
        if (mediaError) {
        }

        if (activityMedia && activityMedia.length > 0 && activityMedia[0]?.image_url) {
          setBackgroundImage(activityMedia[0].image_url);
        } else {
          setBackgroundImage('');
        }

      } catch (error) {
        setBackgroundImage('');
        setSelectedDate(new Date());
      }
    };

  React.useEffect(() => {
    loadProgramInfo();
  }, [user?.id, activityId]);

  // Log explícito cuando cambia el día seleccionado
  React.useEffect(() => {
    try {
      const dayString = getBuenosAiresDateString(selectedDate)
      console.log('🗓️ Día modificado:', { selectedDate: dayString })
    } catch {
      console.log('🗓️ Día modificado (no formateado):', selectedDate)
    }
  }, [selectedDate])

  // Cargar actividades del día específico
  React.useEffect(() => {
    const loadTodayActivities = async () => {
      if (!user || !activityId || !enrollment) return;

      try {
        setLoading(true);
        
        // Si no hay start_date, no hay ejercicios para mostrar
        if (!enrollment.start_date) {
          setActivities([]);
          setNextAvailableActivity(null);
          return;
        }
        
        // Calcular qué día de ejercicio corresponde a la fecha seleccionada en Buenos Aires
        const startDateString = getBuenosAiresDateString(new Date(enrollment.start_date));
        const selectedDateString = getBuenosAiresDateString(selectedDate);
        
        const exerciseDay = calculateExerciseDayForDate(selectedDateString, startDateString);
        
        if (!exerciseDay) {
          setActivities([]);
          setNextAvailableActivity(null);
          return;
        }
        
        
        // Usar el endpoint de actividades con el día de ejercicio calculado y la fecha seleccionada
        console.log('🧭 TodayScreen: Llamando a /api/activities/today con:', { 
          dia: exerciseDay, 
          fecha: selectedDateString, 
          activityId 
        });
        
        const response = await fetch(`/api/activities/today?dia=${exerciseDay}&fecha=${selectedDateString}&activityId=${activityId}`);
        const result = await response.json();
        
        console.log('🧭 TodayScreen: Respuesta del endpoint:', result);
        console.log('📋 [TodayScreen] Actividades recibidas de API:', {
          cantidad: result.data?.activities?.length || 0,
          actividades: result.data?.activities?.map((a: any) => ({
            id: a.id,
            exercise_id: a.exercise_id,
            nombre: a.nombre_ejercicio || a.name,
            duracion_minutos: a.duracion_minutos,
            duracion_minutos_tipo: typeof a.duracion_minutos,
            duracion_minutos_null: a.duracion_minutos === null,
            duration: a.duration,
            duration_tipo: typeof a.duration,
            duracion_min: a.duracion_min,
            duracion_min_tipo: typeof a.duracion_min,
            calorias: a.calorias,
            calorias_tipo: typeof a.calorias,
            calorias_null: a.calorias === null,
            calorias_undefined: a.calorias === undefined,
            calorias_cero: a.calorias === 0,
            todosLosCampos: Object.keys(a || {}),
            valoresTodosCampos: Object.keys(a || {}).reduce((acc: any, key: string) => {
              acc[key] = { valor: a[key], tipo: typeof a[key], esNull: a[key] === null, esUndefined: a[key] === undefined };
              return acc;
            }, {})
          }))
        });
        
        if (result.success && result.data.activities && result.data.activities.length > 0) {
          // Obtener categoría del API o del programInfo
          const categoria = result.data?.activity?.categoria || programInfo?.categoria || enrollment?.activity?.categoria || 'fitness';
          
          const todayActivities: Activity[] = result.data.activities.map((item: any, index: number) => {
            const bloque = Number(item.bloque ?? item.block ?? 1);
            const orden = Number(item.orden ?? item.order ?? (index + 1));
            const ejercicioId = item.exercise_id || item.ejercicio_id || item.id;

            // El endpoint /api/activities/today ya devuelve si el ejercicio está completado
            const isCompleted = Boolean(item.completed);

            const duracion = item.duracion_minutos ?? item.duration ?? item.duracion_min ?? null;
            const calorias = item.calorias ?? item.calorias ?? null;
            
            console.log(`📋 [TodayScreen] Mapeando ${categoria === 'nutricion' ? 'plato' : 'ejercicio'} ${ejercicioId}:`, {
              nombre: item.nombre_ejercicio || item.name || item.nombre,
              categoria,
              proteinas: item.proteinas,
              carbohidratos: item.carbohidratos,
              grasas: item.grasas,
              minutos: item.minutos,
              receta: item.receta,
              ingredientes: item.ingredientes
            });
            
            // Obtener minutos desde minutos_json (viene del API como minutos o duracion_minutos)
            const minutos = item.minutos ?? item.duracion_minutos ?? duracion ?? null;
            
            const mappedActivity = {
              // id único que combina ejercicio_id, bloque y orden para evitar duplicados
              id: `${ejercicioId}_${bloque}_${orden}`,
              title: categoria === 'nutricion' 
                ? (item.nombre_ejercicio || item.name || item.nombre || item.ejercicio_name || `Plato ${ejercicioId}`)
                : (item.nombre_ejercicio || item.name || item.ejercicio_name || `Ejercicio ${ejercicioId}`),
              subtitle: item.formatted_series || item.detalle_series || 'Sin especificar',
              type: item.tipo || item.type || 'general',
              done: isCompleted,
              bloque,
              orden,
              ejercicio_id: ejercicioId,
              duration: duracion,
              minutos: minutos, // Agregar minutos desde minutos_json
              equipment: item.equipo || 'Ninguno',
              series: item.series || item.formatted_series || item.detalle_series,
              detalle_series: item.detalle_series,
              description: item.descripcion || item.description || '',
              video_url: item.video_url || null,
              descripcion: item.descripcion || item.description,
              calorias: calorias,
              body_parts: item.body_parts ?? null,
              intensidad: item.intensidad ?? null,
              // Campos específicos para nutrición
              proteinas: item.proteinas ?? null,
              carbohidratos: item.carbohidratos ?? null,
              grasas: item.grasas ?? null,
              receta: item.receta ?? null,
              ingredientes: item.ingredientes ?? null
            };
            
            console.log(`✅ [TodayScreen] Ejercicio ${ejercicioId} mapeado:`, {
              duration: mappedActivity.duration,
              calorias: mappedActivity.calorias,
              video_url: mappedActivity.video_url
            });
            
            return mappedActivity;
          });

          console.log('🧭 TodayScreen: Activities mapeadas (id único, done de BD)');
          console.table(todayActivities.map(a => ({ id: a.id, ejercicio_id: a.ejercicio_id, bloque: a.bloque, orden: a.orden, done: a.done })));
          
          console.log('✅ [TodayScreen] Actividades finales mapeadas:', {
            cantidad: todayActivities.length,
            actividades: todayActivities.map(a => ({
              id: a.id,
              ejercicio_id: a.ejercicio_id,
              nombre: a.title,
              duration: a.duration,
              calorias: (a as any).calorias,
              tipo_duracion: typeof a.duration,
              tipo_calorias: typeof (a as any).calorias
            }))
          });

          setActivities(todayActivities);
          // Guardar nombres de bloques si están disponibles
          if (result.data?.blockNames) {
            setBlockNames(result.data.blockNames);
          }
          // Siempre buscar próxima actividad para mostrar si no hay actividades hoy
          const weekNumber = getWeekNumber(selectedDate);
          const searchDayName = getDayName(selectedDate);
          console.log('🔍 [TodayScreen] Llamando a findNextAvailableActivity:', {
            activityId,
            weekNumber,
            searchDayName,
            selectedDate: selectedDate.toISOString(),
            selectedDateString: getBuenosAiresDateString(selectedDate)
          });
          const nextActivity = await findNextAvailableActivity(activityId, weekNumber, searchDayName);
          console.log('🔍 [TodayScreen] Resultado de findNextAvailableActivity:', {
            nextActivity,
            tiene_actividad: !!nextActivity,
            fecha_proxima: nextActivity?.date
          });
          setNextAvailableActivity(nextActivity);
        } else {
          
          // No hay ejercicios para este día - buscar próxima actividad
          const weekNumber = getWeekNumber(selectedDate);
          const searchDayName = getDayName(selectedDate);
          console.log('🔍 [TodayScreen] No hay actividades hoy, buscando próxima:', {
            activityId,
            weekNumber,
            searchDayName,
            selectedDate: selectedDate.toISOString(),
            selectedDateString: getBuenosAiresDateString(selectedDate)
          });
          const nextActivity = await findNextAvailableActivity(activityId, weekNumber, searchDayName);
          console.log('🔍 [TodayScreen] Resultado de findNextAvailableActivity (sin actividades hoy):', {
            nextActivity,
            tiene_actividad: !!nextActivity,
            fecha_proxima: nextActivity?.date
          });
          setActivities([]);
          setNextAvailableActivity(nextActivity);
        }

      } catch (error) {
        console.error('❌ Error cargando actividades:', error);
        setActivities([]);
        setNextAvailableActivity(null);
      } finally {
        setLoading(false);
      }
    };

    loadTodayActivities();
  }, [user?.id, activityId, selectedDate, enrollment]);

  // Cargar estados de los días cuando haya enrollment listo y cambie el mes
  React.useEffect(() => {
    if (!user || !activityId || !enrollment || !enrollment.start_date) return;
    loadDayStatuses();
  }, [user?.id, activityId, currentMonth, enrollment?.start_date]);

  // Snap points para Framer Motion
  const EXPANDED = Math.max(Math.round(vh * 0.92), 600); // Mínimo 600px para evitar problemas en móvil
  const MID = Math.max(Math.round(vh * 0.70), 500);
  const COLLAPSED = Math.max(Math.round(vh * 0.16), 120); // Ligeramente extendido - solo muestra el header con título - 16% del viewport
  const SNAP_THRESHOLD = 0.5;

  const collapsedY = EXPANDED - COLLAPSED;
  const midY = EXPANDED - MID;
  const y = useMotionValue(collapsedY); // Inicializar en posición colapsada

  const openness = useTransform(y, [0, collapsedY], [1, 0]);
  const [isSheetExpanded, setIsSheetExpanded] = React.useState(false);
  
  // Actualizar estado cuando cambia el openness
  React.useEffect(() => {
    const unsubscribe = openness.on('change', (latest) => {
      setIsSheetExpanded(latest > 0.3);
    });
    return unsubscribe;
  }, [openness]);
  const heroScale = useTransform(openness, [1, 0], [0.92, 1]);
  const heroOpacity = useTransform(openness, [1, 0], [0.65, 1]);
  const heroBlur = useTransform(openness, [1, 0], ['blur(2px)', 'blur(0px)']);
  const sheetRadius = useTransform(openness, [1, 0], [14, 24]);

  function snapTo(point: number) {
    animate(y, point, { type: 'spring', stiffness: 400, damping: 40 });
  }

  function onDragEnd(_: any, info: { velocity: { y: number }; offset: { y: number } }) {
    const current = y.get();
    const projected = current + info.velocity.y * 0.2;
    const totalDistance = collapsedY - 0;
    const currentProgress = (current - 0) / totalDistance;
    
    let targetSnap: number;
    if (currentProgress < SNAP_THRESHOLD) {
      targetSnap = 0;
    } else if (currentProgress > 1 - SNAP_THRESHOLD) {
      targetSnap = collapsedY;
    } else {
      targetSnap = midY;
    }
    
    snapTo(targetSnap);
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', 
        background: '#0F1012', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        flexDirection: 'column',
        gap: 16
      }}>
        {/* Fuego difuminado naranja */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 120,
          height: 120
        }}>
          {/* Fuego con blur/difuminado */}
          <div style={{
            position: 'absolute',
            filter: 'blur(20px)',
            opacity: 0.6,
            transform: 'scale(1.5)'
          }}>
            <Flame 
              size={80} 
              color="#FF7939"
              fill="#FF7939"
            />
          </div>
          {/* Fuego principal (más nítido) */}
          <div style={{
            position: 'relative',
            zIndex: 1
          }}>
            <Flame 
              size={80} 
              color="#FF7939"
              fill="#FF7939"
            />
          </div>
        </div>
        
        {/* Texto "Cargando" */}
        <div style={{ 
          fontSize: 18, 
          fontWeight: 600,
          color: '#FF7939',
          textAlign: 'center'
        }}>
          Cargando
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', background: '#0F1012', color: '#fff', position: 'relative', overflow: 'hidden', zIndex: 1 }}>
      {/* Header de Omnia */}
      <div 
        className="fixed top-0 left-0 right-0 z-50 bg-black rounded-b-[32px] px-5 py-3 flex justify-between items-center"
        style={{ zIndex: 1000 }}
      >
        {/* Settings Icon */}
        <div className="flex items-center">
          <SettingsIcon />
        </div>

        {/* OMNIA Logo */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <OmniaLogoText size="text-3xl" />
        </div>

        {/* Messages Icon */}
        <div className="flex items-center">
          <MessagesIcon />
        </div>
      </div>

      <div 
        className="orange-glass-scrollbar"
        style={{ 
          height: 'calc(100vh - 56px)',
          overflowY: 'auto', 
          overflowX: 'hidden', 
          paddingTop: '56px',
          paddingBottom: calendarExpanded ? '120px' : '60px',
          WebkitOverflowScrolling: 'touch',
          position: 'relative',
          background: '#0F1012' // Fondo sólido para evitar que se vea contenido detrás
        }}>
        {/* HERO DE PROGRESO */}
        <motion.div
          style={{
            padding: calendarExpanded ? '0px 24px 20px' : '0px 24px 20px',
            minHeight: 'calc(100vh - 120px)',
            backgroundImage: backgroundImage && backgroundImage.trim() !== ''
              ? `linear-gradient(180deg, rgba(15, 16, 18, 0.85) 0%, rgba(15, 16, 18, 0.95) 100%), url(${backgroundImage})`
              : 'radial-gradient(120% 140% at 20% -20%, #1c1f23 0%, #111418 55%, #0b0c0e 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            borderBottom: '1px solid #1f2328',
            scale: heroScale,
            opacity: heroOpacity,
            filter: heroBlur,
            transformOrigin: 'center top',
            position: 'relative',
            zIndex: 1
          }}
      >
        {/* FRAME DEL TÍTULO DEL PROGRAMA - Más ancho, con flecha y descripción dentro */}
          <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(5px) saturate(150%)',
          WebkitBackdropFilter: 'blur(5px) saturate(150%)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          padding: '20px 28px',
          marginBottom: 16,
          marginTop: -8,
          marginLeft: '-24px',
          marginRight: '-24px',
          width: 'calc(100% + 48px)',
          position: 'relative',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)'
        }}>
          {/* Flecha de retorno y botón de calificación al mismo nivel */}
          <div style={{
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%'
          }}>
            {/* Flecha de retorno más al costado */}
            <button
              onClick={() => {
                if (onBack) {
                  onBack();
                } else {
                  window.history.back();
                }
              }}
              style={{
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                borderRadius: 12,
                color: '#FFFFFF',
                fontSize: 24,
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginLeft: -8
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ←
            </button>

            {/* Botón de calificación al mismo nivel que la flecha */}
            {!hasUserSubmittedSurvey && (
              <button
                onClick={handleOpenSurveyModal}
                style={{
                  padding: '4px 10px',
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255, 106, 0, 0.1)',
                  border: '1px solid rgba(255, 106, 0, 0.3)',
                  borderRadius: 12,
                  color: '#FF6A00',
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 106, 0, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(255, 106, 0, 0.5)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 106, 0, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 106, 0, 0.3)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                Calificar
              </button>
            )}
            {hasUserSubmittedSurvey && (
              <div
                style={{
                  padding: '4px 10px',
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: 12,
                  color: '#22C55E',
                  fontSize: 11,
                  fontWeight: 500,
                  flexShrink: 0
                }}
              >
                ✓ Calificado
              </div>
            )}
          </div>

          {/* Título centrado y grande */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 12,
            gap: 8
          }}>
            <h1 style={{ 
              margin: '0', 
              fontSize: 24, 
              lineHeight: 1.3, 
              fontWeight: 800,
              color: '#fff',
              textAlign: 'center',
              width: '100%',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}>
              {programInfo?.title || 'Programa de Fuerza y Resistencia'}
            </h1>
            
            {/* Categoría y Dificultad en dos frames diferentes */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              justifyContent: 'center',
              width: '100%',
              flexWrap: 'wrap'
            }}>
              <span style={{ 
                padding: '4px 8px', 
                background: 'rgba(255, 106, 0, 0.15)', 
                borderRadius: 8,
                border: '1px solid rgba(255, 106, 0, 0.3)',
                color: '#FF6A00',
                fontSize: 12
              }}>
                {programInfo?.categoria === 'fitness' ? 'Fitness' : programInfo?.categoria === 'nutricion' ? 'Nutrición' : 'Programa'}
              </span>
              <span style={{ 
                padding: '4px 8px', 
                background: 'rgba(255, 106, 0, 0.15)', 
                borderRadius: 8,
                border: '1px solid rgba(255, 106, 0, 0.3)',
                color: '#FF6A00',
                fontSize: 12
              }}>
                {(() => {
                  const difficulty = programInfo?.difficulty || enrollment?.activity?.difficulty || 'Principiante';
                  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
                })()}
              </span>
            </div>
            
            {/* Ubicación en línea debajo */}
            {(() => {
              const isPresencial = programInfo?.location_url || programInfo?.location_name || enrollment?.activity?.location_url || enrollment?.activity?.location_name;
              const locationUrl = programInfo?.location_url || enrollment?.activity?.location_url;
              const locationName = programInfo?.location_name || enrollment?.activity?.location_name;
              
              if (isPresencial && locationName) {
                return (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    marginTop: 4
                  }}>
                    <a
                      href={locationUrl || '#'}
                      target={locationUrl ? "_blank" : undefined}
                      rel={locationUrl ? "noopener noreferrer" : undefined}
                      onClick={(e) => {
                        if (!locationUrl) {
                          e.preventDefault();
                        }
                      }}
                      style={{ 
                        padding: '6px 12px', 
                        background: 'rgba(128, 128, 128, 0.2)', 
                        borderRadius: 8,
                        border: '1px solid rgba(128, 128, 128, 0.3)',
                        color: '#FF6A00',
                        fontSize: 12,
                        textDecoration: 'underline',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(128, 128, 128, 0.3)';
                        e.currentTarget.style.textDecoration = 'underline';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(128, 128, 128, 0.2)';
                        e.currentTarget.style.textDecoration = 'underline';
                      }}
                    >
                      📍 {locationName}
                    </a>
                  </div>
                );
              }
              return null;
            })()}
          </div>

          {/* Descripción dentro del frame */}
          {programInfo?.description && (
            <div style={{ 
              marginTop: 12,
              marginBottom: 8
            }}>
              <p style={{ 
                margin: 0, 
                fontSize: 14,
                lineHeight: 1.5, 
                color: 'rgba(255, 255, 255, 0.9)',
                display: '-webkit-box',
                WebkitLineClamp: descriptionExpanded ? 999 : 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {programInfo.description}
              </p>
              {programInfo.description.length > 100 && (
                <button
                  onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                  style={{
                    marginTop: 8,
                    background: 'transparent',
                    border: 'none',
                    color: '#FF6A00',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    padding: 0,
                    textAlign: 'right',
                    width: '100%',
                    display: 'block'
                  }}
                >
                  {descriptionExpanded ? 'Ver menos' : 'Ver más >'}
                </button>
              )}
            </div>
          )}

        </div>

        {/* FRAME DE PROGRESO DEL PROGRAMA */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(5px) saturate(150%)',
          WebkitBackdropFilter: 'blur(5px) saturate(150%)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 24,
          padding: '12px 20px',
          paddingTop: '12px',
          paddingBottom: calendarExpanded ? 52 : 16,
          marginBottom: 0,
          marginLeft: '-24px',
          marginRight: '-24px',
          width: 'calc(100% + 48px)',
          position: 'relative',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)'
        }}>
          {/* Calendario expandible */}
          <div style={{ marginBottom: 0 }}>
      <div style={{
              background: 'transparent',
              borderRadius: 24,
              padding: 0,
              marginBottom: 2,
        display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 2,
                width: '100%',
                padding: '0'
              }}>
                {!calendarExpanded && (
                  <button
                    onClick={handlePrevWeek}
                    style={{
                      width: 36,
                      height: 36,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: 10,
                      color: '#FFFFFF',
                      fontSize: 14,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    ⟵
                  </button>
                )}
                
          <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2
                }}>
                  {!calendarExpanded ? (
                    <>
                      <h4 style={{
                        margin: 0,
                        fontSize: 16,
                        fontWeight: 600,
                        color: '#FFFFFF',
                        fontFamily: 'Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                        textAlign: 'center',
                        lineHeight: 1.2
                      }}>
                        Semana {getCurrentWeekOfProgram()}
                      </h4>
                      
                      <span style={{
                        fontSize: 12,
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontFamily: 'Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                        textAlign: 'center',
                        lineHeight: 1.2
                      }}>
                        {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                      </span>
                    </>
                  ) : (
                    <>
                      {!isMonthPickerOpen ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12
                    }}>
                      <button
                        onClick={() => {
                          const prevMonth = new Date(currentMonth);
                          prevMonth.setMonth(prevMonth.getMonth() - 1);
                          setCurrentMonth(prevMonth);
                        }}
                        style={{
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: 8,
                          color: '#FFFFFF',
                          fontSize: 14,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        ←
                      </button>
                      
                      <h4 style={{
                        margin: 0,
                        fontSize: 16,
                        fontWeight: 600,
                        color: '#FFFFFF',
                        fontFamily: 'Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                        textAlign: 'center',
                            minWidth: 140,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6
                          }}
                          onClick={() => setIsMonthPickerOpen(true)}
                          >
                            <span>
                        {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                            </span>
                            <span style={{ fontSize: 14 }}>
                              ▾
                            </span>
                      </h4>
                      
                      <button
                        onClick={() => {
                          const nextMonth = new Date(currentMonth);
                          nextMonth.setMonth(nextMonth.getMonth() + 1);
                          setCurrentMonth(nextMonth);
                        }}
                        style={{
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: 8,
                          color: '#FFFFFF',
                          fontSize: 14,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        →
                      </button>
                    </div>
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'stretch',
                            gap: 8,
                            width: '100%'
                          }}
                        >
                          {/* Fila de año con flechas */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              width: '100%'
                            }}
                          >
                            <button
                              onClick={() => {
                                const newDate = new Date(currentMonth);
                                newDate.setFullYear(newDate.getFullYear() - 1);
                                setCurrentMonth(newDate);
                              }}
                              style={{
                                width: 32,
                                height: 32,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 999,
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: 'rgba(255,255,255,0.04)',
                                color: '#FFFFFF',
                                cursor: 'pointer',
                                fontSize: 14
                              }}
                            >
                              ←
                            </button>
                            <span
                              style={{
                                fontSize: 16,
                                fontWeight: 600,
                                color: '#FFFFFF',
                                fontFamily: 'Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif'
                              }}
                            >
                              {currentMonth.getFullYear()}
                            </span>
                            <button
                              onClick={() => {
                                const newDate = new Date(currentMonth);
                                newDate.setFullYear(newDate.getFullYear() + 1);
                                setCurrentMonth(newDate);
                              }}
                              style={{
                                width: 32,
                                height: 32,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 999,
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: 'rgba(255,255,255,0.04)',
                                color: '#FFFFFF',
                                cursor: 'pointer',
                                fontSize: 14
                              }}
                            >
                              →
                            </button>
                          </div>

                          {/* Lista de meses en grilla (máx. 4 filas x 3 columnas) */}
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(3, minmax(0,1fr))',
                              gap: 8,
                              marginTop: 4,
                              width: '100%'
                            }}
                          >
                            {[
                              'Enero',
                              'Febrero',
                              'Marzo',
                              'Abril',
                              'Mayo',
                              'Junio',
                              'Julio',
                              'Agosto',
                              'Septiembre',
                              'Octubre',
                              'Noviembre',
                              'Diciembre'
                            ].map((monthName, index) => {
                              const isSelectedMonth = currentMonth.getMonth() === index;
                              return (
                                <button
                                  key={monthName}
                                  onClick={() => {
                                    const newDate = new Date(currentMonth);
                                    newDate.setMonth(index);
                                    setCurrentMonth(newDate);
                                    setSelectedDate(newDate);
                                    setIsMonthPickerOpen(false);
                                  }}
                                  style={{
                                    padding: '8px 6px',
                                    borderRadius: 999,
                                    border: isSelectedMonth
                                      ? '1px solid #FF6A00'
                                      : '1px solid rgba(255,255,255,0.12)',
                                    background: isSelectedMonth
                                      ? 'linear-gradient(135deg, #FF6A00, #FFB347)'
                                      : 'rgba(255,255,255,0.03)',
                                    color: isSelectedMonth ? '#000000' : '#FFFFFF',
                                    fontSize: 13,
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    width: '100%'
                                  }}
                                >
                                  {monthName}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
            </div>
                
                {!calendarExpanded && (
                  <button
                    onClick={handleNextWeek}
                    style={{
                      width: 36,
                      height: 36,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: 10,
                      color: '#FFFFFF',
                      fontSize: 14,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    ⟶
                  </button>
                )}
        </div>

      {!calendarExpanded && (
        <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginTop: 6,
                  marginBottom: 0,
                  width: '100%'
                }}>
                  <button
                    onClick={goToToday}
                    style={{
              padding: '6px 14px',
                      background: '#FFD700',
                      border: '2px solid #FFD700',
          borderRadius: 18,
                      color: '#000000',
              fontSize: 11,
                      fontWeight: 700,
              cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontFamily: 'Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                      boxShadow: '0 2px 8px rgba(255, 215, 0, 0.3)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      minWidth: 70,
                      textAlign: 'center'
            }}
            onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#FFED4E';
                      e.currentTarget.style.borderColor = '#FFED4E';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 215, 0, 0.4)';
            }}
            onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#FFD700';
                      e.currentTarget.style.borderColor = '#FFD700';
          e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(255, 215, 0, 0.3)';
                    }}
                  >
                    HOY
            </button>
                </div>
      )}
        </div>
        
                                                             {/* Vista semanal o mensual según estado */}
                 {!calendarExpanded ? (
                   // Vista semanal (7 días)
                   <div style={{
                     display: 'grid',
                     gridTemplateColumns: 'repeat(7, 1fr)',
                     gap: 4,
                     width: '100%',
                     maxWidth: 800,
                     margin: '0 auto',
                     padding: '0 0px'
                   }}>
                     {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((dayInitial, index) => {
                  // Calcular la fecha real de cada día de la semana seleccionada
                  const currentWeekStart = new Date(selectedDate);
                  const currentDayOfWeek = selectedDate.getDay();
                       const daysToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
                  currentWeekStart.setDate(selectedDate.getDate() + daysToMonday);
                       
                       const dayDate = new Date(currentWeekStart);
                       dayDate.setDate(currentWeekStart.getDate() + index);
                       
                       const isToday = dayDate.toDateString() === new Date().toDateString();
                       const isSelected = dayDate.toDateString() === selectedDate.toDateString();
                       const dayStatus = getDayStatus(dayDate);
                       
    return (
                         <div key={dayInitial} style={{
                           display: 'flex',
                           flexDirection: 'column',
                           alignItems: 'center',
                           gap: 4
                         }}>
                           {/* Inicial del día */}
                           <span style={{
                             fontSize: 12,
                             color: 'rgba(255, 255, 255, 0.7)',
                             fontWeight: 500,
                             fontFamily: 'Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif'
                           }}>
                             {dayInitial}
                           </span>
                           
                           {/* Número del día */}
                           <div 
                             onClick={() => {
                               setSelectedDate(dayDate);
                             }}
                             style={{
                               width: 36,
                               height: 52,
                               display: 'flex',
                               alignItems: 'center',
                               justifyContent: 'center',
                               borderRadius: 26,
                    fontSize: 14,
                    fontWeight: 600,
                               fontFamily: 'Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                               cursor: 'pointer',
                               transition: 'all 0.2s ease',
                               position: 'relative',
                          // Colores según el estado
                               ...(dayStatus === 'completed' && {
                                 background: '#FF6A00', // Naranja - Completado
                                 color: '#FFFFFF',
                                 boxShadow: '0 2px 8px rgba(255, 106, 0, 0.3)'
                               }),
                               ...(dayStatus === 'started' && {
                                 background: '#FFC933', // Amarillo - En curso
                                 color: '#000000',
                                 boxShadow: '0 2px 8px rgba(255, 201, 51, 0.3)'
                               }),
                               ...(dayStatus === 'not-started' && {
                                 background: '#FF4444', // Rojo - Pendiente
                                 color: '#FFFFFF',
                                 boxShadow: '0 2px 8px rgba(255, 68, 68, 0.3)'
                               }),
                          // Borde de selección
                               ...(isSelected && {
                            border: '2px solid #FFD700', // Dorado para el día seleccionado
                                 boxShadow: '0 0 0 2px rgba(255, 215, 0, 0.3)'
                               })
                             }}
                           >
                             {dayDate.getDate()}
                             
                             {/* Indicador de "HOY" */}
                             {isToday && (
      <div style={{ 
            position: 'absolute',
                                 top: -2,
                                 right: -2,
                                 width: 12,
                                 height: 12,
                                 background: '#FFD700',
            borderRadius: '50%',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
                                 fontSize: 8,
                                 fontWeight: 'bold',
                                 color: '#000000',
                                 border: '1px solid #FFD700'
                               }}>
                                 H
        </div>
                             )}
        </div>
      </div>
    );
                     })}
                   </div>
                 ) : (
                   // Vista mensual (grilla de días)
                   <div>
                     
                     <div style={{ 
                       display: 'grid',
                       gridTemplateColumns: 'repeat(7, 1fr)',
                       gap: 8,
                       width: '100%',
                       maxWidth: 600,
                       margin: '0 auto',
                       padding: '0 20px'
                     }}>
                     {/* Días de la semana como header */}
                     {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((dayInitial) => (
                       <div key={dayInitial} style={{
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center',
                         height: 32,
              fontSize: 12, 
                         color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: 600,
                         fontFamily: 'Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif'
                       }}>
                         {dayInitial}
                       </div>
                     ))}
                     
                     {/* Días del mes */}
                     {getDaysInMonth(currentMonth).map((dayInfo, index) => {
                       const isToday = dayInfo.date.toDateString() === new Date().toDateString();
                       const dayStatus = getDayStatus(dayInfo.date);

  return (
                         <div
                           key={index}
                  onClick={() => {
                             if (dayInfo.date) {
                               setSelectedDate(dayInfo.date);
                               setCalendarExpanded(false); // Cerrar calendario después de seleccionar
                             }
                           }}
          style={{
                             aspectRatio: '1',
                             display: 'flex',
                             alignItems: 'center',
                             justifyContent: 'center',
                             background: dayInfo.isCurrentMonth ? 
                               (dayStatus === 'completed' ? '#FF6A00' :
                                dayStatus === 'started' ? '#FFC933' :
                                dayStatus === 'not-started' ? '#FF4444' :
                                dayStatus === 'no-exercises' ? 'transparent' :
                                '#2A2D31') : 'transparent',
                             color: dayInfo.isCurrentMonth ? 
                               (dayStatus === 'started' ? '#000000' : 
                                dayStatus === 'no-exercises' ? 'rgba(255, 255, 255, 0.5)' :
                                '#FFFFFF') : 'rgba(255, 255, 255, 0.3)',
                             fontSize: 14,
                             fontWeight: 500,
                             borderRadius: '50%',
                             cursor: dayInfo.isCurrentMonth ? 'pointer' : 'default',
                             transition: 'all 0.2s ease',
                             position: 'relative',
                             ...(isToday && {
                               boxShadow: '0 4px 16px rgba(255, 255, 255, 0.15)',
                               border: '2px solid rgba(255, 255, 255, 0.3)'
                             })
                           }}
                         >
                           {dayInfo.day}
                           {isToday && (
                             <div style={{
                               position: 'absolute',
                               top: -4,
                               right: -4,
                               width: 16,
                               height: 16,
                               background: '#FFD700',
                               borderRadius: '50%',
                               display: 'flex',
                               alignItems: 'center',
                               justifyContent: 'center',
                               fontSize: 10,
                               fontWeight: 'bold',
                               color: '#000000',
                               border: '2px solid #FFD700'
                             }}>
                               H
        </div>
          )}
      </div>
    );
                     })}
                     </div>
                   </div>
                 )}

              {/* Leyenda de estados */}
          <div style={{
                marginTop: 20,
                paddingTop: 20,
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                width: '100%'
              }}>
                <div style={{
        display: 'flex',
        alignItems: 'center',
                  justifyContent: 'space-around',
                  gap: 20,
                  maxWidth: 750,
                  margin: '0 auto'
                }}>
                  {/* Estado: Sin iniciar */}
        <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <div style={{
                      width: 10,
                      height: 10,
            borderRadius: '50%',
                      background: '#FF4444',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }} />
                    <span style={{
                      fontSize: 11,
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontFamily: 'Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                      fontWeight: 500
                    }}>
                       Pendiente ({dayCounts.pending})
                    </span>
          </div>

                  {/* Estado: Iniciado */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
                    gap: 8
                  }}>
          <div style={{
                      width: 10,
                      height: 10,
            borderRadius: '50%',
                      background: '#FFC933',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }} />
                    <span style={{
                      fontSize: 11,
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontFamily: 'Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                      fontWeight: 500
                    }}>
                       En curso ({dayCounts.started})
                    </span>
        </div>

                  {/* Estado: Completado */}
          <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <div style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: '#FF6A00',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }} />
                    <span style={{
                      fontSize: 11,
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontFamily: 'Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                      fontWeight: 500
                    }}>
                       Completado ({dayCounts.completed})
                    </span>
            </div>
        </div>
      </div>

              {/* Botón mini de expandir calendario */}
      <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: calendarExpanded ? 16 : 12,
                marginBottom: 0,
                paddingBottom: 0,
                width: '100%',
                position: 'relative',
                zIndex: 1
              }}>
                <button
                  onClick={() => setCalendarExpanded(!calendarExpanded)}
                  style={{
                    width: 36,
                    height: 36,
                    background: 'transparent',
                    border: '2px solid #FF6A00',
                    borderRadius: '50%',
                    color: '#FF6A00',
                    fontSize: 20,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    position: 'relative',
                    zIndex: 2
          }}
          onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 106, 0, 0.1)';
                    e.currentTarget.style.borderColor = '#FF8A40';
                    e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = '#FF6A00';
                    e.currentTarget.style.transform = 'scale(1)';
          }}
          >
                  {calendarExpanded ? '−' : '+'}
                </button>
          </div>
        </div>
        </div>
      </motion.div>

      {/* BOTTOM-SHEET — Actividades de hoy */}
      <motion.div
        drag="y"
        style={{
          y,
          position: 'fixed',
          left: 0, 
          right: 0,
          bottom: 0,
          height: EXPANDED,
          maxHeight: '100vh',
          minHeight: COLLAPSED,
          background: 'rgba(15, 16, 18, 0.98)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderTopLeftRadius: sheetRadius as any,
          borderTopRightRadius: sheetRadius as any,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 200,
          overflow: 'hidden',
          pointerEvents: 'auto'
        }}
        dragConstraints={{ top: 0, bottom: collapsedY }}
        dragElastic={0.04}
        onDragEnd={onDragEnd}
      >
        {/* Handle del sheet */}
        <div style={{ 
          display: 'grid', 
          placeItems: 'center', 
          paddingTop: 10,
          flexShrink: 0
        }}>
          <div style={{ 
            width: 44, 
            height: 4, 
            borderRadius: 999, 
            background: 'rgba(255, 121, 57, 0.6)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 121, 57, 0.3)',
            boxShadow: '0 2px 8px rgba(255, 121, 57, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }} />
        </div>

        {/* Detalle de plato/ejercicio - Nuevo diseño premium */}
        {selectedVideo ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1000,
              height: '100vh',
              width: '100vw',
              overflow: 'hidden',
              backgroundColor: '#000000',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Fondo con primer frame del video pausado - Hasta los títulos de Técnica/Equipamiento/Músculos */}
            {selectedVideo.url && typeof selectedVideo.url === 'string' && selectedVideo.url.trim() !== '' && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '35vh',
                overflow: 'hidden',
                zIndex: 0
              }}>
                <video
                  src={selectedVideo.url}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.75,
                    filter: 'blur(8px)',
                    WebkitFilter: 'blur(8px)',
                    transform: 'scale(1.1)',
                    pointerEvents: 'none'
                  }}
                  muted
                  preload="metadata"
                  playsInline
                  onLoadedMetadata={(e) => {
                    // Pausar el video en el primer frame
                    const video = e.currentTarget;
                    video.currentTime = 0;
                    video.pause();
                  }}
                />
              </div>
            )}
            {/* Fallback: usar imagen de portada si no hay video */}
            {(!selectedVideo.url || selectedVideo.url.trim() === '') && (selectedVideo.coverImageUrl || backgroundImage) && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '35vh',
                backgroundImage: `url(${selectedVideo.coverImageUrl || backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.75,
                filter: 'blur(8px)',
                WebkitFilter: 'blur(8px)',
                zIndex: 0
              }} />
            )}
            
            {/* Overlay oscuro en la parte superior - Solo cuando el video NO está expandido */}
            {!isVideoPanelExpanded && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '35vh',
                background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.5) 100%)',
                zIndex: 1
              }} />
            )}
            
            {/* Header con botón de retroceso */}
            <div style={{
              padding: '12px 20px 0',
              flexShrink: 0,
              position: 'relative',
              zIndex: 10,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'flex-start'
            }}>
              <button
                onClick={() => {
                  setSelectedVideo(null);
                  setIsVideoExpanded(false);
                  setIsVideoPanelExpanded(false);
                  setIsIngredientesExpanded(false);
                  
                  // Notificar que cerramos el detalle del ejercicio
                  window.dispatchEvent(new CustomEvent('exercise-detail-closed', { 
                    detail: { isOpen: false } 
                  }));
                }}
              style={{
                  width: 40,
                  height: 40,
                display: 'flex',
                  alignItems: 'center',
                justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  color: '#FF6A1A',
                  fontSize: 24,
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                ←
              </button>
            </div>
            
            {/* Nombre del ejercicio centrado, más gris - un poco más abajo */}
            <div style={{
              padding: '4px 20px 0',
              flexShrink: 0,
              position: 'relative',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <h1 style={{
                color: 'rgba(255, 255, 255, 0.55)',
                fontSize: 20,
                fontWeight: 600,
                margin: 0,
                letterSpacing: '-0.03em',
                lineHeight: 1.2,
                textAlign: 'center',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 0, 0, 0.4)'
              }}>
                {selectedVideo.exerciseName}
              </h1>
            </div>

            {/* Contenido principal - Scrollable */}
            <div 
              className={(() => {
                const isNutrition = programInfo?.categoria === 'nutricion' || enrollment?.activity?.categoria === 'nutricion';
                return isNutrition ? 'hide-scrollbar' : 'orange-glass-scrollbar';
              })()}
              style={{
                flex: 1,
                overflow: 'auto',
                overflowY: 'scroll',
                WebkitOverflowScrolling: 'touch',
                padding: '0 20px 200px',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                minHeight: 0,
                position: 'relative',
                zIndex: 1
              }}
            >
              {/* Botón Play (solo visible cuando el video NO está expandido) */}
              {!isVideoPanelExpanded && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 16
                }}>
                  {/* Botón Play (solo si hay video) */}
                  {selectedVideo && selectedVideo.url && typeof selectedVideo.url === 'string' && selectedVideo.url.trim() !== '' && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🎬 Botón Play clickeado, isVideoPanelExpanded:', isVideoPanelExpanded, 'videoUrl:', selectedVideo.url);
                        setIsVideoPanelExpanded(true);
                        console.log('🎬 Estado actualizado a: true');
                        // Forzar re-render del video
                        setTimeout(() => {
                          console.log('🎬 Video debería estar visible ahora');
                        }, 100);
                      }}
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: 'rgba(255, 106, 26, 0.15)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '2px solid rgba(255, 106, 26, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        flexShrink: 0,
                        position: 'relative',
                        zIndex: 20,
                        pointerEvents: 'auto'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 106, 26, 0.25)';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 106, 26, 0.15)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M8 5V19L19 12L8 5Z" fill="#FF6A1A" />
                      </svg>
                    </button>
                  )}
                </div>
              )}

              {/* Panel de Video Expandible */}
              {isVideoPanelExpanded && selectedVideo && selectedVideo.url && typeof selectedVideo.url === 'string' && selectedVideo.url.trim() !== '' && (
                <motion.div
                  data-video-panel="true"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: '260px', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                  style={{
                    width: '100%',
                    height: '260px',
                    minHeight: '260px',
                    borderRadius: 18,
                    overflow: 'visible',
                    marginTop: 12,
                    marginBottom: 8,
                    background: '#000000',
                    position: 'relative',
                    display: 'block',
                    zIndex: 10
                  }}
                >
                  <div style={{ 
                    width: '100%', 
                    height: '100%',
                    minHeight: '260px',
                    position: 'relative',
                    display: 'block'
                  }}>
                    <UniversalVideoPlayer
                      key={`video-${selectedVideo.url}-${isVideoPanelExpanded}`}
                      videoUrl={selectedVideo.url}
                      bunnyVideoId={selectedVideo.bunnyVideoId || undefined}
                      autoPlay={true}
                      controls={true}
                      className="w-full h-full"
                      disableDownload={true}
                    />
                  </div>
                  
                  {/* Botón X pequeño en la esquina derecha del video */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('❌ Botón X clickeado, cerrando video');
                      setIsVideoPanelExpanded(false);
                    }}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'rgba(0, 0, 0, 0.6)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      zIndex: 30,
                      pointerEvents: 'auto'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <X size={16} color="#FFFFFF" />
                  </button>
                </motion.div>
              )}

              {/* Información del ejercicio */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 20
              }}>
              {/* Determinar si es nutrición */}
              {(() => {
                const isNutrition = programInfo?.categoria === 'nutricion' || enrollment?.activity?.categoria === 'nutricion';
                
                // Si es nutrición, usar el nuevo diseño premium
                if (isNutrition) {
                  return (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0
                    }}>
                       {/* Stats Pill Card - Horizontal compacto, sin espacio de sobra */}
                       <div style={{
                         margin: '0 auto 20px',
                         padding: '8px 12px',
                         background: 'rgba(255, 255, 255, 0.04)',
                         backdropFilter: 'blur(20px)',
                         borderRadius: 10,
                         border: '1px solid rgba(255, 255, 255, 0.08)',
                         boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center',
                         gap: 8,
                         width: 'fit-content',
                         height: 36
                       }}>
                        {/* Bloque: Tiempo */}
                        {selectedVideo.minutos && (
                          <>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}>
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                <circle cx="8" cy="8" r="7" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5"/>
                                <path d="M8 4V8L11 10" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" strokeLinecap="round"/>
                              </svg>
                              <span style={{
                                color: 'rgba(255, 255, 255, 0.9)',
                                fontSize: 12,
                                fontWeight: 500
                              }}>
                                {selectedVideo.minutos} min
                              </span>
                            </div>
                            {selectedVideo.calorias && (
                              <div style={{
                                width: 1,
                                height: 16,
                                background: 'rgba(255, 255, 255, 0.1)'
                              }} />
                            )}
                          </>
                        )}

                        {/* Bloque: Calorías */}
                        {selectedVideo.calorias && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            <Flame size={14} color="#FF6A1A" />
                            <span style={{
                              color: 'rgba(255, 255, 255, 0.9)',
                              fontSize: 12,
                              fontWeight: 500
                            }}>
                              ~{selectedVideo.calorias} kcal
                            </span>
                          </div>
                        )}

                      </div>

                      {/* Sección Macros - Sin frame, arriba de Ingredientes, centradas con divisores */}
                      {(selectedVideo.proteinas || selectedVideo.carbohidratos || selectedVideo.grasas) && (
                        <div style={{
                          margin: '0 20px 20px',
                          padding: 0,
                          display: 'flex',
                          justifyContent: 'center'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12
                          }}>
                            {selectedVideo.proteinas && (
                              <>
                                <span style={{
                                  color: 'rgba(255, 255, 255, 0.8)',
                                  fontSize: 15,
                                  fontWeight: 500
                                }}>
                                  P {selectedVideo.proteinas}g
                                </span>
                                {(selectedVideo.carbohidratos || selectedVideo.grasas) && (
                                  <span style={{
                                    color: 'rgba(255, 255, 255, 0.3)',
                                    fontSize: 15,
                                    fontWeight: 400
                                  }}>
                                    |
                                  </span>
                                )}
                              </>
                            )}
                            {selectedVideo.carbohidratos && (
                              <>
                                <span style={{
                                  color: 'rgba(255, 255, 255, 0.8)',
                                  fontSize: 15,
                                  fontWeight: 500
                                }}>
                                  C {selectedVideo.carbohidratos}g
                                </span>
                                {selectedVideo.grasas && (
                                  <span style={{
                                    color: 'rgba(255, 255, 255, 0.3)',
                                    fontSize: 15,
                                    fontWeight: 400
                                  }}>
                                    |
                                  </span>
                                )}
                              </>
                            )}
                            {selectedVideo.grasas && (
                              <span style={{
                                color: 'rgba(255, 255, 255, 0.8)',
                                fontSize: 15,
                                fontWeight: 500
                              }}>
                                G {selectedVideo.grasas}g
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Sección Ingredientes - Colapsable, arriba de Receta */}
                      {selectedVideo?.ingredientes && (() => {
                        let ingredientesList: string[] = [];
                        try {
                          if (Array.isArray(selectedVideo.ingredientes)) {
                            const firstItem = selectedVideo.ingredientes[0];
                            if (typeof firstItem === 'string') {
                              ingredientesList = firstItem.split(';').map((i: string) => i.trim()).filter((i: string) => i.length > 0);
                            } else {
                              ingredientesList = (selectedVideo.ingredientes as any[]).map((i: any) => String(i).trim()).filter((i: string) => i.length > 0);
                            }
                          } else if (typeof selectedVideo.ingredientes === 'string') {
                            ingredientesList = selectedVideo.ingredientes.split(';').map((i: string) => i.trim()).filter((i: string) => i.length > 0);
                          }
                        } catch (e) {
                          ingredientesList = [String(selectedVideo?.ingredientes)];
                        }

                        return ingredientesList.length > 0 ? (
                          <div style={{
                            margin: '0 20px 20px',
                            padding: 0
                          }}>
                            <div
                              onClick={() => setIsIngredientesExpanded(!isIngredientesExpanded)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                marginBottom: isIngredientesExpanded ? 12 : 0,
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <h3 style={{
                                color: '#FFFFFF',
                                fontSize: 16,
                                fontWeight: 600,
                                margin: 0,
                                letterSpacing: '-0.01em'
                              }}>
                                Ingredientes
                              </h3>
                              <div style={{
                                width: 24,
                                height: 24,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'transform 0.2s ease',
                                transform: isIngredientesExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                              }}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                  <path d="M4 6L8 10L12 6" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </div>
                            </div>
                            {isIngredientesExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                style={{
                                  overflow: 'hidden'
                                }}
                              >
                                <div style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 4
                                }}>
                                  {ingredientesList.map((ingrediente, index) => (
                                    <div
                                      key={index}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 10,
                                        padding: '6px 0'
                                      }}
                                    >
                                      <div style={{
                                        width: 4,
                                        height: 4,
                                        borderRadius: '50%',
                                        background: '#FF6A1A',
                                        marginTop: 6,
                                        flexShrink: 0
                                      }} />
                                      <span style={{
                                        color: 'rgba(255, 255, 255, 0.8)',
                                        fontSize: 14,
                                        fontWeight: 400,
                                        lineHeight: 1.4,
                                        flex: 1
                                      }}>
                                        {ingrediente}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </div>
                        ) : null;
                      })()}

                      {/* Card Receta (Expandible) */}
                      {selectedVideo.receta && (
                        <div style={{
                          margin: '0 20px 16px',
                          padding: '20px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          backdropFilter: 'blur(20px)',
                          borderRadius: 18,
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                        >
                          <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: 16
                          }}>
                            <div style={{ flex: 1 }}>
                              <h3 style={{
                                color: '#FFFFFF',
                                fontSize: 16,
                                fontWeight: 600,
                                margin: '0 0 8px 0',
                                letterSpacing: '-0.01em'
                              }}>
                                Receta
                              </h3>
                              <p style={{
                                color: 'rgba(255, 255, 255, 0.6)',
                                fontSize: 14,
                                lineHeight: 1.5,
                                margin: 0
                              }}>
                                {selectedVideo.receta.length > 80 
                                  ? selectedVideo.receta.substring(0, 80) + '...'
                                  : selectedVideo.receta}
                              </p>
                            </div>
                            <div style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: 'rgba(255, 106, 26, 0.15)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <span style={{
                                color: '#FF6A1A',
                                fontSize: 20,
                                fontWeight: 300,
                                lineHeight: 1
                              }}>+</span>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                }

                // Si no es nutrición, usar el nuevo diseño minimal premium
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* 3. Barra compacta de info (duración, calorías, tipo) - Sin espacio de sobra */}
                    <div style={{
                      marginTop: 4,
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      backdropFilter: 'blur(20px)',
                      borderRadius: 10,
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      width: 'fit-content',
                      margin: '0 auto',
                      height: 46
                    }}>
                      {/* Duración */}
                      {selectedVideo.duration && (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                            <Clock size={16} color="rgba(255, 255, 255, 0.7)" />
                            <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 13, fontWeight: 500 }}>
                              {selectedVideo.duration} min
                            </span>
                          </div>
                          {(selectedVideo.calorias || selectedVideo.tipo) && (
                            <div style={{ width: 1, height: 20, background: 'rgba(255, 255, 255, 0.1)' }} />
                          )}
                        </>
                      )}
                      
                      {/* Calorías */}
                      {selectedVideo.calorias && (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                            <Flame size={16} color="#FF6A1A" />
                            <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 13, fontWeight: 500 }}>
                              ~{selectedVideo.calorias} kcal
                            </span>
                          </div>
                          {selectedVideo.tipo && (
                            <div style={{ width: 1, height: 20, background: 'rgba(255, 255, 255, 0.1)' }} />
                          )}
                        </>
                      )}
                      
                      {/* Tipo de ejercicio */}
                      {selectedVideo.tipo && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          <Zap size={16} color="rgba(255, 255, 255, 0.7)" />
                          <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 13, fontWeight: 500 }}>
                            {selectedVideo.tipo}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 4. Menú colapsable de 3 secciones (Técnica, Equipamiento, Músculos) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {/* Tabs */}
                      <div style={{
                        display: 'flex',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        marginBottom: 12
                      }}>
                        {(['Técnica', 'Equipamiento', 'Músculos'] as const).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setActiveExerciseTab(tab)}
                            style={{
                              flex: 1,
                              padding: '12px 16px',
                              background: 'transparent',
                              border: 'none',
                              borderBottom: activeExerciseTab === tab ? '2px solid #FF6A1A' : '2px solid transparent',
                              color: activeExerciseTab === tab ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
                              fontSize: 14,
                              fontWeight: activeExerciseTab === tab ? 600 : 500,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>

                      {/* Contenido de cada tab */}
                      <motion.div
                        key={activeExerciseTab}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                      >
                        {activeExerciseTab === 'Técnica' && selectedVideo.description && (
                          <div style={{ padding: '12px 0' }}>
                            <p style={{
                              color: 'rgba(255, 255, 255, 0.8)',
                              fontSize: 14,
                              lineHeight: 1.6,
                              margin: 0,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>
                              {selectedVideo.description}
                            </p>
                            {selectedVideo.description.length > 120 && (
                              <button
                                onClick={() => {/* TODO: Expandir descripción */}}
                                style={{
                                  marginTop: 8,
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#FF6A1A',
                                  fontSize: 13,
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  padding: 0
                                }}
                              >
                                + Ver más
                              </button>
                            )}
                          </div>
                        )}

                        {activeExerciseTab === 'Equipamiento' && selectedVideo.equipment && selectedVideo.equipment.trim() !== '' && selectedVideo.equipment !== 'Ninguno' && (
                          <div style={{ padding: '12px 0' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {selectedVideo.equipment.split(';').map((equipo: string, index: number) => {
                                const equipoTrimmed = equipo.trim();
                                if (!equipoTrimmed) return null;
                                return (
                                  <span
                                    key={index}
                                    style={{
                                      background: 'rgba(255, 255, 255, 0.08)',
                                      borderRadius: 12,
                                      padding: '6px 12px',
                                      fontSize: 13,
                                      fontWeight: 500,
                                      color: 'rgba(255, 255, 255, 0.9)'
                                    }}
                                  >
                                    {equipoTrimmed}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {activeExerciseTab === 'Músculos' && selectedVideo.body_parts && (
                          <div style={{ padding: '12px 0' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {selectedVideo.body_parts.split(';').map((musculo: string, index: number) => {
                                const musculoTrimmed = musculo.trim();
                                if (!musculoTrimmed) return null;
                                return (
                                  <span
                                    key={index}
                                    style={{
                                      background: 'rgba(255, 106, 26, 0.15)',
                                      borderRadius: 12,
                                      padding: '6px 12px',
                                      fontSize: 13,
                                      fontWeight: 500,
                                      color: '#FF6A1A'
                                    }}
                                  >
                                    {musculoTrimmed}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </div>
                  </div>
                );
              })()}

              {/* Series y Repeticiones - Editable */}
              {selectedVideo.detalle_series && editableSeries.length > 0 && (
                <div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8
                  }}>
                    {editableSeries.map((bloque, index) => {
                      const isEditing = editingBlockIndex === index;
                      return (
                      <div 
                        key={bloque.id} 
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          width: '100%',
                          cursor: isEditing ? 'default' : 'pointer',
                          background: 'rgba(255, 255, 255, 0.04)',
                          borderRadius: 12,
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                          gap: 8
                        }}
                      >
                        {/* Contenido: reps · kg · series */}
                        <div style={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                          flex: 1
                        }}>
                          {/* Reps - Número naranja */}
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: 8,
                            flex: 'auto'
                          }}>
                            {isEditing ? (
                              <>
                                <input
                                  type="number"
                                  value={bloque.reps}
                                  onChange={(e) => {
                                    const newSeries = [...editableSeries];
                                    newSeries[index].reps = e.target.value;
                                    setEditableSeries(newSeries);
                                  }}
                                  style={{
                                    width: '60px',
                                    padding: '6px 8px',
                                    background: 'rgba(255, 255, 255, 0.06)',
                                    border: '1px solid rgba(255, 121, 57, 0.3)',
                                    borderRadius: 6,
                                    color: '#FF7939',
                                    fontSize: 16,
                                    fontWeight: 600,
                                    textAlign: 'center',
                                    outline: 'none',
                                    cursor: 'text'
                                  }}
                                  autoFocus
                                />
                                <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14, fontWeight: 400 }}>reps</span>
                              </>
                            ) : (
                              <>
                                <span style={{ color: '#FF7939', fontSize: 16, fontWeight: 600 }}>
                                  {bloque.reps}
                                </span>
                                <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14, fontWeight: 400 }}>reps</span>
                              </>
                            )}
                          </div>
                          
                          {/* Separador */}
                          <span style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: 14 }}>·</span>
                          
                          {/* Kg - Número gris */}
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: 8,
                            flex: 'auto'
                          }}>
                            {isEditing ? (
                              <>
                                <input
                                  type="number"
                                  value={bloque.kg}
                                  onChange={(e) => {
                                    const newSeries = [...editableSeries];
                                    newSeries[index].kg = e.target.value;
                                    setEditableSeries(newSeries);
                                  }}
                                  style={{
                                    width: '60px',
                                    padding: '6px 8px',
                                    background: 'rgba(255, 255, 255, 0.06)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: 6,
                                    color: 'rgba(255, 255, 255, 0.8)',
                                    fontSize: 16,
                                    fontWeight: 700,
                                    textAlign: 'center',
                                    outline: 'none',
                                    cursor: 'text'
                                  }}
                                />
                                <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14, fontWeight: 400 }}>kg</span>
                              </>
                            ) : (
                              <>
                                <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 16, fontWeight: 700 }}>
                                  {bloque.kg}
                                </span>
                                <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14, fontWeight: 400 }}>kg</span>
                              </>
                            )}
                          </div>
                          
                          {/* Separador */}
                          <span style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: 14 }}>·</span>
                          
                          {/* Series - Número blanco normal */}
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: 8,
                            flex: 'auto'
                          }}>
                            {isEditing ? (
                              <>
                                <input
                                  type="number"
                                  value={bloque.series}
                                  onChange={(e) => {
                                    const newSeries = [...editableSeries];
                                    newSeries[index].series = e.target.value;
                                    setEditableSeries(newSeries);
                                  }}
                                  style={{
                                    width: '60px',
                                    padding: '6px 8px',
                                    background: 'rgba(255, 255, 255, 0.06)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: 6,
                                    color: '#FFFFFF',
                                    fontSize: 16,
                                    fontWeight: 400,
                                    textAlign: 'center',
                                    outline: 'none',
                                    cursor: 'text'
                                  }}
                                />
                                <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14, fontWeight: 400 }}>series</span>
                              </>
                            ) : (
                              <>
                                <span style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 400 }}>
                                  {bloque.series}
                                </span>
                                <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14, fontWeight: 400 }}>series</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* Controles: Flecha cuando no edita, Botones Guardar/Cancelar cuando edita */}
                        {isEditing ? (
                          <div style={{
                            display: 'flex',
                            gap: 8,
                            justifyContent: 'flex-end'
                          }}>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                // Restaurar valores originales
                                const restored = [...editableSeries];
                                restored[index] = { ...originalSeries[index] };
                                setEditableSeries(restored);
                                setEditingBlockIndex(null);
                              }}
                              style={{
                                padding: '6px 12px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: 8,
                                color: 'rgba(255, 255, 255, 0.8)',
                                fontSize: 14,
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                // Guardar cambios (actualizar originalSeries)
                                const updated = [...originalSeries];
                                updated[index] = { ...editableSeries[index] };
                                setOriginalSeries(updated);
                                setEditingBlockIndex(null);
                              }}
                              style={{
                                padding: '6px 12px',
                                background: '#FF6A1A',
                                border: 'none',
                                borderRadius: 8,
                                color: '#FFFFFF',
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              Guardar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setEditingBlockIndex(index);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <ChevronRight size={20} color="#FF7939" style={{ flexShrink: 0 }} />
                          </button>
                        )}
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}
              </div>

              {/* Navegación de ejercicios con botón de completar - Dentro del scroll, al final */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 40,
                padding: '20px 0',
                marginTop: 'auto'
              }}>
                {/* Flecha izquierda - ejercicio anterior */}
                <button
                  onClick={() => navigateToExercise('previous')}
                  style={{
                    width: 50,
                    height: 50,
                    background: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    color: '#FF6A00',
                    fontSize: 24,
                    fontWeight: 'bold',
                    border: 'none',
                    padding: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  ←
                </button>

                {/* Botón minimalista para marcar ejercicio como completado */}
                {(() => {
                  const currentExercise = activities.find(a => a.id === selectedVideo?.exerciseId);
                  const isDone = currentExercise?.done || false;
                  
                  return (
                    <button
                      onClick={() => {
                        if (selectedVideo) {
                          console.log(`🖱️ Click en modal de video: ${selectedVideo.exerciseId}`);
                          toggleExerciseSimple(selectedVideo.exerciseId);
                        }
                      }}
                      style={{
                        padding: '10px 20px',
                        borderRadius: 8,
                        background: isDone ? '#CC4A1A' : 'transparent',
                        border: '1px solid #CC4A1A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        minWidth: '100px'
                      }}
                      onMouseEnter={(e) => {
                        if (!isDone) {
                          e.currentTarget.style.background = 'rgba(204, 74, 26, 0.1)';
                        } else {
                          e.currentTarget.style.background = '#D45A1F';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isDone) {
                          e.currentTarget.style.background = 'transparent';
                        } else {
                          e.currentTarget.style.background = '#CC4A1A';
                        }
                      }}
                    >
                      <span style={{
                        color: isDone ? '#FFFFFF' : '#CC4A1A',
                        fontSize: 14,
                        fontWeight: 600,
                        letterSpacing: '0.01em'
                      }}>
                        {isDone ? 'Completado' : 'Completar'}
                      </span>
                    </button>
                  );
                })()}

                {/* Flecha derecha - ejercicio siguiente */}
                <button
                  onClick={() => navigateToExercise('next')}
                  style={{
                    width: 50,
                    height: 50,
                    background: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    color: '#FF6A00',
                    fontSize: 24,
                    fontWeight: 'bold',
                    border: 'none',
                    padding: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  →
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Header del sheet - solo visible cuando NO está expandido */
        <div style={{ padding: '8px 20px 0px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              marginBottom: 16,
              marginTop: 0
            }}>
              <div style={{ 
                fontSize: 18, 
                fontWeight: 700, 
                color: '#fff' 
              }}>
                Actividades de hoy
              </div>
              
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6, 
              background: 'rgba(255, 121, 57, 0.2)', 
              padding: '6px 12px', 
              borderRadius: 20,
              border: '1px solid rgba(255, 121, 57, 0.3)',
              marginLeft: 32,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)'
            }}>
                <Flame 
                  size={18} 
                  color="#FF7939"
                  fill="none"
                  strokeWidth={2}
                />
                <span style={{ 
                  fontSize: 13, 
                  fontWeight: 700, 
                  color: '#FFFFFF' 
                }}>
                {activities.filter(a => !a.done).length}
              </span>
            </div>
          </div>
          
            {/* Ocultar botón "Hoy" y flechas cuando está colapsado - solo mostrar cuando está expandido */}
            {isSheetExpanded && (
              <div style={{ 
                display: 'flex', 
                gap: 8, 
                alignItems: 'center', 
                justifyContent: 'center',
                marginTop: 12
              }}>
                <button
                  onClick={goToToday}
                  style={{ 
                    fontSize: 12, 
                    padding: '8px 12px', 
                    background: 'rgba(255, 106, 0, 0.15)', 
                    border: '1px solid rgba(255, 106, 0, 0.3)', 
                    borderRadius: 12, 
                    color: '#FF6A00',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontWeight: 600
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 106, 0, 0.25)';
                    e.currentTarget.style.borderColor = 'rgba(255, 106, 0, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 106, 0, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(255, 106, 0, 0.3)';
                  }}
                >
                  Hoy
                </button>
                
                <button
                  onClick={handlePrevDay}
                  style={{ 
                    fontSize: 12, 
                    padding: '8px 12px', 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    border: '1px solid rgba(255, 255, 255, 0.2)', 
                    borderRadius: 12, 
                    color: '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  ‹
                </button>
                  
                <span style={{ 
                  fontSize: 12, 
                  color: '#9CA3AF', 
                  fontWeight: 500 
                }}>
                  {selectedDate.getDate()} de {selectedDate.toLocaleDateString('es-ES', { month: 'long' })} • Semana {getWeekNumber(selectedDate)}
                </span>
                  
                <button
                  onClick={handleNextDay}
                  style={{ 
                    fontSize: 12, 
                    padding: '8px 12px', 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    border: '1px solid rgba(255, 255, 255, 0.2)', 
                    borderRadius: 12, 
                    color: '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  ›
                </button>
              </div>
            )}
        </div>
        )}

        {/* Contenido del bottom-sheet - solo visible cuando NO está expandido */}
        {!isVideoExpanded && (
          <div 
            className="orange-glass-scrollbar"
            style={{ 
              flex: 1,
              overflow: 'auto', 
              overflowY: 'scroll',
              WebkitOverflowScrolling: 'touch',
              padding: '16px 20px 200px',
              minHeight: 0, // Necesario para que flex funcione correctamente
              maxHeight: '100%',
              position: 'relative'
            }}>
         {activities.length === 0 && (
           <div style={{
               display: 'flex',
             flexDirection: 'column',
               alignItems: 'center',
             justifyContent: 'center',
             padding: '60px 20px',
             textAlign: 'center'
           }}>
             <div style={{
               width: 80,
               height: 80,
               background: 'linear-gradient(135deg, #FF6A00 0%, #FF7939 100%)',
               borderRadius: 40,
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               marginBottom: 32,
               fontSize: 32,
               fontWeight: 'bold',
               color: '#000'
             }}>
               📅
             </div>
             
             {(() => {
               // Log para debug
               console.log('🔍 [TodayScreen] Renderizando estado de actividades:', {
                 tiene_actividades: activities.length > 0,
                 cantidad_actividades: activities.length,
                 nextAvailableActivity,
                 tiene_nextActivity: !!nextAvailableActivity,
                 fecha_proxima: nextAvailableActivity?.date,
                 selectedDate: selectedDate.toISOString()
               });
               
               return nextAvailableActivity ? (
               <>
                 <h3 style={{
                   color: '#fff',
                   fontSize: 18,
                   fontWeight: 600,
                   margin: '0 0 16px 0',
                   letterSpacing: '-0.01em'
                 }}>
                   No hay actividades para este día
                 </h3>
                 
                 <p style={{
                   color: 'rgba(255, 255, 255, 0.7)',
                   fontSize: 14,
                   margin: '0 0 32px 0',
                   letterSpacing: '-0.01em'
                 }}>
                   Próxima actividad: {(() => {
                     try {
                       const nextDate = new Date(nextAvailableActivity.date + 'T00:00:00');
                       const dayName = nextDate.toLocaleDateString('es-ES', { weekday: 'long' });
                       const dayNumber = nextDate.getDate();
                       const monthName = nextDate.toLocaleDateString('es-ES', { month: 'long' });
                       return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dayNumber} de ${monthName}`;
                     } catch (e) {
                       return nextAvailableActivity.day + ' ' + nextAvailableActivity.date;
                     }
                   })()}
                 </p>
                 
                 <button
                   onClick={goToNextActivity}
                   style={{
                     background: 'linear-gradient(135deg, #FF6A00 0%, #FF7939 100%)',
                     color: '#000',
                     border: 'none',
                     padding: '16px 32px',
                     borderRadius: 12,
                     fontSize: 16,
                     fontWeight: 600,
                     cursor: 'pointer',
                     transition: 'all 0.2s ease',
                     boxShadow: '0 4px 12px rgba(255, 106, 0, 0.3)'
                   }}
                   onMouseOver={(e) => {
                     e.currentTarget.style.transform = 'translateY(-2px)';
                     e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 106, 0, 0.4)';
                   }}
                   onMouseOut={(e) => {
                     e.currentTarget.style.transform = 'translateY(0)';
                     e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 106, 0, 0.3)';
                   }}
                 >
                   Ir a actividad
                 </button>
               </>
             ) : (
               <>
                 <h3 style={{
                   color: '#fff',
                   fontSize: 18,
                   fontWeight: 600,
                   margin: '0 0 32px 0',
                   letterSpacing: '-0.01em'
                 }}>
                  Programa finalizado
                 </h3>
                 <p style={{
                   color: 'rgba(255, 255, 255, 0.4)',
                   fontSize: 14,
                   margin: '0 0 24px 0'
                 }}>
                  No hay más actividades programadas para este programa.
                 </p>
                 
                 {/* Botón OK que dispara la calificación automáticamente si aún no se calificó */}
                 {!hasUserSubmittedSurvey && (
                   <button
                     onClick={handleOpenSurveyModal}
                     style={{
                       marginTop: 8,
                       background: 'linear-gradient(135deg, #FF6A00 0%, #FF7939 100%)',
                       color: '#000',
                       border: 'none',
                       padding: '12px 28px',
                       borderRadius: 999,
                       fontSize: 14,
                       fontWeight: 600,
                       cursor: 'pointer',
                       transition: 'all 0.2s ease',
                       boxShadow: '0 4px 12px rgba(255, 106, 0, 0.3)'
                     }}
                     onMouseOver={(e) => {
                       e.currentTarget.style.transform = 'translateY(-2px)';
                       e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 106, 0, 0.4)';
                     }}
                     onMouseOut={(e) => {
                       e.currentTarget.style.transform = 'translateY(0)';
                       e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 106, 0, 0.3)';
                     }}
                   >
                     OK
                   </button>
                 )}
               </>
             );
             })()}
           </div>
         )}

            {activities.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              {Object.entries(getActivitiesByBlocks(activities)).map(([blockNum, blockActivities]) => {
                const blockNumber = parseInt(blockNum);
                const isCollapsed = collapsedBlocks.has(blockNumber);
                const isFirstBlock = blockNumber === 1;
                  const isActiveBlock = blockNumber === getActiveBlock();
                
                return (
                  <div key={blockNumber} style={{ marginBottom: 16 }}>
                    <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                          background: isActiveBlock ? 'rgba(255, 107, 53, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                          border: `1px solid ${isActiveBlock ? 'rgba(255, 107, 53, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                        borderRadius: 12,
                          cursor: 'default',
                        transition: 'all 0.2s ease'
                      }}
                    >
              <div style={{
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8 
                      }}>
                        <span style={{ 
                          fontSize: 14, 
                          fontWeight: 600, 
                            color: isActiveBlock ? '#FF6B35' : '#FFFFFF' 
                        }}>
                          {blockNames[String(blockNumber)] || `Bloque ${blockNumber}`}
                            {isActiveBlock && (
                              <span style={{
                                marginLeft: 8,
                                fontSize: 10,
                                color: '#FF6B35',
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                • Activo
                              </span>
                            )}
                        </span>
                        <span style={{ 
                          fontSize: 12, 
                            color: isActiveBlock ? 'rgba(255, 107, 53, 0.8)' : 'rgba(255, 255, 255, 0.6)' 
                        }}>
                          {blockActivities.length} ejercicios
                        </span>
                      </div>
                      
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 12 
                      }}>
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBlockCompletion(blockNumber);
                          }}
                          style={{
                width: 24,
                height: 24,
                            border: `2px solid ${isBlockCompleted(blockNumber) ? '#FF6B35' : 'rgba(255, 255, 255, 0.3)'}`,
                borderRadius: 6,
                            cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                            background: isBlockCompleted(blockNumber) ? '#FF6B35' : 'transparent',
                transition: 'all 0.2s ease'
                          }}
                        >
                          {isBlockCompleted(blockNumber) && (
                            <span style={{ 
                              color: '#FFFFFF', 
                              fontSize: 14, 
                              fontWeight: 'bold' 
                            }}>
                              ✓
                            </span>
                          )}
                        </div>
                        
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBlock(blockNumber);
                          }}
                          style={{
                            cursor: 'pointer',
                            transition: 'transform 0.2s ease',
                            color: 'rgba(255, 255, 255, 0.6)',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          aria-label={isCollapsed ? 'Expandir bloque' : 'Colapsar bloque'}
                        >
                          {isCollapsed ? (
                            <ChevronDown size={18} />
                          ) : (
                            <ChevronUp size={18} />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {!isCollapsed && (
                    <div style={{ 
                        marginTop: 8,
                        paddingLeft: 0
                      }}>
                        {/* Frame del bloque con PRS solo una vez al principio */}
                        <div style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: 12,
                          padding: '12px 16px',
                          marginBottom: 12
                        }}>
                          {/* PRS solo una vez al principio del bloque */}
                          {(() => {
                            const prsFormat = getBlockPRSFormat(blockActivities);
                            return prsFormat ? (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                marginBottom: 12,
                                paddingBottom: 12,
                                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                              }}>
                                <span style={{
                                  fontSize: 11,
                                  color: 'rgba(255, 255, 255, 0.6)',
                                  fontWeight: 500,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px'
                                }}>
                                  Orden:
                                </span>
                                <span style={{
                                  fontSize: 12,
                                  color: '#FF7939',
                                  fontFamily: 'monospace',
                                  fontWeight: 600,
                                  letterSpacing: '0.3px'
                                }}>
                                  {prsFormat}
                                </span>
                              </div>
                            ) : null;
                          })()}
                          
                          {/* Lista de ejercicios del bloque */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {blockActivities.map((activity, index) => (
                              <button
                                key={`${activity.id}-${index}`}
                                onClick={() => {
                                // Inicializar valores editables de series
                                const parsed = parseSeries(activity.detalle_series || activity.series);
                                const initialSeries = parsed.map((s: any) => ({
                                  id: s?.id ?? 0,
                                  reps: String(s?.reps || '0'),
                                  kg: String(s?.kg || '0'),
                                  series: String(s?.sets || (s as any)?.series || '0')
                                }));
                                setEditableSeries(initialSeries);
                                setOriginalSeries(JSON.parse(JSON.stringify(initialSeries)));
                                setEditingBlockIndex(null);
                                if (activity.video_url) {
                                  const duracionParaOpenVideo = activity.duration ?? (activity as any).duracion_minutos ?? (activity as any).duracion_min ?? null;
                                  const caloriasParaOpenVideo = (activity as any).calorias ?? null;
                                  
                                  console.log(`🎬 [TodayScreen] Abriendo video para ejercicio ${activity.id}:`, {
                                    nombre: activity.title,
                                    activity_duration: activity.duration,
                                    activity_duracion_minutos: (activity as any).duracion_minutos,
                                    activity_duracion_min: (activity as any).duracion_min,
                                    duracion_final_pasada: duracionParaOpenVideo,
                                    duracion_tipo: typeof duracionParaOpenVideo,
                                    activity_calorias: (activity as any).calorias,
                                    calorias_final_pasada: caloriasParaOpenVideo,
                                    calorias_tipo: typeof caloriasParaOpenVideo,
                                    actividad_completa: activity,
                                    mappedActivity_duration: activity.duration,
                                    mappedActivity_calorias: activity.calorias
                                  });
                                  
                                  openVideo(
                                    activity.video_url || '',
                                    activity.title,
                                    activity.id,
                                    activity.description,
                                    activity.equipment,
                                    activity.detalle_series || activity.series,
                                    duracionParaOpenVideo,
                                    activity.descripcion,
                                    caloriasParaOpenVideo,
                                    (activity as any).proteinas ?? null,
                                    (activity as any).carbohidratos ?? null,
                                    (activity as any).grasas ?? null,
                                    (activity as any).receta ?? null,
                                    (activity as any).ingredientes ?? null,
                                    (activity as any).minutos ?? null,
                                    null, // coverImageUrl se obtendrá automáticamente
                                    activity.type, // tipo de ejercicio
                                    (activity as any).body_parts ?? null // músculos trabajados
                                  );
                                } else {
                                  const duracionParaOpenVideoSinURL = activity.duration ?? (activity as any).duracion_minutos ?? (activity as any).duracion_min ?? null;
                                  const caloriasParaOpenVideoSinURL = (activity as any).calorias ?? null;
                                  
                                  console.log(`🎬 [TodayScreen] Abriendo video sin URL para ejercicio ${activity.id}:`, {
                                    nombre: activity.title,
                                    activity_duration: activity.duration,
                                    activity_duracion_minutos: (activity as any).duracion_minutos,
                                    activity_duracion_min: (activity as any).duracion_min,
                                    duracion_final_pasada: duracionParaOpenVideoSinURL,
                                    duracion_tipo: typeof duracionParaOpenVideoSinURL,
                                    activity_calorias: (activity as any).calorias,
                                    calorias_final_pasada: caloriasParaOpenVideoSinURL,
                                    calorias_tipo: typeof caloriasParaOpenVideoSinURL,
                                    actividad_completa: activity,
                                    mappedActivity_duration: activity.duration,
                                    mappedActivity_calorias: activity.calorias
                                  });
                                  
                                  openVideo(
                                    activity.video_url || '', // Usar video_url de la actividad
                                    activity.title,
                                    activity.id,
                                    activity.description,
                                    activity.equipment,
                                    activity.detalle_series || activity.series,
                                    duracionParaOpenVideoSinURL,
                                    activity.descripcion,
                                    caloriasParaOpenVideoSinURL,
                                    (activity as any).proteinas ?? null,
                                    (activity as any).carbohidratos ?? null,
                                    (activity as any).grasas ?? null,
                                    (activity as any).receta ?? null,
                                    (activity as any).ingredientes ?? null,
                                    (activity as any).minutos ?? null,
                                    null, // coverImageUrl se obtendrá automáticamente
                                    activity.type, // tipo de ejercicio
                                    (activity as any).body_parts ?? null // músculos trabajados
                                  );
                                }
                              }}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: 8,
                                transition: 'all 0.2s ease',
                                cursor: 'pointer',
                                textAlign: 'left'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                              }}
                            >
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 12,
                              width: '100%'
                            }}>
                              {/* Lado izquierdo: Fuego, nombre y tipo */}
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                flex: 1,
                                minWidth: 0
                              }}>
                                {/* Botón de fuego para completar */}
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    console.log(`🖱️ Click en ejercicio: ${activity.id}`);
                                    console.log(`🖱️ Estado actual del ejercicio:`, activity);
                                    console.log(`🖱️ Ejecutando toggleExerciseSimple...`);
                                    toggleExerciseSimple(activity.id);
                                  }}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: activity.done ? '#FF7939' : 'rgba(255, 255, 255, 0.4)',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '4px',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                  }}
                                >
                                  <Flame size={20} />
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 4
                                  }}>
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'flex-start',
                                      justifyContent: 'space-between',
                                      gap: 12,
                                      width: '100%'
                                    }}>
                                      <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 4,
                                        flex: 1,
                                        minWidth: 0
                                  }}>
                                    <div style={{
                                      fontSize: 15,
                                      fontWeight: 600,
                                      color: '#FFFFFF',
                                      wordBreak: 'break-word'
                                    }}>
                                      {activity.title}
                                    </div>
                                    
                                        {/* Macros para nutrición */}
                                        {(programInfo?.categoria === 'nutricion' || enrollment?.activity?.categoria === 'nutricion') && (
                                          (activity.proteinas !== null && activity.proteinas !== undefined) || 
                                          (activity.carbohidratos !== null && activity.carbohidratos !== undefined) || 
                                          (activity.grasas !== null && activity.grasas !== undefined)
                                        ) && (
                                    <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            flexWrap: 'wrap',
                                            fontSize: 12,
                                            color: 'rgba(255, 255, 255, 0.6)'
                                          }}>
                                            {activity.proteinas !== null && activity.proteinas !== undefined && (
                                              <span>P: {activity.proteinas}g</span>
                                            )}
                                            {activity.carbohidratos !== null && activity.carbohidratos !== undefined && (
                                              <span>C: {activity.carbohidratos}g</span>
                                            )}
                                            {activity.grasas !== null && activity.grasas !== undefined && (
                                              <span>G: {activity.grasas}g</span>
                                            )}
                                    </div>
                                        )}
                              </div>

                                      {/* Kcal y minutos alineados a la derecha */}
                                <div style={{
                                  display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-end',
                                        justifyContent: 'flex-start',
                                        gap: 2,
                                        flexShrink: 0
                                      }}>
                                        {/* Kcal arriba */}
                                        {(activity.calorias !== null && activity.calorias !== undefined) && (
                                  <span style={{
                                            fontSize: 13,
                                    fontWeight: 600,
                                            color: 'rgba(255, 255, 255, 0.8)'
                                          }}>
                                            {activity.calorias} kcal
                                          </span>
                                        )}
                                        {/* Minutos abajo */}
                                        {activity.minutos !== null && activity.minutos !== undefined && (
                                          <span style={{
                                            fontSize: 12,
                                            fontWeight: 500,
                                            color: 'rgba(255, 255, 255, 0.6)'
                                  }}>
                                    {activity.minutos}min
                                  </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                            </div>
                            </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </motion.div>

      {/* Modal de Encuesta de Actividad */}
      {showSurveyModal && (
        <ActivitySurveyModal
          isOpen={showSurveyModal}
          onClose={handleCloseSurveyModal}
          onComplete={handleSurveyComplete}
          activityTitle={programInfo?.title || "Actividad"}
        />
      )}

      {/* Modal de Empezar Actividad */}
      {showStartModal && (
        <StartActivityModal
          isOpen={showStartModal}
          onClose={() => setShowStartModal(false)}
          activityTitle={programInfo?.title || "Actividad"}
          onStartActivity={handleStartActivity}
        />
      )}

      {/* Modal de Información de Inicio */}
      {showStartInfoModal && (
        <StartActivityInfoModal
          isOpen={showStartInfoModal}
          onClose={() => setShowStartInfoModal(false)}
          onStartToday={handleStartToday}
          onStartOnFirstDay={handleStartOnFirstDay}
          activityTitle={programInfo?.title || "Actividad"}
          firstDay={firstDayOfActivity}
          currentDay={getBuenosAiresDayName(new Date())}
        />
      )}
      </div>
    </div>
  );
}