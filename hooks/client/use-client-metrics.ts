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
}

export function useClientMetrics(clientId?: string, category?: 'fitness' | 'nutricion') {
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
      fetchClientMetrics(clientId, category)
    }
  }, [clientId, category])

  const fetchClientMetrics = async (clientId: string, category?: 'fitness' | 'nutricion') => {
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

      // Usar el nuevo endpoint que replica la query SQL
      const response = await fetch(`/api/client/progress-summary?cliente_id=${clientId}${category ? `&categoria=${category}` : ''}`)
      if (!response.ok) {
        throw new Error('Error obteniendo resumen de progreso')
      }
      const { data: progressSummary } = await response.json()

      // Filtrar por semana actual
      const weekStartStr = startOfWeek.toISOString().split('T')[0]
      const weekEndStr = endOfWeek.toISOString().split('T')[0]
      const weekData = progressSummary.filter((record: any) => 
        record.fecha >= weekStartStr && record.fecha <= weekEndStr
      )

      console.log('📊 Progreso encontrado:', {
        total: progressSummary?.length || 0,
        semana: weekData.length,
        fechas: [...new Set(weekData.map((r: any) => r.fecha))],
        sample: weekData[0]
      })


      // 2. Calcular métricas semanales totales desde los datos del resumen
      let weeklyExerciseCount = 0
      let weeklyCalories = 0
      let weeklyDuration = 0

      weekData.forEach((record: any) => {
        // Sumar ejercicios (para fitness) o platos (para nutrición)
        if (category === 'fitness') {
          weeklyExerciseCount += Number(record.ejercicios) || 0
        } else if (category === 'nutricion') {
          weeklyExerciseCount += Number(record.platos) || 0
        } else {
          // Sin filtro: sumar ambos
          weeklyExerciseCount += Number(record.ejercicios) || 0
          weeklyExerciseCount += Number(record.platos) || 0
        }

        // Sumar minutos (solo fitness tiene minutos)
        weeklyDuration += Number(record.minutos) || 0

        // Sumar calorías (tanto fitness como nutrición tienen calorías)
        weeklyCalories += Number(record.calorias) || 0
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
        const dayDate = weekDates[i]
        
        // Agrupar registros por fecha (puede haber múltiples registros del mismo día si hay fitness y nutrición)
        const dayRecords = weekData.filter((record: any) => record.fecha === dayDate)

        let dayExerciseCount = 0
        let dayCalories = 0
        let dayDuration = 0

        // Sumar todos los registros del día según el filtro
        dayRecords.forEach((record: any) => {
          if (category === 'fitness') {
            // Solo sumar si es fitness
            if (record.tipo === 'fitness') {
              dayExerciseCount += Number(record.ejercicios) || 0
              dayDuration += Number(record.minutos) || 0
              dayCalories += Number(record.calorias) || 0
            }
          } else if (category === 'nutricion') {
            // Solo sumar si es nutrición
            if (record.tipo === 'nutricion') {
              dayExerciseCount += Number(record.platos) || 0
              dayCalories += Number(record.calorias) || 0
            }
          } else {
            // Sin filtro: sumar ambos tipos
            if (record.tipo === 'fitness') {
              dayExerciseCount += Number(record.ejercicios) || 0
              dayDuration += Number(record.minutos) || 0
            } else {
              dayExerciseCount += Number(record.platos) || 0
            }
            dayCalories += Number(record.calorias) || 0
          }
        })

        weeklyMetrics.push({
          date: dayDate,
          sessions: dayExerciseCount,
          minutes: dayDuration,
          kcal: dayCalories,
          exercises: dayExerciseCount
        })
      }

      // 5. Calcular días activos
      const activeDays = weeklyMetrics.filter(day => day.sessions > 0).length

      // Log limpio: Solo días con actividad
      const daysWithActivity = weeklyMetrics.filter(day => day.exercises > 0)
      if (daysWithActivity.length > 0) {
        console.log('📅 Días con ejercicios completados:')
        daysWithActivity.forEach(day => {
          console.log(`  ${day.date}: ${day.exercises} ejercicios ✅`)
        })
      } else {
        console.log('📅 No hay ejercicios completados esta semana')
      }

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
    refetch: () => clientId && fetchClientMetrics(clientId, category)
  }
}







