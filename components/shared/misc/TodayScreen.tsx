'use client';

import * as React from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';
import { UniversalVideoPlayer } from '@/components/shared/video/universal-video-player';
import { createClient } from '@/lib/supabase/supabase-client';
import { useAuth } from "@/contexts/auth-context";
import { ActivitySurveyModal } from "../activities/activity-survey-modal";
import { StartActivityModal } from "../activities/StartActivityModal";
import { StartActivityInfoModal } from "../activities/StartActivityInfoModal";
import { Flame, Edit, X, Save } from 'lucide-react';
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
};

export default function TodayScreen({ activityId, onBack }: { activityId: string, onBack?: () => void }) {
  const [vh, setVh] = React.useState<number>(typeof window !== 'undefined' ? window.innerHeight : 800);
  const [activities, setActivities] = React.useState<Activity[]>([]);
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
  } | null>(null);
  
  // Estados para navegación por deslizamiento
  const [touchStart, setTouchStart] = React.useState<{x: number, y: number} | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<{x: number, y: number} | null>(null);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [swipeDirection, setSwipeDirection] = React.useState<'left' | 'right' | null>(null);
  
  // Estado para valores editables de series/bloques
  const [editableSeries, setEditableSeries] = React.useState<Array<{id: number, reps: string, kg: string, series: string}>>([]);
  const [isEditingSeries, setIsEditingSeries] = React.useState(false);
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
  const [totalExercises, setTotalExercises] = React.useState(0);
  
  const { user } = useAuth();
  const supabase = createClient();

  // Estados para el modal de encuesta
  const [showSurveyModal, setShowSurveyModal] = React.useState(false);
  const [hasUserSubmittedSurvey, setHasUserSubmittedSurvey] = React.useState(false);

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
      const startDate = new Date(enrollment.start_date);
      
      // Buscar ejecuciones futuras (hasta 6 semanas adelante)
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 42); // 6 semanas
      
      const startDateString = getBuenosAiresDateString(startDate);
      const endDateString = getBuenosAiresDateString(endDate);
      
      const { data: progresoRecords, error } = await supabase
        .from('progreso_cliente')
        .select('fecha, ejercicios_pendientes, ejercicios_completados')
        .eq('cliente_id', user.id)
        .eq('actividad_id', activityId)
        .gte('fecha', startDateString)
        .lte('fecha', endDateString)
        .order('fecha');

      console.log('🔍 Registros de progreso encontrados:', { progresoRecords, error });
      console.log('📅 Rango de búsqueda:', { startDateString, endDateString });
      console.log('📅 Fecha seleccionada actual:', selectedDate);

      if (error || !progresoRecords || progresoRecords.length === 0) {
        console.log('❌ No se encontraron registros de progreso futuras');
        return null;
      }

      // Encontrar la próxima fecha con ejercicios
      const nextExecution = progresoRecords.find(record => {
        // Normalizar ambas fechas al inicio del día en zona horaria local
        const executionDate = new Date(record.fecha + 'T00:00:00');
        const selectedDateObj = new Date(selectedDate);
        selectedDateObj.setHours(0, 0, 0, 0); // Normalizar al inicio del día
        
        const isAfter = executionDate > selectedDateObj;
        
        console.log('🔍 Comparando fechas:', {
          fecha: record.fecha,
          executionDate: executionDate.toISOString(),
          selectedDate: selectedDate,
          selectedDateObj: selectedDateObj.toISOString(),
          isAfter
        });
        
        return isAfter;
      });

      if (nextExecution) {
        const nextDate = new Date(nextExecution.fecha + 'T00:00:00-03:00'); // Buenos Aires timezone
        const weekNumber = getWeekNumber(nextDate);
        const dayName = getDayName(nextDate);
        
        console.log('✅ Próxima actividad encontrada:', {
          fecha: nextExecution.fecha,
          dia_calculado: dayName,
          semana: weekNumber
        });
        
        return {
          week: weekNumber,
          day: dayName,
          date: nextExecution.fecha
        };
      }

      console.log('❌ No hay actividades futuras disponibles');
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
  const openVideo = (videoUrl: string, exerciseName: string, exerciseId: string, description?: string, equipment?: string, detalle_series?: any, duration?: number, descripcion?: string, calorias?: number | null) => {
    console.log('🎬 [openVideo] Datos recibidos:', {
      exerciseName,
      exerciseId,
      duration_raw: duration,
      calorias_raw: calorias,
      detalle_series,
      description,
      equipment,
      tipo_duracion: typeof duration,
      tipo_calorias: typeof calorias
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
      calorias
    });
    console.log('✅ [openVideo] selectedVideo actualizado:', {
      duration: duration,
      calorias: calorias
    });
    // Inicializar valores editables de series
    const parsed = parseSeries(detalle_series);
    const initialSeries = parsed.map(s => ({
      id: s.id,
      reps: String(s.reps || '0'),
      kg: String(s.kg || '0'),
      series: String(s.sets || s.series || '0')
    }));
    setEditableSeries(initialSeries);
    setOriginalSeries(JSON.parse(JSON.stringify(initialSeries)));
    setIsEditingSeries(false);
    setIsVideoExpanded(true);
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
      const initialSeries = parsed.map(s => ({
        id: s.id,
        reps: String(s.reps || '0'),
        kg: String(s.kg || '0'),
        series: String(s.sets || s.series || '0')
      }));
      setEditableSeries(initialSeries);
      setOriginalSeries(JSON.parse(JSON.stringify(initialSeries)));
      setIsEditingSeries(false);
      openVideo(
        nextExercise.video_url || '',
        nextExercise.title,
        nextExercise.id,
        nextExercise.description,
        nextExercise.equipment,
        nextExercise.series || nextExercise.detalle_series,
        nextExercise.duration ?? (nextExercise as any).duracion_minutos ?? (nextExercise as any).duracion_min ?? null,
        nextExercise.descripcion,
        (nextExercise as any).calorias ?? null
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

  const handleSurveyComplete = async (activityRating: number, coachRating: number, feedback: string, wouldRepeat: boolean | null) => {
    try {
      // Aquí puedes guardar la calificación en la base de datos
      console.log('Calificación recibida:', { activityRating, coachRating, feedback, wouldRepeat, activityId });
      // TODO: Guardar calificaciones en la base de datos
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
  };

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
      const exerciseIds = dayActivities.map(activity => activity.id);
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
        customizations.forEach(custom => {
          completionMap.set(custom.fitness_exercise_id, custom.completed);
        });
      }
      
      // Contar ejercicios completados
      const completedCount = dayActivities.filter(activity => 
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

      // Obtener registros de progreso_cliente
      const { data: progresoRecords, error } = await supabase
        .from('progreso_cliente')
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
        ejecuciones.forEach(ejecucion => {
          estadoPorEjercicio.set(ejecucion.ejercicio_id, ejecucion.completado);
        });
      }

      // Calcular estados por día
      const diasConEjercicios = new Map<number, number[]>(); // día -> [ejercicio_ids]
      allExercises.forEach(ejercicio => {
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
        
        const targetWeek = exerciseDayMapping[dia];
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
    
    const isCompleted = isBlockCompleted(blockNumber);
    const newCompletedState = !isCompleted;
    console.log(`🔄 Toggle bloque ${blockNumber}: ${isCompleted} → ${newCompletedState}`);

    try {
      // Usar toggleExerciseSimple para cada ejercicio del bloque
      const togglePromises = blockActivities.map(activity => {
        console.log(`🔄 Toggleando ejercicio ${activity.id} del bloque ${blockNumber} a: ${newCompletedState}`);
        return toggleExerciseSimple(activity.id);
      });

      // Esperar a que todos los toggles se completen
      await Promise.all(togglePromises);
      
      console.log(`✅ Bloque ${blockNumber} toggleado exitosamente a: ${newCompletedState}`);
      
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
        fecha: currentDate
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
          fecha: currentDate
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
          const todayActivities: Activity[] = result.data.activities.map((item: any, index: number) => {
            const bloque = Number(item.bloque ?? item.block ?? 1);
            const orden = Number(item.orden ?? item.order ?? (index + 1));
            const ejercicioId = item.exercise_id || item.ejercicio_id || item.id;

            // El endpoint /api/activities/today ya devuelve si el ejercicio está completado
            const isCompleted = Boolean(item.completed);

            const duracion = item.duracion_minutos ?? item.duration ?? item.duracion_min ?? null;
            const calorias = item.calorias ?? null;
            
            console.log(`📋 [TodayScreen] Mapeando ejercicio ${ejercicioId}:`, {
              nombre: item.nombre_ejercicio || item.name,
              // Duración - valores crudos
              duracion_minutos_raw: item.duracion_minutos,
              duracion_minutos_tipo: typeof item.duracion_minutos,
              duracion_minutos_null: item.duracion_minutos === null,
              duration_raw: item.duration,
              duration_tipo: typeof item.duration,
              duracion_min_raw: item.duracion_min,
              duracion_min_tipo: typeof item.duracion_min,
              // Duración final
              duracion_final: duracion,
              duracion_final_tipo: typeof duracion,
              duracion_final_null: duracion === null,
              duracion_final_undefined: duracion === undefined,
              // Calorías - valores crudos
              calorias_raw: item.calorias,
              calorias_raw_tipo: typeof item.calorias,
              calorias_raw_null: item.calorias === null,
              calorias_raw_undefined: item.calorias === undefined,
              calorias_raw_cero: item.calorias === 0,
              // Calorías finales
              calorias_final: calorias,
              calorias_final_tipo: typeof calorias,
              calorias_final_null: calorias === null,
              calorias_final_undefined: calorias === undefined,
              camposDisponibles: Object.keys(item),
              todosLosValores: Object.keys(item).reduce((acc: any, key: string) => {
                acc[key] = { valor: item[key], tipo: typeof item[key], null: item[key] === null, undefined: item[key] === undefined };
                return acc;
              }, {})
            });
            
            const mappedActivity = {
              // id único que combina ejercicio_id, bloque y orden para evitar duplicados
              id: `${ejercicioId}_${bloque}_${orden}`,
              title: item.nombre_ejercicio || item.name || item.ejercicio_name || `Ejercicio ${ejercicioId}`,
              subtitle: item.formatted_series || item.detalle_series || 'Sin especificar',
              type: item.tipo || item.type || 'general',
              done: isCompleted,
              bloque,
              orden,
              ejercicio_id: ejercicioId,
              duration: duracion,
              equipment: item.equipo || 'Ninguno',
              series: item.series || item.formatted_series || item.detalle_series,
              detalle_series: item.detalle_series,
              description: item.descripcion || item.description || '',
              video_url: item.video_url || null,
              descripcion: item.descripcion || item.description,
              calorias: calorias,
              body_parts: item.body_parts ?? null,
              intensidad: item.intensidad ?? null
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
          setNextAvailableActivity(null);
        } else {
          
          // No hay ejercicios para este día - buscar próxima actividad
          const weekNumber = getWeekNumber(selectedDate);
          const searchDayName = getDayName(selectedDate);
          const nextActivity = await findNextAvailableActivity(activityId, weekNumber, searchDayName);
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
  const COLLAPSED = Math.max(Math.round(vh * 0.15), 100); // Mínimo 100px para que siempre sea visible
  const SNAP_THRESHOLD = 0.5;

  const collapsedY = EXPANDED - COLLAPSED;
  const midY = EXPANDED - MID;
  const y = useMotionValue(collapsedY); // Inicializar en posición colapsada

  const openness = useTransform(y, [0, collapsedY], [1, 0]);
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
        color: '#fff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, marginBottom: 8 }}>Cargando...</div>
          <div style={{ fontSize: 14, color: '#9CA3AF' }}>Preparando tu día</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', background: '#0F1012', color: '#fff', position: 'relative', overflow: 'hidden' }}>
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

      <div style={{ 
        minHeight: '100vh', 
        overflowY: 'auto', 
        overflowX: 'hidden', 
        paddingTop: '56px',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: calendarExpanded ? '250px' : '0px'
      }}>
        {/* HERO DE PROGRESO */}
        <motion.div
          style={{
            padding: calendarExpanded ? '0px 24px 200px' : '0px 24px 120px',
            minHeight: 'calc(100vh - 120px)',
            backgroundImage: backgroundImage && backgroundImage.trim() !== ''
              ? `linear-gradient(180deg, rgba(15, 16, 18, 0.3) 0%, rgba(15, 16, 18, 0.6) 100%), url(${backgroundImage})`
              : 'radial-gradient(120% 140% at 20% -20%, #1c1f23 0%, #111418 55%, #0b0c0e 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            borderBottom: '1px solid #1f2328',
            scale: heroScale,
            opacity: heroOpacity,
            filter: heroBlur,
            transformOrigin: 'center top',
          }}
      >
          {/* Flecha de retorno y botón de calificar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 4,
            paddingLeft: 0,
            paddingRight: 0,
            paddingTop: 8
          }}>
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
                transition: 'all 0.2s ease'
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

            {/* Botón de calificación - a la misma altura que la flecha */}
            {!hasUserSubmittedSurvey && (
              <button
                onClick={handleOpenSurveyModal}
                style={{
                  padding: '6px 12px',
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255, 106, 0, 0.1)',
                  border: '1px solid rgba(255, 106, 0, 0.3)',
                  borderRadius: 16,
                  color: '#FF6A00',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
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
                  padding: '6px 12px',
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: 16,
                  color: '#22C55E',
                  fontSize: 12,
                  fontWeight: 500
                }}
              >
                ✓ Calificado
              </div>
            )}
          </div>
        
        {/* FRAME DEL TÍTULO DEL PROGRAMA */}
          <div style={{
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(25px) saturate(200%)',
          WebkitBackdropFilter: 'blur(25px) saturate(200%)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 24,
          padding: 28,
          marginBottom: 16,
          position: 'relative',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)'
        }}>
          <h1 style={{ 
            margin: '0 0 16 0', 
            fontSize: 22, 
            lineHeight: 1.2, 
            fontWeight: 800,
            color: '#fff',
            width: '100%',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
          }}>
            {programInfo?.title ? 
              programInfo.title.length > 50 ? 
                programInfo.title.substring(0, 50) + '...' : 
                programInfo.title
              : 'Programa de Fuerza y Resistencia'
            }
        </h1>

      <div style={{
        display: 'flex',
        alignItems: 'center',
            gap: 12, 
            marginBottom: 16,
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
              {programInfo?.difficulty || 'Principiante'}
            </span>
        </div>
        
        {programInfo?.description && (
          <div style={{ marginTop: 4 }}>
            <div style={{
              overflow: 'hidden',
              transition: 'max-height 0.3s ease, opacity 0.3s ease',
              maxHeight: descriptionExpanded ? '200px' : '0px',
              opacity: descriptionExpanded ? 1 : 0
            }}>
              <p style={{ 
                margin: 0, 
                fontSize: 13,
                lineHeight: 1.4, 
                color: '#E5E7EB',
                opacity: 0.9,
                paddingBottom: 4
              }}>
                {programInfo.description}
              </p>
            </div>
            <div 
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: 2,
                cursor: 'pointer',
                padding: '2px'
              }}
              onClick={() => {
                setDescriptionExpanded(!descriptionExpanded)
              }}
            >
              <div style={{
                fontSize: 10,
                color: '#9CA3AF',
                transition: 'transform 0.3s ease, color 0.2s ease',
                transform: descriptionExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                userSelect: 'none'
              }}>
                ▼
              </div>
            </div>
          </div>
        )}
        </div>

        {/* FRAME DE PROGRESO DEL PROGRAMA */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(25px) saturate(200%)',
          WebkitBackdropFilter: 'blur(25px) saturate(200%)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 24,
          padding: 28,
          paddingBottom: calendarExpanded ? 140 : 28,
          marginBottom: calendarExpanded ? 80 : 20,
          position: 'relative',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)'
        }}>
          {/* Calendario expandible */}
          <div style={{ marginBottom: 0 }}>
      <div style={{
              background: 'transparent',
              borderRadius: 24,
              padding: 12,
              marginBottom: 8,
        display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 0,
                width: '100%',
                padding: '0 4px'
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
                  alignItems: 'center'
                }}>
                  {!calendarExpanded ? (
                    <>
                      <h4 style={{
                        margin: '0 0 4 0',
                        fontSize: 16,
                        fontWeight: 600,
                        color: '#FFFFFF',
                        fontFamily: 'Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                        textAlign: 'center'
                      }}>
                        Semana {getCurrentWeekOfProgram()}
                      </h4>
                      
                      <span style={{
                        fontSize: 13,
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontFamily: 'Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                        textAlign: 'center'
                      }}>
                        {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                      </span>
                    </>
                  ) : (
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
                        minWidth: 120
                      }}>
                        {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
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
                  marginBottom: 0,
                  width: '100%'
                }}>
                  <button
                    onClick={goToToday}
                    style={{
              padding: '8px 16px',
                      background: '#FFD700',
                      border: '2px solid #FFD700',
          borderRadius: 20,
                      color: '#000000',
              fontSize: 12,
                      fontWeight: 700,
              cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontFamily: 'Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                      boxShadow: '0 2px 8px rgba(255, 215, 0, 0.3)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      minWidth: 80,
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
                marginTop: calendarExpanded ? 24 : 16,
                marginBottom: calendarExpanded ? 100 : 0,
                paddingBottom: calendarExpanded ? 60 : 0,
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
          background: 'rgba(15, 16, 18, 0.85)',
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
          paddingTop: 10 
        }}>
          <div style={{ 
            width: 44, 
            height: 4, 
            borderRadius: 999, 
            background: 'rgba(255, 255, 255, 0.2)' 
          }} />
        </div>

        {/* Video expandido que cubre todo el bottom-sheet */}
        {isVideoExpanded && selectedVideo ? (
          <motion.div
            initial={{ opacity: 0, y: '-100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '-100%' }}
            transition={{ 
              duration: 0.5, 
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.95)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 1000,
              height: '100vh',
              width: '100vw',
              overflow: 'hidden', // ✅ Mantener overflow hidden en el contenedor principal
              transform: isTransitioning 
                ? `translateX(${swipeDirection === 'left' ? '-20px' : swipeDirection === 'right' ? '20px' : '0'})` 
                : 'translateX(0)',
              transition: isTransitioning ? 'transform 0.15s ease-out' : 'none',
              opacity: isTransitioning ? 0.8 : 1
            }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Header con información del ejercicio */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px 0'
            }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                {(() => {
                  const currentExercise = activities.find(a => a.id === selectedVideo.exerciseId);
                  const currentIndex = activities.findIndex(a => a.id === selectedVideo.exerciseId);
                  const remainingExercises = activities.length - currentIndex - 1;
                  
                  return (
                    <div style={{ width: '100%' }}>
                      <div style={{
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: 12,
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: 4
                      }}>
                        Ejercicio {currentIndex + 1} • Bloque {currentExercise?.bloque || 1}
                      </div>
                      <div style={{
                        color: '#FF7939',
                        fontSize: 14,
                        fontWeight: 600
                      }}>
                        {remainingExercises} ejercicios restantes
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              <button
                onClick={collapseVideo}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: 20,
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#fff',
                  fontSize: 16,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                ×
              </button>
            </div>

            {/* Contenedor de ejercicios */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: 180,
              marginBottom: 24,
              position: 'relative'
            }}>
            {/* Ejercicio actual */}
            <div style={{
              width: '100%',
              height: '100%',
              padding: '0 20px'
            }}>
              {selectedVideo.url && selectedVideo.url.trim() !== '' ? (
                <UniversalVideoPlayer
                  videoUrl={selectedVideo.url}
                  autoPlay={false}
                  controls={true}
                  className="w-full h-full rounded-xl"
                  disableDownload={true}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 12
                }}>
                  <div className="w-20 h-20 bg-[#FF7939] rounded-xl flex items-center justify-center mx-auto">
                    <Flame className="w-10 h-10 text-black" />
                  </div>
                  <h1 className="text-gray-400 text-2xl font-bold">OMNIA</h1>
                </div>
              )}
              </div>
            </div>


            {/* Información del ejercicio */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              overflowY: 'scroll',
              WebkitOverflowScrolling: 'touch',
              padding: '0 20px 120px',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              maxHeight: 'none', // ✅ Remover límite de altura máximo
              minHeight: 'calc(100vh + 1000px)' // ✅ Expandir altura mínima aún más para permitir mucho más scroll
            }}>
              <div>
                <h3 style={{
                  color: '#fff',
                  fontSize: 18,
                  fontWeight: 600,
                  margin: '0 0 8px 0',
                  letterSpacing: '-0.02em'
                }}>
                  {selectedVideo.exerciseName}
                </h3>
                {selectedVideo.description && (
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: 13,
                    margin: 0,
                    lineHeight: 1.5
                  }}>
                    {selectedVideo.description}
                  </p>
                )}
              </div>

              {/* Métricas - Duración, Calorías y Equipo en la misma fila */}
              {(() => {
                const duracionValue = selectedVideo.duration;
                const caloriasValue = selectedVideo.calorias;
                
                console.log('🖼️ [TodayScreen] Renderizando duración y calorías:', {
                  selectedVideo_completo: selectedVideo,
                  exerciseId: selectedVideo.exerciseId,
                  exerciseName: selectedVideo.exerciseName,
                  duration: duracionValue,
                  calorias: caloriasValue,
                  tipo_duracion: typeof duracionValue,
                  tipo_calorias: typeof caloriasValue,
                  esNull_duracion: duracionValue === null,
                  esUndefined_duracion: duracionValue === undefined,
                  esNull_calorias: caloriasValue === null,
                  esUndefined_calorias: caloriasValue === undefined,
                  todosLosCampos: Object.keys(selectedVideo),
                  valoresTodosCampos: Object.keys(selectedVideo).map(key => ({ key, value: (selectedVideo as any)[key], tipo: typeof (selectedVideo as any)[key] }))
                });
                
                return null;
              })()}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 24,
                padding: '16px 0',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                {/* Duración */}
                <div style={{ flexShrink: 0 }}>
                  <div style={{
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: 11,
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: 4
                  }}>
                    Duración
                  </div>
                  <div style={{
                    color: '#FF7939',
                    fontSize: 16,
                    fontWeight: 600
                  }}>
                    {selectedVideo.duration !== null && selectedVideo.duration !== undefined && selectedVideo.duration !== '' ? `${selectedVideo.duration} min` : '-'}
                  </div>
                </div>
                
                {/* Calorías */}
                <div style={{ flexShrink: 0 }}>
                  <div style={{
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: 11,
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: 4
                  }}>
                    Calorías
                  </div>
                  <div style={{
                    color: '#FF7939',
                    fontSize: 16,
                    fontWeight: 600
                  }}>
                    {selectedVideo.calorias !== null && selectedVideo.calorias !== undefined && selectedVideo.calorias !== '' ? `~${selectedVideo.calorias} cal` : '-'}
                  </div>
                </div>
                
                {/* Equipos en frames tipo glassmorphism con scroll si excede la mitad de la pantalla */}
                {selectedVideo.equipment && selectedVideo.equipment.trim() !== '' && selectedVideo.equipment !== 'Ninguno' && (
                  <div style={{ 
                    flex: 1,
                    minWidth: 0,
                    maxWidth: '50vw'
                  }}>
                    <div style={{
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: 11,
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: 8
                    }}>
                      Equipo
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: 8,
                      overflowX: 'auto',
                      overflowY: 'hidden',
                      paddingBottom: 4,
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent'
                    }}>
                      {selectedVideo.equipment.split(';').map((equipo: string, index: number) => {
                        const equipoTrimmed = equipo.trim();
                        if (!equipoTrimmed) return null;
                        return (
                          <span
                            key={index}
                            style={{
                              background: 'rgba(255, 255, 255, 0.1)',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              borderRadius: '20px',
                              padding: '6px 12px',
                              fontSize: 13,
                              fontWeight: 500,
                              color: 'rgba(255, 255, 255, 0.6)',
                              whiteSpace: 'nowrap',
                              flexShrink: 0
                            }}
                          >
                            {equipoTrimmed}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Series y Repeticiones - Editable */}
              {selectedVideo.detalle_series && editableSeries.length > 0 && (
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12
                  }}>
                    <h4 style={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: 18,
                      fontWeight: 700,
                      margin: 0,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Bloques:
                    </h4>
                    {!isEditingSeries ? (
                      <button
                        onClick={() => {
                          setOriginalSeries(JSON.parse(JSON.stringify(editableSeries)));
                          setIsEditingSeries(true);
                        }}
                        style={{
                          background: 'rgba(0, 0, 0, 0.8)',
                          border: '1px solid rgba(255, 121, 57, 0.3)',
                          borderRadius: '20px',
                          padding: '6px 12px',
                          fontSize: 13,
                          fontWeight: 500,
                          color: '#FF7939',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 121, 57, 0.1)';
                          e.currentTarget.style.borderColor = 'rgba(255, 121, 57, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
                          e.currentTarget.style.borderColor = 'rgba(255, 121, 57, 0.3)';
                        }}
                      >
                        <Edit size={14} />
                        Editar
                      </button>
                    ) : (
                      <div style={{
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center'
                      }}>
                        <button
                          onClick={() => {
                            setEditableSeries(JSON.parse(JSON.stringify(originalSeries)));
                            setIsEditingSeries(false);
                          }}
                          style={{
                            background: 'rgba(0, 0, 0, 0.8)',
                            border: '1px solid rgba(255, 121, 57, 0.3)',
                            borderRadius: '20px',
                            padding: '6px 10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 121, 57, 0.1)';
                            e.currentTarget.style.borderColor = 'rgba(255, 121, 57, 0.5)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
                            e.currentTarget.style.borderColor = 'rgba(255, 121, 57, 0.3)';
                          }}
                        >
                          <X size={16} color="#FF7939" />
                        </button>
                        <button
                          onClick={async () => {
                            if (!selectedVideo) return;
                            
                            try {
                              // Obtener información del ejercicio actual
                              const currentActivity = activities.find(a => a.id === selectedVideo.exerciseId);
                              if (!currentActivity) {
                                console.error('No se encontró la actividad actual');
                                return;
                              }

                              // Preparar los datos para la API
                              const ejercicioId = currentActivity.ejercicio_id || currentActivity.exercise_id;
                              const bloque = currentActivity.bloque || currentActivity.block || 1;
                              const orden = currentActivity.orden || currentActivity.order || 1;
                              const fecha = getBuenosAiresDateString(selectedDate);

                              // Llamar a la API para actualizar las series
                              const response = await fetch('/api/update-exercise-series', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  ejercicioId,
                                  bloque,
                                  orden,
                                  fecha,
                                  series: editableSeries
                                })
                              });

                              const result = await response.json();

                              if (!response.ok) {
                                console.error('Error al guardar series:', result.error);
                                alert('Error al guardar los cambios. Por favor, intenta nuevamente.');
                                return;
                              }

                              // Actualizar el estado local
                              setOriginalSeries(JSON.parse(JSON.stringify(editableSeries)));
                              setIsEditingSeries(false);
                              
                              // Actualizar el detalle_series en el formato string
                              const detalleSeriesString = editableSeries
                                .map(s => `(${s.reps || '0'}-${s.kg || '0'}-${s.series || '0'})`)
                                .join(';');
                              
                              // Actualizar el selectedVideo también
                              setSelectedVideo({
                                ...selectedVideo,
                                detalle_series: detalleSeriesString
                              });

                              // Actualizar la actividad en el estado local
                              setActivities(prevActivities => 
                                prevActivities.map(a => {
                                  if (a.id === selectedVideo.exerciseId) {
                                    return {
                                      ...a,
                                      detalle_series: detalleSeriesString,
                                      series: detalleSeriesString
                                    };
                                  }
                                  return a;
                                })
                              );

                              console.log('✅ Series guardadas exitosamente');
                            } catch (error) {
                              console.error('Error al guardar series:', error);
                              alert('Error al guardar los cambios. Por favor, intenta nuevamente.');
                            }
                          }}
                          style={{
                            background: 'rgba(0, 0, 0, 0.8)',
                            border: '1px solid rgba(255, 121, 57, 0.3)',
                            borderRadius: '20px',
                            padding: '6px 10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 121, 57, 0.1)';
                            e.currentTarget.style.borderColor = 'rgba(255, 121, 57, 0.5)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
                            e.currentTarget.style.borderColor = 'rgba(255, 121, 57, 0.3)';
                          }}
                        >
                          <Save size={16} color="#FF7939" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8
                  }}>
                    {editableSeries.map((bloque, index) => (
                      <div key={bloque.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 0',
                        gap: 16,
                        borderBottom: index < editableSeries.length - 1 ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                        flexWrap: 'nowrap',
                        width: '100%'
                      }}>
                        {/* Número del bloque */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          flexShrink: 0,
                          minWidth: 45
                        }}>
                          <span style={{
                            color: '#FF7939',
                            fontSize: 32,
                            fontWeight: 700,
                            lineHeight: 1
                          }}>
                            {bloque.id}
                          </span>
                        </div>
                        
                        {/* Reps, kg y series en una sola línea horizontal - números y palabras en la misma línea */}
                        <div style={{
                          display: 'flex',
                          gap: 20,
                          alignItems: 'baseline',
                          flex: 1,
                          justifyContent: 'flex-start',
                          flexWrap: 'nowrap',
                          minWidth: 0,
                          marginLeft: 16
                        }}>
                          {/* Reps - Número y palabra en la misma línea */}
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'baseline',
                            gap: 4,
                            flexShrink: 0
                          }}>
                            <input
                              type="number"
                              value={bloque.reps}
                              onChange={(e) => {
                                const newSeries = [...editableSeries];
                                newSeries[index].reps = e.target.value;
                                setEditableSeries(newSeries);
                              }}
                              style={{
                                width: 'auto',
                                minWidth: 35,
                                maxWidth: 50,
                                padding: '2px 0',
                                background: 'transparent',
                                border: 'none',
                                color: '#FFFFFF',
                                fontSize: 18,
                                fontWeight: 700,
                                textAlign: 'left',
                                outline: 'none',
                                cursor: 'text'
                              }}
                            />
                            <span style={{ color: '#FF7939', fontSize: 12, fontWeight: 500, lineHeight: 1 }}>reps</span>
                          </div>
                          
                          {/* Kg - Número y palabra en la misma línea */}
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'baseline',
                            gap: 4,
                            flexShrink: 0
                          }}>
                            <input
                              type="number"
                              value={bloque.kg}
                              onChange={(e) => {
                                const newSeries = [...editableSeries];
                                newSeries[index].kg = e.target.value;
                                setEditableSeries(newSeries);
                              }}
                              style={{
                                width: 'auto',
                                minWidth: 35,
                                maxWidth: 50,
                                padding: '2px 0',
                                background: 'transparent',
                                border: 'none',
                                color: '#FFFFFF',
                                fontSize: 18,
                                fontWeight: 700,
                                textAlign: 'left',
                                outline: 'none',
                                cursor: 'text'
                              }}
                            />
                            <span style={{ color: '#FF7939', fontSize: 12, fontWeight: 500, lineHeight: 1 }}>kg</span>
                          </div>
                          
                          {/* Series - Número y palabra en la misma línea */}
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'baseline',
                            gap: 4,
                            flexShrink: 0
                          }}>
                            <input
                              type="number"
                              value={bloque.series}
                              onChange={(e) => {
                                const newSeries = [...editableSeries];
                                newSeries[index].series = e.target.value;
                                setEditableSeries(newSeries);
                              }}
                              style={{
                                width: 'auto',
                                minWidth: 35,
                                maxWidth: 50,
                                padding: '2px 0',
                                background: 'transparent',
                                border: 'none',
                                color: '#FFFFFF',
                                fontSize: 18,
                                fontWeight: 700,
                                textAlign: 'left',
                                outline: 'none',
                                cursor: 'text'
                              }}
                            />
                            <span style={{ color: '#FF7939', fontSize: 12, fontWeight: 500, lineHeight: 1 }}>series</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}


              {/* Navegación de ejercicios con botón de completar */}
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                padding: '16px 20px 20px',
                marginTop: '8px',
                background: 'transparent',
                zIndex: 1001
              }}>
                {/* Flecha izquierda - ejercicio anterior */}
                <button
                  onClick={() => navigateToExercise('previous')}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    border: '2px solid #FF6A00',
                    background: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    color: '#FF6A00',
                    fontSize: 20,
                    fontWeight: 'bold'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 106, 0, 0.1)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  ←
                </button>

                {/* Botón de fuego para marcar ejercicio como completado */}
                <motion.button
                  onClick={() => {
                    if (selectedVideo) {
                      console.log(`🖱️ Click en modal de video: ${selectedVideo.exerciseId}`);
                      toggleExerciseSimple(selectedVideo.exerciseId);
                    }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    border: '2px solid #FF6A00',
                    background: (() => {
                      const currentExercise = activities.find(a => a.id === selectedVideo?.exerciseId);
                      return currentExercise?.done ? '#FF6A00' : 'transparent';
                    })(),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <svg 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    style={{ 
                      color: (() => {
                        const currentExercise = activities.find(a => a.id === selectedVideo?.exerciseId);
                        return currentExercise?.done ? '#FFFFFF' : '#FF6A00';
                      })()
                    }}
                  >
                    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                  </svg>
                </motion.button>

                {/* Flecha derecha - ejercicio siguiente */}
                <button
                  onClick={() => navigateToExercise('next')}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    border: '2px solid #FF6A00',
                    background: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    color: '#FF6A00',
                    fontSize: 20,
                    fontWeight: 'bold'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 106, 0, 0.1)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
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
        <div style={{ padding: '16px 20px 12px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              marginBottom: 12 
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
              background: 'rgba(255, 106, 0, 0.15)', 
              padding: '4px 8px', 
              borderRadius: 12,
              border: '1px solid rgba(255, 106, 0, 0.3)'
            }}>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  style={{ color: '#FF6A00' }}
                >
                  <path 
                    d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" 
                    fill="currentColor"
                  />
              </svg>
                <span style={{ 
                  fontSize: 12, 
                  fontWeight: 600, 
                  color: '#FF6A00' 
                }}>
                {activities.filter(a => !a.done).length}
              </span>
            </div>
          </div>
          
            <div style={{ 
              display: 'flex', 
              gap: 8, 
              alignItems: 'center', 
              justifyContent: 'center' 
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
        </div>
        )}

        {/* Contenido del bottom-sheet - solo visible cuando NO está expandido */}
        {!isVideoExpanded && (
          <div style={{ 
            overflow: 'auto', 
            overflowY: 'scroll',
            padding: '0 12px 24px',
            minHeight: 'calc(100vh + 500px)', // ✅ Expandir altura mínima para permitir más scroll
            maxHeight: 'none' // ✅ Remover límite de altura máximo
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
             
             <h3 style={{
               color: '#fff',
               fontSize: 18,
               fontWeight: 600,
               margin: '0 0 32px 0',
               letterSpacing: '-0.01em'
             }}>
               No hay actividades para hoy
             </h3>
             
             {nextAvailableActivity ? (
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
                 Ir a {nextAvailableActivity.day} {nextAvailableActivity.date}
               </button>
             ) : (
               <p style={{
                 color: 'rgba(255, 255, 255, 0.4)',
                 fontSize: 14,
                 margin: '12px 0 0 0'
               }}>
                 No hay más actividades programadas
               </p>
             )}
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
                        onClick={() => toggleBlock(blockNumber)}
              style={{
                display: 'flex',
                alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                          background: isActiveBlock ? 'rgba(255, 107, 53, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                          border: `1px solid ${isActiveBlock ? 'rgba(255, 107, 53, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                        borderRadius: 12,
                          cursor: 'pointer',
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
                          Bloque {blockNumber}
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
                        
                          <div style={{
                            transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease',
                            color: 'rgba(255, 255, 255, 0.6)'
                          }}>
                            ▼
                          </div>
                      </div>
                    </div>
                    
                    {(!isCollapsed || isFirstBlock) && (
                      <div style={{ 
                        marginTop: 8,
                        paddingLeft: 8
                      }}>
                        {blockActivities.map((activity, index) => (
                           <button
                              key={`${activity.id}-${index}`}
                              onClick={() => {
                                // Inicializar valores editables de series
                                const parsed = parseSeries(activity.detalle_series || activity.series);
                                const initialSeries = parsed.map(s => ({
                                  id: s.id,
                                  reps: String(s.reps || '0'),
                                  kg: String(s.kg || '0'),
                                  series: String(s.sets || s.series || '0')
                                }));
                                setEditableSeries(initialSeries);
                                setOriginalSeries(JSON.parse(JSON.stringify(initialSeries)));
                                setIsEditingSeries(false);
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
                                    activity.video_url,
                                    activity.title,
                                    activity.id,
                                    activity.description,
                                    activity.equipment,
                                    activity.detalle_series || activity.series,
                                    duracionParaOpenVideo,
                                    activity.descripcion,
                                    caloriasParaOpenVideo
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
                                    '',
                                    activity.title,
                                    activity.id,
                                    activity.description,
                                    activity.equipment,
                                    activity.detalle_series || activity.series,
                                    duracionParaOpenVideoSinURL,
                                    activity.descripcion,
                                    caloriasParaOpenVideoSinURL
                                  );
                                }
                              }}
                              style={{
                                width: '100%',
                                padding: '12px 16px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: 8,
                                marginBottom: 8,
                                transition: 'all 0.2s ease',
                                cursor: 'pointer',
                                textAlign: 'left'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                              }}
                            >
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12
                            }}>

                                {/* Botón de fuego para completar - NUEVA FUNCIÓN SIMPLE */}
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

                                <div style={{ flex: 1 }}>
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    marginBottom: 4
                                  }}>
                                    <div style={{
                                      fontSize: 16,
                                      fontWeight: 600,
                                      color: '#FFFFFF'
                                    }}>
                                      {activity.title}
                                    </div>
                                    
                                    {/* Tipo de ejercicio en la misma línea */}
                                    <div style={{
                                      display: 'inline-block',
                                      padding: '4px 8px',
                                      background: '#FF6B35',
                                      color: '#FFFFFF',
                                      fontSize: 11,
                                      borderRadius: 6,
                                      textTransform: 'capitalize',
                                      fontWeight: 500
                                    }}>
                                      {activity.type}
                                    </div>
                                  </div>
                                  
                                  {/* PRS con mejor diseño */}
                                  {activity.subtitle && activity.subtitle !== 'Sin especificar' && (
                                    <div style={{
                                      display: 'inline-block',
                                      padding: '3px 6px',
                                      background: 'rgba(255, 121, 57, 0.15)',
                                      border: '1px solid rgba(255, 121, 57, 0.3)',
                                      borderRadius: 4,
                                      fontSize: 9,
                                      color: 'rgba(255, 255, 255, 0.8)',
                                      fontFamily: 'monospace',
                                      letterSpacing: '0.3px',
                                      fontWeight: 400
                                    }}>
                                      {activity.subtitle}
                                    </div>
                                  )}
                                </div>
                            </div>
                            </button>
                          ))}
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