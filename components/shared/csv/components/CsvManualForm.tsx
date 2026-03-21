import React, { useState } from 'react'
import { Info, Activity, Dumbbell, Zap, Play, Info as InfoIcon, Utensils, BookOpen, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ManualFormState } from '../types'
import { ExercisePreviewMobile } from './ExercisePreviewMobile'
import { NutritionPreviewMobile } from './NutritionPreviewMobile'
import { FitnessManualFormFields } from './FitnessManualFormFields'
import { NutritionManualFormFields } from './NutritionManualFormFields'

interface CsvManualFormProps {
    productCategory: 'fitness' | 'nutricion'
    formState: ManualFormState
    onChange: (field: keyof ManualFormState, value: any) => void
    onSubmit: () => void
    onCancel: () => void
    isEditing: boolean
    csvData: any[]
    onVideoSelect: () => void
    onRemoveVideo: () => void
}

export function CsvManualForm({
    productCategory,
    formState,
    onChange,
    onSubmit,
    onCancel,
    isEditing,
    csvData,
    onVideoSelect,
    onRemoveVideo
}: CsvManualFormProps) {
    const [previewTab, setPreviewTab] = useState<'info' | 'variables' | 'equipo' | 'musculos' | 'video'>('info')

    const isNutrition = productCategory === 'nutricion'

    const isSectionCompleted = (id: string) => {
        if (isNutrition) {
            if (id === 'info') return !!formState.nombre && !!formState.tipo && !!formState.receta
            if (id === 'variables') return !!formState.calorias && !!formState.proteinas
            if (id === 'video') return !!formState.video_url || !!formState.bunny_video_id
            return false
        }
        if (id === 'info') return !!formState.nombre && !!formState.tipo_ejercicio
        if (id === 'variables') return !!formState.duracion_min && !!formState.calorias && (!!formState.peso || !!formState.segundos)
        if (id === 'video') return !!formState.video_url || !!formState.bunny_video_id
        if (id === 'equipo') return !!formState.nivel_intensidad || !!formState.equipo_necesario
        if (id === 'musculos') return !!formState.partes_cuerpo
        return false
    }

    // Unified Side Menu Items
    const menuItems = isNutrition ? [
        { id: 'info', icon: Info, label: 'BÁSICA' },
        { id: 'variables', icon: Utensils, label: 'MACROS' },
        { id: 'video', icon: Play, label: 'RECETA' }
    ] : [
        { id: 'info', icon: Info, label: 'BÁSICA' },
        { id: 'variables', icon: Activity, label: 'VAR' },
        { id: 'video', icon: Play, label: 'VÍDEO' },
        { id: 'equipo', icon: Dumbbell, label: 'EQ' },
        { id: 'musculos', icon: Zap, label: 'MUS' }
    ]

    return (
        <div className="flex flex-col h-full bg-[#050505] text-white overflow-hidden selection:bg-[#FF7939]/30">
            {/* Header Area */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-zinc-950/20 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-zinc-900 rounded-2xl border border-white/5 shadow-2xl">
                        {isNutrition ? <Utensils className="h-6 w-6 text-[#FF7939]" /> : <Dumbbell className="h-6 w-6 text-[#FF7939]" />}
                    </div>
                    <div>
                        <h2 className="text-xl font-black italic tracking-tighter uppercase leading-none">
                            {isNutrition ? 'Manual Nutrition' : 'Carga Manual'}
                        </h2>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Advanced Exercise Editor</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                   <Button variant="ghost" size="sm" onClick={onCancel} className="text-zinc-500 hover:text-white hover:bg-white/5 uppercase font-black text-[10px] tracking-widest">
                       Cancelar
                   </Button>
                   <Button 
                        size="sm" 
                        onClick={onSubmit} 
                        disabled={!menuItems.every(item => isSectionCompleted(item.id))}
                        className={`bg-white text-black font-black uppercase text-[10px] tracking-[0.2em] px-6 h-10 rounded-xl transition-all ${
                            menuItems.every(item => isSectionCompleted(item.id)) 
                            ? 'hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] opacity-100 cursor-pointer' 
                            : 'opacity-20 cursor-not-allowed contrast-50 grayscale'
                        }`}
                   >
                       Finalizar
                   </Button>
                </div>
            </div>

            <div className="flex-1 flex gap-8 p-8 overflow-hidden max-h-[85vh] justify-center">
                {/* Visual Preview Area (iPhone) */}
                <div className="hidden lg:flex flex-col items-center justify-start pt-4 w-full max-w-[360px] flex-shrink-0">
                    {isNutrition ? (
                        <NutritionPreviewMobile 
                            formState={formState}
                            onChange={onChange}
                            onVideoSelect={() => setPreviewTab('video')}
                            activeTab={(previewTab === 'info' ? 'receta' : previewTab === 'variables' ? 'macros' : 'ingredientes') as any}
                            onTabChange={(tab: any) => {
                                if (tab === 'macros') setPreviewTab('variables');
                                else if (tab === 'receta') setPreviewTab('info');
                                else setPreviewTab('variables');
                            }}
                        />
                    ) : (
                        <ExercisePreviewMobile 
                            formState={formState} 
                            onChange={onChange} 
                            onVideoSelect={() => setPreviewTab('video')}
                            onTabChange={(tab: any) => {
                                if (tab === 'series') setPreviewTab('variables');
                                else if (tab === 'tecnica') setPreviewTab('info');
                                else setPreviewTab('equipo');
                            }}
                            activeTab={(previewTab === 'info' ? 'tecnica' : previewTab === 'variables' ? 'series' : 'musculos') as any}
                        />
                    )}
                </div>

                {/* iPhone Editor - Viewer */}
                <div className="flex-1 max-w-[620px] space-y-4">
                    <div className="bg-zinc-950/40 p-6 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-md min-h-[580px] flex flex-col overflow-hidden">
                        <div className="flex gap-6 flex-1">
                            {/* Left Icon Menu */}
                            <div className="flex flex-col gap-2 p-1.5 bg-zinc-950/80 rounded-[1.5rem] border border-white/5 shadow-inner">
                                {menuItems.map((item) => {
                                    const completed = isSectionCompleted(item.id)
                                    const active = previewTab === item.id

                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setPreviewTab(item.id as any)}
                                            className={`w-16 h-16 rounded-[1.2rem] transition-all group flex flex-col items-center justify-center gap-1 relative ${active ? 'bg-[#FF7939] text-white shadow-[0_0_25px_rgba(255,121,57,0.4)]' : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/5'}`}
                                            title={item.label}
                                        >
                                            <item.icon className={`h-7 w-7 transition-all ${active ? 'fill-white/20' : completed ? 'text-[#FF7939] drop-shadow-[0_0_8px_rgba(255,121,57,0.5)]' : 'group-hover:scale-110'}`} />
                                            <span className={`text-[8px] font-[1000] uppercase tracking-tighter ${active ? 'text-white' : completed ? 'text-[#FF7939]/80' : 'text-zinc-600 group-hover:text-zinc-400'}`}>{item.label}</span>
                                            
                                            {completed && !active && (
                                                <div className="absolute top-1 right-1 w-2 h-2 bg-[#FF7939] rounded-full shadow-[0_0_10px_rgba(255,121,57,0.8)] animate-in zoom-in" />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Forms Section */}
                            <div className="flex-1 overflow-y-auto no-scrollbar pr-1 pt-2">
                                {isNutrition ? (
                                    <NutritionManualFormFields 
                                        formState={formState} 
                                        onChange={onChange}
                                        activeSection={previewTab as any}
                                        onVideoSelect={onVideoSelect}
                                    />
                                ) : (
                                    <FitnessManualFormFields 
                                        formState={formState} 
                                        onChange={onChange}
                                        activeSection={previewTab as any}
                                        onVideoSelect={() => setPreviewTab('video')}
                                    />
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
                            <Button variant="ghost" onClick={onCancel} className="text-zinc-500 hover:text-white uppercase font-black text-[8px] tracking-widest px-2 h-8">
                                Descartar
                            </Button>
                            <Button 
                                onClick={onSubmit} 
                                className="flex-1 bg-[#FF7939] hover:bg-[#FF6B35] text-white font-black uppercase text-[10px] tracking-widest h-9 rounded-lg shadow-lg transition-all active:scale-95 italic"
                            >
                                {isEditing ? 'Guardar Cambios' : isNutrition ? 'Confirmar Plato' : 'Confirmar Ejercicio'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* New Info Panel: Condicionar & Resumen */}
                <div className="w-full max-w-[180px] pt-2 space-y-4 animate-in fade-in slide-in-from-right-4">
                    <div className="relative group">
                        <div className="absolute -inset-px bg-gradient-to-b from-[#FF7939]/20 to-transparent rounded-2xl opacity-50 blur-[2px]" />
                        <div className="relative bg-zinc-950/60 backdrop-blur-2xl p-4 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                             <div className="absolute top-0 right-0 w-20 h-20 bg-[#FF7939]/10 blur-[30px] -mr-10 -mt-10" />
                             <div className="flex items-center gap-2 mb-3">
                                 <div className="p-1.5 bg-[#FF7939]/10 rounded-lg border border-[#FF7939]/30 shadow-[0_0_15px_rgba(255,121,57,0.2)]">
                                     <Zap className="h-4 w-4 text-[#FF7939] drop-shadow-[0_0_5px_rgba(255,121,57,0.5)]" />
                                 </div>
                                 <span className="text-[9px] font-[1000] text-white uppercase tracking-[0.15em] italic">Condicionar</span>
                             </div>
                             <div className="space-y-3">
                                 <p className="text-[8px] text-zinc-400 font-black leading-relaxed uppercase italic">
                                    OMNIA ajusta automáticamente las variables según el perfil del cliente.
                                 </p>
                                 <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent" />
                                 <p className="text-[7px] text-zinc-500 font-bold uppercase tracking-tight">
                                     Gestiónalo desde <span className="text-[#FF7939] italic">Productos</span> con el botón de <span className="text-white">rayo</span>.
                                 </p>
                             </div>
                        </div>
                    </div>

                    {/* ANALYTIC SUMMARY PANEL */}
                    <div className="relative">
                         <div className="relative bg-zinc-950/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 shadow-xl">
                             <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                                 <span className="text-[9px] font-black text-white uppercase tracking-widest italic">Resumen</span>
                                 <div className="flex gap-1">
                                      <div className="w-1 h-1 rounded-full bg-green-500/50" />
                                      <div className="w-1 h-1 rounded-full bg-[#FF7939]/50" />
                                 </div>
                             </div>

                             <div className="space-y-4">
                                 <div className="grid grid-cols-2 gap-2">
                                     <div className="bg-zinc-900/50 p-2 rounded-lg text-center border border-white/5">
                                         <span className="block text-[14px] font-black text-[#FF7939]">{csvData.filter(e => !e.isExisting).length}</span>
                                         <span className="text-[6px] text-zinc-500 font-black uppercase">Nuevos</span>
                                     </div>
                                     <div className="bg-zinc-900/50 p-2 rounded-lg text-center border border-white/5">
                                         <span className="block text-[14px] font-black text-white">{csvData.filter(e => e.isExisting).length}</span>
                                         <span className="text-[6px] text-zinc-500 font-black uppercase">Catálogo</span>
                                     </div>
                                 </div>

                                 <div className="space-y-1.5">
                                      <span className="text-[6px] text-zinc-600 font-black uppercase tracking-widest block mb-1">Por {isNutrition ? 'Filtro' : 'Tipo'}</span>
                                      {isNutrition ? (
                                          ['DESAYUNO', 'ALMUERZO', 'MERIENDA', 'CENA', 'SNACK'].map(cat => {
                                              const count = csvData.filter(e => (e.tipo || e.comida || '').toUpperCase().includes(cat)).length;
                                              if (count === 0) return null;
                                              return (
                                                  <div key={cat} className="flex items-center justify-between text-[8px] font-black italic">
                                                      <span className="text-zinc-500 uppercase">{cat}</span>
                                                      <span className="text-white px-1.5 bg-zinc-900 rounded">{count}</span>
                                                  </div>
                                              )
                                          })
                                      ) : (
                                          ['FUERZA', 'CARDIO', 'HIIT', 'ESTIRAM'].map(type => {
                                              const count = csvData.filter(e => (e.tipo_ejercicio || e.tipo || '').toUpperCase().includes(type)).length;
                                              if (count === 0) return null;
                                              return (
                                                  <div key={type} className="flex items-center justify-between text-[8px] font-black italic">
                                                      <span className="text-zinc-500 uppercase">{type}</span>
                                                      <span className="text-white px-1.5 bg-zinc-900 rounded">{count}</span>
                                                  </div>
                                              )
                                          })
                                      )}
                                 </div>

                                 {!isNutrition && (
                                     <div className="space-y-1.5 pt-2 border-t border-white/5">
                                          <span className="text-[6px] text-zinc-600 font-black uppercase tracking-widest block mb-1">Intensidad</span>
                                          {['Bajo', 'Medio', 'Alto'].map(lvl => {
                                              const count = csvData.filter(e => (e.nivel_intensidad || e.intensidad || '').includes(lvl)).length;
                                              if (count === 0) return null;
                                              return (
                                                  <div key={lvl} className="flex items-center justify-between text-[8px] font-black italic">
                                                      <span className="text-zinc-500 uppercase">{lvl}</span>
                                                      <span className="text-[#FF7939]">{count}</span>
                                                  </div>
                                              )
                                          })}
                                     </div>
                                 )}
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
