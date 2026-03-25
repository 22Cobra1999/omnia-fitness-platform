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
                
                {/* Header - ENHANCED VISIBILITY */}
                <div className="flex flex-col items-center mb-3">
                    <span className="text-[7px] font-black tracking-[0.4em] text-zinc-600 uppercase mb-1 opacity-80">PREVIEW VIVO</span>
                    <h1 className="w-full text-center text-white font-[1000] text-[15px] leading-tight tracking-tighter uppercase italic px-1 truncate drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                        {formState.nombre || 'NUEVA COMIDA...'}
                    </h1>
                </div>

                {/* Video - Centered & Clean (No Frame) */}
                <div onClick={onVideoSelect} className="relative aspect-video mb-5 cursor-pointer group transition-all mx-auto w-full overflow-hidden rounded-xl bg-zinc-950/50">
                    {formState.video_url || formState.bunny_video_id ? (
                        <div className="w-full h-full scale-[0.85] transform-gpu">
                            <UniversalVideoPlayer 
                                videoUrl={formState.video_url} 
                                bunnyVideoId={formState.bunny_video_id}
                                thumbnailUrl={formState.video_thumbnail_url}
                                className="w-full h-full object-cover rounded-lg"
                            />
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900/40 backdrop-blur-sm text-zinc-600 transition-colors group-hover:bg-[#FF7939]/5">
                             <div className="p-3 bg-zinc-950/50 rounded-full border border-white/5 mb-2 group-hover:scale-110 transition-all">
                                <Play className="h-5 w-5 fill-[#FF7939] text-[#FF7939] drop-shadow-[0_0_8px_rgba(255,121,57,0.4)]" />
                             </div>
                             <span className="text-[6px] uppercase font-black tracking-[0.2em] text-zinc-500 group-hover:text-white transition-colors italic">Seleccionar Video</span>
                        </div>
                    )}
                </div>

                {/* Metrics Pill - Centered & Clean */}
                <div className="flex items-center justify-center bg-zinc-950/80 p-2.5 rounded-full border border-white/10 mb-5 shadow-2xl overflow-hidden">
                    <div className="flex items-center gap-6 px-2">
                         <div className="flex items-center gap-1.5 transition-transform hover:scale-105">
                            <Clock className="h-3 w-3 text-zinc-500" />
                            <span className="text-[10px] font-black text-white italic tracking-tighter uppercase whitespace-nowrap">
                                {formState.minutos || 0} MIN
                            </span>
                         </div>
                         <div className="w-px h-3 bg-white/10" />
                         <div className="flex items-center gap-1.5 transition-transform hover:scale-105">
                            <Flame className="h-3 w-3 text-[#FF7939]" />
                            <span className="text-[10px] font-black text-white italic tracking-tighter uppercase whitespace-nowrap">
                                ~{formState.calorias || 0}
                            </span>
                         </div>
                    </div>
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
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-1 bg-zinc-900/40 p-4 rounded-3xl border border-white/5 shadow-2xl">
                             <div className="flex justify-between items-center px-1">
                                <span className="text-[12px] font-[1000] italic uppercase tracking-tighter text-white">Macros</span>
                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500 italic">
                                    {Number(formState.proteinas || 0) > 30 ? 'ALTO EN PROT' : 'BALANCEADO'}
                                </span>
                             </div>

                             {/* Macro Bars */}
                             <div className="flex gap-1 h-2 w-full px-1">
                                <div className="flex-1 bg-[#FF7939] rounded-full shadow-[0_0_10px_rgba(255,121,57,0.3)]" />
                                <div className="flex-1 bg-[#F5D5AE] rounded-full shadow-[0_0_10px_rgba(245,213,174,0.2)]" />
                                <div className="flex-1 bg-[#93C5FD] rounded-full shadow-[0_0_10px_rgba(147,197,253,0.2)]" />
                             </div>

                             {/* Macro Values */}
                             <div className="flex justify-between px-1 pt-1">
                                 <div className="text-center">
                                     <span className="block text-white font-[1000] text-[15px] italic leading-none">{formState.proteinas || 0}g</span>
                                     <span className="text-[8px] text-[#FF7939] font-black uppercase tracking-widest mt-1 block">Prot</span>
                                 </div>
                                 <div className="text-center">
                                     <span className="block text-white font-[1000] text-[15px] italic leading-none">{formState.grasas || 0}g</span>
                                     <span className="text-[8px] text-[#F5D5AE] font-black uppercase tracking-widest mt-1 block">Fats</span>
                                 </div>
                                 <div className="text-center">
                                     <span className="block text-white font-[1000] text-[15px] italic leading-none">{formState.carbohidratos || 0}g</span>
                                     <span className="text-[8px] text-[#93C5FD] font-black uppercase tracking-widest mt-1 block">Carbs</span>
                                 </div>
                             </div>
                        </div>
                    ) : activeTab === 'receta' ? (
                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-1">
                             {(() => {
                                 const receta = formState.receta || ''
                                 if (!receta) return <p className="text-[9px] text-zinc-600 italic text-center py-4">Sin instrucciones...</p>
                                 const pasos = receta.split(';').map(p => p.trim()).filter(Boolean)
                                 return (
                                     <div className="bg-zinc-900/40 p-4 rounded-2xl border border-white/5 text-[9px] text-zinc-200 leading-relaxed font-bold italic shadow-inner">
                                         {pasos.map((paso, idx) => (
                                             <span key={idx} className="inline">
                                                 <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#FF7939]/20 text-[#FF7939] border border-[#FF7939]/30 text-[8px] font-black italic mr-1.5 align-middle mb-0.5">
                                                     {idx + 1}
                                                 </span>
                                                 {paso}{idx < pasos.length - 1 ? " " : ""}
                                             </span>
                                         ))}
                                     </div>
                                 )
                             })()}
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
