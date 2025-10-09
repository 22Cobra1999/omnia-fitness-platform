'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Calendar } from 'lucide-react';

interface StartActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityTitle: string;
  onStartActivity: () => void;
}

export function StartActivityModal({
  isOpen,
  onClose,
  activityTitle,
  onStartActivity
}: StartActivityModalProps) {
  if (!isOpen) return null;

  const handleStart = () => {
    onStartActivity();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Empezar Actividad
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                  <Play className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{activityTitle}</h3>
                  <p className="text-sm text-gray-500">¿Estás listo para empezar?</p>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Tu progreso se guardará automáticamente</p>
                    <p>Puedes pausar y continuar en cualquier momento</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleStart}
                className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Empezar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}










