import React from 'react'
import { Flame, Eye, Power, Play, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExerciseData } from '../types'
import { PreviewVideoModal } from '@/components/shared/ui/preview-video-modal'
 
const StepCircle = ({ number }: { number: number }) => (
    <div className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#FF7939]/15 border border-[#FF7939]/30 mr-1.5 shrink-0 shadow-sm shadow-[#FF7939]/10">
        <span className="text-[#FF7939] text-[8px] font-black leading-none">{number}</span>
    </div>
)

const normalizeExerciseType = (type: string): string => {
    const t = (type || '').toString().toLowerCase().trim()
    if (t.includes('cardio')) return 'cardio'
    if (t.includes('fuerza') || t.includes('strength')) return 'fuerza'
    if (t.includes('hiit')) return 'hiit'
    if (t.includes('movilidad') || t.includes('mobility')) return 'movilidad'
    if (t.includes('flexibilidad') || t.includes('flexibility')) return 'flexibilidad'
    if (t.includes('equilibrio') || t.includes('balance')) return 'equilibrio'
    if (t.includes('funcional') || t.includes('functional')) return 'funcional'
    return 'general'
}

const getExerciseTypeLabel = (type: string): string => {
    const normalized = normalizeExerciseType(type)
    const labels: { [key: string]: string } = {
        fuerza: 'Fuerza',
        cardio: 'Cardio',
        hiit: 'HIIT',
        movilidad: 'Movilidad',
        flexibilidad: 'Flexibilidad',
        equilibrio: 'Equilibrio',
        funcional: 'Funcional',
        general: 'General'
    }
    return labels[normalized] || (type || '').toString()
}

const getExerciseTypeColor = (type: string): string => {
    const normalized = normalizeExerciseType(type)
    const colors: { [key: string]: string } = {
        fuerza: 'bg-orange-200',
        cardio: 'bg-orange-300',
        hiit: 'bg-orange-400',
        movilidad: 'bg-rose-300',
        flexibilidad: 'bg-pink-300',
        equilibrio: 'bg-pink-200',
        funcional: 'bg-rose-200',
        general: 'bg-orange-300'
    }
    return colors[normalized] || colors.general
}

const getExerciseName = (item: any): string => {
    if (!item) return ''
    return item['Nombre de la Actividad']
        || item.nombre_ejercicio
        || item.Nombre
        || item.nombre
        || item.nombre_actividad
        || item.name
        || item.nombre_plato
        || ''
}

interface FitnessTableProps {
    data: ExerciseData[]
    startIndex: number
    selectedRows: Set<number>
    toggleRow: (actualIndex: number) => void
    toggleSelectAll: () => void
    isAllSelected: boolean
    onEdit: (item: ExerciseData, index: number) => void
    onDelete?: (index: number) => void
    activityId: number
    exerciseUsage: Record<number, { activities: Array<{ id: number; name: string }> }>
    activityNamesMap: Record<number, string>
    activityImagesMap: Record<number, string | null>
    duplicateNames: string[]
    loadingExisting: boolean
    bunnyVideoTitles?: Record<string, string>
    sortConfig?: { key: string; direction: 'asc' | 'desc' } | null
    onSort?: (key: string) => void
    newlyAddedIds?: Set<string | number>
}

