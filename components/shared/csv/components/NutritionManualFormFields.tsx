import React from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, X, Plus, Utensils, Zap, Flame, Clock, Play, BookOpen, ShoppingCart, ListOrdered } from 'lucide-react'
import { ManualFormState } from '../types'
import { VideoSectionInternal } from './VideoSectionInternal'
import { DictionaryAutocomplete } from '@/components/shared/ui/dictionary-autocomplete'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface NutritionManualFormFieldsProps {
    formState: ManualFormState
    onChange: (field: keyof ManualFormState, value: string) => void
    activeSection?: 'info' | 'receta' | 'ingredientes' | 'equipo' | 'musculos' | 'video'
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
                
                <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black text-zinc-600 uppercase ml-0.5 tracking-tighter">Minutos Preparación</Label>
                        <Input type="text" value={formState.minutos} onChange={(e) => onChange('minutos', e.target.value)} placeholder="Ej: 15" className="bg-zinc-950/40 border-white/10 h-10 text-sm font-bold text-white text-center rounded-lg" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black text-zinc-600 uppercase ml-0.5 tracking-tighter">Porciones</Label>
                        <Input type="text" value={formState.porciones} onChange={(e) => onChange('porciones', e.target.value)} placeholder="Ej: 1" className="bg-zinc-950/40 border-white/10 h-10 text-sm font-bold text-white text-center rounded-lg" />
                    </div>
                </div>

                {/* Macros Panel */}
                <div className="p-3.5 bg-white/[0.03] rounded-2xl border border-white/10 shadow-2xl mt-4">
                    <div className="flex items-center gap-2 mb-3">
                         <div className="w-1 h-3 bg-[#FF7939] rounded-full" />
                         <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic">Macronutrientes</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        <div className="text-center">
                            <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mb-1 block">Kcal</span>
                            <Input value={formState.calorias} onChange={(e) => onChange('calorias', e.target.value)} className="h-9 text-center text-sm bg-zinc-950 border-white/5 rounded-lg font-black text-white" />
                        </div>
                        <div className="text-center">
                            <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mb-1 block">Prot (g)</span>
                            <Input value={formState.proteinas} onChange={(e) => onChange('proteinas', e.target.value)} className="h-9 text-center text-sm bg-zinc-950 border-white/5 rounded-lg font-black text-red-500" />
                        </div>
                        <div className="text-center">
                            <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mb-1 block">Carb (g)</span>
                            <Input value={formState.carbohidratos} onChange={(e) => onChange('carbohidratos', e.target.value)} className="h-9 text-center text-sm bg-zinc-950 border-white/5 rounded-lg font-black text-yellow-500" />
                        </div>
                        <div className="text-center">
                            <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mb-1 block">Gras (g)</span>
                            <Input value={formState.grasas} onChange={(e) => onChange('grasas', e.target.value)} className="h-9 text-center text-sm bg-zinc-950 border-white/5 rounded-lg font-black text-blue-400" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (activeSection === 'receta') {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col gap-4">
                    <div className="space-y-1.5 pt-2">
                        <Label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest ml-1">Describir el Siguiente Paso</Label>
                        <Textarea 
                            id="recipe-step-input"
                            placeholder="Escribe el siguiente paso de la receta..." 
                            className="bg-zinc-950/40 border-white/10 min-h-[100px] text-xs font-medium text-white rounded-lg p-3 leading-relaxed focus:border-[#FF7939]/30 transition-all custom-scrollbar" 
                        />
                        <Button 
                            className="h-8 w-full bg-[#FF7939] hover:bg-[#FF6B35] text-white rounded-lg shadow-lg active:scale-95 text-[9px] font-black uppercase italic tracking-widest mt-2"
                            onClick={() => {
                                const stepInput = document.getElementById('recipe-step-input') as HTMLTextAreaElement
                                const nextStep = stepInput.value.trim()
                                if (nextStep) {
                                    const current = formState.receta || ''
                                    onChange('receta', current ? `${current};${nextStep}` : nextStep)
                                    stepInput.value = ''
                                }
                            }}
                        >
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            Agregar Paso
                        </Button>
                    </div>

                    <div className="space-y-3 max-h-[350px] overflow-y-auto no-scrollbar py-1">
                        {!formState.receta?.split(';').filter(Boolean).length && (
                            <div className="text-center py-12 opacity-20">
                                <BookOpen className="h-8 w-8 mx-auto mb-2" />
                                <p className="text-[10px] font-bold uppercase tracking-widest">No hay pasos definidos</p>
                            </div>
                        )}
                        {formState.receta?.split(';').filter(Boolean).map((step, idx) => (
                            <div key={idx} className="flex gap-4 bg-zinc-900/60 p-4 rounded-xl border border-white/5 shadow-inner group hover:border-[#FF7939]/30 transition-all relative">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FF7939]/20 text-[#FF7939] flex items-center justify-center text-[10px] font-black italic border border-[#FF7939]/30">
                                    {idx + 1}
                                </div>
                                <p className="text-[10px] font-bold text-zinc-300 leading-relaxed pt-1.5 pr-6 italic">{step}</p>
                                <button
                                    onClick={() => {
                                        const steps = formState.receta?.split(';').filter(Boolean) || []
                                        steps.splice(idx, 1)
                                        onChange('receta', steps.join(';'))
                                    }}
                                    className="absolute top-2 right-2 text-zinc-600 hover:text-red-500 transition-all p-1.5 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100"
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

    if (activeSection === 'ingredientes') {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col gap-3">
                    <div className="space-y-1.5">
                        <Label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest ml-1">Buscar o Crear Ingrediente</Label>
                        <DictionaryAutocomplete 
                            value={formState.temp_ingredient_name || ''} 
                            onChange={(val) => onChange('temp_ingredient_name' as any, val)} 
                            categoria="ingrediente" 
                            placeholder="Escribe un ingrediente (Ej: Pechuga de Pollo)..." 
                        />
                    </div>

                    <div className="flex gap-2 items-end pt-1">
                        <div className="flex-1">
                            <Label className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest ml-1 block mb-1">Cant.</Label>
                            <Input id="ing-amount" placeholder="200" className="h-9 text-xs bg-zinc-950 border-white/10 rounded-lg text-center font-bold text-white" />
                        </div>
                        <div className="flex-1">
                            <Label className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest ml-1 block mb-1">Unidad</Label>
                            <Select 
                                onValueChange={(val) => {
                                    const unitInput = document.getElementById('ing-unit') as HTMLInputElement
                                    if (unitInput) unitInput.value = val
                                }}
                            >
                                <SelectTrigger className="h-9 text-xs bg-zinc-950 border-white/10 rounded-lg font-bold text-white focus:ring-0 focus:ring-offset-0">
                                    <SelectValue placeholder="Unidad" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                    <SelectItem value="g">Gramos (g)</SelectItem>
                                    <SelectItem value="ml">Mililitros (ml)</SelectItem>
                                    <SelectItem value="oz">Onzas (oz)</SelectItem>
                                    <SelectItem value="porción">Porción</SelectItem>
                                    <SelectItem value="taza">Taza</SelectItem>
                                    <SelectItem value="cucharada">Cucharada</SelectItem>
                                    <SelectItem value="unidad">Unidad</SelectItem>
                                </SelectContent>
                            </Select>
                            <input type="hidden" id="ing-unit" defaultValue="g" />
                        </div>
                        <Button 
                            className="h-8 px-6 bg-[#FF7939] hover:bg-[#FF6B35] text-white rounded-lg shadow-lg active:scale-95 text-[9px] font-black uppercase italic tracking-widest"
                            onClick={() => {
                                const selectedVal = (formState.temp_ingredient_name || '').split(';').filter(Boolean).pop()?.trim()
                                const amount = (document.getElementById('ing-amount') as HTMLInputElement).value.trim()
                                const unit = (document.getElementById('ing-unit') as HTMLInputElement).value.trim()
                                if (selectedVal) {
                                    const combo = `${amount}${unit} ${selectedVal}`.trim()
                                    const current = formState.ingredientes || ''
                                    onChange('ingredientes', current ? `${current};${combo}` : combo)
                                    onChange('temp_ingredient_name' as any, '')
                                    ;(document.getElementById('ing-amount') as HTMLInputElement).value = ''
                                    ;(document.getElementById('ing-unit') as HTMLInputElement).value = ''
                                }
                            }}
                        >
                            <Plus className="h-3 w-3 mr-1.5" />
                            Añadir
                        </Button>
                    </div>
                </div>

                <div className="space-y-2 max-h-[280px] overflow-y-auto no-scrollbar py-1">
                    {!formState.ingredientes?.split(';').filter(Boolean).length && (
                        <div className="text-center py-8 opacity-20">
                            <ShoppingCart className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">No hay ingredientes</p>
                        </div>
                    )}
                    {formState.ingredientes?.split(';').filter(Boolean).map((ing, idx) => {
                        const match = ing.match(/^(\d+)([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)?\s+(.+)$/)
                        
                        return (
                            <div key={idx} className="flex items-center justify-between bg-zinc-900/40 px-4 py-2.5 rounded-xl border border-white/5 shadow-inner group hover:border-[#FF7939]/30 transition-all">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <ShoppingCart className="h-3.5 w-3.5 text-[#FF7939] shrink-0 opacity-80" />
                                    
                                    {match ? (
                                        <div className="flex items-baseline gap-1.5 min-w-0">
                                            <div className="flex items-baseline gap-1 bg-white/[0.03] px-2 py-0.5 rounded-md border border-white/5 shrink-0">
                                                <span className="text-[11px] font-black text-[#FF7939] italic leading-none">{match[1]}</span>
                                                {match[2] && (
                                                    <span className="text-[8px] font-bold text-[#FF7939]/70 uppercase tracking-tighter leading-none">
                                                        {match[2]}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] font-black text-zinc-300 italic uppercase truncate">
                                                {match[3]}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] font-black text-zinc-300 italic uppercase truncate">
                                            {ing}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        const items = formState.ingredientes?.split(';').filter(Boolean) || []
                                        items.splice(idx, 1)
                                        onChange('ingredientes', items.join(';'))
                                    }}
                                    className="text-zinc-600 hover:text-red-500 transition-all p-1.5 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    if (activeSection === 'video') {
        return (
            <div className="animate-in fade-in duration-300">
                <VideoSectionInternal 
                    formState={formState} 
                    onChange={onChange}
                />
            </div>
        )
    }

    return null
}
