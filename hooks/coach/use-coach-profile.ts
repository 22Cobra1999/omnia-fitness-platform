"use client"

import { useState, useEffect, useCallback } from 'react'
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
  country?: string | null
  city?: string | null
  neighborhood?: string | null
}

interface SalesData {
  programs: number
  workshops: number
  documents: number
  consultations: number
  others: number
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
    consultations: 0,
    others: 0
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

  const fetchCoachData = useCallback(async () => {
    if (!user?.id || user.level !== 'coach') {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Obtener perfil del coach
      const { data: coach, error: coachError } = await supabase
        .from('coaches')
        .select('*, coach_contact_info(*)')
        .eq('id', user.id)
        .single()

      if (coachError) {
        console.error('Error fetching coach profile:', coachError)
        setError('Error al cargar perfil del coach')
        return
      }
      console.log('📬 Coach Data Fetched:', { 
        id: coach.id, 
        hasContact: !!coach.coach_contact_info,
        contact: coach.coach_contact_info?.[0]
      })

      console.log('📬 Coach Raw Data:', coach)
      
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

      // Intentar obtener avatar desde múltiples fuentes
      const avatarFromUserProfile = userProfile?.avatar_url || null
      const avatarFromCoach = (coach as any)?.avatar_url || null
      const avatarFromAuth = (user as any)?.user_metadata?.avatar_url || null
      const resolvedAvatar = avatarFromUserProfile || avatarFromCoach || avatarFromAuth || null

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

      let certificationsCount = 0
      try {
        const { count: certCount, error: certError } = await supabase
          .from('coach_certifications')
          .select('id', { count: 'exact', head: true })
          .eq('coach_id', user.id)

        if (!certError) {
          certificationsCount = certCount || 0
        }
      } catch {}

      const contactInfoRaw = (coach as any).coach_contact_info
      const contactInfo = Array.isArray(contactInfoRaw) ? contactInfoRaw[0] : contactInfoRaw || {}

      console.log('🔍 MAPPING COACH PROFILE:', { 
        id: coach.id, 
        locationFromContact: contactInfo.location,
        country: contactInfo.country,
        city: contactInfo.city,
        neighborhood: contactInfo.neighborhood,
        locationFromCoach: coach.location 
      })

      const coachProfile: CoachProfile = {
        id: coach.id,
        full_name: userProfile?.full_name || coach.full_name || 'Coach',
        bio: coach.bio || null,
        specialization: coach.specialization || null,
        experience_years: coach.experience_years ?? null,
        avatar_url: resolvedAvatar,
        rating: stats?.avg_rating || 0,
        total_reviews: stats?.total_reviews || 0,
        certifications: coach.certifications || [],
        hourly_rate: coach.hourly_rate || 0,
        location: contactInfo.location || coach.location || null,
        country: contactInfo.country || null,
        city: contactInfo.city || null,
        neighborhood: contactInfo.neighborhood || null,
        birth_date: contactInfo.birth_date || coach.birth_date || null,
        age_years: computeAge(contactInfo.birth_date || coach.birth_date || null),
        certifications_count: certificationsCount,
        total_sales: null
      }

      setProfile(coachProfile)

      // Obtener ganancias y actividades
      try {
        const billingResponse = await fetch(`/api/coach/billing?days=all`)
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
            others: Number(breakdown.others || 0),
          })

          const totalSalesRaw = Number((billingData as any)?.totalSales)
          const safeTotalSales = Number.isFinite(totalSalesRaw) ? totalSalesRaw : 0
          setProfile((prev) => (prev ? { ...prev, total_sales: safeTotalSales } : prev))

          if (billingData.invoices && Array.isArray(billingData.invoices)) {
            const activities = billingData.invoices.map((inv: any) => ({
              id: inv.id,
              type: 'sale',
              title: inv.concept || 'Actividad',
              description: `Venta realizada el ${new Date(inv.date).toLocaleDateString('es-AR')}`,
              amount: `$${inv.amount?.toLocaleString('es-AR')}`,
              timestamp: inv.date,
              client_name: inv.clientName || 'Cliente'
            }))
            setRecentActivities(activities)
          }
        }
      } catch (earningsError) {
        console.error('Error loading earnings:', earningsError)
      }
    } catch (err) {
      console.error('Error in fetchCoachData:', err)
      setError('Error al cargar datos del coach')
    } finally {
      setLoading(false)
    }
  }, [user?.id, user?.level, supabase])

  useEffect(() => {
    fetchCoachData()
  }, [fetchCoachData])

  return {
    profile,
    salesData,
    earningsData,
    recentActivities,
    loading,
    error,
    refetch: fetchCoachData
  }
}
