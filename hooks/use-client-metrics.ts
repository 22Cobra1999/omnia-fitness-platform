"use client"

import { useState, useEffect } from "react"
import { createClient } from '@/lib/supabase-browser'

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
}

export function useClientMetrics(clientId?: string) {
  const [metrics, setMetrics] = useState<ClientMetrics>({
    calories: { current: 0, target: 3500, percentage: 0 }, // Meta semanal: 500 kcal/día * 7 días
    duration: { current: 0, target: 420, percentage: 0 }, // Meta semanal: 60 min/día * 7 días
    exercises: { current: 0, target: 21, percentage: 0 }, // Meta semanal: 3 ejercicios/día * 7 días
    weekly: {
      totalCalories: 0,
      totalMinutes: 0,
      totalExercises: 0,
      activeDays: 0
    }
  })
  
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (clientId) {
      fetchClientMetrics(clientId)
    }
  }, [clientId])

  const fetchClientMetrics = async (clientId: string) => {
    try {
      setLoading(true)
      
      // Obtener fecha de inicio de la semana (lunes) en zona horaria local
      const today = new Date()
      const startOfWeek = new Date(today)
      const day = today.getDay()
      const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Ajustar para que lunes sea 1
      startOfWeek.setDate(diff)
      startOfWeek.setHours(0, 0, 0, 0)
      
      // Obtener fecha de fin de la semana (domingo) en zona horaria local
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      endOfWeek.setHours(23, 59, 59, 999)

      // Convertir a UTC para la consulta
      const startOfWeekUTC = new Date(startOfWeek.getTime() - startOfWeek.getTimezoneOffset() * 60000)
      const endOfWeekUTC = new Date(endOfWeek.getTime() - endOfWeek.getTimezoneOffset() * 60000)

      console.log('📅 Calculando métricas para la semana:', {
        startOfWeek: startOfWeek.toISOString(),
        endOfWeek: endOfWeek.toISOString(),
        startOfWeekUTC: startOfWeekUTC.toISOString(),
        endOfWeekUTC: endOfWeekUTC.toISOString(),
        timezoneOffset: startOfWeek.getTimezoneOffset()
      })

      // 1. Obtener ejecuciones completadas esta semana - ESQUEMA CORREGIDO

      const { data: completedExecutions, error: executionsError } = await supabase
        .from('ejecuciones_ejercicio')
        .select(`
          id,
          completado,
          fecha_ejercicio,
          completed_at,
          periodo_id,
          ejercicio_id,
          ejercicios_detalles!inner(
            id,
            activity_id
          )
        `)
        .eq('client_id', clientId)
        .eq('completado', true)
        .not('completed_at', 'is', null)
        .gte('completed_at', startOfWeekUTC.toISOString())
        .lte('completed_at', endOfWeekUTC.toISOString())

      if (executionsError) {
        console.error('❌ Error obteniendo ejecuciones completadas:', executionsError)
        setLoading(false)
        return
      }

      console.log('💪 Ejecuciones completadas esta semana:', completedExecutions?.length || 0)

      // 2. Calcular métricas semanales totales - NUEVO ESQUEMA
      // Estimación de calorías y duración (30 min promedio por ejercicio, 10 kcal por minuto)
      const weeklyCalories = completedExecutions?.reduce((sum, ex) => sum + (30 * 10), 0) || 0
      const weeklyDuration = completedExecutions?.reduce((sum, ex) => sum + 30, 0) || 0
      const weeklyExerciseCount = completedExecutions?.length || 0

      console.log('📊 Métricas semanales:', {
        calories: weeklyCalories,
        duration: weeklyDuration,
        exercises: weeklyExerciseCount
      })

      // 4. Calcular datos semanales por día - CORREGIDO PARA USAR FECHA_EJERCICIO
      const weeklyMetrics: WeeklyData[] = []
      const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
      
      // Calcular fechas de la semana actual
      const weekDates: string[] = []
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek)
        date.setDate(startOfWeek.getDate() + i)
        weekDates.push(date.toISOString().split('T')[0])
      }
      
      for (let i = 0; i < 7; i++) {
        const dayAbbr = daysOfWeek[i]
        const dayDate = weekDates[i]
        
        // Filtrar ejecuciones por fecha_ejercicio
        const dayExecutions = completedExecutions?.filter(ex => {
          return ex.fecha_ejercicio === dayDate
        }) || []

        console.log(`🔍 Filtrando ${dayAbbr} (${dayDate}):`, {
          totalExecutions: completedExecutions?.length || 0,
          dayExecutions: dayExecutions.length,
          sampleFechaEjercicio: completedExecutions?.[0]?.fecha_ejercicio
        })

        // Estimación de calorías y duración (30 min promedio por ejercicio, 10 kcal por minuto)
        const dayCalories = dayExecutions.reduce((sum, ex) => sum + (30 * 10), 0)
        const dayDuration = dayExecutions.reduce((sum, ex) => sum + 30, 0)
        const dayExerciseCount = dayExecutions.length

        weeklyMetrics.push({
          date: dayDate, // Usar fecha real en lugar de día de semana
          sessions: dayExerciseCount,
          minutes: dayDuration,
          kcal: dayCalories,
          exercises: dayExerciseCount
        })
      }

      // 5. Calcular días activos
      const activeDays = weeklyMetrics.filter(day => day.sessions > 0).length

      // 6. Actualizar estado con métricas semanales
      setMetrics({
        calories: {
          current: weeklyCalories,
          target: 3500, // Meta semanal: 500 kcal/día * 7 días
          percentage: Math.min((weeklyCalories / 3500) * 100, 100)
        },
        duration: {
          current: weeklyDuration,
          target: 420, // Meta semanal: 60 min/día * 7 días
          percentage: Math.min((weeklyDuration / 420) * 100, 100)
        },
        exercises: {
          current: weeklyExerciseCount,
          target: 21, // Meta semanal: 3 ejercicios/día * 7 días
          percentage: Math.min((weeklyExerciseCount / 21) * 100, 100)
        },
        weekly: {
          totalCalories: weeklyCalories,
          totalMinutes: weeklyDuration,
          totalExercises: weeklyExerciseCount,
          activeDays: activeDays
        }
      })

      setWeeklyData(weeklyMetrics)
      
      console.log('✅ Métricas calculadas:', {
        weekly: { calories: weeklyCalories, duration: weeklyDuration, exercises: weeklyExerciseCount, activeDays },
        dailyBreakdown: weeklyMetrics
      })
      
      console.log('📊 Datos semanales detallados:')
      weeklyMetrics.forEach((day, index) => {
        console.log(`  ${day.date}:`, {
          sessions: day.sessions,
          minutes: day.minutes,
          kcal: day.kcal,
          exercises: day.exercises
        })
      })

    } catch (error) {
      console.error('❌ Error calculando métricas del cliente:', error)
    } finally {
      setLoading(false)
    }
  }

  return {
    metrics,
    weeklyData,
    loading,
    refetch: () => clientId && fetchClientMetrics(clientId)
  }
}







