"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dumbbell,
  Footprints,
  Heart,
  Utensils,
  X,
  TrendingUp,
  Clock,
  Flame,
  Trash,
  Plus,
  Edit,
  Bike,
  FishIcon as Swim,
  SpaceIcon as Yoga,
  Brain,
  ChevronRight,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Types
interface Goal {
  id: string
  name: string
  icon: React.ElementType
  current: number
  target: number
  unit: string
  progress: number
  color: string
  streak?: number
  category: string
  subCategory?: string
  subCategories?: {
    id: string
    name: string
    daysClean: number
    target: number
    progress: number
    streak: number
  }[]
  history?: { date: string; value: number }[]
  coachNotes?: CoachNote[]
  personalNotes?: string
  daysClean?: number
}

interface CoachNote {
  id: string
  coachId: string
  coachName: string
  coachAvatar: string
  note: string
  date: string
}

interface ActivityTag {
  id: string
  name: string
  icon: React.ElementType
  color: string
  progress: number
  target: number
  current: number
  unit: string
  lastActivity?: string
  coachNotes?: CoachNote[]
}

interface StatOverview {
  id: string
  name: string
  icon: React.ElementType
  value: number
  unit: string
  change: number
  color: string
}

interface PersonalBest {
  id: string
  name: string
  icon: React.ElementType
  value: number | string
  unit: string
  date: string
  color: string
}

// Sample data
const goals: Goal[] = [
  {
    id: "addiction-control",
    name: "Addiction Control",
    icon: Flame,
    current: 0, // Not used directly for addiction
    target: 30,
    unit: "days clean",
    progress: 65, // Average of both addictions
    color: "#EF4444", // Red
    category: "addiction",
    subCategories: [
      {
        id: "alcohol",
        name: "Alcohol",
        daysClean: 25,
        target: 30,
        progress: 83,
        streak: 25,
      },
      {
        id: "smoke",
        name: "Smoke",
        daysClean: 14,
        target: 30,
        progress: 47,
        streak: 14,
      },
    ],
    history: [
      { date: "Week 1", value: 7 },
      { date: "Week 2", value: 7 },
      { date: "Week 3", value: 3.5 },
      { date: "Week 4", value: 2 },
      { date: "Week 5", value: 0 },
      { date: "Week 6", value: 0 },
      { date: "Week 7", value: 0 },
    ],
    coachNotes: [
      {
        id: "note1",
        coachId: "coach1",
        coachName: "Mike",
        coachAvatar: "/placeholder.svg?height=40&width=40",
        note: "Great progress on alcohol control. Let's work on strategies for smoke cravings next.",
        date: "3 days ago",
      },
    ],
    personalNotes:
      "Alcohol has been easier to control than smoking. Need to find better alternatives for stress management.",
  },
  {
    id: "fitness",
    name: "Fitness",
    icon: Dumbbell,
    current: 4,
    target: 5,
    unit: "workouts/week",
    progress: 80,
    color: "#FF7939", // Orange
    streak: 3,
    category: "fitness",
    history: [
      { date: "Mon", value: 1 },
      { date: "Tue", value: 1 },
      { date: "Wed", value: 1 },
      { date: "Thu", value: 1 },
      { date: "Fri", value: 0 },
      { date: "Sat", value: 0 },
      { date: "Sun", value: 0 },
    ],
    coachNotes: [
      {
        id: "note3",
        coachId: "coach1",
        coachName: "Mike",
        coachAvatar: "/placeholder.svg?height=40&width=40",
        note: "Your consistency with strength training is showing results. Let's add one more cardio session on weekends.",
        date: "2 days ago",
      },
    ],
    personalNotes: "Morning workouts are more effective for me. Need to balance strength and cardio better.",
  },
  {
    id: "nutrition",
    name: "Nutrition",
    icon: Utensils,
    current: 140,
    target: 160,
    unit: "g protein/day",
    progress: 88,
    color: "#F59E0B", // Amber/yellow
    streak: 5,
    category: "nutrition",
    history: [
      { date: "Mon", value: 155 },
      { date: "Tue", value: 145 },
      { date: "Wed", value: 160 },
      { date: "Thu", value: 150 },
      { date: "Fri", value: 140 },
      { date: "Sat", value: 0 },
      { date: "Sun", value: 0 },
    ],
    coachNotes: [
      {
        id: "note4",
        coachId: "coach2",
        coachName: "Claudia",
        coachAvatar: "/placeholder.svg?height=40&width=40",
        note: "Your protein intake is consistent. Let's focus on adding more complex carbs after workouts for better recovery.",
        date: "4 days ago",
      },
    ],
    personalNotes: "Meal prepping on Sundays helps keep me on track. Need more variety in protein sources.",
  },
  {
    id: "sleep",
    name: "Sleep Quality",
    icon: Heart,
    current: 7,
    target: 8,
    unit: "hours/night",
    progress: 88,
    color: "#FFB56B", // Light orange
    streak: 4,
    category: "wellness",
    history: [
      { date: "Mon", value: 7.5 },
      { date: "Tue", value: 7 },
      { date: "Wed", value: 7.5 },
      { date: "Thu", value: 6.5 },
      { date: "Fri", value: 7 },
      { date: "Sat", value: 0 },
      { date: "Sun", value: 0 },
    ],
    coachNotes: [
      {
        id: "note5",
        coachId: "coach1",
        coachName: "Mike",
        coachAvatar: "/placeholder.svg?height=40&width=40",
        note: "Sleep quality has improved since reducing screen time before bed. Try to maintain the same sleep/wake times on weekends.",
        date: "3 days ago",
      },
    ],
    personalNotes: "Meditation before sleep helps me fall asleep faster. Need to keep the bedroom cooler.",
  },
]

