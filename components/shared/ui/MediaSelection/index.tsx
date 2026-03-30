"use client"

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, X, ImageIcon, Video, FileText, FileImage, ChevronLeft, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { MediaGallery } from './components/MediaGallery'
import { useMediaSelectionLogic } from './hooks/useMediaSelectionLogic'
import { MediaSelectionModalProps } from './types'

export function MediaSelectionModal({
    isOpen,
    onClose,
    onMediaSelected,
    mediaType,
    className,
    exerciseId,
    activityId,
    mediaId,
    onBackgroundVideoUpload
}: MediaSelectionModalProps) {
    const {
        media,
        loading,
        error,
        setError,
        selectedMedia,
        setSelectedMedia,
        newMediaFile,
        setNewMediaFile,
        uploading,
        previewImage,
        setPreviewImage,
        setIsPreviewPlaying,
        sourceFilter,
        setSourceFilter,
        handleFileChange,
        handleConfirm
    } = useMediaSelectionLogic(isOpen, mediaType, onMediaSelected, onClose, exerciseId, activityId, mediaId, onBackgroundVideoUpload)
    const [viewMode, setViewMode] = React.useState<'choice' | 'gallery' | 'preview'>('choice')

    React.useEffect(() => {
        if (isOpen) setViewMode('choice')
    }, [isOpen])

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        // Just delegate to hook — preview is shown locally, upload on confirm
        await handleFileChange(e)
        setViewMode('preview')
    }

    const getMediaTypeLabel = (type: string) => {
        if (type === 'image') return 'Imagen'
        if (type === 'video') return 'Video'
        return 'Documento'
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent 
                className={`!bg-[#0A0A0A]/95 !backdrop-blur-3xl !border-white/10 !p-0 !overflow-hidden !shadow-2xl !transition-all !duration-300 ${
                    viewMode === 'choice' || viewMode === 'preview'
                        ? '!w-[90vw] !max-w-sm !rounded-3xl' 
                        : '!w-[95vw] !max-w-6xl !h-[90vh] !max-h-[85vh] !rounded-3xl'
                } ${className || ''}`}
            >
                <div className="sr-only">
                    <DialogTitle>Asignar {getMediaTypeLabel(mediaType)}</DialogTitle>
                    <DialogDescription>
                        Selecciona o sube un nuevo archivo de {getMediaTypeLabel(mediaType).toLowerCase()}.
                    </DialogDescription>
                </div>

                {viewMode === 'choice' ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-8 flex flex-col gap-6"
                    >
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-white mb-2">Asignar {getMediaTypeLabel(mediaType)}</h3>
                            <p className="text-zinc-500 text-xs text-pretty">Carga un archivo nuevo o elige uno de tu galería</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => document.getElementById(`media-upload-${mediaType}`)?.click()}
                                className="flex flex-col items-center justify-center gap-3 p-6 bg-white/5 hover:bg-[#FF7939]/10 border border-white/10 hover:border-[#FF7939]/30 rounded-2xl transition-all group"
                            >
                                <div className="bg-[#FF7939] p-3 rounded-full shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
                                    <Plus className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xs font-bold text-white uppercase tracking-wider">Nuevo</span>
                            </button>

                            <button
                                onClick={() => setViewMode('gallery')}
                                className="flex flex-col items-center justify-center gap-3 p-6 bg-white/5 hover:bg-blue-500/10 border border-white/10 hover:border-blue-500/30 rounded-2xl transition-all group"
                            >
                                <div className="bg-blue-500 p-3 rounded-full shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                    <ImageIcon className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xs font-bold text-white uppercase tracking-wider">Galería</span>
                            </button>
                        </div>

                        <Button 
                            variant="ghost" 
                            onClick={onClose}
                            className="text-zinc-500 hover:text-white"
                        >
                            Cancelar
                        </Button>
                    </motion.div>
                ) : viewMode === 'preview' ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-8 flex flex-col gap-6"
                    >
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-white mb-2">Confirmar {getMediaTypeLabel(mediaType)}</h3>
                            <p className="text-zinc-500 text-xs text-pretty">Vista previa del archivo seleccionado antes de subir</p>
                        </div>

                        <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black group">
                            {mediaType === 'video' ? (
                                <video 
                                    src={previewImage?.video_url} 
                                    className="w-full h-full object-contain"
                                    controls
                                    autoPlay
                                    muted
                                />
                            ) : (
                                <img 
                                    src={previewImage?.image_url} 
                                    className="w-full h-full object-contain"
                                    alt="Preview"
                                />
                            )}
                            
                            <button 
                                onClick={() => {
                                    setSelectedMedia(null)
                                    setNewMediaFile(null)
                                    setPreviewImage(null)
                                    setViewMode('choice')
                                }}
                                className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-red-500 transition-colors shadow-xl"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={handleConfirm}
                                disabled={uploading}
                                className="w-full h-12 bg-[#FF7939] hover:bg-[#FF7939]/90 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-orange-500/20 disabled:opacity-50"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Subiendo...
                                    </>
                                ) : (
                                    'Confirmar y Subir'
                                )}
                            </Button>
                            
                            <Button 
                                variant="ghost" 
                                onClick={() => {
                                    setSelectedMedia(null)
                                    setNewMediaFile(null)
                                    setPreviewImage(null)
                                    setViewMode('choice')
                                }}
                                className="text-zinc-500 hover:text-white"
                            >
                                Elegir otro
                            </Button>
                        </div>
                    </motion.div>
                ) : (
                    <div className="flex flex-col h-full overflow-hidden">
                        <DialogHeader className="p-8 pb-0 pr-16 lg:pr-8 relative">
                            <button 
                                onClick={() => setViewMode('choice')}
                                className="absolute left-6 top-8 p-2 text-zinc-500 hover:text-white transition-colors z-10"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <DialogTitle className="text-white text-3xl font-black tracking-tight text-center">
                                Galería de {getMediaTypeLabel(mediaType)}s
                            </DialogTitle>
                            
                            {mediaType === 'video' && (
                                <div className="mt-6 flex items-center justify-center gap-2">
                                    {(['cover', 'catalog', 'all'] as const).map((f) => (
                                        <button
                                            key={f}
                                            type="button"
                                            onClick={() => setSourceFilter(f)}
                                            className={`px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wider transition-all ${sourceFilter === f
                                                ? 'border-[#FF7939] bg-[#FF7939] text-white'
                                                : 'border-white/10 bg-white/5 text-zinc-500 hover:text-zinc-300'
                                                }`}
                                        >
                                            {f === 'cover' ? 'Portadas' : f === 'catalog' ? 'Biblioteca' : 'Todo'}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </DialogHeader>

                        <div className="flex flex-col flex-1 min-h-0 mt-8 px-6">
                            {uploading || loading ? (
                                <div className="flex items-center justify-center py-20 flex-1">
                                    <div className="text-center">
                                        <Loader2 className="h-10 w-10 animate-spin text-[#FF7939] mx-auto mb-4" />
                                        <span className="text-white font-bold tracking-tight">{uploading ? 'Subiendo...' : 'Cargando Galería...'}</span>
                                    </div>
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center justify-center gap-6 flex-1 py-10">
                                    <div className="text-red-400 text-center">
                                        <div className="bg-red-500/10 p-4 rounded-full w-fit mx-auto mb-4">
                                            <X className="h-10 w-10" />
                                        </div>
                                        <p className="font-bold">{error}</p>
                                    </div>
                                    <Button className="bg-white/10 hover:bg-white/20 text-white rounded-full px-8" onClick={() => { setError(null); setViewMode('choice'); }}>
                                        Volver a intentar
                                    </Button>
                                </div>
                            ) : media.length === 0 ? (
                                <div className="flex flex-col gap-6 flex-1 items-center justify-center py-20">
                                    <div className="bg-white/5 p-6 rounded-full grayscale opacity-50">
                                        <FileImage className="h-12 w-12 text-zinc-500" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-zinc-400 font-bold mb-1">Sin archivos disponibles</p>
                                        <p className="text-zinc-600 text-xs">Aún no has subido ningún {getMediaTypeLabel(mediaType).toLowerCase()}</p>
                                    </div>
                                    <Button 
                                        className="bg-[#FF7939] hover:bg-[#FF7939]/90 text-white rounded-full px-8 font-black uppercase tracking-widest"
                                        onClick={() => document.getElementById(`media-upload-${mediaType}`)?.click()}
                                    >
                                        Subir el Primero
                                    </Button>
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

                                    <div className="flex items-center justify-center gap-4 py-8 border-t border-white/5 bg-[#0A0A0A]/80 backdrop-blur-xl -mx-6 px-6 mt-auto">
                                        <Button
                                            onClick={handleConfirm}
                                            disabled={(!selectedMedia && !newMediaFile) || uploading}
                                            className={`rounded-full px-12 h-12 font-black uppercase tracking-widest transition-all ${(selectedMedia || newMediaFile) && !uploading
                                                    ? 'bg-[#FF7939] text-white hover:bg-[#FF7939]/90 shadow-xl shadow-orange-500/20'
                                                    : 'bg-white/5 text-zinc-700 border border-white/5'
                                                }`}
                                        >
                                            {uploading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Subiendo...
                                                </>
                                            ) : (
                                                'Confirmar Selección'
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                <input
                    type="file"
                    accept={mediaType === 'image' ? 'image/*' : mediaType === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'application/pdf'}
                    onChange={onFileChange}
                    className="hidden"
                    id={`media-upload-${mediaType}`}
                />
            </DialogContent>
        </Dialog>
    )
}
