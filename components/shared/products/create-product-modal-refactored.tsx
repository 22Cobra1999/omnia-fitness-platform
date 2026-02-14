"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ChevronLeft, ChevronRight, ChevronDown, Plus, X, Upload, Calendar, Clock, Users, FileText, Eye, Edit, Check, Video, Play, Image as ImageIcon, Globe, MapPin, Trash2, Target, DollarSign, Eye as EyeIcon, EyeOff, Pencil, Flame, Lock, Unlock, Coins, MonitorSmartphone, Loader2, RotateCcw, RefreshCw, ExternalLink, UtensilsCrossed, Zap, FileUp, Trash } from "lucide-react"
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
          className="fixed inset-0 bg-black z-[60] flex items-center justify-center px-4 pt-16 pb-16 sm:pt-16 sm:pb-16"
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
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-[#0b0b0b]">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleClose()}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
                <h2 className="text-xl font-bold text-white">
                  {currentStep === 'type' ? 'Tipo de producto' :
                    currentStep === 'programType' ? 'Categoría' :
                      currentStep === 'general' ? 'Información General' :
                        currentStep === 'weeklyPlan' ? 'Planificación' :
                          currentStep === 'workshopSchedule' ? 'Organización' :
                            currentStep === 'workshopMaterial' || currentStep === 'documentMaterial' ? 'Material' :
                              currentStep === 'preview' ? 'Preview' :
                                'Crear Producto'}
                </h2>
              </div>

              {/* Progress Dots */}
              <div className="flex items-center gap-1.5 px-2">
                {Array.from({ length: totalSteps }).map((_, index) => {
                  const stepNum = index + 1
                  const isActive = stepNum === currentStepNumber
                  const isPast = stepNum < currentStepNumber
                  return (
                    <div
                      key={stepNum}
                      className={`h-1.5 transition-all duration-300 rounded-full ${isActive ? 'w-10 bg-[#FF7939]' :
                        isPast ? 'w-2 bg-[#FF7939]/40' :
                          'w-2 bg-white/10'
                        }`}
                    />
                  )
                })}
              </div>
            </div>

            {/* Contenido del modal - Scrollable */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-4 bg-[#0b0b0b]">
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
                <div className="space-y-6">
                  {coachCatalogError && (
                    <div className="text-xs text-red-400">{coachCatalogError}</div>
                  )}
                  <WeeklyExercisePlanner
                    activityId={editingProduct?.id}
                    exercises={(persistentCsvData && persistentCsvData.length > 0 ? persistentCsvData : coachCatalogExercises) || []}
                    productCategory={productCategory}
                    initialSchedule={persistentCalendarSchedule}
                    initialPeriods={periods}
                    onScheduleChange={setPersistentCalendarSchedule}
                    onPeriodsChange={setPeriods}
                    onStatsChange={(stats: any) => {
                      setWeeklyStats({
                        semanas: stats?.totalWeeks ?? 0,
                        sesiones: stats?.totalSessions ?? stats?.totalDays ?? 0,
                        ejerciciosTotales: stats?.totalExercisesReplicated ?? stats?.totalExercises ?? 0,
                        ejerciciosUnicos: stats?.uniqueExercises ?? 0
                      })
                    }}
                    planLimits={{
                      weeksLimit: getPlanLimit(planType, 'weeksPerProduct')
                    }}
                  />

                  {coachCatalogLoading && (
                    <div className="text-xs text-gray-500">Cargando ejercicios…</div>
                  )}
                </div>
              )}

              {currentStep === 'workshopSchedule' && (
                <div className="space-y-6">
                  <WorkshopSimpleScheduler
                    sessions={workshopSchedule}
                    onSessionsChange={(sessions) => {
                      setWorkshopSchedule(sessions)
                      // Update stats for workshops
                      const uniqueDays = new Set(sessions.map(s => s.date)).size
                      const uniqueThemes = new Set(sessions.map(s => s.title).filter(Boolean)).size
                      setWeeklyStats(prev => ({
                        ...prev,
                        sesiones: uniqueDays,
                        ejerciciosUnicos: uniqueThemes
                      }))
                    }}
                  />
                </div>
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

            {/* Footer con botones de navegación (Screenshot 1 Layout) */}
            <div className="sticky bottom-0 z-50 bg-[#0b0b0b] h-20 flex items-center justify-between px-6 pb-[calc(env(safe-area-inset-bottom)+8px)] border-t border-white/5">
              <Button
                onClick={() => {
                  const prevStepNumber = currentStepNumber - 1
                  if (prevStepNumber >= 1) {
                    goToStep(prevStepNumber)
                  } else {
                    onClose(false)
                  }
                }}
                className="bg-[#FF7939] hover:bg-[#E66829] text-white font-bold px-6 h-11 rounded-xl shadow-lg flex items-center gap-2 border-none"
              >
                <ChevronLeft className="h-4 w-4" />
                Atrás
              </Button>

              <div className="flex gap-3">
                {currentStep === 'preview' ? (
                  <Button
                    onClick={handlePublishProduct}
                    disabled={isPublishing}
                    className="bg-[#FF7939] hover:bg-[#E66829] text-white font-bold px-8 h-11 rounded-xl"
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Publicando...
                      </>
                    ) : (
                      'Publicar'
                    )}
                  </Button>
                ) : (
                  <button
                    onClick={() => {
                      const nextStepNumber = currentStepNumber + 1
                      if (nextStepNumber <= totalSteps) {
                        goToStep(nextStepNumber)
                      }
                    }}
                    disabled={!selectedType || (currentStep === 'programType' && selectedType === 'program' && !selectedProgramType)}
                    className="text-[#FF7939] font-bold hover:opacity-80 transition-opacity flex items-center gap-2 px-4 h-11 disabled:opacity-30"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )
      }

      {/* Modal de selección de fuente para medios (Foto/Video) */}
      {showMediaSourceModal && (
        <div key="media-source-modal" className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0A0A0A] border border-white/10 rounded-lg p-6 max-w-md w-full shadow-2xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-4">Seleccionar fuente</h3>
            <p className="text-sm text-gray-400 mb-6">
              Elegí si querés usar un archivo existente o subir uno nuevo.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowMediaSourceModal(false)
                  setMediaModalType(inlineMediaType === 'video' ? 'video' : 'image')
                  setIsMediaModalOpen(true)
                }}
                className="p-4 rounded-lg border border-white/10 bg-black hover:border-[#FF7939]/50 hover:bg-white/5 transition-all text-center group"
              >
                <ImageIcon className="h-6 w-6 mb-2 text-[#FF7939] mx-auto group-hover:scale-110 transition-transform" />
                <div className="text-sm font-semibold text-white">Existentes</div>
                <div className="text-xs text-gray-400 mt-1">De tu galería</div>
              </button>

              <div
                className="relative p-4 rounded-lg border border-white/10 bg-black hover:border-[#FF7939]/50 hover:bg-white/5 transition-all text-center group overflow-hidden"
              >
                <input
                  type="file"
                  accept={inlineMediaType === 'image' ? 'image/*' : 'video/*'}
                  onChange={(e) => {
                    console.log('🖼️ [Overlay Media] Change detectado')
                    handleInlineUploadChange(e)
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <Upload className="h-6 w-6 mb-2 text-[#FF7939] mx-auto group-hover:scale-110 transition-transform" />
                <div className="text-sm font-semibold text-white">Nuevo</div>
                <div className="text-xs text-gray-400 mt-1">Subir archivo</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowMediaSourceModal(false)}
              className="mt-6 w-full px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-white text-sm"
            >
              Cancelar
            </button>
          </motion.div>
        </div>
      )}

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
      {showPdfSelectionModal && (
        <div key="pdf-choice-modal" className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0b0b0b] border border-white/10 p-6 rounded-2xl max-w-sm w-full shadow-2xl"
          >
            <h3 className="text-xl font-bold text-white mb-2">Asignar Documento</h3>
            <p className="text-sm text-gray-400 mb-6">
              Elegí cómo querés agregar el documento PDF.
            </p>
            <div className="grid grid-cols-1 gap-3">
              <Button
                onClick={() => handlePdfSelectionChoice('existing')}
                className="bg-white/5 border border-white/10 text-white hover:bg-white/10 py-6 h-auto flex flex-col items-center gap-1"
              >
                <Check className="h-5 w-5 text-green-500" />
                <span>Elegir Existente</span>
                <span className="text-[10px] opacity-50 font-normal">De tu biblioteca de archivos</span>
              </Button>
              <Button
                onClick={() => handlePdfSelectionChoice('new')}
                className="bg-[#FF7939]/20 border border-[#FF7939]/30 text-white hover:bg-[#FF7939]/30 py-6 h-auto flex flex-col items-center gap-1"
              >
                <Upload className="h-5 w-5 text-[#FF7939]" />
                <span>Subir Nuevo</span>
                <span className="text-[10px] opacity-50 font-normal">Desde tu computadora</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowPdfSelectionModal(false)}
                className="text-gray-400 mt-2"
              >
                Cancelar
              </Button>
            </div>
          </motion.div>
        </div>
      )}

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
      {showCloseConfirmation && (
        <div key="close-confirmation-modal" className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#1C1C1E] border border-white/10 rounded-xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white mb-2">¿Descartar cambios?</h3>
            <p className="text-sm text-gray-400 mb-6">
              Tienes cambios sin guardar. Si cierras ahora, se perderán.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={cancelClose}
                className="flex-1 border-white/10 hover:bg-white/5 text-white"
              >
                Continuar editando
              </Button>
              <Button
                onClick={confirmClose}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white border-none"
              >
                Descartar y cerrar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence >
  )
}
