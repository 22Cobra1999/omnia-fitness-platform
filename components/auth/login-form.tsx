"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion, AnimatePresence } from "framer-motion"

export function LoginForm({
  onSuccess,
  onRegisterClick,
}: {
  onSuccess?: () => void
  onRegisterClick?: () => void
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Validación rápida para evitar envíos innecesarios
      if (!email.trim() || !password.trim()) {
        setError("Email y contraseña son requeridos")
        setIsLoading(false)
        return
      }

      // Validación de formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        setError("Por favor ingresa un email válido")
        setIsLoading(false)
        return
      }

      // Validación de longitud mínima de contraseña
      if (password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres")
        setIsLoading(false)
        return
      }

      const { error: signInError } = await signIn(email.trim(), password)

      if (signInError) {
        // Manejar errores específicos
        if (typeof signInError === "object" && signInError.type === "role_mismatch") {
          setError(`La cuenta existe con rol de ${signInError.actualRole}. Por favor inicia sesión con el rol correcto.`)
        } else {
          setError(typeof signInError === "string" ? signInError : "Inicio de sesión fallido")
        }
        setIsLoading(false)
        return
      }

      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado")
      setIsLoading(false)
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError(null)
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError(null)
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
          <Input 
            id="email" 
            type="email" 
            value={email} 
            onChange={handleEmailChange}
            placeholder="tu@email.com"
            disabled={isLoading}
            className="transition-all duration-200 focus:ring-2 focus:ring-[#FF7939] focus:border-[#FF7939]"
            required 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={handlePasswordChange}
              placeholder="••••••••"
              disabled={isLoading}
              className="pr-10 transition-all duration-200 focus:ring-2 focus:ring-[#FF7939] focus:border-[#FF7939]"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent disabled:opacity-50"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.1 }}
        >
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-[#FF7939] to-[#FFB56B] hover:from-[#FF7939]/90 hover:to-[#FFB56B]/90 text-white font-medium py-3 transition-all duration-200" 
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Iniciando sesión...</span>
              </div>
            ) : (
              "Iniciar sesión"
            )}
          </Button>
        </motion.div>

        {onRegisterClick && (
          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={onRegisterClick}
              disabled={isLoading}
              className="text-sm text-gray-600 hover:text-[#FF7939] transition-colors duration-200"
            >
              ¿No tienes cuenta? Regístrate aquí
            </Button>
          </div>
        )}
      </form>
    </div>
  )
}
