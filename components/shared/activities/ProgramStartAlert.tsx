'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ProgramStartAlertProps {
  isVisible: boolean;
  programDayName: string;
  actualStartDate: Date;
  onStartNow: () => void;
  onStartNextDay: () => void;
  onClose: () => void;
}

const ProgramStartAlert: React.FC<ProgramStartAlertProps> = ({
  isVisible,
  programDayName,
  actualStartDate,
  onStartNow,
  onStartNextDay,
  onClose
}) => {
  if (!isVisible) return null;

  const getDayName = (date: Date) => {
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    return days[date.getDay()];
  };

  const getNextProgramDay = (date: Date) => {
    const dayOrder = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const currentDayIndex = date.getDay();
    const programDayIndex = dayOrder.indexOf(programDayName);
    
    let daysUntilProgramDay = (programDayIndex - currentDayIndex + 7) % 7;
    if (daysUntilProgramDay === 0) daysUntilProgramDay = 7;
    
    const nextProgramDay = new Date(date);
    nextProgramDay.setDate(date.getDate() + daysUntilProgramDay);
    return nextProgramDay;
  };

  const actualDayName = getDayName(actualStartDate);
  const nextProgramDay = getNextProgramDay(actualStartDate);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-orange-500"
      >
        <div className="text-center">
          <h3 className="text-xl font-bold text-white mb-4">
            🚀 Inicio del Programa
          </h3>
          
          <div className="space-y-4 text-gray-300">
            <p>
              Tu programa está diseñado para <span className="text-orange-500 font-semibold">{programDayName}</span>
            </p>
            
            <p>
              Pero hoy es <span className="text-orange-500 font-semibold">{actualDayName}</span>
            </p>
            
            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
              <p className="text-sm text-gray-400">
                Tienes dos opciones:
              </p>
              
              <button
                onClick={onStartNow}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
              >
                🏃‍♂️ Empezar Ahora
                <div className="text-xs text-orange-200 mt-1">
                  Comenzar desde {programDayName} (perderás días anteriores)
                </div>
              </button>
              
              <button
                onClick={onStartNextDay}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
              >
                ⏰ Esperar al Próximo {programDayName}
                <div className="text-xs text-gray-300 mt-1">
                  {nextProgramDay.toLocaleDateString('es-ES')} - Programa completo
                </div>
              </button>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="mt-4 text-gray-400 hover:text-white text-sm underline"
          >
            Decidir más tarde
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProgramStartAlert;
