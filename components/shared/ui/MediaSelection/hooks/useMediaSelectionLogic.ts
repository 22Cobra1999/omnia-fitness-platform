import { useState, useEffect, useCallback } from 'react'
import { MediaType, CoachMedia, SourceFilter } from '../types'

export function useMediaSelectionLogic(
    isOpen: boolean,
    mediaType: MediaType,
    onMediaSelected: (url: string, type: MediaType, file?: File, name?: string) => void,
    onClose: () => void,
    // Context IDs — when provided, the upload API will also update ejercicios_detalles/activity_media in DB
    exerciseId?: string | number | null,
    activityId?: string | number | null,
    mediaId?: string | number | null
) {
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
    const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')

    const getBunnyCdnBaseUrl = useCallback(() => {
        const cdn = process.env.NEXT_PUBLIC_BUNNY_STREAM_CDN_URL
        const fallback = 'https://vz-37d7814d-402.b-cdn.net'
        return typeof cdn === 'string' && cdn.trim() !== '' ? cdn.trim().replace(/\/$/, '') : fallback
    }, [])

    const getBunnyStreamUrl = useCallback((videoId: string) => {
        const cdn = getBunnyCdnBaseUrl()
        return cdn ? `${cdn}/${videoId}/playlist.m3u8` : null
    }, [getBunnyCdnBaseUrl])

    const getBunnyThumbnailUrl = useCallback((videoId: string) => {
        const cdn = getBunnyCdnBaseUrl()
        return cdn ? `${cdn}/${videoId}/thumbnail.jpg` : null
    }, [getBunnyCdnBaseUrl])

    const loadCoachMedia = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch('/api/coach/storage-files', { credentials: 'include' })
            const data = await response.json()

            if (response.ok && data.success && Array.isArray(data.files)) {
                const filteredFiles = data.files.filter((file: any) => file.concept === mediaType) || []

                const convertedMedia: CoachMedia[] = filteredFiles.map((file: any) => {
                    if (mediaType === 'video') {
                        const bunnyId = String(file.fileId || '').trim()
                        return {
                            id: bunnyId || `video-${file.fileName}`,
                            activity_id: file.activities?.[0]?.id || 0,
                            video_url: bunnyId ? getBunnyStreamUrl(bunnyId) : undefined,
                            bunny_video_id: bunnyId || undefined,
                            video_thumbnail_url: bunnyId ? getBunnyThumbnailUrl(bunnyId) : undefined,
                            filename: file.fileName || `video-${(bunnyId || '').slice(0, 8)}`,
                            media_type: 'video' as const,
                            size: file.sizeBytes || undefined,
                            type: 'video/mp4',
                            activity_title: file.activities?.[0]?.name || 'Video',
                            created_at: new Date().toISOString()
                        }
                    }

                    if (mediaType === 'pdf') {
                        return {
                            id: file.fileId || `pdf-${file.fileName}`,
                            activity_id: file.activities?.[0]?.id || 0,
                            pdf_url: file.url || undefined,
                            filename: file.fileName || '',
                            media_type: 'pdf' as const,
                            size: file.sizeBytes || undefined,
                            type: 'application/pdf',
                            activity_title: file.activities?.[0]?.name || 'Documento',
                            created_at: new Date().toISOString()
                        }
                    }

                    // Image
                    return {
                        id: file.fileId || `image-${file.fileName}`,
                        activity_id: file.activities?.[0]?.id || 0,
                        image_url: file.url || undefined,
                        filename: file.fileName || '',
                        media_type: 'image' as const,
                        size: file.sizeBytes || undefined,
                        type: 'image/' + (file.fileName?.split('.').pop()?.toLowerCase() || 'jpeg'),
                        activity_title: file.activities?.[0]?.name || 'Portada',
                        created_at: new Date().toISOString()
                    }
                })

                setMedia(prev => {
                    const tempItems = prev.filter(item => item.id.startsWith('new-'))
                    return tempItems.length > 0 ? [...convertedMedia, ...tempItems] : convertedMedia
                })
            } else {
                setError(data.error || 'Error al cargar contenido')
            }
        } catch (error) {
            setError('Error de conexión')
        } finally {
            setLoading(false)
        }
    }, [mediaType, getBunnyStreamUrl, getBunnyThumbnailUrl])

    useEffect(() => {
        if (isOpen) {
            setSelectedMedia(null)
            setNewMediaFile(null)
            setError(null)
            setPreviewImage(null)
            setPendingUploadUrl(null)
            setPendingUploadFileName(null)
            setIsPreviewPlaying(false)
            setMedia([])
            loadCoachMedia()
        }
    }, [isOpen, mediaType, loadCoachMedia])

    // Logic to sync auto-selection of uploaded item
    useEffect(() => {
        if (pendingUploadUrl && media.length > 0) {
            const uploadedItem = media.find(item => {
                const itemUrl = mediaType === 'image'
                    ? item.image_url
                    : mediaType === 'video'
                        ? item.video_url
                        : item.pdf_url
                return itemUrl === pendingUploadUrl || item.filename === pendingUploadFileName
            })

            if (uploadedItem) {
                setMedia(prev => prev.filter(item => !item.id.startsWith('new-')))
                setPreviewImage(uploadedItem)
                setSelectedMedia(uploadedItem.id)
                setNewMediaFile(null)
                setPendingUploadUrl(null)
                setPendingUploadFileName(null)
            }
        }
    }, [media, pendingUploadUrl, pendingUploadFileName, mediaType])

    const handleUploadFile = async (file: File) => {
        console.log('⬆️ [upload] Iniciando subida a Bunny...', { 
            fileName: file.name, 
            fileSize: file.size,
            exerciseId: exerciseId ?? 'NO PROVISTO',
            activityId: activityId ?? 'NO PROVISTO',
            mediaId: mediaId ?? 'NO PROVISTO'
        })
        setUploading(true)
        setError(null)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('mediaType', mediaType)
            formData.append('category', 'product')
            // Pass DB context IDs so the API can update ejercicios_detalles / activity_media directly
            if (exerciseId) formData.append('exerciseId', String(exerciseId))
            if (activityId) formData.append('activityId', String(activityId))
            if (mediaId) formData.append('mediaId', String(mediaId))

            console.log('⬆️ [upload] FormData params:', { exerciseId, activityId, mediaId })

            // Usar endpoint de Bunny para videos, Supabase para el resto
            const endpoint = mediaType === 'video' ? '/api/bunny/upload-video' : '/api/upload-organized'
            
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData
            })
            const data = await response.json()

            console.log('⬆️ [upload] Respuesta API:', { ok: response.ok, status: response.status, data })

            if (!response.ok) throw new Error(data.error || 'Error al subir')

            const newMediaItem: CoachMedia = {
                id: mediaType === 'video' ? (data.videoId || `new-${Date.now()}`) : `new-${Date.now()}`,
                activity_id: 0,
                image_url: mediaType === 'image' ? data.url : undefined,
                video_url: mediaType === 'video' ? data.streamUrl : undefined,
                pdf_url: mediaType === 'pdf' ? data.url : undefined,
                activity_title: '',
                created_at: new Date().toISOString(),
                filename: (data.fileName || data.originalFileName || file.name) as string,
                media_type: mediaType,
                size: file.size,
                type: file.type,
                bunny_video_id: mediaType === 'video' ? data.videoId : undefined,
                video_thumbnail_url: mediaType === 'video' ? data.thumbnailUrl : undefined
            }

            setMedia(prev => [newMediaItem, ...prev])
            setPreviewImage(newMediaItem)
            setSelectedMedia(newMediaItem.id)
            setNewMediaFile(null)
            setPendingUploadUrl(mediaType === 'video' ? data.streamUrl : data.url)
            setPendingUploadFileName((data.fileName || data.originalFileName || file.name) as string)
            loadCoachMedia()
            
            // Retornar la URL final para uso inmediato
            const resultUrl = mediaType === 'video' ? data.streamUrl : data.url
            console.log('✅ [upload] Subida completada. URL:', resultUrl)
            return resultUrl
        } catch (uploadErr: any) {
            console.error('❌ [upload] Error en subida:', uploadErr)
            setError(uploadErr.message || 'Error al subir el archivo')
            throw uploadErr
        } finally {
            setUploading(false)
        }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const objectUrl = URL.createObjectURL(file)
            
            // Show local preview immediately — upload happens ONLY on confirm
            const tempItem: CoachMedia = {
                id: `temp-${Date.now()}`,
                activity_id: 0,
                image_url: mediaType === 'image' ? objectUrl : undefined,
                video_url: mediaType === 'video' ? objectUrl : undefined,
                activity_title: '',
                created_at: new Date().toISOString(),
                filename: file.name,
                media_type: mediaType as any,
                size: file.size,
                type: file.type || (mediaType === 'image' ? 'image/jpeg' : 'video/mp4')
            }

            setNewMediaFile(file)
            setPreviewImage(tempItem)
            setSelectedMedia(tempItem.id)
        }
    }

    const handleConfirm = async () => {
        console.log('✅ [useMediaSelectionLogic] handleConfirm triggered', { 
            mediaType, selectedMedia, newMediaFile: !!newMediaFile, uploading,
            exerciseId: exerciseId ?? 'NONE', activityId: activityId ?? 'NONE'
        })
        
        if (uploading) return

        // Case 1: New file selected — upload NOW on confirm
        if (newMediaFile && previewImage) {
            const localBlobUrl = mediaType === 'video' ? previewImage.video_url : previewImage.image_url

            // Validate video duration before uploading (use local flag, NOT React state which is stale)
            let durationError: string | null = null
            if (mediaType === 'video') {
                durationError = await new Promise<string | null>((resolve) => {
                    const videoEl = document.createElement('video')
                    videoEl.preload = 'metadata'
                    videoEl.src = localBlobUrl || URL.createObjectURL(newMediaFile)
                    videoEl.onloadedmetadata = () => {
                        if (videoEl.duration > 30) {
                            resolve('El video puede durar como máximo 30 segundos.')
                        } else {
                            resolve(null)
                        }
                    }
                    videoEl.onerror = () => resolve(null) // On error, allow upload anyway
                    // Timeout fallback — if metadata never loads after 3s, proceed
                    setTimeout(() => resolve(null), 3000)
                })
            }

            if (durationError) {
                setError(durationError)
                return
            }

            console.log('⬆️ [useMediaSelectionLogic] Iniciando upload on confirm...')

            try {
                const realUrl = await handleUploadFile(newMediaFile)
                console.log('✅ [useMediaSelectionLogic] Upload completado, URL:', realUrl)
                if (realUrl) {
                    onMediaSelected(realUrl, mediaType, newMediaFile, previewImage.filename)
                } else if (localBlobUrl) {
                    onMediaSelected(localBlobUrl, mediaType, newMediaFile, previewImage.filename)
                }
                onClose()
            } catch (e) {
                console.error('❌ [useMediaSelectionLogic] Upload falló:', e)
                // Error is already set by handleUploadFile
            }
            return
        }

        // Case 2: Gallery selection
        if (selectedMedia && !selectedMedia.toString().startsWith('temp-')) {
            const selectedItem = media.find(item => item.id === selectedMedia)
            const url = selectedItem
                ? (mediaType === 'image' ? selectedItem.image_url : mediaType === 'video' ? selectedItem.video_url : selectedItem.pdf_url)
                : null

            if (url) {
                onMediaSelected(url, mediaType, undefined, selectedItem?.filename)
                onClose()
            }
        }
    }

    return {
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
        isPreviewPlaying,
        setIsPreviewPlaying,
        sourceFilter,
        setSourceFilter,
        handleFileChange,
        handleConfirm,
        loadCoachMedia
    }
}
