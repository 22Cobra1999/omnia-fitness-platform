"use client"

import { getUsage, type UsageRecord, type UsageSnapshot } from "./usage-logger"

// Tipos para análisis de ingeniería de datos
export type ComponentAnalysis = {
  name: string
  usage: {
    mounts: number
    unmounts: number
    clicks: number
    totalInteractions: number
  }
  performance: {
    avgLoadTime?: number
    memoryUsage?: number
    renderCount: number
  }
  dataUsage: {
    apiCalls: number
    cacheHits: number
    cacheMisses: number
    dataSize: number
  }
  userRole: 'client' | 'coach' | 'mixed' | 'unknown'
  lastUsed: number
  isActive: boolean
  efficiency: number // 0-100
}

export type DuplicateComponent = {
  components: string[]
  similarity: number
  recommendation: string
}

export type UnusedComponent = {
  name: string
  lastUsed: number
  daysSinceLastUse: number
  recommendation: 'archive' | 'deprecate' | 'investigate'
}

export type DataUsageAnalysis = {
  mostUsedData: Array<{
    type: string
    accessCount: number
    size: number
    recommendation: string
  }>
  cacheEfficiency: {
    hitRate: number
    missRate: number
    recommendation: string
  }
  queryPerformance: {
    avgResponseTime: number
    slowQueries: string[]
    recommendation: string
  }
}

export type ArchitectureAnalysis = {
  componentHealth: ComponentAnalysis[]
  duplicates: DuplicateComponent[]
  unused: UnusedComponent[]
  dataUsage: DataUsageAnalysis
  recommendations: string[]
  overallScore: number // 0-100
}

// Función principal de análisis
export function analyzeArchitecture(): ArchitectureAnalysis {
  const usage = getUsage()
  const records = Object.values(usage.records)
  
  // Análisis de componentes
  const componentHealth = analyzeComponentHealth(records)
  
  // Detección de duplicados
  const duplicates = detectDuplicateComponents(records)
  
  // Componentes no utilizados
  const unused = detectUnusedComponents(records)
  
  // Análisis de uso de datos
  const dataUsage = analyzeDataUsage(records)
  
  // Generar recomendaciones
  const recommendations = generateRecommendations(componentHealth, duplicates, unused, dataUsage)
  
  // Calcular score general
  const overallScore = calculateOverallScore(componentHealth, duplicates, unused, dataUsage)
  
  return {
    componentHealth,
    duplicates,
    unused,
    dataUsage,
    recommendations,
    overallScore
  }
}

function analyzeComponentHealth(records: UsageRecord[]): ComponentAnalysis[] {
  const components = new Map<string, ComponentAnalysis>()
  
  records.forEach(record => {
    if (!components.has(record.component)) {
      components.set(record.component, {
        name: record.component,
        usage: { mounts: 0, unmounts: 0, clicks: 0, totalInteractions: 0 },
        performance: { renderCount: 0 },
        dataUsage: { apiCalls: 0, cacheHits: 0, cacheMisses: 0, dataSize: 0 },
        userRole: 'unknown',
        lastUsed: record.lastAt,
        isActive: false,
        efficiency: 0
      })
    }
    
    const comp = components.get(record.component)!
    
    // Contar eventos
    switch (record.event) {
      case 'mount':
        comp.usage.mounts += record.count
        comp.performance.renderCount += record.count
        break
      case 'unmount':
        comp.usage.unmounts += record.count
        break
      case 'click':
        comp.usage.clicks += record.count
        break
    }
    
    comp.usage.totalInteractions += record.count
    comp.lastUsed = Math.max(comp.lastUsed, record.lastAt)
    
    // Determinar rol de usuario
    if (record.extra?.userRole) {
      if (comp.userRole === 'unknown') {
        comp.userRole = record.extra.userRole
      } else if (comp.userRole !== record.extra.userRole) {
        comp.userRole = 'mixed'
      }
    }
    
    // Calcular eficiencia
    comp.efficiency = calculateEfficiency(comp)
    comp.isActive = comp.lastUsed > (Date.now() - 7 * 24 * 60 * 60 * 1000) // Últimos 7 días
  })
  
  return Array.from(components.values()).sort((a, b) => b.usage.totalInteractions - a.usage.totalInteractions)
}

