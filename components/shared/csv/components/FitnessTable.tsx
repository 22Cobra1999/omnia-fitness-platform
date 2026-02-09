import React from 'react'
import { Flame, Eye, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExerciseData } from '../types'

// Helper functions (copied from original implementation)
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
    activityId: number
    exerciseUsage: Record<number, { activities: Array<{ id: number; name: string }> }>
    activityNamesMap: Record<number, string>
    activityImagesMap: Record<number, string | null>
    duplicateNames: string[]
    loadingExisting: boolean
}

export function FitnessTable({
    data,
    startIndex,
    selectedRows,
    toggleRow,
    toggleSelectAll,
    isAllSelected,
    onEdit,
    activityId,
    exerciseUsage,
    activityNamesMap,
    activityImagesMap,
    duplicateNames,
    loadingExisting
}: FitnessTableProps) {
    return (
        <table className="min-w-max w-full text-left border-collapse">
            <thead>
                <tr>
                    <th className="px-2 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-8"></th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-16">
                        <button
                            onClick={toggleSelectAll}
                            className="p-1 hover:bg-gray-700/50 rounded transition-colors mx-auto"
                            title="Seleccionar/deseleccionar todos de esta página"
                        >
                            <Flame className={`h-4 w-4 transition-colors ${isAllSelected ? 'text-[#FF7939]' : 'text-white'}`} />
                        </button>
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-12">Editar</th>
                    {activityId === 0 && (
                        <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-48">Estado</th>
                    )}
                    <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-48">Ejercicio</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-48">Descripción</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-20">Duración</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-24">Tipo</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-32">Equipo</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-32">P-R-S</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-32">Partes</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-20">Calorías</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-24">Intensidad</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-32">Video</th>
                </tr>
            </thead>
            <tbody>
                {data.length === 0 ? (
                    <tr>
                        <td colSpan={14 + (activityId === 0 ? 1 : 0)} className="px-4 py-8 text-center text-gray-400">
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
                                                                        <div className="w-full h-full bg-gradient-to-br from-[#FF7939] to-[#E66829] flex items-center justify-center">
                                                                            <span className="text-xs font-bold text-white">{act.name.charAt(0).toUpperCase()}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-900 ${act.activo ? 'bg-green-500' : 'bg-red-500'}`} />
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
                                    <div className="max-h-32 overflow-y-auto">
                                        <span className="break-words">{item['Descripción'] || item.descripcion || item.Descripción || '-'}</span>
                                    </div>
                                </td>
                                <td className="px-3 py-3 text-xs text-white">
                                    {item['Duración (min)'] || item.duracion_min || item.Duración || '-'} min
                                </td>
                                <td className="px-3 py-3 text-xs whitespace-pre-wrap break-words">
                                    {(() => {
                                        const type = item['Tipo de Ejercicio'] || item.tipo_ejercicio || item.type || ''
                                        const normalized = normalizeExerciseType(type)
                                        return (
                                            <span className={`${getExerciseTypeColor(normalized)} text-black text-[10px] px-1.5 py-0.5 rounded-full font-medium border border-black/10 inline-block`}>
                                                {getExerciseTypeLabel(normalized)}
                                            </span>
                                        )
                                    })()}
                                </td>
                                <td className={`px-3 py-3 text-xs whitespace-pre-wrap break-words ${hasEquipmentIssue ? 'text-red-400' : 'text-white'}`}>
                                    {item['Equipo Necesario'] || item.equipo_necesario || '-'}
                                </td>
                                <td className="px-3 py-3 text-xs text-white whitespace-pre break-normal">
                                    {(() => {
                                        const row = item['Detalle de Series (peso-repeticiones-series)'] || item['Detalle de Series'] || item['P-R-S'] || item.detalle_series
                                        if (typeof row === 'string') return row.split(/;|\n/).map(s => s.trim()).filter(Boolean).map(s => s.endsWith(';') ? s : `${s};`).join('\n') || '-'
                                        if (Array.isArray(row)) return row.map((s: any) => `(${s.peso}-${s.repeticiones}-${s.series});`).join('\n') || '-'
                                        return '-'
                                    })()}
                                </td>
                                <td className={`px-3 py-3 text-xs whitespace-pre-wrap break-words ${hasBodyPartsIssue ? 'text-red-400' : 'text-white'}`}>
                                    {(item['Partes del Cuerpo'] || item.body_parts || '').toString().split(/;|,/).filter(Boolean).map((p: string) => p.trim()).join('\n') || '-'}
                                </td>
                                <td className="px-3 py-3 text-xs text-white">{item.Calorías || item.calorias || '-'}</td>
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
                                        const url = item.video_url || item.video || ''
                                        const fileName = item.video_file_name
                                        if (fileName) return <span className="text-yellow-400">{fileName}</span>
                                        if (url) return <span className="text-blue-400 truncate max-w-[100px] block" title={url}>Video Asignado</span>
                                        return '-'
                                    })()}
                                </td>
                            </tr>
                        )
                    })
                )}
            </tbody>
        </table>
    )
}
