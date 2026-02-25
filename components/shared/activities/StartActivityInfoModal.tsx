'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Flame, Play, Clock, Check, ArrowRight } from 'lucide-react';

interface StartActivityInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartToday: () => void;
  onStartOnFirstDay: () => void;
  activityTitle: string;
  firstDay: string;
  currentDay: string;
  startDeadline?: string;
}

export function StartActivityInfoModal({
  isOpen,
  onClose,
  onStartToday,
  onStartOnFirstDay,
  activityTitle,
  firstDay = 'lunes',
  currentDay,
  startDeadline
}: StartActivityInfoModalProps) {
  if (!isOpen) return null;

  // Calculate next preferred start day (e.g., next Monday)
  const today = new Date();

  // Day map for calculation (normalized)
  const getDayNum = (dayName: string) => {
    const normalized = (dayName || 'lunes').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (normalized.includes('dom')) return 0;
    if (normalized.includes('lun')) return 1;
    if (normalized.includes('mar')) return 2;
    if (normalized.includes('mie')) return 3;
    if (normalized.includes('jue')) return 4;
    if (normalized.includes('vie')) return 5;
    if (normalized.includes('sab')) return 6;
    return 1; // Default Monday
  };

  const targetDayNum = getDayNum(firstDay);
  const daysUntilNext = (targetDayNum - today.getDay() + 7) % 7 || 7;
  const nextTargetDate = new Date(today);
  nextTargetDate.setDate(today.getDate() + daysUntilNext);

  const formattedNextTarget = nextTargetDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

  // Check if waiting for next target exceeds deadline
  const isExceedingDeadline = startDeadline ? nextTargetDate.toISOString().split('T')[0] > startDeadline : false;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative bg-[#121212]/90 backdrop-blur-2xl border border-white/5 rounded-[32px] max-w-sm w-full shadow-[0_40px_100px_rgba(0,0,0,0.9)] overflow-hidden"
          >
            {/* Subtle glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#FF7939]/10 blur-[60px] pointer-events-none" />

            <div className="p-8">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-all"
              >
                <X className="w-4 h-4 text-white/20 hover:text-white" />
              </button>

              <div className="flex flex-col items-center text-center mb-6">
                <div className="mb-4">
                  <Flame className="w-10 h-10 text-[#FF7939] stroke-[1.5]" />
                </div>

                <h2 className="text-2xl font-black text-[#FF7939] tracking-tighter mb-1 uppercase">
                  OMNIA
                </h2>

                <p className="text-white/30 font-bold text-[10px] uppercase tracking-widest px-8">
                  {activityTitle}
                </p>
              </div>

              <div className="bg-white/5 rounded-2xl p-5 mb-8 text-center border border-white/5">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">
                  Días de inicio
                </p>
                <p className="text-white text-sm font-black uppercase tracking-tighter">
                  Esta actividad empieza los <span className="text-[#FF7939]">
                    {firstDay.toLowerCase().endsWith('s') ? firstDay.toLowerCase() : `${firstDay.toLowerCase()}s`}
                  </span>
                </p>
              </div>

              <div className="space-y-3">
                {/* Opción 1: Empezar hoy */}
                <button
                  onClick={onStartToday}
                  className="w-full h-16 px-5 bg-white/5 border border-white/5 hover:border-[#FF7939]/30 hover:bg-[#FF7939]/5 rounded-2xl transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-[#FF7939]/20 transition-all">
                      <Play className="w-5 h-5 text-white group-hover:text-[#FF7939]" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-white text-sm group-hover:text-[#FF7939] transition-colors">
                        Comenzar hoy: <span className="capitalize">{currentDay}</span>
                      </div>
                      <div className="text-[9px] uppercase tracking-wider font-black text-white/20">Empezar ahora mismo</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/10 group-hover:text-[#FF7939] group-hover:translate-x-1 transition-all" />
                </button>

                {/* Opción 2: Esperar si no excede el deadline */}
                {!isExceedingDeadline ? (
                  <button
                    onClick={onStartOnFirstDay}
                    className="w-full h-16 px-5 bg-[#FF7939] hover:bg-[#E66829] rounded-2xl transition-all flex items-center justify-between shadow-[0_10px_30px_rgba(255,121,57,0.2)] active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-black/10 rounded-xl flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-white text-sm">Esperar al próximo {firstDay}</div>
                        <div className="text-[9px] uppercase tracking-wider font-black text-white/50">
                          {formattedNextTarget} &bull; Ciclo Completo
                        </div>
                      </div>
                    </div>
                    <Check className="w-4 h-4 text-white/50" />
                  </button>
                ) : (
                  <div className="py-3 px-4 bg-red-500/5 border border-red-500/10 rounded-2xl text-center">
                    <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">
                      Límite de acceso: {startDeadline ? new Date(startDeadline).toLocaleDateString('es-ES') : ''}
                    </p>
                    <p className="text-[9px] text-white/20 mt-1">Debes comenzar hoy para no perder días</p>
                  </div>
                )}

                <button
                  onClick={onClose}
                  className="w-full pt-4 text-white/10 hover:text-white/40 text-[9px] font-black uppercase tracking-[3px] transition-colors"
                >
                  Configurar luego
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
