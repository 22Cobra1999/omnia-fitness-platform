"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Calendar, Clock, Flame, Edit, RotateCcw } from "lucide-react"
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase-browser'

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
  const formatSeries = (detalleSeries: any[]): string => {
    if (!detalleSeries || detalleSeries.length === 0) {
      return 'Sin series'
    }
    
    return detalleSeries
      .map(serie => `${serie.peso}x${serie.series}x${serie.repeticiones}`)
      .join(' | ')
  }

  // Función para activar/cancelar modo de selección de nueva fecha
  const handleEditDate = (date: Date) => {
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

      if (applyToAllSameDays) {
        // Actualizar todos los días de la misma semana usando dia_semana

        // Calcular la diferencia de días
        const daysDiff = newDate.getDate() - editingDate.getDate()

        // Primero verificar qué valores tiene dia_semana
        const { data: allExercises, error: fetchError } = await supabase
          .from('ejecuciones_ejercicio')
          .select('fecha_ejercicio, dia_semana')
          .eq('client_id', clientId)
          .limit(10)

        if (fetchError) {
          console.error('❌ [EDIT DATE] Error obteniendo ejercicios:', fetchError)
          return
        }


        // Obtener todas las fechas que tienen el mismo dia_semana (nombre del día)
        const oldDayName = getDayName(oldDayOfWeek)
        const { data: sameDayExercises, error: fetchError2 } = await supabase
          .from('ejecuciones_ejercicio')
          .select('fecha_ejercicio, dia_semana')
          .eq('client_id', clientId)
          .eq('dia_semana', oldDayName)

        if (fetchError2) {
          console.error('❌ [EDIT DATE] Error obteniendo ejercicios:', fetchError2)
          return
        }


        if (!sameDayExercises || sameDayExercises.length === 0) {
          return
        }

        // Actualizar cada fecha individualmente
        for (const exercise of sameDayExercises) {
          const exerciseDate = new Date(exercise.fecha_ejercicio)
          const newExerciseDate = new Date(exerciseDate)
          newExerciseDate.setDate(exerciseDate.getDate() + daysDiff)
          const newExerciseDateStr = newExerciseDate.toISOString().split('T')[0]


          const newDayName = getDayName(newDayOfWeek)
          const { error } = await supabase
            .from('ejecuciones_ejercicio')
            .update({ 
              fecha_ejercicio: newExerciseDateStr,
              dia_semana: newDayName
            })
            .eq('client_id', clientId)
            .eq('fecha_ejercicio', exercise.fecha_ejercicio)

          if (error) {
            console.error('❌ [EDIT DATE] Error actualizando fecha:', exercise.fecha_ejercicio, error)
            return
          }
        }

      } else {
        // Actualizar solo el día específico
        const newDayName = getDayName(newDayOfWeek)
        const { error } = await supabase
          .from('ejecuciones_ejercicio')
          .update({ 
            fecha_ejercicio: newDateStr,
            dia_semana: newDayName
          })
          .eq('client_id', clientId)
          .eq('fecha_ejercicio', oldDateStr)

        if (error) {
          console.error('❌ [EDIT DATE] Error actualizando fecha:', error)
          return
        }

      }
      
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

        // Obtener todas las ejecuciones de ejercicios del cliente
        // Incluyendo la columna detalle_series que sí existe
        const { data: executions, error } = await supabase
          .from('ejecuciones_ejercicio')
          .select(`
            id,
            ejercicio_id,
            completado,
            fecha_ejercicio,
            detalle_series,
            ejercicios_detalles(
              nombre_ejercicio,
              tipo,
              activities(
                title
              )
            )
          `)
          .eq('client_id', clientId)
          .order('fecha_ejercicio', { ascending: false })

        if (error) {
          console.error('❌ [CLIENT CALENDAR] Error obteniendo ejecuciones:', error)
          // Si hay error, mostrar mensaje informativo
          setDayData({})
          return
        }


        // Procesar datos por día
        const processedData: { [key: string]: DayData } = {}

        executions?.forEach((execution: any) => {
          const fecha = execution.fecha_ejercicio
          if (!processedData[fecha]) {
            processedData[fecha] = {
              date: fecha,
              exerciseCount: 0,
              completedCount: 0,
              exercises: [],
              activities: []
            }
          }

          const exerciseData: ExerciseExecution = {
            id: execution.id,
            ejercicio_id: execution.ejercicio_id,
            completado: execution.completado,
            fecha_ejercicio: execution.fecha_ejercicio,
            duracion: undefined, // Columna no disponible
            calorias_estimadas: undefined, // Columna no disponible
            nota_cliente: undefined, // Columna no disponible
            ejercicio_nombre: execution.ejercicios_detalles?.nombre_ejercicio,
            actividad_titulo: execution.ejercicios_detalles?.activities?.title,
            detalle_series: execution.detalle_series
          }

          processedData[fecha].exercises.push(exerciseData)
          processedData[fecha].exerciseCount += 1
          if (execution.completado) {
            processedData[fecha].completedCount += 1
          }

          // Agregar actividad única
          if (exerciseData.actividad_titulo && !processedData[fecha].activities.includes(exerciseData.actividad_titulo)) {
            processedData[fecha].activities.push(exerciseData.actividad_titulo)
          }
        })

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
  }, [clientId, supabase])

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
                  <div className="font-semibold text-white mb-1">
                    {exercise.ejercicio_nombre}
                  </div>
                  <div className="text-xs text-gray-400">
                    {exercise.detalle_series && exercise.detalle_series.length > 0 ? (
                      <span className="text-[#FF7939]">
                        {formatSeries(exercise.detalle_series)}
                      </span>
                    ) : (
                      <span className="text-gray-500">Sin series</span>
                    )}
                  </div>
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



