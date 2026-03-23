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
        <div className="relative w-full max-w-[280px] mx-auto bg-black rounded-[2.2rem] overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.8)] flex flex-col font-sans select-none border border-white/20 h-[580px] transition-all duration-700">
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

                {/* Video - Frameless & Centered Offset */}
                <div onClick={onVideoSelect} className="relative aspect-video mb-5 cursor-pointer group transition-all pl-1.5 mx-auto w-full">
                    {formState.video_url || formState.bunny_video_id ? (
                        <UniversalVideoPlayer 
                            videoUrl={formState.video_url} 
                            bunnyVideoId={formState.bunny_video_id}
                            thumbnailUrl={formState.video_thumbnail_url}
                            className="w-full h-full object-contain overflow-hidden rounded-lg"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900/30 backdrop-blur-sm text-zinc-600 transition-colors group-hover:bg-[#FF7939]/5 border border-white/10 rounded-xl">
                             <div className="p-3 bg-zinc-950/50 rounded-full border border-white/5 mb-2 group-hover:scale-110 transition-all">
                                <Play className="h-5 w-5 fill-[#FF7939] text-[#FF7939] drop-shadow-[0_0_8px_rgba(255,121,57,0.4)]" />
                             </div>
                             <span className="text-[6px] uppercase font-black tracking-[0.2em] text-zinc-500 group-hover:text-white transition-colors italic">Seleccionar Video</span>
                        </div>
                    )}
                </div>

                {/* Metrics Pill - Image 2 style Enhanced */}
                <div className="flex items-center justify-between bg-zinc-950/80 p-1 rounded-full border border-white/10 mb-5 shadow-2xl overflow-hidden">
                    <div className="flex items-center gap-3 px-2">
                         <div className="flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5 text-zinc-500" />
                            <span className="text-[9px] font-black text-white italic tracking-tighter uppercase whitespace-nowrap">
                                {formState.duracion_min || 0} MIN
                            </span>
                         </div>
                         <div className="flex items-center gap-1">
                            <Flame className="h-2.5 w-2.5 text-[#FF7939]" />
                            <span className="text-[9px] font-black text-white italic tracking-tighter uppercase whitespace-nowrap">
                                ~{formState.calorias || 0}
                            </span>
                         </div>
                         {/* Intensity Flames Indicator */}
                         <div className="flex items-center gap-0.5 border-l border-white/5 pl-2 ml-1">
                            {[1, 2, 3].map((idx) => {
                                const level = (formState.nivel_intensidad || '').toLowerCase()
                                const active = (level.includes('alto') && idx <= 3) || 
                                               (level.includes('medio') && idx <= 2) || 
                                               (level.includes('bajo') && idx <= 1)
                                return (
                                    <Flame 
                                        key={idx} 
                                        className={`h-2.5 w-2.5 transition-colors ${active ? 'text-[#FF7939] fill-[#FF7939]' : 'text-zinc-800'}`} 
                                    />
                                )
                            })}
                         </div>
                    </div>
                    
                    <div 
                        className="rounded-full px-3 py-1 shadow-[inset_0_0_10px_rgba(255,121,57,0.1)] mr-0.5"
                        style={{ 
                            backgroundColor: `${
                                (formState.tipo_ejercicio || 'FUERZA') === 'CARDIO' ? '#ef444420' : 
                                (formState.tipo_ejercicio || 'FUERZA') === 'HIIT' ? '#eab30820' : 
                                (formState.tipo_ejercicio || 'FUERZA') === 'ESTIRAM' ? '#22c55e20' : '#FF793920'
                            }`,
                            borderColor: `${
                                (formState.tipo_ejercicio || 'FUERZA') === 'CARDIO' ? '#ef444440' : 
                                (formState.tipo_ejercicio || 'FUERZA') === 'HIIT' ? '#eab30840' : 
                                (formState.tipo_ejercicio || 'FUERZA') === 'ESTIRAM' ? '#22c55e40' : '#FF793940'
                            }`,
                            borderWidth: '1px'
                        }}
                    >
                         <span 
                            className="text-[8px] font-black italic uppercase tracking-wider block leading-none"
                            style={{ 
                                color: `${
                                    (formState.tipo_ejercicio || 'FUERZA') === 'CARDIO' ? '#ef4444' : 
                                    (formState.tipo_ejercicio || 'FUERZA') === 'HIIT' ? '#eab308' : 
                                    (formState.tipo_ejercicio || 'FUERZA') === 'ESTIRAM' ? '#22c55e' : '#FF7939'
                                }` 
                            }}
                         >
                            {formState.tipo_ejercicio || 'FUERZA'}
                         </span>
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
                                <motion.div key={idx} className="flex items-center bg-zinc-950 rounded-2xl p-3 border border-white/5 shadow-2xl transition-all hover:bg-zinc-900/50">
                                    <div className="w-8 h-8 rounded-full bg-[#FF7939] flex items-center justify-center text-[11px] font-black text-white italic shadow-[0_0_15px_rgba(255,121,57,0.3)] mr-4 shrink-0">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 flex items-center justify-around">
                                        <div className="text-center group">
                                            <span className="block text-white font-black text-[14px] leading-none mb-1">{serie.s}</span>
                                            <span className="text-[6px] text-zinc-600 font-black uppercase tracking-[0.2em]">Series</span>
                                        </div>
                                        <div className="text-center group">
                                            <span className="block text-white font-black text-[14px] leading-none mb-1">{serie.r}</span>
                                            <span className="text-[6px] text-zinc-600 font-black uppercase tracking-[0.2em]">Reps</span>
                                        </div>
                                        {Number(serie.p) > 0 && (
                                            <div className="text-center group animate-in zoom-in duration-300">
                                                <span className="block text-[#FF7939] font-black text-[14px] leading-none mb-1 italic">{serie.p}<span className="text-[8px] ml-0.5">kg</span></span>
                                                <span className="text-[6px] text-[#FF7939]/40 font-black uppercase tracking-[0.2em]">Peso</span>
                                            </div>
                                        )}
                                        {Number(serie.t) > 0 && (
                                            <div className="text-center group animate-in zoom-in duration-300">
                                                <span className="block text-blue-400 font-black text-[14px] leading-none mb-1 italic">{serie.t}<span className="text-[8px] ml-0.5">s</span></span>
                                                <span className="text-[6px] text-blue-400/40 font-black uppercase tracking-[0.2em]">Secs</span>
                                            </div>
                                        )}
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
