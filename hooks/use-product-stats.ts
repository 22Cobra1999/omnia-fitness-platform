"use client"

import { useState, useEffect } from 'react'

interface ProductStats {
  totalSessions: number
  totalExercises: number
  totalWeeks: number
  totalPeriods: number
  uniqueExercises: number
}

export function useProductStats(activityId: number | string): { stats: ProductStats; loading: boolean } {
  const [stats, setStats] = useState<ProductStats>({
    totalSessions: 0,
    totalExercises: 0,
    totalWeeks: 0,
    totalPeriods: 0,
    uniqueExercises: 0
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
        console.log('📊 useProductStats: Obteniendo estadísticas para actividad:', activityId)

        // ✅ Obtener datos reales de la API
        const response = await fetch(`/api/get-product-planning?actividad_id=${activityId}`)
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        console.log('📊 useProductStats: Datos obtenidos de la API:', data)
        console.log('🔍 useProductStats: data.success:', data.success)
        console.log('🔍 useProductStats: data.data:', data.data)

        if (data.success && data.data) {
          const newStats = {
            totalSessions: data.data.totalSessions || 0,
            totalExercises: data.data.uniqueExercises?.length || 0,
            totalWeeks: data.data.semanas || 0,
            totalPeriods: data.data.periods || 0,
            uniqueExercises: data.data.uniqueExercises?.length || 0
          }
          
          console.log('✅ useProductStats: Estadísticas que se van a establecer:', newStats)
          setStats(newStats)
          
          console.log('✅ useProductStats: Estadísticas actualizadas:', {
            totalSessions: data.data.totalSessions,
            uniqueExercises: data.data.uniqueExercises?.length,
            semanas: data.data.semanas,
            periods: data.data.periods
          })
        } else {
          console.log('⚠️ useProductStats: No hay datos de planificación disponibles')
          setStats({
            totalSessions: 0,
            totalExercises: 0,
            totalWeeks: 0,
            totalPeriods: 0,
            uniqueExercises: 0
          })
        }
      } catch (error) {
        console.error('❌ useProductStats: Error obteniendo estadísticas:', error)
        setStats({
          totalSessions: 0,
          totalExercises: 0,
          totalWeeks: 0,
          totalPeriods: 0,
          uniqueExercises: 0
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [activityId])

  return { stats, loading }
}
