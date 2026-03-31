"use client"

import React, { useRef, useEffect, useCallback, useMemo } from 'react'
import { CheckCircle, Video, Trash2, Power, PowerOff, Settings2, ChevronLeft, ChevronRight, X, Minus, Flame, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MediaSelectionModal } from '@/components/shared/ui/media-selection-modal'
import { ConditionalRulesPanel } from '@/components/shared/products/conditional-rules-panel'
import type { ConditionalRule } from '@/components/shared/products/conditional-rules-data'
import { CsvUploadArea, CsvManualForm, CsvLimitBar, CsvTable } from './components'
import { UploadedFileList } from './components/UploadedFileList'
import { useCsvPagination } from './hooks/useCsvPagination'
import { useRowSelection } from './hooks/useRowSelection'
import { useCsvDataFetching } from './hooks/useCsvDataFetching'
import { useCsvFileProcessor } from './hooks/useCsvFileProcessor'
import { useCsvActions } from './hooks/useCsvActions'
import { useCsvState } from './hooks/useCsvState'
import { usePlanLimits } from './hooks/usePlanLimits'
import { useCatalogLoading } from './hooks/useCatalogLoading'
import { useBunnyVideoTitles } from './hooks/useBunnyVideoTitles'
import { generateCsvTemplate } from './utils/csv-template-generator'
import {
  getRowIdentifier,
  getExerciseName,
  normalizeName
} from './utils/csv-helpers'
import { ManualFormState } from './types'

interface CSVManagerEnhancedProps {
  activityId: number
  coachId: string
  onSuccess?: () => void
  onRemoveCSV?: () => void
  onDownloadCSV?: () => void
  csvFileName?: string
  csvData?: any[]
  setCsvData?: (data: any[]) => void
  selectedRows?: Set<number>
  setSelectedRows?: (rows: Set<number>) => void
  productCategory?: 'fitness' | 'nutricion'
  onItemsStatusChange?: (items: any[], action: 'disable' | 'reactivate' | 'remove') => void
  onVideoCleared?: (index: number, exercise: any, meta?: { bunnyVideoId?: string; bunnyLibraryId?: number | string; videoUrl?: string }) => void
  planLimits?: {
    planType?: string
    activitiesLimit?: number
  } | null
  renderAfterTable?: React.ReactNode
  onVideoFileSelected?: (exercise: any, index: number, videoFile: File) => void
}

