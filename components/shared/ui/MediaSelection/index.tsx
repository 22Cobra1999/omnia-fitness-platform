"use client"

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, X, ImageIcon, Video, FileText, FileImage } from 'lucide-react'
import { motion } from 'framer-motion'
import { MediaGallery } from './components/MediaGallery'
import { useMediaSelectionLogic } from './hooks/useMediaSelectionLogic'
import { MediaSelectionModalProps } from './types'

export function MediaSelectionModal({
    isOpen,
    onClose,
    onMediaSelected,
    mediaType,
    className
}: MediaSelectionModalProps) {
    const {
        media,
        loading,
        error,
        setError,
        selectedMedia,
        setSelectedMedia,
        newMediaFile,
        uploading,
        setIsPreviewPlaying,
        setPreviewImage,
        sourceFilter,
        setSourceFilter,
        handleFileChange,
        handleConfirm
    } = useMediaSelectionLogic(isOpen, mediaType, onMediaSelected, onClose)

    const getMediaTypeLabel = (type: string) => {
        if (type === 'image') return 'Imagen'
        if (type === 'video') return 'Video'
        return 'Documento'
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={`max-w-2xl max-h-[70vh] bg-[#0A0A0A] border-[#1A1A1A] overflow-hidden flex flex-col ${className || ''}`}>
                <DialogHeader>
                    <DialogTitle className="text-white text-xl font-semibold">
                        Seleccionar {getMediaTypeLabel(mediaType)} de Portada
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Galería para seleccionar media existente o subir nuevo contenido.
                    </DialogDescription>
                    <p className="text-gray-400 text-sm mt-2">
                        Selecciona solo una {getMediaTypeLabel(mediaType).toLowerCase()} para usar como portada de tu producto
                    </p>

                    {mediaType === 'video' && (
                        <div className="mt-3 flex items-center justify-center gap-2">
                            {(['cover', 'catalog', 'all'] as const).map((f) => (
                                <button
                                    key={f}
                                    type="button"
                                    onClick={() => setSourceFilter(f)}
                                    className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${sourceFilter === f
                                        ? 'border-[#FF7939] bg-[#FF7939]/10 text-white'
                                        : 'border-white/10 bg-black text-gray-300 hover:border-[#FF7939]/50'
                                        }`}
                                >
                                    {f === 'cover' ? 'Portada' : f === 'catalog' ? 'Ejercicios / Platos' : 'Todo'}
                                </button>
                            ))}
                        </div>
                    )}
                </DialogHeader>

                <div className="space-y-4 flex flex-col h-full">
                    {uploading || loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-[#FF7939]" />
                            <span className="ml-2 text-white">{uploading ? 'Subiendo...' : 'Cargando...'}</span>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center gap-4 flex-1 py-6">
                            <div className="text-red-400 text-center">
                                <X className="h-8 w-8 mx-auto mb-2" />
                                <p>{error}</p>
                            </div>
                            <Button variant="outline" onClick={() => { setError(null); document.getElementById(`media-upload-${mediaType}`)?.click(); }}>
                                Intentar otro archivo
                            </Button>
                        </div>
                    ) : media.length === 0 ? (
                        <div className="flex flex-col gap-4 flex-1 items-center justify-center py-8">
                            <FileImage className="h-8 w-8 text-gray-500 mx-auto" />
                            <p className="text-gray-400">No hay {getMediaTypeLabel(mediaType).toLowerCase()}s disponibles</p>
                            <div className="relative bg-[#FF7939]/20 text-[#FF7939] border border-[#FF7939]/30 rounded-full w-10 h-10 flex items-center justify-center hover:bg-[#FF7939]/30">
                                <input
                                    type="file"
                                    accept={mediaType === 'image' ? 'image/*' : mediaType === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'application/pdf'}
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <Plus className="h-5 w-5" />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4 flex-1 min-h-0">
                            <MediaGallery
                                media={media}
                                mediaType={mediaType}
                                selectedMediaId={selectedMedia}
                                onSelect={setSelectedMedia}
                                setIsPreviewPlaying={setIsPreviewPlaying}
                                setPreviewImage={setPreviewImage}
                                sourceFilter={sourceFilter}
                            />

                            <div className="flex items-center justify-center gap-3 py-2">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => document.getElementById(`media-upload-${mediaType}`)?.click()}
                                    className="bg-[#FF7939]/20 text-[#FF7939] border border-[#FF7939]/30 rounded-full w-8 h-8 flex items-center justify-center hover:bg-[#FF7939]/30"
                                >
                                    <Plus className="h-4 w-4" />
                                </motion.button>

                                {(selectedMedia || newMediaFile) && (
                                    <Button
                                        onClick={handleConfirm}
                                        className="bg-[#FF7939]/30 text-[#FF7939] border border-[#FF7939]/40 rounded-full px-6 hover:bg-[#FF7939]/40"
                                    >
                                        Guardar
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    <input
                        type="file"
                        accept={mediaType === 'image' ? 'image/*' : mediaType === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'application/pdf'}
                        onChange={handleFileChange}
                        className="hidden"
                        id={`media-upload-${mediaType}`}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
