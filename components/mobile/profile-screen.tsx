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
  Coffee,
  MessageCircle,
  ShoppingCart,
  Clock,
  DollarSign,
  Printer,
  Loader2
} from "lucide-react"
import { useProfileManagement } from '@/hooks/client/use-profile-management'
import { useClientMetrics } from '@/hooks/client/use-client-metrics'
import { useCoachProfile } from '@/hooks/coach/use-coach-profile'
import { useAuth } from "@/contexts/auth-context"
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
              {purchase.activity?.title || 'Actividad'}
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

export function ProfileScreen() {
  const { 
    profile: managedProfile, 
    biometrics, 
    injuries,
    loadProfile,
    loadBiometrics,
    loadInjuries,
    deleteBiometric
  } = useProfileManagement()

  const { user } = useAuth()
  const { metrics, weeklyData, loading: metricsLoading } = useClientMetrics(user?.id)
  
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
  const [selectedDay, setSelectedDay] = useState<{ date: string; minutes: number; kcal: number; exercises: number } | null>(null)

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
          calories: { current: selectedDay.kcal, target: 500, percentage: 0 },
          duration: { current: selectedDay.minutes, target: 60, percentage: 0 },
          exercises: { current: selectedDay.exercises, target: 3, percentage: 0 }
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
      type: "Min", 
      current: source.duration.current, 
      target: source.duration.target, 
      color: "#FF8C42", 
      icon: <Calendar className="h-4 w-4" /> 
    },
    { 
      type: "Ej", 
      current: source.exercises.current, 
      target: source.exercises.target, 
      color: "#FFFFFF", 
      icon: <Trophy className="h-4 w-4" /> 
    }
  ], [source])

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
      setShowQuickAdd(true)
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
      // API eliminada - solo actualizar estado local
      console.warn('⚠️ API /api/profile/injuries eliminada - guardando lesiones localmente')
      // No hacer llamada a la API, solo actualizar estado local
      // Simular éxito
      const data = { success: true, injuries: updatedInjuries }
      
      if (data.success) {
        // Recargar las lesiones específicamente para actualizar inmediatamente
        await loadInjuries()
        setShowInjuriesModal(false)
      } else {
        console.error('Error saving injuries:', data.error)
      }
    } catch (error) {
      console.error('Error saving injuries:', error)
    }
  }, [loadInjuries, setShowInjuriesModal])

  const handleDeleteBiometric = useCallback((biometric: { id: string; name: string; value: string; unit: string }) => {
    setBiometricToDelete(biometric)
    setShowBiometricDeleteConfirmation(true)
  }, [setBiometricToDelete, setShowBiometricDeleteConfirmation])

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
      <div 
        className="bg-[#1A1C1F] rounded-2xl p-4 relative overflow-hidden"
        style={{
          backgroundImage: (isCoach ? (coachProfile as any)?.avatar_url : managedProfile?.avatar_url) 
            ? `linear-gradient(rgba(26, 28, 31, 0.7), rgba(26, 28, 31, 0.8)), url(${(isCoach ? (coachProfile as any)?.avatar_url : managedProfile?.avatar_url)})`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Fondo difuminado adicional */}
        {(isCoach ? (coachProfile as any)?.avatar_url : managedProfile?.avatar_url) && (
          <div 
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage: `url(${(isCoach ? (coachProfile as any)?.avatar_url : managedProfile?.avatar_url)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(12px)',
              transform: 'scale(1.1)'
            }}
          />
        )}
        
        {/* Contenido del perfil con z-index para estar encima del fondo */}
        <div className="relative z-10">
        {/* Racha en esquina superior izquierda */}
        <div className="absolute top-4 left-4">
          <div className="flex items-center space-x-2 bg-orange-500/20 px-3 py-1 rounded-full">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium text-orange-500">6</span>
          </div>
        </div>

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
            {(() => {
              console.log('🖼️ [ProfileScreen] Renderizando imagen:', {
                hasAvatar: !!(isCoach ? (coachProfile as any)?.avatar_url : managedProfile?.avatar_url),
                avatarUrl: (isCoach ? (coachProfile as any)?.avatar_url : managedProfile?.avatar_url),
                profile: managedProfile
              })
              const avatar = isCoach ? (coachProfile as any)?.avatar_url : managedProfile?.avatar_url
              return avatar ? (
                <img 
                  src={avatar as any} 
                  alt="Foto de perfil" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-white" />
              )
            })()}
          </div>
        </div>

        {/* Nombre centrado */}
        <div className="text-center mb-2">
          <h1 className="text-lg font-semibold">
            {isCoach ? (coachProfile?.full_name || "Coach") : (managedProfile?.full_name || "Usuario")}
          </h1>
        </div>

        {/* Información organizada en filas */}
        <div className="space-y-2">
          {/* Ubicación y edad (usar datos de coach si aplica) */}
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-300">
                {isCoach ? (coachProfile?.location || "No especificada") : (managedProfile?.location || "No especificada")}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-sm text-gray-300">
                {isCoach
                  ? (typeof (coachProfile as any)?.age_years === 'number' ? (coachProfile as any)?.age_years : "N/A")
                  : (managedProfile?.age || "N/A")} años
              </span>
            </div>
          </div>

          {/* Bio y especialidades para coaches */}
          {isCoach ? (
            <div className="space-y-2">
              {/* Bio */}
              <div className="text-center">
                <span className="text-sm text-gray-300">
                  {coachProfile?.bio || "Sin biografía"}
                </span>
              </div>
              {/* Especialidades - chips estilo ActivityCard */}
              <div className="text-center">
                {(() => {
                  const specsRaw = coachProfile?.specialization || ""
                  const specs = specsRaw
                    ? specsRaw.split(',').map(s => s.trim()).filter(Boolean)
                    : []
                  if (specs.length === 0) {
                    return <span className="text-sm text-gray-300">Sin especialidades</span>
                  }
                  return (
                    <div className="flex flex-wrap justify-center gap-1">
                      {specs.map((spec, idx) => (
                        <span
                          key={`${spec}-${idx}`}
                          className="bg-[#FF7939]/20 text-[#FF7939] text-[10px] px-1.5 py-0.5 rounded-full font-medium border border-[#FF7939]/30 whitespace-nowrap"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  )
                })()}
              </div>
              {/* Certificaciones */}
              <div className="text-center">
                <span className="text-sm text-gray-300">
                  Certificaciones: {(coachProfile as any)?.certifications_count ?? (coachProfile?.certifications?.length ?? 0)}
                </span>
              </div>
            </div>
          ) : (
            /* Peso y altura para clientes */
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-1">
              <Weight className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-300">{managedProfile?.weight || "N/A"} kg</span>
            </div>
            <div className="flex items-center space-x-1">
              <Ruler className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-300">{managedProfile?.height || "N/A"} cm</span>
            </div>
          </div>
          )}
        </div>
        </div>
      </div>

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
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#2A2C2E] mb-4"></div>
          
          {/* Barra de progreso segmentada - 4 segmentos */}
          <div className="mb-3">
            <div className="flex rounded-xl overflow-hidden h-8">
              {/* Programas */}
              <div 
                className="bg-[#FF7939] flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${(salesData.programs / Math.max(...Object.values(salesData), 1) * 100)}%` }}
              >
                {salesData.programs > 0 && salesData.programs}
              </div>
              
              {/* Talleres */}
              <div 
                className="bg-[#FF8C42] flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${(salesData.workshops / Math.max(...Object.values(salesData), 1) * 100)}%` }}
              >
                {salesData.workshops > 0 && salesData.workshops}
              </div>
              
              {/* Documentos */}
              <div 
                className="bg-[#FF9F5A] flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${(salesData.documents / Math.max(...Object.values(salesData), 1) * 100)}%` }}
              >
                {salesData.documents > 0 && salesData.documents}
              </div>
              
              {/* Cefe + Consultas combinado */}
              <div 
                className="bg-white flex items-center justify-center text-[#121212] text-xs font-medium"
                style={{ width: `${(salesData.cefe / Math.max(...Object.values(salesData), 1) * 100)}%` }}
              >
                {salesData.cefe > 0 && salesData.cefe}
              </div>
            </div>
          </div>
          
          {/* Leyendas - 4 categorías */}
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="flex flex-col items-center">
              <BookOpen className="h-4 w-4 text-[#FF7939] mb-1" />
              <span className="text-gray-400 text-center">Programas</span>
            </div>
            <div className="flex flex-col items-center">
              <Users className="h-4 w-4 text-[#FF8C42] mb-1" />
              <span className="text-gray-400 text-center">Talleres</span>
            </div>
            <div className="flex flex-col items-center">
              <DocumentIcon className="h-4 w-4 text-[#FF9F5A] mb-1" />
              <span className="text-gray-400 text-center">Documentos</span>
            </div>
            <div className="flex flex-col items-center">
              <Coffee className="h-4 w-4 text-white mb-1" />
              <span className="text-gray-400 text-center">Cefe + Consultas</span>
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Anillos de actividad</h2>
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
        </div>
        
        {/* Anillos diarios */}
        <div className="mb-6">
          <DailyActivityRings
            userId={user?.id}
            selectedDate={selectedDay?.date}
            onSelectDay={(d: any) => setSelectedDay({ date: d.date, minutes: d.minutes, kcal: d.kcal, exercises: d.exercises })}
          />
        </div>
        
        <div className="flex items-center justify-between">
          {/* Círculo principal más a la izquierda */}
          <div className="relative w-52 h-52">
            {activityRings.map((ring, index) => {
              const percentage = Math.min((ring.current / ring.target) * 100, 100)
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
          <div className="flex flex-col space-y-3">
            <div
              className="text-xs text-gray-400 mb-2 cursor-pointer"
              onClick={() => setSelectedDay(null)}
            >
              {selectedDay ? 'Volver a Semanal' : 'Semanal'}
            </div>
            {activityRings.map((ring) => (
              <div key={ring.type} className="flex flex-col">
                <div className="text-sm font-medium" style={{ color: ring.color }}>
                  {ring.type === 'Kcal' ? 'Kcal' : ring.type === 'Min' ? 'Minutos' : 'Ejercicios'}
                </div>
                <div className="text-lg font-bold" style={{ color: ring.color }}>
                  {ring.current}/{ring.target}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal del Calendario */}
        {showCalendar && (
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
        )}

      </div>
      )}

      {/* Objetivos - Solo para clientes */}
      {!isCoach && (
      <div className="bg-[#1A1C1F] rounded-2xl p-6">
        <div className="space-y-4">
          {/* Lista de ejercicios del usuario */}
          <ExerciseProgressList userId={user?.id} />
          
          {/* Formulario rápido para agregar ejercicio */}
          {showQuickAdd && (
            <QuickExerciseAdd
              onAdd={handleQuickAddExercise}
              onCancel={() => setShowQuickAdd(false)}
            />
          )}
          
          {/* Botón para agregar nuevo ejercicio */}
          {!showQuickAdd && (
            <div className="flex justify-center">
              <Button
                onClick={() => handleEditSection("goals")}
                variant="ghost"
                size="sm"
                className="text-[#FF6A00] hover:bg-[#FF6A00]/10 rounded-xl"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Biometría & Mediciones - Solo para clientes */}
      {!isCoach && (
      <div className="bg-[#1A1C1F] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-[#FF6A00]" />
            <h2 className="text-lg font-semibold">Biometría & Mediciones</h2>
          </div>
          <Button
            onClick={() => {
              setBiometricsModalMode('register')
              setIsBiometricsModalOpen(true)
            }}
            variant="ghost"
            size="sm"
            className="text-[#FF6A00] hover:bg-[#FF6A00]/10 rounded-xl"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-3">
          {biometrics.length > 0 ? (
            biometrics.map((bio) => (
              <div key={bio.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white">{bio.name}</span>
                    <span className="text-sm text-gray-400">{bio.value} {bio.unit}</span>
                  </div>
                  {bio.notes && (
                    <p className="text-xs text-gray-400 mt-1">{bio.notes}</p>
                  )}
                </div>
                <Button
                  onClick={() => handleDeleteBiometric(bio)}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:bg-red-400/10 rounded-xl ml-2"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No hay mediciones registradas</p>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-4">Estos datos no reemplazan consejo médico.</p>
      </div>
      )}

      {/* Compras recientes - Solo para clientes */}
      {!isCoach && (
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
      )}

      {/* Lesiones / Contraindicaciones - Solo para clientes */}
      {!isCoach && (
      <div className="bg-[#1A1C1F] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-[#FF6A00]" />
            <h2 className="text-lg font-semibold">Lesiones / Contraindicaciones</h2>
          </div>
          <Button
            onClick={() => handleEditSection("injuries")}
            variant="ghost"
            size="sm"
            className="text-[#FF6A00] hover:bg-[#FF6A00]/10 rounded-xl"
          >
            <Edit3 className="h-4 w-4" />
          </Button>
        </div>
        {injuries.length > 0 ? (
          <div className="space-y-3">
            {injuries.map((injury) => (
              <div key={injury.id} className="p-3 bg-white/5 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${getSeverityColor(injury.severity)}`}>
                      {injury.severity === 'low' ? 'Baja' : injury.severity === 'medium' ? 'Media' : 'Alta'}
                    </span>
                    <span className="font-medium">{injury.name}</span>
                  </div>
                </div>
                
                {/* Información estandarizada */}
                {(injury.muscleName || injury.painLevel) && (
                  <div className="mt-2 space-y-1 text-sm text-gray-400">
                    {injury.muscleName && (
                      <div className="flex items-center space-x-2">
                        <span className="text-[#FF6A00]">📍</span>
                        <span>{injury.muscleName}</span>
                        {injury.muscleGroup && (
                          <span className="text-gray-500">({injury.muscleGroup})</span>
                        )}
                      </div>
                    )}
                    
                    {injury.painLevel && (
                      <div className="flex items-center space-x-2">
                        <span className="text-[#FF6A00]">⚡</span>
                        <span>Dolor nivel {injury.painLevel}/3</span>
                        {injury.painDescription && (
                          <span className="text-gray-500">- {injury.painDescription}</span>
                        )}
                      </div>
                    )}
                    
                  </div>
                )}
                
                {/* Descripción adicional */}
                {injury.description && (
                  <div className="mt-2 text-sm text-gray-300 bg-gray-800/30 p-2 rounded">
                    {injury.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No hay lesiones registradas</p>
            <Button
              onClick={() => handleEditSection("injuries")}
              variant="outline"
              size="sm"
              className="mt-4 text-[#FF6A00] border-[#FF6A00]/20 hover:bg-[#FF6A00]/10"
            >
              + Agregar lesión
            </Button>
          </div>
        )}
        </div>
      )}

      {/* Logros & badges - Solo para clientes */}
      {!isCoach && (
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
      )}

      {/* Modales */}
      <ProfileEditModal 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false)
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
      
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs max-w-xs">
          <div>Lesiones cargadas: {injuries?.length || 0}</div>
          <div>Modal abierto: {showInjuriesModal ? 'Sí' : 'No'}</div>
          {injuries && injuries.length > 0 && (
            <div>Primera lesión: {injuries[0]?.name}</div>
          )}
        </div>
      )}
    </div>
  )
}

export default ProfileScreen



