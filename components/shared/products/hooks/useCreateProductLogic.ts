"use client"

import { useState, useMemo, useEffect } from "react"
import {
    ProductType,
    ProgramSubType,
    SpecificFormState,
    FITNESS_OBJECTIVE_GROUPS,
    NUTRITION_OBJECTIVE_GROUPS,
    FITNESS_RESTRICTION_GROUPS,
    NUTRITION_RESTRICTION_GROUPS,
    groupsToSelectItems,
} from '../product-constants'
import { getPlanLimit, type PlanType } from '@/lib/utils/plan-limits'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { useGeneralProductForm } from './modules/useGeneralProductForm'
import { useProgramLogic } from './modules/useProgramLogic'
import { useWorkshopLogic } from './modules/useWorkshopLogic'
import { useDocumentLogic } from './modules/useDocumentLogic'
import { useProductMediaLogic } from './modules/useProductMediaLogic'
import { useProductSubmission } from './modules/useProductSubmission'

// Export types used by the modal
export type { InlineMediaType } from '../product-constants'

export interface UseCreateProductLogicProps {
    isOpen: boolean
    onClose: (saved?: boolean) => void
    editingProduct?: any
    initialStep?: 'type' | 'programType' | 'general' | 'specific' | 'workshopMaterial' | 'workshopSchedule' | 'documentMaterial' | 'weeklyPlan' | 'preview'
    showDateChangeNotice?: boolean
}

