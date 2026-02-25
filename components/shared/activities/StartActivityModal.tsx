'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Flame, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
            className="relative w-full max-w-sm bg-[#121212]/90 backdrop-blur-2xl rounded-[32px] p-8 shadow-[0_40px_100px_rgba(0,0,0,0.9)] border border-white/5 text-white overflow-hidden"
          >
            {/* Subtle glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#FF7939]/10 blur-[60px] pointer-events-none" />

            <button
              onClick={onClose}
              className="absolute right-6 top-6 text-white/20 hover:text-white transition-all bg-white/5 p-2 rounded-full z-10"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center text-center mb-6">
              <div className="mb-4">
                <Flame className="w-10 h-10 text-[#FF7939] stroke-[1.5]" />
              </div>

              <h2 className="text-2xl font-black text-[#FF7939] tracking-tighter mb-1 uppercase">
                OMNIA
              </h2>
              <p className="text-white/30 font-bold text-[10px] uppercase tracking-widest px-8">{activityTitle}</p>
            </div>

            <div className="bg-white/5 rounded-2xl p-5 mb-8 text-center border border-white/5">
              <p className="text-white/40 text-[11px] font-medium leading-relaxed">
                ¡Hoy es el gran día! Iniciamos tu programa con todo.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => { onStartActivity(); onClose(); }}
                className="h-16 bg-[#FF7939] hover:bg-[#E66829] text-white rounded-2xl font-black text-lg shadow-[0_12px_30px_rgba(255,121,57,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                Comenzar ahora
                <Play className="w-5 h-5 fill-white" />
              </Button>
              <button
                onClick={onClose}
                className="py-2 text-white/10 hover:text-white/40 text-[9px] font-black uppercase tracking-[3px] transition-colors"
              >
                Configurar luego
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
