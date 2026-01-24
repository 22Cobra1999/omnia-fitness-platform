"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { throttledLog } from '@/lib/logging/log-throttler'
import {
  ChefHat,
  Dumbbell,
  Video,
  BookOpen,
  Briefcase,
  Zap,
  Search,
  Filter,
  Star,
  Clock,
  Users,
  Play,
  Loader2,
  RefreshCw,
  ChevronRight,
  StickyNote,
  X,
  CalendarPlus,
  CalendarClock,
  Flame,
  MessageSquare,
} from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import CoachProfileModal from "@/components/coach/CoachProfileModal"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ActivitySkeletonLoader, CoachSkeletonLoader } from '@/components/shared/activities/activity-skeleton-loader'
import { getSupabaseClient } from '@/lib/supabase/supabase-client'
import { PurchaseActivityModal } from '@/components/shared/activities/purchase-activity-modal'
import { ActivitySurveyModal } from '@/components/shared/activities/activity-survey-modal'
import { PurchasedActivityCard } from "@/components/activities/purchased-activity-card"
import CoachProfileCard from "@/components/coach/clients/CoachProfileCard"
import TodayScreen from '@/components/shared/misc/TodayScreen'
import { WorkshopClientView } from "@/components/client/workshop-client-view"
import type { Activity, Enrollment } from "@/types/activity" // Import updated types
import { OmniaLogoText } from '@/components/shared/ui/omnia-logo'
import { SettingsIcon } from '@/components/shared/ui/settings-icon'
import { MessagesIcon } from '@/components/shared/ui/messages-icon'

interface Coach {
  id: string
  full_name: string
  specialization?: string // Use specialization from DB
  specialty_detail?: string // Derived from specialization
  experience_years?: number
  rating?: number
  total_reviews?: number
  user_profile?: {
    avatar_url?: string
    bio?: string
  }
}

