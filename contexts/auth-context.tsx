"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from '@/lib/supabase/supabase-client'
import type { User } from "@supabase/supabase-js"

type AuthUser = {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  level?: string
}

type AuthContextType = {
  user: AuthUser | null
  loading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string, role?: string) => Promise<{ error: any | null }>
  signUp: (
    email: string,
    password: string,
    name: string,
    physicalData?: { age: number; height: number; weight: number; birthDate?: string },
    role?: string
  ) => Promise<{ error: any | null }>
  signOut: () => Promise<void>
  showWelcomeMessage: boolean
  setShowWelcomeMessage: (show: boolean) => void
  showAuthPopup: (type: "login" | "register") => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Function to convert a Supabase user to our AuthUser format
const formatUser = (user: User | null, userData?: any): AuthUser | null => {
  if (!user) return null

  return {
    id: user.id,
    email: user.email || "",
    name: user.user_metadata?.name || userData?.name || null,
    avatar_url: user.user_metadata?.avatar_url || userData?.avatar_url || null,
    level: user.user_metadata?.role || userData?.role || "client",
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseClient()

  // Función para mostrar el popup de autenticación
  const showAuthPopup = (type: "login" | "register") => {
    console.log(`Showing ${type} popup`)
    // Implementar lógica para mostrar el popup
    // Por ahora, redirigir a la página de inicio
    router.push("/")
  }

  // Load user on component mount - Optimizado para ser más rápido
  useEffect(() => {
    let mounted = true

    const loadUser = async () => {
      try {
        setLoading(true)

        // Usar getSession con timeout más generoso
        const timeoutPromise = new Promise<{ isTimeout: boolean, data: { session: null }, error: null }>((resolve) => {
          setTimeout(() => {
            resolve({ isTimeout: true, data: { session: null }, error: null })
          }, 5000)
        })

        const sessionPromise = supabase.auth.getSession()

        // Race entre la sesión y el timeout
        const result = await Promise.race([sessionPromise, timeoutPromise])

        if (!mounted) return

        // Verificar si el timeout ganó la carrera
        const resultWithFlag = result as any
        if (resultWithFlag?.isTimeout) {
          if (process.env.NODE_ENV === 'development') {
            console.warn("⏱️ [auth-context] Timeout real alcanzado esperando sesión - Continuando con sesión null")
          }
        }

        const { data, error } = result as any

        if (error) {
          console.warn("Session error:", error)
          setUser(null)
          setLoading(false)
          return
        }

        if (data?.session?.user) {
          if (process.env.NODE_ENV === 'development') {
            console.log("✅ User found in session:", data.session.user.email)
          }
          setUser(formatUser(data.session.user))
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log("ℹ️ No user found in session (user is probably logged out)")
          }
          setUser(null)
        }
        setLoading(false)
      } catch (error) {
        console.error("Error loading user:", error)
        if (mounted) {
          setUser(null)
          setLoading(false)
        }
      }
    }

    // Set up listener for auth state changes - Optimizado
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (!mounted) return

      // Log optimizado - solo en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log("Auth state change:", event)
      }

      if (event === "SIGNED_OUT") {
        setUser(null)
        setLoading(false)
        return
      }

      if (session?.user) {
        setUser(formatUser(session.user))
        setLoading(false)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    loadUser()

    // Clean up subscription on unmount
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  // Función signIn optimizada para mayor velocidad
  const signIn = async (email: string, password: string, role?: string) => {
    try {
      console.log("Signing in:", email)
      setLoading(true)

      // Verificar si estamos en desarrollo y usar usuario mock para pruebas rápidas
      if (process.env.NODE_ENV === "development" && email === "demo@example.com" && password === "demo123") {
        console.log("Using mock user for development")

        const mockUser = {
          id: "mock-user-id",
          email: "demo@example.com",
          name: "Demo User",
          avatar_url: null,
          level: role || "client",
        }

        setUser(mockUser)
        setShowWelcomeMessage(true)
        setLoading(false)
        return { error: null }
      }

      // Verificar si las credenciales de Supabase están configuradas
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
        console.warn("Supabase credentials not properly configured")
        setLoading(false)
        return {
          error: "Configuración de Supabase incompleta. Por favor, configura las credenciales en el archivo .env.local"
        }
      }

      // Autenticación directa sin timeout complejo
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Error signing in:", error)

        // Manejar errores específicos de conexión
        if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
          setLoading(false)
          return { error: "Error de conexión. Verifica tu conexión a internet." }
        }

        // Manejar timeout
        if (error.message.includes("Timeout")) {
          setLoading(false)
          return { error: "La operación tardó demasiado. Intenta nuevamente." }
        }

        // Si se especificó un rol y hay un error, podría ser un problema de rol
        if (role && error.message.includes("Invalid login credentials")) {
          // Intentar verificar si el usuario existe pero con un rol diferente
          try {
            const { data: userData } = await supabase
              .from("user_profiles")
              .select("role")
              .eq("id", data?.user?.id || "")
              .single()

            if (userData && userData.role && userData.role !== role) {
              setLoading(false)
              return {
                error: {
                  type: "role_mismatch",
                  message: "La cuenta existe con un rol diferente",
                  actualRole: userData.role,
                },
              }
            }
          } catch (profileError) {
            console.warn("Profile check failed:", profileError)
          }
        }

        setLoading(false)
        return { error: error.message }
      }

      console.log("Sign in successful")
      setShowWelcomeMessage(true)
      setLoading(false)
      return { error: null }
    } catch (error: any) {
      console.error("Error signing in:", error)
      setLoading(false)

      // Manejar errores de red específicos
      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        return { error: "Error de conexión. Verifica tu conexión a internet." }
      }

      return { error: error.message || "Ocurrió un error inesperado" }
    }
  }

  const signUp = async (
    email: string,
    password: string,
    name: string,
    physicalData?: { age: number; height: number; weight: number; birthDate?: string },
    role = "client"
  ) => {
    try {
      console.log("Registering user:", email)
      setLoading(true)

      // Verificar si las credenciales de Supabase están configuradas
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
        console.warn("Supabase credentials not properly configured")
        setLoading(false)
        return {
          error: "Configuración de Supabase incompleta. Por favor, configura las credenciales en el archivo .env.local"
        }
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
        },
      })

      if (error) {
        console.error("Error registering:", error)
        setLoading(false)

        // Manejar errores específicos de conexión
        if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
          return { error: "Error de conexión. Verifica tu conexión a internet." }
        }

        return { error: error.message }
      }

      // Si tenemos datos físicos y el usuario se creó exitosamente, guardarlos en clients
      if (physicalData && data.user) {
        try {
          // Usar birthDate si se proporcionó, si no calcular desde la edad
          let birthDateToSave = physicalData.birthDate
          if (!birthDateToSave) {
            const birthYear = new Date().getFullYear() - physicalData.age
            birthDateToSave = new Date(birthYear, 0, 1).toISOString().split('T')[0]
          }

          const { error: clientError } = await supabase
            .from('clients')
            .update({
              Height: physicalData.height,
              weight: physicalData.weight,
              birth_date: birthDateToSave
            })
            .eq('user_id', data.user.id)

          if (clientError) {
            console.error("Error saving physical data:", clientError)
            // No retornamos error aquí porque el usuario ya se creó exitosamente
          }
        } catch (physicalError) {
          console.error("Error processing physical data:", physicalError)
          // No retornamos error aquí porque el usuario ya se creó exitosamente
        }
      }

      console.log("Registration successful")
      setShowWelcomeMessage(true)
      setLoading(false)
      return { error: null }
    } catch (error: any) {
      console.error("Error registering:", error)
      setLoading(false)

      // Manejar errores de red específicos
      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        return { error: "Error de conexión. Verifica tu conexión a internet." }
      }

      return { error: error.message || "Ocurrió un error inesperado" }
    }
  }

  const signOut = async () => {
    try {
      console.log("Iniciando cierre de sesión...")
      setLoading(true)

      // Limpiar estado local inmediatamente
      setUser(null)
      setShowWelcomeMessage(false)

      // Limpiar localStorage y sessionStorage
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }

      // Llamar al endpoint de logout del servidor
      try {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          console.log("Logout del servidor exitoso")
        } else {
          console.warn("Logout del servidor falló, continuando con limpieza local")
        }
      } catch (serverError) {
        console.warn("Error llamando al endpoint de logout:", serverError)
      }

      // También llamar al endpoint para limpiar cookies del cliente
      try {
        const clearResponse = await fetch('/api/auth/clear-cookies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (clearResponse.ok) {
          console.log("Limpieza de cookies del cliente exitosa")
        } else {
          console.warn("Limpieza de cookies del cliente falló")
        }
      } catch (clearError) {
        console.warn("Error limpiando cookies del cliente:", clearError)
      }

      // También intentar cerrar sesión directamente en Supabase como respaldo
      try {
        await supabase.auth.signOut()
        console.log("Logout de Supabase exitoso")
      } catch (supabaseError) {
        console.warn("Error cerrando sesión en Supabase:", supabaseError)
      }

      console.log("Sesión cerrada completamente")

      // Redirigir a la página principal
      if (typeof window !== 'undefined') {
        // Usar replace para evitar que el usuario pueda volver atrás
        window.location.replace('/?logout=success')
      }

    } catch (error: any) {
      console.error("Error al cerrar sesión:", error)

      // Limpiar todo de todos modos
      setUser(null)
      setShowWelcomeMessage(false)

      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
        window.location.replace('/?logout=error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        showWelcomeMessage,
        setShowWelcomeMessage,
        showAuthPopup,
        isLoading: loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
