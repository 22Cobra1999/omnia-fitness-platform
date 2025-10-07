"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ChatWithFitnessCoach } from "@/components/chat-with-fitness-coach"
import { ModifyFitnessCalendar } from "@/components/modify-fitness-calendar"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import {
  Moon,
  Heart,
  Activity,
  MessageSquare,
  Calendar,
  TrendingUp,
  Brain,
  RotateCcw,
  Play,
  Dumbbell,
} from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"

const sleepData = [
  { day: "Mon", hours: 7.5, quality: 85 },
  { day: "Tue", hours: 6.8, quality: 75 },
  { day: "Wed", hours: 7.2, quality: 82 },
  { day: "Thu", hours: 7.8, quality: 88 },
  { day: "Fri", hours: 7.1, quality: 78 },
  { day: "Sat", hours: 7.5, quality: 84 },
  { day: "Sun", hours: 7.3, quality: 80 },
]

const recoveryData = [
  { day: "Mon", value: 65 },
  { day: "Tue", value: 70 },
  { day: "Wed", value: 68 },
  { day: "Thu", value: 75 },
  { day: "Fri", value: 72 },
  { day: "Sat", value: 69 },
  { day: "Sun", value: 71 },
]

const strainData = [
  { day: "Mon", value: 12.5 },
  { day: "Tue", value: 14.2 },
  { day: "Wed", value: 10.8 },
  { day: "Thu", value: 15.5 },
  { day: "Fri", value: 13.7 },
  { day: "Sat", value: 11.3 },
  { day: "Sun", value: 9.6 },
]

const topActivities = [
  { name: "Running", duration: 120, calories: 450 },
  { name: "Cycling", duration: 90, calories: 350 },
  { name: "Swimming", duration: 60, calories: 300 },
]

const performanceMetrics = [
  { name: "Cardio", score: 75 },
  { name: "Strength", score: 65 },
  { name: "Flexibility", score: 45 },
]

const smartInsights = [
  {
    title: "Recovery Focus",
    description: "Your sleep quality has improved by 15%. Consider increasing workout intensity.",
    icon: Brain,
    color: "#FFB56B",
  },
  {
    title: "Strain Balance",
    description: "Current strain levels suggest room for additional cardio activities.",
    icon: Activity,
    color: "#FF7939",
  },
  {
    title: "Performance Trend",
    description: "Strength metrics showing consistent improvement over the past week.",
    icon: TrendingUp,
    color: "#FFD700",
  },
]

const workoutSections = [
  {
    title: "Morning",
    options: [
      {
        title: "Dynamic Warm-Up & HIIT",
        calories: 450,
        image: "/placeholder.svg?height=300&width=400",
        type: "Cardio",
        videoUrl: "/videos/morning-hiit.mp4",
      },
      {
        title: "Yoga Flow",
        calories: 250,
        image: "/placeholder.svg?height=300&width=400",
        type: "Flexibility",
        videoUrl: "/videos/morning-yoga.mp4",
      },
      {
        title: "Bodyweight Circuit",
        calories: 350,
        image: "/placeholder.svg?height=300&width=400",
        type: "Strength",
        videoUrl: "/videos/morning-circuit.mp4",
      },
    ],
    coachNote: {
      title: "Morning Energy Activation",
      description:
        "Start with dynamic movements to wake up your body and boost metabolism. Focus on bodyweight exercises and mobility work.",
    },
  },
  {
    title: "Afternoon",
    options: [
      {
        title: "Strength Training",
        calories: 550,
        image: "/placeholder.svg?height=300&width=400",
        type: "Strength",
        videoUrl: "/videos/afternoon-strength.mp4",
      },
      {
        title: "Running Session",
        calories: 600,
        image: "/placeholder.svg?height=300&width=400",
        type: "Cardio",
        videoUrl: "/videos/afternoon-running.mp4",
      },
      {
        title: "Swimming",
        calories: 450,
        image: "/placeholder.svg?height=300&width=400",
        type: "Cardio",
        videoUrl: "/videos/afternoon-swimming.mp4",
      },
    ],
    coachNote: {
      title: "Peak Performance Window",
      description:
        "Your body temperature and muscle function are optimal during afternoon hours. Perfect time for high-intensity or strength work.",
    },
  },
  {
    title: "Evening",
    options: [
      {
        title: "Pilates Core Work",
        calories: 300,
        image: "/placeholder.svg?height=300&width=400",
        type: "Flexibility",
        videoUrl: "/videos/evening-pilates.mp4",
      },
      {
        title: "Light Cardio",
        calories: 250,
        image: "/placeholder.svg?height=300&width=400",
        type: "Cardio",
        videoUrl: "/videos/evening-cardio.mp4",
      },
      {
        title: "Mobility Flow",
        calories: 200,
        image: "/placeholder.svg?height=300&width=400",
        type: "Recovery",
        videoUrl: "/videos/evening-mobility.mp4",
      },
    ],
    coachNote: {
      title: "Evening Wind Down",
      description:
        "Focus on lower-intensity activities that won't interfere with sleep. Emphasize mobility and flexibility work.",
    },
  },
]

