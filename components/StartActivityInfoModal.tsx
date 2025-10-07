'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, AlertCircle } from 'lucide-react';

interface StartActivityInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartToday: () => void;
  onStartOnFirstDay: () => void;
  activityTitle: string;
  firstDay: string; // ej: "lunes"
  currentDay: string; // ej: "viernes"
}

export function StartActivityInfoModal({
  isOpen,
  onClose,
  onStartToday,
  onStartOnFirstDay,
  activityTitle,
  firstDay,
  currentDay
}: StartActivityInfoModalProps) {
  const [selectedOption, setSelectedOption] = useState<'today' | 'firstDay' | null>(null);

  if (!isOpen) return null;

  // Función para obtener el próximo día de la semana
  const getNextDay = (targetDay: string): string => {
    const days = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    const currentIndex = days.indexOf(currentDay);
    const targetIndex = days.indexOf(targetDay);
    
    if (targetIndex > currentIndex) {
      return `${targetDay} próximo`;
    } else {
      // Si ya pasó este día, es para la siguiente semana
      return `${targetDay} de la próxima semana`;
    }
  };

  const nextFirstDay = getNextDay(firstDay);
  const isWeekendGap = currentDay === 'viernes' && firstDay === 'lunes';

  const handleConfirm = () => {
    if (selectedOption === 'today') {
      onStartToday();
    } else if (selectedOption === 'firstDay') {
      onStartOnFirstDay();
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-black border border-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-light text-white">
                {activityTitle}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="mb-6">
              {/* Información del primer día */}
              <div className="flex items-start mb-6">
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center mr-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white text-sm">Programada para comenzar</h3>
                  <p className="text-xs text-gray-400">
                    Los <span className="text-white">{firstDay}s</span>
                  </p>
                </div>
              </div>

              {/* Opciones */}
              <div className="space-y-3">
                {/* Opción 1: Empezar el primer día */}
                <div 
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedOption === 'firstDay' 
                      ? 'border-gray-600 bg-gray-900/50' 
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedOption('firstDay')}
                >
                  <div className="flex items-start">
                    <div className={`w-3 h-3 rounded-full border mt-1 mr-3 ${
                      selectedOption === 'firstDay' 
                        ? 'border-gray-400 bg-gray-400' 
                        : 'border-gray-600'
                    }`}>
                      {selectedOption === 'firstDay' && (
                        <div className="w-full h-full rounded-full bg-black scale-50"></div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-white text-sm">Esperar al {nextFirstDay}</h4>
                      <p className="text-xs text-gray-400">
                        Programa completo desde el primer día
                      </p>
                    </div>
                  </div>
                </div>

                {/* Opción 2: Empezar hoy */}
                <div 
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedOption === 'today' 
                      ? 'border-gray-600 bg-gray-900/50' 
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedOption('today')}
                >
                  <div className="flex items-start">
                    <div className={`w-3 h-3 rounded-full border mt-1 mr-3 ${
                      selectedOption === 'today' 
                        ? 'border-gray-400 bg-gray-400' 
                        : 'border-gray-600'
                    }`}>
                      {selectedOption === 'today' && (
                        <div className="w-full h-full rounded-full bg-black scale-50"></div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-white text-sm">Empezar hoy ({currentDay})</h4>
                      <p className="text-xs text-gray-400">
                        Iniciar inmediatamente con ejercicios disponibles
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Advertencia si es fin de semana */}
              {isWeekendGap && selectedOption === 'today' && (
                <div className="mt-4 p-3 bg-gray-800/50 border border-gray-600 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-xs text-gray-300">
                      <p className="font-medium mb-1">Advertencia</p>
                      <p>
                        Perderás la primera semana de ejercicios programados para el {firstDay}.
                        Considera esperar hasta el {nextFirstDay}.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-400 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-light transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedOption}
                className="flex-1 px-4 py-2 bg-white hover:bg-gray-100 disabled:bg-gray-800 disabled:cursor-not-allowed text-black rounded-lg text-sm font-light transition-colors flex items-center justify-center gap-2"
              >
                <Clock className="w-3 h-3" />
                {selectedOption === 'today' ? 'Empezar Hoy' : 'Programar Inicio'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
