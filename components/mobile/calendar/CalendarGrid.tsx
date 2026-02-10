"use client"

import React from 'react'
import { DayData } from './types'
import { ActivityRing } from './ActivityRing'

interface CalendarGridProps {
    monthlyData: DayData[]
    dayNames: string[]
    sourceDate: Date | null
    isEditing: boolean
    handleDayClick: (dateStr: string) => void
}

export function CalendarGrid({
    monthlyData,
    dayNames,
    sourceDate,
    isEditing,
    handleDayClick
}: CalendarGridProps) {
    const today = new Date().toDateString()

    return (
        <div className="w-full">
            {/* Week Days Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2 w-full px-1">
                {dayNames.map((day, index) => (
                    <div key={index} className="text-center text-[10px] sm:text-sm text-gray-400 font-medium py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
                {monthlyData.map((day, index) => {
                    // Empty cells for month padding
                    if (day.day === 0) {
                        return <div key={index} className="h-20"></div>
                    }

                    const kcalProgress = day.kcalTarget > 0 ? (day.kcal / day.kcalTarget) * 100 : 0
                    const minutesProgress = day.minutesTarget > 0 ? (day.minutes / day.minutesTarget) * 100 : 0
                    const exercisesProgress = day.exercisesTarget > 0 ? (day.exercises / day.exercisesTarget) * 100 : 0

                    const parsedDate = day.date ? new Date(parseInt(day.date.split('-')[0]), parseInt(day.date.split('-')[1]) - 1, parseInt(day.date.split('-')[2])) : null

                    const isToday = today === parsedDate?.toDateString()
                    const isSource = sourceDate && parsedDate && sourceDate.toDateString() === parsedDate.toDateString()

                    return (
                        <div
                            key={day.date}
                            onClick={() => day.date && handleDayClick(day.date)}
                            className={`h-20 flex flex-col items-center justify-center space-y-1 rounded-xl transition-all relative ${isEditing && day.date ? 'cursor-pointer hover:bg-white/5' : ''
                                } ${isSource ? 'bg-[#FF7939]/20 ring-1 ring-[#FF7939]' : ''
                                }`}
                        >
                            {isSource && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF7939] rounded-full flex items-center justify-center text-[8px] font-bold text-white z-10">
                                    1
                                </div>
                            )}

                            <div className={`text-xs font-medium transition-colors ${isToday
                                ? 'text-white bg-red-500 rounded-full w-6 h-6 flex items-center justify-center shadow-md'
                                : isSource
                                    ? 'text-[#FF7939] font-bold'
                                    : 'text-gray-300'
                                }`}>
                                {day.day}
                            </div>

                            <div
                                className="flex justify-center relative transition-opacity"
                                style={{ width: 40, height: 40 }}
                            >
                                {/* Outer Ring - Kcal */}
                                <ActivityRing
                                    progress={kcalProgress}
                                    color="#FF6A00"
                                    size={40}
                                />

                                {/* Middle Ring - Minutes */}
                                {day.minutesTarget > 0 && (
                                    <div className="absolute top-1 left-1">
                                        <ActivityRing
                                            progress={minutesProgress}
                                            color="#FF8C42"
                                            size={32}
                                        />
                                    </div>
                                )}

                                {/* Inner Ring - Exercises/Dishes */}
                                <div className={`absolute ${day.minutesTarget > 0 ? 'top-2 left-2' : 'top-1 left-1'}`}>
                                    <ActivityRing
                                        progress={exercisesProgress}
                                        color="#FFFFFF"
                                        size={day.minutesTarget > 0 ? 24 : 32}
                                    />
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
