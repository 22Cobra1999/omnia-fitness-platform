"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AuthWrapper } from "@/components/auth/auth-wrapper"
import { LoginForm } from "@/components/auth/login-form"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    // Si ya está autenticado, redirigir al dashboard
    if (isAuthenticated) {
      setIsRedirecting(true)
      router.replace("/dashboard")
    }
  }, [isAuthenticated, router])

  const handleLoginSuccess = () => {
    setIsRedirecting(true)
    router.replace("/dashboard")
  }

  const handleBackToHome = () => {
    router.push("/")
  }

  if (isRedirecting) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center px-4 py-8 h-screen">
        <div className="w-full max-w-md space-y-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col space-y-2 items-center"
          >
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-[#FF7939] to-[#FFB56B] bg-clip-text text-transparent">
              OMNIA
            </h1>
            <p className="text-muted-foreground">Redirigiendo al dashboard...</p>
            <div className="mt-4 h-6 w-6 animate-spin rounded-full border-b-2 border-[#FF7939]"></div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gradient-to-br from-[#1E1E1E] to-[#252525] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Botón de volver */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <Button
              variant="ghost"
              onClick={handleBackToHome}
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio
            </Button>
          </motion.div>

          {/* Card del formulario */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#1A1A1A] rounded-2xl p-8 shadow-2xl border border-[#333]"
          >
            <div className="text-center mb-8">
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-bold bg-gradient-to-r from-[#FF7939] to-[#FFB56B] bg-clip-text text-transparent mb-2"
              >
                Iniciar Sesión
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-gray-400 text-sm"
              >
                Accede a tu cuenta de OMNIA
              </motion.p>
            </div>

            <LoginForm onSuccess={handleLoginSuccess} />
          </motion.div>
        </motion.div>
      </div>
    </AuthWrapper>
  )
}
