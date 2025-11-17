"use client"

import type React from "react"
// Add these imports at the top of the file
import { ExerciseRoutines } from '@/components/shared/activities/exercise-routines'
import { VideoPlayer } from '@/components/shared/video/video-player'
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import {
  Zap,
  Flame,
  Scale,
  Plus,
  Trash,
  Edit2,
  Save,
  Droplet,
  ChevronLeft,
  ChevronRight,
  Play,
  Heart,
  Dumbbell,
  ActivitySquare,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format, addDays, subDays, addWeeks, subWeeks, startOfWeek, endOfWeek } from "date-fns"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from '@/lib/utils/utils'

interface FolderData {
  id: string
  title: string
  files: VideoFile[]
}

const performanceData = [
  { month: "Jan", value: 65, trend: 62 },
  { month: "Feb", value: 85, trend: 80 },
  { month: "Mar", value: 72, trend: 75 },
  { month: "Apr", value: 92, trend: 88 },
  { month: "May", value: 78, trend: 82 },
  { month: "Jun", value: 95, trend: 90 },
]

const chartData = {
  daily: [
    { name: "6am", cardio: 15, strength: 30, flexibility: 10, calories: 280 },
    { name: "9am", cardio: 25, strength: 45, flexibility: 15, calories: 420 },
    { name: "12pm", cardio: 40, strength: 60, flexibility: 25, calories: 620 },
    { name: "3pm", cardio: 55, strength: 80, flexibility: 30, calories: 810 },
    { name: "6pm", cardio: 70, strength: 100, flexibility: 40, calories: 1050 },
    { name: "9pm", cardio: 75, strength: 120, flexibility: 45, calories: 1180 },
  ],
  weekly: [
    { name: "Mon", cardio: 120, strength: 90, flexibility: 30, calories: 1200 },
    { name: "Tue", cardio: 100, strength: 120, flexibility: 40, calories: 1300 },
    { name: "Wed", cardio: 140, strength: 80, flexibility: 50, calories: 1250 },
    { name: "Thu", cardio: 80, strength: 140, flexibility: 35, calories: 1400 },
    { name: "Fri", cardio: 110, strength: 100, flexibility: 45, calories: 1350 },
    { name: "Sat", cardio: 130, strength: 110, flexibility: 55, calories: 1450 },
    { name: "Sun", cardio: 90, strength: 70, flexibility: 60, calories: 1100 },
  ],
  monthly: [
    { name: "Week 1", cardio: 600, strength: 450, flexibility: 200, calories: 6000 },
    { name: "Week 2", cardio: 650, strength: 500, flexibility: 220, calories: 6500 },
    { name: "Week 3", cardio: 700, strength: 550, flexibility: 240, calories: 7000 },
    { name: "Week 4", cardio: 750, strength: 600, flexibility: 260, calories: 7500 },
  ],
}

const workoutSections = [
  {
    title: "Cardio",
    options: [
      {
        title: "HIIT Workout",
        duration: "30 min",
        calories: 300,
        image: "/placeholder.svg?height=300&width=400",
        type: "High Intensity",
        videoUrl: "/videos/hiit-workout.mp4",
      },
      {
        title: "Steady State Run",
        duration: "45 min",
        calories: 450,
        image: "/placeholder.svg?height=300&width=400",
        type: "Moderate Intensity",
        videoUrl: "/videos/steady-state-run.mp4",
      },
      {
        title: "Cycling Session",
        duration: "60 min",
        calories: 600,
        image: "/placeholder.svg?height=300&width=400",
        type: "Variable Intensity",
        videoUrl: "/videos/cycling-session.mp4",
      },
    ],
    coachNote: {
      title: "Cardio Focus",
      description:
        "Mix high-intensity intervals with steady-state cardio for optimal fat burning and cardiovascular health.",
    },
  },
  {
    title: "Strength",
    options: [
      {
        title: "Full Body Strength",
        duration: "45 min",
        calories: 350,
        image: "/placeholder.svg?height=300&width=400",
        type: "Resistance",
        videoUrl: "/videos/full-body-strength.mp4",
      },
      {
        title: "Upper Body Push",
        duration: "40 min",
        calories: 300,
        image: "/placeholder.svg?height=300&width=400",
        type: "Resistance",
        videoUrl: "/videos/upper-body-push.mp4",
      },
      {
        title: "Lower Body Power",
        duration: "50 min",
        calories: 400,
        image: "/placeholder.svg?height=300&width=400",
        type: "Resistance",
        videoUrl: "/videos/lower-body-power.mp4",
      },
    ],
    coachNote: {
      title: "Progressive Overload",
      description:
        "Focus on gradually increasing weight or reps to continually challenge your muscles and promote growth.",
    },
  },
  {
    title: "Flexibility & Recovery",
    options: [
      {
        title: "Yoga Flow",
        duration: "30 min",
        calories: 150,
        image: "/placeholder.svg?height=300&width=400",
        type: "Flexibility",
        videoUrl: "/videos/yoga-flow.mp4",
      },
      {
        title: "Dynamic Stretching",
        duration: "20 min",
        calories: 100,
        image: "/placeholder.svg?height=300&width=400",
        type: "Mobility",
        videoUrl: "/videos/dynamic-stretching.mp4",
      },
      {
        title: "Foam Rolling",
        duration: "15 min",
        calories: 50,
        image: "/placeholder.svg?height=300&width=400",
        type: "Recovery",
        videoUrl: "/videos/foam-rolling.mp4",
      },
    ],
    coachNote: {
      title: "Recovery Importance",
      description:
        "Don't neglect flexibility and recovery. These sessions help prevent injury and improve overall performance.",
    },
  },
]

