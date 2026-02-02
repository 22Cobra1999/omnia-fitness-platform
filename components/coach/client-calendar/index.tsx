"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/supabase-client'
import { OmniaLoader } from "@/components/shared/ui/omnia-loader"

// Types & Utils
import { ClientCalendarProps, ExerciseExecution, DayData, ClientDaySummaryRow, ActivityFilterOption } from './types'
import { getDayNamePlural, monthNames, dayNames, formatDate } from './utils/date-helpers'

// Hooks
import { useCalendarNavigation } from './hooks/useCalendarNavigation'
import { useCalendarData } from './hooks/useCalendarData'
import { useNutrition } from './hooks/useNutrition'
import { useFitness } from './hooks/useFitness'
import { useCascadeUpdates } from './hooks/useCascadeUpdates'

// Components
import { CalendarHeader } from './sub-components/CalendarHeader'
import { CalendarGrid } from './sub-components/CalendarGrid'
import { DayDetailsPanel } from './sub-components/DayDetailsPanel'
import { CascadeModal } from './sub-components/CascadeModal'
import { IngredientsModal } from './sub-components/IngredientsModal'
import { ConfirmationModal } from './sub-components/ConfirmationModal'
import { NutritionDeleteModal } from './sub-components/NutritionDeleteModal'

