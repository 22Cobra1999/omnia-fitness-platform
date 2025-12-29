"use client"

import { useState, useEffect } from "react"
import { createClient } from '@/lib/supabase/supabase-client'

interface ClientMetrics {
  calories: {
    current: number
    target: number
    percentage: number
  }
  duration: {
    current: number // en minutos
    target: number
    percentage: number
  }
  exercises: {
    current: number
    target: number
    percentage: number
  }
  // Métricas adicionales
  weekly: {
    totalCalories: number
    totalMinutes: number
    totalExercises: number
    activeDays: number
  }
}

interface WeeklyData {
  date: string
  sessions: number
  minutes: number
  kcal: number
  exercises: number
  target: number
  kcalTarget: number
  minutesTarget: number
}

type DailySummaryRow = {
  fecha: string
  cliente_id: string
  platos_objetivo: number
  platos_completados: number
  platos_pendientes: number
  nutri_kcal: number
  nutri_kcal_objetivo: number
  nutri_mins: number
  nutri_mins_objetivo: number
  ejercicios_objetivo: number
  ejercicios_completados: number
  ejercicios_pendientes: number
  fitness_kcal: number
  fitness_kcal_objetivo: number
  fitness_mins: number
  fitness_mins_objetivo: number
}

export function useClientMetrics(clientId?: string, category?: 'fitness' | 'nutricion', weekAnchorDate?: Date) {
  const [metrics, setMetrics] = useState<ClientMetrics>({
    calories: { current: 0, target: 500, percentage: 0 }, // Meta dinámica desde compras
    duration: { current: 0, target: 60, percentage: 0 }, // Meta dinámica desde compras
    exercises: { current: 0, target: 3, percentage: 0 }, // Meta dinámica desde compras
    weekly: {
      totalCalories: 0,
      totalMinutes: 0,
      totalExercises: 0,
      activeDays: 0
    }
  })
  
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([])
  const [loading, setLoading] = useState(true)
  const [weekSummary, setWeekSummary] = useState<DailySummaryRow[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (clientId) {
      fetchClientMetrics(clientId, category, weekAnchorDate)
    }
  }, [clientId, weekAnchorDate?.toISOString()])

  useEffect(() => {
    if (!clientId || weekSummary.length === 0) return

    // Recalcular métricas cuando cambia el toggle (sin refetch)
    try {
      const weeklyMetrics: WeeklyData[] = []
      let weeklyCalories = 0
      let weeklyCaloriesTarget = 0
      let weeklyMinutes = 0
      let weeklyMinutesTarget = 0
      let weeklyItemsCompleted = 0
      let weeklyItemsTarget = 0

      weekSummary.slice(0, 7).forEach((r: DailySummaryRow) => {
        const itemsCompleted = category === 'nutricion' ? (Number(r.platos_completados) || 0) : (Number(r.ejercicios_completados) || 0)
        const itemsTarget = category === 'nutricion' ? (Number(r.platos_objetivo) || 0) : (Number(r.ejercicios_objetivo) || 0)
        const kcal = category === 'nutricion' ? (Number(r.nutri_kcal) || 0) : (Number(r.fitness_kcal) || 0)
        const kcalTarget = category === 'nutricion' ? (Number(r.nutri_kcal_objetivo) || 0) : (Number(r.fitness_kcal_objetivo) || 0)
        const minutes = category === 'nutricion' ? (Number(r.nutri_mins) || 0) : (Number(r.fitness_mins) || 0)
        const minutesTarget = category === 'nutricion' ? (Number(r.nutri_mins_objetivo) || 0) : (Number(r.fitness_mins_objetivo) || 0)

        weeklyCalories += kcal
        weeklyCaloriesTarget += kcalTarget
        weeklyMinutes += minutes
        weeklyMinutesTarget += minutesTarget
        weeklyItemsCompleted += itemsCompleted
        weeklyItemsTarget += itemsTarget

        weeklyMetrics.push({
          date: r.fecha,
          sessions: itemsCompleted,
          minutes,
          kcal,
          exercises: itemsCompleted,
          target: itemsTarget,
          kcalTarget,
          minutesTarget
        })
      })

      const activeDays = weeklyMetrics.filter(day => day.sessions > 0).length

      const safeWeeklyKcalTarget = weeklyCaloriesTarget > 0 ? weeklyCaloriesTarget : 1
      const safeWeeklyMinutesTarget = weeklyMinutesTarget > 0 ? weeklyMinutesTarget : 1
      const safeWeeklyItemsTarget = weeklyItemsTarget > 0 ? weeklyItemsTarget : 1

      setMetrics({
        calories: {
          current: weeklyCalories,
          target: weeklyCaloriesTarget,
          percentage: Math.min((weeklyCalories / safeWeeklyKcalTarget) * 100, 100)
        },
        duration: {
          current: weeklyMinutes,
          target: weeklyMinutesTarget,
          percentage: Math.min((weeklyMinutes / safeWeeklyMinutesTarget) * 100, 100)
        },
        exercises: {
          current: weeklyItemsCompleted,
          target: weeklyItemsTarget,
          percentage: Math.min((weeklyItemsCompleted / safeWeeklyItemsTarget) * 100, 100)
        },
        weekly: {
          totalCalories: weeklyCalories,
          totalMinutes: weeklyMinutes,
          totalExercises: weeklyItemsCompleted,
          activeDays
        }
      })

      setWeeklyData(weeklyMetrics)
    } catch (e) {
      console.error('❌ Error recalculando métricas (toggle sin refetch):', e)
    }
  }, [clientId, category, weekSummary])

  const fetchClientMetrics = async (clientId: string, category?: 'fitness' | 'nutricion', weekAnchorDate?: Date) => {
    try {
      setLoading(true)

      const toLocalDateString = (d: Date) => {
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }

      const parseRecordDate = (raw: any) => {
        if (!raw) return null

        // IMPORTANT: new Date('YYYY-MM-DD') is parsed as UTC, which shifts the day in UTC-03.
        // Treat date-only strings as LOCAL dates.
        if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
          const [y, m, d] = raw.split('-').map(Number)
          const local = new Date(y, (m || 1) - 1, d || 1)
          return isNaN(local.getTime()) ? null : local
        }

        const d = new Date(raw)
        return isNaN(d.getTime()) ? null : d
      }
      
      // Obtener fecha de inicio de la semana (lunes) en zona horaria local
      const anchor = weekAnchorDate ? new Date(weekAnchorDate) : new Date()
      const startOfWeek = new Date(anchor)
      const day = anchor.getDay()
      const diff = anchor.getDate() - day + (day === 0 ? -6 : 1) // Ajustar para que lunes sea 1
      startOfWeek.setDate(diff)
      startOfWeek.setHours(0, 0, 0, 0)
      
      // Obtener fecha de fin de la semana (domingo) en zona horaria local
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      endOfWeek.setHours(23, 59, 59, 999)

      console.log('🧿 [RINGS][METRICS] Iniciando cálculo métricas:', {
        clientId,
        category: category || 'fitness',
        weekStart: startOfWeek.toISOString(),
        weekEnd: endOfWeek.toISOString()
      })

      const startDateStr = toLocalDateString(startOfWeek)
      const endDateStr = toLocalDateString(endOfWeek)

      // Una sola query: traer la semana completa desde progreso_cliente_daily_summary
      const response = await fetch(
        `/api/client/progress-summary?cliente_id=${clientId}&start_date=${startDateStr}&end_date=${endDateStr}`
      )
      if (!response.ok) {
        throw new Error('Error obteniendo resumen de progreso')
      }
      const { data: progressSummary } = await response.json()

      setWeekSummary(progressSummary || [])

      console.log('🧿 [RINGS][METRICS] progressSummary recibido:', {
        clientId,
        category: category || 'fitness',
        totalRecords: progressSummary?.length || 0,
        sample: progressSummary?.[0]
      })

      const weekData: DailySummaryRow[] = (progressSummary || [])

      // Calcular métricas semanal + por día desde daily_summary (sin recomputar JSONs)
      const weeklyMetrics: WeeklyData[] = []
      let weeklyCalories = 0
      let weeklyCaloriesTarget = 0
      let weeklyMinutes = 0
      let weeklyMinutesTarget = 0
      let weeklyItemsCompleted = 0
      let weeklyItemsTarget = 0

      weekData.slice(0, 7).forEach((r: DailySummaryRow) => {
        const itemsCompleted = category === 'nutricion' ? (Number(r.platos_completados) || 0) : (Number(r.ejercicios_completados) || 0)
        const itemsTarget = category === 'nutricion' ? (Number(r.platos_objetivo) || 0) : (Number(r.ejercicios_objetivo) || 0)
        const kcal = category === 'nutricion' ? (Number(r.nutri_kcal) || 0) : (Number(r.fitness_kcal) || 0)
        const kcalTarget = category === 'nutricion' ? (Number(r.nutri_kcal_objetivo) || 0) : (Number(r.fitness_kcal_objetivo) || 0)
        const minutes = category === 'nutricion' ? (Number(r.nutri_mins) || 0) : (Number(r.fitness_mins) || 0)
        const minutesTarget = category === 'nutricion' ? (Number(r.nutri_mins_objetivo) || 0) : (Number(r.fitness_mins_objetivo) || 0)

        weeklyCalories += kcal
        weeklyCaloriesTarget += kcalTarget
        weeklyMinutes += minutes
        weeklyMinutesTarget += minutesTarget
        weeklyItemsCompleted += itemsCompleted
        weeklyItemsTarget += itemsTarget

        weeklyMetrics.push({
          date: r.fecha,
          sessions: itemsCompleted,
          minutes,
          kcal,
          exercises: itemsCompleted,
          target: itemsTarget,
          kcalTarget,
          minutesTarget
        })
      })

      const activeDays = weeklyMetrics.filter(day => day.sessions > 0).length

      const safeWeeklyKcalTarget = weeklyCaloriesTarget > 0 ? weeklyCaloriesTarget : 1
      const safeWeeklyMinutesTarget = weeklyMinutesTarget > 0 ? weeklyMinutesTarget : 1
      const safeWeeklyItemsTarget = weeklyItemsTarget > 0 ? weeklyItemsTarget : 1
      
      setMetrics({
        calories: {
          current: weeklyCalories,
          target: weeklyCaloriesTarget,
          percentage: Math.min((weeklyCalories / safeWeeklyKcalTarget) * 100, 100)
        },
        duration: {
          current: weeklyMinutes,
          target: weeklyMinutesTarget,
          percentage: Math.min((weeklyMinutes / safeWeeklyMinutesTarget) * 100, 100)
        },
        exercises: {
          current: weeklyItemsCompleted,
          target: weeklyItemsTarget,
          percentage: Math.min((weeklyItemsCompleted / safeWeeklyItemsTarget) * 100, 100)
        },
        weekly: {
          totalCalories: weeklyCalories,
          totalMinutes: weeklyMinutes,
          totalExercises: weeklyItemsCompleted,
          activeDays: activeDays
        }
      })

      console.log('🧿 [RINGS][METRICS] Totales semanales calculados:', {
        clientId,
        category: category || 'fitness',
        totals: {
          kcal: weeklyCalories,
          kcalTarget: weeklyCaloriesTarget,
          minutes: weeklyMinutes,
          minutesTarget: weeklyMinutesTarget,
          itemsCompleted: weeklyItemsCompleted,
          itemsTarget: weeklyItemsTarget,
          activeDays
        }
      })

      setWeeklyData(weeklyMetrics)

    } catch (error) {
      console.error('❌ Error calculando métricas del cliente:', error)
    } finally {
      setLoading(false)
    }
  }

  return {
    metrics,
    weeklyData,
    weekSummary,
    loading,
    refetch: () => clientId && fetchClientMetrics(clientId, category, weekAnchorDate)
  }
}







