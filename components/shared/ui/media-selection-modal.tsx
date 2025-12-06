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
  Loader2,
  Image as ImageIcon,
  FileImage,
  Plus
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

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
  video_thumbnail_url?: string
  bunny_video_id?: string
  bunny_library_id?: string
  pdf_url?: string
  activity_title: string
  created_at: string
  filename: string
  media_type: 'image' | 'video'
  size?: number // Tamaño en bytes
  type?: string // Tipo MIME
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
  const [previewImage, setPreviewImage] = useState<CoachMedia | null>(null)
  const [pendingUploadUrl, setPendingUploadUrl] = useState<string | null>(null)
  const [pendingUploadFileName, setPendingUploadFileName] = useState<string | null>(null)
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)
  const [videoDuration, setVideoDuration] = useState<number | null>(null)

  // Establecer preview inicial cuando se carga el media
  useEffect(() => {
    if (media.length > 0 && !previewImage) {
      setPreviewImage(media[0])
    }
  }, [media])

  // Seleccionar automáticamente la imagen recién subida cuando se recarga la lista
  useEffect(() => {
    if (pendingUploadUrl && media.length > 0) {
      console.log('🔍 MediaSelectionModal: Buscando imagen recién subida en la lista:', {
        pendingUploadUrl,
        pendingUploadFileName,
        mediaCount: media.length,
        mediaItems: media.map(m => ({
          id: m.id,
          image_url: m.image_url,
          video_url: m.video_url,
          filename: m.filename
        }))
      })
      
      const uploadedItem = media.find(item => {
        const itemUrl = mediaType === 'image' ? item.image_url : item.video_url
        // Comparar URLs (pueden tener parámetros diferentes, así que comparamos la parte base)
        const urlMatches = itemUrl && pendingUploadUrl && (
          itemUrl === pendingUploadUrl || 
          itemUrl.includes(pendingUploadUrl.split('?')[0]) ||
          pendingUploadUrl.includes(itemUrl.split('?')[0])
        )
        // Comparar nombres de archivo
        const filenameMatches = pendingUploadFileName && item.filename && (
          item.filename === pendingUploadFileName ||
          item.filename.includes(pendingUploadFileName) ||
          pendingUploadFileName.includes(item.filename)
        )
        
        return urlMatches || filenameMatches
      })
      
      if (uploadedItem) {
        // Actualizar la lista para reemplazar el item temporal con el real del servidor
        setMedia(prev => {
          // Remover items temporales que coincidan con la URL
          const filtered = prev.filter(item => {
            const itemUrl = mediaType === 'image' ? item.image_url : item.video_url
            return !(itemUrl === pendingUploadUrl && item.id.startsWith('new-'))
          })
          // Asegurar que el item del servidor esté en la lista
          const exists = filtered.some(item => item.id === uploadedItem.id)
          return exists ? filtered : [uploadedItem, ...filtered]
        })
        
        setPreviewImage(uploadedItem)
        setSelectedMedia(uploadedItem.id)
        // Limpiar el archivo nuevo ahora que la selección está confirmada
        setNewMediaFile(null)
        setPendingUploadUrl(null)
        setPendingUploadFileName(null)
        console.log('✅ MediaSelectionModal: Imagen recién subida seleccionada automáticamente:', {
          id: uploadedItem.id,
          url: uploadedItem.image_url || uploadedItem.video_url,
          filename: uploadedItem.filename
        })
      } else {
        console.warn('⚠️ MediaSelectionModal: No se encontró la imagen recién subida en la lista recargada', {
          pendingUploadUrl,
          pendingUploadFileName,
          mediaCount: media.length
        })
        // Si no se encuentra, intentar seleccionar la primera imagen (que debería ser la más reciente)
        if (media.length > 0 && mediaType === 'image') {
          const firstImage = media.find(m => m.image_url)
          if (firstImage) {
            // Remover items temporales de la lista
            setMedia(prev => prev.filter(item => !item.id.startsWith('new-')))
            
            setPreviewImage(firstImage)
            setSelectedMedia(firstImage.id)
            // Limpiar el archivo nuevo ahora que la selección está confirmada
            setNewMediaFile(null)
            setPendingUploadUrl(null)
            setPendingUploadFileName(null)
            console.log('✅ MediaSelectionModal: Seleccionando primera imagen disponible como fallback:', {
              id: firstImage.id,
              url: firstImage.image_url
            })
          }
        }
      }
    }
  }, [media, pendingUploadUrl, pendingUploadFileName, mediaType])

  // Cargar media del coach y limpiar selección
  useEffect(() => {
    if (isOpen) {
      console.log('🔄 MediaSelectionModal: Abriendo modal, limpiando estado')
      // Limpiar selecciones previas
      setSelectedMedia(null)
      setNewMediaFile(null)
      setError(null)
      setPreviewImage(null)
      setPendingUploadUrl(null)
      setPendingUploadFileName(null)
      setIsPreviewPlaying(false)
      setVideoDuration(null)
      // Forzar re-render limpiando también el array de media
      setMedia([])
      loadCoachMedia()
    }
  }, [isOpen, mediaType])

  const loadCoachMedia = async () => {
    setLoading(true)
    setError(null)
    try {
      if (mediaType === 'image') {
        // Para imágenes, usar el mismo endpoint que el widget de almacenamiento
        console.log('🔄 MediaSelectionModal: Cargando imágenes del coach desde storage-files')
        
        const response = await fetch('/api/coach/storage-files')
        const data = await response.json()
        
        console.log('📁 MediaSelectionModal: Respuesta de storage-files:', {
          status: response.status, 
          ok: response.ok, 
          filesCount: data.files?.length || 0,
          success: data.success,
          error: data.error
        })
        
        if (response.ok && data.success && Array.isArray(data.files)) {
          // Filtrar solo imágenes y convertir al formato esperado
          const imageFiles = data.files.filter((file: any) => file.concept === 'image') || []
          
          // Convertir formato de StorageFile a CoachMedia
          const convertedMedia: CoachMedia[] = imageFiles.map((file: any) => ({
            id: file.fileId || `image-${file.fileName}`,
            activity_id: file.activities?.[0]?.id || 0,
            image_url: file.url || undefined,
            video_url: undefined,
            pdf_url: undefined,
            bunny_video_id: undefined,
            bunny_library_id: undefined,
            video_thumbnail_url: undefined,
            filename: file.fileName || '',
            media_type: 'image' as const,
            size: file.sizeBytes || undefined, // Tamaño en bytes desde StorageFile
            type: 'image/' + (file.fileName?.split('.').pop()?.toLowerCase() || 'jpeg') // Inferir tipo desde extensión
          }))
          
          console.log('🎯 MediaSelectionModal: Imágenes convertidas:', {
            totalImagenes: imageFiles.length,
            mediaConvertidas: convertedMedia.length,
            archivos: convertedMedia.map((item: any) => ({
              id: item.id,
              filename: item.filename,
              image_url: item.image_url
            }))
          })
          
          // Preservar items temporales que aún no se han encontrado en el servidor
          setMedia(prev => {
            const tempItems = prev.filter(item => item.id.startsWith('new-'))
            // Si hay items temporales, mantenerlos hasta que se encuentren en el servidor
            return tempItems.length > 0 ? [...convertedMedia, ...tempItems] : convertedMedia
          })
        } else {
          console.error(`❌ Error cargando imágenes del coach:`, data.error)
          setError(data.error || 'Error desconocido')
        }
      } else {
        // Para videos, usar el endpoint de coach-media (como antes)
        console.log('🔄 MediaSelectionModal: Cargando videos del coach (activity_media)')
        
        const response = await fetch('/api/coach-media?all=true')
        const data = await response.json()
        
        console.log('📁 MediaSelectionModal: Respuesta del servidor:', {
          status: response.status, 
          ok: response.ok, 
          mediaCount: data.media?.length || 0,
          error: data.error,
          details: data.details,
          allMedia: data.media,
          debug: data.debug
        })
        
        if (response.ok) {
          // ✅ Filtrar solo videos
          const filteredMedia = data.media?.filter((item: any) => {
            // Aceptar videos con video_url o bunny_video_id
            const hasVideoUrl = item.video_url && item.video_url.trim() !== ''
            const hasBunnyId = item.bunny_video_id && item.bunny_video_id.trim() !== ''
            return hasVideoUrl || hasBunnyId
          }) || []
          
          console.log('🎯 MediaSelectionModal: Videos filtrados:', {
            totalArchivos: data.media?.length || 0,
            archivosFiltrados: filteredMedia.length,
            archivos: filteredMedia.map((item: any) => ({
              id: item.id,
              filename: item.filename,
              media_type: item.media_type,
              video_url: item.video_url,
              bunny_video_id: item.bunny_video_id
            }))
          })
          
          // Preservar items temporales que aún no se han encontrado en el servidor
          setMedia(prev => {
            const tempItems = prev.filter(item => item.id.startsWith('new-'))
            // Si hay items temporales, mantenerlos hasta que se encuentren en el servidor
            return tempItems.length > 0 ? [...filteredMedia, ...tempItems] : filteredMedia
          })
        } else {
          console.error(`❌ Error cargando videos del coach:`, data.error, data.details)
          setError(data.error || 'Error desconocido')
        }
      }
    } catch (error) {
      console.error('❌ Error de red:', error)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleMediaSelect = (mediaId: string) => {
    console.log('🎯 MediaSelectionModal: Seleccionando media:', {
      mediaId,
      currentlySelected: selectedMedia,
      isAlreadySelected: selectedMedia === mediaId,
      allMediaIds: media.map(m => m.id)
    })
    
    // Encontrar el item seleccionado
    const selectedItem = media.find(m => m.id === mediaId)
    
    // Si ya está seleccionado, deseleccionarlo
    if (selectedMedia === mediaId) {
      console.log('❌ Deseleccionando media actual')
      setSelectedMedia(null)
      // Mantener la preview actual
    } else {
      // Seleccionar solo este elemento (deselecciona automáticamente otros)
      console.log('✅ Seleccionando nuevo media, deseleccionando otros')
      setSelectedMedia(mediaId)
      // Cambiar la imagen de preview
      if (selectedItem) {
        setPreviewImage(selectedItem)
        setIsPreviewPlaying(false)
      }
      // Limpiar archivo nuevo si había uno seleccionado
      setNewMediaFile(null)
    }
  }

  // Manejar clic en nombre de archivo de la lista
  const handleFileNameClick = (mediaId: string) => {
    const clickedItem = media.find(m => m.id === mediaId)
    if (clickedItem) {
      setPreviewImage(clickedItem)
      setSelectedMedia(mediaId)
      setNewMediaFile(null)
      setIsPreviewPlaying(false)
    }
  }

  const truncateFileName = (name: string, maxLength = 50) => {
    if (!name) return ''
    return name.length > maxLength ? name.slice(0, maxLength - 3) + '...' : name
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNewMediaFile(file)
      // Deseleccionar media existente cuando se selecciona un archivo nuevo
      setSelectedMedia(null)
      // Para imágenes mantenemos el flujo de subir inmediatamente al storage.
      // Para videos NO subimos todavía: sólo creamos un item temporal para preview
      // y delegamos el upload real al flujo de actualización de producto (Bunny, etc.).
      if (mediaType === 'image') {
        // Subir el archivo inmediatamente (imágenes de portada)
        await handleUploadFile(file)
      } else {
        // Video: primero medir duración; si excede 30s lo rechazamos
        const objectUrl = URL.createObjectURL(file)
        const videoEl = document.createElement('video')
        videoEl.preload = 'metadata'
        videoEl.src = objectUrl
        videoEl.onloadedmetadata = () => {
          const duration = videoEl.duration
          setVideoDuration(duration)

          if (duration > 30) {
            console.warn('MediaSelectionModal: video demasiado largo, duración:', duration)
            setError('El video puede durar como máximo 30 segundos. Elegí un clip más corto.')
            setNewMediaFile(null)
            setPreviewImage(null)
            setSelectedMedia(null)
            setIsPreviewPlaying(false)
            return
          }

          // Duración válida: crear item temporal para mostrar nombre + preview mínima
          const tempItem: CoachMedia = {
            id: `new-${Date.now()}`,
            activity_id: 0,
            image_url: objectUrl, // se usa sólo para preview estática
            video_url: objectUrl,
            activity_title: '',
            created_at: new Date().toISOString(),
            filename: file.name,
            media_type: 'video',
            size: file.size,
            type: file.type || 'video/mp4'
          }

          setMedia(prev => [tempItem, ...prev])
          setPreviewImage(tempItem)
          setSelectedMedia(tempItem.id)
          setIsPreviewPlaying(false)
        }
      }
    }
  }

  const handleUploadFile = async (file: File) => {
    setUploading(true)
    setError(null)
    
    try {
      console.log('📤 MediaSelectionModal: Subiendo archivo inmediatamente...', {
        name: file.name,
        size: file.size,
        type: file.type
      })

      const formData = new FormData()
      formData.append('file', file)
      formData.append('mediaType', mediaType)
      formData.append('category', 'product') // Categoría para productos

      const response = await fetch('/api/upload-organized', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al subir el archivo')
      }

      console.log('✅ MediaSelectionModal: Archivo subido exitosamente:', {
        url: data.url,
        fileName: data.fileName,
        filePath: data.filePath
      })

      // Crear el objeto CoachMedia inmediatamente con la imagen recién subida
      const newMediaItem: CoachMedia = {
        id: `new-${Date.now()}`, // ID temporal único
        activity_id: 0,
        image_url: mediaType === 'image' ? data.url : undefined,
        video_url: mediaType === 'video' ? data.url : undefined,
        activity_title: '',
        created_at: new Date().toISOString(),
        filename: data.fileName || file.name,
        media_type: mediaType,
        size: file.size,
        type: file.type
      }

      // Agregar inmediatamente a la lista y seleccionarla
      setMedia(prev => [newMediaItem, ...prev])
      setPreviewImage(newMediaItem)
      setSelectedMedia(newMediaItem.id)
      setNewMediaFile(null) // Limpiar el archivo ya que está en la lista

      console.log('✅ MediaSelectionModal: Imagen agregada y seleccionada inmediatamente:', {
        id: newMediaItem.id,
        url: data.url,
        filename: newMediaItem.filename
      })

      // Guardar la URL para que el useEffect actualice la selección cuando se recargue la lista
      setPendingUploadUrl(data.url)
      setPendingUploadFileName(data.fileName || file.name)

      // Recargar la lista en segundo plano para sincronizar con el servidor
      // El useEffect se encargará de actualizar la selección con el ID correcto del servidor
      loadCoachMedia().catch(err => {
        console.error('Error recargando lista después de subir:', err)
      })

    } catch (error: any) {
      console.error('❌ MediaSelectionModal: Error subiendo archivo:', error)
      setError(error.message || 'Error al subir el archivo')
    } finally {
      setUploading(false)
    }
  }

  const handleConfirm = async () => {
    // Para videos priorizamos el archivo nuevo (si existe) y NO forzamos upload aquí.
    if (mediaType === 'video' && newMediaFile) {
      if (videoDuration && videoDuration > 30) {
        setError('El video seleccionado dura más de 30 segundos. Por favor, elige uno de máximo 30s.')
        return
      }
      console.log('📁 MediaSelectionModal: Video seleccionado (NO subido aún)', {
        name: newMediaFile.name,
        size: newMediaFile.size,
        type: newMediaFile.type
      })

      const temporaryUrl = URL.createObjectURL(newMediaFile)

      console.log('🎯 MediaSelectionModal: URL temporal creada para video (archivo en memoria):', temporaryUrl)
      console.log('⏳ MediaSelectionModal: El video se subirá cuando se actualice el producto')

      onMediaSelected(temporaryUrl, mediaType, newMediaFile)
      onClose()
      return
    }

    if (selectedMedia) {
      // ✅ Buscar el item por ID y obtener su URL según el mediaType solicitado
      const selectedItem = media.find(item => item.id === selectedMedia)
      
      console.log('🎯 MediaSelectionModal: Confirmando selección:', {
        selectedId: selectedMedia,
        mediaType,
        totalMedia: media.length,
        mediaIds: media.map(m => m.id),
        selectedItem: selectedItem ? {
          id: selectedItem.id,
          image_url: selectedItem.image_url,
          video_url: selectedItem.video_url,
          filename: selectedItem.filename
        } : null
      })
      
      // ✅ Elegir la URL correcta según el tipo de media solicitado
      const mediaUrl = selectedItem 
        ? (mediaType === 'image' ? selectedItem.image_url : selectedItem.video_url)
        : null
      
      if (mediaUrl) {
        onMediaSelected(mediaUrl, mediaType)
        onClose()
      } else {
        console.error('❌ No se pudo encontrar la URL para el ID seleccionado', {
          selectedId: selectedMedia,
          selectedItemExists: !!selectedItem,
          selectedItemUrl: selectedItem ? (mediaType === 'image' ? selectedItem.image_url : selectedItem.video_url) : null,
          allMedia: media.map(m => ({ id: m.id, image_url: m.image_url, video_url: m.video_url }))
        })
        setError('No se pudo encontrar la imagen seleccionada. Por favor, inténtalo de nuevo.')
      }
    } else if (newMediaFile) {
      console.log('📁 MediaSelectionModal: Archivo seleccionado (NO subido aún)', {
        name: newMediaFile.name,
        size: newMediaFile.size,
        type: newMediaFile.type,
        mediaType
      })
      
      // ✅ NO subir todavía - solo crear una URL temporal local
      // El archivo se subirá cuando se apriete "Actualizar Producto"
      const temporaryUrl = URL.createObjectURL(newMediaFile)
      
      console.log('🎯 MediaSelectionModal: URL temporal creada (archivo en memoria):', temporaryUrl)
      console.log('⏳ MediaSelectionModal: El archivo se subirá cuando se actualice el producto')
      
      // Pasar el archivo Y la URL temporal al padre
      onMediaSelected(temporaryUrl, mediaType, newMediaFile)
      onClose()
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
    return mediaType === 'image' ? <ImageIcon className="h-4 w-4" /> : <Video className="h-4 w-4" />
  }

  const getMediaTypeLabel = (mediaType: 'image' | 'video') => {
    return mediaType === 'image' ? 'Imagen' : 'Video'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[70vh] bg-[#0A0A0A] border-[#1A1A1A] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-semibold">
            Seleccionar {getMediaTypeLabel(mediaType)} de Portada
          </DialogTitle>
          <p className="text-gray-400 text-sm mt-2">
            Selecciona solo una {getMediaTypeLabel(mediaType).toLowerCase()} para usar como portada de tu producto
          </p>
        </DialogHeader>

        <div className="space-y-4 flex flex-col h-full">
          {uploading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <span className="ml-2 text-white">Subiendo {getMediaTypeLabel(mediaType).toLowerCase()}...</span>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <span className="ml-2 text-white">Cargando {getMediaTypeLabel(mediaType).toLowerCase()}s...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-4 flex-1 min-h-0 py-6">
              <div className="text-red-400 text-center">
                <X className="h-8 w-8 mx-auto mb-2" />
                <p>{error}</p>
              </div>
              {/* Siempre permitir volver a intentar subir otro archivo cuando hay error */}
              <div className="flex flex-col items-center gap-3">
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    // Limpiar error al volver a intentar
                    setError(null)
                    document.getElementById('media-upload')?.click()
                  }}
                  className="bg-[#FF7939]/20 text-[#FF7939] border border-[#FF7939]/30 rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200 hover:bg-[#FF7939]/30"
                >
                  <Plus className="h-5 w-5" />
                </motion.button>
                <p className="text-xs text-gray-400 text-center max-w-xs">
                  Elegí otro video (máximo 30 segundos) para usar como portada de tu producto.
                </p>
              </div>
              {/* Input oculto para subir archivo */}
              <input
                type="file"
                accept={mediaType === 'image' ? 'image/*' : 'video/mp4,video/webm,video/quicktime'}
                onChange={handleFileChange}
                className="hidden"
                id="media-upload"
              />
            </div>
          ) : media.length === 0 ? (
            <div className="flex flex-col gap-4 flex-1 min-h-0 items-center justify-center">
              <div className="text-gray-400 text-center py-8">
                <FileImage className="h-8 w-8 mx-auto mb-2" />
                <p className="mb-4">No hay {getMediaTypeLabel(mediaType).toLowerCase()}s disponibles</p>
              </div>
              {/* Botón + naranja (estilo objetivos) para agregar nueva imagen cuando no hay imágenes */}
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={(e) => {
                  e.stopPropagation()
                  document.getElementById('media-upload')?.click()
                }}
                className="bg-[#FF7939]/20 text-[#FF7939] border border-[#FF7939]/30 rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200 hover:bg-[#FF7939]/30"
              >
                <Plus className="h-5 w-5" />
              </motion.button>
              {/* Input oculto para subir archivo */}
              <input
                type="file"
                accept={mediaType === 'image' ? 'image/*' : 'video/mp4,video/webm,video/quicktime'}
                onChange={handleFileChange}
                className="hidden"
                id="media-upload"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-4 flex-1 min-h-0">
              {/* Preview grande arriba */}
              {previewImage && (
                <div className="flex-shrink-0 flex justify-center">
                  <div
                    className="relative w-full mx-auto max-w-xs overflow-hidden rounded-lg bg-[#050505]"
                    style={{ aspectRatio: mediaType === 'video' ? '16/9' : '2/3' }}
                  >
                    {mediaType === 'video' && isPreviewPlaying && previewImage.video_url ? (
                      <video
                        src={previewImage.video_url}
                        className="w-full h-full object-cover"
                        controls
                        autoPlay
                      />
                    ) : (
                      <>
                        {(() => {
                          // Para imágenes usamos siempre image_url.
                          // Para videos NUNCA usamos video_url como src por defecto (para no cargar el video),
                          // sólo usamos una imagen asociada (image_url / thumbnail). Si no hay, mostramos placeholder visual de video.
                          const previewSrc =
                            mediaType === 'image'
                              ? previewImage.image_url || null
                              : previewImage.image_url || previewImage.video_thumbnail_url || null

                          if (!previewSrc && mediaType === 'video') {
                            return (
                              <div className="flex flex-col items-center justify-center w-full h-full bg-[#111111]">
                                <div className="flex items-center justify-center w-full h-[65%] bg-gradient-to-b from-[#1A1A1A] to-black" />
                                <div className="w-full h-[35%] px-3 flex flex-col justify-center gap-1 bg-black/70">
                                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                                    <span>0:00</span>
                                    <span>--:--</span>
                                  </div>
                                  <div className="w-full h-1.5 rounded-full bg-[#2A2A2A] overflow-hidden">
                                    <div className="h-full w-1/4 bg-[#FF7939]" />
                                  </div>
                                </div>
                              </div>
                            )
                          }

                          return (
                            <Image
                              src={previewSrc}
                              alt={previewImage.filename}
                              fill
                              className="object-cover w-full h-full"
                              onError={() => {
                                // Evitamos spamear errores cuando la URL es inválida o null.
                                console.warn('MediaSelectionModal: error cargando imagen de preview', {
                                  mediaType,
                                  previewSrc,
                                  filename: previewImage.filename,
                                  id: previewImage.id
                                })
                              }}
                            />
                          )
                        })()}
                        {/* Overlay de controles mínimos para videos (Play + barra) sin cargar el video real hasta clic */}
                        {mediaType === 'video' && (
                          <>
                            {/* Botón de Play centrado (clickable, minimalista) */}
                            <button
                              type="button"
                              className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/10 transition-colors"
                              onClick={() => setIsPreviewPlaying(true)}
                            >
                              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-black/60 border border-white/10 shadow-md">
                                <Play className="h-6 w-6 text-white ml-0.5" />
                              </div>
                            </button>
                            {/* Barra de progreso mínima abajo (decorativa) */}
                            <div className="absolute inset-x-0 bottom-0 px-3 pb-2 pt-1 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none">
                              <div className="flex items-center justify-between text-[10px] text-gray-300 font-mono mb-1">
                                <span>0:00</span>
                                <span>--:--</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-[#2A2A2A] overflow-hidden">
                                <div className="h-full w-1/4 bg-[#FF7939]" />
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    )}
                    {selectedMedia === previewImage.id && (
                      <div className="absolute top-2 right-2 bg-orange-500 rounded-full p-1.5 shadow-lg z-10">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Lista de nombres de archivos debajo con scroll horizontal */}
              <div className="overflow-x-auto overflow-y-hidden flex-shrink-0">
                <div className="flex gap-2 pb-2" style={{ minWidth: 'min-content' }}>
                  {media.map((item, index) => {
                    const itemId = item.id
                    const isSelected = selectedMedia === itemId
                    const isPreview = previewImage?.id === itemId
                    
                    return (
                      <motion.button
                        key={item.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleFileNameClick(itemId)
                        }}
                        className={`px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex-shrink-0 flex flex-col items-start ${
                          isSelected
                            ? 'bg-[#FF7939]/40 text-[#FF7939] border border-[#FF7939]/50'
                            : 'bg-[#1A1A1A] text-gray-300 border border-[#2A2A2A]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="whitespace-nowrap">
                            {truncateFileName(item.filename)}
                          </span>
                          {isSelected && (
                            <Check className="h-2.5 w-2.5 inline-block flex-shrink-0" />
                          )}
                        </div>
                        {/* Mostrar tamaño y tipo si están disponibles */}
                        {(item.size || item.type) && (
                          <div className="text-[10px] text-white mt-0.5 whitespace-nowrap">
                            {item.size && <span>{formatFileSize(item.size)}</span>}
                            {item.size && item.type && <span> • </span>}
                            {item.type && <span>{item.type.split('/')[1]?.toUpperCase() || item.type}</span>}
                          </div>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </div>
              
              {/* Línea con botón + y botón Guardar */}
              <div className="flex items-center justify-center gap-3 flex-shrink-0 w-full py-2">
                {/* Botón + naranja (estilo objetivos) para agregar nueva imagen */}
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    document.getElementById('media-upload')?.click()
                  }}
                  className="bg-[#FF7939]/20 text-[#FF7939] border border-[#FF7939]/30 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-200 flex-shrink-0 hover:bg-[#FF7939]/30"
                >
                  <Plus className="h-4 w-4" />
                </motion.button>
                
                {/* Botón Guardar (solo visible cuando hay selección) */}
                {selectedMedia || newMediaFile ? (
                  <Button
                    onClick={handleConfirm}
                    disabled={uploading}
                    className="bg-[#FF7939]/30 text-[#FF7939] border border-[#FF7939]/40 rounded-full px-4 hover:bg-[#FF7939]/40"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      'Guardar'
                    )}
                  </Button>
                ) : null}
              </div>
              
              {/* Input oculto para subir archivo */}
              <input
                type="file"
                accept={mediaType === 'image' ? 'image/*' : 'video/mp4,video/webm,video/quicktime'}
                onChange={handleFileChange}
                className="hidden"
                id="media-upload"
              />
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  )
}
