import { useCallback } from 'react'
import { getRowIdentifier } from '../utils/csv-helpers'

interface UseCsvPersistenceProps {
    activityId: number
    coachId: string
    productCategory: 'fitness' | 'nutricion'
    csvData: any[]
    setCsvData: (updater: any) => void
    existingData: any[]
    setExistingData: (updater: any) => void
    parentCsvData?: any[]
    parentSetCsvData?: (data: any[]) => void
    selectedRows: Set<number>
    setSelectedRows: (rows: Set<number>) => void
    parentSetSelectedRows?: (rows: Set<number>) => void
    onItemsStatusChange?: (items: any[], action: 'disable' | 'reactivate' | 'remove') => void
    onSuccess?: () => void
    onRemoveCSV?: () => void
    updateErrorState: (msg: string | null, details?: string[]) => void
    setProcessing: (processing: boolean) => void
    setResult: (result: any) => void
    loadExistingData: () => Promise<void>
    justDeletedRef: React.MutableRefObject<boolean>
    hasUserInteractedRef: React.MutableRefObject<boolean>
    fileInputRef: React.RefObject<HTMLInputElement | null>
    setFile: (file: File | null) => void
    setUploadedFiles: (updater: any) => void
    setLimitWarning: (warning: string | null) => void
    allData: any[]
}

