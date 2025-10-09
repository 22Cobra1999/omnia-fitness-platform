'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Heart } from 'lucide-react';

interface ActivitySurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (rating: number, feedback: string) => void;
  activityTitle: string;
}

export function ActivitySurveyModal({
  isOpen,
  onClose,
  onComplete,
  activityTitle
}: ActivitySurveyModalProps) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    onComplete(rating, feedback);
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
                ¡Felicitaciones!
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
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <Heart className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">¡Completaste {activityTitle}!</h3>
                  <p className="text-sm text-gray-500">Cuéntanos tu experiencia</p>
                </div>
              </div>
              
              {/* Rating */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ¿Cómo calificarías esta actividad?
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comentarios (opcional)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="¿Qué te pareció la actividad? ¿Tienes alguna sugerencia?"
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Saltar
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
              >
                Enviar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}




















