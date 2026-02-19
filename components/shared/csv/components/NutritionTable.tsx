import React from 'react'
import { Flame, Eye, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExerciseData } from '../types'
import { PreviewVideoModal } from '@/components/shared/ui/preview-video-modal'

interface NutritionTableProps {
    data: ExerciseData[]
    startIndex: number
    selectedRows: Set<number>
    toggleRow: (actualIndex: number) => void
    toggleSelectAll: () => void
    isAllSelected: boolean
    onEdit: (item: ExerciseData, index: number) => void
    activityId: number
    exerciseUsage?: Record<number, { activities: Array<{ id: number; name: string }> }>
    activityNamesMap?: Record<number, string>
    activityImagesMap?: Record<number, string | null>
    duplicateNames: string[]
    loadingExisting: boolean
    bunnyVideoTitles?: Record<string, string>
}

export function NutritionTable({
    data,
    startIndex,
    selectedRows,
    toggleRow,
    toggleSelectAll,
    isAllSelected,
    onEdit,
    activityId,
    exerciseUsage = {},
    activityNamesMap = {},
    activityImagesMap = {},
    duplicateNames,
    loadingExisting,
    bunnyVideoTitles = {}
}: NutritionTableProps) {
    const [previewVideo, setPreviewVideo] = React.useState<{ url: string; title: string; libraryId?: string | number } | null>(null)

    return (
        <>
            <table className="min-w-max w-full text-left border-collapse">
                <thead>
                    <tr>
                        <th className="px-2 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-8"></th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-16">
                            <button
                                onClick={toggleSelectAll}
                                className="p-1 hover:bg-gray-700/50 rounded transition-colors mx-auto"
                            >
                                <Flame className={`h-4 w-4 transition-colors ${isAllSelected ? 'text-[#FF7939]' : 'text-white'}`} />
                            </button>
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-12">Editar</th>
                        {activityId === 0 && (
                            <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-32">Estado</th>
                        )}
                        <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-48">Plato</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-48">Receta</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-20">Calorías</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-24">Proteínas</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-24">Carbohidratos</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-20">Grasas</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-32">Ingredientes</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-20">Porciones</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-20">Minutos</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-32">Video File Name</th>
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={14 + (activityId === 0 ? 1 : 0)} className="px-4 py-8 text-center text-gray-400">
                                {loadingExisting ? 'Cargando platos existentes...' : 'No hay platos para mostrar'}
                            </td>
                        </tr>
                    ) : (
                        data.map((item, pageIndex) => {
                            const actualIndex = startIndex + pageIndex
                            const exerciseName = item['Nombre'] || item.nombre || '-'
                            const isDuplicate = duplicateNames.includes(exerciseName)

                            return (
                                <tr key={actualIndex} className="border-b border-gray-700 hover:bg-zinc-900/40">
                                    <td className="px-2 py-3 text-center w-8">
                                        <span className="text-[#FF7939] text-[10px] font-medium">{actualIndex + 1}</span>
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                        <button
                                            onClick={() => toggleRow(actualIndex)}
                                            className="p-1 hover:bg-gray-700/50 rounded transition-colors"
                                        >
                                            <Flame className={`h-4 w-4 transition-colors ${selectedRows.has(actualIndex) ? 'text-[#FF7939]' : 'text-white'}`} />
                                        </button>
                                    </td>
                                    <td className="px-2 py-3 text-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onEdit(item, actualIndex)}
                                            className="text-blue-400 hover:bg-blue-400/10 p-1 h-5 w-5"
                                        >
                                            <Eye className="h-3 w-3" />
                                        </Button>
                                    </td>
                                    {activityId === 0 && (
                                        <td className="px-3 py-3 text-[10px] text-white">
                                            {(() => {
                                                const itemId = item.id && typeof item.id === 'number' ? item.id : null
                                                const usage = itemId ? exerciseUsage[itemId] : null
                                                const activityIdNew = item.activity_id_new || item.activity_id
                                                const activityStatus: Record<number, boolean> = {}

                                                if (activityIdNew) {
                                                    if (typeof activityIdNew === 'object' && !Array.isArray(activityIdNew)) {
                                                        Object.keys(activityIdNew).forEach(key => {
                                                            const idNum = parseInt(key, 10)
                                                            if (!isNaN(idNum)) activityStatus[idNum] = activityIdNew[key]?.activo !== false
                                                        })
                                                    } else if (typeof activityIdNew === 'number') {
                                                        activityStatus[activityIdNew] = true
                                                    }
                                                }

                                                const activities: Array<{ id: number; name: string; activo: boolean }> = []
                                                if (usage && usage.activities && usage.activities.length > 0) {
                                                    usage.activities.forEach((act: any) => {
                                                        activities.push({
                                                            id: act.id,
                                                            name: (act.name || `${act.id}`).replace(/^Actividad:\s*/i, ''),
                                                            activo: activityStatus[act.id] !== false
                                                        })
                                                    })
                                                } else {
                                                    Object.keys(activityStatus).forEach(key => {
                                                        const idNum = parseInt(key, 10)
                                                        activities.push({
                                                            id: idNum,
                                                            name: activityNamesMap[idNum] || `Actividad ${idNum}`,
                                                            activo: activityStatus[idNum] !== false
                                                        })
                                                    })
                                                }

                                                if (activities.length === 0) return '-'

                                                return (
                                                    <div className={`flex flex-wrap gap-2 ${activities.length > 3 ? 'max-h-20 overflow-y-auto' : ''}`}>
                                                        {activities.map((act, idx) => {
                                                            const imageUrl = activityImagesMap[act.id]
                                                            return (
                                                                <div key={`${act.id}-${idx}`} className="relative inline-flex items-center" title={act.name}>
                                                                    <div className="relative w-8 h-8 rounded-full overflow-hidden">
                                                                        {imageUrl ? (
                                                                            <img src={imageUrl} alt={act.name} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <div className="w-full h-full bg-gradient-to-br from-[#FF7939] to-[#E66829] flex items-center justify-center">
                                                                                <span className="text-xs font-bold text-white">{act.name.charAt(0).toUpperCase()}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div
                                                                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-900 ${act.activo ? 'bg-green-500' : 'bg-red-500'}`}
                                                                        title={act.activo ? 'Activo en esta actividad' : 'Inactivo en esta actividad'}
                                                                    />
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )
                                            })()}
                                        </td>
                                    )}
                                    <td className="px-3 py-3 text-xs font-medium whitespace-pre-wrap break-words">
                                        <span className={isDuplicate ? 'text-red-400' : 'text-white'}>{exerciseName}</span>
                                    </td>
                                    <td className="px-3 py-3 text-xs text-white">
                                        <div className="max-h-32 overflow-y-auto">
                                            {(() => {
                                                const receta = item['Receta'] || item.receta || item['Descripción'] || item.descripcion || '-'
                                                if (receta === '-') return <span>-</span>
                                                const pasos = receta.split(';').map((p: string) => p.trim()).filter(Boolean)
                                                return (
                                                    <div className="space-y-1 break-words">
                                                        {pasos.map((paso: string, idx: number) => <div key={idx} className="text-white/90">{paso}</div>)}
                                                    </div>
                                                )
                                            })()}
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 text-xs text-white">
                                        {(() => {
                                            const val = item['Calorías'] ?? item.calorias
                                            return val !== undefined && val !== null ? val : '-'
                                        })()}
                                    </td>
                                    <td className="px-3 py-3 text-xs text-white">
                                        {(() => {
                                            const val = item['Proteínas (g)'] ?? item['Proteínas'] ?? item.proteinas
                                            return val !== undefined && val !== null ? `${val}g` : '-'
                                        })()}
                                    </td>
                                    <td className="px-3 py-3 text-xs text-white">
                                        {(() => {
                                            const val = item['Carbohidratos (g)'] ?? item['Carbohidratos'] ?? item.carbohidratos
                                            return val !== undefined && val !== null ? `${val}g` : '-'
                                        })()}
                                    </td>
                                    <td className="px-3 py-3 text-xs text-white">
                                        {(() => {
                                            const val = item['Grasas (g)'] ?? item['Grasas'] ?? item.grasas
                                            return val !== undefined && val !== null ? `${val}g` : '-'
                                        })()}
                                    </td>
                                    <td className="px-3 py-3 text-xs text-white">
                                        <div className="max-h-32 overflow-y-auto overflow-x-hidden">
                                            {(() => {
                                                let ing = item['Ingredientes'] || item.ingredientes
                                                if (Array.isArray(ing)) ing = ing.join('; ')
                                                else if (typeof ing === 'object' && ing !== null) ing = JSON.stringify(ing)
                                                if (!ing || ing === '-') return '-'
                                                const items = ing.split(/[;,]/).map((i: string) => i.trim()).filter(Boolean)
                                                return (
                                                    <div className="space-y-0.5 break-all">
                                                        {items.map((it: string, idx: number) => (
                                                            <div key={idx} className="text-white/90 flex items-start">
                                                                <span className="text-[#FF7939] mr-1.5 flex-shrink-0">•</span>
                                                                <span className="break-words">{it}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )
                                            })()}
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 text-xs text-white">{item['Porciones'] ?? item.porciones ?? '-'}</td>
                                    <td className="px-3 py-3 text-xs text-white">
                                        {(() => {
                                            const min = item['Minutos'] ?? item.minutos
                                            return min !== undefined && min !== null ? `${min} min` : '-'
                                        })()}
                                    </td>
                                    <td className="px-3 py-3 text-xs text-white break-words">
                                        {(() => {
                                            const bunnyId = item.bunny_video_id || item.bunnyVideoId
                                            const rawUrl = item.video_url || item.video || ''
                                            const url = bunnyId || rawUrl || ''
                                            const libId = item.bunny_library_id || item.bunnyLibraryId

                                            console.log('--- NutritionTable Video Item ---', {
                                                nombre: item.nombre_plato,
                                                video_file_name: item.video_file_name,
                                                bunnyId,
                                                rawUrl,
                                                url,
                                                libId
                                            })

                                            let fileName = item.video_file_name || (bunnyId && bunnyVideoTitles ? bunnyVideoTitles[bunnyId] : null)

                                            // Extract from URL if still missing
                                            if (!fileName && rawUrl && rawUrl.includes('/')) {
                                                const parts = rawUrl.split('/')
                                                const lastPart = parts[parts.length - 1]
                                                fileName = lastPart.split('?')[0]
                                            }

                                            if (url) {
                                                const displayName = fileName || 'Video Asignado'
                                                return (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setPreviewVideo({
                                                                url,
                                                                title: displayName,
                                                                libraryId: item.bunny_library_id || item.bunnyLibraryId
                                                            })
                                                        }}
                                                        className="text-[#FF7939] hover:text-[#FF6B35] flex items-center gap-1.5 text-left group transition-colors"
                                                    >
                                                        <Play className="h-3.5 w-3.5 fill-[#FF7939] group-hover:fill-[#FF6B35]" />
                                                        <span className="truncate max-w-[150px] border-b border-transparent group-hover:border-[#FF6B35] font-medium">
                                                            {displayName}
                                                        </span>
                                                    </button>
                                                )
                                            }
                                            return <span className="text-zinc-500">-</span>
                                        })()}
                                    </td>
                                </tr>
                            )
                        })
                    )}
                </tbody>
            </table>

            <PreviewVideoModal
                isOpen={!!previewVideo}
                onClose={() => setPreviewVideo(null)}
                videoUrl={previewVideo?.url || ''}
                title={previewVideo?.title || ''}
                libraryId={previewVideo?.libraryId}
            />
        </>
    )
}