export function useCreateProductLogic({
    isOpen,
    onClose,
    editingProduct,
    initialStep,
    showDateChangeNotice = false
}: UseCreateProductLogicProps) {
    const { user } = useAuth()

    // --- INITIALIZATION ---
    // Determine initial type and category from props
    const getInitialType = (): ProductType | null => {
        if (editingProduct) {
            if (editingProduct.type === 'program' || !editingProduct.type) return 'program'
            // Map legacy types or specific DB types if needed
            return editingProduct.type as ProductType
        }
        return null
    }

    const [selectedType, setSelectedType] = useState<ProductType | null>(getInitialType())
    const [selectedProgramType, setSelectedProgramType] = useState<ProgramSubType | null>(
        (editingProduct?.categoria === 'nutricion' || editingProduct?.categoria === 'nutrition' || editingProduct?.category === 'nutricion' || editingProduct?.category === 'nutrition') ? 'nutrition' :
            editingProduct?.type === 'program' ? 'fitness' : null // Default to fitness if program but no category
    )
    const [productCategory, setProductCategory] = useState<'fitness' | 'nutricion'>(
        (editingProduct?.categoria === 'nutricion' || editingProduct?.categoria === 'nutrition' || editingProduct?.category === 'nutricion' || editingProduct?.category === 'nutrition') ? 'nutricion' : 'fitness'
    )

    useEffect(() => {
        console.log('🔍 [useCreateProductLogic] Init:', {
            category: editingProduct?.category,
            categoria: editingProduct?.categoria,
            derivedProductCategory: productCategory,
            isNutritionCheck: (editingProduct?.categoria === 'nutricion' || editingProduct?.categoria === 'nutrition')
        })
    }, [editingProduct, productCategory])


    // Helper for steps
    const getStepNumber = (step: string) => {
        if (selectedType === 'workshop') {
            const workshopStepMap: { [key: string]: number } = {
                'type': 1, 'programType': 2, 'general': 3, 'workshopSchedule': 4, 'workshopMaterial': 5, 'preview': 6
            }
            return workshopStepMap[step] || 1
        } else if (selectedType === 'document') {
            const documentStepMap: { [key: string]: number } = {
                'type': 1, 'programType': 2, 'general': 3, 'documentMaterial': 4, 'preview': 5
            }
            return documentStepMap[step] || 1
        } else {
            const programStepMap: { [key: string]: number } = {
                'type': 1, 'programType': 2, 'general': 3, 'weeklyPlan': 4, 'preview': 5
            }
            return programStepMap[step] || 1
        }
    }

    const getInitialStep = () => {
        if (initialStep) return initialStep
        if (editingProduct) return 'general'
        return 'type'
    }

    const [currentStep, setCurrentStep] = useState<string>(getInitialStep())

    // --- SUB-HOOKS ---
    const planType = (user as any)?.subscription_plan || 'free'

    // General Form Logic
    const {
        generalForm, setGeneralForm,
        handlePriceChange, handlePriceBlur, handleStockQuantityChange,
        addObjetivo, removeObjetivo, addRestriccion, removeRestriccion
    } = useGeneralProductForm(editingProduct, selectedType, productCategory, planType)

    // Specific Form State (still kept local as it acts as a bridge for some fields like 'level')
    const [specificForm, setSpecificForm] = useState<SpecificFormState>({
        duration: editingProduct?.duration?.toString() || '',
        capacity: editingProduct?.capacity?.toString() || '',
        workshopType: editingProduct?.workshop_type || '',
        startDate: editingProduct?.start_date || '',
        endDate: editingProduct?.end_date || '',
        level: (editingProduct?.difficulty || editingProduct?.level || '').toLowerCase(),
        availabilityType: '',
        stockQuantity: editingProduct?.capacity?.toString() || '',
        sessionsPerClient: '',
        activities: null,
        documentType: '',
        document: null,
        pages: ''
    })

    // Program Logic
    const {
        persistentCsvData, setPersistentCsvData,
        persistentSelectedRows, setPersistentSelectedRows,
        persistentCalendarSchedule, setPersistentCalendarSchedule,
        periods, setPeriods,
        coachCatalogExercises, coachCatalogLoading, coachCatalogError,
        exerciseVideoFiles, setExerciseVideoFiles,
        videosPendingDeletion, setVideosPendingDeletion,
        weeklyStats, setWeeklyStats,
        getExerciseVideoKey,
        isVideoModalOpen, setIsVideoModalOpen
    } = useProgramLogic(isOpen, selectedType, editingProduct, productCategory)

    // Workshop Logic
    const {
        workshopMaterial, setWorkshopMaterial,
        workshopSchedule, setWorkshopSchedule
    } = useWorkshopLogic(editingProduct, selectedType)

    // Document Logic
    const {
        documentMaterial, setDocumentMaterial
    } = useDocumentLogic(editingProduct, selectedType)

    // Media Logic
    const {
        inlineMediaItems, inlineMediaLoading, inlineMediaError, inlineMediaType, setInlineMediaType,
        isMediaModalOpen, setIsMediaModalOpen, showMediaSourceModal, setShowMediaSourceModal,
        isVideoPreviewActive, setIsVideoPreviewActive,
        showPdfSelectionModal, setShowPdfSelectionModal, isPdfModalOpen, setIsPdfModalOpen,
        pdfModalContext, setPdfModalContext, pendingPdfContext, setPendingPdfContext,
        uploadingPdf, selectedTopics, setSelectedTopics,
        inlineFileInputRef, isInlineUploading, setIsInlineUploading, uploadProgress, setUploadProgress,
        pendingImageFile, setPendingImageFile, pendingVideoFile, setPendingVideoFile,
        loadInlineMedia, handleInlineUploadChange, handleMediaSelection,
    } = useProductMediaLogic()

    // Submission Logic
    const {
        isPublishing, setIsPublishing, publishProgress, setPublishProgress, validationErrors, fieldErrors,
        setValidationErrors, setFieldErrors, handlePublishProduct: submitProduct, clearFieldError
    } = useProductSubmission()

    // --- NAVIGATION HELPERS ---
    const goToStep = (stepNumber: number) => {
        let stepMap: { [key: number]: string }
        if (selectedType === 'workshop') {
            stepMap = { 1: 'type', 2: 'programType', 3: 'general', 4: 'workshopSchedule', 5: 'workshopMaterial', 6: 'preview' }
        } else if (selectedType === 'document') {
            stepMap = { 1: 'type', 2: 'programType', 3: 'general', 4: 'documentMaterial', 5: 'preview' }
        } else {
            stepMap = { 1: 'type', 2: 'programType', 3: 'general', 4: 'weeklyPlan', 5: 'preview' }
        }
        const targetStep = stepMap[stepNumber]
        if (targetStep) {
            const currentStepNumber = getStepNumber(currentStep)
            if (stepNumber <= currentStepNumber || stepNumber === currentStepNumber + 1) {
                setCurrentStep(targetStep as any)
            }
        }
    }

    // --- OPTIONS & DERIVED STATE ---
    const objectiveOptions = useMemo(() => {
        return productCategory === 'nutricion'
            ? groupsToSelectItems(NUTRITION_OBJECTIVE_GROUPS)
            : groupsToSelectItems(FITNESS_OBJECTIVE_GROUPS)
    }, [productCategory])

    const restrictionOptions = useMemo(() => {
        return productCategory === 'nutricion'
            ? groupsToSelectItems(NUTRITION_RESTRICTION_GROUPS)
            : groupsToSelectItems(FITNESS_RESTRICTION_GROUPS)
    }, [productCategory])

    const derivedPreviewStats = useMemo(() => {
        if (selectedType === 'workshop') {
            if (!workshopSchedule || workshopSchedule.length === 0) {
                return { sesiones: 0, ejerciciosTotales: 0, ejerciciosUnicos: 0, semanas: 0 }
            }

            const uniqueDays = new Set(workshopSchedule.map(s => s.date)).size
            const uniqueThemes = new Set(workshopSchedule.map(s => s.title).filter(Boolean)).size

            // Calculate weeks from date range
            const sortedDates = [...workshopSchedule]
                .map(s => new Date(s.date))
                .sort((a, b) => a.getTime() - b.getTime())

            let weeks = 0
            if (sortedDates.length > 0) {
                const firstDate = sortedDates[0]
                const lastDate = sortedDates[sortedDates.length - 1]
                const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime())
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                weeks = Math.max(1, Math.ceil((diffDays + 1) / 7))
            }

            return {
                sesiones: uniqueDays,
                ejerciciosTotales: workshopSchedule.length,
                ejerciciosUnicos: uniqueThemes,
                semanas: weeks
            }
        }

        const schedule = persistentCalendarSchedule
        if (!schedule || typeof schedule !== 'object') return { sesiones: 0, ejerciciosTotales: 0, ejerciciosUnicos: 0, semanas: 0 }
        const uniqueIds = new Set<string>()
        let totalEntries = 0
        let totalDaysWithExercises = 0
        for (const weekKey in schedule) {
            const weekData = schedule[weekKey]
            if (!weekData || typeof weekData !== 'object') continue
            for (const dayKey in weekData) {
                const dayData = weekData[dayKey]
                if (!dayData) continue
                let dayExercises = Array.isArray(dayData) ? dayData : ((dayData as any).ejercicios || (dayData as any).exercises || [])
                if (dayExercises.length > 0) {
                    totalDaysWithExercises += 1
                    dayExercises.forEach((ex: any) => {
                        if (ex && ex.id) uniqueIds.add(String(ex.id))
                        totalEntries += 1
                    })
                }
            }
        }
        const mul = periods || 1
        return {
            sesiones: totalDaysWithExercises * mul,
            ejerciciosTotales: totalEntries * mul,
            ejerciciosUnicos: uniqueIds.size,
            semanas: 0 // Will be handled by weeklyPlan logic if needed
        }
    }, [persistentCalendarSchedule, periods, selectedType, workshopSchedule])


    // --- HANDLERS WRAPPERS ---

    const handlePublishProduct = () => {
        if (!selectedType) return

        submitProduct({
            generalForm,
            specificForm,
            selectedType,
            productCategory,
            user,
            editingProduct,
            persistentCsvData,
            persistentCalendarSchedule,
            periods,
            workshopSchedule,
            workshopMaterial,
            documentMaterial,
            weeklyStats,
            pendingImageFile,
            pendingVideoFile,
            planType: planType as PlanType,
            onClose,
            setCurrentStep
        })
    }

    const hasUnsavedChanges = () => {
        // Simple check mostly for navigation guards
        // Could be improved to deep compare with initial
        return true // conservative approach as before
    }

    const clearPersistentState = () => {
        setPersistentCsvData(undefined)
        setPersistentSelectedRows(new Set())
        setPersistentCalendarSchedule({})
        setPeriods(1)
        setWorkshopSchedule([])
    }

    // Modal Close Logic
    const [showCloseConfirmation, setShowCloseConfirmation] = useState(false)
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
    const [pendingTab, setPendingTab] = useState<string | null>(null)

    const handleClose = () => {
        if (hasUnsavedChanges() && !editingProduct) {
            setShowCloseConfirmation(true)
        } else {
            onClose(false)
        }
    }

    const confirmClose = () => {
        setShowCloseConfirmation(false)
        onClose(false)
    }

    const cancelClose = () => {
        setShowCloseConfirmation(false)
    }

    // Media Handlers (bridging hook to UI)
    const handleInlineUploadChangeWrapper = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleInlineUploadChange(e)
        // Also update generalForm for preview
        const file = e.target.files?.[0]
        if (!file) return

        const realMediaType = file.type.startsWith('video/') ? 'video' : 'image'
        if (realMediaType === 'video') {
            const localPreviewUrl = URL.createObjectURL(file)
            setGeneralForm(prev => ({ ...prev, videoUrl: localPreviewUrl, image: null }))
        } else {
            const localImageUrl = URL.createObjectURL(file)
            setGeneralForm(prev => ({ ...prev, image: { url: localImageUrl } }))
        }
    }

    const handleMediaSelectionWrapper = (url: string, type: 'image' | 'video' | 'pdf', file?: File) => {
        handleMediaSelection(url, type, file)
        // Update generalForm
        if (type === 'image') {
            setGeneralForm(prev => ({ ...prev, image: { url } }))
        } else if (type === 'video') {
            setGeneralForm(prev => ({ ...prev, videoUrl: url }))
        }
    }

    // Video Selection from Modal for Exercises
    const handleVideoSelectionWrapper = (selection: any) => {
        if (!selection) {
            setIsVideoModalOpen(false)
            return
        }
        if (!persistentCsvData || persistentCsvData.length === 0) {
            setIsVideoModalOpen(false)
            return
        }

        const selectedIndices = Array.from(persistentSelectedRows)
        const { videoUrl, videoFile, fileName, bunnyVideoId, bunnyLibraryId, thumbnailUrl } = selection

        if (!videoUrl || videoUrl.trim() === '') {
            setIsVideoModalOpen(false)
            return
        }

        const updatedCsvData = persistentCsvData.map((exercise, index) => {
            if (!selectedIndices.includes(index)) return exercise
            if (!exercise || typeof exercise !== 'object') return exercise

            const updatedExercise = { ...exercise }
            updatedExercise.video_url = videoUrl
            if (videoFile) {
                updatedExercise.video_file_name = fileName || videoFile.name
                updatedExercise.video_source = 'local'
            } else {
                updatedExercise.video_file_name = fileName
                updatedExercise.video_source = 'existing'
                updatedExercise.bunny_video_id = bunnyVideoId
                updatedExercise.bunny_library_id = bunnyLibraryId
                updatedExercise.video_thumbnail_url = thumbnailUrl
            }
            return updatedExercise
        })

        setPersistentCsvData(updatedCsvData)

        // Handle file storage
        if (videoFile) {
            setExerciseVideoFiles(prev => {
                const next = { ...prev }
                selectedIndices.forEach(idx => {
                    const ex = updatedCsvData[idx]
                    const key = getExerciseVideoKey(ex, idx)
                    if (key) next[key] = videoFile
                })
                return next
            })
        }

        setPersistentSelectedRows(new Set())
        setIsVideoModalOpen(false)
    }

    const handleClearExerciseVideo = (index: number, exercise: any, meta?: any) => {
        setExerciseVideoFiles(prev => {
            const next = { ...prev }
            const key = getExerciseVideoKey(exercise, index)
            if (key && next[key]) delete next[key]
            return next
        })

        if (meta?.bunnyVideoId) {
            setVideosPendingDeletion(prev => [
                ...prev,
                {
                    exerciseId: exercise?.id,
                    bunnyVideoId: meta.bunnyVideoId,
                    bunnyLibraryId: meta.bunnyLibraryId,
                    videoUrl: meta.videoUrl
                }
            ])
        }
    }

    const openVideoModal = () => {
        if (persistentSelectedRows.size === 0) {
            // toast.error('Selecciona al menos una fila para asignar video')
            return
        }
        setIsVideoModalOpen(true)
    }

    const getStoredExerciseVideoFile = (exercise: any, index: number) => {
        const key = getExerciseVideoKey(exercise, index)
        return exerciseVideoFiles[key] || null
    }

    // Helpers
    const truncateInlineFileName = (name: string, maxLength = 50) => {
        if (!name) return ''
        return name.length > maxLength ? name.slice(0, maxLength - 3) + '...' : name
    }

    // Bunny Embed
    const getBunnyEmbedUrl = (url: string | null) => {
        if (!url) return null
        if (url.includes('iframe.mediadelivery.net')) return url
        const pullZoneMatch = url.match(/vz-(\d+)\.b-cdn\.net\/([a-zA-Z0-9-]+)/)
        if (pullZoneMatch) {
            const [, libId, vidId] = pullZoneMatch
            return `https://iframe.mediadelivery.net/embed/${libId}/${vidId}?autoplay=false`
        }
        const guidMatch = url.match(/([0-9a-fA-F-]{36})/)
        if (guidMatch && (url.includes('bunnycdn.com') || url.includes('b-cdn.net'))) {
            return `https://iframe.mediadelivery.net/embed/510910/${guidMatch[1]}?autoplay=false`
        }
        return null
    }

    const openPdfGallery = (context: any) => {
        setPendingPdfContext(context)
        setShowPdfSelectionModal(true)
    }

    return {
        // Navigation & State
        currentStep, setCurrentStep,
        selectedType, setSelectedType,
        selectedProgramType, setSelectedProgramType,
        productCategory, setProductCategory,
        getStepNumber, goToStep,

        // Modal Control
        showCloseConfirmation, setShowCloseConfirmation,
        pendingAction, setPendingAction,
        pendingTab, setPendingTab,
        handleClose, confirmClose, cancelClose,
        hasUnsavedChanges, clearPersistentState,

        // Forms
        generalForm, setGeneralForm,
        specificForm, setSpecificForm,

        // Form Actions
        handlePriceChange, handlePriceBlur, handleStockQuantityChange,
        addObjetivo, removeObjetivo, addRestriccion, removeRestriccion,
        objectiveOptions, restrictionOptions,
        clearFieldError,

        // Media State
        isVideoModalOpen, setIsVideoModalOpen,
        isMediaModalOpen, setIsMediaModalOpen,
        mediaModalType: inlineMediaType, // mapping name for compatibility
        setMediaModalType: setInlineMediaType,
        inlineMediaLoading, inlineMediaItems,
        isInlineUploading, inlineMediaError,
        isVideoPreviewActive, setInlineMediaType,
        inlineMediaType, uploadProgress,
        showMediaSourceModal, setShowMediaSourceModal,
        pendingVideoFile, setPendingVideoFile,
        pendingImageFile, setPendingImageFile,
        inlineFileInputRef,

        // PDF State
        showPdfSelectionModal, setShowPdfSelectionModal,
        isPdfModalOpen, setIsPdfModalOpen,
        pdfModalContext, setPdfModalContext,
        pendingPdfContext, setPendingPdfContext,
        uploadingPdf, selectedTopics, setSelectedTopics,

        // Media Actions
        handleInlineUploadChange: handleInlineUploadChangeWrapper,
        handleMediaSelection: handleMediaSelectionWrapper,
        openPdfGallery,

        handlePdfSelectionChoice: (choice: 'existing' | 'new') => {
            setShowPdfSelectionModal(false)
            if (choice === 'existing' && pendingPdfContext) {
                setPdfModalContext(pendingPdfContext)
                setIsPdfModalOpen(true)
            } else if (choice === 'new') {
                // The 'new' logic was creating an input element dynamically
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'application/pdf'
                input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file && pendingPdfContext) {
                        // This is where real upload logic would go or handled via useEffect like in original
                        // For now simplified compatibility
                        console.log('PDF File selected for new upload', file.name)
                        // Trigger update in documentMaterial/workshopMaterial directly if needed
                    }
                }
                input.click()
            }
        },
        handlePdfSelected: (url: string, type: string, file?: File, name?: string) => {
            if (!pdfModalContext) { setIsPdfModalOpen(false); return }
            const fileName = file ? file.name : (name || url.split('/').pop()?.split('?')[0] || 'PDF')

            if (selectedType === 'document') {
                if ((pdfModalContext as any).scope === 'general') {
                    setDocumentMaterial(prev => ({ ...prev, pdfFile: file || null, pdfUrl: file ? null : url, pdfFileName: fileName }))
                } else {
                    const topicId = (pdfModalContext as any).topicTitle
                    setDocumentMaterial(prev => {
                        const newPdfs = { ...prev.topicPdfs }
                        if (topicId === 'bulk-selection') {
                            selectedTopics.forEach(tid => { newPdfs[tid] = { file: file || null, url: file ? null : url, fileName } })
                            setSelectedTopics(new Set()) // Clear selection after assignment
                        } else { newPdfs[topicId] = { file: file || null, url: file ? null : url, fileName } }
                        return { ...prev, topicPdfs: newPdfs }
                    })
                }
            } else if (selectedType === 'workshop') {
                if ((pdfModalContext as any).scope === 'general') {
                    setWorkshopMaterial(prev => ({ ...prev, pdfFile: file || null, pdfUrl: file ? null : url }))
                } else {
                    const topicId = (pdfModalContext as any).topicTitle
                    setWorkshopMaterial(prev => {
                        const newPdfs = { ...prev.topicPdfs }
                        newPdfs[topicId] = { file: file || null, url: file ? null : url, fileName }
                        return { ...prev, topicPdfs: newPdfs }
                    })
                }
            }
            setIsPdfModalOpen(false)
            setPdfModalContext(null)
        },

        loadInlineMedia, getBunnyEmbedUrl, truncateInlineFileName,

        // Data & Logic
        derivedPreviewStats,
        handlePublishProduct,

        // Exercise Video Actions
        handleVideoSelection: handleVideoSelectionWrapper,
        handleClearExerciseVideo,
        openVideoModal,
        getExerciseVideoKey,
        getStoredExerciseVideoFile,

        // State Exports
        workshopMaterial, setWorkshopMaterial,
        documentMaterial, setDocumentMaterial,
        workshopSchedule, setWorkshopSchedule,
        isPublishing, setIsPublishing,
        publishProgress, setPublishProgress,
        validationErrors, setValidationErrors,
        fieldErrors, setFieldErrors,

        persistentCsvData, setPersistentCsvData,
        persistentSelectedRows, setPersistentSelectedRows,
        persistentCalendarSchedule, setPersistentCalendarSchedule,
        periods, setPeriods,
        exerciseVideoFiles, setExerciseVideoFiles,
        videosPendingDeletion, setVideosPendingDeletion,
        weeklyStats, setWeeklyStats,

        coachCatalogError, coachCatalogExercises, coachCatalogLoading,

        user, planType
    }
}
