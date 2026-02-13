import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TimeBlock } from '../types'

interface ScheduleSidebarProps {
    existingActivities: TimeBlock[]
    filteredActivities: string[]
    showExistingActivities: boolean
    toggleAllActivities: () => void
    toggleActivityVisibility: (name: string) => void
    stats: {
        totalActivities: number
        totalSessions: number
    }
}

export function ScheduleSidebar({
    existingActivities,
    filteredActivities,
    showExistingActivities,
    toggleAllActivities,
    toggleActivityVisibility,
    stats
}: ScheduleSidebarProps) {
    return (
        <div className="lg:col-span-1 space-y-4">
            {/* Panel de actividades existentes */}
            <Card className="bg-[#0A0A0A] border-[#1A1A1A]">
                <CardHeader>
                    <CardTitle className="text-white text-sm flex items-center justify-between">
                        <span>Actividades Existentes</span>
                        <button
                            onClick={toggleAllActivities}
                            className="text-xs text-gray-400 hover:text-white"
                        >
                            {showExistingActivities ? 'Ocultar' : 'Mostrar'}
                        </button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {existingActivities.length === 0 ? (
                        <p className="text-gray-400 text-xs">No hay actividades configuradas</p>
                    ) : (
                        <div className="space-y-2">
                            {existingActivities.map((activity) => (
                                <div
                                    key={activity.id}
                                    className="flex items-center justify-between p-2 bg-[#1A1A1A] rounded-lg"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${activity.color}`} />
                                        <div>
                                            <p className="text-white text-xs font-medium">{activity.name}</p>
                                            <p className="text-gray-400 text-xs">
                                                {activity.selectedDates.length} sesiones
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleActivityVisibility(activity.name)}
                                        className={`text-xs px-2 py-1 rounded ${filteredActivities.includes(activity.name)
                                                ? 'bg-red-500 text-white'
                                                : 'bg-green-500 text-white'
                                            }`}
                                    >
                                        {filteredActivities.includes(activity.name) ? 'Ocultar' : 'Ver'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Resumen de ocupación */}
            <Card className="bg-[#0A0A0A] border-[#1A1A1A]">
                <CardHeader>
                    <CardTitle className="text-white text-sm">Resumen</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Total actividades:</span>
                            <span className="text-white">{stats.totalActivities}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Sesiones programadas:</span>
                            <span className="text-white">{stats.totalSessions}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