const shoppingList = {
  fruits: ["Bananas", "Apples", "Oranges"],
  vegetables: ["Spinach", "Broccoli", "Carrots"],
  protein: ["Chicken breast", "Salmon", "Eggs"],
  grains: ["Brown rice", "Quinoa", "Oats"],
}

const subscribedCoaches = [
  { name: "Coach A", specialty: "Weight Loss", phone: "+15551234567" },
  { name: "Coach B", specialty: "Strength Training", phone: "+15559876543" },
]

interface MealOption {
  title: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface VideoFile {
  id: string
  time: string
  title: string
  category: string
  duration: string
  repsXSeries: string
  calories: number
  note: string
  thumbnail?: string
  videoUrl?: string
}

// Add this near the top of the file, after other constant declarations
const initialCategorySuggestions = [
  "Pull",
  "Push",
  "Abs & Core",
  "Cardio",
  "Mindfulness",
  "Yoga",
  "Stretching",
  "Running",
  "Cycling",
  "Swimming",
  "HIIT",
  "Pilates",
  "Weightlifting",
  "CrossFit",
  "Boxing",
  "Martial Arts",
  "Dance",
  "Rowing",
  "Climbing",
  "Functional Training",
]

export function FitnessInsights() {
  // Add these state variables inside the FitnessInsights component
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)

