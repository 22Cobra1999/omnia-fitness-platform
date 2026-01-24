"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@supabase/supabase-js"
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

  // DIRECT INJECTION OF SUPABASE CLIENT
  const supabase = createClient(
    'https://mgrfswrsvrzwtgilssad.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncmZzd3JzdnJ6d3RnaWxzc2FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxOTAzMDMsImV4cCI6MjA2MTc2NjMwM30.vuEgFbZGHO0OjJ8O9SjKaYKJcIdIh3mxV2wK7iNKaJs',
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  )
  console.log('💉 [LoginForm] Direct Supabase Client Injected')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
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






























