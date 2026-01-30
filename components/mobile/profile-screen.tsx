"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  User,
  Edit3,
  Activity,
  Calendar,
  Trophy,
  Target,
  AlertTriangle,
  FileText,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  X,
  Flame,
  MapPin,
  Weight,
  Ruler,
  BookOpen,
  Users,
  FileText as DocumentIcon,
  MessageCircle,
  ShoppingCart,
  Clock,
  DollarSign,
  Printer,
  Loader2,
  ArrowUp,
  ArrowDown,
  Edit2,
  Phone
} from "lucide-react"
import { useProfileManagement } from '@/hooks/client/use-profile-management'
import { useClientMetrics } from '@/hooks/client/use-client-metrics'
import { useCoachProfile } from '@/hooks/coach/use-coach-profile'
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { ProfileEditModal } from "@/components/mobile/profile-edit-modal"
import { ObjectivesModal } from "@/components/mobile/objectives-modal"
import { BiometricsModal } from "@/components/mobile/biometrics-modal"
import { QuickExerciseAdd } from "@/components/mobile/quick-exercise-add"
import { ExerciseProgressList } from "@/components/mobile/exercise-progress-list"
import { DailyActivityRings } from "@/components/mobile/daily-activity-rings"
import ActivityCalendar from "@/components/mobile/activity-calendar"
import InjuriesModal from "@/components/mobile/injuries-modal"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import { PlanManagement } from "@/components/coach/plan-management"
import { MercadoPagoConnection } from "@/components/coach/mercadopago-connection"
import { GoogleCalendarConnection } from "@/components/coach/google-calendar-connection"
import { CoachStats } from "@/components/coach/coach-stats"
import { CoachPersonalInfoSection } from "@/components/shared/coach/coach-personal-info-section"

interface ActivityRing {
  type: string
  current: number
  target: number
  color: string
  icon: React.ReactNode
}

interface WeeklyProgress {
  date: string
  sessions: number
  minutes: number
  kcal: number
}

/**
 * Componente para mostrar lista de compras recientes
 */
