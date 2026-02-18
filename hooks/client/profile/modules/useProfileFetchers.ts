import { ProfileData, Biometric, Injury } from './useProfileState'

interface ProfileFetchersProps {
    userId: string | undefined
    setLoading: (loading: boolean) => void
    setProfile: (profile: ProfileData | null) => void
    setBiometrics: (biometrics: Biometric[]) => void
    setInjuries: (injuries: Injury[]) => void
    setLastProfileLoadAt: (timestamp: number) => void
    lastProfileLoadAt: number
    profile: ProfileData | null
    toast: any
}

export function useProfileFetchers({
    userId,
    setLoading,
    setProfile,
    setBiometrics,
    setInjuries,
    setLastProfileLoadAt,
    lastProfileLoadAt,
    profile,
    toast
}: ProfileFetchersProps) {

    const loadProfile = async (useCache = true) => {
        if (!userId) return

        try {
            if (!profile) setLoading(true)
            if (Date.now() - lastProfileLoadAt < 1500) return
            setLastProfileLoadAt(Date.now())

            const response = await fetch('/api/profile/combined', {
                cache: 'no-store',
                headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
            })
            const result = await response.json()

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Error al cargar el perfil')
            }

            if (result.profile) {
                setProfile(result.profile)

                if (typeof window !== 'undefined') {
                    try {
                        window.localStorage.setItem('profile_cache', JSON.stringify({
                            profile: result.profile,
                            timestamp: Date.now()
                        }))
                        sessionStorage.setItem("cached_profile_data", JSON.stringify(result.profile))
                        sessionStorage.setItem("profile_cache_timestamp", Date.now().toString())
                    } catch (e) {
                        console.error('Error guardando perfil en caché:', e)
                    }
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error)
            toast({
                title: "Error",
                description: "No se pudo cargar el perfil",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const loadBiometrics = async (useCache = true) => {
        if (!userId) return

        if (useCache && typeof window !== 'undefined') {
            try {
                const cachedBiometrics = sessionStorage.getItem("cached_biometrics_data")
                const biometricsTimestamp = Number.parseInt(sessionStorage.getItem("biometrics_cache_timestamp") || "0")

                if (cachedBiometrics && Date.now() - biometricsTimestamp < 10 * 60 * 1000) {
                    const parsedBiometrics = JSON.parse(cachedBiometrics)
                    if (parsedBiometrics && Array.isArray(parsedBiometrics)) {
                        setBiometrics(parsedBiometrics)
                        setTimeout(() => loadBiometrics(false), 5000)
                        return
                    }
                }
            } catch (e) { }
        }

        try {
            const response = await fetch('/api/profile/biometrics')
            const result = await response.json()

            if (!response.ok) throw new Error(result.error || 'Error al cargar biométricas')

            if (result.success && result.biometrics) {
                setBiometrics(result.biometrics)
                if (typeof window !== 'undefined') {
                    try {
                        sessionStorage.setItem("cached_biometrics_data", JSON.stringify(result.biometrics))
                        sessionStorage.setItem("biometrics_cache_timestamp", Date.now().toString())
                    } catch (e) { }
                }
            } else {
                setBiometrics([])
            }
        } catch (error) {
            console.error('Error loading biometrics:', error)
            setBiometrics([])
        }
    }

    const loadInjuries = async (useCache = true) => {
        if (!userId) return

        if (useCache && typeof window !== 'undefined') {
            try {
                const cachedInjuries = sessionStorage.getItem("cached_injuries_data")
                const injuriesTimestamp = Number.parseInt(sessionStorage.getItem("injuries_cache_timestamp") || "0")

                if (cachedInjuries && Date.now() - injuriesTimestamp < 10 * 60 * 1000) {
                    const parsedInjuries = JSON.parse(cachedInjuries)
                    if (parsedInjuries && Array.isArray(parsedInjuries)) {
                        setInjuries(parsedInjuries)
                        setTimeout(() => loadInjuries(false), 5000)
                        return
                    }
                }
            } catch (e) { }
        }

        try {
            const response = await fetch('/api/profile/injuries')
            const result = await response.json()

            if (!response.ok) throw new Error(result.error || 'Error al cargar lesiones')

            if (result.success && result.injuries) {
                const mappedInjuries = result.injuries.map((injury: any) => ({
                    ...injury,
                    muscleId: injury.muscle_id,
                    muscleName: injury.muscle_name,
                    muscleGroup: injury.muscle_group,
                    painLevel: injury.pain_level,
                    painDescription: injury.pain_description
                }))
                setInjuries(mappedInjuries)

                if (typeof window !== 'undefined') {
                    try {
                        sessionStorage.setItem("cached_injuries_data", JSON.stringify(mappedInjuries))
                        sessionStorage.setItem("injuries_cache_timestamp", Date.now().toString())
                    } catch (e) { }
                }
            } else {
                setInjuries([])
            }
        } catch (error) {
            console.error('Error loading injuries:', error)
            setInjuries([])
        }
    }

    return {
        loadProfile,
        loadBiometrics,
        loadInjuries
    }
}
