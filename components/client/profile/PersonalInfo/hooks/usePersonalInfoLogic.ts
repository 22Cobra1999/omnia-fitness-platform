import { useState, useEffect } from "react"
import { format } from "date-fns"
import { createClient } from '@/lib/supabase/supabase-client'
import { useLocalStorage } from "@/hooks/shared/use-local-storage"
import { PersonalInfoState, Restriction, NutritionJourneyItem } from "../types"

export function usePersonalInfoLogic() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [activeTab, setActiveTab] = useState("basic")
    const [personalInfo, setPersonalInfo] = useState<PersonalInfoState>({
        basic: {
            birthDate: "",
            weight: "",
            height: "",
            gender: "",
        },
        goals: {
            objectives: "",
            estimatedTime: "",
            fatPercentage: "",
            musclePercentage: "",
        },
        sports: [],
        restrictions: [],
        profile: {},
    })

    const [currentRestriction, setCurrentRestriction] = useState<Restriction>({
        category: "",
        type: "",
        specification: "",
    })
    const [restrictionStep, setRestrictionStep] = useState(0)

    // Fetch Profile Data
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                const user = session?.user
                if (!user) return

                const { data: client, error } = await supabase
                    .from('clients')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (client) {
                    setPersonalInfo({
                        basic: {
                            birthDate: client.birth_date ? client.birth_date.split('T')[0] : "",
                            weight: client.weight ? client.weight.toString() : "",
                            height: client.Height ? client.Height.toString() : "",
                            gender: client.Genre || "",
                        },
                        goals: {
                            objectives: (client.fitness_goals || []).join(', '),
                            estimatedTime: "", // Not persisted in clients table
                            fatPercentage: "",
                            musclePercentage: "",
                        },
                        sports: client.sports || [],
                        restrictions: [], // Not persisted yet
                        profile: {
                            bio: client.description || "",
                            location: client.location || "",
                            profession: "",
                            interests: "",
                        }
                    })
                }
            } catch (error) {
                console.error("Error fetching profile:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchProfile()
    }, [])

    const handleBasicChange = (field: string, value: string) => {
        setPersonalInfo(prev => ({ ...prev, basic: { ...prev.basic, [field]: value } }))
    }

    const handleGoalsChange = (field: string, value: string) => {
        setPersonalInfo(prev => ({ ...prev, goals: { ...prev.goals, [field]: value } }))
    }

    const handleRestrictionChange = (field: string, value: string) => {
        setCurrentRestriction(prev => ({ ...prev, [field]: value }))
    }

    const handleSportsChange = (sport: string) => {
        setPersonalInfo(prev => {
            let newSports = [...(prev.sports || [])]
            if (newSports.includes(sport)) {
                newSports = newSports.filter(s => s !== sport)
            } else {
                newSports.push(sport)
            }
            return { ...prev, sports: newSports }
        })
    }

    const handleAddRestriction = () => {
        setPersonalInfo(prev => ({
            ...prev,
            restrictions: [...prev.restrictions, currentRestriction],
        }))
        setCurrentRestriction({ category: "", type: "", specification: "" })
        setRestrictionStep(0)
    }

    const handleRemoveRestriction = (index: number) => {
        setPersonalInfo(prev => {
            const newRestrictions = [...prev.restrictions]
            newRestrictions.splice(index, 1)
            return { ...prev, restrictions: newRestrictions }
        })
    }

    const handleProfileChange = (field: string, value: string) => {
        setPersonalInfo(prev => ({
            ...prev,
            profile: { ...prev.profile, [field]: value }
        }))
    }

    const handleSave = async () => {
        setIsEditing(false)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const user = session?.user
            if (!user) return

            const updates = {
                birth_date: personalInfo.basic.birthDate || null,
                weight: personalInfo.basic.weight ? parseFloat(personalInfo.basic.weight) : null,
                Height: personalInfo.basic.height ? parseFloat(personalInfo.basic.height) : null,
                Genre: personalInfo.basic.gender,
                fitness_goals: personalInfo.goals.objectives.split(', ').filter(Boolean),
                sports: personalInfo.sports,
                description: personalInfo.profile.bio,
                location: personalInfo.profile.location,
                updated_at: new Date().toISOString(),
            }

            const { error } = await supabase.from('clients').update(updates).eq('id', user.id)

            if (error) throw error
            console.log("Profile updated successfully")
        } catch (error) {
            console.error("Error saving profile:", error)
        }
    }

    const [nutritionJourney, setNutritionJourney] = useLocalStorage<Record<string, NutritionJourneyItem[]>>(
        "nutritionJourney",
        {},
    )

    const addNutritionItem = (item: NutritionJourneyItem) => {
        const currentDate = format(new Date(), "yyyy-MM-dd")
        setNutritionJourney((prev: Record<string, NutritionJourneyItem[]>) => ({
            ...prev,
            [currentDate]: [...(prev[currentDate] || []), item],
        }))
    }

    const removeNutritionItem = (index: number) => {
        const currentDate = format(new Date(), "yyyy-MM-dd")
        setNutritionJourney((prev: Record<string, NutritionJourneyItem[]>) => ({
            ...prev,
            [currentDate]: (prev[currentDate] || []).filter((_: any, i: number) => i !== index),
        }))
    }

    return {
        loading,
        isEditing,
        setIsEditing,
        activeTab,
        setActiveTab,
        personalInfo,
        setPersonalInfo,
        currentRestriction,
        restrictionStep,
        setRestrictionStep,
        handleBasicChange,
        handleGoalsChange,
        handleRestrictionChange,
        handleSportsChange,
        handleAddRestriction,
        handleRemoveRestriction,
        handleProfileChange,
        handleSave,
        nutritionJourney,
        addNutritionItem,
        removeNutritionItem,
    }
}
