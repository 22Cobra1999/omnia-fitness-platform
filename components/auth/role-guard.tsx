"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createClient } from '@/lib/supabase-browser'
import { Loader2 } from "lucide-react"

interface RoleGuardProps {
  role: "coach" | "client"
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGuard({ role, children, fallback }: RoleGuardProps) {
  const [hasRole, setHasRole] = useState<boolean | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function checkRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setHasRole(false)
        return
      }

      // Verificar el rol en los metadatos
      const userRole = user.app_metadata?.role

      // Si no hay rol en app_metadata, verificar en user_profiles
      if (!userRole) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("preferences")
          .eq("user_id", user.id)
          .single()

        if (profile?.preferences?.role === role) {
          setHasRole(true)
          return
        }
      } else if (userRole === role) {
        setHasRole(true)
        return
      }

      setHasRole(false)
    }

    checkRole()
  }, [role, supabase])

  if (hasRole === null) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (hasRole === false) {
    return fallback || null
  }

  return <>{children}</>
}
