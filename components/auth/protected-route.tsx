"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    // Solo redirigir cuando estamos seguros de que el usuario no está autenticado
    if (!loading) {
      if (user) {
        console.log("User is authenticated, allowing access")
        setIsAuthorized(true)
      } else {
        console.log("User is not authenticated, redirecting to home")
        setIsAuthorized(false)
        router.push("/")
      }
    }
  }, [user, loading, router])

  // Mostrar un indicador de carga mientras verificamos la autenticación
  if (loading || isAuthorized === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-2 border-gray-500 border-t-orange-500"></div>
      </div>
    )
  }

  // Si no está autorizado, no renderizar nada (la redirección ya está en marcha)
  if (!isAuthorized) {
    return null
  }

  // Si está autorizado, renderizar los hijos
  return <>{children}</>
}
