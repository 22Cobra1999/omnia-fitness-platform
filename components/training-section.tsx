"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { GeometricBackground } from "@/components/geometric-background"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Activity, Timer } from "lucide-react"

const trainingData = [
  { day: "Mon", calories: 130, distance: 20 },
  { day: "Tue", calories: 250, distance: 15 },
  { day: "Wed", calories: 180, distance: 22 },
  { day: "Thu", calories: 310, distance: 25 },
  { day: "Fri", calories: 270, distance: 18 },
  { day: "Sat", calories: 150, distance: 12 },
  { day: "Sun", calories: 200, distance: 16 },
]

const exerciseList = [
  { name: "Triceps Pushdown", sets: 4, reps: "12-15" },
  { name: "Overhead Extension", sets: 3, reps: "12" },
  { name: "Deadlift", sets: 5, reps: "5" },
  { name: "Lat Pulldown", sets: 4, reps: "12" },
]

export function TrainingSection() {
  return (
    <section className="relative bg-[#121212] text-white py-12">
      <GeometricBackground />
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Information Panel */}
          <Card className="bg-[#1E1E1E] border-none shadow-custom-lg col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-6 w-6 text-[#FF7939]" />
                Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Daily Progress</span>
                    <span className="text-[#FF7939]">65%</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
                <div className="pt-4">
                  <h4 className="text-sm font-medium mb-2">Today's Focus</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {exerciseList.map((exercise, index) => (
                      <div key={index} className="bg-black/20 p-2 rounded-lg">
                        <p className="text-sm font-medium">{exercise.name}</p>
                        <p className="text-xs text-gray-400">
                          {exercise.sets} sets × {exercise.reps} reps
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Chart */}
          <Card className="bg-[#1E1E1E] border-none shadow-custom-lg col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-6 w-6 text-[#FF7939]" />
                Weekly Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trainingData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" />
                    <XAxis dataKey="day" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1E1E1E",
                        border: "none",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="calories"
                      stroke="#FF7939"
                      strokeWidth={2}
                      dot={{ fill: "#FF7939" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="distance"
                      stroke="#4ADE80"
                      strokeWidth={2}
                      dot={{ fill: "#4ADE80" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
