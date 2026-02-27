'use client'

import React from 'react'
import { Search, RotateCcw, Flame, Clock } from 'lucide-react'
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

  // Pre-calcular datos de la grilla
  const dayHasExercises: Record<number, boolean> = {}
  DAYS.forEach(d => {
    dayHasExercises[d.key] = getExercisesForDay(currentWeek, d.key).length > 0
  })

  const dayTypeExercises: Record<number, Record<string, any[]>> = {}
  const typeTotals: Record<string, number> = {}

  DAYS.forEach(d => {
    const exList = getExercisesForDay(currentWeek, d.key)
    const exercisesByType: Record<string, any[]> = {}
    const dayBlockNames = getBlockNamesForDay(currentWeek, d.key)

    exList.forEach((ex: any) => {
      const fullEx = finalAvailableExercises.find((e: any) => String(e.id) === String(ex.id)) || ex
      const normType = isNutrition
        ? normalizeNutritionType(dayBlockNames[ex.block || ex.bloque || 1] || 'Otro')
        : normalizeExerciseType(fullEx.type || fullEx.tipo || 'General')

      if (!exercisesByType[normType]) exercisesByType[normType] = []
      exercisesByType[normType].push(fullEx)
      typeTotals[normType] = (typeTotals[normType] || 0) + 1
    })
    dayTypeExercises[d.key] = exercisesByType
  })

  const sortedTypes = Object.keys(typeTotals).sort((a, b) => typeTotals[b] - typeTotals[a])
  const gridCols = `calc(var(--title-w)) ${DAYS.map(d => dayHasExercises[d.key] ? '1fr' : '44px').join(' ')}`

  return (
    <div className="space-y-8">
      {/* Indicador de carga */}
      {isLoadingPlanning && (
        <div className="bg-gray-900/20 rounded-lg p-4 text-center">
          <div className="text-white">📅 Cargando planificación desde backend...</div>
        </div>
      )}

      {/* Resumen y Repetir */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-white text-lg font-black italic uppercase tracking-tighter">Resumen</h4>
            <div className="flex items-center gap-3 bg-white/5 px-3 py-1 rounded-full border border-white/10">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Repetir ciclo</span>
              <div className="flex items-center gap-2">
                <button onClick={decreasePeriods} disabled={periods <= 1} className="text-white/40 hover:text-white font-bold text-sm">-</button>
                <span className="text-[#FF7939] font-black text-sm">{periods}x</span>
                <button onClick={increasePeriods} className="text-white/40 hover:text-white font-bold text-sm">+</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Semanas', val: weeksLimit !== null ? `${summaryStats.totalWeeks}/${weeksLimit}` : summaryStats.totalWeeks, color: weeksExceeded ? 'text-red-400' : 'text-[#FF7939]' },
              { label: 'Sesiones', val: weeksLimit !== null ? `${summaryStats.totalSessions}/${weeksLimit * 7}` : summaryStats.totalSessions, color: sessionsExceeded ? 'text-red-400' : 'text-[#FF7939]' },
              { label: isNutrition ? 'Platos' : 'Ejercicios', val: summaryStats.totalExercisesReplicated, color: 'text-[#FF7939]' },
              { label: 'Únicos', val: activitiesLimit !== null ? `${summaryStats.uniqueExercises}/${activitiesLimit}` : summaryStats.uniqueExercises, color: uniqueExceeded ? 'text-red-400' : 'text-[#FF7939]' }
            ].map((item, idx) => (
              <div key={idx} className="bg-white/[0.03] p-2 rounded-xl border border-white/5 flex flex-col items-center justify-center">
                <span className="text-white/20 font-bold uppercase text-[8px] tracking-[0.15em] mb-1">{item.label}</span>
                <span className={`text-base font-black italic ${item.color}`}>{item.val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center lg:items-end gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${canUndo ? 'text-[#FF7939] bg-[#FF7939]/10 border-[#FF7939]/30 shadow-lg shadow-[#FF7939]/5' : 'text-white/5 border-white/5 cursor-not-allowed'}`}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-full border border-white/5">
              {Object.keys(weeklySchedule).map(Number).filter(n => !isNaN(n) && n > 0).sort((a, b) => a - b).map(w => (
                <button
                  key={w}
                  onClick={() => setCurrentWeek(w)}
                  className={`w-9 h-9 rounded-full text-xs font-black transition-all ${currentWeek === w ? 'bg-[#FF7939] text-black shadow-lg shadow-[#FF7939]/20 scale-110 z-10' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                >
                  {w}
                </button>
              ))}
              <button onClick={addWeek} className="w-9 h-9 rounded-full bg-white/10 text-white/60 hover:text-white flex items-center justify-center font-black transition-transform hover:scale-105">+</button>
            </div>
            {Object.keys(weeklySchedule).length > 1 && (
              <button onClick={() => removeWeek()} className="w-8 h-8 rounded-full border border-red-500/20 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 flex items-center justify-center text-xs transition-all">✕</button>
            )}
          </div>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] font-sans italic">Control de Semanas</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Lado Izquierdo o Superior: Lista de selección integrada */}
        <div className="w-full lg:w-[240px] flex-shrink-0 order-2 lg:order-1">
          <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-4 sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-medium text-base">{isNutrition ? 'Platos' : 'Ejercicios'}</h4>
              <div className="relative flex-1 ml-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 h-8 bg-white/5 border-white/10 text-xs rounded-full"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
              {finalAvailableExercises.filter((ex: any) => {
                const q = searchTerm.toLowerCase()
                return (ex.name || '').toLowerCase().includes(q) || (ex.type || '').toLowerCase().includes(q)
              }).map((ex: any) => {
                const inactive = ex.is_active === false || ex.activo === false
                const isSel = selectedExercises.has(String(ex.id))
                const norm = normalizeExerciseData(ex, isNutrition)
                const scheme = getTypeColorScheme(norm.type, isNutrition)

                return (
                  <div
                    key={ex.id}
                    onClick={() => !inactive && toggleExerciseSelection(String(ex.id))}
                    className={`group p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${inactive ? 'opacity-30 grayscale cursor-not-allowed' : (isSel ? 'border-[#FF7939] bg-[#FF7939]/5 shadow-[0_0_15px_rgba(255,121,57,0.1)]' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10')}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${isSel ? 'bg-[#FF7939]' : 'bg-white/20'}`}></div>
                      <p className="text-[11px] font-semibold truncate text-white/90 flex-1">{norm.name}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] text-white/40">
                      {isNutrition ? (
                        <>
                          <span className="flex items-center gap-1"><Flame size={10} className="text-[#FF7939]" />{(norm.calories || 0)}</span>
                          <span className="opacity-60">P:{norm.proteinas} C:{norm.carbohidratos} G:{norm.grasas}</span>
                        </>
                      ) : (
                        <div className="flex flex-col gap-1.5 w-full">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded-md border border-white/5 text-[8px] font-black uppercase tracking-tighter" style={{ color: scheme.hex, backgroundColor: scheme.soft }}>{norm.type}</span>
                            {formatSeriesDisplay(norm) && <span className="text-white/60 text-[9px] font-mono">{formatSeriesDisplay(norm)}</span>}
                          </div>
                          {((norm.calories || 0) > 0 || (norm.duration || 0) > 0) && (
                            <div className="flex items-center gap-3 text-[9px] font-bold">
                              {(norm.calories || 0) > 0 && <span className="text-[#FF7939] flex items-center gap-1"><Flame size={10} />{norm.calories} kcal</span>}
                              {(norm.duration || 0) > 0 && <span className="text-cyan-400 flex items-center gap-1"><Clock size={10} />{norm.duration}m</span>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between">
              <button onClick={selectAllExercises} className="text-[10px] text-white/40 hover:text-white transition-colors uppercase font-bold tracking-widest">Todos/Ninguno</button>
              {isNutrition && selectedExercises.size > 0 && (
                <div className="text-[10px] font-black text-[#FF7939]">{selectedNutritionTotals.calorias} KCAL</div>
              )}
            </div>
          </div>
        </div>

        {/* Mapa Semanal - Derecha */}
        <div className="flex-1 order-1 lg:order-2 space-y-6 overflow-x-auto lg:overflow-visible">
          <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-3 md:p-6 min-w-[600px] lg:min-w-0">
            <div
              className="grid gap-0 grid-dynamic"
              style={{
                gridTemplateColumns: gridCols,
                '--title-w': '65px'
              } as any}
            >
              <style dangerouslySetInnerHTML={{
                __html: `
                  @media (min-width: 768px) {
                    .grid-dynamic { --title-w: 75px !important; }
                  }
                `}} />

              {/* Headers de días */}
              <div className="h-14"></div>
              {DAYS.map(d => {
                const exList = getExercisesForDay(currentWeek, d.key)
                const hasEx = dayHasExercises[d.key]
                let totalCals = 0
                let totalTime = 0
                exList.forEach((ex: any) => {
                  const fullEx = finalAvailableExercises.find((e: any) => String(e.id) === String(ex.id)) || ex
                  const normalized = normalizeExerciseData(fullEx, isNutrition)
                  totalCals += (normalized.calories || 0)
                  totalTime += (normalized.duration || 0)
                })

                return (
                  <div key={d.key} className={`flex flex-col items-center justify-end h-14 pb-2 group cursor-pointer transition-all ${!hasEx ? 'opacity-20' : ''}`} onClick={() => handleDayClick(d.key)}>
                    <div className={`flex flex-col items-center gap-0.5 mb-2 transition-transform group-hover:scale-110 ${!hasEx ? 'scale-75' : ''}`}>
                      {totalCals > 0 && (
                        <div className="bg-[#FF7939]/10 text-[#FF7939] px-1.5 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1 shadow-sm">
                          <Flame size={9} /> {Math.round(totalCals)}
                        </div>
                      )}
                      {totalTime > 0 && (
                        <div className="bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1 shadow-sm">
                          <Clock size={9} /> {totalTime}m
                        </div>
                      )}
                    </div>
                    <span className={`${hasEx ? 'text-[11px] text-white' : 'text-[9px] text-white/40'} font-black transition-colors`}>{d.label}</span>
                  </div>
                )
              })}

              {/* Contenido de la grilla (Tipos/Bloques) */}
              {sortedTypes.length === 0 ? (
                <div className="col-span-8 p-12 text-center text-white/5 font-black uppercase tracking-[0.5em] italic text-[10px]">
                  Selecciona a la izquierda
                </div>
              ) : sortedTypes.map(type => {
                const scheme = getTypeColorScheme(type, isNutrition)
                const label = isNutrition ? (type.charAt(0).toUpperCase() + type.slice(1)) : type
                return (
                  <React.Fragment key={type}>
                    <div className="py-2 pr-4 flex items-center">
                      <span className="px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-tighter truncate w-full shadow-sm" style={{ color: scheme.hex, borderColor: scheme.hex + '33', backgroundColor: scheme.soft }}>{label}</span>
                    </div>
                    {DAYS.map(d => {
                      const exercises = dayTypeExercises[d.key]?.[type] || []
                      const count = exercises.length
                      const hasEx = dayHasExercises[d.key]
                      return (
                        <button
                          key={d.key}
                          onClick={() => handleDayClick(d.key)}
                          className={`m-0.5 md:m-1 min-h-[50px] md:min-h-[75px] p-1.5 md:p-2 rounded-xl border transition-all flex flex-col items-center justify-center relative overflow-hidden group/cell ${count > 0 ? 'bg-white/[0.03] border-white/10 shadow-inner' : 'border-dashed border-white/5 hover:bg-white/[0.02]'} ${!hasEx && count === 0 ? 'w-[44px]' : ''}`}
                        >
                          {count > 0 && (
                            <>
                              <div className="absolute inset-0 opacity-10" style={{ backgroundColor: scheme.hex }}></div>
                              <div className="flex flex-col gap-1 w-full relative z-10 overflow-hidden px-0.5">
                                {exercises.map((ex, idx) => (
                                  <div
                                    key={idx}
                                    className="text-[8px] md:text-[9.5px] leading-[1.1] font-black uppercase truncate w-full px-1.5 py-1 rounded shadow-sm italic tracking-tighter text-center"
                                    style={{
                                      backgroundColor: scheme.soft,
                                      color: scheme.hex,
                                      border: `1px solid ${scheme.hex}44`
                                    }}
                                  >
                                    {ex.name || ex.nombre_ejercicio}
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/cell:opacity-10 transition-opacity"></div>
                        </button>
                      )
                    })}
                  </React.Fragment>
                )
              })}
            </div>
          </div>
        </div>
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
