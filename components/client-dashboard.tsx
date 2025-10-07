"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { ArrowLeft, Search, Bell, Plus, ChevronDown, Activity, Dumbbell, Apple } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"

const weightData = [
  { month: "Jan", weight: 75 },
  { month: "Feb", weight: 74 },
  { month: "Mar", weight: 73.5 },
  { month: "Apr", weight: 72.8 },
  { month: "May", weight: 72 },
  { month: "Jun", weight: 71.5 },
]

const stepsData = [
  { day: "Mon", steps: 8000 },
  { day: "Tue", steps: 10000 },
  { day: "Wed", steps: 9000 },
  { day: "Thu", steps: 11000 },
  { day: "Fri", steps: 9500 },
  { day: "Sat", steps: 8500 },
  { day: "Sun", steps: 7500 },
]

const nutritionData = [
  { name: "Protein", value: 30, color: "#FF7939" },
  { name: "Carbs", value: 50, color: "#FFB56B" },
  { name: "Fats", value: 20, color: "#FFD700" },
]

const activities = [
  { name: "Running", duration: "45 min", calories: 450, time: "08:30 AM", icon: Activity },
  { name: "Weight Training", duration: "60 min", calories: 380, time: "10:30 AM", icon: Dumbbell },
  { name: "Meal: Breakfast", duration: null, calories: 650, time: "07:00 AM", icon: Apple },
]

export function ClientDashboard() {
  const [selectedMetric, setSelectedMetric] = useState("all")
  const [timeFrame, setTimeFrame] = useState("daily")
  const router = useRouter()

  const navigateToClientProfile = () => {
    router.push("/client/1") // In a real app, you would use the actual client ID
  }

  return (
    <div className="min-h-screen bg-[#1E1E1E]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-gray-400">Welcome back, John!</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Search className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon">
              <Bell className="h-6 w-6" />
            </Button>
            <Avatar className="cursor-pointer" onClick={navigateToClientProfile}>
              <AvatarImage src="/placeholder.svg?height=40&width=40" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-[#FF7939] text-white border-none rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Current Weight</p>
                  <h3 className="text-3xl font-bold">71.5 kg</h3>
                  <p className="text-sm opacity-80">-0.5 kg this week</p>
                </div>
                <div className="p-3 bg-white/10 rounded-2xl">
                  <Activity className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-[#FF7939] to-[#FFB56B] text-white border-none rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Daily Steps</p>
                  <h3 className="text-3xl font-bold">9,500</h3>
                  <p className="text-sm opacity-80">Goal: 10,000</p>
                </div>
                <div className="p-3 bg-white/10 rounded-2xl">
                  <Activity className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-[#FFB56B] to-[#FFD700] text-white border-none rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Calories</p>
                  <h3 className="text-3xl font-bold">1,850</h3>
                  <p className="text-sm opacity-80">of 2,200 goal</p>
                </div>
                <div className="p-3 bg-white/10 rounded-2xl">
                  <Activity className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Progress Chart */}
          <Card className="bg-[#252525] border-none rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-white/10">
              <div className="flex items-center justify-between">
                <CardTitle>Progress Overview</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="inline-flex bg-[#1E1E1E] rounded-full p-1">
                  {["daily", "weekly", "monthly"].map((period) => (
                    <button
                      key={period}
                      className={`px-4 py-2 rounded-full text-sm transition-all ${
                        timeFrame === period ? "bg-[#FF7939] text-white" : "text-gray-400 hover:text-white"
                      }`}
                      onClick={() => setTimeFrame(period)}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="month" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1E1E1E",
                        border: "none",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#FF7939"
                      strokeWidth={2}
                      dot={{
                        r: 4,
                        fill: "#1E1E1E",
                        stroke: "#FF7939",
                        strokeWidth: 2,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Nutrition Overview */}
          <Card className="bg-[#252525] border-none rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-white/10">
              <div className="flex items-center justify-between">
                <CardTitle>Today's Nutrition</CardTitle>
                <Button size="icon" variant="ghost">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  {nutritionData.map((item) => (
                    <div key={item.name} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">{item.name}</span>
                        <span className="text-white">{item.value}%</span>
                      </div>
                      <div className="h-2 bg-[#1E1E1E] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${item.value}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={nutritionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {nutritionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Timeline */}
        <Card className="mt-6 bg-[#252525] border-none rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-white/10">
            <div className="flex items-center justify-between">
              <CardTitle>Today's Activities</CardTitle>
              <Input className="bg-[#1E1E1E] border-none w-[200px] rounded-full" placeholder="Search activities..." />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/10">
              {activities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-4 hover:bg-white/5">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-[#1E1E1E] rounded-xl">
                      <activity.icon className="h-5 w-5 text-[#FF7939]" />
                    </div>
                    <div>
                      <p className="font-medium">{activity.name}</p>
                      <p className="text-sm text-gray-400">{activity.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {activity.duration && <p className="text-sm text-gray-400">{activity.duration}</p>}
                    <p className="font-medium">{activity.calories} cal</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
