'use client'

import React from 'react'
import { Search, RotateCcw, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useWeeklyPlanner } from './hooks/useWeeklyPlanner'
import { DayExercisesModal } from './DayExercisesModal'
import { WeeklyExercisePlannerProps } from './planner-types'
import {
  DAYS,
  getTypeColorScheme,
  normalizeExerciseType,
  normalizeNutritionType,
  formatSeriesDisplay,
  getExercisesFromDay,
  normalizeExerciseData
} from './planner-utils'

export function WeeklyExercisePlanner(props: WeeklyExercisePlannerProps) {
  const {
    productCategory
  } = props

  const {
    weeklySchedule,
    numberOfWeeks,
    replicationCount,
    setReplicationCount,
    similarDays,
    selectedExercises,
    weekLimitError,
    searchTerm,
    setSearchTerm,
    isExerciseSelectorOpen,
    setIsExerciseSelectorOpen,
    currentWeek,
    setCurrentWeek,
    selectedDay,
    showDayExercises,
    periods,
    isLoadingPlanning,
    finalAvailableExercises,
    selectedNutritionTotals,
    summaryStats,
    weeksExceeded,
    sessionsExceeded,
    uniqueExceeded,
    canUndo,
    weeksLimit,
    activitiesLimit,

    // Handlers
    addWeek,
    removeWeek,
    replicateWeeks,
    increasePeriods,
    decreasePeriods,
    handleUndo,
    toggleExerciseSelection,
    selectAllExercises,
    clearSelection,
    handleDayClick,
    openDayExercises,
    closeDayExercises,
    getExercisesForDay,
    getBlockNamesForDay,
    getBlockCountForDay,
    updateDayExercises,
    applyToSimilarDays,
    getWeeksWithExercises
  } = useWeeklyPlanner(props)

  const isNutrition = productCategory === 'nutricion' || productCategory === 'nutrition'

  return (
    <div className="space-y-8">
      {/* Indicador de carga */}
      {isLoadingPlanning && (
        <div className="bg-gray-900/20 rounded-lg p-4 text-center">
          <div className="text-white">📅 Cargando planificación desde backend...</div>
        </div>
      )}

      {/* Resumen y Repetir */}
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-2">
          <h4 className="text-white text-base font-bold uppercase tracking-wider">Resumen</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Semanas:</span>
              <span className={`${weeksExceeded ? 'text-red-400 font-semibold' : 'text-[#FF7939] font-medium'}`}>
                {weeksLimit !== null ? `${summaryStats.totalWeeks}/${weeksLimit}` : summaryStats.totalWeeks}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Sesiones:</span>
              <span className={`${sessionsExceeded ? 'text-red-400 font-semibold' : 'text-[#FF7939] font-medium'}`}>
                {weeksLimit !== null ? `${summaryStats.totalSessions}/${weeksLimit * 7}` : summaryStats.totalSessions}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">{isNutrition ? 'Platos totales:' : 'Ejercicios totales:'}</span>
              <span className="text-[#FF7939] font-medium">{summaryStats.totalExercisesReplicated}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">{isNutrition ? 'Platos únicos:' : 'Ejercicios únicos:'}</span>
              <span className={`${uniqueExceeded ? 'text-red-400 font-semibold' : 'text-[#FF7939] font-medium'}`}>
                {activitiesLimit !== null ? `${summaryStats.uniqueExercises}/${activitiesLimit}` : summaryStats.uniqueExercises}
              </span>
            </div>
          </div>
          {(weekLimitError || weeksExceeded) && weeksLimit !== null && (
            <p className="text-red-400 text-xs mt-2">
              {weekLimitError ?? `Has superado el límite de semanas (${weeksLimit}). Ajusta tu planificación.`}
            </p>
          )}
        </div>

        <div className="flex flex-col items-center space-y-2 mt-4">
          <h4 className="text-white text-base font-bold uppercase tracking-wider">Repetir</h4>
          <div className="flex items-center gap-1">
            <button
              onClick={decreasePeriods}
              disabled={periods <= 1}
              className={`w-6 h-6 rounded-full border-2 text-xs transition-colors flex items-center justify-center ${periods > 1 ? 'border-[#FF7939] text-[#FF7939]' : 'border-gray-700 text-gray-600 cursor-not-allowed opacity-50'}`}
            >
              -
            </button>
            <span className="text-[#FF7939] text-sm font-medium w-6 text-center">{periods}</span>
            <button
              onClick={increasePeriods}
              className="w-6 h-6 rounded-full border-2 border-[#FF7939] text-[#FF7939] hover:bg-[#FF7939]/10 text-xs transition-colors flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de semanas */}
      <div className="w-full">
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${canUndo ? 'border-[#FF7939] text-[#FF7939] hover:bg-[#FF7939]/10' : 'border-gray-700 text-gray-600 cursor-not-allowed opacity-50'}`}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="flex flex-wrap items-center gap-2 max-w-md">
            {(() => {
              const weeksWithExercises = getWeeksWithExercises()
              const allWeeks = Object.keys(weeklySchedule).map(Number).filter(n => !isNaN(n) && n > 0).sort((a, b) => a - b)
              if (allWeeks.length === 0) return <div className="text-gray-400 text-sm">No hay {isNutrition ? 'platos' : 'ejercicios'} programados</div>

              return allWeeks.map(w => (
                <button
                  key={w}
                  onClick={() => setCurrentWeek(w)}
                  className={`w-8 h-8 rounded-full border-2 text-sm transition-colors ${currentWeek === w ? 'border-[#FF7939]' : 'border-gray-600'}`}
                  style={{ color: !weeksWithExercises.has(w) ? '#ef4444' : (currentWeek === w ? '#FF7939' : '#d1d5db') }}
                >
                  {w}
                </button>
              ))
            })()}
            <button onClick={addWeek} className="w-8 h-8 rounded-full border-2 border-[#FF7939] text-[#FF7939] hover:bg-[#FF7939]/10 text-sm">+</button>
          </div>

          {(() => {
            const weeksWithExercises = getWeeksWithExercises()
            return weeksWithExercises.size > 1 && (
              <button onClick={() => removeWeek()} className="w-6 h-6 rounded-full border-2 border-[#FF7939] text-[#FF7939] hover:bg-[#FF7939]/10 text-xs">✕</button>
            )
          })()}
        </div>

        <div className="space-y-1">
          <div className="grid grid-cols-[90px_repeat(7,minmax(0,1fr))] gap-0 items-end mb-2">
            <div className="py-1"></div>
            {DAYS.map(d => {
              const exList = getExercisesForDay(currentWeek, d.key)
              let totalCals = 0
              exList.forEach((ex: any) => {
                const fullEx = finalAvailableExercises.find((e: any) => String(e.id) === String(ex.id)) || ex
                const normalized = normalizeExerciseData(fullEx, isNutrition)
                totalCals += (normalized.calories || 0)
              })

              return (
                <div key={d.key} className="flex flex-col items-center justify-end w-full group cursor-pointer" onClick={() => handleDayClick(d.key)}>
                  {(totalCals > 0 || (isNutrition && exList.length > 0)) && (
                    <div className="bg-[#FF7939]/10 border border-[#FF7939]/30 text-[#FF7939] rounded-2xl px-1.5 py-0.5 text-[10px] font-bold flex items-center justify-center gap-0.5 mb-1 shadow-sm min-w-[36px] transition-all group-hover:bg-[#FF7939]/20 group-hover:scale-105">
                      <Flame className="w-3 h-3" />
                      {Math.round(totalCals)}
                    </div>
                  )}
                  <div className="text-center py-1 text-gray-400 text-sm font-medium w-full group-hover:text-white transition-colors">{d.label}</div>
                </div>
              )
            })}
          </div>

          {(() => {
            const dayTypeCounts: Record<number, Record<string, number>> = {}
            const typeTotals: Record<string, number> = {}

            DAYS.forEach(d => {
              const exList = getExercisesForDay(currentWeek, d.key)
              const counts: Record<string, number> = {}
              const dayBlockNames = getBlockNamesForDay(currentWeek, d.key)

              exList.forEach((ex: any) => {
                const fullEx = finalAvailableExercises.find((e: any) => String(e.id) === String(ex.id)) || ex
                const normType = isNutrition
                  ? normalizeNutritionType(dayBlockNames[ex.block || ex.bloque || 1] || 'Otro')
                  : normalizeExerciseType(fullEx.type || fullEx.tipo || 'General')
                counts[normType] = (counts[normType] || 0) + 1
                typeTotals[normType] = (typeTotals[normType] || 0) + 1
              })
              dayTypeCounts[d.key] = counts
            })

            const sortedTypes = Object.keys(typeTotals).sort((a, b) => typeTotals[b] - typeTotals[a])
            return sortedTypes.map(type => {
              const scheme = getTypeColorScheme(type, isNutrition)
              const label = isNutrition ? (type.charAt(0).toUpperCase() + type.slice(1)) : type
              return (
                <div key={type} className="grid grid-cols-[90px_repeat(7,minmax(0,1fr))] gap-0">
                  <div className="pr-2 py-1 flex items-center">
                    <span className="px-2 py-1 rounded-md border text-[10px] font-semibold truncate w-full" style={{ color: scheme.hex, borderColor: scheme.hex, backgroundColor: scheme.soft }}>{label}</span>
                  </div>
                  {DAYS.map(d => {
                    const count = dayTypeCounts[d.key]?.[type] || 0
                    return (
                      <button key={d.key} onClick={() => handleDayClick(d.key)} className="p-2 min-h-[40px] relative flex items-center justify-center w-full border-r border-gray-600/30 last:border-0">
                        {count > 0 && <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold" style={{ backgroundColor: scheme.hex, color: '#000' }}>{count}</div>}
                      </button>
                    )
                  })}
                </div>
              )
            })
          })()}
        </div>
      </div>

      {/* Lista de selección */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-white font-light text-lg">{isNutrition ? 'Selecciona platos' : 'Selecciona ejercicios'}</h4>
          <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-white" onClick={() => setIsExerciseSelectorOpen(!isExerciseSelectorOpen)}>
            {isExerciseSelectorOpen ? 'Ocultar' : (isNutrition ? 'Agregar platos' : 'Agregar ejercicios')}
          </Button>
        </div>

        {isExerciseSelectorOpen && (
          <div className="space-y-4">
            <div className="flex justify-end"><button onClick={selectAllExercises} className="text-[#FF7939] text-sm font-light">Todos/Ninguno</button></div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder={`Buscar ${isNutrition ? 'platos' : 'ejercicios'}...`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-gray-900/40 border-gray-700/70 text-white" />
            </div>
            {isNutrition && selectedExercises.size > 0 && (
              <div className="text-center text-xs text-[#FF7939]">P: {selectedNutritionTotals.proteinas}g | C: {selectedNutritionTotals.carbohidratos}g | G: {selectedNutritionTotals.grasas}g | {selectedNutritionTotals.calorias}kcal</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              {finalAvailableExercises.filter((ex: any) => {
                const q = searchTerm.toLowerCase()
                return (ex.name || '').toLowerCase().includes(q) || (ex.type || '').toLowerCase().includes(q)
              }).map((ex: any) => {
                const inactive = ex.is_active === false || ex.activo === false
                const isSel = selectedExercises.has(String(ex.id))
                // Normalize for display
                const norm = normalizeExerciseData(ex, isNutrition)
                const scheme = getTypeColorScheme(norm.type, isNutrition)

                return (
                  <div key={ex.id} onClick={() => !inactive && toggleExerciseSelection(String(ex.id))} className={`bg-gray-900/40 border p-2 rounded-lg transition-colors cursor-pointer flex flex-col gap-1 ${inactive ? 'opacity-50 grayscale cursor-not-allowed' : (isSel ? 'border-[#FF7939] bg-[#FF7939]/10' : 'border-gray-700/70 hover:border-gray-500')}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isSel ? 'bg-[#FF7939]' : 'bg-gray-600'}`}></div>
                      <p className="text-xs font-medium truncate text-gray-100 flex-1">{norm.name}</p>
                    </div>
                    <div className="ml-4 flex flex-wrap items-center gap-2 text-[10px] text-gray-400">
                      {isNutrition ? (
                        <>
                          <span>{norm.calories} kcal</span>
                          <span>P:{norm.proteinas} C:{norm.carbohidratos} G:{norm.grasas}</span>
                        </>
                      ) : (
                        <>
                          <span className="px-1.5 py-0.5 rounded border" style={{ color: scheme.hex, borderColor: scheme.hex, backgroundColor: scheme.soft }}>{norm.type}</span>
                          {formatSeriesDisplay(norm) && <span>{formatSeriesDisplay(norm)}</span>}
                          {(norm.calories || 0) > 0 && <span className="flex items-center gap-0.5"><Flame className="w-2.5 h-2.5" />{norm.calories}</span>}
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {showDayExercises && selectedDay && (
        <DayExercisesModal
          dayKey={selectedDay}
          dayLabel={DAYS.find(d => d.key === parseInt(selectedDay))?.fullLabel || ''}
          exercises={getExercisesForDay(currentWeek, parseInt(selectedDay))}
          availableExercises={finalAvailableExercises}
          onClose={closeDayExercises}
          onUpdateExercises={updateDayExercises}
          weekNumber={currentWeek}
          blockNames={getBlockNamesForDay(currentWeek, parseInt(selectedDay))}
          blockCountStored={getBlockCountForDay(currentWeek, parseInt(selectedDay))}
          productCategory={productCategory}
          similarDays={similarDays[`${currentWeek}-${selectedDay}`] || []}
          onApplyToSimilarDays={applyToSimilarDays}
        />
      )}
    </div>
  )
}
