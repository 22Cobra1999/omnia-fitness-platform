import React from "react"
import { User, ShoppingCart, Loader2 } from "lucide-react"
import CoachProfileCard from '@/components/coach/clients/CoachProfileCard'
import ActivityCard from '@/components/shared/activities/ActivityCard'
import { NoCoachesFallback, NoActivitiesFallback, CompactNoCoachesFallback } from '@/components/shared/misc/fallback-states'

interface SearchResultsProps {
    expandedSection: 'coaches' | 'activities' | null
    isLoadingCoaches: boolean
    isLoadingActivities: boolean
    coachesError: Error | null
    activitiesError: Error | null
    displayedCoaches: any[]
    activities: any[]
    handleRetry: () => void
    handleCoachClick: (id: string) => void
    handleActivityClick: (activity: any) => void
}

export const SearchResults: React.FC<SearchResultsProps> = ({
    expandedSection,
    isLoadingCoaches,
    isLoadingActivities,
    coachesError,
    activitiesError,
    displayedCoaches,
    activities,
    handleRetry,
    handleCoachClick,
    handleActivityClick,
}) => {
    return (
        <div className="px-4">
            {/* Coaches Section */}
            {(expandedSection === null || expandedSection === 'coaches') && (
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold flex items-center text-white/60 uppercase tracking-wider">
                            <User className="h-4 w-4 mr-1.5 text-[#FF7939]/70" />
                            Coaches
                        </h2>
                    </div>

                    {isLoadingCoaches && !displayedCoaches.length && (
                        <div className="flex flex-col items-center justify-center py-10">
                            <Loader2 className="h-8 w-8 text-[#FF7939] animate-spin mb-2" />
                            <p className="text-gray-400 animate-pulse">Cargando coaches...</p>
                        </div>
                    )}

                    {!isLoadingCoaches && coachesError && (
                        <div className="text-center py-10">
                            <p className="text-red-400 mb-4">Error al cargar coaches</p>
                            <button
                                onClick={handleRetry}
                                className="bg-[#FF7939] hover:bg-[#FF6B00] text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Intentar de nuevo
                            </button>
                        </div>
                    )}

                    {!isLoadingCoaches && !coachesError && displayedCoaches.length === 0 && (
                        <CompactNoCoachesFallback onRetry={handleRetry} />
                    )}

                    {!isLoadingCoaches && !coachesError && displayedCoaches.length > 0 && (
                        <div className="overflow-x-auto no-scrollbar">
                            <div className="flex gap-4 pb-4 px-1" style={{ minWidth: "min-content" }}>
                                {displayedCoaches.map((coach, index) => (
                                    <CoachProfileCard
                                        key={coach.id}
                                        coach={coach}
                                        size="small"
                                        onClick={() => handleCoachClick(coach.id)}
                                        priority={index < 4}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Activities Section */}
            {(expandedSection === null || expandedSection === 'activities') && (
                <div className="mt-2">
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-sm font-semibold flex items-center text-white/60 uppercase tracking-wider">
                                <ShoppingCart className="h-4 w-4 mr-1.5 text-[#FF7939]/70" />
                                Actividades
                            </h2>
                        </div>

                        {isLoadingActivities || !activities ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 text-[#FF7939] animate-spin" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto no-scrollbar">
                                <div className="flex gap-4 pb-4 px-1" style={{ minWidth: "min-content" }}>
                                    {activities.map((activity, index) => (
                                        <ActivityCard
                                            key={activity.id}
                                            activity={activity}
                                            size="small"
                                            onClick={() => handleActivityClick(activity)}
                                            priority={index < 4}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
