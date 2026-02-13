import { Heart, ActivitySquare, Dumbbell, Zap } from "lucide-react"

export interface VideoFile {
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

export interface FolderData {
    id: string
    title: string
    files: VideoFile[]
}

export interface MealOption {
    title: string
    calories: number
    protein: number
    carbs: number
    fat: number
}

export const performanceData = [
    { month: "Jan", value: 65, trend: 62 },
    { month: "Feb", value: 85, trend: 80 },
    { month: "Mar", value: 72, trend: 75 },
    { month: "Apr", value: 92, trend: 88 },
    { month: "May", value: 78, trend: 82 },
    { month: "Jun", value: 95, trend: 90 },
]

export const chartData = {
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

export const workoutSections = [
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

export const shoppingList = {
    fruits: ["Bananas", "Apples", "Oranges"],
    vegetables: ["Spinach", "Broccoli", "Carrots"],
    protein: ["Chicken breast", "Salmon", "Eggs"],
    grains: ["Brown rice", "Quinoa", "Oats"],
}

export const subscribedCoaches = [
    { name: "Coach A", specialty: "Weight Loss", phone: "+15551234567" },
    { name: "Coach B", specialty: "Strength Training", phone: "+15559876543" },
]

export const initialCategorySuggestions = [
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

export const fitnessCategoriesData = [
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
]
