"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Loader2,
  Image,
  FileImage
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface MediaSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onMediaSelected: (mediaUrl: string, mediaType: 'image' | 'video', mediaFile?: File) => void
  mediaType: 'image' | 'video'
}

interface CoachMedia {
  id: string
  activity_id: number
  image_url?: string
  video_url?: string
  activity_title: string
  created_at: string
  filename: string
  media_type: 'image' | 'video'
}

export function MediaSelectionModal({
  isOpen,
  onClose,
  onMediaSelected,
  mediaType
}: MediaSelectionModalProps) {
  const [media, setMedia] = useState<CoachMedia[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null)
  const [newMediaFile, setNewMediaFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // Cargar media del coach y limpiar selección
  useEffect(() => {
    if (isOpen) {
      // Limpiar selecciones previas
      setSelectedMedia(null)
      setNewMediaFile(null)
      setError(null)
      loadCoachMedia()
    }
  }, [isOpen, mediaType])

  const loadCoachMedia = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/coach-media?type=${mediaType}`)
      const data = await response.json()
      
          //   status: response.status, 
          //   ok: response.ok, 
          //   error: data.error,
          //   details: data.details
          // })
      
      if (response.ok) {
        setMedia(data.media || [])
      } else {
        console.error(`❌ Error cargando ${mediaType}s:`, data.error, data.details)
        setError(data.error || 'Error desconocido')
      }
    } catch (error) {
      console.error('❌ Error de red:', error)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleMediaSelect = (mediaUrl: string) => {
    console.log('🎯 MediaSelectionModal: Seleccionando media:', {
      mediaUrl,
      currentlySelected: selectedMedia,
      isAlreadySelected: selectedMedia === mediaUrl
    })
    
    // Si ya está seleccionado, deseleccionarlo
    if (selectedMedia === mediaUrl) {
      console.log('❌ Deseleccionando media actual')
      setSelectedMedia(null)
    } else {
      // Seleccionar solo este elemento (deselecciona automáticamente otros)
      console.log('✅ Seleccionando nuevo media, deseleccionando otros')
      setSelectedMedia(mediaUrl)
      // Limpiar archivo nuevo si había uno seleccionado
      setNewMediaFile(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNewMediaFile(file)
      // Deseleccionar media existente cuando se selecciona un archivo nuevo
      setSelectedMedia(null)
    }
  }

  const handleConfirm = async () => {
    
    if (selectedMedia) {
      onMediaSelected(selectedMedia, mediaType)
      onClose()
    } else if (newMediaFile) {
      console.log('📁 MediaSelectionModal: Subiendo nuevo archivo', {
        name: newMediaFile.name,
        size: newMediaFile.size,
        type: newMediaFile.type,
        mediaType
      })
      
      setUploading(true)
      try {
        // Subir archivo real a Supabase Storage
        const formData = new FormData()
        formData.append('file', newMediaFile)
        formData.append('mediaType', mediaType)
        formData.append('category', 'product') // Categoría para productos/actividades

        const response = await fetch('/api/upload-organized', {
          method: 'POST',
          body: formData
        })

        
        if (!response.ok) {
          const errorData = await response.json()
          console.error('❌ MEDIA-SELECTION: Error en response:', errorData)
          throw new Error(errorData.error || 'Error al subir el archivo')
        }

        const result = await response.json()
        
        if (result.success) {
          // Usar la URL real de Supabase Storage
          onMediaSelected(result.url, mediaType, newMediaFile)
          onClose()
        } else {
          console.error('❌ MEDIA-SELECTION: Resultado no exitoso:', result)
          throw new Error(result.error || 'Error al subir el archivo')
        }
      } catch (error) {
        console.error('❌ MEDIA-SELECTION: Error subiendo archivo:', error)
        setError(error instanceof Error ? error.message : 'Error al subir el archivo')
      } finally {
        setUploading(false)
      }
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getMediaTypeIcon = (mediaType: 'image' | 'video') => {
    return mediaType === 'image' ? <Image className="h-4 w-4" /> : <Video className="h-4 w-4" />
  }

  const getMediaTypeLabel = (mediaType: 'image' | 'video') => {
    return mediaType === 'image' ? 'Imagen' : 'Video'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-[#0A0A0A] border-[#1A1A1A]">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-semibold">
            Seleccionar {getMediaTypeLabel(mediaType)} de Portada
          </DialogTitle>
          <p className="text-gray-400 text-sm mt-2">
            Selecciona solo una {getMediaTypeLabel(mediaType).toLowerCase()} para usar como portada de tu producto
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tabs para seleccionar media existente o subir nuevo */}
          <Tabs defaultValue="existing" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-[#1A1A1A]">
              <TabsTrigger value="existing" className="text-white">
                {getMediaTypeLabel(mediaType)}s Existentes
              </TabsTrigger>
              <TabsTrigger value="upload" className="text-white">
                Subir Nuevo {getMediaTypeLabel(mediaType)}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="existing" className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                  <span className="ml-2 text-white">Cargando {getMediaTypeLabel(mediaType).toLowerCase()}s...</span>
                </div>
              ) : error ? (
                <div className="text-red-400 text-center py-8">
                  <X className="h-8 w-8 mx-auto mb-2" />
                  <p>{error}</p>
                </div>
              ) : media.length === 0 ? (
                <div className="text-gray-400 text-center py-8">
                  <FileImage className="h-8 w-8 mx-auto mb-2" />
                  <p>No hay {getMediaTypeLabel(mediaType).toLowerCase()}s disponibles</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {media.map((item, index) => {
                      const itemUrl = item.image_url || item.video_url || ''
                      const isSelected = selectedMedia === itemUrl
                      
                      return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card 
                          className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                            isSelected
                              ? 'ring-2 ring-orange-500 bg-orange-500/20 border-orange-500'
                              : 'bg-[#1A1A1A] border-[#2A2A2A] hover:border-orange-500/50'
                          }`}
                          onClick={() => handleMediaSelect(itemUrl)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                                {getMediaTypeIcon(item.media_type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">
                                  {item.filename}
                                </p>
                                <p className="text-gray-400 text-xs truncate">
                                  {item.activity_title}
                                </p>
                                <p className="text-gray-500 text-xs">
                                  {new Date(item.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              {isSelected && (
                                <Check className="h-5 w-5 text-orange-500" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                newMediaFile 
                  ? 'border-orange-500 bg-orange-500/10' 
                  : 'border-gray-600 hover:border-orange-500/50'
              }`}>
                <input
                  type="file"
                  accept={mediaType === 'image' ? 'image/*' : 'video/mp4,video/webm,video/quicktime'}
                  onChange={handleFileChange}
                  className="hidden"
                  id="media-upload"
                />
                <label
                  htmlFor="media-upload"
                  className="cursor-pointer block"
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-white text-sm">
                      {newMediaFile ? `Archivo seleccionado: ${newMediaFile.name}` : `Seleccionar ${getMediaTypeLabel(mediaType).toLowerCase()}`}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {newMediaFile ? 'Click para cambiar' : 'Click para seleccionar'}
                    </p>
                    {newMediaFile && (
                      <div className="flex items-center space-x-2 text-orange-500 text-sm">
                        <Check className="h-4 w-4" />
                        <span>Archivo listo para subir</span>
                      </div>
                    )}
                    {mediaType === 'video' && (
                      <p className="text-gray-400 text-xs">Máx. 3 min, 50MB</p>
                    )}
                  </div>
                </label>
                
                {newMediaFile && (
                  <div className="mt-4">
                    <div className="bg-[#0F0F0F] rounded-lg p-3">
                      <div className="text-xs text-gray-400 space-y-1">
                        <div>📁 Archivo: {newMediaFile.name}</div>
                        <div>📏 Tamaño: {formatFileSize(newMediaFile.size)}</div>
                        <div>🎬 Tipo: {newMediaFile.type}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-600 text-gray-400 hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedMedia && !newMediaFile}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                `Seleccionar ${getMediaTypeLabel(mediaType).toLowerCase()}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
