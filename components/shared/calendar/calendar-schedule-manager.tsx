"use client"

import React from 'react'

interface Exercise {
  id: string
  name: string
  type: string
}

interface CalendarScheduleManagerProps {
  exercises: Exercise[]
  onScheduleChange?: (blocks: any[]) => void
  initialSchedule?: any[]
}

export default function CalendarScheduleManager({ 
  exercises, 
  onScheduleChange, 
  initialSchedule = [] 
}: CalendarScheduleManagerProps) {
  
  return (
    <div className="space-y-6">
      <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl p-6">
        <h3 className="text-white text-lg font-semibold mb-4">
          Planificación de Ejercicios
        </h3>
        <p className="text-gray-400 text-sm">
          Ejercicios disponibles: {exercises.length}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {exercises.map((exercise, index) => (
            <div 
              key={exercise.id || index}
              className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-3"
            >
              <p className="text-white text-sm font-medium">{exercise.name}</p>
              <p className="text-gray-500 text-xs">{exercise.type}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}