export function useCsvPersistence({
    activityId,
    coachId,
    productCategory,
    csvData,
    setCsvData,
    existingData,
    setExistingData,
    parentCsvData,
    parentSetCsvData,
    selectedRows,
    setSelectedRows,
    parentSetSelectedRows,
    onItemsStatusChange,
    onSuccess,
    onRemoveCSV,
    updateErrorState,
    setProcessing,
    setResult,
    loadExistingData,
    justDeletedRef,
    hasUserInteractedRef,
    fileInputRef,
    setFile,
    setUploadedFiles,
    setLimitWarning,
    allData
}: UseCsvPersistenceProps) {

    const handleDeleteSelected = useCallback(() => {
        if (selectedRows.size === 0) return

        const currentData = allData
        const selectedIndices = Array.from(selectedRows)
        const selectedKeys = new Set(selectedIndices.map(index => getRowIdentifier(currentData[index], index)).filter(Boolean))

        const markInactive = (row: any, index?: number) => {
            const key = getRowIdentifier(row, index)
            return (key && selectedKeys.has(key)) ? { ...row, is_active: false, activo: false } : row
        }

        const rowsToDisable = selectedIndices.map(index => currentData[index])
        setCsvData((prev: any) => prev.map((row: any, idx: number) => markInactive(row, idx)))
        setExistingData((prev: any) => prev.map((row: any, idx: number) => markInactive(row, idx)))

        if (onItemsStatusChange && rowsToDisable.length > 0) {
            onItemsStatusChange(rowsToDisable, 'disable')
        }

        if (parentSetCsvData) {
            parentSetCsvData((parentCsvData || []).map((row: any, idx: number) => markInactive(row, idx)))
        }

        setSelectedRows(new Set())
        if (parentSetSelectedRows) parentSetSelectedRows(new Set())
    }, [allData, selectedRows, setCsvData, setExistingData, onItemsStatusChange, parentSetCsvData, parentCsvData, setSelectedRows, parentSetSelectedRows])

    const handleRemoveSelected = useCallback(async () => {
        if (selectedRows.size === 0) {
            updateErrorState('Selecciona al menos una fila para eliminar')
            return
        }

        const selectedIndices = Array.from(selectedRows)
        const selectedItems = selectedIndices.map(index => allData[index])
        const idsToDelete = selectedItems.filter(item => item.id).map(item => item.id).filter((id): id is number => id !== undefined)
        const itemsToRemove = new Set(selectedIndices.map((index, i) => getRowIdentifier(selectedItems[i], index)).filter(Boolean))

        if (idsToDelete.length > 0 && (activityId >= 0)) {
            try {
                const endpoint = productCategory === 'nutricion' ? '/api/delete-nutrition-items' : '/api/delete-exercise-items'
                const response = await fetch(endpoint, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: idsToDelete, activityId })
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    updateErrorState(`Error al eliminar filas: ${errorData.error}`)
                    return
                }
                justDeletedRef.current = true
            } catch (error) {
                updateErrorState('Error al eliminar filas de la base de datos')
                return
            }
        }

        const shouldRemoveItem = (item: any, index?: number) => itemsToRemove.has(getRowIdentifier(item, index) || '')

        setCsvData((prev: any) => prev.filter((item: any, idx: number) => !shouldRemoveItem(item, idx)))
        setExistingData((prev: any) => prev.filter((item: any, idx: number) => !shouldRemoveItem(item, idx)))

        if (parentSetCsvData) {
            const filteredParent = (parentCsvData || []).filter((item: any, idx: number) => !shouldRemoveItem(item, idx))
            parentSetCsvData(filteredParent)
            if (activityId > 0) {
                sessionStorage.setItem(`activities_draft_${activityId}`, JSON.stringify(filteredParent))
                sessionStorage.setItem(`activities_draft_${activityId}_interacted`, 'true')
                hasUserInteractedRef.current = true
            }
        }

        setSelectedRows(new Set())
        if (parentSetSelectedRows) parentSetSelectedRows(new Set())
        setLimitWarning(null)
    }, [
        selectedRows,
        allData,
        activityId,
        productCategory,
        updateErrorState,
        setCsvData,
        setExistingData,
        parentSetCsvData,
        parentCsvData,
        setSelectedRows,
        parentSetSelectedRows,
        setLimitWarning,
        justDeletedRef,
        hasUserInteractedRef
    ])

    const handleReactivateSelected = useCallback(() => {
        if (selectedRows.size === 0) return

        const currentData = allData
        const selectedIndices = Array.from(selectedRows)
        const selectedKeys = new Set(selectedIndices.map(index => getRowIdentifier(currentData[index], index)).filter(Boolean))

        const markActive = (row: any, index?: number) => {
            const key = getRowIdentifier(row, index)
            return (key && selectedKeys.has(key)) ? { ...row, is_active: true, activo: true } : row
        }

        const rowsToReactivateRaw = selectedIndices.map(index => currentData[index])
        const rowsToReactivate = rowsToReactivateRaw.filter((item: any) => {
            if (!item || !item.isExisting || !item.id) return false
            if (activityId <= 0) return true
            const activityMap = item.activity_assignments || item.activity_map || item.activity_id
            return activityMap && typeof activityMap === 'object' && String(activityId) in activityMap
        })

        if (rowsToReactivate.length < rowsToReactivateRaw.length) {
            updateErrorState(`Se ignoraron algunos ejercicios porque ya no pertenecen a esta actividad.`)
        }

        if (rowsToReactivate.length === 0) {
            setSelectedRows(new Set())
            if (parentSetSelectedRows) parentSetSelectedRows(new Set())
            return
        }

        setCsvData((prev: any) => prev.map((row: any, idx: number) => markActive(row, idx)))
        setExistingData((prev: any) => prev.map((row: any, idx: number) => markActive(row, idx)))

        if (onItemsStatusChange) onItemsStatusChange(rowsToReactivate, 'reactivate')

        if (parentSetCsvData) {
            parentSetCsvData((parentCsvData || []).map((row: any, idx: number) => markActive(row, idx)))
        }

        setSelectedRows(new Set())
        if (parentSetSelectedRows) parentSetSelectedRows(new Set())
    }, [allData, selectedRows, activityId, setCsvData, setExistingData, onItemsStatusChange, parentSetCsvData, parentCsvData, setSelectedRows, parentSetSelectedRows, updateErrorState])

    const handleProcess = useCallback(async () => {
        if (!csvData.length) return
        if (!activityId || activityId <= 0) {
            updateErrorState('Primero guarda el programa para obtener un ID y poder guardar ejercicios.')
            return
        }

        setProcessing(true)
        updateErrorState(null)

        try {
            const response = await fetch('/api/process-csv-simple', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ csvData, activityId, coachId }),
            })

            const result = await response.json()
            if (!response.ok) throw new Error(result.error || 'Error al procesar el CSV')

            setResult(result)
            await loadExistingData()
            if (onSuccess) onSuccess()
        } catch (error) {
            updateErrorState(error instanceof Error ? error.message : 'Error desconocido')
        } finally {
            setProcessing(false)
        }
    }, [csvData, activityId, coachId, updateErrorState, setProcessing, setResult, loadExistingData, onSuccess])

    const handleReset = useCallback(async () => {
        justDeletedRef.current = true

        const allCurrentData = [...csvData, ...(parentCsvData || [])]
        const idsToDelete = allCurrentData.filter(item => !item.isExisting && item.id).map(item => item.id)

        if (idsToDelete.length > 0 && (activityId >= 0)) {
            try {
                const endpoint = productCategory === 'nutricion' ? '/api/delete-nutrition-items' : '/api/delete-exercise-items'
                const response = await fetch(endpoint, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: idsToDelete, activityId })
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    updateErrorState(`Error al eliminar filas: ${errorData.error}`)
                    justDeletedRef.current = false
                }
            } catch (error) {
                updateErrorState('Error al eliminar filas de la base de datos')
                justDeletedRef.current = false
            }
        }

        setFile(null)
        setUploadedFiles((prev: any) => [])
        updateErrorState(null)
        setResult(null)
        setSelectedRows(new Set())
        if (fileInputRef.current) fileInputRef.current.value = ''

        const onlyExistingData = existingData.filter(item => item.isExisting)
        setCsvData(onlyExistingData)

        if (parentSetCsvData) {
            const parentOnlyExisting = (parentCsvData || []).filter((item: any) => item.isExisting)
            parentSetCsvData(parentOnlyExisting)
            if (activityId > 0) {
                sessionStorage.setItem(`activities_draft_${activityId}`, JSON.stringify(parentOnlyExisting))
                sessionStorage.setItem(`activities_draft_${activityId}_interacted`, 'true')
                hasUserInteractedRef.current = true
            }
        }

        if (parentSetSelectedRows) parentSetSelectedRows(new Set())
        if (onRemoveCSV) onRemoveCSV()
        setLimitWarning(null)
        justDeletedRef.current = true
    }, [
        csvData,
        parentCsvData,
        activityId,
        productCategory,
        setFile,
        setUploadedFiles,
        updateErrorState,
        setResult,
        setSelectedRows,
        fileInputRef,
        existingData,
        setCsvData,
        parentSetCsvData,
        parentSetSelectedRows,
        onRemoveCSV,
        setLimitWarning,
        justDeletedRef,
        hasUserInteractedRef
    ])

    return {
        handleDeleteSelected,
        handleRemoveSelected,
        handleReactivateSelected,
        handleProcess,
        handleReset
    }
}
