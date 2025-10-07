import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

interface ActivityMedia {
  id?: string
  activity_id: string
  image_url?: string | null
  video_url?: string | null
  vimeo_id?: string | null
  pdf_url?: string | null
  created_at?: string
  updated_at?: string
}

interface UseActivityMediaReturn {
  media: ActivityMedia | null
  loading: boolean
  error: string | null
  createOrUpdateMedia: (data: Partial<ActivityMedia>) => Promise<ActivityMedia | null>
  getMedia: (activityId: string) => Promise<ActivityMedia | null>
  uploadImage: (activityId: string, imageFile: File) => Promise<string | null>
}

export function useActivityMedia(): UseActivityMediaReturn {
  const [media, setMedia] = useState<ActivityMedia | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const createOrUpdateMedia = async (data: Partial<ActivityMedia>): Promise<ActivityMedia | null> => {
    if (!data.activity_id) {
      setError('activity_id es requerido')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/activity-media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al guardar media')
      }

      setMedia(result.media)
      return result.media
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error creando/actualizando media:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  const getMedia = async (activityId: string): Promise<ActivityMedia | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/activity-media?activity_id=${activityId}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al obtener media')
      }

      setMedia(result.media)
      return result.media
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error obteniendo media:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  const uploadImage = async (activityId: string, imageFile: File): Promise<string | null> => {
    setLoading(true)
    setError(null)

    try {
      // Subir imagen a Supabase Storage
      const timestamp = Date.now()
      const fileName = `${activityId}_${timestamp}_${imageFile.name}`
      const filePath = `product-images/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw new Error(`Error subiendo imagen: ${uploadError.message}`)
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      const imageUrl = urlData.publicUrl

      // Guardar en activity_media
      const mediaData = await createOrUpdateMedia({
        activity_id: activityId,
        image_url: imageUrl
      })

      return imageUrl
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error subiendo imagen:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    media,
    loading,
    error,
    createOrUpdateMedia,
    getMedia,
    uploadImage
  }
}
