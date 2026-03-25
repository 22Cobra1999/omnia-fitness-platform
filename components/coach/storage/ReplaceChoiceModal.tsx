import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Grid, AlertTriangle } from 'lucide-react'
import { StorageFile } from '../hooks/storage/useStorageLogic'

interface ReplaceChoiceModalProps {
    show: boolean
    file: StorageFile | null
    onClose: () => void
    onSelectSource: (source: 'upload' | 'gallery') => void
}

export function ReplaceChoiceModal({ show, file, onClose, onSelectSource }: ReplaceChoiceModalProps) {
    if (!show || !file) return null

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-4" onClick={onClose}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-[#1A1A1A] w-full max-w-sm rounded-[2.5rem] p-8 border border-white/5 relative shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Fondo con brillo */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#FF7939]/10 blur-[80px] rounded-full" />
                
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-3xl bg-[#FF7939]/10 flex items-center justify-center mb-6 border border-[#FF7939]/20 shadow-inner">
                        <AlertTriangle className="w-8 h-8 text-[#FF7939]" />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 text-center tracking-tight">Reemplazar archivo</h3>
                    <p className="text-[#FF7939] text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-center">Precaución</p>
                    
                    <div className="bg-white/5 rounded-2xl p-4 mb-8 border border-white/5 w-full">
                        <p className="text-white/70 text-xs leading-relaxed text-center">
                            Al cambiar este archivo por otro, el cambio se aplicará a <span className="text-white font-bold">todos los productos asociados</span> automáticamente.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full">
                        <button
                            onClick={() => onSelectSource('upload')}
                            className="flex flex-col items-center justify-center gap-3 p-5 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#FF7939]/30 transition-all group"
                        >
                            <div className="w-10 h-10 rounded-2xl bg-[#FF7939]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Upload className="w-5 h-5 text-[#FF7939]" />
                            </div>
                            <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest text-center">Subir Nuevo</span>
                        </button>

                        <button
                            onClick={() => onSelectSource('gallery')}
                            className="flex flex-col items-center justify-center gap-3 p-5 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#FF7939]/30 transition-all group"
                        >
                            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Grid className="w-5 h-5 text-white/70" />
                            </div>
                            <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest text-center">De Galería</span>
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        className="mt-8 text-white/20 hover:text-white/40 text-[10px] font-black uppercase tracking-[0.3em] transition-colors"
                    >
                        Cancelar
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-white/10 hover:text-white/30 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </motion.div>
        </div>
    )
}
