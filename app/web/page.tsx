"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, Apple, Activity, RotateCcw, Users, MessageCircle, Award } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { WeeklyProgress } from "@/components/weekly-progress"
import { NutritionInsights } from "@/components/nutrition-insights"
import { PersonalInfo } from "@/components/personal-info"
import { FitnessInsights } from "@/components/fitness-insights"
import { OmniaCoinIcon } from "@/components/omnia-coin-icon"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

interface VideoFile {
  id: string
  title: string
  thumbnail: string
}

interface FolderData {
  id: string
  title: string
  files: VideoFile[]
}

// Removed dailyStats constant

const deviceData = {
  fitbit: { connected: true, lastSync: "2 min ago" },
  garmin: { connected: true, lastSync: "5 min ago" },
  appleWatch: { connected: false, lastSync: "Never" },
}

const weeklyProgress = [
  { day: "Mon", calories: 1800, steps: 9000, weight: 75.5 },
  { day: "Tue", calories: 2100, steps: 11000, weight: 75.3 },
  { day: "Wed", calories: 1950, steps: 10500, weight: 75.2 },
  { day: "Thu", calories: 2200, steps: 12000, weight: 75.0 },
  { day: "Fri", calories: 1850, steps: 9500, weight: 74.8 },
  { day: "Sat", calories: 1700, steps: 8000, weight: 74.9 },
  { day: "Sun", calories: 2000, steps: 10000, weight: 74.7 },
]

const nutritionData = [
  { name: "Protein", value: 35 },
  { name: "Carbs", value: 45 },
  { name: "Fats", value: 20 },
]

const COLORS = ["#FF7939", "#FFB56B", "#FFD700"]

const weeklyActivities = [
  { day: "Mon", steps: 9000, calories: 1800, heartRate: 75, water: 2.1, exerciseHours: 1.5 },
  { day: "Tue", steps: 11000, calories: 2100, heartRate: 73, water: 2.3, exerciseHours: 2.0 },
  { day: "Wed", steps: 10500, calories: 1950, heartRate: 71, water: 1.9, exerciseHours: 1.8 },
  { day: "Thu", steps: 12000, calories: 2200, heartRate: 74, water: 2.4, exerciseHours: 2.2 },
  { day: "Fri", steps: 11222, calories: 1850, heartRate: 72, water: 1.8, exerciseHours: 1.9 },
  { day: "Sat", steps: 8500, calories: 1700, heartRate: 70, water: 2.0, exerciseHours: 1.3 },
  { day: "Sun", steps: 7000, calories: 2000, heartRate: 68, water: 1.7, exerciseHours: 1.0 },
]

const tabs = [
  { value: "dashboard", label: "Dashboard" },
  { value: "nutrition", label: "Nutrition" },
  { value: "fitness", label: "Fitness" },
]

