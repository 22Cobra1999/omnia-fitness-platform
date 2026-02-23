"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

interface LoginFormProps {
  onSuccess?: () => void
  onRegisterClick?: () => void
}

export function LoginForm({ onSuccess, onRegisterClick }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error: signInError } = await signIn(email, password)

      if (signInError) {
        setError(typeof signInError === 'string' ? signInError : (signInError as any).message)
        return
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/")
      }
    } catch (err) {
      setError("Error al iniciar sesión")
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
        <Label htmlFor="email" className="text-gray-400">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-white/5 border-white/10 text-white h-11 focus:border-[#FF7939]/50 transition-all shadow-lg"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-gray-400">Contraseña</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="bg-white/5 border-white/10 text-white h-11 focus:border-[#FF7939]/50 transition-all shadow-lg"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-[#FF7939] hover:bg-[#FF6B00] text-white"
      >
        {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
      </Button>

      {onRegisterClick && (
        <div className="text-center text-sm text-gray-400">
          ¿No tienes cuenta?{" "}
          <button
            type="button"
            onClick={onRegisterClick}
            className="text-[#FF7939] hover:underline"
          >
            Regístrate aquí
          </button>
        </div>
      )}
    </form>
  )
}






























