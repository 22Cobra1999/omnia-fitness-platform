import React from 'react'
import { 
    Plus, X, Shield, Heart, Zap, Activity, Play, Image as ImageIcon, Video, 
    Clock, Weight, Timer, ChevronLeft, Loader2, CheckCircle 
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ManualFormState } from '../types'
import { exerciseTypeOptions, intensityLevels } from '../constants'
import { DictionaryAutocomplete } from '@/components/shared/ui/dictionary-autocomplete'
import { VideoSectionInternal } from './VideoSectionInternal'

interface FitnessManualFormFieldsProps {
    formState: ManualFormState
    onChange: (field: keyof ManualFormState, value: any) => void
    activeSection?: 'info' | 'variables' | 'equipo' | 'musculos' | 'video'
    onVideoSelect?: () => void
}

export function FitnessManualFormFields({ formState, onChange, activeSection, onVideoSelect }: FitnessManualFormFieldsProps) {
    const [showWeight, setShowWeight] = React.useState(true)
    const [showSeconds, setShowSeconds] = React.useState(true)

    const selectedMuscles = (formState.partes_cuerpo || '').split(';').filter(Boolean)

    const renderTypeInfo = () => {
        const type = formState.tipo_ejercicio || 'FUERZA'
        const descriptions: Record<string, { icon: any, text: string, color: string }> = {
            'FUERZA': { icon: Shield, text: 'CARGA Y POTENCIA MUSCULAR.', color: '#FF7939' },
            'CARDIO': { icon: Heart, text: 'RESISTENCIA Y CAPACIDAD AERÓBICA.', color: '#ef4444' },
            'HIIT': { icon: Zap, text: 'ALTA INTENSIDAD EXPLOSIVA Y QUEMA RÁPIDA.', color: '#eab308' },
            'ESTIRAM': { icon: Activity, text: 'FLEXIBILIDAD, MOVILIDAD Y RECUPERACIÓN.', color: '#22c55e' }
        }
        const info = descriptions[type] || descriptions['FUERZA']
        const Icon = info.icon

        return (
            <div key={type} className="flex items-center gap-2.5 p-2 bg-white/[0.04] rounded-lg border border-white/10 mt-1 mb-0.5 animate-in fade-in zoom-in-95 duration-500 shadow-inner">
                <div className="p-1 rounded bg-zinc-900 border border-white/5 shadow-sm">
                    <Icon className="h-3 w-3" style={{ color: info.color }} />
                </div>
                <p className="text-[8px] font-black uppercase text-zinc-500 tracking-widest leading-none italic">{info.text}</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-3 animate-in fade-in duration-500">

            {/* Section Content */}
            <div className="flex-1 min-h-0">
                {activeSection === 'info' && (
                    <div className="space-y-3 animate-in fade-in duration-300">
                        <div className="space-y-1">
                            <Label className="text-[9px] font-black text-zinc-600 uppercase ml-0.5 tracking-[0.1em]">Nombre del Ejercicio</Label>
                            <Input value={formState.nombre} onChange={(e) => onChange('nombre', e.target.value)} placeholder="Ej: Press de Banca Plano" className="bg-zinc-950/40 border-white/10 h-9 text-sm font-bold text-white rounded-lg px-3" />
                        </div>
                        <div className="space-y-1 pt-1">
                             <Label className="text-[9px] font-black text-zinc-600 uppercase ml-0.5 tracking-[0.1em]">Detalle Técnico</Label>
                             <Textarea value={formState.descripcion || ''} onChange={(e) => onChange('descripcion', e.target.value)} placeholder="Ejecución técnica..." className="bg-zinc-950/40 border-white/10 min-h-[160px] text-xs font-medium text-zinc-400 rounded-lg p-3 leading-relaxed" />
                        </div>
                    </div>
                )}

                {activeSection === 'variables' && (
                    <div className="space-y-3 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between p-2.5 bg-white/[0.03] rounded-xl border border-white/10 shadow-2xl group transition-all hover:bg-white/[0.05]">
                             <div className="flex items-center gap-2">
                                 <div className="w-1 h-3 bg-[#FF7939] rounded-full group-hover:scale-y-125 transition-transform" />
                                 <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest italic group-hover:text-white transition-colors">Variables de Series</span>
                             </div>
                             <div className="flex gap-1.5">
                                <button
                                    onClick={() => setShowWeight(!showWeight)}
                                    className={`p-1 rounded-lg border transition-all ${showWeight ? 'bg-[#FF7939]/20 border-[#FF7939]/50 text-[#FF7939] shadow-lg shadow-[#FF7939]/20' : 'bg-transparent border-white/10 text-zinc-600 hover:text-blue-400'}`}
                                >
                                    <Weight className={`h-2.5 w-2.5 ${showWeight ? 'scale-110 drop-shadow-[0_0_5px_rgba(255,121,57,0.3)]' : 'scale-100 grayscale'}`} />
                                </button>
                                <button
                                    onClick={() => setShowSeconds(!showSeconds)}
                                    className={`p-1 rounded-lg border transition-all ${showSeconds ? 'bg-blue-400/20 border-blue-400/50 text-blue-400 shadow-lg shadow-blue-400/20' : 'bg-transparent border-white/10 text-zinc-600 hover:text-[#FF7939]'}`}
                                >
                                    <Timer className={`h-2.5 w-2.5 ${showSeconds ? 'scale-110 drop-shadow-[0_0_5px_rgba(96,165,250,0.3)]' : 'scale-100 grayscale'}`} />
                                </button>
                             </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            <div className="space-y-1 text-center">
                                <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest italic block">Series</span>
                                <Input type="text" value={formState.peso.split('-')[2] || ''} onChange={(e) => {
                                    const parts = formState.peso.split('-')
                                    parts[2] = e.target.value
                                    onChange('peso', parts.join('-'))
                                }} className="bg-zinc-950 border-white/5 h-8 text-center font-black text-white text-xs rounded-lg" />
                            </div>
                            <div className="space-y-1 text-center">
                                <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest italic block">Reps</span>
                                <Input type="text" value={formState.peso.split('-')[1] || ''} onChange={(e) => {
                                    const parts = formState.peso.split('-')
                                    parts[1] = e.target.value
                                    onChange('peso', parts.join('-'))
                                }} className="bg-zinc-950 border-white/5 h-8 text-center font-black text-white text-xs rounded-lg" />
                            </div>
                            
                            {showWeight && (
                                <div className="space-y-1 text-center animate-in slide-in-from-right-2">
                                    <span className="text-[8px] text-[#FF7939] font-black uppercase tracking-widest italic block">Peso</span>
                                    <Input type="text" value={formState.peso.split('-')[0] || ''} onChange={(e) => {
                                        const parts = formState.peso.split('-')
                                        parts[0] = e.target.value
                                        onChange('peso', parts.join('-'))
                                    }} className="bg-zinc-950 border-[#FF7939]/30 h-8 text-center font-black text-[#FF7939] text-xs rounded-lg focus:border-[#FF7939] transition-all" />
                                </div>
                            )}

                            {showSeconds && (
                                <div className="space-y-1 text-center animate-in slide-in-from-right-2">
                                    <span className="text-[8px] text-blue-400 font-black uppercase tracking-widest italic block">Segs</span>
                                    <Input type="text" value={formState.segundos || ''} onChange={(e) => onChange('segundos', e.target.value)} className="bg-zinc-950 border-blue-400/30 h-8 text-center font-black text-blue-400 text-xs rounded-lg focus:border-blue-400 transition-all" />
                                </div>
                            )}
                        </div>

                        <Button 
                            onClick={() => {
                                const pesoParts = formState.peso.split('-')
                                const p = pesoParts[0] || '0'
                                const r = pesoParts[1] || '0'
                                const s = pesoParts[2] || '1'
                                const t = formState.segundos || '0'
                                const newSerie = `(${p}-${r}-${s}-${t})`
                                const currentSeries = (formState.detalle_series || '').split(';').filter(Boolean)
                                onChange('detalle_series', [...currentSeries, newSerie].join(';'))
                            }}
                            className="w-full bg-[#FF7939] hover:bg-[#FF6B35] text-white font-black uppercase text-[9px] tracking-tighter h-8 rounded-lg shadow-lg transition-all active:scale-95 italic flex items-center justify-center gap-2 group"
                        >
                            <Plus className="h-3 w-3 group-hover:rotate-90 transition-transform" />
                            Agregar Serie
                        </Button>

                        <div className="grid grid-cols-2 gap-2.5 pt-1">
                            <div className="space-y-0.5">
                                <Label className="text-[9px] font-black text-zinc-600 uppercase ml-0.5 tracking-tighter">Min Totales</Label>
                                <Input value={formState.duracion_min} onChange={(e) => onChange('duracion_min', e.target.value)} placeholder="0" className="bg-zinc-950 border-white/10 h-8 text-xs font-bold text-white text-center rounded-lg" />
                            </div>
                            <div className="space-y-0.5">
                                <Label className="text-[9px] font-black text-zinc-600 uppercase ml-0.5 tracking-tighter">Kcal Est.</Label>
                                <Input value={formState.calorias} onChange={(e) => onChange('calorias', e.target.value)} placeholder="0" className="bg-zinc-950 border-white/10 h-8 text-xs font-bold text-white text-center rounded-lg" />
                            </div>
                        </div>

                        {/* List of current series */}
                        <div className="space-y-1.5 max-h-[140px] overflow-y-auto no-scrollbar pt-2 border-t border-white/5">
                             {formState.detalle_series?.split(';').filter(Boolean).map((serie, idx) => (
                                 <div key={idx} className="flex items-center justify-between bg-zinc-900/40 px-3 py-1.5 rounded-lg border border-white/5 shadow-inner group">
                                     <div className="flex items-center gap-3">
                                         <span className="text-[8px] font-black text-zinc-600">#{idx + 1}</span>
                                         <span className="text-[9px] font-black text-zinc-300 italic uppercase">{serie}</span>
                                     </div>
                                     <button onClick={() => {
                                         const items = formState.detalle_series.split(';').filter(Boolean);
                                         items.splice(idx, 1);
                                         onChange('detalle_series', items.join(';'));
                                     }} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-500 transition-all p-1">
                                         <X className="h-2.5 w-2.5" />
                                     </button>
                                 </div>
                             ))}
                        </div>
                    </div>
                )}

                {activeSection === 'video' && (
                    <VideoSectionInternal 
                        formState={formState} 
                        onChange={onChange}
                    />
                )}

                {activeSection === 'equipo' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="space-y-1">
                            <Label className="text-[9px] font-black text-zinc-600 uppercase ml-0.5 tracking-widest">Intensidad Sugerida</Label>
                            <Select value={formState.nivel_intensidad} onValueChange={(val) => onChange('nivel_intensidad', val)}>
                                <SelectTrigger className="bg-zinc-950/40 border-white/10 h-9 text-xs font-bold italic rounded-lg"><SelectValue placeholder="Nivel" /></SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800">{intensityLevels.map(lvl => <SelectItem key={lvl} value={lvl} className="text-xs font-bold uppercase">{lvl}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="pt-1">
                             <DictionaryAutocomplete label="Equipo Necesario" value={formState.equipo_necesario} onChange={(val) => onChange('equipo_necesario', val)} categoria="equipo_fitness" placeholder="Cargas, bandas..." />
                        </div>
                    </div>
                )}

                {activeSection === 'musculos' && (
                    <div className="space-y-4 animate-in fade-in duration-300 pt-1">
                        <DictionaryAutocomplete label="Músculos Focus" value={formState.partes_cuerpo} onChange={(val) => onChange('partes_cuerpo', val)} categoria="parte_cuerpo" placeholder="Selecciona..." />
                    </div>
                )}
            </div>
        </div>
    )
}
