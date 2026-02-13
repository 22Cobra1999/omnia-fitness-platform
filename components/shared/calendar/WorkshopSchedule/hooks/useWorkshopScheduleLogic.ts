import { useState, useCallback, useMemo } from 'react'
import { TimeBlock, blockColors } from '../types'
import { generateDatesFromConfig } from '../utils/dateutils'

export function useWorkshopScheduleLogic(
    initialBlocks: TimeBlock[] = [],
    existingActivities: TimeBlock[] = [],
    onScheduleChange: (blocks: TimeBlock[]) => void
) {
    const [blocks, setBlocks] = useState<TimeBlock[]>(initialBlocks)
    const [showAddBlock, setShowAddBlock] = useState(false)
    const [editingBlockId, setEditingBlockId] = useState<string | null>(null)
    const [showExistingActivities, setShowExistingActivities] = useState(true)
    const [filteredActivities, setFilteredActivities] = useState<string[]>([])

    const initialNewBlockState: Partial<TimeBlock> = {
        name: '',
        startTime: '09:00',
        endTime: '10:00',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        color: blockColors[0],
        selectedDates: [],
        repeatType: 'days',
        repeatValues: [],
        selectedWeekDays: [],
        selectedWeeks: [],
        selectedMonths: []
    }

    const [newBlock, setNewBlock] = useState<Partial<TimeBlock>>(initialNewBlockState)

    const handleAddBlock = () => {
        if (!newBlock.name || !newBlock.startDate || !newBlock.endDate) {
            alert('Por favor completa todos los campos requeridos')
            return
        }

        if (new Date(newBlock.startDate) >= new Date(newBlock.endDate)) {
            alert('La fecha de inicio debe ser anterior a la fecha de fin')
            return
        }

        const generatedDates = generateDatesFromConfig(newBlock)

        let updatedBlocks: TimeBlock[]
        if (editingBlockId) {
            updatedBlocks = blocks.map(block =>
                block.id === editingBlockId
                    ? { ...newBlock, id: editingBlockId, selectedDates: generatedDates } as TimeBlock
                    : block
            )
            setEditingBlockId(null)
        } else {
            const newBlockWithId: TimeBlock = {
                ...newBlock,
                id: Date.now().toString(),
                selectedDates: generatedDates
            } as TimeBlock
            updatedBlocks = [...blocks, newBlockWithId]
        }

        setBlocks(updatedBlocks)
        onScheduleChange(updatedBlocks)
        setNewBlock(initialNewBlockState)
        setShowAddBlock(false)
    }

    const handleRemoveBlock = (blockId: string) => {
        const updatedBlocks = blocks.filter(block => block.id !== blockId)
        setBlocks(updatedBlocks)
        onScheduleChange(updatedBlocks)
    }

    const handleEditBlock = (block: TimeBlock) => {
        setEditingBlockId(block.id)
        setNewBlock({ ...block })
        setShowAddBlock(true)
    }

    const handleCancelEdit = () => {
        setEditingBlockId(null)
        setNewBlock(initialNewBlockState)
        setShowAddBlock(false)
    }

    const toggleActivityVisibility = (activityName: string) => {
        setFilteredActivities(prev =>
            prev.includes(activityName)
                ? prev.filter(name => name !== activityName)
                : [...prev, activityName]
        )
    }

    const toggleAllActivities = () => setShowExistingActivities(!showExistingActivities)

    const calendarData = useMemo(() => {
        const colors: { [key: string]: string } = {}
        const allDates: Date[] = []

        blocks.forEach(block => {
            colors[block.name] = block.color
            allDates.push(...block.selectedDates)
        })

        existingActivities.forEach(activity => {
            if (showExistingActivities && (filteredActivities.length === 0 || filteredActivities.includes(activity.name))) {
                if (!colors[activity.name]) {
                    colors[activity.name] = `${activity.color} opacity-50`
                }
                allDates.push(...activity.selectedDates)
            }
        })

        const getDateBlockColor = (date: Date) => {
            for (const block of blocks) {
                if (block.selectedDates.some(sd => sd.toDateString() === date.toDateString())) {
                    return block.color
                }
            }
            for (const activity of existingActivities) {
                if (showExistingActivities &&
                    (filteredActivities.length === 0 || filteredActivities.includes(activity.name)) &&
                    activity.selectedDates.some(sd => sd.toDateString() === date.toDateString())) {
                    return `${activity.color} opacity-50`
                }
            }
            return null
        }

        return { allDates, colors, getDateBlockColor }
    }, [blocks, existingActivities, showExistingActivities, filteredActivities])

    const stats = useMemo(() => ({
        totalActivities: existingActivities.length + blocks.length,
        totalSessions: existingActivities.reduce((t, a) => t + a.selectedDates.length, 0) +
            blocks.reduce((t, b) => t + b.selectedDates.length, 0)
    }), [blocks, existingActivities])

    return {
        blocks,
        newBlock,
        setNewBlock,
        showAddBlock,
        setShowAddBlock,
        editingBlockId,
        showExistingActivities,
        filteredActivities,
        handleAddBlock,
        handleRemoveBlock,
        handleEditBlock,
        handleCancelEdit,
        toggleActivityVisibility,
        toggleAllActivities,
        calendarData,
        stats
    }
}
