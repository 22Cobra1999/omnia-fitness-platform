"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut, Loader2 } from "lucide-react"

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  showIcon?: boolean
  className?: string
  onSuccess?: () => void
}

export function LogoutButton({
  variant = "default",
  size = "default",
  showIcon = true,
  className = "",
  onSuccess,
}: LogoutButtonProps) {
  const { signOut } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isLoading) return

    try {
      setIsLoading(true)
      console.log("Iniciando proceso de cierre de sesión desde botón")

      // Llamar a signOut y esperar a que termine
      await signOut()

      // Ejecutar callback de éxito si existe
      if (onSuccess) {
        onSuccess()
      }

      // No necesitamos redirigir aquí porque signOut ya lo hace
      console.log("Proceso de logout completado")
    } catch (error) {
      console.error("Error en el botón de cierre de sesión:", error)
      
      // En caso de error, intentar limpiar y redirigir de todos modos
      try {
        if (typeof window !== 'undefined') {
          localStorage.clear()
          sessionStorage.clear()
          window.location.replace('/?logout=error')
        }
      } catch (fallbackError) {
        console.error("Error en fallback de logout:", fallbackError)
        // Último recurso: recarga completa
        window.location.reload()
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={isLoading}
      className={className}
      type="button"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Cerrando sesión...
        </>
      ) : (
        <>
          {showIcon && <LogOut className="mr-2 h-4 w-4" />}
          Cerrar sesión
        </>
      )}
    </Button>
  )
}
