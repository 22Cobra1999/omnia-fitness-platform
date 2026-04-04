'use client'

import React from 'react'
import { Search, RotateCcw, Flame, Clock, X, Minus, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils/utils'
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
    productCategory,
    onScheduleChange
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
  const gridCols = `repeat(7, minmax(45px, 1fr))`

  return (
    <div className="space-y-8">
      {/* Indicador de carga */}
      {isLoadingPlanning && (
        <div className="bg-gray-900/20 rounded-lg p-4 text-center">
          <div className="text-white">📅 Cargando planificación desde backend...</div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 items-start relative w-full">
        {/* Lado Izquierdo o Superior: Lista de selección integrada */}
        <div className="w-full lg:w-[240px] flex-shrink-0 order-2 lg:order-1 h-full">
          <div className="p-2 sticky top-4">
            <div className="flex items-center justify-between mb-6 px-1">
              <div className="flex items-center gap-2 group/select-all cursor-pointer" onClick={selectAllExercises}>
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full border transition-all shadow-[0_0_10px_rgba(255,121,57,0.1)]",
                  selectedExercises.size > 0 
                    ? "bg-[#FF7939] border-[#FF7939]" 
                    : "bg-white/10 border-white/20 group-hover/select-all:border-[#FF7939]/50"
                )}></div>
                <h4 className="text-white font-black text-[15px] uppercase tracking-tighter italic">
                  {isNutrition ? 'Platos' : 'Ejercicios'}
                </h4>
              </div>
              
              <div className="relative group flex items-center">
                <div className="flex items-center bg-white/[0.03] border border-white/10 rounded-full p-1.5 transition-all focus-within:ring-1 focus-within:ring-[#FF7939]/30">
                  <Search className="text-white/40 w-3.5 h-3.5" />
                  <input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-20 lg:w-0 group-hover:w-24 group-focus-within:w-24 transition-all duration-300 bg-transparent border-none text-[10px] text-white focus:ring-0 placeholder:text-white/20 p-0 ml-1 italic"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 max-h-[75vh] min-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
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
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] font-bold">
                          <span className="flex items-center gap-0.5"><Flame size={10} className="text-[#FF4D00]" /><span className="text-white">{(norm.calories || 0)}</span></span>
                          <div className="flex items-center gap-1.5 ml-1">
                            <span className="text-[#98360B]">P: <span className="text-white">{norm.proteinas}</span></span>
                            <span className="text-[#FF7939]">C: <span className="text-white">{norm.carbohidratos}</span></span>
                            <span className="text-white/30">G: <span className="text-white">{norm.grasas}</span></span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1.5 w-full">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded-md border border-white/5 text-[8px] font-black uppercase tracking-tighter" style={{ color: scheme.hex, backgroundColor: scheme.soft }}>{norm.type}</span>
                            {formatSeriesDisplay(norm) && <span className="text-[#FF4D00] font-black text-[10px] italic tracking-tighter">{formatSeriesDisplay(norm)}</span>}
                          </div>
                          {((norm.calories || 0) > 0 || (norm.duration || 0) > 0) && (
                            <div className="flex items-center gap-3 text-[9px] font-bold">
                              {(norm.calories || 0) > 0 && <span className="text-[#FF4D00] flex items-center gap-1"><Flame size={10} />{norm.calories} <span className="text-white/40">kcal</span></span>}
                              {(norm.duration || 0) > 0 && <span className="text-cyan-400 flex items-center gap-1"><Clock size={10} />{norm.duration} <span className="text-white/40">min</span></span>}
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

        {/* Contenido Derecho: Resumen + Mapa Semanal */}
        <div className="flex-1 order-1 lg:order-2 flex flex-col gap-6 overflow-x-auto pb-4 scrollbar-hide">

          {/* Resumen y Repetir */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 w-full px-1">
            {/* Resumen - Estadísticas Intercaladas (Más pequeñas) */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-6">
                <h4 className="text-white text-[16px] font-black italic uppercase tracking-tighter">Resumen</h4>
                {/* Botón Deshacer - Movido a nivel de resumen */}
                <button
                  onClick={handleUndo}
                  disabled={!canUndo}
                  className={cn(
                    "w-8 h-8 rounded-full border flex items-center justify-center transition-all",
                    canUndo 
                      ? "border-[#FF4D00]/40 bg-[#FF4D00]/5 text-[#FF4D00] hover:bg-[#FF4D00]/10" 
                      : "border-white/5 text-white/5 opacity-10"
                  )}
                  title="Deshacer último cambio"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-6 md:gap-8">
                {[
                  { label: 'Semanas', val: weeksLimit !== null ? `${summaryStats.totalWeeks}/${weeksLimit}` : summaryStats.totalWeeks, color: weeksExceeded ? 'text-red-400' : 'text-[#FF4D00]' },
                  { label: 'Sesiones', val: weeksLimit !== null ? `${summaryStats.totalSessions}/${weeksLimit * 7}` : summaryStats.totalSessions, color: sessionsExceeded ? 'text-red-400' : 'text-white/80' },
                  { label: isNutrition ? 'Platos' : 'Ejercicios', val: summaryStats.totalExercisesReplicated, color: 'text-[#FF4D00]' },
                  { label: 'Únicos', val: activitiesLimit !== null ? `${summaryStats.uniqueExercises}/${activitiesLimit}` : summaryStats.uniqueExercises, color: uniqueExceeded ? 'text-red-400' : 'text-white/80' }
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-start min-w-[50px]">
                    <span className="text-[9px] text-white/30 font-black uppercase tracking-[0.1em]">{item.label}</span>
                    <span className={cn("text-[16px] font-black italic tracking-tighter shadow-sm leading-none mt-0.5", item.color)}>{item.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Controles Derecha: Repetir | Semanas | Undo (Sin Frame Global) */}
            <div className="flex flex-wrap items-center gap-4 lg:gap-5">
              
              {/* Repetir Ciclo */}
              <div className="flex flex-col items-center gap-1 group">
                <span className="text-[8px] font-black text-[#FF4D00] uppercase tracking-widest italic opacity-80 group-hover:opacity-100 transition-opacity">Ciclo</span>
                <div className="flex items-center gap-1 px-2 py-1 bg-white/[0.03] border border-white/10 rounded-full">
                  <button onClick={decreasePeriods} disabled={periods <= 1} className="text-white/20 hover:text-[#FF4D00] p-1 transition-colors disabled:opacity-5">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-white font-black text-[13px] px-1">{periods}x</span>
                  <button 
                    onClick={increasePeriods} 
                    disabled={weeksLimit !== null && (numberOfWeeks * (periods + 1)) > weeksLimit}
                    className="text-white/40 hover:text-[#FF7939] p-1 transition-colors disabled:opacity-5 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Divisor Vertical Fino */}
              <div className="h-8 w-px bg-white/10 mx-1"></div>

              {/* Semanas con Opción de Borrar */}
              <div className="flex items-center gap-1.5">
                {Object.keys(weeklySchedule).map(Number).filter(n => !isNaN(n) && n > 0).sort((a, b) => a - b).map(w => (
                  <div key={w} className="relative group/week">
                    <button
                      onClick={() => setCurrentWeek(w)}
                      className={cn(
                        "w-8 h-8 rounded-full text-[12px] flex flex-shrink-0 items-center justify-center font-black transition-all",
                        currentWeek === w 
                          ? "bg-[#FF4D00] text-black shadow-[0_0_15px_rgba(255,77,0,0.3)]" 
                          : "text-white/30 hover:text-white hover:bg-white/5"
                      )}
                    >
                      {w}
                    </button>
                    {currentWeek === w && Object.keys(weeklySchedule).length > 1 && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeWeek(); }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/week:opacity-100 transition-all shadow-lg hover:scale-110"
                        title="Borrar esta semana"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  onClick={addWeek} 
                  className="w-8 h-8 rounded-full border border-dashed border-white/20 flex flex-shrink-0 items-center justify-center text-white/20 hover:text-white hover:border-white/40 transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Divisor Vertical Fino */}
              <div className="h-8 w-px bg-white/10 mx-1"></div>
            </div>
          </div>

          <div className="py-2 md:py-4 min-w-0">
            {/* Leyenda de categorías - Movida arriba del calendario */}
            {sortedTypes.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4 px-1">
                {sortedTypes.map(type => {
                  const scheme = getTypeColorScheme(type, isNutrition)
                  const label = isNutrition ? (type.charAt(0).toUpperCase() + type.slice(1)) : type
                  return (
                    <div 
                      key={type} 
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-tighter" 
                      style={{ 
                        color: scheme.hex, 
                        borderColor: scheme.hex + '44', 
                        backgroundColor: scheme.soft 
                      }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: scheme.hex }}></div>
                      {label}
                    </div>
                  )
                })}
              </div>
            )}

            <div
              className="grid gap-0.5 md:gap-1.5 grid-dynamic"
              style={{
                gridTemplateColumns: gridCols
              } as any}
            >
              <style dangerouslySetInnerHTML={{
                __html: `
                  @media (min-width: 768px) {
                    .grid-dynamic { 
                      grid-template-columns: repeat(7, minmax(100px, 1fr)) !important;
                    }
                  }
                `}} />

              {/* Headers de días */}
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
                  <div key={d.key} className="flex flex-col items-center justify-end h-14 pb-1 group cursor-pointer transition-all" onClick={() => handleDayClick(d.key)}>
                    <div className={`flex flex-col items-center gap-0.5 mb-1 transition-transform group-hover:scale-110 ${!hasEx ? 'opacity-20 scale-75' : ''}`}>
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
                    <span className={`${hasEx ? 'text-[12px] text-[#FF7939]' : 'text-[11px] text-white'} font-black transition-colors`}>{d.label}</span>
                  </div>
                )
              })}

              {/* Contenido de la grilla (Tipos/Bloques) */}
              {sortedTypes.length === 0 ? (
                <div className="col-span-7 py-20 px-8 text-center flex flex-col items-center justify-center">
                  <div className="text-[12px] md:text-[15px] font-black uppercase tracking-[0.2em] italic max-w-lg leading-loose">
                    <span className="text-[#FF4D00]">Selecciona {isNutrition ? 'Platos' : 'Ejercicios'}</span>
                    <br />
                    <span className="text-white/20">de la lista y luego</span>
                    <br />
                    <span className="text-[#FF4D00]">toca un día</span>
                    <span className="text-white/20"> para organizar</span>
                  </div>
                </div>
              ) : sortedTypes.map(type => {
                const scheme = getTypeColorScheme(type, isNutrition)
                const label = isNutrition ? (type.charAt(0).toUpperCase() + type.slice(1)) : type
                return (
                  <React.Fragment key={type}>
                    {DAYS.map(d => {
                      const exercises = dayTypeExercises[d.key]?.[type] || []
                      const count = exercises.length
                      const hasEx = dayHasExercises[d.key]
                      return (
                        <button
                          key={d.key}
                          onClick={() => handleDayClick(d.key)}
                          className={`min-h-[60px] md:min-h-[85px] w-full p-1 transition-all flex flex-col items-center justify-center relative group/cell ${count > 0 ? '' : 'hover:bg-white/[0.02] rounded-2xl'}`}
                        >
                          {count > 0 && (
                            <div className="flex flex-col gap-1 w-full relative z-10 px-0.5">
                              {exercises.map((ex, idx) => (
                                <div
                                  key={idx}
                                  className="text-[7px] md:text-[10px] leading-[1.05] md:leading-tight font-bold capitalize w-full px-1 py-1 rounded-lg shadow-md italic tracking-tighter text-center break-words"
                                  style={{
                                    backgroundColor: scheme.soft,
                                    color: scheme.hex,
                                    border: `1px solid ${scheme.hex}22`
                                  }}
                                  title={ex.name || ex.nombre_ejercicio}
                                >
                                  {ex.name || ex.nombre_ejercicio}
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/cell:opacity-10 rounded-2xl transition-opacity"></div>
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
