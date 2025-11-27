"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Calendar, Clock, Flame, Edit, RotateCcw, ChevronDown } from "lucide-react"
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/supabase-client'

interface ClientCalendarProps {
  clientId: string
  onLastWorkoutUpdate?: (lastWorkoutDate: string | null) => void
}

interface ExerciseExecution {
  id: string
  ejercicio_id: string
  completado: boolean
  fecha_ejercicio: string
  duracion?: number
  calorias_estimadas?: number
  nota_cliente?: string
  ejercicio_nombre?: string
  actividad_titulo?: string
  actividad_id?: number
  enrollment_id?: number
  version?: number
  detalle_series?: any[]
}

interface DayData {
  date: string
  exerciseCount: number
  completedCount: number
  exercises: ExerciseExecution[]
  activities: string[]
}

export function ClientCalendar({ clientId, onLastWorkoutUpdate }: ClientCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [dayData, setDayData] = useState<{ [key: string]: DayData }>({})
  const [loading, setLoading] = useState(true)
  const [selectedDayExercises, setSelectedDayExercises] = useState<ExerciseExecution[]>([])
  const [showEditModal, setShowEditModal] = useState(false)
  const [newDate, setNewDate] = useState<Date | null>(null)
  const [editingDate, setEditingDate] = useState<Date | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isSelectingNewDate, setIsSelectingNewDate] = useState(false)
  const [applyToAllSameDays, setApplyToAllSameDays] = useState(false)
  const [selectedDayForEdit, setSelectedDayForEdit] = useState<Date | null>(null)
  const [targetDayForEdit, setTargetDayForEdit] = useState<Date | null>(null)
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null)
  const [editingSeries, setEditingSeries] = useState<any[]>([])
  const [availableExercises, setAvailableExercises] = useState<any[]>([])
  const [showExerciseDropdown, setShowExerciseDropdown] = useState(false)

  const supabase = createClient()

  // Función para calcular la última ejercitación (último día que completó al menos un ejercicio)
  const calculateLastWorkoutDate = (data: { [key: string]: DayData }): string | null => {
    const dates = Object.keys(data).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    
    for (const date of dates) {
      const dayData = data[date]
      if (dayData.completedCount > 0) {
        // Formatear la fecha como DD/MM/YYYY
        const dateObj = new Date(date)
        return `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`
      }
    }
    
    return null
  }

  // Función para formatear las series en el formato del cliente
  const formatSeries = (detalleSeries: any): string => {
    if (!detalleSeries) {
      return 'Sin series'
    }
    
    // Si es un objeto con los campos directamente (estructura actual)
    if (typeof detalleSeries === 'object' && detalleSeries.series && detalleSeries.repeticiones) {
      const peso = detalleSeries.peso || detalleSeries.descanso || '-' // Fallback for old data
      return `${detalleSeries.series} series × ${detalleSeries.repeticiones} reps × ${peso}kg`
    }
    
    // Si es un array de series (nueva estructura para múltiples bloques)
    if (Array.isArray(detalleSeries) && detalleSeries.length > 0) {
      return detalleSeries
        .map((serie, index) => {
          const peso = serie.peso || '-'
          const prefix = detalleSeries.length > 1 ? `B${index + 1}: ` : ''
          return `${prefix}${serie.series || 0} series × ${serie.repeticiones || 0} reps × ${peso}kg`
        })
        .join(' | ')
    }

    return 'Sin series'
  }

  // Función para iniciar edición de series
  const handleEditSeries = async (exerciseId: string, currentSeries: any) => {
    setEditingExerciseId(exerciseId)
    
    // Cargar ejercicios disponibles del programa
    const currentExercise = selectedDayExercises.find(ex => ex.id === exerciseId)
    if (currentExercise) {
      // Intentar obtener activity_id de diferentes formas
      let activityId = currentExercise.actividad_id
      
      if (!activityId && currentExercise.actividad_titulo) {
        // Buscar por título como fallback
        const { data: activity, error } = await supabase
          .from('activities')
          .select('id')
          .ilike('title', `%${currentExercise.actividad_titulo}%`)
          .single()
        
        if (activity && !error) {
          activityId = activity.id
        }
      }
      
      // Si aún no tenemos activity_id, buscar en ejercicios_detalles
      if (!activityId) {
        const { data: ejercicioDetalle, error: detalleError } = await supabase
          .from('ejercicios_detalles')
          .select('activity_id')
          .eq('id', currentExercise.ejercicio_id)
          .single()
        
        if (ejercicioDetalle && !detalleError) {
          const rawActivity = ejercicioDetalle.activity_id
          if (typeof rawActivity === 'number') {
            activityId = rawActivity
          } else if (rawActivity && typeof rawActivity === 'object') {
            const keys = Object.keys(rawActivity)
            if (keys.length > 0) {
              const firstKey = parseInt(keys[0], 10)
              if (!Number.isNaN(firstKey)) {
                activityId = firstKey
              }
            }
          }
        }
      }
      
      if (activityId) {
        console.log('🔍 Cargando ejercicios para actividad:', activityId)
        await loadAvailableExercises(activityId)
      } else {
        console.warn('⚠️ No se pudo encontrar activity_id para el ejercicio:', currentExercise)
      }
    }
    
    // Si currentSeries es un objeto (estructura actual), guardarlo directamente
    if (currentSeries && typeof currentSeries === 'object' && !Array.isArray(currentSeries)) {
      // Convertir descanso a peso si existe (compatibilidad con datos antiguos)
      const serie = {
        series: currentSeries.series || '',
        repeticiones: currentSeries.repeticiones || '',
        peso: currentSeries.peso || currentSeries.descanso || ''
      }
      setEditingSeries([serie])
    } else if (Array.isArray(currentSeries)) {
      setEditingSeries(currentSeries)
    } else {
      setEditingSeries([{ series: '', repeticiones: '', peso: '' }])
    }
  }

  // Función para cancelar edición de series
  const handleCancelEditSeries = () => {
    setEditingExerciseId(null)
    setEditingSeries([])
    setShowExerciseDropdown(false)
  }

  // Función para cargar ejercicios disponibles del programa
  const loadAvailableExercises = async (activityId: number) => {
    try {
      console.log('🔍 Buscando ejercicios para activity_id:', activityId)
      
      const { data: exercises, error } = await supabase
        .from('ejercicios_detalles')
        .select('id, nombre_ejercicio, descripcion')
        .contains('activity_id', { [activityId]: {} })
        .order('id')

      if (error) {
        console.error('❌ Error cargando ejercicios disponibles:', error)
        return
      }

      console.log('✅ Ejercicios encontrados:', exercises)
      setAvailableExercises(exercises || [])
    } catch (error) {
      console.error('❌ Error en loadAvailableExercises:', error)
    }
  }

  // Función para agregar una nueva serie
  const handleAddSeries = () => {
    setEditingSeries([...editingSeries, { series: '', repeticiones: '', peso: '' }])
  }

  // Función para cambiar el ejercicio
  const handleChangeExercise = async (newExerciseId: string) => {
    if (!editingExerciseId) return

    try {
      // Buscar el ejercicio actual
      const currentExercise = selectedDayExercises.find(ex => ex.id === editingExerciseId)
      if (!currentExercise) return

      // Obtener el nuevo ejercicio de la lista disponible
      const newExercise = availableExercises.find(ex => String(ex.id) === String(newExerciseId))
      if (!newExercise) return

      // Actualizar el ejercicio en el estado local
      const updatedExercises = selectedDayExercises.map(ex => 
        ex.id === editingExerciseId 
          ? { 
              ...ex, 
              ejercicio_id: String(newExerciseId),
              ejercicio_nombre: newExercise.nombre_ejercicio,
              detalle_series: null // Reset series details
            }
          : ex
      )
      setSelectedDayExercises(updatedExercises)

      // Actualizar los detalles de series en la base de datos
      const { data: currentRecord, error: fetchError } = await supabase
        .from('progreso_cliente')
        .select('detalles_series')
        .eq('cliente_id', clientId)
        .eq('fecha', currentExercise.fecha_ejercicio)
        .single()

      if (fetchError) {
        console.error('Error obteniendo registro actual:', fetchError)
        return
      }

      // Parsear detalles_series existente
      let allDetalles: any = {}
      if (currentRecord?.detalles_series) {
        if (typeof currentRecord.detalles_series === 'string') {
          allDetalles = JSON.parse(currentRecord.detalles_series)
        } else if (typeof currentRecord.detalles_series === 'object') {
          allDetalles = { ...currentRecord.detalles_series }
        }
      }

      // Eliminar el ejercicio anterior y agregar el nuevo (sin series)
      const oldExerciseId = currentExercise.ejercicio_id
      delete allDetalles[oldExerciseId]
      // No agregar el nuevo ejercicio automáticamente, se agregará cuando se editen las series

      // Actualizar en la base de datos
      const { error } = await supabase
        .from('progreso_cliente')
        .update({ 
          detalles_series: allDetalles
        })
        .eq('cliente_id', clientId)
        .eq('fecha', currentExercise.fecha_ejercicio)

      if (error) {
        console.error('Error actualizando ejercicio:', error)
        return
      }

      // Resetear la edición de series
      setEditingSeries([{ series: '', repeticiones: '', peso: '' }])
      setShowExerciseDropdown(false)
      
      // Recargar datos
      await fetchClientExercises()

    } catch (error) {
      console.error('Error cambiando ejercicio:', error)
    }
  }

  // Función para eliminar una serie
  const handleRemoveSeries = (index: number) => {
    const newSeries = editingSeries.filter((_, i) => i !== index)
    setEditingSeries(newSeries)
  }

  // Función para actualizar una serie
  const handleUpdateSeries = (index: number, field: string, value: string) => {
    const newSeries = [...editingSeries]
    newSeries[index] = { ...newSeries[index], [field]: value }
    setEditingSeries(newSeries)
  }

  // Función para guardar cambios de series
  const handleSaveSeries = async () => {
    if (!editingExerciseId) return

    try {
      // Buscar el ejercicio en los datos actuales
      const exercise = selectedDayExercises.find(ex => ex.id === editingExerciseId)
      if (!exercise) return

      // Obtener el ID del ejercicio (quitar el prefijo del ID compuesto)
      const ejercicioIdStr = exercise.ejercicio_id

      // Obtener detalles_series actual desde la BD
      const { data: currentRecord, error: fetchError } = await supabase
        .from('progreso_cliente')
        .select('detalles_series')
        .eq('cliente_id', clientId)
        .eq('fecha', exercise.fecha_ejercicio)
        .single()

      if (fetchError) {
        console.error('Error obteniendo registro actual:', fetchError)
        return
      }

      // Parsear detalles_series existente
      let allDetalles: any = {}
      if (currentRecord?.detalles_series) {
        if (typeof currentRecord.detalles_series === 'string') {
          allDetalles = JSON.parse(currentRecord.detalles_series)
        } else if (typeof currentRecord.detalles_series === 'object') {
          allDetalles = { ...currentRecord.detalles_series }
        }
      }

      // Actualizar solo el ejercicio actual
      // Filtrar series válidas (que tengan series y repeticiones)
      const validSeries = editingSeries.filter(serie => 
        serie.series && serie.repeticiones && 
        parseInt(serie.series) > 0 && parseInt(serie.repeticiones) > 0
      )

      if (validSeries.length > 0) {
        // Si solo hay una serie válida, guardarla como objeto directo (compatibilidad)
        if (validSeries.length === 1) {
          const serie = validSeries[0]
          allDetalles[ejercicioIdStr] = {
            series: parseInt(serie.series) || 0,
            repeticiones: parseInt(serie.repeticiones) || 0,
            peso: parseFloat(serie.peso) || 0
          }
        } else {
          // Si hay múltiples series, guardarlas como array
          allDetalles[ejercicioIdStr] = validSeries.map(serie => ({
            series: parseInt(serie.series) || 0,
            repeticiones: parseInt(serie.repeticiones) || 0,
            peso: parseFloat(serie.peso) || 0
          }))
        }
      } else {
        // Eliminar si no tiene datos válidos
        delete allDetalles[ejercicioIdStr]
      }

      // Actualizar en la base de datos
      const { error } = await supabase
        .from('progreso_cliente')
        .update({ 
          detalles_series: allDetalles
        })
        .eq('cliente_id', clientId)
        .eq('fecha', exercise.fecha_ejercicio)

      if (error) {
        console.error('Error actualizando series:', error)
        return
      }

      // Actualizar el estado local
      const updatedExercises = selectedDayExercises.map(ex => 
        ex.id === editingExerciseId 
          ? { ...ex, detalle_series: allDetalles[ejercicioIdStr] || null }
          : ex
      )
      setSelectedDayExercises(updatedExercises)

      // Cerrar edición
      handleCancelEditSeries()
      
      // Recargar datos
      await fetchClientExercises()
      
    } catch (error) {
      console.error('Error guardando series:', error)
    }
  }

  // Función para activar/cancelar modo de selección de nueva fecha (solo fechas futuras)
  const handleEditDate = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Solo permitir cambiar fechas futuras (desde mañana en adelante)
    if (date <= today) {
      console.log('No se puede cambiar la fecha de días pasados o hoy')
      return
    }

    if (isSelectingNewDate) {
      // Cancelar modo de selección
      setIsSelectingNewDate(false)
      setEditingDate(null)
      setNewDate(null)
      setSelectedDayForEdit(null)
      setTargetDayForEdit(null)
    } else {
      // Activar modo de selección
      setEditingDate(date)
      setNewDate(null)
      setSelectedDayForEdit(date)
      setTargetDayForEdit(null)
      setIsSelectingNewDate(true)
    }
  }


  // Función para confirmar y actualizar las fechas de los ejercicios
  const confirmUpdateDate = async () => {
    if (!editingDate || !newDate) return

    // Validar que la nueva fecha sea futura
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (newDate <= today) {
      console.log('No se puede cambiar a una fecha pasada o de hoy')
      return
    }

    try {
      const oldDateStr = editingDate.toISOString().split('T')[0]
      const newDateStr = newDate.toISOString().split('T')[0]
      const oldDayOfWeek = editingDate.getDay() // 0 = domingo, 1 = lunes, etc.
      const newDayOfWeek = newDate.getDay()

      console.log('📅 ClientCalendar: Moviendo ejercicio', {
        oldDateStr, 
        newDateStr, 
        applyToAllSameDays,
        oldDayOfWeek,
        newDayOfWeek
      })

      // TODO: Implementar edición de fechas con progreso_cliente
      // Por ahora solo actualizar el registro individual
      const { error } = await supabase
        .from('progreso_cliente')
        .update({ fecha: newDateStr })
        .eq('cliente_id', clientId)
        .eq('fecha', oldDateStr)
      
      // Cerrar modales y recargar datos
      setShowConfirmModal(false)
      setIsSelectingNewDate(false)
      setEditingDate(null)
      setNewDate(null)
      setApplyToAllSameDays(false)
      setSelectedDayForEdit(null)
      setTargetDayForEdit(null)
      
      // Recargar los datos del calendario
      await fetchClientExercises()
      
    } catch (error) {
      console.error('❌ [EDIT DATE] Error general:', error)
    }
  }


  // Función para obtener datos de ejercicios del cliente
  const fetchClientExercises = async () => {
      try {
        setLoading(true)

        // ✅ Obtener enrollments del cliente para saber sus actividades y fechas de inicio
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('activity_enrollments')
          .select('activity_id, start_date, status')
          .eq('client_id', clientId)
          .eq('status', 'activa')

        if (enrollmentsError) {
          console.warn('⚠️ [CLIENT CALENDAR] Error obteniendo enrollments:', enrollmentsError)
        }

        // ✅ Obtener progreso del cliente desde la nueva tabla
        const { data: progressRecords, error } = await supabase
          .from('progreso_cliente')
          .select('id, fecha, actividad_id, ejercicios_completados, ejercicios_pendientes, detalles_series')
          .eq('cliente_id', clientId)
          .order('fecha', { ascending: false })

        // ✅ Obtener IDs de ejercicios y platos desde progreso_cliente
        const ejercicioIds = new Set<string>()
        const actividadIds = new Set<number>()
        
        progressRecords?.forEach((record: any) => {
          let completados: any[] = []
          let pendientes: any[] = []
          
          try {
            if (Array.isArray(record.ejercicios_completados)) {
              completados = record.ejercicios_completados
            } else if (typeof record.ejercicios_completados === 'string') {
              completados = JSON.parse(record.ejercicios_completados || '[]')
            }
            
            if (Array.isArray(record.ejercicios_pendientes)) {
              pendientes = record.ejercicios_pendientes
            } else if (typeof record.ejercicios_pendientes === 'string') {
              pendientes = JSON.parse(record.ejercicios_pendientes || '[]')
            }
          } catch (err) {
            // Ignorar errores de parsing
          }
          
          [...completados, ...pendientes].forEach((id: string) => {
            ejercicioIds.add(String(id))
          })
          
          // ✅ Guardar actividad_id para determinar el tipo
          if (record.actividad_id) {
            actividadIds.add(record.actividad_id)
          }
        })

        // ✅ Obtener información de actividades para determinar tipo y nombre
        const { data: actividadesData } = await supabase
          .from('activities')
          .select('id, type, title')
          .in('id', Array.from(actividadIds))

        const actividadTypes = new Map<number, string>()
        const actividadTitulos = new Map<number, string>()
        actividadesData?.forEach((act: any) => {
          actividadTypes.set(act.id, act.type)
          actividadTitulos.set(act.id, act.title)
        })

        // ✅ Obtener enrollments para calcular versiones
        const { data: allEnrollments } = await supabase
          .from('activity_enrollments')
          .select('id, activity_id, created_at')
          .eq('client_id', clientId)
          .eq('status', 'activa')
          .order('created_at', { ascending: true })

        // ✅ Calcular versión para cada enrollment (basado en orden de compra del mismo producto)
        const enrollmentVersions = new Map<number, number>()
        const enrollmentsByActivity = new Map<number, any[]>()
        
        allEnrollments?.forEach((enrollment: any) => {
          const activityId = enrollment.activity_id
          if (!enrollmentsByActivity.has(activityId)) {
            enrollmentsByActivity.set(activityId, [])
          }
          enrollmentsByActivity.get(activityId)!.push(enrollment)
        })

        // ✅ Asignar versión a cada enrollment (1, 2, 3... según orden de compra)
        enrollmentsByActivity.forEach((enrollments, activityId) => {
          enrollments.forEach((enrollment, index) => {
            enrollmentVersions.set(enrollment.id, index + 1)
          })
        })

        // ✅ Recopilar IDs de planificación ANTES de cargar nombres
        const planificacionIds = new Set<string>()
        
        if (enrollments && enrollments.length > 0) {
          for (const enrollment of enrollments) {
            if (!enrollment.activity_id) continue
            const actividadId = enrollment.activity_id

            // ✅ Obtener planificación semanal para esta actividad
            const { data: planificacion, error: planError } = await supabase
              .from('planificacion_ejercicios')
              .select('*')
              .eq('actividad_id', actividadId)
              .order('numero_semana', { ascending: true })

            if (planError || !planificacion || planificacion.length === 0) continue

            // ✅ Recopilar IDs de la planificación
            planificacion.forEach((semana: any) => {
              const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
              diasSemana.forEach((dia: string) => {
                const diaData = semana[dia]
                if (!diaData) return

                let ejerciciosDelDia: any[] = []
                try {
                  if (typeof diaData === 'string') {
                    ejerciciosDelDia = JSON.parse(diaData)
                  } else if (Array.isArray(diaData)) {
                    ejerciciosDelDia = diaData
                  } else if (diaData && typeof diaData === 'object') {
                    ejerciciosDelDia = (diaData as any).ejercicios || (diaData as any).exercises || []
                  }
                } catch (err) {
                  // Ignorar errores de parsing
                }

                ejerciciosDelDia.forEach((ej: any) => {
                  const ejId = String(ej.id || ej.ejercicioId || ej.ejercicio_id)
                  if (ejId) planificacionIds.add(ejId)
                })
              })
            })
          }
        }

        // ✅ Combinar IDs de progreso_cliente y planificación
        const allEjercicioIds = new Set([...ejercicioIds, ...planificacionIds])
        
        // ✅ Separar IDs en ejercicios y platos (todos los IDs pueden ser de cualquier tipo)
        const ejercicioIdsArray = Array.from(allEjercicioIds).map(id => parseInt(id, 10)).filter(id => !isNaN(id))
        const platoIdsArray = Array.from(allEjercicioIds).map(id => parseInt(id, 10)).filter(id => !isNaN(id))

        // ✅ Obtener nombres de ejercicios desde ejercicios_detalles
        const { data: ejerciciosData, error: ejerciciosError } = await supabase
          .from('ejercicios_detalles')
          .select('id, nombre_ejercicio')
          .in('id', ejercicioIdsArray)

        // ✅ Obtener nombres de platos desde nutrition_program_details
        const { data: platosData, error: platosError } = await supabase
          .from('nutrition_program_details')
          .select('id, nombre')
          .in('id', platoIdsArray)

        if (ejerciciosError) {
          console.warn('⚠️ [CLIENT CALENDAR] Error obteniendo nombres de ejercicios:', ejerciciosError)
        }
        
        if (platosError) {
          console.warn('⚠️ [CLIENT CALENDAR] Error obteniendo nombres de platos:', platosError)
        }

        // ✅ Crear un mapa combinado de nombres
        const nombresMap = new Map<string, string>()
        ejerciciosData?.forEach((ej: any) => {
          nombresMap.set(String(ej.id), ej.nombre_ejercicio)
        })
        platosData?.forEach((plato: any) => {
          nombresMap.set(String(plato.id), plato.nombre)
        })

        if (error) {
          console.error('❌ [CLIENT CALENDAR] Error obteniendo ejecuciones:', error)
          // Si hay error, mostrar mensaje informativo
          setDayData({})
          return
        }


        // Procesar datos por día desde progreso_cliente
        const processedData: { [key: string]: DayData } = {}

        progressRecords?.forEach((record: any) => {
          const fecha = record.fecha
          
          // Manejar tanto arrays nativos de PostgreSQL como strings JSON
          let completados: any[] = []
          let pendientes: any[] = []
          
          try {
            if (Array.isArray(record.ejercicios_completados)) {
              completados = record.ejercicios_completados
            } else if (typeof record.ejercicios_completados === 'string') {
              completados = JSON.parse(record.ejercicios_completados || '[]')
            }
            
            if (Array.isArray(record.ejercicios_pendientes)) {
              pendientes = record.ejercicios_pendientes
            } else if (typeof record.ejercicios_pendientes === 'string') {
              pendientes = JSON.parse(record.ejercicios_pendientes || '[]')
            }
          } catch (err) {
            console.warn('Error parseando ejercicios:', err)
            completados = []
            pendientes = []
          }
          
          const allEjercicios = [...completados, ...pendientes]

          if (!processedData[fecha]) {
            processedData[fecha] = {
              date: fecha,
              exerciseCount: 0,
              completedCount: 0,
              exercises: [],
              activities: []
            }
          }

          allEjercicios.forEach((ejId: string) => {
            const isCompleted = completados.includes(ejId)
            
            // ✅ Buscar el nombre del ejercicio o plato desde el mapa combinado
            const nombre = nombresMap.get(String(ejId))
            const actividadType = record.actividad_id ? actividadTypes.get(record.actividad_id) : null
            const defaultNombre = actividadType === 'nutricion' || actividadType === 'nutrition_program'
              ? `Plato ${ejId}`
              : `Ejercicio ${ejId}`
            
            // ✅ Obtener enrollment_id desde activity_enrollments basándome en actividad_id y cliente_id
            // Buscar el enrollment más reciente para esta actividad y cliente
            const enrollmentForActivity = allEnrollments?.find(
              (e: any) => e.activity_id === record.actividad_id
            )
            const enrollmentId = enrollmentForActivity?.id
            const version = enrollmentId ? enrollmentVersions.get(enrollmentId) : undefined
            const actividadTitulo = record.actividad_id ? actividadTitulos.get(record.actividad_id) : undefined

            const exerciseData: ExerciseExecution = {
              id: `${record.id}-${ejId}`,
              ejercicio_id: ejId,
              completado: isCompleted,
              fecha_ejercicio: fecha,
              duracion: undefined,
              calorias_estimadas: undefined,
              nota_cliente: undefined,
              ejercicio_nombre: nombre || defaultNombre,
              actividad_titulo: actividadTitulo,
              actividad_id: record.actividad_id,
              enrollment_id: enrollmentId,
              version: version,
              detalle_series: (() => {
                try {
                  if (!record.detalles_series) {
                    return null
                  }
                  
                  let detalles: any = null
                  
                  // Manejar string JSON
                  if (typeof record.detalles_series === 'string') {
                    try {
                      detalles = JSON.parse(record.detalles_series)
                    } catch (e) {
                      console.warn('Error parseando detalles_series como JSON:', e)
                      return null
                    }
                  } 
                  // Manejar objeto nativo
                  else if (typeof record.detalles_series === 'object') {
                    detalles = record.detalles_series
                  }
                  
                  // detalles_series está estructurado como: { "1042": { series: 3, repeticiones: 15, descanso: "30s" } }
                  // Buscar por ejId (como string)
                  if (detalles && typeof detalles === 'object' && !Array.isArray(detalles)) {
                    const ejIdStr = String(ejId)
                    return detalles[ejIdStr] || null
                  }
                  
                  return null
                } catch (err) {
                  console.warn('Error parseando detalles_series:', err)
                  return null
                }
              })()
            }

            processedData[fecha].exercises.push(exerciseData)
            processedData[fecha].exerciseCount += 1
            if (isCompleted) {
              processedData[fecha].completedCount += 1
            }
          })
        })

        // ✅ Cargar planificación semanal desde planificacion_ejercicios para cada actividad
        if (enrollments && enrollments.length > 0) {
          const currentMonth = currentDate.getMonth()
          const currentYear = currentDate.getFullYear()
          const monthStart = new Date(currentYear, currentMonth, 1)
          const monthEnd = new Date(currentYear, currentMonth + 1, 0)

          for (const enrollment of enrollments) {
            if (!enrollment.start_date || !enrollment.activity_id) continue

            const startDate = new Date(enrollment.start_date)
            const actividadId = enrollment.activity_id

            // ✅ Obtener planificación semanal para esta actividad
            const { data: planificacion, error: planError } = await supabase
              .from('planificacion_ejercicios')
              .select('*')
              .eq('actividad_id', actividadId)
              .order('numero_semana', { ascending: true })

            if (planError) {
              console.warn(`⚠️ [CLIENT CALENDAR] Error obteniendo planificación para actividad ${actividadId}:`, planError)
              continue
            }

            if (!planificacion || planificacion.length === 0) {
              console.log(`ℹ️ [CLIENT CALENDAR] No hay planificación para actividad ${actividadId}`)
              continue
            }

            // ✅ Recopilar IDs de la planificación
            planificacion.forEach((semana: any) => {
              const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
              diasSemana.forEach((dia: string) => {
                const diaData = semana[dia]
                if (!diaData) return

                let ejerciciosDelDia: any[] = []
                try {
                  if (typeof diaData === 'string') {
                    ejerciciosDelDia = JSON.parse(diaData)
                  } else if (Array.isArray(diaData)) {
                    ejerciciosDelDia = diaData
                  } else if (diaData && typeof diaData === 'object') {
                    ejerciciosDelDia = (diaData as any).ejercicios || (diaData as any).exercises || []
                  }
                } catch (err) {
                  // Ignorar errores de parsing
                }

                ejerciciosDelDia.forEach((ej: any) => {
                  const ejId = String(ej.id || ej.ejercicioId || ej.ejercicio_id)
                  if (ejId) planificacionIds.add(ejId)
                })
              })
            })

            // ✅ Obtener períodos para calcular semanas totales
            const { data: periodosData } = await supabase
              .from('periodos')
              .select('cantidad_periodos')
              .eq('actividad_id', actividadId)
              .single()

            const cantidadPeriodos = periodosData?.cantidad_periodos || 1
            const maxSemanasPlanificacion = Math.max(...planificacion.map((p: any) => p.numero_semana))

            // ✅ Obtener tipo de actividad
            const actividadType = actividadTypes.get(actividadId)
            
            // ✅ Si no tenemos el tipo, obtenerlo
            if (!actividadType && actividadId) {
              const { data: actData } = await supabase
                .from('activities')
                .select('type')
                .eq('id', actividadId)
                .single()
              
              if (actData) {
                actividadTypes.set(actividadId, actData.type)
              }
            }

            // ✅ Procesar cada día del mes actual
            for (let day = 1; day <= monthEnd.getDate(); day++) {
              const fecha = new Date(currentYear, currentMonth, day)
              const fechaStr = fecha.toISOString().split('T')[0]

              // Solo procesar fechas futuras o iguales a start_date
              if (fecha < startDate) continue

              // Calcular semana del ciclo
              const diffDays = Math.floor((fecha.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
              const totalWeekNumber = Math.floor(diffDays / 7) + 1
              const weekInCycle = ((totalWeekNumber - 1) % maxSemanasPlanificacion) + 1

              // Obtener día de la semana (0 = domingo, 1 = lunes, ..., 6 = sábado)
              const dayOfWeek = fecha.getDay()
              const diasMap: Record<number, string> = {
                0: 'domingo',
                1: 'lunes',
                2: 'martes',
                3: 'miercoles',
                4: 'jueves',
                5: 'viernes',
                6: 'sabado'
              }
              const diaColumna = diasMap[dayOfWeek]

              // ✅ Obtener planificación para esta semana y día
              const semanaPlanificacion = planificacion.find(p => p.numero_semana === weekInCycle)
              if (!semanaPlanificacion || !semanaPlanificacion[diaColumna]) continue

              let ejerciciosDelDia: any[] = []
              try {
                const diaData = semanaPlanificacion[diaColumna]
                if (typeof diaData === 'string') {
                  ejerciciosDelDia = JSON.parse(diaData)
                } else if (Array.isArray(diaData)) {
                  ejerciciosDelDia = diaData
                } else if (diaData && typeof diaData === 'object') {
                  // Si es un objeto con estructura { ejercicios: [...] }
                  ejerciciosDelDia = (diaData as any).ejercicios || (diaData as any).exercises || []
                }
              } catch (err) {
                console.warn(`⚠️ Error parseando planificación para ${fechaStr}:`, err)
                continue
              }

              if (!Array.isArray(ejerciciosDelDia) || ejerciciosDelDia.length === 0) continue

              // ✅ Inicializar día si no existe
              if (!processedData[fechaStr]) {
                processedData[fechaStr] = {
                  date: fechaStr,
                  exerciseCount: 0,
                  completedCount: 0,
                  exercises: [],
                  activities: []
                }
              }

              // ✅ Agregar ejercicios/platos planificados
              ejerciciosDelDia.forEach((ej: any) => {
                const ejId = String(ej.id || ej.ejercicioId || ej.ejercicio_id)
                if (!ejId) return

                // Verificar si ya existe en processedData (desde progreso_cliente)
                const existe = processedData[fechaStr].exercises.some(
                  ex => String(ex.ejercicio_id) === ejId
                )

                if (!existe) {
                  const nombre = nombresMap.get(ejId)
                  const defaultNombre = actividadType === 'nutricion' || actividadType === 'nutrition_program'
                    ? `Plato ${ejId}`
                    : `Ejercicio ${ejId}`

                  // ✅ Obtener enrollment_id y versión para esta actividad
                  const enrollmentForActivity = enrollments.find(e => e.activity_id === actividadId)
                  const enrollmentId = enrollmentForActivity?.id
                  const version = enrollmentId ? enrollmentVersions.get(enrollmentId) : undefined
                  const actividadTitulo = actividadTitulos.get(actividadId)

                  const exerciseData: ExerciseExecution = {
                    id: `plan-${actividadId}-${fechaStr}-${ejId}`,
                    ejercicio_id: ejId,
                    completado: false, // No completado aún (solo planificado)
                    fecha_ejercicio: fechaStr,
                    duracion: undefined,
                    calorias_estimadas: undefined,
                    nota_cliente: undefined,
                    ejercicio_nombre: nombre || defaultNombre,
                    actividad_titulo: actividadTitulo,
                    actividad_id: actividadId,
                    enrollment_id: enrollmentId,
                    version: version,
                    detalle_series: null
                  }

                  processedData[fechaStr].exercises.push(exerciseData)
                  processedData[fechaStr].exerciseCount += 1
                }
              })
            }
          }
        }

        setDayData(processedData)

        // Calcular la última ejercitación (último día que completó al menos un ejercicio)
        const lastWorkoutDate = calculateLastWorkoutDate(processedData)
        if (onLastWorkoutUpdate) {
          onLastWorkoutUpdate(lastWorkoutDate)
        }
      } catch (error) {
        console.error('❌ [CLIENT CALENDAR] Error general:', error)
      } finally {
        setLoading(false)
      }
    }

  // Obtener datos de ejercicios del cliente
  useEffect(() => {
    if (clientId) {
      fetchClientExercises()
    }
  }, [clientId, supabase, currentDate]) // ✅ Agregar currentDate para recargar cuando cambia el mes

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExerciseDropdown) {
        const target = event.target as HTMLElement
        if (!target.closest('.exercise-dropdown')) {
          setShowExerciseDropdown(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showExerciseDropdown])

  // Navegación del calendario
  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  // Generar días del mes
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const currentDay = new Date(startDate)

    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay))
      currentDay.setDate(currentDay.getDate() + 1)
    }
    
    return days
  }

  // Obtener datos del día
  const getDayData = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    return dayData[dateString]
  }

  // Manejar click en día
  const handleDayClick = (date: Date) => {
    if (isSelectingNewDate) {
      // Modo de selección de nueva fecha
      setTargetDayForEdit(date)
      setNewDate(date)
      setShowConfirmModal(true)
      return
    }

    // Modo normal - mostrar ejercicios del día
    const data = getDayData(date)
    if (data && data.exercises.length > 0) {
      setSelectedDate(date)
      setSelectedDayExercises(data.exercises)
      setSelectedDayForEdit(null)
      setTargetDayForEdit(null)
    }
  }

  // Formatear fecha
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: '2-digit',
      month: 'short',
      day: 'numeric'
    })
  }

  // Obtener nombre del día de la semana
  const getDayName = (dayOfWeek: number) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    return days[dayOfWeek]
  }

  // Obtener plural correcto del día de la semana
  const getDayNamePlural = (dayOfWeek: number) => {
    const days = ['Domingos', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábados']
    return days[dayOfWeek]
  }

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7939]"></div>
        <span className="ml-2 text-sm text-gray-400">Cargando calendario...</span>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
        {/* Navegación del mes y resumen lado a lado */}
        <div className="flex items-center gap-4">
          {/* Navegación del mes - 50% */}
          <div className="flex-1 flex items-center justify-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-1.5 hover:bg-[#FF7939]/20 rounded-lg transition-all duration-200 group"
          >
            <ChevronLeft className="h-4 w-4 text-gray-400 group-hover:text-[#FF7939]" />
          </button>
          <span className="text-sm font-semibold text-white min-w-[120px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button
            onClick={goToNextMonth}
            className="p-1.5 hover:bg-[#FF7939]/20 rounded-lg transition-all duration-200 group"
          >
            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#FF7939]" />
          </button>
        </div>

        {/* Resumen minimalista - 50% */}
        <div className="flex-1 flex items-center justify-center gap-3">
          {Object.keys(dayData).length > 0 ? (
            <>
              <div className="text-center">
                <div className="text-sm font-bold">
                  <span className="text-white">
                    {Object.values(dayData).reduce((sum, day) => sum + day.completedCount, 0)}
                  </span>
                  <span className="text-[#FF7939]">
                    /{Object.values(dayData).reduce((sum, day) => sum + day.exerciseCount, 0)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">Ejercicios</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold">
                  <span className="text-white">
                    {Object.values(dayData).filter(day => day.completedCount === day.exerciseCount && day.exerciseCount > 0).length}
                  </span>
                  <span className="text-[#FF7939]">
                    /{Object.keys(dayData).length}
                  </span>
                </div>
                <div className="text-xs text-gray-500">Días</div>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="text-xs text-gray-500">Sin ejercicios</div>
            </div>
          )}
        </div>
      </div>

        {/* Calendario sin frame */}
        <div className="w-full">
        {/* Días de la semana sin fondo */}
      <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs font-semibold text-gray-400 py-2">
            {day}
          </div>
        ))}
      </div>

        {/* Días del mes compactos */}
      <div className="grid grid-cols-7 gap-1">
          {generateCalendarDays().map((date, index) => {
            const isCurrentMonth = date.getMonth() === currentDate.getMonth()
            const isToday = date.toDateString() === new Date().toDateString()
            const dayData = getDayData(date)
            const hasExercises = dayData && dayData.exerciseCount > 0
            const isCompleted = dayData && dayData.completedCount === dayData.exerciseCount
            
            // Estados de selección para edición de fechas
            const isSelectedForEdit = selectedDayForEdit && date.toDateString() === selectedDayForEdit.toDateString()
            const isTargetForEdit = targetDayForEdit && date.toDateString() === targetDayForEdit.toDateString()
            const isTargetHasExercises = targetDayForEdit && getDayData(targetDayForEdit) && getDayData(targetDayForEdit)!.exerciseCount > 0

          return (
              <button
              key={index}
                onClick={() => handleDayClick(date)}
              className={`
                  relative p-2 text-sm rounded-lg transition-all duration-300 min-h-[50px] flex flex-col items-center justify-start group
                  ${!isCurrentMonth ? 'text-gray-600 bg-transparent' : 'text-white'}
                  ${isToday ? 'bg-[#FF7939] text-white shadow-lg shadow-[#FF7939]/25' : ''}
                  ${isSelectedForEdit ? 'bg-[#FF7939]/30 border-2 border-[#FF7939] text-white' : ''}
                  ${isTargetForEdit ? 'bg-white text-black border-2 border-white' : ''}
                  ${hasExercises && !isToday && !isSelectedForEdit && !isTargetForEdit ? 'bg-zinc-800/50 hover:bg-zinc-700/70 cursor-pointer border border-zinc-600/30' : ''}
                  ${!hasExercises && !isToday && !isSelectedForEdit && !isTargetForEdit && isCurrentMonth ? 'hover:bg-zinc-800/30 cursor-pointer' : ''}
                `}
              >
                {/* Número del día siempre en la misma posición */}
                <div className={`text-center font-semibold text-sm leading-none pt-1 ${
                  isToday ? 'text-white' : 
                  isTargetForEdit ? 'text-black' :
                  isSelectedForEdit ? 'text-white' :
                  isCurrentMonth ? 'text-white' : 'text-gray-600'
                }`}>
                  {date.getDate()}
                </div>
                
                {/* Número de ejercicios siempre en la misma posición */}
                <div className="mt-1 h-5 flex items-center justify-center">
                  {hasExercises ? (
                    <div className={`
                      text-xs font-bold px-1.5 py-0.5 rounded-full transition-all duration-200 leading-none
                      ${isTargetForEdit 
                        ? 'bg-black text-white shadow-sm' 
                        : isCompleted 
                        ? 'bg-[#FF7939] text-white shadow-sm' 
                        : 'bg-zinc-700 text-gray-300 group-hover:bg-zinc-600'
                      }
                    `}>
                      {dayData.exerciseCount}
                    </div>
                  ) : (
                    <div className="h-4"></div>
                  )}
                </div>
                
                {/* Indicador de hover */}
                {hasExercises && (
                  <div className="absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-[#FF7939]/30 transition-all duration-200 pointer-events-none"></div>
              )}
              </button>
          )
        })}
      </div>
        </div>

        {/* Indicador de modo de selección */}
        {isSelectingNewDate && (
          <div className="text-center">
            <div className="text-xs text-[#FF7939] font-medium">
              Selecciona nueva fecha
            </div>
          </div>
        )}

        {/* Detalle del día seleccionado */}
        {selectedDate && selectedDayExercises.length > 0 && (
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#FF7939]" />
                <h4 className="font-semibold text-sm text-white">{formatDate(selectedDate)}</h4>
        </div>
              <button
                onClick={() => handleEditDate(selectedDate)}
                className={`flex items-center gap-1 px-2 py-1 text-sm font-medium rounded-lg transition-colors ${
                  isSelectingNewDate 
                    ? 'bg-[#FF7939] text-white' 
                    : 'text-[#FF7939] hover:bg-[#FF7939]/10'
                }`}
              >
                <RotateCcw className="h-4 w-4" />
                {isSelectingNewDate ? 'Cancelar' : 'Fecha'}
              </button>
          </div>
          
          <div className="space-y-3">
            {selectedDayExercises.map((exercise, index) => (
              <div key={exercise.id} className="w-full flex items-start py-3 border-b border-zinc-700/30 last:border-b-0">
                {/* Estado completado con logo OMNIA */}
                <div className="flex items-center justify-center w-12 pt-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    exercise.completado 
                      ? 'bg-[#FF7939] text-white' 
                      : 'bg-gray-600 text-gray-300'
                  }`}>
                    <Flame className="h-5 w-5" />
        </div>
      </div>

                {/* Nombre del ejercicio y detalle de series */}
                <div className="flex-1 px-4">
                  {editingExerciseId === exercise.id ? (
                    <div className="relative mb-1 exercise-dropdown">
                      <button
                        onClick={() => setShowExerciseDropdown(!showExerciseDropdown)}
                        className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-white bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg hover:bg-[#3A3A3A] transition-colors"
                      >
                        <span>{exercise.ejercicio_nombre}</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${showExerciseDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {showExerciseDropdown && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[#1E1E1E] border border-[#3A3A3A] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {availableExercises.length > 0 ? (
                            availableExercises.map((ex) => (
                              <button
                                key={ex.id}
                                onClick={() => handleChangeExercise(String(ex.id))}
                                className={`w-full px-3 py-2 text-left text-sm hover:bg-[#3A3A3A] transition-colors ${
                                  String(ex.id) === String(exercise.ejercicio_id)
                                    ? 'bg-[#FF7939]/20 text-[#FF7939]'
                                    : 'text-white'
                                }`}
                              >
                                {ex.nombre_ejercicio}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-400">
                              No hay ejercicios disponibles
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="font-semibold text-white mb-1">
                      {exercise.ejercicio_nombre}
                    </div>
                  )}
                  
                  {/* ✅ Mostrar nombre de actividad y versión */}
                  {exercise.actividad_titulo && (
                    <div className="text-xs text-[#FF7939] mt-1 font-medium">
                      {exercise.actividad_titulo}
                      {exercise.version && exercise.version > 1 && (
                        <span className="text-gray-400 ml-1">(Versión {exercise.version})</span>
                      )}
                    </div>
                  )}
                  
                  {/* ✅ Mostrar series si existen */}
                  {exercise.detalle_series && (
                    <div className="text-xs text-gray-400 mt-1">
                      {formatSeries(exercise.detalle_series)}
                    </div>
                  )}
                  
                  {/* Editor de series expandido */}
                  {editingExerciseId === exercise.id ? (
                    <div className="space-y-2">
                      {editingSeries.map((serie, index) => (
                        <div key={index} className="flex items-center gap-2 py-1">
                          {/* Siempre mostrar indicador de bloque */}
                          <div className="w-6 h-6 flex items-center justify-center text-xs text-[#FF7939] font-bold bg-[#FF7939]/10 rounded-full">
                            {index + 1}
                          </div>
                          <div className="flex flex-col">
                            <label className="text-[10px] text-gray-500 mb-0.5">Series</label>
                            <input
                              type="number"
                              placeholder="3"
                              value={serie.series}
                              onChange={(e) => handleUpdateSeries(index, 'series', e.target.value)}
                              className="w-14 px-2 py-1 text-xs bg-[#2A2A2A] border border-[#3A3A3A] rounded text-white placeholder:text-gray-400"
                            />
                          </div>
                          <span className="text-gray-400 text-xs mt-4">×</span>
                          <div className="flex flex-col">
                            <label className="text-[10px] text-gray-500 mb-0.5">Reps</label>
                            <input
                              type="number"
                              placeholder="15"
                              value={serie.repeticiones}
                              onChange={(e) => handleUpdateSeries(index, 'repeticiones', e.target.value)}
                              className="w-14 px-2 py-1 text-xs bg-[#2A2A2A] border border-[#3A3A3A] rounded text-white placeholder:text-gray-400"
                            />
                          </div>
                          <span className="text-gray-400 text-xs mt-4">×</span>
                          <div className="flex flex-col">
                            <label className="text-[10px] text-gray-500 mb-0.5">Peso (kg)</label>
                            <input
                              type="number"
                              step="0.5"
                              placeholder="50"
                              value={serie.peso}
                              onChange={(e) => handleUpdateSeries(index, 'peso', e.target.value)}
                              className="w-14 px-2 py-1 text-xs bg-[#2A2A2A] border border-[#3A3A3A] rounded text-white placeholder:text-gray-400"
                            />
                          </div>
                          {/* Siempre mostrar botón de eliminar, pero solo permitir eliminar si hay más de 1 bloque */}
                          <button
                            onClick={() => handleRemoveSeries(index)}
                            disabled={editingSeries.length <= 1}
                            className={`ml-2 p-1 rounded transition-colors ${
                              editingSeries.length <= 1 
                                ? 'text-gray-600 cursor-not-allowed' 
                                : 'text-red-400 hover:text-red-300 hover:bg-red-900/20'
                            }`}
                            title={editingSeries.length <= 1 ? "Mínimo 1 bloque requerido" : "Eliminar bloque"}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      
                      {/* Botón para agregar más bloques */}
                      <button
                        onClick={handleAddSeries}
                        className="flex items-center justify-center w-8 h-8 text-[#FF7939] hover:text-[#FF7939]/80 hover:bg-[#FF7939]/10 rounded-full transition-colors"
                        title="Agregar bloque"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={handleSaveSeries}
                          className="px-3 py-1 text-xs bg-[#FF7939] hover:bg-[#FF7939]/80 text-white rounded transition-colors"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={handleCancelEditSeries}
                          className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400">
                        {exercise.detalle_series ? (
                      <span className="text-[#FF7939]">
                        {formatSeries(exercise.detalle_series)}
                      </span>
                    ) : (
                      <span className="text-gray-500">Sin series</span>
                    )}
                  </div>
                      
                      {/* Botón de editar series */}
                      <button
                        onClick={() => handleEditSeries(exercise.id, exercise.detalle_series)}
                        className="p-1 text-gray-400 hover:text-[#FF7939] transition-colors"
                        title="Editar series"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Modal de confirmación */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-sm border border-zinc-700/30">
            <div className="flex items-center gap-2 mb-4">
              <RotateCcw className="h-5 w-5 text-[#FF7939]" />
              <h3 className="font-semibold text-lg text-white">Confirmar Cambio</h3>
            </div>
            
            <div className="space-y-4">
              <div className="text-sm text-gray-300">
                ¿Estás seguro de que quieres cambiar la fecha de los ejercicios?
              </div>
              
              <div className="bg-zinc-800/50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Fecha actual:</span>
                  <span className="text-white">{editingDate && formatDate(editingDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Nueva fecha:</span>
                  <span className="text-[#FF7939]">{newDate && formatDate(newDate)}</span>
                </div>
              </div>

              {/* Advertencia si el día de destino ya tiene ejercicios */}
              {newDate && getDayData(newDate) && getDayData(newDate)!.exerciseCount > 0 && (
                <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <div className="text-sm text-amber-200">
                      <div className="font-medium">¡Atención!</div>
                      <div className="text-xs text-amber-300 mt-1">
                        El {formatDate(newDate)} ya tiene {getDayData(newDate)!.exerciseCount} ejercicio(s) programado(s)
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Opción para aplicar a todos los días de la misma semana */}
              {editingDate && newDate && editingDate.getDay() !== newDate.getDay() && (
                <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/30">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-white text-sm">
                        Aplicar a todos los {getDayNamePlural(editingDate.getDay())}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Cambiará todos los {getDayNamePlural(editingDate.getDay())} a {getDayNamePlural(newDate.getDay())}
                      </div>
                    </div>
                    <Switch
                      checked={applyToAllSameDays}
                      onCheckedChange={setApplyToAllSameDays}
                      className="h-5 w-9 data-[state=checked]:bg-[#FF7939] data-[state=unchecked]:bg-[#FF7939]/20"
                    />
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowConfirmModal(false)
                    setApplyToAllSameDays(false)
                  }}
                  className="flex-1 px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmUpdateDate}
                  className="flex-1 px-4 py-2 bg-[#FF7939] text-white rounded-lg hover:bg-[#FF7939]/80 transition-colors"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}



