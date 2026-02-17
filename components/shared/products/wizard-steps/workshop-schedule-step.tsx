import React from 'react'
import { WorkshopSimpleScheduler } from '@/components/shared/calendar/workshop-simple-scheduler'

interface WorkshopScheduleStepProps {
    workshopSchedule: any[]
    setWorkshopSchedule: (sessions: any[]) => void
    setWeeklyStats: (stats: any | ((prev: any) => any)) => void
}

export const WorkshopScheduleStep: React.FC<WorkshopScheduleStepProps> = ({
    workshopSchedule,
    setWorkshopSchedule,
    setWeeklyStats
}) => {
    return (
        <div className="space-y-6">
            <WorkshopSimpleScheduler
                sessions={workshopSchedule}
                onSessionsChange={(sessions) => {
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
