"use client"

import { useEffect, useState } from "react"
import { getUsage, resetUsage, exportUsageAsCSV, type UsageRecord } from "@/lib/usage-logger"
import { analyzeArchitecture, generateTextReport, type ArchitectureAnalysis } from "@/lib/analytics-engine"
import { Button } from "@/components/ui/button"

export default function UsageDebugPage() {
  const [records, setRecords] = useState<UsageRecord[]>([])
  const [analysis, setAnalysis] = useState<ArchitectureAnalysis | null>(null)
  const [textReport, setTextReport] = useState<string>("")
  const [updatedAt, setUpdatedAt] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'raw' | 'analysis' | 'report'>('analysis')

  const reload = () => {
    const snap = getUsage()
    setRecords(Object.values(snap.records).sort((a, b) => b.count - a.count))
    setUpdatedAt(snap.updatedAt)
    
    // Generar análisis
    const archAnalysis = analyzeArchitecture()
    setAnalysis(archAnalysis)
    setTextReport(generateTextReport(archAnalysis))
  }

  useEffect(() => {
    reload()
  }, [])

  const handleExport = () => {
    const csv = exportUsageAsCSV()
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `usage_${new Date().toISOString()}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportReport = () => {
    const blob = new Blob([textReport], { type: "text/plain;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `architecture_report_${new Date().toISOString()}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    resetUsage()
    reload()
  }

  return (
    <div className="p-6 text-white bg-[#121212] min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🔬 Análisis de Arquitectura iOS</h1>
        <div className="flex gap-2">
          <Button onClick={reload} className="bg-[#2A2A2A] hover:bg-[#3A3A3A]">Refrescar</Button>
          <Button onClick={handleExport} className="bg-[#FF7939] hover:bg-[#E66829]">Exportar CSV</Button>
          <Button onClick={handleExportReport} className="bg-[#4CAF50] hover:bg-[#45A049]">Exportar Reporte</Button>
          <Button onClick={handleReset} variant="destructive">Reset</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button 
          onClick={() => setActiveTab('analysis')} 
          variant={activeTab === 'analysis' ? 'default' : 'outline'}
          className={activeTab === 'analysis' ? 'bg-[#FF7939]' : ''}
        >
          📊 Análisis
        </Button>
        <Button 
          onClick={() => setActiveTab('report')} 
          variant={activeTab === 'report' ? 'default' : 'outline'}
          className={activeTab === 'report' ? 'bg-[#FF7939]' : ''}
        >
          📋 Reporte
        </Button>
        <Button 
          onClick={() => setActiveTab('raw')} 
          variant={activeTab === 'raw' ? 'default' : 'outline'}
          className={activeTab === 'raw' ? 'bg-[#FF7939]' : ''}
        >
          📈 Datos Raw
        </Button>
      </div>

      <div className="text-sm text-gray-400 mb-4">
        Última actualización: {updatedAt ? new Date(updatedAt).toLocaleString() : "-"}
      </div>

      {/* Análisis Tab */}
      {activeTab === 'analysis' && analysis && (
        <div className="space-y-6">
          {/* Score General */}
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2A2A2A]">
            <h2 className="text-xl font-bold mb-2">🎯 Score General: {analysis.overallScore.toFixed(1)}/100</h2>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-[#FF7939] h-2 rounded-full" 
                style={{ width: `${analysis.overallScore}%` }}
              ></div>
            </div>
          </div>

          {/* Componentes Activos */}
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2A2A2A]">
            <h2 className="text-lg font-bold mb-3">📈 Componentes Activos ({analysis.componentHealth.length})</h2>
            <div className="space-y-2">
              {analysis.componentHealth.slice(0, 10).map((comp, i) => (
                <div key={comp.name} className="flex justify-between items-center p-2 bg-[#2A2A2A] rounded">
                  <div>
                    <span className="font-medium">{comp.name}</span>
                    <span className="text-xs text-gray-400 ml-2">({comp.userRole})</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">Eficiencia: {comp.efficiency.toFixed(1)}%</div>
                    <div className="text-xs text-gray-400">Interacciones: {comp.usage.totalInteractions}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Duplicados */}
          {analysis.duplicates.length > 0 && (
            <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2A2A2A]">
              <h2 className="text-lg font-bold mb-3">🔄 Componentes Duplicados ({analysis.duplicates.length})</h2>
              {analysis.duplicates.map((dup, i) => (
                <div key={i} className="p-2 bg-[#2A2A2A] rounded mb-2">
                  <div className="font-medium">{dup.components.join(', ')}</div>
                  <div className="text-sm text-gray-400">{dup.recommendation}</div>
                </div>
              ))}
            </div>
          )}

          {/* No Utilizados */}
          {analysis.unused.length > 0 && (
            <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2A2A2A]">
              <h2 className="text-lg font-bold mb-3">🗑️ Componentes No Utilizados ({analysis.unused.length})</h2>
              {analysis.unused.slice(0, 5).map((u, i) => (
                <div key={u.name} className="p-2 bg-[#2A2A2A] rounded mb-2">
                  <div className="font-medium">{u.name}</div>
                  <div className="text-sm text-gray-400">
                    {u.daysSinceLastUse} días sin uso - {u.recommendation.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recomendaciones */}
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2A2A2A]">
            <h2 className="text-lg font-bold mb-3">🎯 Recomendaciones Prioritarias</h2>
            {analysis.recommendations.map((rec, i) => (
              <div key={i} className="p-2 bg-[#2A2A2A] rounded mb-2">
                {i + 1}. {rec}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reporte Tab */}
      {activeTab === 'report' && (
        <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2A2A2A]">
          <pre className="whitespace-pre-wrap text-sm font-mono text-gray-300 overflow-auto max-h-96">
            {textReport}
          </pre>
        </div>
      )}

      {/* Datos Raw Tab */}
      {activeTab === 'raw' && (
        <div className="overflow-auto rounded-lg border border-[#2A2A2A]">
          <table className="w-full text-sm">
            <thead className="bg-[#1E1E1E]">
              <tr>
                <th className="text-left p-3">Componente</th>
                <th className="text-left p-3">Evento</th>
                <th className="text-left p-3">Count</th>
                <th className="text-left p-3">Último</th>
                <th className="text-left p-3">Extra</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-400">Sin métricas aún</td>
                </tr>
              ) : (
                records.map((r, idx) => (
                  <tr key={`${r.component}-${r.event}-${idx}`} className="border-t border-[#2A2A2A]">
                    <td className="p-3">{r.component}</td>
                    <td className="p-3">{r.event}</td>
                    <td className="p-3">{r.count}</td>
                    <td className="p-3">{new Date(r.lastAt).toLocaleString()}</td>
                    <td className="p-3 font-mono text-xs text-gray-300">
                      {r.extra ? JSON.stringify(r.extra) : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
