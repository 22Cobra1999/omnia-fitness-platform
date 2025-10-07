"use client"

import { useEffect, useRef, useCallback } from "react"
import { logUsage, type UsageEvent } from "@/lib/usage-logger"
import { useAuth } from "@/contexts/auth-context"

export function useComponentUsage(componentName: string, extra?: Record<string, any>) {
  const mountedRef = useRef(false)
  const { user, isAuthenticated } = useAuth()
  
  // Detectar rol de usuario
  const getUserRole = () => {
    if (!isAuthenticated || !user) return 'unknown'
    return user.level === 'coach' ? 'coach' : 'client'
  }
  
  // Capturar métricas de rendimiento
  const capturePerformance = () => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        loadTime: perf ? perf.loadEventEnd - perf.loadEventStart : undefined,
        memoryUsage: (performance as any).memory?.usedJSHeapSize
      }
    }
    return {}
  }

  useEffect(() => {
    if (!mountedRef.current) {
      const startTime = performance.now()
      const userRole = getUserRole()
      const perf = capturePerformance()
      
      logUsage(componentName, "mount", { 
        ...extra,
        userRole,
        timestamp: Date.now(),
        ...perf
      })
      mountedRef.current = true
    }
    return () => {
      const userRole = getUserRole()
      logUsage(componentName, "unmount", { 
        userRole,
        timestamp: Date.now()
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const track = useCallback((event: UsageEvent, data?: Record<string, any>) => {
    const userRole = getUserRole()
    logUsage(componentName, event, { ...data, userRole, timestamp: Date.now() })
  }, [componentName])

  // Atajo para clicks
  const onClick = useCallback((id?: string | number, data?: Record<string, any>) => {
    const userRole = getUserRole()
    logUsage(componentName, "click", { id, userRole, timestamp: Date.now(), ...data })
  }, [componentName])

  const onOpen = useCallback((id?: string | number, data?: Record<string, any>) => {
    const userRole = getUserRole()
    logUsage(componentName, "open", { id, userRole, timestamp: Date.now(), ...data })
  }, [componentName])

  const onClose = useCallback((id?: string | number, data?: Record<string, any>) => {
    const userRole = getUserRole()
    logUsage(componentName, "close", { id, userRole, timestamp: Date.now(), ...data })
  }, [componentName])

  const onView = useCallback((id?: string | number, data?: Record<string, any>) => {
    const userRole = getUserRole()
    logUsage(componentName, "view", { id, userRole, timestamp: Date.now(), ...data })
  }, [componentName])

  const onSubmit = useCallback((id?: string | number, data?: Record<string, any>) => {
    const userRole = getUserRole()
    logUsage(componentName, "submit", { id, userRole, timestamp: Date.now(), ...data })
  }, [componentName])

  const onNavigate = useCallback((to: string, data?: Record<string, any>) => {
    const userRole = getUserRole()
    logUsage(componentName, "navigate", { to, userRole, timestamp: Date.now(), ...data })
  }, [componentName])

  // Nuevos métodos para análisis de datos
  const onDataAccess = useCallback((dataType: string, dataSize?: number, cacheHit?: boolean) => {
    const userRole = getUserRole()
    logUsage(componentName, "view", { 
      dataType,
      dataSize,
      cacheHit,
      cacheMiss: !cacheHit,
      userRole,
      timestamp: Date.now()
    })
  }, [componentName])

  const onApiCall = useCallback((endpoint: string, responseTime?: number) => {
    const userRole = getUserRole()
    logUsage(componentName, "view", { 
      apiCall: true,
      endpoint,
      responseTime,
      userRole,
      timestamp: Date.now()
    })
  }, [componentName])

  return { 
    track, 
    onClick, 
    onOpen, 
    onClose, 
    onView, 
    onSubmit, 
    onNavigate,
    onDataAccess,
    onApiCall
  }
}
