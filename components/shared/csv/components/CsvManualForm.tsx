import React, { useState } from 'react'
import { Info, Activity, Dumbbell, Zap, Play, Info as InfoIcon, Utensils, BookOpen, ShoppingCart, Smartphone, PenBox } from 'lucide-react'
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
    planLimits?: {
        planType?: string
        activitiesLimit?: number
    } | null
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
    onRemoveVideo,
    planLimits
}: CsvManualFormProps) {
    const [previewTab, setPreviewTab] = useState<'info' | 'variables' | 'receta' | 'ingredientes' | 'equipo' | 'musculos' | 'video'>('info')
    const [showDetailedSummary, setShowDetailedSummary] = useState(false)
    const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor')

    const isNutrition = productCategory === 'nutricion'

    const isSectionCompleted = (id: string) => {
        if (isNutrition) {
            if (id === 'info') return !!formState.nombre && !!formState.minutos && !!formState.porciones && !!formState.calorias && !!formState.proteinas
            if (id === 'receta') return !!formState.receta
            if (id === 'ingredientes') return !!formState.ingredientes
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

    const menuItems = isNutrition ? [
        { id: 'info', icon: Info, label: 'BÁSICA' },
        { id: 'receta', icon: BookOpen, label: 'RECETA' },
        { id: 'ingredientes', icon: ShoppingCart, label: 'INGRED' },
        { id: 'video', icon: Play, label: 'VÍDEO' }
    ] : [
        { id: 'info', icon: Info, label: 'BÁSICA' },
        { id: 'variables', icon: Activity, label: 'VAR' },
        { id: 'video', icon: Play, label: 'VÍDEO' },
        { id: 'equipo', icon: Dumbbell, label: 'EQ' },
        { id: 'musculos', icon: Zap, label: 'MUS' }
    ]

    return (
        <div className="flex flex-col h-full bg-[#050505] text-white overflow-hidden selection:bg-[#FF7939]/30 relative">

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-10 p-0 lg:p-8">
                
                {/* Mobile View Switcher - Shows only on smaller screens */}
                <div className="flex md:hidden mb-8 bg-zinc-950/60 rounded-2xl p-1 border border-white/5 w-fit mx-auto shadow-2xl backdrop-blur-xl">
                    <button 
                        onClick={() => setMobileView('editor')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all duration-300 ${mobileView === 'editor' ? 'bg-[#FF7939] text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                    >
                        <PenBox className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Editor</span>
                    </button>
                    <button 
                        onClick={() => setMobileView('preview')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all duration-300 ${mobileView === 'preview' ? 'bg-[#FF7939] text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                    >
                        <Smartphone className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">iPhone</span>
                    </button>
                </div>

                <div className="max-w-[1200px] mx-auto space-y-12">
                    
                    {/* Upper Section: iPhone View + Editor Section */}
                    <div className="flex flex-col md:flex-row gap-8 lg:gap-20 xl:gap-28 items-start justify-center">
                        
                        {/* iPhone Preview (Left on Desktop) */}
                        <div className={`${mobileView === 'preview' ? 'flex' : 'hidden'} md:flex flex-col items-center justify-start w-full md:w-[280px] lg:w-[320px] shrink-0 transform scale-[0.75] md:scale-[0.8] lg:scale-95 origin-top transition-all duration-500`}>
                            {isNutrition ? (
                                <NutritionPreviewMobile 
                                    formState={formState}
                                    onChange={onChange}
                                    onVideoSelect={() => setPreviewTab('video')}
                                    activeTab={(previewTab === 'receta' ? 'receta' : previewTab === 'ingredientes' ? 'ingredientes' : 'macros') as any}
                                    onTabChange={(tab: any) => {
                                        if (tab === 'macros') setPreviewTab('info');
                                        else if (tab === 'receta') setPreviewTab('receta');
                                        else setPreviewTab('ingredientes');
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

                        {/* Editor Section (Right/Center on Desktop) - Ultra-Compact Area */}
                        <div className={`${mobileView === 'editor' ? 'flex' : 'hidden'} md:flex flex-col flex-1 min-w-0 md:max-w-[480px] lg:max-w-[640px] xl:max-w-[720px] gap-4 w-full`}>
                            <div className="bg-transparent lg:bg-zinc-950/40 p-0 lg:p-6 rounded-none lg:rounded-[2.5rem] border-none lg:border border-white/5 lg:shadow-2xl lg:backdrop-blur-md h-[480px] lg:h-[460px] flex flex-col shrink-0 overflow-hidden">
                                
                                {/* Top Icon Menu - REDESIGNED */}
                                <div className="flex flex-row items-center justify-center gap-2 p-1.5 bg-zinc-950/80 rounded-[1.5rem] border border-white/5 shadow-inner mb-6 w-fit mx-auto shrink-0 transition-all">
                                    {menuItems.map((item) => {
                                        const completed = isSectionCompleted(item.id)
                                        const active = previewTab === item.id
                                        const Icon = item.icon

                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => setPreviewTab(item.id as any)}
                                                className={`px-3 md:px-5 h-8 md:h-9 rounded-[0.8rem] transition-all group flex items-center justify-center gap-2 relative ${active ? 'bg-[#FF7939] text-white shadow-[0_0_15px_rgba(255,121,57,0.3)]' : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/5'}`}
                                                title={item.label}
                                            >
                                                <Icon className={`h-3.5 w-3.5 md:h-4 md:w-4 transition-all ${active ? 'fill-white/20' : completed ? 'text-[#FF7939] drop-shadow-[0_0_8px_rgba(255,121,57,0.5)]' : 'group-hover:scale-110'}`} />
                                                <span className={`text-[6.5px] md:text-[7.5px] font-[1000] uppercase tracking-widest ${active ? 'text-white' : completed ? 'text-[#FF7939]/80' : 'text-zinc-600 group-hover:text-zinc-400'}`}>{item.label}</span>
                                                
                                                {completed && !active && (
                                                    <div className="absolute top-0.5 right-1.5 w-1 h-1 bg-[#FF7939] rounded-full shadow-[0_0_8px_rgba(255,121,57,0.6)]" />
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>

                                {/* Forms Section */}
                                <div className="flex-1 overflow-y-auto no-scrollbar pr-1">
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

                                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
                                    <Button variant="ghost" onClick={onCancel} className="text-zinc-500 hover:text-white uppercase font-black text-[8px] tracking-widest px-2 h-7">
                                        Descartar
                                    </Button>
                                    <Button 
                                        onClick={onSubmit} 
                                        className="flex-1 bg-[#FF7939] hover:bg-[#FF6B35] text-white font-black uppercase text-[8px] md:text-[9px] tracking-widest h-8 rounded-lg shadow-lg transition-all active:scale-95 italic"
                                    >
                                        {isEditing ? 'Guardar Cambios' : isNutrition ? 'Continuar' : 'Continuar'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
