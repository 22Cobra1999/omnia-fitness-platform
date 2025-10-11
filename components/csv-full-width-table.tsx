"use client"

import React from 'react'

interface CSVFullWidthTableProps {
  csvData: any[]
  onProcess?: () => void
  processing?: boolean
}

export function CSVFullWidthTable({ csvData, onProcess, processing = false }: CSVFullWidthTableProps) {
  
  if (!csvData || csvData.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No hay datos CSV para mostrar
      </div>
    )
  }

  // Obtener las columnas del primer objeto
  const columns = csvData.length > 0 ? Object.keys(csvData[0]) : []

  return (
    <div className="w-full space-y-4">
      {/* Resumen */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Resumen del CSV</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-blue-800">Total Filas:</span>
            <span className="ml-2 text-blue-600">{csvData.length}</span>
          </div>
          <div>
            <span className="font-medium text-blue-800">Total Columnas:</span>
            <span className="ml-2 text-blue-600">{columns.length}</span>
          </div>
          <div>
            <span className="font-medium text-blue-800">Columnas:</span>
            <span className="ml-2 text-blue-600 text-xs">{columns.join(', ')}</span>
          </div>
        </div>
      </div>

      {/* Tabla de Ancho Completo */}
      <div className="w-full bg-white rounded-lg border overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column, index) => (
                  <th 
                    key={index}
                    className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {csvData.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-2 py-3 text-sm text-gray-900 whitespace-nowrap">
                      <div className="max-w-xs truncate" title={String(row[column] || '-')}>
                        {row[column] || '-'}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Botón de Procesar */}
      {onProcess && (
        <div className="flex justify-center">
          <button
            onClick={onProcess}
            disabled={processing}
            className={`px-6 py-3 rounded-lg font-medium ${
              processing
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {processing ? 'Procesando...' : 'Procesar CSV'}
          </button>
        </div>
      )}
    </div>
  )
}








































