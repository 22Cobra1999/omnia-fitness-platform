import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/components/ui/use-toast'

interface ProfileData {
  full_name?: string
  email?: string
  phone?: string
  location?: string
  emergency_contact?: string
  age?: number
  birth_date?: string
  weight?: number
  height?: number
  gender?: string
  level?: string
  avatar_url?: string
  specialization?: string
  fitness_goals?: string[]
  sports?: string[]
  physical_data?: {
    height?: number
    weight?: number
    birth_date?: string
    gender?: string
    onboarding_completed_at?: string
  }
}


interface Biometric {
  id: string
  name: string
  value: number
  unit: string
  notes?: string
  created_at: string
  updated_at?: string
  // Campos calculados para UI
  trend?: 'up' | 'down' | 'neutral'
  diff?: number
  previousValue?: number
}

interface Injury {
  id: string
  name: string
  severity: 'low' | 'medium' | 'high'
  description?: string
  restrictions?: string
  created_at: string
  updated_at?: string
  // Campos adicionales para UI mejorada
  muscleId?: string
  muscleName?: string
  muscleGroup?: string
  painLevel?: number
  painDescription?: string
}

export function useProfileManagement() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<ProfileData | null>(() => {
    try {
      // 1) CACHE DISABLED FOR DEBUGGING
      // if (typeof window === 'undefined') return null
      // const cached = window.localStorage.getItem('profile_cache')
      // if (cached) {
      //   const parsed = JSON.parse(cached)
      //   const isFresh = Date.now() - (parsed.timestamp || 0) < 1000 * 60 * 60 // 1h
      //   // Verificar si tiene los campos nuevos, si no, invalidar
      //   const hasNewFields = Array.isArray(parsed.profile?.fitness_goals) && Array.isArray(parsed.profile?.sports)
      //   const hasBirthDate = parsed.profile?.birth_date !== undefined

      //   // Specially invalidate for debugging user if data is missing despite being "fresh"
      //   const isDebugUser = parsed.profile?.id === '00dedc23-0b17-4e50-b84e-b2e8100dc93c' || parsed.profile?.email === 'pomatifranco@gmail.com'
      //   const isMissingData = (!parsed.profile?.fitness_goals?.length) || (!parsed.profile?.sports?.length)

      //   if (isDebugUser && isMissingData) {
      //     return null // Force refresh for this user if data is missing
      //   }

      //   if (isFresh && parsed.profile && hasNewFields && hasBirthDate) return parsed.profile as ProfileData
      // }
      return null
    } catch { }
    // 2) Prefill rápido con datos del usuario autenticado
    if (!user) return null
    return {
      full_name: user.name || undefined,
      email: user.email,
      avatar_url: user.avatar_url || undefined,
      level: user.level,
    }
  })
  const [biometrics, setBiometrics] = useState<Biometric[]>([])
  const [injuries, setInjuries] = useState<Injury[]>([])
  const [lastProfileLoadAt, setLastProfileLoadAt] = useState<number>(0)

  // Cargar datos del perfil
  const loadProfile = async (useCache = true) => {
    if (!user?.id) return

    // 3) CACHE CHECK DISABLED TO FIX STALE DATA
    // if (useCache && typeof window !== 'undefined') {
    //   try {
    //     const cachedProfile = sessionStorage.getItem("cached_profile_data")
    // ... (disabled)
    //   } catch (e) { }
    // }

    try {
      if (!profile) setLoading(true)
      // Evitar refetch inmediato si se llamó hace muy poco
      if (Date.now() - lastProfileLoadAt < 1500) return
      setLastProfileLoadAt(Date.now())

      // Llamar a la API para obtener el perfil (NO CACHE)
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

        // Guardar en caché
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


  // Cargar biometría con cache inteligente
  const loadBiometrics = async (useCache = true) => {
    if (!user?.id) return

    // Verificar cache primero si está habilitado
    if (useCache && typeof window !== 'undefined') {
      try {
        const cachedBiometrics = sessionStorage.getItem("cached_biometrics_data")
        const biometricsTimestamp = Number.parseInt(sessionStorage.getItem("biometrics_cache_timestamp") || "0")

        // Usar cache si existe y tiene menos de 10 minutos
        if (cachedBiometrics && Date.now() - biometricsTimestamp < 10 * 60 * 1000) {
          const parsedBiometrics = JSON.parse(cachedBiometrics)
          if (parsedBiometrics && Array.isArray(parsedBiometrics)) {
            console.log("✅ [PROFILE] Usando biometría en caché")
            setBiometrics(parsedBiometrics)
            // Cargar datos frescos en background después de un delay
            setTimeout(() => loadBiometrics(false), 5000)
            return
          }
        }
      } catch (e) {
        console.error("Error al cargar biometría desde cache:", e)
      }
    }

    try {
      const response = await fetch('/api/profile/biometrics')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al cargar biométricas')
      }

      if (result.success && result.biometrics) {
        setBiometrics(result.biometrics)

        // Guardar en caché
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem("cached_biometrics_data", JSON.stringify(result.biometrics))
            sessionStorage.setItem("biometrics_cache_timestamp", Date.now().toString())
          } catch (e) {
            console.error('Error guardando biométricas en caché:', e)
          }
        }
      } else {
        setBiometrics([])
      }
    } catch (error) {
      console.error('Error loading biometrics:', error)
      // En caso de error, mantener array vacío
      setBiometrics([])
    }
  }

  // Cargar lesiones con cache inteligente
  const loadInjuries = async (useCache = true) => {
    if (!user?.id) return

    // Verificar cache primero si está habilitado
    if (useCache && typeof window !== 'undefined') {
      try {
        const cachedInjuries = sessionStorage.getItem("cached_injuries_data")
        const injuriesTimestamp = Number.parseInt(sessionStorage.getItem("injuries_cache_timestamp") || "0")

        // Usar cache si existe y tiene menos de 10 minutos
        if (cachedInjuries && Date.now() - injuriesTimestamp < 10 * 60 * 1000) {
          const parsedInjuries = JSON.parse(cachedInjuries)
          if (parsedInjuries && Array.isArray(parsedInjuries)) {
            console.log("✅ [PROFILE] Usando lesiones en caché")
            setInjuries(parsedInjuries)
            // Cargar datos frescos en background después de un delay
            setTimeout(() => loadInjuries(false), 5000)
            return
          }
        }
      } catch (e) {
        console.error("Error al cargar lesiones desde cache:", e)
      }
    }

    try {
      const response = await fetch('/api/profile/injuries')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al cargar lesiones')
      }

      if (result.success && result.injuries) {
        const mappedInjuries = result.injuries.map((injury: any) => ({
          ...injury,
          muscleId: injury.muscle_id,
          muscleName: injury.muscle_name,
          muscleGroup: injury.muscle_group,
          painLevel: injury.pain_level,
          painDescription: injury.pain_description
        }));
        setInjuries(mappedInjuries)

        // Guardar en caché
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem("cached_injuries_data", JSON.stringify(mappedInjuries))
            sessionStorage.setItem("injuries_cache_timestamp", Date.now().toString())
          } catch (e) {
            console.error('Error guardando lesiones en caché:', e)
          }
        }
      } else {
        setInjuries([])
      }
    } catch (error) {
      console.error('Error loading injuries:', error)
      // En caso de error, mantener array vacío
      setInjuries([])
    }
  }

  // Actualizar perfil
  const updateProfile = async (profileData: ProfileData, profileImage?: File) => {
    if (!user?.id) return

    try {
      setLoading(true)

      // Verificar si es coach o cliente
      const isCoach = user.level === 'coach'

      // Separar datos para user_profiles
      const userProfileData = {
        full_name: profileData.full_name,
        email: profileData.email
      }

      // Datos específicos según el tipo de usuario
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

      // Solo agregar specialization si es coach
      if (isCoach && profileData.specialization !== undefined) {
        profileSpecificData.specialization = profileData.specialization
      }

      // Actualizar user_profiles (con imagen)
      const userProfileFormData = new FormData()
      Object.entries(userProfileData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          userProfileFormData.append(key, value.toString())
        }
      })

      if (profileImage) {
        userProfileFormData.append('profile_image', profileImage)
      }

      const userProfileResponse = await fetch('/api/profile/user-profile', {
        method: 'PUT',
        body: userProfileFormData
      })

      const userProfileResult = await userProfileResponse.json()

      if (!userProfileResult.success) {
        throw new Error(userProfileResult.error)
      }

      // Actualizar según el tipo de usuario (coach o client)
      const profileFormData = new FormData()
      Object.entries(profileSpecificData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          profileFormData.append(key, value.toString())
        }
      })

      const profileResponse = await fetch(isCoach ? '/api/profile/coach' : '/api/profile/client', {
        method: 'PUT',
        body: profileFormData
      })

      const profileResult = await profileResponse.json()

      if (!profileResult.success) {
        throw new Error(profileResult.error)
      }

      // Combinar resultados
      const combinedProfile = {
        ...userProfileResult.profile,
        ...profileResult.profile,
        // Mapear campos según el tipo de usuario
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

      console.log('🔄 [Profile Hook] Actualizando perfil local:', {
        userProfileResult: userProfileResult.profile,
        profileResult: profileResult.profile,
        combinedProfile,
        hasAvatar: !!combinedProfile.avatar_url
      })

      setProfile(combinedProfile)

      // Limpiar caché para forzar recarga
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('cached_profile_data')
        sessionStorage.removeItem('profile_cache_timestamp')
        console.log('🗑️ [Profile Hook] Caché de sesión limpiado')
      }
      toast({
        title: "Éxito",
        description: "Perfil actualizado correctamente"
      })
      return { success: true, profile: combinedProfile }

    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil",
        variant: "destructive"
      })
      throw error
    } finally {
      setLoading(false)
    }
  }


  // Crear medición biométrica
  const createBiometric = async (biometricData: Omit<Biometric, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user?.id) return

    try {
      const response = await fetch('/api/profile/biometrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(biometricData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear biométrica')
      }

      if (result.success && result.biometric) {
        setBiometrics(prev => [result.biometric, ...prev])

        // Limpiar caché para forzar recarga
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('cached_biometrics_data')
          sessionStorage.removeItem('biometrics_cache_timestamp')
        }

        toast({
          title: "Éxito",
          description: "Medición registrada correctamente"
        })
        return result.biometric
      }

      throw new Error('Respuesta inválida del servidor')
    } catch (error) {
      console.error('Error creating biometric:', error)
      toast({
        title: "Error",
        description: "No se pudo registrar la medición",
        variant: "destructive"
      })
      throw error
    }
  }

  // Actualizar medición biométrica
  const updateBiometric = async (biometricId: string, updates: Partial<Biometric>) => {
    if (!user?.id) return

    try {
      const response = await fetch('/api/profile/biometrics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: biometricId, ...updates })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar biométrica')
      }

      if (result.success && result.biometric) {
        setBiometrics(prev => prev.map(bio =>
          bio.id === biometricId ? result.biometric : bio
        ))

        // Limpiar caché para forzar recarga
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('cached_biometrics_data')
          sessionStorage.removeItem('biometrics_cache_timestamp')
        }

        toast({
          title: "Éxito",
          description: "Medición actualizada correctamente"
        })
        return result.biometric
      }

      throw new Error('Respuesta inválida del servidor')
    } catch (error) {
      console.error('Error updating biometric:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la medición",
        variant: "destructive"
      })
      throw error
    }
  }

  // Eliminar medición biométrica
  const deleteBiometric = async (biometricId: string) => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/profile/biometrics?id=${biometricId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar biométrica')
      }

      if (result.success) {
        setBiometrics(prev => prev.filter(bio => bio.id !== biometricId))

        // Limpiar caché para forzar recarga
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('cached_biometrics_data')
          sessionStorage.removeItem('biometrics_cache_timestamp')
        }

        toast({
          title: "Éxito",
          description: "Medición eliminada correctamente"
        })
      }
    } catch (error) {
      console.error('Error deleting biometric:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la medición",
        variant: "destructive"
      })
      throw error
    }
  }

  // Crear lesión
  const createInjury = async (injuryData: Omit<Injury, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user?.id) return

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
      };

      const response = await fetch('/api/profile/injuries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mappedData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear lesión')
      }

      if (result.success && result.injury) {
        const mappedInjury = {
          ...result.injury,
          muscleId: result.injury.muscle_id,
          muscleName: result.injury.muscle_name,
          muscleGroup: result.injury.muscle_group,
          painLevel: result.injury.pain_level,
          painDescription: result.injury.pain_description
        };
        setInjuries(prev => [mappedInjury, ...prev])

        // Limpiar caché para forzar recarga
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('cached_injuries_data')
          sessionStorage.removeItem('injuries_cache_timestamp')
        }

        toast({
          title: "Éxito",
          description: "Lesión registrada correctamente"
        })
        return result.injury
      }

      throw new Error('Respuesta inválida del servidor')
    } catch (error) {
      console.error('Error creating injury:', error)
      toast({
        title: "Error",
        description: "No se pudo registrar la lesión",
        variant: "destructive"
      })
      throw error
    }
  }

  // Actualizar lesión
  const updateInjury = async (injuryId: string, updates: Partial<Injury>) => {
    if (!user?.id) return

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
      };

      const response = await fetch('/api/profile/injuries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mappedUpdates)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar lesión')
      }

      if (result.success && result.injury) {
        const mappedInjury = {
          ...result.injury,
          muscleId: result.injury.muscle_id,
          muscleName: result.injury.muscle_name,
          muscleGroup: result.injury.muscle_group,
          painLevel: result.injury.pain_level,
          painDescription: result.injury.pain_description
        };
        setInjuries(prev => prev.map(injury =>
          injury.id === injuryId ? mappedInjury : injury
        ))

        // Limpiar caché para forzar recarga
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('cached_injuries_data')
          sessionStorage.removeItem('injuries_cache_timestamp')
        }

        toast({
          title: "Éxito",
          description: "Lesión actualizada correctamente"
        })
        return result.injury
      }

      throw new Error('Respuesta inválida del servidor')
    } catch (error) {
      console.error('Error updating injury:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la lesión",
        variant: "destructive"
      })
      throw error
    }
  }

  // Eliminar lesión
  const deleteInjury = async (injuryId: string) => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/profile/injuries?id=${injuryId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar lesión')
      }

      if (result.success) {
        setInjuries(prev => prev.filter(injury => injury.id !== injuryId))

        // Limpiar caché para forzar recarga
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('cached_injuries_data')
          sessionStorage.removeItem('injuries_cache_timestamp')
        }

        toast({
          title: "Éxito",
          description: "Lesión eliminada correctamente"
        })
      }
    } catch (error) {
      console.error('Error deleting injury:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la lesión",
        variant: "destructive"
      })
      throw error
    }
  }

  // Cargar todos los datos al montar el componente (paralelo y sin bloquear UI)
  useEffect(() => {
    if (!user?.id) return
    // 1) Cargar perfil inmediatamente para pintar datos críticos
    loadProfile()
    // 2) Diferir datos no críticos al próximo ciclo para no bloquear la pintura inicial
    const id = setTimeout(() => {
      loadBiometrics()
      loadInjuries()
    }, 0)
    return () => clearTimeout(id)
  }, [user?.id])

  return {
    loading,
    profile,
    biometrics,
    injuries,
    updateProfile,
    createBiometric,
    updateBiometric,
    deleteBiometric,
    createInjury,
    updateInjury,
    deleteInjury,
    loadProfile,
    loadBiometrics,
    loadInjuries
  }
}

