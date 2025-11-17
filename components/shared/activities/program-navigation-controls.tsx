"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Dumbbell, ChefHat } from "lucide-react"

interface ProgramItem {
  id: string
  type: "fitness" | "nutrition"
  week: number
  day: number
  name: string
  mealType?: string
}

interface ProgramNavigationControlsProps {
  currentItem: ProgramItem | null
  nextItem: ProgramItem | null
  previousItem: ProgramItem | null
  hasNext: boolean
  hasPrevious: boolean
  onNext: () => void
  onPrevious: () => void
  loading?: boolean
}

export function ProgramNavigationControls({
  currentItem,
  nextItem,
  previousItem,
  hasNext,
  hasPrevious,
  onNext,
  onPrevious,
  loading = false,
}: ProgramNavigationControlsProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-4">
        <div className="h-12 w-24 bg-gray-800 rounded-full animate-pulse" />
        <div className="h-12 w-24 bg-gray-800 rounded-full animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <Button
        onClick={onPrevious}
        disabled={!hasPrevious}
        className="bg-orange-500/80 hover:bg-orange-500 text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">
          {previousItem ? (
            <div className="flex items-center gap-1">
              {previousItem.type === "fitness" ? <Dumbbell className="h-3 w-3" /> : <ChefHat className="h-3 w-3" />}
              <span className="text-xs">{previousItem.name.substring(0, 10)}...</span>
            </div>
          ) : (
            "Anterior"
          )}
        </span>
        <span className="sm:hidden">Anterior</span>
      </Button>

      {currentItem && (
        <div className="text-center text-white text-sm">
          <div className="flex items-center justify-center gap-1 mb-1">
            {currentItem.type === "fitness" ? (
              <Dumbbell className="h-4 w-4 text-orange-500" />
            ) : (
              <ChefHat className="h-4 w-4 text-orange-500" />
            )}
            <span className="font-medium">{currentItem.name}</span>
          </div>
          <div className="text-xs text-gray-400">
            Semana {currentItem.week} • Día {currentItem.day}
          </div>
        </div>
      )}

      <Button
        onClick={onNext}
        disabled={!hasNext}
        className="bg-orange-500/80 hover:bg-orange-500 text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="hidden sm:inline">
          {nextItem ? (
            <div className="flex items-center gap-1">
              {nextItem.type === "fitness" ? <Dumbbell className="h-3 w-3" /> : <ChefHat className="h-3 w-3" />}
              <span className="text-xs">{nextItem.name.substring(0, 10)}...</span>
            </div>
          ) : (
            "Siguiente"
          )}
        </span>
        <span className="sm:hidden">Siguiente</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
