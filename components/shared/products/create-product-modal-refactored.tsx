"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ChevronDown, Plus, Upload, Calendar, FileText, Eye, Edit, Trash2, Eye as EyeIcon, EyeOff, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ProductPreviewCard } from '@/components/shared/products/product-preview-card'
import ActivityCard from '@/components/shared/activities/ActivityCard'
import { WorkshopScheduleManager } from '@/components/shared/calendar/workshop-schedule-manager'
import { VideoSelectionModal, VideoSelectionResult } from '@/components/shared/ui/video-selection-modal'
import { MediaSelectionModal } from '@/components/shared/ui/media-selection-modal'
import { StepTypeSelector } from './components/step-type-selector'
import { StepProgramType } from './components/step-program-type'
import { StepGeneralForm } from './components/step-general-form'
import { WorkshopMaterialStep } from './wizard-steps/workshop-material-step'
import { DocumentMaterialStep } from './wizard-steps/document-material-step'
import { PreviewStep } from './wizard-steps/preview-step'
import { WeeklyPlanStep } from './wizard-steps/weekly-plan-step'
import { WorkshopScheduleStep } from './wizard-steps/workshop-schedule-step'
import { WizardHeader } from './components/wizard-header'
import { WizardFooter } from './components/wizard-footer'
import { SourceSelectionModal, PdfChoiceModal, CloseConfirmationModal } from './components/wizard-dialogs'
import {
  PLAN_COMMISSIONS,
  PLAN_LABELS,
  INTENSITY_CHOICES,
  MODALITY_CHOICES,
  ProductType,
  ProgramSubType,
  groupsToSelectItems,
  splitSemicolonList,
  FITNESS_OBJECTIVE_GROUPS,
  NUTRITION_OBJECTIVE_GROUPS,
  FITNESS_RESTRICTION_GROUPS,
  NUTRITION_RESTRICTION_GROUPS,
  DocumentMaterialState,
  WorkshopMaterialState,
  GeneralFormState,
  SpecificFormState,
  PdfSelectionContext,
  DeliveryModality
} from './product-constants'
import { WorkshopSimpleScheduler } from '@/components/shared/calendar/workshop-simple-scheduler'
import { CSVManagerEnhanced } from '@/components/shared/csv/csv-manager-enhanced'
import CalendarScheduleManager from '@/components/shared/calendar/calendar-schedule-manager'
import { getPlanLimit, type PlanType } from '@/lib/utils/plan-limits'
import { toast } from 'sonner'
// Components removed - functionality to be reimplemented if needed
// import { ModalHeader } from "@/components/product-form-sections/modal-header"
// import { GeneralInfoSection } from "@/components/product-form-sections/general-info-section"
// import { SpecificDetailsSection } from "@/components/product-form-sections/specific-details-section"
// import { GeneralInfoSectionMinimal } from "@/components/product-form-sections/general-info-section-minimal"
// import { SpecificDetailsSectionMinimal } from "@/components/product-form-sections/specific-details-section-minimal"
// import { ProgressiveForm } from "@/components/product-form-sections/progressive-form"
import { WeeklyExercisePlanner } from "../activities/weekly-exercise-planner"
// import { useCSVManagement } from '@/hooks/shared/use-csv-management'
import { useAuth } from '@/contexts/auth-context'
import { useCreateProductLogic, type InlineMediaType } from './hooks/useCreateProductLogic'

interface CreateProductModalProps {
  isOpen: boolean
  onClose: (saved?: boolean) => void
  editingProduct?: any
  initialStep?: 'type' | 'programType' | 'general' | 'specific' | 'workshopMaterial' | 'workshopSchedule' | 'documentMaterial' | 'weeklyPlan' | 'preview'
  showDateChangeNotice?: boolean
}