// Sample activity tags
const activityTags: ActivityTag[] = [
  {
    id: "cycling",
    name: "Cycling",
    icon: Bike,
    color: "#FF7939", // Orange
    progress: 75,
    current: 45,
    target: 60,
    unit: "km/week",
    lastActivity: "Yesterday",
    coachNotes: [
      {
        id: "note4",
        coachId: "coach2",
        coachName: "Claudia",
        coachAvatar: "/placeholder.svg?height=40&width=40",
        note: "Your cycling endurance is improving. Try adding interval training for better cardiovascular benefits.",
        date: "2 days ago",
      },
    ],
  },
  {
    id: "swimming",
    name: "Swimming",
    icon: Swim,
    color: "#FFB56B", // Light orange
    progress: 60,
    current: 3,
    target: 5,
    unit: "sessions/week",
    lastActivity: "3 days ago",
    coachNotes: [
      {
        id: "note5",
        coachId: "coach1",
        coachName: "Mike",
        coachAvatar: "/placeholder.svg?height=40&width=40",
        note: "Your swimming technique is improving. Focus on breathing rhythm for better efficiency.",
        date: "1 week ago",
      },
    ],
  },
  {
    id: "meditation",
    name: "Meditation",
    icon: Brain,
    color: "#F59E0B", // Amber/yellow
    progress: 90,
    current: 18,
    target: 20,
    unit: "min/day",
    lastActivity: "Today",
    coachNotes: [
      {
        id: "note6",
        coachId: "coach1",
        coachName: "Mike",
        coachAvatar: "/placeholder.svg?height=40&width=40",
        note: "Your consistency with meditation is excellent. Try different techniques to deepen your practice.",
        date: "5 days ago",
      },
    ],
  },
  {
    id: "yoga",
    name: "Yoga",
    icon: Yoga,
    color: "#EF4444", // Red
    progress: 40,
    current: 2,
    target: 5,
    unit: "sessions/week",
    lastActivity: "4 days ago",
    coachNotes: [
      {
        id: "note7",
        coachId: "coach2",
        coachName: "Claudia",
        coachAvatar: "/placeholder.svg?height=40&width=40",
        note: "Your flexibility is improving. Focus on holding poses longer for better results.",
        date: "3 days ago",
      },
    ],
  },
]

