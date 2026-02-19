"use client"

import { useEffect } from "react"
import { trackComponent } from '@/lib/logging/usage-tracker'
import { useSearchScreenLogic } from '@/hooks/mobile/useSearchScreenLogic'

// Modular Components
import { SearchHeader } from "./search/SearchHeader"
import { SearchFilters } from "./search/SearchFilters"
import { SearchResults } from "./search/SearchResults"
import { SearchModals } from "./search/SearchModals"

interface SearchScreenProps {
  onTabChange?: (tab: string) => void;
}

export function SearchScreen({ onTabChange }: SearchScreenProps) {
  const {
    searchTerm,
    setSearchTerm,
    showFilters,
    setShowFilters,
    selectedCategory,
    setSelectedCategory,
    selectedModality,
    setSelectedModality,
    selectedWorkshopType,
    setSelectedWorkshopType,
    selectedSportDiet,
    setSelectedSportDiet,
    selectedDuration,
    setSelectedDuration,
    expandedSection,
    setExpandedSection,
    selectedObjectives,
    setSelectedObjectives,
    isLoadingCoaches,
    isLoadingActivities,
    displayedCoaches,
    activities,
    allActivities,
    setShowAllActivities,
    setShowAllCoaches,
    coachesError,
    activitiesError,
    handleRetry,
    clearAllFilters,
    handleSearchChange,
    handleActivityClick,
    handleCoachClick,
    handleModalClose,
    selectedActivity,
    isPreviewModalOpen,
    isCoachProfileModalOpen,
    selectedCoachForProfile,
    navigationContext,
  } = useSearchScreenLogic()

  useEffect(() => {
    trackComponent('SearchScreen')
  }, [])

  // Constants strictly matched to original
  const SPORTS = ["gym", "futbol", "basket", "atletismo", "natación", "padel", "tenis", "yoga", "funcional", "crossfit"]
  const DIETS = ["mediterranea", "keto", "paleo", "vegano", "vegetariano", "ayuno", "bajos carbos"]
  const COMMON_OBJECTIVES = ["pérdida de peso", "masa muscular", "resistencia", "flexibilidad", "salud mental", "bienestar", "rendimiento"]
  const DURATIONS = [
    { label: "+1 semana", value: "1w" },
    { label: "+1 mes", value: "1m" },
    { label: "+3 meses", value: "3m" }
  ]

  return (
    <div className="flex flex-col h-full bg-[#121212] text-white overflow-y-auto pt-4 pb-32 overscroll-auto touch-pan-y selection:bg-[#FF7939]/30">
      <SearchHeader
        expandedSection={expandedSection}
        searchTerm={searchTerm}
        handleSearchChange={handleSearchChange}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        clearAllFilters={clearAllFilters}
        setExpandedSection={setExpandedSection}
        setShowAllCoaches={setShowAllCoaches}
        setShowAllActivities={setShowAllActivities}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        resultsCount={expandedSection === 'coaches' ? displayedCoaches.length : activities.length}
      />

      {/* Filtros Paso a Paso Minimistas - Only in compact state */}
      {!expandedSection && (showFilters || searchTerm) && (
        <SearchFilters
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedModality={selectedModality}
          setSelectedModality={setSelectedModality}
          selectedWorkshopType={selectedWorkshopType}
          setSelectedWorkshopType={setSelectedWorkshopType}
          selectedSportDiet={selectedSportDiet}
          setSelectedSportDiet={setSelectedSportDiet}
          selectedDuration={selectedDuration}
          setSelectedDuration={setSelectedDuration}
          selectedObjectives={selectedObjectives}
          setSelectedObjectives={setSelectedObjectives}
          DIETS={DIETS}
          SPORTS={SPORTS}
          COMMON_OBJECTIVES={COMMON_OBJECTIVES}
          DURATIONS={DURATIONS}
        />
      )}

      <SearchResults
        expandedSection={expandedSection}
        isLoadingCoaches={isLoadingCoaches}
        isLoadingActivities={isLoadingActivities}
        coachesError={coachesError}
        activitiesError={activitiesError}
        displayedCoaches={displayedCoaches}
        activities={activities}
        handleRetry={handleRetry}
        handleCoachClick={handleCoachClick}
        handleActivityClick={handleActivityClick}
      />

      <SearchModals
        selectedActivity={selectedActivity}
        isPreviewModalOpen={isPreviewModalOpen}
        handleModalClose={handleModalClose}
        navigationContext={navigationContext}
        handleCoachClick={handleCoachClick}
        selectedCoachForProfile={selectedCoachForProfile}
        isCoachProfileModalOpen={isCoachProfileModalOpen}
        handleActivityClick={handleActivityClick}
        allActivities={allActivities}
      />
    </div>
  )
}
