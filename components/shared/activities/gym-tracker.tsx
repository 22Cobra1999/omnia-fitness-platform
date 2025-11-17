"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ChatWithGymCoach } from "@/components/chat-with-gym-coach"
import { ModifyGymCalendar } from '@/components/shared/calendar/modify-gym-calendar'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Dumbbell, TrendingUp, Weight, MessageSquare, Calendar, RotateCcw, Play, Zap, Clock } from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"

const strengthData = [
  { day: "Mon", value: 85 },
  { day: "Tue", value: 90 },
  { day: "Wed", value: 88 },
  { day: "Thu", value: 95 },
  { day: "Fri", value: 92 },
  { day: "Sat", value: 89 },
  { day: "Sun", value: 91 },
]

const powerData = [
  { day: "Mon", value: 75 },
  { day: "Tue", value: 80 },
  { day: "Wed", value: 78 },
  { day: "Thu", value: 85 },
  { day: "Fri", value: 82 },
  { day: "Sat", value: 79 },
  { day: "Sun", value: 81 },
]

const enduranceData = [
  { day: "Mon", value: 70 },
  { day: "Tue", value: 72 },
  { day: "Wed", value: 68 },
  { day: "Thu", value: 75 },
  { day: "Fri", value: 73 },
  { day: "Sat", value: 71 },
  { day: "Sun", value: 74 },
]

const topExercises = [
  { name: "Bench Press", weight: 225, reps: 8, calories: 120 },
  { name: "Squats", weight: 315, reps: 6, calories: 150 },
  { name: "Deadlifts", weight: 405, reps: 5, calories: 180 },
]

const performanceMetrics = [
  { name: "Strength", score: 85 },
  { name: "Power", score: 75 },
  { name: "Endurance", score: 70 },
]

const smartInsights = [
  {
    title: "New PR Alert",
    description: "You've set a new personal record on bench press. Great job pushing your limits!",
    icon: TrendingUp,
    color: "#FFB56B",
  },
  {
    title: "Recovery Needed",
    description: "Your recent leg day was intense. Focus on rest and protein intake for optimal recovery.",
    icon: Weight,
    color: "#FF7939",
  },
  {
    title: "Workout Streak",
    description: "You've maintained a consistent 5-day workout streak. Keep up the great work!",
    icon: Zap,
    color: "#FFD700",
  },
]

const workoutSections = [
  {
    title: "Strength Training",
    options: [
      {
        title: "Upper Body Power",
        calories: 450,
        image: "/placeholder.svg?height=300&width=400",
        type: "Strength",
        videoUrl: "/videos/upper-body-power.mp4",
      },
      {
        title: "Lower Body Strength",
        calories: 500,
        image: "/placeholder.svg?height=300&width=400",
        type: "Strength",
        videoUrl: "/videos/lower-body-strength.mp4",
      },
      {
        title: "Full Body Compound",
        calories: 550,
        image: "/placeholder.svg?height=300&width=400",
        type: "Strength",
        videoUrl: "/videos/full-body-compound.mp4",
      },
    ],
    coachNote: {
      title: "Progressive Overload Focus",
      description:
        "This week, we're emphasizing progressive overload. Aim to increase either weight or reps in your key lifts.",
    },
  },
  {
    title: "Hypertrophy",
    options: [
      {
        title: "Chest and Triceps",
        calories: 400,
        image: "/placeholder.svg?height=300&width=400",
        type: "Hypertrophy",
        videoUrl: "/videos/chest-triceps.mp4",
      },
      {
        title: "Back and Biceps",
        calories: 420,
        image: "/placeholder.svg?height=300&width=400",
        type: "Hypertrophy",
        videoUrl: "/videos/back-biceps.mp4",
      },
      {
        title: "Leg Hypertrophy",
        calories: 480,
        image: "/placeholder.svg?height=300&width=400",
        type: "Hypertrophy",
        videoUrl: "/videos/leg-hypertrophy.mp4",
      },
    ],
    coachNote: {
      title: "Mind-Muscle Connection",
      description:
        "For these hypertrophy sessions, focus on the mind-muscle connection. Slow down your reps and feel the targeted muscles working.",
    },
  },
  {
    title: "Functional Fitness",
    options: [
      {
        title: "HIIT with Weights",
        calories: 350,
        image: "/placeholder.svg?height=300&width=400",
        type: "Functional",
        videoUrl: "/videos/hiit-weights.mp4",
      },
      {
        title: "Core and Stability",
        calories: 300,
        image: "/placeholder.svg?height=300&width=400",
        type: "Functional",
        videoUrl: "/videos/core-stability.mp4",
      },
      {
        title: "Olympic Lifting Basics",
        calories: 400,
        image: "/placeholder.svg?height=300&width=400",
        type: "Functional",
        videoUrl: "/videos/olympic-lifting.mp4",
      },
    ],
    coachNote: {
      title: "Functional Strength",
      description:
        "These workouts improve your overall athleticism. Focus on form and controlled movements for the best results.",
    },
  },
]

