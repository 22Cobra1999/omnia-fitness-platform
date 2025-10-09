"use client"

import { useState } from 'react'
import { usageTracker } from '@/lib/usage-tracker'
import { BarChart3, X, Download } from 'lucide-react'

export function UsageReportButton() {
  const [showReport, setShowReport] = useState(false)
  const [report, setReport] = useState<any>(null)

  const generateReport = () => {
    const fullReport = usageTracker.exportReport()
    setReport(fullReport)
    setShowReport(true)
  }

  const downloadReport = () => {
    const dataStr = JSON.stringify(report, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `omnia-usage-report-${new Date().toISOString()}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  if (!showReport) {
    return (
      <button
        onClick={generateReport}
        className="fixed bottom-20 right-4 z-50 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-all"
        title="Ver reporte de uso"
      >
        <BarChart3 className="h-5 w-5" />
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1E1E1E] rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-500" />
            <h2 className="text-lg font-bold text-white">Reporte de Uso de Recursos</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadReport}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Descargar JSON"
            >
              <Download className="h-4 w-4 text-gray-400" />
            </button>
            <button
              onClick={() => setShowReport(false)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="p-4 bg-[#252525] grid grid-cols-2 gap-4">
          <div>
            <div className="text-gray-400 text-xs">Duración de sesión</div>
            <div className="text-white text-xl font-bold">{report?.sessionDuration?.toFixed(1)}s</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs">Registros totales</div>
            <div className="text-white text-xl font-bold">{report?.totalEntries}</div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {report?.report && Object.entries(report.report).map(([category, items]: [string, any]) => {
            if (!items || items.length === 0) return null
            
            const icons: {[key: string]: string} = {
              components: '🧩',
              hooks: '🎣',
              apis: '🌐',
              tables: '📊',
              scripts: '📜',
              docs: '📄'
            }
            
            return (
              <div key={category} className="bg-[#252525] rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <span>{icons[category] || '📌'}</span>
                  {category.toUpperCase()} ({items.length})
                </h3>
                <div className="space-y-1">
                  {items.map((item: string, idx: number) => (
                    <div key={idx} className="text-sm text-gray-300 font-mono bg-[#1E1E1E] px-3 py-1.5 rounded">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-between items-center">
          <button
            onClick={() => {
              usageTracker.clear()
              setShowReport(false)
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
          >
            Limpiar y cerrar
          </button>
          <button
            onClick={() => {
              usageTracker.printReport()
              console.log('📋 Reporte también impreso en consola')
            }}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
          >
            Imprimir en consola
          </button>
        </div>
      </div>
    </div>
  )
}

