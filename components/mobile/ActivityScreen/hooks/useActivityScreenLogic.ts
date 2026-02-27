"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from '@/lib/supabase/supabase-client'
import type { Activity, Enrollment } from "@/types/activity"
import { toast } from "@/components/ui/use-toast"

export interface Coach {
    id: string
    full_name: string
    specialization?: string
    specialty_detail?: string
    experience_years?: number
    rating?: number
    total_reviews?: number
    avatar_url?: string // Normalized
    bio?: string
    user_profile?: {
        avatar_url?: string
        bio?: string
    }
}

interface UseActivityScreenLogicProps {
    initialTab?: string
}

export function useActivityScreenLogic({ initialTab = "purchased" }: UseActivityScreenLogicProps = {}) {
    // --- STATE ---
    const [activeTab, setActiveTab] = useState(initialTab)
    const [enrollments, setEnrollments] = useState<Enrollment[]>([])
    const [coaches, setCoaches] = useState<Coach[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [loadingCoaches, setLoadingCoaches] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Navigation State
    const [showTodayScreen, setShowTodayScreen] = useState(false)
    const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)
    const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null)

    // Filters State
    const [searchTerm, setSearchTerm] = useState("")
    const [activityStatusTab, setActivityStatusTab] = useState<"en-curso" | "por-empezar" | "finalizadas">("en-curso")

    // Modals State
    const [selectedCoachForProfile, setSelectedCoachForProfile] = useState<Coach | null>(null)
    const [isCoachProfileModalOpen, setIsCoachProfileModalOpen] = useState(false)

    // Data State
    const [meetCredits, setMeetCredits] = useState<Record<string, number>>({})
    const [enrollmentProgresses, setEnrollmentProgresses] = useState<Record<string, number>>({})

    const supabase = getSupabaseClient()
    const router = useRouter()

    // --- HELPERS ---
    const getCategoryFromType = (type: string): string => {
        if (!type) return "otros"
        const t = type.toLowerCase()
        if (t.includes("nutri")) return "nutricion"
        if (t.includes("fitness") || t.includes("entrena")) return "fitness"
        if (t.includes("yoga")) return "yoga"
        return "otros"
    }

    // --- ACTIONS ---

    // Handle Activity Click
    const handleActivityClick = useCallback((activityId: string, enrollmentId?: string) => {
        setSelectedActivityId(activityId)
        if (enrollmentId) {
            setSelectedEnrollmentId(enrollmentId)

            // Sync URL with Enrollment ID (UUID) instead of Activity ID to avoid ambiguity
            const url = new URL(window.location.href)
            url.searchParams.set('id', enrollmentId)
            window.history.replaceState({ tab: 'activity', id: enrollmentId }, '', url.toString())
            console.log("🔗 [useActivityScreenLogic] URL synced with enrollment ID:", enrollmentId)
        }
        setShowTodayScreen(true)
    }, [])

    // Handle Back Navigation
    const handleBackToActivities = useCallback(() => {
        setShowTodayScreen(false)
        setSelectedActivityId(null)
        setSelectedEnrollmentId(null)

        // Clear ID from URL when going back to list
        const url = new URL(window.location.href)
        url.searchParams.delete('id')
        window.history.replaceState({ tab: 'activity' }, '', url.toString())
    }, [])

    // Handle Coach Click
    const handleCoachClick = useCallback((coachId: string) => {
        const coach = coaches.find(c => c.id === coachId)
        if (coach) {
            setSelectedCoachForProfile(coach)
            setIsCoachProfileModalOpen(true)
        }
    }, [coaches])

    const closeCoachModal = useCallback(() => {
        setIsCoachProfileModalOpen(false)
        setSelectedCoachForProfile(null)
    }, [])

    // --- DATA FETCHING ---

    // Helper: Calculate Progress for Enrollments
    const fetchEnrollmentProgresses = useCallback(async (currentEnrollments: Enrollment[]) => {
        if (!currentEnrollments.length) return

        const enrollmentIds = currentEnrollments.map(e => e.id)

        // Fetch all progress records for these enrollments
        const { data, error } = await supabase
            .from('progreso_diario_actividad')
            .select('enrollment_id, items_objetivo, items_completados')
            .in('enrollment_id', enrollmentIds)

        if (error) {
            console.error("Error fetching progress details:", error)
            return
        }

        if (!data) return

        const progressMap: Record<string, number> = {}

        // Group by enrollment_id
        const grouped = data.reduce((acc: any, curr: any) => {
            if (!acc[curr.enrollment_id]) {
                acc[curr.enrollment_id] = { total: 0, completed: 0 }
            }
            acc[curr.enrollment_id].total += (curr.items_objetivo || 0)
            acc[curr.enrollment_id].completed += (curr.items_completados || 0)
            return acc
        }, {})

        // Calculate %
        Object.keys(grouped).forEach(enrollmentId => {
            const { total, completed } = grouped[enrollmentId]
            if (total === 0) {
                progressMap[enrollmentId] = 0
            } else {
                progressMap[enrollmentId] = Math.round((completed / total) * 100)
            }
        })

        setEnrollmentProgresses(prev => ({ ...prev, ...progressMap }))

    }, [])

    // 1. Fetch User Enrollments
    const fetchUserEnrollments = useCallback(async (silentUpdate = false) => {
        if (!silentUpdate) setIsLoading(true)
        setError(null)

        try {
            // Authenticate User
            let user = null
            const { data: userData } = await supabase.auth.getUser()
            if (userData?.user) {
                user = userData.user
            } else {
                const { data: sessionData } = await supabase.auth.getSession()
                if (sessionData?.session?.user) {
                    user = sessionData.session.user
                }
            }

            if (!user) {
                if (!silentUpdate) setIsLoading(false)
                return
            }

            // Fetch Enrollments
            const { data, error: enrollmentsError } = await supabase
                .from("activity_enrollments")
                .select(`
          id, activity_id, client_id, status, created_at, start_date, expiration_date, program_end_date,
          activity:activities!activity_enrollments_activity_id_fkey (
            id, title, description, type, difficulty, price, coach_id, categoria, dias_acceso,
            media:activity_media!activity_media_activity_id_fkey (image_url, video_url),
            coaches:coaches!activities_coach_id_fkey (id, full_name, specialization)
          )
        `)
                .eq("client_id", user.id)
                .order("created_at", { ascending: false })
                .limit(20)

            if (enrollmentsError) throw enrollmentsError

            if (!data || data.length === 0) {
                setEnrollments([])
                if (!silentUpdate) setIsLoading(false)
                return
            }

            // Format Data
            const formattedEnrollments = data.map((enrollment: any) => {
                if (!enrollment.activity) return null
                return {
                    ...enrollment,
                    activity: {
                        ...enrollment.activity,
                        media: enrollment.activity.media ? enrollment.activity.media[0] : null,
                        program_info: null,
                        coach_name: enrollment.activity.coaches?.full_name || "Coach",
                        // Preservar categoria directamente de la base de datos
                        categoria: enrollment.activity.categoria || getCategoryFromType(enrollment.activity.type || ""),
                        category: enrollment.activity.categoria || getCategoryFromType(enrollment.activity.type || ""),
                    },
                }
            }).filter(Boolean) as Enrollment[]

            setEnrollments(formattedEnrollments)

            // 1.5 Fetch Surveys for these enrollments
            const enrollmentIds = formattedEnrollments.map(e => e.id)
            const { data: surveys } = await supabase
                .from('activity_surveys')
                .select('*') // Select all fields to ensure we get everything
                .in('enrollment_id', enrollmentIds)

            if (surveys && surveys.length > 0) {
                const updatedEnrollments = formattedEnrollments.map(enr => {
                    const survey = surveys.find((s: any) => s.enrollment_id === enr.id)
                    if (survey) {
                        return {
                            ...enr,
                            rating_coach: survey.coach_method_rating || null,
                            feedback_text: survey.comments || null,
                            difficulty_rating: survey.difficulty_rating || null,
                            would_repeat: survey.would_repeat,
                            calificacion_omnia: survey.calificacion_omnia || null,
                            comentarios_omnia: survey.comentarios_omnia || null,
                            workshop_version: survey.workshop_version || null
                        }
                    }
                    return enr
                })
                setEnrollments(updatedEnrollments)
            }

            // Trigger Progress Fetch
            fetchEnrollmentProgresses(formattedEnrollments)

            // Cache logic could go here
            try {
                if (!silentUpdate && formattedEnrollments.length > 0) {
                    sessionStorage.setItem("cached_enrollments", JSON.stringify(formattedEnrollments))
                    sessionStorage.setItem("enrollments_cache_timestamp", Date.now().toString())
                }
            } catch (e) {
                console.error("Cache error", e)
            }

        } catch (err) {
            console.error("Error fetching enrollments:", err)
            setError("Error al cargar tus actividades")
        } finally {
            if (!silentUpdate) setIsLoading(false)
        }
    }, [fetchEnrollmentProgresses]) // Dependency needed

    // 2. Load Coaches
    const loadCoaches = useCallback(async () => {
        setLoadingCoaches(true)

        // Try Cache First
        try {
            const cachedCoaches = sessionStorage.getItem("cached_activity_coaches")
            const coachesTimestamp = Number(sessionStorage.getItem("activity_coaches_cache_timestamp") || "0")

            if (cachedCoaches && Date.now() - coachesTimestamp < 15 * 60 * 1000) {
                const parsed = JSON.parse(cachedCoaches)
                if (parsed && parsed.length > 0) {
                    setCoaches(parsed)
                    setLoadingCoaches(false)
                    // Fetch in background to update
                    fetch('/api/search-coaches').then(res => res.json()).then(data => {
                        const mapped = mapCoachesData(data)
                        setCoaches(mapped)
                        sessionStorage.setItem("cached_activity_coaches", JSON.stringify(mapped))
                        sessionStorage.setItem("activity_coaches_cache_timestamp", Date.now().toString())
                    }).catch(e => console.error("Background coach update failed", e))
                    return
                }
            }
        } catch (e) {
            console.error("Cache read error", e)
        }

        try {
            const response = await fetch("/api/search-coaches")
            if (!response.ok) {
                throw new Error(`Error fetching coaches: ${response.statusText}`)
            }
            const coachesData = await response.json()

            if (!coachesData || coachesData.length === 0) {
                setCoaches([])
                return
            }

            const mappedCoaches = mapCoachesData(coachesData)
            setCoaches(mappedCoaches)

            // Cache
            try {
                sessionStorage.setItem("cached_activity_coaches", JSON.stringify(mappedCoaches))
                sessionStorage.setItem("activity_coaches_cache_timestamp", Date.now().toString())
            } catch (cacheError) {
                console.warn("No se pudo guardar en caché:", cacheError)
            }
        } catch (error) {
            console.error("Error al cargar coaches:", error)
            // Keep existing coaches if any, or set empty? 
            // setCoaches([]) // Don't clear if we have cache, but here we might not.
        } finally {
            setLoadingCoaches(false)
        }
    }, [])

    // Helper to map coach data consistently
    const mapCoachesData = (data: any[]): Coach[] => {
        return data.map((coach: any) => ({
            ...coach,
            name: coach.full_name || coach.name,
            specialization: coach.specialization || coach.specialty || "GENERAL",
            experience_years: coach.experienceYears || coach.experience_years,
            location: coach.location || "No especificada",
            bio: coach.bio || coach.description,
            rating: coach.rating || 0,
            total_reviews: coach.totalReviews || coach.total_sessions || 0,
            avatar_url: coach.avatar_url || coach.user_profile?.avatar_url,
            user_profile: {
                avatar_url: coach.avatar_url,
                bio: coach.bio || coach.description
            }
        }))
    }

    // 3. Meet Credits
    const fetchMeetCredits = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('client_meet_credits_ledger')
            .select('coach_id, meet_credits_available')
            .eq('client_id', user.id)

        if (!error && data) {
            const creditsMap: Record<string, number> = {}
            data.forEach((item: any) => {
                creditsMap[item.coach_id] = item.meet_credits_available
            })
            setMeetCredits(creditsMap)
        }
    }, [])

    // --- EFFECTS ---

    // Check for Pending Navigation (LocalStorage or URL)
    useEffect(() => {
        const checkForPendingNavigation = () => {
            if (typeof window === 'undefined') return

            // 1. Check URL Params (Deep Linking / SEO)
            // This is crucial for the /activity/[id] landing page
            const params = new URLSearchParams(window.location.search)
            const activityIdParam = params.get('id')

            if (activityIdParam && enrollments.length > 0) {
                console.log("🔗 [useActivityScreenLogic] Deep Link detected for Activity:", activityIdParam)

                // Determine if ID is an Enrollment UUID or an Activity ID (Number)
                const isEnrollmentUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(activityIdParam)

                // Priority: Match by Enrollment ID (works for UUIDs in prod and numeric IDs in local)
                let matchingEnrollment = enrollments.find(e => String(e.id) === String(activityIdParam))

                // Fallback: Match by Activity ID if not found and not a UUID
                if (!matchingEnrollment && !isEnrollmentUuid) {
                    matchingEnrollment = enrollments.find(e => String(e.activity_id) === String(activityIdParam))
                }

                if (matchingEnrollment) {
                    const progress = enrollmentProgresses[matchingEnrollment.id] || 0
                    const { calculateEnrollmentStatus } = require('../utils')
                    const status = calculateEnrollmentStatus(matchingEnrollment, progress)

                    if (status === 'finalizada' || status === 'expirada') {
                        console.log("🚩 [useActivityScreenLogic] Activity is FINISHED/EXPIRED. Bouncing to list.")
                        setActivityStatusTab("finalizadas")
                        setShowTodayScreen(false)
                        setSelectedActivityId(null)
                    } else {
                        console.log("✅ [useActivityScreenLogic] Activity found. Opening detail.")
                        setSelectedActivityId(String(matchingEnrollment.activity_id))
                        setSelectedEnrollmentId(matchingEnrollment.id)
                        setShowTodayScreen(true)
                    }
                } else {
                    // Fallback: If not found in current list, but it's not a UUID, it might be a new purchase or something we don't have yet
                    if (!isEnrollmentUuid) {
                        console.log("❓ [useActivityScreenLogic] Deep link activity ID not found in current enrollments. Attempting open.")
                        setSelectedActivityId(activityIdParam)
                        setShowTodayScreen(true)
                    } else {
                        console.log("❌ [useActivityScreenLogic] Enrollment UUID not found in list.")
                    }
                }
                return
            }

            // 2. Check LocalStorage (Internal Navigation)
            const selectedActivityFromCalendar = localStorage.getItem('selectedActivityFromCalendar')
            if (selectedActivityFromCalendar) {
                setSelectedActivityId(selectedActivityFromCalendar)
                setShowTodayScreen(true)
                localStorage.removeItem('selectedActivityFromCalendar')
                return
            }

            const openActivityId = localStorage.getItem('openActivityId')
            if (openActivityId) {
                setSelectedActivityId(openActivityId)
                setShowTodayScreen(true)
                localStorage.removeItem('openActivityId')
            }
        }

        checkForPendingNavigation()
        // Verification when enrollments change is handled by the component re-rendering
    }, [enrollments.length])


    // Initial Data Load
    useEffect(() => {
        // Try Cache First
        let hasCachedData = false
        try {
            const cachedEnrollments = sessionStorage.getItem("cached_enrollments")
            const enrollmentsTimestamp = Number(sessionStorage.getItem("enrollments_cache_timestamp") || "0")

            if (cachedEnrollments && Date.now() - enrollmentsTimestamp < 10 * 60 * 1000) {
                setEnrollments(JSON.parse(cachedEnrollments))
                setIsLoading(false)
                hasCachedData = true
            }

            const cachedCoaches = sessionStorage.getItem("cached_activity_coaches")
            const coachesTimestamp = Number(sessionStorage.getItem("activity_coaches_cache_timestamp") || "0")

            if (cachedCoaches && Date.now() - coachesTimestamp < 10 * 60 * 1000) {
                setCoaches(JSON.parse(cachedCoaches))
                setLoadingCoaches(false)
            }
        } catch (e) { console.error("Cache read error", e) }

        // Fetch Fresh Data
        if (hasCachedData) {
            fetchUserEnrollments(true) // Silent update
            loadCoaches() // Background update
        } else {
            fetchUserEnrollments()
            loadCoaches()
        }

        fetchMeetCredits()
    }, [fetchUserEnrollments, loadCoaches, fetchMeetCredits])

    // Listen to Tab Reset from BottomNavigation
    useEffect(() => {
        const handleTabReset = (event: Event) => {
            const customEvent = event as CustomEvent<{ tab: string }>
            if (customEvent.detail.tab === 'activity') {
                handleBackToActivities()
            }
        }

        window.addEventListener('reset-tab-to-origin', handleTabReset as EventListener)
        return () => {
            window.removeEventListener('reset-tab-to-origin', handleTabReset as EventListener)
        }
    }, [handleBackToActivities])

    // Save Tab State
    useEffect(() => {
        try {
            localStorage.setItem("current_activity_tab", activeTab)
        } catch (e) { }
    }, [activeTab])


    // --- EXPORT ---
    return {
        // State
        activeTab, setActiveTab,
        enrollments,
        coaches,
        isLoading, loadingCoaches,
        err: error, // 'error' is reserved keyword sometimes, using 'err' or just 'error'

        // Navigation State
        showTodayScreen, setShowTodayScreen,
        selectedActivityId,
        selectedEnrollmentId,

        // Filter State
        searchTerm, setSearchTerm,
        activityStatusTab, setActivityStatusTab,

        // Data State
        meetCredits,
        enrollmentProgresses,

        // Actions
        handleActivityClick,
        handleBackToActivities,
        refreshData: () => fetchUserEnrollments(false),

        // Modal Actions
        handleCoachClick,
        closeCoachModal,
        isCoachProfileModalOpen,
        selectedCoachForProfile
    }
}