function RecentPurchasesList({ userId }: { userId?: string }) {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchPurchases = async () => {
      try {
        const response = await fetch('/api/client/recent-purchases?limit=10');
        const data = await response.json();

        if (data.success) {
          setPurchases(data.purchases || []);
        }
      } catch (error) {
        console.error('Error obteniendo compras:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-400 text-sm">No hay compras recientes</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'bg-green-400';
      case 'pending':
        return 'bg-yellow-400';
      case 'failed':
      case 'rejected':
      case 'cancelled':
        return 'bg-red-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'Completado';
      case 'pending':
        return 'Pendiente';
      case 'failed':
      case 'rejected':
        return 'Rechazado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-2">
      {purchases.map((purchase) => (
        <div
          key={purchase.id}
          className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">
              {purchase.activity?.title || purchase.concept || 'Actividad'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {purchase.paymentDate ? formatDate(purchase.paymentDate) : 'Sin fecha'}
            </p>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <p className="text-sm font-medium text-white">
              ${purchase.amount?.toLocaleString('es-AR') || '0'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

const calculateAge = (birthDate: string | undefined) => {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export function ProfileScreen() {
  const {
    profile: managedProfile,
    biometrics,
    injuries,
    loadProfile,
    loadBiometrics,
    loadInjuries,
    deleteBiometric,
    createBiometric,
    createInjury,
    updateInjury,
    deleteInjury
  } = useProfileManagement()

  // ... (rest of imports and hooks remain the same until the JSX) ...

  const { user } = useAuth()
  const { toast } = useToast()
  const [activityFilter, setActivityFilter] = useState<'fitness' | 'nutricion'>('fitness')

  useEffect(() => {
    if (managedProfile) {
      console.log("🔍 [ProfileScreen] managedProfile:", managedProfile)
      console.log("🔍 [ProfileScreen] Goals:", managedProfile.fitness_goals)
      console.log("🔍 [ProfileScreen] Sports:", managedProfile.sports)
      console.log("🔍 [ProfileScreen] Age:", managedProfile.age, "BirthDate:", managedProfile.birth_date)
    }
  }, [managedProfile])

  const [selectedBiometric, setSelectedBiometric] = useState<any>(null)
  const [bioMode, setBioMode] = useState<'register' | 'edit'>('register')
  const [ringsWeek, setRingsWeek] = useState(new Date())
  const { metrics, weeklyData, loading: metricsLoading } = useClientMetrics(user?.id, activityFilter, ringsWeek)

  const [selectedDay, setSelectedDay] = useState<{
    date: string;
    minutes: number;
    minutesTarget: number;
    kcal: number;
    kcalTarget: number;
    exercises: number;
    exercisesTarget: number;
  } | null>(null)

  const processedBiometrics = useMemo(() => {
    if (!Array.isArray(biometrics)) return []

    // Agrupar por nombre
    const groups: { [key: string]: any[] } = {}
    biometrics.forEach(b => {
      if (!groups[b.name]) groups[b.name] = []
      groups[b.name].push(b)
    })

    // Procesar cada grupo
    return Object.keys(groups).map(name => {
      // Ordenar descendente por fecha (aunque API ya lo hace, mejor asegurar)
      const sorted = groups[name].sort((a, b) =>
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      )

      const current = sorted[0]
      const previous = sorted[1]

      let trend = 'neutral'
      let diff = 0

      if (previous) {
        diff = current.value - previous.value
        if (diff > 0) trend = 'up'
        else if (diff < 0) trend = 'down'
      }

      return {
        ...current,
        trend,
        previousValue: previous?.value,
        diff: Math.abs(diff)
      }
    })
  }, [biometrics])

  useEffect(() => {
    console.log('🧿 [RINGS][PROFILE] Filtro cambiado:', {
      activityFilter,
      userId: user?.id,
      selectedDay: selectedDay?.date || null
    })
  }, [activityFilter, user?.id])



  useEffect(() => {
    console.log('🧿 [RINGS][PROFILE] selectedDay actualizado:', {
      activityFilter,
      selectedDay
    })
  }, [selectedDay, activityFilter])

  // Determinar si es coach basado en el rol del usuario (antes de cargar)
  const isUserCoach = user?.level === 'coach'

  // Solo cargar datos del coach si el usuario tiene rol de coach
  const { profile: coachProfile, salesData, earningsData, recentActivities, loading: coachLoading } = useCoachProfile()

  // Determinar si es un coach: verificar rol del usuario directamente
  // Si tiene rol de coach, mostrar vista de coach (incluso si está cargando)
  const isCoach = isUserCoach

  // Función para descargar factura
  const handleDownloadInvoice = async () => {
    try {
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();

      const url = `/api/coach/export-sales?format=excel&month=${year}-${month}&year=${year}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Error al descargar factura');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `factura_${month}_${year}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error descargando factura:', error);
    }
  }

  // Implementar caché inteligente para datos del perfil
  useEffect(() => {
    if (managedProfile && Object.keys(managedProfile).length > 0) {
      try {
        sessionStorage.setItem("cached_profile_data", JSON.stringify(managedProfile))
        sessionStorage.setItem("profile_cache_timestamp", Date.now().toString())
      } catch (e) {
        console.error("Error al guardar perfil en sessionStorage:", e)
      }
    }
  }, [managedProfile])

  // Cache para métricas
  useEffect(() => {
    if (metrics && weeklyData && weeklyData.length > 0) {
      try {
        const metricsData = { metrics, weeklyData }
        sessionStorage.setItem("cached_metrics_data", JSON.stringify(metricsData))
        sessionStorage.setItem("metrics_cache_timestamp", Date.now().toString())
      } catch (e) {
        console.error("Error al guardar métricas en sessionStorage:", e)
      }
    }
  }, [metrics, weeklyData])

  // Cache para biometría
  useEffect(() => {
    if (biometrics && biometrics.length > 0) {
      try {
        sessionStorage.setItem("cached_biometrics_data", JSON.stringify(biometrics))
        sessionStorage.setItem("biometrics_cache_timestamp", Date.now().toString())
      } catch (e) {
        console.error("Error al guardar biometría en sessionStorage:", e)
      }
    }
  }, [biometrics])

  // Cache para lesiones
  useEffect(() => {
    if (injuries && injuries.length > 0) {
      try {
        sessionStorage.setItem("cached_injuries_data", JSON.stringify(injuries))
        sessionStorage.setItem("injuries_cache_timestamp", Date.now().toString())
      } catch (e) {
        console.error("Error al guardar lesiones en sessionStorage:", e)
      }
    }
  }, [injuries])

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [isObjectivesModalOpen, setIsObjectivesModalOpen] = useState(false)
  const [isBiometricsModalOpen, setIsBiometricsModalOpen] = useState(false)
  const [biometricsModalMode, setBiometricsModalMode] = useState<'edit' | 'register'>('register')
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showInjuriesModal, setShowInjuriesModal] = useState(false)

  // Estados para modal de confirmación de biometría
  const [showBiometricDeleteConfirmation, setShowBiometricDeleteConfirmation] = useState(false)
  const [isEditingObjectives, setIsEditingObjectives] = useState(false)
  const [isSavingObjectives, setIsSavingObjectives] = useState(false)
  const objectivesRef = useRef<any>(null)
  const [biometricToDelete, setBiometricToDelete] = useState<{
    id: string
    name: string
    value: string
    unit: string
  } | null>(null)

  // Anillos de actividad con datos reales - memoizados
  const source = useMemo(() => {
    return selectedDay
      ? {
        calories: { current: selectedDay.kcal, target: selectedDay.kcalTarget, percentage: 0 },
        duration: { current: selectedDay.minutes, target: selectedDay.minutesTarget, percentage: 0 },
        exercises: { current: selectedDay.exercises, target: selectedDay.exercisesTarget, percentage: 0 }
      }
      : metrics
  }, [selectedDay, metrics])

  const activityRings: ActivityRing[] = useMemo(() => [
    {
      type: "Kcal",
      current: source.calories.current,
      target: source.calories.target,
      color: "#FF6A00",
      icon: <Activity className="h-4 w-4" />
    },
    {
      type: "Minutos",
      current: source.duration.current,
      target: source.duration.target,
      color: "#FF8C42",
      icon: <Calendar className="h-4 w-4" />
    },
    {
      type: activityFilter === 'fitness' ? "Ejercicios" : "Platos",
      current: source.exercises.current,
      target: source.exercises.target,
      color: "#FFFFFF",
      icon: <Trophy className="h-4 w-4" />
    }
  ], [source, activityFilter])

  // Datos semanales reales - memoizados
  const weeklyProgress: WeeklyProgress[] = useMemo(() =>
    weeklyData.map(day => ({
      date: day.date,
      sessions: day.sessions,
      minutes: day.minutes,
      kcal: day.kcal
    })), [weeklyData]
  )



  const getLevelChip = useCallback((level: string) => {
    const colors = {
      beginner: "bg-green-500/10 text-green-400",
      intermediate: "bg-yellow-500/10 text-yellow-400",
      advanced: "bg-red-500/10 text-red-400"
    }
    return colors[level as keyof typeof colors] || colors.beginner
  }, [])

  const getAchievementLevel = useCallback((percentage: number) => {
    if (percentage >= 100) return "Platino"
    if (percentage >= 80) return "Oro"
    if (percentage >= 60) return "Plata"
    return "Bronce"
  }, [])

  const getSeverityColor = useCallback((severity: string) => {
    const colors = {
      low: "bg-green-500/10 text-green-400",
      medium: "bg-yellow-500/10 text-yellow-400",
      high: "bg-red-500/10 text-red-400"
    }
    return colors[severity as keyof typeof colors] || colors.low
  }, [])

  const handleEditSection = useCallback((section: string) => {
    if (section === "goals") {
      setIsEditingObjectives(prev => !prev)
    } else if (section === "biometrics") {
      setBiometricsModalMode('register')
      setIsBiometricsModalOpen(true)
    } else if (section === "injuries") {
      setShowInjuriesModal(true)
    } else {
      setEditingSection(section)
      setIsEditModalOpen(true)
    }
  }, [setBiometricsModalMode, setIsBiometricsModalOpen, setShowInjuriesModal, setEditingSection, setIsEditModalOpen, setShowQuickAdd])

  const handleQuickAddExercise = useCallback(async (exercise: { title: string; unit: string; value: string }) => {
    try {
      console.log('Adding exercise:', exercise)
      const response = await fetch('/api/profile/exercise-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_title: exercise.title,
          unit: exercise.unit,
          value: exercise.value
        })
      })

      console.log('Response status:', response.status)
      const responseData = await response.json()
      console.log('Response data:', responseData)

      if (response.ok) {
        setShowQuickAdd(false)
        // Refrescar la lista de ejercicios
        // @ts-ignore
        if (window.refreshExercises) {
          // @ts-ignore
          window.refreshExercises()
        }
      } else {
        console.error('Error response:', responseData)
      }
    } catch (error) {
      console.error('Error adding exercise:', error)
    }
  }, [setShowQuickAdd])

  const handleSaveInjuries = useCallback(async (updatedInjuries: any[]) => {
    try {
      // 1. Identificar eliminadas (están en current, no en updated)
      const currentIds = injuries.map(i => i.id)
      const updatedIds = updatedInjuries.filter(i => !i.id.toString().startsWith('temp_')).map(i => i.id)
      const toDelete = currentIds.filter(id => !updatedIds.includes(id))

      // 2. Identificar nuevas (tienen temp_)
      const toCreate = updatedInjuries.filter(i => i.id.toString().startsWith('temp_'))

      // 3. Identificar actualizadas (están en ambos but changed... simplified: update all existing in updated list)
      const toUpdate = updatedInjuries.filter(i => !i.id.toString().startsWith('temp_'))

      // Ejecutar operaciones en paralelo
      const promises = []

      // Delete
      for (const id of toDelete) {
        promises.push(deleteInjury(id))
      }

      // Create
      for (const injury of toCreate) {
        const { id, ...data } = injury
        promises.push(createInjury({
          name: data.name,
          severity: data.severity,
          description: data.description,
          restrictions: data.restrictions,
          // Campos adicionales para el frontend (asegurar que se envíen si el backend los soporta o ignorarlos)
          // @ts-ignore
          muscleId: data.muscleId,
          // @ts-ignore
          muscleName: data.muscleName,
          // @ts-ignore
          muscleGroup: data.muscleGroup,
          // @ts-ignore
          painLevel: data.painLevel,
          // @ts-ignore
          painDescription: data.painDescription
        }))
      }

      // Update
      for (const injury of toUpdate) {
        const { id, ...data } = injury
        promises.push(updateInjury(id, {
          name: data.name,
          severity: data.severity,
          description: data.description,
          restrictions: data.restrictions,
          // @ts-ignore
          muscleId: data.muscleId,
          // @ts-ignore
          muscleName: data.muscleName,
          // @ts-ignore
          muscleGroup: data.muscleGroup,
          // @ts-ignore
          painLevel: data.painLevel,
          // @ts-ignore
          painDescription: data.painDescription
        }))
      }

      await Promise.all(promises)

      // Recargar para asegurar sincronización
      await loadInjuries()
      setShowInjuriesModal(false)

      toast({
        title: "Éxito",
        description: "Lesiones actualizadas correctamente"
      })

    } catch (error) {
      console.error('Error saving injuries:', error)
      toast({
        title: "Error",
        description: "Error al guardar los cambios",
        variant: "destructive"
      })
    }
  }, [injuries, createInjury, updateInjury, deleteInjury, loadInjuries, setShowInjuriesModal, toast])

  /* --------------------------------------------------------------------------------
   * GESTIÓN DE BIOMETRÍAS
   * -------------------------------------------------------------------------------- */
  const handleEditBiometric = (biometric: any) => {
    setSelectedBiometric(biometric)
    setBiometricsModalMode('edit')
    setIsBiometricsModalOpen(true)
  }

  const handleSaveBiometric = useCallback(async (data: { name: string, value: number, unit: string }) => {
    try {
      if (biometricsModalMode === 'edit' && selectedBiometric) {
        // En modo edición, NO eliminamos el anterior para mantener historial
        // createBiometric creará una nueva entrada
      }

      await createBiometric({
        name: data.name,
        value: data.value,
        unit: data.unit
      })

      toast({
        title: biometricsModalMode === 'edit' ? "Medición actualizada" : "Medición registrada",
        description: `${data.name}: ${data.value} ${data.unit}`,
      })

      await loadBiometrics()
      setIsBiometricsModalOpen(false)
      setSelectedBiometric(null)
      setBiometricsModalMode('register')
    } catch (error) {
      console.error('Error saving biometric:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la medición"
      })
    }
  }, [biometricsModalMode, selectedBiometric, createBiometric, deleteBiometric, loadBiometrics, setIsBiometricsModalOpen, setBiometricsModalMode, toast])

  const handleDeleteBiometricFromModal = useCallback(async () => {
    if (selectedBiometric) {
      try {
        await deleteBiometric(selectedBiometric.id)
        toast({
          title: "Medición eliminada",
        })
        await loadBiometrics()
        setIsBiometricsModalOpen(false)
        setSelectedBiometric(null)
        setBiometricsModalMode('register')
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo eliminar la medición"
        })
      }
    }
  }, [selectedBiometric, deleteBiometric, loadBiometrics, setIsBiometricsModalOpen, setBiometricsModalMode, toast])


  const confirmDeleteBiometric = useCallback(async () => {
    if (!biometricToDelete) return

    try {
      await deleteBiometric(biometricToDelete.id)
      setShowBiometricDeleteConfirmation(false)
      setBiometricToDelete(null)
      // Recargar biometría para actualizar la lista
      await loadBiometrics()
    } catch (error) {
      console.error('Error deleting biometric:', error)
    }
  }, [biometricToDelete, deleteBiometric, loadBiometrics, setShowBiometricDeleteConfirmation, setBiometricToDelete])



  return (
    <div className="min-h-screen bg-[#0F1012] text-white p-4 space-y-6">
      {/* Header del perfil reorganizado */}
      {isCoach ? (
        <CoachPersonalInfoSection
          coach={{
            ...coachProfile,
            rating: coachProfile?.rating,
            // total_sales viene del billing endpoint (totalSales) y representa cantidad de ventas
            total_sales: Number.isFinite(Number(coachProfile?.total_sales)) ? Number(coachProfile?.total_sales) : 0
          } || {}}
          variant="profile"
          showEditButton={true}
          onEditClick={() => handleEditSection("profile")}
          showStreak={true}
          streakCount={6}
        />
      ) : (
        <div
          className="bg-[#1A1C1F] rounded-2xl p-4 relative overflow-hidden"
          style={{
            backgroundImage: managedProfile?.avatar_url
              ? `linear-gradient(rgba(26, 28, 31, 0.7), rgba(26, 28, 31, 0.8)), url(${managedProfile?.avatar_url})`
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Fondo difuminado adicional */}
          {managedProfile?.avatar_url && (
            <div
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage: `url(${managedProfile?.avatar_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(12px)',
                transform: 'scale(1.1)'
              }}
            />
          )}

          {/* Contenido del perfil con z-index para estar encima del fondo */}
          <div className="relative z-10">
            {/* Botón de editar en esquina superior derecha */}
            <div className="absolute top-4 right-4">
              <Button
                onClick={() => handleEditSection("profile")}
                variant="ghost"
                size="sm"
                className="text-[#FF6A00] hover:bg-[#FF6A00]/10 rounded-xl p-2"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            </div>

            {/* Imagen centrada */}
            <div className="flex justify-center mb-2 pt-2">
              <div className="w-20 h-20 bg-gradient-to-br from-[#FF6A00] to-[#FF8C42] rounded-full flex items-center justify-center overflow-hidden">
                {managedProfile?.avatar_url ? (
                  <img
                    src={managedProfile.avatar_url}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-white" />
                )}
              </div>
            </div>

            {/* Nombre centrado */}
            <div className="text-center mb-2">
              <h1 className="text-lg font-semibold">
                {managedProfile?.full_name || "Usuario"}
              </h1>
            </div>

            {/* Información organizada en filas */}
            <div className="space-y-4">
              {/* Ubicación y edad */}
              <div className="flex items-center justify-center space-x-4">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-300">
                    {managedProfile?.location || "No especificada"}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-gray-300">
                    {managedProfile?.age || (managedProfile?.birth_date ? new Date().getFullYear() - new Date(managedProfile.birth_date).getFullYear() : "?")} años
                  </span>
                </div>
              </div>

              {/* Emergency Contact */}
              {(managedProfile?.emergency_contact || managedProfile?.phone) && (
                <div className="flex items-center justify-center space-x-4">
                  {managedProfile?.emergency_contact && (
                    <div className="flex items-center space-x-1 text-red-400/80">
                      <AlertTriangle className="h-3 w-3" />
                      <span className="text-xs">{managedProfile.emergency_contact}</span>
                    </div>
                  )}
                  {/* Phone (optional backup if no emergency contact, or show both) */}
                  {/* Actually let's just show Emergency Contact if available, as requested */}
                </div>
              )}

              {/* Peso y altura para clientes */}
              <div className="flex items-center justify-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Weight className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-300">{managedProfile?.weight || "-"} kg</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Ruler className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-300">{managedProfile?.height || "-"} cm</span>
                </div>
              </div>

              {/* Objetivos y Deportes (Stacked Rows) */}
              <div className="w-full flex flex-col gap-2 items-center mt-2">

                {/* Goals Row */}
                {managedProfile?.fitness_goals && Array.isArray(managedProfile.fitness_goals) && managedProfile.fitness_goals.length > 0 && (
                  <div className="w-full overflow-x-auto scrollbar-hide flex justify-center">
                    <div className="flex items-center gap-2 px-4 whitespace-nowrap">
                      {managedProfile.fitness_goals.map((g: string, i: number) => (
                        <div key={`g-${i}`} className="px-3 py-1 rounded-full bg-[#FF7939]/10 border border-[#FF7939]/30 text-[#FF7939] text-[10px] font-bold tracking-wider capitalize">
                          {g}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sports Row */}
                {managedProfile?.sports && managedProfile.sports.length > 0 && (
                  <div className="w-full overflow-x-auto scrollbar-hide flex justify-center">
                    <div className="flex items-center gap-2 px-4 whitespace-nowrap">
                      {managedProfile.sports.map((s: string, i: number) => (
                        <div key={`s-${i}`} className="px-3 py-1 rounded-full bg-orange-300/10 border border-orange-300/30 text-orange-300 text-[10px] font-bold tracking-wider capitalize">
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!managedProfile?.fitness_goals?.length && !managedProfile?.sports?.length) && (
                  <span className="text-xs text-gray-500 italic text-center w-full">Sin objetivos definidos</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barra segmentada de tipos de ventas - Solo para coaches */}
      {isCoach && (
        <div className="bg-[#1A1C1F] rounded-2xl p-4 relative">
          {/* Ícono de imprimir en esquina superior derecha */}
          <button
            onClick={handleDownloadInvoice}
            className="absolute top-4 right-4 flex items-center justify-center hover:opacity-80 transition-opacity"
            title="Descargar factura"
          >
            <Printer className="w-4 h-4 text-[#FF7939]" />
          </button>

          {/* Sección de Ganancias */}
          <div className="mb-4">
            {/* Ganancias */}
            <div className="text-center">
              <p className="text-3xl font-semibold text-[#FF7939] mb-1">
                ${earningsData.earnings.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-gray-500">
                Ganancia Bruta: ${earningsData.totalIncome.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Suscripción: -${earningsData.planFee.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#2A2C2E] mb-4"></div>

          {/* Barra de progreso segmentada - 4 segmentos */}
          <div className="mb-3">
            {(() => {
              const values = Object.values(salesData || {}) as any[]
              const total = values.reduce((a, b) => a + (Number(b) || 0), 0)
              const denom = Math.max(total, 1)

              if (total <= 0) {
                return (
                  <div className="flex rounded-xl overflow-hidden h-8 bg-white/10" />
                )
              }

              return (
                <div className="flex rounded-xl overflow-hidden h-8">
                  {/* Programas */}
                  <div
                    className="bg-[#FF6A00] flex items-center justify-center text-white text-xs font-medium"
                    style={{ width: `${((Number(salesData.programs) || 0) / denom) * 100}%` }}
                  >
                    {salesData.programs > 0 && `${Math.round(salesData.programs / 1000)}k`}
                  </div>

                  {/* Talleres */}
                  <div
                    className="bg-[#FFD1A6] flex items-center justify-center text-[#121212] text-xs font-medium"
                    style={{ width: `${((Number(salesData.workshops) || 0) / denom) * 100}%` }}
                  >
                    {salesData.workshops > 0 && `${Math.round(salesData.workshops / 1000)}k`}
                  </div>

                  {/* Documentos */}
                  <div
                    className="bg-[#FF9FC4] flex items-center justify-center text-white text-xs font-medium"
                    style={{ width: `${((Number(salesData.documents) || 0) / denom) * 100}%` }}
                  >
                    {salesData.documents > 0 && `${Math.round(salesData.documents / 1000)}k`}
                  </div>

                  {/* Consultas */}
                  <div
                    className="bg-white flex items-center justify-center text-[#121212] text-xs font-medium"
                    style={{ width: `${((Number(salesData.consultations) || 0) / denom) * 100}%` }}
                  >
                    {salesData.consultations > 0 && `${Math.round(salesData.consultations / 1000)}k`}
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Leyendas - 4 categorías */}
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="flex flex-col items-center">
              <BookOpen className="h-4 w-4 text-[#FF6A00] mb-1" />
              <span className="text-gray-400 text-center">Programas</span>
            </div>
            <div className="flex flex-col items-center">
              <Users className="h-4 w-4 text-[#FFD1A6] mb-1" />
              <span className="text-gray-400 text-center">Talleres</span>
            </div>
            <div className="flex flex-col items-center">
              <DocumentIcon className="h-4 w-4 text-[#FF9FC4] mb-1" />
              <span className="text-gray-400 text-center">Documentos</span>
            </div>
            <div className="flex flex-col items-center">
              <MessageCircle className="h-4 w-4 text-white mb-1" />
              <span className="text-gray-400 text-center">Consultas</span>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas del Coach - Solo para coaches */}
      {isCoach && (
        <div className="bg-[#1A1C1F] rounded-2xl p-4">
          <CoachStats />
        </div>
      )}

      {/* Movimientos Recientes - Solo para coaches */}
      {isCoach && (
        <div className="bg-[#1A1C1F] rounded-2xl p-4">
          <h3 className="text-lg font-semibold mb-4">Movimientos Recientes</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 bg-white/5 rounded-xl">
                  {/* Icono según tipo */}
                  <div className="flex-shrink-0 mt-1">
                    {activity.type === 'sale' && <ShoppingCart className="h-4 w-4 text-[#FF7939]" />}
                    {activity.type === 'consultation' && <MessageCircle className="h-4 w-4 text-[#FF7939]" />}
                    {activity.type === 'client' && <Users className="h-4 w-4 text-[#FF7939]" />}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {activity.description}
                    </p>
                    {activity.amount && (
                      <p className="text-xs text-[#FF7939] font-medium mt-1">
                        {activity.amount}
                      </p>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="flex-shrink-0">
                    <Clock className="h-3 w-3 text-gray-500" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No hay movimientos recientes</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Suscripción, Mercado Pago y Google Calendar - Solo para coaches */}
      {isCoach && (
        <div className="space-y-3">
          {/* Suscripción del Coach */}
          <PlanManagement />

          {/* Mercado Pago y Google Calendar lado a lado */}
          <div className="flex gap-3">
            <div className="flex-1 min-w-0">
              <MercadoPagoConnection />
            </div>
            <div className="flex-1 min-w-0">
              <GoogleCalendarConnection />
            </div>
          </div>
        </div>
      )}


      {/* Anillos de actividad - Solo para clientes */}
      {!isCoach && (
        <div className="bg-[#1A1C1F] rounded-2xl p-6">
          {/* Anillos diarios */}
          <div className="mb-6">
            <DailyActivityRings
              userId={user?.id}
              selectedDate={selectedDay?.date}
              category={activityFilter}
              currentWeek={ringsWeek}
              onWeekChange={(w) => {
                console.log('🧿 [RINGS][PROFILE] Semana cambiada (desde DailyActivityRings):', {
                  activityFilter,
                  from: ringsWeek.toISOString(),
                  to: w.toISOString()
                })
                setRingsWeek(w)
              }}
              headerRight={
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                  >
                    <Calendar className="w-5 h-5 text-gray-400" />
                  </button>
                  {metricsLoading && (
                    <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
              }
              onSelectDay={(d: any) => {
                console.log(' [RINGS][PROFILE] Click día en anillos:', {
                  activityFilter,
                  day: d
                })
                setSelectedDay({
                  date: d.date,
                  minutes: d.minutes,
                  minutesTarget: d.minutesTarget,
                  kcal: d.kcal,
                  kcalTarget: d.kcalTarget,
                  exercises: d.exercises,
                  exercisesTarget: d.exercisesTarget
                })
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            {/* Círculo principal más a la izquierda */}
            <div className="relative w-52 h-52">
              {activityRings.map((ring, index) => {
                const rawPercentage = ring.target > 0 ? (ring.current / ring.target) * 100 : 0
                const percentage = isNaN(rawPercentage) || !isFinite(rawPercentage) ? 0 : Math.max(0, Math.min(rawPercentage, 100))
                const radius = 50 - (index * 12) // Aumentar separación entre anillos
                const circumference = 2 * Math.PI * radius
                const strokeDasharray = circumference
                const strokeDashoffset = circumference - (percentage / 100) * circumference

                return (
                  <svg
                    key={ring.type}
                    className="absolute inset-0 w-full h-full transform -rotate-90"
                    viewBox="0 0 120 120"
                  >
                    <circle
                      cx="60"
                      cy="60"
                      r={radius}
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="10"
                      fill="none"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r={radius}
                      stroke={ring.color}
                      strokeWidth="10"
                      fill="none"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                      style={{
                        filter: `drop-shadow(0 0 6px ${ring.color}50)`
                      }}
                    />
                  </svg>
                )
              })}
            </div>

            {/* Información más a la derecha con formato rectangular */}
            <div className="flex flex-col space-y-3 items-end">
              {selectedDay ? 'Volver a Semanal' : 'Semanal'}

              {activityRings.map((ring) => (
                <div key={ring.type} className="flex flex-col items-end" style={{ minWidth: '120px' }}>
                  <div className="flex items-center gap-1.5 text-sm font-medium justify-end" style={{ color: ring.color }}>
                    {ring.type === 'Kcal' ? (
                      activityFilter === 'fitness' ? (
                        <ArrowDown className="h-4 w-4 flex-shrink-0" style={{ color: "#FF6A00" }} />
                      ) : (
                        <ArrowUp className="h-4 w-4 flex-shrink-0" style={{ color: "#FFFFFF" }} />
                      )
                    ) : null}
                    <span>
                      {ring.type === 'Ejercicios' || ring.type === 'Platos'
                        ? (activityFilter === 'fitness' ? 'Ejercicios' : 'Platos')
                        : ring.type}
                    </span>
                  </div>
                  <div className="text-lg font-bold" style={{ color: ring.color }}>
                    {ring.current}/{ring.target}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filtros debajo del círculo y la información */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => setActivityFilter('fitness')}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${activityFilter === 'fitness'
                ? 'bg-black text-[#FF7939]'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
            >
              Fitness
            </button>
            <button
              onClick={() => setActivityFilter('nutricion')}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${activityFilter === 'nutricion'
                ? 'bg-white text-[#FF7939]'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
            >
              Nutrición
            </button>

          </div>



          {/* Modal del Calendario */}
          {
            showCalendar && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-[#1A1C1F] rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
                  <div className="p-4 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Historial de Actividad</h3>
                      <button
                        onClick={() => setShowCalendar(false)}
                        className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4 overflow-y-auto max-h-[60vh]">
                    <ActivityCalendar userId={user?.id} />
                  </div>
                </div>
              </div>
            )
          }

        </div >
      )
      }

      {/* Sections Wrapper */}
      <div className="space-y-6">

        {/* 1. SECCIÓN BIOMETRÍA */}
        {!isCoach && (
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#FF6A00]" />
                <h2 className="text-sm font-semibold text-gray-200">Biometría</h2>
              </div>
              <div className="flex gap-1">
                {/* Botón de editar visual (abre modal para editar values existentes al clickear card realmente) */}
                <Button
                  onClick={() => {
                    setSelectedBiometric(null)
                    setBiometricsModalMode('edit')
                    setIsBiometricsModalOpen(true)
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-white h-6 w-6 p-0 rounded-full"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  onClick={() => {
                    setBiometricsModalMode('register')
                    setIsBiometricsModalOpen(true)
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-[#FF6A00] hover:bg-[#FF6A00]/10 h-6 w-6 p-0 rounded-full"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Horizontal Scroll Biometrics - Fixed Height */}
            <div className="bg-transparent h-[120px] w-full">
              <div className="overflow-x-auto pb-2 -mx-2 px-2 custom-scrollbar hide-scrollbar-mobile" style={{ scrollbarWidth: 'none' }}>
                <div className="flex gap-3 min-w-max">
                  {processedBiometrics.length > 0 ? (
                    processedBiometrics.map((bio) => (
                      <div
                        key={bio.id}
                        onClick={() => handleEditBiometric(bio)}
                        className="bg-white/5 rounded-2xl p-3 cursor-pointer hover:bg-white/10 transition-all border-l-2 border-transparent hover:border-l-[#FF6A00] w-[130px] h-[90px] flex flex-col justify-between group"
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] uppercase text-gray-400 font-bold max-w-[70%] leading-tight tracking-wider">{bio.name}</span>
                          {bio.trend !== 'neutral' && (
                            <div className={`flex items-center gap-0.5 text-[9px] font-bold ${bio.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                              {bio.trend === 'up' ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
                              <span>{Number(bio.diff).toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-baseline gap-1 mt-auto">
                          <span className="text-2xl font-bold text-white">{bio.value}</span>
                          <span className="text-[10px] text-gray-500 font-medium">{bio.unit}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center w-full h-[100px] text-xs text-gray-500 border border-dashed border-white/10 rounded-2xl">
                      Sin datos registrados
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. SECCIÓN OBJETIVOS */}
        {!isCoach && (
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-[#FF6A00]" />
                <h2 className="text-sm font-semibold text-gray-200">Objetivos</h2>
              </div>
              <div className="flex gap-1 items-center">
                {isEditingObjectives && (
                  <div className="flex gap-1 mr-2">
                    <Button
                      onClick={() => {
                        setIsEditingObjectives(false)
                        objectivesRef.current?.cancelEditing()
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-red-400 h-6 px-2 py-0 text-[10px] font-bold"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={async () => {
                        setIsSavingObjectives(true)
                        await objectivesRef.current?.saveChanges()
                        setIsSavingObjectives(false)
                        setIsEditingObjectives(false)
                      }}
                      variant="ghost"
                      size="sm"
                      className="bg-orange-500/10 text-[#FF6A00] hover:bg-orange-500/20 h-6 px-2 py-0 text-[10px] font-bold"
                    >
                      {isSavingObjectives ? '...' : 'Guardar'}
                    </Button>
                  </div>
                )}
                <Button
                  onClick={() => handleEditSection("goals")}
                  variant="ghost"
                  size="sm"
                  className={`${isEditingObjectives ? 'text-white bg-white/10' : 'text-gray-500'} hover:text-white h-6 w-6 p-0 rounded-full`}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  onClick={() => setShowQuickAdd(true)}
                  variant="ghost"
                  size="sm"
                  className="text-[#FF6A00] hover:bg-[#FF6A00]/10 h-6 w-6 p-0 rounded-full"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {showQuickAdd && (
              <div className="mb-2">
                <QuickExerciseAdd
                  onAdd={handleQuickAddExercise}
                  onCancel={() => setShowQuickAdd(false)}
                />
              </div>
            )}

            {/* Exercise List is now inherently Horizontal & Compact */}
            <div className="h-[120px] w-full">
              <ExerciseProgressList ref={objectivesRef} userId={user?.id} isEditing={isEditingObjectives} />
            </div>
          </div>
        )}

        {/* 3. SECCIÓN LESIONES */}
        {!isCoach && (
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#FF6A00]" />
                <h2 className="text-sm font-semibold text-gray-200">Lesiones</h2>
              </div>
              <div className="flex gap-1">
                {/* Botón editar lesiones (abre modal también) */}
                <Button
                  onClick={() => {
                    // Logic to verify/edit existing? 
                    setShowInjuriesModal(true)
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-white h-6 w-6 p-0 rounded-full"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  onClick={() => setShowInjuriesModal(true)}
                  variant="ghost"
                  size="sm"
                  className="text-[#FF6A00] hover:bg-[#FF6A00]/10 h-6 w-6 p-0 rounded-full"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="bg-transparent h-[120px] w-full">
              <div className="overflow-x-auto pb-2 -mx-2 px-2 custom-scrollbar hide-scrollbar-mobile" style={{ scrollbarWidth: 'none' }}>
                <div className="flex gap-3 min-w-max">
                  {injuries.length > 0 ? (
                    injuries.map((injury) => (
                      <div
                        key={injury.id}
                        onClick={() => {
                          // Open edit modal for injury
                          // TODO: Add handleEditInjury if needed, for now just open modal
                          setShowInjuriesModal(true)
                        }}
                        className="bg-white/5 rounded-2xl p-4 cursor-pointer hover:bg-white/10 transition-all border-l-2 border-transparent hover:border-l-[#FF6A00] w-[140px] h-[100px] flex flex-col justify-between group"
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] uppercase text-gray-400 font-bold leading-tight max-w-[85%]">{injury.muscleName || injury.name}</span>
                          <div className={`h-2 w-2 rounded-full ${injury.painLevel! >= 7 ? 'bg-red-500' :
                            injury.painLevel! >= 4 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}></div>
                        </div>

                        <div className="mt-auto">
                          <span className="text-white text-sm font-bold block truncate">{injury.name}</span>
                          <span className={`text-[10px] font-medium ${injury.painLevel! >= 7 ? 'text-red-400' :
                            injury.painLevel! >= 4 ? 'text-yellow-400' : 'text-green-400'
                            }`}>
                            {injury.painLevel! >= 7 ? 'Fuerte' : injury.painLevel! >= 4 ? 'Moderado' : 'Leve'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center w-full h-[100px] text-xs text-gray-500 border border-dashed border-white/10 rounded-2xl">
                      Sin lesiones activas
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Compras recientes - Solo para clientes */}
      {
        !isCoach && (
          <div className="bg-[#1A1C1F] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-[#FF6A00]" />
                <h2 className="text-lg font-semibold">Compras recientes</h2>
              </div>
            </div>
            <RecentPurchasesList userId={user?.id} />
            <div className="mt-4">
              <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
                <FileText className="h-4 w-4 mr-3" />
                Ver facturas
              </Button>
            </div>
          </div>
        )
      }



      {/* Logros & badges - Solo para clientes */}
      {
        !isCoach && (
          <div className="bg-[#1A1C1F] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Logros & badges</h2>
              <Button
                onClick={() => handleEditSection("achievements")}
                variant="ghost"
                size="sm"
                className="text-[#FF6A00] hover:bg-[#FF6A00]/10 rounded-xl"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-square bg-white/5 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <Trophy className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-xs text-gray-400">Logro {i}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }

      {/* Modales */}
      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setShowInjuriesModal(false)
          setEditingSection(null)
        }}
        editingSection={editingSection}
      />

      <ObjectivesModal
        isOpen={isObjectivesModalOpen}
        onClose={() => setIsObjectivesModalOpen(false)}
      />

      <BiometricsModal
        isOpen={isBiometricsModalOpen}
        onClose={() => setIsBiometricsModalOpen(false)}
        mode={biometricsModalMode}
        onSave={handleSaveBiometric}
        initialData={selectedBiometric}
        onDelete={handleDeleteBiometricFromModal}
      />

      {/* Modal de confirmación para eliminar biometría */}
      <ConfirmationModal
        isOpen={showBiometricDeleteConfirmation}
        onClose={() => {
          setShowBiometricDeleteConfirmation(false)
          setBiometricToDelete(null)
        }}
        onConfirm={confirmDeleteBiometric}
        title="Eliminar Medición"
        description={
          biometricToDelete
            ? `¿Estás seguro de que quieres eliminar la medición "${biometricToDelete.name}: ${biometricToDelete.value} ${biometricToDelete.unit}"? Esta acción no se puede deshacer.`
            : ""
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />

      {/* Modal de lesiones */}
      <InjuriesModal
        isOpen={showInjuriesModal}
        onClose={() => setShowInjuriesModal(false)}
        injuries={injuries}
        onSave={handleSaveInjuries}
      />

    </div >
  )
}

export default ProfileScreen
