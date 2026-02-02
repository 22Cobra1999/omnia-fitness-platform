import React from 'react'
import { RotateCcw } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { formatDate, getDayNamePlural } from '../utils/date-helpers'

interface ConfirmationModalProps {
    showConfirmModal: boolean
    setShowConfirmModal: (show: boolean) => void
    editingDate: Date | null
    newDate: Date | null
    getDayData: (date: Date) => any
    selectedActivityIdsForDateChange: string[]
    setSelectedActivityIdsForDateChange: (ids: string[]) => void
    applyToAllSameDays: boolean
    setApplyToAllSameDays: (val: boolean) => void
    confirmUpdateDate: () => Promise<void>
    dayData: any
    summaryRowsByDate: any
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    showConfirmModal, setShowConfirmModal, editingDate, newDate, getDayData,
    selectedActivityIdsForDateChange, setSelectedActivityIdsForDateChange,
    applyToAllSameDays, setApplyToAllSameDays, confirmUpdateDate,
    dayData, summaryRowsByDate
}) => {
    if (!showConfirmModal) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-sm border border-zinc-700/30">
                <div className="flex items-center gap-2 mb-4">
                    <RotateCcw className="h-5 w-5 text-[#FF7939]" />
                    <h3 className="font-semibold text-lg text-white">Confirmar Cambio</h3>
                </div>

                <div className="space-y-4">
                    <div className="text-sm text-gray-300">¿Estás seguro de que quieres cambiar la fecha de los ejercicios?</div>
                    <div className="bg-zinc-800/50 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between text-sm"><span className="text-gray-400">Fecha actual:</span><span className="text-white">{editingDate && formatDate(editingDate)}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-400">Nueva fecha:</span><span className="text-[#FF7939]">{newDate && formatDate(newDate)}</span></div>
                    </div>

                    {newDate && getDayData(newDate) && getDayData(newDate)!.exerciseCount > 0 && (
                        <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                <div className="text-sm text-amber-200">
                                    <div className="font-medium">¡Atención!</div>
                                    <div className="text-xs text-amber-300 mt-1">El {formatDate(newDate)} ya tiene {getDayData(newDate)!.exerciseCount} ejercicio(s) programado(s)</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {editingDate && (
                        <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/30">
                            <div className="font-medium text-white text-sm mb-2">Aplicar a actividades</div>
                            <div className="space-y-2">
                                {(() => {
                                    const dayStr = editingDate.toISOString().split('T')[0]
                                    const sumRows = summaryRowsByDate?.[dayStr] || []
                                    const map = new Map<string, { id: string; label: string }>()
                                    for (const r of sumRows) {
                                        const id = r.activity_id !== undefined && r.activity_id !== null ? String(r.activity_id) : ''
                                        if (!id) continue
                                        if (!map.has(id)) map.set(id, { id, label: r.activity_title || `Actividad ${id}` })
                                    }
                                    const opts = Array.from(map.values())
                                    if (opts.length === 0) return <div className="text-xs text-gray-400">No hay actividades detectadas.</div>
                                    return opts.map((opt) => (
                                        <label key={opt.id} className="flex items-center gap-2 text-sm text-gray-200">
                                            <input type="checkbox" checked={selectedActivityIdsForDateChange.includes(opt.id)} onChange={(e) => {
                                                const next = e.target.checked ? Array.from(new Set([...selectedActivityIdsForDateChange, opt.id])) : selectedActivityIdsForDateChange.filter(x => x !== opt.id)
                                                setSelectedActivityIdsForDateChange(next)
                                            }} />
                                            <span className="text-gray-300">{opt.label}</span>
                                        </label>
                                    ))
                                })()}
                            </div>
                        </div>
                    )}

                    {editingDate && newDate && editingDate.getDay() !== newDate.getDay() && (
                        <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/30">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="font-medium text-white text-sm">Aplicar a todos los {getDayNamePlural(editingDate.getDay())}</div>
                                    <div className="text-xs text-gray-400 mt-1">Cambiará todos los {getDayNamePlural(editingDate.getDay())} a {getDayNamePlural(newDate.getDay())}</div>
                                </div>
                                <Switch checked={applyToAllSameDays} onCheckedChange={setApplyToAllSameDays} className="h-5 w-9 data-[state=checked]:bg-[#FF7939] data-[state=unchecked]:bg-[#FF7939]/20" />
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button onClick={() => { setShowConfirmModal(false); setApplyToAllSameDays(false) }} className="flex-1 px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors">Cancelar</button>
                        <button onClick={confirmUpdateDate} className="flex-1 px-4 py-2 bg-[#FF7939] text-white rounded-lg hover:bg-[#FF7939]/80 transition-colors">Confirmar</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
