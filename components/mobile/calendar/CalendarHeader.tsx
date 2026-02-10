"use client"

import React from 'react'
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CalendarHeaderProps {
    monthName: string
    year: number
    activityFilter: 'fitness' | 'nutricion'
    setActivityFilter: (filter: 'fitness' | 'nutricion') => void
    onPrevMonth: () => void
    onNextMonth: () => void
}

export function CalendarHeader({
    monthName,
    year,
    activityFilter,
    setActivityFilter,
    onPrevMonth,
    onNextMonth
}: CalendarHeaderProps) {
    return (
        <div className="space-y-4 max-w-full overflow-x-hidden">
            {/* Filter Toggle */}
            <div className="flex items-center justify-center gap-2 mb-2">
                <button
                    onClick={() => setActivityFilter('fitness')}
                    className={`text-xs px-4 py-1.5 rounded-full font-medium transition-all ${activityFilter === 'fitness'
                        ? 'bg-black text-[#FF7939] ring-1 ring-[#FF7939]/30'
                        : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                        }`}
                >
                    Fitness
                </button>
                <button
                    onClick={() => setActivityFilter('nutricion')}
                    className={`text-xs px-4 py-1.5 rounded-full font-medium transition-all ${activityFilter === 'nutricion'
                        ? 'bg-white text-[#FF7939]'
                        : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                        }`}
                >
                    Nutrición
                </button>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={onPrevMonth}
                        className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-400" />
                    </button>

                    <h4 className="text-lg font-semibold capitalize">
                        {monthName} {year}
                    </h4>

                    <button
                        onClick={onNextMonth}
                        className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
            </div>
        </div>
    )
}
