import React from 'react'
import { motion } from 'framer-motion'
import { Play, Clock, Flame, Utensils, FileText, ShoppingBasket } from 'lucide-react'
import { ManualFormState } from '../types'
import { UniversalVideoPlayer } from '@/components/shared/video/universal-video-player'

interface NutritionPreviewMobileProps {
    formState: ManualFormState
    onChange: (field: keyof ManualFormState, value: any) => void
    onVideoSelect: () => void
    activeTab: 'macros' | 'ingredientes' | 'receta'
    onTabChange: (tab: 'macros' | 'ingredientes' | 'receta') => void
}

export function NutritionPreviewMobile({ formState, onChange, onVideoSelect, activeTab, onTabChange }: NutritionPreviewMobileProps) {
    const ingredients = (formState.ingredientes || '').split(';').filter(Boolean)

    return (
        <div className="relative w-full max-w-[280px] mx-auto bg-black rounded-[2.2rem] overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.8)] flex flex-col font-sans select-none border border-white/20 h-[580px]">
            {/* Notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-3.5 bg-zinc-900 rounded-full z-50 flex items-center justify-center border border-white/10">
                 <div className="w-5 h-0.5 bg-zinc-800 rounded-full" />
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-4 pt-12 pb-5 scrollbar-hide bg-black">
                
                {/* Header */}
                <div className="flex flex-col items-center mb-5">
                    <span className="text-[7px] font-black tracking-[0.4em] text-zinc-500 uppercase mb-1.5 opacity-80">NUTRICIÓN PREVIEW</span>
                    <h1 className="w-full text-center text-white font-[1000] text-[15px] leading-tight tracking-tighter uppercase italic px-1 truncate drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                        {formState.nombre || 'NUEVA COMIDA...'}
                    </h1>
                </div>

                {/* Video/Image Area */}
                <div onClick={onVideoSelect} className="relative aspect-video bg-zinc-950 rounded-[1rem] overflow-hidden mb-4 border border-white/10 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] cursor-pointer group">
                    {formState.video_url || formState.bunny_video_id ? (
                        <UniversalVideoPlayer 
                            videoUrl={formState.video_url} 
                            bunnyVideoId={formState.bunny_video_id}
                            thumbnailUrl={formState.video_thumbnail_url}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-transparent text-zinc-600 transition-colors group-hover:bg-zinc-900/50">
                             <Play className="h-5 w-5 fill-zinc-800 text-zinc-800 mb-1 opacity-60 group-hover:text-[#FF7939]" />
                             <span className="text-[6px] uppercase font-black tracking-widest text-zinc-700">GALERIA / RECETA</span>
                        </div>
                    )}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-1.5 mb-5">
                    <div className="flex flex-col bg-zinc-900/60 rounded-lg px-2.5 py-1.5 border border-white/10 shadow-inner">
                        <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-zinc-400" />
                            <span className="text-xs font-black text-white">{formState.minutos || 0} min</span>
                        </div>
                        <span className="text-[6px] font-black text-zinc-400 uppercase tracking-tighter">PREPARACIÓN</span>
                    </div>
                    <div className="flex flex-col bg-zinc-900/60 rounded-lg px-2.5 py-1.5 border border-white/10 shadow-inner">
                        <div className="flex items-center gap-1.5">
                            <Flame className="h-3 w-3 text-zinc-400" />
                            <span className="text-xs font-black text-white">{formState.calorias || 0}</span>
                        </div>
                        <span className="text-[6px] font-black text-zinc-400 uppercase tracking-widest">CALORÍAS</span>
                    </div>
                </div>

                {/* Categories row */}
                <div className="flex gap-1 overflow-x-auto pb-3 scrollbar-hide no-scrollbar -mx-4 px-4">
                    {(formState.tipo || '').split(';').filter(Boolean).map((cat, idx) => (
                        <div key={idx} className="shrink-0 px-2.5 py-1 bg-zinc-800 rounded-full border border-white/20">
                            <span className="text-[7px] font-black text-zinc-200 uppercase italic tracking-wider">{cat}</span>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex bg-zinc-950 p-1 rounded-lg border border-white/10 mb-3 shadow-inner">
                    <button onClick={() => onTabChange('macros')} className={`flex-1 py-1 rounded text-[8px] font-black uppercase italic transition-all ${activeTab === 'macros' ? 'bg-[#FF7939] text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Macros</button>
                    <button onClick={() => onTabChange('ingredientes')} className={`flex-1 py-1 rounded text-[8px] font-black uppercase italic transition-all ${activeTab === 'ingredientes' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-white'}`}>Ingredientes</button>
                    <button onClick={() => onTabChange('receta')} className={`flex-1 py-1 rounded text-[8px] font-black uppercase italic transition-all ${activeTab === 'receta' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-white'}`}>Receta</button>
                </div>

                {/* Content */}
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
                    {activeTab === 'macros' ? (
                        <div className="grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-bottom-1">
                             <div className="bg-zinc-900/80 p-2 rounded-xl border border-white/5 text-center">
                                 <span className="block text-red-500 font-black text-[12px] italic">{formState.proteinas || 0}g</span>
                                 <span className="text-[6px] text-zinc-500 font-bold uppercase tracking-widest italic">PROT</span>
                             </div>
                             <div className="bg-zinc-900/80 p-2 rounded-xl border border-white/5 text-center">
                                 <span className="block text-yellow-500 font-black text-[12px] italic">{formState.carbohidratos || 0}g</span>
                                 <span className="text-[6px] text-zinc-500 font-bold uppercase tracking-widest italic">CARB</span>
                             </div>
                             <div className="bg-zinc-900/80 p-2 rounded-xl border border-white/5 text-center">
                                 <span className="block text-blue-400 font-black text-[12px] italic">{formState.grasas || 0}g</span>
                                 <span className="text-[6px] text-zinc-500 font-bold uppercase tracking-widest italic">GRAS</span>
                             </div>
                        </div>
                    ) : activeTab === 'receta' ? (
                        <div className="p-3.5 bg-zinc-900/50 rounded-xl border border-white/10">
                             <p className="text-[9px] text-zinc-300 leading-normal font-medium italic whitespace-pre-wrap">
                                {formState.receta || 'Sin instrucciones de preparación...'}
                             </p>
                        </div>
                    ) : (
                        <div className="space-y-1.5 animate-in fade-in">
                            {ingredients.map((ing, idx) => (
                                <div key={idx} className="flex items-center gap-3 bg-zinc-900/40 p-2 rounded-lg border border-white/5">
                                    <ShoppingBasket className="h-3 w-3 text-[#FF7939] opacity-70" />
                                    <span className="text-[9px] font-black text-zinc-200 uppercase italic truncate">{ing}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
