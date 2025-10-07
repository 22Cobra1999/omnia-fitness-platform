"use client"

import React, { useState, useRef } from 'react'
import Papa from 'papaparse'
import { CSVPreviewModular } from './csv-preview-modular'

interface CSVImportModularProps {
  activityId: number
  coachId: string
  onSuccess?: () => void
}

export function CSVImportModular({ activityId, coachId, onSuccess }: CSVImportModularProps) {
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Por favor selecciona un archivo CSV')
      return
    }

    setFile(selectedFile)
    setError(null)
    setResult(null)
    setLoading(true)

    // Parsear el archivo CSV
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        
        setLoading(false)
        if (results.errors.length > 0) {
          console.error('❌ Errores en el parsing:', results.errors)
          setError(`Error al parsear el CSV: ${results.errors[0].message}`)
          return
        }
        if (results.data.length === 0) {
          setError('El archivo CSV está vacío')
          return
        }
        setCsvData(results.data)
        console.log('CSV parseado exitosamente:', results.data.length, 'filas')
      },
      error: (error) => {
        setLoading(false)
        setError(`Error al leer el archivo: ${error.message}`)
      }
    })
  }

  const handleProcess = async () => {
    if (!csvData.length) return

    setProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/process-csv-modular', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          csvData,
          activityId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error procesando el CSV')
      }

      setResult(data)
      console.log('CSV procesado exitosamente:', data)

      // Limpiar formulario
      setFile(null)
      setCsvData([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Llamar callback de éxito
      if (onSuccess) {
        onSuccess()
      }

    } catch (error) {
      console.error('Error procesando CSV:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setProcessing(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setCsvData([])
    setError(null)
    setResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Formulario de Subida */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Importar Programa de Ejercicios
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Archivo CSV
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {loading && (
            <div className="text-center py-4">
              <div className="inline-flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Procesando archivo...
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    ¡CSV Procesado Exitosamente!
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>{result.message}</p>
                    {result.summary && (
                      <div className="mt-2">
                        <p>• {result.summary.successful} ejercicios procesados</p>
                        <p>• {result.summary.total_rows} filas totales</p>
                        {result.summary.failed > 0 && (
                          <p>• {result.summary.failed} errores</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview del CSV */}
      {csvData.length > 0 && (
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Vista Previa del Programa
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Revisa los datos antes de procesarlos
            </p>
          </div>
          <div className="p-4">
            <CSVPreviewModular 
              csvData={csvData} 
              onProcess={handleProcess}
              processing={processing}
            />
          </div>
        </div>
      )}

      {/* Formato Esperado */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="text-md font-semibold text-blue-900 mb-2">
          Formato CSV Esperado
        </h4>
        <div className="text-sm text-blue-800">
          <p className="mb-2">El archivo CSV debe contener las siguientes columnas:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            <div>• Semana</div>
            <div>• Día</div>
            <div>• Nombre de la Actividad</div>
            <div>• Descripción</div>
            <div>• Duración (min)</div>
            <div>• Tipo de Ejercicio</div>
            <div>• Nivel de Intensidad</div>
            <div>• Equipo Necesario</div>
            <div>• 1RM</div>
            <div>• Detalle de Series (peso-repeticiones-series)</div>
            <div>• Partes del Cuerpo</div>
            <div>• Calorías</div>
            <div>• video_url</div>
          </div>
          <p className="mt-2 text-xs">
            <strong>Ejemplo de series:</strong> (80-8-4);(85-6-3);(90-4-2)
          </p>
        </div>
      </div>
    </div>
  )
}
