"use client"

import React, { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Plus, Clock, X, Trash2, Edit3, Trash } from "lucide-react"
import { motion } from "framer-motion"

interface TimeSlot {
  id: string
  dates: string[]
  startTime: string
  endTime: string
  duration: number
}

interface WorkshopSession {
  title?: string
  description?: string
  date: string
  startTime: string
  endTime: string
  duration: number
}

interface WorkshopSimpleSchedulerProps {
  sessions: WorkshopSession[]
  onSessionsChange: (sessions: WorkshopSession[]) => void
}

export function WorkshopSimpleScheduler({ sessions, onSessionsChange }: WorkshopSimpleSchedulerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())

  // Estados del tema
  const [topicTitle, setTopicTitle] = useState("")
  const [topicDescription, setTopicDescription] = useState("")

  // Horarios
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])

  // Estados de edición
  const [currentStartTime, setCurrentStartTime] = useState("10:00")
  const [currentEndTime, setCurrentEndTime] = useState("12:00")
  const [editingTime, setEditingTime] = useState(false)

  // Estado para mostrar resumen del tema
  const [showSummary, setShowSummary] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [finishedTopic, setFinishedTopic] = useState<{
    title: string
    description: string
    timeSlots: TimeSlot[]
  } | null>(null)

  // Estado para controlar si estamos editando un tema existente
  const [isEditingExistingTopic, setIsEditingExistingTopic] = useState(false)
  const [originalSessionsBackup, setOriginalSessionsBackup] = useState<WorkshopSession[]>([])

  const isInEditorMode =
    editingTime ||
    isEditingExistingTopic ||
    Boolean(topicTitle.trim()) ||
    selectedDates.size > 0 ||
    timeSlots.length > 0

  // Función para convertir Date a string YYYY-MM-DD en zona horaria local
  const formatDateToLocalString = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Helper para parsear fecha YYYY-MM-DD sin desfase horario
  const parseDateSafe = (dateStr: string) => {
    if (!dateStr) return new Date()
    // Si viene en formato YYYY-MM-DD
    if (dateStr.includes('-') && dateStr.split('-').length === 3) {
      const [year, month, day] = dateStr.split('-').map(Number)
      return new Date(year, month - 1, day)
    }
    return new Date(dateStr)
  }

  // Calcular horas totales por día (todos los temas)
  useEffect(() => {
    if (sessions && sessions.length > 0) {
      console.log('📅 [WorkshopSimpleScheduler] Received sessions:', sessions)
    }
  }, [sessions])

  const getTotalHoursForDate = (dateString: string) => {
    let totalHours = 0

    // Contar horas de sesiones actuales
    timeSlots.forEach(slot => {
      if (slot.dates.includes(dateString)) {
        totalHours += slot.duration
      }
    })

    // Contar horas de temas finalizados
    if (finishedTopic) {
      finishedTopic.timeSlots.forEach(slot => {
        if (slot.dates.includes(dateString)) {
          totalHours += slot.duration
        }
      })
    }

    // Contar horas de sesiones ya guardadas (prop sessions)
    // Pero solo si no estamos editando esas sesiones ahora mismo para evitar duplicados
    sessions.forEach(s => {
      // Normalizar formato de fecha por si viene de DB
      const sessionDate = s.date && s.date.includes('T') ? s.date.split('T')[0] : s.date

      if (sessionDate === dateString) {
        // Si estamos editando un tema, sus sesiones fueron removidas temporalmente de 'sessions'
        // por lo que no hay riesgo de duplicidad con timeSlots.
        // Si NO estamos editando, las sesiones de 'sessions' son las que se ven en el calendario.
        totalHours += (Number(s.duration) || 0)
      }
    })

    return Math.round(totalHours * 10) / 10
  }

  // Obtener días del mes actual
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Días del mes anterior
    const prevMonth = new Date(year, month - 1, 0)
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonth.getDate() - i),
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        totalHours: 0
      })
    }

    // Días del mes actual
    const today = new Date()
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      // Usar zona horaria local en lugar de UTC para evitar desfase de un día
      const dateString = formatDateToLocalString(date)
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
        isSelected: selectedDates.has(dateString),
        totalHours: getTotalHoursForDate(dateString)
      })
    }

    // Días del próximo mes
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        totalHours: 0
      })
    }

    return days
  }

  const handleDateClick = (day: any) => {
    if (!day || !day.isCurrentMonth || !day.date) return

    // Usar zona horaria local en lugar de UTC para evitar desfase de un día
    const dateString = formatDateToLocalString(day.date)

    if (selectedDates.has(dateString)) {
      setSelectedDates(prev => {
        const newSet = new Set(prev)
        newSet.delete(dateString)
        return newSet
      })
    } else {
      setSelectedDates(prev => new Set([...prev, dateString]))
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1)
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1)
      }
      return newMonth
    })
  }

  const calculateDuration = (startTime: string, endTime: string) => {
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    const diffMinutes = endMinutes - startMinutes
    return Math.round((diffMinutes / 60) * 10) / 10
  }

  const handleAddTimeSlot = () => {
    if (selectedDates.size === 0) return

    // Evitar duraciones inválidas
    const duration = calculateDuration(currentStartTime, currentEndTime)
    if (!Number.isFinite(duration) || duration <= 0) return

    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      dates: Array.from(selectedDates),
      startTime: currentStartTime,
      endTime: currentEndTime,
      duration
    }

    setTimeSlots(prev => [...prev, newSlot])
    // Mantener selección para permitir agregar múltiples horarios sobre las mismas fechas
  }

  const handleRemoveTimeSlotDate = (id: string, dateToRemove: string) => {
    setTimeSlots(prev =>
      prev
        .map(slot => {
          if (slot.id !== id) return slot
          const nextDates = slot.dates.filter(d => d !== dateToRemove)
          return { ...slot, dates: nextDates }
        })
        .filter(slot => slot.dates.length > 0)
    )
  }


  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  // Función para formatear fechas en formato dd/mm/aa
  const formatDateShort = (date: string) => {
    if (!date) return ''
    const d = parseDateSafe(date)
    const day = d.getDate().toString().padStart(2, '0')
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const year = d.getFullYear().toString().slice(-2)
    return `${day}/${month}/${year}`
  }

  const isPastDate = (dateString: string) => {
    const d = new Date(dateString)
    d.setHours(0, 0, 0, 0)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return d < now
  }

  // Calcular resumen del tema
  const getTopicSummary = () => {
    if (!finishedTopic) return { totalDays: 0, totalHours: 0 }

    const allDates = new Set<string>()
    let totalHours = 0

    // Agregar fechas y horas de horarios
    finishedTopic.timeSlots.forEach(slot => {
      slot.dates.forEach(date => allDates.add(date))
      totalHours += slot.duration * slot.dates.length
    })

    return {
      totalDays: allDates.size,
      totalHours: Math.round(totalHours * 10) / 10
    }
  }

  // Finalizar tema y mostrar resumen
  const handleFinishTopic = () => {
    if (topicTitle.trim() && timeSlots.length > 0) {
      // Crear sesiones para enviar al padre
      const newSessions: WorkshopSession[] = []

      // Agregar sesiones
      timeSlots.forEach(slot => {
        slot.dates.forEach(date => {
          newSessions.push({
            title: topicTitle,
            description: topicDescription,
            date: date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            duration: slot.duration
          })
        })
      })

      // Enviar sesiones al componente padre
      onSessionsChange([...sessions, ...newSessions])

      // Al guardar, colapsar el editor (sin mostrar resumen arriba)
      setFinishedTopic(null)
      setShowSummary(false)
      // Limpiar todo para permitir nuevo tema
      setTopicTitle("")
      setTopicDescription("")
      setTimeSlots([])
      setSelectedDates(new Set())
      setEditingTime(false)
      setCurrentStartTime("10:00")
      setCurrentEndTime("12:00")

      // Resetear estado de edición
      setIsEditingExistingTopic(false)
      setOriginalSessionsBackup([])
    }
  }

  // Volver a modo edición
  const handleEditTopic = () => {
    setShowSummary(false)
  }

  // Eliminar tema
  const handleDeleteTopic = () => {
    setShowDeleteConfirm(true)
  }

  // Confirmar eliminación
  const handleConfirmDelete = () => {
    // Resetear todo
    setFinishedTopic(null)
    setShowSummary(false)
    setShowDeleteConfirm(false)
  }

  // Cancelar eliminación
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false)
  }

  // Agrupar sesiones por tema para mostrar de forma inteligente
  const getGroupedSessions = () => {
    const grouped = new Map<string, {
      title: string
      description: string
      sessions: WorkshopSession[]
      totalHours: number
      originalCount: number
      secondaryCount: number
      allDates: string[]
    }>()

    sessions.forEach(session => {
      const key = session.title || 'Sin título'
      if (!grouped.has(key)) {
        grouped.set(key, {
          title: session.title || 'Sin título',
          description: session.description || '',
          sessions: [],
          totalHours: 0,
          originalCount: 0,
          secondaryCount: 0,
          allDates: []
        })
      }

      const group = grouped.get(key)!
      group.sessions.push(session)
      group.totalHours += session.duration

      // Contar todas las sesiones

      if (!group.allDates.includes(session.date)) {
        group.allDates.push(session.date)
      }
    })

    return Array.from(grouped.values())
  }

  // Función para eliminar un tema completo
  const handleDeleteGroupedTopic = (topicTitle: string) => {
    const newSessions = sessions.filter(session => session.title !== topicTitle)
    onSessionsChange(newSessions)
  }

  // Función para editar un tema completo
  const handleEditGroupedTopic = (topicTitle: string) => {
    const topicSessions = sessions.filter(session => session.title === topicTitle)
    if (topicSessions.length === 0) return

    // Hacer backup de las sesiones originales para poder cancelar
    setOriginalSessionsBackup([...sessions])
    setIsEditingExistingTopic(true)

    // Obtener datos del tema
    const firstSession = topicSessions[0]
    setTopicTitle(firstSession.title || '')
    setTopicDescription(firstSession.description || '')

    // Limpiar sesiones actuales del tema
    const otherSessions = sessions.filter(session => session.title !== topicTitle)
    onSessionsChange(otherSessions)

    // Procesar sesiones para reconstruir los time slots
    const allSlots = new Map<string, TimeSlot>()

    topicSessions.forEach(session => {
      const slotKey = `${session.startTime}-${session.endTime}`
      const slot: TimeSlot = {
        id: Date.now().toString() + Math.random(),
        dates: [session.date],
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration
      }

      if (allSlots.has(slotKey)) {
        // Agregar fecha al slot existente
        allSlots.get(slotKey)!.dates.push(session.date)
      } else {
        allSlots.set(slotKey, slot)
      }
    })

    // Convertir map a array y ordenar fechas
    const timeSlotsArray = Array.from(allSlots.values()).map(slot => ({
      ...slot,
      dates: slot.dates.sort()
    }))

    // Establecer los time slots reconstruidos
    setTimeSlots(timeSlotsArray)

    // Resetear otros estados
    setSelectedDates(new Set())
    setEditingTime(true)
    setCurrentStartTime("10:00")
    setCurrentEndTime("12:00")
    setShowSummary(false)
    setFinishedTopic(null)
  }

  // Función para cancelar la edición y restaurar el estado original
  const handleCancelEdit = () => {
    // Restaurar las sesiones originales
    onSessionsChange(originalSessionsBackup)

    // Resetear todos los estados
    setTopicTitle("")
    setTopicDescription("")
    setTimeSlots([])
    setSelectedDates(new Set())
    setEditingTime(true)
    setCurrentStartTime("10:00")
    setCurrentEndTime("12:00")
    setShowSummary(false)
    setFinishedTopic(null)
    setIsEditingExistingTopic(false)
    setOriginalSessionsBackup([])
  }

  const days = getDaysInMonth(currentMonth)
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  return (
    <div className="space-y-6 w-full">
      {/* Título y Descripción */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Título del tema</label>
          <input
            type="text"
            value={topicTitle}
            onChange={(e) => setTopicTitle(e.target.value)}
            placeholder="Ej: Elongación, Meditación, Yoga..."
            className="w-full px-4 py-2 bg-[#0A0A0A] border-b-2 border-[#3A3A3A] text-white placeholder:text-gray-500 focus:border-[#FF7939] focus:outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Descripción</label>
          <input
            type="text"
            value={topicDescription}
            onChange={(e) => setTopicDescription(e.target.value)}
            placeholder="Describe brevemente el contenido..."
            className="w-full px-4 py-2 bg-[#0A0A0A] border-b-2 border-[#3A3A3A] text-white placeholder:text-gray-500 focus:border-[#FF7939] focus:outline-none"
          />
        </div>
      </div>

      {/* Resumen de Temas Programados (Refinado) */}
      {sessions.length > 0 && !isInEditorMode && (
        <div className="py-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 rounded bg-[#FF7939]" />
              <h3 className="text-lg font-bold text-white tracking-tight">Temas Programados</h3>
              <span className="text-gray-500 text-xs ml-2">
                ({getGroupedSessions().length} {getGroupedSessions().length === 1 ? 'Tema' : 'Temas'})
              </span>
            </div>
          </div>

          <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {getGroupedSessions().map((group, index) => (
                <div
                  key={index}
                  className="bg-[#1A1A1A]/40 rounded-xl p-3 border border-white/5 hover:border-[#FF7939]/30 transition-all group backdrop-blur-sm"
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-white font-bold text-sm truncate pr-2">{group.title}</h4>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => handleEditGroupedTopic(group.title)}
                          className="p-1 hover:bg-[#FF7939]/20 rounded transition-colors"
                        >
                          <Edit3 className="w-3 h-3 text-[#FF7939]" />
                        </button>
                        <button
                          onClick={() => handleDeleteGroupedTopic(group.title)}
                          className="p-1 hover:bg-red-500/20 rounded transition-colors"
                        >
                          <Trash className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 mt-auto">
                      {group.sessions.slice(0, 3).map((s, i) => (
                        <div key={i} className="flex items-center justify-between text-[10px] bg-white/5 text-gray-400 px-1.5 py-1 rounded border border-white/5">
                          <span>{formatDateShort(s.date)}</span>
                          <span className="text-[#FF7939] ml-2 font-medium">{s.startTime} - {s.endTime}</span>
                        </div>
                      ))}
                      {group.sessions.length > 3 && (
                        <span className="text-[10px] text-gray-500 flex items-center mt-1">
                          +{group.sessions.length - 3} más
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Layout de 2 columnas: Calendario + Horarios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna Izquierda: Calendario */}
        <div className="space-y-4">
          {/* Header del calendario */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">
              {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-400">
                {day}
              </div>
            ))}
          </div>

          {/* Días del mes */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <button
                key={index}
                onClick={() => handleDateClick(day)}
                disabled={!day.isCurrentMonth}
                className={`
                  p-3 text-sm rounded-lg transition-all duration-200 relative
                  ${!day.isCurrentMonth
                    ? 'text-gray-600 cursor-not-allowed'
                    : day.isSelected
                      ? 'bg-[#FF7939] text-white scale-105 shadow-lg'
                      : day.totalHours > 0
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : day.isToday
                          ? 'bg-gray-700 text-white hover:bg-gray-600'
                          : 'bg-gray-800 text-white hover:bg-gray-700 hover:scale-105'
                  }
                `}
              >
                <span className="font-medium">{day.date.getDate()}</span>
                {day.totalHours > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-6 h-5 bg-[#FF7939] text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {day.totalHours}h
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Fechas seleccionadas - Simple */}
          {selectedDates.size > 0 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="flex flex-wrap gap-2 mb-2">
                {Array.from(selectedDates).map(date => (
                  <span
                    key={date}
                    className={`px-2 py-0.5 bg-[#FF7939]/15 text-[#FF7939] text-xs rounded-md font-semibold ${isPastDate(date) ? 'line-through opacity-60' : ''
                      }`}
                  >
                    {formatDateShort(date)}
                  </span>
                ))}
              </div>
              <button
                onClick={() => setSelectedDates(new Set())}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Limpiar
              </button>
            </div>
          )}
        </div>

        {/* Columna Derecha: Horarios (solo en modo edición/creación) */}
        {isInEditorMode && (
          <div className="space-y-6">
            {/* Horario Principal */}
            <div
              onClick={() => setEditingTime(true)}
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-1 h-6 rounded ${editingTime ? 'bg-[#FF7939]' : 'bg-gray-600'}`}></div>
                  <Clock className="w-5 h-5 text-[#FF7939]" />
                  <h3 className="text-lg font-medium text-white">Horarios</h3>
                </div>
                {editingTime && (
                  <span className="text-xs text-[#FF7939] font-medium">● Editando</span>
                )}
              </div>

              {/* Input de horarios */}
              {editingTime && (
                <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-2 py-1">
                    <input
                      type="time"
                      value={currentStartTime}
                      onChange={(e) => setCurrentStartTime(e.target.value)}
                      className="w-full px-2 py-1 bg-transparent text-white text-xs focus:outline-none"
                    />
                    <span className="text-gray-500 text-xs">-</span>
                    <input
                      type="time"
                      value={currentEndTime}
                      onChange={(e) => setCurrentEndTime(e.target.value)}
                      className="w-full px-2 py-1 bg-transparent text-white text-xs focus:outline-none"
                    />
                    <button
                      onClick={handleAddTimeSlot}
                      disabled={selectedDates.size === 0}
                      className="px-3 py-1 rounded-lg text-xs font-semibold transition-all border border-white/10 bg-white/10 hover:bg-white/15 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleFinishTopic}
                      disabled={timeSlots.length === 0 || !topicTitle.trim()}
                      className="w-full py-2 rounded-xl font-semibold transition-all border border-[#FF7939]/30 bg-gradient-to-r from-[#3a221b] to-[#20130f] text-[#ffb999] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Guardar
                    </button>

                    <button
                      onClick={handleCancelEdit}
                      disabled={!isEditingExistingTopic}
                      className="w-full py-2 rounded-xl font-semibold transition-all border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de horarios agregados (filas fecha - hora) */}
              <div className="space-y-1">
                {timeSlots.flatMap(slot =>
                  slot.dates.map(date => (
                    <div
                      key={`${slot.id}-${date}`}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-black/10 px-2 py-1"
                    >
                      <div className="text-xs text-white/90 flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md bg-[#FF7939]/15 text-[#FF7939] font-semibold ${isPastDate(date) ? 'line-through opacity-60' : ''
                            }`}
                        >
                          {formatDateShort(date)}
                        </span>
                        <span className="text-gray-400">—</span>
                        <span className={`font-medium text-white ${isPastDate(date) ? 'line-through opacity-60' : ''}`}>
                          {slot.startTime}-{slot.endTime}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveTimeSlotDate(slot.id, date)}
                        className="p-1 rounded hover:bg-white/5 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  ))
                )}
                {timeSlots.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-6 gap-3">
                    <p className="text-xs text-gray-500 font-medium">No hay horarios configurados</p>
                    {topicTitle.trim() && (
                      <button
                        type="button"
                        onClick={() => setEditingTime(true)}
                        className="w-12 h-12 rounded-full bg-[#FF7939] border-4 border-[#FF7939]/20 flex items-center justify-center shadow-lg shadow-[#FF7939]/20 hover:scale-110 transition-transform active:scale-95 group"
                      >
                        <Plus className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Resumen del Tema - Ultra Compacto */}
      {isInEditorMode && showSummary && finishedTopic && (
        <div className="pt-4">
          <div className="p-2 rounded">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h3 className="text-sm font-medium text-white">{finishedTopic.title}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <span className="text-[#FF7939] font-medium">{getTopicSummary().totalHours}h</span>
                  <span className="text-gray-500">|</span>
                  <span>{getTopicSummary().totalDays} días</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleEditTopic}
                  className="p-1.5 hover:bg-[#FF7939] hover:bg-opacity-20 rounded transition-colors"
                  title="Editar tema"
                >
                  <Edit3 className="w-4 h-4 text-[#FF7939]" />
                </button>
                <button
                  onClick={handleDeleteTopic}
                  className="p-1.5 hover:bg-red-600 hover:bg-opacity-20 rounded transition-colors"
                  title="Eliminar tema"
                >
                  <Trash className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteConfirm && finishedTopic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1A1A1A] p-6 rounded-lg border border-[#3A3A3A] max-w-sm mx-4">
            <h3 className="text-lg font-medium text-white mb-3">¿Eliminar tema?</h3>
            <p className="text-sm text-gray-300 mb-4">
              Esta acción eliminará permanentemente el tema "{finishedTopic.title}" y todos sus horarios.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                className="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botones Finales (se movieron al header de edición para un layout más compacto) */}

      {/* Lista de temas programados - Sección inferior (Solo si estamos en editor para no duplicar) */}
      {sessions.length > 0 && isInEditorMode && (
        <div className="mt-8 border-t border-white/5 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 rounded bg-gray-600" />
            <h3 className="text-base font-medium text-gray-400">Otros Temas Programados</h3>
          </div>
          <div className="space-y-3">
            {getGroupedSessions().map((group, index) => (
              <div
                key={index}
                className="bg-[#121212] rounded-lg p-4 border border-white/10"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium text-base mb-2">{group.title}</h4>
                    <div className="flex flex-wrap gap-2">
                      {group.sessions.map((s, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[11px]">
                          <span className="bg-[#FF7939]/10 text-[#FF7939] px-2 py-0.5 rounded font-bold border border-[#FF7939]/20">
                            {formatDateShort(s.date)}
                          </span>
                          <span className="text-gray-500">{s.startTime}-{s.endTime}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEditGroupedTopic(group.title)}
                      className="p-2 hover:bg-[#FF7939]/20 rounded-lg transition-colors border border-[#FF7939]/20"
                    >
                      <Edit3 className="w-4 h-4 text-[#FF7939]" />
                    </button>
                    <button
                      onClick={() => handleDeleteGroupedTopic(group.title)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20"
                    >
                      <Trash className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}