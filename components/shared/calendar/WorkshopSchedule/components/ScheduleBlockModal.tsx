import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { TimeBlock, blockColors, weekDays } from '../types'

interface ScheduleBlockModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: () => void
    editingBlockId: string | null
    newBlock: Partial<TimeBlock>
    setNewBlock: React.Dispatch<React.SetStateAction<Partial<TimeBlock>>>
}

export function ScheduleBlockModal({
    isOpen,
    onClose,
    onSave,
    editingBlockId,
    newBlock,
    setNewBlock
}: ScheduleBlockModalProps) {
    const handleWeekDayToggle = (dayKey: string) => {
        const currentDays = newBlock.selectedWeekDays || []
        const newDays = currentDays.includes(dayKey)
            ? currentDays.filter(d => d !== dayKey)
            : [...currentDays, dayKey]

        setNewBlock(prev => ({ ...prev, selectedWeekDays: newDays }))
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-[#1A1A1A] rounded-xl p-6 w-full max-w-2xl border border-[#2A2A2A] max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white font-semibold text-xl">
                                {editingBlockId ? 'Editar Bloque de Horario' : 'Nuevo Bloque de Horario'}
                            </h3>
                            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-white font-medium mb-2 block">Nombre del bloque</label>
                                    <Input
                                        value={newBlock.name}
                                        onChange={(e) => setNewBlock(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Ej: Yoga Matutina"
                                        className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-white font-medium mb-2 block">Hora de inicio</label>
                                        <Input
                                            type="time"
                                            value={newBlock.startTime}
                                            onChange={(e) => setNewBlock(prev => ({ ...prev, startTime: e.target.value }))}
                                            className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-white font-medium mb-2 block">Hora de fin</label>
                                        <Input
                                            type="time"
                                            value={newBlock.endTime}
                                            onChange={(e) => setNewBlock(prev => ({ ...prev, endTime: e.target.value }))}
                                            className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-white font-medium mb-2 block">Fecha de inicio</label>
                                    <Input
                                        type="date"
                                        value={newBlock.startDate}
                                        onChange={(e) => setNewBlock(prev => ({ ...prev, startDate: e.target.value }))}
                                        className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-white font-medium mb-2 block">Fecha de fin</label>
                                    <Input
                                        type="date"
                                        value={newBlock.endDate}
                                        onChange={(e) => setNewBlock(prev => ({ ...prev, endDate: e.target.value }))}
                                        className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-white font-medium mb-2 block">Color</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {blockColors.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => setNewBlock(prev => ({ ...prev, color }))}
                                            className={`w-8 h-8 rounded-full ${color} border-2 ${newBlock.color === color ? 'border-white' : 'border-transparent'
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-white font-medium mb-2 block">Días de la semana</label>
                                <div className="grid grid-cols-7 gap-2">
                                    {weekDays.map(({ key, label }) => (
                                        <button
                                            key={key}
                                            onClick={() => handleWeekDayToggle(key)}
                                            className={`p-2 rounded-lg text-sm ${(newBlock.selectedWeekDays || []).includes(key)
                                                    ? 'bg-orange-500 text-white'
                                                    : 'bg-[#2A2A2A] text-gray-400 hover:text-white'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button onClick={onClose} variant="outline" className="flex-1 border-[#3A3A3A] text-gray-400 hover:text-white">
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={onSave}
                                    disabled={!newBlock.name || (newBlock.selectedWeekDays || []).length === 0}
                                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50"
                                >
                                    <Check className="h-4 w-4 mr-2" />
                                    {editingBlockId ? 'Actualizar Bloque' : 'Agregar Bloque'}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
