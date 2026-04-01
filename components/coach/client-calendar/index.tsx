"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/supabase-client'
import { OmniaLoader } from "@/components/shared/ui/omnia-loader"
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels"

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
    dayData, summaryRowsByDate, filteredSummaryRows, activityDetailsByKey, setActivityDetailsByKey,
    monthlyProgress, eventDetailsByKey, activityFilterOptions,
    activeEnrollmentFilterId, setActiveEnrollmentFilterId,
    loading: dataLoading, activityEndDates, dishNameMap,
    fetchClientCalendarSummary, loadDayActivityDetails, loadEventDetails, getDayData
  } = useCalendarData(supabase, clientId, currentDate, onLastWorkoutUpdate, currentCoachId)

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
    editingExerciseId, setEditingExerciseId, editingOriginalExercise, setEditingOriginalExercise,
    showExerciseDropdown, setShowExerciseDropdown, availableExercises,
    editingFitnessValues, setEditingFitnessValues,
    loadAvailableExercises, handleChangeExercise, canEditFitnessForDay,
    handleEditFitness, handleSaveFitness, handleCancelFitness
  } = useFitness(supabase, clientId, fetchClientCalendarSummary, loadDayActivityDetails, setCascadeModal, setLoading)

  const [expandedActivityKeys, setExpandedActivityKeys] = useState<Record<string, boolean>>({})
  const [lastExpandedEnrollmentId, setLastExpandedEnrollmentId] = useState<number | null>(null)

  // Date Mutation State
  const [isSelectingNewDate, setIsSelectingNewDate] = useState(false)
  const [editingDate, setEditingDate] = useState<Date | null>(null)
  const [newDate, setNewDate] = useState<Date | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [applyToAllSameDays, setApplyToAllSameDays] = useState(false)
  const [selectedActivityIdsForDateChange, setSelectedActivityIdsForDateChange] = useState<string[]>([])
  const [selectedDayForEdit, setSelectedDayForEdit] = useState<Date | null>(null)
  const [targetDayForEdit, setTargetDayForEdit] = useState<Date | null>(null)
  const [isReorganizing, setIsReorganizing] = useState(false)

  const maxMoveDate = useMemo(() => {
    if (!isSelectingNewDate || !editingDate) return null
    const dayStr = editingDate.toISOString().split('T')[0]
    const rows = summaryRowsByDate[dayStr] || []
    const ownedIds = rows
      .filter(r => !r.calendar_event_id && (r.coach_id === null || String(r.coach_id) === String(currentCoachId)))
      .map(r => r.activity_id)
      .filter(Boolean) as number[]
    
    if (ownedIds.length === 0) return null
    
    const endDates = ownedIds.map(id => activityEndDates[id]).filter(Boolean)
    if (endDates.length === 0) return null
    
    return new Date(Math.min(...endDates.map(d => new Date(d).getTime())))
  }, [isSelectingNewDate, editingDate, summaryRowsByDate, activityEndDates, currentCoachId, summaryRowsByDate])
  
  const filteredMonthlyProgress = useMemo(() => {
    if (!activeEnrollmentFilterId) return monthlyProgress
    return monthlyProgress.filter(p => 
      p.enrollment_id === activeEnrollmentFilterId || p.actividad_id === activeEnrollmentFilterId
    )
  }, [monthlyProgress, activeEnrollmentFilterId])

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

    const dayStr = date.toISOString().split('T')[0]
    setSelectedDate(date)
    // We don't clear activityDetailsByKey anymore to allow smoother transitions
    setSelectedDayForEdit(null); setTargetDayForEdit(null)
    onDaySelected?.()

    // Sync logic: if we have a lastExpandedEnrollmentId, try to find it on the new day
    if (lastExpandedEnrollmentId) {
      const dayRows = summaryRowsByDate[dayStr] || []
      const match = dayRows.find(r => r.enrollment_id === lastExpandedEnrollmentId || r.activity_id === lastExpandedEnrollmentId)
      if (match) {
        const activityId = match.activity_id ? Number(match.activity_id) : null
        const eventId = match.calendar_event_id
        const expandedKey = activityId ? `${dayStr}::${String(activityId)}` : (eventId ? `${dayStr}::event::${eventId}` : null)
        
        if (expandedKey) {
          setExpandedActivityKeys(prev => ({ ...prev, [expandedKey]: true }))
          if (activityId) loadDayActivityDetails(dayStr, activityId)
          if (eventId) loadEventDetails(eventId)
        }
      }
    }
  }

  const handleEditDate = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date < today) return // Don't allow moving past dates
    
    setIsSelectingNewDate(true); setEditingDate(date); setSelectedDayForEdit(date)
  }

  const confirmUpdateDate = async () => {
    if (!editingDate || !newDate || selectedActivityIdsForDateChange.length === 0) return
    setIsReorganizing(true)
    try {
      const sourceDateStr = editingDate.toISOString().split('T')[0]
      const targetDateStr = newDate.toISOString().split('T')[0]
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString().split('T')[0]

      if (applyToAllSameDays) {
        // Cascade logic for future days with same weekday
        const weekday = editingDate.getDay()
        
        // Calculate the difference in days between the new date and the original date
        // Use a safe midday calculation to avoid timezone issues
        const sourceMidday = new Date(editingDate.toISOString().split('T')[0] + 'T12:00:00')
        const targetMidday = new Date(newDate.toISOString().split('T')[0] + 'T12:00:00')
        const diffDays = Math.round((targetMidday.getTime() - sourceMidday.getTime()) / (1000 * 60 * 60 * 24))
        
        // 1. Fetch ALL future entries for these activities
        const { data: allFit } = await supabase
          .from('progreso_cliente')
          .select('id, fecha, actividad_id')
          .eq('cliente_id', clientId)
          .in('actividad_id', selectedActivityIdsForDateChange)
          .gte('fecha', sourceDateStr)

        if (allFit) {
          for (const row of allFit) {
            const rowDate = new Date(row.fecha + 'T12:00:00')
            if (rowDate.getDay() === weekday) {
              const d = new Date(row.fecha + 'T12:00:00')
              d.setDate(d.getDate() + diffDays)
              const newDayStr = d.toISOString().split('T')[0]
              
              await supabase.from('progreso_cliente').update({ fecha: newDayStr }).eq('id', row.id)
            }
          }
        }

        // Same for Nutrition
        const { data: allNutri } = await supabase
          .from('progreso_cliente_nutricion')
          .select('id, fecha, actividad_id')
          .eq('cliente_id', clientId)
          .in('actividad_id', selectedActivityIdsForDateChange)
          .gte('fecha', sourceDateStr)

        if (allNutri) {
          for (const row of allNutri) {
            const rowDate = new Date(row.fecha + 'T12:00:00')
            if (rowDate.getDay() === weekday) {
              const d = new Date(row.fecha + 'T12:00:00')
              d.setDate(d.getDate() + diffDays)
              const newDayStr = d.toISOString().split('T')[0]
              await supabase.from('progreso_cliente_nutricion').update({ fecha: newDayStr }).eq('id', row.id)
            }
          }
        }
      } else {
        // Single day move
        for (const actId of selectedActivityIdsForDateChange) {
          await supabase.from('progreso_cliente').update({ fecha: targetDateStr }).eq('cliente_id', clientId).eq('fecha', sourceDateStr).eq('actividad_id', actId)
          await supabase.from('progreso_cliente_nutricion').update({ fecha: targetDateStr }).eq('cliente_id', clientId).eq('fecha', sourceDateStr).eq('actividad_id', actId)
        }
      }

      await fetchClientCalendarSummary()
      setShowConfirmModal(false); setIsSelectingNewDate(false); setEditingDate(null); setNewDate(null)
      setSelectedDayForEdit(null); setTargetDayForEdit(null); setApplyToAllSameDays(false)
    } catch (e) {
      console.error(e)
    } finally {
      setIsReorganizing(false)
    }
  }

  if (loading && Object.keys(dayData).length === 0) return (
    <div className="bg-black min-h-screen">
      <OmniaLoader />
    </div>
  )

  return (
    <div className="w-full bg-black h-screen overflow-hidden text-white font-sans selection:bg-[#FF7939]/30">
      <PanelGroup direction="horizontal" className="w-full h-full">
        {/* ── LEFT: Calendar (70%) ── */}
        <Panel defaultSize={65} minSize={30} className="h-full flex flex-col">
          <div className="h-full flex flex-col gap-4 p-4 md:p-6 overflow-y-auto border-r border-zinc-800/60">
            {/* Activity filter and counts row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {activityFilterOptions.length > 0 && (
                <div className="flex-1 overflow-x-auto scrollbar-none">
                  <div className="flex gap-1.5 whitespace-nowrap pb-0.5">
                    <button
                      onClick={() => setActiveEnrollmentFilterId(null)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                        !activeEnrollmentFilterId
                          ? 'bg-[#FF7939] text-black shadow-sm'
                          : 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-700/60 hover:text-zinc-200'
                      }`}
                    >
                      Todos
                    </button>
                    {activityFilterOptions.map(opt => (
                      <button
                        key={opt.enrollment_id}
                        onClick={() => setActiveEnrollmentFilterId(opt.enrollment_id)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all max-w-[160px] ${
                          activeEnrollmentFilterId === opt.enrollment_id
                            ? 'bg-[#FF7939] text-black shadow-sm'
                            : 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-700/60 hover:text-zinc-200'
                        }`}
                      >
                        <span className="block truncate">{opt.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Counts section - for the current view (month or filtered) */}
              {(() => {
                const nonMeetProgress = filteredMonthlyProgress.filter(p => !p.calendar_event_id);
                // Sum of items (exercises + dishes) as "Actividades"
                const totalActivities = nonMeetProgress.reduce((acc, p) => acc + (Number(p.fit_items_o || 0) + Number(p.nut_items_o || 0)), 0);
                const completedActivities = nonMeetProgress.reduce((acc, p) => acc + (Number(p.fit_items_c || 0) + Number(p.nut_items_c || 0)), 0);

                const daysMap: Record<string, any[]> = {}
                nonMeetProgress.forEach(p => { if (!daysMap[p.fecha]) daysMap[p.fecha] = []; daysMap[p.fecha].push(p) })
                const completedDays = Object.values(daysMap).filter(items => 
                  items.every(p => {
                    const ok = (Number(p.fit_items_c) || 0) + (Number(p.nut_items_c) || 0);
                    const tot = (Number(p.fit_items_o) || 0) + (Number(p.nut_items_o) || 0);
                    return tot > 0 && ok >= tot;
                  })
                ).length;
                const totalDays = Object.keys(daysMap).length;

                return (
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-center">
                      <div className="text-[14px] font-bold flex items-baseline justify-center gap-0.5 leading-none">
                        <span className="text-[#FF7939]">{completedActivities}</span>
                        <span className="text-gray-500 text-xs">/</span>
                        <span className="text-white">{totalActivities}</span>
                      </div>
                      <div className="text-[9px] uppercase font-bold text-gray-500 tracking-wider mt-0.5">Actividades</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[14px] font-bold flex items-baseline justify-center gap-0.5 leading-none">
                        <span className="text-[#FF7939]">{completedDays}</span>
                        <span className="text-gray-500 text-xs">/</span>
                        <span className="text-white">{totalDays}</span>
                      </div>
                      <div className="text-[9px] uppercase font-bold text-gray-500 tracking-wider mt-0.5">Días</div>
                    </div>
                  </div>
                )
              })()}
            </div>

            <CalendarHeader
              currentDate={currentDate} showMonthPicker={showMonthPicker} monthPickerYear={monthPickerYear}
              setMonthPickerYear={setMonthPickerYear} goToPreviousMonth={goToPreviousMonth} goToNextMonth={goToNextMonth}
              toggleMonthPicker={toggleMonthPicker} 
              monthlyProgress={filteredMonthlyProgress} 
              monthNames={monthNames}
            />

            {showMonthPicker && (
              <div className="w-full overflow-x-auto">
                <div className="flex gap-2 whitespace-nowrap pb-1">
                  {monthNames.map((m, idx) => (
                    <button key={m} onClick={() => handleSelectMonth(idx)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${monthPickerYear === currentDate.getFullYear() && idx === currentDate.getMonth() ? 'bg-[#FF7939] text-white' : 'bg-zinc-800/60 text-gray-300'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <CalendarGrid
              days={generateCalendarDays()} currentDate={currentDate} selectedDate={selectedDate}
              handleDayClick={handleDayClick} summaryRowsByDate={filteredSummaryRows}
              monthlyProgress={monthlyProgress} currentCoachId={currentCoachId} clientId={clientId}
              selectedDayForEdit={selectedDayForEdit} targetDayForEdit={targetDayForEdit}
              dayNames={dayNames} getDayData={getDayData}
              isSelectingNewDate={isSelectingNewDate} maxMoveDate={maxMoveDate}
            />
            {/* Mobile: Day Details below calendar */}
            <div ref={dayDetailRef} className="md:hidden mt-6">
              {selectedDate && (
                <DayDetailsPanel
                  selectedDate={selectedDate} summaryRowsByDate={summaryRowsByDate}
                  currentCoachId={currentCoachId} clientId={clientId}
                  isSelectingNewDate={isSelectingNewDate} handleEditDate={handleEditDate}
                  expandedActivityKeys={expandedActivityKeys} setExpandedActivityKeys={setExpandedActivityKeys}
                  onActivityExpanded={(row: ClientDaySummaryRow) => {
                    setLastExpandedEnrollmentId(row.enrollment_id ?? row.activity_id ?? null)
                  }}
                  loadDayActivityDetails={loadDayActivityDetails} loadEventDetails={loadEventDetails}
                  eventDetailsByKey={eventDetailsByKey} activityDetailsByKey={activityDetailsByKey}
                  nutritionPlateOptionsByActivity={nutritionPlateOptionsByActivity}
                  canEditNutritionForDay={canEditNutritionForDay} canEditFitnessForDay={canEditFitnessForDay}
                  handleEditNutrition={handleEditNutrition} editingExerciseId={editingExerciseId}
                  editingOriginalExercise={editingOriginalExercise}
                  setEditingExerciseId={setEditingExerciseId} setEditingOriginalExercise={setEditingOriginalExercise}
                  loadAvailableExercises={loadAvailableExercises} showExerciseDropdown={showExerciseDropdown}
                  setShowExerciseDropdown={setShowExerciseDropdown} availableExercises={availableExercises}
                  handleChangeExercise={handleChangeExercise} editingNutritionId={editingNutritionId}
                  editingNutritionPlateId={editingNutritionPlateId}
                  editingNutritionMacros={editingNutritionMacros} setEditingNutritionPlateId={setEditingNutritionPlateId}
                  setEditingNutritionMacros={setEditingNutritionMacros} handleOpenIngredients={handleOpenIngredients}
                  handleSaveNutrition={handleSaveNutrition} handleCancelNutrition={handleCancelNutrition}
                  setConfirmDeleteNutritionId={setConfirmDeleteNutritionId} router={router}
                  handleEditFitness={handleEditFitness} handleSaveFitness={handleSaveFitness}
                  handleCancelFitness={handleCancelFitness} editingFitnessValues={editingFitnessValues}
                  setEditingFitnessValues={setEditingFitnessValues}
                  loading={loading}
                />
              )}
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="hidden md:flex w-1.5 items-center justify-center bg-transparent group relative hover:bg-[#FF7939]/10 transition-colors cursor-col-resize">
          <div className="w-[1px] h-12 bg-zinc-800/60 group-hover:bg-[#FF7939]/40 group-active:bg-[#FF7939] transition-colors" />
        </PanelResizeHandle>

        {/* ── RIGHT: Day Details Panel (desktop only) ── */}
        <Panel defaultSize={35} minSize={20} className="hidden md:flex h-full flex-col">
          <div className="h-full flex flex-col p-5 overflow-y-auto scrollbar-thin scrollbar-track-zinc-900 scrollbar-thumb-zinc-700">
            {selectedDate ? (
              <DayDetailsPanel
                selectedDate={selectedDate}
                summaryRowsByDate={summaryRowsByDate}
                currentCoachId={currentCoachId}
                clientId={clientId}
                isSelectingNewDate={isSelectingNewDate}
                handleEditDate={handleEditDate}
                expandedActivityKeys={expandedActivityKeys}
                setExpandedActivityKeys={setExpandedActivityKeys}
                onActivityExpanded={(row: ClientDaySummaryRow) => {
                  setLastExpandedEnrollmentId(row.enrollment_id ?? row.activity_id ?? null)
                }}
                loadDayActivityDetails={loadDayActivityDetails}
                loadEventDetails={loadEventDetails}
                eventDetailsByKey={eventDetailsByKey}
                activityDetailsByKey={activityDetailsByKey}
                nutritionPlateOptionsByActivity={nutritionPlateOptionsByActivity}
                dishNameMap={dishNameMap}
                canEditNutritionForDay={canEditNutritionForDay}
                canEditFitnessForDay={canEditFitnessForDay}
                handleEditNutrition={handleEditNutrition}
                editingExerciseId={editingExerciseId}
                editingOriginalExercise={editingOriginalExercise}
                setEditingExerciseId={setEditingExerciseId} setEditingOriginalExercise={setEditingOriginalExercise}
                loadAvailableExercises={loadAvailableExercises} showExerciseDropdown={showExerciseDropdown}
                setShowExerciseDropdown={setShowExerciseDropdown} availableExercises={availableExercises}
                handleChangeExercise={handleChangeExercise} editingNutritionId={editingNutritionId}
                editingNutritionPlateId={editingNutritionPlateId}
                editingNutritionMacros={editingNutritionMacros} setEditingNutritionPlateId={setEditingNutritionPlateId}
                setEditingNutritionMacros={setEditingNutritionMacros} handleOpenIngredients={handleOpenIngredients}
                handleSaveNutrition={handleSaveNutrition} handleCancelNutrition={handleCancelNutrition}
                setConfirmDeleteNutritionId={setConfirmDeleteNutritionId} router={router}
                handleEditFitness={handleEditFitness} handleSaveFitness={handleSaveFitness}
                handleCancelFitness={handleCancelFitness} editingFitnessValues={editingFitnessValues}
                setEditingFitnessValues={setEditingFitnessValues}
                loading={loading}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center mb-3">
                  <span className="text-zinc-700 text-sm">→</span>
                </div>
                <p className="text-xs text-zinc-600">Seleccioná un día para ver los detalles</p>
              </div>
            )}
          </div>
        </Panel>
      </PanelGroup>

      {cascadeModal && <CascadeModal cascadeModal={cascadeModal} setCascadeModal={setCascadeModal} handleApplyCascade={handleApplyCascade} />}
      <IngredientsModal showIngredientsModal={showIngredientsModal} setShowIngredientsModal={setShowIngredientsModal} editingNutritionExercise={editingNutritionExercise} editingIngredientsList={editingIngredientsList} setEditingIngredientsList={setEditingIngredientsList} handleSaveNutrition={handleSaveNutrition} />
      <ConfirmationModal showConfirmModal={showConfirmModal} setShowConfirmModal={setShowConfirmModal} editingDate={editingDate} newDate={newDate} getDayData={getDayData} selectedActivityIdsForDateChange={selectedActivityIdsForDateChange} setSelectedActivityIdsForDateChange={setSelectedActivityIdsForDateChange} applyToAllSameDays={applyToAllSameDays} setApplyToAllSameDays={setApplyToAllSameDays} confirmUpdateDate={confirmUpdateDate} dayData={dayData} summaryRowsByDate={summaryRowsByDate} />
      <NutritionDeleteModal confirmDeleteNutritionId={confirmDeleteNutritionId} setConfirmDeleteNutritionId={setConfirmDeleteNutritionId} handleDeleteNutrition={handleDeleteNutrition} />

      {isReorganizing && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6">
          <div className="scale-75 mb-[-20px]">
            <OmniaLoader className="min-h-0 bg-transparent" />
          </div>
          <p className="text-[#FF7939] font-black italic uppercase tracking-widest text-lg animate-pulse">Reorganizando fecha...</p>
        </div>
      )}
    </div>
  )
}
