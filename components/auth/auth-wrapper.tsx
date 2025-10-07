"use client"

import { useAuth } from "@/contexts/auth-context"
import { AuthLoading } from "./auth-loading"
import { motion, AnimatePresence } from "framer-motion"

interface AuthWrapperProps {
  children: React.ReactNode
  requireAuth?: boolean
  fallback?: React.ReactNode
}

export function AuthWrapper({ 
  children, 
  requireAuth = false, 
  fallback = <AuthLoading /> 
}: AuthWrapperProps) {
  const { user, loading, isAuthenticated } = useAuth()

  // Si está cargando, mostrar el loading
  if (loading) {
    return <AuthLoading />
  }

  // Si requiere autenticación y no está autenticado, mostrar fallback
  if (requireAuth && !isAuthenticated) {
    return <>{fallback}</>
  }

  // Si todo está bien, mostrar el contenido
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={isAuthenticated ? "authenticated" : "unauthenticated"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

