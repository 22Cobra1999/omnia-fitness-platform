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
}

export function ExercisePreviewMobile({ formState, onChange, onVideoSelect }: ExercisePreviewMobileProps) {
    const [activeTab, setActiveTab] = useState<'series' | 'musculos' | 'tecnica'>('series')

    const seriesItems = formState.detalle_series?.split(';').filter(Boolean) || []
    const bodyParts = formState.partes_cuerpo?.split(';').filter(Boolean) || []

    return (
        <div className="relative w-full max-w-[380px] mx-auto bg-black rounded-[3rem] border-[8px] border-zinc-800 overflow-hidden shadow-2xl aspect-[9/19.5] flex flex-col font-sans select-none">
            {/* Notch Area */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-800 rounded-b-2xl z-50"></div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-6 pt-12 pb-8 scrollbar-hide bg-gradient-to-b from-zinc-900 to-black">
                
                {/* Header Icon */}
                <div className="flex justify-center mb-4">
                    <div className="w-8 h-8 rounded-full bg-[#FF7939]/20 flex items-center justify-center border border-[#FF7939]/30">
                        <Flame className="h-4 w-4 text-[#FF7939] fill-[#FF7939]" />
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-center text-white font-black text-xl leading-tight tracking-tight uppercase mb-6 italic">
                    {formState.nombre || 'NOMBRE DEL EJERCICIO'}
                </h2>

                {/* Video Playback Mockup */}
                <div 
                    className="relative aspect-video bg-zinc-800 rounded-3xl overflow-hidden mb-8 group cursor-pointer border border-white/5"
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
                        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-500">
                             <Play className="h-10 w-10 mb-2 fill-zinc-800 text-zinc-700" />
                             <span className="text-[10px] uppercase font-bold tracking-widest text-[#FF7939]">Seleccionar Video</span>
                        </div>
                    )}
                    
                    {/* Fake Progress Bar Overlay like in the image */}
                    <div className="absolute bottom-4 left-4 right-4 h-1 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full w-1/3 bg-[#FF7939]"></div>
                    </div>
                    <div className="absolute bottom-2 left-4 text-[10px] text-white/70 font-mono">00:32 / 01:15</div>
                </div>

                {/* Stats Bar */}
                <div className="flex items-center justify-between bg-zinc-900/60 backdrop-blur-md rounded-full px-4 py-2 border border-white/5 mb-8 shadow-inner">
                    <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-zinc-500" />
                        <span className="text-[11px] font-bold text-zinc-100 uppercase">{formState.duracion_min || '0'} MIN</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Flame className="h-3.5 w-3.5 text-zinc-500" />
                        <span className="text-[11px] font-bold text-zinc-100 uppercase">~{formState.calorias || '0'} KCAL</span>
                    </div>
                    <Badge className="bg-[#FF7939] hover:bg-[#FF7939] text-[9px] px-2.5 py-0.5 font-black uppercase rounded-lg italic">
                        {formState.tipo_ejercicio || 'FUERZA'}
                    </Badge>
                </div>

                {/* Tabs */}
                <div className="flex justify-between border-b border-white/5 mb-6">
                    {(['series', 'musculos', 'tecnica'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-2 px-1 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${
                                activeTab === tab ? 'text-white' : 'text-zinc-600'
                            }`}
                        >
                            {tab === 'musculos' ? 'MúSCULOS' : tab === 'tecnica' ? 'TéCNICA' : tab}
                            {activeTab === tab && (
                                <motion.div 
                                    layoutId="activeTabMobile"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF7939] rounded-full"
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
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-4"
                            >
                                {seriesItems.length > 0 ? (
                                    seriesItems.map((item: string, idx: number) => {
                                        const parts = item.replace(/[()]/g, '').split('-')
                                        return (
                                            <div key={idx} className="bg-zinc-900/80 rounded-[1.5rem] p-4 flex items-center justify-between border border-white/5 shadow-lg group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-[#FF7939] text-white flex items-center justify-center font-black text-sm shadow-[0_0_15px_rgba(255,121,57,0.4)]">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex gap-4">
                                                        <div>
                                                            <div className="text-white font-black text-sm">{parts[2] || '1'}</div>
                                                            <div className="text-[9px] text-zinc-500 uppercase font-black">Series</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-white font-black text-sm">{parts[1] || '0'}</div>
                                                            <div className="text-[9px] text-zinc-500 uppercase font-black">Reps</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-white font-black text-sm">{parts[0] || '0'}</div>
                                                            <div className="text-[9px] text-zinc-500 uppercase font-black">Peso</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button 
                                                    className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center border border-white/10 group-hover:bg-zinc-700 transition-colors"
                                                >
                                                    <Edit2 className="h-3.5 w-3.5 text-zinc-400" />
                                                </button>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                                        <List className="h-8 w-8 text-zinc-700 mb-2" />
                                        <p className="text-[10px] text-zinc-600 uppercase font-black leading-relaxed">No hay series añadidas aún</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'musculos' && (
                            <motion.div
                                key="musculos"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="flex flex-wrap gap-2 pt-2"
                            >
                                {bodyParts.length > 0 ? (
                                    bodyParts.map((part: string, idx: number) => (
                                        <div key={idx} className="bg-zinc-900 px-4 py-2 rounded-2xl border border-white/10 text-zinc-100 text-[11px] font-bold uppercase tracking-wider">
                                            {part}
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center w-full h-40 text-center px-4">
                                        <Layout className="h-8 w-8 text-zinc-700 mb-2" />
                                        <p className="text-[10px] text-zinc-600 uppercase font-black">Agrega partes del cuerpo para verlas aquí</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'tecnica' && (
                            <motion.div
                                key="tecnica"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="pt-2 px-1"
                            >
                                <div className="bg-zinc-900/40 p-5 rounded-3xl border border-white/5">
                                    <h4 className="text-[10px] text-[#FF7939] uppercase font-black tracking-widest mb-4 flex items-center">
                                        <Info className="h-3 w-3 mr-1.5" /> Técnica de ejecución
                                    </h4>
                                    <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                                        {formState.descripcion || 'Escribe la descripción de la técnica en el formulario lateral para verla aquí...'}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Bottom Bar Mockup */}
            <div className="h-20 bg-black/80 backdrop-blur-xl border-t border-white/5 flex justify-around items-center px-6">
                 <div className="flex flex-col items-center gap-1 opacity-40">
                    <Search className="h-5 w-5 text-white" />
                    <span className="text-[8px] uppercase font-black tracking-tighter text-white">Buscar</span>
                 </div>
                 <div className="flex flex-col items-center gap-1">
                    <Flame className="h-5 w-5 text-[#FF7939] fill-[#FF7939]" />
                    <span className="text-[8px] uppercase font-black tracking-tighter text-[#FF7939]">Actividades</span>
                 </div>
                 <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center -mt-8 border border-white/5 shadow-2xl">
                     <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF7939] to-[#FF9B6A] flex items-center justify-center">
                        <Flame className="h-5 w-5 text-white fill-white" />
                     </div>
                 </div>
                 <div className="flex flex-col items-center gap-1 opacity-40">
                    <Clock className="h-5 w-5 text-white" />
                    <span className="text-[8px] uppercase font-black tracking-tighter text-white">Calendario</span>
                 </div>
                 <div className="flex flex-col items-center gap-1 opacity-40">
                    <Layout className="h-5 w-5 text-white" />
                    <span className="text-[8px] uppercase font-black tracking-tighter text-white">Perfil</span>
                 </div>
            </div>
        </div>
    )
}
