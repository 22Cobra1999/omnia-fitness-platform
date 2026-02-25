"use client"
import { useState } from "react"
import { useActivityScreenLogic } from "./hooks/useActivityScreenLogic"
import { calculateEnrollmentStatus, filterEnrollments } from "./utils"

// UI Components
import { ActivityHeader } from "./components/Header/ActivityHeader"
import { StatusFilterBar } from "./components/Filters/StatusFilterBar"
import { CoachCarousel } from "./components/Lists/CoachCarousel"
import { ProgramList } from "./components/Lists/ProgramList"
import { ActivityModals } from "./components/Modals/ActivityModals"

// Sub-Screens
import TodayScreen from "@/components/shared/misc/TodayScreen"

export default function ActivityScreen() {
    const [isSearchOpen, setIsSearchOpen] = useState(false)

    const {
        // State
        activeTab,
        enrollments,
        coaches,
        isLoading,
        loadingCoaches,

        // Navigation
        showTodayScreen,
        selectedActivityId,
        selectedEnrollmentId,

        // Filters
        searchTerm, setSearchTerm,
        activityStatusTab, setActivityStatusTab,

        // Data
        meetCredits,
        enrollmentProgresses,

        // Actions
        handleActivityClick,
        handleBackToActivities,
        handleCoachClick,
        closeCoachModal,
        isCoachProfileModalOpen,
        selectedCoachForProfile,
        refreshData
    } = useActivityScreenLogic()

    // 1. Navigation Check: If TodayScreen/Detail is active, render it
    if (showTodayScreen && selectedActivityId) {
        return (
            <TodayScreen
                activityId={selectedActivityId}
                enrollmentId={selectedEnrollmentId}
                onBack={handleBackToActivities}
            />
        )
    }

    // 2. Prepare Data for UI
    const filteredEnrollments = filterEnrollments(enrollments, activityStatusTab, searchTerm, "all", enrollmentProgresses)

    const countMap = {
        "en-curso": enrollments.filter(e => calculateEnrollmentStatus(e, enrollmentProgresses[e.id] || 0) === 'activa').length,
        "por-empezar": enrollments.filter(e => calculateEnrollmentStatus(e, enrollmentProgresses[e.id] || 0) === 'pendiente').length,
        "finalizadas": enrollments.filter(e => ['finalizada', 'expirada'].includes(calculateEnrollmentStatus(e, enrollmentProgresses[e.id] || 0))).length
    }

    // 3. Render Main View
    return (
        <div className="flex flex-col min-h-screen bg-black pb-24">
            <div className="flex-1 flex flex-col space-y-2">
                {/* Filters + Search Toggle */}
                <StatusFilterBar
                    activeTab={activityStatusTab}
                    onTabChange={setActivityStatusTab}
                    countMap={countMap}
                    isSearchOpen={isSearchOpen}
                    onToggleSearch={() => {
                        setIsSearchOpen(!isSearchOpen)
                        if (isSearchOpen) setSearchTerm("") // Clear search on close
                    }}
                />

                {/* Search Input (Expandable) */}
                {isSearchOpen && (
                    <div className="px-6 mb-2 animate-in slide-in-from-top-2 fade-in duration-200">
                        <div className="relative">
                            <input
                                autoFocus
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar actividad..."
                                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#FF6A1A]/50 focus:bg-white/15 transition-all"
                            />
                        </div>
                    </div>
                )}

                {/* Coaches Carousel */}
                {!isSearchOpen && (
                    <div className={searchTerm ? "hidden" : "block"}>
                        <CoachCarousel
                            coaches={coaches.filter(c => enrollments.some(e => String(e.activity?.coach_id) === String(c.id)))}
                            loading={loadingCoaches}
                            meetCredits={meetCredits}
                            onCoachClick={handleCoachClick}
                        />
                    </div>
                )}

                {/* Main Activity List */}
                <div className="px-6 mb-2">
                    <h3 className="text-lg font-semibold text-white">
                        {searchTerm ? "Resultados de búsqueda" : "Tus actividades"}
                    </h3>
                </div>

                <ProgramList
                    enrollments={filteredEnrollments}
                    isLoading={isLoading}
                    onActivityClick={handleActivityClick}
                    onStartActivity={() => { }} // Hook handles start logic internally if needed, or pass prop
                    enrollmentProgresses={enrollmentProgresses}
                />
            </div>

            {/* Modals Container */}
            <ActivityModals
                selectedCoach={selectedCoachForProfile}
                isCoachModalOpen={isCoachProfileModalOpen}
                onCloseCoachModal={closeCoachModal}
            />
        </div>
    )
}
