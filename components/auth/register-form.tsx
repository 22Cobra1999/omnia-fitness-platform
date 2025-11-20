"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/supabase-client"
import { useRouter } from "next/navigation"

interface RegisterFormProps {
  onSuccess?: () => void
  onLoginClick?: () => void
}

export function RegisterForm({ onSuccess, onLoginClick }: RegisterFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      setLoading(false)
      return
    }

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/auth/login")
      }
    } catch (err) {
      setError("Error al crear la cuenta")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="fullName">Nombre completo</Label>
        <Input
          id="fullName"
          type="text"
          placeholder="Juan Pérez"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="bg-[#252525] border-gray-700 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-[#252525] border-gray-700 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="bg-[#252525] border-gray-700 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="bg-[#252525] border-gray-700 text-white"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-[#FF7939] hover:bg-[#FF6B00] text-white"
      >
        {loading ? "Creando cuenta..." : "Crear Cuenta"}
      </Button>

      {onLoginClick && (
        <div className="text-center text-sm text-gray-400">
          ¿Ya tienes cuenta?{" "}
          <button
            type="button"
            onClick={onLoginClick}
            className="text-[#FF7939] hover:underline"
          >
            Inicia sesión aquí
          </button>
        </div>
      )}
    </form>
  )
}























