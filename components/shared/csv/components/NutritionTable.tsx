import React from 'react'
import { Flame, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExerciseData } from '../types'

interface NutritionTableProps {
    data: ExerciseData[]
    startIndex: number
    selectedRows: Set<number>
    toggleRow: (actualIndex: number) => void
    toggleSelectAll: () => void
    isAllSelected: boolean
    onEdit: (item: ExerciseData, index: number) => void
    activityId: number
    duplicateNames: string[]
    loadingExisting: boolean
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
    duplicateNames,
    loadingExisting
}: NutritionTableProps) {
    return (
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
                        <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-48">Estado</th>
                    )}
                    <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-48">Plato</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-48">Receta</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-20">Calorías</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-24">Proteínas</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-24">Carbohidratos</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-20">Grasas</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-24">Dificultad</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-32">Ingredientes</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-20">Porciones</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-20">Minutos</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-32">Video</th>
                </tr>
            </thead>
            <tbody>
                {data.length === 0 ? (
                    <tr>
                        <td colSpan={15 + (activityId === 0 ? 1 : 0)} className="px-4 py-8 text-center text-gray-400">
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
                                    <td className="px-3 py-3 text-xs text-white">-</td>
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
                                        return Number(val) > 0 ? val : '-'
                                    })()}
                                </td>
                                <td className="px-3 py-3 text-xs text-white">
                                    {(() => {
                                        const val = item['Proteínas (g)'] ?? item['Proteínas'] ?? item.proteinas
                                        return Number(val) > 0 ? `${val}g` : '-'
                                    })()}
                                </td>
                                <td className="px-3 py-3 text-xs text-white">
                                    {(() => {
                                        const val = item['Carbohidratos (g)'] ?? item['Carbohidratos'] ?? item.carbohidratos
                                        return Number(val) > 0 ? `${val}g` : '-'
                                    })()}
                                </td>
                                <td className="px-3 py-3 text-xs text-white">
                                    {(() => {
                                        const val = item['Grasas (g)'] ?? item['Grasas'] ?? item.grasas
                                        return Number(val) > 0 ? `${val}g` : '-'
                                    })()}
                                </td>
                                <td className="px-3 py-3 text-xs text-white">{item['Dificultad'] ?? item.dificultad ?? '-'}</td>
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
                                        return min ? `${min} min` : '-'
                                    })()}
                                </td>
                                <td className="px-3 py-3 text-xs text-white">
                                    {(() => {
                                        const url = item.video_url || item.video || ''
                                        if (item.video_file_name) return <span className="text-yellow-400">{item.video_file_name}</span>
                                        if (url) return <span className="text-blue-400 truncate max-w-[100px] block">Video Asignado</span>
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