export default function WebPage() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [selectedTimePeriod, setSelectedTimePeriod] = useState("daily")
  const [generatedWorkout, setGeneratedWorkout] = useState({ exercises: [{ calories: 100 }, { calories: 200 }] })
  const [fitnessFolders, setFitnessFolders] = useState<FolderData[]>([])
  const [rewardsDialogOpen, setRewardsDialogOpen] = useState(false)

  useEffect(() => {
    // Load saved folders from localStorage
    const savedFitnessFolders = localStorage.getItem("fitnessFolders")

    if (savedFitnessFolders) {
      setFitnessFolders(JSON.parse(savedFitnessFolders))
    }
  }, [])

  useEffect(() => {
    // Save folders to localStorage whenever they change
    localStorage.setItem("fitnessFolders", JSON.stringify(fitnessFolders))
  }, [fitnessFolders])

  const calculateCaloriesBurned = () => {
    const selectedExercises = generatedWorkout ? generatedWorkout.exercises : []
    let totalCalories = selectedExercises.reduce((sum, exercise) => sum + (exercise.calories || 0), 0)

    if (selectedTimePeriod === "weekly") {
      totalCalories *= 7
    } else if (selectedTimePeriod === "monthly") {
      totalCalories *= 30
    }

    return totalCalories
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white pt-16">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full bg-gradient-to-r from-[#1E1E1E] via-[#2A2A2A] to-[#1E1E1E] p-4 flex justify-center rounded-lg shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#FF7939]/10 via-transparent to-[#FF7939]/10 animate-pulse" />
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={`flex-1 relative overflow-hidden group transition-all duration-300 ease-in-out ${
                activeTab === tab.value ? "text-white" : "text-gray-400"
              }`}
              style={{
                boxShadow:
                  activeTab === tab.value
                    ? `0 0 10px ${
                        tab.value === "dashboard" ? "#4ADE80" : tab.value === "nutrition" ? "#FF7939" : "#FFD700"
                      }`
                    : "none",
              }}
            >
              <div className="relative z-10 flex items-center justify-center space-x-2 py-2">
                {tab.value === "dashboard" && (
                  <LayoutDashboard className="w-5 h-5 group-hover:text-[#FF7939] transition-colors duration-300" />
                )}
                {tab.value === "nutrition" && (
                  <Apple className="w-5 h-5 group-hover:text-[#FF7939] transition-colors duration-300" />
                )}
                {tab.value === "fitness" && (
                  <Activity className="w-5 h-5 group-hover:text-[#FF7939] transition-colors duration-300" />
                )}
                <span className="font-medium capitalize">{tab.label}</span>
              </div>
              {activeTab === tab.value && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{
                    background:
                      tab.value === "dashboard" ? "#4ADE80" : tab.value === "nutrition" ? "#FF7939" : "#FFD700",
                    boxShadow: `0 0 10px ${
                      tab.value === "dashboard" ? "#4ADE80" : tab.value === "nutrition" ? "#FF7939" : "#FFD700"
                    }`,
                  }}
                  layoutId="activeTab"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-[#FF7939]/0 via-[#FF7939]/10 to-[#FF7939]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out" />
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex min-h-[calc(100vh-64px)] gap-0">
          <div className="flex-1 p-8">
            {" "}
            {/* Update 1: Removed width constraint */}
            <AnimatePresence mode="wait">
              <TabsContent value="dashboard">
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* User Profile and Connected Devices */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-16 h-16 border-2 border-[#FF7939]">
                        <AvatarImage src="/placeholder.svg?height=64&width=64" />
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="text-2xl font-bold">Welcome back, John!</h2>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/50 hover:from-purple-600/30 hover:to-blue-600/30"
                            >
                              <span className="mr-2 text-yellow-400">
                                <OmniaCoinIcon className="w-4 h-4 inline-block" />
                              </span>
                              <span className="mr-1">Current Plan:</span>
                              <span className="font-semibold text-purple-300">Omnia Lumen</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-[#1E1E1E] border-none max-w-3xl">
                            <DialogHeader>
                              <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                                <span className="text-yellow-400">
                                  <OmniaCoinIcon className="w-6 h-6 inline-block" />
                                </span>
                                Your Subscription: Omnia Lumen
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6 mt-4">
                              <div className="bg-gradient-to-r from-yellow-600/20 to-amber-600/20 rounded-lg p-5 border border-yellow-500/30">
                                <div className="flex items-start gap-4">
                                  <div className="text-3xl">☀️</div>
                                  <div className="flex-1">
                                    <h3 className="text-xl font-bold text-white mb-1">Omnia Lumen (Light)</h3>
                                    <p className="text-gray-300 mb-2">
                                      Illuminate your fitness journey with enhanced features and personalized guidance.
                                    </p>
                                    <div className="bg-black/30 p-3 rounded-md text-sm">
                                      <h4 className="font-medium text-yellow-300 mb-2">Your plan includes:</h4>
                                      <ul className="space-y-2 text-gray-200">
                                        <li className="flex items-start">
                                          <span className="text-green-400 mr-2">✓</span>
                                          <span>Access to 3 premium coaches</span>
                                        </li>
                                        <li className="flex items-start">
                                          <span className="text-green-400 mr-2">✓</span>
                                          <span>Advanced analytics and progress tracking</span>
                                        </li>
                                        <li className="flex items-start">
                                          <span className="text-green-400 mr-2">✓</span>
                                          <span>Personalized workout and nutrition plans</span>
                                        </li>
                                        <li className="flex items-start">
                                          <span className="text-green-400 mr-2">✓</span>
                                          <span>Priority customer support</span>
                                        </li>
                                        <li className="flex items-start">
                                          <span className="text-green-400 mr-2">✓</span>
                                          <span>2x OMNIA Coin rewards multiplier</span>
                                        </li>
                                      </ul>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between">
                                      <div>
                                        <span className="text-sm text-gray-400">Next billing date:</span>
                                        <span className="ml-2 text-white">June 15, 2023</span>
                                      </div>
                                      <span className="text-xl font-bold text-white">$14.99/month</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-lg p-4 border border-green-500/30">
                                  <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
                                    <span className="mr-2">🌱</span>
                                    Downgrade to Essentia
                                  </h3>
                                  <p className="text-sm text-gray-300 mb-3">
                                    Basic features for beginners starting their fitness journey.
                                  </p>
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium text-white">$7.99/month</span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-green-500/50 text-green-400 hover:bg-green-500/20"
                                    >
                                      View Plan
                                    </Button>
                                  </div>
                                </div>

                                <div className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 rounded-lg p-4 border border-purple-500/30">
                                  <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
                                    <span className="mr-2">∞</span>
                                    Upgrade to Infinitum
                                  </h3>
                                  <p className="text-sm text-gray-300 mb-3">
                                    Unlimited access to all premium features and exclusive perks.
                                  </p>
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium text-white">$24.99/month</span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
                                    >
                                      Upgrade
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              <div className="flex justify-end gap-3 mt-4">
                                <Button variant="outline" className="text-gray-300 border-gray-600">
                                  Manage Subscription
                                </Button>
                                <DialogClose asChild>
                                  <Button
                                    variant="default"
                                    className="bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-700 hover:to-amber-600"
                                  >
                                    Close
                                  </Button>
                                </DialogClose>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="flex flex-col items-end mr-4">
                        {Object.entries(deviceData).map(([device, data]) => (
                          <Badge
                            key={device}
                            variant={data.connected ? "default" : "secondary"}
                            className="flex items-center space-x-1 mb-1 last:mb-0"
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${data.connected ? "bg-green-500" : "bg-gray-500"}`}
                            />
                            <span>{device}</span>
                            <span className="text-xs opacity-75">{data.lastSync}</span>
                          </Badge>
                        ))}
                      </div>
                      <Button variant="outline" className="flex items-center space-x-2">
                        <RotateCcw className="w-4 h-4" />
                        <span>Sync Devices</span>
                      </Button>
                    </div>
                  </div>

                  {/* Main content area */}
                  <div className="grid grid-cols-12 gap-6">
                    {/* Left column */}
                    <div className="col-span-7 space-y-6">
                      {/* Weekly Progress (Activity Progress) - Now first */}
                      <WeeklyProgress data={weeklyActivities} />

                      {/* Your Coaches (Account Overview) - Now second */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <Card className="bg-[#1E1E1E] border-none">
                            <CardHeader>
                              <CardTitle className="flex items-center space-x-2">
                                <Users className="w-5 h-5 text-[#FF7939]" />
                                <span>Your Coaches</span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-3 gap-4">
                                {[
                                  {
                                    name: "Alex Johnson",
                                    specialty: "Strength Training",
                                    subscription: "Premium Fitness",
                                    avatar: "/placeholder.svg?height=64&width=64",
                                  },
                                  {
                                    name: "Sarah Lee",
                                    specialty: "Yoga and Flexibility",
                                    subscription: "Wellness Complete",
                                    avatar: "/placeholder.svg?height=64&width=64",
                                  },
                                  {
                                    name: "Mike Chen",
                                    specialty: "Cardio and HIIT",
                                    subscription: "Performance Elite",
                                    avatar: "/placeholder.svg?height=64&width=64",
                                  },
                                ].map((coach, index) => (
                                  <div key={index} className="flex flex-col items-center text-center p-2">
                                    <Avatar className="h-16 w-16 mb-2">
                                      <AvatarImage src={coach.avatar || "/placeholder.svg"} alt={coach.name} />
                                      <AvatarFallback className="text-lg">
                                        {coach.name
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <p className="font-medium">{coach.name}</p>
                                    <p className="text-sm text-gray-400">{coach.specialty}</p>
                                    <Badge className="mt-1 mb-2 bg-[#FF7939] text-white">{coach.subscription}</Badge>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 rounded-full bg-gray-800 hover:bg-gray-700"
                                    >
                                      <MessageCircle className="h-4 w-4 text-[#FF7939]" />
                                      <span className="sr-only">Message {coach.name}</span>
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Achievements - Now third */}
                        <Card className="bg-[#1E1E1E] border-none">
                          <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                              <Award className="w-5 h-5 text-[#FF7939]" />
                              <span>Achievements</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                              {[
                                {
                                  name: "Early Bird",
                                  description: "Completed morning workout 5 days in a row",
                                  progress: 80,
                                  xp: 250,
                                },
                                {
                                  name: "Step Master",
                                  description: "Reached 10,000 steps goal for 7 days",
                                  progress: 65,
                                  xp: 300,
                                },
                                {
                                  name: "Nutrition Pro",
                                  description: "Maintained balanced macros for 2 weeks",
                                  progress: 45,
                                  xp: 400,
                                },
                                {
                                  name: "Gym Warrior",
                                  description: "Completed 20 gym sessions this month",
                                  progress: 90,
                                  xp: 500,
                                },
                              ].map((achievement) => (
                                <div key={achievement.name} className="p-4 rounded-lg bg-black/20">
                                  <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-medium">{achievement.name}</h4>
                                    <span className="text-xs font-semibold bg-[#FF7939] text-white px-2 py-1 rounded-full">
                                      {achievement.xp} XP
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-400 mb-2">{achievement.description}</p>
                                  <Progress value={achievement.progress} className="h-1" />
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    {/* Right column */}
                    <div className="col-span-5 space-y-6">
                      {/* Personal Information */}
                      <PersonalInfo />

                      {/* Rewards Overview */}
                      <Card className="bg-[#1E1E1E] border-none overflow-hidden">
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center space-x-2">
                            <div className="w-5 h-5 text-yellow-400">
                              <OmniaCoinIcon className="w-5 h-5" />
                            </div>
                            <span>Rewards Overview</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 rounded-lg p-4">
                              <h3 className="text-lg font-semibold text-yellow-400 mb-2">Referral Rewards</h3>
                              <p className="text-sm text-gray-300 mb-3">
                                Earn points for inviting friends and colleagues to join OMNIA.
                              </p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <OmniaCoinIcon className="w-4 h-4" />
                                  <span className="text-yellow-300 font-medium">500 points per referral</span>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20"
                                >
                                  Invite Friends
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-black/30 rounded-lg p-3">
                                <h4 className="text-sm font-medium mb-1 text-white">Fitness Achievements</h4>
                                <p className="text-xs text-gray-400">Complete workouts to earn rewards</p>
                                <div className="flex items-center mt-2">
                                  <OmniaCoinIcon className="w-3 h-3 mr-1" />
                                  <span className="text-xs text-yellow-300">Up to 1000 points</span>
                                </div>
                              </div>

                              <div className="bg-black/30 rounded-lg p-3">
                                <h4 className="text-sm font-medium mb-1 text-white">Nutrition Goals</h4>
                                <p className="text-xs text-gray-400">Track meals to earn rewards</p>
                                <div className="flex items-center mt-2">
                                  <OmniaCoinIcon className="w-3 h-3 mr-1" />
                                  <span className="text-xs text-yellow-300">Up to 800 points</span>
                                </div>
                              </div>
                            </div>

                            <Dialog open={rewardsDialogOpen} onOpenChange={setRewardsDialogOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
                                >
                                  View All Rewards
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-[#1E1E1E] border-none max-w-3xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                                    <OmniaCoinIcon className="w-6 h-6" />
                                    OMNIA Rewards Program
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-6 mt-4">
                                  {[
                                    {
                                      title: "Referral Rewards",
                                      description: "Earn points for inviting friends and colleagues to join OMNIA.",
                                      details: "100 points for each referral, redeemable for discounts.",
                                      color: "from-purple-600 to-blue-500",
                                      icon: "👥",
                                    },
                                    {
                                      title: "Affiliate Links",
                                      description:
                                        "Coaches earn commissions on marketplace sales through unique codes.",
                                      details: "10% commission on fitness equipment or apparel sales.",
                                      color: "from-blue-600 to-cyan-500",
                                      icon: "🔗",
                                    },
                                    {
                                      title: "Active User Rewards",
                                      description: "Bonuses for maintaining an active presence on the platform.",
                                      details: "Discounts after completing 5 programs with different coaches.",
                                      color: "from-green-600 to-emerald-500",
                                      icon: "🏃",
                                    },
                                    {
                                      title: "Fitness Completion",
                                      description: "Earn points for reaching fitness milestones and goals.",
                                      details: "50 points for every 10 workouts completed.",
                                      color: "from-orange-600 to-amber-500",
                                      icon: "🏆",
                                    },
                                    {
                                      title: "Challenges",
                                      description: "Participate in weekly and monthly themed challenges.",
                                      details: "Exclusive badges and discounts for challenge winners.",
                                      color: "from-red-600 to-pink-500",
                                      icon: "🎯",
                                    },
                                    {
                                      title: "Content Creation",
                                      description: "Earn points by sharing workout content and tips.",
                                      details: "10 points per post, bonus for high engagement.",
                                      color: "from-indigo-600 to-violet-500",
                                      icon: "📱",
                                    },
                                    {
                                      title: "Weekly Goals",
                                      description: "Earn discounts by completing weekly fitness and coaching goals.",
                                      details: "5% discount on next purchase for each week of completed goals.",
                                      color: "from-yellow-600 to-amber-500",
                                      icon: "📅",
                                    },
                                  ].map((reward, index) => (
                                    <div
                                      key={index}
                                      className={`bg-gradient-to-r ${reward.color} bg-opacity-20 rounded-lg p-5 shadow-lg`}
                                    >
                                      <div className="flex items-start gap-4">
                                        <div className="text-3xl">{reward.icon}</div>
                                        <div className="flex-1">
                                          <h3 className="text-xl font-bold text-white mb-1">{reward.title}</h3>
                                          <p className="text-gray-300 mb-2">{reward.description}</p>
                                          <div className="bg-black/30 p-3 rounded-md text-sm text-yellow-300 flex items-center gap-2">
                                            <OmniaCoinIcon className="w-4 h-4 flex-shrink-0" />
                                            <span>{reward.details}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}

                                  <div className="flex justify-end mt-4">
                                    <Button
                                      variant="default"
                                      className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
                                      onClick={() => setRewardsDialogOpen(false)}
                                    >
                                      Close
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>
              {activeTab === "nutrition" ? (
                <motion.div
                  key="nutrition"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="container mx-auto px-4 py-8">
                    <NutritionInsights />
                  </div>
                </motion.div>
              ) : null}
              {activeTab === "fitness" ? (
                <motion.div
                  key="fitness"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="container mx-auto px-4 py-8">
                    <FitnessInsights />
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </Tabs>
    </div>
  )
}
