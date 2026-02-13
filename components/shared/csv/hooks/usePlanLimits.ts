import { useState, useEffect } from "react"

interface PlanLimits {
    activitiesLimit: number
}

interface UsePlanLimitsProps {
    coachId: string
    planLimitsProp: { activitiesLimit?: number } | null | undefined
}

export function usePlanLimits({ coachId, planLimitsProp }: UsePlanLimitsProps) {
    const [planLimits, setPlanLimits] = useState<PlanLimits | null>(
        planLimitsProp ? { activitiesLimit: planLimitsProp.activitiesLimit || 100 } : null
    )

    useEffect(() => {
        if (planLimitsProp) {
            setPlanLimits({ activitiesLimit: planLimitsProp.activitiesLimit || 100 })
        }
    }, [planLimitsProp])

    useEffect(() => {
        if (planLimitsProp || !coachId || coachId === "") return

        const loadPlanLimits = async () => {
            try {
                const response = await fetch("/api/coach/plan-limits")
                if (response.ok) {
                    const result = await response.json()
                    if (result.success) {
                        setPlanLimits({
                            activitiesLimit: result.limits.activitiesPerProduct,
                        })
                    }
                }
            } catch (error) {
                console.error("Error cargando límites del plan:", error)
            }
        }
        loadPlanLimits()
    }, [planLimitsProp, coachId])

    return { planLimits }
}
