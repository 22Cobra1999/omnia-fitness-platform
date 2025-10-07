"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface FitnessActivityData {
  activity: string
  calories: number
  hours: number
}

interface WeeklyFitnessData {
  day: string
  calories: number
  hours: number
}

interface FitnessActivityChartProps {
  data?: FitnessActivityData[]
  weeklyData?: WeeklyFitnessData[]
  viewMode: "daily" | "weekly"
}

export function FitnessActivityChart({ data, weeklyData, viewMode }: FitnessActivityChartProps) {
  const [chartData, setChartData] = useState<FitnessActivityData[]>([])
  const [weekData, setWeekData] = useState<WeeklyFitnessData[]>([])

  // Default data if none provided
  useEffect(() => {
    if (viewMode === "daily") {
      if (data && data.length > 0) {
        setChartData(data)
      } else {
        // Default sample data with hours
        const defaultData = [
          { activity: "Running", calories: 450, hours: 1.2 },
          { activity: "Cycling", calories: 380, hours: 1.5 },
          { activity: "Weightlifting", calories: 320, hours: 0.8 },
          { activity: "Yoga", calories: 220, hours: 1.0 },
          { activity: "Swimming", calories: 500, hours: 1.3 },
        ]
        setChartData(defaultData)
      }
    } else {
      if (weeklyData && weeklyData.length > 0) {
        setWeekData(weeklyData)
      } else {
        // Default weekly data with hours
        const defaultWeekData = [
          { day: "Mon", calories: 520, hours: 1.5 },
          { day: "Tue", calories: 480, hours: 1.3 },
          { day: "Wed", calories: 650, hours: 2.0 },
          { day: "Thu", calories: 420, hours: 1.2 },
          { day: "Fri", calories: 580, hours: 1.7 },
          { day: "Sat", calories: 720, hours: 2.5 },
          { day: "Sun", calories: 350, hours: 1.0 },
        ]
        setWeekData(defaultWeekData)
      }
    }
  }, [data, weeklyData, viewMode])

  // Determine which data to use based on view mode
  const displayData = viewMode === "daily" ? chartData : weekData

  // Calculate maximum calorie value
  const maxCalories = Math.max(...displayData.map((item) => item.calories), 100)

  // Set Y-axis scale based on view mode
  // For daily view: 20% more than the highest value, rounded to nearest 100
  // For weekly view: fixed at 750
  const yAxisMax = viewMode === "daily" ? Math.ceil((maxCalories * 1.2) / 100) * 100 : 750

  const yAxisMid = Math.round(yAxisMax / 2)

  return (
    <div className="w-full">
      <Card className="bg-[#121212] border-none shadow-lg">
        <CardHeader className="pb-0 pt-2">
          <CardTitle className="text-white text-sm">Fitness Activity</CardTitle>
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
                      >
                        {/* Bar */}
                        <div className="h-full flex items-end w-full justify-center">
                          <div
                            className="w-[30%] bg-gradient-to-t from-[#FF8C00] to-[#FF6B35] relative flex flex-col items-center justify-center"
                            style={{
                              height: `${barHeightPercent}%`,
                              minHeight: item.calories > 0 ? "4px" : "0",
                              borderRadius: "6px 6px 0 0",
                              boxShadow: "0 0 8px rgba(255,107,53,0.3)",
                            }}
                          >
                            {/* Hours displayed vertically inside the bar */}
                            {viewMode === "daily" && barHeightPercent > 20 && (
                              <div className="text-white text-[10px] font-bold flex flex-col items-center leading-tight">
                                <span>{item.hours}</span>
                                <span>h</span>
                                <span>r</span>
                                <span>s</span>
                              </div>
                            )}

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

              {/* Activity/Day names below the chart */}
              <div className="absolute bottom-0 left-[50px] right-0 flex justify-around">
                {displayData.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center"
                    style={{ width: `${80 / displayData.length}%` }}
                  >
                    <div className="text-[9px] text-gray-400 text-center truncate w-full">
                      {viewMode === "daily" ? (item as FitnessActivityData).activity : (item as WeeklyFitnessData).day}
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
