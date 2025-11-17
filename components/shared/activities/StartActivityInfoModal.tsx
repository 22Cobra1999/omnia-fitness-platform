'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Flame } from 'lucide-react';

interface StartActivityInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartToday: () => void;
  onStartOnFirstDay: () => void;
  activityTitle: string;
  firstDay: string;
  currentDay: string;
}

export function StartActivityInfoModal({
  isOpen,
  onClose,
  onStartOnFirstDay,
  activityTitle,
  firstDay,
  currentDay
}: StartActivityInfoModalProps) {
  if (!isOpen) return null;

  // Calcular mensaje de inicio
  const getStartMessage = (): string => {
    const daysMap: Record<string, number> = {
      'domingo': 0, 'lunes': 1, 'martes': 2, 'miercoles': 3,
      'jueves': 4, 'viernes': 5, 'sabado': 6
    };
    
    const currentDayIndex = daysMap[currentDay] ?? 6;
    const firstDayIndex = daysMap[firstDay] ?? 1;
    
    if (currentDayIndex === firstDayIndex) {
      return `Tu programa comienza hoy (${currentDay})`;
    } else {
      return `Tu programa comienza el próximo ${firstDay}`;
    }
  };

  const handleStart = () => {
    onStartOnFirstDay();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative bg-gradient-to-b from-gray-900 to-black border border-gray-800/50 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden"
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF7939]/10 via-transparent to-transparent pointer-events-none" />
            
            {/* Header */}
            <div className="relative p-6 pb-4">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-gray-800/50 rounded-full transition-all"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
              
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#FF7939] to-[#FF7939]/70 rounded-3xl flex items-center justify-center shadow-lg shadow-[#FF7939]/30 mb-4">
                  <Flame className="w-8 h-8 text-white" />
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-2">
                  ¡Estás listo!
                </h2>
                
                <p className="text-sm text-gray-400 max-w-xs">
                  {activityTitle}
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="relative px-6 pb-6 space-y-6">
              {/* Info Card */}
              <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-5 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#FF7939]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-[#FF7939]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-base mb-2">
                      {getStartMessage()}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      Generaremos tu calendario completo de ejercicios basado en la planificación del programa
                    </p>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStart}
                  className="w-full px-6 py-4 bg-gradient-to-r from-[#FF7939] to-[#FF7939]/90 text-white rounded-2xl text-base font-bold transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#FF7939]/30 hover:shadow-xl hover:shadow-[#FF7939]/40"
                >
                  <Flame className="w-5 h-5" />
                  Comenzar Actividad
                </motion.button>
                
                <button
                  onClick={onClose}
                  className="w-full py-3 text-sm text-gray-400 hover:text-gray-300 transition-colors"
                >
                  Ahora no
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
