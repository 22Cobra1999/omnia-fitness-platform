"use client"

import React, { useState, useRef } from 'react'
import Papa from 'papaparse'
import { CSVFullWidthTable } from './csv-full-width-table'
import { validateSimpleCSVHeaders } from '@/lib/data/csv-parser'

interface CSVImportSimpleProps {
  activityId: number
  coachId: string
  onSuccess?: () => void
}

export function CSVImportSimple({ activityId, coachId, onSuccess }: CSVImportSimpleProps) {
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

        // Validar headers
        if (!validateSimpleCSVHeaders(results.meta.fields || [])) {
          setError('El CSV no tiene el formato correcto. Asegúrate de que tenga las columnas: Mes, Semana, Día, Nombre de la Actividad, etc.')
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
      const response = await fetch('/api/process-csv-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          csvData: csvData,
          activityId: activityId,
          coachId: coachId
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al procesar el CSV')
      }

      setResult(result)
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('❌ Error procesando CSV:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setProcessing(false)
    }
  }

  const handleReset = () => {
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
      {/* Upload Section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 48 48">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" />
            </svg>
          </div>
          <div className="mt-4">
            <label htmlFor="csv-file" className="cursor-pointer">
              <span className="mt-2 block text-sm font-medium text-gray-900">
                {file ? file.name : 'Seleccionar archivo CSV'}
              </span>
              <span className="mt-1 block text-sm text-gray-500">
                Haz clic para seleccionar un archivo CSV
              </span>
            </label>
            <input
              ref={fileInputRef}
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="sr-only"
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-gray-600">Parseando CSV...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Success State */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">¡Éxito!</h3>
              <div className="mt-2 text-sm text-green-700">
                {result.message}
                {result.results && result.results.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Ejercicios creados:</p>
                    <ul className="list-disc list-inside text-xs">
                      {result.results.map((r: any, i: number) => (
                        <li key={i}>
                          Fila {r.row}: {r.exercise} (ID: {r.ejercicio_id})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium text-red-600">Errores:</p>
                    <ul className="list-disc list-inside text-xs text-red-600">
                      {result.errors.map((error: string, i: number) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {csvData.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Vista Previa</h3>
            <button
              onClick={handleReset}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cambiar archivo
            </button>
          </div>
          <CSVFullWidthTable 
            csvData={csvData} 
            onProcess={handleProcess}
            processing={processing}
          />
        </div>
      )}
    </div>
  )
}
