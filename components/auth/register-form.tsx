"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CheckCircle, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion, AnimatePresence } from "framer-motion"

export function RegisterForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState("client")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const router = useRouter()
  const { signUp } = useAuth()

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Validaciones rápidas
      if (!name.trim() || !email.trim() || !password.trim()) {
        setError("Todos los campos son requeridos")
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

      // Validación de nombre
      if (name.trim().length < 2) {
        setError("El nombre debe tener al menos 2 caracteres")
        setIsLoading(false)
        return
      }

      const { error: signUpError } = await signUp(email.trim(), password, name.trim(), role)

      if (signUpError) {
        setError(typeof signUpError === "string" ? signUpError : "Registro fallido")
        setIsLoading(false)
        return
      }

      // Mostrar diálogo de éxito
      setShowSuccessDialog(true)
    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado")
    } finally {
      setIsLoading(false)
    }
  }

  function handleSuccessConfirm() {
    setShowSuccessDialog(false)
    // Redirigir a la página de inicio de sesión
    router.push("/auth/login")
  }

  const handleInputChange = (field: string, value: string) => {
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError(null)
    
    switch (field) {
      case 'name':
        setName(value)
        break
      case 'email':
        setEmail(value)
        break
      case 'password':
        setPassword(value)
        break
    }
  }

  return (
    <>
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mb-4"
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">Nombre completo</Label>
          <Input 
            id="name" 
            value={name} 
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Tu nombre completo"
            disabled={isLoading}
            className="transition-all duration-200 focus:ring-2 focus:ring-[#FF7939] focus:border-[#FF7939]"
            required 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
          <Input 
            id="email" 
            type="email" 
            value={email} 
            onChange={(e) => handleInputChange('email', e.target.value)}
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
              onChange={(e) => handleInputChange('password', e.target.value)}
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

        <div className="space-y-3">
          <Label className="text-sm font-medium">Tipo de cuenta</Label>
          <RadioGroup 
            value={role} 
            onValueChange={setRole}
            className="grid grid-cols-2 gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="client" id="client" disabled={isLoading} />
              <Label htmlFor="client" className="text-sm">Cliente</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="coach" id="coach" disabled={isLoading} />
              <Label htmlFor="coach" className="text-sm">Coach</Label>
            </div>
          </RadioGroup>
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
                <span>Creando cuenta...</span>
              </div>
            ) : (
              "Crear cuenta"
            )}
          </Button>
        </motion.div>
      </form>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              ¡Cuenta creada exitosamente!
            </DialogTitle>
            <DialogDescription>
              Tu cuenta ha sido creada. Ahora puedes iniciar sesión con tu email y contraseña.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleSuccessConfirm} className="w-full">
              Ir al inicio de sesión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
