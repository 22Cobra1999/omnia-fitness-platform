"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/shared/use-toast"
import { trackComponent, trackAPI } from "@/lib/logging/usage-tracker"
import type { Activity } from "@/types/activity"

// Types
export type Coach = {
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

// Constants (strictly matched to original search-screen.tsx)
export const SUGGESTIONS_MAP: Record<string, string[]> = {
    fitness: ["fuerza", "futbol", "aerobico", "funcional", "crossfit", "yoga", "pilates", "running", "masa muscular"],
    nutricion: ["mediterranea", "mejorar fisico", "keto", "paleo", "vegano", "vegetariano", "proteinas", "deficit calorico"],
    all: ["fuerza", "nutricion", "fitness", "yoga", "futbol", "masa muscular"]
}

export const COMMON_OBJECTIVES = [
    "pérdida de peso", "masa muscular", "resistencia", "flexibilidad", "salud mental", "bienestar", "rendimiento"
]

export const SPORTS = ["gym", "futbol", "basket", "atletismo", "natación", "padel", "tenis", "yoga", "funcional", "crossfit"]
export const DIETS = ["mediterranea", "keto", "paleo", "vegano", "vegetariano", "ayuno", "bajos carbos"]
export const DURATIONS = [
    { label: "+1 semana", value: "1w" },
    { label: "+1 mes", value: "1m" },
    { label: "+3 meses", value: "3m" }
]

const CACHE_DURATION = 5 * 60 * 1000

export function useSearchScreenLogic(initialData?: any) {
    const searchParams = useSearchParams()
    const { toast } = useToast()
    const router = useRouter()

    // UI States
    const [showAllActivities, setShowAllActivities] = useState(false)
    const [showAllCoaches, setShowAllCoaches] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [showFilters, setShowFilters] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<string>("all")
    const [selectedModality, setSelectedModality] = useState<string>("all")
    const [selectedProgramType, setSelectedProgramType] = useState<string>("all")
    const [selectedWorkshopType, setSelectedWorkshopType] = useState<string>("all")
    const [selectedSportDiet, setSelectedSportDiet] = useState<string>("all")
    const [selectedDuration, setSelectedDuration] = useState<string>("all")
    const [expandedSection, setExpandedSection] = useState<'coaches' | 'activities' | null>(null)
    const [selectedObjectives, setSelectedObjectives] = useState<string[]>([])
    const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)

    // Data States
    const [allActivities, setAllActivities] = useState<Activity[]>([])
    const [activities, setActivities] = useState<Activity[]>([])
    const [isLoadingActivities, setIsLoadingActivities] = useState(false)
    const [activitiesError, setActivitiesError] = useState<Error | null>(null)
    const activitiesCacheRef = useRef<{ data: Activity[]; timestamp: number } | null>(null)

    const [allCoaches, setAllCoaches] = useState<Coach[]>([])
    const [displayedCoaches, setDisplayedCoaches] = useState<Coach[]>([])
    const [isLoadingCoaches, setIsLoadingCoaches] = useState(false)
    const [coachesError, setCoachesError] = useState<Error | null>(null)

    // Modal & Navigation States
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
    const [isCoachProfileModalOpen, setIsCoachProfileModalOpen] = useState(false)
    const [selectedCoachForProfile, setSelectedCoachForProfile] = useState<Coach | null>(null)
    const [navigationContext, setNavigationContext] = useState<any>(undefined)
    const [navigationStack, setNavigationStack] = useState<Array<{
        type: 'activity' | 'coach'
        data: any
        context?: any
    }>>([])

    // Load Coaches
    const loadCoaches = useCallback(async () => {
        try {
            setIsLoadingCoaches(true)
            setCoachesError(null)
            trackAPI('/api/search-coaches', 'GET')
            const response = await fetch('/api/search-coaches')
            if (!response.ok) throw new Error('Failed to fetch coaches')
            const data = await response.json()
            const mapped = data.map((coach: any) => ({
                ...coach,
                name: coach.full_name || coach.name,
                specialization: coach.specialization || coach.specialty,
                experience_years: coach.experienceYears || coach.experience_years,
                location: coach.location || "No especificada",
                bio: coach.bio || coach.description,
                rating: coach.rating || 0,
                total_sessions: coach.totalReviews || coach.total_sessions || 0,
                total_products: coach.activities || coach.total_products || 0,
                certifications: coach.certifications || []
            }))
            setAllCoaches(mapped)
            setDisplayedCoaches(mapped)
        } catch (err) {
            setCoachesError(err instanceof Error ? err : new Error('Unknown error'))
        } finally {
            setIsLoadingCoaches(false)
        }
    }, [])

    // Load Activities
    const loadActivities = useCallback(async (forceRefresh = false) => {
        if (!forceRefresh && activitiesCacheRef.current) {
            const cacheAge = Date.now() - activitiesCacheRef.current.timestamp
            if (cacheAge < CACHE_DURATION) {
                setAllActivities(activitiesCacheRef.current.data)
                setActivities(activitiesCacheRef.current.data)
                return
            }
        }

        try {
            setIsLoadingActivities(true)
            setActivitiesError(null)
            trackAPI('/api/activities/search', 'GET')
            const response = await fetch('/api/activities/search')
            if (!response.ok) throw new Error('Failed to fetch activities')
            const data = await response.json()
            activitiesCacheRef.current = { data, timestamp: Date.now() }
            setAllActivities(data)
            setActivities(data)
        } catch (err) {
            setActivitiesError(err instanceof Error ? err : new Error('Unknown error'))
            if (activitiesCacheRef.current) {
                setAllActivities(activitiesCacheRef.current.data)
                setActivities(activitiesCacheRef.current.data)
            }
        } finally {
            setIsLoadingActivities(false)
        }
    }, [])

    const handleSearchChange = (value: string) => {
        setSearchTerm(value)
        if (value.length >= 1) {
            const currentCat = selectedCategory === 'all' ? 'all' : selectedCategory
            const relevant = SUGGESTIONS_MAP[currentCat] || SUGGESTIONS_MAP.all
            const filtered = relevant.filter(s => s.toLowerCase().includes(value.toLowerCase()))
            setSearchSuggestions(filtered)
            setShowSuggestions(filtered.length > 0)
        } else {
            setSearchSuggestions([])
            setShowSuggestions(false)
        }
    }

    const handleSuggestionClick = (suggestion: string) => {
        setSearchTerm(suggestion)
        setShowSuggestions(false)
    }

    // Filtering Logic (Strictly matched to original implementation)
    const filteredCoaches = useMemo(() => {
        return allCoaches.filter(coach => {
            const searchLower = searchTerm.toLowerCase()
            const matchesSearch = !searchTerm ||
                coach.name?.toLowerCase().includes(searchLower) ||
                coach.specialization?.toLowerCase().includes(searchLower) ||
                coach.bio?.toLowerCase().includes(searchLower)

            if (!matchesSearch) return false

            if (selectedCategory !== "all") {
                const specs = (coach.specialization || "").toLowerCase()
                const bio = (coach.bio || "").toLowerCase()
                if (selectedCategory === "fitness") {
                    if (!specs.includes("fitness") && !specs.includes("gym") && !specs.includes("deporte") && !bio.includes("fitness")) return false
                } else if (selectedCategory === "nutricion") {
                    if (!specs.includes("nutricion") && !specs.includes("dieta") && !bio.includes("nutricion")) return false
                }
            }

            if (selectedSportDiet !== "all") {
                const searchVal = selectedSportDiet.toLowerCase()
                const specs = (coach.specialization || "").toLowerCase()
                const bio = (coach.bio || "").toLowerCase()
                if (!specs.includes(searchVal) && !bio.includes(searchVal)) return false
            }

            if (selectedObjectives.length > 0) {
                const specs = (coach.specialization || "").toLowerCase()
                const bio = (coach.bio || "").toLowerCase()
                const hasMatch = selectedObjectives.some(obj => {
                    const lowObj = obj.toLowerCase()
                    return specs.includes(lowObj) || bio.includes(lowObj)
                })
                if (!hasMatch) return false
            }

            return true
        })
    }, [allCoaches, searchTerm, selectedCategory, selectedObjectives, selectedSportDiet])

    const filteredActivities = useMemo(() => {
        return allActivities.filter(activity => {
            const searchLower = searchTerm.toLowerCase()
            const title = activity.title?.toLowerCase() || ''
            const coachName = activity.coach_name?.toLowerCase() || ''
            const objetivos = (activity as any).objetivos || []

            const matchesSearch = !searchTerm ||
                title.includes(searchLower) ||
                coachName.includes(searchLower) ||
                objetivos.some((obj: string) => obj.toLowerCase().includes(searchLower))

            if (!matchesSearch) return false

            if (selectedCategory !== "all") {
                const actCat = (activity.categoria || "").toLowerCase()
                const targetCat = selectedCategory === "nutricion" ? "nutricion" : "fitness"
                if (actCat !== targetCat && actCat !== (targetCat === "nutricion" ? "nutrition" : "fitness")) return false
            }

            if (selectedModality !== "all") {
                const lowerTitle = title.toLowerCase()
                const actType = activity.type?.toLowerCase() || ""
                if (selectedModality === 'doc') {
                    if (!lowerTitle.includes('doc') && !actType.includes('doc')) return false
                } else if (selectedModality === 'taller') {
                    if (!lowerTitle.includes('taller') && !lowerTitle.includes('workshop') && !actType.includes('workshop')) return false
                } else if (selectedModality === 'programa') {
                    if (!lowerTitle.includes('programa') && !actType.includes('program')) return false
                }
            }

            if (selectedWorkshopType !== "all") {
                if (activity.workshop_type !== selectedWorkshopType) return false
            }

            if (selectedSportDiet !== "all") {
                const diet = (activity as any).dieta?.toLowerCase() || ""
                const sport = (activity as any).deporte?.toLowerCase() || ""
                const lowerSearchVal = selectedSportDiet.toLowerCase()
                if (!diet.includes(lowerSearchVal) && !sport.includes(lowerSearchVal) && !title.includes(lowerSearchVal)) return false
            }

            if (selectedObjectives.length > 0) {
                const hasMatch = selectedObjectives.some(obj => {
                    const lowObj = obj.toLowerCase()
                    return objetivos.some((aObj: any) => {
                        const target = (typeof aObj === 'string' ? aObj : (aObj?.name || aObj?.title || '')).toLowerCase()
                        return target.includes(lowObj)
                    })
                })
                if (!hasMatch) return false
            }

            if (selectedDuration !== "all") {
                const weeks = (activity as any).semanas_totales || activity.program_duration_weeks_months || 0
                if (selectedDuration === "1w" && weeks < 1) return false
                if (selectedDuration === "1m" && weeks < 4) return false
                if (selectedDuration === "3m" && weeks < 12) return false
            }

            return true
        })
    }, [allActivities, searchTerm, selectedCategory, selectedModality, selectedWorkshopType, selectedSportDiet, selectedDuration, selectedObjectives])

    // Interaction Handlers
    const handleActivityClick = useCallback((activity: Activity, fromCoachProfile = false, coachId?: string) => {
        // Al hacer click, sincronizar ID con la URL
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href)
            url.searchParams.set('id', String(activity.id))
            window.history.replaceState({ tab: 'search', activityId: activity.id }, '', url.toString())
        }

        setNavigationStack(prev => {
            let newStack = [...prev]
            if (fromCoachProfile && coachId && selectedCoachForProfile) {
                if (!newStack.some(item => item.type === 'coach' && item.data?.id === coachId)) {
                    newStack.push({ type: 'coach', data: selectedCoachForProfile })
                }
            }
            newStack.push({
                type: 'activity',
                data: activity,
                context: fromCoachProfile ? { fromCoachProfile: true, coachId } : null
            })
            return newStack
        })

        setSelectedActivity(activity)
        if (fromCoachProfile && coachId) {
            setNavigationContext({ fromCoachProfile: true, coachId })
            setIsCoachProfileModalOpen(false)
        } else {
            setNavigationContext(undefined)
        }
        setIsPreviewModalOpen(true)
    }, [selectedCoachForProfile])

    const handleCoachClick = useCallback(async (coachId: string) => {
        let coach = allCoaches.find(c => c.id === coachId)
        if (!coach) {
            try {
                const response = await fetch('/api/search-coaches')
                const data = await response.json()
                coach = data.find((c: any) => c.id === coachId)
            } catch (e) { }
        }

        if (coach) {
            setNavigationStack(prev => [...prev, {
                type: 'coach',
                data: coach,
                context: { fromSearch: true }
            }])
            setSelectedCoachForProfile(coach)
            setIsCoachProfileModalOpen(true)
            setIsPreviewModalOpen(false)
        }
    }, [allCoaches])

    const handleModalClose = useCallback(() => {
        // Al cerrar modal, limpiar ID de la URL
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href)
            url.searchParams.delete('id')
            window.history.replaceState({ tab: 'search' }, '', url.toString())
        }

        if (navigationStack.length === 0) {
            setIsPreviewModalOpen(false)
            setIsCoachProfileModalOpen(false)
            setSelectedActivity(null)
            setSelectedCoachForProfile(null)
            setNavigationContext(undefined)
            return
        }

        const newStack = navigationStack.slice(0, -1)
        setNavigationStack(newStack)
        const previousItem = newStack[newStack.length - 1]

        if (!previousItem) {
            setIsPreviewModalOpen(false)
            setIsCoachProfileModalOpen(false)
            setSelectedActivity(null)
            setSelectedCoachForProfile(null)
            setNavigationContext(undefined)
            return
        }

        if (previousItem.type === 'coach') {
            setSelectedCoachForProfile(previousItem.data)
            setIsCoachProfileModalOpen(true)
            setIsPreviewModalOpen(false)
            setSelectedActivity(null)
        } else if (previousItem.type === 'activity') {
            setSelectedActivity(previousItem.data)
            setNavigationContext(previousItem.context)
            setIsPreviewModalOpen(true)
            setIsCoachProfileModalOpen(false)
            setSelectedCoachForProfile(null)
        }
    }, [navigationStack])

    const clearAllFilters = useCallback(() => {
        setSearchTerm("");
        setSelectedCategory("all");
        setSelectedModality("all");
        setSelectedProgramType("all");
        setSelectedWorkshopType("all");
        setSelectedSportDiet("all");
        setSelectedDuration("all");
        setSelectedObjectives([]);
        setExpandedSection(null);
        setShowFilters(false);
    }, []);

    // Initial Load & Reset Listener
    useEffect(() => {
        loadCoaches()
        loadActivities()

        // Deep Linking Logic
        const params = new URLSearchParams(window.location.search)
        const activityId = params.get('id')
        if (activityId) {
            // We need to wait for activities to load, or fetch this specific one if not in list (though list is all)
            // Ideally, we wait for 'allActivities' to be populated.
            // However, since loadActivities sets state, we can depend on it.
        }

        const handleReset = (event: CustomEvent) => {
            if (event.detail?.tab === 'search') {
                setSearchTerm("")
                setSelectedCategory("all")
                setSelectedModality("all")
                setShowFilters(false)
                setSelectedObjectives([])
                setNavigationStack([])
                setIsPreviewModalOpen(false)
                setIsCoachProfileModalOpen(false)

                // Clear ID from URL when resetting tab
                const url = new URL(window.location.href)
                url.searchParams.delete('id')
                window.history.replaceState({ tab: 'search' }, '', url.toString())

                window.scrollTo({ top: 0, behavior: 'smooth' })
            }
        }
        window.addEventListener('reset-tab-to-origin', handleReset as EventListener)
        return () => window.removeEventListener('reset-tab-to-origin', handleReset as EventListener)
    }, [loadCoaches, loadActivities])

    // Deep Link Effect: Open Modal when Activities Load or initialData provided
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const activityId = params.get('id')

        if (activityId) {
            console.log("🔗 [useSearchScreenLogic] Deep Link detected in URL:", activityId, {
                hasInitialData: !!initialData,
                allActivitiesCount: allActivities.length,
                isPreviewModalOpen,
                selectedActivityId: selectedActivity?.id
            })
        }

        // 1. Prefer initialData if it matches the ID (avoids waiting for search fetch or missing items)
        if (initialData && String(initialData.id) === String(activityId) && !isPreviewModalOpen && !selectedActivity) {
            console.log("🚀 [useSearchScreenLogic] Deep Link MATCH (Initial Data)! Opening modal for:", initialData.title)
            setSelectedActivity(initialData)
            setIsPreviewModalOpen(true)
            return
        }

        // 2. Fallback to searching in allActivities list
        if (activityId && allActivities.length > 0 && !isPreviewModalOpen && !selectedActivity) {
            // Ensure ID comparison is robust (string vs potential number in DB)
            const targetActivity = allActivities.find(a => String(a.id) === String(activityId))
            if (targetActivity) {
                console.log("🚀 [useSearchScreenLogic] Deep Link MATCH (List)! Opening modal for:", targetActivity.title)
                setSelectedActivity(targetActivity)
                setIsPreviewModalOpen(true)
            } else {
                console.log("❌ [useSearchScreenLogic] Deep Link activity NOT found in list. Searched for:", activityId)
            }
        }
    }, [allActivities, isPreviewModalOpen, selectedActivity, searchParams, initialData])

    return {
        // State
        searchTerm,
        showFilters,
        selectedCategory,
        selectedModality,
        selectedProgramType,
        selectedWorkshopType,
        selectedSportDiet,
        selectedDuration,
        expandedSection,
        selectedObjectives,
        searchSuggestions,
        showSuggestions,
        isLoadingCoaches,
        isLoadingActivities,
        displayedCoaches: filteredCoaches,
        activities: filteredActivities,
        allCoaches,
        allActivities,
        showAllActivities,
        showAllCoaches,
        coachesError,
        activitiesError,

        // Modal State
        selectedActivity,
        isPreviewModalOpen,
        isCoachProfileModalOpen,
        setIsCoachProfileModalOpen,
        selectedCoachForProfile,
        setSelectedCoachForProfile,
        navigationContext,

        // Actions
        setSearchTerm,
        handleSearchChange,
        handleSuggestionClick,
        setShowFilters,
        setSelectedCategory,
        setSelectedModality,
        setSelectedProgramType,
        setSelectedWorkshopType,
        setSelectedSportDiet,
        setSelectedDuration,
        setExpandedSection,
        setSelectedObjectives,
        setShowSuggestions,
        setShowAllActivities,
        setShowAllCoaches,
        handleActivityClick,
        handleCoachClick,
        handleModalClose,
        handleRetry: () => { loadCoaches(); loadActivities(true); },
        clearAllFilters,
        preloadCoach: (id: string, coach: any) => { }, // Mocked to match original usage
        setNavigationStack, // Directly expose for specific original usages
    }
}
