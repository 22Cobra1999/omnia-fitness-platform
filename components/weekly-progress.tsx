"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Line } from "recharts"

const colorScheme = {
  nutrition: {
    protein: "#FFA07A", // Light orange
    carbs: "#FFFFFF", // White
    fat: "#FF7939", // Orange
  },
  fitness: "#FFD700", // Yellow
  gym: "#FFFFE0", // Light yellow
}

const data = {
  daily: [
    {
      name: "Mon",
      protein: 120,
      carbs: 250,
      fat: 70,
      gym: 600,
      fitness: 600,
      calories: 2500,
    },
    {
      name: "Tue",
      protein: 130,
      carbs: 280,
      fat: 65,
      gym: 700,
      fitness: 600,
      calories: 2600,
    },
    {
      name: "Wed",
      protein: 110,
      carbs: 230,
      fat: 60,
      gym: 700,
      fitness: 500,
      calories: 2400,
    },
    {
      name: "Thu",
      protein: 125,
      carbs: 260,
      fat: 68,
      gym: 700,
      fitness: 750,
      calories: 2550,
    },
    {
      name: "Fri",
      protein: 135,
      carbs: 275,
      fat: 75,
      gym: 700,
      fitness: 650,
      calories: 2700,
    },
    {
      name: "Sat",
      protein: 115,
      carbs: 240,
      fat: 62,
      gym: 700,
      fitness: 1000,
      calories: 2450,
    },
    {
      name: "Sun",
      protein: 120,
      carbs: 250,
      fat: 65,
      gym: 450,
      fitness: 750,
      calories: 2500,
    },
  ],
  weekly: [
    {
      name: "Week 1",
      protein: 5600,
      carbs: 7000,
      fat: 3500,
      gym: 4200,
      fitness: 5600,
    },
    {
      name: "Week 2",
      protein: 5900,
      carbs: 7500,
      fat: 3800,
      gym: 4700,
      fitness: 6200,
    },
    {
      name: "Week 3",
      protein: 5700,
      carbs: 7200,
      fat: 3600,
      gym: 4450,
      fitness: 5900,
    },
    {
      name: "Week 4",
      protein: 6100,
      carbs: 7800,
      fat: 3900,
      gym: 4950,
      fitness: 6300,
    },
  ],
  monthly: [
    {
      name: "Jan",
      protein: 24000,
      carbs: 30000,
      fat: 15000,
      gym: 18000,
      fitness: 24000,
    },
    {
      name: "Feb",
      protein: 22000,
      carbs: 28000,
      fat: 14000,
      gym: 17000,
      fitness: 22000,
    },
    {
      name: "Mar",
      protein: 26000,
      carbs: 32000,
      fat: 16000,
      gym: 19000,
      fitness: 26000,
    },
    {
      name: "Apr",
      protein: 25000,
      carbs: 31000,
      fat: 15500,
      gym: 18500,
      fitness: 25000,
    },
  ],
}

const chartData = {
  daily: data.daily,
  weekly: data.weekly,
  monthly: data.monthly,
}

const allActivities = [
  { key: "nutrition.protein", name: "Protein", category: "nutrition" },
  { key: "nutrition.carbs", name: "Carbs", category: "nutrition" },
  { key: "nutrition.fat", name: "Fat", category: "nutrition" },
  { key: "gym.upperBody", name: "Upper Body", category: "gym" },
  { key: "gym.lowerBody", name: "Lower Body", category: "gym" },
  { key: "gym.absAndCore", name: "Abs and Core", category: "gym" },
  { key: "fitness.running", name: "Running", category: "fitness" },
  { key: "fitness.swimming", name: "Swimming", category: "fitness" },
  { key: "fitness.cycling", name: "Cycling", category: "fitness" },
]

export function WeeklyProgress() {
  const [selectedPeriod, setSelectedPeriod] = useState("daily")

  return (
    <Card className="bg-[#1E1E1E] border-none">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Activity Progress</CardTitle>
        <div className="flex space-x-2">
          <Button
            variant={selectedPeriod === "daily" ? "default" : "outline"}
            onClick={() => setSelectedPeriod("daily")}
          >
            Daily
          </Button>
          <Button
            variant={selectedPeriod === "weekly" ? "default" : "outline"}
            onClick={() => setSelectedPeriod("weekly")}
          >
            Weekly
          </Button>
          <Button
            variant={selectedPeriod === "monthly" ? "default" : "outline"}
            onClick={() => setSelectedPeriod("monthly")}
          >
            Monthly
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData[selectedPeriod]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="#666" />
              <YAxis yAxisId="left" stroke="#666" />
              <YAxis yAxisId="right" orientation="right" stroke="#666" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1E1E1E",
                  border: "none",
                  borderRadius: "8px",
                }}
              />
              <Bar
                yAxisId="left"
                dataKey="protein"
                stackId="nutrition"
                fill={colorScheme.nutrition.protein}
                name="Protein"
              />
              <Bar yAxisId="left" dataKey="carbs" stackId="nutrition" fill={colorScheme.nutrition.carbs} name="Carbs" />
              <Bar yAxisId="left" dataKey="fat" stackId="nutrition" fill={colorScheme.nutrition.fat} name="Fat" />
              <Bar yAxisId="right" dataKey="fitness" stackId="activity" fill={colorScheme.fitness} name="Fitness" />
              <Bar yAxisId="right" dataKey="gym" stackId="activity" fill={colorScheme.gym} name="Gym" />
              <Line yAxisId="right" type="monotone" dataKey="calories" stroke="#FF7939" name="Calories" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between mt-4 px-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colorScheme.nutrition.protein }} />
            <span className="text-sm">Protein</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colorScheme.nutrition.carbs }} />
            <span className="text-sm">Carbs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colorScheme.nutrition.fat }} />
            <span className="text-sm">Fat</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colorScheme.fitness }} />
            <span className="text-sm">Fitness</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colorScheme.gym }} />
            <span className="text-sm">Gym</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-[#FF7939] rounded-full" />
            <span className="text-sm">Calories</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
