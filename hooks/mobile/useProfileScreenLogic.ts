"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useProfileManagement } from '@/hooks/client/use-profile-management'
import { useClientMetrics } from '@/hooks/client/use-client-metrics'
import { useCoachProfile } from '@/hooks/coach/use-coach-profile'
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { getSupabaseClient } from "@/lib/supabase/supabase-client"

export function useProfileScreenLogic() {
    const { user } = useAuth()
    const { toast } = useToast()

    const {
        profile: managedProfile,
        biometrics,
        injuries,
        loadProfile,
        loadBiometrics,
        loadInjuries,
        deleteBiometric,
        createBiometric,
        updateBiometric,
        createInjury,
        updateInjury,
        deleteInjury
    } = useProfileManagement()

    const [activityFilter, setActivityFilter] = useState<'fitness' | 'nutricion'>('fitness')
    const [ringsWeek, setRingsWeek] = useState(new Date())
    const { metrics, weeklyData, loading: metricsLoading } = useClientMetrics(user?.id, activityFilter, ringsWeek)

    const [selectedDay, setSelectedDay] = useState<{
        date: string;
        minutes: number;
        minutesTarget: number;
        kcal: number;
        kcalTarget: number;
        exercises: number;
        exercisesTarget: number;
    } | null>(null)

    const [selectedBiometric, setSelectedBiometric] = useState<any>(null)
    const [biometricsModalMode, setBiometricsModalMode] = useState<'edit' | 'register'>('register')
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editingSection, setEditingSection] = useState<string | null>(null)
    const [isObjectivesModalOpen, setIsObjectivesModalOpen] = useState(false)
    const [isBiometricsModalOpen, setIsBiometricsModalOpen] = useState(false)
    const [showQuickAdd, setShowQuickAdd] = useState(false)
    const [showCalendar, setShowCalendar] = useState(false)
    const [showInjuriesModal, setShowInjuriesModal] = useState(false)
    const [isEditingProfile, setIsEditingProfile] = useState(false)
    const [editName, setEditName] = useState('')
    const [editLocation, setEditLocation] = useState('')
    const [editBirthDate, setEditBirthDate] = useState('')
    const [editGoals, setEditGoals] = useState<string[]>([])
    const [editSports, setEditSports] = useState<string[]>([])
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
    const [showGoalsSelect, setShowGoalsSelect] = useState(false)
    const [showSportsSelect, setShowSportsSelect] = useState(false)
    const [showBiometricDeleteConfirmation, setShowBiometricDeleteConfirmation] = useState(false)
    const [isEditingObjectives, setIsEditingObjectives] = useState(false)
    const [isSavingObjectives, setIsSavingObjectives] = useState(false)
    const objectivesRef = useRef<any>(null)
    const [biometricToDelete, setBiometricToDelete] = useState<any>(null)
    const [showOnboardingForm, setShowOnboardingForm] = useState(false)

    // Coach specific
    const isUserCoach = user?.level === 'coach'
    const isCoach = isUserCoach
    const {
        profile: coachProfile,
        salesData,
        earningsData,
        recentActivities,
        loading: coachLoading
    } = useCoachProfile()

    const processedBiometrics = useMemo(() => {
        if (!Array.isArray(biometrics)) return []
        const groups: { [key: string]: any[] } = {}
        biometrics.forEach(b => {
            if (!groups[b.name]) groups[b.name] = []
            groups[b.name].push(b)
        })
        return Object.keys(groups).map(name => {
            const sorted = groups[name].sort((a, b) =>
                new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            )
            const current = sorted[0]
            const previous = sorted[1]
            let trend = 'neutral'
            let diff = 0
            if (previous) {
                diff = current.value - previous.value
                if (diff > 0) trend = 'up'
                else if (diff < 0) trend = 'down'
            }
            return {
                ...current,
                trend,
                previousValue: previous?.value,
                diff: Math.abs(diff)
            }
        })
    }, [biometrics])

    const displayBiometrics = useMemo(() => {
        const bioList = biometrics ? [...biometrics] : []
        const profileMetrics = [
            { name: 'Peso', value: managedProfile?.weight, unit: 'kg', id: 'profile-weight' },
            { name: 'Altura', value: managedProfile?.height, unit: 'cm', id: 'profile-height' }
        ]
        profileMetrics.forEach(metric => {
            if (!metric.value) return
            const existingIndex = bioList.findIndex(b => b.name.toLowerCase() === metric.name.toLowerCase())
            if (existingIndex !== -1) {
                const existing = bioList[existingIndex]
                bioList.splice(existingIndex, 1)
                bioList.unshift(existing)
            } else {
                bioList.unshift({
                    id: metric.id,
                    name: metric.name,
                    value: Number(metric.value),
                    unit: metric.unit,
                    date: new Date().toISOString(),
                    trend: 'neutral'
                } as any)
            }
        })
        return bioList.sort((a, b) => {
            const nameA = a.name.toLowerCase()
            const nameB = b.name.toLowerCase()
            if (nameA === 'peso') return -1
            if (nameB === 'peso') return 1
            if (nameA === 'altura') return -1
            if (nameB === 'altura') return 1
            return 0
        })
    }, [biometrics, managedProfile])

    const handleDownloadInvoice = async () => {
        try {
            const now = new Date();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = now.getFullYear();
            const url = `/api/coach/export-sales?format=excel&month=${year}-${month}&year=${year}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Error al descargar factura');
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `factura_${month}_${year}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Error descargando factura:', error);
        }
    }

    const handleEditSection = useCallback((section: string) => {
        if (section === "goals") {
            setIsEditingObjectives(prev => !prev)
        } else if (section === "biometrics") {
            setBiometricsModalMode('register')
            setIsBiometricsModalOpen(true)
        } else if (section === "injuries") {
            setShowInjuriesModal(true)
        } else if (section === "profile") {
            if (!isEditingProfile) {
                setEditName(managedProfile?.full_name || '')
                setEditLocation(managedProfile?.location || '')
                setEditBirthDate(managedProfile?.birth_date || '')
                setEditGoals(managedProfile?.fitness_goals || [])
                setEditSports(managedProfile?.sports || [])
            }
            setIsEditingProfile(prev => !prev)
        } else {
            setEditingSection(section)
            setIsEditModalOpen(true)
        }
    }, [isEditingProfile, managedProfile])

    const handleQuickAddExercise = useCallback(async (exercise: { title: string; unit: string; value: string }) => {
        try {
            const response = await fetch('/api/profile/exercise-progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    exercise_title: exercise.title,
                    unit: exercise.unit,
                    value: exercise.value
                })
            })
            if (response.ok) {
                setShowQuickAdd(false)
                // @ts-ignore
                if (window.refreshExercises) window.refreshExercises()
            }
        } catch (error) {
            console.error('Error adding exercise:', error)
        }
    }, [])

    const handleSaveProfile = useCallback(async () => {
        try {
            const supabase = getSupabaseClient()
            const { error: profileError } = await supabase
                .from('user_profiles')
                .update({ full_name: editName, location: editLocation })
                .eq('id', user?.id)
            if (profileError) throw profileError

            const { error: clientError } = await supabase
                .from('clients')
                .update({
                    birth_date: editBirthDate,
                    fitness_goals: editGoals,
                    sports: editSports
                })
                .eq('id', user?.id)
            if (clientError) throw clientError

            await loadProfile()
            setIsEditingProfile(false)
            toast({ title: "Perfil actualizado", description: "Tus cambios se guardaron correctamente" })
        } catch (error) {
            console.error('Error saving profile:', error)
            toast({ title: "Error", description: "No se pudo guardar el perfil", variant: "destructive" })
        }
    }, [editName, editLocation, editBirthDate, editGoals, editSports, user, loadProfile, toast])

    const handleCancelProfileEdit = useCallback(() => {
        setIsEditingProfile(false)
        setEditName('')
        setEditLocation('')
        setEditBirthDate('')
        setEditGoals([])
        setEditSports([])
        setShowGoalsSelect(false)
        setShowSportsSelect(false)
    }, [])

    const handleSaveInjuries = useCallback(async (updatedInjuries: any[]) => {
        try {
            const currentIds = injuries.map(i => i.id)
            const updatedIds = updatedInjuries.filter(i => !i.id.toString().startsWith('temp_')).map(i => i.id)
            const toDelete = currentIds.filter(id => !updatedIds.includes(id))
            const toCreate = updatedInjuries.filter(i => i.id.toString().startsWith('temp_'))
            const toUpdate = updatedInjuries.filter(i => !i.id.toString().startsWith('temp_'))

            const promises = []
            for (const id of toDelete) promises.push(deleteInjury(id))
            for (const injury of toCreate) {
                const { id, ...data } = injury
                promises.push(createInjury({
                    name: data.name,
                    severity: data.severity,
                    description: data.description,
                    restrictions: data.restrictions,
                    // @ts-ignore
                    muscleId: data.muscleId,
                    // @ts-ignore
                    muscleName: data.muscleName,
                    // @ts-ignore
                    muscleGroup: data.muscleGroup,
                    // @ts-ignore
                    painLevel: data.painLevel,
                    // @ts-ignore
                    painDescription: data.painDescription
                }))
            }
            for (const injury of toUpdate) {
                const { id, ...data } = injury
                promises.push(updateInjury(id, {
                    name: data.name,
                    severity: data.severity,
                    description: data.description,
                    restrictions: data.restrictions,
                    // @ts-ignore
                    muscleId: data.muscleId,
                    // @ts-ignore
                    muscleName: data.muscleName,
                    // @ts-ignore
                    muscleGroup: data.muscleGroup,
                    // @ts-ignore
                    painLevel: data.painLevel,
                    // @ts-ignore
                    painDescription: data.painDescription
                }))
            }
            await Promise.all(promises)
            await loadInjuries()
            setShowInjuriesModal(false)
            toast({ title: "Éxito", description: "Lesiones actualizadas correctamente" })
        } catch (error) {
            console.error('Error saving injuries:', error)
            toast({ title: "Error", description: "Error al guardar los cambios", variant: "destructive" })
        }
    }, [injuries, createInjury, updateInjury, deleteInjury, loadInjuries, toast])

    const handleEditBiometric = (biometric: any) => {
        setSelectedBiometric(biometric)
        setBiometricsModalMode('edit')
        setIsBiometricsModalOpen(true)
    }

    const handleSaveBiometric = useCallback(async (data: { name: string, value: number, unit: string }) => {
        try {
            if (biometricsModalMode === 'edit' && selectedBiometric) {
                await updateBiometric(selectedBiometric.id, data)
                toast({ title: "Medición actualizada", description: `${data.name}: ${data.value} ${data.unit}` })
            } else {
                await createBiometric(data)
                toast({ title: "Medición registrada", description: `${data.name}: ${data.value} ${data.unit}` })
            }
            await loadBiometrics()
            setIsBiometricsModalOpen(false)
            setSelectedBiometric(null)
            setBiometricsModalMode('register')
        } catch (error) {
            console.error('Error saving biometric:', error)
            toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la medición" })
        }
    }, [biometricsModalMode, selectedBiometric, createBiometric, loadBiometrics, toast])

    const handleDeleteBiometricFromModal = useCallback(async () => {
        if (selectedBiometric) {
            try {
                await deleteBiometric(selectedBiometric.id)
                toast({ title: "Medición eliminada" })
                await loadBiometrics()
                setIsBiometricsModalOpen(false)
                setSelectedBiometric(null)
                setBiometricsModalMode('register')
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar la medición" })
            }
        }
    }, [selectedBiometric, deleteBiometric, loadBiometrics, toast])

    const confirmDeleteBiometric = useCallback(async () => {
        if (!biometricToDelete) return
        try {
            await deleteBiometric(biometricToDelete.id)
            setShowBiometricDeleteConfirmation(false)
            setBiometricToDelete(null)
            await loadBiometrics()
        } catch (error) {
            console.error('Error deleting biometric:', error)
        }
    }, [biometricToDelete, deleteBiometric, loadBiometrics])

    // Caching
    useEffect(() => {
        if (managedProfile && Object.keys(managedProfile).length > 0) {
            try {
                sessionStorage.setItem("cached_profile_data", JSON.stringify(managedProfile))
                sessionStorage.setItem("profile_cache_timestamp", Date.now().toString())
            } catch (e) { }
        }
    }, [managedProfile])

    useEffect(() => {
        if (metrics && weeklyData && weeklyData.length > 0) {
            try {
                sessionStorage.setItem("cached_metrics_data", JSON.stringify({ metrics, weeklyData }))
                sessionStorage.setItem("metrics_cache_timestamp", Date.now().toString())
            } catch (e) { }
        }
    }, [metrics, weeklyData])

    useEffect(() => {
        if (biometrics && biometrics.length > 0) {
            try {
                sessionStorage.setItem("cached_biometrics_data", JSON.stringify(biometrics))
                sessionStorage.setItem("biometrics_cache_timestamp", Date.now().toString())
            } catch (e) { }
        }
    }, [biometrics])

    useEffect(() => {
        if (injuries && injuries.length > 0) {
            try {
                sessionStorage.setItem("cached_injuries_data", JSON.stringify(injuries))
                sessionStorage.setItem("injuries_cache_timestamp", Date.now().toString())
            } catch (e) { }
        }
    }, [injuries])

    const source = useMemo(() => {
        return selectedDay
            ? {
                calories: { current: selectedDay.kcal, target: selectedDay.kcalTarget, percentage: 0 },
                duration: { current: selectedDay.minutes, target: selectedDay.minutesTarget, percentage: 0 },
                exercises: { current: selectedDay.exercises, target: selectedDay.exercisesTarget, percentage: 0 }
            }
            : metrics
    }, [selectedDay, metrics])

    const activityRings = useMemo(() => [
        { type: "Kcal", current: source.calories.current, target: source.calories.target, color: "#FF6A00" },
        { type: "Minutos", current: source.duration.current, target: source.duration.target, color: "#FF8C42" },
        { type: activityFilter === 'fitness' ? "Ejercicios" : "Platos", current: source.exercises.current, target: source.exercises.target, color: "#FFFFFF" }
    ], [source, activityFilter])

    const calculateAge = (date: string | undefined) => {
        if (!date) return null
        const today = new Date()
        const birth = new Date(date)
        let age = today.getFullYear() - birth.getFullYear()
        const m = today.getMonth() - birth.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
        return age
    }

    return {
        user,
        managedProfile,
        biometrics,
        injuries,
        activityFilter,
        setActivityFilter,
        ringsWeek,
        setRingsWeek,
        metricsLoading,
        selectedDay,
        setSelectedDay,
        selectedBiometric,
        setSelectedBiometric,
        biometricsModalMode,
        setBiometricsModalMode,
        isEditModalOpen,
        setIsEditModalOpen,
        editingSection,
        setEditingSection,
        isObjectivesModalOpen,
        setIsObjectivesModalOpen,
        isBiometricsModalOpen,
        setIsBiometricsModalOpen,
        showQuickAdd,
        setShowQuickAdd,
        showCalendar,
        setShowCalendar,
        showInjuriesModal,
        setShowInjuriesModal,
        isEditingProfile,
        setIsEditingProfile,
        editName,
        setEditName,
        editLocation,
        setEditLocation,
        editBirthDate,
        setEditBirthDate,
        editGoals,
        setEditGoals,
        editSports,
        setEditSports,
        isUploadingAvatar,
        setIsUploadingAvatar,
        showGoalsSelect,
        setShowGoalsSelect,
        showSportsSelect,
        setShowSportsSelect,
        showBiometricDeleteConfirmation,
        setShowBiometricDeleteConfirmation,
        isEditingObjectives,
        setIsEditingObjectives,
        isSavingObjectives,
        setIsSavingObjectives,
        objectivesRef,
        biometricToDelete,
        setBiometricToDelete,
        showOnboardingForm,
        setShowOnboardingForm,
        isCoach,
        coachProfile,
        salesData,
        earningsData,
        recentActivities,
        coachLoading,
        processedBiometrics,
        displayBiometrics,
        activityRings,
        calculateAge,
        handleDownloadInvoice,
        handleEditSection,
        handleQuickAddExercise,
        handleSaveProfile,
        handleCancelProfileEdit,
        handleSaveInjuries,
        handleEditBiometric,
        handleSaveBiometric,
        handleDeleteBiometricFromModal,
        confirmDeleteBiometric,
        loadProfile
    }
}