const statOverviews: StatOverview[] = [
  {
    id: "workouts",
    name: "Workouts",
    icon: Dumbbell,
    value: 12,
    unit: "sessions",
    change: 20,
    color: "#FF7939", // Orange
  },
  {
    id: "meals",
    name: "Meals",
    icon: Utensils,
    value: 18,
    unit: "logged",
    change: 5,
    color: "#F59E0B", // Amber/yellow
  },
  {
    id: "active",
    name: "Active Time",
    icon: Clock,
    value: 8.5,
    unit: "hours",
    change: 15,
    color: "#FFB56B", // Light orange
  },
]

const personalBests: PersonalBest[] = [
  {
    id: "running",
    name: "Running Pace",
    icon: Footprints,
    value: "4:50",
    unit: "min/km",
    date: "Mar 15",
    color: "#FF7939", // Orange
  },
  {
    id: "bench",
    name: "Bench Press",
    icon: Dumbbell,
    value: 160,
    unit: "kg",
    date: "Feb 28",
    color: "#FFB56B", // Light orange
  },
  {
    id: "yoga",
    name: "Yoga Stretch",
    icon: TrendingUp,
    value: 80,
    unit: "%",
    date: "Apr 2",
    color: "#F59E0B", // Amber/yellow
  },
  {
    id: "calories",
    name: "Calories Burned",
    icon: Flame,
    value: 1250,
    unit: "kcal",
    date: "Mar 30",
    color: "#EF4444", // Red
  },
]

