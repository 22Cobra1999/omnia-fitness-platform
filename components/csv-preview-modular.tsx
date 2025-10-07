"use client"

import React from 'react'
import { parseModularCSVRow, formatSeriesForDisplay, calculateTotalReps, calculateAverageWeight } from '@/lib/csv-parser-modular'

// Función para generar preview de variantes
function generateVariantesPreview(tipo: string, nombre: string): string {
  const nombreLower = nombre.toLowerCase()
  
  // Variantes específicas por nombre
  if (nombreLower.includes('sentadilla')) {
    return 'Clásica; Búlgara; Goblet; Sumo'
  }
  if (nombreLower.includes('press') && nombreLower.includes('banca')) {
    return 'Plano; Inclinado; Declinado'
  }
  if (nombreLower.includes('press') && nombreLower.includes('militar')) {
    return 'Militar; Arnold; Mancuernas'
  }
  if (nombreLower.includes('remo')) {
    return 'Barra; Mancuernas; T; Invertido'
  }
  if (nombreLower.includes('burpee')) {
    return 'Clásico; Con salto; Sin salto; Con flexión'
  }
  if (nombreLower.includes('deadlift') || nombreLower.includes('peso muerto')) {
    return 'Clásico; Rumano; Sumo; Mancuernas'
  }
  
  // Variantes por tipo
  switch (tipo.toLowerCase()) {
    case 'fuerza':
      return 'Básica; Intermedia; Avanzada'
    case 'hiit':
      return 'Baja intensidad; Media intensidad; Alta intensidad'
    case 'cardio':
      return 'Suave; Moderada; Intensa'
    case 'flexibilidad':
      return 'Básica; Intermedia; Avanzada'
    default:
      return 'Básica; Intermedia; Avanzada'
  }
}

interface CSVPreviewModularProps {
  csvData: any[]
  onProcess?: () => void
  processing?: boolean
}

export function CSVPreviewModular({ csvData, onProcess, processing = false }: CSVPreviewModularProps) {
  
  if (!csvData || csvData.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No hay datos CSV para mostrar
      </div>
    )
  }

  
  const parsedData = csvData
    .map((row, index) => {
      const parsed = parseModularCSVRow(row)
      return parsed ? { ...parsed, originalIndex: index } : null
    })
    .filter(Boolean)


  const totalExercises = parsedData.length
  const totalWeeks = Math.max(...parsedData.map(d => d.semana))
  const exercisesByWeek = parsedData.reduce((acc, exercise) => {
    acc[exercise.semana] = (acc[exercise.semana] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Resumen del Programa</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Total Ejercicios:</span>
            <p className="text-blue-700">{totalExercises}</p>
          </div>
          <div>
            <span className="font-medium">Semanas:</span>
            <p className="text-blue-700">{totalWeeks}</p>
          </div>
          <div>
            <span className="font-medium">Ejercicios/Semana:</span>
            <p className="text-blue-700">{Math.round(totalExercises / totalWeeks)}</p>
          </div>
          <div>
            <span className="font-medium">Tipos de Ejercicio:</span>
            <p className="text-blue-700">
              {new Set(parsedData.map(d => d.tipo_ejercicio)).size}
            </p>
          </div>
        </div>
      </div>

      {/* Tabla de Preview */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mes
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Semana
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Día
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ejercicio
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Intensidad
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duración
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Series
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipo
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Partes del Cuerpo
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variantes
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Calorías
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {parsedData.map((exercise, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    {exercise.mes || 1}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    {exercise.semana}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {exercise.dia}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{exercise.nombre}</div>
                      {exercise.descripcion && (
                        <div className="text-gray-500 text-xs mt-1">
                          {exercise.descripcion}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {exercise.tipo_ejercicio}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      exercise.nivel_intensidad.toLowerCase() === 'alto' 
                        ? 'bg-red-100 text-red-800'
                        : exercise.nivel_intensidad.toLowerCase() === 'medio'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {exercise.nivel_intensidad}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {exercise.duracion_min} min
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900">
                    <div className="max-w-xs">
                      <div className="text-xs font-medium">
                        {formatSeriesForDisplay(exercise.detalle_series)}
                      </div>
                      {exercise.detalle_series && (
                        <div className="text-xs text-gray-500 mt-1">
                          Total: {calculateTotalReps(exercise.detalle_series)} reps
                          {calculateAverageWeight(exercise.detalle_series) > 0 && (
                            <span> • Promedio: {calculateAverageWeight(exercise.detalle_series)}kg</span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900">
                    <div className="max-w-xs">
                      {exercise.equipo_necesario}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900">
                    <div className="max-w-xs">
                      {exercise.partes_cuerpo}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900">
                    <div className="max-w-xs">
                      {generateVariantesPreview(exercise.tipo_ejercicio, exercise.nombre)}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {exercise.calorias ? `${exercise.calorias} cal` : '-'}
                  </td>
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
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {processing ? 'Procesando...' : 'Procesar CSV'}
          </button>
        </div>
      )}

      {/* Estadísticas por Semana */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-md font-semibold text-gray-900 mb-3">Distribución por Semana</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(exercisesByWeek)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([week, count]) => (
              <div key={week} className="text-center">
                <div className="text-lg font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600">Semana {week}</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
