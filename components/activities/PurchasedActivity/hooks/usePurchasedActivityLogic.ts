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
    overrideStreak?: number
}

export function usePurchasedActivityLogic({
    enrollment,
    realProgress,
    overridePendingCount,
    overrideNextSessionDate,
    onActivityClick,
    isCoachView = false,
    overrideStreak
}: UsePurchasedActivityLogicProps) {
    const { activity } = enrollment
    const [isNavigating, setIsNavigating] = useState(false)
    const [pendingCount, setPendingCount] = useState<number | null>(overridePendingCount !== undefined ? overridePendingCount : null)
    const [nextSessionDate, setNextSessionDate] = useState<string | null>(overrideNextSessionDate !== undefined ? overrideNextSessionDate : null)
    const [streak, setStreak] = useState(overrideStreak !== undefined ? overrideStreak : ((enrollment as any).current_streak || 0))
    const progress = realProgress !== undefined ? realProgress : 0

    // Improved start detection
    const today = useMemo(() => {
        const d = new Date()
        d.setHours(0, 0, 0, 0)
        return d
    }, [])

    const startDate = useMemo(() => {
        if (!enrollment.start_date) return null
        const d = new Date(enrollment.start_date)
        d.setHours(0, 0, 0, 0)
        return d
    }, [enrollment.start_date])

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

        const daysRemaining = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        const isExpired = daysRemaining < 0

        return { daysRemaining, isExpired, totalAccessDays: diasAcceso, expirationDate }
    }, [enrollment.created_at, enrollment.expiration_date, activity.dias_acceso, today])

    const isFinished = useMemo(() => {
        if (progress >= 100) return true
        if (daysInfo.isExpired) return true

        // Finalizada si ya pasó el deadline de inicio y no empezó
        const startDeadline = (enrollment as any).start_deadline
        if (startDeadline && !enrollment.start_date) {
            const deadline = new Date(startDeadline)
            deadline.setHours(0, 0, 0, 0)
            if (today > deadline) return true
        }

        if (enrollment.program_end_date) {
            const end = new Date(enrollment.program_end_date)
            end.setHours(0, 0, 0, 0)
            if (today > end) return true
        }
        return false
    }, [progress, enrollment.program_end_date, (enrollment as any).start_deadline, enrollment.start_date, today, daysInfo.isExpired])

    const isFuture = useMemo(() => {
        if (isFinished) return false
        if (!enrollment.start_date) return true
        return startDate ? startDate > today : false
    }, [startDate, today, enrollment.start_date, isFinished])

    const hasStarted = useMemo(() => !!enrollment.start_date && !isFuture, [enrollment.start_date, isFuture])
    const daysToStart = useMemo(() => startDate ? Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0, [startDate, today])

    useEffect(() => {
        if (overridePendingCount !== undefined || overrideNextSessionDate !== undefined || overrideStreak !== undefined) {
            if (overridePendingCount !== undefined) setPendingCount(overridePendingCount)
            if (overrideNextSessionDate !== undefined) setNextSessionDate(overrideNextSessionDate)
            if (overrideStreak !== undefined) setStreak(overrideStreak)
            return
        }

        const fetchProgressData = async () => {
            if (!hasStarted) {
                setPendingCount(null)
                setNextSessionDate(null)
                setStreak((enrollment as any).current_streak || 0)
                return
            }

            try {
                const supabase = createClient()
                const { data: { session } } = await supabase.auth.getSession()
                if (!session?.user) return

                const today = new Date().toISOString().split('T')[0]

                // 1. Progress and Streak
                const { data: records, error: streakError } = await supabase
                    .from('progreso_diario_actividad')
                    .select('fecha, fit_items_o, fit_items_c, nut_items_o, nut_items_c')
                    .eq('cliente_id', enrollment.client_id)
                    .eq('enrollment_id', enrollment.id)
                    .order('fecha', { ascending: false })

                if (!streakError && records) {
                    // Current Today Record
                    const todayRecord = records.find((r: any) => r.fecha === today)
                    if (todayRecord) {
                        const total = (Number(todayRecord.fit_items_o) || 0) + (Number(todayRecord.nut_items_o) || 0)
                        const done = (Number(todayRecord.fit_items_c) || 0) + (Number(todayRecord.nut_items_c) || 0)
                        setPendingCount(Math.max(0, total - done))
                    } else {
                        setPendingCount(null)
                    }

                    // Streak Strategy:
                    // 1. If enrollment has a pre-calculated current_streak, use it.
                    // 2. Fallback to manual calculation if missing (migration not run yet).
                    const enrollmentStreak = (enrollment as any).current_streak || 0

                    if (enrollmentStreak > 0) {
                        setStreak(enrollmentStreak)
                    } else {
                        // Manual Fallback Calculation
                        let currentStreak = 0
                        const sortedRecords = records.filter((r: any) => ((Number(r.fit_items_o) || 0) + (Number(r.nut_items_o) || 0)) > 0)

                        if (sortedRecords.length > 0) {
                            for (const rec of (sortedRecords as any[])) {
                                const total = (Number(rec.fit_items_o) || 0) + (Number(rec.nut_items_o) || 0)
                                const done = (Number(rec.fit_items_c) || 0) + (Number(rec.nut_items_c) || 0)
                                const isCompleted = done >= total
                                if (isCompleted) {
                                    currentStreak++
                                } else {
                                    if (rec.fecha === today) continue
                                    break
                                }
                            }
                        }
                        setStreak(currentStreak)
                    }
                }

                // 2. Próxima sesión
                const activityType = activity.type?.toLowerCase() || ''
                if (activityType === 'workshop' || activityType === 'taller') {
                    const { data: upcoming } = await supabase
                        .from('taller_progreso_temas')
                        .select('fecha_seleccionada')
                        .eq('enrollment_id', enrollment.id)
                        .eq('cliente_id', enrollment.client_id)
                        .gte('fecha_seleccionada', today)
                        .order('fecha_seleccionada', { ascending: true })
                        .limit(1)
                        .maybeSingle()

                    const u = upcoming as any
                    if (u?.fecha_seleccionada) {
                        setNextSessionDate(u.fecha_seleccionada)
                    } else {
                        setNextSessionDate(null)
                    }
                } else if (activityType === 'program' || activityType === 'programa') {
                    const { data: upcoming } = await supabase
                        .from('progreso_diario_actividad')
                        .select('fecha')
                        .eq('enrollment_id', enrollment.id)
                        .eq('cliente_id', enrollment.client_id)
                        .gt('fecha', today)
                        .or(`fit_items_o.gt.0,nut_items_o.gt.0`)
                        .order('fecha', { ascending: true })
                        .limit(1)
                        .maybeSingle()

                    const u = upcoming as any
                    if (u?.fecha) {
                        setNextSessionDate(u.fecha)
                    } else {
                        setNextSessionDate(null)
                    }
                }
            } catch (error) {
                console.error('Error fetching progress data:', error)
            }
        }

        fetchProgressData()
    }, [hasStarted, enrollment, activity.id, activity.type, progress, overridePendingCount, overrideNextSessionDate])

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
        streak,
        handleCardClick,
        isNavigating,
        isFuture,
        daysToStart
    }
}
