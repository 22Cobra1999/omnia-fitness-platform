"use client"

import React, { useState } from 'react'
import { WorkshopTopicManager } from './workshop-topic-manager'

interface WorkshopFormData {
  title: string
  description: string
  workshop_type: 'presencial' | 'virtual' | 'hibrido'
  session_type: 'individual' | 'group'
  available_slots: number
  price: number
  topics: any[]
  sessions: any[]
}

export function WorkshopFormIntegrationExample() {
  const [formData, setFormData] = useState<WorkshopFormData>({
    title: '',
    description: '',
    workshop_type: 'presencial',
    session_type: 'group',
    available_slots: 20,
    price: 0,
    topics: [],
    sessions: []
  })

  const handleTopicsChange = (topics: any[]) => {
    setFormData(prev => ({ ...prev, topics }))
  }

  const handleSessionsChange = (sessions: any[]) => {
    setFormData(prev => ({ ...prev, sessions }))
  }

  const handleSubmit = () => {
    // Aquí enviarías los datos al API
    console.log('Datos del taller:', {
      ...formData,
      type: 'workshop',
      workshop_schedule_blocks: formData.topics
    })
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      
      {/* Información Básica del Taller */}
      <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg p-4 space-y-4">
        <h2 className="text-white font-semibold text-lg">Información Básica</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-white text-sm mb-2 block">Título del Taller</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ej: Curso de Yoga Integral"
              className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-white placeholder:text-gray-500"
            />
          </div>
          
          <div>
            <label className="text-white text-sm mb-2 block">Tipo de Taller</label>
            <select
              value={formData.workshop_type}
              onChange={(e) => setFormData(prev => ({ ...prev, workshop_type: e.target.value as any }))}
              className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-white"
            >
              <option value="presencial">Presencial</option>
              <option value="virtual">Virtual</option>
              <option value="hibrido">Híbrido</option>
            </select>
          </div>
          
          <div>
            <label className="text-white text-sm mb-2 block">Tipo de Sesión</label>
            <select
              value={formData.session_type}
              onChange={(e) => setFormData(prev => ({ ...prev, session_type: e.target.value as any }))}
              className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-white"
            >
              <option value="individual">Individual</option>
              <option value="group">Grupal</option>
            </select>
          </div>
          
          <div>
            <label className="text-white text-sm mb-2 block">Cupos por Sesión</label>
            <input
              type="number"
              value={formData.available_slots}
              onChange={(e) => setFormData(prev => ({ ...prev, available_slots: parseInt(e.target.value) }))}
              min="1"
              className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-white"
            />
          </div>
        </div>
        
        <div>
          <label className="text-white text-sm mb-2 block">Descripción</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe el taller..."
            className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-white placeholder:text-gray-500 h-20 resize-none"
          />
        </div>
      </div>

      {/* Gestor de Temas y Horarios */}
      <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg p-4">
        <h2 className="text-white font-semibold text-lg mb-4">Temas y Horarios</h2>
        <WorkshopTopicManager
          onTopicsChange={handleTopicsChange}
          onSessionsChange={handleSessionsChange}
        />
      </div>

      {/* Botón de Guardar */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!formData.title || formData.topics.length === 0}
          className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
        >
          Crear Taller
        </button>
      </div>
    </div>
  )
}



