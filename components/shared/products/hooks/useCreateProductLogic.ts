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
    PdfSelectionContext,
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
import { useProductNavigation } from './modules/useProductNavigation'
import { useProductPreviewStats } from './modules/useProductPreviewStats'

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
    const getInitialCategory = (): ProgramSubType | null => {
        if (!editingProduct) return null
        const cat = (editingProduct.categoria || editingProduct.category || '').toLowerCase()
        if (cat === 'nutricion' || cat === 'nutrition') return 'nutrition'
        if (cat === 'fitness') return 'fitness'
        // Default based on type
        if (editingProduct.type === 'program') return 'fitness'
        return null
    }

    const [selectedProgramType, setSelectedProgramType] = useState<ProgramSubType | null>(getInitialCategory())
    const [productCategory, setProductCategory] = useState<'fitness' | 'nutricion'>(
        getInitialCategory() === 'nutrition' ? 'nutricion' : 'fitness'
    )

    useEffect(() => {
        console.log('🔍 [useCreateProductLogic] Init:', {
            category: editingProduct?.category,
            categoria: editingProduct?.categoria,
            derivedProductCategory: productCategory,
            isNutritionCheck: (editingProduct?.categoria === 'nutricion' || editingProduct?.categoria === 'nutrition')
        })
    }, [editingProduct, productCategory])


    const {
        currentStep,
        setCurrentStep,
        getStepNumber,
        goToStep
    } = useProductNavigation({
        selectedType,
        initialStep,
        editingProduct
    })

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
        isVideoModalOpen, setIsVideoModalOpen,
        handleVideoSelection: handleVideoSelectionWrapper,
        handleClearExerciseVideo,
        openVideoModal,
        getStoredExerciseVideoFile
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
        handlePdfSelectionChoice, handlePdfSelected: handlePdfSelectedBase
    } = useProductMediaLogic()

    const handlePdfSelectionChoiceWrapper = (choice: 'existing' | 'new', context?: PdfSelectionContext) => {
        const targetContext = context || pendingPdfContext
        if (!targetContext) return

        if (choice === 'new') {
            setShowPdfSelectionModal(false)
            uploadNewPdf(targetContext)
        } else {
            handlePdfSelectionChoice(choice, targetContext)
        }
    }

    const openPdfLibrary = (context: PdfSelectionContext) => {
        setPdfModalContext(context)
        setIsPdfModalOpen(true)
    }

    const uploadNewPdf = (context: PdfSelectionContext) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'application/pdf'
        input.onchange = (e: any) => {
            const file = e.target.files?.[0]
            if (file) {
                handlePdfSelectedBase(
                    URL.createObjectURL(file),
                    'pdf',
                    file,
                    file.name,
                    selectedType,
                    setDocumentMaterial,
                    setWorkshopMaterial,
                    context // Pass context directly
                )
            }
        }
        input.click()
    }

    // Submission Logic
    const {
        isPublishing, setIsPublishing, publishProgress, setPublishProgress, validationErrors, fieldErrors,
        setValidationErrors, setFieldErrors, handlePublishProduct: submitProduct, clearFieldError
    } = useProductSubmission()

    // --- NAVIGATION HELPERS ---
    // Preview Stats Logic
    const { derivedPreviewStats } = useProductPreviewStats({
        selectedType,
        workshopSchedule,
        persistentCalendarSchedule,
        periods
    })

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



    // --- HANDLERS WRAPPERS ---

    const handlePublishProduct = () => {
        console.log('🏁 [useCreateProductLogic] handlePublishProduct triggered', { selectedType })
        if (!selectedType) {
            console.error('❌ [useCreateProductLogic] No selectedType found')
            return
        }

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
        // Deprecated but kept for compatibility if needed elsewhere
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
        openPdfLibrary,
        uploadNewPdf,

        handlePdfSelectionChoice: handlePdfSelectionChoiceWrapper,
        handlePdfSelected: (url: string, type: string, file?: File, name?: string) =>
            handlePdfSelectedBase(url, type, file, name, selectedType, setDocumentMaterial, setWorkshopMaterial, pdfModalContext || undefined),

        loadInlineMedia,
        getBunnyEmbedUrl,
        truncateInlineFileName,

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

        user, planType: planType as PlanType
    }
}
