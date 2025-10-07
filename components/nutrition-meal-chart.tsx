"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface NutritionMealData {
  meal: string
  calories: number
  isSnack: boolean
  protein: number
  carbs: number
  fat: number
}

interface WeeklyNutritionData {
  day: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface NutritionMealChartProps {
  data?: NutritionMealData[]
  weeklyData?: WeeklyNutritionData[]
  viewMode: "daily" | "weekly"
}

export function NutritionMealChart({ data, weeklyData, viewMode }: NutritionMealChartProps) {
  const [chartData, setChartData] = useState<NutritionMealData[]>([])
  const [weekData, setWeekData] = useState<WeeklyNutritionData[]>([])
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null)

  // Default data if none provided
  useEffect(() => {
    if (viewMode === "daily") {
      if (data && data.length > 0) {
        setChartData(data)
      } else {
        // Default sample data
        const defaultData = [
          { meal: "Breakfast", calories: 650, isSnack: false, protein: 35, carbs: 75, fat: 15 },
          { meal: "Lunch", calories: 850, isSnack: false, protein: 45, carbs: 90, fat: 25 },
          { meal: "Snack", calories: 350, isSnack: true, protein: 15, carbs: 40, fat: 10 },
          { meal: "Dinner", calories: 750, isSnack: false, protein: 40, carbs: 60, fat: 30 },
        ]
        setChartData(defaultData)
      }
    } else {
      if (weeklyData && weeklyData.length > 0) {
        setWeekData(weeklyData)
      } else {
        // Default weekly data
        const defaultWeekData = [
          { day: "Mon", calories: 2100, protein: 120, carbs: 220, fat: 70 },
          { day: "Tue", calories: 2250, protein: 130, carbs: 240, fat: 75 },
          { day: "Wed", calories: 2050, protein: 125, carbs: 210, fat: 68 },
          { day: "Thu", calories: 2300, protein: 135, carbs: 250, fat: 78 },
          { day: "Fri", calories: 2400, protein: 140, carbs: 260, fat: 80 },
          { day: "Sat", calories: 2600, protein: 150, carbs: 280, fat: 85 },
          { day: "Sun", calories: 2000, protein: 115, carbs: 200, fat: 65 },
        ]
        setWeekData(defaultWeekData)
      }
    }
  }, [data, weeklyData, viewMode])

  // Determine which data to use based on view mode
  const displayData = viewMode === "daily" ? chartData : weekData

  // Set Y-axis scale based on view mode
  const yAxisMax = viewMode === "daily" ? 900 : 3000
  const yAxisMid = viewMode === "daily" ? 450 : 1500

  return (
    <div className="w-full">
      <Card className="bg-[#121212] border-none shadow-lg">
        <CardHeader className="pb-0 pt-2">
          <CardTitle className="text-white text-sm">Nutrition Meals</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          <div className="h-[200px] relative">
            {/* Chart container */}
            <div className="absolute inset-0">
              {/* Y-axis labels and grid lines */}
              <div className="absolute top-0 left-0 h-full flex flex-col justify-between">
                <div className="flex items-center">
                  <span className="text-[10px] text-gray-400 pl-1">{yAxisMax} kcal</span>
                  <div className="w-full border-t border-gray-800 ml-1"></div>
                </div>
                <div className="flex items-center">
                  <span className="text-[10px] text-gray-400 pl-1">{yAxisMid} kcal</span>
                  <div className="w-full border-t border-gray-800 ml-1"></div>
                </div>
                <div className="flex items-center">
                  <span className="text-[10px] text-gray-400 pl-1">0 kcal</span>
                  <div className="w-full border-t border-gray-800 ml-1"></div>
                </div>
              </div>

              {/* Chart area */}
              <div className="absolute left-[50px] right-0 bottom-[40px] top-[10px]">
                <div className="relative h-full w-full flex justify-around">
                  {displayData.map((item, index) => {
                    // Calculate height based on calories and current Y-axis scale
                    const barHeightPercent = (item.calories / yAxisMax) * 100

                    return (
                      <div
                        key={index}
                        className="flex flex-col items-center h-full"
                        style={{ width: `${80 / displayData.length}%` }}
                        onMouseEnter={() => setActiveTooltip(index)}
                        onMouseLeave={() => setActiveTooltip(null)}
                        onClick={() => setActiveTooltip(activeTooltip === index ? null : index)}
                      >
                        {/* Tooltip */}
                        {activeTooltip === index && (
                          <div className="absolute z-10 bg-black text-white text-[9px] p-1.5 rounded shadow-lg w-[90px]">
                            <div className="font-bold mb-0.5">
                              {viewMode === "daily"
                                ? (item as NutritionMealData).meal
                                : (item as WeeklyNutritionData).day}
                            </div>
                            <div className="grid grid-cols-3 gap-1 text-[8px]">
                              <div>
                                <span className="text-gray-400">Pro</span>
                                <p className="font-medium">{item.protein}g</p>
                              </div>
                              <div>
                                <span className="text-gray-400">Carb</span>
                                <p className="font-medium">{item.carbs}g</p>
                              </div>
                              <div>
                                <span className="text-gray-400">Fat</span>
                                <p className="font-medium">{item.fat}g</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Bar */}
                        <div className="h-full flex items-end w-full justify-center">
                          <div
                            className={
                              viewMode === "daily" && (item as NutritionMealData).isSnack
                                ? "w-[30%] bg-gradient-to-t from-[#FF6B35] to-[#FF8C00] relative"
                                : "w-[30%] bg-gradient-to-t from-[#FFAA5E] to-[#FF8C00] relative"
                            }
                            style={{
                              height: `${barHeightPercent}%`,
                              minHeight: item.calories > 0 ? "4px" : "0",
                              borderRadius: "6px 6px 0 0",
                              boxShadow: "0 0 8px rgba(255,138,0,0.3)",
                            }}
                          >
                            {/* Calorie value on the bar */}
                            <div className="absolute -bottom-6 w-full text-center">
                              <span className="text-[10px] font-bold text-white">{item.calories}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Meal/Day names below the chart */}
              <div className="absolute bottom-0 left-[50px] right-0 flex justify-around">
                {displayData.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center"
                    style={{ width: `${80 / displayData.length}%` }}
                  >
                    <div className="text-[9px] text-gray-400 text-center truncate w-full">
                      {viewMode === "daily" ? (item as NutritionMealData).meal : (item as WeeklyNutritionData).day}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
