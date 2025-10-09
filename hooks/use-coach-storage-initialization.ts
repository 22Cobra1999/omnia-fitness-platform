'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'

/**
 * Hook para inicializar automáticamente la estructura de carpetas
 * cuando un coach inicia sesión por primera vez
 */
export function useCoachStorageInitialization() {
  const { user, isAuthenticated } = useAuth()
  const [initialized, setInitialized] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkAndInitialize() {
      // Solo ejecutar si hay usuario autenticado y no se ha inicializado
      if (!isAuthenticated || !user || initialized || loading) {
        return
      }

      // Verificar si el usuario es coach antes de intentar inicializar
      if (user.level !== 'coach') {
        setInitialized(true)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Verificar si ya está inicializado
        const checkResponse = await fetch('/api/coach/initialize-storage', {
          method: 'GET'
        })

        const checkData = await checkResponse.json()

        if (checkData.initialized) {
          console.log('✅ Storage ya inicializado para coach:', user.id)
          setInitialized(true)
          setLoading(false)
          return
        }

        // Si no está inicializado, inicializar ahora
        console.log('🚀 Inicializando storage para nuevo coach:', user.id)
        
        const initResponse = await fetch('/api/coach/initialize-storage', {
          method: 'POST'
        })

        const initData = await initResponse.json()

        if (initResponse.ok && initData.success) {
          console.log('✅ Storage inicializado exitosamente:', initData)
          setInitialized(true)
        } else {
          console.error('❌ Error inicializando storage:', initData)
          setError(initData.error || 'Error desconocido')
        }

      } catch (err: any) {
        console.error('❌ Error en inicialización de storage:', err)
        setError(err.message || 'Error de conexión')
      } finally {
        setLoading(false)
      }
    }

    checkAndInitialize()
  }, [isAuthenticated, user, initialized, loading])

  return {
    initialized,
    loading,
    error
  }
}



