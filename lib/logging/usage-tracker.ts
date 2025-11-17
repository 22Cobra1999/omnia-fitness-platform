/**
 * Sistema de rastreo de uso de recursos
 * Registra qué componentes, hooks, APIs, etc. se usan en cada navegación
 */

type ResourceType = 'component' | 'hook' | 'api' | 'table' | 'script' | 'doc'

interface UsageEntry {
  type: ResourceType
  name: string
  timestamp: number
  details?: any
}

class UsageTracker {
  private static instance: UsageTracker
  private usageLog: UsageEntry[] = []
  private sessionStart: number = Date.now()

  private constructor() {
    if (typeof window !== 'undefined') {
      // Exponer globalmente para debugging
      (window as any).__usageTracker = this
    }
  }

  static getInstance(): UsageTracker {
    if (!UsageTracker.instance) {
      UsageTracker.instance = new UsageTracker()
    }
    return UsageTracker.instance
  }

  track(type: ResourceType, name: string, details?: any) {
    const entry: UsageEntry = {
      type,
      name,
      timestamp: Date.now(),
      details
    }
    this.usageLog.push(entry)
    
    // Log condensado en consola
    const icon = this.getIcon(type)
    console.log(`${icon} ${type.toUpperCase()}: ${name}`, details || '')
  }

  private getIcon(type: ResourceType): string {
    const icons = {
      component: '🧩',
      hook: '🎣',
      api: '🌐',
      table: '📊',
      script: '📜',
      doc: '📄'
    }
    return icons[type] || '📌'
  }

  getReport(): { [key: string]: string[] } {
    const report: { [key: string]: Set<string> } = {
      components: new Set(),
      hooks: new Set(),
      apis: new Set(),
      tables: new Set(),
      scripts: new Set(),
      docs: new Set()
    }

    this.usageLog.forEach(entry => {
      const key = `${entry.type}s`
      if (report[key]) {
        report[key].add(entry.name)
      }
    })

    // Convertir Sets a Arrays ordenados
    const finalReport: { [key: string]: string[] } = {}
    Object.keys(report).forEach(key => {
      finalReport[key] = Array.from(report[key]).sort()
    })

    return finalReport
  }

  printReport() {
    const report = this.getReport()
    const sessionDuration = ((Date.now() - this.sessionStart) / 1000).toFixed(1)
    
    console.group('📊 REPORTE DE USO DE RECURSOS')
    console.log(`⏱️ Duración de sesión: ${sessionDuration}s`)
    console.log(`📝 Total de registros: ${this.usageLog.length}`)
    console.log('')
    
    Object.entries(report).forEach(([category, items]) => {
      if (items.length > 0) {
        console.group(`${this.getIcon(category.slice(0, -1) as ResourceType)} ${category.toUpperCase()} (${items.length})`)
        items.forEach(item => console.log(`  - ${item}`))
        console.groupEnd()
      }
    })
    
    console.groupEnd()
    return report
  }

  clear() {
    this.usageLog = []
    this.sessionStart = Date.now()
  }

  exportReport() {
    return {
      sessionDuration: (Date.now() - this.sessionStart) / 1000,
      totalEntries: this.usageLog.length,
      report: this.getReport(),
      timeline: this.usageLog
    }
  }
}

export const usageTracker = UsageTracker.getInstance()

// Helper para componentes
export const trackComponent = (name: string, props?: any) => {
  usageTracker.track('component', name, props ? { props: Object.keys(props) } : undefined)
}

// Helper para hooks
export const trackHook = (name: string, params?: any) => {
  usageTracker.track('hook', name, params)
}

// Helper para APIs
export const trackAPI = (endpoint: string, method: string = 'GET') => {
  usageTracker.track('api', `${method} ${endpoint}`)
}

// Helper para tablas
export const trackTable = (tableName: string, operation: string = 'query') => {
  usageTracker.track('table', `${tableName} (${operation})`)
}

