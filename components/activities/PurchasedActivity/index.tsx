"use client"

import React from "react"
import { cn } from "@/lib/utils/utils"
import { PurchasedActivityCardHeader } from './components/PurchasedActivityCardHeader'
import { PurchasedActivityCardContent } from './components/PurchasedActivityCardContent'
import { usePurchasedActivityLogic } from './hooks/usePurchasedActivityLogic'
import { PurchasedActivityCardProps } from './types'
import { getSizeClasses } from './utils'

export function PurchasedActivityCard(props: PurchasedActivityCardProps) {
    const {
        enrollment,
        nextActivity,
        realProgress,
        onActivityClick,
        size = "medium",
        isCoachView = false,
        overridePendingCount,
        overrideNextSessionDate,
        daysCompleted,
        daysPassed,
        daysMissed,
        daysRemainingFuture,
        itemsCompletedTotal,
        itemsDebtPast,
        itemsPendingToday
    } = props

    const { activity } = enrollment
    const {
        pendingCount,
        nextSessionDate,
        isFinished,
        progress,
        hasStarted,
        daysInfo,
        handleCardClick
    } = usePurchasedActivityLogic({
        enrollment,
        realProgress,
        overridePendingCount,
        overrideNextSessionDate,
        onActivityClick,
        isCoachView
    })

    const imageUrl = activity.media?.image_url || activity.image_url || null

    return (
        <div
            className={cn(
                getSizeClasses(size),
                "cursor-pointer group relative mx-auto flex-shrink-0"
            )}
            onClick={handleCardClick}
        >
            <div
                className={cn(
                    "bg-[#1A1A1A] rounded-2xl overflow-hidden border border-gray-800 transition-all duration-200 h-full flex flex-col relative",
                    "hover:border-[#FF7939]/30 hover:scale-[1.02]",
                    daysInfo.isExpired && !hasStarted && "opacity-50 grayscale"
                )}
            >
                <PurchasedActivityCardHeader
                    imageUrl={imageUrl}
                    title={activity.title}
                    size={size}
                    isCoachView={isCoachView}
                />

                <PurchasedActivityCardContent
                    activity={activity}
                    enrollment={enrollment}
                    size={size}
                    isCoachView={isCoachView}
                    daysInfo={daysInfo}
                    pendingCount={pendingCount}
                    nextSessionDate={nextSessionDate}
                    nextActivity={nextActivity}
                    isFinished={isFinished}
                    progress={progress}
                    hasStarted={hasStarted}
                    daysCompleted={daysCompleted}
                    daysPassed={daysPassed}
                    daysMissed={daysMissed}
                    daysRemainingFuture={daysRemainingFuture}
                    itemsCompletedTotal={itemsCompletedTotal}
                    itemsDebtPast={itemsDebtPast}
                    itemsPendingToday={itemsPendingToday}
                />
            </div>
        </div>
    )
}
