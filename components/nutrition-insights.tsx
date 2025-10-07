"use client"

import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import {
  Utensils,
  CalendarIcon,
  ShoppingCart,
  Play,
  Flame,
  Scale,
  Plus,
  Trash,
  Edit2,
  Save,
  Droplet,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Soup,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LogMeal } from "@/components/log-meal"
import { ModifyCalendar } from "@/components/modify-calendar"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, addDays, subDays, addWeeks, subWeeks, startOfWeek, endOfWeek } from "date-fns"
import { VideoPlayer } from "@/components/video-player"

interface MealOption {
  title: string
  calories: number
  protein: number
  carbs: number
  fat: number
  image: string
  type: string
  videoUrl?: string
}

interface MealCategoryProps {
  title: string
  options: MealOption[]
  selectedMeals: string[]
  onMealSelect: (meal: MealOption, category: string) => void
  coachNote?: {
    title: string
    description: string
  }
  selectedDate: Date
  handlePlayVideo: (videoUrl: string, title: string) => void
}

interface FolderData {
  id: string
  title: string
  files: VideoFile[]
}

interface VideoFile {
  id: string
  title: string
  time: string | null
  category: "Breakfast" | "Lunch" | "Sweet & Snacks" | "Dinner" | null
  protein: number | null
  fat: number | null
  carbs: number | null
  calories: number | null
  thumbnail?: string
  videoUrl?: string
}

interface NutritionSubscription {
  id: string
  title: string
  description: string
  icon: any
  color: string
  coach: {
    name: string
    photo: string
  }
}

const subscribedCoaches = [
  { name: "Emily Chen", specialty: "Nutrition", phone: "1234567890" },
  { name: "Michael Johnson", specialty: "Diet Planning", phone: "2345678901" },
  { name: "Sarah Williams", specialty: "Sports Nutrition", phone: "3456789012" },
]

const performanceData = [
  { month: "Jan", value: 65, trend: 62 },
  { month: "Feb", value: 85, trend: 80 },
  { month: "Mar", value: 72, trend: 75 },
  { month: "Apr", value: 92, trend: 88 },
  { month: "May", value: 78, trend: 82 },
  { month: "Jun", value: 95, trend: 90 },
]

const macroData = [
  { name: "Protein", current: 75, target: 120, color: "#FF7939" },
  { name: "Carbs", current: 180, target: 250, color: "#FFB56B" },
  { name: "Fat", current: 45, target: 60, color: "#FFD700" },
]

const shoppingList = {
  fridge: ["Greek yogurt", "Eggs", "Salmon fillet", "Cod fillet", "Chicken breast", "Lean beef strips"],
  vegetablesAndFruits: [
    "Mixed berries",
    "Avocado",
    "Spinach",
    "Mushrooms",
    "Sweet potato",
    "Mixed vegetables",
    "Salad greens",
  ],
  pantry: ["Oatmeal", "Quinoa", "Hummus", "Whole grain wraps"],
}

