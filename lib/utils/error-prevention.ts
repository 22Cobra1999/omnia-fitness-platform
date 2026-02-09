"use client"
import * as React from 'react'

// Configuración para prevenir páginas en blanco y mejorar la robustez de la aplicación

export const ERROR_PREVENTION_CONFIG = {
  // Timeouts para requests
  REQUEST_TIMEOUT: 15000, // 15 segundos

  // Reintentos automáticos
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000, // 2 segundos

  // Fallbacks
  FALLBACK_DATA: {
    coaches: [],
    activities: [],
    products: []
  },

  // Límites de datos
  MAX_DATA_SIZE: 1000, // Máximo 1000 elementos por request

  // Configuración de caché
  CACHE_DEFAULTS: {
    TTL: 5 * 60 * 1000, // 5 minutos
    STALE_WHILE_REVALIDATE: 2 * 60 * 1000, // 2 minutos
    MAX_SIZE: 100
  }
}

// Función para validar datos de API
export function validateApiResponse(data: any, expectedType: 'array' | 'object'): boolean {
  try {
    if (expectedType === 'array') {
      return Array.isArray(data)
    }
    if (expectedType === 'object') {
      return data && typeof data === 'object' && !Array.isArray(data)
    }
    return false
  } catch {
    return false
  }
}

// Función para sanitizar datos
export function sanitizeData(data: any): any {
  if (!data) return null

  if (Array.isArray(data)) {
    return data.slice(0, ERROR_PREVENTION_CONFIG.MAX_DATA_SIZE)
  }

  if (typeof data === 'object') {
    // Remover propiedades peligrosas
    const sanitized = { ...data }
    delete sanitized.__proto__
    delete sanitized.constructor
    delete sanitized.prototype
    return sanitized
  }

  return data
}

// Función para crear requests seguros
export function createSafeRequest(url: string, options: RequestInit = {}) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), ERROR_PREVENTION_CONFIG.REQUEST_TIMEOUT)

  const safeOptions: RequestInit = {
    ...options,
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }

  return fetch(url, safeOptions).finally(() => {
    clearTimeout(timeoutId)
  })
}

// Función para manejar errores de forma consistente
export function handleApiError(error: any, context: string): { message: string; retryable: boolean } {
  console.error(`🚨 API Error in ${context}:`, error)

  if (error.name === 'AbortError') {
    return {
      message: 'La solicitud tardó demasiado tiempo. Inténtalo de nuevo.',
      retryable: true
    }
  }

  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return {
      message: 'Error de conexión. Verifica tu internet.',
      retryable: true
    }
  }

  if (error.status >= 500) {
    return {
      message: 'Error del servidor. Inténtalo más tarde.',
      retryable: true
    }
  }

  if (error.status === 404) {
    return {
      message: 'Recurso no encontrado.',
      retryable: false
    }
  }

  if (error.status === 403 || error.status === 401) {
    return {
      message: 'No tienes permisos para acceder a este recurso.',
      retryable: false
    }
  }

  return {
    message: 'Error inesperado. Inténtalo de nuevo.',
    retryable: true
  }
}

// Hook para prevenir errores en componentes
export function useErrorPrevention() {
  const [errors, setErrors] = React.useState<Array<{ id: string; message: string; timestamp: number }>>([])

  const addError = (message: string) => {
    const error = {
      id: Math.random().toString(36).substr(2, 9),
      message,
      timestamp: Date.now()
    }

    setErrors(prev => [...prev.slice(-4), error]) // Mantener solo los últimos 5 errores

    // Auto-remover errores después de 10 segundos
    setTimeout(() => {
      setErrors(prev => prev.filter(e => e.id !== error.id))
    }, 10000)
  }

  const clearErrors = () => {
    setErrors([])
  }

  const safeExecute = async <T>(
    fn: () => Promise<T>,
    fallback: T,
    errorContext: string
  ): Promise<T> => {
    try {
      const result = await fn()
      return sanitizeData(result) || fallback
    } catch (error) {
      const { message } = handleApiError(error, errorContext)
      addError(message)
      return fallback
    }
  }

  return {
    errors,
    addError,
    clearErrors,
    safeExecute
  }
}

// Función para detectar si la aplicación está en un estado problemático
export function detectAppHealth(): 'healthy' | 'degraded' | 'critical' {
  if (typeof window === 'undefined') return 'healthy'

  // Verificar memoria disponible
  const memory = (performance as any).memory
  if (memory) {
    const usedRatio = memory.usedJSHeapSize / memory.totalJSHeapSize
    if (usedRatio > 0.9) return 'critical'
    if (usedRatio > 0.7) return 'degraded'
  }

  // Verificar errores recientes
  const recentErrors = window.performance.getEntriesByType('navigation')
  if (recentErrors.length > 0) {
    const nav = recentErrors[0] as PerformanceNavigationTiming
    if (nav.loadEventEnd - nav.loadEventStart > 5000) return 'degraded'
  }

  return 'healthy'
}

// Función para limpiar recursos y prevenir memory leaks
export function cleanupResources() {
  // Limpiar event listeners
  if (typeof window !== 'undefined') {
    // Remover listeners temporales
    const events = ['resize', 'scroll', 'mousemove', 'keydown']
    events.forEach(event => {
      const elements = document.querySelectorAll(`[data-listener-${event}]`)
      elements.forEach(el => {
        el.removeAttribute(`data-listener-${event}`)
      })
    })
  }

  // Limpiar timers
  for (let i = 1; i < 10000; i++) {
    clearTimeout(i)
    clearInterval(i)
  }
}

// Función para recuperar la aplicación de un estado crítico
export function recoverFromCriticalState() {
  console.log('🚑 Iniciando recuperación de estado crítico...')

  // Limpiar recursos
  cleanupResources()

  // Limpiar caché local
  if (typeof window !== 'undefined') {
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch (error) {
      console.error('Error clearing storage:', error)
    }
  }

  // Recargar la página como último recurso
  setTimeout(() => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }, 1000)
}

// Función para monitorear la salud de la aplicación
export function startHealthMonitoring() {
  if (typeof window === 'undefined') return

  setInterval(() => {
    const health = detectAppHealth()

    if (health === 'critical') {
      console.warn('🚨 Estado crítico detectado, iniciando recuperación...')
      recoverFromCriticalState()
    } else if (health === 'degraded') {
      console.warn('⚠️ Estado degradado detectado')
      cleanupResources()
    }
  }, 30000) // Verificar cada 30 segundos
}
