"use client"

import React from 'react'
import { useActivityCalendarLogic } from '@/hooks/mobile/useActivityCalendarLogic'
import { CalendarHeader } from './calendar/CalendarHeader'
import { CalendarGrid } from './calendar/CalendarGrid'
import { MoveActivityDialog } from './calendar/MoveActivityDialog'

interface ActivityCalendarProps {
  userId?: string
}

const ActivityCalendar = ({ userId }: ActivityCalendarProps) => {
  const {
    currentDate,
    activityFilter,
    setActivityFilter,
    loading,
    monthlyData,
    monthNames,
    dayNames,
    isEditing,
    toggleEditMode,
    sourceDate,
    targetDate,
    showConfirmModal,
    setShowConfirmModal,
    applyToAllSameDays,
    setApplyToAllSameDays,
    isUpdating,
    goToPreviousMonth,
    goToNextMonth,
    handleDayClick,
    handleConfirmUpdate,
    getDayName
  } = useActivityCalendarLogic(userId)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="space-y-4 max-w-full overflow-x-hidden">
        {/* Header and Filtering */}
        <CalendarHeader
          monthName={monthNames[currentDate.getMonth()]}
          year={currentDate.getFullYear()}
          activityFilter={activityFilter}
          setActivityFilter={setActivityFilter}
          onPrevMonth={goToPreviousMonth}
          onNextMonth={goToNextMonth}
        />

        {/* Edit Mode Banner */}
        {isEditing && (
          <div className="bg-[#FF7939]/10 border border-[#FF7939]/20 rounded-lg p-2 text-center text-xs text-[#FF7939] animate-in fade-in slide-in-from-top-2">
            {!sourceDate
              ? "Selecciona el día que quieres mover"
              : "Ahora selecciona el día destino"}
          </div>
        )}

        {/* Days Grid */}
        <CalendarGrid
          monthlyData={monthlyData}
          dayNames={dayNames}
          sourceDate={sourceDate}
          isEditing={isEditing}
          handleDayClick={handleDayClick}
        />
      </div>

      {/* Confirmation Dialog */}
      <MoveActivityDialog
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        sourceDate={sourceDate}
        targetDate={targetDate}
        isUpdating={isUpdating}
        onConfirm={handleConfirmUpdate}
        applyToAllSameDays={applyToAllSameDays}
        setApplyToAllSameDays={setApplyToAllSameDays}
        getDayName={getDayName}
      />
    </div>
  )
}

export default ActivityCalendar
