"use client"

import { useEffect } from 'react'

/**
 * Componente que intercepta automáticamente todas las llamadas a fetch
 * para registrar qué APIs se están usando en la sesión
 */
export function AutoUsageTracker() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Guardar el fetch original
    const originalFetch = window.fetch

    // Crear tracking de APIs
    const apiUsage = new Set<string>()

    // Sobrescribir fetch
    window.fetch = async function (...args: any[]) {
      const [resource, config] = args
      const url = typeof resource === 'string' ? resource : resource.url
      const method = config?.method || 'GET'

      // Si es una llamada a nuestra API, registrarla
      if (url && url.includes('/api/')) {
        const apiPath = url.split('/api/')[1].split('?')[0]
        const apiCall = `${method} /api/${apiPath}`
        apiUsage.add(apiCall)

        // Guardar en window para acceso global
        if (!window.__apiUsage) window.__apiUsage = new Set()
        window.__apiUsage.add(apiCall)
      }

      // Llamar al fetch original
      return originalFetch.apply(this, args)
    }

    // Tracking de componentes via React DevTools
    const componentUsage = new Set<string>()

    // Interceptar console.log para detectar componentes
    /* 
    const originalLog = console.log
    console.log = function (...args: any[]) {
      const message = args[0]
      if (typeof message === 'string') {
        // Detectar logs de componentes
        if (message.includes('🧩') || message.includes('COMPONENT')) {
          const match = message.match(/COMPONENT: (\w+)/)
          if (match) {
            componentUsage.add(match[1])
            if (!window.__componentUsage) window.__componentUsage = new Set()
            window.__componentUsage.add(match[1])
          }
        }
      }
      return originalLog.apply(this, args)
    }
    */

    // Función global para obtener reporte
    window.__getUsageReport = () => {
      const report = {
        apis: Array.from(window.__apiUsage || []).sort(),
        components: Array.from(window.__componentUsage || []).sort(),
        totalAPIs: (window.__apiUsage || new Set()).size,
        totalComponents: (window.__componentUsage || new Set()).size
      }
      console.group('📊 REPORTE DE USO')
      console.log('🌐 APIs usadas:', report.totalAPIs)
      report.apis.forEach(api => console.log(`  - ${api}`))
      console.log('')
      console.log('🧩 Componentes usados:', report.totalComponents)
      report.components.forEach(comp => console.log(`  - ${comp}`))
      console.groupEnd()
      return report
    }

    window.__clearUsageReport = () => {
      window.__apiUsage = new Set()
      window.__componentUsage = new Set()
    }

    // Sistema de rastreo activado silenciosamente
    // Usa window.__getUsageReport() para ver el reporte

    // Cleanup al desmontar
    return () => {
      window.fetch = originalFetch
      // console.log = originalLog
    }
  }, [])

  return null
}

// Declaraciones TypeScript para window
declare global {
  interface Window {
    __apiUsage?: Set<string>
    __componentUsage?: Set<string>
    __getUsageReport?: () => any
    __clearUsageReport?: () => void
  }
}

