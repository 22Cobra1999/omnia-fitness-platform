"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Video, 
  Upload, 
  Play, 
  Calendar, 
  FileText,
  Check,
  X,
  Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface VideoSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onVideoSelected: (videoUrl: string, videoFile?: File) => void
  selectedRowsCount: number
}

interface CoachVideo {
  id: string
  activity_id: number
  video_url: string
  activity_title: string
  created_at: string
  filename: string
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
      const response = await fetch('/api/coach-videos')
      const data = await response.json()
      
          //   status: response.status, 
          //   ok: response.ok, 
          //   error: data.error,
          //   details: data.details,
          //   debug: data.debug
          // })
      
      if (response.ok) {
        setVideos(data.videos || [])
      } else {
        console.error('❌ Error cargando videos:', data.error, data.details)
        setError(data.error || 'Error desconocido')
        // Mostrar error más específico
        if (data.error === 'Coach no encontrado') {
          console.error('Debug info:', data.debug)
        } else if (data.error === 'Error obteniendo videos') {
          console.error('Error en consulta videos:', data.details)
        }
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
      // Video existente seleccionado
      onVideoSelected(selectedVideo)
      onClose()
    } else if (newVideoFile) {
      // Nuevo video seleccionado
      setUploading(true)
      try {
        // Aquí subiríamos el video y obtendríamos la URL
        // Por ahora, simulamos la subida
        const videoUrl = await uploadVideo(newVideoFile)
        onVideoSelected(videoUrl, newVideoFile)
        onClose()
      } catch (error) {
        console.error('Error subiendo video:', error)
      } finally {
        setUploading(false)
      }
    }
  }

  const uploadVideo = async (file: File): Promise<string> => {
    // Simulación de subida - en la implementación real usarías Supabase Storage
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`https://example.com/videos/${file.name}`)
      }, 2000)
    })
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
      <DialogContent className="w-[90vw] max-w-[360px] max-h-[80vh] overflow-y-auto bg-[#0b0b0b] border border-zinc-800 rounded-2xl p-3 sm:p-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white text-base">
            <Video className="h-5 w-5 text-orange-500" />
            Seleccionar video
          </DialogTitle>
          <div className="mt-1 text-[11px] text-zinc-400">{usageLabel}</div>
        </DialogHeader>

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
                <p className="text-sm">Sube tu primer video con el botón “+”</p>
                 <p className="text-xs text-gray-400 mt-2">
                   Los videos aparecerán aquí una vez que hayas creado productos con videos
                 </p>
               </div>
            ) : (
            <div className="flex flex-col gap-2 max-h-[55vh] overflow-y-auto">
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
                        <video className="w-72 h-40 rounded-lg object-cover border border-zinc-700" src={video.video_url} controls preload="metadata" />
                      </div>
                    )}
                  </div>
                  </motion.div>
                ))}
              </div>
            )}
        </div>

        {/* Subida mínima con botón + */}
        <div className="mt-4">
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
              <video className="w-72 h-40 rounded-lg object-cover border border-zinc-700" src={newVideoPreviewUrl} controls preload="metadata" />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
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
      </DialogContent>
    </Dialog>
  )
}




