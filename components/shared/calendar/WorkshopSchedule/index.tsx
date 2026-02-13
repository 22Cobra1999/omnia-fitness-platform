"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { ScheduleSidebar } from './components/ScheduleSidebar'
import { ScheduleCalendar } from './components/ScheduleCalendar'
import { ScheduleBlockList } from './components/ScheduleBlockList'
import { ScheduleBlockModal } from './components/ScheduleBlockModal'
import { useWorkshopScheduleLogic } from './hooks/useWorkshopScheduleLogic'
import { WorkshopScheduleManagerProps } from './types'

export function WorkshopScheduleManager({
    onScheduleChange,
    initialBlocks = [],
    existingActivities = []
}: WorkshopScheduleManagerProps) {
    const {
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
    } = useWorkshopScheduleLogic(initialBlocks, existingActivities, onScheduleChange)

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <ScheduleSidebar
                existingActivities={existingActivities}
                filteredActivities={filteredActivities}
                showExistingActivities={showExistingActivities}
                toggleAllActivities={toggleAllActivities}
                toggleActivityVisibility={toggleActivityVisibility}
                stats={stats}
            />

            <div className="lg:col-span-3 space-y-6">
                <ScheduleCalendar
                    allDates={calendarData.allDates}
                    colors={calendarData.colors}
                    getDateBlockColor={calendarData.getDateBlockColor}
                />

                <div className="flex justify-center">
                    <Button
                        onClick={() => setShowAddBlock(true)}
                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Bloque de Horario
                    </Button>
                </div>

                <ScheduleBlockList
                    blocks={blocks}
                    onEdit={handleEditBlock}
                    onRemove={handleRemoveBlock}
                />

                <ScheduleBlockModal
                    isOpen={showAddBlock}
                    onClose={handleCancelEdit}
                    onSave={handleAddBlock}
                    editingBlockId={editingBlockId}
                    newBlock={newBlock}
                    setNewBlock={setNewBlock}
                />
            </div>
        </div>
    )
}
