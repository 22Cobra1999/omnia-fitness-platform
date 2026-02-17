"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Star,
  Loader2,
  ShoppingCart,
  ChevronRight,
  User,
  X,
  Search,
  Filter,
  ChevronDown,
  ArrowLeft,
  ChefHat,
  Dumbbell,
  Zap,
} from "lucide-react"
import Image from "next/image"
import { trackComponent, trackAPI } from '@/lib/logging/usage-tracker'
import { extractVimeoId } from "@/utils/vimeo-utils"
import { VimeoPlayer } from '@/components/shared/video/vimeo-player'
import { useToast } from '@/hooks/shared/use-toast'
import Link from "next/link"
import { PurchaseActivityModal } from '@/components/shared/activities/purchase-activity-modal'
import ClientProductModal from '@/components/client/activities/client-product-modal'
import CoachProfileCard from '@/components/coach/clients/CoachProfileCard'
import ActivityCard from '@/components/shared/activities/ActivityCard'
import ProductPreviewModal from '@/components/shared/products/product-preview-modal'
import CoachProfileModal from "@/components/coach/CoachProfileModal"
import { NoCoachesFallback, NoActivitiesFallback, NetworkErrorFallback, LoadingFallback } from '@/components/shared/misc/fallback-states'
import { CoachCardSkeleton, ActivityCardSkeleton } from '@/components/shared/ui/global-loading'
import type { Activity } from "@/types/activity"
import { useSearchScreenLogic } from '@/hooks/mobile/useSearchScreenLogic'

type Coach = {
  id: string
  name: string
  email: string
  avatar_url?: string
  bio?: string
  specialties?: string[]
  rating?: number
  total_clients?: number
  total_earnings?: number
  total_products?: number
  total_sessions?: number
  experience_years?: number
  certifications?: string[]
  specialization?: string
  location?: string
  full_name?: string
}