export default function CreateProductModal({ isOpen, onClose, editingProduct, initialStep, showDateChangeNotice = false }: CreateProductModalProps) {
  const {
    currentStep,
    setCurrentStep,
    selectedType,
    setSelectedType,
    selectedProgramType,
    setSelectedProgramType,
    productCategory,
    setProductCategory,
    getStepNumber,
    goToStep,
    showCloseConfirmation,
    setShowCloseConfirmation,
    pendingAction,
    setPendingAction,
    pendingTab,
    setPendingTab,
    generalForm,
    setGeneralForm,
    specificForm,
    setSpecificForm,
    addObjetivo,
    removeObjetivo,
    addRestriccion,
    removeRestriccion,
    objectiveOptions,
    restrictionOptions,
    isVideoModalOpen,
    setIsVideoModalOpen,
    isMediaModalOpen,
    setIsMediaModalOpen,
    mediaModalType,
    setMediaModalType,
    inlineMediaLoading,
    inlineMediaItems,
    isInlineUploading,
    inlineMediaError,
    isVideoPreviewActive,
    setInlineMediaType,
    inlineMediaType,
    uploadProgress,
    showMediaSourceModal,
    setShowMediaSourceModal,
    pendingVideoFile,
    setPendingVideoFile,
    pendingImageFile,
    setPendingImageFile,
    showPdfSelectionModal,
    setShowPdfSelectionModal,
    isPdfModalOpen,
    setIsPdfModalOpen,
    pdfModalContext,
    setPdfModalContext,
    pendingPdfContext,
    setPendingPdfContext,
    uploadingPdf,
    selectedTopics,
    setSelectedTopics,
    handleInlineUploadChange,
    handleMediaSelection,
    openPdfGallery,
    handlePdfSelectionChoice,
    handlePdfSelected,
    handleClose,
    confirmClose,
    cancelClose,
    clearPersistentState,
    hasUnsavedChanges,
    getBunnyEmbedUrl,
    truncateInlineFileName,
    clearFieldError,
    loadInlineMedia,
    derivedPreviewStats,
    handlePublishProduct,
    handleVideoSelection,
    handleClearExerciseVideo,
    openVideoModal,
    getExerciseVideoKey,
    getStoredExerciseVideoFile,
    handlePriceChange,
    handlePriceBlur,
    handleStockQuantityChange,
    workshopMaterial,
    setWorkshopMaterial,
    documentMaterial,
    setDocumentMaterial,
    workshopSchedule,
    setWorkshopSchedule,
    isPublishing,
    setIsPublishing,
    publishProgress,
    setPublishProgress,
    validationErrors,
    setValidationErrors,
    fieldErrors,
    setFieldErrors,
    inlineFileInputRef,
    persistentCsvData,
    setPersistentCsvData,
    persistentSelectedRows,
    setPersistentSelectedRows,
    persistentCalendarSchedule,
    setPersistentCalendarSchedule,
    periods,
    setPeriods,
    exerciseVideoFiles,
    setExerciseVideoFiles,
    videosPendingDeletion,
    setVideosPendingDeletion,
    weeklyStats,
    setWeeklyStats,
    coachCatalogError,
    coachCatalogExercises,
    coachCatalogLoading,
    user,
    planType
  } = useCreateProductLogic({ isOpen, onClose, editingProduct, initialStep, showDateChangeNotice })

  // Confirmation state for type change (not in hook because it's purely navigation ui)
  const [showConfirmTypeChange, setShowConfirmTypeChange] = useState(false)
  const [showConfirmProgramTypeChange, setShowConfirmProgramTypeChange] = useState(false)
  const [pendingTypeChange, setPendingTypeChange] = useState<ProductType | null>(null)
  const [pendingProgramTypeChange, setPendingProgramTypeChange] = useState<ProgramSubType | null>(null)

  const handleTypeSelect = (type: ProductType) => {
    if (selectedType && selectedType !== type && hasUnsavedChanges()) {
      setPendingTypeChange(type)
      setShowConfirmTypeChange(true)
    } else {
      setSelectedType(type)
      if (type === 'program') {
        setCurrentStep('programType')
      } else {
        setCurrentStep('general')
      }
    }
  }

  const handleProgramTypeSelect = (subType: ProgramSubType) => {
    if (selectedProgramType && selectedProgramType !== subType && hasUnsavedChanges()) {
      setPendingProgramTypeChange(subType)
      setShowConfirmProgramTypeChange(true)
    } else {
      setSelectedProgramType(subType)
      setProductCategory(subType === 'fitness' ? 'fitness' : 'nutricion')
    }
  }

  const confirmTypeChange = () => {
    if (pendingTypeChange) {
      setSelectedType(pendingTypeChange)
      if (pendingTypeChange === 'program') {
        setCurrentStep('programType')
      } else {
        setCurrentStep('general')
      }
      clearPersistentState()
    }
    setShowConfirmTypeChange(false)
    setPendingTypeChange(null)
  }

  const confirmProgramTypeChange = () => {
    if (pendingProgramTypeChange) {
      setSelectedProgramType(pendingProgramTypeChange)
      setProductCategory(pendingProgramTypeChange === 'fitness' ? 'fitness' : 'nutricion')
      setCurrentStep('general')
      clearPersistentState()
    }
    setShowConfirmProgramTypeChange(false)
    setPendingProgramTypeChange(null)
  }
  if (!isOpen) return null
  // Calcular el número total de pasos según el tipo
  const totalSteps = selectedType === 'workshop' ? 6 : 5
  const currentStepNumber = getStepNumber(currentStep)

  const stepTitle = useMemo(() => {
    const titleMap: Record<string, string> = {
      type: 'Tipo de producto',
      programType: 'Categoría y entrega',
      general: 'Información básica',
      specific: 'Detalles',
      workshopSchedule: 'Temas y horarios',
      workshopMaterial: 'Material del taller',
      documentMaterial: 'Temas y documentos',
      weeklyPlan: 'Organización',
      preview: 'Vista previa'
    }
    return titleMap[currentStep] || (editingProduct ? 'Editar producto' : 'Crear producto')
  }, [currentStep, editingProduct])

  // Renderizar el modal completo
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="main-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[100] flex items-center justify-center px-4 pt-16 pb-16 sm:pt-20 sm:pb-20"
          onClick={(e) => {
            // Cerrar solo si se hace click en el overlay, no en el modal
            if (e.target === e.currentTarget) {
              handleClose()
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#0B0B0B] rounded-2xl max-w-4xl w-full h-[85vh] overflow-hidden flex flex-col border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <WizardHeader
              currentStep={currentStep}
              currentStepNumber={currentStepNumber}
              totalSteps={totalSteps}
              handleClose={handleClose}
            />

            {/* Contenido del modal - Scrollable */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4 bg-[#0b0b0b] overscroll-contain touch-auto">
              {/* Paso 1: Tipo de Producto */}
              {currentStep === 'type' && (
                <StepTypeSelector onSelect={handleTypeSelect} selected={selectedType} />
              )}

              {/* Paso 2: Categoría del Programa */}
              {currentStep === 'programType' && (
                <StepProgramType
                  selectedCategory={selectedProgramType}
                  onSelectCategory={handleProgramTypeSelect}
                  isPrivate={!generalForm.is_public}
                  onTogglePrivate={(val) => setGeneralForm(prev => ({ ...prev, is_public: !val }))}
                  modality={generalForm.modality as DeliveryModality}
                  onSelectModality={(val) => setGeneralForm(prev => ({ ...prev, modality: val }))}
                  includedMeetCredits={generalForm.included_meet_credits}
                  onUpdateMeetCredits={(val) => setGeneralForm(prev => ({ ...prev, included_meet_credits: val }))}

                  onBack={() => setCurrentStep('type')}
                  locationName={generalForm.location_name}
                  onChangeLocationName={(val) => setGeneralForm(prev => ({ ...prev, location_name: val }))}
                  locationUrl={generalForm.location_url}
                  onChangeLocationUrl={(val) => setGeneralForm(prev => ({ ...prev, location_url: val }))}
                />
              )}

              {/* Paso 3: Formulario General */}
              {currentStep === 'general' && (
                <StepGeneralForm
                  state={{
                    generalForm,
                    specificForm,
                    selectedType: selectedType!,
                    fieldErrors,
                    isPublishing,
                    inlineMediaLoading,
                    inlineMediaItems,
                    inlineMediaType,
                    showMediaSourceModal,

                    isVideoPreviewActive,
                    uploadProgress,
                    objectiveOptions,
                    restrictionOptions,
                    planType,
                    planLimit: getPlanLimit(planType as any, 'stockPerProduct')
                  }}
                  actions={{
                    setGeneralForm,
                    setSpecificForm,
                    clearFieldError,
                    addObjetivo,
                    removeObjetivo,
                    addRestriccion,
                    removeRestriccion,
                    loadInlineMedia,
                    handleMediaSelection,
                    handleInlineUploadChange,
                    setShowMediaSourceModal,
                    setInlineMediaType,
                    handleStockQuantityChange,
                    onNext: () => goToStep(currentStepNumber + 1),
                    onBack: () => goToStep(currentStepNumber - 1)
                  }}
                />
              )}

              {/* Otros pasos (Material, etc) - se mantienen como estaban o se ajustan si es necesario */}
              {currentStep === 'weeklyPlan' && (
                <WeeklyPlanStep
                  editingProduct={editingProduct}
                  persistentCsvData={persistentCsvData}
                  coachCatalogExercises={coachCatalogExercises}
                  productCategory={productCategory}
                  persistentCalendarSchedule={persistentCalendarSchedule}
                  periods={periods}
                  setPersistentCalendarSchedule={setPersistentCalendarSchedule}
                  setPeriods={setPeriods}
                  setWeeklyStats={setWeeklyStats}
                  coachCatalogError={coachCatalogError}
                  coachCatalogLoading={coachCatalogLoading}
                  planType={planType}
                />
              )}

              {currentStep === 'workshopSchedule' && (
                <WorkshopScheduleStep
                  workshopSchedule={workshopSchedule}
                  setWorkshopSchedule={setWorkshopSchedule}
                  setWeeklyStats={setWeeklyStats}
                />
              )}

              {currentStep === 'workshopMaterial' && selectedType === 'workshop' && (
                <WorkshopMaterialStep
                  workshopMaterial={workshopMaterial}
                  setWorkshopMaterial={setWorkshopMaterial}
                  workshopSchedule={workshopSchedule}
                  openPdfGallery={(context: PdfSelectionContext) => {
                    setPendingPdfContext(context)
                    setShowPdfSelectionModal(true)
                  }}
                />
              )}

              {/* Paso: Temas y Documentos (solo para documentos) */}
              {currentStep === 'documentMaterial' && selectedType === 'document' && (
                <DocumentMaterialStep
                  documentMaterial={documentMaterial}
                  setDocumentMaterial={setDocumentMaterial}
                  selectedTopics={selectedTopics}
                  setSelectedTopics={setSelectedTopics}
                  openPdfGallery={(context: PdfSelectionContext) => {
                    setPendingPdfContext(context)
                    setShowPdfSelectionModal(true)
                  }}
                  uploadingPdf={uploadingPdf}
                />
              )}

              {currentStep === 'preview' && (
                <PreviewStep
                  editingProduct={editingProduct}
                  generalForm={generalForm}
                  specificForm={specificForm}
                  productCategory={productCategory}
                  selectedType={selectedType}
                  workshopSchedule={workshopSchedule}
                  documentMaterial={documentMaterial}
                  derivedPreviewStats={derivedPreviewStats}
                  user={user}
                />
              )}
            </div>

            {/* Footer con botones de navegación */}
            <WizardFooter
              currentStep={currentStep}
              currentStepNumber={currentStepNumber}
              totalSteps={totalSteps}
              goToStep={goToStep}
              onClose={onClose}
              handlePublishProduct={handlePublishProduct}
              isPublishing={isPublishing}
              selectedType={selectedType}
              selectedProgramType={selectedProgramType}
            />
          </motion.div>
        </motion.div>
      )
      }

      {/* Modal de selección de fuente para medios (Foto/Video) */}
      <SourceSelectionModal
        key="source-selection-modal"
        isOpen={showMediaSourceModal}
        onClose={() => setShowMediaSourceModal(false)}
        onSelectExisting={() => {
          setShowMediaSourceModal(false)
          setMediaModalType(inlineMediaType === 'video' ? 'video' : 'image')
          setIsMediaModalOpen(true)
        }}
        handleInlineUploadChange={handleInlineUploadChange}
        mediaType={inlineMediaType === 'video' ? 'video' : 'image'}
      />

      {/* Modal de selección de archivos (Galería) */}
      <MediaSelectionModal
        key="media-gallery-modal"
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onMediaSelected={handleMediaSelection}
        mediaType={mediaModalType}
        className="z-[80]"
      />

      {/* Modal de selección de videos de ejercicios */}
      <VideoSelectionModal
        key="exercise-video-modal"
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onVideoSelected={handleVideoSelection}
        selectedRowsCount={persistentSelectedRows?.size || 0}
      />

      {/* Choice Modal for PDF: Existing vs New */}
      <PdfChoiceModal
        key="pdf-choice-modal"
        isOpen={showPdfSelectionModal}
        onClose={() => setShowPdfSelectionModal(false)}
        onSelectChoice={handlePdfSelectionChoice}
      />

      {/* Gallery Modal for PDFs */}
      <MediaSelectionModal
        key="pdf-gallery-modal"
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        onMediaSelected={(url, type, file, name) => handlePdfSelected(url, type, file, name)}
        mediaType="pdf"
        className="z-[80]"
      />

      {/* Modal de confirmación de cierre */}
      <CloseConfirmationModal
        key="close-confirmation-modal"
        isOpen={showCloseConfirmation}
        onCancel={cancelClose}
        onConfirm={confirmClose}
      />
    </AnimatePresence >
  )
}
