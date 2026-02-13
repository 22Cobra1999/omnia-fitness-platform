import type React from "react"
import {
    Dumbbell,
    Footprints,
    Heart,
    Utensils,
    TrendingUp,
    Clock,
    Flame,
    Bike,
    FishIcon as Swim,
    SpaceIcon as Yoga,
    Brain,
} from "lucide-react"

export interface CoachNote {
    id: string
    coachId: string
    coachName: string
    coachAvatar: string
    note: string
    date: string
}

export interface Goal {
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
    history: { date: string; value: number }[]
    coachNotes?: CoachNote[]
    personalNotes?: string
    daysClean?: number
}

export interface ActivityTag {
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

export interface StatOverview {
    id: string
    name: string
    icon: React.ElementType
    value: number | string
    unit: string
    change: number
    color: string
}

export interface PersonalBest {
    id: string
    name: string
    icon: React.ElementType
    value: number | string
    unit: string
    date: string
    color: string
}

export const goals: Goal[] = [
    {
        id: "addiction-control",
        name: "Addiction Control",
        icon: Flame,
        current: 0,
        target: 30,
        unit: "days clean",
        progress: 65,
        color: "#EF4444",
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
        color: "#FF7939",
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
        color: "#F59E0B",
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
        color: "#FFB56B",
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

export const activityTags: ActivityTag[] = [
    {
        id: "cycling",
        name: "Cycling",
        icon: Bike,
        color: "#FF7939",
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
        color: "#FFB56B",
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
        color: "#F59E0B",
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
        color: "#EF4444",
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

export const statOverviews: StatOverview[] = [
    {
        id: "workouts",
        name: "Workouts",
        icon: Dumbbell,
        value: 12,
        unit: "sessions",
        change: 20,
        color: "#FF7939",
    },
    {
        id: "meals",
        name: "Meals",
        icon: Utensils,
        value: 18,
        unit: "logged",
        change: 5,
        color: "#F59E0B",
    },
    {
        id: "active",
        name: "Active Time",
        icon: Clock,
        value: 8.5,
        unit: "hours",
        change: 15,
        color: "#FFB56B",
    },
]

export const personalBests: PersonalBest[] = [
    {
        id: "running",
        name: "Running Pace",
        icon: Footprints,
        value: "4:50",
        unit: "min/km",
        date: "Mar 15",
        color: "#FF7939",
    },
    {
        id: "bench",
        name: "Bench Press",
        icon: Dumbbell,
        value: 160,
        unit: "kg",
        date: "Feb 28",
        color: "#FFB56B",
    },
    {
        id: "yoga",
        name: "Yoga Stretch",
        icon: TrendingUp,
        value: 80,
        unit: "%",
        date: "Apr 2",
        color: "#F59E0B",
    },
    {
        id: "calories",
        name: "Calories Burned",
        icon: Flame,
        value: 1250,
        unit: "kcal",
        date: "Mar 30",
        color: "#EF4444",
    },
]
