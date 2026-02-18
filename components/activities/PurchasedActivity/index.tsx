"use client"

import React from "react"
import { Flame } from "lucide-react"
import { cn } from "@/lib/utils/utils"


import { PurchasedActivityCardHeader } from './components/PurchasedActivityCardHeader'
import { PurchasedActivityCardContent } from './components/PurchasedActivityCardContent'
import { usePurchasedActivityLogic } from './hooks/usePurchasedActivityLogic'
import { PurchasedActivityCardProps } from './types'
import { getSizeClasses } from './utils'

import { useState } from "react"
import { SurveyViewModal } from "@/components/shared/activities/SurveyViewModal"

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

    const [showFeedback, setShowFeedback] = useState(false)

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
        <>
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
                        daysInfo.isExpired && "opacity-80"
                    )}
                >
                    <PurchasedActivityCardHeader
                        imageUrl={imageUrl}
                        title={activity.title}
                        size={size}
                        isCoachView={isCoachView}
                        isExpired={daysInfo.isExpired}
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

                {/* Ratings and Feedback - Below the card */}
                {(enrollment.rating_coach || enrollment.feedback_text) && (
                    <div className="mt-3 flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 rounded-full border border-orange-500/20">
                            <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                            <span className="text-xs font-bold text-orange-500">
                                {enrollment.rating_coach}
                            </span>
                        </div>
                        {enrollment.feedback_text && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setShowFeedback(true)
                                }}
                                className="text-[10px] font-medium text-zinc-500 hover:text-zinc-400 underline underline-offset-2"
                            >
                                Ver respuestas
                            </button>
                        )}
                    </div>
                )}
            </div>

            <SurveyViewModal
                isOpen={showFeedback}
                onClose={() => setShowFeedback(false)}
                enrollment={enrollment}
            />
        </>
    )
}
