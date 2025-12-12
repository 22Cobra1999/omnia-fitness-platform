"use client"

import React, { useState } from "react"
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

  // Función para convertir Date a string YYYY-MM-DD en zona horaria local
  const formatDateToLocalString = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Calcular horas totales por día (todos los temas)
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
    
    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      dates: Array.from(selectedDates),
      startTime: currentStartTime,
      endTime: currentEndTime,
      duration: calculateDuration(currentStartTime, currentEndTime)
    }
    
    setTimeSlots(prev => [...prev, newSlot])
    
    // Limpiar selección
    setSelectedDates(new Set())
  }

  const handleRemoveTimeSlot = (id: string) => {
    setTimeSlots(prev => prev.filter(slot => slot.id !== id))
  }


  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  // Función para formatear fechas en formato dd/mm/aa
  const formatDateShort = (date: string) => {
    const d = new Date(date)
    const day = d.getDate().toString().padStart(2, '0')
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const year = d.getFullYear().toString().slice(-2)
    return `${day}/${month}/${year}`
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
      
      // Guardar el tema finalizado
      setFinishedTopic({
        title: topicTitle,
        description: topicDescription,
        timeSlots: [...timeSlots]
      })
      setShowSummary(true)
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
              <div className="flex flex-wrap gap-2">
                {Array.from(selectedDates).map(date => (
                  <span
                    key={date}
                    className="px-3 py-1.5 text-sm rounded font-medium bg-[#FF7939] text-white"
                  >
                    {formatDate(date)}
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

        {/* Columna Derecha: Horarios */}
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
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={currentStartTime}
                    onChange={(e) => setCurrentStartTime(e.target.value)}
                    className="flex-1 px-2 py-1 bg-[#1A1A1A] border-b border-[#3A3A3A] text-white text-xs focus:border-[#FF7939] focus:outline-none"
                  />
                  <span className="text-gray-500 text-xs">-</span>
                  <input
                    type="time"
                    value={currentEndTime}
                    onChange={(e) => setCurrentEndTime(e.target.value)}
                    className="flex-1 px-2 py-1 bg-[#1A1A1A] border-b border-[#3A3A3A] text-white text-xs focus:border-[#FF7939] focus:outline-none"
                  />
                  <button
                    onClick={handleAddTimeSlot}
                    disabled={selectedDates.size === 0}
                    className="px-3 py-1 bg-[#FF7939] hover:bg-[#FF6B35] disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-xs font-medium transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Agregar
                  </button>
                </div>
              </div>
            )}
            
            {/* Lista de time slots principales - Compacto */}
            <div className="space-y-1">
              {timeSlots.map(slot => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between w-full py-2 px-1 hover:bg-gray-800/30 transition-colors border-l-2 border-[#FF7939]"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center gap-3 text-sm">
                      {/* Horario */}
                      <span className="text-white font-medium min-w-[80px]">
                        {slot.startTime}-{slot.endTime} ({slot.duration}h)
                      </span>
                      
                      {/* Separador */}
                      <span className="text-gray-500">|</span>
                      
                      {/* Fechas compactas */}
                      <div className="flex gap-1">
                        {slot.dates.map(date => (
                          <span
                            key={date}
                            className="px-1.5 py-0.5 bg-[#FF7939] text-white text-xs rounded"
                          >
                            {formatDateShort(date)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveTimeSlot(slot.id)}
                    className="p-1 hover:bg-gray-800 rounded transition-colors ml-2"
                  >
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                </div>
              ))}
              {timeSlots.length === 0 && (
                <div className="text-center text-xs text-gray-500 py-3">
                  No hay horarios configurados
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Resumen del Tema - Ultra Compacto */}
      {showSummary && finishedTopic && (
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

      {/* Botones Finales - Ancho completo */}
      {!showSummary && (
        <div className="pt-4 space-y-2">
          <button
            onClick={handleFinishTopic}
            disabled={timeSlots.length === 0 || !topicTitle.trim()}
            className="w-full py-3 bg-[#FF7939] hover:bg-[#FF6B35] disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded font-medium transition-colors"
          >
            Finalizar Tema
          </button>
          
          {/* Botón Cancelar Edición - Solo visible cuando se está editando */}
          {isEditingExistingTopic && (
            <button
              onClick={handleCancelEdit}
              className="w-full py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium transition-colors text-sm"
            >
              Cancelar Edición
            </button>
          )}
        </div>
      )}

      {/* Lista de temas programados - Agrupación inteligente */}
      {sessions.length > 0 && (
        <div className="mt-6">
          <h3 className="text-base font-medium text-white mb-2">Temas Programados</h3>
          <div className="space-y-2">
            {getGroupedSessions().map((group, index) => (
              <div
                key={index}
                className="bg-[#1A1A1A] rounded-lg p-3 border border-[#3A3A3A] hover:border-[#FF7939] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Nombre del tema */}
                    <h4 className="text-white font-medium text-base mb-2">
                      {group.title}
                    </h4>
                    
                    {/* Fechas compactas en una línea */}
                    <div className="flex items-center gap-2 text-sm mb-2">
                      <span className="text-gray-400 text-xs">Fechas:</span>
                      <div className="flex gap-1 flex-wrap">
                        {group.allDates
                          .sort()
                          .map(date => {
                            const isPastDate = new Date(date) < new Date()
                            return (
                              <span
                                key={date}
                                className={`px-1.5 py-0.5 text-xs rounded ${
                                  isPastDate 
                                    ? 'bg-gray-500 text-gray-300 line-through' 
                                    : 'bg-[#FF7939] text-white'
                                }`}
                              >
                                {formatDateShort(date)}
                              </span>
                            )
                          })}
                      </div>
                    </div>
                    
                    {/* Información del tema - Compacto para iPhone */}
                    <div className="flex items-center gap-3 text-xs text-gray-300">
                      <span className="text-[#FF7939] font-medium">
                        {group.totalHours}h totales
                      </span>
                      <span className="text-gray-500">|</span>
                      <span>{group.sessions.length} sesiones</span>
                    </div>
                  </div>
                  
                  {/* Botones de acción - Compactos para iPhone */}
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => handleEditGroupedTopic(group.title)}
                      className="p-1.5 hover:bg-[#FF7939] hover:bg-opacity-20 rounded transition-colors"
                      title="Editar tema completo"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#FF7939]" />
                    </button>
                    <button
                      onClick={() => handleDeleteGroupedTopic(group.title)}
                      className="p-1.5 hover:bg-red-600 hover:bg-opacity-20 rounded transition-colors"
                      title="Eliminar tema completo"
                    >
                      <Trash className="w-3.5 h-3.5 text-red-500" />
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