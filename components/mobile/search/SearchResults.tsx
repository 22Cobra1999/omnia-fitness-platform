"use client"

import React from 'react'
import { ChevronRight, Star, Clock, Zap, Dumbbell, ChefHat } from 'lucide-react'
import Image from 'next/image'
import ActivityCard from '@/components/shared/activities/ActivityCard'
import { CoachCardSkeleton, ActivityCardSkeleton } from '@/components/shared/ui/global-loading'
import { NoCoachesFallback, NoActivitiesFallback } from '@/components/shared/misc/fallback-states'

interface SearchResultsProps {
    displayedCoaches: any[]
    activities: any[]
    isLoadingCoaches: boolean
    isLoadingActivities: boolean
    handleCoachClick: (coachId: string) => void
    handleActivityClick: (activity: any) => void
    showAllCoaches: boolean
    setShowAllCoaches: (val: boolean) => void
    showAllActivities: boolean
    setShowAllActivities: (val: boolean) => void
}

export function SearchResults({
    displayedCoaches,
    activities,
    isLoadingCoaches,
    isLoadingActivities,
    handleCoachClick,
    handleActivityClick,
    showAllCoaches,
    setShowAllCoaches,
    showAllActivities,
    setShowAllActivities
}: SearchResultsProps) {

    const visibleCoaches = showAllCoaches ? displayedCoaches : displayedCoaches.slice(0, 4)
    const visibleActivities = showAllActivities ? activities : activities.slice(0, 6)

    const renderSpecialtyIcon = (specialty?: string) => {
        const s = specialty?.toLowerCase() || ""
        if (s.includes('nutricion')) return <ChefHat className="h-4 w-4 text-[#FF7939]" />
        if (s.includes('gym')) return <Dumbbell className="h-4 w-4 text-[#FF7939]" />
        return <Zap className="h-4 w-4 text-[#FF7939]" />
    }

    return (
        <div className="space-y-10 pb-20">
            {/* Coaches Section */}
            <section>
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-xl font-bold text-white/90 tracking-tight">Coaches Expertos</h3>
                    {displayedCoaches.length > 4 && (
                        <button
                            onClick={() => setShowAllCoaches(!showAllCoaches)}
                            className="text-sm font-medium text-[#FF7939] hover:opacity-80 transition-opacity"
                        >
                            {showAllCoaches ? 'Ver menos' : 'Ver todos'}
                        </button>
                    )}
                </div>

                {isLoadingCoaches ? (
                    <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map(i => <CoachCardSkeleton key={i} />)}
                    </div>
                ) : displayedCoaches.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                        {visibleCoaches.map((coach) => (
                            <button
                                key={coach.id}
                                onClick={() => handleCoachClick(coach.id)}
                                className="group bg-[#1A1C1F] p-4 rounded-3xl border border-white/5 hover:border-[#FF7939]/30 transition-all text-left relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity">
                                    {renderSpecialtyIcon(coach.specialization)}
                                </div>
                                <div className="relative w-16 h-16 rounded-2xl overflow-hidden mb-4 border-2 border-[#FF7939]/20 shadow-lg">
                                    <Image
                                        src={coach.avatar_url || '/placeholder.svg'}
                                        alt={coach.name}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                </div>
                                <h4 className="text-white font-bold leading-tight mb-1 truncate">{coach.name}</h4>
                                <p className="text-gray-500 text-xs mb-3 truncate">{coach.specialization || 'Performance Coach'}</p>
                                <div className="flex items-center gap-1 bg-[#FF7939]/10 w-fit px-2 py-1 rounded-lg">
                                    <Star className="h-3 w-3 text-[#FF7939] fill-current" />
                                    <span className="text-[#FF7939] text-xs font-bold">{coach.rating?.toFixed(1) || 'N/A'}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <NoCoachesFallback />
                )}
            </section>

            {/* Activities Section */}
            <section>
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-xl font-bold text-white/90 tracking-tight">Descubre Rutinas</h3>
                    {activities.length > 6 && (
                        <button
                            onClick={() => setShowAllActivities(!showAllActivities)}
                            className="text-sm font-medium text-[#FF7939] hover:opacity-80 transition-opacity"
                        >
                            {showAllActivities ? 'Ver menos' : 'Ver todas'}
                        </button>
                    )}
                </div>

                {isLoadingActivities ? (
                    <div className="grid grid-cols-1 gap-4">
                        {[1, 2, 3].map(i => <ActivityCardSkeleton key={i} />)}
                    </div>
                ) : activities.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {visibleActivities.map((activity) => (
                            <ActivityCard
                                key={activity.id}
                                activity={activity}
                                onClick={() => handleActivityClick(activity)}
                            />
                        ))}
                    </div>
                ) : (
                    <NoActivitiesFallback />
                )}
            </section>
        </div>
    )
}
