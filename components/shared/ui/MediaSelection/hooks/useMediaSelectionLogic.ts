import { useState, useEffect, useCallback } from 'react'
import { MediaType, CoachMedia, SourceFilter } from '../types'

export function useMediaSelectionLogic(
    isOpen: boolean,
    mediaType: MediaType,
    onMediaSelected: (url: string, type: MediaType, file?: File, name?: string) => void,
    onClose: () => void
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
                const itemUrl = mediaType === 'image' ? item.image_url : item.video_url
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
        setUploading(true)
        setError(null)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('mediaType', mediaType)
            formData.append('category', 'product')

            const response = await fetch('/api/upload-organized', {
                method: 'POST',
                body: formData
            })
            const data = await response.json()

            if (!response.ok) throw new Error(data.error || 'Error al subir')

            const newMediaItem: CoachMedia = {
                id: `new-${Date.now()}`,
                activity_id: 0,
                image_url: mediaType === 'image' ? data.url : undefined,
                video_url: mediaType === 'video' ? data.url : undefined,
                activity_title: '',
                created_at: new Date().toISOString(),
                filename: (data.originalFileName || file.name) as string,
                media_type: mediaType,
                size: file.size,
                type: file.type
            }

            setMedia(prev => [newMediaItem, ...prev])
            setPreviewImage(newMediaItem)
            setSelectedMedia(newMediaItem.id)
            setNewMediaFile(null)
            setPendingUploadUrl(data.url)
            setPendingUploadFileName((data.fileName || data.originalFileName || file.name) as string)
            loadCoachMedia()
        } catch (error: any) {
            setError(error.message || 'Error al subir el archivo')
        } finally {
            setUploading(false)
        }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (mediaType === 'image') {
                await handleUploadFile(file)
            } else if (mediaType === 'video') {
                const objectUrl = URL.createObjectURL(file)
                const videoEl = document.createElement('video')
                videoEl.preload = 'metadata'
                videoEl.src = objectUrl
                videoEl.onloadedmetadata = () => {
                    if (videoEl.duration > 30) {
                        setError('El video puede durar como máximo 30 segundos.')
                        return
                    }
                    const tempItem: CoachMedia = {
                        id: `new-${Date.now()}`,
                        activity_id: 0,
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
                    setNewMediaFile(file)
                }
            } else {
                // PDF or others
                setNewMediaFile(file)
                setSelectedMedia(null)
            }
        }
    }

    const handleConfirm = () => {
        if (mediaType === 'video' && newMediaFile) {
            onMediaSelected(URL.createObjectURL(newMediaFile), 'video', newMediaFile, newMediaFile.name)
            onClose()
            return
        }

        if (selectedMedia) {
            const selectedItem = media.find(item => item.id === selectedMedia)
            const url = selectedItem
                ? (mediaType === 'image' ? selectedItem.image_url : mediaType === 'video' ? selectedItem.video_url : selectedItem.pdf_url)
                : null

            if (url) {
                onMediaSelected(url, mediaType, undefined, selectedItem?.filename)
                onClose()
            }
        } else if (newMediaFile) {
            onMediaSelected(URL.createObjectURL(newMediaFile), mediaType, newMediaFile, newMediaFile.name)
            onClose()
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
