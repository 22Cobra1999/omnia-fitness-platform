"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { getSupabaseClient } from '@/lib/supabase/supabase-client'
import { getPlanLimit, type PlanType } from '@/lib/utils/plan-limits'
import { toast } from 'sonner'
import { Globe, MapPin } from 'lucide-react'

type CacheEntry<T> = {
    value: T
    cachedAt: number
}

const WORKSHOP_TOPICS_CACHE_TTL_MS = 5 * 60 * 1000
const PLANNING_STATS_CACHE_TTL_MS = 5 * 60 * 1000

const workshopTopicsCache = new Map<string, CacheEntry<any[]>>()
const planningStatsCache = new Map<string, CacheEntry<number | null>>()

interface UseClientProductLogicProps {
    product: any
    isOpen: boolean
    onClose: () => void
    showEditButton?: boolean
    navigationContext?: any
    onCoachClick?: (coachId: string) => void
}

export function useClientProductLogic({
    product,
    isOpen,
    onClose,
    showEditButton = false,
    navigationContext,
    onCoachClick
}: UseClientProductLogicProps) {
    const { user } = useAuth()
    const [isExpanded, setIsExpanded] = useState(false)
    const [isVideoRevealed, setIsVideoRevealed] = useState(false)
    const [comments, setComments] = useState<any[]>([])
    const [loadingComments, setLoadingComments] = useState(false)
    const [workshopTopics, setWorkshopTopics] = useState<any[]>([])
    const [loadingWorkshopTopics, setLoadingWorkshopTopics] = useState(false)
    const [isAlreadyPurchased, setIsAlreadyPurchased] = useState(false)
    const [isProcessingPurchase, setIsProcessingPurchase] = useState(false)
    const [purchaseCompleted, setPurchaseCompleted] = useState(false)
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
    const [showRepurchaseConfirm, setShowRepurchaseConfirm] = useState(false)
    const [repurchaseMessage, setRepurchaseMessage] = useState('')
    const [isPaused, setIsPaused] = useState(false)
    const [isTogglingPause, setIsTogglingPause] = useState(false)
    const [isDateChangeNoticeClosed, setIsDateChangeNoticeClosed] = useState(false)
    const [planLimits, setPlanLimits] = useState<{
        activitiesLimit: number
        weeksLimit: number
        stockLimit: number
    } | null>(null)
    const [weeksFromPlanning, setWeeksFromPlanning] = useState<number | null>(null)
    const [planningStatsLoading, setPlanningStatsLoading] = useState(false)
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const [purchaseStatus, setPurchaseStatus] = useState<any>(null)

    const abortControllerRef = useRef<AbortController | null>(null)
    const planLimitsAbortControllerRef = useRef<AbortController | null>(null)

    // Memoized initial paused state
    const productPausedState = useMemo(() => {
        if (!product) return false
        return product.type === 'workshop'
            ? (product as any).taller_activo === false
            : (product.is_paused ?? false)
    }, [product?.id, product?.type, product?.is_paused, (product as any)?.taller_activo])

    // Sync isPaused with product when it opens
    useEffect(() => {
        if (isOpen && product) {
            if (isPaused !== productPausedState) {
                setIsPaused(productPausedState)
            }
            setIsDateChangeNoticeClosed(false)
        }
    }, [isOpen, productPausedState])

    // Check purchase status
    const checkPurchaseStatus = useCallback(async () => {
        if (!product?.id) return
        try {
            const response = await fetch(`/api/activities/${product.id}/purchase-status`)
            const result = await response.json()

            if (response.ok && result.success) {
                setPurchaseStatus(result.data)
                setIsAlreadyPurchased(!result.data.hasNeverPurchased)
            } else {
                const purchasedActivities = JSON.parse(localStorage.getItem('purchasedActivities') || '[]')
                setIsAlreadyPurchased(purchasedActivities.includes(product.id))
            }
        } catch (error) {
            const purchasedActivities = JSON.parse(localStorage.getItem('purchasedActivities') || '[]')
            setIsAlreadyPurchased(purchasedActivities.includes(product.id))
        }
    }, [product?.id])

    // Load Workshop Topics
    const loadWorkshopTopics = useCallback(async () => {
        if (!product?.id || product.type !== 'workshop') return

        const cacheKey = String(product.id)
        const cached = workshopTopicsCache.get(cacheKey)
        if (cached && Date.now() - cached.cachedAt < WORKSHOP_TOPICS_CACHE_TTL_MS) {
            setWorkshopTopics(cached.value)
            setLoadingWorkshopTopics(false)
            return
        }

        setLoadingWorkshopTopics(true)
        try {
            const response = await fetch(`/api/taller-detalles?actividad_id=${product.id}`)
            const { success, data: tallerDetalles } = await response.json()
            if (success && Array.isArray(tallerDetalles)) {
                setWorkshopTopics(tallerDetalles)
                workshopTopicsCache.set(cacheKey, { value: tallerDetalles, cachedAt: Date.now() })
            }
        } catch (error) {
            console.error('Error loading workshop topics:', error)
        } finally {
            setLoadingWorkshopTopics(false)
        }
    }, [product?.id, product?.type])

    // Load Comments
    const loadComments = useCallback(async () => {
        if (!product?.id) return
        setLoadingComments(true)
        try {
            const supabase = getSupabaseClient()
            const coachId = product?.coach_id || product?.coach?.id
            let query = supabase
                .from('activity_surveys')
                .select('*')
                .eq('activity_id', product.id)
                .not('comments', 'is', null)
                .order('created_at', { ascending: false })
                .limit(10)

            if (coachId) query = query.neq('client_id', coachId)

            const { data: surveys, error: surveysError } = await query
            if (surveysError) throw surveysError

            if (surveys) {
                const userIds = [...new Set(surveys.map((s: any) => s.client_id).filter(Boolean))]
                const { data: profiles } = await supabase
                    .from('user_profiles')
                    .select('id, full_name, avatar_url')
                    .in('id', userIds)

                const combined = surveys.map((s: any) => ({
                    ...s,
                    user_profiles: profiles?.find((p: any) => p.id === s.client_id) || {
                        full_name: 'Usuario Anónimo',
                        avatar_url: null
                    }
                }))
                setComments(combined)
            }
        } catch (error) {
            console.error('Error loading comments:', error)
        } finally {
            setLoadingComments(false)
        }
    }, [product?.id, product?.coach_id, product?.coach?.id])

    // Load Plan Limits
    const loadPlanLimits = useCallback(() => {
        const coachId = product?.coach_id || product?.coach?.id || navigationContext?.coachId || user?.id
        if (showEditButton && coachId) {
            fetch(`/api/coach/plan`)
                .then(res => res.json())
                .then(data => {
                    const planType: PlanType = (data.success && data.plan?.plan_type) || 'free'
                    setPlanLimits({
                        activitiesLimit: getPlanLimit(planType, 'activitiesPerProduct'),
                        weeksLimit: getPlanLimit(planType, 'weeksPerProduct'),
                        stockLimit: getPlanLimit(planType, 'stockPerProduct')
                    })
                })
                .catch(err => {
                    const limits = {
                        activitiesLimit: getPlanLimit('free', 'activitiesPerProduct'),
                        weeksLimit: getPlanLimit('free', 'weeksPerProduct'),
                        stockLimit: getPlanLimit('free', 'stockPerProduct')
                    }
                    setPlanLimits(limits)
                })
        }
    }, [showEditButton, product?.coach_id, product?.coach?.id, navigationContext?.coachId, user?.id])

    // Load Planning Stats
    useEffect(() => {
        if (!isOpen || !product?.id || product.type !== 'program') return

        const cacheKey = String(product.id)
        const cached = planningStatsCache.get(cacheKey)
        if (refreshTrigger === 0 && cached && Date.now() - cached.cachedAt < PLANNING_STATS_CACHE_TTL_MS) {
            setWeeksFromPlanning(cached.value)
            return
        }

        abortControllerRef.current = new AbortController()
        setPlanningStatsLoading(true)
        fetch(`/api/get-product-planning?actividad_id=${product.id}&t=${Date.now()}`, { signal: abortControllerRef.current.signal })
            .then(res => res.json())
            .then(data => {
                if (data?.success && data.data) {
                    const totalWeeks = Number(data.data.semanas || 0) * (Number(data.data.periods) || 1)
                    setWeeksFromPlanning(totalWeeks)
                    planningStatsCache.set(cacheKey, { value: totalWeeks, cachedAt: Date.now() })
                }
            })
            .catch(err => {
                if (err.name === 'AbortError') return
                console.error('Error loading planning stats:', err)
            })
            .finally(() => setPlanningStatsLoading(false))

        return () => abortControllerRef.current?.abort()
    }, [isOpen, product?.id, product?.type, refreshTrigger])

    // Initial loads
    useEffect(() => {
        if (isOpen && product?.id) {
            loadComments()
            checkPurchaseStatus()
            if (product.type === 'workshop') loadWorkshopTopics()
            if (showEditButton) loadPlanLimits()
        }
    }, [isOpen, product?.id, product?.type, loadComments, checkPurchaseStatus, loadWorkshopTopics, loadPlanLimits, showEditButton])

    // Product Update Listener
    useEffect(() => {
        const handleProductUpdate = (event: CustomEvent) => {
            if (String(event.detail?.productId) === String(product?.id)) {
                loadPlanLimits()
                setRefreshTrigger(prev => prev + 1)
            }
        }
        window.addEventListener('productUpdated', handleProductUpdate as EventListener)
        return () => window.removeEventListener('productUpdated', handleProductUpdate as EventListener)
    }, [product?.id, loadPlanLimits])

    // Difficulty Fires logic
    const difficulty = product?.difficulty || 'intermediate'

    // Modality logic
    const productModality = product?.modality || 'online'
    const modalityIcon = productModality === 'online' ? Globe : MapPin

    const calculateWorkshopWeeks = useMemo(() => {
        if (product?.type !== 'workshop' || !workshopTopics.length) return 0
        const weeksSet = new Set<string>()
        workshopTopics.forEach((tema: any) => {
            const all = [...(tema.originales?.fechas_horarios || []), ...(tema.secundarios?.fechas_horarios || [])]
            all.forEach((h: any) => {
                if (h.fecha) {
                    const [y, m, d] = h.fecha.split('-').map(Number)
                    const date = new Date(Date.UTC(y, m - 1, d))
                    const dayNum = date.getUTCDay() || 7
                    date.setUTCDate(date.getUTCDate() + 4 - dayNum)
                    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
                    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
                    weeksSet.add(`${date.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`)
                }
            })
        })
        return weeksSet.size
    }, [workshopTopics, product?.type])

    const totalSessions = product?.totalSessions || 0
    const exercisesCount = product?.exercisesCount || (product?.items_unicos || 0)
    const productCapacity = product?.capacity
    const includedMeetCredits = Number(product?.included_meet_credits || 0)
    const programDuration = Number(product?.program_info?.program_duration || product?.program_duration || 0)

    const weeksCount = product?.type === 'workshop'
        ? calculateWorkshopWeeks
        : (weeksFromPlanning ?? product?.weeks ?? programDuration ?? 0)

    const exceedsActivities = planLimits ? exercisesCount > planLimits.activitiesLimit : false
    const exceedsWeeks = planLimits ? weeksCount > planLimits.weeksLimit : false
    const exceedsStock = planLimits && productCapacity ? parseInt(productCapacity.toString()) > planLimits.stockLimit : false

    const handleTogglePause = async (checked: boolean) => {
        if (!showEditButton || !product?.id) return
        const newPausedState = !checked
        const wasPaused = isPaused
        setIsTogglingPause(true)
        try {
            const response = await fetch(`/api/products/${product.id}/pause`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_paused: newPausedState })
            })
            const result = await response.json()
            if (result.success) {
                const backendState = result.product?.is_paused ?? newPausedState
                setIsPaused(backendState)
                if (product) product.is_paused = backendState
                window.dispatchEvent(new CustomEvent('productUpdated', { detail: { productId: product.id } }))
                toast.success(backendState ? 'Producto pausado' : 'Producto activado')
            }
        } catch (error) {
            toast.error('Error al cambiar estado')
            setIsPaused(wasPaused)
        } finally {
            setIsTogglingPause(false)
        }
    }

    const handlePurchase = useCallback(() => {
        if (purchaseStatus?.hasActivePurchase || purchaseStatus?.hasCompletedPurchase || purchaseStatus?.hasCancelledPurchase) {
            const msg = purchaseStatus.hasActivePurchase ? `Esta actividad sigue activa. ¿Recomprar?` : `Ya completaste esto. ¿Repetir?`
            setRepurchaseMessage(msg)
            setShowRepurchaseConfirm(true)
            return
        }
        setIsPaymentModalOpen(true)
    }, [purchaseStatus])

    const executePurchase = useCallback(async (method: string = 'credit_card') => {
        setIsProcessingPurchase(true)
        try {
            if (method === 'mercadopago') {
                const { createCheckoutProPreference, redirectToMercadoPagoCheckout } = await import('@/lib/mercadopago/checkout-pro')
                const response = await createCheckoutProPreference(product.id)
                if (response.success && response.initPoint) {
                    redirectToMercadoPagoCheckout(response.initPoint, product.id, response.preferenceId)
                    return
                }
            }
            const response = await fetch('/api/enrollments/direct', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activityId: product.id, paymentMethod: method })
            })
            if (response.ok) {
                setPurchaseCompleted(true)
                await checkPurchaseStatus()
            }
        } catch (error) {
            toast.error('Error al procesar compra')
        } finally {
            setIsProcessingPurchase(false)
        }
    }, [product?.id, checkPurchaseStatus])

    const handleClose = useCallback(() => {
        abortControllerRef.current?.abort()
        if (navigationContext?.fromCoachProfile && navigationContext?.onReturnToCoach) {
            navigationContext.onReturnToCoach()
        } else {
            onClose()
        }
    }, [navigationContext, onClose])

    const handleCoachClick = useCallback(() => {
        if (!navigationContext?.fromCoachProfile && product?.coach_id) {
            onClose()
            onCoachClick?.(product.coach_id)
        }
    }, [navigationContext, product?.coach_id, onClose, onCoachClick])

    return {
        user,
        isExpanded,
        isVideoRevealed,
        comments,
        loadingComments,
        workshopTopics,
        loadingWorkshopTopics,
        isAlreadyPurchased,
        isProcessingPurchase,
        purchaseCompleted,
        isDescriptionExpanded,
        isPaymentModalOpen,
        showRepurchaseConfirm,
        repurchaseMessage,
        isPaused,
        isTogglingPause,
        isDateChangeNoticeClosed,
        planLimits,
        weeksFromPlanning,
        planningStatsLoading,
        purchaseStatus,
        setIsExpanded,
        setIsVideoRevealed,
        setIsDescriptionExpanded,
        setIsPaymentModalOpen,
        setShowRepurchaseConfirm,
        setIsDateChangeNoticeClosed,
        handleTogglePause,
        handlePurchase,
        executePurchase,
        handleClose,
        handleCoachClick,
        difficulty,
        productModality,
        modalityIcon,
        calculateWorkshopWeeks,
        totalSessions,
        exercisesCount,
        weeksCount,
        exceedsActivities,
        exceedsWeeks,
        exceedsStock,
        includedMeetCredits,
        statsLoading: planningStatsLoading,
        checkPurchaseStatus,
        loadPlanLimits,
        handleConfirmRepurchase: () => { setShowRepurchaseConfirm(false); setIsPaymentModalOpen(true); },
        handleCancelRepurchase: () => setShowRepurchaseConfirm(false),
        handleGoToActivity: () => { alert('¡Compra exitosa!'); onClose(); }
    }
}