function detectDuplicateComponents(records: UsageRecord[]): DuplicateComponent[] {
  const duplicates: DuplicateComponent[] = []
  const components = new Set(records.map(r => r.component))
  
  // Patrones comunes de duplicación
  const patterns = [
    { pattern: /Modal$/, name: 'Modal' },
    { pattern: /Card$/, name: 'Card' },
    { pattern: /Button$/, name: 'Button' },
    { pattern: /Screen$/, name: 'Screen' },
    { pattern: /Header$/, name: 'Header' },
    { pattern: /Profile/, name: 'Profile' },
    { pattern: /Activity/, name: 'Activity' }
  ]
  
  patterns.forEach(({ pattern, name }) => {
    const matching = Array.from(components).filter(c => pattern.test(c))
    if (matching.length > 1) {
      duplicates.push({
        components: matching,
        similarity: 85, // Estimación basada en patrón
        recommendation: `Considerar crear un componente base ${name} reutilizable`
      })
    }
  })
  
  return duplicates
}

function detectUnusedComponents(records: UsageRecord[]): UnusedComponent[] {
  const now = Date.now()
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
  
  const unused: UnusedComponent[] = []
  const componentLastUsed = new Map<string, number>()
  
  records.forEach(record => {
    const current = componentLastUsed.get(record.component) || 0
    componentLastUsed.set(record.component, Math.max(current, record.lastAt))
  })
  
  componentLastUsed.forEach((lastUsed, component) => {
    const daysSince = Math.floor((now - lastUsed) / (24 * 60 * 60 * 1000))
    
    if (lastUsed < thirtyDaysAgo) {
      unused.push({
        name: component,
        lastUsed,
        daysSinceLastUse: daysSince,
        recommendation: daysSince > 90 ? 'archive' : 'investigate'
      })
    }
  })
  
  return unused.sort((a, b) => b.daysSinceLastUse - a.daysSinceLastUse)
}

function analyzeDataUsage(records: UsageRecord[]): DataUsageAnalysis {
  const dataTypes = new Map<string, { count: number, size: number }>()
  let totalCacheHits = 0
  let totalCacheMisses = 0
  let totalApiCalls = 0
  
  records.forEach(record => {
    if (record.extra?.dataType) {
      const current = dataTypes.get(record.extra.dataType) || { count: 0, size: 0 }
      current.count += record.count
      current.size += record.extra.dataSize || 0
      dataTypes.set(record.extra.dataType, current)
    }
    
    if (record.extra?.cacheHit) totalCacheHits += record.count
    if (record.extra?.cacheMiss) totalCacheMisses += record.count
    if (record.extra?.apiCall) totalApiCalls += record.count
  })
  
  const mostUsedData = Array.from(dataTypes.entries())
    .map(([type, data]) => ({
      type,
      accessCount: data.count,
      size: data.size,
      recommendation: data.count > 100 ? 'Optimizar caché' : 'Considerar prefetch'
    }))
    .sort((a, b) => b.accessCount - a.accessCount)
    .slice(0, 5)
  
  const totalCache = totalCacheHits + totalCacheMisses
  const hitRate = totalCache > 0 ? (totalCacheHits / totalCache) * 100 : 0
  
  return {
    mostUsedData,
    cacheEfficiency: {
      hitRate,
      missRate: 100 - hitRate,
      recommendation: hitRate > 80 ? 'Caché eficiente' : 'Mejorar estrategia de caché'
    },
    queryPerformance: {
      avgResponseTime: 0, // Se calcularía con métricas reales
      slowQueries: [],
      recommendation: 'Implementar métricas de rendimiento'
    }
  }
}

function calculateEfficiency(comp: ComponentAnalysis): number {
  const { usage, performance } = comp
  
  // Fórmula simple de eficiencia
  const interactionRatio = usage.clicks / Math.max(usage.mounts, 1)
  const renderEfficiency = usage.mounts / Math.max(performance.renderCount, 1)
  
  return Math.min(100, (interactionRatio * 50) + (renderEfficiency * 50))
}

function generateRecommendations(
  components: ComponentAnalysis[],
  duplicates: DuplicateComponent[],
  unused: UnusedComponent[],
  dataUsage: DataUsageAnalysis
): string[] {
  const recommendations: string[] = []
  
  // Recomendaciones de componentes
  const lowEfficiency = components.filter(c => c.efficiency < 30)
  if (lowEfficiency.length > 0) {
    recommendations.push(`Optimizar ${lowEfficiency.length} componentes con baja eficiencia`)
  }
  
  // Recomendaciones de duplicados
  if (duplicates.length > 0) {
    recommendations.push(`Consolidar ${duplicates.length} grupos de componentes duplicados`)
  }
  
  // Recomendaciones de no utilizados
  const toArchive = unused.filter(u => u.recommendation === 'archive')
  if (toArchive.length > 0) {
    recommendations.push(`Archivar ${toArchive.length} componentes no utilizados`)
  }
  
  // Recomendaciones de datos
  if (dataUsage.cacheEfficiency.hitRate < 70) {
    recommendations.push('Mejorar estrategia de caché para optimizar rendimiento')
  }
  
  return recommendations
}

