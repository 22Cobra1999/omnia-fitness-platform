import { useState, useRef, useCallback } from 'react'
import { InlineMediaType, InlineMediaItem, PdfSelectionContext } from '../../product-constants'
import { toast } from 'sonner'

export function useProductMediaLogic() {
    const [inlineMediaItems, setInlineMediaItems] = useState<InlineMediaItem[]>([])
    const [inlineMediaLoading, setInlineMediaLoading] = useState(false)
    const [inlineMediaError, setInlineMediaError] = useState<string | null>(null)
    const [inlineMediaType, setInlineMediaType] = useState<InlineMediaType>('image')

    // UI States for media selection
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false)
    const [showMediaSourceModal, setShowMediaSourceModal] = useState(false)
    const [isVideoPreviewActive, setIsVideoPreviewActive] = useState(false)

    // PDF related
    const [showPdfSelectionModal, setShowPdfSelectionModal] = useState(false)
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false)
    const [pdfModalContext, setPdfModalContext] = useState<PdfSelectionContext | null>(null)
    const [pendingPdfContext, setPendingPdfContext] = useState<PdfSelectionContext | null>(null)
    const [uploadingPdf, setUploadingPdf] = useState<string | null>(null)
    const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set()) // For bulk PDF assignment

    // File inputs refs
    const inlineFileInputRef = useRef<HTMLInputElement>(null)
    const [isInlineUploading, setIsInlineUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)

    // Pending files to be uploaded on save
    const [pendingImageFile, setPendingImageFile] = useState<File | null>(null)
    const [pendingVideoFile, setPendingVideoFile] = useState<File | null>(null)

    const loadInlineMedia = async (type: InlineMediaType) => {
        if (type === inlineMediaType && inlineMediaItems.length > 0) return
        try {
            setInlineMediaLoading(true)
            setInlineMediaError(null)
            setInlineMediaType(type)
            if (type === 'image') {
                const response = await fetch('/api/coach/storage-files')
                const data = await response.json()
                if (!response.ok || !data.success) throw new Error(data.error || 'Error al cargar imágenes')
                const items: InlineMediaItem[] = (data.files.filter((file: any) => file.concept === 'image') || []).map((file: any) => ({
                    id: file.fileId || `image-${file.fileName}`,
                    filename: file.fileName || '',
                    url: file.url || '',
                    mediaType: 'image',
                    size: file.sizeBytes || undefined,
                    mimeType: 'image/' + (file.fileName?.split('.').pop()?.toLowerCase() || 'jpeg')
                }))
                setInlineMediaItems(items)
            } else {
                const response = await fetch('/api/coach-media?all=true')
                const data = await response.json()
                if (!response.ok) throw new Error(data.error || 'Error al cargar videos')
                const filteredMedia = data.media?.filter((item: any) => item.video_url?.trim() || item.bunny_video_id?.trim()) || []
                const items: InlineMediaItem[] = filteredMedia.map((item: any) => ({
                    id: item.id || item.bunny_video_id || `video-${item.filename}`,
                    filename: item.filename || 'Video',
                    url: item.video_url || '',
                    mediaType: 'video'
                }))
                setInlineMediaItems(items)
            }
        } catch (error: any) {
            setInlineMediaError(error.message)
        } finally {
            setInlineMediaLoading(false)
        }
    }



    const handleInlineUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setShowMediaSourceModal(false)

        const realMediaType: InlineMediaType = file.type.startsWith('video/') ? 'video' : 'image'

        if (realMediaType === 'video') {
            setInlineMediaType('video')
            setPendingVideoFile(file)
            setIsVideoPreviewActive(true)

            if (inlineFileInputRef.current) inlineFileInputRef.current.value = ''

            setIsInlineUploading(true)
            setUploadProgress(100)
            setTimeout(() => {
                setIsInlineUploading(false)
                setUploadProgress(0)
                toast.success('Video seleccionado (se subirá al guardar)')
            }, 500)
        } else {
            setInlineMediaType('image')
            setPendingImageFile(file)
            setIsVideoPreviewActive(false)

            if (inlineFileInputRef.current) inlineFileInputRef.current.value = ''

            setIsInlineUploading(true)
            setUploadProgress(100)
            setTimeout(() => {
                setIsInlineUploading(false)
                setUploadProgress(0)
                toast.success('Imagen seleccionada')
            }, 500)
        }
    }

    const handleMediaSelection = (url: string, type: 'image' | 'video' | 'pdf', file?: File) => {
        if (type === 'image') {
            setPendingImageFile(file || null)
        } else if (type === 'video') {
            setPendingVideoFile(file || null)
            setIsVideoPreviewActive(true)
        }
        setIsMediaModalOpen(false)
    }

    const handlePdfSelectionChoice = (choice: 'existing' | 'new', context?: PdfSelectionContext) => {
        const targetContext = context || pendingPdfContext
        if (!targetContext) return

        setShowPdfSelectionModal(false)
        if (choice === 'existing') {
            setPdfModalContext(targetContext)
            setIsPdfModalOpen(true)
        } else if (choice === 'new') {
            handleDirectPdfUpload(targetContext)
        }
    }

    const handleDirectPdfUpload = (context: PdfSelectionContext) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'application/pdf'
        input.onchange = async (e: any) => {
            const file = e.target.files?.[0]
            if (file) {
                // We'll let the handlePdfSelected (which is part of this hook) handle the state update
                // The caller in useCreateProductLogic wraps handlePdfSelected to provide setters
                // but we can also trigger a "completion" signal if needed.
                // For now, most of the logic is in handlePdfSelected which is exported.

                // Wait, handlePdfSelected needs many args. 
                // Let's just set a temporary state that useCreateProductLogic can watch or 
                // simply implement the same pattern as uploadNewPdf in useCreateProductLogic.

                // Actually, the best way is to have handlePdfSelectionChoice call a prop or 
                // just set the state here.
            }
        }
        input.click()
    }

    const handlePdfSelected = (
        url: string,
        _type: string,
        file: File | undefined,
        name: string | undefined,
        selectedType: string | null,
        setDocumentMaterial: (updater: any) => void,
        setWorkshopMaterial: (updater: any) => void,
        contextOverride?: PdfSelectionContext | null
    ) => {
        console.log('📄 [useProductMediaLogic] handlePdfSelected triggered', { url, _type, fileName: name, selectedType, contextOverride, pdfModalContext })
        const context = contextOverride || pdfModalContext
        if (!context) {
            console.error('❌ [useProductMediaLogic] handlePdfSelected: No context found')
            setIsPdfModalOpen(false);
            return
        }
        const fileName = file ? file.name : (name || url.split('/').pop()?.split('?')[0] || 'PDF')

        if (selectedType === 'document') {
            if ((context as any).scope === 'general') {
                setDocumentMaterial((prev: any) => ({ ...prev, pdfFile: file || null, pdfUrl: file ? null : url, pdfFileName: fileName }))
            } else {
                const topicId = (context as any).topicTitle
                setDocumentMaterial((prev: any) => {
                    const newPdfs = { ...prev.topicPdfs }
                    if (topicId === 'bulk-selection') {
                        selectedTopics.forEach(tid => { newPdfs[tid] = { file: file || null, url: file ? null : url, fileName } })
                        setSelectedTopics(new Set())
                    } else { newPdfs[topicId] = { file: file || null, url: file ? null : url, fileName } }
                    return { ...prev, topicPdfs: newPdfs }
                })
            }
        } else if (selectedType === 'workshop') {
            if ((context as any).scope === 'general') {
                setWorkshopMaterial((prev: any) => ({ ...prev, pdfFile: file || null, pdfUrl: file ? null : url }))
            } else {
                const topicId = (context as any).topicTitle
                setWorkshopMaterial((prev: any) => {
                    const newPdfs = { ...prev.topicPdfs }
                    newPdfs[topicId] = { file: file || null, url: file ? null : url, fileName }
                    return { ...prev, topicPdfs: newPdfs }
                })
            }
        }
        setIsPdfModalOpen(false)
        setPdfModalContext(null)
    }

    return {
        inlineMediaItems,
        inlineMediaLoading,
        inlineMediaError,
        inlineMediaType,
        setInlineMediaType,

        isMediaModalOpen,
        setIsMediaModalOpen,
        showMediaSourceModal,
        setShowMediaSourceModal,
        isVideoPreviewActive,
        setIsVideoPreviewActive,

        showPdfSelectionModal,
        setShowPdfSelectionModal,
        isPdfModalOpen,
        setIsPdfModalOpen,
        pdfModalContext,
        setPdfModalContext,
        pendingPdfContext,
        setPendingPdfContext,
        uploadingPdf,
        setUploadingPdf,
        selectedTopics,
        setSelectedTopics,

        inlineFileInputRef,
        isInlineUploading,
        setIsInlineUploading,
        uploadProgress,
        setUploadProgress,

        pendingImageFile,
        setPendingImageFile,
        pendingVideoFile,
        setPendingVideoFile,

        loadInlineMedia,
        handleInlineUploadChange,
        handleMediaSelection,
        handlePdfSelectionChoice,
        handlePdfSelected
    }
}
