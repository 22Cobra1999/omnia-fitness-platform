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
            <div className="flex-1 overflow-y-auto no-scrollbar pb-10 p-4 md:p-8">
                
                {/* Mobile View Switcher - Top Position */}
                <div className="flex xl:hidden mb-8 bg-zinc-950/60 rounded-2xl p-1 border border-white/5 w-fit mx-auto shadow-2xl backdrop-blur-xl">
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
                    <div className="flex flex-col xl:flex-row gap-8 items-start justify-center">
                        
                        {/* iPhone Preview (Left on Desktop) */}
                        <div className={`${mobileView === 'preview' ? 'flex' : 'hidden'} xl:flex flex-col items-center justify-start w-full xl:w-[320px] shrink-0 transform scale-90 md:scale-100 origin-top transition-all duration-500`}>
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

                        {/* Editor Section (Right/Center on Desktop) - Ultra-Compact Area */}
                        <div className={`${mobileView === 'editor' ? 'flex' : 'hidden'} xl:flex flex-col flex-1 min-w-0 md:max-w-[720px] gap-4 w-full`}>
                            <div className="bg-zinc-950/40 p-4 md:p-4 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-md h-[460px] flex flex-col shrink-0 overflow-hidden">
                                <div className="flex gap-4 flex-1 overflow-hidden">
                                    {/* Left Icon Menu */}
                                    <div className="flex flex-col gap-2 p-1.5 bg-zinc-950/80 rounded-[1.5rem] border border-white/5 shadow-inner shrink-0 h-fit">
                                        {menuItems.map((item) => {
                                            const completed = isSectionCompleted(item.id)
                                            const active = previewTab === item.id

                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => setPreviewTab(item.id as any)}
                                                    className={`w-12 h-12 md:w-14 md:h-14 rounded-[1.2rem] transition-all group flex flex-col items-center justify-center gap-0.5 relative ${active ? 'bg-[#FF7939] text-white shadow-[0_0_25px_rgba(255,121,57,0.4)]' : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/5'}`}
                                                    title={item.label}
                                                >
                                                    <item.icon className={`h-5 w-5 md:h-6 md:w-6 transition-all ${active ? 'fill-white/20' : completed ? 'text-[#FF7939] drop-shadow-[0_0_8px_rgba(255,121,57,0.5)]' : 'group-hover:scale-110'}`} />
                                                    <span className={`text-[6px] md:text-[7px] font-[1000] uppercase tracking-tighter ${active ? 'text-white' : completed ? 'text-[#FF7939]/80' : 'text-zinc-600 group-hover:text-zinc-400'}`}>{item.label}</span>
                                                    
                                                    {completed && !active && (
                                                        <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#FF7939] rounded-full shadow-[0_0_10px_rgba(255,121,57,0.8)]" />
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
                                <div className="flex items-center gap-3 mt-4 pt-2 border-t border-white/5">
                                    <Button variant="ghost" onClick={onCancel} className="text-zinc-500 hover:text-white uppercase font-black text-[8px] tracking-widest px-2 h-7">
                                        Descartar
                                    </Button>
                                    <Button 
                                        onClick={onSubmit} 
                                        className="flex-1 bg-[#FF7939] hover:bg-[#FF6B35] text-white font-black uppercase text-[9px] md:text-[10px] tracking-widest h-9 rounded-xl shadow-lg transition-all active:scale-95 italic"
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
