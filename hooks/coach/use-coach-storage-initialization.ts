'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'

/**
 * Hook para inicializar automáticamente la estructura de carpetas
 * cuando un coach inicia sesión por primera vez
 * 
 * NOTA: La API de inicialización fue eliminada ya que no es necesaria.
 * El hook ahora simplemente marca como inicializado sin hacer llamadas.
 */
export function useCoachStorageInitialization() {
  const { user, isAuthenticated } = useAuth()
  const [initialized, setInitialized] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // La API de inicialización fue eliminada - simplemente marcar como inicializado
    if (!isAuthenticated || !user || initialized) {
      return
    }

    // Verificar si el usuario es coach
    if (user.level !== 'coach') {
      setInitialized(true)
      return
    }

    // API eliminada - la inicialización se maneja automáticamente por el sistema
    // o no es necesaria. Simplemente marcar como inicializado.
    setInitialized(true)
    setLoading(false)
  }, [isAuthenticated, user, initialized])

  return {
    initialized,
    loading,
    error
  }
}



