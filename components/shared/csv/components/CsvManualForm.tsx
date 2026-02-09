import React from 'react'
import { Plus, Eye, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ManualFormState } from '../types'
import { UniversalVideoPlayer } from '@/components/shared/video/universal-video-player'
import { FitnessManualFormFields } from './FitnessManualFormFields'
import { NutritionManualFormFields } from './NutritionManualFormFields'

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
        <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 mb-6 font-sans">
            <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                {isEditing ? <Eye className="h-4 w-4 text-[#FF7939]" /> : <Plus className="h-4 w-4 text-[#FF7939]" />}
                {isEditing ? 'Editar Item' : 'Agregar Manualmente'}
            </h3>

            {isNutrition ? (
                <NutritionManualFormFields formState={formState} onChange={onChange} />
            ) : (
                <FitnessManualFormFields formState={formState} onChange={onChange} />
            )}

            {/* Video Section */}
            <div className="mt-4 pt-4 border-t border-zinc-800">
                <Label className="mb-2 block">Video Demostrativo</Label>

                {(formState.video_url || formState.bunny_video_id) ? (
                    <div className="flex items-center gap-3 bg-black/40 p-2 rounded border border-zinc-700">
                        <span className="text-xs text-green-400 truncate flex-1">
                            {formState.video_url || 'Video asignado'}
                        </span>
                        <Button variant="ghost" size="sm" onClick={onRemoveVideo} className="h-6 w-6 p-0 hover:text-red-400">
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                ) : (
                    <Button variant="outline" size="sm" onClick={onVideoSelect} className="w-full border-zinc-700 hover:bg-zinc-800">
                        Seleccionar Video
                    </Button>
                )}

                {showAssignedVideoPreview && (formState.video_url || formState.bunny_video_id) && (
                    <div className="mt-2 aspect-video bg-black rounded overflow-hidden">
                        <UniversalVideoPlayer
                            videoUrl={formState.video_url}
                            bunnyVideoId={formState.bunny_video_id}
                            thumbnailUrl={formState.video_thumbnail_url}
                            controls
                        />
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
                {(isEditing || formState.nombre) && (
                    <Button variant="ghost" onClick={onCancel} className="text-zinc-400 hover:text-white">
                        {isEditing ? 'Cancelar' : 'Limpiar'}
                    </Button>
                )}
                <Button onClick={onSubmit} className="bg-[#FF7939] hover:bg-[#FF6B35] text-white">
                    {isEditing ? 'Actualizar' : 'Agregar'}
                </Button>
            </div>
        </div>
    )
}
