import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Clock, Flame, Dumbbell, Edit2, Info, Layout, List, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ManualFormState } from '../types'
import { UniversalVideoPlayer } from '@/components/shared/video/universal-video-player'

interface ExercisePreviewMobileProps {
    formState: ManualFormState
    onChange: (field: keyof ManualFormState, value: string) => void
    onVideoSelect: () => void
    activeTab: 'series' | 'musculos' | 'tecnica'
    onTabChange: (tab: 'series' | 'musculos' | 'tecnica') => void
}

export function ExercisePreviewMobile({ formState, onChange, onVideoSelect, activeTab, onTabChange }: ExercisePreviewMobileProps) {

    const seriesItems = formState.detalle_series?.split(';').filter(Boolean) || []
    const bodyParts = formState.partes_cuerpo?.split(';').filter(Boolean) || []

    return (
        <div className="relative w-full max-w-[380px] mx-auto bg-black rounded-[4rem] border-[10px] border-zinc-900 overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] aspect-[9/19.5] flex flex-col font-sans select-none ring-1 ring-white/10">
            {/* Notch Area */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-zinc-900 rounded-b-3xl z-50 flex items-center justify-center">
                 <div className="w-12 h-1 bg-zinc-800 rounded-full" />
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-6 pt-16 pb-8 scrollbar-hide bg-black">
                
                {/* Header Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-6 h-6 flex items-center justify-center">
                        <Flame className="h-5 w-5 text-[#FF7939] fill-[#FF7939] animate-pulse" />
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-center text-white font-[900] text-[22px] leading-[1.1] tracking-tighter uppercase mb-8 italic italic font-sans px-2">
                    {formState.nombre || 'PRESS CON MANCUERNAS EN BANCO PLANO'}
                </h2>

                {/* Video Playback Section */}
                <div 
                    className="relative aspect-video bg-zinc-900 rounded-[2.5rem] overflow-hidden mb-10 group cursor-pointer border border-white/5 shadow-2xl"
                    onClick={onVideoSelect}
                >
                    {formState.video_url || formState.bunny_video_id ? (
                        <UniversalVideoPlayer 
                            videoUrl={formState.video_url} 
                            bunnyVideoId={formState.bunny_video_id}
                            thumbnailUrl={formState.video_thumbnail_url}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900/50 text-zinc-500">
                             <Play className="h-12 w-12 mb-3 fill-[#FF7939] text-[#FF7939] opacity-80" />
                             <span className="text-[9px] uppercase font-black tracking-[0.2em] text-[#FF7939]">SELECCIONAR VIDEO</span>
                        </div>
                    )}
                    
                    {/* Fake Progress Bar exactly as image */}
                    <div className="absolute bottom-6 left-6 right-6 h-1.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-md">
                        <div className="h-full w-2/5 bg-[#FF7939]" />
                    </div>
                    <div className="absolute bottom-3 left-6 text-[11px] text-white/80 font-bold tracking-tight">00:32 / 01:15</div>
                </div>

                {/* Metrics Pill (THE PILL) */}
                <div className="flex items-center justify-between bg-zinc-900/30 rounded-[2rem] pl-6 pr-2 py-2 border border-white/10 mb-10 shadow-xl">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-zinc-500" />
                        <span className="text-[13px] font-black text-white/90 uppercase">{formState.duracion_min || '12'} MIN</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Flame className="h-4 w-4 text-zinc-500" />
                        <span className="text-[13px] font-black text-white/90 uppercase">~{formState.calorias || '70'} KCAL</span>
                    </div>
                    <div className="bg-[#FF7939]/10 border border-[#FF7939]/30 rounded-2xl px-5 py-2">
                        <span className="text-[#FF7939] text-[11px] font-[1000] uppercase tracking-wider italic italic">
                            {formState.tipo_ejercicio || 'FUERZA'}
                        </span>
                    </div>
                </div>

                {/* Tabs Styling like image */}
                <div className="flex justify-between border-b border-white/5 mb-8">
                    {(['series', 'musculos', 'tecnica'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => onTabChange(tab)}
                            className={`pb-3 px-2 text-[12px] font-black uppercase tracking-widest transition-all relative ${
                                activeTab === tab ? 'text-white' : 'text-zinc-600'
                            }`}
                        >
                            <span className="italic italic">
                                {tab === 'musculos' ? 'MúSCULOS' : tab === 'tecnica' ? 'TéCNICA' : tab}
                            </span>
                            {activeTab === tab && (
                                <motion.div 
                                    layoutId="activeTabMobile"
                                    className="absolute bottom-0 left-0 right-0 h-1 bg-[#FF7939] rounded-full"
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-[200px]">
                    <AnimatePresence mode="wait">
                        {activeTab === 'series' && (
                            <motion.div
                                key="series"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-5"
                            >
                                {seriesItems.length > 0 ? (
                                    seriesItems.map((item: string, idx: number) => {
                                        const parts = item.replace(/[()]/g, '').split('-')
                                        return (
                                            <div key={idx} className="bg-[#111] rounded-[2rem] p-5 flex items-center justify-between border border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] group relative overflow-hidden">
                                                <div className="flex items-center gap-5">
                                                    {/* Numbered Circle with glow */}
                                                    <div className="w-12 h-12 rounded-full bg-[#FF7939] text-white flex items-center justify-center font-black text-lg shadow-[0_0_20px_rgba(255,121,57,0.4)] border border-white/20">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex gap-6">
                                                        <div className="text-center">
                                                            <div className="text-white font-black text-lg leading-none mb-1">{parts[2] || '3'}</div>
                                                            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-tighter opacity-70">Series</div>
                                                        </div>
                                                        <div className="text-center text-[#111]">
                                                            <div className="text-white font-black text-lg leading-none mb-1">{parts[1] || '12'}</div>
                                                            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-tighter opacity-70">Reps</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-white font-black text-lg leading-none mb-1">{parts[0] || '40kg'}</div>
                                                            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-tighter opacity-70">Peso</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button 
                                                    className="w-10 h-10 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center group-hover:bg-[#FF7939]/10 group-hover:border-[#FF7939]/30 transition-all shadow-inner"
                                                >
                                                    <Edit2 className="h-4 w-4 text-[#FF7939]" />
                                                </button>
                                            </div>
                                        )
                                    })
                                ) : (
                                    /* Empty state matching the card style */
                                    <div className="bg-[#111] rounded-[2.5rem] p-10 border border-white/5 flex flex-col items-center justify-center text-center opacity-40">
                                         <List className="h-10 w-10 text-zinc-700 mb-4" />
                                         <p className="text-[12px] text-zinc-600 uppercase font-black italic tracking-widest">Sin Series</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'musculos' && (
                            <motion.div
                                key="musculos"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                className="flex flex-wrap gap-3 pt-2"
                            >
                                {bodyParts.length > 0 ? (
                                    bodyParts.map((part: string, idx: number) => (
                                        <div key={idx} className="bg-zinc-900/80 px-5 py-3 rounded-[1.5rem] border border-white/10 text-zinc-100 text-[12px] font-black uppercase tracking-[0.1em] italic transition-all hover:bg-[#FF7939]/20 hover:border-[#FF7939]/30">
                                            {part}
                                        </div>
                                    ))
                                ) : (
                                    <div className="w-full text-center py-20 opacity-30">
                                        <p className="text-[10px] font-black uppercase italic tracking-widest text-zinc-500">Completa partes del cuerpo en el formulario</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'tecnica' && (
                            <motion.div
                                key="tecnica"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="pt-2"
                            >
                                <div className="bg-zinc-900/20 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-sm">
                                    <h4 className="text-[11px] text-[#FF7939] uppercase font-black tracking-[0.2em] mb-4 italic italic font-sans flex items-center">
                                         TÉCNICA DE EJECUCIÓN
                                    </h4>
                                    <p className="text-zinc-400 text-[13px] leading-[1.6] font-medium whitespace-pre-wrap">
                                        {formState.descripcion || 'Escribe la técnica detallada aquí...'}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Bottom Navigation Mockup - PIXEL PERFECT */}
            <div className="h-24 bg-zinc-900/60 backdrop-blur-3xl border-t border-white/5 flex justify-around items-center px-6 pb-2">
                 <div className="flex flex-col items-center gap-1.5 opacity-40">
                    <Search className="h-5 w-5 text-white" />
                    <span className="text-[10px] uppercase font-black tracking-tighter text-white">BUSCAR</span>
                 </div>
                 <div className="flex flex-col items-center gap-1.5 transition-all transform hover:scale-110">
                    <Flame className="h-6 w-6 text-[#FF7939] fill-[#FF7939]" />
                    <span className="text-[10px] uppercase font-black tracking-tighter text-[#FF7939]">ACTIVIDADES</span>
                 </div>
                 
                 {/* Main Button Glow */}
                 <div className="relative">
                     <div className="absolute inset-0 bg-[#FF7939] blur-[25px] opacity-40 rounded-full" />
                     <div className="relative w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center -mt-10 border-4 border-black shadow-2xl overflow-hidden group">
                         <div className="absolute inset-0 bg-gradient-to-tr from-[#FF7939] to-[#E66829] group-hover:to-orange-400 transition-all duration-300" />
                         <Flame className="h-7 w-7 text-white fill-white relative z-10" />
                     </div>
                 </div>

                 <div className="flex flex-col items-center gap-1.5 opacity-40">
                    <Clock className="h-5 w-5 text-white" />
                    <span className="text-[10px] uppercase font-black tracking-tighter text-white">CALENDARIO</span>
                 </div>
                 <div className="flex flex-col items-center gap-1.5 opacity-40">
                    <Layout className="h-5 w-5 text-white" />
                    <span className="text-[10px] uppercase font-black tracking-tighter text-white">PERFIL</span>
                 </div>
            </div>

            {/* Indicator bar like iPhone */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full mb-1" />
        </div>
    )
}