type Account = {
  id: string
  name: string
  email: string
  avatar_url?: string
}

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
    searchSuggestions,
    showSuggestions,
    setShowSuggestions,
    isLoadingCoaches: isLoading,
    isLoadingActivities,
    displayedCoaches: filteredCoaches,
    activities: filteredActivities,
    allActivities,
    setShowAllActivities,
    showAllCoaches,
    setShowAllCoaches,
    coachesError: error,
    activitiesError,
    handleRetry,
    clearAllFilters,
    handleSearchChange,
    handleSuggestionClick,
    handleActivityClick,
    handleCoachClick,
    handleModalClose,
    selectedActivity,
    isPreviewModalOpen,
    isCoachProfileModalOpen,
    setIsCoachProfileModalOpen,
    selectedCoachForProfile,
    setSelectedCoachForProfile,
    navigationContext,
    setNavigationStack,
    preloadCoach,
  } = useSearchScreenLogic()

  useEffect(() => {
    trackComponent('SearchScreen')
  }, [])

  const { toast } = useToast()
  const router = useRouter()

  // Constants strictly matched to original
  const SPORTS = ["gym", "futbol", "basket", "atletismo", "natación", "padel", "tenis", "yoga", "funcional", "crossfit"]
  const DIETS = ["mediterranea", "keto", "paleo", "vegano", "vegetariano", "ayuno", "bajos carbos"]
  const COMMON_OBJECTIVES = ["pérdida de peso", "masa muscular", "resistencia", "flexibilidad", "salud mental", "bienestar", "rendimiento"]
  const DURATIONS = [
    { label: "+1 semana", value: "1w" },
    { label: "+1 mes", value: "1m" },
    { label: "+3 meses", value: "3m" }
  ]

  // Alias for original JSX compatibility
  const activities = filteredActivities
  const displayedCoaches = filteredCoaches

  return (
    <div className="flex flex-col h-full bg-[#121212] text-white overflow-y-auto pt-4 pb-32 overscroll-auto touch-pan-y selection:bg-[#FF7939]/30">
      <div className="px-4">
        {/* Header inicial compacto cuando NO está expandido */}
        {!expandedSection && (
          <div className="mb-4 mt-0.5">
            <div className="flex items-center gap-3">
              {/* Buscador Compacto */}
              <div className="relative flex-1 group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#FF7939]/10 to-transparent rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#FF7939] transition-colors" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Coach o actividad..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-[#FF7939]/50 focus:bg-white/10 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Botón de Filtro */}
              <button
                onClick={() => {
                  if (showFilters) {
                    clearAllFilters();
                  } else {
                    setShowFilters(true);
                  }
                }}
                className={`w-11 h-11 rounded-2xl border transition-all flex items-center justify-center flex-shrink-0 ${showFilters
                  ? 'bg-red-500 border-red-500 text-white'
                  : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                  }`}
              >
                {showFilters ? <X className="w-5 h-5" /> : <Filter className="w-5 h-5" />}
              </button>
            </div>

            {/* Filtros Paso a Paso Minimistas */}
            {(showFilters || searchTerm) && (
              <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
                {/* Paso 1: Fitness / Nutrición */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
                  {[
                    { id: 'fitness', label: 'Fitness', icon: <Dumbbell className="w-3 h-3" /> },
                    { id: 'nutricion', label: 'Nutrición', icon: <ChefHat className="w-3 h-3" /> }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[11px] font-bold transition-all whitespace-nowrap ${selectedCategory === cat.id
                        ? 'bg-[#FF7939] border-[#FF7939] text-white'
                        : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                        }`}
                    >
                      {cat.icon}
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Paso 2: Modality (Doc / Taller / Program) - Only if category selected */}
                {selectedCategory !== 'all' && (
                  <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5 animate-in slide-in-from-left-2 duration-200">
                    {[
                      { id: 'doc', label: 'Documento' },
                      { id: 'taller', label: 'Taller' },
                      { id: 'programa', label: 'Programa' }
                    ].map(mod => (
                      <button
                        key={mod.id}
                        onClick={() => setSelectedModality(mod.id)}
                        className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all whitespace-nowrap ${selectedModality === mod.id
                          ? 'bg-white/20 border-white/30 text-white'
                          : 'bg-white/5 border-white/5 text-white/30 hover:bg-white/10'
                          }`}
                      >
                        {mod.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Paso 3: Workshop Subtype - Only if Taller selected */}
                {selectedModality === 'taller' && (
                  <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5 animate-in slide-in-from-left-2 duration-200">
                    {[
                      { id: 'grupal', label: 'Grupal' },
                      { id: 'individual', label: 'Individual' }
                    ].map(type => (
                      <button
                        key={type.id}
                        onClick={() => setSelectedWorkshopType(type.id)}
                        className={`px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all ${selectedWorkshopType === type.id
                          ? 'bg-[#FF7939]/30 border-[#FF7939] text-[#FF7939]'
                          : 'bg-white/5 border-white/5 text-white/30 hover:bg-white/10'
                          }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Paso 4: Deporte / Dieta / Objetivos / Tiempo (Dropdowns row) */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
                  <select
                    value={selectedSportDiet}
                    onChange={(e) => setSelectedSportDiet(e.target.value)}
                    className="bg-white/5 border border-white/5 rounded-xl px-3 py-1.5 text-[10px] text-white/50 focus:outline-none appearance-none"
                  >
                    <option value="all" className="bg-[#121212]">{selectedCategory === 'nutricion' ? 'Dieta/Tipo' : 'Deporte/Tipo'}</option>
                    {(selectedCategory === 'nutricion' ? DIETS : SPORTS).map(item => (
                      <option key={item} value={item} className="bg-[#121212]">{item}</option>
                    ))}
                  </select>

                  <select
                    className="bg-white/5 border border-white/5 rounded-xl px-3 py-1.5 text-[10px] text-white/50 focus:outline-none appearance-none"
                    onChange={(e) => {
                      const val = e.target.value
                      if (val !== "all") {
                        setSelectedObjectives(prev => prev.includes(val) ? prev.filter(o => o !== val) : [...prev, val])
                      }
                      e.target.value = "all"
                    }}
                  >
                    <option value="all" className="bg-[#121212]">Objetivo</option>
                    {COMMON_OBJECTIVES.map(obj => (
                      <option key={obj} value={obj} className="bg-[#121212]">{obj}</option>
                    ))}
                  </select>

                  <select
                    value={selectedDuration}
                    onChange={(e) => setSelectedDuration(e.target.value)}
                    className="bg-white/5 border border-white/5 rounded-xl px-3 py-1.5 text-[10px] text-white/50 focus:outline-none appearance-none"
                  >
                    <option value="all" className="bg-[#121212]">Duración</option>
                    {DURATIONS.map(d => (
                      <option key={d.value} value={d.value} className="bg-[#121212]">{d.label}</option>
                    ))}
                  </select>
                </div>

                {selectedObjectives.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedObjectives.map(obj => (
                      <span key={obj} className="flex items-center gap-1 bg-[#FF7939]/10 border border-[#FF7939]/20 px-2 py-0.5 rounded-lg text-[9px] font-bold text-[#FF7939]">
                        {obj}
                        <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => setSelectedObjectives(prev => prev.filter(o => o !== obj))} />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Header integrado cuando está expandido */}
        {expandedSection && (
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setExpandedSection(null)
                  setShowAllCoaches(false)
                  setShowAllActivities(false)
                }}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-[#FF7939] hover:bg-white/10 transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className="flex flex-1 items-center gap-2 overflow-hidden">
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {[
                    { id: 'fitness', label: 'Fitness', icon: <Dumbbell className="w-3 h-3" /> },
                    { id: 'nutricion', label: 'Nutrición', icon: <ChefHat className="w-3 h-3" /> },
                    ...(expandedSection === 'coaches' ? [{ id: 'general', label: 'General', icon: <Zap className="w-3 h-3" /> }] : [])
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${selectedCategory === cat.id
                        ? 'bg-[#FF7939] border-[#FF7939] text-white shadow-[0_0_10px_rgba(255,121,57,0.2)]'
                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                        }`}
                    >
                      {cat.icon}
                      <span className="text-[11px] font-bold whitespace-nowrap">{cat.label}</span>
                    </button>
                  ))}
                </div>

                <div className="relative flex-1 min-w-[120px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Buscar..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-[#FF7939]/50 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pl-1">
              <div className="text-xs text-white/40">
                <span className="text-[#FF7939] font-black">
                  {expandedSection === 'coaches' ? filteredCoaches.length : filteredActivities.length}
                </span> resultados
              </div>

              {searchTerm && (
                <div className="flex items-center gap-2 bg-[#FF7939]/10 border border-[#FF7939]/20 px-3 py-1 rounded-full">
                  <span className="text-[11px] font-bold text-[#FF7939]">{searchTerm}</span>
                  <button onClick={() => setSearchTerm("")}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {(expandedSection === null || expandedSection === 'coaches') && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold flex items-center text-white/60 uppercase tracking-wider">
                <User className="h-4 w-4 mr-1.5 text-[#FF7939]/70" />
                Coaches
              </h2>
            </div>

            {isLoading && !filteredCoaches.length && (
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 className="h-8 w-8 text-[#FF7939] animate-spin mb-2" />
                <p className="text-gray-400 animate-pulse">Cargando coaches...</p>
              </div>
            )}

            {!isLoading && error && (
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

            {!isLoading && !error && filteredCoaches.length === 0 && (
              <NoCoachesFallback onRetry={handleRetry} />
            )}

            {!isLoading && !error && filteredCoaches.length > 0 && (
              <div className="overflow-x-auto no-scrollbar">
                <div className="flex gap-4 pb-4 px-1" style={{ minWidth: "min-content" }}>
                  {filteredCoaches.map((coach) => (
                    <CoachProfileCard
                      key={coach.id}
                      coach={coach}
                      size="small"
                      onClick={() => handleCoachClick(coach.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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
                    {activities.map((activity) => (
                      <ActivityCard
                        key={activity.id}
                        activity={activity}
                        size="small"
                        onClick={() => handleActivityClick(activity)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedActivity && (
          <ClientProductModal
            product={selectedActivity}
            isOpen={isPreviewModalOpen}
            onClose={handleModalClose}
            navigationContext={navigationContext}
            onCoachClick={handleCoachClick}
          />
        )}

        {selectedCoachForProfile && (
          <CoachProfileModal
            coach={selectedCoachForProfile}
            isOpen={isCoachProfileModalOpen}
            onClose={handleModalClose}
            onActivityClick={handleActivityClick}
            preloadedActivities={allActivities}
          />
        )}
      </div>
    </div>
  )
}
