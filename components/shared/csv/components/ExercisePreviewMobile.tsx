import React from 'react'
import { motion } from 'framer-motion'
import { Play, Clock, Flame, Dumbbell, FileText } from 'lucide-react'
import { ManualFormState } from '../types'
import { UniversalVideoPlayer } from '@/components/shared/video/universal-video-player'

interface ExercisePreviewMobileProps {
    formState: ManualFormState
    onChange: (field: keyof ManualFormState, value: any) => void
    onVideoSelect: () => void
    activeTab: 'series' | 'musculos' | 'tecnica'
    onTabChange: (tab: 'series' | 'musculos' | 'tecnica') => void
}

export function ExercisePreviewMobile({ formState, onChange, onVideoSelect, activeTab, onTabChange }: ExercisePreviewMobileProps) {
    const seriesArray = (formState.detalle_series || '').split(';').filter(Boolean).map(item => {
        const parts = item.replace(/[()]/g, '').split('-')
        // Format: weight-reps-sets-seconds
        return { 
            p: parts[0] || '0', 
            r: parts[1] || '0', 
            s: parts[2] || '1',
            t: parts[3] || '0'
        }
    })

    const bodyParts = (formState.partes_cuerpo || '').split(';').filter(Boolean)

    return (
        <div className="relative w-full max-w-[360px] mx-auto bg-black rounded-[2.8rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.9)] flex flex-col font-sans select-none border border-white/20 h-[580px] transition-all duration-700">
            {/* Notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-3.5 bg-zinc-900 rounded-full z-50 flex items-center justify-center border border-white/10">
                 <div className="w-5 h-0.5 bg-zinc-800 rounded-full" />
            </div>

            {/* Content Area - ULTRA COMPACT pt-12 */}
            <div className="flex-1 overflow-y-auto px-4 pt-12 pb-5 scrollbar-hide bg-black">
                
                {/* Header - ENHANCED VISIBILITY */}
                <div className="flex flex-col items-center mb-5">
                    <span className="text-[7px] font-black tracking-[0.4em] text-zinc-500 uppercase mb-1.5 opacity-80">PREVIEW VIVO</span>
                    <h1 className="w-full text-center text-white font-[1000] text-[15px] leading-tight tracking-tighter uppercase italic px-1 truncate drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                        {formState.nombre || 'SIN NOMBRE...'}
                    </h1>
                </div>

                {/* Video - Seamless Frame with High Definition Border */}
                <div onClick={onVideoSelect} className="relative aspect-video rounded-[1rem] overflow-hidden mb-4 border border-white/20 cursor-pointer group transition-all hover:border-[#FF7939]/50 shadow-2xl">
                    {formState.video_url || formState.bunny_video_id ? (
                        <UniversalVideoPlayer 
                            videoUrl={formState.video_url} 
                            bunnyVideoId={formState.bunny_video_id}
                            thumbnailUrl={formState.video_thumbnail_url}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900/30 backdrop-blur-sm text-zinc-600 transition-colors group-hover:bg-[#FF7939]/5">
                             <div className="p-3 bg-zinc-950/50 rounded-full border border-white/5 mb-2 group-hover:scale-110 transition-all">
                                <Play className="h-5 w-5 fill-[#FF7939] text-[#FF7939] drop-shadow-[0_0_8px_rgba(255,121,57,0.4)]" />
                             </div>
                             <span className="text-[6px] uppercase font-black tracking-[0.2em] text-zinc-500 group-hover:text-white transition-colors italic">Seleccionar Video</span>
                        </div>
                    )}
                </div>

                {/* Metrics - CLEARER TEXT */}
                <div className="grid grid-cols-2 gap-1.5 mb-5">
                    <div className="flex flex-col bg-zinc-900/60 rounded-lg px-2.5 py-1.5 border border-white/10 shadow-inner">
                        <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-zinc-400" />
                            <span className="text-xs font-black text-white">{formState.duracion_min || 0}</span>
                        </div>
                        <span className="text-[6px] font-black text-zinc-400 uppercase tracking-tighter">MINUTOS TOTALES</span>
                    </div>
                    <div className="flex flex-col bg-zinc-900/60 rounded-lg px-2.5 py-1.5 border border-white/10 shadow-inner">
                        <div className="flex items-center gap-1.5">
                            <Flame className="h-3 w-3 text-zinc-400" />
                            <span className="text-xs font-black text-white">{formState.calorias || 0}</span>
                        </div>
                        <span className="text-[6px] font-black text-zinc-400 uppercase tracking-widest">CALORÍAS</span>
                    </div>
                </div>

                {/* Muscle row - Higher contrast tags */}
                <div className="flex gap-1 overflow-x-auto pb-3 scrollbar-hide no-scrollbar -mx-4 px-4">
                    {bodyParts.length > 0 ? bodyParts.map((part, idx) => (
                        <div key={idx} className="shrink-0 px-2.5 py-1 bg-zinc-800 rounded-full border border-white/20">
                            <span className="text-[7px] font-black text-zinc-200 uppercase italic tracking-wider">{part}</span>
                        </div>
                    )) : (
                        <div className="px-2.5 py-1 rounded-full border border-dashed border-zinc-800">
                            <span className="text-[6px] font-black text-zinc-700 uppercase italic">S/ Músculos</span>
                        </div>
                    )}
                </div>

                {/* Tabs - CLEANER LABELS */}
                <div className="flex bg-zinc-950 p-1 rounded-lg border border-white/10 mb-3 shadow-inner">
                    <button onClick={() => onTabChange('series')} className={`flex-1 py-1 rounded text-[8px] font-black uppercase italic transition-all ${activeTab === 'series' ? 'bg-[#FF7939] text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Series</button>
                    <button onClick={() => onTabChange('musculos')} className={`flex-1 py-1 rounded text-[8px] font-black uppercase italic transition-all ${activeTab === 'musculos' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-white'}`}>Equipo</button>
                    <button onClick={() => onTabChange('tecnica')} className={`flex-1 py-1 rounded text-[8px] font-black uppercase italic transition-all ${activeTab === 'tecnica' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-white'}`}>Detalle</button>
                </div>

                {/* Tab Content - HIGH CONTRAST PRS */}
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
                    {activeTab === 'series' ? (
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-1">
                            {seriesArray.map((serie, idx) => (
                                <motion.div key={idx} className="flex items-center bg-zinc-900/80 rounded-lg p-2.5 border border-white/10 shadow-lg">
                                    <div className="w-1 h-5 rounded-full bg-zinc-800 mr-2.5" />
                                    <span className="text-zinc-500 font-black text-[9px] mr-1.5">#{idx + 1}</span>
                                    <div className="flex-1 flex items-center justify-around translate-y-0.5">
                                        <div className="text-center">
                                            <span className="block text-white font-black text-[10px] leading-none">{serie.s}</span>
                                            <span className="text-[5px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5 block">S</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="block text-white font-black text-[10px] leading-none">{serie.r}</span>
                                            <span className="text-[5px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5 block">R</span>
                                        </div>
                                        <div className="text-center min-w-[30px]">
                                            <span className="block text-[#FF7939] font-black text-[10px] leading-none italic">{serie.p}</span>
                                            <span className="text-[5px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5 block italic">KG</span>
                                        </div>
                                        <div className="text-center min-w-[30px]">
                                            <span className="block text-blue-400 font-black text-[10px] leading-none italic">{serie.t}</span>
                                            <span className="text-[5px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5 block italic">SEG</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : activeTab === 'tecnica' ? (
                        <div className="p-3.5 bg-zinc-900/50 rounded-xl border border-white/10">
                             <p className="text-[9px] text-zinc-300 leading-normal font-medium line-clamp-10 drop-shadow-sm italic">
                                {formState.descripcion || 'Sin descripción técnica disponible...'}
                             </p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 opacity-30 text-zinc-600">
                             <Dumbbell className="h-6 w-6 stroke-[1]" />
                             <span className="text-[6px] font-black uppercase tracking-[0.3em] mt-2">Equipo Focus</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