export function GymTracker() {
  const [timeframe, setTimeframe] = useState("week")
  const [openDialog, setOpenDialog] = useState<string | null>(null)

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gym Performance Overview</h2>
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
              <Dumbbell className="h-5 w-5 text-blue-400" />
              Strength
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={strengthData}>
                  <XAxis dataKey="day" stroke="#888888" />
                  <YAxis stroke="#888888" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E1E1E",
                      border: "none",
                      borderRadius: "8px",
                    }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Today's strength score</span>
                <span>91%</span>
              </div>
              <Progress value={91} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              Power
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={powerData}>
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
                <span>Today's power score</span>
                <span>81%</span>
              </div>
              <Progress value={81} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-400" />
              Endurance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={enduranceData}>
                  <XAxis dataKey="day" stroke="#888888" />
                  <YAxis stroke="#888888" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E1E1E",
                      border: "none",
                      borderRadius: "8px",
                    }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#4ADE80" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Today's endurance score</span>
                <span>74%</span>
              </div>
              <Progress value={74} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gym Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-[#1E1E1E] border-none">
          <CardHeader>
            <CardTitle>Top 3 Lifts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topExercises}>
                  <XAxis dataKey="name" stroke="#888888" />
                  <YAxis stroke="#888888" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E1E1E",
                      border: "none",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="weight" fill="#FF7939" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="calories" fill="#FFB56B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {topExercises.map((exercise, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">{exercise.name}</span>
                  <span className="text-sm font-medium">
                    {exercise.weight} lbs x {exercise.reps} reps | {exercise.calories} cal
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-none">
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
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
          <CardTitle>Gym Insights</CardTitle>
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
              { icon: Dumbbell, label: "Log Workout", color: "#FF7939" },
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

      {/* Workout Videos */}
      <div className="space-y-8">
        <h2 className="text-3xl font-bold">DAY 1 - PUSH DAY</h2>
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
      <Dialog open={openDialog === "Log Workout"} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Log Workout</DialogTitle>
            <DialogDescription>Log your gym workout details here.</DialogDescription>
          </DialogHeader>
          {/* Log Workout content */}
        </DialogContent>
      </Dialog>

      <Dialog open={openDialog === "Chat with Coach"} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chat with Your Gym Coach</DialogTitle>
            <DialogDescription>Get personalized advice and guidance for your gym workouts.</DialogDescription>
          </DialogHeader>
          <ChatWithGymCoach />
        </DialogContent>
      </Dialog>

      <Dialog open={openDialog === "Modify Calendar"} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modify Your Gym Calendar</DialogTitle>
            <DialogDescription>Adjust your gym workout schedule.</DialogDescription>
          </DialogHeader>
          <ModifyGymCalendar />
        </DialogContent>
      </Dialog>
    </div>
  )
}
