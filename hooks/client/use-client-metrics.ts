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
}

export function useClientMetrics(clientId?: string, category?: 'fitness' | 'nutricion') {
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
  const supabase = createClient()

  useEffect(() => {
    if (clientId) {
      fetchClientMetrics(clientId, category)
    }
  }, [clientId, category])

  const fetchClientMetrics = async (clientId: string, category?: 'fitness' | 'nutricion') => {
    try {
      setLoading(true)
      
      // Obtener metas dinámicas desde compras del cliente
      const targetsResponse = await fetch(`/api/client/targets?category=${category || 'fitness'}`)
      let dynamicTargets = { kcal: 500, minutes: 60, exercises: 3, plates: 4 }
      
      if (targetsResponse.ok) {
        const { targets } = await targetsResponse.json()
        dynamicTargets = targets
        console.log('🎯 Metas dinámicas obtenidas:', dynamicTargets)
      } else {
        console.log('⚠️ Usando metas por defecto')
      }
      
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
      let weeklyItemsCompleted = 0
      let weeklyItemsTarget = 0
      let weeklyCalories = 0
      let weeklyDuration = 0

      weekData.forEach((record: any) => {
        const tipo = record.tipo
        const ejerciciosCompletados = Number(record.ejercicios) || 0
        const ejerciciosObjetivo = Number(record.ejercicios_objetivo) || 0
        const platosCompletados = Number(record.platos_completados) || 0
        const platosObjetivo = Number(record.platos_objetivo) || 0

        if (category === 'fitness') {
          weeklyItemsCompleted += ejerciciosCompletados
          weeklyItemsTarget += ejerciciosObjetivo
        } else if (category === 'nutricion') {
          weeklyItemsCompleted += platosCompletados
          weeklyItemsTarget += platosObjetivo
        } else {
          if (tipo === 'fitness') {
            weeklyItemsCompleted += ejerciciosCompletados
            weeklyItemsTarget += ejerciciosObjetivo
          } else {
            weeklyItemsCompleted += platosCompletados
            weeklyItemsTarget += platosObjetivo
          }
        }

        weeklyDuration += Number(record.minutos) || 0
        weeklyCalories += Number(record.calorias) || 0
      })

      // 4. Calcular datos semanales por día - PROCESAR DATOS DIRECTAMENTE
      const weeklyMetrics: WeeklyData[] = []
      const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
      
      console.log('📊 useClientMetrics: Procesando datos directamente sin filtrar por fecha')
      console.log('📊 useClientMetrics: Datos brutos recibidos:', progressSummary)
      
      // Debug: Mostrar estructura de datos crudos
      console.log('🔍 Debug: Estructura de datos crudos:')
      progressSummary.slice(0, 3).forEach((record: any, index: number) => {
        console.log(`  Registro ${index}:`, {
          fecha: record.fecha,
          tipo: record.tipo,
          ejercicios: record.ejercicios,
          platos: record.platos,
          minutos: record.minutos,
          calorias: record.calorias
        })
      })
      
      // 4. Datos semanales por día (Lun-Dom) agregando por fecha
      const byDate: Record<string, { itemsCompleted: number; itemsTarget: number; minutes: number; kcal: number }> = {}
      weekData.forEach((record: any) => {
        const dayDate = record.fecha as string
        if (!byDate[dayDate]) {
          byDate[dayDate] = { itemsCompleted: 0, itemsTarget: 0, minutes: 0, kcal: 0 }
        }

        const tipo = record.tipo
        const ejerciciosCompletados = Number(record.ejercicios) || 0
        const ejerciciosObjetivo = Number(record.ejercicios_objetivo) || 0
        const platosCompletados = Number(record.platos_completados) || 0
        const platosObjetivo = Number(record.platos_objetivo) || 0

        if (category === 'fitness') {
          byDate[dayDate].itemsCompleted += ejerciciosCompletados
          byDate[dayDate].itemsTarget += ejerciciosObjetivo
        } else if (category === 'nutricion') {
          byDate[dayDate].itemsCompleted += platosCompletados
          byDate[dayDate].itemsTarget += platosObjetivo
        } else {
          if (tipo === 'fitness') {
            byDate[dayDate].itemsCompleted += ejerciciosCompletados
            byDate[dayDate].itemsTarget += ejerciciosObjetivo
          } else {
            byDate[dayDate].itemsCompleted += platosCompletados
            byDate[dayDate].itemsTarget += platosObjetivo
          }
        }

        byDate[dayDate].minutes += Number(record.minutos) || 0
        byDate[dayDate].kcal += Number(record.calorias) || 0
      })

      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek)
        d.setDate(startOfWeek.getDate() + i)
        const dateStr = d.toISOString().split('T')[0]
        const dayAgg = byDate[dateStr] || { itemsCompleted: 0, itemsTarget: 0, minutes: 0, kcal: 0 }

        weeklyMetrics.push({
          date: dateStr,
          sessions: dayAgg.itemsCompleted,
          minutes: dayAgg.minutes,
          kcal: dayAgg.kcal,
          exercises: dayAgg.itemsCompleted,
          target: dayAgg.itemsTarget
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

      // 6. Targets semanales
      const weeklyKcalTarget = dynamicTargets.kcal * 7
      const weeklyMinutesTarget = dynamicTargets.minutes * 7
      const safeWeeklyItemsTarget = weeklyItemsTarget > 0 ? weeklyItemsTarget : 1
      
      setMetrics({
        calories: {
          current: weeklyCalories,
          target: weeklyKcalTarget,
          percentage: Math.min((weeklyCalories / weeklyKcalTarget) * 100, 100)
        },
        duration: {
          current: weeklyDuration,
          target: weeklyMinutesTarget,
          percentage: Math.min((weeklyDuration / weeklyMinutesTarget) * 100, 100)
        },
        exercises: {
          current: weeklyItemsCompleted,
          target: weeklyItemsTarget,
          percentage: Math.min((weeklyItemsCompleted / safeWeeklyItemsTarget) * 100, 100)
        },
        weekly: {
          totalCalories: weeklyCalories,
          totalMinutes: weeklyDuration,
          totalExercises: weeklyItemsCompleted,
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







