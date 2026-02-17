import React from 'react'
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Upload, Image as ImageIcon, Check, X } from "lucide-react"

interface SourceSelectionModalProps {
    isOpen: boolean
    onClose: () => void
    onSelectExisting: () => void
    handleInlineUploadChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    mediaType: 'image' | 'video' | 'pdf'
}

export const SourceSelectionModal: React.FC<SourceSelectionModalProps> = ({
    isOpen,
    onClose,
    onSelectExisting,
    handleInlineUploadChange,
    mediaType
}) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#0A0A0A] border border-white/10 rounded-lg p-6 max-w-md w-full shadow-2xl mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold text-white mb-4">Seleccionar fuente</h3>
                <p className="text-sm text-gray-400 mb-6">
                    Elegí si querés usar un archivo existente o subir uno nuevo.
                </p>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={onSelectExisting}
                        className="p-4 rounded-lg border border-white/10 bg-black hover:border-[#FF7939]/50 hover:bg-white/5 transition-all text-center group"
                    >
                        <ImageIcon className="h-6 w-6 mb-2 text-[#FF7939] mx-auto group-hover:scale-110 transition-transform" />
                        <div className="text-sm font-semibold text-white">Existentes</div>
                        <div className="text-xs text-gray-400 mt-1">De tu galería</div>
                    </button>

                    <div
                        className="relative p-4 rounded-lg border border-white/10 bg-black hover:border-[#FF7939]/50 hover:bg-white/5 transition-all text-center group overflow-hidden"
                    >
                        <input
                            type="file"
                            accept={mediaType === 'image' ? 'image/*' : 'video/*'}
                            onChange={handleInlineUploadChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <Upload className="h-6 w-6 mb-2 text-[#FF7939] mx-auto group-hover:scale-110 transition-transform" />
                        <div className="text-sm font-semibold text-white">Nuevo</div>
                        <div className="text-xs text-gray-400 mt-1">Subir archivo</div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className="mt-6 w-full px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-white text-sm"
                >
                    Cancelar
                </button>
            </motion.div>
        </div>
    )
}

interface PdfChoiceModalProps {
    isOpen: boolean
    onClose: () => void
    onSelectChoice: (choice: 'existing' | 'new') => void
}

export const PdfChoiceModal: React.FC<PdfChoiceModalProps> = ({
    isOpen,
    onClose,
    onSelectChoice
}) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#0b0b0b] border border-white/10 p-6 rounded-2xl max-w-sm w-full shadow-2xl"
            >
                <h3 className="text-xl font-bold text-white mb-2">Asignar Documento</h3>
                <p className="text-sm text-gray-400 mb-6">
                    Elegí cómo querés agregar el documento PDF.
                </p>
                <div className="grid grid-cols-1 gap-3">
                    <Button
                        onClick={() => onSelectChoice('existing')}
                        className="bg-white/5 border border-white/10 text-white hover:bg-white/10 py-6 h-auto flex flex-col items-center gap-1"
                    >
                        <Check className="h-5 w-5 text-green-500" />
                        <span>Elegir Existente</span>
                        <span className="text-[10px] opacity-50 font-normal">De tu biblioteca de archivos</span>
                    </Button>
                    <Button
                        onClick={() => onSelectChoice('new')}
                        className="bg-[#FF7939]/20 border border-[#FF7939]/30 text-white hover:bg-[#FF7939]/30 py-6 h-auto flex flex-col items-center gap-1"
                    >
                        <Upload className="h-5 w-5 text-[#FF7939]" />
                        <span>Subir Nuevo</span>
                        <span className="text-[10px] opacity-50 font-normal">Desde tu computadora</span>
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-gray-400 mt-2"
                    >
                        Cancelar
                    </Button>
                </div>
            </motion.div>
        </div>
    )
}

interface CloseConfirmationModalProps {
    isOpen: boolean
    onCancel: () => void
    onConfirm: () => void
}

export const CloseConfirmationModal: React.FC<CloseConfirmationModalProps> = ({
    isOpen,
    onCancel,
    onConfirm
}) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#1C1C1E] border border-white/10 rounded-xl p-6 max-w-sm w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-bold text-white mb-2">¿Descartar cambios?</h3>
                <p className="text-sm text-gray-400 mb-6">
                    Tienes cambios sin guardar. Si cierras ahora, se perderán.
                </p>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        className="flex-1 border-white/10 hover:bg-white/5 text-white"
                    >
                        Continuar editando
                    </Button>
                    <Button
                        onClick={onConfirm}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white border-none"
                    >
                        Descartar y cerrar
                    </Button>
                </div>
            </motion.div>
        </div>
    )
}
