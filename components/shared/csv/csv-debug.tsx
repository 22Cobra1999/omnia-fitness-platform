"use client"

import React, { useState } from 'react'
import Papa from 'papaparse'

export function CSVDebug() {
  const [file, setFile] = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [sampleData, setSampleData] = useState<any[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length > 0) {
          const firstRow = results.data[0] as any
          const headers = Object.keys(firstRow)
          setHeaders(headers)
          setSampleData(results.data.slice(0, 3) as any[])
        }
      }
    })
  }

  return (
    <div className="p-6 bg-white rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">🔍 Debug CSV Headers</h3>
      
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="mb-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />

      {headers.length > 0 && (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Headers encontrados:</h4>
            <div className="bg-gray-100 p-3 rounded text-sm font-mono">
              {headers.map((header, index) => (
                <div key={index} className="mb-1">
                  {index + 1}. "{header}" (length: {header.length})
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Mapeo esperado vs encontrado:</h4>
            <div className="bg-gray-100 p-3 rounded text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-red-600 mb-2">Esperado:</h5>
                  <ul className="space-y-1 text-xs">
                    <li>• Semana</li>
                    <li>• Día</li>
                    <li>• Nombre de la Actividad</li>
                    <li>• Descripción</li>
                    <li>• Duración (min)</li>
                    <li>• Tipo de Ejercicio</li>
                    <li>• Nivel de Intensidad</li>
                    <li>• Equipo Necesario</li>
                    <li>• 1RM</li>
                    <li>• Detalle de Series (peso-repeticiones-series)</li>
                    <li>• Partes del Cuerpo</li>
                    <li>• Calorías</li>
                    <li>• video_url</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-green-600 mb-2">Encontrado:</h5>
                  <ul className="space-y-1 text-xs">
                    {headers.map((header, index) => (
                      <li key={index}>• "{header}"</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Datos de muestra (primeras 3 filas):</h4>
            <div className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(sampleData, null, 2)}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Análisis de coincidencias:</h4>
            <div className="bg-gray-100 p-3 rounded text-sm">
              {[
                'Semana', 'Día', 'Nombre de la Actividad', 'Descripción', 
                'Duración (min)', 'Tipo de Ejercicio', 'Nivel de Intensidad', 
                'Equipo Necesario', '1RM', 'Detalle de Series (peso-repeticiones-series)', 
                'Partes del Cuerpo', 'Calorías', 'video_url'
              ].map(expectedHeader => {
                const found = headers.find(h => 
                  h.toLowerCase().trim() === expectedHeader.toLowerCase().trim() ||
                  h.toLowerCase().includes(expectedHeader.toLowerCase().replace(/\s+/g, ''))
                )
                return (
                  <div key={expectedHeader} className="flex items-center mb-1">
                    <span className="w-1 h-1 rounded-full mr-2" 
                          style={{backgroundColor: found ? '#10b981' : '#ef4444'}}></span>
                    <span className="text-xs">
                      "{expectedHeader}" → {found ? `"${found}"` : 'NO ENCONTRADO'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}









































