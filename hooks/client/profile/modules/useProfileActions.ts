import { ProfileData, Biometric, Injury } from './useProfileState'

interface ProfileActionsProps {
    userId: string | undefined
    userLevel: string | undefined
    setLoading: (loading: boolean) => void
    setProfile: (profile: ProfileData | null) => void
    setBiometrics: React.Dispatch<React.SetStateAction<Biometric[]>>
    setInjuries: React.Dispatch<React.SetStateAction<Injury[]>>
    toast: any
}

export function useProfileActions({
    userId,
    userLevel,
    setLoading,
    setProfile,
    setBiometrics,
    setInjuries,
    toast
}: ProfileActionsProps) {

    const updateProfile = async (profileData: ProfileData, profileImage?: File) => {
        if (!userId) return

        try {
            setLoading(true)
            const isCoach = userLevel === 'coach'

            const userProfileData = {
                full_name: profileData.full_name,
                email: profileData.email
            }

            const profileSpecificData: any = {
                height: profileData.height,
                weight: profileData.weight,
                gender: profileData.gender,
                level: profileData.level,
                birth_date: profileData.birth_date,
                phone: profileData.phone,
                location: profileData.location,
                emergency_contact: profileData.emergency_contact,
                fitness_goals: profileData.fitness_goals,
                sports: profileData.sports
            }

            if (isCoach) {
                const coachFields = [
                    'specialization', 'experience_years', 'whatsapp',
                    'instagram_username', 'bio', 'cafe', 'cafe_enabled',
                    'meet_1', 'meet_30', 'meet_1_enabled',
                    'meet_30_enabled', 'category'
                ]
                coachFields.forEach(field => {
                    if ((profileData as any)[field] !== undefined) {
                        profileSpecificData[field] = (profileData as any)[field]
                    }
                })
            }

            const userProfileFormData = new FormData()
            Object.entries(userProfileData).forEach(([key, value]) => {
                if (value !== undefined && value !== null) userProfileFormData.append(key, value.toString())
            })
            if (profileImage) userProfileFormData.append('profile_image', profileImage)

            const userProfileResponse = await fetch('/api/profile/user-profile', { method: 'PUT', body: userProfileFormData })
            const userProfileResult = await userProfileResponse.json()
            if (!userProfileResult.success) throw new Error(userProfileResult.error)

            const profileFormData = new FormData()
            Object.entries(profileSpecificData).forEach(([key, value]) => {
                if (value !== undefined && value !== null) profileFormData.append(key, value.toString())
            })

            const profileResponse = await fetch(isCoach ? '/api/profile/coach' : '/api/profile/client', { method: 'PUT', body: profileFormData })
            const profileResult = await profileResponse.json()
            if (!profileResult.success) throw new Error(profileResult.error)

            const combinedProfile = {
                ...userProfileResult.profile,
                ...profileResult.profile,
                height: isCoach ? profileResult.profile?.height : profileResult.profile?.Height,
                weight: profileResult.profile?.weight,
                gender: isCoach ? profileResult.profile?.gender : profileResult.profile?.Genre,
                level: isCoach ? 'Principiante' : profileResult.profile?.nivel_actividad,
                birth_date: profileResult.profile?.birth_date,
                phone: profileResult.profile?.phone,
                location: profileResult.profile?.location,
                emergency_contact: profileResult.profile?.emergency_contact,
                fitness_goals: profileResult.profile?.fitness_goals,
                sports: profileResult.profile?.sports
            }

            setProfile(combinedProfile)
            if (typeof window !== 'undefined') {
                sessionStorage.removeItem('cached_profile_data')
                sessionStorage.removeItem('profile_cache_timestamp')
            }
            toast({ title: "Éxito", description: "Perfil actualizado correctamente" })
            return { success: true, profile: combinedProfile }
        } catch (error) {
            console.error('Error updating profile:', error)
            toast({ title: "Error", description: "No se pudo actualizar el perfil", variant: "destructive" })
            throw error
        } finally {
            setLoading(false)
        }
    }

    const createBiometric = async (biometricData: Omit<Biometric, 'id' | 'created_at' | 'updated_at'>) => {
        if (!userId) return
        try {
            const response = await fetch('/api/profile/biometrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(biometricData)
            })
            const result = await response.json()
            if (!response.ok) throw new Error(result.error || 'Error al crear biométrica')
            if (result.success && result.biometric) {
                setBiometrics(prev => [result.biometric, ...prev])
                if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('cached_biometrics_data')
                    sessionStorage.removeItem('biometrics_cache_timestamp')
                }
                toast({ title: "Éxito", description: "Medición registrada correctamente" })
                return result.biometric
            }
            throw new Error('Respuesta inválida del servidor')
        } catch (error) {
            console.error('Error creating biometric:', error)
            toast({ title: "Error", description: "No se pudo registrar la medición", variant: "destructive" })
            throw error
        }
    }

    const updateBiometric = async (biometricId: string, updates: Partial<Biometric>) => {
        if (!userId) return
        try {
            const response = await fetch('/api/profile/biometrics', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: biometricId, ...updates })
            })
            const result = await response.json()
            if (!response.ok) throw new Error(result.error || 'Error al actualizar biométrica')
            if (result.success && result.biometric) {
                setBiometrics(prev => prev.map(bio => bio.id === biometricId ? result.biometric : bio))
                if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('cached_biometrics_data')
                    sessionStorage.removeItem('biometrics_cache_timestamp')
                }
                toast({ title: "Éxito", description: "Medición actualizada correctamente" })
                return result.biometric
            }
            throw new Error('Respuesta inválida del servidor')
        } catch (error) {
            console.error('Error updating biometric:', error)
            toast({ title: "Error", description: "No se pudo actualizar la medición", variant: "destructive" })
            throw error
        }
    }

    const deleteBiometric = async (biometricId: string) => {
        if (!userId) return
        try {
            const response = await fetch(`/api/profile/biometrics?id=${biometricId}`, { method: 'DELETE' })
            const result = await response.json()
            if (!response.ok) throw new Error(result.error || 'Error al eliminar biométrica')
            if (result.success) {
                setBiometrics(prev => prev.filter(bio => bio.id !== biometricId))
                if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('cached_biometrics_data')
                    sessionStorage.removeItem('biometrics_cache_timestamp')
                }
                toast({ title: "Éxito", description: "Medición eliminada correctamente" })
            }
        } catch (error) {
            console.error('Error deleting biometric:', error)
            toast({ title: "Error", description: "No se pudo eliminar la medición", variant: "destructive" })
            throw error
        }
    }

    const createInjury = async (injuryData: Omit<Injury, 'id' | 'created_at' | 'updated_at'>) => {
        if (!userId) return
        try {
            const mappedData = {
                name: injuryData.name,
                description: injuryData.description,
                severity: injuryData.severity,
                restrictions: injuryData.restrictions,
                muscle_id: injuryData.muscleId,
                muscle_name: injuryData.muscleName,
                muscle_group: injuryData.muscleGroup,
                pain_level: injuryData.painLevel,
                pain_description: injuryData.painDescription
            }
            const response = await fetch('/api/profile/injuries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mappedData)
            })
            const result = await response.json()
            if (!response.ok) throw new Error(result.error || 'Error al crear lesión')
            if (result.success && result.injury) {
                const mappedInjury = {
                    ...result.injury,
                    muscleId: result.injury.muscle_id,
                    muscleName: result.injury.muscle_name,
                    muscleGroup: result.injury.muscle_group,
                    painLevel: result.injury.pain_level,
                    painDescription: result.injury.pain_description
                }
                setInjuries(prev => [mappedInjury, ...prev])
                if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('cached_injuries_data')
                    sessionStorage.removeItem('injuries_cache_timestamp')
                }
                toast({ title: "Éxito", description: "Lesión registrada correctamente" })
                return result.injury
            }
            throw new Error('Respuesta inválida del servidor')
        } catch (error) {
            console.error('Error creating injury:', error)
            toast({ title: "Error", description: "No se pudo registrar la lesión", variant: "destructive" })
            throw error
        }
    }

    const updateInjury = async (injuryId: string, updates: Partial<Injury>) => {
        if (!userId) return
        try {
            const mappedUpdates = {
                id: injuryId,
                name: updates.name,
                description: updates.description,
                severity: updates.severity,
                restrictions: updates.restrictions,
                muscle_id: updates.muscleId,
                muscle_name: updates.muscleName,
                muscle_group: updates.muscleGroup,
                pain_level: updates.painLevel,
                pain_description: updates.painDescription
            }
            const response = await fetch('/api/profile/injuries', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mappedUpdates)
            })
            const result = await response.json()
            if (!response.ok) throw new Error(result.error || 'Error al actualizar lesión')
            if (result.success && result.injury) {
                const mappedInjury = {
                    ...result.injury,
                    muscleId: result.injury.muscle_id,
                    muscleName: result.injury.muscle_name,
                    muscleGroup: result.injury.muscle_group,
                    painLevel: result.injury.pain_level,
                    painDescription: result.injury.pain_description
                }
                setInjuries(prev => prev.map(injury => injury.id === injuryId ? mappedInjury : injury))
                if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('cached_injuries_data')
                    sessionStorage.removeItem('injuries_cache_timestamp')
                }
                toast({ title: "Éxito", description: "Lesión actualizada correctamente" })
                return result.injury
            }
            throw new Error('Respuesta inválida del servidor')
        } catch (error) {
            console.error('Error updating injury:', error)
            toast({ title: "Error", description: "No se pudo actualizar la lesión", variant: "destructive" })
            throw error
        }
    }

    const deleteInjury = async (injuryId: string) => {
        if (!userId) return
        try {
            const response = await fetch(`/api/profile/injuries?id=${injuryId}`, { method: 'DELETE' })
            const result = await response.json()
            if (!response.ok) throw new Error(result.error || 'Error al eliminar lesión')
            if (result.success) {
                setInjuries(prev => prev.filter(injury => injury.id !== injuryId))
                if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('cached_injuries_data')
                    sessionStorage.removeItem('injuries_cache_timestamp')
                }
                toast({ title: "Éxito", description: "Lesión eliminada correctamente" })
            }
        } catch (error) {
            console.error('Error deleting injury:', error)
            toast({ title: "Error", description: "No se pudo eliminar la lesión", variant: "destructive" })
            throw error
        }
    }

    return {
        updateProfile,
        createBiometric,
        updateBiometric,
        deleteBiometric,
        createInjury,
        updateInjury,
        deleteInjury
    }
}
