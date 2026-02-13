import { useState, useCallback } from "react"
import {
    goals as initialGoals,
    activityTags as initialActivityTags,
    personalBests as initialPersonalBests,
    type Goal,
    type ActivityTag,
    type PersonalBest,
} from "./goals-progress-data"
import { Flame, Dumbbell, Utensils, Heart, TrendingUp, Bike, FishIcon as Swim, SpaceIcon as Yoga, Brain, Clock } from "lucide-react"

export function useGoalsProgress() {
    const [expandedGoal, setExpandedGoal] = useState<string | null>(null)
    const [selectedTag, setSelectedTag] = useState<string | null>(null)
    const [userGoals, setUserGoals] = useState<Goal[]>(initialGoals)
    const [userTags, setUserTags] = useState<ActivityTag[]>(initialActivityTags)
    const [userBests, setUserBests] = useState<PersonalBest[]>(initialPersonalBests)

    const [isAddingGoal, setIsAddingGoal] = useState(false)
    const [isManagingTags, setIsManagingTags] = useState(false)
    const [isViewingAllBests, setIsViewingAllBests] = useState(false)
    const [isAddingTag, setIsAddingTag] = useState(false)
    const [isLoggingActivity, setIsLoggingActivity] = useState<string | null>(null)

    const [newGoalName, setNewGoalName] = useState("")
    const [newGoalTarget, setNewGoalTarget] = useState(0)
    const [newGoalUnit, setNewGoalUnit] = useState("")
    const [newGoalCategory, setNewGoalCategory] = useState("fitness")
    const [newGoalColor, setNewGoalColor] = useState("#FF7939")
    const [newGoalSubCategory, setNewGoalSubCategory] = useState<string>("")

    const [newTagName, setNewTagName] = useState("")
    const [newTagIcon, setNewTagIcon] = useState<any>(Dumbbell)
    const [newTagColor, setNewTagColor] = useState("#FF7939")
    const [newTagTarget, setNewTagTarget] = useState(0)
    const [newTagUnit, setNewTagUnit] = useState("")

    const [activityValue, setActivityValue] = useState(0)
    const [activityDate, setActivityDate] = useState(new Date().toISOString().split("T")[0])

    const getIconForCategory = (category: string) => {
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

    const resetGoalForm = useCallback(() => {
        setNewGoalName("")
        setNewGoalTarget(0)
        setNewGoalUnit("")
        setNewGoalCategory("fitness")
        setNewGoalColor("#FF7939")
        setNewGoalSubCategory("")
    }, [])

    const resetTagForm = useCallback(() => {
        setNewTagName("")
        setNewTagTarget(0)
        setNewTagUnit("")
        setNewTagIcon(Dumbbell)
        setNewTagColor("#FF7939")
    }, [])

    const addNewGoal = useCallback(() => {
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
                        { id: "alcohol", name: "Alcohol", daysClean: 0, target: newGoalTarget, progress: 0, streak: 0 },
                        { id: "smoke", name: "Smoke", daysClean: 0, target: newGoalTarget, progress: 0, streak: 0 },
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
            setUserGoals((prev) => [...prev, newGoal])
            setIsAddingGoal(false)
            resetGoalForm()
        }
    }, [newGoalName, newGoalTarget, newGoalUnit, newGoalCategory, newGoalColor, resetGoalForm])

    const addNewTag = useCallback(() => {
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
            setUserTags((prev) => [...prev, newTag])
            setIsAddingTag(false)
            resetTagForm()
        }
    }, [newTagName, newTagTarget, newTagUnit, newTagIcon, newTagColor, resetTagForm])

    const logActivity = useCallback((tagId: string) => {
        if (activityValue > 0) {
            setUserTags((prev) =>
                prev.map((tag) => {
                    if (tag.id === tagId) {
                        const current = Math.min(tag.target, activityValue)
                        const progress = Math.min(100, Math.round((current / tag.target) * 100))
                        return { ...tag, current, progress, lastActivity: "Today" }
                    }
                    return tag
                })
            )
            setIsLoggingActivity(null)
            setActivityValue(0)
        }
    }, [activityValue])

    const deleteTag = useCallback((tagId: string) => {
        setUserTags((prev) => prev.filter((tag) => tag.id !== tagId))
    }, [])

    const updateGoalProgress = useCallback((goalId: string, newCurrent: number) => {
        setUserGoals((prev) =>
            prev.map((goal) => {
                if (goal.id === goalId) {
                    const progress = Math.min(100, Math.round((newCurrent / goal.target) * 100))
                    return { ...goal, current: newCurrent, progress }
                }
                return goal
            })
        )
    }, [])

    const toggleGoal = useCallback((goalId: string) => {
        setExpandedGoal((prev) => (prev === goalId ? null : goalId))
    }, [])

    const toggleTag = useCallback((tagId: string) => {
        setSelectedTag((prev) => (prev === tagId ? null : tagId))
    }, [])

    return {
        state: {
            expandedGoal,
            selectedTag,
            userGoals,
            userTags,
            userBests,
            isAddingGoal,
            isManagingTags,
            isViewingAllBests,
            isAddingTag,
            isLoggingActivity,
            newGoalName,
            newGoalTarget,
            newGoalUnit,
            newGoalCategory,
            newGoalColor,
            newGoalSubCategory,
            newTagName,
            newTagIcon,
            newTagColor,
            newTagTarget,
            newTagUnit,
            activityValue,
            activityDate,
        },
        actions: {
            setExpandedGoal,
            setSelectedTag,
            setIsAddingGoal,
            setIsManagingTags,
            setIsViewingAllBests,
            setIsAddingTag,
            setIsLoggingActivity,
            setNewGoalName,
            setNewGoalTarget,
            setNewGoalUnit,
            setNewGoalCategory,
            setNewGoalColor,
            setNewGoalSubCategory,
            setNewTagName,
            setNewTagIcon,
            setNewTagColor,
            setNewTagTarget,
            setNewTagUnit,
            setActivityValue,
            setActivityDate,
            addNewGoal,
            addNewTag,
            logActivity,
            deleteTag,
            updateGoalProgress,
            toggleGoal,
            toggleTag,
            resetGoalForm,
            resetTagForm,
        },
    }
}
