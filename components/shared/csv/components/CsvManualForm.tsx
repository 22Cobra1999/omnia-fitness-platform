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
            <div className={`grid grid-cols-1 ${!isNutrition ? 'xl:grid-cols-[1fr,400px]' : ''} gap-12 items-start`}>
                
                {/* Editor Section */}
                <div className="flex flex-col gap-6">
                    <div className="bg-zinc-900/40 p-8 rounded-[2.5rem] border border-zinc-800 shadow-2xl">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-8 bg-[#FF7939] rounded-full shadow-[0_0_15px_rgba(255,121,57,0.5)]" />
                                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                                    {isEditing ? 'Configurar Ejercicio' : 'Crear nuevo Ejercicio'}
                                </h3>
                            </div>
                            <div className="flex items-center gap-2 bg-zinc-800/50 px-3 py-1.5 rounded-full border border-white/5">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#FF7939] animate-pulse" />
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{productCategory}</span>
                            </div>
                        </div>

                        {isNutrition ? (
                            <NutritionManualFormFields formState={formState} onChange={onChange} />
                        ) : (
                            <div className="space-y-8">
                                {/* Global Fields always visible */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-black/20 rounded-[2rem] border border-white/5">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Nombre</Label>
                                        <Input
                                            value={formState.nombre}
                                            onChange={(e) => onChange('nombre', e.target.value)}
                                            placeholder="Ej: Press de Banca"
                                            className="h-12 bg-zinc-900/50 border-white/5 rounded-2xl focus:border-[#FF7939]/50 transition-all font-bold text-white italic"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Video</Label>
                                        {(formState.video_url || formState.bunny_video_id) ? (
                                            <div className="flex items-center gap-3 bg-[#FF7939]/10 p-2 pl-4 rounded-2xl border border-[#FF7939]/20 h-12">
                                                <span className="flex-1 text-[11px] font-bold text-[#FF7939] truncate uppercase italic">{formState.video_file_name || 'Video Vinculado'}</span>
                                                <Button variant="ghost" size="sm" onClick={onRemoveVideo} className="h-8 w-8 p-0 text-zinc-500 hover:text-red-400">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button 
                                                variant="outline" 
                                                onClick={onVideoSelect} 
                                                className="w-full h-12 border-dashed border-zinc-700 bg-zinc-800/20 hover:bg-zinc-800 text-zinc-400 font-bold uppercase text-[10px] tracking-widest rounded-2xl"
                                            >
                                                + Vincular Video
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Contextual Editor Message */}
                                <div className="flex items-center gap-2 px-2">
                                    <Info className="h-4 w-4 text-[#FF7939]" />
                                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                                        Editando sección: <span className="text-[#FF7939] italic">{previewTab === 'series' ? 'P-R-S' : previewTab === 'musculos' ? 'Músculos y Equipo' : 'Técnica'}</span>
                                    </span>
                                </div>

                                {/* Conditional Fields based on Preview Tab */}
                                <div className="transition-all duration-300 min-h-[300px]">
                                    {previewTab === 'series' && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black text-zinc-500 uppercase ml-1">Duración (min)</Label>
                                                    <Input type="number" value={formState.duracion_min} onChange={(e) => onChange('duracion_min', e.target.value)} className="bg-zinc-900/50 border-white/5 rounded-xl h-11" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black text-zinc-500 uppercase ml-1">Calorías</Label>
                                                    <Input type="number" value={formState.calorias} onChange={(e) => onChange('calorias', e.target.value)} className="bg-zinc-900/50 border-white/5 rounded-xl h-11" />
                                                </div>
                                            </div>
                                            <FitnessManualFormFields 
                                                formState={formState} 
                                                onChange={onChange} 
                                                activeSection="series" 
                                            />
                                        </div>
                                    )}

                                    {previewTab === 'musculos' && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                            <div className="grid grid-cols-1 gap-6 p-6 bg-black/20 rounded-[2rem] border border-white/5">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black text-zinc-500 uppercase ml-1">Tipo de Ejercicio</Label>
                                                    <Select value={formState.tipo_ejercicio} onValueChange={(val) => onChange('tipo_ejercicio', val)}>
                                                        <SelectTrigger className="bg-zinc-900 border-none rounded-xl h-11"><SelectValue placeholder="Tipo" /></SelectTrigger>
                                                        <SelectContent>{exerciseTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <FitnessManualFormFields 
                                                formState={formState} 
                                                onChange={onChange} 
                                                activeSection="musculos" 
                                            />
                                        </div>
                                    )}

                                    {previewTab === 'tecnica' && (
                                        <div className="space-y-6 animate-in fade-in zoom-in-95">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-zinc-500 uppercase ml-1">Instrucciones de Técnica</Label>
                                                <Textarea 
                                                    value={formState.descripcion} 
                                                    onChange={(e) => onChange('descripcion', e.target.value)} 
                                                    className="bg-zinc-900/50 border-white/5 rounded-2xl min-h-[200px] text-zinc-300 leading-relaxed p-6"
                                                    placeholder="Describe cómo el cliente debe ejecutar este ejercicio..."
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Global Actions */}
                        <div className="flex justify-between items-center mt-12 pt-8 border-t border-white/5">
                            <Button variant="ghost" onClick={onCancel} className="text-zinc-500 hover:text-white uppercase font-black text-[10px] tracking-widest">
                                {isEditing ? 'Cancelar cambios' : 'Descartar'}
                            </Button>
                            <Button 
                                onClick={onSubmit} 
                                className="bg-[#FF7939] hover:bg-[#FF6B35] text-white font-[1000] uppercase text-[12px] tracking-[0.1em] px-10 h-14 rounded-2xl shadow-[0_10px_40px_rgba(255,121,57,0.3)] transition-all hover:scale-[1.05] active:scale-95 italic italic"
                            >
                                {isEditing ? 'Guardar Cambios' : 'Confirmar Ejercicio'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* iPhone Preview Section */}
                {!isNutrition && (
                    <div className="hidden xl:block sticky top-6">
                        <div className="text-center mb-6">
                            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-700">Vista Previa Interactiva</span>
                        </div>
                        <ExercisePreviewMobile 
                            formState={formState} 
                            onChange={onChange} 
                            onVideoSelect={onVideoSelect}
                            onTabChange={setPreviewTab}
                            activeTab={previewTab}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
