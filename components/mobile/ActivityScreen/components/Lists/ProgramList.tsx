"use client"

import { Enrollment } from "@/types/activity"
import { PurchasedActivityCard } from "@/components/activities/purchased-activity-card"
import { calculateEnrollmentStatus } from "../../utils"

interface ProgramListProps {
    enrollments: Enrollment[]
    isLoading: boolean
    onActivityClick: (activityId: string, enrollmentId?: string) => void
    onStartActivity: (activityId: string) => void // Propagated from logic
    showProgress?: boolean
    enrollmentProgresses?: Record<string, number>
}

export function ProgramList({
    enrollments,
    isLoading,
    onActivityClick,
    onStartActivity,
    enrollmentProgresses = {}
}: ProgramListProps) {
    if (isLoading) {
        return <div className="p-6 text-center text-gray-500">Cargando actividades...</div> // Replace with Skeleton later
    }

    if (enrollments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">🌱</span>
                </div>
                <h3 className="text-white font-medium mb-1">No hay actividades aquí</h3>
                <p className="text-sm text-gray-400">
                    Cambia el filtro o explora nuevos programas.
                </p>
            </div>
        )
    }

    return (
        <div className="px-4 pb-24 flex gap-2 w-full overflow-x-auto snap-x scrollbar-hide">
            {enrollments.map((enrollment) => {
                // Status is calculated internally or ignored if not passed explicitly? 
                // PurchasedActivityCard doesn't seem to take 'status' prop based on outline, 
                // but calculateEnrollmentStatus is useful for filtering.
                const progress = enrollmentProgresses[enrollment.id] || 0

                return (
                    <div key={enrollment.id} className="snap-start shrink-0">
                        <PurchasedActivityCard
                            enrollment={enrollment}
                            onActivityClick={onActivityClick}
                            realProgress={progress}
                            size="small"
                        />
                    </div>
                )
            })}
        </div>
    )
}
