"use client"

import React, { useState } from 'react'
import { CSVImportSimple } from './csv-import-simple'
import { CSVDebug } from './csv-debug'

interface CSVDemoProps {
  activityId?: number
  coachId?: string
}

export function CSVDemo({ activityId = 59, coachId = "b16c4f8c-f47b-4df0-ad2b-13dcbd76263f" }: CSVDemoProps) {
  const [showDemo, setShowDemo] = useState(false)
  const [showDebug, setShowDebug] = useState(false)

  if (!showDemo) {
    return (
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🚀 Nuevo Sistema de Importación CSV
        </h3>
        <p className="text-gray-600 mb-4">
          Sistema configurado para procesar el formato CSV que mostraste. 
          Incluye preview detallado y procesamiento al esquema modular.
        </p>
        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-700">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Parser configurado para el formato exacto que especificaste
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Preview con tabla detallada y estadísticas
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Procesamiento al esquema modular (ejercicios_detalles, organizacion_ejercicios, intensidades)
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Archivo de ejemplo disponible en /public/ejemplo-programa-fuerza-sin-1rm.csv
          </div>
        </div>
        <div className="mt-6 space-x-3">
          <button
            onClick={() => setShowDemo(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Probar Sistema
          </button>
          <button
            onClick={() => setShowDebug(true)}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
          >
            Debug Headers
          </button>
          <a
            href="/ejemplo-programa-fuerza-sin-1rm.csv"
            download
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Descargar Ejemplo CSV
          </a>
        </div>
      </div>
    )
  }

  if (showDebug) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Debug CSV Headers
          </h2>
          <button
            onClick={() => setShowDebug(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ← Volver
          </button>
        </div>
        
        <CSVDebug />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Importación CSV - Esquema Modular
        </h2>
        <button
          onClick={() => setShowDemo(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ← Volver
        </button>
      </div>
      
      <CSVImportSimple 
        activityId={activityId || 59}
        coachId={coachId || 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'}
        onSuccess={() => {
          console.log('CSV procesado exitosamente')
          // Aquí podrías actualizar la UI o mostrar un mensaje de éxito
        }}
      />
    </div>
  )
}
