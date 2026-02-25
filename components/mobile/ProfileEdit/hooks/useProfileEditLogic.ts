import { useState, useEffect, useCallback } from 'react'
import { useProfileManagement } from '@/hooks/client/use-profile-management'
import { useToast } from "@/components/ui/use-toast"
import { ProfileData, ProfileEditErrors } from '../types'

export function useProfileEditLogic(isOpen: boolean, onClose: () => void) {
    const { profile, updateProfile, loading, loadProfile } = useProfileManagement()
    const { toast } = useToast()

    const [profileData, setProfileData] = useState<ProfileData>({
        full_name: "",
        email: "",
        phone: "",
        location: "",
        emergency_contact: "",
        birth_date: "",
        weight: "",
        height: "",
        gender: "",
        level: "Principiante"
    })

    const [goals, setGoals] = useState<string[]>([])
    const [sports, setSports] = useState<string[]>([])
    const [profileImage, setProfileImage] = useState<File | null>(null)
    const [previewImage, setPreviewImage] = useState<string | null>(null)
    const [initialData, setInitialData] = useState<any>(null)
    const [showDiscardConfirmation, setShowDiscardConfirmation] = useState(false)
    const [errors, setErrors] = useState<ProfileEditErrors>({
        weight: false,
        height: false,
        emergency_contact: false,
    })

    const [isGoalsPopoverOpen, setIsGoalsPopoverOpen] = useState(false)
    const [isSportsPopoverOpen, setIsSportsPopoverOpen] = useState(false)

    useEffect(() => {
        if (isOpen) {
            loadProfile(false)
        }
    }, [isOpen, loadProfile])

    useEffect(() => {
        if (profile) {
            let formattedBirthDate = ""
            if (profile.birth_date) {
                const date = new Date(profile.birth_date)
                if (!isNaN(date.getTime())) {
                    formattedBirthDate = date.toISOString().split('T')[0]
                }
            }

            const normalizedGender =
                profile.gender === 'M' || profile.gender === 'F' || profile.gender === 'O'
                    ? profile.gender
                    : ""

            const data: ProfileData = {
                full_name: profile.full_name || "",
                email: profile.email || "",
                phone: profile.phone || "",
                location: profile.location || "",
                emergency_contact: profile.emergency_contact || "",
                birth_date: formattedBirthDate,
                weight: profile.weight?.toString() || "",
                height: profile.height?.toString() || "",
                gender: normalizedGender,
                level: profile.level || "Principiante",
                // Coach fields
                specialization: (profile as any).specialization || "",
                experience_years: (profile as any).experience_years?.toString() || "",
                certifications: (profile as any).certifications || [],
                whatsapp: (profile as any).whatsapp?.toString() || "",
                instagram_username: (profile as any).instagram_username || "",
                bio: (profile as any).bio || "",
                cafe: (profile as any).cafe?.toString() || "",
                cafe_enabled: (profile as any).cafe_enabled || false,
                meet_1: (profile as any).meet_1?.toString() || "",
                meet_30: (profile as any).meet_30?.toString() || "",
                meet_1_enabled: (profile as any).meet_1_enabled || false,
                meet_30_enabled: (profile as any).meet_30_enabled || false,
                category: (profile as any).category || "general"
            }
            setProfileData(data)
            setPreviewImage(profile.avatar_url || null)

            const profileGoals = (profile as any).fitness_goals || []
            const profileSports = (profile as any).sports || []

            setGoals(profileGoals)
            setSports(profileSports)

            setInitialData({
                ...data,
                goals: profileGoals,
                sports: profileSports
            })
        }
    }, [profile])

    const handleImageChange = (file: File) => {
        setProfileImage(file)
        const reader = new FileReader()
        reader.onload = (e) => {
            setPreviewImage(e.target?.result as string)
        }
        reader.readAsDataURL(file)
    }

    const handleToggleGoal = (goal: string) => {
        setGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal])
    }

    const handleToggleSport = (sport: string) => {
        setSports(prev => prev.includes(sport) ? prev.filter(s => s !== sport) : [...prev, sport])
    }

    const hasChanges = useCallback(() => {
        if (!initialData) return false

        const fields: (keyof ProfileData)[] = [
            'full_name', 'email', 'phone', 'location', 'emergency_contact',
            'birth_date', 'weight', 'height', 'gender', 'level',
            'specialization', 'experience_years', 'whatsapp', 'instagram_username',
            'bio', 'cafe', 'cafe_enabled', 'meet_1', 'meet_30',
            'meet_1_enabled', 'meet_30_enabled', 'category'
        ]
        for (const field of fields) {
            if (profileData[field] !== initialData[field]) return true
        }

        if (goals.length !== initialData.goals.length) return true
        if (sports.length !== initialData.sports.length) return true
        if (goals.some(g => !initialData.goals.includes(g))) return true
        if (sports.some(s => !initialData.sports.includes(s))) return true
        if (profileImage) return true

        return false
    }, [profileData, goals, sports, profileImage, initialData])

    const handleCloseAttempt = () => {
        if (hasChanges()) {
            setShowDiscardConfirmation(true)
        } else {
            onClose()
        }
    }

    const handleSaveProfile = async () => {
        try {
            const newErrors = {
                weight: false,
                height: false,
                emergency_contact: false,
            }

            const weightNumber = profileData.weight !== "" ? Number(profileData.weight) : NaN
            const heightNumber = profileData.height !== "" ? Number(profileData.height) : NaN
            const emergencyDigits = (profileData.emergency_contact || "").replace(/\D/g, "")

            if (Number.isNaN(weightNumber) || weightNumber <= 0) newErrors.weight = true
            if (Number.isNaN(heightNumber) || heightNumber <= 0) newErrors.height = true
            if (emergencyDigits.length < 7) newErrors.emergency_contact = true

            if (newErrors.weight || newErrors.height || newErrors.emergency_contact) {
                setErrors(newErrors)
                toast({ title: "Datos inválidos", description: "Revisa los campos marcados en rojo.", variant: "destructive" })
                return
            }

            const payload = {
                ...profileData,
                weight: profileData.weight ? Number(profileData.weight) : 0,
                height: profileData.height ? Number(profileData.height) : 0,
                fitness_goals: goals,
                sports: sports,
                // Coach numeric fields
                experience_years: profileData.experience_years ? parseInt(profileData.experience_years) : 0,
                whatsapp: profileData.whatsapp ? Number(profileData.whatsapp) : null,
                cafe: profileData.cafe ? Number(profileData.cafe) : null,
                meet_1: profileData.meet_1 ? Number(profileData.meet_1) : 0,
                meet_30: profileData.meet_30 ? Number(profileData.meet_30) : 0
            }

            // @ts-ignore
            await updateProfile(payload, profileImage || undefined)
            onClose()
        } catch (error) {
            toast({ title: "Error", description: "No se pudo guardar el perfil.", variant: "destructive" })
        }
    }

    return {
        loading,
        profileData,
        setProfileData,
        goals,
        sports,
        handleToggleGoal,
        handleToggleSport,
        previewImage,
        handleImageChange,
        handleCloseAttempt,
        handleSaveProfile,
        errors,
        showDiscardConfirmation,
        setShowDiscardConfirmation,
        isGoalsPopoverOpen,
        setIsGoalsPopoverOpen,
        isSportsPopoverOpen,
        setIsSportsPopoverOpen
    }
}
