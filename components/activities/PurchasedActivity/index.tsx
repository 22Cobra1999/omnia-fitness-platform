"use client"

import React from "react"
import Image from "next/image"
import { Flame, Star } from "lucide-react"
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
        daysIncomplete,
        daysRemainingFuture,
        itemsCompletedTotal,
        itemsDebtPast,
        itemsPendingToday,
        itemsObjectiveToday,
        itemsPendingTodayReal,
        amountPaid,
        streak: overrideStreak
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
        streak,
        handleCardClick,
        isFuture,
        daysToStart
    } = usePurchasedActivityLogic({
        enrollment,
        realProgress,
        overridePendingCount: overridePendingCount ?? itemsPendingToday,
        overrideNextSessionDate,
        onActivityClick,
        isCoachView,
        overrideStreak
    })

    const imageUrl = activity.media?.image_url || activity.image_url || null

    return (
        <>
            <div
                className={cn(
                    getSizeClasses(size),
                    "cursor-pointer group relative mx-auto flex-shrink-0 bg-[#121212] overflow-hidden rounded-[2.8rem]"
                )}
                onClick={handleCardClick}
            >

                <div
                    className={cn(
                        "bg-black rounded-[2.8rem] overflow-hidden border border-white/5 transition-all duration-500 h-full flex flex-col relative shrink-0",
                        "hover:border-white/10 hover:-translate-y-1.5",
                        daysInfo.isExpired && "opacity-80"
                    )}
                >
                    {/* Full Card background is handled by Header (Image) and Content (Solid Black) */}

                    <PurchasedActivityCardHeader
                        imageUrl={imageUrl}
                        title={activity.title}
                        coachName={activity.coach_name || 'Coach'}
                        coachAvatarUrl={activity.coach_avatar_url}
                        coachRating={activity.coach_rating}
                        size={size}
                        isCoachView={isCoachView}
                        isExpired={daysInfo.isExpired}
                        progress={progress}
                        isFinished={isFinished}
                        isFuture={isFuture}
                        streak={streak}
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
                        daysIncomplete={daysIncomplete}
                        daysRemainingFuture={daysRemainingFuture}
                        itemsCompletedTotal={itemsCompletedTotal}
                        itemsDebtPast={itemsDebtPast}
                        itemsPendingToday={itemsPendingToday}
                        itemsObjectiveToday={itemsObjectiveToday}
                        itemsPendingTodayReal={itemsPendingTodayReal}
                        isFuture={isFuture}
                        daysToStart={daysToStart}
                        streak={streak}
                    />
                </div>

                {/* Ratings and Feedback - Below the card */}
                {(enrollment.rating_coach || enrollment.feedback_text) && (
                    <div className="mt-3 flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-black rounded-full border border-white/5">
                            <Star className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
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
            </div >

            <SurveyViewModal
                isOpen={showFeedback}
                onClose={() => setShowFeedback(false)}
                enrollment={enrollment}
            />
        </>
    )
}