export function CSVManagerEnhanced({
  activityId,
  coachId,
  onSuccess,
  onRemoveCSV,
  onDownloadCSV,
  csvFileName,
  csvData: parentCsvData,
  setCsvData: parentSetCsvData,
  selectedRows: parentSelectedRows,
  setSelectedRows: parentSetSelectedRows,
  productCategory: initialProductCategory = 'fitness',
  onItemsStatusChange,
  onVideoCleared,
  planLimits: planLimitsProp = null,
  renderAfterTable,
  onVideoFileSelected
}: CSVManagerEnhancedProps) {
  const state = useCsvState(parentSelectedRows)
  const {
    csvData, setCsvData,
    existingData, setExistingData,
    loading, setLoading,
    processing, setProcessing,
    loadingExisting, setLoadingExisting,
    error, setError,
    invalidRows, setInvalidRows,
    result, setResult,
    selectedRows, setSelectedRows,
    limitWarning, setLimitWarning,
    exerciseUsage, setExerciseUsage,
    activityNamesMap, setActivityNamesMap,
    activityImagesMap, setActivityImagesMap,
    showVideoModal, setShowVideoModal,
    showMediaSourceModal, setShowMediaSourceModal,
    showRulesPanel, setShowRulesPanel,
    rulesCount, setRulesCount,
    uploadedFiles, setUploadedFiles,
    mode, setMode,
    editingExerciseIndex, setEditingExerciseIndex,
    currentPage, setCurrentPage,
    manualForm, setManualForm
  } = state

  const [productCategory, setProductCategory] = React.useState<'fitness' | 'nutricion'>(initialProductCategory)

  useEffect(() => {
    setProductCategory(initialProductCategory)
  }, [initialProductCategory])

  const videoInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const justDeletedRef = useRef<boolean>(false)
  const hasUserInteractedRef = useRef<boolean>(false)
  const isLoadingDataRef = useRef<boolean>(false)

  const itemsPerPage = 15
  const TEMPLATE_ERROR_MESSAGE = 'Archivo inválido. Descargá la plantilla de ejemplo.'

  const { bunnyVideoTitles } = useBunnyVideoTitles()
  const { planLimits } = usePlanLimits({ coachId, planLimitsProp })
  const { existingCatalog } = useCatalogLoading({ mode, productCategory, coachId })

  const updateErrorState = useCallback((message: string | null, rows: string[] = []) => {
    setError(message)
    setInvalidRows(rows)
  }, [setError, setInvalidRows])

  const { loadExistingData } = useCsvDataFetching({
    activityId,
    coachId,
    productCategory,
    parentCsvData,
    parentSetCsvData,
    setLoadingExisting,
    setCsvData,
    setExistingData,
    setExerciseUsage,
    setActivityNamesMap,
    setActivityImagesMap,
    setRulesCount,
    updateErrorState
  })

  // Combine all items (existing, CSV, parent) into a single list
  const allData = useMemo(() => {
    const existing = existingData || []
    const csv = csvData || []
    const parent = parentCsvData || []

    const existingActiveMap = new Map<number, boolean>()
    existing.forEach((item) => {
      const id = item?.id
      if (typeof id === 'number') {
        existingActiveMap.set(id, item?.is_active !== false && item?.activo !== false)
      }
    })

    const combined: any[] = []
    const seenRowKeys = new Set<string>()

    const registerItem = (item: any, idx: number) => {
      if (!item) return
      const rowKey = getRowIdentifier(item, idx)
      if (rowKey && seenRowKeys.has(rowKey)) return
      if (rowKey) seenRowKeys.add(rowKey)
      combined.push(item)
    }

    csv.forEach((item, idx) => registerItem(item, idx))
    parent.forEach((item: any, idx: number) => registerItem(item, idx + csv.length))
    existing.forEach((item, idx) => registerItem(item, idx + csv.length + parent.length))

    return combined.map((item) => {
      if (typeof item?.id === 'number' && existingActiveMap.has(item.id)) {
        const isActive = existingActiveMap.get(item.id)!
        return { ...item, is_active: isActive, activo: isActive }
      }
      return item
    })
  }, [existingData, csvData, parentCsvData])

  const { handleFileChange, evaluateAvailableSlots, clearLimitWarningIfNeeded } = useCsvFileProcessor({
    productCategory,
    coachId,
    activityId,
    existingData,
    csvData,
    planLimits,
    setFile: state.setFile,
    setLoading,
    updateErrorState,
    setResult,
    setLimitWarning,
    setUploadedFiles,
    setCsvData,
    parentSetCsvData,
    parentCsvData,
    fileInputRef,
    TEMPLATE_ERROR_MESSAGE
  })

  const {
    handleRowSelection,
    handleEditExercise,
    cancelEdit,
    handleDeleteSelected,
    handleRemoveSelected,
    handleReactivateSelected,
    handleVideoSelection,
    handleRemoveVideoFromManualForm,
    handleProcess,
    handleReset,
    handleDeleteRow,
    addManualExercise
  } = useCsvActions({
    activityId,
    coachId,
    productCategory,
    csvData,
    existingData,
    parentCsvData,
    selectedRows,
    setCsvData,
    setExistingData,
    setSelectedRows,
    parentSetCsvData,
    parentSetSelectedRows,
    setManualForm,
    setMode,
    setEditingExerciseIndex,
    setShowAssignedVideoPreview: state.setShowAssignedVideoPreview,
    setRecipeSteps: state.setRecipeSteps,
    setBodyParts: state.setBodyParts,
    setEquipoList: state.setEquipoList,
    setSeriesList: state.setSeriesList,
    setUploadedFiles,
    setFile: state.setFile,
    setResult,
    setProcessing,
    setLimitWarning,
    updateErrorState,
    loadExistingData,
    onSuccess,
    onRemoveCSV,
    onItemsStatusChange,
    onVideoFileSelected,
    onVideoCleared,
    fileInputRef,
    justDeletedRef,
    hasUserInteractedRef,
    allData,
    evaluateAvailableSlots,
    clearLimitWarningIfNeeded,
    seriesList: state.seriesList,
    bodyParts: state.bodyParts,
    equipoList: state.equipoList,
    manualForm,
    editingExerciseIndex,
    planLimits,
    setNewlyAddedIds: state.setNewlyAddedIds
  })

  // Background video upload state — placed AFTER useCsvActions so allData and handleVideoSelection are available
  const [uploadStatus, setUploadStatus] = React.useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const uploadStatusTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handleBackgroundVideoUpload = useCallback(async (
    file: File,
    localBlobUrl: string,
    localDuration?: number
  ) => {
    setUploadStatus('uploading')
    const capturedIndex = editingExerciseIndex
    const capturedIndices = capturedIndex === null ? Array.from(selectedRows) : [capturedIndex]
    const capturedExerciseIds = capturedIndices
      .map(idx => allData[idx]?.id)
      .filter(id => typeof id === 'number')
    
    const capturedExerciseId = capturedIndex !== null && allData[capturedIndex]?.id
      ? allData[capturedIndex].id
      : undefined

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mediaType', 'video')
      formData.append('category', 'product')
      if (activityId > 0) formData.append('activityId', String(activityId))
      
      if (capturedExerciseIds.length > 0) {
        formData.append('exerciseIds', capturedExerciseIds.join(','))
      }
      if (capturedExerciseId) {
        formData.append('exerciseId', String(capturedExerciseId))
      }

      if (localDuration !== undefined) formData.append('videoDuration', String(Math.round(localDuration)))
      formData.append('title', file.name)

      console.log('🔄 [background-upload] Subida a Bunny...', { 
        file: file.name, 
        capturedExerciseIds,
        capturedExerciseId, 
        capturedIndex, 
        selectionSize: capturedIndices.length,
        activityId 
      })

      const response = await fetch('/api/bunny/upload-video', { method: 'POST', body: formData })
      const data = await response.json()
      console.log('🔄 [background-upload] Respuesta:', { ok: response.ok, data })

      if (response.ok && data.streamUrl) {
        // Use captured context to update the correct row(s)
        handleVideoSelection(
          data.streamUrl, 
          'video', 
          undefined, 
          file.name, 
          capturedIndex !== null ? capturedIndex : (capturedIndices.length > 0 ? capturedIndices : undefined),
          capturedExerciseId
        )
        setUploadStatus('done')
      } else {
        console.error('❌ [background-upload] Error:', data)
        setUploadStatus('error')
      }
    } catch (err) {
      console.error('❌ [background-upload] Error:', err)
      setUploadStatus('error')
    } finally {
      if (uploadStatusTimerRef.current) clearTimeout(uploadStatusTimerRef.current)
      uploadStatusTimerRef.current = setTimeout(() => setUploadStatus('idle'), 4000)
    }
  }, [activityId, editingExerciseIndex, allData, handleVideoSelection])

  // Duplicate logic removal and sync effects
  useEffect(() => {
    if (!coachId || coachId === '') return
    if (activityId === 0) {
      setCsvData([])
      setExistingData([])
      setExerciseUsage({})
      loadExistingData()
    }
  }, [productCategory, activityId, coachId, loadExistingData, setCsvData, setExistingData, setExerciseUsage])

  useEffect(() => {
    try {
      sessionStorage.setItem(`activities_draft_${activityId}`, JSON.stringify(csvData))
      sessionStorage.setItem(`activities_draft_${activityId}_interacted`, 'true')
    } catch (error) {
      console.error('❌ Error guardando en sessionStorage:', error)
    }
  }, [csvData, activityId])

  const [sortConfig, setSortConfig] = React.useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortedData = useMemo(() => {
    if (!sortConfig) return allData
    return [...allData].sort((a, b) => {
      const aValue = (a[sortConfig.key] || '').toString().toLowerCase()
      const bValue = (b[sortConfig.key] || '').toString().toLowerCase()
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [allData, sortConfig])

  // Paginación
  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage)

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [sortedData.length, totalPages, currentPage, setCurrentPage])

  const handleDownloadTemplate = () => generateCsvTemplate({ productCategory: productCategory as any })

    const duplicateNames = useMemo(() => {
    const nameMap = new Map<string, string[]>()
    sortedData.forEach((item) => {
      const name = normalizeName(getExerciseName(item))
      if (name) {
        if (!nameMap.has(name)) nameMap.set(name, [])
        nameMap.get(name)!.push(getExerciseName(item))
      }
    })
    return Array.from(nameMap.values()).filter(list => list.length > 1).map(list => list[0])
  }, [sortedData])

  const selectedExerciseIds = useMemo(() => {
    return Array.from(selectedRows)
      .map(idx => allData[idx]?.id)
      .filter(id => typeof id === 'number')
  }, [selectedRows, allData])

  const exceedsActivitiesLimit = planLimits?.activitiesLimit !== undefined && sortedData.length > planLimits.activitiesLimit

  return (
    <div className="text-white p-2 w-full max-w-none pb-24">
      {/* Centralized Action Trigger - Compact Spacing */}
      <div className="mb-4 flex flex-col items-center justify-center">
        {/* Action Trigger - Smaller Orange Outline Plus/Minus */}
        <div className="relative">
          {/* Dynamic Alignment Container - Positioned under active category icon */}
          <div className={`flex transition-all duration-500 w-40 justify-center ${productCategory === 'nutricion' ? 'translate-x-[24px]' : '-translate-x-[24px]'}`}>
            <button 
              onClick={() => setMode(mode === 'existentes' ? 'manual' : 'existentes')}
              className={`relative w-10 h-10 rounded-full flex items-center justify-center border-[1.5px] border-[#FF7939] bg-transparent text-[#FF7939] transition-all duration-300 active:scale-90 hover:shadow-[0_0_10px_rgba(255,121,57,0.3)] group`}
            >
              {mode === 'existentes' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              ) : (
                <Minus className="w-5 h-5" strokeWidth={4} />
              )}
            </button>
          </div>
        </div>
      </div>

      <MediaSelectionModal
        isOpen={showMediaSourceModal}
        onClose={() => setShowMediaSourceModal(false)}
        onMediaSelected={handleVideoSelection}
        mediaType="video"
        activityId={activityId > 0 ? activityId : undefined}
        exerciseId={
          editingExerciseIndex !== null && allData[editingExerciseIndex]?.id
            ? allData[editingExerciseIndex].id
            : undefined
        }
        exerciseIds={selectedExerciseIds.length > 0 ? selectedExerciseIds : null}
        onBackgroundVideoUpload={handleBackgroundVideoUpload}
      />

      {/* Background upload status indicator */}
      {uploadStatus !== 'idle' && (
        <div className={`fixed bottom-6 right-4 z-[200] flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl transition-all duration-300 ${
          uploadStatus === 'uploading' ? 'bg-zinc-900 border border-[#FF7939]/30 text-[#FF7939]' :
          uploadStatus === 'done' ? 'bg-zinc-900 border border-emerald-500/30 text-emerald-400' :
          'bg-zinc-900 border border-red-500/30 text-red-400'
        }`}>
          {uploadStatus === 'uploading' && (
            <><svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Subiendo video...</>
          )}
          {uploadStatus === 'done' && (
            <><svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>Video guardado ✓</>
          )}
          {uploadStatus === 'error' && (
            <><svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Error al subir—reinténtalo</>
          )}
        </div>
      )}

      {mode === 'csv' && (
        <CsvUploadArea
          onFileSelect={handleFileChange}
          onManualEntrySelect={() => { }} // No longer used inside
          onDownloadTemplate={handleDownloadTemplate}
          productCategory={productCategory as any}
          mode={mode}
        />
      )}

      {(mode === 'manual' || editingExerciseIndex !== null) && (
        <CsvManualForm
          productCategory={productCategory}
          formState={manualForm as ManualFormState}
          onChange={(field, value) => setManualForm((prev: any) => ({ ...prev, [field]: value }))}
          onSubmit={addManualExercise}
          onCancel={cancelEdit}
          isEditing={editingExerciseIndex !== null}
          csvData={allData}
          onVideoSelect={() => setShowMediaSourceModal(true)}
          onRemoveVideo={handleRemoveVideoFromManualForm}
          planLimits={planLimits}
        />
      )}

      <UploadedFileList
        uploadedFiles={uploadedFiles}
        activityId={activityId}
        productCategory={productCategory}
        csvData={csvData}
        setCsvData={setCsvData}
        parentCsvData={parentCsvData}
        parentSetCsvData={parentSetCsvData}
        setUploadedFiles={setUploadedFiles}
        updateErrorState={updateErrorState}
      />

      {allData.length > 0 && (
        <div className="flex flex-col gap-2 mt-8">

          <CsvLimitBar
            allDataLength={allData.length}
            newExercisesCount={allData.filter(i => !i.isExisting).length}
            existingCount={allData.filter(i => i.isExisting).length}
            planLimits={planLimits}
            productCategory={productCategory}
          />

        </div>
      )}

      {
        limitWarning && (
          <div className="mb-4 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {limitWarning}
          </div>
        )
      }

      {loading && <div className="text-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mr-3 inline-block"></div>Parseando CSV...</div>}
      {loadingExisting && <div className="text-center py-4"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-2 inline-block"></div>Cargando datos...</div>}

      {
        error && (
          <div className="mb-4">
            <p className="text-red-500 text-sm">{error}</p>
            {invalidRows.length > 0 && (
              <div className="mt-2 text-xs text-gray-400 space-y-1">
                <ul className="list-disc pl-4">{invalidRows.map((issue, idx) => <li key={idx}>{issue}</li>)}</ul>
              </div>
            )}
          </div>
        )
      }



      <CsvTable
        data={paginatedData as any[]}
        startIndex={startIndex}
        selectedRows={selectedRows}
        toggleRow={(idx) => {
          const newSet = new Set(selectedRows)
          if (newSet.has(idx)) newSet.delete(idx)
          else newSet.add(idx)
          setSelectedRows(newSet)
          if (parentSetSelectedRows) parentSetSelectedRows(newSet)
        }}
        toggleSelectAll={() => {
          const allIndices = paginatedData.map((_, index) => startIndex + index)
          const allSelected = allIndices.every(index => selectedRows.has(index))
          const newSelected = new Set(selectedRows)
          if (allSelected) allIndices.forEach(idx => newSelected.delete(idx))
          else allIndices.forEach(idx => newSelected.add(idx))
          setSelectedRows(newSelected)
          if (parentSetSelectedRows) parentSetSelectedRows(newSelected)
        }}
        isAllSelected={paginatedData.length > 0 && paginatedData.map((_, i) => startIndex + i).every(idx => selectedRows.has(idx))}
        onEdit={(item, idx) => handleEditExercise(item as any, idx)}
        productCategory={productCategory as any}
        activityId={activityId}
        planLimits={planLimits}
        exerciseUsage={exerciseUsage}
        activityNamesMap={activityNamesMap}
        activityImagesMap={activityImagesMap}
        duplicateNames={duplicateNames}
        loadingExisting={loadingExisting}
        bunnyVideoTitles={bunnyVideoTitles}
        sortConfig={sortConfig}
        onSort={handleSort}
        onDelete={handleDeleteRow}
        onDeleteSelected={handleDeleteSelected}
        onAddVideosToSelected={() => { if (selectedRows.size > 0) setShowMediaSourceModal(true) }}
      />

      {
        allData.length > itemsPerPage && (
          <div className="flex items-center justify-center gap-2 mt-4 pb-4">
            <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="text-[#FF7939] disabled:text-gray-500 hover:text-[#FF6B35]"><ChevronLeft className="h-5 w-5" /></button>
            <span className="text-gray-400 text-sm">Página {currentPage} de {totalPages}</span>
            <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="text-[#FF7939] disabled:text-gray-500 hover:text-[#FF6B35]"><ChevronRight className="h-5 w-5" /></button>
          </div>
        )
      }

      {renderAfterTable && <div className="flex justify-end mt-3 mb-2">{renderAfterTable}</div>}

      <ConditionalRulesPanel
        isOpen={showRulesPanel}
        onClose={() => setShowRulesPanel(false)}
        productCategory={productCategory as any}
        availableItems={allData}
        productId={activityId > 0 ? activityId : undefined}
        coachId={coachId}
        onSaveRules={(rules: ConditionalRule[]) => {
          setRulesCount(rules.length)
          if (activityId > 0) sessionStorage.setItem(`conditional_rules_${activityId}`, JSON.stringify(rules))
        }}
        initialRules={(() => {
          if (activityId > 0) {
            try { return JSON.parse(sessionStorage.getItem(`conditional_rules_${activityId}`) || '[]') } catch { return [] }
          }
          return []
        })()}
      />
    </div>
  )
}
