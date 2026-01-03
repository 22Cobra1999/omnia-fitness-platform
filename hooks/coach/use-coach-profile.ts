"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/supabase-client'
import { useAuth } from '@/contexts/auth-context'

interface CoachProfile {
  id: string
  full_name: string
  bio?: string
  specialization?: string
  experience_years?: number
  avatar_url?: string
  rating?: number
  total_reviews?: number
  certifications?: string[]
  hourly_rate?: number
  location?: string | null
  birth_date?: string | null
  age_years?: number | null
  certifications_count?: number
  total_sales?: number | null
}

interface SalesData {
  programs: number
  workshops: number
  documents: number
  consultations: number
}

interface RecentActivity {
  id: string
  type: 'sale' | 'consultation' | 'client'
  title: string
  description: string
  amount?: string
  timestamp: string
  client_name?: string
}

interface EarningsData {
  totalIncome: number // Ganancia bruta
  totalCommission: number
  planFee: number
  earnings: number // Ganancia neta
}

export function useCoachProfile() {
  const [profile, setProfile] = useState<CoachProfile | null>(null)
  const [salesData, setSalesData] = useState<SalesData>({
    programs: 0,
    workshops: 0,
    documents: 0,
    consultations: 0
  })
  const [earningsData, setEarningsData] = useState<EarningsData>({
    totalIncome: 0,
    totalCommission: 0,
    planFee: 0,
    earnings: 0
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    // Si el usuario no es coach, establecer loading en false y salir
    if (!user?.id || user.level !== 'coach') {
      setLoading(false)
      return
    }

    const fetchCoachData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Obtener perfil del coach
        const { data: coach, error: coachError } = await supabase
          .from('coaches')
          .select('*')
          .eq('id', user.id)
          .single()

        if (coachError) {
          console.error('Error fetching coach profile:', coachError)
          setError('Error al cargar perfil del coach')
          setLoading(false)
          return
        }

        // Obtener datos del user_profile para avatar y nombre
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single()

        // Obtener estadísticas del coach
        const { data: stats, error: statsError } = await supabase
          .from('coach_stats_view')
          .select('avg_rating, total_reviews')
          .eq('coach_id', user.id)
          .single()

        // Intentar obtener avatar desde múltiples fuentes (user_profiles, coaches, metadatos del usuario)
        const avatarFromUserProfile = userProfile?.avatar_url || null
        const avatarFromCoach = (coach as any)?.avatar_url || null
        const avatarFromAuth = (user as any)?.user_metadata?.avatar_url || null
        const resolvedAvatar =
          avatarFromUserProfile ||
          avatarFromCoach ||
          avatarFromAuth ||
          null

        // Calcular edad si hay fecha de nacimiento
        const computeAge = (birth?: string | null) => {
          if (!birth) return null
          const d = new Date(birth)
          if (Number.isNaN(d.getTime())) return null
          const today = new Date()
          let age = today.getFullYear() - d.getFullYear()
          const m = today.getMonth() - d.getMonth()
          if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--
          return age
        }

        // Contar certificaciones desde coach_certifications (incluye no verificadas)
        let certificationsCount = 0
        try {
          const { count: certCount, error: certError } = await supabase
            .from('coach_certifications')
            .select('id', { count: 'exact', head: true })
            .eq('coach_id', user.id)

          if (!certError) {
            certificationsCount = certCount || 0
          }
        } catch {
          // noop
        }

        // Combinar datos del perfil
        const coachProfile: CoachProfile = {
          id: coach.id,
          full_name: userProfile?.full_name || coach.full_name || 'Coach',
          bio: coach.bio || null,
          specialization: coach.specialization || null,
          experience_years: coach.experience_years || null,
          avatar_url: resolvedAvatar,
          rating: stats?.avg_rating || 0,
          total_reviews: stats?.total_reviews || 0,
          certifications: coach.certifications || [],
          hourly_rate: coach.hourly_rate || 0,
          location: coach.location || null,
          birth_date: coach.birth_date || null,
          age_years: computeAge(coach.birth_date || null),
          certifications_count: certificationsCount,
          total_sales: null
        }

        setProfile(coachProfile)

        // Obtener datos de ganancias (últimos 30 días) + breakdown real por tipo
        try {
          const billingResponse = await fetch(`/api/coach/billing?days=30`)
          if (billingResponse.ok) {
            const billingData = await billingResponse.json()
            setEarningsData({
              totalIncome: billingData.totalIncome || 0,
              totalCommission: billingData.totalCommission || 0,
              planFee: billingData.planFee || 0,
              earnings: billingData.earnings || 0
            })

            const breakdown = billingData.salesBreakdown || {}
            setSalesData({
              programs: Number(breakdown.programs || 0),
              workshops: Number(breakdown.workshops || 0),
              documents: Number(breakdown.documents || 0),
              consultations: Number(breakdown.consultations || 0),
            })

            const totalSalesRaw = Number((billingData as any)?.totalSales)
            const safeTotalSales = Number.isFinite(totalSalesRaw) ? totalSalesRaw : 0
            setProfile((prev) => (prev ? { ...prev, total_sales: safeTotalSales } : prev))
          }
        } catch (earningsError) {
          console.error('Error cargando datos de ganancias:', earningsError)
          // Continuar sin datos de ganancias si hay error
        }

        // Obtener actividades recientes (simulado por ahora)
        // TODO: Implementar consultas reales a las tablas de actividades
        const mockRecentActivities: RecentActivity[] = [
          {
            id: '1',
            type: 'sale',
            title: 'Juan compró "Plan Premium"',
            description: 'Plan de entrenamiento personalizado de 12 meses',
            amount: '$299',
            timestamp: '2024-01-15T10:30:00Z',
            client_name: 'Juan Pérez'
          },
          {
            id: '2',
            type: 'consultation',
            title: 'María agendó videollamada',
            description: 'Consulta nutricional - Mañana 10:00',
            timestamp: '2024-01-15T09:15:00Z',
            client_name: 'María García'
          },
          {
            id: '3',
            type: 'client',
            title: 'Pedro se inscribió en "Rutina Avanzada"',
            description: 'Nuevo cliente en programa de fuerza',
            timestamp: '2024-01-14T16:45:00Z',
            client_name: 'Pedro Rodríguez'
          },
          {
            id: '4',
            type: 'sale',
            title: 'Ana compró "Documento Nutricional"',
            description: 'Guía de alimentación saludable',
            amount: '$49',
            timestamp: '2024-01-14T14:20:00Z',
            client_name: 'Ana López'
          },
          {
            id: '5',
            type: 'consultation',
            title: 'Carlos agendó mensaje',
            description: 'Consulta sobre técnica de ejercicio',
            timestamp: '2024-01-14T11:30:00Z',
            client_name: 'Carlos Martínez'
          }
        ]
        setRecentActivities(mockRecentActivities)

      } catch (err) {
        console.error('Error in fetchCoachData:', err)
        setError('Error al cargar datos del coach')
      } finally {
        setLoading(false)
      }
    }

    fetchCoachData()
  }, [user?.id, user?.level, supabase])

  return {
    profile,
    salesData,
    earningsData,
    recentActivities,
    loading,
    error,
    refetch: () => {
      if (user?.id) {
        setLoading(true)
        // Re-ejecutar fetchCoachData
        const fetchCoachData = async () => {
          // ... (mismo código de arriba)
        }
        fetchCoachData()
      }
    }
  }
}
