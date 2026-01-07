"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from '@/lib/supabase/supabase-client'
import CalendarView from "./CalendarView"

interface CalendarScreenProps {
  onTabChange?: (tab: string) => void;
}

export function CalendarScreen({ onTabChange }: CalendarScreenProps) {
  const [clientId, setClientId] = useState<string | null>(null)
  const [activityIds, setActivityIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [scheduleMeetContext, setScheduleMeetContext] = useState<
    | { coachId: string; activityId?: string; source?: string }
    | null
  >(null)
  const supabase = useMemo(() => createClient(), [])

  // Listener para resetear al origen cuando se presiona el tab activo
  useEffect(() => {
    const handleResetToOrigin = (event: CustomEvent) => {
      const { tab } = event.detail
      if (tab === 'calendar') {
        // Limpiar localStorage de actividad seleccionada
        if (typeof window !== 'undefined') {
          localStorage.removeItem('selectedActivityFromCalendar')
          localStorage.removeItem('scheduleMeetContext')
        }
        
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

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const hasIntent = sessionStorage.getItem('scheduleMeetIntent') === '1'
      if (!hasIntent) {
        // En refresh / navegación directa, abrir calendario del cliente en modo normal.
        // El modo schedule-meet solo debe activarse por una intención explícita.
        setScheduleMeetContext(null)
        try {
          localStorage.removeItem('scheduleMeetContext')
        } catch {
          // ignore
        }
        return
      }

      // Consumir intent (solo una vez)
      sessionStorage.removeItem('scheduleMeetIntent')

      const raw = localStorage.getItem('scheduleMeetContext')
      if (!raw) {
        setScheduleMeetContext(null)
        return
      }
      const parsed = JSON.parse(raw)
      const coachId = String(parsed?.coachId || '')
      const activityId = parsed?.activityId ? String(parsed?.activityId || '') : undefined
      if (!coachId) {
        setScheduleMeetContext(null)
        return
      }
      setScheduleMeetContext({ coachId, activityId, source: parsed?.source })
    } catch (e) {
      setScheduleMeetContext(null)
    }
  }, [])

  // Función para manejar el clic en una actividad
  const handleActivityClick = (activityId: string) => {
    console.log('🎯 [CalendarScreen] Navegando a actividad:', activityId);
    
    // Guardar el activityId en localStorage para que ActivityScreen lo lea
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedActivityFromCalendar', activityId);
      console.log('💾 [CalendarScreen] ActivityId guardado en localStorage:', activityId);
    }
    
    if (onTabChange) {
      onTabChange('activity');
    } else {
      console.warn('⚠️ [CalendarScreen] onTabChange no está definido');
    }
  };

  // Memoizar la función de obtener usuario y todas sus actividades activas
  const getUserAndActivities = useCallback(async () => {
    try {
      setLoading(true)
      
      // 1. Obtener usuario autenticado
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error("Error getting user:", userError)
        return
      }
      
      if (!user) {
        setLoading(false)
        return
      }
      
      setClientId(user.id)
      
      // 2. Obtener TODOS los enrollments activos del usuario
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('activity_enrollments')
        .select('activity_id, status, start_date')
        .eq('client_id', user.id)
        .eq('status', 'activa')
        .order('created_at', { ascending: false })
      
      if (enrollmentsError) {
        console.error("Error getting enrollments:", enrollmentsError)
        setActivityIds([])
      } else if (enrollments && enrollments.length > 0) {
        const ids = (enrollments as any[]).map((enrollment: any) => String(enrollment.activity_id).toString())
        console.log('📅 [CalendarScreen] Actividades activas encontradas:', ids)
        setActivityIds(ids)
      } else {
        console.log('⚠️ [CalendarScreen] No se encontraron actividades activas')
        setActivityIds([])
      }
      
    } catch (err) {
      console.error("Error in getUserAndActivities:", err)
      setActivityIds([])
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Obtener el usuario autenticado y todas sus actividades
  useEffect(() => {
    getUserAndActivities()
  }, [getUserAndActivities])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#121212]">
        <div className="text-white">Cargando...</div>
      </div>
    )
  }

  if (!clientId) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#121212]">
        <div className="text-white">Por favor inicia sesión para ver tu calendario</div>
      </div>
    )
  }

  if (activityIds.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#121212]">
        <div className="text-white text-center">
          <p className="mb-4">No tienes actividades activas</p>
          <p className="text-sm text-gray-400">Contacta a tu coach para inscribirte en un programa</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#121212] overflow-y-auto">
      <CalendarView 
        activityIds={activityIds} 
        onActivityClick={handleActivityClick}
        scheduleMeetContext={scheduleMeetContext}
        onSetScheduleMeetContext={setScheduleMeetContext}
      />
    </div>
  )
}
