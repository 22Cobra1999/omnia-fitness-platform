"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Clock, Calendar, FileText, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface WorkshopTopic {
  id?: string
  topic_title: string
  topic_description: string
  topic_number: number
  color: string
  
  // Horario Original
  original_days: string[]
  original_start_time: string
  original_end_time: string
  
  // Horario BIS
  bis_enabled: boolean
  bis_days: string[]
  bis_start_time: string
  bis_end_time: string
  
  // Período
  start_date: string
  end_date: string
}

interface WorkshopTopicSchedulerProps {
  onTopicChange: (topic: WorkshopTopic) => void
  initialTopic?: Partial<WorkshopTopic>
}

const weekDays = [
  { key: 'Lun', label: 'L' },
  { key: 'Mar', label: 'M' },
  { key: 'Mié', label: 'X' },
  { key: 'Jue', label: 'J' },
  { key: 'Vie', label: 'V' },
  { key: 'Sáb', label: 'S' },
  { key: 'Dom', label: 'D' }
]

const topicColors = [
  'bg-blue-500',
  'bg-green-500', 
  'bg-purple-500',
  'bg-pink-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-indigo-500',
  'bg-teal-500'
]

export function WorkshopTopicScheduler({ onTopicChange, initialTopic }: WorkshopTopicSchedulerProps) {
  const [topic, setTopic] = useState<WorkshopTopic>({
    topic_title: '',
    topic_description: '',
    topic_number: 1,
    color: topicColors[0],
    
    // Horario Original
    original_days: [],
    original_start_time: '10:00',
    original_end_time: '11:00',
    
    // Horario BIS
    bis_enabled: false,
    bis_days: [],
    bis_start_time: '18:00',
    bis_end_time: '19:00',
    
    // Período
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    
    ...initialTopic
  })

  const handleTopicUpdate = (updates: Partial<WorkshopTopic>) => {
    const updatedTopic = { ...topic, ...updates }
    setTopic(updatedTopic)
    onTopicChange(updatedTopic)
  }

  const handleDayToggle = (day: string, isOriginal: boolean) => {
    const currentDays = isOriginal ? topic.original_days : topic.bis_days
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day]
    
    handleTopicUpdate({
      [isOriginal ? 'original_days' : 'bis_days']: newDays
    })
  }

  const calculateDuration = (startTime: string, endTime: string): number => {
    const start = new Date(`2000-01-01T${startTime}`)
    const end = new Date(`2000-01-01T${endTime}`)
    const diffMs = end.getTime() - start.getTime()
    return Math.round(diffMs / (1000 * 60 * 60)) // Horas
  }

  return (
    <Card className="bg-[#0A0A0A] border-[#1A1A1A]">
      <CardContent className="p-4 space-y-4">
        
        {/* Información del Tema */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white">
            <FileText className="h-4 w-4" />
            <span className="font-medium text-sm">Información del Tema</span>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label htmlFor="topic_title" className="text-xs text-gray-400">
                Título del tema
              </Label>
              <Input
                id="topic_title"
                value={topic.topic_title}
                onChange={(e) => handleTopicUpdate({ topic_title: e.target.value })}
                placeholder="Ej: Introducción al Yoga"
                className="h-8 text-sm bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder:text-gray-500"
              />
            </div>
            
            <div>
              <Label htmlFor="topic_description" className="text-xs text-gray-400">
                Descripción
              </Label>
              <Textarea
                id="topic_description"
                value={topic.topic_description}
                onChange={(e) => handleTopicUpdate({ topic_description: e.target.value })}
                placeholder="Descripción del tema..."
                className="h-16 text-sm bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder:text-gray-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Color del Tema */}
        <div className="space-y-2">
          <Label className="text-xs text-gray-400">Color del tema</Label>
          <div className="grid grid-cols-4 gap-2">
            {topicColors.map((color) => (
              <button
                key={color}
                onClick={() => handleTopicUpdate({ color })}
                className={`w-8 h-8 rounded-full ${color} border-2 ${
                  topic.color === color ? 'border-white' : 'border-transparent'
                } transition-all hover:scale-110`}
              />
            ))}
          </div>
        </div>

        {/* Período */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white">
            <Calendar className="h-4 w-4" />
            <span className="font-medium text-sm">Período</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="start_date" className="text-xs text-gray-400">Inicio</Label>
              <Input
                id="start_date"
                type="date"
                value={topic.start_date}
                onChange={(e) => handleTopicUpdate({ start_date: e.target.value })}
                className="h-8 text-xs bg-[#1A1A1A] border-[#2A2A2A] text-white"
              />
            </div>
            <div>
              <Label htmlFor="end_date" className="text-xs text-gray-400">Fin</Label>
              <Input
                id="end_date"
                type="date"
                value={topic.end_date}
                onChange={(e) => handleTopicUpdate({ end_date: e.target.value })}
                className="h-8 text-xs bg-[#1A1A1A] border-[#2A2A2A] text-white"
              />
            </div>
          </div>
        </div>

        {/* Horario Original */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white">
            <Clock className="h-4 w-4" />
            <span className="font-medium text-sm">Horario Original</span>
          </div>
          
          {/* Días de la semana */}
          <div>
            <Label className="text-xs text-gray-400 mb-2 block">Días</Label>
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleDayToggle(key, true)}
                  className={`h-7 w-7 rounded text-xs font-medium transition-all ${
                    topic.original_days.includes(key)
                      ? 'bg-orange-500 text-white'
                      : 'bg-[#1A1A1A] text-gray-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Horas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="original_start_time" className="text-xs text-gray-400">Inicio</Label>
              <Input
                id="original_start_time"
                type="time"
                value={topic.original_start_time}
                onChange={(e) => handleTopicUpdate({ original_start_time: e.target.value })}
                className="h-8 text-xs bg-[#1A1A1A] border-[#2A2A2A] text-white"
              />
            </div>
            <div>
              <Label htmlFor="original_end_time" className="text-xs text-gray-400">Fin</Label>
              <Input
                id="original_end_time"
                type="time"
                value={topic.original_end_time}
                onChange={(e) => handleTopicUpdate({ original_end_time: e.target.value })}
                className="h-8 text-xs bg-[#1A1A1A] border-[#2A2A2A] text-white"
              />
            </div>
          </div>
          
          {/* Duración */}
          <div className="text-xs text-gray-400">
            Duración: {calculateDuration(topic.original_start_time, topic.original_end_time)} horas
          </div>
        </div>

        {/* Toggle para Horario BIS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Settings className="h-4 w-4" />
              <span className="font-medium text-sm">Segundo Horario (BIS)</span>
            </div>
            <Switch
              checked={topic.bis_enabled}
              onCheckedChange={(checked) => handleTopicUpdate({ bis_enabled: checked })}
              className="data-[state=checked]:bg-orange-500"
            />
          </div>

          <AnimatePresence>
            {topic.bis_enabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 border-t border-[#2A2A2A] pt-3"
              >
                {/* Días BIS */}
                <div>
                  <Label className="text-xs text-gray-400 mb-2 block">Días BIS</Label>
                  <div className="grid grid-cols-7 gap-1">
                    {weekDays.map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => handleDayToggle(key, false)}
                        className={`h-7 w-7 rounded text-xs font-medium transition-all ${
                          topic.bis_days.includes(key)
                            ? 'bg-orange-500 text-white'
                            : 'bg-[#1A1A1A] text-gray-400 hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Horas BIS */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="bis_start_time" className="text-xs text-gray-400">Inicio</Label>
                    <Input
                      id="bis_start_time"
                      type="time"
                      value={topic.bis_start_time}
                      onChange={(e) => handleTopicUpdate({ bis_start_time: e.target.value })}
                      className="h-8 text-xs bg-[#1A1A1A] border-[#2A2A2A] text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bis_end_time" className="text-xs text-gray-400">Fin</Label>
                    <Input
                      id="bis_end_time"
                      type="time"
                      value={topic.bis_end_time}
                      onChange={(e) => handleTopicUpdate({ bis_end_time: e.target.value })}
                      className="h-8 text-xs bg-[#1A1A1A] border-[#2A2A2A] text-white"
                    />
                  </div>
                </div>
                
                {/* Duración BIS */}
                <div className="text-xs text-gray-400">
                  Duración BIS: {calculateDuration(topic.bis_start_time, topic.bis_end_time)} horas
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Botón de Agregar - Minimalista */}
        <div className="pt-2 border-t border-[#2A2A2A]">
          <Button
            onClick={() => onTopicChange(topic)}
            className="w-full h-9 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium"
            disabled={!topic.topic_title || topic.original_days.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Tema
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}




