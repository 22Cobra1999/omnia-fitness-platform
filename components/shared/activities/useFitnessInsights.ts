import { useState, useEffect, useCallback } from "react"
import { format, addDays, subDays, addWeeks, subWeeks, startOfWeek, endOfWeek } from "date-fns"
import type { VideoFile, FolderData, MealOption } from "./fitness-insights-data"
import { workoutSections, initialCategorySuggestions } from "./fitness-insights-data"

export function useFitnessInsights() {
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
        "Pull", "Push", "Abs & Core", "Cardio", "Mindfulness", "Yoga", "Stretching",
        "Running", "Cycling", "Swimming", "HIIT", "Pilates", "Weightlifting",
        "CrossFit", "Boxing", "Martial Arts", "Dance", "Rowing", "Climbing",
        "Functional Training"
    ])
    const [newExercise, setNewExercise] = useState<Partial<VideoFile>>({})
    const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState("")
    const [isPlayingJourney, setIsPlayingJourney] = useState(false)

    const formatRepsXSeries = (value: string) => {
        const [reps, series] = (value || "").split("x").map((v) => v?.trim() || "0")
        const formattedReps = reps.replace(/\D/g, "") || "0"
        const formattedSeries = series.replace(/\D/g, "") || "0"
        return `${formattedReps} x ${formattedSeries}`.trim()
    }

    const handlePlayVideo = (url: string, title: string) => {
        if (url && url !== "") {
            const index = myJourneyVideos.findIndex((video) => video.videoUrl === url)
            setCurrentVideoIndex(index)
            setIsPlaying(true)
            setSelectedVideo({ url, title })

            setTimeout(() => {
                const videoPlayer = document.querySelector(".aspect-video")
                if (videoPlayer) {
                    const rect = videoPlayer.getBoundingClientRect()
                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
                    const centerPosition = rect.top + scrollTop - (window.innerHeight - rect.height) / 2
                    window.scrollTo({ top: centerPosition, behavior: "smooth" })
                }
            }, 100)
        }
    }

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

    const togglePlay = () => setIsPlaying(!isPlaying)
    const toggleMute = () => setIsMuted(!isMuted)

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = Number.parseFloat(e.target.value)
        setVolume(newVolume)
        if (newVolume > 0) setIsMuted(false)
    }

    const handleDeleteVideo = (folderId: string, videoId: string) => {
        const updateFolders = (prevFolders: FolderData[]) =>
            prevFolders.map((folder) =>
                folder.id === folderId ? { ...folder, files: folder.files.filter((file) => file.id !== videoId) } : folder
            )
        setFitnessFolders(updateFolders)
        const updated = updateFolders(fitnessFolders)
        localStorage.setItem("fitnessFolders", JSON.stringify(updated))
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

        if (savedFitnessFolders) setFitnessFolders(JSON.parse(savedFitnessFolders))
        if (savedNutritionFolders) {
            const parsedFolders = JSON.parse(savedNutritionFolders)
            const filteredFolders = parsedFolders.filter(
                (folder: FolderData) => folder.title !== "Healthy Recipes" && folder.title !== "Meal Plans"
            )
            setNutritionFolders(filteredFolders)
            localStorage.setItem("nutritionFolders", JSON.stringify(filteredFolders))
        }
        if (savedJourneyVideos) setMyJourneyVideos(JSON.parse(savedJourneyVideos))
    }, [])

    const incrementWater = () => setWaterIntake(Math.min(waterIntake + 1, 8))
    const decrementWater = () => setWaterIntake(Math.max(waterIntake - 1, 0))

    const goToPreviousDay = () => setSelectedDate(subDays(selectedDate, 1))
    const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1))
    const goToPreviousWeek = () => setSelectedWeek(subWeeks(selectedWeek, 1))
    const goToNextWeek = () => setSelectedWeek(addWeeks(selectedWeek, 1))

    const addExerciseToJourney = (exercise: VideoFile) => {
        const newItem = {
            ...exercise,
            id: crypto.randomUUID(),
            time: format(new Date(), "HH:mm"),
            duration: exercise.duration || "0",
            repsXSeries: exercise.repsXSeries || "0 x 0",
            calories: exercise.calories || 0,
            note: "",
        }
        setMyJourneyVideos((prev) => {
            const updated = [...prev, newItem]
            localStorage.setItem("fitnessJourneyVideos", JSON.stringify(updated))
            return updated
        })
    }

    const updateExercise = (id: string, field: keyof VideoFile, value: string | number) => {
        setMyJourneyVideos((prev) => {
            const updated = prev.map((video) =>
                video.id === id ? { ...video, [field]: value } : video
            )
            localStorage.setItem("fitnessJourneyVideos", JSON.stringify(updated))
            return updated
        })
    }

    const addMealToJourney = () => {
        if (selectedMealForJourney && mealTime) {
            const newItem: VideoFile = {
                id: crypto.randomUUID(),
                time: mealTime,
                title: selectedMealForJourney.title,
                category: "Meal",
                duration: "N/A",
                repsXSeries: "N/A",
                calories: selectedMealForJourney.calories,
                note: "",
            }
            setMyJourneyVideos((prev) => {
                const updated = [...prev, newItem]
                localStorage.setItem("fitnessJourneyVideos", JSON.stringify(updated))
                return updated
            })
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
            setFitnessFolders((prev) => {
                const updated = [...prev, newFolder]
                localStorage.setItem("fitnessFolders", JSON.stringify(updated))
                return updated
            })
            setIsAddFolderDialogOpen(false)
            setNewFolderTitle("")
        }
    }

    const updateFolderTitle = () => {
        if (editingFolder) {
            setFitnessFolders((prev) => {
                const updated = prev.map((f) => (f.id === editingFolder.id ? editingFolder : f))
                localStorage.setItem("fitnessFolders", JSON.stringify(updated))
                return updated
            })
            setEditingFolder(null)
        }
    }

    const deleteFolder = (id: string) => {
        setFitnessFolders((prev) => {
            const updated = prev.filter((f) => f.id !== id)
            localStorage.setItem("fitnessFolders", JSON.stringify(updated))
            return updated
        })
    }

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
            }, 1000)
            return () => clearTimeout(timer)
        }
    }, [currentVideoIndex, isPlayingJourney, myJourneyVideos.length])

    return {
        state: {
            currentVideoIndex, isPlaying, volume, isMuted, selectedPeriod, hoveredAction,
            isShoppingListVisible, openDialog, waterIntake, selectedMeals, nutrientTotals,
            selectedDate, eatenMeals, isMealsCollapsed, mealsEatenToday, myJourneyVideos,
            editingTitle, mealTime, selectedMealForJourney, isTimeModalOpen, selectedWeek,
            selectedWorkouts, activityTotals, fitnessFolders, isAddFolderDialogOpen,
            newFolderTitle, editingFolder, selectedCategory, nutritionFolders, selectedVideo,
            categorySuggestions, categoryInput, addedVideos, availableCategories, newExercise,
            isAddCategoryDialogOpen, newCategoryName
        },
        actions: {
            setCurrentVideoIndex, setIsPlaying, setVolume, setIsMuted, setSelectedPeriod,
            setHoveredAction, setIsShoppingListVisible, setOpenDialog, setWaterIntake,
            setSelectedMeals, setNutrientTotals, setSelectedDate, setEatenMeals,
            setIsMealsCollapsed, setMealsEatenToday, setMyJourneyVideos, setEditingTitle,
            setMealTime, setSelectedMealForJourney, setIsTimeModalOpen, setSelectedWeek,
            setSelectedWorkouts, setFitnessFolders, setIsAddFolderDialogOpen, setNewFolderTitle,
            setEditingFolder, setSelectedCategory, setNutritionFolders, setSelectedVideo,
            setCategorySuggestions, setCategoryInput, setAddedVideos, setAvailableCategories,
            setNewExercise, setIsAddCategoryDialogOpen, setNewCategoryName,
            handlePlayVideo, handleNextVideo, handlePreviousVideo, togglePlay, toggleMute,
            handleVolumeChange, handleDeleteVideo, incrementWater, decrementWater,
            goToPreviousDay, goToNextDay, goToPreviousWeek, goToNextWeek,
            addExerciseToJourney, updateExercise, addMealToJourney, addNewFolder,
            updateFolderTitle, deleteFolder, playMyJourney, formatRepsXSeries
        }
    }
}
