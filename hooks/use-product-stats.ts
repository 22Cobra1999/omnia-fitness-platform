"use client"

import { useState, useEffect } from 'react'

interface ProductStats {
  totalSessions: number
  totalExercises: number
  totalWeeks: number
  totalPeriods: number
}

export function useProductStats(activityId: number | string): { stats: ProductStats; loading: boolean } {
  const [stats, setStats] = useState<ProductStats>({
    totalSessions: 0,
    totalExercises: 0,
    totalWeeks: 0,
    totalPeriods: 0
  })
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (!activityId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // Simular carga de estadísticas
        await new Promise(resolve => setTimeout(resolve, 100))

        // Valores por defecto para la actividad 78
        if (activityId === 78) {
          setStats({
            totalSessions: 8, // 8 sesiones por período
            totalExercises: 24, // 24 ejercicios totales
            totalWeeks: 2, // 2 semanas por período
            totalPeriods: 3, // 3 períodos
          })
        } else {
          // Valores por defecto para otras actividades
          setStats({
            totalSessions: 0,
            totalExercises: 0,
            totalWeeks: 0,
            totalPeriods: 0,
          })
        }
      } catch (error) {
        console.error('Error fetching product stats:', error)
        setStats({
          totalSessions: 0,
          totalExercises: 0,
          totalWeeks: 0,
          totalPeriods: 0,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [activityId])

  return { stats, loading }
}
