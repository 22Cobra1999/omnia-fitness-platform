"use client"

import React, { useRef, useEffect, useCallback, useMemo } from 'react'
import { CheckCircle, Video, Trash2, Power, PowerOff, Settings2, ChevronLeft, ChevronRight } from 'lucide-react'
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
  productCategory = 'fitness',
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

    existing.forEach((item, idx) => registerItem(item, idx))
    csv.forEach((item, idx) => registerItem(item, idx + existing.length))
    parent.forEach((item: any, idx: number) => registerItem(item, idx + existing.length + csv.length))

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
    planLimits
  })

  // Duplicate logic removal and sync effects
  useEffect(() => {
    if (!coachId || coachId === '') return
    if (activityId === 0 && !isLoadingDataRef.current) {
      isLoadingDataRef.current = true
      setCsvData([])
      setExistingData([])
      setExerciseUsage({})
      loadExistingData().finally(() => {
        isLoadingDataRef.current = false
      })
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

  // Paginación
  const totalPages = Math.ceil(allData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = allData.slice(startIndex, startIndex + itemsPerPage)

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [allData.length, totalPages, currentPage, setCurrentPage])

  const handleDownloadTemplate = () => generateCsvTemplate({ productCategory: productCategory as any })

  const duplicateNames = useMemo(() => {
    const nameMap = new Map<string, string[]>()
    allData.forEach((item) => {
      const name = normalizeName(getExerciseName(item))
      if (name) {
        if (!nameMap.has(name)) nameMap.set(name, [])
        nameMap.get(name)!.push(getExerciseName(item))
      }
    })
    return Array.from(nameMap.values()).filter(list => list.length > 1).map(list => list[0])
  }, [allData])

  const exceedsActivitiesLimit = planLimits?.activitiesLimit !== undefined && allData.length > planLimits.activitiesLimit

  return (
    <div className="text-white p-4 w-full max-w-none pb-24">
      {/* Selector de modo */}
      <div className="mb-6 flex justify-center">
        <div className="inline-flex items-center bg-zinc-900/80 border border-zinc-800 rounded-xl p-1 shadow-inner gap-2">
          {([
            { key: 'manual', label: productCategory === 'nutricion' ? 'Crear platos manualmente' : 'Crear ejercicios manualmente' },
            { key: 'csv', label: 'Subir Archivo' }
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMode(tab.key)}
              className={`px-6 py-2.5 text-sm rounded-lg transition-all ${mode === tab.key
                ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <MediaSelectionModal
        isOpen={showMediaSourceModal}
        onClose={() => setShowMediaSourceModal(false)}
        onMediaSelected={handleVideoSelection}
        mediaType="video"
      />

      {mode === 'csv' && (
        <CsvUploadArea
          onFileSelect={handleFileChange}
          onManualEntrySelect={() => setMode('manual')}
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
          onVideoSelect={() => setShowMediaSourceModal(true)}
          onRemoveVideo={handleRemoveVideoFromManualForm}
          showAssignedVideoPreview={false} // Managed in subcomponent if needed
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

      <CsvLimitBar
        allDataLength={allData.length}
        newExercisesCount={allData.filter(i => !i.isExisting).length}
        existingCount={allData.filter(i => i.isExisting).length}
        planLimits={planLimits}
        productCategory={productCategory}
      />

      {limitWarning && (
        <div className="mb-4 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {limitWarning}
        </div>
      )}

      {loading && <div className="text-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mr-3 inline-block"></div>Parseando CSV...</div>}
      {loadingExisting && <div className="text-center py-4"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-2 inline-block"></div>Cargando datos...</div>}

      {error && (
        <div className="mb-4">
          <p className="text-red-500 text-sm">{error}</p>
          {invalidRows.length > 0 && (
            <div className="mt-2 text-xs text-gray-400 space-y-1">
              <ul className="list-disc pl-4">{invalidRows.map((issue, idx) => <li key={idx}>{issue}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      {result && <div className="text-green-500 mb-6 bg-green-900/20 border border-green-500/50 rounded-lg p-4 flex items-center gap-2"><CheckCircle className="h-5 w-5" /> {result.message}</div>}

      {allData.length > 0 && (
        <div className="flex items-center justify-end gap-4 mb-4">
          <button onClick={() => setShowRulesPanel(true)} className="flex items-center gap-2 text-[#FF7939]">
            <Settings2 className="h-5 w-5" /> Condicionar
            {rulesCount > 0 && <span className="bg-[#FF7939] text-white text-[8px] px-1 rounded-full w-4 h-4 flex items-center justify-center">{rulesCount}</span>}
          </button>

          <button onClick={() => { if (selectedRows.size > 0) setShowMediaSourceModal(true) }} disabled={selectedRows.size === 0} className="text-[#FF7939] disabled:text-gray-500 hover:text-[#FF6B35]">
            <Video className="h-5 w-5" />
          </button>

          <button onClick={handleDeleteSelected} disabled={selectedRows.size === 0} className="text-red-400 disabled:text-gray-500 hover:text-red-300">
            <Trash2 className="h-5 w-5" />
          </button>

          {(() => {
            const selectedItems = Array.from(selectedRows).map(index => allData[index])
            const allInactive = selectedItems.length > 0 && selectedItems.every(item => item?.is_active === false)
            if (allInactive) {
              return <button onClick={handleReactivateSelected} disabled={selectedRows.size === 0} className="text-green-400 disabled:text-gray-500 hover:text-green-300"><Power className="h-5 w-5" /></button>
            }
            return <button onClick={handleDeleteSelected} disabled={selectedRows.size === 0} className="text-[#FF7939] disabled:text-gray-500 hover:text-[#FF6B35]"><PowerOff className="h-5 w-5" /></button>
          })()}
        </div>
      )}

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
      />

      {allData.length > itemsPerPage && (
        <div className="flex items-center justify-center gap-2 mt-4 pb-4">
          <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="text-[#FF7939] disabled:text-gray-500 hover:text-[#FF6B35]"><ChevronLeft className="h-5 w-5" /></button>
          <span className="text-gray-400 text-sm">Página {currentPage} de {totalPages}</span>
          <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="text-[#FF7939] disabled:text-gray-500 hover:text-[#FF6B35]"><ChevronRight className="h-5 w-5" /></button>
        </div>
      )}

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
