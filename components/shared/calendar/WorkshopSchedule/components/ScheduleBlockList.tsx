import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, X } from 'lucide-react'
import { TimeBlock } from '../types'

interface ScheduleBlockListProps {
    blocks: TimeBlock[]
    onEdit: (block: TimeBlock) => void
    onRemove: (id: string) => void
}

export function ScheduleBlockList({ blocks, onEdit, onRemove }: ScheduleBlockListProps) {
    if (blocks.length === 0) return null

    return (
        <Card className="bg-[#0A0A0A] border-[#1A1A1A]">
            <CardHeader>
                <CardTitle className="text-white">Bloques de Horario Configurados</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {blocks.map((block) => (
                        <div
                            key={block.id}
                            className="flex items-center justify-between p-4 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A]"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-4 h-4 rounded-full ${block.color}`} />
                                <div>
                                    <h4 className="text-white font-medium">{block.name}</h4>
                                    <div className="flex items-center gap-4 text-sm text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {block.startTime} - {block.endTime}
                                        </span>
                                        <span>
                                            {block.selectedDates.length} sesiones programadas
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        <div>Período: {new Date(block.startDate).toLocaleDateString('es-ES')} - {new Date(block.endDate).toLocaleDateString('es-ES')}</div>
                                        <div>Días: {block.selectedWeekDays.join(', ')}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onEdit(block)}
                                    className="text-blue-400 hover:text-blue-300"
                                >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onRemove(block.id)}
                                    className="text-red-400 hover:text-red-300"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
