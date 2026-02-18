import { useState, useEffect, useMemo, useCallback } from "react"
import { createClient } from '@/lib/supabase/supabase-client'
import { Enrollment } from "@/types/activity"

interface UsePurchasedActivityLogicProps {
    enrollment: Enrollment
    realProgress?: number
    overridePendingCount?: number
    overrideNextSessionDate?: string | null
    onActivityClick?: (activityId: string, enrollmentId: string) => void
    isCoachView?: boolean
}

export function usePurchasedActivityLogic({
    enrollment,
    realProgress,
    overridePendingCount,
    overrideNextSessionDate,
    onActivityClick,
    isCoachView = false
}: UsePurchasedActivityLogicProps) {
    const { activity } = enrollment
    const [isNavigating, setIsNavigating] = useState(false)
    const [pendingCount, setPendingCount] = useState<number | null>(overridePendingCount !== undefined ? overridePendingCount : null)
    const [nextSessionDate, setNextSessionDate] = useState<string | null>(overrideNextSessionDate !== undefined ? overrideNextSessionDate : null)
    const [isFinished, setIsFinished] = useState(false)

    const progress = realProgress !== undefined ? realProgress : 0
    const hasStarted = !!enrollment.start_date

    const daysInfo = useMemo(() => {
        const purchaseDate = new Date(enrollment.created_at)
        purchaseDate.setHours(0, 0, 0, 0)
        const diasAcceso = activity.dias_acceso || 30

        let expirationDate: Date
        if (enrollment.expiration_date) {
            expirationDate = new Date(enrollment.expiration_date)
        } else {
            expirationDate = new Date(purchaseDate)
            expirationDate.setDate(purchaseDate.getDate() + diasAcceso)
        }
        expirationDate.setHours(0, 0, 0, 0)

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const daysRemaining = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        const isExpired = daysRemaining < 0

        return { daysRemaining, isExpired, totalAccessDays: diasAcceso, expirationDate }
    }, [enrollment.created_at, enrollment.expiration_date, activity.dias_acceso])

    useEffect(() => {
        if (overridePendingCount !== undefined || overrideNextSessionDate !== undefined) {
            if (overridePendingCount !== undefined) setPendingCount(overridePendingCount)
            if (overrideNextSessionDate !== undefined) setNextSessionDate(overrideNextSessionDate)
            if (progress >= 100 && overridePendingCount === 0) setIsFinished(true)
            return
        }

        const fetchProgressData = async () => {
            if (!hasStarted) {
                setPendingCount(null)
                setNextSessionDate(null)
                return
            }

            try {
                const supabase = createClient()
                const { data: { session } } = await supabase.auth.getSession()
                if (!session?.user) return

                const today = new Date().toISOString().split('T')[0]

                // 1. Pendientes hoy
                const { data: record, error: pendingError } = await supabase
                    .from('progreso_diario_actividad')
                    .select('items_objetivo, items_completados')
                    .eq('cliente_id', enrollment.client_id)
                    .eq('actividad_id', activity.id)
                    .eq('fecha', today)
                    .maybeSingle()

                if (!pendingError && record) {
                    const r = record as any
                    const total = r.items_objetivo || 0
                    const done = r.items_completados || 0
                    setPendingCount(Math.max(0, total - done))
                } else {
                    setPendingCount(null)
                }

                // 2. Próxima sesión
                const activityType = activity.type?.toLowerCase() || ''
                if (activityType === 'workshop' || activityType === 'taller') {
                    const { data: upcoming } = await supabase
                        .from('taller_progreso_temas')
                        .select('fecha_seleccionada')
                        .eq('actividad_id', activity.id)
                        .eq('cliente_id', enrollment.client_id)
                        .gte('fecha_seleccionada', today)
                        .order('fecha_seleccionada', { ascending: true })
                        .limit(1)
                        .maybeSingle()

                    const u = upcoming as any
                    if (u?.fecha_seleccionada) {
                        setNextSessionDate(u.fecha_seleccionada)
                        setIsFinished(false)
                    } else {
                        setNextSessionDate(null)
                        setIsFinished(true)
                    }
                } else if (activityType === 'program' || activityType === 'programa') {
                    const { data: upcoming } = await supabase
                        .from('progreso_diario_actividad')
                        .select('fecha')
                        .eq('actividad_id', activity.id)
                        .eq('cliente_id', enrollment.client_id)
                        .gt('fecha', today)
                        .gt('items_objetivo', 0)
                        .order('fecha', { ascending: true })
                        .limit(1)
                        .maybeSingle()

                    const u = upcoming as any
                    if (u?.fecha) {
                        setNextSessionDate(u.fecha)
                        setIsFinished(false)
                    } else {
                        setNextSessionDate(null)
                        setIsFinished(progress >= 100)
                    }
                }
            } catch (error) {
                console.error('Error fetching progress data:', error)
            }
        }

        fetchProgressData()
    }, [hasStarted, enrollment.client_id, activity.id, activity.type, progress, overridePendingCount, overrideNextSessionDate])

    const handleCardClick = useCallback(async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        // Restringir acceso si es vista de coach (solo lectura)
        if (isCoachView) return

        // Bloquear acceso si está vencida
        if (daysInfo.isExpired) {
            console.warn("Acceso bloqueado: Actividad vencida.")
            return
        }

        if (isNavigating) return

        setIsNavigating(true)

        try {
            if (onActivityClick) {
                onActivityClick(activity.id.toString(), enrollment.id.toString())
            } else {
                localStorage.setItem("openActivityId", activity.id.toString())
                window.location.href = '/?tab=activity'
            }
        } catch (error) {
            console.error("Error navigating:", error)
        } finally {
            setIsNavigating(false)
        }
    }, [daysInfo.isExpired, hasStarted, isNavigating, onActivityClick, activity.id, enrollment.id, isCoachView])

    return {
        pendingCount,
        nextSessionDate,
        isFinished,
        progress,
        hasStarted,
        daysInfo,
        handleCardClick,
        isNavigating
    }
}
