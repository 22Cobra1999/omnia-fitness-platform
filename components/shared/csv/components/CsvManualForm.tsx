import React from 'react'
import { Plus, Eye, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ManualFormState } from '../types'
import { FitnessManualFormFields } from './FitnessManualFormFields'
import { NutritionManualFormFields } from './NutritionManualFormFields'
import { ExercisePreviewMobile } from './ExercisePreviewMobile'

interface CsvManualFormProps {
    productCategory: 'fitness' | 'nutricion'
    formState: ManualFormState
    onChange: (field: keyof ManualFormState, value: string) => void
    onSubmit: () => void
    onCancel: () => void
    isEditing: boolean
    onVideoSelect: () => void
    onRemoveVideo: () => void
    showAssignedVideoPreview: boolean
}

export function CsvManualForm({
    productCategory,
    formState,
    onChange,
    onSubmit,
    onCancel,
    isEditing,
    onVideoSelect,
    onRemoveVideo,
    showAssignedVideoPreview
}: CsvManualFormProps) {

    const isNutrition = productCategory === 'nutricion'

    return (
        <div className="mb-6 font-sans">
            <div className={`grid grid-cols-1 ${!isNutrition ? 'xl:grid-cols-[1fr,380px]' : ''} gap-8`}>
                
                {/* Form Section */}
                <div className="bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800 shadow-xl self-start">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-2 h-6 bg-[#FF7939] rounded-full" />
                        <h3 className="text-xl font-black text-white uppercase italic tracking-wider">
                            {isEditing ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}
                        </h3>
                    </div>

                    {isNutrition ? (
                        <NutritionManualFormFields formState={formState} onChange={onChange} />
                    ) : (
                        <FitnessManualFormFields formState={formState} onChange={onChange} />
                    )}

                    {/* Video Section Simple */}
                    <div className="mt-8 pt-6 border-t border-zinc-800">
                        <div className="flex items-center justify-between mb-4">
                            <Label className="text-xs uppercase font-black text-zinc-500 tracking-widest">Video Demostrativo</Label>
                            {(formState.video_url || formState.bunny_video_id) && (
                                <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    Video Vinculado
                                </span>
                            )}
                        </div>

                        {(formState.video_url || formState.bunny_video_id) ? (
                            <div className="flex items-center gap-3 bg-black/40 p-3 rounded-2xl border border-zinc-800">
                                <div className="flex-1">
                                    <Input
                                        value={formState.video_file_name || ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('video_file_name', e.target.value)}
                                        className="h-8 bg-transparent border-none text-[11px] text-zinc-300 focus-visible:ring-0 p-0 font-medium"
                                        placeholder="Nombre del archivo..."
                                    />
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={onRemoveVideo} 
                                    className="h-8 w-8 p-0 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={onVideoSelect} 
                                className="w-full h-11 border-zinc-700 bg-zinc-800/30 hover:bg-zinc-800 text-zinc-300 font-bold uppercase text-[10px] tracking-widest transition-all rounded-xl"
                            >
                                Seleccionar Video
                            </Button>
                        )}
                    </div>

                    {/* Submission Controls */}
                    <div className="flex justify-end gap-3 mt-10">
                        {(isEditing || formState.nombre) && (
                            <Button 
                                variant="ghost" 
                                onClick={onCancel} 
                                className="text-zinc-500 hover:text-white uppercase font-black text-[10px] tracking-widest"
                            >
                                {isEditing ? 'Cancelar' : 'Limpiar'}
                            </Button>
                        )}
                        <Button 
                            onClick={onSubmit} 
                            className="bg-[#FF7939] hover:bg-[#FF6B35] text-white font-black uppercase text-[10px] tracking-widest px-8 h-11 rounded-xl shadow-[0_4px_15px_rgba(255,121,57,0.3)] transition-all hover:scale-[1.02]"
                        >
                            {isEditing ? 'Actualizar Cambios' : 'Agregar Ejercicio'}
                        </Button>
                    </div>
                </div>

                {/* iPhone Preview Section */}
                {!isNutrition && (
                    <div className="hidden xl:block sticky top-6">
                        <div className="text-center mb-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Vista Previa Mobile</span>
                        </div>
                        <ExercisePreviewMobile 
                            formState={formState} 
                            onChange={onChange} 
                            onVideoSelect={onVideoSelect}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