export function GoalsProgress() {
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [userGoals, setUserGoals] = useState<Goal[]>(goals)
  const [userTags, setUserTags] = useState<ActivityTag[]>(activityTags)
  const [userBests, setUserBests] = useState<PersonalBest[]>(personalBests)

  // Modal states
  const [isAddingGoal, setIsAddingGoal] = useState(false)
  const [isManagingTags, setIsManagingTags] = useState(false)
  const [isViewingAllBests, setIsViewingAllBests] = useState(false)
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [isLoggingActivity, setIsLoggingActivity] = useState<string | null>(null)

  // Form states
  const [newGoalName, setNewGoalName] = useState("")
  const [newGoalTarget, setNewGoalTarget] = useState(0)
  const [newGoalUnit, setNewGoalUnit] = useState("")
  const [newGoalCategory, setNewGoalCategory] = useState("fitness")
  const [newGoalColor, setNewGoalColor] = useState("#FF7939")
  const [newGoalSubCategory, setNewGoalSubCategory] = useState<string>("")

  // Tag form states
  const [newTagName, setNewTagName] = useState("")
  const [newTagIcon, setNewTagIcon] = useState<React.ElementType>(Dumbbell)
  const [newTagColor, setNewTagColor] = useState("#FF7939")
  const [newTagTarget, setNewTagTarget] = useState(0)
  const [newTagUnit, setNewTagUnit] = useState("")

  // Activity logging
  const [activityValue, setActivityValue] = useState(0)
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split("T")[0])

  // Add a new goal
  const addNewGoal = () => {
    if (newGoalName && newGoalTarget && newGoalUnit) {
      const newGoal: Goal = {
        id: `goal-${Date.now()}`,
        name: newGoalName,
        icon: getIconForCategory(newGoalCategory),
        current: 0,
        target: newGoalTarget,
        unit: newGoalUnit,
        progress: 0,
        color: newGoalColor,
        streak: 0,
        category: newGoalCategory,
        ...(newGoalCategory === "addiction" && {
          subCategories: [
            {
              id: "alcohol",
              name: "Alcohol",
              daysClean: 0,
              target: newGoalTarget,
              progress: 0,
              streak: 0,
            },
            {
              id: "smoke",
              name: "Smoke",
              daysClean: 0,
              target: newGoalTarget,
              progress: 0,
              streak: 0,
            },
          ],
        }),
        history: [
          { date: "Mon", value: 0 },
          { date: "Tue", value: 0 },
          { date: "Wed", value: 0 },
          { date: "Thu", value: 0 },
          { date: "Fri", value: 0 },
          { date: "Sat", value: 0 },
          { date: "Sun", value: 0 },
        ],
      }
      setUserGoals([...userGoals, newGoal])
      setIsAddingGoal(false)
      resetGoalForm()
    }
  }

  // Add a new activity tag
  const addNewTag = () => {
    if (newTagName && newTagTarget && newTagUnit) {
      const newTag: ActivityTag = {
        id: `tag-${Date.now()}`,
        name: newTagName,
        icon: newTagIcon,
        color: newTagColor,
        progress: 0,
        current: 0,
        target: newTagTarget,
        unit: newTagUnit,
        lastActivity: "Not started",
      }
      setUserTags([...userTags, newTag])
      setIsAddingTag(false)
      resetTagForm()
    }
  }

  // Log activity for a tag
  const logActivity = (tagId: string) => {
    if (activityValue > 0) {
      setUserTags(
        userTags.map((tag) => {
          if (tag.id === tagId) {
            const current = Math.min(tag.target, activityValue)
            const progress = Math.min(100, Math.round((current / tag.target) * 100))
            return {
              ...tag,
              current,
              progress,
              lastActivity: "Today",
            }
          }
          return tag
        }),
      )
      setIsLoggingActivity(null)
      setActivityValue(0)
    }
  }

  // Delete a tag
  const deleteTag = (tagId: string) => {
    setUserTags(userTags.filter((tag) => tag.id !== tagId))
  }

  // Reset form states
  const resetGoalForm = () => {
    setNewGoalName("")
    setNewGoalTarget(0)
    setNewGoalUnit("")
    setNewGoalCategory("fitness")
    setNewGoalColor("#FF7939")
    setNewGoalSubCategory("")
  }

  const resetTagForm = () => {
    setNewTagName("")
    setNewTagTarget(0)
    setNewTagUnit("")
    setNewTagIcon(Dumbbell)
    setNewTagColor("#FF7939")
  }

  // Get icon based on category
  const getIconForCategory = (category: string): React.ElementType => {
    switch (category) {
      case "addiction":
        return Flame
      case "fitness":
        return Dumbbell
      case "nutrition":
        return Utensils
      case "wellness":
        return Heart
      default:
        return TrendingUp
    }
  }

  // Get icon by name for tag creation
  const getIconByName = (iconName: string): React.ElementType => {
    switch (iconName) {
      case "bike":
        return Bike
      case "swim":
        return Swim
      case "yoga":
        return Yoga
      case "brain":
        return Brain
      case "dumbbell":
        return Dumbbell
      case "heart":
        return Heart
      case "clock":
        return Clock
      default:
        return Dumbbell
    }
  }

  // Get appropriate display value based on goal category
  const getGoalDisplayValue = (goal: Goal) => {
    if (goal.category === "addiction" && goal.daysClean !== undefined) {
      return `${goal.daysClean} ${goal.unit}`
    }
    return `${goal.current}/${goal.target} ${goal.unit}`
  }

  // Update goal progress
  const updateGoalProgress = (goalId: string, newCurrent: number) => {
    setUserGoals(
      userGoals.map((goal) => {
        if (goal.id === goalId) {
          const progress = Math.min(100, Math.round((newCurrent / goal.target) * 100))
          return { ...goal, current: newCurrent, progress }
        }
        return goal
      }),
    )
  }

  // Toggle expanded goal
  const toggleGoal = (goalId: string) => {
    setExpandedGoal(expandedGoal === goalId ? null : goalId)
  }

  // Toggle selected tag
  const toggleTag = (tagId: string) => {
    setSelectedTag(selectedTag === tagId ? null : tagId)
  }

  // Format percentage for display
  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`
  }

  // Get contrasting text color based on background
  const getContrastText = (hexColor: string) => {
    // Convert hex to RGB
    const r = Number.parseInt(hexColor.slice(1, 3), 16)
    const g = Number.parseInt(hexColor.slice(3, 5), 16)
    const b = Number.parseInt(hexColor.slice(5, 7), 16)

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

    // Return white for dark backgrounds, black for light backgrounds
    return luminance > 0.5 ? "#000000" : "#FFFFFF"
  }

  const closeAddGoalModal = () => {
    setIsAddingGoal(false)
    resetGoalForm()
  }

  return (
    <div className="space-y-6">
      {/* Goal Progress Section - Removed */}

      {/* Add Goal Modal */}
      {isAddingGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1A1A1A] rounded-xl p-5 w-80 max-w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-semibold text-white">Add New Goal</h3>
              <button className="text-gray-400 hover:text-white" onClick={closeAddGoalModal}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Goal Name</label>
                <input
                  type="text"
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  className="w-full bg-[#141414] border border-white/10 rounded-lg p-2 text-sm text-white"
                  placeholder="e.g., Weekly Runs"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Target Value</label>
                <input
                  type="number"
                  value={newGoalTarget || ""}
                  onChange={(e) => setNewGoalTarget(Number(e.target.value))}
                  className="w-full bg-[#141414] border border-white/10 rounded-lg p-2 text-sm text-white"
                  placeholder="e.g., 5"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Unit</label>
                <input
                  type="text"
                  value={newGoalUnit}
                  onChange={(e) => setNewGoalUnit(e.target.value)}
                  className="w-full bg-[#141414] border border-white/10 rounded-lg p-2 text-sm text-white"
                  placeholder="e.g., km, sessions, hours"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Category</label>
                <select
                  value={newGoalCategory}
                  onChange={(e) => setNewGoalCategory(e.target.value)}
                  className="w-full bg-[#141414] border border-white/10 rounded-lg p-2 text-sm text-white"
                >
                  <option value="addiction">Addiction Control</option>
                  <option value="fitness">Fitness</option>
                  <option value="nutrition">Nutrition</option>
                  <option value="wellness">Wellness</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {newGoalCategory === "addiction" && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Sub-Category</label>
                  <select
                    className="w-full bg-[#141414] border border-white/10 rounded-lg p-2 text-sm text-white"
                    onChange={(e) => setNewGoalSubCategory(e.target.value)}
                  >
                    <option value="alcohol">Alcohol</option>
                    <option value="smoke">Smoke</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-400 mb-1">Color</label>
                <div className="flex space-x-2">
                  {["#FF7939", "#FFB56B", "#F59E0B", "#EF4444"].map((color) => (
                    <button
                      key={color}
                      className={`w-6 h-6 rounded-full ${newGoalColor === color ? "ring-2 ring-white" : ""}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewGoalColor(color)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  className="bg-[#FF7939] text-white px-4 py-2 rounded-lg text-sm font-medium"
                  onClick={addNewGoal}
                >
                  Add Goal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tags and Stats Section */}
      <div className="grid grid-cols-3 gap-4">
        {/* Tags Section */}
        <div className="col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-white">Activity Tags</h3>
            <button
              className="w-7 h-7 rounded-full bg-[#1A1A1A] flex items-center justify-center"
              onClick={() => setIsManagingTags(true)}
            >
              <Edit className="w-3.5 h-3.5 text-[#FF7939]" />
            </button>
          </div>

          <div className="space-y-3">
            {userTags.map((tag) => (
              <div key={tag.id}>
                <motion.div
                  className="bg-[#141414] rounded-xl p-3 shadow-md border border-white/5 hover:border-white/10 transition-all cursor-pointer"
                  onClick={() => toggleTag(tag.id)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center">
                    {/* Tag Icon and Progress Circle */}
                    <div className="relative mr-3">
                      <svg className="w-10 h-10" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke={`${tag.color}20`} strokeWidth="3" />

                        <circle
                          cx="18"
                          cy="18"
                          r="15.5"
                          fill="none"
                          stroke={tag.color}
                          strokeWidth="3"
                          strokeDasharray="97.5"
                          strokeDashoffset={97.5 - (97.5 * tag.progress) / 100}
                          strokeLinecap="round"
                          transform="rotate(-90 18 18)"
                        />

                        <text
                          x="18"
                          y="18"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="white"
                          fontSize="8"
                          fontWeight="bold"
                        >
                          {formatPercentage(tag.progress)}
                        </text>
                      </svg>

                      <div
                        className="absolute top-0 left-0 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: tag.color }}
                      >
                        <tag.icon className="w-2.5 h-2.5 text-white" />
                      </div>
                    </div>

                    {/* Tag Name and Progress */}
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-white">{tag.name}</h3>
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-gray-400">
                          {tag.current}/{tag.target} {tag.unit}
                        </span>
                        <button
                          className="ml-auto text-xs text-[#FF7939]"
                          onClick={(e) => {
                            e.stopPropagation()
                            setIsLoggingActivity(tag.id)
                          }}
                        >
                          Log
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Activity Logging Modal */}
                {isLoggingActivity === tag.id && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[#1A1A1A] rounded-xl p-5 w-80 max-w-full">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base font-semibold text-white">Log {tag.name} Activity</h3>
                        <button className="text-gray-400 hover:text-white" onClick={() => setIsLoggingActivity(null)}>
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Value ({tag.unit})</label>
                          <input
                            type="number"
                            value={activityValue || ""}
                            onChange={(e) => setActivityValue(Number(e.target.value))}
                            className="w-full bg-[#141414] border border-white/10 rounded-lg p-2 text-sm text-white"
                            placeholder={`e.g., 5 ${tag.unit}`}
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Date</label>
                          <input
                            type="date"
                            value={activityDate}
                            onChange={(e) => setActivityDate(e.target.value)}
                            className="w-full bg-[#141414] border border-white/10 rounded-lg p-2 text-sm text-white"
                          />
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            className="bg-[#FF7939] text-white px-4 py-2 rounded-lg text-sm font-medium"
                            onClick={() => logActivity(tag.id)}
                          >
                            Save Activity
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Coach Notes for Tag */}
                <AnimatePresence>
                  {selectedTag === tag.id && tag.coachNotes && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-1 ml-4 pl-3 border-l-2 space-y-2"
                      style={{ borderColor: tag.color }}
                    >
                      {tag.coachNotes.map((note) => (
                        <div key={note.id} className="bg-[#1A1A1A] rounded-lg p-3 mt-2">
                          <div className="flex items-center mb-1">
                            <Avatar className="h-5 w-5 mr-2">
                              <AvatarImage src={note.coachAvatar || "/placeholder.svg"} alt={note.coachName} />
                              <AvatarFallback className="text-[10px]">{note.coachName[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium text-white">C.{note.coachName}:</span>
                            <span className="text-[10px] text-gray-400 ml-auto">{note.date}</span>
                          </div>
                          <p className="text-xs text-gray-300">{note.note}</p>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Personal Bests Section */}
        <div className="col-span-1">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-white">Personal Records</h3>
            <button
              className="w-7 h-7 rounded-full bg-[#1A1A1A] flex items-center justify-center"
              onClick={() => setIsViewingAllBests(true)}
            >
              <ChevronRight className="w-4 h-4 text-[#FF7939]" />
            </button>
          </div>

          <div className="space-y-3">
            {userBests.slice(0, 3).map((best) => (
              <motion.div
                key={best.id}
                className="bg-[#141414] rounded-xl p-3 shadow-md border border-white/5"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                    style={{ backgroundColor: `${best.color}20`, color: best.color }}
                  >
                    <best.icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium text-white">{best.name}</h3>
                      <div className="flex items-baseline">
                        <span className="text-[1.3rem] font-bold text-white">{best.value}</span>
                        <span className="text-[10px] text-gray-400 ml-1">{best.unit}</span>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <span className="text-[10px] font-medium text-gray-400">{best.date}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Manage Tags Modal */}
      {isManagingTags && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1A1A1A] rounded-xl p-5 w-[500px] max-w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-semibold text-white">Manage Activity Tags</h3>
              <button className="text-gray-400 hover:text-white" onClick={() => setIsManagingTags(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <button
                className="flex items-center justify-center w-full bg-[#141414] border border-white/10 rounded-lg p-2 text-sm text-white hover:bg-[#1A1A1A]"
                onClick={() => setIsAddingTag(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Activity Tag
              </button>

              <div className="space-y-3">
                {userTags.map((tag) => (
                  <div key={tag.id} className="bg-[#141414] rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                        style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                      >
                        <tag.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-white">{tag.name}</h4>
                        <p className="text-xs text-gray-400">
                          Target: {tag.target} {tag.unit}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-gray-400 hover:text-white">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-gray-400 hover:text-red-500" onClick={() => deleteTag(tag.id)}>
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Tag Modal */}
      {isAddingTag && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1A1A1A] rounded-xl p-5 w-80 max-w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-semibold text-white">Add New Activity Tag</h3>
              <button className="text-gray-400 hover:text-white" onClick={() => setIsAddingTag(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Activity Name</label>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="w-full bg-[#141414] border border-white/10 rounded-lg p-2 text-sm text-white"
                  placeholder="e.g., Cycling, Swimming"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Icon</label>
                <select
                  className="w-full bg-[#141414] border border-white/10 rounded-lg p-2 text-sm text-white"
                  onChange={(e) => setNewTagIcon(getIconByName(e.target.value))}
                >
                  <option value="bike">Cycling</option>
                  <option value="swim">Swimming</option>
                  <option value="yoga">Yoga</option>
                  <option value="brain">Meditation</option>
                  <option value="dumbbell">Strength</option>
                  <option value="heart">Cardio</option>
                  <option value="clock">Time-based</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Target Value</label>
                <input
                  type="number"
                  value={newTagTarget || ""}
                  onChange={(e) => setNewTagTarget(Number(e.target.value))}
                  className="w-full bg-[#141414] border border-white/10 rounded-lg p-2 text-sm text-white"
                  placeholder="e.g., 5"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Unit</label>
                <input
                  type="text"
                  value={newTagUnit}
                  onChange={(e) => setNewTagUnit(e.target.value)}
                  className="w-full bg-[#141414] border border-white/10 rounded-lg p-2 text-sm text-white"
                  placeholder="e.g., km/week, sessions/week"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Color</label>
                <div className="flex space-x-2">
                  {["#FF7939", "#FFB56B", "#F59E0B", "#EF4444", "#DC2626"].map((color) => (
                    <button
                      key={color}
                      className={`w-6 h-6 rounded-full ${newTagColor === color ? "ring-2 ring-white" : ""}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewTagColor(color)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  className="bg-[#FF7939] text-white px-4 py-2 rounded-lg text-sm font-medium"
                  onClick={addNewTag}
                >
                  Add Activity
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View All Personal Bests Modal */}
      {isViewingAllBests && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1A1A1A] rounded-xl p-5 w-[500px] max-w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-semibold text-white">All Personal Bests</h3>
              <button className="text-gray-400 hover:text-white" onClick={() => setIsViewingAllBests(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {userBests.map((best) => (
                <div key={best.id} className="bg-[#141414] rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                      style={{ backgroundColor: `${best.color}20`, color: best.color }}
                    >
                      <best.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium text-white">{best.name}</h4>
                        <div className="flex items-baseline">
                          <span className="text-[1.3rem] font-bold text-white">{best.value}</span>
                          <span className="text-[10px] text-gray-400 ml-1">{best.unit}</span>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <span className="text-[10px] text-gray-500">Achieved: {best.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
