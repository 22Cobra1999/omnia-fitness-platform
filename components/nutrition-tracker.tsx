"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Plus, Settings } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

interface MacroData {
  name: string
  current: number
  target: number
  color: string
  percentage: number
}

const macroData: MacroData[] = [
  { name: "Protein", current: 75, target: 120, color: "#FF7939", percentage: (75 / 120) * 100 },
  { name: "Carbs", current: 180, target: 250, color: "#FFB56B", percentage: (180 / 250) * 100 },
  { name: "Fat", current: 45, target: 60, color: "#FFD700", percentage: (45 / 60) * 100 },
]

export function NutritionTracker() {
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null)

  const totalCalories = macroData.reduce((sum, macro) => sum + macro.current * (macro.name === "Fat" ? 9 : 4), 0)
  const targetCalories = macroData.reduce((sum, macro) => sum + macro.target * (macro.name === "Fat" ? 9 : 4), 0)

  return (
    <Card className="bg-black border-none">
      <CardHeader>
        <CardTitle className="text-center text-white/90 font-mitr">Nutrition Overview</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Current Plan</h3>
            <p className="text-gray-300">Weight Loss</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Diet Type</h3>
            <p className="text-gray-300">Low Carb</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">Calorie Goal</h3>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300">
              {totalCalories} / {targetCalories} kcal
            </span>
            <span className="text-gray-300">{Math.round((totalCalories / targetCalories) * 100)}%</span>
          </div>
          <Progress value={(totalCalories / targetCalories) * 100} className="h-2" />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-2">Macro Nutrients</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={macroData} layout="vertical">
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="name" type="category" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1E1E1E",
                  border: "none",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="current" fill="#FF7939" radius={[0, 4, 4, 0]}>
                {macroData.map((entry, index) => (
                  <Bar key={`cell-${index}`} dataKey="current" fill={entry.color} radius={[0, 4, 4, 0]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-between text-sm text-gray-400">
            {macroData.map((macro) => (
              <div key={macro.name}>
                <span style={{ color: macro.color }}>{macro.name}</span>
                <span className="ml-2">
                  {macro.current}g / {macro.target}g
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          <Button
            variant="outline"
            size="sm"
            className="text-[#FF7939] border-[#FF7939] hover:bg-[#FF7939] hover:text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Log Meal
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-[#FF7939] border-[#FF7939] hover:bg-[#FF7939] hover:text-white"
          >
            <Settings className="w-4 h-4 mr-2" />
            Adjust Plan
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