export function FitnessTable({
    data,
    startIndex,
    selectedRows,
    toggleRow,
    toggleSelectAll,
    isAllSelected,
    onEdit,
    onDelete,
    activityId,
    exerciseUsage,
    activityNamesMap,
    activityImagesMap,
    duplicateNames,
    loadingExisting,
    bunnyVideoTitles = {},
    sortConfig,
    onSort,
    newlyAddedIds = new Set()
}: FitnessTableProps) {
    const [previewVideo, setPreviewVideo] = React.useState<{ url: string; title: string; libraryId?: string | number } | null>(null)

    const SortIcon = ({ column }: { column: string }) => {
        if (!sortConfig || sortConfig.key !== column) return <div className="ml-1 opacity-20"><ChevronUp className="h-2.5 w-2.5" /></div>
        return sortConfig.direction === 'asc' ? 
            <ChevronUp className="h-2.5 w-2.5 ml-1 text-[#FF7939]" /> : 
            <ChevronDown className="h-2.5 w-2.5 ml-1 text-[#FF7939]" />
    }

    const ThLink = ({ column, label, className = "" }: { column: string, label: string, className?: string }) => (
        <th className={`px-3 py-3 text-left text-[10px] font-black text-white hover:text-[#FF7939] cursor-pointer transition-colors border-b border-white/10 ${className}`} onClick={() => onSort?.(column)}>
            <div className="flex items-center">
                <span className="uppercase tracking-widest">{label}</span>
                <SortIcon column={column} />
            </div>
        </th>
    )

    return (
        <>
            <table className="min-w-max w-full text-left border-collapse table-fixed">
                <thead className="bg-zinc-950/40 backdrop-blur-md sticky top-0 z-10">
                    <tr>
                        <th className="px-2 py-3 text-left text-xs font-medium text-white border-b border-white/10 w-8"></th>
                        <th className="px-3 py-3 text-center text-xs font-medium text-white border-b border-white/10 w-12">
                            <button
                                onClick={toggleSelectAll}
                                className="p-1 hover:bg-zinc-800 rounded transition-colors mx-auto"
                                title="Seleccionar todos"
                            >
                                <Flame className={`h-4 w-4 transition-colors ${isAllSelected ? 'text-[#FF7939]' : 'text-white'}`} />
                            </button>
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-white border-b border-white/10 w-16">Acciones</th>
                        {activityId === 0 && (
                            <ThLink column="isExisting" label="Estado" className="w-24" />
                        )}
                        <ThLink column="nombre" label="Ejercicio" className="w-56" />
                        <th className="px-3 py-3 text-left text-[10px] font-black text-zinc-500 border-b border-white/10 w-64 uppercase tracking-widest">Descripción</th>
                        <ThLink column="duracion_min" label="Duración" className="w-24" />
                        <ThLink column="equipo" label="Equipo" className="w-36" />
                        <th className="px-3 py-3 text-left text-[10px] font-black text-zinc-500 border-b border-white/10 w-36 uppercase tracking-widest">P-R-S</th>
                        <ThLink column="body_parts" label="Partes" className="w-36" />
                        <ThLink column="calorias" label="Kcal" className="w-20" />
                        <ThLink column="intensidad" label="Intensidad" className="w-28" />
                        <th className="px-3 py-3 text-left text-[10px] font-black text-zinc-500 border-b border-white/10 w-40 uppercase tracking-widest">Video</th>
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={13 + (activityId === 0 ? 1 : 0)} className="px-4 py-8 text-center text-gray-400">
                                {loadingExisting ? 'Cargando ejercicios existentes...' : 'No hay ejercicios para mostrar'}
                            </td>
                        </tr>
                    ) : (
                        data.map((item, pageIndex) => {
                            const actualIndex = startIndex + pageIndex
                            const exerciseName = getExerciseName(item)
                            const isDuplicate = duplicateNames.includes(exerciseName)
                            const validationErrors = Array.isArray((item as any).__validationErrors)
                                ? ((item as any).__validationErrors as string[]).filter(Boolean)
                                : []
                            const hasIntensityIssue = validationErrors.some(error => error.toLowerCase().includes('intensidad'))
                            const hasBodyPartsIssue = validationErrors.some(error => error.toLowerCase().includes('partes'))
                            const hasEquipmentIssue = validationErrors.some(error => error.toLowerCase().includes('equipo'))
                            
                            const newItemIdentifier = item.id || (item as any).tempRowId
                            const isNew = newItemIdentifier && newlyAddedIds.has(newItemIdentifier)

                            return (
                                <tr key={actualIndex} className={`border-b border-gray-700 transition-all duration-1000 ${isNew ? 'bg-[#FF7939]/10 shadow-[inset_0_0_20px_rgba(255,121,57,0.05)] animate-pulse-subtle' : 'hover:bg-zinc-900/40'}`}>
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
                                        <div className="flex items-center justify-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onEdit(item, actualIndex)}
                                                className="text-blue-400 hover:bg-blue-400/10 p-1 h-6 w-6"
                                                title="Editar"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </td>
                                    {activityId === 0 && (
                                        <td className="px-3 py-3 text-xs text-white">
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
                                                            activo: activityStatus[idNum]
                                                        })
                                                    })
                                                }

                                                if (activities.length === 0) return '-'

                                                return (
                                                    <div className={`flex flex-wrap gap-2 ${activities.length > 3 ? 'max-h-20 overflow-y-auto' : ''}`}>
                                                        {activities.map((act, idx) => {
                                                            const imageUrl = activityImagesMap[act.id]
                                                            return (
                                                                <div key={`${act.id}-${idx}`} className="relative inline-flex items-center">
                                                                    <div className="relative w-8 h-8 rounded-full overflow-hidden">
                                                                        {imageUrl ? (
                                                                            <img src={imageUrl} alt={act.name} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center" />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )
                                            })()}
                                        </td>
                                    )}
                                    <td className="px-3 py-3 text-xs font-medium whitespace-pre-wrap break-words">
                                        <span className={isDuplicate ? 'text-red-400' : 'text-white'}>{getExerciseName(item) || '-'}</span>
                                    </td>
                                    <td className="px-3 py-3 text-xs text-white">
                                        <div className="space-y-2">
                                            {(() => {
                                                const desc = item['Descripción'] || item.descripcion || item.Descripción || '-'
                                                if (desc === '-') return <span>-</span>
                                                const pasos = desc.split(';').map((p: string) => p.trim()).filter(Boolean)
                                                if (pasos.length <= 1) return <span className="break-words">{desc}</span>
                                                return pasos.map((paso: string, idx: number) => (
                                                    <div key={idx} className="flex items-start">
                                                        <StepCircle number={idx + 1} />
                                                        <span className="break-words">{paso}</span>
                                                    </div>
                                                ))
                                            })()}
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 text-xs text-zinc-400 text-white">
                                        {(item['Duración (min)'] || item.duracion_min || item.Duración) && Number(item['Duración (min)'] || item.duracion_min || item.Duración) > 0 ? (
                                            `${item['Duración (min)'] || item.duracion_min || item.Duración} min`
                                        ) : '-'}
                                    </td>
                                    <td className={`px-3 py-3 text-xs whitespace-pre-wrap break-words ${hasEquipmentIssue ? 'text-red-400' : 'text-white'}`}>
                                        {item['Equipo Necesario'] || item.equipo_necesario || '-'}
                                    </td>
                                    <td className="px-3 py-3 text-xs text-white whitespace-pre break-normal">
                                        {(() => {
                                            const row = item['Detalle de Series (peso-repeticiones-series)'] || item['Detalle de Series'] || item['P-R-S'] || item.detalle_series
                                            if (typeof row === 'string') {
                                                const parts = row.split(/;|\n/).map(s => s.trim()).filter(Boolean)
                                                return parts.map(s => {
                                                    // Handle (p-r-se-seg) where some can be empty
                                                    const inner = s.replace(/^\((.*)\)$/, '$1')
                                                    const segments = inner.split('-')
                                                    if (segments.length >= 3) {
                                                        const [p, r, se, seg] = segments
                                                        const displayParts = []
                                                        if (p !== '') displayParts.push(`${p}kg`)
                                                        if (r !== '') displayParts.push(`${r}r`)
                                                        if (se !== '') displayParts.push(`${se}s`)
                                                        if (seg && seg !== '') displayParts.push(`${seg}''`)
                                                        
                                                        if (displayParts.length === 0) return null
                                                        return `(${displayParts.join('-')});`
                                                    }
                                                    // Fallback for simple strings
                                                    if (s.includes('0') && !s.match(/[1-9]/)) return null
                                                    return s.endsWith(';') ? s : `${s};`
                                                }).filter(Boolean).join('\n') || '-'
                                            }
                                            if (Array.isArray(row)) {
                                                const formatted = row.map((s: any) => {
                                                    const p = parseFloat(s.peso) || 0
                                                    const r = parseInt(s.repeticiones) || 0
                                                    const se = parseInt(s.series) || 0
                                                    if (p === 0 && r === 0 && se === 0) return null
                                                    
                                                    const parts = []
                                                    if (p > 0) parts.push(p)
                                                    if (r > 0) parts.push(r)
                                                    if (se > 0) parts.push(se)
                                                    
                                                    return `(${parts.join('-')});`
                                                }).filter(Boolean)
                                                return formatted.join('\n') || '-'
                                            }
                                            return '-'
                                        })()}
                                    </td>
                                    <td className={`px-3 py-3 text-xs whitespace-pre-wrap break-words ${hasBodyPartsIssue ? 'text-red-400' : 'text-white'}`}>
                                        {(item['Partes del Cuerpo'] || item.body_parts || '').toString().split(/;|,/).filter(Boolean).map((p: string) => p.trim()).join('\n') || '-'}
                                    </td>
                                    <td className="px-3 py-3 text-xs text-white">
                                        {(item.Calorías || item.calorias) && Number(item.Calorías || item.calorias) > 0 ? (item.Calorías || item.calorias) : '-'}
                                    </td>
                                    <td className="px-3 py-3 text-xs text-white">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${hasIntensityIssue ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                                            (item['Nivel de Intensidad'] || item.intensidad || '').toLowerCase().includes('alto') ? 'bg-red-100 text-red-800' :
                                                (item['Nivel de Intensidad'] || item.intensidad || '').toLowerCase().includes('medio') ? 'bg-yellow-100 text-yellow-800' :
                                                    (item['Nivel de Intensidad'] || item.intensidad || '').toLowerCase().includes('bajo') ? 'bg-green-100 text-green-800' :
                                                        'bg-gray-100 text-gray-800'
                                            }`}>
                                            {item['Nivel de Intensidad'] || item.intensidad || '-'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 text-xs text-white break-words">
                                        {(() => {
                                            const bunnyId = item.bunny_video_id || item.bunnyVideoId
                                            const rawUrl = item.video_url || item.video || ''
                                            const url = bunnyId || rawUrl || ''
                                            const libId = item.bunny_library_id || item.bunnyLibraryId

                                            let fileName = item.video_file_name || (bunnyId && bunnyVideoTitles ? bunnyVideoTitles[bunnyId] : null)

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
