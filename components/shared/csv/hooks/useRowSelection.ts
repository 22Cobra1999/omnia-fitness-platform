
import { useState, useCallback } from 'react'

export function useRowSelection(
    initialSelection: Set<number> = new Set(),
    onSelectionChange?: (rows: Set<number>) => void
) {
    const [selectedRows, setSelectedRowsInternal] = useState<Set<number>>(initialSelection)

    const updateSelection = (newSelection: Set<number>) => {
        setSelectedRowsInternal(newSelection)
        if (onSelectionChange) {
            onSelectionChange(newSelection)
        }
    }

    const toggleRow = useCallback((index: number) => {
        const newSelection = new Set(selectedRows)
        if (newSelection.has(index)) {
            newSelection.delete(index)
        } else {
            newSelection.add(index)
        }
        updateSelection(newSelection)
    }, [selectedRows, onSelectionChange])

    const selectAll = useCallback((indices: number[]) => {
        const newSelection = new Set(selectedRows)
        indices.forEach(idx => newSelection.add(idx))
        updateSelection(newSelection)
    }, [selectedRows, onSelectionChange])

    const deselectAll = useCallback((indices: number[]) => {
        const newSelection = new Set(selectedRows)
        indices.forEach(idx => newSelection.delete(idx))
        updateSelection(newSelection)
    }, [selectedRows, onSelectionChange])

    const clearSelection = useCallback(() => {
        updateSelection(new Set())
    }, [onSelectionChange])

    return {
        selectedRows,
        toggleRow,
        selectAll,
        deselectAll,
        clearSelection
    }
}
