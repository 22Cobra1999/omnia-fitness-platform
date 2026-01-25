'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star } from 'lucide-react';

interface ActivitySurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (
    activityRating: number,
    coachRating: number,
    feedback: string,
    wouldRepeat: boolean | null,
    omniaRating: number,
    omniaComments: string
  ) => void;
  activityTitle: string;
}

export function ActivitySurveyModal({
  isOpen,
  onClose,
  onComplete,
  activityTitle
}: ActivitySurveyModalProps) {
  const [activityRating, setActivityRating] = useState(0);
  const [coachRating, setCoachRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [wouldRepeat, setWouldRepeat] = useState<boolean | null>(null);
  const [omniaRating, setOmniaRating] = useState(0);
  const [omniaComments, setOmniaComments] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen) return null;

  const handleNextStep = () => {
    // Pasar al paso 2 (Omnia)
    setStep(2);
  };

  const handleBackToStep1 = () => {
    setStep(1);
  };

  const handleSubmit = () => {
    setShowConfirm(true);
  };

  const handleConfirmSubmit = () => {
    onComplete(activityRating, coachRating, feedback, wouldRepeat, omniaRating, omniaComments);
    onClose();
    // Resetear estados al cerrar
    setShowConfirm(false);
    setActivityRating(0);
    setCoachRating(0);
    setFeedback('');
    setWouldRepeat(null);
    setOmniaRating(0);
    setOmniaComments('');
    setStep(1);
  };

  const handleCancelConfirm = () => {
    setShowConfirm(false);
  };

  const handleClose = () => {
    // Resetear estados al cerrar sin confirmar
    setShowConfirm(false);
    setActivityRating(0);
    setCoachRating(0);
    setFeedback('');
    setWouldRepeat(null);
    setOmniaRating(0);
    setOmniaComments('');
    setStep(1);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[30%]"
          style={{
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
          }}
        >
          {!showConfirm ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-sm w-full mx-4 rounded-xl overflow-hidden flex flex-col"
              style={{
                background: 'rgba(15, 16, 18, 0.98)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 12px 48px rgba(0, 0, 0, 0.5)',
                maxHeight: '60vh'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-3.5 border-b border-white/10">
                <h2 className="text-base font-semibold text-white">
                  {step === 1 ? 'Calificar programa' : 'Calificar Omnia'}
                </h2>
                <button
                  onClick={handleClose}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
                {step === 1 ? (
                  <>
                    {/* Calificación de la Actividad */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        ¿Cómo calificarías esta actividad?
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setActivityRating(star)}
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-5 h-5 ${star <= activityRating
                                ? 'text-[#FF7939] fill-[#FF7939]'
                                : 'text-gray-600'
                                }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Calificación del Coach */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        ¿Cómo calificarías al coach?
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setCoachRating(star)}
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-5 h-5 ${star <= coachRating
                                ? 'text-[#FF7939] fill-[#FF7939]'
                                : 'text-gray-600'
                                }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Feedback */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Comentarios sobre la actividad / coach (opcional)
                      </label>
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="¿Qué te pareció la actividad o el coach? ¿Alguna sugerencia?"
                        className="w-full p-3 bg_white/5 border border-white/10 rounded-lg resize-none h-20 text-white placeholder-gray-500 focus:ring-1 focus:ring-[#FF7939]/50 focus:border-[#FF7939]/50 transition-colors"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                        }}
                      />
                    </div>

                    {/* ¿Repetiría la actividad? */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        ¿Repetirías esta actividad?
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setWouldRepeat(true)}
                          className={`flex-1 px-3 py-2 text-xs rounded-lg transition-colors ${wouldRepeat === true
                            ? 'bg-[#FF7939]/30 text-[#FF7939] border border-[#FF7939]/50'
                            : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                            }`}
                        >
                          Sí
                        </button>
                        <button
                          onClick={() => setWouldRepeat(false)}
                          className={`flex-1 px-3 py-2 text-xs rounded-lg transition-colors ${wouldRepeat === false
                            ? 'bg-[#FF7939]/30 text-[#FF7939] border border-[#FF7939]/50'
                            : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                            }`}
                        >
                          No
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Calificación de Omnia */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        ¿Cómo calificarías tu experiencia general con Omnia?
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setOmniaRating(star)}
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-5 h-5 ${star <= omniaRating
                                ? 'text-[#FF7939] fill-[#FF7939]'
                                : 'text-gray-600'
                                }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Comentarios para Omnia */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Comentarios para Omnia (opcional)
                      </label>
                      <textarea
                        value={omniaComments}
                        onChange={(e) => setOmniaComments(e.target.value)}
                        placeholder="¿Qué te gustaría decirle al equipo de Omnia sobre tu experiencia?"
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg resize-none h-20 text-white placeholder-gray-500 focus:ring-1 focus:ring-[#FF7939]/50 focus:border-[#FF7939]/50 transition-colors"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                        }}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 p-3 border-t border-white/10">
                <button
                  onClick={handleClose}
                  className="flex-1 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  Cancelar
                </button>

                {step === 2 && (
                  <button
                    onClick={handleBackToStep1}
                    className="flex-1 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Volver
                  </button>
                )}

                {step === 1 ? (
                  <button
                    onClick={handleNextStep}
                    className="flex-1 px-3 py-2 text-sm bg-[#FF7939]/20 hover:bg-[#FF7939]/30 text-[#FF7939] rounded-lg transition-colors border border-[#FF7939]/30"
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="flex-1 px-3 py-2 text-sm bg-[#FF7939]/20 hover:bg-[#FF7939]/30 text-[#FF7939] rounded-lg transition-colors border border-[#FF7939]/30"
                  >
                    Enviar
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-[320px] w-full mx-4 rounded-xl overflow-hidden flex flex-col"
              style={{
                background: 'rgba(15, 16, 18, 0.98)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 12px 48px rgba(0, 0, 0, 0.5)',
                maxHeight: '70vh'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-3.5 border-b border-white/10">
                <h2 className="text-base font-semibold text-white">
                  Confirmar
                </h2>
                <button
                  onClick={handleClose}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                <p className="text-xs text-gray-300 leading-relaxed">
                  ¿Enviar calificación? No podrás modificarla luego.
                </p>

                {/* Resumen programa + coach */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Calificación de la actividad:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${star <= activityRating
                            ? 'text-[#FF7939] fill-[#FF7939]'
                            : 'text-gray-600'
                            }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Calificación del coach:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${star <= coachRating
                            ? 'text-[#FF7939] fill-[#FF7939]'
                            : 'text-gray-600'
                            }`}
                        />
                      ))}
                    </div>
                  </div>
                  {wouldRepeat !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">¿Repetiría la actividad?</span>
                      <span className="text-xs text-white">{wouldRepeat ? 'Sí' : 'No'}</span>
                    </div>
                  )}
                </div>

                {/* Resumen Omnia */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Calificación de Omnia:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${star <= omniaRating
                            ? 'text-[#FF7939] fill-[#FF7939]'
                            : 'text-gray-600'
                            }`}
                        />
                      ))}
                    </div>
                  </div>
                  {omniaComments.trim().length > 0 && (
                    <div className="mt-1">
                      <span className="block text-xs text-gray-400 mb-1">
                        Comentarios para Omnia:
                      </span>
                      <p className="text-xs text-white line-clamp-3">
                        {omniaComments}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 p-3 border-t border-white/10">
                <button
                  onClick={handleCancelConfirm}
                  className="flex-1 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  Volver
                </button>
                <button
                  onClick={handleConfirmSubmit}
                  className="flex-1 px-3 py-2 text-sm bg-[#FF7939]/20 hover:bg-[#FF7939]/30 text-[#FF7939] rounded-lg transition-colors border border-[#FF7939]/30"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
