export function FitnessTracker() {
  const [timeframe, setTimeframe] = useState("week")
  const [openDialog, setOpenDialog] = useState<string | null>(null)

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Fitness Overview</h2>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Day</SelectItem>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Monitoring Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#1E1E1E] border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-blue-400" />
              Sleep
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sleepData}>
                  <XAxis dataKey="day" stroke="#888888" />
                  <YAxis stroke="#888888" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E1E1E",
                      border: "none",
                      borderRadius: "8px",
                    }}
                  />
                  <Line type="monotone" dataKey="hours" stroke="#8884d8" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="quality" stroke="#82ca9d" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Last night's sleep quality</span>
                <span>7.5 hrs | 82%</span>
              </div>
              <Progress value={82} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-400" />
              Recovery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={recoveryData}>
                  <XAxis dataKey="day" stroke="#888888" />
                  <YAxis stroke="#888888" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E1E1E",
                      border: "none",
                      borderRadius: "8px",
                    }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#FF7939" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Today's recovery score</span>
                <span>75%</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-yellow-400" />
              Strain
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={strainData}>
                  <XAxis dataKey="day" stroke="#888888" />
                  <YAxis stroke="#888888" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E1E1E",
                      border: "none",
                      borderRadius: "8px",
                    }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#FFD700" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Today's strain</span>
                <span>13.7</span>
              </div>
              <Progress value={68} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-[#1E1E1E] border-none">
          <CardHeader>
            <CardTitle>Top 3 Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topActivities}>
                  <XAxis dataKey="name" stroke="#888888" />
                  <YAxis stroke="#888888" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E1E1E",
                      border: "none",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="duration" fill="#FF7939" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="calories" fill="#FFB56B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {topActivities.map((activity, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">{activity.name}</span>
                  <span className="text-sm font-medium">
                    {activity.duration} min | {activity.calories} cal
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-none">
          <CardHeader>
            <CardTitle>Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceMetrics.map((metric) => (
                <div key={metric.name}>
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>{metric.name}</span>
                    <span>{metric.score}%</span>
                  </div>
                  <Progress value={metric.score} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Insights */}
      <Card className="bg-[#1E1E1E] border-none mb-8">
        <CardHeader>
          <CardTitle>Smart Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {smartInsights.map((insight, index) => (
              <div key={index} className="p-4 rounded-lg" style={{ backgroundColor: `${insight.color}10` }}>
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${insight.color}20` }}>
                    <insight.icon className="h-5 w-5" style={{ color: insight.color }} />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
                    <p className="text-sm text-gray-400">{insight.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-[#1E1E1E] border-none">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Dumbbell, label: "Log Activity", color: "#FF7939" },
              { icon: MessageSquare, label: "Chat with Coach", color: "#FFB56B" },
              { icon: Calendar, label: "Modify Calendar", color: "#FFD700" },
            ].map((action, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-4 rounded-lg flex flex-col items-center justify-center space-y-2"
                style={{ backgroundColor: `${action.color}20` }}
                onClick={() => setOpenDialog(action.label)}
              >
                <action.icon className="w-6 h-6" style={{ color: action.color }} />
                <span className="text-sm font-medium">{action.label}</span>
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Videos */}
      <div className="space-y-8">
        <h2 className="text-3xl font-bold">DAY 1 - 2000 CAL</h2>
        {workoutSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold text-white">{section.title}</h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-[#FF7939] hover:text-[#FF7939]/80"
                onClick={() => {
                  // Refresh options logic
                  console.log(`Refreshing ${section.title} options`)
                }}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Refresh Options
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {section.options.map((option, index) => (
                    <Card
                      key={index}
                      className="bg-[#1E1E1E] overflow-hidden border-none hover:shadow-lg transition-shadow"
                    >
                      <div className="relative aspect-[4/3]">
                        <Image
                          src={option.image || "/placeholder.svg"}
                          alt={option.title}
                          layout="fill"
                          objectFit="cover"
                        />
                        {option.videoUrl && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                            <Play className="w-12 h-12 text-white" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-white mb-2">{option.title}</h4>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">{option.calories} Cal / Session</span>
                          <span className="text-sm text-[#FF7939]">{option.type}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Card className="bg-[#1E1E1E]/50 border-none">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-[#FF7939]">Coach's Note</CardTitle>
                </CardHeader>
                <CardContent>
                  <h4 className="text-white font-medium mb-2">{section.coachNote.title}</h4>
                  <p className="text-sm text-gray-400">{section.coachNote.description}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        ))}
      </div>

      {/* Dialogs */}
      <Dialog open={openDialog === "Log Activity"} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Log Activity</DialogTitle>
            <DialogDescription>Log your fitness activity details here.</DialogDescription>
          </DialogHeader>
          {/* Log Activity content */}
        </DialogContent>
      </Dialog>

      <Dialog open={openDialog === "Chat with Coach"} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chat with Your Fitness Coach</DialogTitle>
            <DialogDescription>Get personalized advice and guidance.</DialogDescription>
          </DialogHeader>
          <ChatWithFitnessCoach />
        </DialogContent>
      </Dialog>

      <Dialog open={openDialog === "Modify Calendar"} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modify Your Fitness Calendar</DialogTitle>
            <DialogDescription>Adjust your fitness schedule.</DialogDescription>
          </DialogHeader>
          <ModifyFitnessCalendar />
        </DialogContent>
      </Dialog>
    </div>
  )
}
