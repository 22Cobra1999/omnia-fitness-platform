import { useState, useEffect, useCallback, useRef } from 'react'
import { useProfileManagement } from '@/hooks/client/use-profile-management'
import { useToast } from "@/components/ui/use-toast"
import { ProfileData, ProfileEditErrors } from '../types'

export function useProfileEditLogic(isOpen: boolean, onClose: () => void, onSaveSuccess?: () => void) {
    const { profile, updateProfile, loading, loadProfile } = useProfileManagement()
    const { toast } = useToast()
    const isInitialized = useRef<boolean>(false);

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
        level: "Principiante",
        experience_history: []
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
        } else {
            isInitialized.current = false;
        }
    }, [isOpen, loadProfile])

    // Solo cargar los datos iniciales UNA VEZ cuando el perfil llega
    useEffect(() => {
        if (isOpen && profile && !isInitialized.current) {
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

            // Desglosar ubicación: "País, Ciudad, Barrio"
            const parts = (profile.location || "").split(',').map(s => s.trim())
            
            const data: ProfileData = {
                full_name: profile.full_name || "",
                email: profile.email || "",
                phone: profile.phone || "",
                location: profile.location || "",
                country: parts[0] || "",
                city: parts[1] || "",
                neighborhood: parts[2] || "",
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
                category: (profile as any).category || "general",
                experience_history: (profile as any).experience_history || []
            }

            setProfileData(data)
            
            // Solo sobreescribir la previsualización si el usuario NO ha elegido una imagen nueva todavía
            if (!profileImage) {
                setPreviewImage(profile.avatar_url || null)
            }

            const profileGoals = (profile as any).fitness_goals || []
            const profileSports = (profile as any).sports || []
            
            setGoals(profileGoals)
            setSports(profileSports)

            setInitialData({
                ...data,
                goals: profileGoals,
                sports: profileSports,
                avatar_url: profile.avatar_url // Guardar para referencia de borrado
            })

            isInitialized.current = true;
        }
    }, [isOpen, profile, profileImage])

    const handleImageChange = (file: File) => {
        setProfileImage(file)
        const previewUrl = URL.createObjectURL(file)
        setPreviewImage(previewUrl)
    }

    const handleRemoveImage = () => {
        setProfileImage(null)
        setPreviewImage(null)
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
        if (profileImage) return true
        if (previewImage === null && initialData?.avatar_url !== null) return true

        const historyLength = profileData.experience_history?.length || 0
        const initialHistoryLength = initialData?.experience_history?.length || 0
        if (historyLength !== initialHistoryLength) return true

        return false
    }, [profileData, goals, sports, profileImage, previewImage, initialData])

    const handleCloseAttempt = () => {
        if (hasChanges()) {
            setShowDiscardConfirmation(true)
        } else {
            onClose()
        }
    }

    const handleSaveProfile = async () => {
        try {
            const isCoach = profileData.category !== undefined

            const newErrors = {
                weight: false,
                height: false,
                emergency_contact: false,
            }

            // Solo validar si NO es coach (Los coaches no ven estos campos)
            if (!isCoach) {
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
            }

            const combinedLocation = [
                profileData.country?.trim(),
                profileData.city?.trim(),
                profileData.neighborhood?.trim()
            ].filter(Boolean).join(', ')

            const payload = {
                ...profileData,
                location: combinedLocation,
                weight: profileData.weight ? Number(profileData.weight) : 0,
                height: profileData.height ? Number(profileData.height) : 0,
                fitness_goals: goals,
                sports: sports,
                // Coach numeric fields
                experience_years: profileData.experience_years ? parseInt(profileData.experience_years) : 0,
                whatsapp: profileData.whatsapp ? Number(profileData.whatsapp) : null,
                cafe: profileData.cafe ? Number(profileData.cafe) : null,
                meet_1: profileData.meet_1 ? Number(profileData.meet_1) : 0,
                meet_30: profileData.meet_30 ? Number(profileData.meet_30) : 0,
                experience_history: profileData.experience_history || []
            }

            // Si se eliminó la imagen (estaba antes y ahora no hay ni preview ni image nueva)
            // Se puede enviar una señal al API si fuera necesario, por ahora lo dejamos como undefined
            const imageToUpload = profileImage || (previewImage === null ? null : undefined)

            // @ts-ignore
            await updateProfile(payload, imageToUpload === null ? undefined : imageToUpload)
            if (onSaveSuccess) onSaveSuccess()
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
        handleRemoveImage,
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
