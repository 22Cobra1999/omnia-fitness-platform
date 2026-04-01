import type { Enrollment } from "@/types/activity"

export interface PurchasedActivityCardProps {
    enrollment: Enrollment
    nextActivity?: {
        title: string
        day: string
        week: number
    } | null
    realProgress?: number
    onActivityClick?: (activityId: string, enrollmentId: string) => void
    onStartActivity?: (activityId: string, recommendedDay?: number) => void
    size?: "small" | "medium" | "large"
    // New override props for Coach View
    overridePendingCount?: number
    overrideNextSessionDate?: string | null
    isCoachView?: boolean
    daysCompleted?: number
    daysPassed?: number
    daysMissed?: number
    daysIncomplete?: number
    daysRemainingFuture?: number
    itemsCompletedTotal?: number
    itemsDebtPast?: number
    itemsPendingToday?: number
    itemsObjectiveToday?: number
    itemsPendingTodayReal?: number
    amountPaid?: number
    streak?: number
}

export type CardSize = "small" | "medium" | "large"
