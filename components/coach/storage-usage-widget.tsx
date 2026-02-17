'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { useStorageLogic, PlanType } from './hooks/storage/useStorageLogic'
import { StorageHeader } from './storage/StorageHeader'
import { StorageProgressBar } from './storage/StorageProgressBar'
import { StorageStats } from './storage/StorageStats'
import { StorageFilters } from './storage/StorageFilters'
import { StorageFileList } from './storage/StorageFileList'
import { StorageActivityList } from './storage/StorageActivityList'
import { FilePreviewModal } from './storage/FilePreviewModal'
import { DeleteWarningModal } from './storage/DeleteWarningModal'

interface StorageUsageWidgetProps {
  plan?: PlanType
}

export function StorageUsageWidget({ plan }: StorageUsageWidgetProps = {}) {
  const { state, actions } = useStorageLogic(plan)

  return (
    <div className="bg-black p-4 text-white">
      <StorageHeader
        loading={state.loading}
        onRefresh={actions.loadStorageUsage}
      />

      {state.error ? (
        <div className="text-red-500 text-[10px] text-center py-2">{state.error}</div>
      ) : state.loading && !state.storageData ? (
        <div className="flex justify-center items-center py-6">
          <RefreshCw className="w-4 h-4 animate-spin text-[#FF7939]" />
        </div>
      ) : state.storageData ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <StorageProgressBar
            storageData={state.storageData}
            storageLimitGB={state.storageLimitGB}
          />

          <StorageStats
            usedGB={state.usedGB}
            limitGB={state.storageLimitGB}
            collapsed={state.collapsed}
            onToggleCollapse={() => {
              const newState = !state.collapsed
              actions.setCollapsed(newState)
              if (newState) actions.setViewMode('usage')
            }}
          />

          {!state.collapsed && (
            <>
              <StorageFilters
                viewMode={state.viewMode}
                setViewMode={actions.setViewMode}
                conceptFilter={state.conceptFilter}
                setConceptFilter={actions.setConceptFilter}
              />

              <div className="mt-8">
                <AnimatePresence mode="popLayout">
                  {state.loadingFiles ? (
                    <div className="flex justify-center py-8"><RefreshCw className="w-4 h-4 animate-spin text-[#FF7939]" /></div>
                  ) : state.viewMode === 'activity' ? (
                    <StorageActivityList
                      key="activity-list"
                      activityData={state.activityViewData}
                      expanded={state.expanded}
                    />
                  ) : (
                    <StorageFileList
                      key="file-list"
                      files={state.usageViewData}
                      expanded={state.expanded}
                      editingFileName={state.editingFileName}
                      newFileName={state.newFileName}
                      onEditFileName={actions.handleEditFileName}
                      onSaveFileName={actions.handleSaveFileName}
                      onCancelEdit={() => actions.setEditingFileName(null)}
                      setNewFileName={actions.setNewFileName}
                      onViewFile={actions.handleViewFile}
                      onDeleteFile={actions.handleDeleteFile}
                    />
                  )}
                </AnimatePresence>
              </div>
            </>
          )}

          <AnimatePresence>
            <FilePreviewModal
              file={state.viewingFile}
              onClose={() => actions.setViewingFile(null)}
            />
          </AnimatePresence>

          <AnimatePresence>
            <DeleteWarningModal
              show={state.showDeleteWarning}
              file={state.fileToDelete}
              onClose={() => { actions.setShowDeleteWarning(false); actions.setFileToDelete(null); }}
              onConfirm={actions.confirmDelete}
            />
          </AnimatePresence>
        </motion.div>
      ) : null}
    </div>
  )
}
