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
    // Deshabilitar temporalmente - API eliminada durante limpieza
    // Las estadísticas se manejan desde product-statistics API
    setStats({
      totalSessions: 0,
      totalExercises: 0,
      totalWeeks: 0,
      totalPeriods: 0,
      uniqueExercises: 0
    })
    setLoading(false)
  }, [activityId])

  return { stats, loading }
}
