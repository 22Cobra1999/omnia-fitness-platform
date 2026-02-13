"use client"

import React from "react"
import { Edit, ChevronRight } from "lucide-react"
import { useGoalsProgress } from "./useGoalsProgress"
import { ActivityTagCard } from "./goals-progress/ActivityTagCard"
import { PersonalBestCard } from "./goals-progress/PersonalBestCard"
import { GoalsModals } from "./goals-progress/GoalsModals"

export function GoalsProgress() {
  const { state, actions } = useGoalsProgress()

  return (
    <div className="space-y-6">
      {/* Tags and Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tags Section */}
        <div className="md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-white">Activity Tags</h3>
            <button
              className="w-7 h-7 rounded-full bg-[#1A1A1A] flex items-center justify-center"
              onClick={() => actions.setIsManagingTags(true)}
            >
              <Edit className="w-3.5 h-3.5 text-[#FF7939]" />
            </button>
          </div>

          <div className="space-y-3">
            {state.userTags.map((tag) => (
              <ActivityTagCard
                key={tag.id}
                tag={tag}
                isSelected={state.selectedTag === tag.id}
                onToggle={actions.toggleTag}
                onLog={actions.setIsLoggingActivity}
              />
            ))}
          </div>
        </div>

        {/* Personal Bests Section */}
        <div className="md:col-span-1">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-white">Personal Records</h3>
            <button
              className="w-7 h-7 rounded-full bg-[#1A1A1A] flex items-center justify-center"
              onClick={() => actions.setIsViewingAllBests(true)}
            >
              <ChevronRight className="w-4 h-4 text-[#FF7939]" />
            </button>
          </div>

          <div className="space-y-3">
            {state.userBests.slice(0, 3).map((best) => (
              <PersonalBestCard key={best.id} best={best} />
            ))}
          </div>
        </div>
      </div>

      {/* Dialogs & Modals */}
      <GoalsModals state={state} actions={actions} />
    </div>
  )
}
