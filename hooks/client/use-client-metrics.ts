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


      // 1. Obtener progreso del cliente esta semana - NUEVA TABLA progreso_cliente
      const { data: progressRecords, error: progressError } = await supabase
        .from('progreso_cliente')
        .select('id, fecha, ejercicios_completados, minutos_json, calorias_json')
        .eq('cliente_id', clientId)
        .gte('fecha', startOfWeek.toISOString().split('T')[0])
        .lte('fecha', endOfWeek.toISOString().split('T')[0])

      if (progressError) {
        console.error('❌ Error obteniendo progreso del cliente:', progressError)
        setLoading(false)
        return
      }

      console.log('📊 Progreso encontrado:', {
        total: progressRecords?.length || 0,
        fechas: progressRecords?.map(r => r.fecha),
        sample: progressRecords?.[0]
      })


      // 2. Calcular métricas semanales totales desde progreso_cliente
      let weeklyExerciseCount = 0
      let weeklyCalories = 0
      let weeklyDuration = 0

      progressRecords?.forEach(record => {
        try {
          // Contar ejercicios completados
          const completedExercises = record.ejercicios_completados 
            ? (typeof record.ejercicios_completados === 'string' 
                ? JSON.parse(record.ejercicios_completados) 
                : record.ejercicios_completados)
            : {}
          
          // Manejar tanto arrays como objetos
          if (Array.isArray(completedExercises)) {
            weeklyExerciseCount += completedExercises.length
          } else if (typeof completedExercises === 'object' && completedExercises !== null) {
            // Contar keys del objeto (ejercicios completados)
            weeklyExerciseCount += Object.keys(completedExercises).length
          }

          // Sumar calorías desde calorias_json
          if (record.calorias_json) {
            const caloriasObj = typeof record.calorias_json === 'string'
              ? JSON.parse(record.calorias_json)
              : record.calorias_json
            Object.values(caloriasObj).forEach((cal: any) => {
              weeklyCalories += Number(cal) || 0
            })
          }

          // Sumar minutos desde minutos_json
          if (record.minutos_json) {
            const minutosObj = typeof record.minutos_json === 'string'
              ? JSON.parse(record.minutos_json)
              : record.minutos_json
            Object.values(minutosObj).forEach((min: any) => {
              weeklyDuration += Number(min) || 0
            })
          }
        } catch (err) {
          console.error('❌ Error parseando JSON de progreso:', err, record)
        }
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
        
        // Buscar registro de progreso para este día
        const dayProgress = progressRecords?.find(record => record.fecha === dayDate)

        let dayExerciseCount = 0
        let dayCalories = 0
        let dayDuration = 0

        if (dayProgress) {
          try {
            // Contar ejercicios completados
            const completedExercises = dayProgress.ejercicios_completados 
              ? (typeof dayProgress.ejercicios_completados === 'string'
                  ? JSON.parse(dayProgress.ejercicios_completados)
                  : dayProgress.ejercicios_completados)
              : {}
            
            // Manejar tanto arrays como objetos
            if (Array.isArray(completedExercises)) {
              dayExerciseCount = completedExercises.length
            } else if (typeof completedExercises === 'object' && completedExercises !== null) {
              // Contar keys del objeto (ejercicios completados)
              dayExerciseCount = Object.keys(completedExercises).length
            }

            // Sumar calorías desde calorias_json
            if (dayProgress.calorias_json) {
              const caloriasObj = typeof dayProgress.calorias_json === 'string'
                ? JSON.parse(dayProgress.calorias_json)
                : dayProgress.calorias_json
              Object.values(caloriasObj).forEach((cal: any) => {
                dayCalories += Number(cal) || 0
              })
            }

            // Sumar minutos desde minutos_json
            if (dayProgress.minutos_json) {
              const minutosObj = typeof dayProgress.minutos_json === 'string'
                ? JSON.parse(dayProgress.minutos_json)
                : dayProgress.minutos_json
              Object.values(minutosObj).forEach((min: any) => {
                dayDuration += Number(min) || 0
              })
            }
          } catch (err) {
            console.error(`❌ Error parseando JSON para ${dayDate}:`, err)
          }
        }

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
    refetch: () => clientId && fetchClientMetrics(clientId)
  }
}







