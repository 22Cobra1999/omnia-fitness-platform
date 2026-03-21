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
            <div key={type} className="flex items-center gap-2.5 p-2 bg-white/[0.04] rounded-lg border border-white/10 mt-2 mb-1 animate-in fade-in zoom-in-95 duration-500 shadow-inner">
                <div className="p-1 rounded bg-zinc-900 border border-white/5 shadow-sm">
                    <Icon className="h-3 w-3" style={{ color: info.color }} />
                </div>
                <p className="text-[9px] font-[1000] uppercase text-zinc-400 tracking-widest leading-none italic">{info.text}</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4 animate-in fade-in duration-500">
            {/* Horizontal Muscle Bubbles - ALWAYS VISIBLE AT TOP */}
            <div className="flex items-center gap-2 p-2 bg-zinc-950/40 rounded-xl border border-white/5 backdrop-blur-sm overflow-hidden min-h-[46px] shadow-2xl">
                <div className="flex-shrink-0 p-1.5 bg-[#FF7939]/10 rounded-lg border border-[#FF7939]/30 shadow-[0_0_15px_rgba(255,121,57,0.15)] ml-1">
                    <Activity className="h-3 w-3 text-[#FF7939]" />
                </div>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth px-1 flex-1 py-1">
                    {selectedMuscles.length > 0 ? (
                        selectedMuscles.map((muscle, idx) => (
                            <div key={idx} className="shrink-0 px-3 py-1 bg-zinc-800/80 rounded-full border border-white/10 shadow-lg flex items-center gap-1 group transition-all hover:border-[#FF7939]/30">
                                <span className="text-[7px] font-black text-zinc-100 uppercase italic tracking-wider whitespace-nowrap">{muscle}</span>
                                <button
                                    onClick={() => {
                                        const newParts = selectedMuscles.filter((_, i) => i !== idx)
                                        onChange('partes_cuerpo', newParts.join(';'))
                                    }}
                                    className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all ml-1 p-0.5"
                                >
                                    <X className="h-2 w-2" />
                                </button>
                            </div>
                        ))
                    ) : (
                        <span className="text-[8px] font-black text-zinc-800 uppercase tracking-widest italic ml-1">Sin músculos seleccionados...</span>
                    )}
                </div>
            </div>

            {/* Section Content */}
            <div className="flex-1 min-h-0">
                {activeSection === 'info' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-zinc-600 uppercase ml-0.5 tracking-[0.1em]">Nombre del Ejercicio</Label>
                            <Input value={formState.nombre} onChange={(e) => onChange('nombre', e.target.value)} placeholder="Ej: Press de Banca Plano" className="bg-zinc-950/40 border-white/10 h-10 text-sm font-bold text-white rounded-lg px-3" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-zinc-600 uppercase ml-0.5 tracking-[0.1em]">Tipo de Ejercicio</Label>
                            <Select value={formState.tipo_ejercicio} onValueChange={(val) => onChange('tipo_ejercicio', val)}>
                                <SelectTrigger className="bg-zinc-950/40 border-white/10 rounded-lg h-10 text-xs font-bold italic"><SelectValue placeholder="Tipo de ejercicio" /></SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800">
                                    {exerciseTypeOptions.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value} className="text-xs font-bold uppercase italic">{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {renderTypeInfo()}
                        </div>
                        <div className="space-y-1.5 pt-2">
                             <Label className="text-[10px] font-black text-zinc-600 uppercase ml-0.5 tracking-[0.1em]">Detalle Técnico / Descripción</Label>
                             <Textarea value={formState.descripcion || ''} onChange={(e) => onChange('descripcion', e.target.value)} placeholder="Agrega detalles técnicos sobre la ejecución..." className="bg-zinc-950/40 border-white/10 min-h-[160px] text-xs font-medium text-zinc-400 rounded-lg p-3 leading-relaxed" />
                        </div>
                    </div>
                )}

                {activeSection === 'variables' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between p-3.5 bg-white/[0.03] rounded-2xl border border-white/10 shadow-2xl mb-4 group transition-all hover:bg-white/[0.05]">
                             <div className="flex items-center gap-2">
                                 <div className="w-1 h-3 bg-[#FF7939] rounded-full group-hover:scale-y-125 transition-transform" />
                                 <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest italic group-hover:text-white transition-colors">Variables de Series</span>
                             </div>
                             <div className="flex gap-2">
                                <button
                                    onClick={() => setShowWeight(!showWeight)}
                                    className={`p-1.5 rounded-lg border transition-all ${showWeight ? 'bg-[#FF7939]/20 border-[#FF7939]/50 text-[#FF7939] shadow-lg shadow-[#FF7939]/20' : 'bg-transparent border-white/10 text-zinc-600 hover:text-blue-400'}`}
                                    title="Activar/Desactivar Peso"
                                >
                                    <Weight className={`h-3 w-3 ${showWeight ? 'scale-110 drop-shadow-[0_0_5px_rgba(255,121,57,0.3)]' : 'scale-100 grayscale'}`} />
                                </button>
                                <button
                                    onClick={() => setShowSeconds(!showSeconds)}
                                    className={`p-1.5 rounded-lg border transition-all ${showSeconds ? 'bg-blue-400/20 border-blue-400/50 text-blue-400 shadow-lg shadow-blue-400/20' : 'bg-transparent border-white/10 text-zinc-600 hover:text-[#FF7939]'}`}
                                    title="Activar/Desactivar Segundos"
                                >
                                    <Timer className={`h-3 w-3 ${showSeconds ? 'scale-110 drop-shadow-[0_0_5px_rgba(96,165,250,0.3)]' : 'scale-100 grayscale'}`} />
                                </button>
                             </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                            <div className="space-y-1 text-center">
                                <span className="text-[6px] text-zinc-500 font-bold uppercase tracking-widest italic block mb-1">Series</span>
                                <Input type="text" value={formState.peso.split('-')[2] || ''} onChange={(e) => {
                                    const parts = formState.peso.split('-')
                                    parts[2] = e.target.value
                                    onChange('peso', parts.join('-'))
                                }} className="bg-zinc-950 border-white/5 h-10 text-center font-black text-white text-sm rounded-lg" />
                            </div>
                            <div className="space-y-1 text-center">
                                <span className="text-[6px] text-zinc-500 font-bold uppercase tracking-widest italic block mb-1">Reps</span>
                                <Input type="text" value={formState.peso.split('-')[1] || ''} onChange={(e) => {
                                    const parts = formState.peso.split('-')
                                    parts[1] = e.target.value
                                    onChange('peso', parts.join('-'))
                                }} className="bg-zinc-950 border-white/5 h-10 text-center font-black text-white text-sm rounded-lg" />
                            </div>
                            
                            {showWeight && (
                                <div className="space-y-1 text-center animate-in slide-in-from-right-2">
                                    <span className="text-[6px] text-[#FF7939] font-black uppercase tracking-widest italic block mb-1">Peso (kg)</span>
                                    <Input type="text" value={formState.peso.split('-')[0] || ''} onChange={(e) => {
                                        const parts = formState.peso.split('-')
                                        parts[0] = e.target.value
                                        onChange('peso', parts.join('-'))
                                    }} className="bg-zinc-950 border-[#FF7939]/30 h-10 text-center font-black text-[#FF7939] text-sm rounded-lg focus:border-[#FF7939] transition-all shadow-[inset_0_0_10px_rgba(255,121,57,0.05)]" />
                                </div>
                            )}

                            {showSeconds && (
                                <div className="space-y-1 text-center animate-in slide-in-from-right-2">
                                    <span className="text-[6px] text-blue-400 font-black uppercase tracking-widest italic block mb-1">Segundos</span>
                                    <Input type="text" value={formState.segundos || ''} onChange={(e) => onChange('segundos', e.target.value)} className="bg-zinc-950 border-blue-400/30 h-10 text-center font-black text-blue-400 text-sm rounded-lg focus:border-blue-400 transition-all shadow-[inset_0_0_10px_rgba(96,165,250,0.05)]" />
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 pt-4">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black text-zinc-600 uppercase ml-0.5 tracking-tighter">Minutos Totales</Label>
                                <Input value={formState.duracion_min} onChange={(e) => onChange('duracion_min', e.target.value)} placeholder="0" className="bg-zinc-950 border-white/10 h-10 text-sm font-bold text-white text-center rounded-lg" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black text-zinc-600 uppercase ml-0.5 tracking-tighter">Kcalories Estimadas</Label>
                                <Input value={formState.calorias} onChange={(e) => onChange('calorias', e.target.value)} placeholder="0" className="bg-zinc-950 border-white/10 h-10 text-sm font-bold text-white text-center rounded-lg" />
                            </div>
                        </div>

                        {/* List of current series if present */}
                        <div className="space-y-2 max-h-[160px] overflow-y-auto no-scrollbar pt-2 border-t border-white/5">
                             {formState.detalle_series?.split(';').filter(Boolean).map((serie, idx) => (
                                 <div key={idx} className="flex items-center justify-between bg-zinc-900/40 px-3 py-2 rounded-xl border border-white/5 shadow-inner group">
                                     <div className="flex items-center gap-3">
                                         <span className="text-[8px] font-black text-zinc-600">#{idx + 1}</span>
                                         <span className="text-[10px] font-black text-zinc-300 italic uppercase">{serie}</span>
                                     </div>
                                     <button onClick={() => {
                                         const items = formState.detalle_series.split(';').filter(Boolean);
                                         items.splice(idx, 1);
                                         onChange('detalle_series', items.join(';'));
                                     }} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-500 transition-all p-1">
                                         <X className="h-3 w-3" />
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
                    <div className="space-y-5 animate-in fade-in duration-300">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-zinc-600 uppercase ml-0.5 tracking-widest">Intensidad Sugerida</Label>
                            <Select value={formState.nivel_intensidad} onValueChange={(val) => onChange('nivel_intensidad', val)}>
                                <SelectTrigger className="bg-zinc-950/40 border-white/10 h-10 text-xs font-bold italic rounded-lg"><SelectValue placeholder="Nivel de intensidad" /></SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800">{intensityLevels.map(lvl => <SelectItem key={lvl} value={lvl} className="text-xs font-bold uppercase">{lvl}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="pt-2">
                             <DictionaryAutocomplete label="Equipo Necesario" value={formState.equipo_necesario} onChange={(val) => onChange('equipo_necesario', val)} categoria="equipo_fitness" placeholder="Busca equipo en el diccionario..." />
                        </div>
                    </div>
                )}

                {activeSection === 'musculos' && (
                    <div className="space-y-5 animate-in fade-in duration-300 pt-2">
                        <DictionaryAutocomplete label="Músculos Focus" value={formState.partes_cuerpo} onChange={(val) => onChange('partes_cuerpo', val)} categoria="parte_cuerpo" placeholder="Selecciona grupos musculares..." />
                    </div>
                )}
            </div>
        </div>
    )
}

