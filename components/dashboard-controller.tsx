"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronUp, ChevronDown } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  BarChart,
  Bar,
} from "recharts"

const mockData = [
  {
    name: "Mon",
    calories: 2000,
    protein: 120,
    fats: 65,
    carbs: 250,
    steps: 8000,
    standHours: 10,
    distanceWalked: 5,
    distanceRun: 2,
    totalHours: 2,
    heartRate: 68,
    weight: 70,
  },
  {
    name: "Tue",
    calories: 2200,
    protein: 130,
    fats: 70,
    carbs: 270,
    steps: 10000,
    standHours: 11,
    distanceWalked: 6,
    distanceRun: 3,
    totalHours: 2.5,
    heartRate: 70,
    weight: 69.8,
  },
  {
    name: "Wed",
    calories: 1800,
    protein: 110,
    fats: 60,
    carbs: 230,
    steps: 7500,
    standHours: 9,
    distanceWalked: 4,
    distanceRun: 1,
    totalHours: 1.5,
    heartRate: 65,
    weight: 69.9,
  },
  {
    name: "Thu",
    calories: 2100,
    protein: 125,
    fats: 68,
    carbs: 260,
    steps: 9000,
    standHours: 10,
    distanceWalked: 5.5,
    distanceRun: 2.5,
    totalHours: 2,
    heartRate: 69,
    weight: 69.7,
  },
  {
    name: "Fri",
    calories: 2300,
    protein: 135,
    fats: 75,
    carbs: 280,
    steps: 11000,
    standHours: 12,
    distanceWalked: 7,
    distanceRun: 4,
    totalHours: 3,
    heartRate: 72,
    weight: 69.5,
  },
  {
    name: "Sat",
    calories: 1900,
    protein: 115,
    fats: 62,
    carbs: 240,
    steps: 8500,
    standHours: 9,
    distanceWalked: 5,
    distanceRun: 1.5,
    totalHours: 1.8,
    heartRate: 67,
    weight: 69.6,
  },
  {
    name: "Sun",
    calories: 2000,
    protein: 120,
    fats: 65,
    carbs: 250,
    steps: 9500,
    standHours: 10,
    distanceWalked: 6,
    distanceRun: 2,
    totalHours: 2.2,
    heartRate: 66,
    weight: 69.4,
  },
]

const COLORS = ["#FF7939", "#FFA500", "#FFD700", "#4ADE80", "#60A5FA"]

const nutritionGoals = {
  calories: 2200,
  protein: 130,
  fats: 70,
  carbs: 270,
}

export function DashboardController() {
  const [isExpanded, setIsExpanded] = useState(false)

  const todayData = mockData[mockData.length - 1]
  const avgHeartRate = Math.round(mockData.reduce((sum, day) => sum + day.heartRate, 0) / mockData.length)
  const avgWeight = (mockData.reduce((sum, day) => sum + day.weight, 0) / mockData.length).toFixed(1)

  const nutritionData = [
    { name: "Calories", consumed: todayData.calories, remaining: nutritionGoals.calories - todayData.calories },
    { name: "Protein", consumed: todayData.protein, remaining: nutritionGoals.protein - todayData.protein },
    { name: "Fats", consumed: todayData.fats, remaining: nutritionGoals.fats - todayData.fats },
    { name: "Carbs", consumed: todayData.carbs, remaining: nutritionGoals.carbs - todayData.carbs },
  ]

  const sleepData = [
    { name: "Sleep", value: 7.5 },
    { name: "Recovery", value: 85 },
  ]

  const activityData = [
    { name: "Steps", value: todayData.steps, goal: 10000 },
    { name: "Stand Hours", value: todayData.standHours, goal: 12 },
    { name: "Distance Walked", value: todayData.distanceWalked, goal: 8 },
    { name: "Distance Run", value: todayData.distanceRun, goal: 5 },
  ]

  const generateAnalysis = () => {
    const nutritionAdherence = nutritionData.every((item) => item.consumed >= item.remaining)
    const highActivity = todayData.steps > 10000 || todayData.distanceRun > 3
    const goodSleep = sleepData[0].value >= 7 && sleepData[1].value >= 80

    if (nutritionAdherence && highActivity) {
      return "Great job! Your nutrition is on point, and you're crushing your activity goals. Keep up the momentum!"
    } else if (goodSleep && highActivity) {
      return "You're getting quality rest and staying active. Focus on hitting your nutrition targets to maximize your progress."
    } else if (nutritionAdherence && goodSleep) {
      return "Your nutrition and recovery are solid. Try to increase your activity levels for even better results."
    } else {
      return "There's room for improvement across the board. Start by focusing on one area, like nutrition or sleep, and build from there."
    }
  }

  return (
    <Card className="mt-8 bg-[#1E1E1E] border-none">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Dashboard</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-sm font-medium mb-2">Nutrition</p>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={nutritionData}
                  dataKey="consumed"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                >
                  {nutritionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Sleep & Recovery</p>
            <ResponsiveContainer width="100%" height={150}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" data={sleepData}>
                <RadialBar minAngle={15} label={{ position: "insideStart", fill: "#fff" }} background dataKey="value" />
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Activity</p>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-sm font-medium">Heart Rate</p>
            <p className="text-2xl font-bold">{todayData.heartRate} bpm</p>
            <p className="text-xs text-gray-400">Avg: {avgHeartRate} bpm</p>
          </div>
          <div>
            <p className="text-sm font-medium">Weight</p>
            <p className="text-2xl font-bold">{todayData.weight} kg</p>
            <p className="text-xs text-gray-400">Avg: {avgWeight} kg</p>
          </div>
          <div>
            <p className="text-sm font-medium">Total Active Hours</p>
            <p className="text-2xl font-bold">{todayData.totalHours} hrs</p>
            <p className="text-xs text-gray-400">Goal: 3 hrs</p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-[#2A2A2A] rounded-lg">
          <p className="text-sm font-medium mb-2">Analysis</p>
          <p className="text-base">{generateAnalysis()}</p>
        </div>

        {isExpanded && (
          <div className="mt-6">
            <h4 className="text-lg font-semibold mb-4">Weekly Progress</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis yAxisId="left" stroke="#888" />
                <YAxis yAxisId="right" orientation="right" stroke="#888" />
                <Tooltip contentStyle={{ backgroundColor: "#1E1E1E", border: "none" }} labelStyle={{ color: "#fff" }} />
                <Line yAxisId="left" type="monotone" dataKey="calories" stroke="#FF7939" strokeWidth={2} />
                <Line yAxisId="left" type="monotone" dataKey="steps" stroke="#4ADE80" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="weight" stroke="#60A5FA" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="heartRate" stroke="#FFA500" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
