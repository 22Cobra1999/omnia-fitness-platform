"use client"

import { useState } from "react"
import { FitnessActivityChart } from "./fitness-activity-chart"
import { NutritionMealChart } from "./nutrition-meal-chart"

export function FitnessNutritionCharts() {
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily")

  // Daily data
  const dailyFitnessData = [
    { activity: "Running", calories: 450 },
    { activity: "Cycling", calories: 380 },
    { activity: "Weightlifting", calories: 320 },
    { activity: "Yoga", calories: 220 },
    { activity: "Swimming", calories: 500 },
  ]

  const dailyNutritionData = [
    { meal: "Breakfast", calories: 650, isSnack: false, protein: 35, carbs: 75, fat: 15 },
    { meal: "Lunch", calories: 850, isSnack: false, protein: 45, carbs: 90, fat: 25 },
    { meal: "Snack", calories: 350, isSnack: true, protein: 15, carbs: 40, fat: 10 },
    { meal: "Dinner", calories: 750, isSnack: false, protein: 40, carbs: 60, fat: 30 },
  ]

  // Weekly data
  const weeklyFitnessData = [
    { day: "Mon", calories: 520 },
    { day: "Tue", calories: 480 },
    { day: "Wed", calories: 650 },
    { day: "Thu", calories: 420 },
    { day: "Fri", calories: 580 },
    { day: "Sat", calories: 720 },
    { day: "Sun", calories: 350 },
  ]

  const weeklyNutritionData = [
    { day: "Mon", calories: 2100, protein: 120, carbs: 220, fat: 70 },
    { day: "Tue", calories: 2250, protein: 130, carbs: 240, fat: 75 },
    { day: "Wed", calories: 2050, protein: 125, carbs: 210, fat: 68 },
    { day: "Thu", calories: 2300, protein: 135, carbs: 250, fat: 78 },
    { day: "Fri", calories: 2400, protein: 140, carbs: 260, fat: 80 },
    { day: "Sat", calories: 2600, protein: 150, carbs: 280, fat: 85 },
    { day: "Sun", calories: 2000, protein: 115, carbs: 200, fat: 65 },
  ]

  return (
    <div className="space-y-2">
      {/* View toggle */}
      <div className="flex justify-center mb-2">
        <div className="bg-[#1E1E1E] rounded-full p-1 flex text-xs">
          <button
            onClick={() => setViewMode("daily")}
            className={`px-4 py-1 rounded-full transition-colors ${
              viewMode === "daily" ? "bg-[#FF8C00] text-black font-medium" : "text-gray-400"
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setViewMode("weekly")}
            className={`px-4 py-1 rounded-full transition-colors ${
              viewMode === "weekly" ? "bg-[#FF8C00] text-black font-medium" : "text-gray-400"
            }`}
          >
            Weekly
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-2">
        <FitnessActivityChart
          data={viewMode === "daily" ? dailyFitnessData : undefined}
          weeklyData={viewMode === "weekly" ? weeklyFitnessData : undefined}
          viewMode={viewMode}
        />
        <NutritionMealChart
          data={viewMode === "daily" ? dailyNutritionData : undefined}
          weeklyData={viewMode === "weekly" ? weeklyNutritionData : undefined}
          viewMode={viewMode}
        />
      </div>
    </div>
  )
}
