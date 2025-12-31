"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Video, Check, X, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { UniversalVideoPlayer } from '@/components/shared/video/universal-video-player'

export type VideoSelectionResult = {
  videoUrl: string
  fileName?: string
  videoFile?: File | null
  existingMediaId?: string | null
  bunnyVideoId?: string | null
  bunnyLibraryId?: number | null
  thumbnailUrl?: string | null
}

interface VideoSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onVideoSelected: (selection: VideoSelectionResult | null) => void
  selectedRowsCount: number
}

interface CoachVideo {
  id: string
  activity_id: number
  video_url: string
  activity_title: string
  created_at: string
  filename: string
  bunny_video_id: string | null
  bunny_library_id: number | null
  video_thumbnail_url: string | null
  video_file_name: string | null
}

export function VideoSelectionModal({
  isOpen,
  onClose,
  onVideoSelected,
  selectedRowsCount
}: VideoSelectionModalProps) {
  const [videos, setVideos] = useState<CoachVideo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null)
  const [newVideoPreviewUrl, setNewVideoPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  // Renombrado se gestiona desde el perfil del coach (UI removido aquí)

  // Cargar videos del coach
  useEffect(() => {
    if (isOpen) {
      loadCoachVideos()
      return
    }
    // Al cerrar, limpiar selección temporal y previsualización
    setNewVideoFile(null)
    if (newVideoPreviewUrl) {
      URL.revokeObjectURL(newVideoPreviewUrl)
    }
    setNewVideoPreviewUrl(null)
  }, [isOpen])

  const loadCoachVideos = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('🔄 VideoSelectionModal: Cargando videos del coach...')
      const response = await fetch('/api/coach-media?all=true')
      const data = await response.json()
      
      console.log('📥 VideoSelectionModal: Respuesta del servidor:', {
        status: response.status,
        ok: response.ok,
        total: data.total,
        mediaCount: data.media?.length || 0,
        error: data.error,
        details: data.details,
        debug: data.debug,
        firstVideo: data.media?.[0],
        allData: data // Para ver toda la respuesta completa
      })
      
      if (response.ok) {
        // Filtrar videos válidos: deben tener video_url o bunny_video_id
        const videoFiles = data.media?.filter((item: any) => {
          const hasVideoUrl = item.video_url && item.video_url.trim() !== ''
          const hasBunnyId = item.bunny_video_id && item.bunny_video_id.trim() !== ''
          return hasVideoUrl || hasBunnyId
        }) || []
        
        console.log(`✅ VideoSelectionModal: ${videoFiles.length} videos válidos después de filtrar`, {
          totalRecibidos: data.media?.length || 0,
          videosFiltrados: videoFiles.length,
          primerosVideos: videoFiles.slice(0, 3).map((v: any) => ({
            id: v.id,
            filename: v.filename,
            video_url: v.video_url?.substring(0, 60) + '...',
            bunny_video_id: v.bunny_video_id
          }))
        })
        
        setVideos(videoFiles)
      } else {
        console.error('❌ Error cargando videos:', data.error, data.details)
        setError(data.error || 'Error desconocido')
      }
    } catch (error) {
      console.error('❌ Error de red:', error)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  // Sin renombrado en este modal

  const handleVideoSelect = (videoUrl: string) => {
    setSelectedVideo(videoUrl)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('video/')) {
      setNewVideoFile(file)
      setSelectedVideo(null) // Deseleccionar video existente
    }
  }

  // Crear URL de previsualización inmediata para nuevo video sin subir
  useEffect(() => {
    if (!newVideoFile) {
      if (newVideoPreviewUrl) {
        URL.revokeObjectURL(newVideoPreviewUrl)
      }
      setNewVideoPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(newVideoFile)
    setNewVideoPreviewUrl(url)
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [newVideoFile])

  const handleConfirm = async () => {
    if (selectedVideo) {
      const selected = videos.find(video => video.video_url === selectedVideo)
      onVideoSelected({
        videoUrl: selectedVideo,
        fileName: selected?.video_file_name || selected?.filename,
        existingMediaId: selected?.id ?? null,
        bunnyVideoId: selected?.bunny_video_id ?? null,
        bunnyLibraryId: selected?.bunny_library_id ?? null,
        thumbnailUrl: selected?.video_thumbnail_url ?? null,
        videoFile: null
      })
      onClose()
    } else if (newVideoFile) {
      console.log('📦 VideoSelectionModal: Pasando archivo de video al padre (sin subir aún)')
      const tempUrl = newVideoPreviewUrl || URL.createObjectURL(newVideoFile)
      onVideoSelected({
        videoUrl: tempUrl,
        fileName: newVideoFile.name,
        videoFile: newVideoFile
      })
      onClose()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const usedCount = videos.length
  const maxVideos = 6
  const usageLabel = `${usedCount}/${maxVideos} videos (≤30s c/u)`

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-[360px] h-[80vh] flex flex-col bg-[#0b0b0b] border border-zinc-800 rounded-2xl p-0 overflow-hidden">
        {/* Header fijo */}
        <div className="p-3 sm:p-4 pb-2 flex-shrink-0 border-b border-zinc-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white text-base">
              <Video className="h-5 w-5 text-orange-500" />
              Seleccionar video
            </DialogTitle>
            <DialogDescription className="sr-only">
              Modal para seleccionar un video de tu biblioteca o subir uno nuevo
            </DialogDescription>
            <div className="mt-1 text-[11px] text-zinc-400">
              {usageLabel}
              {selectedRowsCount > 0 ? ` · ${selectedRowsCount} fila${selectedRowsCount === 1 ? '' : 's'} seleccionada${selectedRowsCount === 1 ? '' : 's'}` : ''}
            </div>
          </DialogHeader>
        </div>

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 min-h-0">
        {/* Lista minimalista de videos */}
        <div className="mt-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Cargando videos...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="h-8 w-8 text-red-500" />
                </div>
                <p className="font-medium mb-2">Error cargando videos</p>
                <p className="text-sm text-red-400">{error}</p>
                <Button 
                  onClick={loadCoachVideos}
                  variant="outline"
                  className="mt-4 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                >
                  Reintentar
                </Button>
              </div>
            ) : videos.length === 0 ? (
               <div className="text-center py-8 text-gray-500">
                 <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                 <p>No tienes videos subidos aún</p>
                <p className="text-sm">Sube tu primer video con el botón "+"</p>
                 <p className="text-xs text-gray-400 mt-2">
                   Los videos aparecerán aquí una vez que hayas creado productos con videos
                 </p>
               </div>
            ) : (
            <div className="flex flex-col gap-2">
                {videos.map((video) => (
                  <motion.div
                    key={video.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                  <div
                    className={`cursor-pointer transition-all duration-200 rounded-xl border ${selectedVideo===video.video_url?'border-orange-500 bg-zinc-900':'border-zinc-800 bg-zinc-900/60'} p-3`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0" onClick={()=>handleVideoSelect(video.video_url)}>
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4 text-orange-500" />
                          <span className="font-medium text-sm truncate text-white">
                            {video.filename.length > 20 ? `${video.filename.substring(0, 20)}...` : video.filename}
                          </span>
                        </div>
                      </div>
                    </div>
                    {selectedVideo===video.video_url && (
                      <div className="mt-3 flex justify-center">
                        <div className="w-72 h-40 rounded-lg overflow-hidden border border-zinc-700">
                          <UniversalVideoPlayer
                            videoUrl={video.video_url}
                            bunnyVideoId={video.bunny_video_id}
                            thumbnailUrl={video.video_thumbnail_url}
                            autoPlay={false}
                            controls={true}
                            muted={false}
                            loop={false}
                            forceIframeForBunny={true}
                            className="w-full h-full"
                            onError={(error) => {
                              console.error('Error cargando video en modal:', error)
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  </motion.div>
                ))}
              </div>
            )}
        </div>

        {/* Subida mínima con botón + */}
        <div className="mt-4 pb-4">
          <Label htmlFor="video-upload" className="cursor-pointer inline-flex items-center gap-2 text-orange-400 hover:text-orange-300">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-orange-500">+</span>
            Subir nuevo video
          </Label>
          <Input id="video-upload" type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
          {newVideoFile && (
            <div className="mt-2 text-xs text-zinc-300">{newVideoFile.name} · {(newVideoFile.size/1024/1024).toFixed(2)} MB</div>
          )}
          {newVideoPreviewUrl && (
            <div className="mt-3 flex justify-center">
              <div className="w-72 h-40 rounded-lg overflow-hidden border border-zinc-700">
                <video className="w-full h-full object-cover" src={newVideoPreviewUrl} controls preload="none" />
              </div>
            </div>
          )}
        </div>
        </div>

        {/* Footer fijo - siempre visible en la parte inferior */}
        <div className="flex-shrink-0 border-t border-zinc-800 bg-[#0b0b0b] p-3 sm:p-4 pt-3 sticky bottom-0 z-10">
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose} className="text-zinc-300 hover:text-white">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedVideo && !newVideoFile}
              className="bg-orange-600 hover:bg-orange-500"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirmar Selección
                </>
              )}
            </Button>
          </div>
          <div className="mt-2 text-center text-[10px] text-zinc-500">
            Editar videos en perfil de coach
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}




