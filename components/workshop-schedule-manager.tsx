"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Clock, Calendar as CalendarIcon, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface TimeBlock {
  id: string
  name: string
  startTime: string
  endTime: string
  startDate: string
  endDate: string
  color: string
  selectedDates: Date[]
  repeatType: 'days' | 'weeks' | 'months'
  repeatValues: number[] | string[]
  selectedWeekDays: string[]
  selectedWeeks: number[]
  selectedMonths: string[]
}

interface WorkshopScheduleManagerProps {
  onScheduleChange: (blocks: TimeBlock[]) => void
  initialBlocks?: TimeBlock[]
  existingActivities?: TimeBlock[]
}

const blockColors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-indigo-500',
  'bg-teal-500'
]

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const weekDays = [
  { key: 'Lun', label: 'Lunes' },
  { key: 'Mar', label: 'Martes' },
  { key: 'Mié', label: 'Miércoles' },
  { key: 'Jue', label: 'Jueves' },
  { key: 'Vie', label: 'Viernes' },
  { key: 'Sáb', label: 'Sábado' },
  { key: 'Dom', label: 'Domingo' }
]

export function WorkshopScheduleManager({ onScheduleChange, initialBlocks = [], existingActivities = [] }: WorkshopScheduleManagerProps) {
  const [blocks, setBlocks] = useState<TimeBlock[]>(initialBlocks)
  const [showAddBlock, setShowAddBlock] = useState(false)
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)
  const [showExistingActivities, setShowExistingActivities] = useState(true)
  const [filteredActivities, setFilteredActivities] = useState<string[]>([])
  const [newBlock, setNewBlock] = useState<Partial<TimeBlock>>({
    name: '',
    startTime: '09:00',
    endTime: '10:00',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    color: blockColors[0],
    selectedDates: [],
    repeatType: 'days',
    repeatValues: [],
    selectedWeekDays: [],
    selectedWeeks: [],
    selectedMonths: []
  })

  const weekOptions = Array.from({ length: 5 }, (_, i) => i + 1)

  const generateDatesFromConfig = (block: Partial<TimeBlock>): Date[] => {
    if (!block.selectedWeekDays || block.selectedWeekDays.length === 0 || !block.startDate || !block.endDate) {
      console.log('Faltan datos para generar fechas:', {
        selectedWeekDays: block.selectedWeekDays,
        startDate: block.startDate,
        endDate: block.endDate
      })
      return []
    }

    const dates: Date[] = []
    const startDate = new Date(block.startDate)
    const endDate = new Date(block.endDate)
    const currentDate = new Date(startDate)
    
    const dayMapping: { [key: string]: number } = {
      'Dom': 0, 'Lun': 1, 'Mar': 2, 'Mié': 3, 'Jue': 4, 'Vie': 5, 'Sáb': 6
    }

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay()
      
      for (const dayKey of block.selectedWeekDays) {
        if (dayMapping[dayKey] === dayOfWeek) {
          dates.push(new Date(currentDate))
          break
        }
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    console.log(`Generadas ${dates.length} fechas para ${block.name}`)
    return dates
  }

  const handleAddBlock = () => {
    if (!newBlock.name || !newBlock.startDate || !newBlock.endDate) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    if (new Date(newBlock.startDate) >= new Date(newBlock.endDate)) {
      alert('La fecha de inicio debe ser anterior a la fecha de fin')
      return
    }

    const generatedDates = generateDatesFromConfig(newBlock)

    if (editingBlockId) {
      const updatedBlocks = blocks.map(block =>
        block.id === editingBlockId
          ? { ...newBlock, id: editingBlockId, selectedDates: generatedDates } as TimeBlock
          : block
      )
      setBlocks(updatedBlocks)
      onScheduleChange(updatedBlocks)
      setEditingBlockId(null)
    } else {
      const newBlockWithId: TimeBlock = {
        ...newBlock,
      id: Date.now().toString(),
        selectedDates: generatedDates
      } as TimeBlock
      
      const updatedBlocks = [...blocks, newBlockWithId]
    setBlocks(updatedBlocks)
    onScheduleChange(updatedBlocks)
    }
    
    setNewBlock({
      name: '',
      startTime: '09:00',
      endTime: '10:00',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      color: blockColors[0],
      selectedDates: [],
      repeatType: 'days',
      repeatValues: [],
      selectedWeekDays: [],
      selectedWeeks: [],
      selectedMonths: []
    })
    setShowAddBlock(false)
  }

  const handleRemoveBlock = (blockId: string) => {
    const updatedBlocks = blocks.filter(block => block.id !== blockId)
    setBlocks(updatedBlocks)
    onScheduleChange(updatedBlocks)
  }

  const handleEditBlock = (block: TimeBlock) => {
    setEditingBlockId(block.id)
    setNewBlock({
      name: block.name,
      startTime: block.startTime,
      endTime: block.endTime,
      startDate: block.startDate,
      endDate: block.endDate,
      color: block.color,
      selectedDates: block.selectedDates,
      repeatType: block.repeatType,
      repeatValues: block.repeatValues,
      selectedWeekDays: block.selectedWeekDays,
      selectedWeeks: block.selectedWeeks,
      selectedMonths: block.selectedMonths
    })
    setShowAddBlock(true)
  }

  const handleCancelEdit = () => {
    setEditingBlockId(null)
    setShowAddBlock(false)
    setNewBlock({
      name: '',
      startTime: '09:00',
      endTime: '10:00',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      color: blockColors[0],
      selectedDates: [],
      repeatType: 'days',
      repeatValues: [],
      selectedWeekDays: [],
      selectedWeeks: [],
      selectedMonths: []
    })
  }

  const handleWeekDayToggle = (dayKey: string) => {
    const currentDays = newBlock.selectedWeekDays || []
    const newDays = currentDays.includes(dayKey)
      ? currentDays.filter(d => d !== dayKey)
      : [...currentDays, dayKey]
    
    setNewBlock(prev => ({ ...prev, selectedWeekDays: newDays }))
  }

  const handleWeekToggle = (week: number) => {
    const currentWeeks = newBlock.selectedWeeks || []
    const newWeeks = currentWeeks.includes(week)
      ? currentWeeks.filter(w => w !== week)
      : [...currentWeeks, week]
    
    setNewBlock(prev => ({ ...prev, selectedWeeks: newWeeks }))
  }

  const handleMonthToggle = (month: string) => {
    const currentMonths = newBlock.selectedMonths || []
    const newMonths = currentMonths.includes(month)
      ? currentMonths.filter(m => m !== month)
      : [...currentMonths, month]
    
    setNewBlock(prev => ({ ...prev, selectedMonths: newMonths }))
  }

  const toggleActivityVisibility = (activityName: string) => {
    setFilteredActivities(prev => 
      prev.includes(activityName) 
        ? prev.filter(name => name !== activityName)
        : [...prev, activityName]
    )
  }

  const toggleAllActivities = () => {
    setShowExistingActivities(!showExistingActivities)
  }

  const getBlockColorsForCalendar = () => {
    const colors: { [key: string]: string } = {}
    
    blocks.forEach(block => {
      colors[block.name] = block.color
    })
    
    existingActivities.forEach(activity => {
      if (!colors[activity.name]) {
        colors[activity.name] = `${activity.color} opacity-50`
      }
    })
    
    return colors
  }

  const getAllSelectedDates = () => {
    const allDates: Date[] = []
    
    blocks.forEach(block => {
      allDates.push(...block.selectedDates)
    })
    
    existingActivities.forEach(activity => {
      if (showExistingActivities && (filteredActivities.length === 0 || filteredActivities.includes(activity.name))) {
        allDates.push(...activity.selectedDates)
      }
    })
    
    return allDates
  }

  const getDateBlockColor = (date: Date) => {
    for (const block of blocks) {
      if (block.selectedDates.some(selectedDate => 
        selectedDate.toDateString() === date.toDateString()
      )) {
        return block.color
      }
    }
    
    for (const activity of existingActivities) {
      if (showExistingActivities && 
          (filteredActivities.length === 0 || filteredActivities.includes(activity.name)) &&
          activity.selectedDates.some(selectedDate => 
            selectedDate.toDateString() === date.toDateString()
          )) {
        return `${activity.color} opacity-50`
      }
    }
    
    return null
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Panel lateral */}
      <div className="lg:col-span-1 space-y-4">
        {/* Panel de actividades existentes */}
        <Card className="bg-[#0A0A0A] border-[#1A1A1A]">
          <CardHeader>
            <CardTitle className="text-white text-sm flex items-center justify-between">
              <span>Actividades Existentes</span>
              <button
                onClick={toggleAllActivities}
                className="text-xs text-gray-400 hover:text-white"
              >
                {showExistingActivities ? 'Ocultar' : 'Mostrar'}
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {existingActivities.length === 0 ? (
              <p className="text-gray-400 text-xs">No hay actividades configuradas</p>
            ) : (
              <div className="space-y-2">
                {existingActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-2 bg-[#1A1A1A] rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${activity.color}`} />
                      <div>
                        <p className="text-white text-xs font-medium">{activity.name}</p>
                        <p className="text-gray-400 text-xs">
                          {activity.selectedDates.length} sesiones
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleActivityVisibility(activity.name)}
                      className={`text-xs px-2 py-1 rounded ${
                        filteredActivities.includes(activity.name)
                          ? 'bg-red-500 text-white'
                          : 'bg-green-500 text-white'
                      }`}
                    >
                      {filteredActivities.includes(activity.name) ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumen de ocupación */}
        <Card className="bg-[#0A0A0A] border-[#1A1A1A]">
          <CardHeader>
            <CardTitle className="text-white text-sm">Resumen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Total actividades:</span>
                <span className="text-white">{existingActivities.length + blocks.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Sesiones programadas:</span>
                <span className="text-white">
                  {existingActivities.reduce((total, a) => total + a.selectedDates.length, 0) +
                   blocks.reduce((total, b) => total + b.selectedDates.length, 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenido principal */}
      <div className="lg:col-span-3 space-y-6">
      {/* Calendario principal */}
      <Card className="bg-[#0A0A0A] border-[#1A1A1A]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendario de Horarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            selectedDates={getAllSelectedDates()}
              onDateSelect={() => {}}
              onDateDeselect={() => {}}
            blockColors={getBlockColorsForCalendar()}
              getDateBlockColor={getDateBlockColor}
          />
        </CardContent>
      </Card>

      {/* Botón para agregar bloque */}
      <div className="flex justify-center">
        <Button
          onClick={() => setShowAddBlock(true)}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Bloque de Horario
        </Button>
      </div>

        {/* Lista de bloques existentes */}
        {blocks.length > 0 && (
          <Card className="bg-[#0A0A0A] border-[#1A1A1A]">
            <CardHeader>
              <CardTitle className="text-white">Bloques de Horario Configurados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {blocks.map((block) => (
                  <div
                    key={block.id}
                    className="flex items-center justify-between p-4 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A]"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${block.color}`} />
                      <div>
                        <h4 className="text-white font-medium">{block.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {block.startTime} - {block.endTime}
                          </span>
                          <span>
                            {block.selectedDates.length} sesiones programadas
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          <div>Período: {new Date(block.startDate).toLocaleDateString('es-ES')} - {new Date(block.endDate).toLocaleDateString('es-ES')}</div>
                          <div>Días: {block.selectedWeekDays.join(', ')}
                          {block.selectedWeeks.length > 0 && ` | Semanas: ${block.selectedWeeks.join(', ')}`}
                          {block.selectedMonths.length > 0 && ` | Meses: ${block.selectedMonths.join(', ')}`}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditBlock(block)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveBlock(block.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Modal para agregar bloque */}
      <AnimatePresence>
        {showAddBlock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4"
            onClick={() => setShowAddBlock(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1A1A1A] rounded-xl p-6 w-full max-w-2xl border border-[#2A2A2A] max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-semibold text-xl">
                    {editingBlockId ? 'Editar Bloque de Horario' : 'Nuevo Bloque de Horario'}
                  </h3>
                <Button
                  variant="ghost"
                  size="sm"
                    onClick={handleCancelEdit}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Información básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-white font-medium mb-2 block">Nombre del bloque</label>
                    <Input
                      value={newBlock.name}
                      onChange={(e) => setNewBlock(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ej: Yoga Matutina"
                      className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-white font-medium mb-2 block">Hora de inicio</label>
                      <Input
                        type="time"
                        value={newBlock.startTime}
                        onChange={(e) => setNewBlock(prev => ({ ...prev, startTime: e.target.value }))}
                        className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                      />
                    </div>
                    <div>
                      <label className="text-white font-medium mb-2 block">Hora de fin</label>
                      <Input
                        type="time"
                        value={newBlock.endTime}
                        onChange={(e) => setNewBlock(prev => ({ ...prev, endTime: e.target.value }))}
                        className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                      />
                    </div>
                  </div>
                </div>

                  {/* Fechas de inicio y fin */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-white font-medium mb-2 block">Fecha de inicio</label>
                      <Input
                        type="date"
                        value={newBlock.startDate}
                        onChange={(e) => setNewBlock(prev => ({ ...prev, startDate: e.target.value }))}
                        className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                      />
                    </div>
                    <div>
                      <label className="text-white font-medium mb-2 block">Fecha de fin</label>
                      <Input
                        type="date"
                        value={newBlock.endDate}
                        onChange={(e) => setNewBlock(prev => ({ ...prev, endDate: e.target.value }))}
                        className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                      />
                    </div>
                  </div>

                  {/* Color */}
                <div>
                    <label className="text-white font-medium mb-2 block">Color</label>
                    <div className="grid grid-cols-4 gap-2">
                    {blockColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewBlock(prev => ({ ...prev, color }))}
                        className={`w-8 h-8 rounded-full ${color} border-2 ${
                          newBlock.color === color ? 'border-white' : 'border-transparent'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                  {/* Días de la semana */}
                <div>
                    <label className="text-white font-medium mb-2 block">Días de la semana</label>
                  <div className="grid grid-cols-7 gap-2">
                    {weekDays.map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => handleWeekDayToggle(key)}
                          className={`p-2 rounded-lg text-sm ${
                          (newBlock.selectedWeekDays || []).includes(key)
                            ? 'bg-orange-500 text-white'
                              : 'bg-[#2A2A2A] text-gray-400 hover:text-white'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setShowAddBlock(false)}
                    variant="outline"
                    className="flex-1 border-[#3A3A3A] text-gray-400 hover:text-white"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAddBlock}
                    disabled={!newBlock.name || (newBlock.selectedWeekDays || []).length === 0}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4 mr-2" />
                      {editingBlockId ? 'Actualizar Bloque' : 'Agregar Bloque'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
            </div>
    </div>
  )
}