  const [selectedPeriod, setSelectedPeriod] = useState("daily")
  const [hoveredAction, setHoveredAction] = useState<number | null>(null)
  const [isShoppingListVisible, setIsShoppingListVisible] = useState(false)
  const [openDialog, setOpenDialog] = useState<string | null>(null)
  const [waterIntake, setWaterIntake] = useState(0)
  const [selectedMeals, setSelectedMeals] = useState<string[]>([])
  const [nutrientTotals, setNutrientTotals] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  })
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [eatenMeals, setEatenMeals] = useState<MealOption[]>([])
  const [isMealsCollapsed, setIsMealsCollapsed] = useState(false)
  const [mealsEatenToday, setMealsEatenToday] = useState<MealOption[]>([])
  const [myJourneyVideos, setMyJourneyVideos] = useState<VideoFile[]>(() => {
    if (typeof window !== "undefined") {
      const storedVideos = localStorage.getItem("fitnessJourneyVideos")
      return storedVideos ? JSON.parse(storedVideos) : []
    }
    return []
  })
  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  const [mealTime, setMealTime] = useState("")
  const [selectedMealForJourney, setSelectedMealForJourney] = useState<MealOption | null>(null)
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false)
  const [selectedWeek, setSelectedWeek] = useState(new Date())
  const [selectedWorkouts, setSelectedWorkouts] = useState<string[]>([])
  const [activityTotals, setActivityTotals] = useState({
    duration: 0,
    calories: 0,
  })
  const [fitnessFolders, setFitnessFolders] = useState<FolderData[]>([])
  const [isAddFolderDialogOpen, setIsAddFolderDialogOpen] = useState(false)
  const [newFolderTitle, setNewFolderTitle] = useState("")
  const [editingFolder, setEditingFolder] = useState<FolderData | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [nutritionFolders, setNutritionFolders] = useState<FolderData[]>([
    {
      id: "workout-nutrition",
      title: "Workout Nutrition",
      files: [],
    },
    {
      id: "supplement-guide",
      title: "Supplement Guide",
      files: [],
    },
  ])
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; title: string } | null>(null)
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>(initialCategorySuggestions)
  const [categoryInput, setCategoryInput] = useState("")
  const [addedVideos, setAddedVideos] = useState<Set<string>>(new Set())
  const [availableCategories, setAvailableCategories] = useState<string[]>([
    "Pull",
    "Push",
    "Abs & Core",
    "Cardio",
    "Mindfulness",
    "Yoga",
    "Stretching",
    "Running",
    "Cycling",
    "Swimming",
    "HIIT",
    "Pilates",
    "Weightlifting",
    "CrossFit",
    "Boxing",
    "Martial Arts",
    "Dance",
    "Rowing",
    "Climbing",
    "Functional Training",
  ])
  const [newExercise, setNewExercise] = useState<Partial<VideoFile>>({})
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")

  // Add this helper function near the top of the component, after the state declarations
  const formatRepsXSeries = (value: string) => {
    const [reps, series] = (value || "").split("x").map((v) => v?.trim() || "0")
    const formattedReps = reps.replace(/\D/g, "") || "0"
    const formattedSeries = series.replace(/\D/g, "") || "0"
    return `${formattedReps} x ${formattedSeries}`.trim()
  }

  // Update the handlePlayVideo function
  const handlePlayVideo = (url: string, title: string) => {
    if (url && url !== "") {
      const index = myJourneyVideos.findIndex((video) => video.videoUrl === url)
      setCurrentVideoIndex(index)
      setIsPlaying(true)
      setSelectedVideo({ url, title }) // Add this line

      // Scroll to center the video player
      setTimeout(() => {
        const videoPlayer = document.querySelector(".aspect-video")
        if (videoPlayer) {
          const rect = videoPlayer.getBoundingClientRect()
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop
          const centerPosition = rect.top + scrollTop - (window.innerHeight - rect.height) / 2
          window.scrollTo({ top: centerPosition, behavior: "smooth" })
        }
      }, 100)
    } else {
      console.error("Invalid video URL:", url)
    }
  }

  // Add these functions inside the FitnessInsights component
  const handleNextVideo = () => {
    if (currentVideoIndex !== null && currentVideoIndex < myJourneyVideos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1)
    }
  }

  const handlePreviousVideo = () => {
    if (currentVideoIndex !== null && currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1)
    }
  }

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number.parseFloat(e.target.value)
    setVolume(newVolume)
    if (newVolume > 0) {
      setIsMuted(false)
    }
  }

  const handleDeleteVideo = (folderId: string, videoId: string) => {
    setFitnessFolders((prevFolders) =>
      prevFolders.map((folder) =>
        folder.id === folderId ? { ...folder, files: folder.files.filter((file) => file.id !== videoId) } : folder,
      ),
    )
    // Update localStorage
    const updatedFolders = fitnessFolders.map((folder) =>
      folder.id === folderId ? { ...folder, files: folder.files.filter((file) => file.id !== videoId) } : folder,
    )
    localStorage.setItem("fitnessFolders", JSON.stringify(updatedFolders))
  }

  const updateActivityTotals = useCallback(() => {
    let duration = 0
    let calories = 0
    selectedWorkouts.forEach((workoutTitle) => {
      const workout = workoutSections
        .flatMap((section) => section.options)
        .find((workout) => workout.title === workoutTitle)
      if (workout) {
        duration += Number.parseInt(workout.duration.split(" ")[0])
        calories += workout.calories
      }
    })
    setActivityTotals({ duration, calories })
  }, [selectedWorkouts])

  useEffect(() => {
    updateActivityTotals()
  }, [updateActivityTotals])

  useEffect(() => {
    const savedFitnessFolders = localStorage.getItem("fitnessFolders")
    const savedNutritionFolders = localStorage.getItem("nutritionFolders")
    const savedJourneyVideos = localStorage.getItem("fitnessJourneyVideos")

    if (savedFitnessFolders) {
      setFitnessFolders(JSON.parse(savedFitnessFolders))
    }
    if (savedNutritionFolders) {
      const parsedFolders = JSON.parse(savedNutritionFolders)
      const filteredFolders = parsedFolders.filter(
        (folder: FolderData) => folder.title !== "Healthy Recipes" && folder.title !== "Meal Plans",
      )
      setNutritionFolders(filteredFolders)
      localStorage.setItem("nutritionFolders", JSON.stringify(filteredFolders))
    }
    if (savedJourneyVideos) {
      setMyJourneyVideos(JSON.parse(savedJourneyVideos))
    }
  }, [])

  const incrementWater = () => {
    setWaterIntake(Math.min(waterIntake + 1, 8))
  }

  const decrementWater = () => {
    setWaterIntake(Math.max(waterIntake - 1, 0))
  }

  const goToPreviousDay = () => {
    setSelectedDate(subDays(selectedDate, 1))
  }

  const goToNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1))
  }

  const goToPreviousWeek = () => {
    setSelectedWeek(subWeeks(selectedWeek, 1))
  }

  const goToNextWeek = () => {
    setSelectedWeek(addWeeks(selectedWeek, 1))
  }

  const addExerciseToJourney = (exercise: VideoFile) => {
    const newExercise = {
      ...exercise,
      id: crypto.randomUUID(),
      time: format(new Date(), "HH:mm"),
      duration: exercise.duration || "0",
      repsXSeries: exercise.repsXSeries || "0 x 0",
      calories: exercise.calories || 0,
      note: "",
      videoUrl: exercise.videoUrl || "",
    }
    setMyJourneyVideos((prev) => {
      const updatedJourney = [...prev, newExercise]
      localStorage.setItem("fitnessJourneyVideos", JSON.stringify(updatedJourney))
      return updatedJourney
    })
  }

  const updateExercise = (id: string, field: keyof VideoFile, value: string | number) => {
    setMyJourneyVideos((prev) => {
      const updated = prev.map((video) =>
        video.id === id
          ? {
              ...video,
              [field]: value !== undefined ? value : video[field] || "",
            }
          : video,
      )
      localStorage.setItem("fitnessJourneyVideos", JSON.stringify(updated))
      return updated
    })
  }

  const addMealToJourney = () => {
    if (selectedMealForJourney && mealTime) {
      const newVideo: VideoFile = {
        id: crypto.randomUUID(),
        time: mealTime,
        title: selectedMealForJourney.title,
        category: "Meal",
        duration: "N/A",
        repsXSeries: "N/A",
        calories: selectedMealForJourney.calories,
        note: "",
      }
      setMyJourneyVideos([...myJourneyVideos, newVideo])
      setIsTimeModalOpen(false)
      setMealTime("")
      setSelectedMealForJourney(null)
    }
  }

  const addNewFolder = () => {
    if (newFolderTitle.trim()) {
      const newFolder: FolderData = {
        id: `fitness-${Date.now().toString()}`,
        title: newFolderTitle.trim(),
        files: [],
      }
      setFitnessFolders((prevFolders) => {
        const updatedFolders = [...prevFolders, newFolder]
        localStorage.setItem("fitnessFolders", JSON.stringify(updatedFolders))
        return updatedFolders
      })
      setIsAddFolderDialogOpen(false)
      setNewFolderTitle("")
    }
  }

  const startEditingFolder = (folder: FolderData) => {
    setEditingFolder({ ...folder })
  }

  const updateFolderTitle = () => {
    if (editingFolder) {
      setFitnessFolders((prevFolders) => {
        const updatedFolders = prevFolders.map((folder) =>
          folder.id === editingFolder.id ? { ...editingFolder } : folder,
        )
        localStorage.setItem("fitnessFolders", JSON.stringify(updatedFolders))
        return updatedFolders
      })
      setEditingFolder(null)
    }
  }

  const deleteFolder = (id: string) => {
    setFitnessFolders((prevFolders) => {
      const updatedFolders = prevFolders.filter((folder) => folder.id !== id)
      localStorage.setItem("fitnessFolders", JSON.stringify(updatedFolders))
      return updatedFolders
    })
  }

  const saveVideoToFolder = (video: VideoFile, folderId: string) => {
    const updatedFolders = fitnessFolders.map((folder) => {
      if (folder.id === folderId) {
        return {
          ...folder,
          files: [...folder.files, video],
        }
      }
      return folder
    })
    setFitnessFolders(updatedFolders)
    localStorage.setItem("fitnessFolders", JSON.stringify(updatedFolders))
  }

  const setSelected = (period: string) => {
    setSelectedPeriod(period)
  }

  useEffect(() => {
    localStorage.setItem("fitnessFolders", JSON.stringify(fitnessFolders))
  }, [fitnessFolders])

  const [isPlayingJourney, setIsPlayingJourney] = useState(false)

  const playMyJourney = () => {
    if (myJourneyVideos.length > 0) {
      setCurrentVideoIndex(0)
      setIsPlaying(true)
      setIsPlayingJourney(true)
    }
  }

  useEffect(() => {
    if (isPlayingJourney && currentVideoIndex !== null && currentVideoIndex < myJourneyVideos.length - 1) {
      const timer = setTimeout(() => {
        setCurrentVideoIndex(currentVideoIndex + 1)
      }, 1000) // Adjust this value to control how long each video plays
      return () => clearTimeout(timer)
    }
  }, [currentVideoIndex, isPlayingJourney, myJourneyVideos.length])

  return (
    <div className="relative min-h-screen bg-[#121212] p-8">
      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="grid grid-cols-12 gap-4">
          {/* Title Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="col-span-12 mb-4">
            <Card className="bg-black text-white border-none shadow-2xl">
              <CardContent className="p-8">
                <h1 className="text-4xl font-bold mb-2">Fitness Insights</h1>
                <p className="text-gray-400">Track your progress and optimize your fitness routine</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Metrics Cards - Positioned at the top */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="col-span-4"
          >
            <Card className="bg-[#1E1E1E] border-none shadow-xl hover:shadow-2xl transition-all h-full">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-full bg-[#FF7939]/10 mb-4">
                    <Flame className="h-6 w-6 text-[#FF7939]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-white">750</h3>
                    <p className="text-sm text-gray-400">Active Minutes</p>
                    <p className="text-xs font-semibold text-green-400">Good</p>
                    <p className="text-xs text-gray-400">
                      <span className="text-green-400">+50</span> from last week
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="col-span-4"
          >
            <Card className="bg-[#1E1E1E] border-none shadow-xl hover:shadow-2xl transition-all h-full">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-full bg-[#FFB56B]/10 mb-4">
                    <Scale className="h-6 w-6 text-[#FFB56B]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-white">75.2 kg</h3>
                    <p className="text-sm text-gray-400">Weight</p>
                    <p className="text-xs font-semibold text-[#FFB56B]">Excellent</p>
                    <p className="text-xs text-gray-400">
                      <span className="text-green-400">-0.5 kg</span> from last week
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="col-span-4"
          >
            <Card className="bg-[#1E1E1E] border-none shadow-xl hover:shadow-2xl transition-all h-full">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-full bg-[#60A5FA]/10 mb-4">
                    <Droplet className="h-6 w-6 text-[#60A5FA]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-white">1.8 L</h3>
                    <p className="text-sm text-gray-400">Water Intake</p>
                    <p className="text-xs font-semibold text-yellow-400">Needs Improvement</p>
                    <p className="text-xs text-gray-400">
                      <span className="text-red-400">-0.2 L</span> from last week
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Video Player - Positioned directly below the metrics cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="col-span-12 mb-6"
          >
            <div className="relative">
              {/* Orange frame with arrow */}
              <div className="absolute -top-6 left-1/2 bg-[#FF7939] text-white p-3.5 rounded-lg z-10 transform -translate-x-1/2 scale-90">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-full bg-white">
                    <Play className="h-5 w-5 text-[#FF7939]" />
                  </div>
                  <h3 className="text-xl font-bold">Video Player</h3>
                </div>
                {/* Arrow extension */}
                <div className="absolute left-1/2 bottom-0 w-5 h-5 bg-[#FF7939] transform rotate-45 translate-y-1/2 -translate-x-1/2"></div>
              </div>

              {/* Content container */}
              <div className="bg-black text-white rounded-lg p-6 pt-16">
                <Card className="bg-[#1E1E1E] border-none shadow-xl">
                  <CardHeader className="pb-0" />
                  <CardContent>
                    {currentVideoIndex !== null && myJourneyVideos[currentVideoIndex] ? (
                      <VideoPlayer
                        isOpen={true}
                        onClose={() => {}}
                        videoUrl={myJourneyVideos[currentVideoIndex].videoUrl || ""}
                        title={myJourneyVideos[currentVideoIndex].title}
                        isPlaying={isPlaying}
                        volume={isMuted ? 0 : volume}
                      />
                    ) : (
                      <div className="aspect-video bg-gray-900 flex items-center justify-center text-white">
                        No video selected
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-4 mb-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handlePreviousVideo}
                        disabled={currentVideoIndex === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="text-center">
                        <h3 className="text-lg font-semibold">
                          {currentVideoIndex !== null && myJourneyVideos[currentVideoIndex]
                            ? myJourneyVideos[currentVideoIndex].title
                            : "No video selected"}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {currentVideoIndex !== null && myJourneyVideos[currentVideoIndex]
                            ? myJourneyVideos[currentVideoIndex].category
                            : ""}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleNextVideo}
                        disabled={currentVideoIndex === null || currentVideoIndex === myJourneyVideos.length - 1}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button className="mt-2 w-full bg-[#FF7939] hover:bg-[#E66829]" onClick={playMyJourney}>
                      Play My Journey
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>

          {/* My Journey Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="col-span-12 mt-6"
          >
            <Card className="bg-[#1E1E1E] text-white shadow-2xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={goToPreviousWeek} className="p-0">
                      <ChevronLeft className="h-4 w-4 text-white" />
                    </Button>
                    <span className="text-white text-sm font-mitr font-bold">
                      {format(startOfWeek(selectedWeek), "MMM d")} - {format(endOfWeek(selectedWeek), "MMM d")}
                    </span>
                    <Button variant="ghost" size="sm" onClick={goToNextWeek} className="p-0">
                      <ChevronRight className="h-4 w-4 text-white" />
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon" onClick={goToPreviousDay}>
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h3 className="text-xl font-mitr font-bold text-[#FF7939]">{format(selectedDate, "EEEE")}</h3>
                    <Button variant="ghost" size="icon" onClick={goToNextDay}>
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-center mt-2">
                  <CardTitle className="text-2xl font-mitr font-bold text-center">
                    My <span className="text-[#FF7939]">Fitness</span> Journey
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[400px]">
                  {myJourneyVideos.length > 0 ? (
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs">
                          <th className="p-2">Time</th>
                          <th className="p-2 w-48 text-center">Exercise</th>
                          <th className="p-2 w-36 text-center">Category</th>
                          <th className="p-2">Duration</th>
                          <th className="p-2">Reps x Series</th>
                          <th className="p-2">Calories</th>
                          <th className="p-2">Note</th>
                          <th className="p-2">Actions</th>
                          <th className="p-2">Play</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {myJourneyVideos.map((video) => (
                          <tr key={video.id} className="border-t border-gray-700">
                            <td className="p-2">
                              <Input
                                type="time"
                                value={video.time || ""}
                                onChange={(e) => updateExercise(video.id, "time", e.target.value)}
                                className="bg-transparent border-none"
                              />
                            </td>
                            <td className="p-2 w-48">{video.title || ""}</td>
                            {/* Replace the existing category input in the My Journey section with this: */}
                            <td className="p-2 w-36">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between bg-transparent border-none"
                                  >
                                    {video.category || "Select category"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[200px] p-0">
                                  <Command>
                                    <CommandInput
                                      placeholder="Search category..."
                                      value={categoryInput}
                                      onValueChange={setCategoryInput}
                                    />
                                    <CommandList>
                                      <CommandEmpty>
                                        <Button
                                          variant="ghost"
                                          className="w-full justify-start"
                                          onClick={() => {
                                            if (categoryInput.trim() !== "") {
                                              setCategorySuggestions([...categorySuggestions, categoryInput])
                                              updateExercise(video.id, "category", categoryInput)
                                              setCategoryInput("")
                                            }
                                          }}
                                        >
                                          Add "{categoryInput}"
                                        </Button>
                                      </CommandEmpty>
                                      <CommandGroup>
                                        {categorySuggestions.map((category) => (
                                          <CommandItem
                                            key={category}
                                            onSelect={() => {
                                              updateExercise(video.id, "category", category)
                                              setCategoryInput("")
                                            }}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                video.category === category ? "opacity-100" : "opacity-0",
                                              )}
                                            />
                                            {category}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </td>
                            <td className="p-2">
                              <Input
                                value={video.duration || "0"}
                                onChange={(e) => updateExercise(video.id, "duration", e.target.value)}
                                className="bg-transparent border-none"
                              />
                            </td>
                            <td className="p-2">
                              <div className="flex items-center">
                                <Input
                                  value={video.repsXSeries ? video.repsXSeries.split("x")[0].trim() : "0"}
                                  onChange={(e) => {
                                    const newValue = formatRepsXSeries(
                                      `${e.target.value || "0"} x ${video.repsXSeries ? video.repsXSeries.split("x")[1]?.trim() || "0" : "0"}`,
                                    )
                                    updateExercise(video.id, "repsXSeries", newValue)
                                  }}
                                  className="bg-transparent border-none w-12 text-center"
                                />
                                <span className="mx-1">x</span>
                                <Input
                                  value={video.repsXSeries ? video.repsXSeries.split("x")[1]?.trim() || "0" : "0"}
                                  onChange={(e) => {
                                    const newValue = formatRepsXSeries(
                                      `${video.repsXSeries ? video.repsXSeries.split("x")[0]?.trim() || "0" : "0"} x ${e.target.value || "0"}`,
                                    )
                                    updateExercise(video.id, "repsXSeries", newValue)
                                  }}
                                  className="bg-transparent border-none w-12 text-center"
                                />
                              </div>
                            </td>
                            <td className="p-2">
                              <Input
                                type="number"
                                value={video.calories || 0}
                                onChange={(e) => updateExercise(video.id, "calories", Number(e.target.value))}
                                className="bg-transparent border-none"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                value={video.note || ""}
                                onChange={(e) => updateExercise(video.id, "note", e.target.value)}
                                className="bg-transparent border-none"
                              />
                            </td>
                            <td className="p-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-600"
                                onClick={() => {
                                  const updatedVideos = myJourneyVideos.filter((v) => v.id !== video.id)
                                  setMyJourneyVideos(updatedVideos)
                                  localStorage.setItem("fitnessJourneyVideos", JSON.stringify(updatedVideos))
                                }}
                              >
                                <Trash className="w-4 h-4" />
                              </Button>
                            </td>
                            <td className="p-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePlayVideo(video.videoUrl || "/placeholder.mp4", video.title)}
                                className={`rounded-full w-8 h-8 flex items-center justify-center ${
                                  video.videoUrl ? "bg-[#FF7939] hover:bg-[#E66829]" : "bg-gray-600 hover:bg-gray-500"
                                } text-white`}
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newExercise = {
                            id: crypto.randomUUID(),
                            time: format(new Date(), "HH:mm"),
                            title: "Quick Add Exercise",
                            category: "Other",
                            duration: "0 min",
                            repsXSeries: "0 x 0",
                            calories: 0,
                            note: "",
                          }
                          setMyJourneyVideos((prev) => {
                            const updatedJourney = [...prev, newExercise]
                            localStorage.setItem("fitnessJourneyVideos", JSON.stringify(updatedJourney))
                            return updatedJourney
                          })
                        }}
                        className="rounded-full bg-[#FF7939] hover:bg-[#E66829] w-12 h-12 flex items-center justify-center mb-4"
                      >
                        <Plus className="w-6 h-6 text-white" />
                      </Button>
                      <p className="text-center text-gray-400">Add your first exercise to start your journey</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>

          {/* Fitness Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="col-span-12"
            style={{ marginTop: "2rem" }}
          >
            <Card className="bg-black text-white border-none transform hover:scale-[1.02] transition-transform duration-300 shadow-2xl">
              <CardContent className="p-6">
                <h3 className="text-2xl font-mitr font-bold text-[#FF7939] mb-2 text-center px-4">
                  <span className="text-white">Fitness for</span> Optimal Health
                </h3>
                <p className="text-gray-400 mb-4">
                  Regular exercise is crucial for maintaining good health and well-being. A balanced fitness routine
                  should include cardio for heart health, strength training for muscle and bone strength, and
                  flexibility exercises for mobility and injury prevention.
                </p>
                <div className="flex justify-center items-center">
                  <div className="flex space-x-8">
                    <div className="text-center">
                      <span className="text-[#FF7939] font-bold">🏃‍♂️ Cardio</span>
                      <p className="text-sm">150 min/week</p>
                    </div>
                    <div className="text-center">
                      <span className="text-[#FF7939] font-bold">💪 Strength</span>
                      <p className="text-sm">2-3 sessions/week</p>
                    </div>
                    <div className="text-center">
                      <span className="text-[#FF7939] font-bold">🧘‍♀️ Flexibility</span>
                      <p className="text-sm">Daily stretching</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Fitness Categories */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="col-span-12 mt-8"
          >
            <Card className="bg-[#1E1E1E] text-white border-none shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">Fitness Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      title: "Cardio & Conditioning",
                      icon: Heart,
                      color: "text-[#FF7939]",
                      description: "Enhance your cardiovascular fitness and endurance.",
                      coach: "Sarah Johnson",
                      coachImage: "/placeholder.svg?height=100&width=100",
                    },
                    {
                      title: "Mobility & Recovery",
                      icon: ActivitySquare,
                      color: "text-[#60A5FA]",
                      description: "Improve flexibility and aid in muscle recovery.",
                      coach: "Michael Chen",
                      coachImage: "/placeholder.svg?height=100&width=100",
                    },
                    {
                      title: "Upper Body Strength (Push & Pull)",
                      icon: Dumbbell,
                      color: "text-[#34D399]",
                      description: "Build strength in your upper body with balanced exercises.",
                      coach: "Alex Rodriguez",
                      coachImage: "/placeholder.svg?height=100&width=100",
                    },
                    {
                      title: "Lower Body Power & Stability",
                      icon: Zap,
                      color: "text-[#FBBF24]",
                      description: "Develop leg strength, power, and improve overall stability.",
                      coach: "Emma Wilson",
                      coachImage: "/placeholder.svg?height=100&width=100",
                    },
                  ].map((category, index) => (
                    <Card key={index} className="bg-[#2A2A2A] border-none">
                      <CardHeader className="flex flex-row items-center space-x-2">
                        <category.icon className={`w-6 h-6 ${category.color}`} />
                        <CardTitle>{category.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-400">{category.description}</p>

                        <div className="flex items-center mt-4 mb-4">
                          <div className="relative w-10 h-10 mr-3">
                            <Image
                              src={category.coachImage || "/placeholder.svg"}
                              alt={category.coach}
                              width={40}
                              height={40}
                              className="rounded-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">Coach</p>
                            <p className={`text-sm font-bold ${category.color}`}>{category.coach}</p>
                          </div>
                        </div>

                        <div className="mt-2">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setSelectedCategory(category.title)}
                          >
                            View Routines
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Fitness Folders Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="col-span-12 mt-6"
          >
            <Card className="bg-[#1E1E1E] text-white shadow-2xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl">Fitness Folders</CardTitle>
                  <Dialog open={isAddFolderDialogOpen} onOpenChange={setIsAddFolderDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-[#FF7939] hover:bg-[#E66829]">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Folder
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#2A2A2A] text-white">
                      <DialogHeader>
                        <DialogTitle>Add New Fitness Folder</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right">
                            Name
                          </Label>
                          <Input
                            id="name"
                            value={newFolderTitle}
                            onChange={(e) => setNewFolderTitle(e.target.value)}
                            className="col-span-3"
                          />
                        </div>
                      </div>
                      <Button onClick={addNewFolder} className="bg-[#FF7939] hover:bg-[#E66829]">
                        Add Folder
                      </Button>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {fitnessFolders.map((folder) => (
                    <Card key={folder.id} className="bg-[#2A2A2A] border-none">
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          {editingFolder && editingFolder.id === folder.id ? (
                            <Input
                              value={editingFolder.title}
                              onChange={(e) => setEditingFolder({ ...editingFolder, title: e.target.value })}
                              className="mr-2"
                            />
                          ) : (
                            <CardTitle className="text-xl font-semibold">{folder.title}</CardTitle>
                          )}
                          <div className="flex space-x-2">
                            {editingFolder && editingFolder.id === folder.id ? (
                              <Button variant="ghost" size="sm" onClick={updateFolderTitle}>
                                <Save className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="sm" onClick={() => startEditingFolder(folder)}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => deleteFolder(folder.id)}>
                              <Trash className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {folder.files.map((file) => (
                            <Card
                              key={file.id}
                              className="bg-[#1E1E1E] overflow-hidden border-none hover:shadow-lg transition-shadow"
                            >
                              <div className="relative aspect-video">
                                <Image
                                  src={file.thumbnail && file.thumbnail !== "" ? file.thumbnail : "/placeholder.svg"}
                                  alt={file.title}
                                  layout="fill"
                                  objectFit="cover"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null
                                    e.currentTarget.src = "/placeholder.svg"
                                  }}
                                />
                                <div
                                  className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                                  onClick={() => {
                                    handlePlayVideo(file.videoUrl || "", file.title)
                                    window.scrollTo({ top: 0, behavior: "smooth" })
                                  }}
                                >
                                  <Play className="h-8 w-8 text-white" />
                                </div>
                              </div>
                              <CardContent className="p-4">
                                <div className="flex justify-between items-center">
                                  <h4 className="font-semibold text-white mb-2">{file.title}</h4>
                                  <Checkbox
                                    checked={myJourneyVideos.some((v) => v.id === file.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        const newVideo: VideoFile = {
                                          id: file.id,
                                          time: format(new Date(), "HH:mm"),
                                          title: file.title,
                                          category: folder.title,
                                          duration: "N/A",
                                          repsXSeries: "N/A",
                                          calories: 0,
                                          note: "",
                                          videoUrl: file.videoUrl,
                                        }
                                        setMyJourneyVideos((prev) => [...prev, newVideo])
                                        setAddedVideos((prev) => new Set(prev).add(file.id))
                                      } else {
                                        setMyJourneyVideos((prev) => prev.filter((v) => v.id !== file.id))
                                        setAddedVideos((prev) => {
                                          const newSet = new Set(prev)
                                          newSet.delete(file.id)
                                          return newSet
                                        })
                                      }
                                      localStorage.setItem("fitnessJourneyVideos", JSON.stringify(myJourneyVideos))
                                    }}
                                  >
                                    {addedVideos.has(file.id) ? (
                                      <div className="flex items-center bg-[#FF7939] text-white px-2 py-1 rounded">
                                        <Check className="w-4 h-4 mr-1" />
                                        Added
                                      </div>
                                    ) : (
                                      "Add to Journey"
                                    )}
                                  </Checkbox>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                        {folder.files.length === 0 && (
                          <p className="text-center text-gray-400 mt-4">No videos in this folder yet.</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={openDialog === "workout"} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Workout</DialogTitle>
          </DialogHeader>
          {/* Add workout logging form here */}
        </DialogContent>
      </Dialog>

      <Dialog open={openDialog === "coaches"} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent className="bg-[#1E1E1E] text-white">
          <DialogHeader>
            <DialogTitle>Your Fitness Coaches</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {subscribedCoaches.map((coach, index) => (
              <div key={index} className="flex items-center justify-between bg-[#2A2A2A] p-4 rounded-lg">
                <div>
                  <h4 className="font-semibold">{coach.name}</h4>
                  <p className="text-sm text-gray-400">{coach.specialty}</p>
                </div>
                <a
                  href={`https://wa.me/${coach.phone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25D366] text-white px-4 py-2 rounded-lg hover:bg-[#128C7E] transition-colors"
                >
                  Go to WhatsApp
                </a>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openDialog === "calendar"} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Workout Planner</DialogTitle>
          </DialogHeader>
          {/* Add workout planner component here */}
        </DialogContent>
      </Dialog>

      {/* Time Modal */}
      <Dialog open={isTimeModalOpen} onOpenChange={setIsTimeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Workout Time</DialogTitle>
          </DialogHeader>
          <Input type="time" value={mealTime} onChange={(e) => setMealTime(e.target.value)} className="mt-2" />
          <Button onClick={addMealToJourney} className="mt-4">
            Add to Journey
          </Button>
        </DialogContent>
      </Dialog>

      {/* Add this dialog near the end of the component, just before the closing div */}
      <Dialog open={selectedCategory !== null} onOpenChange={() => setSelectedCategory(null)}>
        <DialogContent className="bg-[#1E1E1E] text-white max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedCategory}</DialogTitle>
          </DialogHeader>
          <ExerciseRoutines
            category={selectedCategory}
            onAddExercise={(exercise) =>
              addExerciseToJourney({
                ...exercise,
                videoUrl: exercise.videoUrl || "",
              })
            }
            handlePlayVideo={(url, title) => {
              handlePlayVideo(url, title)
              setSelectedCategory(null)
            }}
            onClose={() => setSelectedCategory(null)}
          />
        </DialogContent>
      </Dialog>
      {selectedVideo && selectedVideo.url && (
        <VideoPlayer
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          videoUrl={selectedVideo.url}
          title={selectedVideo.title}
        />
      )}

      {/* Add New Category Dialog */}
      <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
        <DialogContent className="bg-[#1E1E1E] text-white">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="bg-[#2A2A2A] border-gray-700"
          />
          <DialogFooter>
            <Button
              onClick={() => {
                if (newCategoryName.trim()) {
                  // Add the new category to available categories
                  setAvailableCategories((prev) => [...prev, newCategoryName.trim()])
                  // Set the new exercise category to this value
                  setNewExercise((prev) => ({ ...prev, category: newCategoryName.trim() }))
                  // Close the dialog
                  setIsAddCategoryDialogOpen(false)
                  // Reset the input
                  setNewCategoryName("")
                }
              }}
            >
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
