import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Clock, Flame, Dumbbell, Edit2, Info, Layout, List, Search, Plus, X, ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [tempSet, setTempSet] = useState<{ p: string; r: string; s: string }>({ p: '', r: '', s: '' })

    const seriesArray = (formState.detalle_series || '').split(';').filter(Boolean).map(item => {
        const parts = item.replace(/[()]/g, '').split('-')
        return { p: parts[0] || '0', r: parts[1] || '0', s: parts[2] || '1' }
    })
    const bodyParts = (formState.partes_cuerpo || '').split(';').filter(Boolean)

    const saveSet = (index: number) => {
        const newArray = [...seriesArray]
        newArray[index] = tempSet
        const newValue = newArray.map(set => `(${set.p}-${set.r}-${set.s})`).join(';')
        onChange('detalle_series', newValue)
        setEditingIndex(null)
    }

    const startEditing = (index: number) => {
        setEditingIndex(index)
        setTempSet(seriesArray[index])
    }

    const addNewSet = () => {
        const newSet = { p: '0', r: '12', s: '3' }
        const newArray = [...seriesArray, newSet]
        const newValue = newArray.map(set => `(${set.p}-${set.r}-${set.s})`).join(';')
        onChange('detalle_series', newValue)
        setEditingIndex(newArray.length - 1)
        setTempSet(newSet)
    }

    const removeSet = (index: number) => {
        const newArray = seriesArray.filter((_, i) => i !== index)
        const newValue = newArray.map(set => `(${set.p}-${set.r}-${set.s})`).join(';')
        onChange('detalle_series', newValue)
        if (editingIndex === index) setEditingIndex(null)
    }

    return (
        <div className="relative w-full max-w-[420px] mx-auto bg-black rounded-[4.5rem] border-[12px] border-zinc-900 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.9)] aspect-[9/19.5] flex flex-col font-sans select-none ring-1 ring-white/10">
            {/* Notch Area */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-8 bg-zinc-900 rounded-b-[2rem] z-50 flex items-center justify-center">
                 <div className="w-14 h-1.5 bg-zinc-800 rounded-full" />
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-7 pt-16 pb-8 scrollbar-hide bg-black">
                
                {/* Header Context */}
                <div className="flex flex-col items-center mb-8">
                    <span className="text-[10px] font-black tracking-[0.4em] text-zinc-600 uppercase mb-2">CREAR EJERCICIO</span>
                    <input 
                        type="text"
                        value={formState.nombre}
                        onChange={(e) => onChange('nombre', e.target.value)}
                        placeholder="NOMBRE DEL EJERCICIO..."
                        className="w-full bg-transparent text-center text-white font-[900] text-[24px] leading-[1.1] tracking-tighter uppercase italic italic font-sans px-2 border-none focus:outline-none focus:ring-0 placeholder:text-zinc-800"
                    />
                </div>

                {/* Video Playback Section */}
                <div 
                    className="relative aspect-video bg-zinc-900 rounded-[2.5rem] overflow-hidden mb-8 group cursor-pointer border border-white/5 shadow-2xl"
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
                             <div className="w-16 h-16 rounded-full bg-[#FF7939] flex items-center justify-center shadow-[0_0_30px_rgba(255,121,57,0.4)] mb-3">
                                <Play className="h-8 w-8 fill-white text-white ml-1" />
                             </div>
                             <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500">SUBIR VIDEO</span>
                        </div>
                    )}
                    
                    {/* Fake Progress Bar */}
                    <div className="absolute bottom-6 left-6 right-6 h-1 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full w-2/5 bg-[#FF7939]" />
                    </div>
                </div>

                {/* Metrics Pill (THE PILL) */}
                <div className="grid grid-cols-[1fr,1fr,auto] gap-2 mb-8">
                    <div className="flex items-center gap-2 bg-zinc-900/40 rounded-[1.5rem] px-4 py-3 border border-white/10">
                        <Clock className="h-4 w-4 text-zinc-600" />
                        <input 
                            type="number"
                            value={formState.duracion_min}
                            onChange={(e) => onChange('duracion_min', e.target.value)}
                            className="w-full bg-transparent text-[13px] font-black text-white/90 uppercase border-none focus:outline-none p-0"
                            placeholder="12"
                        />
                        <span className="text-[10px] font-black text-zinc-600">MIN</span>
                    </div>
                    <div className="flex items-center gap-2 bg-zinc-900/40 rounded-[1.5rem] px-4 py-3 border border-white/10">
                        <Flame className="h-4 w-4 text-zinc-600" />
                        <input 
                            type="number"
                            value={formState.calorias}
                            onChange={(e) => onChange('calorias', e.target.value)}
                            className="w-full bg-transparent text-[13px] font-black text-white/90 uppercase border-none focus:outline-none p-0"
                            placeholder="70"
                        />
                        <span className="text-[10px] font-black text-zinc-600">KC</span>
                    </div>
                    <div className="bg-[#FF7939] rounded-[1.2rem] px-4 py-3 flex items-center justify-center shadow-[0_5px_15px_rgba(255,121,57,0.3)]">
                        <select 
                            value={formState.tipo_ejercicio || 'FUERZA'}
                            onChange={(e) => onChange('tipo_ejercicio', e.target.value)}
                            className="bg-transparent text-white text-[11px] font-black uppercase tracking-wider italic italic border-none focus:outline-none appearance-none cursor-pointer"
                        >
                            <option value="FUERZA" className="bg-zinc-900">FUERZA</option>
                            <option value="CARDIO" className="bg-zinc-900">CARDIO</option>
                            <option value="HIIT" className="bg-zinc-900">HIIT</option>
                            <option value="ESTIRAM" className="bg-zinc-900">RECOVERY</option>
                        </select>
                    </div>
                </div>

                {/* Inline Series Editor */}
                <div className="space-y-4 mb-8">
                    {seriesArray.map((set, idx) => (
                        <div key={idx} className={`bg-[#111] rounded-[2.5rem] p-5 border border-white/5 shadow-2xl transition-all ${editingIndex === idx ? 'ring-2 ring-[#FF7939]/50 scale-[1.02]' : ''}`}>
                            {editingIndex === idx ? (
                                <div className="flex items-center gap-4 animate-in fade-in zoom-in-95">
                                    <div className="w-12 h-12 rounded-full bg-[#FF7939] text-white flex items-center justify-center font-black text-lg shadow-[0_0_20px_rgba(255,121,57,0.4)]">
                                        {idx + 1}
                                    </div>
                                    <div className="flex gap-2 flex-1 items-center">
                                        <div className="flex-[0.8] text-center">
                                            <div className="text-white font-black text-lg leading-none mb-1">{tempSet.s}</div>
                                            <div className="text-[8px] text-zinc-500 uppercase font-black tracking-widest opacity-60">SERIES</div>
                                        </div>
                                        <div className="flex-[0.8] text-center">
                                            <div className="text-white font-black text-lg leading-none mb-1">{tempSet.r}</div>
                                            <div className="text-[8px] text-zinc-500 uppercase font-black tracking-widest opacity-60">REPS</div>
                                        </div>
                                        
                                        <div className="flex-1 relative">
                                            <select 
                                                value={tempSet.r}
                                                onChange={(e) => setTempSet({...tempSet, r: e.target.value})}
                                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-white font-black text-sm appearance-none focus:outline-none focus:border-[#FF7939]"
                                            >
                                                {[8,10,12,14,15,20].map(v => <option key={v} value={v} className="bg-zinc-900">{v}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 pointer-events-none" />
                                        </div>

                                        <div className="flex-[1.5] relative">
                                            <input 
                                                type="text" 
                                                value={tempSet.p} 
                                                onChange={(e) => setTempSet({...tempSet, p: e.target.value})}
                                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-white font-black text-sm pr-7 focus:outline-none focus:border-[#FF7939]"
                                                placeholder="35kg"
                                            />
                                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button 
                                            onClick={() => saveSet(idx)}
                                            className="w-9 h-9 rounded-xl bg-green-500 border border-green-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                                        >
                                            <Plus className="h-5 w-5" />
                                        </button>
                                        <button 
                                            onClick={() => removeSet(idx)}
                                            className="w-9 h-9 rounded-xl bg-red-500/20 text-red-500 border border-red-500/30 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between group">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 rounded-full bg-[#FF7939] text-white flex items-center justify-center font-[1000] text-lg shadow-[0_5px_15px_rgba(255,121,57,0.3)] border border-white/10">
                                            {idx + 1}
                                        </div>
                                        <div className="flex gap-8">
                                            <div className="text-center">
                                                <div className="text-white font-[1000] text-xl leading-none mb-1.5">{set.s}</div>
                                                <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest opacity-60">SERIES</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-white font-[1000] text-xl leading-none mb-1.5">{set.r}</div>
                                                <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest opacity-60">REPS</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-zinc-400 font-[1000] text-xl leading-none mb-1.5">{set.p}</div>
                                                <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest opacity-60">PESO</div>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => startEditing(idx)}
                                        className="w-11 h-11 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:border-[#FF7939]/30 hover:bg-[#FF7939]/5 transition-all"
                                    >
                                        <Edit2 className="h-4 w-4 text-[#FF7939]" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    <Button
                        variant="outline"
                        onClick={addNewSet}
                        className="w-full h-16 rounded-[2.5rem] border-dashed border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900 hover:border-[#FF7939]/30 text-zinc-500 font-black uppercase text-xs tracking-[0.2em] italic border-2 transition-all mt-4"
                    >
                        + AÑADIR SERIE
                    </Button>
                </div>

                {/* Muscle Groups & Technique Tabs - Simplified View */}
                <div className="grid grid-cols-2 gap-4 mb-20">
                     <div 
                        onClick={() => onTabChange('musculos')}
                        className={`p-6 rounded-[2.5rem] bg-zinc-900/30 border border-white/5 flex flex-col items-center gap-2 cursor-pointer transition-all ${activeTab === 'musculos' ? 'bg-[#FF7939]/5 border-[#FF7939]/30' : ''}`}
                     >
                        <Dumbbell className={`h-6 w-6 ${activeTab === 'musculos' ? 'text-[#FF7939]' : 'text-zinc-600'}`} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">MúSCULOS</span>
                     </div>
                     <div 
                        onClick={() => onTabChange('tecnica')}
                        className={`p-6 rounded-[2.5rem] bg-zinc-900/30 border border-white/5 flex flex-col items-center gap-2 cursor-pointer transition-all ${activeTab === 'tecnica' ? 'bg-[#FF7939]/5 border-[#FF7939]/30' : ''}`}
                     >
                        <Info className={`h-6 w-6 ${activeTab === 'tecnica' ? 'text-[#FF7939]' : 'text-zinc-600'}`} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">TéCNICA</span>
                     </div>
                </div>

            </div>

            {/* Bottom Nav Mockup */}
            <div className="h-24 bg-zinc-900/80 backdrop-blur-3xl border-t border-white/5 flex justify-around items-center px-8 pb-4">
                 <div className="w-14 h-1.5 bg-zinc-800 rounded-full absolute bottom-2 left-1/2 -translate-x-1/2" />
                 <Flame className="h-7 w-7 text-[#FF7939] fill-[#FF7939]" />
                 <div className="w-1.5 h-1.5 rounded-full bg-[#FF7939] shadow-[0_0_10px_rgba(255,121,57,1)]" />
                 <Layout className="h-6 w-6 text-zinc-700" />
                 <Search className="h-6 w-6 text-zinc-700" />
                 <Clock className="h-6 w-6 text-zinc-700" />
            </div>
        </div>
    )
}