export function ActivityScreen() {
  // Log de tiempo de inicio de carga del componente
  const componentStartTime = Date.now()

  const [activeTab, setActiveTab] = useState("purchased")
  const [activeCategory, setActiveCategory] = useState("all")
  const [activityStatusTab, setActivityStatusTab] = useState<"en-curso" | "por-empezar" | "finalizadas">("en-curso")
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  // Eliminado: videoDialogOpen
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null)
  const [videoNotes, setVideoNotes] = useState<Record<string, string>>({})
  const [currentNote, setCurrentNote] = useState("")
  const [scheduledItems, setScheduledItems] = useState<Record<string, any>>({})
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isScheduling, setIsScheduling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Eliminado: selectedActivity (rutinas recomendadas)
  const supabase = getSupabaseClient()
  const router = useRouter()
  const [isSilentlyUpdating, setIsSilentlyUpdating] = useState(false)
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [loadingCoaches, setLoadingCoaches] = useState(true)
  const [enrollmentProgresses, setEnrollmentProgresses] = useState<Record<number, number>>({})
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)
  const [showTodayScreen, setShowTodayScreen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCoachForProfile, setSelectedCoachForProfile] = useState<Coach | null>(null)
  const [isCoachProfileModalOpen, setIsCoachProfileModalOpen] = useState(false)
  const [meetCredits, setMeetCredits] = useState<Record<string, number>>({})
  const [nextActivities, setNextActivities] = useState<Record<number, any>>({})

  // Función para manejar el click en una actividad
  const handleActivityClick = (activityId: string) => {
    // usage.onClick(activityId, { where: "PurchasedActivityCard" }) // Removido - variable no definida
    setSelectedActivityId(activityId)
    setShowTodayScreen(true)
  }

  // Obtener el tipo de actividad seleccionada
  const getSelectedActivityType = () => {
    const enrollment = enrollments.find(e => e.activity_id.toString() === selectedActivityId)
    return enrollment?.activity?.type || null
  }

  // Efecto para manejar navegación desde el calendario o compra
  // Se ejecuta al montar Y cuando los enrollments cambian (después de una compra)
  useEffect(() => {
    const checkForPendingNavigation = () => {
      if (typeof window === 'undefined') return;

      const selectedActivityFromCalendar = localStorage.getItem('selectedActivityFromCalendar');
      if (selectedActivityFromCalendar) {
        console.log('📅 [ActivityScreen] ActivityId detectado desde calendario:', selectedActivityFromCalendar);
        setSelectedActivityId(selectedActivityFromCalendar);
        setShowTodayScreen(true);
        // Limpiar el localStorage después de usarlo
        localStorage.removeItem('selectedActivityFromCalendar');
        console.log('🧹 [ActivityScreen] localStorage limpiado');
        return;
      }

      // Detectar actividad recién comprada
      const openActivityId = localStorage.getItem('openActivityId');
      if (openActivityId) {
        console.log('🛒 [ActivityScreen] ActivityId detectado desde compra:', openActivityId);
        setSelectedActivityId(openActivityId);
        setShowTodayScreen(true);
        // Limpiar el localStorage después de usarlo
        localStorage.removeItem('openActivityId');
        console.log('🧹 [ActivityScreen] localStorage limpiado (compra)');
      }
    };

    // Verificar inmediatamente
    checkForPendingNavigation();

    // También verificar cuando enrollments cambia (después de comprar)
    const timer = setTimeout(checkForPendingNavigation, 500);

    return () => clearTimeout(timer);
  }, [enrollments.length]); // Re-ejecutar cuando cambie la cantidad de enrollments

  // Fetch meet credits
  useEffect(() => {
    const fetchMeetCredits = async () => {
      const supabase = getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('client_meet_credits_ledger')
        .select('coach_id, meet_credits_available')
        .eq('client_id', user.id)

      if (error) {
        console.error('Error fetching meet credits:', error)
        return
      }

      if (data) {
        const creditsMap: Record<string, number> = {}
        data.forEach((item: any) => {
          creditsMap[item.coach_id] = item.meet_credits_available
        })
        setMeetCredits(creditsMap)
      }
    }

    fetchMeetCredits()
  }, [])

  // Función para manejar el click en un coach desde la tab de Activity
  const handleCoachClickFromActivity = (coachId: string) => {
    const coach = coaches.find(c => c.id === coachId)
    if (coach) {
      setSelectedCoachForProfile(coach)
      setIsCoachProfileModalOpen(true)
    } else {
      console.error("❌ [ACTIVITY] Coach no encontrado:", coachId)
    }
  }

  // Función para manejar el inicio de una actividad - memoizada
  const handleStartActivity = useCallback(async (activityId: string, startDate?: Date) => {

    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.error('❌ Usuario no autenticado');
        return;
      }

      // Usar la fecha calculada o la fecha actual
      const startDateString = startDate ? startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

      // Actualizar start_date en activity_enrollments
      const { error } = await supabase
        .from('activity_enrollments')
        .update({
          start_date: startDateString,
          updated_at: new Date().toISOString()
        })
        .eq('client_id', user.id)
        .eq('activity_id', parseInt(activityId));

      if (error) {
        console.error('❌ Error iniciando actividad:', error);
        return;
      }


      // Recargar datos para actualizar la interfaz
      await fetchUserEnrollments();

      // Si es hoy, abrir la actividad automáticamente
      const today = new Date().toISOString().split('T')[0];
      if (startDateString === today) {
        handleActivityClick(activityId);
      }

    } catch (error) {
      console.error('❌ Error iniciando actividad:', error);
    }
  }, [handleActivityClick])

  // Función para volver a la lista de actividades - memoizada
  const handleBackToActivities = useCallback(() => {
    setShowTodayScreen(false)
    setSelectedActivityId(null)
  }, [])

  // Función simple para calcular el progreso: completados / total
  const calculateRealProgress = useCallback(async (enrollment: Enrollment) => {
    try {
      const activityId = enrollment.activity_id
      const activityType = enrollment.activity.type?.toLowerCase() || ""

      // DOCUMENT: Calculate from client_document_progress
      if (activityType === 'document' || activityType === 'documento') {
        const { data: progressData, error: progressError } = await supabase
          .from('client_document_progress')
          .select('completed')
          .eq('client_id', enrollment.client_id)
          .eq('activity_id', activityId)

        if (progressError) {
          console.error('❌ Error getting document progress:', progressError)
          return 0
        }

        if (!progressData || progressData.length === 0) return 0

        const completedCount = progressData.filter(p => p.completed).length
        const totalCount = progressData.length
        return totalCount > 0 ? (completedCount / totalCount) * 100 : 0
      }

      // WORKSHOP: Calculate from taller_progreso_temas (attendance-based)
      if (activityType === 'workshop' || activityType === 'taller') {
        const { data: progressData, error: progressError } = await supabase
          .from('taller_progreso_temas')
          .select('asistio, fecha_seleccionada')
          .eq('cliente_id', enrollment.client_id)
          .eq('actividad_id', activityId)

        if (progressError) {
          console.error('❌ Error getting workshop progress:', progressError)
          return 0
        }

        if (!progressData || progressData.length === 0) return 0

        // Only count classes that have already happened
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const pastClasses = progressData.filter(p => {
          if (!p.fecha_seleccionada) return false
          const classDate = new Date(p.fecha_seleccionada)
          classDate.setHours(0, 0, 0, 0)
          return classDate < today
        })

        if (pastClasses.length === 0) return 0

        const attendedCount = pastClasses.filter(p => p.asistio).length
        return (attendedCount / pastClasses.length) * 100
      }

      // PROGRAM: Existing logic
      const activityCategory = enrollment.activity.categoria?.toLowerCase() || ""

      const isNutrition = activityType.includes("nutrition") || activityCategory === "nutricion" || activityCategory === "nutrition"
      const tableName = isNutrition ? "progreso_cliente_nutricion" : "progreso_cliente"


      // Obtener progreso del cliente para esta actividad usando la tabla correcta
      const { data: progressRecords, error: progressError } = await supabase
        .from(tableName)
        .select("ejercicios_completados, ejercicios_pendientes")
        .eq("actividad_id", activityId)
        .eq("cliente_id", enrollment.client_id)

      if (progressError) {
        console.error("❌ [calculateRealProgress] Error getting progress:", progressError)
        return 0
      }

      // Sumar todos los ejercicios completados y pendientes de todos los registros
      let totalCompleted = 0
      let totalPending = 0

      progressRecords?.forEach(record => {
        try {
          const completados = record.ejercicios_completados
            ? (typeof record.ejercicios_completados === 'string'
              ? JSON.parse(record.ejercicios_completados)
              : record.ejercicios_completados)
            : {};
          const pendientes = record.ejercicios_pendientes
            ? (typeof record.ejercicios_pendientes === 'string'
              ? JSON.parse(record.ejercicios_pendientes)
              : record.ejercicios_pendientes)
            : {};

          totalCompleted += Object.keys(completados).length
          totalPending += Object.keys(pendientes).length
        } catch (err) {
          console.warn('⚠️ Error parseando JSON en calculateRealProgress:', err)
        }
      })

      const total = totalCompleted + totalPending


      if (total === 0) return 0
      const progressPercentage = Math.round((totalCompleted / total) * 100)
      return progressPercentage

    } catch (error) {
      console.error("❌ [calculateRealProgress] Error:", error)
      return 0
    }
  }, [])

  // Función para obtener la próxima actividad de un enrollment - memoizada
  const getNextActivity = useCallback(async (enrollment: Enrollment) => {
    try {
      const activityId = enrollment.activity_id
      const activityType = enrollment.activity.type.toLowerCase()

      if (activityType.includes("fitness")) {
        // Usar el nuevo esquema modular: ejercicios_detalles
        const { data: nextExercise, error } = await supabase
          .from("ejercicios_detalles")
          .select(`
            id, nombre_ejercicio, semana, dia
          `)
          .contains('activity_id', { [activityId]: {} })
          .not('semana', 'is', null)
          .order("semana", { ascending: true })
          .order("dia", { ascending: true })
          .limit(1)
          .maybeSingle()

        if (!error && nextExercise) {
          return {
            title: nextExercise.nombre_ejercicio || "Ejercicio",
            day: nextExercise.dia,
            week: nextExercise.semana
          }
        }
      } else if (activityType.includes("nutrition")) {
        // Para nutrición, usar la tabla existente si existe
        const { data: nextNutrition, error } = await supabase
          .from("nutrition_program_details")
          .select("semana, día, nombre")
          .eq("activity_id", activityId)
          .order("semana", { ascending: true })
          .order("día", { ascending: true })
          .limit(1)
          .maybeSingle()

        if (!error && nextNutrition) {
          return {
            title: nextNutrition.nombre,
            day: nextNutrition.día,
            week: nextNutrition.semana
          }
        }
      } else if (activityType.includes("workshop") || activityType.includes("taller")) {
        // Logic for Workshops: Find next session date
        const { data: workshopTopics, error } = await supabase
          .from("taller_detalles")
          .select("originales, nombre")
          .eq("actividad_id", activityId)

        if (!error && workshopTopics && workshopTopics.length > 0) {
          const today = new Date().toISOString().split('T')[0]
          let nextSession = null
          let minDiff = Infinity

          workshopTopics.forEach((topic: any) => {
            const allHorarios = [
              ...(topic.originales?.fechas_horarios || [])
            ]

            allHorarios.forEach((h: any) => {
              if (h.fecha && h.fecha >= today) {
                // Check if it's closer than current found date
                const diff = new Date(h.fecha).getTime() - new Date(today).getTime()
                if (diff < minDiff) {
                  minDiff = diff
                  nextSession = {
                    title: topic.nombre || "Taller",
                    day: h.fecha, // Using date string as day
                    week: 1, // Placeholder
                    isToday: h.fecha === today
                  }
                }
              }
            })
          })

          if (nextSession) {
            return {
              title: (nextSession as any).isToday ? "¡SESIÓN HOY!" : (nextSession as any).title,
              day: (nextSession as any).day, // Will be formatted by card
              week: 0
            }
          }
        }
      }

      return null
    } catch (error) {
      console.error("Error getting next activity:", error)
      return null
    }
  }, [])

  // Estados para el modal de encuesta
  const [showSurveyModal, setShowSurveyModal] = useState(false)
  const [selectedActivityForSurvey, setSelectedActivityForSurvey] = useState<Activity | null>(null)
  const [hasUserSubmittedSurvey, setHasUserSubmittedSurvey] = useState(false)
  // Eliminado: complementaryActivities y loadingComplementary
  const [refreshing, setRefreshing] = useState(false)
  // searchTerm ahora viene del hook base
  const [showFilters, setShowFilters] = useState(false)
  const [showFiltersModal, setShowFiltersModal] = useState(false)
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false)
  const [selectedPurchaseActivity, setSelectedPurchaseActivity] = useState<Activity | null>(null)

  // Estados para filtros múltiples
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["all"])
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["purchased"])

  // Estados para pull-to-refresh

  const activityTypes = ["all", "Fitness", "Yoga", "Gym", "Nutrición", "Consulta"]

  // Funciones para manejar filtros múltiples - memoizadas
  const toggleCategory = useCallback((category: string) => {
    if (category === "all") {
      setSelectedCategories(["all"])
    } else {
      setSelectedCategories(prev => {
        const newCategories = prev.filter(c => c !== "all")
        if (newCategories.includes(category)) {
          const filtered = newCategories.filter(c => c !== category)
          return filtered.length === 0 ? ["all"] : filtered
        } else {
          return [...newCategories, category]
        }
      })
    }
  }, [])

  const toggleType = useCallback((type: string) => {
    setSelectedTypes(prev => {
      if (prev.includes(type)) {
        const filtered = prev.filter(t => t !== type)
        return filtered.length === 0 ? ["purchased"] : filtered
      } else {
        return [...prev, type]
      }
    })
  }, [])


  // Schedule form state
  const [scheduleTitle, setScheduleTitle] = useState("")
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleTime, setScheduleTime] = useState("")
  const [scheduleDuration, setScheduleDuration] = useState("")
  const [scheduleType, setScheduleType] = useState<"video" | "activity">("video")
  const [scheduleItemId, setScheduleItemId] = useState("")

  // Guardar el estado actual de la tab para navegación de retorno
  useEffect(() => {
    try {
      localStorage.setItem("current_mobile_screen", "activity")
      localStorage.setItem("current_activity_tab", activeTab)
      localStorage.setItem("current_activity_category", activeCategory)
    } catch (e) {
      console.error("Error saving current tab state:", e)
    }
  }, [activeTab, activeCategory])

  // Añadir estas constantes al inicio del componente, después de las definiciones de estado
  const COACHES_CACHE_KEY = "coaches-cache"
  // Tiempo de caché en milisegundos (15 minutos)
  const CACHE_EXPIRY = 15 * 60 * 1000

  // Implementar caché de enrollments (similar a SearchScreen)
  useEffect(() => {
    if (enrollments && enrollments.length > 0) {
      // Guardar en sessionStorage para acceso rápido
      try {
        sessionStorage.setItem("cached_enrollments", JSON.stringify(enrollments))
        sessionStorage.setItem("enrollments_cache_timestamp", Date.now().toString())
      } catch (e) {
        console.error("Error al guardar enrollments en sessionStorage:", e)
      }
    }
  }, [enrollments?.length]) // Solo cuando cambia la cantidad de enrollments

  // Implementar caché de coaches (similar a SearchScreen)
  useEffect(() => {
    if (coaches && coaches.length > 0) {
      // Guardar en sessionStorage para acceso rápido
      try {
        sessionStorage.setItem("cached_activity_coaches", JSON.stringify(coaches))
        sessionStorage.setItem("activity_coaches_cache_timestamp", Date.now().toString())
      } catch (e) {
        console.error("Error al guardar coaches en sessionStorage:", e)
      }
    }
  }, [coaches?.length]) // Solo cuando cambia la cantidad de coaches

  // Cargar datos en caché al iniciar (solo una vez)
  useEffect(() => {
    const dataLoadStartTime = Date.now()

    let hasCachedData = false

    // Cargar enrollments desde caché
    try {
      const cachedEnrollments = sessionStorage.getItem("cached_enrollments")
      const enrollmentsTimestamp = Number.parseInt(sessionStorage.getItem("enrollments_cache_timestamp") || "0")

      // Usar caché solo si existe y tiene menos de 10 minutos
      if (cachedEnrollments && Date.now() - enrollmentsTimestamp < 10 * 60 * 1000) {
        const parsedEnrollments = JSON.parse(cachedEnrollments)
        if (parsedEnrollments && parsedEnrollments.length > 0) {
          const cacheLoadTime = Date.now() - dataLoadStartTime
          setEnrollments(parsedEnrollments)
          hasCachedData = true
        }
      }
    } catch (e) {
      console.error("Error al cargar caché inicial de enrollments:", e)
    }

    // Cargar coaches desde caché
    try {
      const cachedCoaches = sessionStorage.getItem("cached_activity_coaches")
      const coachesTimestamp = Number.parseInt(sessionStorage.getItem("activity_coaches_cache_timestamp") || "0")

      // Usar caché solo si existe y tiene menos de 10 minutos
      if (cachedCoaches && Date.now() - coachesTimestamp < 10 * 60 * 1000) {
        const parsedCoaches = JSON.parse(cachedCoaches)
        if (parsedCoaches && parsedCoaches.length > 0) {
          const coachesCacheLoadTime = Date.now() - dataLoadStartTime
          setCoaches(parsedCoaches)
          setLoadingCoaches(false)
          hasCachedData = true
        }
      }
    } catch (e) {
      console.error("Error al cargar caché inicial de coaches:", e)
    }

    // Si hay datos en caché, no cargar desde API inmediatamente
    if (hasCachedData) {
      const totalCacheLoadTime = Date.now() - dataLoadStartTime
      setIsLoading(false)
      // Cargar datos frescos en background después de un delay
      setTimeout(() => {
        fetchUserEnrollments(true).catch(console.error) // silentUpdate = true
        loadCoaches().catch(console.error)
      }, 2000) // 2 segundos de delay
      return
    }

    // Si no hay caché válido, cargar datos normalmente
    let mounted = true

    // Fetch enrollments immediately
    const apiLoadStartTime = Date.now()
    fetchUserEnrollments().catch(console.error)

    // Cargar coaches en paralelo (rutinas recomendadas eliminadas)
    if (mounted) {
      Promise.all([loadCoaches()]).then(() => {
        const totalApiLoadTime = Date.now() - apiLoadStartTime
      }).catch(console.error)
    }

    return () => {
      mounted = false
    }
  }, []) // Array vacío = solo al montar

  // Log del tiempo total de carga cuando se complete
  useEffect(() => {
    if (!isLoading && !loadingCoaches) {
      const totalLoadTime = Date.now() - componentStartTime
    }
  }, [isLoading, loadingCoaches, enrollments.length, coaches.length])

  const fetchUserEnrollments = async (silentUpdate = false) => {
    const enrollmentsStartTime = Date.now()

    if (silentUpdate) {
      setIsSilentlyUpdating(true)
    } else {
      setIsLoading(true)
      setError(null)
    }

    try {
      // Intentar obtener el usuario con retry mejorado
      let user = null
      let attempts = 0
      const maxAttempts = 5

      while (!user && attempts < maxAttempts) {
        try {
          const { data: userData, error: userError } = await supabase.auth.getUser()

          if (!userError && userData?.user) {
            user = userData.user
            break
          }

          // Si hay error específico de autenticación, intentar getSession
          if (userError) {
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
            if (!sessionError && sessionData?.session?.user) {
              user = sessionData.session.user
              break
            }
          }
        } catch (e) {
          console.warn(`Auth attempt ${attempts + 1} failed:`, e)
        }

        attempts++
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempts)) // Backoff exponencial
        }
      }

      if (!user) {
        // console.log("No se pudo obtener el usuario después de varios intentos")
        if (!silentUpdate) {
          setEnrollments([])
          setIsLoading(false)
        }
        return
      }

      // Usuario autenticado - log removido para optimización

      // Consulta optimizada con información del coach - Actualizada para nuevo esquema
      const { data, error: enrollmentsError } = await supabase
        .from("activity_enrollments")
        .select(
          `
        id,
        activity_id,
        client_id,
        status,
        created_at,
        start_date,
        expiration_date,
        program_end_date,
        activity:activities!activity_enrollments_activity_id_fkey (
          id,
          title,
          description,
          type,
          difficulty,
          price,
          coach_id,
          categoria,
          dias_acceso,
          media:activity_media!activity_media_activity_id_fkey (image_url, video_url),
          coaches:coaches!activities_coach_id_fkey (id, full_name, specialization)
        )
      `,
        )
        .eq("client_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20)

      if (enrollmentsError) {
        console.error("Error al obtener inscripciones:", enrollmentsError)
        throw enrollmentsError
      }

      // Log optimizado - solo en desarrollo
      if (process.env.NODE_ENV === 'development') {
        // Raw enrollments from Supabase - log removido para optimización
      }

      if (!data || data.length === 0) {
        setEnrollments([])
        if (!silentUpdate) setIsLoading(false)
        return
      }

      // Transformar los datos para que sean más fáciles de usar
      const formattedEnrollments = data
        .map((enrollment) => {
          // Asegurarse de que activities existe
          if (!enrollment.activity) {
            console.warn(`Enrollment ${enrollment.id} has no activities data`)
            return null
          }

          return {
            ...enrollment,
            activity: {
              ...enrollment.activity,
              // Flatten nested media
              media: enrollment.activity.media ? enrollment.activity.media[0] : null,
              // program_info no existe en el nuevo esquema - usar datos de activities directamente
              program_info: null,
              // Información del coach
              coach_name: "Coach", // Se obtendrá desde user_profiles
              coach_avatar_url: null, // Se obtendrá por separado si es necesario
              coach_rating: enrollment.activity.coaches?.rating || null,
              // Preservar categoria directamente de la base de datos
              categoria: enrollment.activity.categoria || getCategoryFromType(enrollment.activity.type || ""),
              // También mantener category para compatibilidad
              category: enrollment.activity.categoria || getCategoryFromType(enrollment.activity.type || ""),
            },
          }
        })
        .filter(Boolean) // Eliminar elementos nulos

      // Log optimizado - solo en desarrollo
      if (process.env.NODE_ENV === 'development') {
        // Formatted enrollments - log removido para optimización
      }

      setEnrollments(formattedEnrollments)

      // Obtener información completa de coaches desde user_profiles
      const coachIds = [...new Set(formattedEnrollments.map(e => e.activity.coach_id))]
      if (coachIds.length > 0) {
        const { data: coachProfiles, error: profileError } = await supabase
          .from("user_profiles")
          .select("id, full_name, avatar_url")
          .in("id", coachIds)

        if (!profileError && coachProfiles) {
          const profileMap = new Map(coachProfiles.map(profile => [profile.id, profile]))

          // Actualizar enrollments con información completa del coach
          const updatedEnrollments = formattedEnrollments.map(enrollment => ({
            ...enrollment,
            activity: {
              ...enrollment.activity,
              coach_name: profileMap.get(enrollment.activity.coach_id)?.full_name || "Coach",
              coach_avatar_url: profileMap.get(enrollment.activity.coach_id)?.avatar_url || null
            }
          }))

          setEnrollments(updatedEnrollments)
        }
      }

      // Calcular progresos reales para cada enrollment
      const progressPromises = formattedEnrollments.map(async (enrollment) => {
        const realProgress = await calculateRealProgress(enrollment)
        return { enrollmentId: enrollment.id, progress: realProgress }
      })

      const progressResults = await Promise.all(progressPromises)
      const progressMap = progressResults.reduce((acc, { enrollmentId, progress }) => {
        acc[enrollmentId] = progress
        return acc
      }, {} as Record<number, number>)

      setEnrollmentProgresses(progressMap)

      // Calcular próximas actividades
      const nextActivityPromises = formattedEnrollments.map(async (enrollment) => {
        const next = await getNextActivity(enrollment)
        return { enrollmentId: enrollment.id, next }
      })

      const nextActivityResults = await Promise.all(nextActivityPromises)
      const nextActivityMap = nextActivityResults.reduce((acc, { enrollmentId, next }) => {
        if (next) acc[enrollmentId] = next
        return acc
      }, {} as Record<number, any>)

      setNextActivities(nextActivityMap)

    } catch (error) {
      console.error("Error al cargar las inscripciones:", error)
      if (!silentUpdate) {
        setError("No se pudieron cargar tus actividades. Por favor, intenta de nuevo más tarde.")
      }
    } finally {
      const totalEnrollmentsTime = Date.now() - enrollmentsStartTime

      if (silentUpdate) {
        setIsSilentlyUpdating(false)
      } else {
        setIsLoading(false)
      }
    }
  }

  // Cargar coaches
  const loadCoaches = async () => {
    const coachesStartTime = Date.now()

    setLoadingCoaches(true)

    // Intentar cargar desde caché primero
    const cachedCoaches = localStorage.getItem(COACHES_CACHE_KEY)

    if (cachedCoaches) {
      try {
        const { data, timestamp } = JSON.parse(cachedCoaches)
        const isExpired = Date.now() - timestamp > CACHE_EXPIRY

        if (!isExpired && data.length > 0) {
          // Usando datos en caché para coaches - log removido
          setCoaches(data)
          setLoadingCoaches(false)
          return
        }
      } catch (e) {
        console.error("Error al leer caché de coaches:", e)
      }
    }

    try {
      // Fetch coaches from the SAME API as search-screen for consistency
      const response = await fetch("/api/search-coaches")
      if (!response.ok) {
        throw new Error(`Error fetching coaches: ${response.statusText}`)
      }
      const coachesData = await response.json()

      if (!coachesData || coachesData.length === 0) {
        setCoaches([])
        setLoadingCoaches(false)
        return
      }

      // Map identically to search-screen.tsx
      const formattedCoaches = coachesData.map((coach: any) => ({
        ...coach,
        name: coach.full_name || coach.name,
        specialization: coach.specialization || coach.specialty,
        experience_years: coach.experienceYears || coach.experience_years,
        location: coach.location || "No especificada",
        bio: coach.bio || coach.description,
        rating: coach.rating || 0,
        total_sessions: coach.totalReviews || coach.total_sessions || 0,
        total_products: coach.activities || coach.total_products || 0,
        certifications: coach.certifications || [],
        user_profile: {
          avatar_url: coach.avatar_url,
          bio: coach.bio || coach.description,
          location: coach.location,
          certifications: coach.certifications
        }
      }))

      setCoaches(formattedCoaches)

      // Guardar en caché
      try {
        localStorage.setItem(
          COACHES_CACHE_KEY,
          JSON.stringify({
            data: formattedCoaches,
            timestamp: Date.now(),
          }),
        )
      } catch (cacheError) {
        console.warn("No se pudo guardar en caché:", cacheError)
      }
    } catch (error) {
      console.error("Error al cargar coaches:", error)
      setCoaches([])
    } finally {
      const totalCoachesTime = Date.now() - coachesStartTime

      setLoadingCoaches(false)
    }
  }

  const loadComplementaryActivities = async () => {
    setLoadingComplementary(true)

    // Obtener el usuario actual
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      console.error("Error al obtener usuario:", userError)
      setLoadingComplementary(false)
      return
    }

    const user = userData.user

    // Primero verificar si hay actividades compradas para invalidar caché si es necesario
    const { data: purchasedActivities, error: purchasedError } = await supabase
      .from("activity_enrollments")
      .select("activity_id")
      .eq("client_id", user.id)

    if (purchasedError) {
      console.error("Error al obtener actividades compradas:", purchasedError)
    }

    const purchasedActivityIds = purchasedActivities?.map(a => a.activity_id) || []

    // Si hay actividades compradas, invalidar caché para asegurar datos actualizados
    if (purchasedActivityIds.length > 0) {
      localStorage.removeItem(COMPLEMENTARY_CACHE_KEY)
    } else {
      // Solo usar caché si no hay actividades compradas
      const cachedActivities = localStorage.getItem(COMPLEMENTARY_CACHE_KEY)

      if (cachedActivities) {
        try {
          const { data, timestamp } = JSON.parse(cachedActivities)
          const isExpired = Date.now() - timestamp > CACHE_EXPIRY

          if (!isExpired && data.length > 0) {
            // Usando datos en caché para actividades complementarias - log removido
            setComplementaryActivities(data)
            setLoadingComplementary(false)
            return
          }
        } catch (e) {
          console.error("Error al leer caché de actividades complementarias:", e)
        }
      }
    }

    try {

      // Construir la consulta excluyendo actividades ya compradas
      let query = supabase
        .from("activities")
        .select(
          `
         id,
         title,
         description,
         type,
         difficulty,
         price,
         coach_id,
         media:activity_media!activity_media_activity_id_fkey (image_url, video_url, vimeo_id),
         program_info:activity_program_info!activity_program_info_activity_id_fkey (program_duration, duration, rich_description, calories, interactive_pauses),
         consultation_info:activity_consultation_info!activity_consultation_info_activity_id_fkey (includes_videocall, includes_message),
         tags:activity_tags!activity_tags_activity_id_fkey(tag_type, tag_value)
       `,
        )
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(10)

      // Excluir actividades ya compradas si las hay
      if (purchasedActivityIds.length > 0) {
        query = query.not("id", "in", `(${purchasedActivityIds.join(",")})`)
      }

      const { data: activitiesData, error: activitiesError } = await query


      if (activitiesError) {
        console.error("Error al obtener actividades:", activitiesError)
        setComplementaryActivities([])
        setLoadingComplementary(false)
        return
      }

      if (!activitiesData || activitiesData.length === 0) {
        setComplementaryActivities([])
        setLoadingComplementary(false)
        return
      }

      // Fetch coach rating stats (from coach_stats_view)
      const coachIds = [...new Set(activitiesData.map((a) => a.coach_id).filter(Boolean))] as string[]
      const coachRatingsMap = new Map<string, number>()
      const coachTotalReviewsMap = new Map<string, number>()
      if (coachIds.length > 0) {
        const { data: coachStatsData, error: coachStatsError } = await supabase
          .from("coach_stats_view")
          .select("coach_id, avg_rating, total_reviews")
          .in("coach_id", coachIds)
        if (coachStatsError) {
          console.error("Error al obtener stats de coaches:", coachStatsError)
        } else {
          coachStatsData?.forEach((s) => {
            coachRatingsMap.set(s.coach_id, s.avg_rating || 0)
            coachTotalReviewsMap.set(s.coach_id, s.total_reviews || 0)
          })
        }
      }

      // Procesar las actividades y obtener información del coach por separado
      const activitiesWithCoaches = await Promise.all(
        activitiesData.map(async (activity) => {
          try {
            let coach = undefined

            // Si hay coach_id, usar datos básicos del coach
            if (activity.coach_id) {
              coach = {
                id: activity.coach_id,
                full_name: activity.coach_name || "Coach",
                avatar_url: activity.coach_avatar_url || null,
                rating: coachRatingsMap.get(activity.coach_id) || null,
                total_reviews: coachTotalReviewsMap.get(activity.coach_id) || null,
              }
            }

            return {
              id: activity.id,
              title: activity.title || "Sin título",
              description: activity.description || "",
              type: activity.type || "other",
              price: activity.price || 0,
              coach_id: activity.coach_id,
              is_public: true,
              created_at: (activity as any).created_at,
              updated_at: (activity as any).updated_at,
              difficulty: activity.difficulty,
              media: null,
              program_info: null,
              consultation_info: null,
              coach_name: "Coach",
              coach_avatar_url: null,
              coach_rating: null,
              total_coach_reviews: null,
            } as any
          } catch (error) {
            console.error(`Error procesando actividad ${activity.id}:`, error)
            return {
              id: activity.id,
              title: activity.title || "Sin título",
              description: activity.description || "",
              type: activity.type || "other",
              price: activity.price || 0,
              coach_id: activity.coach_id,
              is_public: true,
              created_at: (activity as any).created_at,
              updated_at: (activity as any).updated_at,
              difficulty: activity.difficulty,
              media: null,
              program_info: null,
              consultation_info: null,
              coach_name: "Coach",
              coach_avatar_url: null,
              coach_rating: null,
              total_coach_reviews: null,
            } as any
          }
        }),
      )

      setComplementaryActivities(activitiesWithCoaches)

      // Guardar en caché
      try {
        localStorage.setItem(
          COMPLEMENTARY_CACHE_KEY,
          JSON.stringify({
            data: activitiesWithCoaches,
            timestamp: Date.now(),
          }),
        )
      } catch (cacheError) {
        console.warn("No se pudo guardar en caché:", cacheError)
      }
    } catch (error) {
      console.error("Error al cargar actividades complementarias:", error)
      setComplementaryActivities([])
    } finally {
      setLoadingComplementary(false)
    }
  }

  const openPurchaseModal = (activity: Activity) => {
    // console.log("Abriendo modal de compra para:", activity)
    setSelectedPurchaseActivity(activity)
    setPurchaseModalOpen(true)
  }

  const handlePurchaseComplete = (enrollment: any) => {
    // console.log("Compra completada:", enrollment)

    // Refrescar las inscripciones para mostrar la nueva compra
    fetchUserEnrollments()

    // Cerrar el modal
    setPurchaseModalOpen(false)
    setSelectedPurchaseActivity(null)

    // Mostrar toast de éxito
    toast({
      title: "¡Compra exitosa!",
      description: `Has adquirido "${selectedPurchaseActivity?.title}" correctamente.`,
    })
  }

  // Funciones para manejar el modal de encuesta
  const handleOpenSurveyModal = (activity: Activity) => {
    setSelectedActivityForSurvey(activity)
    setShowSurveyModal(true)
  }

  const handleCloseSurveyModal = () => {
    setShowSurveyModal(false)
    setSelectedActivityForSurvey(null)
  }

  // Función para determinar la categoría basada en el tipo de actividad
  const getCategoryFromType = (type: string): string => {
    const fitnessTypes = ["program", "workout", "training", "exercise", "gym"]
    const nutritionTypes = ["nutrition", "diet", "meal", "food", "recipe"]

    const lowerType = type?.toLowerCase() || ""

    if (fitnessTypes.some((t) => lowerType.includes(t))) {
      return "fitness"
    } else if (nutritionTypes.some((t) => lowerType.includes(t))) {
      return "nutrition"
    }

    return "other"
  }

  // Filtrar inscripciones por categoría
  const filteredEnrollments =
    activeCategory === "all" ? enrollments : enrollments.filter((e) => e.activity.category === activeCategory)

  // Function to render type icon
  const renderTypeIcon = (type: string) => {
    const lowerType = type?.toLowerCase() || ""

    if (lowerType.includes("nutrition") || lowerType.includes("meal") || lowerType.includes("diet")) {
      return <ChefHat className="h-5 w-5 text-white" />
    } else if (lowerType.includes("program") || lowerType.includes("workout") || lowerType.includes("training")) {
      return <Dumbbell className="h-5 w-5 text-white" />
    } else if (lowerType.includes("course") || lowerType.includes("class")) {
      return <BookOpen className="h-5 w-5 text-white" />
    } else if (lowerType.includes("workshop")) {
      return <Briefcase className="h-5 w-5 text-white" />
    } else if (lowerType.includes("video")) {
      return <Video className="h-5 w-5 text-white" />
    } else {
      return <Zap className="h-5 w-5 text-white" />
    }
  }

  const openNoteDialog = (videoId: string) => {
    setSelectedVideoId(videoId)
    setCurrentNote(videoNotes[videoId] || "")
    setNoteDialogOpen(true)
  }

  const saveNote = () => {
    if (selectedVideoId) {
      setVideoNotes({
        ...videoNotes,
        [selectedVideoId]: currentNote,
      })
    }
    setNoteDialogOpen(false)
  }

  const openScheduleDialog = (itemId: string, itemType: "video" | "activity") => {
    setScheduleType(itemType)
    setScheduleItemId(itemId)

    // Find the item
    let item
    if (itemType === "activity") {
      const enrollment = enrollments.find((e) => e.id.toString() === itemId)
      item = enrollment ? enrollment.activity : null
    } else {
      // Handle video items if needed
    }

    if (item) {
      setScheduleTitle(item.title)

      // Set default date to tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setScheduleDate(tomorrow.toISOString().split("T")[0])

      // Set default time to 18:00 (6 PM)
      setScheduleTime("18:00")

      // Set duration
      setScheduleDuration("60")

      setScheduleDialogOpen(true)
    }
  }

  // Función corregida para manejar correctamente las zonas horarias
  const saveSchedule = async () => {
    setIsScheduling(true)
    try {
      // Find the item
      let item
      if (scheduleType === "activity") {
        const enrollment = enrollments.find((e) => e.id.toString() === scheduleItemId)
        item = enrollment ? enrollment.activity : null
      }

      if (!item) {
        toast({
          title: "Error",
          description: "No se pudo encontrar la actividad seleccionada",
          variant: "destructive",
        })
        return
      }

      // Obtener el usuario actual
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error("No se pudo obtener el usuario actual")
      }

      // CORRECCIÓN: Crear fechas con la zona horaria local correcta
      // Crear la fecha con el formato YYYY-MM-DD
      const [year, month, day] = scheduleDate.split("-").map(Number)

      const [hours, minutes] = scheduleTime.split(":").map(Number)

      // Crear la fecha en la zona horaria local usando UTC para evitar conversiones automáticas
      const startTime = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0))
      // Ajustar por la zona horaria local
      const offsetMinutes = startTime.getTimezoneOffset()
      startTime.setMinutes(startTime.getMinutes() - offsetMinutes)

      // Calcular la fecha de fin sumando la duración
      const endTime = new Date(startTime.getTime() + Number.parseInt(scheduleDuration) * 60 * 1000)

      // console.log("Fecha seleccionada:", scheduleDate)
      // console.log("Hora seleccionada:", scheduleTime)
      // console.log("Fecha de inicio (local):", startTime.toString())
      // console.log("Fecha de inicio (ISO):", startTime.toISOString())
      // console.log("Fecha de fin (ISO):", endTime.toISOString())

      // Crear el evento en la base de datos
      const response = await fetch("/api/calendar-events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coach_id: item.coach_id,
          client_id: user.id,
          title: scheduleTitle,
          description: item.description,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          event_type: item.type,
          status: "scheduled",
          activity_id: item.id,
          // Añadir información de zona horaria para referencia
          timezone_offset: startTime.getTimezoneOffset(),
          timezone_name: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al guardar el evento en el calendario")
      }

      const eventData = await response.json()

      // Guardar también en localStorage para mantener la compatibilidad
      const newScheduledItem = {
        id: `${scheduleType}-${scheduleItemId}`,
        itemId: scheduleItemId,
        itemType: scheduleType,
        title: scheduleTitle,
        date: scheduleDate,
        time: scheduleTime,
        duration: scheduleDuration,
        coachName: item.coach_name || "Coach",
        coachAvatar: item.coach_avatar_url || "/placeholder.svg?height=40&width=40",
        type: item.type,
        scheduled: true,
        calendarEventId: eventData.id, // Guardar el ID del evento del calendario
      }

      const updatedItems = {
        ...scheduledItems,
        [`${scheduleType}-${scheduleItemId}`]: newScheduledItem,
      }

      setScheduledItems(updatedItems)

      // Save to localStorage for persistence between screens
      localStorage.setItem("scheduledItems", JSON.stringify(updatedItems))

      toast({
        title: "Actividad programada",
        description: "La actividad ha sido añadida a tu calendario",
      })

      setScheduleDialogOpen(false)
    } catch (error) {
      console.error("Error al programar la actividad:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al programar la actividad",
        variant: "destructive",
      })
    } finally {
      setIsScheduling(false)
    }
  }

  const isItemScheduled = (itemId: string, itemType: "video" | "activity") => {
    return scheduledItems[`${itemType}-${itemId}`] !== undefined
  }

  // eliminado: hasVideo

  // This function is only used for recommended activities, not purchased ones
  // Eliminado: openVideoDialog / getVimeoId

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: es })
    } catch (error) {
      return "Fecha desconocida"
    }
  }

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case "credit_card":
        return "Tarjeta de crédito"
      case "debit_card":
        return "Tarjeta de débito"
      case "cash":
        return "Efectivo"
      case "transfer":
        return "Transferencia"
      default:
        return method
    }
  }

  // Añade este useEffect después de los otros useEffect
  useEffect(() => {
    if (activeTab === "purchased" && !isLoading && enrollments.length === 0) {
      fetchUserEnrollments()
    }
  }, [activeTab, activeCategory])

  // Función para refrescar todos los datos
  const refreshAllData = async () => {
    setRefreshing(true)
    try {
      await Promise.all([fetchUserEnrollments(), loadCoaches()])
      toast({
        title: "Datos actualizados",
        description: "Se han actualizado todos los datos correctamente",
      })
    } catch (error) {
      console.error("Error al actualizar datos:", error)
      toast({
        title: "Error",
        description: "No se pudieron actualizar algunos datos",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  // Función para obtener la URL del avatar de un coach
  const getCoachAvatarUrl = (coach: Coach | undefined) => {
    if (!coach) return "/motivational-coach.png"
    return coach.user_profile?.avatar_url || "/motivational-coach.png"
  }

  // Función para filtrar actividades por término de búsqueda
  const filterActivitiesBySearch = (activities: Enrollment[]) => {
    if (!searchTerm.trim()) return activities

    return activities.filter(
      (enrollment) =>
        enrollment.activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enrollment.activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enrollment.activity.type?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }


  // Función para calcular el status real del enrollment
  const calculateEnrollmentStatus = (enrollment: Enrollment): 'expirada' | 'finalizada' | 'activa' | 'pendiente' => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const hasStarted = enrollment.start_date !== null
    const dbStatus = enrollment.status?.toLowerCase() || ''

    // 1. EXPIRADA: status explícito en BD o expiration_date pasó (solo si NO empezó)
    if (dbStatus === 'expirada') {
      return 'expirada'
    }
    if (enrollment.expiration_date && !hasStarted) {
      const expirationDate = new Date(enrollment.expiration_date)
      expirationDate.setHours(0, 0, 0, 0)
      if (expirationDate < today) {
        return 'expirada'
      }
    }

    // 2. FINALIZADA: status explícito en BD o program_end_date pasó
    if (dbStatus === 'finalizada' || dbStatus === 'completed') {
      return 'finalizada'
    }
    if (enrollment.program_end_date && hasStarted) {
      const programEndDate = new Date(enrollment.program_end_date)
      programEndDate.setHours(0, 0, 0, 0)
      if (programEndDate < today) {
        return 'finalizada'
      }
    }

    // 3. ACTIVA: status 'activa' y tiene start_date
    if (dbStatus === 'activa' && hasStarted) {
      return 'activa'
    }

    // 4. PENDIENTE: por defecto
    return 'pendiente'
  }

  // Filtrar por estado de actividad usando status calculado
  const filterEnrollmentsByStatus = (enrollments: Enrollment[]) => {
    return enrollments.filter((enrollment) => {
      const calculatedStatus = calculateEnrollmentStatus(enrollment)

      // Debug log
      /* if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 [FILTER] Enrollment ${enrollment.id}:`, {
          dbStatus: enrollment.status,
          calculatedStatus,
          start_date: enrollment.start_date,
          expiration_date: enrollment.expiration_date,
          program_end_date: enrollment.program_end_date,
          activityStatusTab,
          today: new Date().toISOString().split('T')[0]
        })
      } */

      switch (activityStatusTab) {
        case "en-curso":
          // En curso: status calculado es 'activa'
          const enCurso = calculatedStatus === 'activa'
          // if (process.env.NODE_ENV === 'development') {
          //   console.log(`  → EN CURSO: ${enCurso}`)
          // }
          return enCurso
        case "por-empezar":
          // Por empezar: status calculado es 'pendiente'
          const porEmpezar = calculatedStatus === 'pendiente'
          if (process.env.NODE_ENV === 'development') {
            console.log(`  → POR EMPEZAR: ${porEmpezar}`)
          }
          return porEmpezar
        case "finalizadas":
          // Finalizadas: status calculado es 'expirada' o 'finalizada'
          const finalizadas = calculatedStatus === 'expirada' || calculatedStatus === 'finalizada'
          if (process.env.NODE_ENV === 'development') {
            console.log(`  → FINALIZADAS: ${finalizadas}`)
          }
          return finalizadas
        default:
          return true
      }
    })
  }

  // Aplicar filtros: primero por estado, luego por búsqueda
  const statusFilteredEnrollments = filterEnrollmentsByStatus(filteredEnrollments)
  const searchFilteredEnrollments = filterActivitiesBySearch(statusFilteredEnrollments)

  // Listener para resetear al origen cuando se presiona el tab activo
  useEffect(() => {
    const handleResetToOrigin = (event: CustomEvent) => {
      const { tab } = event.detail
      if (tab === 'activity') {
        // Resetear estado interno: cerrar TodayScreen, volver a lista principal
        setShowTodayScreen(false)
        setSelectedActivityId(null)
        setActivityStatusTab('en-curso')
        setActiveCategory('all')
        setSearchTerm('')

        // Scroll al inicio
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }, 100)
      }
    }

    window.addEventListener('reset-tab-to-origin', handleResetToOrigin as EventListener)
    return () => {
      window.removeEventListener('reset-tab-to-origin', handleResetToOrigin as EventListener)
    }
  }, [])

  // Agregar este useEffect después de los existentes para manejar el retorno desde actividades
  useEffect(() => {
    const checkReturnFromActivity = () => {
      try {
        const returnToActivities = localStorage.getItem("return_to_activities")
        const returnTab = localStorage.getItem("return_to_activity_tab")
        const returnCategory = localStorage.getItem("return_to_activity_category")

        if (returnToActivities === "true") {
          // console.log("Returning from activity, restoring state:", { returnTab, returnCategory })

          // Restaurar el estado anterior
          if (returnTab) {
            setActiveTab(returnTab)
          }
          if (returnCategory) {
            setActiveCategory(returnCategory)
          }

          // Limpiar los flags
          localStorage.setItem("return_to_activities", "false")
          localStorage.removeItem("return_to_activity_tab")
          localStorage.removeItem("return_to_activity_category")

          // Añadir animación de entrada
          const container = document.querySelector("[data-tab='activity-screen']")
          if (container) {
            container.classList.add("animate-fadeIn")
            setTimeout(() => {
              container.classList.remove("animate-fadeIn")
            }, 300)
          }
        }
      } catch (e) {
        console.error("Error checking navigation state:", e)
      }
    }

    // Ejecutar después de un pequeño delay para asegurar que el componente esté montado
    const timer = setTimeout(checkReturnFromActivity, 100)
    return () => clearTimeout(timer)
  }, []) // Solo ejecutar una vez al montar el componente

  const processDescription = (description: string | null | undefined) => {
    if (!description) return "Sin descripción disponible"

    let processedHtml = description

    // Replace [CONSULTAS_INCLUIDAS]/g,
    processedHtml = processedHtml.replace(
      /\[CONSULTAS_INCLUIDAS\]/g,
      `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FF7939]/20 text-[#FF7939] border border-[#FF7939]">Consultas Incluidas</span>`,
    )

    // Replace [DURATION] with a styled span
    processedHtml = processedHtml.replace(
      /\[DURATION\]/g,
      `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FF7939]/20 text-[#FF7939] border border-[#FF7939]">Duración Variable</span>`,
    )

    return processedHtml
  }

  // Eliminado: openActivityDetails (rutinas recomendadas)

  const renderStars = (rating: number | null | undefined) => {
    if (rating === null || rating === undefined) return null
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    return (
      <div className="flex items-center">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} className="h-4 w-4 text-[#FF7939] fill-[#FF7939]" />
        ))}
        {hasHalfStar && <Star key="half" className="h-4 w-4 text-[#FF7939] fill-[#FF7939]" />}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} className="h-4 w-4 text-gray-400" />
        ))}
      </div>
    )
  }

  const getCategoryBadge = (type: string) => {
    const lowerType = type?.toLowerCase() || ""
    if (lowerType.includes("fitness") || lowerType.includes("workout") || lowerType.includes("training")) {
      return <Badge className="bg-[#FF7939] text-white border-none text-xs font-semibold">Fitness</Badge>
    }
    if (lowerType.includes("nutrition") || lowerType.includes("meal") || lowerType.includes("diet")) {
      return <Badge className="bg-[#E66829] text-white border-none text-xs font-semibold">Nutrición</Badge>
    }
    return <Badge className="bg-gray-500/80 text-white border-none text-xs font-semibold">{type}</Badge>
  }

  // Si se está mostrando el TodayScreen, renderizarlo en pantalla completa
  if (showTodayScreen && selectedActivityId) {
    const activityType = getSelectedActivityType()
    const selectedEnrollment = enrollments.find(e => e.activity_id.toString() === selectedActivityId)
    const isWorkshop = activityType?.toLowerCase().includes('workshop') || activityType?.toLowerCase().includes('taller')
    const isDocument = activityType?.toLowerCase().includes('document') || activityType?.toLowerCase().includes('documento')

    if (isWorkshop || isDocument) {
      return (
        <div className="fixed inset-0 z-50" style={{ backgroundColor: '#0F1012' }}>
          <div className="h-full overflow-y-auto">
            {/* Header de Omnia */}
            <div
              className="fixed top-0 left-0 right-0 z-50 bg-black rounded-b-[32px] px-5 py-3 flex justify-between items-center"
              style={{ zIndex: 1000 }}
            >
              {/* Settings Icon */}
              <div className="flex items-center cursor-pointer" onClick={() => router.push('/coach')}>
                <SettingsIcon />
              </div>

              {/* OMNIA Logo */}
              <div className="absolute left-1/2 transform -translate-x-1/2 cursor-pointer" onClick={handleBackToActivities}>
                <OmniaLogoText size="text-3xl" />
              </div>

              {/* Messages Icon */}
              <div className="flex items-center cursor-pointer" onClick={() => router.push('/?tab=community')}>
                <MessagesIcon />
              </div>
            </div>
            <WorkshopClientView
              activityId={parseInt(selectedActivityId)}
              activityTitle={selectedEnrollment?.activity?.title || (isDocument ? "Documento" : "Taller")}
              activityDescription={selectedEnrollment?.activity?.description}
              activityImageUrl={selectedEnrollment?.activity?.media?.image_url || selectedEnrollment?.activity?.image_url}
              isDocument={isDocument}
            />
          </div>
        </div>
      )
    }

    return (
      <div className="fixed inset-0 z-50" style={{ backgroundColor: '#0F1012' }}>
        <TodayScreen activityId={selectedActivityId} onBack={handleBackToActivities} />
      </div>
    )
  }

  return (
    <div
      className="flex flex-col h-full bg-[#121212] text-white overflow-y-auto pb-20"
      data-tab="activity-screen"
      data-active-tab={activeTab}
      data-active-category={activeCategory}
    >

      {isSilentlyUpdating && (
        <div className="px-4 py-1 bg-[#FF7939]/10 text-[#FF7939] text-xs flex items-center justify-center">
          <Loader2 className="h-3 w-3 animate-spin mr-2" />
          Actualizando datos...
        </div>
      )}

      {/* Contenido principal */}
      <div className="px-4 space-y-6">
        {/* Sección "Mis coaches" - Movida arriba */}
        {(() => {
          const purchasedCoachIds = new Set(
            enrollments.map((e) => e.activity.coach_id).filter(Boolean) as string[]
          )
          const myCoaches = coaches.filter((c) => purchasedCoachIds.has(c.id))
          return (
            <div className="mb-2">
              <div className="flex justify-between items-center mb-3 pt-2">
                <h2 className="text-lg font-bold text-white">Mis coaches</h2>
              </div>

              {loadingCoaches ? (
                <CoachSkeletonLoader />
              ) : myCoaches.length === 0 ? (
                <div className="text-center py-4 bg-[#1E1E1E] rounded-xl">
                  <p className="text-gray-400 text-sm">Aún no tienes coaches asociados a compras</p>
                </div>
              ) : (
                <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
                  {myCoaches.map((coach) => {
                    // Calcular estados del coach usando status calculado
                    const coachEnrollments = enrollments.filter(e => e.activity.coach_id === coach.id)
                    const enCurso = coachEnrollments.filter(e => {
                      return calculateEnrollmentStatus(e) === 'activa'
                    }).length
                    const porEmpezar = coachEnrollments.filter(e => {
                      return calculateEnrollmentStatus(e) === 'pendiente'
                    }).length

                    // Adaptar coach para CoachProfileCard
                    const coachForCard = {
                      ...coach,
                      name: coach.full_name || 'Coach',
                      avatar_url: coach.user_profile?.avatar_url, // Fix: Map avatar from user_profile
                      specialization: coach.specialization || 'Fitness',
                      total_products: 0,
                      certifications: [],
                      total_sessions: coach.total_reviews || 0, // Usar reviews como proxy si no hay sales
                      available_meets: meetCredits[coach.id] || 0 // Use fetched meet credits
                    }


                    return (
                      <div key={coach.id} className="flex-shrink-0">
                        <CoachProfileCard
                          coach={coachForCard}
                          size="small"
                          variant="meet"
                          onClick={() => {
                            console.log("🖱️ [ActivityScreen] Clicked coach card:", coach.id, {
                              name: coachForCard.name,
                              avatar: coachForCard.avatar_url,
                              location: (coachForCard as any).location
                            });
                            handleCoachClickFromActivity(coach.id)
                          }}
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })()}

        {/* Tabs de estado de actividades */}
        <div className="flex gap-2 border-b border-gray-800 pb-2 -mt-2">
          <button
            onClick={() => setActivityStatusTab("en-curso")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${activityStatusTab === "en-curso"
              ? "text-[#FF7939] border-b-2 border-[#FF7939]"
              : "text-gray-400 hover:text-gray-300"
              }`}
          >
            En curso
          </button>
          <button
            onClick={() => setActivityStatusTab("por-empezar")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${activityStatusTab === "por-empezar"
              ? "text-[#FF7939] border-b-2 border-[#FF7939]"
              : "text-gray-400 hover:text-gray-300"
              }`}
          >
            Por empezar
          </button>
          <button
            onClick={() => setActivityStatusTab("finalizadas")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${activityStatusTab === "finalizadas"
              ? "text-[#FF7939] border-b-2 border-[#FF7939]"
              : "text-gray-400 hover:text-gray-300"
              }`}
          >
            Finalizadas
          </button>
        </div>

        {/* Mis actividades compradas */}
        <div>

          {isLoading ? (
            <ActivitySkeletonLoader />
          ) : error ? (
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1E1E1E] mb-4">
                <X className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-lg font-medium mb-2">Error</h3>
              <p className="text-gray-400 mb-4">{error}</p>
              <Button className="bg-[#FF7939] hover:bg-[#E66829]" onClick={fetchUserEnrollments}>
                Intentar de nuevo
              </Button>
            </div>
          ) : searchFilteredEnrollments.length === 0 ? (
            <div className="text-center py-10">
              {searchTerm ? (
                <div className="bg-[#1E1E1E] rounded-xl py-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2A2A2A] mb-4">
                    <Play className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No se encontraron resultados</h3>
                  <p className="text-gray-400 mb-4">Intenta con otros términos de búsqueda</p>
                  <Button className="bg-[#FF7939] hover:bg-[#E66829]" onClick={() => setSearchTerm("")}>
                    Limpiar búsqueda
                  </Button>
                </div>
              ) : activityStatusTab === "en-curso" ? (
                // Solo en "En curso" mostrar botón Explorar
                <div className="bg-[#1E1E1E] rounded-xl py-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2A2A2A] mb-4">
                    <Play className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-white">No tienes actividades en curso</h3>
                  <p className="text-gray-400 mb-4">Explora productos para comenzar tu entrenamiento</p>
                  <Button
                    className="bg-[#FF7939] hover:bg-[#E66829]"
                    onClick={() => {
                      // Navegar a la tab de búsqueda
                      window.dispatchEvent(new CustomEvent('navigateToTab', { detail: { tab: 'search' } }))
                    }}
                  >
                    Explorar Productos
                  </Button>
                </div>
              ) : activityStatusTab === "por-empezar" ? (
                // En "Por empezar" solo mensaje simple
                <div className="py-6">
                  <p className="text-gray-400 text-sm">No tienes actividades por empezar</p>
                </div>
              ) : activityStatusTab === "finalizadas" ? (
                // En "Finalizadas" solo mensaje simple
                <div className="py-6">
                  <p className="text-gray-400 text-sm">No tienes actividades finalizadas</p>
                </div>
              ) : (
                <div className="bg-[#1E1E1E] rounded-xl py-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2A2A2A] mb-4">
                    <Play className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-white">
                    {getCategoryFromType(activeCategory) === "all"
                      ? "No tienes productos comprados"
                      : `No tienes productos de ${getCategoryFromType(activeCategory) === "fitness" ? "fitness" : "nutrición"}`}
                  </h3>
                  <p className="text-gray-400 mb-4">Compra contenido de coaches para acceder aquí</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-6 snap-x scrollbar-hide -mx-4 px-4">
              {searchFilteredEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="snap-center">
                  <PurchasedActivityCard
                    enrollment={enrollment}
                    nextActivity={nextActivities[enrollment.id] || null}
                    realProgress={enrollmentProgresses[enrollment.id]}
                    onActivityClick={handleActivityClick}
                    onStartActivity={handleStartActivity}
                    size="small"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Botón para crear nuevo producto (solo para coaches) */}
        </div>


      </div>

      {/* Notes Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="bg-[#1E1E1E] text-white border-gray-800 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <StickyNote className="h-5 w-5 mr-2 text-[#FF7939]" />
                <span>Notas del Video</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full"
                onClick={() => setNoteDialogOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <p className="text-sm text-gray-400 mb-2">Añade tus notas personales sobre este video:</p>
            <Textarea
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              placeholder="Escribe tus notas aquí..."
              className="min-h-[120px] bg-[#2A2A2A] border-gray-700 focus:border-[#FF7939] text-white"
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setNoteDialogOpen(false)} className="text-gray-400">
              Cancelar
            </Button>
            <Button onClick={saveNote} className="bg-[#FF7939] hover:bg-[#E66829]">
              Guardar Notas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="bg-[#1E1E1E] text-white border-gray-800 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <CalendarPlus className="h-5 w-5 mr-2 text-[#FF7939]" />
                <span>Programar {scheduleType === "video" ? "Video" : "Actividad"}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full"
                onClick={() => setScheduleDialogOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-title">Título</Label>
              <Input
                id="schedule-title"
                value={scheduleTitle}
                onChange={(e) => setScheduleTitle(e.target.value)}
                className="bg-[#2A2A2A] border-gray-700 focus:border-[#FF7939] text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule-date">Fecha</Label>
              <Input
                id="schedule-date"
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="bg-[#2A2A2A] border-gray-700 focus:border-[#FF7939] text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule-time">Hora</Label>
              <Input
                id="schedule-time"
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="bg-[#2A2A2A] border-gray-700 focus:border-[#FF7939] text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule-duration">Duración (minutos)</Label>
              <Select value={scheduleDuration} onValueChange={setScheduleDuration}>
                <SelectTrigger className="bg-[#2A2A2A] border-gray-700 focus:border-[#FF7939] text-white">
                  <SelectValue placeholder="Seleccionar duración" />
                </SelectTrigger>
                <SelectContent className="bg-[#2A2A2A] border-gray-700 text-white">
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="45">45 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="90">1.5 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule-reminder">Recordatorio</Label>
              <Select defaultValue="15">
                <SelectTrigger className="bg-[#2A2A2A] border-gray-700 focus:border-[#FF7939] text-white">
                  <SelectValue placeholder="Seleccionar tiempo de recordatorio" />
                </SelectTrigger>
                <SelectContent className="bg-[#2A2A2A] border-gray-700 text-white">
                  <SelectItem value="0">Al momento del evento</SelectItem>
                  <SelectItem value="5">5 minutos antes</SelectItem>
                  <SelectItem value="15">15 minutos antes</SelectItem>
                  <SelectItem value="30">30 minutos antes</SelectItem>
                  <SelectItem value="60">1 hora antes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setScheduleDialogOpen(false)} className="text-gray-400">
              Cancelar
            </Button>
            <Button onClick={saveSchedule} className="bg-[#FF7939] hover:bg-[#E66829]" disabled={isScheduling}>
              {isScheduling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Añadir al Calendario"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Dialog */}
      {/* eliminado: dialog de video */}

      {/* Purchase Activity Modal */}
      <PurchaseActivityModal
        isOpen={purchaseModalOpen}
        onClose={() => setPurchaseModalOpen(false)}
        activity={selectedPurchaseActivity}
        onPurchaseComplete={handlePurchaseComplete}
      />

      {/* Modal de Encuesta de Actividad */}
      {showSurveyModal && selectedActivityForSurvey && (
        <ActivitySurveyModal
          isOpen={showSurveyModal}
          onClose={handleCloseSurveyModal}
          activityId={selectedActivityForSurvey.id.toString()}
          activityTitle={selectedActivityForSurvey.title}
          userRating={null}
          hasUserSubmittedSurvey={hasUserSubmittedSurvey}
        />
      )}

      {/* Coach Profile Modal - Reusing the same component as SearchScreen */}
      {selectedCoachForProfile && (
        <CoachProfileModal
          coach={{
            id: selectedCoachForProfile.id,
            name: selectedCoachForProfile.full_name || 'Coach',
            // Ensure avatar_url is picked up from user_profile OR root if available (though interface says user_profile)
            avatar_url: selectedCoachForProfile.user_profile?.avatar_url,
            bio: selectedCoachForProfile.user_profile?.bio,
            location: (selectedCoachForProfile.user_profile as any)?.location,
            specialization: selectedCoachForProfile.specialization,
            rating: selectedCoachForProfile.rating,
            total_sales: (selectedCoachForProfile as any).total_sales || selectedCoachForProfile.total_reviews, // Map sales if available
            certifications: (selectedCoachForProfile.user_profile as any)?.certifications
          }}
          isOpen={isCoachProfileModalOpen}
          onClose={() => {
            setIsCoachProfileModalOpen(false)
            setSelectedCoachForProfile(null)
          }}
        // We do not pass preloadedActivities here. 
        // This allows CoachProfileModal to trigger its internal loadCoachProducts() 
        // which fetches fresh data from /api/activities/search, ensuring consistency.
        // which fetches fresh data from /api/activities/search, ensuring consistency.
        // onActivityClick={handleActivityClick} // REMOVED: Should handle its own clicks to show Product Details
        />
      )}


      {/* Modal de Filtros */}
      <Dialog open={showFiltersModal} onOpenChange={setShowFiltersModal}>
        <DialogContent className="bg-[#1E1E1E] border-gray-700 text-white max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Filtros</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Categorías */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">Categorías</h3>
              <div className="space-y-2">
                {[
                  { id: "all", label: "Todos", icon: Zap },
                  { id: "fitness", label: "Fitness", icon: Dumbbell },
                  { id: "nutrition", label: "Nutrition", icon: ChefHat }
                ].map((category) => (
                  <button
                    key={category.id}
                    onClick={() => toggleCategory(category.id)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all ${selectedCategories.includes(category.id)
                      ? "bg-[#FF7939] text-white"
                      : "bg-[#2A2A2A] text-gray-300 hover:bg-[#3A3A3A]"
                      }`}
                  >
                    <category.icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{category.label}</span>
                    {selectedCategories.includes(category.id) && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tipos de contenido */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">Tipo de contenido</h3>
              <div className="space-y-2">
                {[
                  { id: "purchased", label: "Comprados", icon: Play },
                  { id: "subscriptions", label: "Suscripciones", icon: Users },
                  { id: "videos", label: "Videos", icon: Video }
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => toggleType(type.id)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all ${selectedTypes.includes(type.id)
                      ? "bg-[#FF7939] text-white"
                      : "bg-[#2A2A2A] text-gray-300 hover:bg-[#3A3A3A]"
                      }`}
                  >
                    <type.icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{type.label}</span>
                    {selectedTypes.includes(type.id) && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedCategories(["all"])
                setSelectedTypes(["purchased"])
              }}
              className="flex-1 bg-[#2A2A2A] border-gray-600 text-gray-300 hover:bg-[#3A3A3A]"
            >
              Limpiar
            </Button>
            <Button
              onClick={() => setShowFiltersModal(false)}
              className="flex-1 bg-[#FF7939] hover:bg-[#FF5B39] text-white"
            >
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Coach Profile Modal - Funcionalidad deshabilitada temporalmente */}
      {/* {selectedCoachForProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <p>Perfil del coach: {selectedCoachForProfile.name}</p>
          </div>
        </div>
      )} */}
    </div>
  )
}

export default ActivityScreen