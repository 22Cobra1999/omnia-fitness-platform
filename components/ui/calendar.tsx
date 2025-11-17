"use client"

import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils/utils'

interface CalendarProps {
  selectedDates: Date[]
  onDateSelect: (date: Date) => void
  onDateDeselect: (date: Date) => void
  blockColors?: { [key: string]: string }
  getDateBlockColor?: (date: Date) => string | null
  getDateBlockColors?: (date: Date) => string[]
  getDateConflicts?: (date: Date) => any[]
  onDateClick?: (date: Date) => void
  className?: string
}

export function Calendar({ 
  selectedDates, 
  onDateSelect, 
  onDateDeselect, 
  blockColors = {},
  getDateBlockColor: customGetDateBlockColor,
  getDateBlockColors: customGetDateBlockColors,
  getDateConflicts: customGetDateConflicts,
  onDateClick,
  className 
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  // Generar fechas del mes actual
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Agregar días del mes anterior para completar la primera semana
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevDate = new Date(year, month, -startingDayOfWeek + i + 1)
      days.push({ date: prevDate, isCurrentMonth: false })
    }

    // Agregar días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i)
      days.push({ date: currentDate, isCurrentMonth: true })
    }

    // Agregar días del mes siguiente para completar la última semana
    const remainingDays = 42 - days.length // 6 semanas * 7 días
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i)
      days.push({ date: nextDate, isCurrentMonth: false })
    }

    return days
  }

  const days = getDaysInMonth(currentDate)

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  const isDateSelected = (date: Date) => {
    return selectedDates.some(selectedDate => 
      selectedDate.toDateString() === date.toDateString()
    )
  }

  const getDateBlockColors = (date: Date) => {
    // Si hay una función personalizada para múltiples colores, usarla
    if (customGetDateBlockColors) {
      return customGetDateBlockColors(date)
    }
    
    // Si hay una función personalizada para un solo color, usarla
    if (customGetDateBlockColor) {
      const color = customGetDateBlockColor(date)
      return color ? [color] : []
    }
    
    // Buscar si esta fecha tiene algún bloque asignado
    const matchingDate = selectedDates.find(selectedDate => 
      selectedDate.toDateString() === date.toDateString()
    )
    
    if (matchingDate) {
      // Retornar todos los colores disponibles de los bloques
      return Object.values(blockColors) || ['bg-blue-500']
    }
    
    return []
  }

  const getDateConflicts = (date: Date) => {
    if (customGetDateConflicts) {
      return customGetDateConflicts(date)
    }
    return []
  }

  const hasConflicts = (date: Date) => {
    const conflicts = getDateConflicts(date)
    return conflicts.length > 0
  }

  const handleDateClick = (date: Date) => {
    // Si hay un callback personalizado para clicks, usarlo
    if (onDateClick) {
      onDateClick(date)
      return
    }
    
    // Comportamiento por defecto
    if (isDateSelected(date)) {
      onDateDeselect(date)
    } else {
      onDateSelect(date)
    }
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  return (
    <div className={cn("bg-[#1A1A1A] rounded-xl p-6 border border-[#2A2A2A]", className)}>
      {/* Header del calendario */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPreviousMonth}
          className="text-gray-400 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <h2 className="text-white font-semibold text-lg">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={goToNextMonth}
          className="text-gray-400 hover:text-white"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-gray-400 text-sm font-medium py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Días del mes */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(({ date, isCurrentMonth }, index) => {
          const isSelected = isDateSelected(date)
          const isToday = date.toDateString() === new Date().toDateString()
          const blockColors = getDateBlockColors(date)

          return (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              className={cn(
                "h-12 rounded-lg text-sm font-medium transition-all duration-200 relative",
                isCurrentMonth 
                  ? "text-white hover:bg-[#2A2A2A]" 
                  : "text-gray-600",
                isToday && "bg-orange-500/20 text-orange-400"
              )}
            >
              <span className={cn(
                "relative z-10",
                blockColors.length > 0 && isCurrentMonth && !isToday && "text-orange-400",
                isToday && "text-orange-400"
              )}>
                {date.getDate()}
              </span>
              
              {/* Indicadores de bloque - múltiples colores */}
              {blockColors.length > 0 && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
                  {blockColors.slice(0, 3).map((color, colorIndex) => (
                    <div 
                      key={colorIndex}
                      className={cn(
                        "w-2 h-2 rounded-full",
                        color
                      )} 
                    />
                  ))}
                  {blockColors.length > 3 && (
                    <div className="w-2 h-2 rounded-full bg-gray-500 text-white text-xs flex items-center justify-center">
                      +
                    </div>
                  )}
                </div>
              )}

              {/* Símbolo de alerta para conflictos */}
              {hasConflicts(date) && (
                <div className="absolute top-1 right-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Leyenda de colores */}
      {Object.keys(blockColors).length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#2A2A2A]">
          <h3 className="text-white text-sm font-medium mb-2">Actividades programadas:</h3>
          <div className="space-y-2">
            {Object.entries(blockColors).map(([blockName, color]) => (
              <div key={blockName} className="flex items-start space-x-2">
                <div className={cn("w-3 h-3 rounded-full mt-1 flex-shrink-0", color)} />
                <span className="text-gray-400 text-xs leading-tight break-words">
                  {blockName}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información adicional */}
      {selectedDates.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#2A2A2A]">
          <div className="text-center">
            <p className="text-white text-sm font-medium">
              {selectedDates.length} sesión{selectedDates.length !== 1 ? 'es' : ''} programada{selectedDates.length !== 1 ? 's' : ''}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Los días marcados representan las sesiones de tus bloques de horario
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
