"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"

type Goal = {
  id: string
  text: string
  color?: string
  trainingFrequency?: string
  changeTimeline?: string
}

type HealthCondition = {
  type: string
  details: string
}

export type ClientProfile = {
  id: string
  height: number
  weight: number
  birth_date: string
  fitness_goals: Goal[]
  health_conditions: HealthCondition[]
  activity_level: string
  Genre: string
  description: string
  name?: string
  full_name?: string
  email: string
  age?: number
}

// Perfil por defecto para usar mientras se carga
const DEFAULT_PROFILE: ClientProfile = {
  id: "loading",
  full_name: "Usuario",
  name: "Usuario",
  email: "usuario@example.com",
  height: 170,
  weight: 70,
  birth_date: null,
  fitness_goals: [],
  health_conditions: [],
  activity_level: "Beginner",
  Genre: "male",
  description: "Cargando perfil...",
  age: 25,
}

export function useClientProfile() {
  const [profile, setProfile] = useState<ClientProfile>(DEFAULT_PROFILE)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  // Función para obtener un color aleatorio
  const getRandomColor = useCallback(() => {
    const colors = ["#4ADE80", "#86EFAC", "#FF8C00", "#60A5FA", "#FF6B35", "#FBBF24"]
    return colors[Math.floor(Math.random() * colors.length)]
  }, [])

  // Modificar la función loadProfile para mejorar el sistema de caché
  const loadProfile = useCallback(async () => {
    if (!user?.id) {
      console.log("No user ID available, using default profile")
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)

      // Usar un perfil en caché si existe - OPTIMIZADO
      const cachedProfile = localStorage.getItem(`profile-${user.id}`)
      const cacheTimestamp = localStorage.getItem(`profile-timestamp-${user.id}`)
      const now = Date.now()
      const CACHE_TTL = 10 * 60 * 1000 // 10 minutos de caché (aumentado de 5 a 10)

      // Verificar si la caché es válida (existe y no ha expirado)
      if (cachedProfile && cacheTimestamp && now - Number.parseInt(cacheTimestamp) < CACHE_TTL) {
        try {
          const parsedProfile = JSON.parse(cachedProfile)
          setProfile(parsedProfile)
          console.log("Using cached profile (valid for 10 minutes)")
          setIsLoading(false)

          // Cargar en segundo plano para actualizar la caché si está por expirar
          // pero solo si han pasado al menos 30 segundos desde la última carga
          const lastFetchTimestamp = localStorage.getItem(`profile-last-fetch-${user.id}`)
          const timeSinceLastFetch = lastFetchTimestamp
            ? now - Number.parseInt(lastFetchTimestamp)
            : Number.POSITIVE_INFINITY

          if (timeSinceLastFetch > 30000 && now - Number.parseInt(cacheTimestamp) > CACHE_TTL * 0.7) {
            console.log("Cache nearing expiration, refreshing in background")
            localStorage.setItem(`profile-last-fetch-${user.id}`, now.toString())
            fetchProfileData(user.id, false).catch((e) => console.error("Background fetch error:", e))
          }
          return
        } catch (e) {
          console.error("Error parsing cached profile:", e)
          // Continuar con la carga normal si hay error en la caché
        }
      }

      // Si no hay caché o ha expirado, cargar normalmente
      localStorage.setItem(`profile-last-fetch-${user.id}`, now.toString())
      await fetchProfileData(user.id, true)
    } catch (error) {
      console.error("Error loading profile:", error)
      handleProfileError(error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, toast])

  // Modificar la función fetchProfileData para optimizar la transferencia de datos
  const fetchProfileData = async (userId: string, updateLoadingState: boolean) => {
    try {
      // Add a timestamp to prevent caching issues
      const timestamp = new Date().getTime()

      const response = await fetch(`/api/profile/${userId}?t=${timestamp}`, {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Profile API error:", response.status, errorText)
        throw new Error(`Failed to load profile: ${response.status} ${errorText.substring(0, 100)}`)
      }

      const data = await response.json()
      console.log("Profile data loaded successfully")

      // Ensure fitness_goals has the correct format
      let formattedFitnessGoals = data.fitness_goals || []

      // If not an array of objects, convert the array of strings to objects
      if (formattedFitnessGoals.length > 0 && typeof formattedFitnessGoals[0] !== "object") {
        formattedFitnessGoals = formattedFitnessGoals.map((goal: string, index: number) => ({
          id: `goal-${index}`,
          text: goal,
          color: getRandomColor(),
        }))
      }

      // Ensure health_conditions has the correct format
      let formattedHealthConditions = data.health_conditions || []

      // If not an array of objects, convert the array of strings to objects
      if (formattedHealthConditions.length > 0 && typeof formattedHealthConditions[0] !== "object") {
        formattedHealthConditions = formattedHealthConditions.map((condition: string) => ({
          type: condition,
          details: "",
        }))
      }

      const formattedProfile = {
        ...data,
        fitness_goals: formattedFitnessGoals,
        health_conditions: formattedHealthConditions,
        name: data.full_name || data.name || user?.name || "User",
      }

      // Guardar en caché con timestamp
      localStorage.setItem(`profile-${userId}`, JSON.stringify(formattedProfile))
      localStorage.setItem(`profile-timestamp-${userId}`, Date.now().toString())

      if (updateLoadingState) {
        setProfile(formattedProfile)
        setError(null)
      } else {
        // Actualizar silenciosamente sin cambiar el estado de carga
        setProfile((prev) => ({ ...prev, ...formattedProfile }))
      }

      return formattedProfile
    } catch (error) {
      console.error("Error fetching profile data:", error)
      
      if (updateLoadingState) {
        handleProfileError(error)
      }
      throw error
    }
  }

  // Manejar errores de perfil
  const handleProfileError = (error: any) => {
    setError(error.message || "Error loading profile")

    // Only show toast for non-auth errors to avoid spamming the user
    if (!error.message?.includes("Authentication failed")) {
      toast({
        title: "Error",
        description: "Could not load profile data. Using default profile.",
        variant: "destructive",
      })
    }

    // Set a fallback profile with basic data if user exists
    if (user?.id) {
      setProfile({
        ...DEFAULT_PROFILE,
        id: user.id,
        full_name: user.name || "User",
        name: user.name || "User",
        email: user.email || "user@example.com",
      })
    }
  }

  // Cargar el perfil cuando cambie el usuario
  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  // Función para guardar el perfil
  const saveProfile = async (updatedData: Partial<ClientProfile>) => {
    if (!user?.id || !profile) return false

    try {
      setIsSaving(true)

      // Simplificar el formato de los datos antes de enviarlos al backend
      const dataToSend = { ...updatedData }

      // Convertir fitness_goals a un array simple de strings si existe
      if (dataToSend.fitness_goals) {
        dataToSend.fitness_goals = dataToSend.fitness_goals.map((goal) => goal.text)
      }

      // Convertir health_conditions a un array simple de strings si existe
      if (dataToSend.health_conditions) {
        dataToSend.health_conditions = dataToSend.health_conditions.map((condition) => condition.type)
      }

      // Actualizar optimistamente la UI
      const optimisticProfile = { ...profile, ...updatedData }
      setProfile(optimisticProfile)

      const response = await fetch(`/api/profile/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(dataToSend),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Profile save error:", response.status, errorText)
        throw new Error(`Failed to save profile: ${response.status} ${errorText.substring(0, 100)}`)
      }

      const updatedProfile = await response.json()

      // Formatear los datos recibidos para mantener la estructura interna
      const formattedProfile = { ...updatedProfile }

      // Formatear fitness_goals si existe
      if (updatedProfile.fitness_goals) {
        formattedProfile.fitness_goals = updatedProfile.fitness_goals.map((goal: string, index: number) => ({
          id: `goal-${index}`,
          text: goal,
          color: getRandomColor(),
        }))
      }

      // Formatear health_conditions si existe
      if (updatedProfile.health_conditions) {
        formattedProfile.health_conditions = updatedProfile.health_conditions.map((condition: string) => ({
          type: condition,
          details: "",
        }))
      }

      // Actualizar la caché
      localStorage.setItem(`profile-${user.id}`, JSON.stringify(formattedProfile))

      setProfile((prev) => (prev ? { ...prev, ...formattedProfile } : formattedProfile))

      toast({
        title: "Success",
        description: "Profile updated successfully",
      })

      return true
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({
        title: "Error",
        description: "Could not save profile changes",
        variant: "destructive",
      })
      return false
    } finally {
      setIsSaving(false)
    }
  }

  return {
    profile,
    isLoading,
    isSaving,
    error,
    saveProfile,
    setProfile,
    reloadProfile: loadProfile,
  }
}
