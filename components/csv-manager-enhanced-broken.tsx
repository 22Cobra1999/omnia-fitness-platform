"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, Download, Trash2, CheckCircle, AlertCircle, Plus, Eye, X, Clock, Flame, Video } from 'lucide-react'

interface CSVManagerEnhancedProps {
  activityId: number
  coachId: string
  onSuccess?: () => void
  onRemoveCSV?: () => void
  onDownloadCSV?: () => void
  csvFileName?: string
  csvData?: string[][]
  setCsvData?: (data: string[][]) => void
  selectedRows?: Set<number>
  setSelectedRows?: (rows: Set<number>) => void
}

interface ExerciseData {
  id?: number
  isExisting?: boolean
  video_url?: string
  created_at?: string
  'Nombre de la Actividad'?: string
  'Tipo de Ejercicio'?: string
  'Detalle de Series (peso-repeticiones-series)'?: string
  [key: string]: any
}

export function CSVManagerEnhanced({ 
  activityId, 
  coachId, 
  onSuccess, 
  onRemoveCSV,
  onDownloadCSV,
  csvFileName,
  csvData: parentCsvData,
  setCsvData: parentSetCsvData,
  selectedRows: parentSelectedRows,
  setSelectedRows: parentSetSelectedRows
}: CSVManagerEnhancedProps) {
  
  const [csvData, setCsvData] = useState<ExerciseData[]>([])
  const [existingData, setExistingData] = useState<ExerciseData[]>([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [selectedRows, setSelectedRows] = useState<Set<number>>(parentSelectedRows || new Set())
  const videoInputRef = useRef<HTMLInputElement | null>(null)
  
  // Sincronizar estado local con props del padre
  useEffect(() => {
      parentCsvDataLength: parentCsvData?.length || 0,
      parentSelectedRowsSize: parentSelectedRows?.size || 0,
      activityId
    })
    
    if (parentCsvData && parentCsvData.length > 0) {
      setCsvData(parentCsvData)
    }
    
    if (parentSelectedRows && parentSelectedRows.size > 0) {
      setSelectedRows(parentSelectedRows)
    }
  }, [parentCsvData, parentSelectedRows])

  const [showVideoModal, setShowVideoModal] = useState(false)
  const [mode, setMode] = useState<'manual' | 'csv' | 'existentes'>('existentes')
  const [existingCatalog, setExistingCatalog] = useState<any[]>([])
  const [selectedExisting, setSelectedExisting] = useState<string>('')

  // Cargar datos existentes al montar el componente
  useEffect(() => {
    if (activityId && activityId > 0) {
      loadExistingData()
    } else {
      setExistingData([])
    }
  }, [activityId])

  const loadExistingData = async () => {
    if (!activityId || activityId <= 0) {
      return
    }
    setLoadingExisting(true)
    try {
      const response = await fetch(`/api/activity-exercises/${activityId}`)
      const result = await response.json()
      
      if (result.success) {
        setExistingData(result.data)
        
        // Notificar al padre que se cargaron datos existentes
        if (parentSetCsvData) {
          parentSetCsvData(result.data)
        }
      } else {
      }
    } catch (error) {
      console.error('❌ Error cargando datos existentes:', error)
    } finally {
      setLoadingExisting(false)
    }
  }

  // Combinar datos existentes y nuevos para mostrar
  const allData = (csvData.length > 0 ? csvData : (parentCsvData && parentCsvData.length > 0 ? parentCsvData as any[] : existingData))
  const totalExercises = allData.length
  const newExercises = csvData.length
  const existingCount = existingData.length

  return (
    <div className="text-white p-4 w-full max-w-none pb-24">
      {/* Selector de modo */}
      <div className="mb-4">
        <div className="inline-flex items-center bg-zinc-900/80 border border-zinc-800 rounded-xl p-1 shadow-inner">
          {([
            { key: 'manual', label: 'Crear ejercicios manualmente' },
            { key: 'csv', label: 'Subir CSV' },
            { key: 'existentes', label: 'Agregar existentes' }
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMode(tab.key)}
              className={`px-4 py-2 text-xs rounded-lg transition-all ${
                mode === tab.key
                  ? 'bg-[#FF7939] text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      {(allData.length > 0 || csvData.length > 0) && (
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-full">
            <thead>
              <tr>
                <th className="px-2 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-12">
                  Editar
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-16">
                  <input
                    type="checkbox"
                    className="rounded border-gray-600 bg-black text-orange-500 focus:ring-orange-500 w-3 h-3"
                    onChange={(e) => {
                      const currentData = csvData.length > 0 ? csvData : (parentCsvData || [])
                      if (e.target.checked) {
                        setSelectedRows(new Set(currentData.map((_, index) => index)))
                      } else {
                        setSelectedRows(new Set())
                      }
                    }}
                  />
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-16">Estado</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-48">Ejercicio</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-48">Descripción</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-20">Duración</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-24">Tipo</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-32">Equipo</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-32">P-R-S</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-32">Partes</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-20">Calorías</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-24">Intensidad</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-32">Video</th>
              </tr>
            </thead>
            <tbody>
              {allData.map((item, index) => (
                <tr key={index} className="border-b border-gray-700 hover:bg-zinc-900/40">
                  {/* Columna Editar */}
                  <td className="px-2 py-3 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-400 hover:bg-blue-400/10 p-1 h-5 w-5"
                      title="Editar ejercicio"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </td>
                  
                  {/* Columna Checkbox */}
                  <td className="px-3 py-3">
                    {!item.isExisting && (
                      <input
                        type="checkbox"
                        className="rounded border-gray-600 bg-black text-orange-500 focus:ring-orange-500 w-3 h-3"
                        checked={selectedRows.has(index)}
                        onChange={() => {
                          const newSelected = new Set(selectedRows)
                          if (newSelected.has(index)) {
                            newSelected.delete(index)
                          } else {
                            newSelected.add(index)
                          }
                          setSelectedRows(newSelected)
                        }}
                      />
                    )}
                  </td>
                  
                  {/* Columna Estado */}
                  <td className="px-3 py-3 text-xs text-white">
                    {item.isExisting ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-900/20 text-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Existente
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-900/20 text-blue-300">
                        <Plus className="h-3 w-3 mr-1" />
                        Nuevo
                      </span>
                    )}
                  </td>
                  
                  {/* Columna Ejercicio */}
                  <td className="px-3 py-3 text-xs text-white font-medium whitespace-pre-wrap break-words">
                    {item['Nombre de la Actividad'] || item.nombre || item.nombre_actividad || '-'}
                  </td>
                  
                  {/* Columna Descripción */}
                  <td className="px-3 py-3 text-xs text-white whitespace-pre-wrap break-words">
                    {item['Descripción'] || item.descripcion || '-'}
                  </td>
                  
                  {/* Columna Duración */}
                  <td className="px-3 py-3 text-xs text-white whitespace-pre-wrap break-words">
                    {item['Duración (min)'] || item.duracion_min || '-'}
                  </td>
                  
                  {/* Columna Tipo */}
                  <td className="px-3 py-3 text-xs text-white whitespace-pre-wrap break-words">
                    {item['Tipo de Ejercicio'] || item.tipo_ejercicio || '-'}
                  </td>
                  
                  {/* Columna Equipo */}
                  <td className="px-3 py-3 text-xs text-white whitespace-pre-wrap break-words">
                    {item['Equipo Necesario'] || item.equipo_necesario || '-'}
                  </td>
                  
                  {/* Columna P-R-S (Detalle de Series) */}
                  <td className="px-3 py-3 text-xs text-white whitespace-pre-wrap break-words">
                    {(() => {
                      const candidates = [
                        item['Detalle de Series (peso-repeticiones-series)'],
                        item['Detalle de Series'],
                        item['P-R-S'],
                        item.detalle_series
                      ]
                      const value = candidates.find(c => c && c.trim())
                      return value || '-'
                    })()}
                  </td>
                  
                  {/* Columna Partes */}
                  <td className="px-3 py-3 text-xs text-white whitespace-pre-wrap break-words">
                    {item['Partes del Cuerpo'] || item.body_parts || '-'}
                  </td>
                  
                  {/* Columna Calorías */}
                  <td className="px-3 py-3 text-xs text-white whitespace-pre-wrap break-words">
                    {item['Calorías'] || item.calorias || '-'}
                  </td>
                  
                  {/* Columna Intensidad */}
                  <td className="px-3 py-3 text-xs text-white whitespace-pre-wrap break-words">
                    {item['Nivel de Intensidad'] || item.intensidad || '-'}
                  </td>
                  
                  {/* Columna Video */}
                  <td className="px-3 py-3 text-xs text-white whitespace-pre-wrap break-words">
                    {(() => {
                      const url = item.video_url || item.video_file_name
                      if (!url) return '-'
                      try {
                        const name = url.toString().split('/').pop() || url.toString()
                        return name.length > 20 ? name.slice(0, 20) + '…' : name
                      } catch {
                        return url.toString().length > 20 ? url.toString().slice(0, 20) + '…' : url.toString()
                      }
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
