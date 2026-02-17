import { useState } from 'react'
import { useLocalStorage } from '@/hooks/shared/use-local-storage'

export type Restriction = {
    category: string
    type: string
    specification: string
}

export type Goal = {
    id: string
    text: string
    color?: string
    trainingFrequency?: string
    changeTimeline?: string
}

export type ProfileInfo = {
    bio?: string
    location?: string
    profession?: string
    interests?: string
}

export type BasicInfo = {
    name: string
    age: string
    weight: string
    height: string
    gender: string
    level: string
}

export type PersonalInfo = {
    basic: BasicInfo
    goals: Goal[]
    restrictions: Restriction[]
    profile: ProfileInfo
}

export function useClientProfile() {
    const [personalInfo, setPersonalInfo] = useLocalStorage<PersonalInfo>("personalInfo", {
        basic: {
            name: "Andrew",
            age: "21",
            weight: "64",
            height: "172",
            gender: "male",
            level: "Beginner",
        },
        goals: [
            { id: "1", text: "Lose weight", color: "#4ADE80" },
            { id: "2", text: "Improve running", color: "#86EFAC" },
            { id: "3", text: "Quit smoking", color: "#FF8C00" },
        ],
        restrictions: [],
        profile: {},
    })

    const [isEditing, setIsEditing] = useState(false)
    const [activeTab, setActiveTab] = useState("restrictions")
    const [currentRestriction, setCurrentRestriction] = useState<Restriction>({
        category: "",
        type: "",
        specification: "",
    })
    const [restrictionStep, setRestrictionStep] = useState(0)
    const [newGoalText, setNewGoalText] = useState("")
    const [editingGoalId, setEditingGoalId] = useState<string | null>(null)
    const [editingGoalText, setEditingGoalText] = useState("")

    // -- Handlers --

    const handleBasicChange = (field: string, value: string) => {
        setPersonalInfo({ ...personalInfo, basic: { ...personalInfo.basic, [field]: value } })
    }

    const handleProfileChange = (field: string, value: string) => {
        setPersonalInfo({
            ...personalInfo,
            profile: { ...personalInfo.profile, [field]: value },
        })
    }

    // Restrictions
    const handleRestrictionChange = (field: string, value: string) => {
        setCurrentRestriction({ ...currentRestriction, [field]: value })
    }

    const handleAddRestriction = () => {
        setPersonalInfo({
            ...personalInfo,
            restrictions: [...personalInfo.restrictions, currentRestriction],
        })
        setCurrentRestriction({ category: "", type: "", specification: "" })
        setRestrictionStep(0)
    }

    const handleRemoveRestriction = (index: number) => {
        const newRestrictions = [...personalInfo.restrictions]
        newRestrictions.splice(index, 1)
        setPersonalInfo({ ...personalInfo, restrictions: newRestrictions })
    }

    // Goals
    const getRandomColor = () => {
        const colors = ["#4ADE80", "#86EFAC", "#FF8C00", "#60A5FA", "#FF6B35", "#FBBF24"]
        return colors[Math.floor(Math.random() * colors.length)]
    }

    const handleAddGoal = () => {
        if (newGoalText.trim()) {
            const newGoal: Goal = {
                id: Date.now().toString(),
                text: newGoalText.trim(),
                color: getRandomColor(),
            }
            setPersonalInfo({
                ...personalInfo,
                goals: [...personalInfo.goals, newGoal],
            })
            setNewGoalText("")
        }
    }

    const handleEditGoal = (id: string) => {
        const goal = personalInfo.goals.find((g) => g.id === id)
        if (goal) {
            setEditingGoalId(id)
            setEditingGoalText(goal.text)
        }
    }

    const handleSaveGoalEdit = () => {
        if (editingGoalId && editingGoalText.trim()) {
            setPersonalInfo({
                ...personalInfo,
                goals: personalInfo.goals.map((g) => (g.id === editingGoalId ? { ...g, text: editingGoalText.trim() } : g)),
            })
            setEditingGoalId(null)
            setEditingGoalText("")
        }
    }

    const handleDeleteGoal = (id: string) => {
        setPersonalInfo({
            ...personalInfo,
            goals: personalInfo.goals.filter((g) => g.id !== id),
        })
    }

    const handleSave = () => {
        setIsEditing(false)
    }

    const toggleEditing = () => setIsEditing(!isEditing)

    return {
        state: {
            personalInfo,
            isEditing,
            activeTab,
            currentRestriction,
            restrictionStep,
            newGoalText,
            editingGoalId,
            editingGoalText,
        },
        actions: {
            updateBasicInfo: handleBasicChange,
            updateProfileInfo: handleProfileChange,
            toggleEditing,
            saveChanges: handleSave,
            setActiveTab,
            restrictions: {
                updateDraft: handleRestrictionChange,
                add: handleAddRestriction,
                remove: handleRemoveRestriction,
                setStep: setRestrictionStep,
                resetDraft: () => setCurrentRestriction({ category: "", type: "", specification: "" }),
            },
            goals: {
                setNewText: setNewGoalText,
                add: handleAddGoal,
                startEdit: handleEditGoal,
                saveEdit: handleSaveGoalEdit,
                cancelEdit: () => { setEditingGoalId(null); setEditingGoalText(""); },
                setEditText: setEditingGoalText,
                delete: handleDeleteGoal,
            }
        }
    }
}