function calculateOverallScore(
  components: ComponentAnalysis[],
  duplicates: DuplicateComponent[],
  unused: UnusedComponent[],
  dataUsage: DataUsageAnalysis
): number {
  const avgEfficiency = components.reduce((sum, c) => sum + c.efficiency, 0) / components.length
  const duplicatePenalty = duplicates.length * 5
  const unusedPenalty = unused.filter(u => u.recommendation === 'archive').length * 3
  const cacheBonus = dataUsage.cacheEfficiency.hitRate > 80 ? 10 : 0
  
  return Math.max(0, Math.min(100, avgEfficiency - duplicatePenalty - unusedPenalty + cacheBonus))
}

// Función para generar reporte en formato texto para compartir
export function generateTextReport(analysis: ArchitectureAnalysis): string {
  const { componentHealth, duplicates, unused, dataUsage, recommendations, overallScore } = analysis
  
  let report = `📊 ANÁLISIS DE ARQUITECTURA - APLICACIÓN iOS OMNIA\n`
  report += `═══════════════════════════════════════════════════════════════\n\n`
  
  report += `🎯 SCORE GENERAL: ${overallScore.toFixed(1)}/100\n\n`
  
  report += `📈 COMPONENTES ACTIVOS (${componentHealth.length}):\n`
  report += `─────────────────────────────────────────────────────────────\n`
  componentHealth.slice(0, 10).forEach((comp, i) => {
    const status = comp.isActive ? '✅' : '⚠️'
    const role = comp.userRole === 'mixed' ? 'CLIENT/COACH' : comp.userRole.toUpperCase()
    report += `${i + 1}. ${status} ${comp.name} (${role})\n`
    report += `   Eficiencia: ${comp.efficiency.toFixed(1)}% | Interacciones: ${comp.usage.totalInteractions}\n`
    report += `   Último uso: ${new Date(comp.lastUsed).toLocaleDateString()}\n\n`
  })
  
  if (duplicates.length > 0) {
    report += `🔄 COMPONENTES DUPLICADOS (${duplicates.length}):\n`
    report += `─────────────────────────────────────────────────────────────\n`
    duplicates.forEach((dup, i) => {
      report += `${i + 1}. ${dup.components.join(', ')}\n`
      report += `   Similitud: ${dup.similarity}% | ${dup.recommendation}\n\n`
    })
  }
  
  if (unused.length > 0) {
    report += `🗑️ COMPONENTES NO UTILIZADOS (${unused.length}):\n`
    report += `─────────────────────────────────────────────────────────────\n`
    unused.slice(0, 5).forEach((u, i) => {
      const action = u.recommendation === 'archive' ? 'ARCHIVAR' : 'INVESTIGAR'
      report += `${i + 1}. ${u.name} (${u.daysSinceLastUse} días sin uso) - ${action}\n`
    })
    report += `\n`
  }
  
  report += `💾 ANÁLISIS DE DATOS:\n`
  report += `─────────────────────────────────────────────────────────────\n`
  report += `Cache Hit Rate: ${dataUsage.cacheEfficiency.hitRate.toFixed(1)}%\n`
  report += `Recomendación: ${dataUsage.cacheEfficiency.recommendation}\n\n`
  
  if (dataUsage.mostUsedData.length > 0) {
    report += `Datos más accedidos:\n`
    dataUsage.mostUsedData.forEach((data, i) => {
      report += `${i + 1}. ${data.type}: ${data.accessCount} accesos\n`
    })
    report += `\n`
  }
  
  report += `🎯 RECOMENDACIONES PRIORITARIAS:\n`
  report += `─────────────────────────────────────────────────────────────\n`
  recommendations.forEach((rec, i) => {
    report += `${i + 1}. ${rec}\n`
  })
  
  report += `\n═══════════════════════════════════════════════════════════════\n`
  report += `Generado: ${new Date().toLocaleString()}\n`
  
  return report
}
