import React from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, X, Plus, Utensils, Zap, Flame, Clock, Play } from 'lucide-react'
import { ManualFormState } from '../types'
import { VideoSectionInternal } from './VideoSectionInternal'
import { DictionaryAutocomplete } from '@/components/shared/ui/dictionary-autocomplete'

interface NutritionManualFormFieldsProps {
    formState: ManualFormState
    onChange: (field: keyof ManualFormState, value: string) => void
    activeSection?: 'info' | 'variables' | 'equipo' | 'musculos' | 'video'
    onVideoSelect?: () => void
}

export function NutritionManualFormFields({ formState, onChange, activeSection, onVideoSelect }: NutritionManualFormFieldsProps) {
    if (activeSection === 'info') {
        return (
            <div className="space-y-4 animate-in fade-in duration-300">
                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-zinc-600 uppercase ml-0.5 tracking-[0.1em]">Nombre del Plato</Label>
                    <Input value={formState.nombre} onChange={(e) => onChange('nombre', e.target.value)} placeholder="Ej: Ensalada César con Pollo" className="bg-zinc-950/40 border-white/10 h-10 text-sm font-bold text-white rounded-lg px-3" />
                </div>
                <div className="space-y-1.5">
                    <DictionaryAutocomplete label="Categoría" value={formState.tipo} onChange={(val) => onChange('tipo', val)} categoria="nutricion" placeholder="Ej: Proteína Animal, Fibra..." />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-zinc-600 uppercase ml-0.5 tracking-[0.1em]">Receta / Preparación</Label>
                    <Textarea value={formState.receta || ''} onChange={(e) => onChange('receta', e.target.value)} placeholder="Paso a paso de la preparación..." className="bg-zinc-950/40 border-white/10 min-h-[160px] text-xs font-medium text-zinc-400 rounded-lg p-3 leading-relaxed" />
                </div>
            </div>
        )
    }

    if (activeSection === 'variables') {
        return (
            <div className="space-y-4 animate-in fade-in duration-300">
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black text-zinc-600 uppercase ml-0.5 tracking-tighter">Minutos Preparación</Label>
                        <Input type="text" value={formState.minutos} onChange={(e) => onChange('minutos', e.target.value)} className="bg-zinc-950 border-white/10 h-10 text-sm font-bold text-white text-center rounded-lg" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black text-zinc-600 uppercase ml-0.5 tracking-tighter">Porciones</Label>
                        <Input type="text" value={formState.porciones} onChange={(e) => onChange('porciones', e.target.value)} className="bg-zinc-950 border-white/10 h-10 text-sm font-bold text-white text-center rounded-lg" />
                    </div>
                </div>

                {/* Macros Panel */}
                <div className="p-3.5 bg-white/[0.03] rounded-2xl border border-white/10 shadow-2xl">
                    <div className="flex items-center gap-2 mb-3">
                         <div className="w-1 h-3 bg-[#FF7939] rounded-full" />
                         <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest italic">Macronutrientes</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        <div className="text-center">
                            <span className="text-[6px] text-zinc-500 font-bold uppercase tracking-widest mb-1 block">Kcal</span>
                            <Input value={formState.calorias} onChange={(e) => onChange('calorias', e.target.value)} className="h-9 text-center text-sm bg-zinc-950 border-white/5 rounded-lg font-black text-white" />
                        </div>
                        <div className="text-center">
                            <span className="text-[6px] text-zinc-500 font-bold uppercase tracking-widest mb-1 block">Prot (g)</span>
                            <Input value={formState.proteinas} onChange={(e) => onChange('proteinas', e.target.value)} className="h-9 text-center text-sm bg-zinc-950 border-white/5 rounded-lg font-black text-red-500" />
                        </div>
                        <div className="text-center">
                            <span className="text-[6px] text-zinc-500 font-bold uppercase tracking-widest mb-1 block">Carb (g)</span>
                            <Input value={formState.carbohidratos} onChange={(e) => onChange('carbohidratos', e.target.value)} className="h-9 text-center text-sm bg-zinc-950 border-white/5 rounded-lg font-black text-yellow-500" />
                        </div>
                        <div className="text-center">
                            <span className="text-[6px] text-zinc-500 font-bold uppercase tracking-widest mb-1 block">Gras (g)</span>
                            <Input value={formState.grasas} onChange={(e) => onChange('grasas', e.target.value)} className="h-9 text-center text-sm bg-zinc-950 border-white/5 rounded-lg font-black text-blue-400" />
                        </div>
                    </div>
                </div>

                {/* Ingredients Panel */}
                <div className="p-3.5 bg-white/[0.03] rounded-2xl border border-white/10 shadow-2xl">
                    <div className="flex items-center gap-2 mb-3">
                         <div className="w-1 h-3 bg-green-500/50 rounded-full" />
                         <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest italic">Ingredientes</span>
                    </div>
                    
                    <div className="flex gap-2 items-end mb-3">
                        <div className="flex-1">
                            <Input id="ing-name" placeholder="Pollo" className="h-9 text-xs bg-zinc-950 border-white/5 rounded-lg" />
                        </div>
                        <div className="w-16">
                            <Input id="ing-amount" placeholder="200" className="h-9 text-xs bg-zinc-950 border-white/5 rounded-lg text-center" />
                        </div>
                        <div className="w-12">
                            <Input id="ing-unit" placeholder="g" className="h-9 text-xs bg-zinc-950 border-white/5 rounded-lg text-center" />
                        </div>
                        <Button 
                            className="h-9 w-9 p-0 bg-[#FF7939] hover:bg-[#FF6B35] text-white rounded-lg shadow-lg active:scale-95"
                            onClick={() => {
                                const name = (document.getElementById('ing-name') as HTMLInputElement).value.trim()
                                const amount = (document.getElementById('ing-amount') as HTMLInputElement).value.trim()
                                const unit = (document.getElementById('ing-unit') as HTMLInputElement).value.trim()
                                if (name) {
                                    const combo = `${amount}${unit} ${name}`.trim()
                                    const current = formState.ingredientes || ''
                                    onChange('ingredientes', current ? `${current};${combo}` : combo)
                                    ;(document.getElementById('ing-name') as HTMLInputElement).value = ''
                                    ;(document.getElementById('ing-amount') as HTMLInputElement).value = ''
                                    ;(document.getElementById('ing-unit') as HTMLInputElement).value = ''
                                }
                            }}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="space-y-1.5 max-h-[120px] overflow-y-auto no-scrollbar">
                        {formState.ingredientes?.split(';').filter(Boolean).map((ing, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-zinc-900/40 px-3 py-2 rounded-xl border border-white/5 shadow-inner">
                                <span className="text-[10px] font-black text-zinc-300 italic uppercase truncate flex-1">{ing}</span>
                                <button
                                    onClick={() => {
                                        const items = formState.ingredientes?.split(';').filter(Boolean) || []
                                        items.splice(idx, 1)
                                        onChange('ingredientes', items.join(';'))
                                    }}
                                    className="text-zinc-600 hover:text-red-500 transition-all p-1"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

                {activeSection === 'video' && (
                    <VideoSectionInternal 
                        formState={formState} 
                        onChange={onChange}
                    />
                )}

    return null
}
