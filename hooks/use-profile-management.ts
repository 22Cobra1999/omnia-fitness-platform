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
  weight?: number
  height?: number
  gender?: string
  level?: string
  avatar_url?: string
}


interface Biometric {
  id: string
  name: string
  value: number
  unit: string
  notes?: string
  created_at: string
  updated_at?: string
}

interface Injury {
  id: string
  name: string
  severity: 'low' | 'medium' | 'high'
  description?: string
  restrictions?: string
  created_at: string
  updated_at?: string
}

export function useProfileManagement() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<ProfileData | null>(() => {
    try {
      // 1) Hidratar desde cache si existe y no está vencido
      if (typeof window === 'undefined') return null
      const cached = window.localStorage.getItem('profile_cache')
      if (cached) {
        const parsed = JSON.parse(cached)
        const isFresh = Date.now() - (parsed.timestamp || 0) < 1000 * 60 * 60 // 1h
        if (isFresh && parsed.profile) return parsed.profile as ProfileData
      }
    } catch {}
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

    // Verificar cache primero si está habilitado
    if (useCache && typeof window !== 'undefined') {
      try {
        const cachedProfile = sessionStorage.getItem("cached_profile_data")
        const profileTimestamp = Number.parseInt(sessionStorage.getItem("profile_cache_timestamp") || "0")
        
        // Usar cache si existe y tiene menos de 5 minutos
        if (cachedProfile && Date.now() - profileTimestamp < 5 * 60 * 1000) {
          const parsedProfile = JSON.parse(cachedProfile)
          if (parsedProfile && Object.keys(parsedProfile).length > 0) {
            console.log("✅ [PROFILE] Usando perfil en caché:", {
              hasAvatar: !!parsedProfile?.avatar_url,
              avatarUrl: parsedProfile?.avatar_url,
              profile: parsedProfile
            })
            setProfile(parsedProfile)
            setLoading(false)
            // Cargar datos frescos en background después de un delay
            setTimeout(() => loadProfile(false), 3000)
            return
          }
        }
      } catch (e) {
        console.error("Error al cargar perfil desde cache:", e)
      }
    }

    try {
      if (!profile) setLoading(true)
      // Evitar refetch inmediato si se llamó hace muy poco
      if (Date.now() - lastProfileLoadAt < 1500) return
      setLastProfileLoadAt(Date.now())

      const response = await fetch('/api/profile/combined', { cache: 'no-store' })
      const data = await response.json()
      
      if (data.success) {
        console.log('✅ [PROFILE] Perfil cargado desde API:', {
          hasAvatar: !!data.profile?.avatar_url,
          avatarUrl: data.profile?.avatar_url,
          profile: data.profile
        })
        setProfile(data.profile)
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('profile_cache', JSON.stringify({ profile: data.profile, timestamp: Date.now() }))
          }
        } catch {}
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
      const data = await response.json()
      
      if (data.success) {
        setBiometrics(data.biometrics)
      }
    } catch (error) {
      console.error('Error loading biometrics:', error)
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
      console.log('🔧 [PROFILE] Cargando lesiones desde API...')
      const response = await fetch('/api/profile/injuries')
      const data = await response.json()
      
      console.log('🔧 [PROFILE] Respuesta de lesiones:', data)
      
      if (response.ok && data.injuries) {
        console.log('🔧 [PROFILE] Lesiones cargadas:', data.injuries)
        setInjuries(data.injuries)
      } else {
        console.error('Error loading injuries:', data.error)
      }
    } catch (error) {
      console.error('Error loading injuries:', error)
    }
  }

  // Actualizar perfil
  const updateProfile = async (profileData: ProfileData, profileImage?: File) => {
    if (!user?.id) return

    try {
      setLoading(true)
      
      // Separar datos para user_profiles y clients
      const userProfileData = {
        full_name: profileData.full_name,
        email: profileData.email
      }
      
      const clientData = {
        height: profileData.height,
        weight: profileData.weight,
        gender: profileData.gender,
        level: profileData.level,
        birth_date: profileData.birth_date, // Usar fecha de nacimiento directamente
        phone: profileData.phone,
        location: profileData.location,
        emergency_contact: profileData.emergency_contact
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

      // Actualizar clients
      const clientFormData = new FormData()
      Object.entries(clientData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          clientFormData.append(key, value.toString())
        }
      })

      const clientResponse = await fetch('/api/profile/client', {
        method: 'PUT',
        body: clientFormData
      })

      const clientResult = await clientResponse.json()
      
      if (!clientResult.success) {
        throw new Error(clientResult.error)
      }

      // Combinar resultados
      const combinedProfile = {
        ...userProfileResult.profile,
        ...clientResult.profile,
        // Mapear campos de clients a nombres del frontend
        height: clientResult.profile?.Height,
        gender: clientResult.profile?.Genre,
        level: clientResult.profile?.nivel_actividad // Nueva columna en español
      }

      console.log('🔄 [Profile Hook] Actualizando perfil local:', {
        userProfileResult: userProfileResult.profile,
        clientResult: clientResult.profile,
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

      const data = await response.json()
      
      if (data.success) {
        setBiometrics(prev => [data.biometric, ...prev])
        toast({
          title: "Éxito",
          description: "Medición registrada correctamente"
        })
        return data.biometric
      } else {
        throw new Error(data.error)
      }
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

      const data = await response.json()
      
      if (data.success) {
        setBiometrics(prev => prev.map(bio => 
          bio.id === biometricId ? data.biometric : bio
        ))
        toast({
          title: "Éxito",
          description: "Medición actualizada correctamente"
        })
        return data.biometric
      } else {
        throw new Error(data.error)
      }
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

  // Crear lesión
  const createInjury = async (injuryData: Omit<Injury, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user?.id) return

    try {
      const response = await fetch('/api/profile/injuries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(injuryData)
      })

      const data = await response.json()
      
      if (data.success) {
        setInjuries(prev => [data.injury, ...prev])
        toast({
          title: "Éxito",
          description: "Lesión registrada correctamente"
        })
        return data.injury
      } else {
        throw new Error(data.error)
      }
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
      const response = await fetch('/api/profile/injuries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: injuryId, ...updates })
      })

      const data = await response.json()
      
      if (data.success) {
        setInjuries(prev => prev.map(injury => 
          injury.id === injuryId ? data.injury : injury
        ))
        toast({
          title: "Éxito",
          description: "Lesión actualizada correctamente"
        })
        return data.injury
      } else {
        throw new Error(data.error)
      }
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

      const data = await response.json()
      
      if (data.success) {
        setInjuries(prev => prev.filter(injury => injury.id !== injuryId))
        toast({
          title: "Éxito",
          description: "Lesión eliminada correctamente"
        })
      } else {
        throw new Error(data.error)
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
    createInjury,
    updateInjury,
    deleteInjury,
    loadProfile,
    loadBiometrics,
    loadInjuries
  }
}