export function ClientCalendar({ clientId, onLastWorkoutUpdate, onDaySelected, exercisesListRef }: ClientCalendarProps) {
  const router = useRouter()
  const supabase = createClient()
  const [currentCoachId, setCurrentCoachId] = useState<string | null>(null)
  const internalRef = useRef<HTMLDivElement | null>(null)
  const dayDetailRef = exercisesListRef ?? internalRef

  // State
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // 1. Navigation Hook
  const {
    currentDate, showMonthPicker, monthPickerYear, setMonthPickerYear,
    goToPreviousMonth, goToNextMonth, toggleMonthPicker, handleSelectMonth, generateCalendarDays
  } = useCalendarNavigation()

  // 2. Data Hook
  const {
    dayData, summaryRowsByDate, activityDetailsByKey, setActivityDetailsByKey,
    monthlyProgress, eventDetailsByKey, activityFilterOptions,
    activeEnrollmentFilterId, setActiveEnrollmentFilterId,
    loading: dataLoading,
    fetchClientCalendarSummary, loadDayActivityDetails, loadEventDetails, getDayData
  } = useCalendarData(supabase, clientId, currentDate, onLastWorkoutUpdate)

  useEffect(() => {
    if (!dataLoading) setLoading(false)
  }, [dataLoading])

  // 3. Cascade Updates Hook
  const { cascadeModal, setCascadeModal, handleApplyCascade } = useCascadeUpdates(
    supabase, clientId, fetchClientCalendarSummary, loadDayActivityDetails, setActivityDetailsByKey, setLoading
  )

  // 4. Nutrition Hook
  const {
    editingNutritionId, editingNutritionMacros, editingNutritionPlateId,
    setEditingNutritionPlateId, setEditingNutritionMacros,
    nutritionPlateOptionsByActivity, showIngredientsModal, setShowIngredientsModal,
    editingIngredientsList, setEditingIngredientsList, editingNutritionExercise,
    confirmDeleteNutritionId, setConfirmDeleteNutritionId,
    handleEditNutrition, handleSaveNutrition, handleCancelNutrition, handleDeleteNutrition,
    handleOpenIngredients, canEditNutritionForDay
  } = useNutrition(supabase, clientId, fetchClientCalendarSummary, loadDayActivityDetails, setCascadeModal, setLoading)

  // 5. Fitness Hook
  const {
    editingExerciseId, setEditingExerciseId, setEditingOriginalExercise,
    showExerciseDropdown, setShowExerciseDropdown, availableExercises,
    loadAvailableExercises, handleChangeExercise, canEditFitnessForDay
  } = useFitness(supabase, clientId, fetchClientCalendarSummary, loadDayActivityDetails, setCascadeModal, setLoading)

  const [expandedActivityKeys, setExpandedActivityKeys] = useState<Record<string, boolean>>({})

  // Date Mutation State
  const [isSelectingNewDate, setIsSelectingNewDate] = useState(false)
  const [editingDate, setEditingDate] = useState<Date | null>(null)
  const [newDate, setNewDate] = useState<Date | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [applyToAllSameDays, setApplyToAllSameDays] = useState(false)
  const [selectedActivityIdsForDateChange, setSelectedActivityIdsForDateChange] = useState<string[]>([])
  const [selectedDayForEdit, setSelectedDayForEdit] = useState<Date | null>(null)
  const [targetDayForEdit, setTargetDayForEdit] = useState<Date | null>(null)

  // Initial Coach Fetch
  useEffect(() => {
    supabase.auth.getUser().then(({ data }: any) => setCurrentCoachId(data?.user?.id ?? null))
  }, [supabase])

  // Scroll to detail
  useEffect(() => {
    if (selectedDate && dayDetailRef.current) {
      setTimeout(() => dayDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    }
  }, [selectedDate, dayDetailRef])

  // UI Handlers
  const handleDayClick = (date: Date) => {
    if (isSelectingNewDate) {
      setTargetDayForEdit(date); setNewDate(date); setShowConfirmModal(true)
      return
    }
    setSelectedDate(date); setActivityDetailsByKey({})
    setSelectedDayForEdit(null); setTargetDayForEdit(null)
    onDaySelected?.()
  }

  const handleEditDate = (date: Date) => {
    setIsSelectingNewDate(true); setEditingDate(date); setSelectedDayForEdit(date)
  }

  const confirmUpdateDate = async () => {
    if (!editingDate || !newDate || selectedActivityIdsForDateChange.length === 0) return
    setLoading(true)
    try {
      const sourceDateStr = editingDate.toISOString().split('T')[0]
      const targetDateStr = newDate.toISOString().split('T')[0]
      const daySuffix = String(editingDate.getDay())
      const targetDaySuffix = String(newDate.getDay())

      // Move Fitness
      const { data: fitRows } = await supabase.from('progreso_cliente').select('*').eq('cliente_id', clientId)
      const toUpdateFit = (fitRows as any[])?.filter((r: any) => {
        if (applyToAllSameDays) return r.fecha.endsWith(daySuffix)
        return r.fecha === sourceDateStr
      }) || []

      for (const row of toUpdateFit) {
        if (applyToAllSameDays) {
          // Replace day suffix logic...
        }
        await supabase.from('progreso_cliente').update({ fecha: targetDateStr }).eq('id', row.id)
      }

      // Move Nutrition
      const { data: nutRows } = await supabase.from('progreso_cliente_nutricion').select('*').eq('cliente_id', clientId).eq('fecha', sourceDateStr)
      if (nutRows) {
        for (const row of nutRows) {
          await supabase.from('progreso_cliente_nutricion').update({ fecha: targetDateStr }).eq('id', row.id)
        }
      }

      await fetchClientCalendarSummary()
      setShowConfirmModal(false); setIsSelectingNewDate(false); setEditingDate(null); setNewDate(null)
      setSelectedDayForEdit(null); setTargetDayForEdit(null); setApplyToAllSameDays(false)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading && Object.keys(dayData).length === 0) return <OmniaLoader />

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto p-4 md:p-6 bg-black min-h-screen text-white font-sans selection:bg-[#FF7939]/30">
      <CalendarHeader
        currentDate={currentDate} showMonthPicker={showMonthPicker} monthPickerYear={monthPickerYear}
        setMonthPickerYear={setMonthPickerYear} goToPreviousMonth={goToPreviousMonth} goToNextMonth={goToNextMonth}
        toggleMonthPicker={toggleMonthPicker} monthlyProgress={monthlyProgress} monthNames={monthNames}
      />

      {showMonthPicker && (
        <div className="w-full mb-4 overflow-x-auto">
          <div className="flex gap-2 whitespace-nowrap pb-1">
            {monthNames.map((m, idx) => (
              <button key={m} onClick={() => handleSelectMonth(idx)} className={`px-3 py-1 rounded-full text-xs font-semibold ${monthPickerYear === currentDate.getFullYear() && idx === currentDate.getMonth() ? 'bg-[#FF7939] text-white' : 'bg-zinc-800/60 text-gray-300'}`}>{m}</button>
            ))}
          </div>
        </div>
      )}

      <CalendarGrid
        days={generateCalendarDays()} currentDate={currentDate} selectedDate={selectedDate}
        handleDayClick={handleDayClick} summaryRowsByDate={summaryRowsByDate}
        monthlyProgress={monthlyProgress} currentCoachId={currentCoachId} clientId={clientId}
        selectedDayForEdit={selectedDayForEdit} targetDayForEdit={targetDayForEdit}
        dayNames={dayNames} getDayData={getDayData}
      />

      {activityFilterOptions.length > 0 && (
        <div className="w-full overflow-x-auto mt-4">
          <div className="flex gap-2 whitespace-nowrap pb-1">
            <button onClick={() => setActiveEnrollmentFilterId(null)} className={`px-3 py-1 rounded-full text-xs font-semibold ${!activeEnrollmentFilterId ? 'bg-[#FF7939] text-white' : 'bg-zinc-800/60 text-gray-300'}`}>Todas</button>
            {activityFilterOptions.map(opt => (
              <button key={opt.enrollment_id} onClick={() => setActiveEnrollmentFilterId(opt.enrollment_id)} className={`px-3 py-1 rounded-full text-xs font-semibold ${activeEnrollmentFilterId === opt.enrollment_id ? 'bg-[#FF7939] text-white' : 'bg-zinc-800/60 text-gray-300'}`}>{opt.title} v{opt.version}</button>
            ))}
          </div>
        </div>
      )}

      <div ref={dayDetailRef} className="mt-8">
        {selectedDate && (
          <DayDetailsPanel
            selectedDate={selectedDate} summaryRowsByDate={summaryRowsByDate}
            currentCoachId={currentCoachId} clientId={clientId}
            isSelectingNewDate={isSelectingNewDate} handleEditDate={handleEditDate}
            expandedActivityKeys={expandedActivityKeys} setExpandedActivityKeys={setExpandedActivityKeys}
            loadDayActivityDetails={loadDayActivityDetails} loadEventDetails={loadEventDetails}
            eventDetailsByKey={eventDetailsByKey} activityDetailsByKey={activityDetailsByKey}
            nutritionPlateOptionsByActivity={nutritionPlateOptionsByActivity}
            canEditNutritionForDay={canEditNutritionForDay} canEditFitnessForDay={canEditFitnessForDay}
            handleEditNutrition={handleEditNutrition} editingExerciseId={editingExerciseId}
            setEditingExerciseId={setEditingExerciseId} setEditingOriginalExercise={setEditingOriginalExercise}
            loadAvailableExercises={loadAvailableExercises} showExerciseDropdown={showExerciseDropdown}
            setShowExerciseDropdown={setShowExerciseDropdown} availableExercises={availableExercises}
            handleChangeExercise={handleChangeExercise} editingNutritionId={editingNutritionId}
            editingNutritionPlateId={editingNutritionPlateId}
            editingNutritionMacros={editingNutritionMacros} setEditingNutritionPlateId={setEditingNutritionPlateId}
            setEditingNutritionMacros={setEditingNutritionMacros} handleOpenIngredients={handleOpenIngredients}
            handleSaveNutrition={handleSaveNutrition} handleCancelNutrition={handleCancelNutrition}
            setConfirmDeleteNutritionId={setConfirmDeleteNutritionId} router={router}
          />
        )}
      </div>

      {cascadeModal && <CascadeModal cascadeModal={cascadeModal} setCascadeModal={setCascadeModal} handleApplyCascade={handleApplyCascade} />}
      <IngredientsModal showIngredientsModal={showIngredientsModal} setShowIngredientsModal={setShowIngredientsModal} editingNutritionExercise={editingNutritionExercise} editingIngredientsList={editingIngredientsList} setEditingIngredientsList={setEditingIngredientsList} handleSaveNutrition={handleSaveNutrition} />
      <ConfirmationModal showConfirmModal={showConfirmModal} setShowConfirmModal={setShowConfirmModal} editingDate={editingDate} newDate={newDate} getDayData={getDayData} selectedActivityIdsForDateChange={selectedActivityIdsForDateChange} setSelectedActivityIdsForDateChange={setSelectedActivityIdsForDateChange} applyToAllSameDays={applyToAllSameDays} setApplyToAllSameDays={setApplyToAllSameDays} confirmUpdateDate={confirmUpdateDate} dayData={dayData} summaryRowsByDate={summaryRowsByDate} />
      <NutritionDeleteModal confirmDeleteNutritionId={confirmDeleteNutritionId} setConfirmDeleteNutritionId={setConfirmDeleteNutritionId} handleDeleteNutrition={handleDeleteNutrition} />
    </div>
  )
}
