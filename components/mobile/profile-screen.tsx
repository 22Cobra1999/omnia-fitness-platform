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
  Ruler
} from "lucide-react"
import { useProfileManagement } from "@/hooks/use-profile-management"
import { useClientMetrics } from "@/hooks/use-client-metrics"
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

export function ProfileScreen() {
  const { 
    profile: managedProfile, 
    biometrics, 
    injuries,
    loadProfile,
    loadInjuries
  } = useProfileManagement()

  const { user } = useAuth()
  const { metrics, weeklyData, loading: metricsLoading } = useClientMetrics(user?.id)

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
      const response = await fetch('/api/profile/injuries', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          injuries: updatedInjuries
        }),
      })

      const data = await response.json()

      if (response.ok) {
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
      // TODO: Implementar API para eliminar biometría
      console.log('Eliminando biometría:', biometricToDelete.id)
      // Aquí iría la llamada a la API para eliminar la medición
      // await fetch(`/api/biometrics/${biometricToDelete.id}`, { method: 'DELETE' })
      
      // Por ahora solo cerramos el modal
      setShowBiometricDeleteConfirmation(false)
      setBiometricToDelete(null)
    } catch (error) {
      console.error('Error deleting biometric:', error)
    }
  }, [biometricToDelete, setShowBiometricDeleteConfirmation, setBiometricToDelete])

    return (
    <div className="min-h-screen bg-[#0F1012] text-white p-4 space-y-6">
      {/* Header del perfil reorganizado */}
      <div 
        className="bg-[#1A1C1F] rounded-2xl p-4 relative overflow-hidden"
        style={{
          backgroundImage: managedProfile?.avatar_url 
            ? `linear-gradient(rgba(26, 28, 31, 0.7), rgba(26, 28, 31, 0.8)), url(${managedProfile.avatar_url})`
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
              backgroundImage: `url(${managedProfile.avatar_url})`,
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
                hasAvatar: !!managedProfile?.avatar_url,
                avatarUrl: managedProfile?.avatar_url,
                profile: managedProfile
              })
              return managedProfile?.avatar_url ? (
                <img 
                  src={managedProfile.avatar_url} 
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
          <h1 className="text-lg font-semibold">{managedProfile?.full_name || "Usuario"}</h1>
        </div>

        {/* Información organizada en filas */}
        <div className="space-y-2">
          {/* Ubicación y edad */}
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-300">{managedProfile?.location || "No especificada"}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-sm text-gray-300">{managedProfile?.age || "N/A"} años</span>
            </div>
          </div>

          {/* Peso y altura */}
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
        </div>
        </div>
      </div>



      {/* Anillos de actividad */}
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


      {/* Objetivos */}
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

      {/* Biometría & Mediciones */}
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

      {/* Plan, suscripción & pagos */}
      <div className="bg-[#1A1C1F] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-[#FF6A00]" />
            <h2 className="text-lg font-semibold">Plan, suscripción & pagos</h2>
      </div>
    </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium">Plan Premium</p>
                <p className="text-sm text-gray-400">Activo - Visa - 28 Sep</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
              <FileText className="h-4 w-4 mr-3" />
              Gestionar suscripción
            </Button>
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
              <FileText className="h-4 w-4 mr-3" />
              Ver facturas
            </Button>
          </div>
        </div>
      </div>

      {/* Lesiones / Contraindicaciones */}
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

      {/* Logros & badges */}
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



