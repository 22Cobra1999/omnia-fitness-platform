"use client"

import React from 'react'
import { Zap, Activity } from 'lucide-react'

interface CsvDetailedSummaryProps {
  csvData: any[]
  planLimits?: {
    activitiesLimit?: number
  } | null
  productCategory: 'fitness' | 'nutricion'
}

export function CsvDetailedSummary({
  csvData,
  planLimits,
  productCategory
}: CsvDetailedSummaryProps) {
  const isNutrition = productCategory === 'nutricion'
  
  const newCount = csvData.filter(i => !i.isExisting).length
  const existingCount = csvData.filter(i => i.isExisting).length
  const totalCount = csvData.length
  const limit = planLimits?.activitiesLimit || Math.max(totalCount, 1)
  const freeCount = planLimits?.activitiesLimit ? Math.max(0, planLimits.activitiesLimit - totalCount) : 0

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-8">
      {/* Metrics Grid - More Compact & Frameless */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Analysis */}
        <div className="bg-zinc-950/40 p-5 rounded-[2rem] border border-white/5 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF7939]/5 blur-[40px] -mr-12 -mt-12 transition-all group-hover:bg-[#FF7939]/10" />
          <div className="flex items-center gap-3 mb-4">
            <div className="p-1.5 bg-[#FF7939]/10 rounded-lg">
              <Zap className="h-3.5 w-3.5 text-[#FF7939]" />
            </div>
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">ANÁLISIS OMNIA</span>
          </div>
          <div className="flex gap-6">
            <div>
              <span className="block text-2xl font-black text-[#FF7939] tabular-nums tracking-tighter">{newCount}</span>
              <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Nuevos</span>
            </div>
            <div className="w-px h-8 bg-white/5 self-center" />
            <div>
              <span className="block text-2xl font-black text-white tabular-nums tracking-tighter">{existingCount}</span>
              <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Cargados</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Distribution - Full Width compact */}
        <div className="bg-zinc-950/40 p-5 rounded-[2rem] border border-white/5 shadow-xl col-span-1 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-blue-500/10 rounded-lg">
                <Activity className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">DISTRIBUCIÓN DE ÍTEMS</span>
            </div>
            <div className="flex gap-1">
              <div className="w-1 h-1 rounded-full bg-green-500/40" />
              <div className="w-1 h-1 rounded-full bg-green-500" />
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {(isNutrition ? ['DESAYUNO', 'ALMUERZO', 'MERIENDA', 'CENA', 'SNACK'] : ['FUERZA', 'CARDIO', 'HIIT', 'ESTIRAM', 'CORE']).map(cat => {
              const count = csvData.filter(e => (isNutrition ? (e.tipo || e.comida || '') : (e.tipo_ejercicio || e.tipo || '')).toUpperCase().includes(cat)).length;
              if (count === 0) return null;
              return (
                <div key={cat} className="flex flex-col gap-0.5 px-3 py-2 bg-zinc-900/40 rounded-xl border border-white/5 hover:border-[#FF7939]/20 transition-all shrink-0">
                  <span className="text-[7px] text-zinc-600 font-black uppercase tracking-widest">{cat}</span>
                  <span className="text-sm font-black text-[#FF7939]">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Segmented Progress Bar - Compact */}
      <div className="bg-zinc-950/20 px-4 py-3 rounded-2xl border border-white/5">
        <div className="flex items-center justify-between mb-2">
           <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest italic">Detalle de plan actual: <span className="text-white ml-1">{totalCount} / {planLimits?.activitiesLimit || '∞'}</span></span>
        </div>
        <div className="flex h-2 w-full rounded-full overflow-hidden bg-zinc-900/40 p-0.5">
          {newCount > 0 && (
            <div 
              className="bg-[#FF7939] h-full rounded-full shadow-[0_0_10px_rgba(255,121,57,0.3)] transition-all duration-700"
              style={{ width: `${(newCount / limit) * 100}%` }}
            />
          )}
          {existingCount > 0 && (
            <div 
              className="bg-[#FF8C42]/30 h-full border-l border-white/5 transition-all duration-700"
              style={{ width: `${(existingCount / limit) * 100}%` }}
            />
          )}
          {freeCount > 0 && (
            <div 
              className="bg-zinc-800/20 h-full transition-all duration-700"
              style={{ width: `${(freeCount / limit) * 100}%` }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
