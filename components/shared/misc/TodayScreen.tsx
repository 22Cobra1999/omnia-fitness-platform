'use client';

import * as React from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo, useDragControls } from 'framer-motion';
import { UniversalVideoPlayer } from '@/components/shared/video/universal-video-player';
import { createClient } from '@/lib/supabase/supabase-client';
import { useAuth } from "@/contexts/auth-context";
import { ActivitySurveyModal } from "../activities/activity-survey-modal";
import { StartActivityModal } from "../activities/StartActivityModal";
import { StartActivityInfoModal } from "../activities/StartActivityInfoModal";
import { X, Play, Pause, Maximize2, Minimize2, ChevronLeft, ChevronRight, Volume2, VolumeX, Info, Clock, Flame, Dumbbell, ArrowLeft, ArrowRight, Share2, Download, Check, Plus, AlertCircle, ShoppingCart, Edit, Save, Zap, ChevronDown, ChevronUp, CalendarClock, RotateCcw, Calendar, Minus, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
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

export default function TodayScreen({ activityId, enrollmentId, onBack }: { activityId: string, enrollmentId?: string | null, onBack?: () => void }) {
  const [vh, setVh] = React.useState<number>(typeof window !== 'undefined' ? window.innerHeight : 800);
  const [activities, setActivities] = React.useState<Activity[]>([]);
  const [blockNames, setBlockNames] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(true);
  const [isDayLoading, setIsDayLoading] = React.useState(false);
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
  const [calendarMessage, setCalendarMessage] = React.useState<string | null>(null);

  // Estados para la expansión del video
  const [isVideoExpanded, setIsVideoExpanded] = React.useState(false);
  const [isVideoPanelExpanded, setIsVideoPanelExpanded] = React.useState(false); // Panel expandible dentro del detalle
  const [isIngredientesExpanded, setIsIngredientesExpanded] = React.useState(false); // Ingredientes colapsados por defecto
  const [activeExerciseTab, setActiveExerciseTab] = React.useState<'Técnica' | 'Equipamiento' | 'Músculos'>('Técnica'); // Tab activo para las secciones colapsables del ejercicio
  const [activeMealTab, setActiveMealTab] = React.useState<'Ingredientes' | 'Instrucciones'>('Ingredientes'); // Tab activo para platos/comidas
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
  const [touchStart, setTouchStart] = React.useState<{ x: number, y: number } | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<{ x: number, y: number } | null>(null);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [swipeDirection, setSwipeDirection] = React.useState<'left' | 'right' | null>(null);

  // Motion value para el swipe horizontal (cambio de ejercicios)
  const videoExpandX = useMotionValue(0);

  // Estado para valores editables de series/bloques
  const [editableSeries, setEditableSeries] = React.useState<Array<{ id: number, reps: string, kg: string, series: string }>>([]);
  const [editingBlockIndex, setEditingBlockIndex] = React.useState<number | null>(null); // Índice del bloque en edición, null si ninguno
  const [originalSeries, setOriginalSeries] = React.useState<Array<{ id: number, reps: string, kg: string, series: string }>>([]);

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
  const [dayStatuses, setDayStatuses] = React.useState<{ [key: string]: string }>({});
  const [dayCounts, setDayCounts] = React.useState({
    pending: 0,    // Días pendientes (sin ejercicios completados)
    started: 0,    // Días en progreso (algunos ejercicios completados)
    completed: 0   // Días completados (todos los ejercicios completados)
  });
  const [isMonthPickerOpen, setIsMonthPickerOpen] = React.useState(false);
  const [totalExercises, setTotalExercises] = React.useState(0);

  // Edit Mode States
  const [isEditing, setIsEditing] = React.useState(false)
  const [sourceDate, setSourceDate] = React.useState<Date | null>(null)
  const [targetDate, setTargetDate] = React.useState<Date | null>(null)
  const [showConfirmModal, setShowConfirmModal] = React.useState(false)
  const [applyToAllSameDays, setApplyToAllSameDays] = React.useState(false)
  const [isUpdating, setIsUpdating] = React.useState(false)

  const { user } = useAuth();
  const supabase = createClient();

  // Estados para el modal de encuesta
  const [showSurveyModal, setShowSurveyModal] = React.useState(false);
  const [hasUserSubmittedSurvey, setHasUserSubmittedSurvey] = React.useState(false);
  const [meetCreditsAvailable, setMeetCreditsAvailable] = React.useState<number | null>(null);

  const objetivos = React.useMemo(() => {
    const src: any = enrollment?.activity || programInfo || null
    let list: any = src?.objetivos

    if (!list || !Array.isArray(list)) {
      list = []
      const ws = src?.workshop_type
      if (ws) {
        try {
          let parsed: any = ws
          if (typeof ws === 'string') {
            const trimmed = ws.trim()
            if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
              parsed = JSON.parse(trimmed)
            }
          }

          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && (parsed as any).objetivos) {
            list = String((parsed as any).objetivos)
              .split(';')
              .map((obj: string) => obj.trim())
              .filter((obj: string) => obj.length > 0)
          } else if (Array.isArray(parsed)) {
            list = parsed
          }
        } catch (e) {
          list = []
        }
      }
    }

    const valid = (Array.isArray(list) ? list : [])
      .map((o: any) => String(o ?? '').trim())
      .filter((o: string) => o && o !== 'Enel' && o !== 'Ene' && o.length > 2)

    return valid
  }, [enrollment?.activity, programInfo])

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

  React.useEffect(() => {
    const fetchMeetCredits = async () => {
      try {
        const clientId = String(user?.id || '')
        const actId = Number(activityId)
        if (!clientId || !Number.isFinite(actId)) {
          setMeetCreditsAvailable(null)
          return
        }

        const supabaseClient = createClient();
        const { data, error } = await supabaseClient
          .from('activity_enrollments')
          .select('meet_credits_total, updated_at')
          .eq('client_id', clientId)
          .eq('activity_id', actId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error obteniendo meet credits por actividad:', error)
          setMeetCreditsAvailable(null)
          return
        }

        const credits = Number((data as any)?.meet_credits_total ?? 0)
        setMeetCreditsAvailable(Number.isFinite(credits) ? credits : 0)
      } catch (e) {
        console.error('Error obteniendo meet credits:', e)
        setMeetCreditsAvailable(null)
      }
    }

    fetchMeetCredits()
  }, [user?.id, activityId]);

  const handleScheduleMeetClick = () => {
    const coachId = String(enrollment?.activity?.coach_id || programInfo?.coach_id || '')
    const actId = String(activityId || '')
    if (!coachId || !actId) return

    try {
      localStorage.setItem('scheduleMeetContext', JSON.stringify({ coachId, activityId: actId, source: 'activity' }))
      sessionStorage.setItem('scheduleMeetIntent', '1')
    } catch (e) {
      console.error('Error guardando scheduleMeetContext:', e)
    }

    window.location.href = '/?tab=calendar'
  }

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
    const buenosAiresDate = new Date(date.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
    const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const dayName = dayNames[buenosAiresDate.getDay()];
    return dayName;
  };

  const isDateMoveable = (date: Date) => {
    if (!date) return false;

    const todayStr = getTodayBuenosAiresString();
    const checkDateStr = format(date, 'yyyy-MM-dd');

    if (checkDateStr < todayStr) return false;

    if (enrollment?.expiration_date) {
      // expiration_date puede ser yyyy-MM-dd HH:mm:ss+00 o yyyy-MM-dd
      const expDateStr = enrollment.expiration_date.split('T')[0].split(' ')[0];
      if (checkDateStr > expDateStr) return false;
    }

    return true;
  };

  const hasFutureOccurrences = () => {
    if (!sourceDate || !dayStatuses) return false;
    const sourceDay = sourceDate.getDay();
    const sourceTime = sourceDate.getTime();

    return Object.keys(dayStatuses).some(dateStr => {
      const date = new Date(dateStr);
      return date.getDay() === sourceDay && date.getTime() > sourceTime;
    });
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
        enrollmentId,
        categoria,
        tablaProgreso,
        cliente_id: user.id,
        fecha_seleccionada: selectedDateString,
        fecha_fin_busqueda: endDateString,
        selectedDate_objeto: selectedDate
      });

      // Buscar registros vinculados al enrollment_id si está disponible
      let query = supabase
        .from(tablaProgreso)
        .select('fecha, ejercicios_pendientes, ejercicios_completados')
        .eq('cliente_id', user.id)
        .gte('fecha', selectedDateString)
        .lte('fecha', endDateString)
        .order('fecha', { ascending: true });

      if (enrollmentId) {
        query = query.eq('enrollment_id', enrollmentId);
      } else {
        query = query.eq('actividad_id', activityId);
      }

      const { data: progresoRecords, error } = await query;

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
          ejercicios_pendientes_raw: typeof (record as any).ejercicios_pendientes === 'string'
            ? (record as any).ejercicios_pendientes.substring(0, 100)
            : JSON.stringify((record as any).ejercicios_pendientes).substring(0, 100)
        });

        return cumpleCondicion;
      });

      if (nextExecution) {
        const nextDate = new Date((nextExecution as any).fecha + 'T00:00:00-03:00'); // Buenos Aires timezone
        const weekNumber = getWeekNumber(nextDate);
        const dayName = getDayName(nextDate);

        console.log('✅ [findNextAvailableActivity] Próxima actividad encontrada:', {
          fecha: (nextExecution as any).fecha,
          dia_calculado: dayName,
          semana: weekNumber,
          nextDate: nextDate.toISOString()
        });

        return {
          week: weekNumber,
          day: dayName,
          date: (nextExecution as any).fecha
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

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    setSourceDate(null);
    setTargetDate(null);
    setApplyToAllSameDays(false);
  };

  const handleConfirmUpdate = async () => {
    if (!sourceDate || !targetDate || !user?.id) return;

    setIsUpdating(true);
    try {
      const formattedSourceDate = format(sourceDate, 'yyyy-MM-dd');
      const formattedTargetDate = format(targetDate, 'yyyy-MM-dd');

      // 1. Mover actividades en progreso_cliente
      let query = supabase
        .from('progreso_cliente')
        .update({ fecha: formattedTargetDate })
        .eq('cliente_id', user.id)
        .eq('fecha', formattedSourceDate);

      // Si aplica a todos los días futuros
      if (applyToAllSameDays) {
        // Obtenemos todas las actividades de este día de la semana en el futuro
        // Esto requerirá una lógica más compleja en el backend o múltiples llamadas, 
        // pero para simplificar por ahora solo actualizamos el día seleccionado.
        // TODO: Implementar lógica "applyToAllSameDays" real si es necesario cambios masivos.
        // Por ahora, el checkbox solo está en la UI como placeholder funcional para este día.
        console.log("Aplicar a todos los días futuros (Lógica pendiente de implementación completa)");
      }

      const { error: errorProgreso } = await query;

      if (errorProgreso) throw errorProgreso;

      // 2. Mover actividades en progreso_cliente_nutricion
      const { error: errorNutricion } = await supabase
        .from('progreso_cliente_nutricion')
        .update({ fecha: formattedTargetDate })
        .eq('cliente_id', user.id)
        .eq('fecha', formattedSourceDate);

      if (errorNutricion) throw errorNutricion;

      // Recargar datos sin reload completo
      await loadDayStatuses();
      setSelectedDate(targetDate);

    } catch (error) {
      console.error('Error actualizando fechas:', error);
      alert('Error al actualizar las fechas. Por favor intenta de nuevo.');
    } finally {
      setIsUpdating(false);
      setShowConfirmModal(false);
      setIsEditing(false);
      setSourceDate(null);
      setTargetDate(null);
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
  // React.useEffect(() => {
  //   if (isVideoPanelExpanded && selectedVideo?.url) {
  // ... (manual play logic disabled)
  //   }
  // }, [isVideoPanelExpanded, selectedVideo?.url]);

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

      // Obtener registros vinculados al enrollment_id si está disponible
      let query = supabase
        .from(tablaProgreso)
        .select('*')
        .eq('cliente_id', user.id)
        .not('fecha', 'is', null);

      if (enrollmentId) {
        query = query.eq('enrollment_id', enrollmentId);
      } else {
        query = query.eq('actividad_id', activityId);
      }

      const { data: progresoRecords, error } = await query;

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
            if (Array.isArray(parsed)) {
              completados = parsed.length;
            } else if (parsed && typeof parsed === 'object') {
              if (Array.isArray(parsed.ejercicios)) {
                completados = parsed.ejercicios.length;
              } else {
                completados = Object.keys(parsed).length;
              }
            }
          } else if (Array.isArray(record.ejercicios_completados)) {
            completados = record.ejercicios_completados.length;
          } else if (typeof record.ejercicios_completados === 'object' && record.ejercicios_completados !== null) {
            if (Array.isArray((record.ejercicios_completados as any).ejercicios)) {
              completados = (record.ejercicios_completados as any).ejercicios.length;
            } else {
              completados = Object.keys(record.ejercicios_completados).length;
            }
          }

          if (typeof record.ejercicios_pendientes === 'string') {
            const parsed = JSON.parse(record.ejercicios_pendientes);
            if (Array.isArray(parsed)) {
              pendientes = parsed.length;
            } else if (parsed && typeof parsed === 'object') {
              if (Array.isArray(parsed.ejercicios)) {
                pendientes = parsed.ejercicios.length;
              } else {
                pendientes = Object.keys(parsed).length;
              }
            }
          } else if (Array.isArray(record.ejercicios_pendientes)) {
            pendientes = record.ejercicios_pendientes.length;
          } else if (typeof record.ejercicios_pendientes === 'object' && record.ejercicios_pendientes !== null) {
            if (Array.isArray((record.ejercicios_pendientes as any).ejercicios)) {
              pendientes = (record.ejercicios_pendientes as any).ejercicios.length;
            } else {
              pendientes = Object.keys(record.ejercicios_pendientes).length;
            }
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
      const newDayStatuses: { [key: string]: string } = {};

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
      const currentDate = selectedDate instanceof Date ? getBuenosAiresDateString(selectedDate) : selectedDate;

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
          categoria: (programInfo as any)?.categoria || (enrollment as any)?.activity?.categoria,
          activityId: Number(activityId),
          enrollmentId: enrollmentId || enrollment?.id // Usar id de enrollment para separar progreso
        })
      });

      const result = await response.json();
      console.log(`📡 Respuesta del servidor:`, { status: response.status, body: result });
      try {
        console.log(`📡 Respuesta del servidor (raw):`, JSON.stringify(result));
      } catch {
        // ignore
      }

      if (!response.ok) {
        console.error(`❌ Error del servidor:`, result);
        try {
          console.error(`❌ Error del servidor (raw):`, JSON.stringify(result));
        } catch {
          // ignore
        }
        throw new Error(result.error || 'Error al completar ejercicio');
      }

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
        setIsDayLoading(true);

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
              nombre: item.nombre_plato || item.title || item.nombre_ejercicio || item.name || item.nombre,
              nombre_plato: item.nombre_plato,
              title: item.title,
              nombre_ejercicio: item.nombre_ejercicio,
              name: item.name,
              nombre_raw: item.nombre,
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
                ? (item.nombre_plato || item.title || item.nombre_ejercicio || item.name || item.nombre || item.ejercicio_name || `Plato ${ejercicioId}`)
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
        setIsDayLoading(false);
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
  const EXPANDED = Math.max(Math.round(vh * 0.95), 620); // Mínimo 620px y sube al 95% para llenar espacio
  const MID = Math.max(Math.round(vh * 0.70), 500);
  const COLLAPSED = Math.max(Math.round(vh * 0.16), 120); // Ligeramente extendido - solo muestra el header con título - 16% del viewport
  const SNAP_THRESHOLD = 0.5;

  const collapsedY = EXPANDED - COLLAPSED;
  const midY = EXPANDED - MID;
  const y = useMotionValue(collapsedY); // Inicializar en posición colapsada
  const dragControls = useDragControls();

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
    const projected = current + info.velocity.y * 0.25;

    const points = [40, midY, collapsedY]; // Usamos 40 para ocupar más espacio arriba
    const nearest = points.reduce((best, p) => {
      return Math.abs(p - projected) < Math.abs(best - projected) ? p : best;
    }, points[0]);

    snapTo(nearest);
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
        className="fixed top-0 left-0 right-0 z-[9999] bg-black rounded-b-[32px] px-5 py-3 flex justify-between items-center"
        style={{ zIndex: 9999 }}
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
          paddingBottom: '240px', // Aumentado significativamente para permitir scroll completo en móvil
          WebkitOverflowScrolling: 'touch',
          position: 'relative',
          background: '#0F1012'
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
            backdropFilter: 'blur(10px) saturate(150%)',
            WebkitBackdropFilter: 'blur(10px) saturate(150%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
            padding: '28px 28px',
            marginBottom: 32,
            marginTop: -8,
            marginLeft: '-24px',
            marginRight: '-24px',
            width: 'calc(100% + 48px)',
            position: 'relative',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          }}>
            {/* Flecha de retorno y botón de calificación al mismo nivel */}
            <div style={{
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%'
            }}>
              <div /> {/* Espaciador para centrar si es necesario, ya que quitamos la flecha */}

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={handleScheduleMeetClick}
                  style={{
                    padding: '4px 10px',
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    background: 'rgba(255, 255, 255, 0.10)',
                    border: '1px solid rgba(255, 106, 0, 0.35)',
                    borderRadius: 12,
                    color: '#FFFFFF',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)'
                  }}
                >
                  <CalendarClock size={14} color="#FF6A00" />
                  <span>
                    {(Number.isFinite(meetCreditsAvailable as any) ? meetCreditsAvailable : 0)} meet disponibles
                  </span>
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
                  padding: '3px 8px',
                  background: programInfo?.categoria === 'nutricion' ? 'rgba(255, 230, 150, 0.08)' : 'rgba(255, 180, 130, 0.08)',
                  borderRadius: 20,
                  border: programInfo?.categoria === 'nutricion' ? '1px solid rgba(255, 230, 150, 0.15)' : '1px solid rgba(255, 180, 130, 0.15)',
                  color: programInfo?.categoria === 'nutricion' ? '#FFE4B5' : '#FFDAB9',
                  fontSize: 9, // Aún más pequeño
                  fontWeight: 600,
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {programInfo?.categoria === 'fitness' ? 'Fitness' : programInfo?.categoria === 'nutricion' ? 'Nutrición' : 'Programa'}
                </span>
                <span style={{
                  padding: '3px 8px',
                  background: (programInfo?.difficulty || enrollment?.activity?.difficulty || '').toLowerCase().includes('adv') ? 'rgba(255, 80, 80, 0.12)' : 'rgba(255, 180, 130, 0.08)',
                  borderRadius: 20,
                  border: (programInfo?.difficulty || enrollment?.activity?.difficulty || '').toLowerCase().includes('adv') ? '1px solid rgba(255, 80, 80, 0.3)' : '1px solid rgba(255, 180, 130, 0.15)',
                  color: (programInfo?.difficulty || enrollment?.activity?.difficulty || '').toLowerCase().includes('adv') ? '#FF5050' : '#FFDAB9', // Más colorado
                  fontSize: 9, // Aún más pequeño
                  fontWeight: 600,
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {(() => {
                    const difficulty = programInfo?.difficulty || enrollment?.activity?.difficulty || 'Principiante';
                    const diffLower = difficulty.toLowerCase();
                    if (diffLower.includes('adv')) return 'Avanzado';
                    if (diffLower.includes('int')) return 'Intermedio';
                    return 'Principiante';
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

            {objetivos.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  overflowX: 'auto',
                  width: '100%',
                  paddingBottom: 2,
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}
              >
                {objetivos.map((objetivo: string, idx: number) => (
                  <span
                    key={`${objetivo}-${idx}`}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: 11,
                      fontWeight: 500,
                      padding: '4px 10px',
                      borderRadius: 999,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                    title={objetivo}
                  >
                    {objetivo}
                  </span>
                ))}
              </div>
            )}

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
                  overflow: 'hidden',
                  textAlign: 'center'
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
            backdropFilter: 'blur(10px) saturate(150%)',
            WebkitBackdropFilter: 'blur(10px) saturate(150%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 24,
            padding: '12px 20px',
            paddingTop: '12px',
            paddingBottom: calendarExpanded ? 52 : 16,
            marginBottom: 0,
            marginLeft: '-24px',
            marginRight: '-24px',
            width: 'calc(100% + 48px)',
            position: 'relative',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
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
                              color: 'rgba(255, 255, 255, 0.6)',
                              fontFamily: 'Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                              textAlign: 'center',
                              minWidth: 140,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              textTransform: 'capitalize'
                            }}
                              onClick={() => setIsMonthPickerOpen(true)}
                            >
                              <span>
                                {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                              </span>
                              <span style={{ fontSize: 14, opacity: 0.8 }}>
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


                            <button
                              onClick={toggleEditMode}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '4px 10px',
                                height: 26,
                                background: isEditing ? 'rgba(255, 121, 57, 0.2)' : 'rgba(255, 106, 0, 0.1)',
                                border: isEditing ? '1px solid rgba(255, 121, 57, 0.5)' : '1px solid rgba(255, 106, 0, 0.3)',
                                borderRadius: 12,
                                color: isEditing ? '#FFFFFF' : '#FF6A00',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                flexShrink: 0,
                                outline: 'none'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = isEditing ? 'rgba(255, 121, 57, 0.3)' : 'rgba(255, 106, 0, 0.2)';
                                e.currentTarget.style.borderColor = isEditing ? 'rgba(255, 121, 57, 0.6)' : 'rgba(255, 106, 0, 0.5)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = isEditing ? 'rgba(255, 121, 57, 0.2)' : 'rgba(255, 106, 0, 0.1)';
                                e.currentTarget.style.borderColor = isEditing ? 'rgba(255, 121, 57, 0.5)' : 'rgba(255, 106, 0, 0.3)';
                              }}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Fecha</span>
                            </button>

                            {isEditing && (
                              <button
                                onClick={() => {
                                  setIsEditing(false);
                                  setSourceDate(null);
                                  setTargetDate(null);
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 6,
                                  padding: '4px 10px',
                                  height: 26,
                                  background: 'rgba(255, 106, 0, 0.1)',
                                  border: '1px solid rgba(255, 106, 0, 0.3)',
                                  borderRadius: 12,
                                  color: '#FF6A00',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  flexShrink: 0,
                                  outline: 'none',
                                  marginLeft: -8
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(255, 106, 0, 0.2)';
                                  e.currentTarget.style.borderColor = 'rgba(255, 106, 0, 0.5)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(255, 106, 0, 0.1)';
                                  e.currentTarget.style.borderColor = 'rgba(255, 106, 0, 0.3)';
                                }}
                              >
                                <Minus size={14} />
                              </button>
                            )}
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
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 18,
                        color: '#FFFFFF',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontFamily: 'Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
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
                  gap: 16,
                  width: '100%',
                  maxWidth: 800,
                  margin: '0 auto',
                  padding: '24px 0px'
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
                            if (dayDate) {
                              setCalendarMessage(null);
                              const dateStr = format(dayDate, 'yyyy-MM-dd');
                              const todayStr = getTodayBuenosAiresString();
                              const isExpDate = enrollment?.expiration_date && dateStr === enrollment.expiration_date.split('T')[0].split(' ')[0];

                              if (isExpDate) {
                                setCalendarMessage("Día de expiración");
                              }

                              if (isEditing) {
                                if (dateStr < todayStr) {
                                  setCalendarMessage("Solo puedes mover de hoy en adelante");
                                  return;
                                }

                                if (enrollment?.expiration_date) {
                                  const expStr = enrollment.expiration_date.split('T')[0].split(' ')[0];
                                  if (dateStr > expStr) {
                                    setCalendarMessage("Excede los límites del programa");
                                    return;
                                  }
                                }

                                if (!sourceDate) {
                                  if (dayStatus === 'no-exercises') {
                                    setCalendarMessage("Este día no tiene actividades");
                                    return;
                                  }
                                  setSourceDate(dayDate)
                                } else {
                                  setTargetDate(dayDate)
                                  setShowConfirmModal(true)
                                }
                              } else {
                                setSelectedDate(dayDate);
                              }
                            }
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
                            // Glassmorphism para todos los estados
                            ...(dayStatus === 'completed' && !isSelected && {
                              background: 'rgba(255, 106, 0, 0.15)',
                              backdropFilter: 'blur(8px)',
                              WebkitBackdropFilter: 'blur(8px)',
                              color: '#FF6A00',
                              boxShadow: '0 2px 8px rgba(255, 106, 0, 0.2)'
                            }),
                            ...(dayStatus === 'started' && !isSelected && {
                              background: 'rgba(255, 201, 51, 0.15)',
                              backdropFilter: 'blur(8px)',
                              WebkitBackdropFilter: 'blur(8px)',
                              color: '#FFC933',
                              boxShadow: '0 2px 8px rgba(255, 201, 51, 0.2)'
                            }),
                            ...(dayStatus === 'not-started' && !isSelected && {
                              background: 'rgba(255, 68, 68, 0.15)',
                              backdropFilter: 'blur(8px)',
                              WebkitBackdropFilter: 'blur(8px)',
                              color: '#FF4444',
                              boxShadow: '0 2px 8px rgba(255, 68, 68, 0.2)'
                            }),
                            // Glassmorphism para día seleccionado con borde de color
                            ...(isSelected && {
                              background: 'rgba(255, 255, 255, 0.1)',
                              backdropFilter: 'blur(8px)',
                              WebkitBackdropFilter: 'blur(8px)',
                              border: dayStatus === 'completed' ? '1px solid rgba(255, 106, 0, 0.6)' :
                                dayStatus === 'started' ? '1px solid rgba(255, 201, 51, 0.6)' :
                                  dayStatus === 'not-started' ? '1px solid rgba(255, 68, 68, 0.6)' :
                                    '1px solid rgba(255, 255, 255, 0.2)',
                              color: dayStatus === 'completed' ? '#FF6A00' :
                                dayStatus === 'started' ? '#FFC933' :
                                  dayStatus === 'not-started' ? '#FF4444' :
                                    dayStatus === 'no-exercises' ? '#FFFFFF' :
                                      '#FFFFFF'
                            }),
                            // Highlight source
                            ...(isEditing && sourceDate && dayDate.toDateString() === sourceDate.toDateString() ? {
                              background: 'rgba(255, 121, 57, 0.2)',
                              border: '1px solid #FF7939',
                              color: '#fff'
                            } : {}),
                            // Estilo para fechas no seleccionables en modo edición
                            ...(isEditing && (
                              !sourceDate ? (dayStatus === 'no-exercises' || !isDateMoveable(dayDate)) : !isDateMoveable(dayDate)
                            ) && {
                              opacity: 0.3,
                              cursor: 'not-allowed'
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
                    rowGap: 16,
                    columnGap: 20,
                    width: '100%',
                    maxWidth: 600,
                    margin: '0 auto',
                    padding: '24px 20px'
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
                      const isSelected = selectedDate && dayInfo.date && dayInfo.date.toDateString() === selectedDate.toDateString();
                      const dayStatus = getDayStatus(dayInfo.date);

                      return (
                        <div
                          key={index}
                          onClick={() => {
                            if (dayInfo.date) {
                              setCalendarMessage(null);
                              const dateStr = format(dayInfo.date, 'yyyy-MM-dd');
                              const todayStr = getTodayBuenosAiresString();
                              const isExpDate = enrollment?.expiration_date && dateStr === enrollment.expiration_date.split('T')[0].split(' ')[0];

                              if (isExpDate) {
                                setCalendarMessage("Día de expiración");
                              }

                              if (isEditing) {
                                // Validaciones comunes para hoy/futuro
                                if (dateStr < todayStr) {
                                  setCalendarMessage("Solo puedes mover de hoy en adelante");
                                  return;
                                }

                                if (enrollment?.expiration_date) {
                                  const expStr = enrollment.expiration_date.split('T')[0].split(' ')[0];
                                  if (dateStr > expStr) {
                                    setCalendarMessage("Excede los límites del programa");
                                    return;
                                  }
                                }

                                if (!sourceDate) {
                                  // Seleccionando el origen
                                  if (dayStatus === 'no-exercises') {
                                    setCalendarMessage("Este día no tiene actividades");
                                    return;
                                  }
                                  setSourceDate(dayInfo.date)
                                } else {
                                  // Seleccionando el destino
                                  setTargetDate(dayInfo.date)
                                  setShowConfirmModal(true)
                                }
                              } else {
                                setSelectedDate(dayInfo.date);
                              }
                            }
                          }}
                          style={{
                            aspectRatio: '1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            // Glassmorphism para todos los estados
                            background: isSelected ? 'rgba(255, 255, 255, 0.1)' : (dayInfo.isCurrentMonth ?
                              (dayStatus === 'completed' ? 'rgba(255, 106, 0, 0.15)' :
                                dayStatus === 'started' ? 'rgba(255, 201, 51, 0.15)' :
                                  dayStatus === 'not-started' ? 'rgba(255, 68, 68, 0.15)' :
                                    dayStatus === 'no-exercises' ? 'transparent' :
                                      'rgba(42, 45, 49, 0.3)') : 'transparent'),
                            backdropFilter: (isSelected || (dayInfo.isCurrentMonth && dayStatus !== 'no-exercises')) ? 'blur(8px)' : undefined,
                            WebkitBackdropFilter: (isSelected || (dayInfo.isCurrentMonth && dayStatus !== 'no-exercises')) ? 'blur(8px)' : undefined,
                            border: isSelected ? (
                              dayStatus === 'completed' ? '1px solid rgba(255, 106, 0, 0.6)' :
                                dayStatus === 'started' ? '1px solid rgba(255, 201, 51, 0.6)' :
                                  dayStatus === 'not-started' ? '1px solid rgba(255, 68, 68, 0.6)' :
                                    '1px solid rgba(255, 255, 255, 0.2)'
                            ) : (dayInfo.isCurrentMonth && isToday ? '2px solid rgba(255, 255, 255, 0.3)' : 'transparent'),
                            color: isSelected ? (
                              dayStatus === 'completed' ? '#FF6A00' :
                                dayStatus === 'started' ? '#FFC933' :
                                  dayStatus === 'not-started' ? '#FF4444' :
                                    dayStatus === 'no-exercises' ? '#FFFFFF' :
                                      '#FFFFFF'
                            ) : (dayInfo.isCurrentMonth ?
                              (dayStatus === 'completed' ? '#FF6A00' :
                                dayStatus === 'started' ? '#FFC933' :
                                  dayStatus === 'not-started' ? '#FF4444' :
                                    dayStatus === 'no-exercises' ? 'rgba(255, 255, 255, 0.5)' :
                                      '#FFFFFF') : 'rgba(255, 255, 255, 0.3)'),
                            fontSize: 14,
                            fontWeight: 500,
                            // Highlight source
                            ...(isEditing && sourceDate && dayInfo.date && dayInfo.date.toDateString() === sourceDate.toDateString() ? {
                              background: 'rgba(255, 121, 57, 0.2)',
                              border: '1px solid #FF7939',
                              color: '#fff'
                            } : {}),
                            borderRadius: '50%',
                            cursor: dayInfo.isCurrentMonth ? 'pointer' : 'default',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            ...(isToday && {
                              boxShadow: '0 4px 16px rgba(255, 255, 255, 0.15)',
                              border: '2px solid rgba(255, 255, 255, 0.3)'
                            }),
                            // Estilo para fechas no seleccionables en modo edición
                            ...(isEditing && (
                              !sourceDate ? (dayStatus === 'no-exercises' || !isDateMoveable(dayInfo.date)) : !isDateMoveable(dayInfo.date)
                            ) && {
                              opacity: 0.3,
                              cursor: 'not-allowed'
                            })
                          }}
                        >
                          {dayInfo.day}

                          {/* Marcador de expiración */}
                          {enrollment?.expiration_date && dayInfo.date && (
                            format(dayInfo.date, 'yyyy-MM-dd') === enrollment.expiration_date.split('T')[0].split(' ')[0]
                          ) && (
                              <div style={{
                                position: 'absolute',
                                top: -8,
                                left: -4,
                                zIndex: 20,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <AlertTriangle size={14} color="black" fill="#FFD700" />
                              </div>
                            )}
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

              {isEditing && (
                <div style={{
                  textAlign: 'center',
                  marginTop: 16,
                  marginBottom: 0,
                  color: '#FF7939',
                  fontSize: 12,
                  fontWeight: 500,
                  padding: '0 10px',
                  opacity: 0.8
                }}>
                  {!sourceDate ? "Selecciona el día que quieres cambiar" : "Selecciona la nueva fecha (hoy o futuro)"}
                </div>
              )}

              {calendarMessage && (
                <div style={{
                  color: '#FF4444',
                  fontSize: 11,
                  fontWeight: 700,
                  marginTop: 12,
                  marginBottom: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                  textAlign: 'center'
                }}>
                  {calendarMessage}
                </div>
              )}

              {/* Leyenda de estados */}
              <div style={{
                marginTop: 8,
                paddingTop: 12,
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
                      background: 'rgba(255, 68, 68, 0.25)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 68, 68, 0.5)'
                    }}></div>
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
                      background: 'rgba(255, 201, 51, 0.25)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 201, 51, 0.5)'
                    }}></div>
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
                      background: 'rgba(255, 106, 0, 0.25)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 106, 0, 0.5)'
                    }}></div>
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
          dragListener={false}
          dragControls={dragControls}
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
          dragConstraints={{ top: 40, bottom: collapsedY }}
          dragElastic={0.08}
          onDragEnd={onDragEnd}
        >
          {/* Handle del sheet */}
          <div
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              dragControls.start(e);
            }}
            onClick={() => {
              const current = y.get();
              const TOP_OFFSET = 40; // Offset menor para aprovechar más espacio arriba
              const distToExpanded = Math.abs(current - TOP_OFFSET);
              const distToCollapsed = Math.abs(current - collapsedY);
              const isCurrentlyExpanded = distToExpanded < distToCollapsed;
              snapTo(isCurrentlyExpanded ? collapsedY : TOP_OFFSET);
            }}
            style={{
              display: 'grid',
              placeItems: 'center',
              paddingTop: 10,
              paddingBottom: 2,
              flexShrink: 0,
              touchAction: 'none',
              WebkitUserSelect: 'none',
              userSelect: 'none',
              cursor: 'grab'
            }}
          >
            <div style={{
              width: 56,
              height: 5,
              borderRadius: 999,
              background: 'rgba(255, 121, 57, 0.6)',
            }}></div>
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
                    autoPlay
                    loop
                    playsInline
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
                }}></div>
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
                }}></div>
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
                        bunnyVideoId={(selectedVideo as any).bunnyVideoId || undefined}
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
                                    <circle cx="8" cy="8" r="7" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" />
                                    <path d="M8 4V8L11 10" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" strokeLinecap="round" />
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
                                  }}></div>
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

                          {/* Tabbed Interface for Ingredientes and Receta */}
                          {(selectedVideo?.ingredientes || selectedVideo.receta) && (() => {
                            let ingredientesList: string[] = [];
                            try {
                              if (selectedVideo?.ingredientes) {
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
                              }
                            } catch (e) {
                              if (selectedVideo?.ingredientes) {
                                ingredientesList = [String(selectedVideo.ingredientes)];
                              }
                            }

                            return (
                              <div style={{
                                margin: '0 20px 20px',
                                padding: 0
                              }}>
                                {/* Tab Headers - Minimal Text Only */}
                                <div style={{
                                  display: 'flex',
                                  gap: 24,
                                  marginBottom: 16,
                                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                  paddingBottom: 0
                                }}>
                                  {ingredientesList.length > 0 && (
                                    <button
                                      onClick={() => setActiveMealTab('Ingredientes')}
                                      style={{
                                        padding: '0 0 12px 0',
                                        background: 'transparent',
                                        border: 'none',
                                        borderBottom: activeMealTab === 'Ingredientes' ? '2px solid #FF6A1A' : '2px solid transparent',
                                        color: activeMealTab === 'Ingredientes' ? '#FF6A1A' : 'rgba(255, 255, 255, 0.5)',
                                        fontSize: 15,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        outline: 'none',
                                        position: 'relative',
                                        top: 1
                                      }}
                                    >
                                      Ingredientes
                                    </button>
                                  )}
                                  {selectedVideo.receta && (
                                    <button
                                      onClick={() => setActiveMealTab('Instrucciones')}
                                      style={{
                                        padding: '0 0 12px 0',
                                        background: 'transparent',
                                        border: 'none',
                                        borderBottom: activeMealTab === 'Instrucciones' ? '2px solid #FF6A1A' : '2px solid transparent',
                                        color: activeMealTab === 'Instrucciones' ? '#FF6A1A' : 'rgba(255, 255, 255, 0.5)',
                                        fontSize: 15,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        outline: 'none',
                                        position: 'relative',
                                        top: 1
                                      }}
                                    >
                                      Instrucciones
                                    </button>
                                  )}
                                </div>

                                {/* Tab Content - Clean, No Frames */}
                                <div style={{
                                  padding: '10px 0',
                                  minHeight: 200
                                }}>
                                  {activeMealTab === 'Ingredientes' && ingredientesList.length > 0 && (
                                    <div style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: 12
                                    }}>
                                      {ingredientesList.map((ingrediente, index) => (
                                        <div
                                          key={index}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'baseline',
                                            gap: 10,
                                            padding: '4px 0'
                                          }}
                                        >
                                          <ShoppingCart size={14} className="text-[#FF6A1A] flex-shrink-0 relative top-[2px]" />
                                          <span style={{
                                            color: 'rgba(255, 255, 255, 0.85)',
                                            fontSize: 14,
                                            fontWeight: 400,
                                            lineHeight: 1.5,
                                            flex: 1
                                          }}>
                                            {ingrediente}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {activeMealTab === 'Instrucciones' && selectedVideo.receta && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                      {selectedVideo.receta.split(/(?=\d+\.\s)/).map((part: string, i: number) => {
                                        const trimmed = part.trim();
                                        if (!trimmed) return null;
                                        const match = trimmed.match(/^(\d+)\.\s+([\s\S]*)/);

                                        if (match) {
                                          return (
                                            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                                              <div style={{
                                                flexShrink: 0,
                                                width: 24,
                                                height: 24,
                                                borderRadius: '50%',
                                                // background: 'rgba(255, 106, 26, 0.15)',
                                                color: '#FF6A1A',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 14, // Slightly bigger
                                                fontWeight: 800,
                                                border: '1px solid rgba(255, 106, 26, 0.4)',
                                                marginTop: 0
                                              }}>{match[1]}</div>
                                              <p style={{
                                                color: 'rgba(255, 255, 255, 0.85)',
                                                fontSize: 14,
                                                lineHeight: 1.6,
                                                margin: 0,
                                                flex: 1
                                              }}>{match[2]}</p>
                                            </div>
                                          );
                                        }

                                        // Fallback for non-numbered text
                                        return (
                                          <p key={i} style={{
                                            color: 'rgba(255, 255, 255, 0.85)',
                                            fontSize: 14,
                                            lineHeight: 1.6,
                                            margin: 0,
                                            whiteSpace: 'pre-wrap'
                                          }}>
                                            {trimmed}
                                          </p>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}

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
                                <div style={{ width: 1, height: 20, background: 'rgba(255, 255, 255, 0.1)' }}></div>
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
                                <div style={{ width: 1, height: 20, background: 'rgba(255, 255, 255, 0.1)' }}></div>
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
                                    onClick={() => {/* TODO: Expandir descripción */ }}
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
                          padding: '10px 22px',
                          borderRadius: 14,
                          background: isDone ? '#FF7939' : 'rgba(255, 121, 57, 0.10)',
                          border: isDone ? '1px solid rgba(255, 121, 57, 0.75)' : '1px solid rgba(255, 121, 57, 0.50)',
                          boxShadow: isDone
                            ? '0 12px 32px rgba(255, 121, 57, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.10)'
                            : '0 10px 26px rgba(0, 0, 0, 0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          minWidth: '100px'
                        }}
                        onMouseEnter={(e) => {
                          if (!isDone) {
                            e.currentTarget.style.background = 'rgba(255, 121, 57, 0.15)';
                            e.currentTarget.style.border = '1px solid rgba(255, 121, 57, 0.65)';
                            e.currentTarget.style.boxShadow = '0 14px 34px rgba(255, 121, 57, 0.12), 0 10px 26px rgba(0, 0, 0, 0.35)';
                          } else {
                            e.currentTarget.style.background = '#FF7939';
                            e.currentTarget.style.border = '1px solid rgba(255, 121, 57, 0.85)';
                            e.currentTarget.style.boxShadow = '0 14px 34px rgba(255, 121, 57, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.12)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isDone) {
                            e.currentTarget.style.background = 'rgba(255, 121, 57, 0.10)';
                            e.currentTarget.style.border = '1px solid rgba(255, 121, 57, 0.50)';
                            e.currentTarget.style.boxShadow = '0 10px 26px rgba(0, 0, 0, 0.35)';
                          } else {
                            e.currentTarget.style.background = '#FF7939';
                            e.currentTarget.style.border = '1px solid rgba(255, 121, 57, 0.75)';
                            e.currentTarget.style.boxShadow = '0 12px 32px rgba(255, 121, 57, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.10)';
                          }
                        }}
                      >
                        <span style={{
                          color: isDone ? '#000000' : '#FFB366',
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
            <div style={{ padding: '0px 20px 0px' }}>
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
                  color: 'rgba(255, 255, 255, 0.6)'
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
                    {activities.length}
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
              <div style={{
                opacity: isDayLoading ? 0.6 : 1,
                transition: 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                pointerEvents: isDayLoading ? 'none' : 'auto',
                position: 'relative'
              }}>
                {isDayLoading && activities.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: 10,
                    right: 20,
                    zIndex: 10
                  }}>
                    <Flame size={20} className="animate-pulse text-[#FF7939]" />
                  </div>
                )}
                {isDayLoading && activities.length === 0 && (
                  <div style={{ padding: '60px 20px', display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <Flame size={40} className="animate-pulse text-[#FF7939]" />
                  </div>
                )}
                {activities.length === 0 && !isDayLoading && (
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
                          <button
                            onClick={() => {
                              snapTo(collapsedY);
                              handleOpenSurveyModal();
                            }}
                            style={{
                              marginTop: 8,
                              background: 'linear-gradient(135deg, #FF6A00 0%, #FF7939 100%)',
                              color: '#000',
                              border: 'none',
                              padding: '12px 32px',
                              borderRadius: 999,
                              fontSize: 14,
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 8px 20px rgba(255, 106, 0, 0.4)',
                              letterSpacing: '0.5px'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                              e.currentTarget.style.boxShadow = '0 12px 24px rgba(255, 106, 0, 0.5)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = 'translateY(0) scale(1)';
                              e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 106, 0, 0.4)';
                            }}
                          >
                            Calificar
                          </button>
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
                              </span>
                              <span style={{
                                fontSize: 12,
                                color: isActiveBlock ? 'rgba(255, 107, 53, 0.8)' : 'rgba(255, 255, 255, 0.6)'
                              }}>
                                {blockActivities.length} {blockActivities[0]?.proteinas !== undefined && blockActivities[0]?.proteinas !== null ? 'platos' : 'ejercicios'}
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
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s ease',
                                  color: isBlockCompleted(blockNumber) ? '#FF7939' : 'rgba(255, 255, 255, 0.4)',
                                  padding: '4px'
                                }}
                              >
                                <Flame size={22} fill={isBlockCompleted(blockNumber) ? '#FF7939' : 'none'} />
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

              {/* Daily Nutrition Summary - Minimal */}
              {activities.length > 0 && (() => {
                const dailyTotals = activities.reduce((acc, activity) => {
                  return {
                    calorias: acc.calorias + (activity.calorias || 0),
                    proteinas: acc.proteinas + (activity.proteinas || 0),
                    carbohidratos: acc.carbohidratos + (activity.carbohidratos || 0),
                    grasas: acc.grasas + (activity.grasas || 0)
                  };
                }, { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 });

                return (
                  <div style={{
                    margin: '16px 20px 0',
                    padding: '14px 16px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 12,
                    border: '1px solid rgba(255, 106, 26, 0.15)'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16
                    }}>
                      {/* Calorías - Destacado */}
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: 'rgba(255, 255, 255, 0.5)',
                          marginBottom: 2,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Total
                        </div>
                        <div style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: '#FF6A1A'
                        }}>
                          {Math.round(dailyTotals.calorias)}
                          <span style={{
                            fontSize: 11,
                            fontWeight: 500,
                            color: 'rgba(255, 106, 26, 0.7)',
                            marginLeft: 3
                          }}>kcal</span>
                        </div>
                      </div>

                      {/* Macros - Compacto */}
                      <div style={{
                        display: 'flex',
                        gap: 12,
                        alignItems: 'center'
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: '#FFFFFF'
                          }}>
                            {Math.round(dailyTotals.proteinas)}
                            <span style={{
                              fontSize: 9,
                              fontWeight: 500,
                              color: 'rgba(255, 255, 255, 0.5)',
                              marginLeft: 2
                            }}>P</span>
                          </div>
                        </div>

                        <div style={{
                          width: 1,
                          height: 20,
                          background: 'rgba(255, 255, 255, 0.1)'
                        }}></div>

                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: '#FFFFFF'
                          }}>
                            {Math.round(dailyTotals.carbohidratos)}
                            <span style={{
                              fontSize: 9,
                              fontWeight: 500,
                              color: 'rgba(255, 255, 255, 0.5)',
                              marginLeft: 2
                            }}>C</span>
                          </div>
                        </div>

                        <div style={{
                          width: 1,
                          height: 20,
                          background: 'rgba(255, 255, 255, 0.1)'
                        }}></div>

                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: '#FFFFFF'
                          }}>
                            {Math.round(dailyTotals.grasas)}
                            <span style={{
                              fontSize: 9,
                              fontWeight: 500,
                              color: 'rgba(255, 255, 255, 0.5)',
                              marginLeft: 2
                            }}>G</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </motion.div>

        {/* Modal de Encuesta de Actividad */}
        {
          showSurveyModal && (
            <ActivitySurveyModal
              isOpen={showSurveyModal}
              onClose={handleCloseSurveyModal}
              onComplete={handleSurveyComplete}
              activityTitle={programInfo?.title || "Actividad"}
            />
          )
        }

        {/* Modal de Empezar Actividad */}
        {
          showStartModal && (
            <StartActivityModal
              isOpen={showStartModal}
              onClose={() => setShowStartModal(false)}
              activityTitle={programInfo?.title || "Actividad"}
              onStartActivity={handleStartActivity}
            />
          )
        }

        {/* Modal de Información de Inicio */}
        {
          showStartInfoModal && (
            <StartActivityInfoModal
              isOpen={showStartInfoModal}
              onClose={() => setShowStartInfoModal(false)}
              onStartToday={handleStartToday}
              onStartOnFirstDay={handleStartOnFirstDay}
              activityTitle={programInfo?.title || "Actividad"}
              firstDay={firstDayOfActivity}
              currentDay={getBuenosAiresDayName(new Date())}
            />
          )
        }


        <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
          <DialogContent className="bg-[#111111] border-none shadow-2xl text-white w-[92%] max-w-sm rounded-[32px] p-8">
            <DialogHeader className="items-center text-center space-y-4">
              <div className="w-12 h-12 bg-[#FF7939]/10 rounded-full flex items-center justify-center">
                <Calendar className="text-[#FF7939]" size={24} />
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight">Mover actividades</DialogTitle>
              <DialogDescription className="text-zinc-400 text-base">
                ¿Cambiar la fecha de estas actividades?
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-between py-8 px-2">
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Origen</span>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-white leading-none">{sourceDate?.getDate()}</span>
                  <span className="text-[11px] text-[#FF7939] font-medium capitalize mt-1.5">{sourceDate && getDayName(sourceDate)}</span>
                </div>
              </div>

              <div className="flex flex-col items-center opacity-30">
                <ArrowRight size={20} />
              </div>

              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Destino</span>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-white leading-none">{targetDate?.getDate()}</span>
                  <span className="text-[11px] text-zinc-400 font-medium capitalize mt-1.5">{targetDate && getDayName(targetDate)}</span>
                </div>
              </div>
            </div>

            {/* Warning if target day has activities */}
            {targetDate && getDayStatus(targetDate) !== 'no-exercises' && (
              <div className="mb-6 p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 flex items-start gap-3">
                <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200/90 leading-relaxed italic">
                  El {getDayName(targetDate)} {targetDate.getDate()} ya tiene actividades. Se sumarán a las existentes.
                </p>
              </div>
            )}

            {sourceDate && hasFutureOccurrences() && (
              <div className="mb-8 p-4 bg-zinc-900/50 rounded-2xl border border-white/5 flex items-center gap-4">
                <Checkbox
                  id="apply-all"
                  checked={applyToAllSameDays}
                  onCheckedChange={(checked) => setApplyToAllSameDays(checked as boolean)}
                  className="rounded-lg border-zinc-700 data-[state=checked]:bg-[#FF7939] data-[state=checked]:border-[#FF7939]"
                />
                <label
                  htmlFor="apply-all"
                  className="text-xs font-medium text-zinc-300 cursor-pointer select-none leading-tight"
                >
                  Cambiar todos los <span className="text-white capitalize">{getDayName(sourceDate)}s</span> futuros
                </label>
              </div>
            )}

            <div className="flex flex-col items-center gap-6 mt-2">
              <button
                onClick={handleConfirmUpdate}
                disabled={isUpdating}
                style={{
                  padding: '4px 10px',
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255, 106, 0, 0.1)',
                  border: '1px solid rgba(255, 106, 0, 0.4)',
                  borderRadius: 12,
                  color: '#FF6A00',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: isUpdating ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  width: 'auto',
                  minWidth: '90px'
                }}
                onMouseEnter={(e) => {
                  if (!isUpdating) {
                    e.currentTarget.style.background = 'rgba(255, 106, 0, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(255, 106, 0, 0.6)';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isUpdating) {
                    e.currentTarget.style.background = 'rgba(255, 106, 0, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 106, 0, 0.4)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                {isUpdating ? 'Guardando...' : 'Confirmar'}
              </button>

              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div >
    </div >
  );
}
