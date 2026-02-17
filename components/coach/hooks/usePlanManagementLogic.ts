import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'

export type PlanType = 'free' | 'basico' | 'black' | 'premium'

export interface Plan {
    id: string
    plan_type: PlanType
    storage_limit_gb: number
    storage_used_gb: number
    storage_available_gb: number
    status: string
    started_at?: string
    expires_at?: string
    mercadopago_subscription_id?: string
    mercadopago_subscription_next_payment_date?: string
}

export function usePlanManagementLogic() {
    const [loading, setLoading] = useState(true)
    const [changing, setChanging] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [currentPlan, setCurrentPlan] = useState<Plan | null>(null)
    const [pendingPlan, setPendingPlan] = useState<any>(null)
    const [showPlansDialog, setShowPlansDialog] = useState(false)
    const [confirmingPlan, setConfirmingPlan] = useState<string | null>(null)
    const [showPaymentSummary, setShowPaymentSummary] = useState(false)
    const [paymentPlanType, setPaymentPlanType] = useState<PlanType | null>(null)
    const [showSuccessMessage, setShowSuccessMessage] = useState(false)
    const [successMessage, setSuccessMessage] = useState<any>(null)
    const planSectionRef = useRef<HTMLDivElement>(null)

    const openPaymentSummary = (planType: PlanType) => {
        setPaymentPlanType(planType)
        setShowPaymentSummary(true)
    }

    const closePaymentSummary = () => {
        setShowPaymentSummary(false)
        setPaymentPlanType(null)
    }

    const loadCurrentPlan = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch('/api/coach/plan', {
                credentials: 'include'
            })

            if (!response.ok) {
                console.error(`Error HTTP: ${response.status} ${response.statusText}`)
                const errorText = await response.text()
                console.error('Error response:', errorText)
                setError(`Error al cargar plan: ${response.status}`)
                setLoading(false)
                return
            }

            const result = await response.json()

            if (result.success) {
                setCurrentPlan(result.plan)
                setPendingPlan(result.pending_plan || null)
            } else {
                setError(result.error || 'Error al cargar plan')
            }
        } catch (err) {
            console.error('Error cargando plan:', err)
            setError('Error de conexión')
        } finally {
            setLoading(false)
        }
    }

    const confirmPlanChange = async (planType: string) => {
        if (changing) return

        setChanging(planType)
        setError(null)

        try {
            const response = await fetch('/api/coach/plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ plan_type: planType })
            })

            const result = await response.json()

            if (result.success) {
                // Si hay un init_point de Mercado Pago, redirigir para el pago
                if (result.subscription_init_point) {
                    console.log('🚀 Redirigiendo a Mercado Pago:', result.subscription_init_point)
                    window.location.href = result.subscription_init_point
                    return
                }

                setCurrentPlan(result.plan)
                setConfirmingPlan(null)
                setShowPlansDialog(false)

                // Determinar si es upgrade o downgrade
                const isUpgrade = result.is_upgrade
                const isDowngrade = result.is_downgrade

                if (isUpgrade) {
                    setSuccessMessage({
                        title: '¡Disfruta tu nuevo plan!',
                        description: result.message || `Plan actualizado a ${planType} exitosamente`,
                        type: 'upgrade'
                    })
                    setShowSuccessMessage(true)

                    toast.success('¡Disfruta tu nuevo plan!', {
                        description: result.message || `Plan actualizado a ${planType} exitosamente`,
                        duration: 5000,
                    })
                } else if (isDowngrade) {
                    const expiresAt = currentPlan?.expires_at
                        ? new Date(currentPlan.expires_at)
                        : null

                    const expiresDate = expiresAt
                        ? expiresAt.toLocaleDateString('es-AR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })
                        : 'la fecha de expiración de tu plan actual'

                    setSuccessMessage({
                        title: 'Cambio de plan programado',
                        description: `Aún podrás usar tu plan actual hasta el ${expiresDate}. El nuevo plan comenzará automáticamente después de esa fecha.`,
                        type: 'downgrade'
                    })
                    setShowSuccessMessage(true)

                    toast.info('Cambio de plan programado', {
                        description: `Aún podrás usar tu plan actual hasta el ${expiresDate}. El nuevo plan comenzará automáticamente después.`,
                        duration: 6000,
                    })
                } else {
                    setSuccessMessage({
                        title: '¡Plan actualizado!',
                        description: result.message || `Plan cambiado a ${planType} exitosamente`,
                        type: 'normal'
                    })
                    setShowSuccessMessage(true)

                    toast.success('¡Plan actualizado!', {
                        description: result.message || `Plan cambiado a ${planType} exitosamente`,
                        duration: 3000,
                    })
                }
            } else {
                const detailMsg = result.details ? `: ${typeof result.details === 'object' ? JSON.stringify(result.details) : result.details}` : ''
                const fullError = (result.error || 'Error al cambiar plan') + detailMsg

                setError(fullError)
                setConfirmingPlan(null)
                toast.error('Error al cambiar plan', {
                    description: result.error ? (result.error + (result.details ? ` (${result.details})` : '')) : 'No se pudo cambiar el plan',
                    duration: 8000,
                })
            }
        } catch (err) {
            console.error('Error cambiando plan:', err)
            setError('Error de conexión')
            setConfirmingPlan(null)
            toast.error('Error de conexión', {
                description: 'No se pudo conectar con el servidor',
            })
        } finally {
            setChanging(null)
        }
    }

    const getPlanLevel = (planType: string): number => {
        const levels: Record<string, number> = {
            free: 0,
            basico: 1,
            black: 2,
            premium: 3
        }
        return levels[planType] || 0
    }

    const formatDate = (dateString: string | null | undefined): string => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0
        }).format(price)
    }

    const formatGB = (gb: number) => {
        if (gb < 0.001) return '0 GB'
        return `${gb.toFixed(2)} GB`
    }

    const handleContinue = () => {
        setShowSuccessMessage(false)
        setSuccessMessage(null)
        window.location.reload()
    }

    useEffect(() => {
        loadCurrentPlan()

        const successStored = localStorage.getItem('plan_change_success')
        if (successStored) {
            toast.success('¡Plan actualizado!', {
                description: successStored,
                duration: 5000,
            })
            localStorage.removeItem('plan_change_success')
        }
    }, [])

    useEffect(() => {
        const handleNavigateToSection = (event: CustomEvent) => {
            const { section } = event.detail
            if (section === 'plans') {
                setTimeout(() => {
                    setShowPlansDialog(true)
                    if (planSectionRef.current) {
                        planSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                }, 500)
            }
        }

        window.addEventListener('navigateToSection', handleNavigateToSection as EventListener)
        return () => {
            window.removeEventListener('navigateToSection', handleNavigateToSection as EventListener)
        }
    }, [])

    return {
        loading,
        changing,
        error,
        currentPlan,
        pendingPlan,
        showPlansDialog,
        setShowPlansDialog,
        confirmingPlan,
        setConfirmingPlan,
        showPaymentSummary,
        setShowPaymentSummary,
        openPaymentSummary,
        closePaymentSummary,
        paymentPlanType,
        showSuccessMessage,
        successMessage,
        planSectionRef,
        loadCurrentPlan,
        confirmPlanChange,
        getPlanLevel,
        formatDate,
        formatPrice,
        formatGB,
        handleContinue
    }
}
