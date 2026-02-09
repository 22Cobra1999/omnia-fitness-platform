"use client"

import CoachProfileCard from "@/components/coach/clients/CoachProfileCard"
import { Coach } from "../../hooks/useActivityScreenLogic"

interface CoachCarouselProps {
    coaches: Coach[]
    loading: boolean
    meetCredits: Record<string, number>
    onCoachClick: (coachId: string) => void
}

export function CoachCarousel({ coaches, loading, meetCredits, onCoachClick }: CoachCarouselProps) {
    if (loading) {
        return <div className="h-24 w-full bg-white/5 animate-pulse rounded-xl mx-6 my-4" /> // Simple Skeleton
    }

    if (coaches.length === 0) return null

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between px-6 mb-3">
                <h3 className="text-lg font-semibold text-white">Tus Coaches</h3>
            </div>

            <div className="flex gap-4 overflow-x-auto px-6 pb-4 no-scrollbar snap-x snap-mandatory">
                {coaches.map((coach) => {
                    const credits = meetCredits[coach.id] || 0

                    return (
                        <div key={coach.id} className="snap-start shrink-0">
                            <CoachProfileCard
                                coach={{
                                    ...coach,
                                    available_meets: credits,
                                    // Ensure required fields for CoachProfileCard are present
                                    name: coach.full_name,
                                    id: coach.id
                                } as any}
                                onClick={() => onCoachClick(coach.id)}
                                variant="meet"
                                size="small"
                            />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
