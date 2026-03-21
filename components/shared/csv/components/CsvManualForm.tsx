import React from 'react'
import { Trash2, Info, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ManualFormState } from '../types'
import { FitnessManualFormFields } from './FitnessManualFormFields'
import { NutritionManualFormFields } from './NutritionManualFormFields'
import { ExercisePreviewMobile } from './ExercisePreviewMobile'
import { exerciseTypeOptions } from '../constants'

interface CsvManualFormProps {
    productCategory: 'fitness' | 'nutricion'
    formState: ManualFormState
    onChange: (field: keyof ManualFormState, value: string) => void
    onSubmit: () => void
    onCancel: () => void
    isEditing: boolean
    onVideoSelect: () => void
    onRemoveVideo: () => void
}

export function CsvManualForm({
    productCategory,
    formState,
    onChange,
    onSubmit,
    onCancel,
    isEditing,
    onVideoSelect,
    onRemoveVideo
}: CsvManualFormProps) {
    const [previewTab, setPreviewTab] = React.useState<'series' | 'musculos' | 'tecnica'>('series')
    const isNutrition = productCategory === 'nutricion'

    return (
        <div className="mb-6 font-sans">
            {!isNutrition ? (
                <div className="flex flex-col xl:flex-row gap-12 items-start justify-center">
                    {/* iPhone Editor - The Star of the Show */}
                    <div className="w-full max-w-[420px] sticky top-6">
                        <ExercisePreviewMobile 
                            formState={formState} 
                            onChange={onChange} 
                            onVideoSelect={onVideoSelect}
                            onTabChange={setPreviewTab}
                            activeTab={previewTab}
                        />
                    </div>

                    {/* Contextual Support Area */}
                    <div className="flex-1 max-w-xl space-y-8 pt-8">
                        <div className="bg-zinc-900/40 p-8 rounded-[2.5rem] border border-zinc-800 shadow-2xl">
                             <div className="flex items-center gap-3 mb-8">
                                <div className="w-2.5 h-8 bg-[#FF7939] rounded-full shadow-[0_0_15px_rgba(255,121,57,0.5)]" />
                                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                                    Editor Avanzado
                                </h3>
                            </div>

                            <div className="space-y-8">
                                {previewTab === 'musculos' ? (
                                    <div className="animate-in fade-in slide-in-from-bottom-4">
                                        <FitnessManualFormFields 
                                            formState={formState} 
                                            onChange={onChange} 
                                            activeSection="musculos" 
                                        />
                                    </div>
                                ) : previewTab === 'tecnica' ? (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                        <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Instrucciones Detalladas</Label>
                                        <Textarea 
                                            value={formState.descripcion} 
                                            onChange={(e) => onChange('descripcion', e.target.value)} 
                                            className="bg-zinc-900/50 border-white/5 rounded-2xl min-h-[300px] text-zinc-300 leading-relaxed p-6 focus:border-[#FF7939]/30 transition-all shadow-inner"
                                            placeholder="Describe la técnica... (Se verá reflejado en tiempo real en el iPhone)"
                                        />
                                    </div>
                                ) : (
                                    <div className="p-12 text-center rounded-[2rem] border border-dashed border-zinc-800 opacity-40">
                                        <Info className="h-8 w-8 text-zinc-600 mx-auto mb-4" />
                                        <p className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500">
                                            Selecciona una sección en el iPhone para editar detalles avanzados
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Actions Moved Here for better flow */}
                            <div className="flex flex-col gap-4 mt-12 pt-8 border-t border-white/5">
                                <Button 
                                    onClick={onSubmit} 
                                    className="w-full bg-[#FF7939] hover:bg-[#FF6B35] text-white font-[1000] uppercase text-[14px] tracking-[0.1em] h-16 rounded-2xl shadow-[0_10px_40px_rgba(255,121,57,0.3)] transition-all hover:scale-[1.02] active:scale-98 italic"
                                >
                                    {isEditing ? 'Guardar Cambios' : 'Confirmar Ejercicio'}
                                </Button>
                                <Button variant="ghost" onClick={onCancel} className="text-zinc-500 hover:text-white uppercase font-black text-[10px] tracking-widest">
                                    {isEditing ? 'Cancelar cambios' : 'Descartar'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="max-w-4xl mx-auto">
                    <div className="bg-zinc-900/40 p-8 rounded-[2.5rem] border border-zinc-800 shadow-2xl">
                         <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-8 bg-green-500 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
                                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                                    {isEditing ? 'Configurar Alimento' : 'Nuevo Alimento'}
                                </h3>
                            </div>
                        </div>
                        <NutritionManualFormFields formState={formState} onChange={onChange} />
                        <div className="flex justify-end gap-4 mt-8 pt-8 border-t border-white/5">
                            <Button variant="ghost" onClick={onCancel} className="text-zinc-500 hover:text-white uppercase font-black text-[10px] tracking-widest">Cancelar</Button>
                            <Button onClick={onSubmit} className="bg-green-600 hover:bg-green-700 text-white font-black px-8 h-12 rounded-xl italic">
                                Guardar Alimento
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
