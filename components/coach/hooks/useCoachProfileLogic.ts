import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/supabase-client"
import { toast } from "@/components/ui/use-toast"

export interface CoachProfileLogicProps {
    isOpen: boolean
    onClose: () => void
    coach: {
        id: string
        name: string
        avatar_url?: string
        bio?: string
        location?: string
        experience_years?: number
        specialization?: string
        certifications?: string[]
        rating?: number
        total_sessions?: number
        total_products?: number
    }
    preloadedActivities?: any[]
    onActivityClick?: (activity: any) => void
}

export function useCoachProfileLogic({
    isOpen,
    onClose,
    coach,
    preloadedActivities,
    onActivityClick,
}: CoachProfileLogicProps) {
    const [coachProducts, setCoachProducts] = useState<any[]>([])
    const [loadingProducts, setLoadingProducts] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<any>(null)
    const [isProductModalOpen, setIsProductModalOpen] = useState(false)
    const [isCafeViewOpen, setIsCafeViewOpen] = useState(false)
    const [coachConsultations, setCoachConsultations] = useState<{
        express: { active: boolean; price: number; time: number; name: string }
        puntual: { active: boolean; price: number; time: number; name: string }
        profunda: { active: boolean; price: number; time: number; name: string }
    }>({
        express: { active: false, price: 0, time: 15, name: "Express" },
        puntual: { active: false, price: 0, time: 30, name: "Consulta puntual" },
        profunda: { active: false, price: 0, time: 60, name: "Sesión profunda" },
    })
    const [isProcessingPurchase, setIsProcessingPurchase] = useState<string | null>(null)
    const [selectedConsultationActivity, setSelectedConsultationActivity] = useState<any>(null)
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false)
    const [totalSales, setTotalSales] = useState<number | null>(null)
    const [coachCertifications, setCoachCertifications] = useState<string[]>([])
    const [isStatsOpen, setIsStatsOpen] = useState(false)

    useEffect(() => {
        if (isOpen && coach?.id) {
            loadCoachProducts()
            loadCoachConsultations()
            loadCoachSales()
            loadCoachCertifications()
        }
    }, [isOpen, coach?.id, preloadedActivities])

    const loadCoachProducts = async () => {
        if (!coach?.id) return

        if (preloadedActivities && preloadedActivities.length > 0) {
            const coachProductsFromCache = preloadedActivities.filter((activity: any) => activity.coach_id === coach.id)

            if (coachProductsFromCache.length > 0) {
                setCoachProducts(coachProductsFromCache)
                setLoadingProducts(false)
                return
            }
        }

        setLoadingProducts(true)
        try {
            const response = await fetch(`/api/activities/search?coachId=${coach.id}`)
            if (!response.ok) {
                throw new Error("Failed to fetch coach products")
            }

            const products = await response.json()
            setCoachProducts(products || [])
        } catch (error) {
            console.error("Error cargando productos del coach:", error)
            setCoachProducts([])
        } finally {
            setLoadingProducts(false)
        }
    }

    const loadCoachConsultations = async () => {
        if (!coach?.id) return

        try {
            const supabase = createClient()
            const { data: coachData, error } = await supabase
                .from("coaches")
                .select("cafe, cafe_enabled, meet_30, meet_30_enabled, meet_1, meet_1_enabled")
                .eq("id", coach.id)
                .single()

            if (error) {
                console.warn("⚠️ Error cargando consultas del coach:", error.message)
                return
            }

            if (coachData) {
                setCoachConsultations({
                    express: {
                        active: coachData.cafe_enabled || false,
                        price: coachData.cafe || 0,
                        time: 15,
                        name: "Express",
                    },
                    puntual: {
                        active: coachData.meet_30_enabled || false,
                        price: coachData.meet_30 || 0,
                        time: 30,
                        name: "Consulta puntual",
                    },
                    profunda: {
                        active: coachData.meet_1_enabled || false,
                        price: coachData.meet_1 || 0,
                        time: 60,
                        name: "Sesión profunda",
                    },
                })
            }
        } catch (error) {
            console.error("Error cargando consultas del coach:", error)
        }
    }

    const loadCoachSales = async () => {
        if (typeof coach.total_sessions === "number") {
            setTotalSales(coach.total_sessions)
            return
        }

        if (!coach?.id) return
        try {
            const supabase = createClient()
            const { data: activities } = await supabase.from("activities").select("id").eq("coach_id", coach.id)
            if (activities?.length) {
                const { count } = await supabase
                    .from("activity_enrollments")
                    .select("*", { count: "exact", head: true })
                    .in(
                        "activity_id",
                        activities.map((a: { id: number }) => a.id),
                    )
                setTotalSales(count || 0)
            } else {
                setTotalSales(0)
            }
        } catch (e) {
            console.error("Error loading sales", e)
            setTotalSales(0)
        }
    }

    const loadCoachCertifications = async () => {
        if (coach.certifications && coach.certifications.length > 0) {
            setCoachCertifications(coach.certifications)
            return
        }

        if (!coach?.id) return

        try {
            const supabase = createClient()
            const { data: certs, error } = await supabase
                .from("coach_certifications")
                .select("id, name, issuer, year")
                .eq("coach_id", coach.id)
                .order("created_at", { ascending: false })

            if (error) {
                setCoachCertifications([])
                return
            }

            const normalized = (certs || []).map((c: any) => {
                const issuer = c.issuer ? ` - ${c.issuer}` : ""
                const year = c.year ? ` (${c.year})` : ""
                return `${c.name || "Certificación"}${issuer}${year}`
            })
            setCoachCertifications(normalized)
        } catch (error) {
            console.error("Error cargando certificados del coach:", error)
            setCoachCertifications([])
        }
    }

    const handleProductClick = (product: any) => {
        if (onActivityClick) {
            onActivityClick(product)
        } else {
            setSelectedProduct(product)
            setIsProductModalOpen(true)
        }
    }

    const handleCloseProductModal = () => {
        setIsProductModalOpen(false)
        setSelectedProduct(null)
    }

    const handlePurchaseConsultation = async (type: "express" | "puntual" | "profunda") => {
        const consultation = coachConsultations[type]
        if (!consultation.active || consultation.price <= 0) {
            toast({
                title: "Error",
                description: "Esta consulta no está disponible",
                variant: "destructive",
            })
            return
        }

        setIsProcessingPurchase(type)

        try {
            const supabase = createClient()
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
                toast({
                    title: "Error",
                    description: "Debes iniciar sesión para comprar",
                    variant: "destructive",
                })
                setIsProcessingPurchase(null)
                return
            }

            const consultationTitle =
                type === "express"
                    ? "Consulta Express - 15 min"
                    : type === "puntual"
                        ? "Consulta Puntual - 30 min"
                        : "Sesión Profunda - 60 min"

            const { data: consultationActivity, error: createError } = await supabase
                .from("activities")
                .insert({
                    coach_id: coach.id,
                    title: consultationTitle,
                    description: `Consulta con ${coach.name}`,
                    type: "consultation",
                    price: consultation.price,
                    categoria: "consultation",
                    modality: "online",
                    is_public: false,
                    is_active: true,
                })
                .select()
                .single()

            if (createError || !consultationActivity) {
                console.error("Error creando actividad de consulta:", createError)
                toast({
                    title: "Error",
                    description: "No se pudo crear la consulta. Intenta nuevamente.",
                    variant: "destructive",
                })
                setIsProcessingPurchase(null)
                return
            }

            try {
                const ctx = {
                    coachId: coach.id,
                    activityId: String(consultationActivity.id),
                    source: "coach_profile_consultation",
                    purchase: {
                        kind: "consultation",
                        durationMinutes: Number(consultation.time) || 30,
                        price: Number(consultation.price) || 0,
                        label: type === "express" ? "Meet 15 min" : type === "puntual" ? "Meet 30 min" : "Meet 60 min",
                    },
                }
                localStorage.setItem("scheduleMeetContext", JSON.stringify(ctx))
                sessionStorage.setItem("scheduleMeetIntent", "1")
                window.dispatchEvent(new CustomEvent("omnia-force-tab-change", { detail: { tab: "calendar" } }))
                window.dispatchEvent(new CustomEvent("omnia-refresh-schedule-meet"))
            } catch (e) {
                console.error("Error redirigiendo a calendario:", e)
            }

            setIsCafeViewOpen(false)
            setIsProcessingPurchase(null)
            onClose()
        } catch (error: any) {
            console.error("Error en la compra de consulta:", error)
            toast({
                title: "Error",
                description: error.message || "Ocurrió un error al procesar la compra",
                variant: "destructive",
            })
            setIsProcessingPurchase(null)
        }
    }

    return {
        coachProducts,
        loadingProducts,
        selectedProduct,
        isProductModalOpen,
        isCafeViewOpen,
        setIsCafeViewOpen,
        coachConsultations,
        isProcessingPurchase,
        setIsProcessingPurchase,
        selectedConsultationActivity,
        setSelectedConsultationActivity,
        isPurchaseModalOpen,
        setIsPurchaseModalOpen,
        totalSales,
        coachCertifications,
        isStatsOpen,
        setIsStatsOpen,
        handleProductClick,
        handleCloseProductModal,
        handlePurchaseConsultation,
    }
}
