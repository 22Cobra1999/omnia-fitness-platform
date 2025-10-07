"use client"

import React, { useState, useRef, useEffect } from 'react'
import Papa from 'papaparse'
import { validateSimpleCSVHeaders, SimpleExerciseData } from '@/lib/csv-parser-simple'
import { Button } from '@/components/ui/button'
import { Upload, Download, Trash2, CheckCircle, AlertCircle, Plus, Eye, X, Clock, Flame, Video } from 'lucide-react'
import { VideoSelectionModal } from '@/components/video-selection-modal'

interface CSVManagerEnhancedProps {
  activityId: number
  coachId: string
  onSuccess?: () => void
  onRemoveCSV?: () => void
  onDownloadCSV?: () => void
  csvFileName?: string
  // Props para persistir estado desde el padre
  csvData?: string[][]
  setCsvData?: (data: string[][]) => void
  selectedRows?: Set<number>
  setSelectedRows?: (rows: Set<number>) => void
}

interface ExerciseData extends SimpleExerciseData {
  id?: number
  isExisting?: boolean
  video_url?: string
  created_at?: string
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
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<ExerciseData[]>([])
  const [existingData, setExistingData] = useState<ExerciseData[]>([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [selectedRows, setSelectedRows] = useState<Set<number>>(parentSelectedRows || new Set())
  const videoInputRef = useRef<HTMLInputElement | null>(null)
  
  // Props recibidas del componente padre

  // Sincronizar estado local con props del padre
  useEffect(() => {
    console.log('🔄 CSVManagerEnhanced - Sincronizando con padre:', {
      parentCsvDataLength: parentCsvData?.length || 0,
      parentSelectedRowsSize: parentSelectedRows?.size || 0,
      activityId
    })
    
    if (parentCsvData && parentCsvData.length > 0) {
      setCsvData(parentCsvData)
      console.log('✅ CSV data sincronizado desde padre:', parentCsvData.length, 'filas')
    }
    
    if (parentSelectedRows !== undefined) {
      setSelectedRows(parentSelectedRows)
      console.log('✅ Selected rows sincronizado desde padre:', parentSelectedRows.size, 'filas')
    }
  }, [parentCsvData, parentSelectedRows])
  const [showVideoModal, setShowVideoModal] = useState(false)
  // modo de carga: manual, csv o existentes
  const [mode, setMode] = useState<'manual' | 'csv' | 'existentes'>('existentes')
  const [existingCatalog, setExistingCatalog] = useState<any[]>([])
  const [selectedExisting, setSelectedExisting] = useState<string>('')
  // Estado para edición
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null)
  // formulario manual
  const [manualForm, setManualForm] = useState({
    nombre: '',
    descripcion: '',
    duracion_min: '',
    tipo_ejercicio: '',
    nivel_intensidad: '',
    equipo_necesario: '',
    // detalle_series y partes_cuerpo se construyen con controles UX
    detalle_series: '',
    partes_cuerpo: '',
    calorias: ''
  })
  // UX avanzado: chips para partes del cuerpo y constructor de series
  const [bodyParts, setBodyParts] = useState<string[]>([])
  const [bodyPartInput, setBodyPartInput] = useState('')
  const [seriePeso, setSeriePeso] = useState('')
  const [serieReps, setSerieReps] = useState('')
  const [serieSeries, setSerieSeries] = useState('')
  const [seriesList, setSeriesList] = useState<Array<{peso:number, repeticiones:number, series:number}>>([])
  // chips para equipo
  const [equipoList, setEquipoList] = useState<string[]>([])
  const [equipoInput, setEquipoInput] = useState('')
  // Opciones predefinidas
  const exerciseTypes = ['Fuerza','Cardio','HIIT','Movilidad','Flexibilidad','Equilibrio','Funcional']
  const intensityLevels = ['Bajo','Medio','Alto']
  const bodyPartsOptions = [
    'Pecho','Espalda','Hombros','Bíceps','Tríceps','Core',
    // Piernas detallado
    'Cuádriceps','Vasto Externo','Vasto Interno','Recto Femoral',
    'Isquiotibiales','Bíceps Femoral','Semitendinoso','Semimembranoso',
    'Glúteo Mayor','Glúteo Medio','Glúteo Menor',
    'Aductores','Abductores',
    'Pantorrillas','Gastrocnemio','Sóleo',
    'Tibial Anterior','Flexores de Cadera'
  ]
  const equipmentOptions = ['Barra','Mancuernas','Banco','Rack','Bandas','Kettlebell','Máquinas']
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cargar datos existentes al montar el componente
  useEffect(() => {
    if (activityId && activityId > 0) {
      loadExistingData()
    } else {
      setExistingData([])
    }
    // Cargar borrador desde sessionStorage
    try {
      const saved = sessionStorage.getItem(`activities_draft_${activityId}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) setCsvData(parsed)
      }
    } catch {}
  }, [activityId])

  // Cargar catálogo de ejercicios existentes del coach al entrar en modo "existentes"
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const res = await fetch('/api/existing-exercises')
        const json = await res.json()
        if (res.ok) setExistingCatalog(json.exercises || [])
      } catch {}
    }
    if (mode === 'existentes') loadCatalog()
  }, [mode])

  // Persistir borrador al cambiar
  useEffect(() => {
    try {
      sessionStorage.setItem(`activities_draft_${activityId}`,(JSON.stringify(csvData)))
    } catch {}
  }, [csvData, activityId])

  const loadExistingData = async () => {
    if (!activityId || activityId <= 0) {
      console.log('🚫 No cargando datos existentes - activityId inválido:', activityId)
      return
    }
    console.log('🔄 Cargando datos existentes para activityId:', activityId)
    setLoadingExisting(true)
    try {
      const response = await fetch(`/api/activity-exercises/${activityId}`)
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Datos existentes cargados:', result.data.length, 'ejercicios')
        
        // Debug específico para P-R-S en datos existentes
        
        setExistingData(result.data)
        
        // Notificar al padre que se cargaron datos existentes
        // Solo sobrescribir si no hay datos persistentes con videos
        if (parentSetCsvData) {
          console.log('📤 Notificando al padre sobre datos existentes:', result.data.length, 'ejercicios')
          
          // Verificar si hay datos persistentes con videos
          const hasPersistentVideos = parentCsvData && parentCsvData.some((row: any) => row.video_url)
          
          if (hasPersistentVideos) {
            console.log('🎥 Manteniendo datos persistentes con videos, no sobrescribiendo')
            // No sobrescribir, mantener los datos persistentes
          } else {
            console.log('📝 No hay videos persistentes, cargando datos existentes')
            parentSetCsvData(result.data)
          }
        }
      } else {
        console.log('❌ Error cargando datos existentes:', result.error)
      }
    } catch (error) {
      console.error('❌ Error cargando datos existentes:', error)
    } finally {
      setLoadingExisting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    console.log('📁 ARCHIVO CSV SELECCIONADO:', {
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type,
      lastModified: new Date(selectedFile.lastModified).toISOString()
    })

    if (!selectedFile.name.endsWith('.csv')) {
      console.log('❌ ARCHIVO NO ES CSV:', selectedFile.name)
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
        console.log('📊 CSV PARSEADO POR PAPA PARSE:', {
          totalRows: results.data.length,
          totalColumns: results.meta.fields?.length || 0,
          headers: results.meta.fields || [],
          errors: results.errors.length,
          errorsDetails: results.errors
        })
        
        setLoading(false)
        if (results.errors.length > 0) {
          console.error('❌ ERRORES EN EL PARSING:', results.errors)
          setError(`Error al parsear el CSV: ${results.errors[0].message}`)
          return
        }
        if (results.data.length === 0) {
          console.log('❌ ARCHIVO CSV VACÍO')
          setError('El archivo CSV está vacío')
          return
        }

        // Validar headers
        if (!validateSimpleCSVHeaders(results.meta.fields || [])) {
          setError('El CSV no tiene el formato correcto. Asegúrate de que tenga las columnas: Nombre de la Actividad, Descripción, Duración (min), Tipo de Ejercicio, Nivel de Intensidad, Equipo Necesario, Detalle de Series (peso-repeticiones-series), Partes del Cuerpo, Calorías')
          return
        }

        // Log detallado de cada fila y columna con valores específicos
        console.log('🔍 ANÁLISIS DETALLADO DEL CSV:')
        results.data.forEach((row, rowIndex) => {
          console.log(`\n📝 FILA ${rowIndex + 1} - EJERCICIO ${rowIndex + 1}:`)
          console.log(`  📋 Datos completos:`, row)
          
          Object.keys(row).forEach((column, colIndex) => {
            const value = row[column]
            const valueType = typeof value
            const valueLength = value ? value.toString().length : 0
            const isEmpty = !value || value.toString().trim() === ''
            
            console.log(`  📊 Columna ${colIndex + 1} - ${column}:`)
            console.log(`    💾 Valor: "${value}"`)
            console.log(`    🔢 Tipo: ${valueType}`)
            console.log(`    📏 Longitud: ${valueLength} caracteres`)
            console.log(`    ❓ Vacío: ${isEmpty ? 'SÍ' : 'NO'}`)
            console.log(`    🎯 Valor procesado: "${value ? value.toString().trim() : 'VACÍO'}"`)
          })
        })
        
        // Log de headers encontrados
        console.log('📋 HEADERS ENCONTRADOS:', results.meta.fields)
        console.log('\n📊 RESUMEN DETALLADO POR COLUMNA:')
        results.meta.fields?.forEach((header, index) => {
          const allValues = results.data.map(row => row[header])
          const nonEmptyValues = allValues.filter(val => val && val.toString().trim())
          const emptyValues = allValues.filter(val => !val || val.toString().trim() === '')
          
          console.log(`\n  📊 COLUMNA ${index + 1} - ${header}:`)
          console.log(`    📈 Total valores: ${allValues.length}`)
          console.log(`    ✅ Valores no vacíos: ${nonEmptyValues.length}`)
          console.log(`    ❌ Valores vacíos: ${emptyValues.length}`)
          console.log(`    📋 Valores encontrados:`, nonEmptyValues.slice(0, 3)) // Primeros 3 valores
          if (nonEmptyValues.length > 3) {
            console.log(`    ... y ${nonEmptyValues.length - 3} más`)
          }
        })
        
        // Marcar como nuevos datos
        const newData = (results.data as any[]).map(item => ({
          ...item,
          isExisting: false
        }))
        
        console.log('\n✅ DATOS PROCESADOS FINALMENTE:')
        console.log(`📊 Total filas: ${newData.length}`)
        console.log(`📋 Claves disponibles:`, Object.keys(newData[0] || {}))
        
        // Mostrar tabla visual de los datos
        console.log('\n📋 TABLA VISUAL DE DATOS:')
        console.log('┌─────┬─────────────────────────────────────────────────────────────────────────────┐')
        console.log('│ Fila│ Datos del Ejercicio                                                      │')
        console.log('├─────┼─────────────────────────────────────────────────────────────────────────────┤')
        
        newData.forEach((row, index) => {
          const nombre = row['Nombre de la Actividad'] || row.nombre || 'Sin nombre'
          const duracion = row['Duración (min)'] || row.duracion_min || 'N/A'
          const intensidad = row['Nivel de Intensidad'] || row.intensidad || 'N/A'
          const calorias = row['Calorías'] || row.calorias || 'N/A'
          
          console.log(`│ ${String(index + 1).padStart(3)} │ ${nombre.substring(0, 60).padEnd(60)} │`)
          console.log(`│     │ Duración: ${duracion}min | Intensidad: ${intensidad} | Calorías: ${calorias}${' '.repeat(20)} │`)
          if (index < newData.length - 1) {
            console.log('├─────┼─────────────────────────────────────────────────────────────────────────────┤')
          }
        })
        
        console.log('└─────┴─────────────────────────────────────────────────────────────────────────────┘')
        
        // Agregar a los datos existentes en lugar de reemplazar
        setCsvData(prev => {
          const combined = [...prev, ...newData]
          console.log('📊 DATOS COMBINADOS:', {
            previousRows: prev.length,
            newRows: newData.length,
            totalRows: combined.length
          })
          return combined
        })
        
        // Actualizar estado del padre si está disponible
        if (parentSetCsvData) {
          const currentParentData = parentCsvData || []
          const newParentData = [...currentParentData, ...newData]
          parentSetCsvData(newParentData)
          // Estado del padre actualizado con CSV
        }
      },
      error: (error) => {
        setLoading(false)
        setError(`Error al leer el archivo: ${error.message}`)
      }
    })
  }

  const handleProcess = async () => {
    if (!csvData.length) return
    if (!activityId || activityId <= 0) {
      setError('Primero guarda el programa para obtener un ID y poder guardar ejercicios.')
      return
    }

    setProcessing(true)
    setError(null)

        try {
          // console.log('🚀 Enviando datos al servidor:', {
          //   csvData: csvData,
          //   activityId: activityId,
          //   coachId: coachId
          // })

      const response = await fetch('/api/process-csv-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          csvData,
          activityId,
          coachId
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al procesar el CSV')
      }

      setResult(result)
      // console.log('✅ CSV procesado exitosamente:', result)
      
      // Recargar datos existentes
      await loadExistingData()
      
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
    setSelectedRows(new Set())
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDownloadTemplate = () => {
    // Siempre disponible para preparar datos, incluso sin activityId
    const link = document.createElement('a')
    link.href = '/ejemplo-programa-fuerza-sin-1rm.csv'
    link.download = 'ejemplo-programa-fuerza-sin-1rm.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleRowSelection = (index: number) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedRows(newSelected)
  }

  // Función para editar ejercicio individual
  const handleEditExercise = (exercise: ExerciseData, index: number) => {
    console.log('✏️ Editando ejercicio:', exercise, 'índice:', index)
    
    // Cambiar al modo manual para editar
    setMode('manual')
    
    // Cargar datos del ejercicio en el formulario manual
    const exerciseData = {
      nombre: exercise['Nombre de la Actividad'] || exercise.nombre_ejercicio || exercise.nombre || '',
      descripcion: exercise['Descripción'] || exercise.descripcion || exercise.Descripción || '',
      duracion_min: exercise['Duración (min)'] || exercise.duracion_min || exercise.Duración || '',
      tipo_ejercicio: exercise['Tipo de Ejercicio'] || exercise.tipo_ejercicio || '',
      nivel_intensidad: exercise['Nivel de Intensidad'] || exercise.intensidad || '',
      equipo_necesario: exercise['Equipo Necesario'] || exercise.equipo_necesario || '',
      detalle_series: exercise['Detalle de Series (peso-repeticiones-series)'] || exercise.detalle_series || '',
      partes_cuerpo: exercise['Partes del Cuerpo'] || exercise.body_parts || '',
      calorias: exercise.Calorías || exercise.calorias || ''
    }
    
    // Actualizar el formulario manual con los datos del ejercicio
    setManualForm(exerciseData)
    
    // Parsear partes del cuerpo si están en formato string
    if (exerciseData.partes_cuerpo) {
      const bodyPartsArray = exerciseData.partes_cuerpo
        .toString()
        .split(/;|,/)
        .filter(Boolean)
        .map((p: string) => p.trim())
      setBodyParts(bodyPartsArray)
    }
    
    // Parsear equipo necesario si están en formato string
    if (exerciseData.equipo_necesario) {
      const equipoArray = exerciseData.equipo_necesario
        .toString()
        .split(/;|,/)
        .filter(Boolean)
        .map((e: string) => e.trim())
      setEquipoList(equipoArray)
    }
    
    // Parsear series si están en formato string
    if (exerciseData.detalle_series) {
      try {
        const seriesString = exerciseData.detalle_series.toString()
        const seriesMatches = seriesString.match(/\(([^)]+)\)/g)
        if (seriesMatches) {
          const parsedSeries = seriesMatches.map(series => {
            const content = series.replace(/[()]/g, '')
            const parts = content.split('-')
            return {
              peso: parts[0] || '',
              repeticiones: parts[1] || '',
              series: parts[2] || ''
            }
          })
          setSeriesList(parsedSeries)
        }
      } catch (error) {
        console.error('Error parseando series:', error)
      }
    }
    
    // Guardar el índice del ejercicio que se está editando
    setEditingExerciseIndex(index)
    
    console.log('✅ Datos cargados en formulario manual:', exerciseData)
  }

  // Función para cancelar edición
  const cancelEdit = () => {
    console.log('❌ Cancelando edición')
    setEditingExerciseIndex(null)
    setMode('manual')
    
    // Limpiar formulario
    setManualForm({
      nombre: '', descripcion: '', duracion_min: '', tipo_ejercicio: '',
      nivel_intensidad: '', equipo_necesario: '', detalle_series: '',
      partes_cuerpo: '', calorias: ''
    })
    setBodyParts([])
    setBodyPartInput('')
    setEquipoList([])
    setEquipoInput('')
    setSeriesList([])
    setSeriePeso('')
    setSerieReps('')
    setSerieSeries('')
  }

  const handleDeleteSelected = () => {
    if (selectedRows.size === 0) return
    
    // Obtener los datos actuales (local o del padre)
    const currentData = csvData.length > 0 ? csvData : (parentCsvData || [])
    const newData = (currentData as any[]).filter((_, index) => !selectedRows.has(index))
    
    // Actualizar estado local
    setCsvData(newData)
    
    // Actualizar estado del padre si está disponible
    if (parentSetCsvData) {
      parentSetCsvData(newData)
      console.log('🗑️ Filas eliminadas del estado del padre')
    }
    
    setSelectedRows(new Set())
  }

  const handleAssignVideo = () => {
    if (selectedRows.size === 0) {
      setError('Selecciona al menos una fila para asignar video')
      return
    }
    setShowVideoModal(true)
  }

  const addManualExercise = () => {
    // Validaciones mínimas
    if (!manualForm.nombre.trim()) {
      setError('Completa al menos el campo "Nombre de la Actividad"')
      return
    }
    setError(null)
    
    // Construir campos a partir de los controles UX
    const detalleSeriesStr = seriesList.length
      ? seriesList.map(s => `(${s.peso}-${s.repeticiones}-${s.series})`).join(';')
      : manualForm.detalle_series
    const partesCuerpoStr = bodyParts.length
      ? bodyParts.join(';')
      : manualForm.partes_cuerpo
    const equipoNecesarioStr = equipoList.length
      ? equipoList.join(', ')
      : manualForm.equipo_necesario
    const item: any = {
      'Nombre de la Actividad': manualForm.nombre,
      'Descripción': manualForm.descripcion,
      'Duración (min)': manualForm.duracion_min,
      'Tipo de Ejercicio': manualForm.tipo_ejercicio,
      'Nivel de Intensidad': manualForm.nivel_intensidad,
      'Equipo Necesario': equipoNecesarioStr,
      'Detalle de Series (peso-repeticiones-series)': detalleSeriesStr,
      'Partes del Cuerpo': partesCuerpoStr,
      'Calorías': manualForm.calorias,
      isExisting: false
    }
    
    if (editingExerciseIndex !== null) {
      // Modo edición: actualizar ejercicio existente
      console.log('✏️ Actualizando ejercicio en índice:', editingExerciseIndex)
      setCsvData(prev => {
        const newData = [...prev]
        newData[editingExerciseIndex] = item
        console.log('✅ Ejercicio actualizado:', newData.length, 'filas totales')
        return newData
      })
      
      // Actualizar estado del padre si está disponible
      if (parentSetCsvData) {
        const newParentData = [...(parentCsvData || [])]
        newParentData[editingExerciseIndex] = item
        console.log('📤 Actualizando estado del padre con ejercicio editado:', newParentData.length, 'filas')
        parentSetCsvData(newParentData)
      }
      
      // Limpiar estado de edición
      setEditingExerciseIndex(null)
    } else {
      // Modo creación: agregar nuevo ejercicio
      console.log('➕ Agregando nuevo ejercicio')
      setCsvData(prev => {
        const newData = [...prev, item]
        console.log('➕ Fila manual agregada:', newData.length, 'filas totales')
        return newData
      })
      
      // Actualizar estado del padre si está disponible
      if (parentSetCsvData) {
        const newParentData = [...(parentCsvData || []), item]
        console.log('📤 Actualizando estado del padre con fila manual:', newParentData.length, 'filas')
        parentSetCsvData(newParentData)
      }
    }
    
    // Limpiar formulario
    setManualForm({
      nombre: '', descripcion: '', duracion_min: '', tipo_ejercicio: '',
      nivel_intensidad: '', equipo_necesario: '', detalle_series: '',
      partes_cuerpo: '', calorias: ''
    })
    setBodyParts([])
    setBodyPartInput('')
    setEquipoList([])
    setEquipoInput('')
    setSeriesList([])
    setSeriePeso('')
    setSerieReps('')
    setSerieSeries('')
  }

  // Combinar datos existentes y nuevos para mostrar
  // SIEMPRE usar csvData (estado persistente) como fuente principal; si está vacío, usar parentCsvData; si no, existingData
  const allData = (csvData.length > 0 ? csvData : (parentCsvData && parentCsvData.length > 0 ? parentCsvData as any[] : existingData))
  const totalExercises = allData.length
  const newExercises = csvData.length
  const existingCount = existingData.length
  // Datos de la tabla procesados
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
                  ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bloque CSV */}
      {mode === 'csv' && (
        <div>
          <div className="flex space-x-2 mb-4">
            <Button
              onClick={handleDownloadTemplate}
              className="bg-orange-600 hover:bg-orange-700 text-white border-0 h-7 px-3 text-xs flex-1"
              size="sm"
            >
              <Download className="h-3 w-3 mr-1" />
              Plantilla (CSV)
            </Button>
          </div>
        
          {/* Upload Section */}
          {!file && (
            <div className="mb-4">
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center">
                  <Upload className="h-4 w-4 text-white mr-2" />
                  <span className="text-sm text-white">Subir CSV</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-orange-600 hover:bg-orange-700 text-white border-0 h-8 px-3 text-xs"
                >
                  <Upload className="h-3 w-3 mr-1" />
                  Archivo
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

    {/* Modal selección/subida de video del coach */}
    <VideoSelectionModal
      isOpen={showVideoModal}
      onClose={() => setShowVideoModal(false)}
      onVideoSelected={(url) => {
        console.log('🎥 Video seleccionado:', {
          url,
          selectedRowsCount: selectedRows.size,
          selectedRows: Array.from(selectedRows),
          hasParentData: !!parentCsvData,
          hasParentSetter: !!parentSetCsvData
        })
        
        // Actualizar estado local
        setCsvData(prev => {
          const newData = prev.map((row, idx) => (
            selectedRows.has(idx) ? { ...row, video_url: url } : row
          ))
          console.log('📝 Estado local actualizado:', newData.length, 'filas')
          return newData
        })
        
        // Actualizar estado del padre si está disponible
        if (parentCsvData && parentSetCsvData) {
          const newParentData = parentCsvData.map((row, idx) => (
            selectedRows.has(idx) ? { ...row, video_url: url } : row
          ))
          parentSetCsvData(newParentData)
          console.log('📝 Estado del padre actualizado:', newParentData.length, 'filas')
        } else {
          console.log('⚠️ No se pudo actualizar estado del padre - faltan props')
        }
        
        setShowVideoModal(false)
      }}
      selectedRowsCount={selectedRows.size}
    />

      {/* Bloque Manual */}
      {mode === 'manual' && (
        <div className="mb-4 space-y-5">
          
          {/* Nombre y descripción */}
          <div className="space-y-3">
            <input className="bg-zinc-900/60 px-3 py-2 rounded text-sm w-full" placeholder="Nombre de la Actividad" value={manualForm.nombre} onChange={(e)=>setManualForm({...manualForm, nombre:e.target.value})} />
            <textarea className="bg-zinc-900/60 px-3 py-2 rounded text-sm w-full" rows={2} placeholder="Descripción" value={manualForm.descripcion} onChange={(e)=>setManualForm({...manualForm, descripcion:e.target.value})} />
          </div>
          {/* Duración y Calorías con iconos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <div className="absolute left-2 top-2 text-zinc-400"><Clock className="h-4 w-4" /></div>
              <input className="bg-zinc-900/60 pl-8 pr-3 py-2 rounded text-sm w-full" placeholder="Duración (min)" value={manualForm.duracion_min} onChange={(e)=>setManualForm({...manualForm, duracion_min:e.target.value})} />
            </div>
            <div className="relative">
              <div className="absolute left-2 top-2 text-zinc-400"><Flame className="h-4 w-4" /></div>
              <input className="bg-zinc-900/60 pl-8 pr-3 py-2 rounded text-sm w-full" placeholder="Calorías" value={manualForm.calorias} onChange={(e)=>setManualForm({...manualForm, calorias:e.target.value})} />
            </div>
          </div>
          {/* Tipo y Nivel */}
          <div className="grid grid-cols-2 gap-3">
            <select className="bg-zinc-900/60 px-3 py-2 rounded text-sm" value={manualForm.tipo_ejercicio} onChange={(e)=>setManualForm({...manualForm, tipo_ejercicio:e.target.value})}>
              <option value="">Tipo de Ejercicio</option>
              {exerciseTypes.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <select className="bg-zinc-900/60 px-3 py-2 rounded text-sm" value={manualForm.nivel_intensidad} onChange={(e)=>setManualForm({...manualForm, nivel_intensidad:e.target.value})}>
              <option value="">Nivel de Intensidad</option>
              {intensityLevels.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          {/* Equipo y Partes del Cuerpo con + */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="flex gap-2">
                <select className="bg-zinc-900/60 px-3 py-2 rounded text-sm flex-1" value={equipoInput} onChange={(e)=>setEquipoInput(e.target.value)}>
                  <option value="">Equipo Necesario</option>
                  {equipmentOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <Button onClick={()=>{ if(equipoInput.trim()){ setEquipoList([...equipoList, equipoInput.trim()]); setEquipoInput('') } }} className="bg-orange-600 hover:bg-orange-700 text-white border-0 h-8 px-3 text-xs">+
                </Button>
              </div>
              {equipoList.length>0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {equipoList.map((eq,idx)=> (
                    <span key={idx} className="inline-flex items-center gap-1 bg-zinc-800 text-white px-2 py-0.5 rounded-full text-xs">
                      {eq}
                      <button onClick={()=>setEquipoList(equipoList.filter((_,i)=>i!==idx))} className="ml-1 text-zinc-300 hover:text-white">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            {/* Partes del Cuerpo con chips */}
            <div>
              <div className="flex gap-2">
                <select className="bg-zinc-900/60 px-3 py-2 rounded text-sm flex-1" value={bodyPartInput} onChange={(e)=>setBodyPartInput(e.target.value)}>
                  <option value="">Partes del Cuerpo</option>
                  {bodyPartsOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <Button onClick={()=>{ if(bodyPartInput.trim()){ setBodyParts([...bodyParts, bodyPartInput.trim()]); setBodyPartInput('') } }} className="bg-orange-600 hover:bg-orange-700 text-white border-0 h-8 px-3 text-xs">
                  +
                </Button>
              </div>
              {bodyParts.length>0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {bodyParts.map((bp,idx)=> (
                    <span key={idx} className="inline-flex items-center gap-1 bg-orange-600/20 text-orange-300 px-2 py-0.5 rounded-full text-xs">
                      {bp}
                      <button onClick={()=>setBodyParts(bodyParts.filter((_,i)=>i!==idx))} className="ml-1 text-orange-300 hover:text-white">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Campo URL eliminado; selección por modal */}
          {/* Constructor de series */}
          <div className="space-y-2 max-w-md">
            <div className="grid grid-cols-[80px_80px_80px_auto] gap-2 items-center">
              <input
                type="number"
                inputMode="numeric"
                className="bg-zinc-900/60 px-2 py-2 rounded text-sm text-center w-full"
                placeholder="Peso"
                value={seriePeso}
                onChange={(e)=>setSeriePeso(e.target.value)}
              />
              <input
                type="number"
                inputMode="numeric"
                className="bg-zinc-900/60 px-2 py-2 rounded text-sm text-center w-full"
                placeholder="Reps"
                value={serieReps}
                onChange={(e)=>setSerieReps(e.target.value)}
              />
              <input
                type="number"
                inputMode="numeric"
                className="bg-zinc-900/60 px-2 py-2 rounded text-sm text-center w-full"
                placeholder="Series"
                value={serieSeries}
                onChange={(e)=>setSerieSeries(e.target.value)}
              />
              <Button onClick={()=>{
                const p = parseFloat(seriePeso); const r = parseInt(serieReps); const s = parseInt(serieSeries);
                if(!isNaN(p) && !isNaN(r) && !isNaN(s)){
                  setSeriesList([...seriesList, {peso:p, repeticiones:r, series:s}])
                  setSeriePeso(''); setSerieReps(''); setSerieSeries('')
                }
              }} className="bg-orange-600 hover:bg-orange-700 text-white border-0 h-8 px-3 text-xs w-full">+
              </Button>
            </div>
            {seriesList.length>0 && (
              <div className="flex flex-wrap gap-2">
                {seriesList.map((sr,idx)=> (
                  <span key={idx} className="inline-flex items-center gap-1 bg-zinc-800 text-white px-2 py-0.5 rounded-full text-xs">
                    {sr.peso}-{sr.repeticiones}-{sr.series}
                    <button onClick={()=>setSeriesList(seriesList.filter((_,i)=>i!==idx))} className="ml-1 text-zinc-300 hover:text-white">×</button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-[11px] text-zinc-400">Se genera como: (peso-reps-series); …</p>
          </div>
          <div className="flex justify-end gap-3">
            <Button onClick={addManualExercise} className="bg-transparent text-orange-500 hover:text-orange-400 border-0 h-8 px-2 text-xs">
              {editingExerciseIndex !== null ? (
                <>
                  <Eye className="h-3 w-3 mr-1" /> Actualizar ejercicio
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3 mr-1" /> Agregar a la tabla
                </>
              )}
            </Button>
            
            {/* Botón Cancelar - Solo visible cuando se está editando */}
            {editingExerciseIndex !== null && (
              <button
                onClick={cancelEdit}
                className="text-orange-500 hover:text-orange-400 text-xs h-8 px-2 border-0 bg-transparent"
                title="Cancelar edición"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bloque Existentes */}
      {mode === 'existentes' && (
        <div className="mb-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-2">
              <select
                className="bg-zinc-900/60 px-3 py-2 rounded text-sm w-full"
                value={selectedExisting}
                onChange={(e)=>setSelectedExisting(e.target.value)}
              >
                <option value="">Selecciona un ejercicio existente</option>
                {existingCatalog.map((ex, idx) => (
                  <option key={idx} value={idx.toString()}>{ex.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Button
                onClick={() => {
                  if (selectedExisting === '') return
                  const ex = existingCatalog[parseInt(selectedExisting)]
                  const item: any = {
                    'Nombre de la Actividad': ex.name,
                    'Descripción': ex.descripcion,
                    'Duración (min)': ex.duracion_min || '',
                    'Tipo de Ejercicio': ex.tipo_ejercicio,
                    'Nivel de Intensidad': ex.nivel_intensidad,
                    'Equipo Necesario': ex.equipo_necesario,
                    'Detalle de Series (peso-repeticiones-series)': (() => {
                      if (!ex.detalle_series) return ''
                      if (typeof ex.detalle_series === 'string') return ex.detalle_series
                      if (Array.isArray(ex.detalle_series)) {
                        return ex.detalle_series
                          .map((s: any) => `(${s.peso}-${s.repeticiones}-${s.series})`)
                          .join(';')
                      }
                      try {
                        const arr = Array.isArray(ex.detalle_series) ? ex.detalle_series : Array.isArray((ex.detalle_series as any)?.series) ? (ex.detalle_series as any).series : []
                        return arr.map((s: any) => `(${s.peso}-${s.repeticiones}-${s.series})`).join(';')
                      } catch {
                        return ''
                      }
                    })(),
                    'Partes del Cuerpo': ex.partes_cuerpo,
                    'Calorías': ex.calorias || '',
                    isExisting: false
                  }
                  setCsvData(prev => {
                    const newData = [...prev, item]
                    console.log('➕ Ejercicio existente agregado:', newData.length, 'filas totales')
                    return newData
                  })
                  
                  // Actualizar estado del padre si está disponible
                  if (parentSetCsvData) {
                    const newParentData = [...(parentCsvData || []), item]
                    console.log('📤 Actualizando estado del padre con ejercicio existente:', newParentData.length, 'filas')
                    parentSetCsvData(newParentData)
                  }
                  
                  setSelectedExisting('')
                }}
                className="bg-transparent text-orange-500 hover:text-orange-400 border-0 h-8 px-2 text-xs w-full text-left"
              >
                {editingExerciseIndex !== null ? (
                  <>
                    <Eye className="h-3 w-3 mr-1 inline" /> Actualizar ejercicio
                  </>
                ) : (
                  <>
                    <Plus className="h-3 w-3 mr-1 inline" /> Agregar a la tabla
                  </>
                )}
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-zinc-400">El catálogo incluye ejercicios de tus programas existentes.</p>
        </div>
      )}

      {/* File Info */}
      {file && (
        <div className="p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1 min-w-0">
              <CheckCircle className="h-4 w-4 text-white mr-2 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-white text-sm font-medium truncate block">{file.name}</span>
                <p className="text-white text-xs">{csvData.length} ejercicios</p>
              </div>
            </div>
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="border-white text-white hover:bg-white hover:text-black h-7 px-2 text-xs ml-2"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Loading States */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mr-3"></div>
            <span className="text-gray-300">Parseando CSV...</span>
          </div>
        </div>
      )}

      {loadingExisting && (
        <div className="text-center py-4">
          <div className="inline-flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-2"></div>
            <span className="text-gray-400 text-sm">Cargando ejercicios existentes...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-red-400 font-medium">Error</h3>
              <p className="text-red-300 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success State */}
      {result && (
        <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4 mb-6">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-green-400 font-medium">¡Éxito!</h3>
              <p className="text-green-300 text-sm mt-1">{result.message}</p>
              {result.results && result.results.length > 0 && (
                <div className="mt-3">
                  <p className="text-green-300 text-sm font-medium">Ejercicios creados:</p>
                  <ul className="text-green-300 text-xs mt-1 space-y-1">
                    {result.results.map((r: any, i: number) => (
                      <li key={i} className="flex items-center">
                        <div className="w-1 h-1 bg-green-400 rounded-full mr-2"></div>
                        Fila {r.row}: {r.exercise} (ID: {r.ejercicio_id})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons - Siempre visibles cuando hay datos */}
      {(csvData.length > 0 || (parentCsvData && parentCsvData.length > 0)) && (
        <div className="flex items-center justify-end gap-4 mb-4">
          {/* Botón Agregar Video */}
          <button
            onClick={() => {
              if (selectedRows.size === 0) {
                setError('Selecciona al menos una fila para agregar video')
                return
              }
              setShowVideoModal(true)
            }}
            disabled={selectedRows.size === 0}
            className={`transition-colors ${
              selectedRows.size === 0 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-[#FF7939] hover:text-[#FF6B35]'
            }`}
            title="Agregar video a filas seleccionadas"
          >
            <Video className="h-5 w-5" />
          </button>
          
          {/* Botón Eliminar Filas */}
          <button
            onClick={handleDeleteSelected}
            disabled={selectedRows.size === 0}
            className={`transition-colors ${
              selectedRows.size === 0 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-[#FF7939] hover:text-[#FF6B35]'
            }`}
            title="Eliminar filas seleccionadas"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Input oculto para video */}
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (!file) return
          setCsvData(prev => prev.map((row, idx) => (
            selectedRows.has(idx) ? { ...row, video_file_name: file.name } : row
          )))
          e.currentTarget.value = ''
        }}
      />

      {/* Data Table - Forzar renderizado si hay datos persistentes */}
      {(allData.length > 0 || csvData.length > 0) && (
        <div className="overflow-x-auto w-full">
          {/* Renderizando tabla */}
          <table className="w-full min-w-full">
            <thead>
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-16">
                  <button
                    onClick={() => {
                      const allIndices = allData.map((_, index) => index)
                      const allSelected = allIndices.every(index => selectedRows.has(index))
                      
                      if (allSelected) {
                        // Si todos están seleccionados, deseleccionar todos
                        setSelectedRows(new Set())
                      } else {
                        // Si no todos están seleccionados, seleccionar todos
                        setSelectedRows(new Set(allIndices))
                      }
                    }}
                    className="p-1 hover:bg-gray-700/50 rounded transition-colors mx-auto"
                    title={(() => {
                      const allIndices = allData.map((_, index) => index)
                      const allSelected = allIndices.every(index => selectedRows.has(index))
                      return allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'
                    })()}
                  >
                    <Flame 
                      className={`h-4 w-4 transition-colors ${
                        (() => {
                          const allIndices = allData.map((_, index) => index)
                          const allSelected = allIndices.every(index => selectedRows.has(index))
                          return allSelected ? 'text-[#FF7939]' : 'text-white'
                        })()
                      }`} 
                    />
                  </button>
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-12">
                  Editar
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
                  {/* Columna de Selección (Llama) - Primera columna */}
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => handleRowSelection(index)}
                      className="p-1 hover:bg-gray-700/50 rounded transition-colors"
                      title={selectedRows.has(index) ? 'Deseleccionar' : 'Seleccionar'}
                    >
                      <Flame 
                        className={`h-4 w-4 transition-colors ${
                          selectedRows.has(index) 
                            ? 'text-[#FF7939]' 
                            : 'text-white'
                        }`} 
                      />
                    </button>
                  </td>
                  
                  {/* Columna Editar - Segunda columna */}
                  <td className="px-2 py-3 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditExercise(item, index)}
                      className="text-blue-400 hover:bg-blue-400/10 p-1 h-5 w-5"
                      title="Editar ejercicio"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </td>
                  
                  {/* Columna Estado */}
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center px-1 py-0.5 rounded text-xs font-medium ${
                      item.isExisting 
                        ? 'bg-white text-black' 
                        : 'bg-orange-600 text-white'
                    }`}>
                      {item.isExisting ? 'E' : 'N'}
                    </span>
                  </td>
                  {/* Columna Ejercicio */}
                  <td className="px-3 py-3 text-xs text-white font-medium whitespace-pre-wrap break-words">
                    {item['Nombre de la Actividad'] || item.nombre || item.nombre_actividad || '-'}
                  </td>
                  
                  {/* Columna Descripción */}
                  <td className="px-3 py-3 text-xs text-white whitespace-pre-wrap break-words">
                    {item['Descripción'] || item.descripcion || item.Descripción || '-'}
                  </td>
                  
                  {/* Columna Duración */}
                  <td className="px-3 py-3 text-xs text-white">
                    {item['Duración (min)'] || item.duracion_min || item.Duración || '-'} min
                  </td>
                  
                  {/* Columna Tipo */}
                  <td className="px-3 py-3 text-xs text-white whitespace-pre-wrap break-words">
                    {item['Tipo de Ejercicio'] || item.tipo_ejercicio || '-'}
                  </td>
                  
                  {/* Columna Equipo */}
                  <td className="px-3 py-3 text-xs text-white whitespace-pre-wrap break-words">
                    {item['Equipo Necesario'] || item.equipo_necesario || '-'}
                  </td>
                  
                  {/* Columna P-R-S */}
                  <td className="px-3 py-3 text-xs text-white whitespace-pre break-normal">
                 {(() => {
                   const candidates = [
                     item['Detalle de Series (peso-repeticiones-series)'],
                     item['Detalle de Series'],
                     item['P-R-S'],
                     item.detalle_series
                   ]
                      
                      const first = candidates.find(v => !!v)
                      if (typeof first === 'string') {
                        const parts = first
                          .toString()
                          .split(/;|\n/)
                          .map(s => s.trim())
                          .filter(Boolean)
                          .map(s => (s.endsWith(';') ? s : `${s};`))
                        return parts.join('\n') || '-'
                      }
                      if (Array.isArray(first)) {
                        return first
                          .map((s: any) => `(${s.peso}-${s.repeticiones}-${s.series});`)
                          .join('\n') || '-'
                      }
                      if (Array.isArray(item.detalle_series)) {
                        return item.detalle_series
                          .map((s: any) => `(${s.peso}-${s.repeticiones}-${s.series});`)
                          .join('\n') || '-'
                      }
                      return '-'
                    })()}
                  </td>
                  
                  {/* Columna Partes */}
                  <td className="px-3 py-3 text-xs text-white whitespace-pre-wrap break-words">
                    {(item['Partes del Cuerpo'] || item.body_parts || '')
                      .toString()
                      .split(/;|,/)
                      .filter(Boolean)
                      .map((p: string) => p.trim())
                      .join('\n') || '-'}
                  </td>
                  
                  {/* Columna Calorías */}
                  <td className="px-3 py-3 text-xs text-white">
                    {item.Calorías || item.calorias || '-'}
                  </td>
                  
                  {/* Columna Intensidad */}
                  <td className="px-3 py-3 text-xs text-white">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      (item['Nivel de Intensidad'] || item.intensidad || '').toLowerCase().includes('alto') || 
                      (item['Nivel de Intensidad'] || item.intensidad || '').toLowerCase().includes('high') 
                        ? 'bg-red-100 text-red-800' 
                        : (item['Nivel de Intensidad'] || item.intensidad || '').toLowerCase().includes('medio') || 
                          (item['Nivel de Intensidad'] || item.intensidad || '').toLowerCase().includes('medium') ||
                          (item['Nivel de Intensidad'] || item.intensidad || '').toLowerCase().includes('moderada')
                        ? 'bg-yellow-100 text-yellow-800'
                        : (item['Nivel de Intensidad'] || item.intensidad || '').toLowerCase().includes('bajo') || 
                          (item['Nivel de Intensidad'] || item.intensidad || '').toLowerCase().includes('low')
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item['Nivel de Intensidad'] || item.intensidad || '-'}
                    </span>
                  </td>
                  
                  {/* Columna Video */}
                  <td className="px-3 py-3 text-xs text-white whitespace-pre-wrap break-words">
                    {(() => {
                      const url = (item as any).video_url || (item as any).video || ''
                      if (!url) return '-'
                      try {
                        const raw = decodeURIComponent(url.toString())
                        const name = raw.split('/').pop() || raw
                        const truncated = name.length > 20 ? name.slice(0, 20) + '…' : name
                        return truncated
                      } catch {
                        const name = url.toString().split('/').pop() || url.toString()
                        return name.length > 20 ? name.slice(0, 20) + '…' : name
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