export function NutritionInsights() {
  const nutritionSubscriptions: NutritionSubscription[] = [
    {
      id: "muscle-growth",
      title: "Muscle Growth",
      description: "Meals focused on protein and calories for optimal muscle development",
      icon: Flame,
      color: "#FF7939",
      coach: {
        name: "Emily Chen",
        photo: "/placeholder.svg?height=80&width=80",
      },
    },
    {
      id: "fat-burning",
      title: "Fat Burning",
      description: "Low calorie meals with high protein to support fat loss",
      icon: Scale,
      color: "#60A5FA",
      coach: {
        name: "Michael Johnson",
        photo: "/placeholder.svg?height=80&width=80",
      },
    },
    {
      id: "balanced",
      title: "Balanced Nutrition",
      description: "Well-rounded meals for overall health and wellness",
      icon: Utensils,
      color: "#34D399",
      coach: {
        name: "Sarah Williams",
        photo: "/placeholder.svg?height=80&width=80",
      },
    },
  ]

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
  const [eatenMeals, setEatenMeals] = useState<string[]>([])
  const [isMealsCollapsed, setIsMealsCollapsed] = useState(false)
  const [mealsEatenToday, setMealsEatenToday] = useState<MealOption[]>([])
  const [nutritionFolders, setNutritionFolders] = useState<FolderData[]>([])
  const [isAddFolderDialogOpen, setIsAddFolderDialogOpen] = useState(false)
  const [newFolderTitle, setNewFolderTitle] = useState("")
  const [editingFolder, setEditingFolder] = useState<FolderData | null>(null)
  const [myJourneyVideos, setMyJourneyVideos] = useState<VideoFile[]>([])
  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  const [selectedWeek, setSelectedWeek] = useState(new Date())
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; title: string } | null>(null)
  const [currentVideo, setCurrentVideo] = useState<{ url: string; title: string } | null>(null)

  const [currentVideoIndex, setCurrentVideoIndex] = useState<number | null>(null)
  const [isPlayingJourney, setIsPlayingJourney] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<string>("muscle-growth")

  const achievements = [
    { name: "Hydration Hero", description: "7 consecutive days meeting water goals", icon: Droplet, progress: 85 },
    { name: "Protein Powerhouse", description: "Protein goals met for a week", icon: Utensils, progress: 100 },
    { name: "Consistency Champion", description: "30-day streak of logging meals", icon: CalendarIcon, progress: 60 },
  ]

  const mealOptions = {
    "muscle-growth": {
      breakfast: [
        {
          title: "Protein Yogurt Oatmeal",
          calories: 1015,
          protein: 45,
          carbs: 120,
          fat: 40,
          image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-HUGVL8119icI8twyRbQNFMNbTEq8zG.png",
          type: "High Protein",
          videoUrl: "/videos/breakfast-1.mp4",
        },
        {
          title: "Berry Protein Smoothie",
          calories: 850,
          protein: 40,
          carbs: 100,
          fat: 30,
          image: "/placeholder.svg?height=300&width=400",
          type: "High Protein",
          videoUrl: "/videos/breakfast-2.mp4",
        },
        {
          title: "Egg White Veggie Omelet",
          calories: 650,
          protein: 45,
          carbs: 30,
          fat: 35,
          image: "/placeholder.svg?height=300&width=400",
          type: "High Protein",
          videoUrl: "/videos/breakfast-3.mp4",
        },
      ],
      lunch: [
        {
          title: "Chicken Rice Bowl",
          calories: 950,
          protein: 50,
          carbs: 110,
          fat: 30,
          image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-HUGVL8119icI8twyRbQNFMNbTEq8zG.png",
          type: "High Protein",
          videoUrl: "/videos/lunch-1.mp4",
        },
        {
          title: "Tuna Pasta Salad",
          calories: 780,
          protein: 40,
          carbs: 90,
          fat: 25,
          image: "/placeholder.svg?height=300&width=400",
          type: "High Carb",
          videoUrl: "/videos/lunch-2.mp4",
        },
        {
          title: "High Protein Turkey Wrap",
          calories: 720,
          protein: 45,
          carbs: 70,
          fat: 30,
          image: "/placeholder.svg?height=300&width=400",
          type: "Balanced",
          videoUrl: "/videos/lunch-3.mp4",
        },
      ],
      dinner: [
        {
          title: "Steak with Sweet Potato",
          calories: 920,
          protein: 55,
          carbs: 60,
          fat: 45,
          image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-HUGVL8119icI8twyRbQNFMNbTEq8zG.png",
          type: "High Protein",
          videoUrl: "/videos/dinner-1.mp4",
        },
        {
          title: "Salmon with Quinoa",
          calories: 820,
          protein: 45,
          carbs: 40,
          fat: 50,
          image: "/placeholder.svg?height=300&width=400",
          type: "Omega Rich",
          videoUrl: "/videos/dinner-2.mp4",
        },
        {
          title: "Chicken and Broccoli Rice",
          calories: 750,
          protein: 50,
          carbs: 80,
          fat: 20,
          image: "/placeholder.svg?height=300&width=400",
          type: "Balanced",
          videoUrl: "/videos/dinner-3.mp4",
        },
      ],
      "sweets & snacks": [
        {
          title: "Protein Shake",
          calories: 300,
          protein: 30,
          carbs: 10,
          fat: 5,
          image: "/placeholder.svg?height=300&width=400",
          type: "High Protein",
          videoUrl: "/videos/snack-1.mp4",
        },
        {
          title: "Greek Yogurt with Nuts",
          calories: 280,
          protein: 20,
          carbs: 15,
          fat: 18,
          image: "/placeholder.svg?height=300&width=400",
          type: "Protein",
          videoUrl: "/videos/snack-2.mp4",
        },
        {
          title: "Protein Bar",
          calories: 250,
          protein: 20,
          carbs: 25,
          fat: 10,
          image: "/placeholder.svg?height=300&width=400",
          type: "Energy",
          videoUrl: "/videos/snack-3.mp4",
        },
      ],
    },
    "fat-burning": {
      breakfast: [
        {
          title: "Egg White Veggie Scramble",
          calories: 350,
          protein: 30,
          carbs: 20,
          fat: 15,
          image: "/placeholder.svg?height=300&width=400",
          type: "Low Calorie",
          videoUrl: "/videos/breakfast-1.mp4",
        },
        {
          title: "Green Protein Smoothie",
          calories: 280,
          protein: 25,
          carbs: 30,
          fat: 8,
          image: "/placeholder.svg?height=300&width=400",
          type: "Low Calorie",
          videoUrl: "/videos/breakfast-2.mp4",
        },
        {
          title: "Turkey Bacon & Egg Whites",
          calories: 320,
          protein: 35,
          carbs: 15,
          fat: 12,
          image: "/placeholder.svg?height=300&width=400",
          type: "High Protein",
          videoUrl: "/videos/breakfast-3.mp4",
        },
      ],
      lunch: [
        {
          title: "Grilled Chicken Salad",
          calories: 380,
          protein: 40,
          carbs: 20,
          fat: 15,
          image: "/placeholder.svg?height=300&width=400",
          type: "Low Carb",
          videoUrl: "/videos/lunch-1.mp4",
        },
        {
          title: "Tuna Lettuce Wraps",
          calories: 320,
          protein: 35,
          carbs: 10,
          fat: 18,
          image: "/placeholder.svg?height=300&width=400",
          type: "Low Carb",
          videoUrl: "/videos/lunch-2.mp4",
        },
        {
          title: "Shrimp and Vegetable Stir-Fry",
          calories: 340,
          protein: 30,
          carbs: 25,
          fat: 12,
          image: "/placeholder.svg?height=300&width=400",
          type: "Low Calorie",
          videoUrl: "/videos/lunch-3.mp4",
        },
      ],
      dinner: [
        {
          title: "Lean Beef with Vegetables",
          calories: 420,
          protein: 45,
          carbs: 15,
          fat: 20,
          image: "/placeholder.svg?height=300&width=400",
          type: "Low Carb",
          videoUrl: "/videos/dinner-1.mp4",
        },
        {
          title: "White Fish with Asparagus",
          calories: 350,
          protein: 40,
          carbs: 10,
          fat: 15,
          image: "/placeholder.svg?height=300&width=400",
          type: "Low Calorie",
          videoUrl: "/videos/dinner-2.mp4",
        },
        {
          title: "Turkey Meatballs with Zucchini Noodles",
          calories: 380,
          protein: 35,
          carbs: 20,
          fat: 18,
          image: "/placeholder.svg?height=300&width=400",
          type: "Low Carb",
          videoUrl: "/videos/dinner-3.mp4",
        },
      ],
      "sweets & snacks": [
        {
          title: "Protein Shake with Water",
          calories: 120,
          protein: 25,
          carbs: 3,
          fat: 1,
          image: "/placeholder.svg?height=300&width=400",
          type: "Low Calorie",
          videoUrl: "/videos/snack-1.mp4",
        },
        {
          title: "Celery with Almond Butter",
          calories: 150,
          protein: 5,
          carbs: 8,
          fat: 12,
          image: "/placeholder.svg?height=300&width=400",
          type: "Low Carb",
          videoUrl: "/videos/snack-2.mp4",
        },
        {
          title: "Turkey Jerky",
          calories: 90,
          protein: 15,
          carbs: 5,
          fat: 2,
          image: "/placeholder.svg?height=300&width=400",
          type: "High Protein",
          videoUrl: "/videos/snack-3.mp4",
        },
      ],
    },
    balanced: {
      breakfast: [
        {
          title: "Whole Grain Toast with Avocado & Egg",
          calories: 450,
          protein: 20,
          carbs: 40,
          fat: 25,
          image: "/placeholder.svg?height=300&width=400",
          type: "Balanced",
          videoUrl: "/videos/breakfast-1.mp4",
        },
        {
          title: "Mixed Berry Oatmeal",
          calories: 380,
          protein: 15,
          carbs: 65,
          fat: 10,
          image: "/placeholder.svg?height=300&width=400",
          type: "Balanced",
          videoUrl: "/videos/breakfast-2.mp4",
        },
        {
          title: "Veggie & Cheese Omelet with Fruit",
          calories: 420,
          protein: 25,
          carbs: 30,
          fat: 20,
          image: "/placeholder.svg?height=300&width=400",
          type: "Balanced",
          videoUrl: "/videos/breakfast-3.mp4",
        },
      ],
      lunch: [
        {
          title: "Quinoa Bowl with Roasted Vegetables",
          calories: 480,
          protein: 20,
          carbs: 60,
          fat: 18,
          image: "/placeholder.svg?height=300&width=400",
          type: "Balanced",
          videoUrl: "/videos/lunch-1.mp4",
        },
        {
          title: "Turkey & Avocado Sandwich",
          calories: 520,
          protein: 25,
          carbs: 50,
          fat: 22,
          image: "/placeholder.svg?height=300&width=400",
          type: "Balanced",
          videoUrl: "/videos/lunch-2.mp4",
        },
        {
          title: "Mediterranean Chickpea Salad",
          calories: 440,
          protein: 18,
          carbs: 55,
          fat: 20,
          image: "/placeholder.svg?height=300&width=400",
          type: "Plant-Based",
          videoUrl: "/videos/lunch-3.mp4",
        },
      ],
      dinner: [
        {
          title: "Baked Chicken with Sweet Potato & Greens",
          calories: 550,
          protein: 35,
          carbs: 45,
          fat: 22,
          image: "/placeholder.svg?height=300&width=400",
          type: "Balanced",
          videoUrl: "/videos/dinner-1.mp4",
        },
        {
          title: "Lentil & Vegetable Soup with Whole Grain Bread",
          calories: 480,
          protein: 22,
          carbs: 60,
          fat: 15,
          image: "/placeholder.svg?height=300&width=400",
          type: "Plant-Based",
          videoUrl: "/videos/dinner-2.mp4",
        },
        {
          title: "Grilled Salmon with Quinoa & Roasted Vegetables",
          calories: 520,
          protein: 30,
          carbs: 40,
          fat: 25,
          image: "/placeholder.svg?height=300&width=400",
          type: "Omega Rich",
          videoUrl: "/videos/dinner-3.mp4",
        },
      ],
      "sweets & snacks": [
        {
          title: "Apple with Nut Butter",
          calories: 200,
          protein: 7,
          carbs: 25,
          fat: 10,
          image: "/placeholder.svg?height=300&width=400",
          type: "Balanced",
          videoUrl: "/videos/snack-1.mp4",
        },
        {
          title: "Hummus with Vegetable Sticks",
          calories: 180,
          protein: 5,
          carbs: 20,
          fat: 8,
          image: "/placeholder.svg?height=300&width=400",
          type: "Plant-Based",
          videoUrl: "/videos/snack-2.mp4",
        },
        {
          title: "Yogurt with Berries & Granola",
          calories: 230,
          protein: 12,
          carbs: 30,
          fat: 6,
          image: "/placeholder.svg?height=300&width=400",
          type: "Balanced",
          videoUrl: "/videos/snack-3.mp4",
        },
      ],
    },
  }

  const getBackgroundColor = (current: number, target: number) => {
    const percentage = (current / target) * 100
    if (percentage >= 100 && percentage <= 120) return "bg-orange-500 bg-opacity-75"
    if (percentage > 120) return "bg-red-500 bg-opacity-75"
    return "bg-transparent"
  }

  const addMeal = (meal: string) => {
    setEatenMeals([...eatenMeals, meal])
  }

  const onMealSelect = (meal: MealOption, category: string) => {
    console.log("Meal selected:", meal, category)
    const newMeal: VideoFile = {
      id: `meal-${Date.now()}`,
      title: meal.title,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      category: category as "Breakfast" | "Lunch" | "Sweet & Snacks" | "Dinner",
      protein: meal.protein,
      fat: meal.fat,
      carbs: meal.carbs,
      calories: meal.calories,
      videoUrl: meal.videoUrl,
    }
    setMyJourneyVideos((prevVideos) => {
      const updatedVideos = [...prevVideos, newMeal]
      localStorage.setItem("myJourneyVideos", JSON.stringify(updatedVideos))
      return updatedVideos
    })
  }

  const handlePlayVideo = (videoUrl: string, title: string) => {
    console.log("Playing video:", videoUrl, title)
    const index = myJourneyVideos.findIndex((v) => v.videoUrl === videoUrl)
    setCurrentVideoIndex(index)
    setCurrentVideo({ url: videoUrl, title })
    setIsPlayingJourney(false)
  }

  const handleNextVideo = () => {
    if (currentVideoIndex !== null && currentVideoIndex < myJourneyVideos.length - 1) {
      const nextIndex = currentVideoIndex + 1
      setCurrentVideoIndex(nextIndex)
      setCurrentVideo({
        url: myJourneyVideos[nextIndex].videoUrl || "/placeholder-video.mp4",
        title: myJourneyVideos[nextIndex].title,
      })
    }
  }

  const handlePreviousVideo = () => {
    if (currentVideoIndex !== null && currentVideoIndex > 0) {
      const prevIndex = currentVideoIndex - 1
      setCurrentVideoIndex(prevIndex)
      setCurrentVideo({
        url: myJourneyVideos[prevIndex].videoUrl || "/placeholder-video.mp4",
        title: myJourneyVideos[prevIndex].title,
      })
    }
  }

  useEffect(() => {
    const savedNutritionFolders = localStorage.getItem("nutritionFolders")
    const savedJourneyVideos = localStorage.getItem("myJourneyVideos")

    if (savedNutritionFolders) {
      setNutritionFolders(JSON.parse(savedNutritionFolders))
    }
    if (savedJourneyVideos) {
      setMyJourneyVideos(JSON.parse(savedJourneyVideos))
    }
  }, [])

  const addNewFolder = () => {
    if (newFolderTitle.trim()) {
      const newFolder: FolderData = {
        id: `nutrition-${Date.now().toString()}`,
        title: newFolderTitle.trim(),
        files: [],
      }
      setNutritionFolders([...nutritionFolders, newFolder])
      setIsAddFolderDialogOpen(false)
      setNewFolderTitle("")
      localStorage.setItem("nutritionFolders", JSON.stringify([...nutritionFolders, newFolder]))
    }
  }

  const startEditingFolder = (folder: FolderData) => {
    setEditingFolder({ ...folder })
  }

  const updateFolderTitle = () => {
    if (editingFolder) {
      const updatedFolders = nutritionFolders.map((folder) =>
        folder.id === editingFolder.id ? { ...editingFolder } : folder,
      )
      setNutritionFolders(updatedFolders)
      setEditingFolder(null)
      localStorage.setItem("nutritionFolders", JSON.stringify(updatedFolders))
    }
  }

  const deleteFolder = (id: string) => {
    const updatedFolders = nutritionFolders.filter((folder) => folder.id !== id)
    setNutritionFolders(updatedFolders)
    localStorage.setItem("nutritionFolders", JSON.stringify(updatedFolders))
  }

  const toggleVideoInJourney = (video: VideoFile) => {
    setMyJourneyVideos((prevVideos) => {
      const videoIndex = prevVideos.findIndex((v) => v.id === video.id)
      let updatedVideos
      if (videoIndex === -1) {
        updatedVideos = [...prevVideos, video]
      } else {
        updatedVideos = prevVideos.filter((v) => v.id !== video.id)
      }
      localStorage.setItem("myJourneyVideos", JSON.stringify(updatedVideos))
      return updatedVideos
    })
  }

  const saveVideoToFolder = (video: VideoFile, folderId: string) => {
    const updatedFolders = nutritionFolders.map((folder) => {
      if (folder.id === folderId) {
        return {
          ...folder,
          files: [...folder.files, video],
        }
      }
      return folder
    })
    setNutritionFolders(updatedFolders)
    localStorage.setItem("nutritionFolders", JSON.stringify(updatedFolders))
  }

  const goToPreviousDay = () => {
    setSelectedDate((prevDate) => subDays(prevDate, 1))
  }

  const goToNextDay = () => {
    setSelectedDate((prevDate) => addDays(prevDate, 1))
  }

  const goToPreviousWeek = () => {
    setSelectedWeek((prevWeek) => subWeeks(prevWeek, 1))
  }

  const goToNextWeek = () => {
    setSelectedWeek((prevWeek) => addWeeks(prevWeek, 1))
  }

  const playMyJourney = () => {
    if (myJourneyVideos.length > 0) {
      setCurrentVideoIndex(0)
      setCurrentVideo({
        url: myJourneyVideos[0].videoUrl || "/placeholder-video.mp4",
        title: myJourneyVideos[0].title,
      })
      setIsPlayingJourney(true)
    }
  }

  const playNextVideo = () => {
    if (currentVideoIndex !== null && currentVideoIndex < myJourneyVideos.length - 1) {
      const nextIndex = currentVideoIndex + 1
      setCurrentVideoIndex(nextIndex)
      setCurrentVideo({
        url: myJourneyVideos[nextIndex].videoUrl || "/placeholder-video.mp4",
        title: myJourneyVideos[nextIndex].title,
      })
    } else {
      setIsPlayingJourney(false)
      setCurrentVideoIndex(null)
    }
  }

  const incrementWater = () => {
    setWaterIntake(waterIntake + 1)
  }

  const decrementWater = () => {
    setWaterIntake(Math.max(0, waterIntake - 1))
  }

  return (
    <>
      <div className="relative min-h-screen bg-[#121212] p-8">
        {/* Metrics Cards */}

        {/* Main Content */}
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="grid grid-cols-12 gap-4">
            {/* Title Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="col-span-12 mb-4">
              <Card className="bg-black text-white border-none shadow-2xl"></Card>
            </motion.div>

            {/* Metrics Cards - Now positioned above the video player */}
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
                      <h3 className="text-2xl font-bold text-white">2,150</h3>
                      <p className="text-sm text-gray-400">Daily Calories</p>
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

            {/* Video Player - Now positioned below the metrics cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="col-span-12 mb-6"
            >
              <div className="relative">
                {/* Orange frame with arrow */}
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-[#FF7939] text-white p-3.5 rounded-lg z-10 scale-90">
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
                      {currentVideo ? (
                        <VideoPlayer
                          videoUrl={currentVideo.url}
                          title={currentVideo.title}
                          isPlaying={true}
                          onEnded={isPlayingJourney ? playNextVideo : undefined}
                          onPrevious={handlePreviousVideo}
                          onNext={handleNextVideo}
                        />
                      ) : (
                        <div className="aspect-video bg-gray-900 flex items-center justify-center text-white">
                          No video selected
                        </div>
                      )}
                      <div className="mt-4 flex justify-center">
                        <Button onClick={playMyJourney} disabled={myJourneyVideos.length === 0}>
                          Play My Journey
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>

            {/* Shopping List - Centered with arrow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="col-span-12 mt-6 flex justify-center"
            >
              <div className="w-full max-w-3xl">
                <div className="bg-[#1E1E1E] text-white rounded-lg px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-6 h-6 text-[#FF7939]" />
                    <h3 className="text-xl font-semibold">Shopping List</h3>
                  </div>
                  <Collapsible open={isShoppingListVisible} onOpenChange={setIsShoppingListVisible}>
                    <CollapsibleTrigger asChild>
                      <Button
                        className="bg-transparent hover:bg-[#2A2A2A] p-2"
                        onClick={() => setIsShoppingListVisible(!isShoppingListVisible)}
                      >
                        <ChevronRight
                          className={`h-6 w-6 text-[#FF7939] transition-transform duration-200 ${isShoppingListVisible ? "rotate-90" : ""}`}
                        />
                      </Button>
                    </CollapsibleTrigger>
                  </Collapsible>
                </div>
                <div className="relative">
                  <Collapsible open={isShoppingListVisible} onOpenChange={setIsShoppingListVisible}>
                    <CollapsibleContent className="mt-2">
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{
                          opacity: isShoppingListVisible ? 1 : 0,
                          height: isShoppingListVisible ? "auto" : 0,
                        }}
                        transition={{ duration: 0.3 }}
                        className="bg-black p-6 rounded-lg shadow-lg border border-gray-800"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {Object.entries(shoppingList).map(([category, items]) => (
                            <div key={category}>
                              <h4 className="font-semibold mb-3 capitalize text-[#FF7939] text-lg">{category}</h4>
                              <ul className="space-y-2 text-sm text-gray-300">
                                {items.map((item, index) => (
                                  <li key={index} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[#FF7939]"></div>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    </CollapsibleContent>
                  </Collapsible>
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
                      My <span className="text-[#FF7939]">Nutrition</span> Journey
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[400px]">
                    {myJourneyVideos.length > 0 ? (
                      <>
                        <table className="w-full">
                          <thead>
                            <tr className="text-left">
                              <th className="p-2">Time</th>
                              <th className="p-2">Meal / Description</th>
                              <th className="p-2">Category</th>
                              <th className="p-2">Protein (g)</th>
                              <th className="p-2">Fat (g)</th>
                              <th className="p-2">Carbs (g)</th>
                              <th className="p-2">Calories</th>
                              <th className="p-2">Video</th>
                              <th className="p-2">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {myJourneyVideos.map((video) => (
                              <tr key={video.id} className="border-t border-gray-700">
                                <td className="p-2">
                                  {editingTitle === video.id ? (
                                    <Input
                                      value={video.time || ""}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, "").slice(0, 4)
                                        let formattedValue = value
                                        if (value.length >= 3) {
                                          const hours = value.slice(0, 2)
                                          const minutes = value.slice(2)
                                          formattedValue = `${hours}:${minutes}`
                                        }
                                        if (formattedValue.length === 5) {
                                          const [hours, minutes] = formattedValue.split(":")
                                          const validHours = Math.min(23, Math.max(0, Number.parseInt(hours)))
                                          const validMinutes = Math.min(59, Math.max(0, Number.parseInt(minutes)))
                                          formattedValue = `${validHours.toString().padStart(2, "0")}:${validMinutes.toString().padStart(2, "0")}`
                                        }
                                        setMyJourneyVideos((prevVideos) =>
                                          prevVideos.map((v) =>
                                            v.id === video.id ? { ...v, time: formattedValue } : v,
                                          ),
                                        )
                                      }}
                                      className="w-full"
                                      placeholder="00:00"
                                      maxLength={5}
                                    />
                                  ) : (
                                    video.time || "N/A"
                                  )}
                                </td>
                                <td className="p-2">
                                  {editingTitle === video.id ? (
                                    <Input
                                      value={video.title || ""}
                                      onChange={(e) => {
                                        setMyJourneyVideos((prevVideos) =>
                                          prevVideos.map((v) =>
                                            v.id === video.id ? { ...v, title: e.target.value } : v,
                                          ),
                                        )
                                      }}
                                      className="w-full"
                                      placeholder="Meal name or video description"
                                    />
                                  ) : (
                                    video.title || "N/A"
                                  )}
                                </td>
                                <td className="p-2">
                                  {editingTitle === video.id ? (
                                    <Select
                                      value={video.category || ""}
                                      onValueChange={(value) => {
                                        setMyJourneyVideos((prevVideos) =>
                                          prevVideos.map((v) => (v.id === video.id ? { ...v, category: value } : v)),
                                        )
                                      }}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select category" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Breakfast">Breakfast</SelectItem>
                                        <SelectItem value="Lunch">Lunch</SelectItem>
                                        <SelectItem value="Sweet & Snacks">Sweet & Snacks</SelectItem>
                                        <SelectItem value="Dinner">Dinner</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    video.category || "N/A"
                                  )}
                                </td>
                                <td className="p-2">
                                  {editingTitle === video.id ? (
                                    <Input
                                      type="number"
                                      value={video.protein?.toString() || ""}
                                      onChange={(e) => {
                                        setMyJourneyVideos((prevVideos) =>
                                          prevVideos.map((v) =>
                                            v.id === video.id ? { ...v, protein: Number(e.target.value) } : v,
                                          ),
                                        )
                                      }}
                                      className="w-full"
                                      placeholder="Protein (g)"
                                    />
                                  ) : (
                                    video.protein || "N/A"
                                  )}
                                </td>
                                <td className="p-2">
                                  {editingTitle === video.id ? (
                                    <Input
                                      type="number"
                                      value={video.fat?.toString() || ""}
                                      onChange={(e) => {
                                        setMyJourneyVideos((prevVideos) =>
                                          prevVideos.map((v) =>
                                            v.id === video.id ? { ...v, fat: Number(e.target.value) } : v,
                                          ),
                                        )
                                      }}
                                      className="w-full"
                                      placeholder="Fat (g)"
                                    />
                                  ) : (
                                    video.fat || "N/A"
                                  )}
                                </td>
                                <td className="p-2">
                                  {editingTitle === video.id ? (
                                    <Input
                                      type="number"
                                      value={video.carbs?.toString() || ""}
                                      onChange={(e) => {
                                        setMyJourneyVideos((prevVideos) =>
                                          prevVideos.map((v) =>
                                            v.id === video.id ? { ...v, carbs: Number(e.target.value) } : v,
                                          ),
                                        )
                                      }}
                                      className="w-full"
                                      placeholder="Carbs (g)"
                                    />
                                  ) : (
                                    video.carbs || "N/A"
                                  )}
                                </td>
                                <td className="p-2">
                                  {editingTitle === video.id ? (
                                    <Input
                                      type="number"
                                      value={video.calories?.toString() || ""}
                                      onChange={(e) => {
                                        setMyJourneyVideos((prevVideos) =>
                                          prevVideos.map((v) =>
                                            v.id === video.id ? { ...v, calories: Number(e.target.value) } : v,
                                          ),
                                        )
                                      }}
                                      className="w-full"
                                      placeholder="Calories"
                                    />
                                  ) : (
                                    video.calories || "N/A"
                                  )}
                                </td>
                                <td className="p-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handlePlayVideo(video.videoUrl || "/placeholder-video.mp4", video.title)
                                    }
                                    className={`rounded-full w-8 h-8 flex items-center justify-center ${
                                      video.videoUrl
                                        ? "bg-[#FF7939] hover:bg-[#E66829] text-white"
                                        : "bg-gray-500 hover:bg-gray-600 text-white"
                                    }`}
                                  >
                                    <Play className="w-4 h-4" />
                                  </Button>
                                </td>
                                <td className="p-2">
                                  {editingTitle === video.id ? (
                                    <Button
                                      onClick={() => {
                                        setEditingTitle(null)
                                        localStorage.setItem("myJourneyVideos", JSON.stringify(myJourneyVideos))
                                      }}
                                      size="sm"
                                    >
                                      <Save className="w-4 h-4" />
                                    </Button>
                                  ) : (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleVideoInJourney(video)}
                                        className="text-red-500 hover:text-red-600 mr-2"
                                      >
                                        <Trash className="w-4 h-4" />
                                      </Button>
                                      <Button variant="ghost" size="sm" onClick={() => setEditingTitle(video.id)}>
                                        <Edit2 className="w-4 h-4" />
                                      </Button>
                                    </>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="flex justify-center mt-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              onMealSelect(
                                { title: "Quick Add", calories: 0, protein: 0, carbs: 0, fat: 0, image: "", type: "" },
                                "Sweet & Snacks",
                              )
                            }
                            className="rounded-full bg-[#FF7939] hover:bg-[#E66829] w-8 h-8 flex items-center justify-center"
                          >
                            <Plus className="w-4 h-4 text-white" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-40">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            onMealSelect(
                              { title: "Quick Add", calories: 0, protein: 0, carbs: 0, fat: 0, image: "", type: "" },
                              "Sweet & Snacks",
                            )
                          }
                          className="rounded-full bg-[#FF7939] hover:bg-[#E66829] w-12 h-12 flex items-center justify-center mb-4"
                        >
                          <Plus className="w-6 h-6 text-white" />
                        </Button>
                        <p className="text-center text-gray-400">Add your first meal to start your journey</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>

            {/* Nutrition Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="col-span-12"
              style={{ marginTop: "2rem" }}
            >
              <Card className="bg-black text-white border-none transform hover:scale-[1.02] transition-transform duration-300 shadow-2xl">
                <CardContent className="p-6">
                  {selectedSubscription === "muscle-growth" && (
                    <>
                      <h3 className="text-2xl font-mitr font-bold text-[#FF7939] mb-2 text-center px-4">
                        <span className="text-white">Nutrition for</span> Muscle Growth
                      </h3>
                      <p className="text-gray-400 mb-4">
                        Proteins help build and repair muscles, carbs provide energy for peak performance, and fats
                        support hormonal balance and cell health. For muscle growth, a moderate calorie surplus is key,
                        prioritizing protein and carbs for recovery.
                      </p>
                      <div className="flex justify-center items-center">
                        <div className="flex space-x-8">
                          <div className="text-center">
                            <span className="text-[#FF7939] font-bold">🔹 Carbs</span>
                            <p className="text-sm">45-55%</p>
                          </div>
                          <div className="text-center">
                            <span className="text-[#FF7939] font-bold">🔹 Protein</span>
                            <p className="text-sm">25-35%</p>
                          </div>
                          <div className="text-center">
                            <span className="text-[#FF7939] font-bold">🔹 Fats</span>
                            <p className="text-sm">15-25%</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedSubscription === "fat-burning" && (
                    <>
                      <h3 className="text-2xl font-mitr font-bold text-[#60A5FA] mb-2 text-center px-4">
                        <span className="text-white">Nutrition for</span> Fat Burning
                      </h3>
                      <p className="text-gray-400 mb-4">
                        A calorie deficit is essential for fat loss, with high protein intake to preserve muscle mass.
                        Lower carbs and moderate healthy fats help control hunger and support metabolism. Timing
                        nutrients around workouts maximizes fat burning potential.
                      </p>
                      <div className="flex justify-center items-center">
                        <div className="flex space-x-8">
                          <div className="text-center">
                            <span className="text-[#60A5FA] font-bold">🔹 Carbs</span>
                            <p className="text-sm">20-30%</p>
                          </div>
                          <div className="text-center">
                            <span className="text-[#60A5FA] font-bold">🔹 Protein</span>
                            <p className="text-sm">35-45%</p>
                          </div>
                          <div className="text-center">
                            <span className="text-[#60A5FA] font-bold">🔹 Fats</span>
                            <p className="text-sm">25-35%</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedSubscription === "balanced" && (
                    <>
                      <h3 className="text-2xl font-mitr font-bold text-[#34D399] mb-2 text-center px-4">
                        <span className="text-white">Balanced</span> Nutrition
                      </h3>
                      <p className="text-gray-400 mb-4">
                        A well-rounded approach focusing on whole foods from all food groups. Balanced macronutrients
                        support overall health, energy levels, and long-term sustainability. Emphasis on nutrient
                        density and dietary variety ensures all nutritional needs are met.
                      </p>
                      <div className="flex justify-center items-center">
                        <div className="flex space-x-8">
                          <div className="text-center">
                            <span className="text-[#34D399] font-bold">🔹 Carbs</span>
                            <p className="text-sm">40-50%</p>
                          </div>
                          <div className="text-center">
                            <span className="text-[#34D399] font-bold">🔹 Protein</span>
                            <p className="text-sm">20-30%</p>
                          </div>
                          <div className="text-center">
                            <span className="text-[#34D399] font-bold">🔹 Fats</span>
                            <p className="text-sm">25-35%</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Dialogs */}

          <Dialog open={openDialog === "meal"} onOpenChange={() => setOpenDialog(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Meal</DialogTitle>
              </DialogHeader>
              <LogMeal addMeal={addMeal} />
            </DialogContent>
          </Dialog>

          <Dialog open={openDialog === "coaches"} onOpenChange={() => setOpenDialog(null)}>
            <DialogContent className="bg-[#1E1E1E] text-white">
              <DialogHeader>
                <DialogTitle>Your Nutrition Coaches</DialogTitle>
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
                <DialogTitle>MealPlanner</DialogTitle>
              </DialogHeader>
              <ModifyCalendar />
            </DialogContent>
          </Dialog>

          {/* Meal section */}

          {/* Move the Nutrition Folders section here */}
          {/* Nutrition Categories with Videos */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="container mx-auto px-4 py-8 mt-8"
          >
            {/* Nutrition Subscription Selector */}
            <div className="mb-6 mt-[-20px]">
              <h3 className="text-2xl font-bold text-white mb-4 text-center">Subscriptions</h3>
              <div className="relative">
                {/* Left Arrow */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-[-20px] top-1/2 transform -translate-y-1/2 bg-[#1E1E1E]/80 hover:bg-[#1E1E1E] rounded-full z-10"
                >
                  <ChevronLeft className="h-6 w-6 text-white" />
                </Button>

                {/* Subscription Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {nutritionSubscriptions.map((subscription) => {
                    const isSelected = selectedSubscription === subscription.id
                    const IconComponent = subscription.icon
                    return (
                      <Card
                        key={subscription.id}
                        className={`cursor-pointer transition-all duration-300 border-2 ${
                          isSelected ? `border-[${subscription.color}] bg-[#2A2A2A]` : "border-transparent bg-[#1E1E1E]"
                        }`}
                        onClick={() => setSelectedSubscription(subscription.id)}
                      >
                        <div className="flex flex-col items-center pt-4">
                          <div className="relative w-16 h-16 rounded-full overflow-hidden mb-2">
                            <Image
                              src={subscription.coach.photo || "/placeholder.svg"}
                              alt={subscription.coach.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <p className="text-white font-medium text-sm">{subscription.coach.name}</p>
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full`} style={{ backgroundColor: `${subscription.color}20` }}>
                              <IconComponent className="w-5 h-5" style={{ color: subscription.color }} />
                            </div>
                            <div>
                              <h4 className="font-semibold text-white">{subscription.title}</h4>
                              <p className="text-sm text-gray-400">{subscription.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {/* Right Arrow */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-[-20px] top-1/2 transform -translate-y-1/2 bg-[#1E1E1E]/80 hover:bg-[#1E1E1E] rounded-full z-10"
                >
                  <ChevronRight className="h-6 w-6 text-white" />
                </Button>
              </div>
            </div>
            <Card className="bg-[#1E1E1E] text-white border-none shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">Meals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Breakfast Category */}
                  <Card className="bg-[#2A2A2A] border-none">
                    <CardHeader className="flex flex-row items-center space-x-2">
                      <Coffee className="w-6 h-6 text-[#FF7939]" />
                      <CardTitle>Breakfast</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-400 mb-4">
                        Morning meals to kickstart your day with energy and nutrition.
                      </p>
                      <div className="grid grid-cols-1 gap-4">
                        {mealOptions[selectedSubscription].breakfast.map((option, index) => (
                          <div key={index} className="flex items-center space-x-3 bg-[#1E1E1E] p-3 rounded-lg">
                            <div className="relative w-16 h-16 flex-shrink-0">
                              <Image
                                src={option.image && option.image !== "" ? option.image : "/placeholder.svg"}
                                alt={option.title}
                                fill
                                className="object-cover rounded-md"
                                onError={(e) => {
                                  e.currentTarget.onerror = null
                                  e.currentTarget.src = "/placeholder.svg"
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-white text-sm">{option.title}</h4>
                              <p className="text-xs text-gray-400">
                                {option.calories} Cal | P: {option.protein}g | C: {option.carbs}g | F: {option.fat}g
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handlePlayVideo(option.videoUrl || "/placeholder-video.mp4", option.title)
                                }
                                className="rounded-full w-8 h-8 flex items-center justify-center bg-[#FF7939] hover:bg-[#E66829] text-white"
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onMealSelect(option, "Breakfast")}
                                className="rounded-full w-8 h-8 flex items-center justify-center bg-[#1E1E1E] hover:bg-[#2A2A2A] text-white"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Lunch Category */}
                  <Card className="bg-[#2A2A2A] border-none">
                    <CardHeader className="flex flex-row items-center space-x-2">
                      <Flame className="w-6 h-6 text-[#60A5FA]" />
                      <CardTitle>Lunch</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-400 mb-4">
                        Midday fuel to power you through your afternoon activities.
                      </p>
                      <div className="grid grid-cols-1 gap-4">
                        {mealOptions[selectedSubscription].lunch.map((option, index) => (
                          <div key={index} className="flex items-center space-x-3 bg-[#1E1E1E] p-3 rounded-lg">
                            <div className="relative w-16 h-16 flex-shrink-0">
                              <Image
                                src={option.image && option.image !== "" ? option.image : "/placeholder.svg"}
                                alt={option.title}
                                fill
                                className="object-cover rounded-md"
                                onError={(e) => {
                                  e.currentTarget.onerror = null
                                  e.currentTarget.src = "/placeholder.svg"
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-white text-sm">{option.title}</h4>
                              <p className="text-xs text-gray-400">
                                {option.calories} Cal | P: {option.protein}g | C: {option.carbs}g | F: {option.fat}g
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handlePlayVideo(option.videoUrl || "/placeholder-video.mp4", option.title)
                                }
                                className="rounded-full w-8 h-8 flex items-center justify-center bg-[#FF7939] hover:bg-[#E66829] text-white"
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onMealSelect(option, "Lunch")}
                                className="rounded-full w-8 h-8 flex items-center justify-center bg-[#1E1E1E] hover:bg-[#2A2A2A] text-white"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Dinner Category */}
                  <Card className="bg-[#2A2A2A] border-none">
                    <CardHeader className="flex flex-row items-center space-x-2">
                      <Soup className="w-6 h-6 text-[#34D399]" />
                      <CardTitle>Dinner</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-400 mb-4">
                        Evening meals focused on recovery and preparation for tomorrow.
                      </p>
                      <div className="grid grid-cols-1 gap-4">
                        {mealOptions[selectedSubscription].dinner.map((option, index) => (
                          <div key={index} className="flex items-center space-x-3 bg-[#1E1E1E] p-3 rounded-lg">
                            <div className="relative w-16 h-16 flex-shrink-0">
                              <Image
                                src={option.image && option.image !== "" ? option.image : "/placeholder.svg"}
                                alt={option.title}
                                fill
                                className="object-cover rounded-md"
                                onError={(e) => {
                                  e.currentTarget.onerror = null
                                  e.currentTarget.src = "/placeholder.svg"
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-white text-sm">{option.title}</h4>
                              <p className="text-xs text-gray-400">
                                {option.calories} Cal | P: {option.protein}g | C: {option.carbs}g | F: {option.fat}g
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handlePlayVideo(option.videoUrl || "/placeholder-video.mp4", option.title)
                                }
                                className="rounded-full w-8 h-8 flex items-center justify-center bg-[#FF7939] hover:bg-[#E66829] text-white"
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onMealSelect(option, "Dinner")}
                                className="rounded-full w-8 h-8 flex items-center justify-center bg-[#1E1E1E] hover:bg-[#2A2A2A] text-white"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sweet & Snacks Category */}
                  <Card className="bg-[#2A2A2A] border-none">
                    <CardHeader className="flex flex-row items-center space-x-2">
                      <Coffee className="w-6 h-6 text-[#FFB56B]" />
                      <CardTitle>Sweet & Snacks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-400 mb-4">
                        Healthy snacks and treats to satisfy cravings and provide extra nutrition.
                      </p>
                      <div className="grid grid-cols-1 gap-4">
                        {mealOptions[selectedSubscription]["sweets & snacks"].map((option, index) => (
                          <div key={index} className="flex items-center space-x-3 bg-[#1E1E1E] p-3 rounded-lg">
                            <div className="relative w-16 h-16 flex-shrink-0">
                              <Image
                                src={option.image && option.image !== "" ? option.image : "/placeholder.svg"}
                                alt={option.title}
                                fill
                                className="object-cover rounded-md"
                                onError={(e) => {
                                  e.currentTarget.onerror = null
                                  e.currentTarget.src = "/placeholder.svg"
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-white text-sm">{option.title}</h4>
                              <p className="text-xs text-gray-400">
                                {option.calories} Cal | P: {option.protein}g | C: {option.carbs}g | F: {option.fat}g
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handlePlayVideo(option.videoUrl || "/placeholder-video.mp4", option.title)
                                }
                                className="rounded-full w-8 h-8 flex items-center justify-center bg-[#FF7939] hover:bg-[#E66829] text-white"
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onMealSelect(option, "Sweet & Snacks")}
                                className="rounded-full w-8 h-8 flex items-center justify-center bg-[#1E1E1E] hover:bg-[#2A2A2A] text-white"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  )
}
