import { useCallback } from 'react'

interface UseCsvSelectionProps {
    selectedRows: Set<number>
    setSelectedRows: (rows: Set<number>) => void
    parentSetSelectedRows?: (rows: Set<number>) => void
}

export function useCsvSelection({
    selectedRows,
    setSelectedRows,
    parentSetSelectedRows
}: UseCsvSelectionProps) {
    const handleRowSelection = useCallback((index: number) => {
        const newSelected = new Set(selectedRows)
        if (newSelected.has(index)) {
            newSelected.delete(index)
        } else {
            newSelected.add(index)
        }

        setSelectedRows(newSelected)
        if (parentSetSelectedRows) {
            parentSetSelectedRows(newSelected)
        }
    }, [selectedRows, setSelectedRows, parentSetSelectedRows])

    return {
        handleRowSelection
    }
}
