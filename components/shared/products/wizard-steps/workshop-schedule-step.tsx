import React from 'react'
import { WorkshopSimpleScheduler } from '@/components/shared/calendar/workshop-simple-scheduler'
import { AlertCircle, Calendar, MessageSquare } from 'lucide-react'

interface WorkshopScheduleStepProps {
    workshopSchedule: any[]
    setWorkshopSchedule: (sessions: any[]) => void
    setWeeklyStats: (stats: any | ((prev: any) => any)) => void
    totalSales?: number
    editingProduct?: any
}

export const WorkshopScheduleStep: React.FC<WorkshopScheduleStepProps> = ({
    workshopSchedule,
    setWorkshopSchedule,
    setWeeklyStats,
    totalSales = 0,
    editingProduct
}) => {
    const hasSales = totalSales > 0;

    return (
        <div className="space-y-6">
            {hasSales && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 mb-6">
                    <div className="flex gap-3">
                        <div className="mt-1">
                            <AlertCircle className="h-5 w-5 text-orange-500" />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-sm font-bold text-white">Edición restringida</h4>
                            <p className="text-xs text-gray-400 leading-relaxed">
                                Este taller ya tiene <span className="text-orange-400 font-bold">{totalSales} {totalSales === 1 ? 'inscripto' : 'inscriptos'}</span>. 
                                Por seguridad, la edición de temas y horarios bases está deshabilitada.
                            </p>
                            <div className="flex flex-col gap-1 mt-2">
                                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                    <Calendar className="h-3 w-3" />
                                    <span>Para reprogramar o cancelar clases, usa tu <strong className="text-white">Agenda</strong>.</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                    <MessageSquare className="h-3 w-3" />
                                    <span>Puedes pausar las ventas desde la información general.</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                    <MessageSquare className="h-3 w-3" />
                                    <span>Al finalizar, podrás crear una <strong className="text-white">Nueva Versión</strong> del mismo.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <WorkshopSimpleScheduler
                sessions={workshopSchedule}
                disabled={hasSales}
                onSessionsChange={(sessions) => {
                    if (hasSales) return;
                    setWorkshopSchedule(sessions)
                    // Update stats for workshops
                    const uniqueDays = new Set(sessions.map(s => s.date)).size
                    const uniqueThemes = new Set(sessions.map(s => s.title).filter(Boolean)).size
                    setWeeklyStats((prev: any) => ({
                        ...prev,
                        sesiones: uniqueDays,
                        ejerciciosUnicos: uniqueThemes
                    }))
                }}
            />
        </div>
    )
}
