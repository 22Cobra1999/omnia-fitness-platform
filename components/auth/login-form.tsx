"use client"

import { useState } from "react"
import { motion } from "framer-motion"
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-medium text-center"
        >
          {error}
        </motion.div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white/40 font-bold text-xs uppercase tracking-widest ml-1">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-white/5 border-white/10 text-white h-14 rounded-2xl focus:ring-2 focus:ring-[#FF7939]/30 focus:border-[#FF7939]/50 transition-all placeholder:text-white/20 font-medium px-5"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center ml-1">
            <Label htmlFor="password" className="text-white/40 font-bold text-xs uppercase tracking-widest">Contraseña</Label>
            <button type="button" className="text-[10px] font-black text-[#FF7939] uppercase tracking-wider hover:underline">Olvide mi clave</button>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-white/5 border-white/10 text-white h-14 rounded-2xl focus:ring-2 focus:ring-[#FF7939]/30 focus:border-[#FF7939]/50 transition-all placeholder:text-white/20 font-medium px-5"
          />
        </div>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#FF7939] hover:bg-[#E66829] text-white h-16 rounded-2xl font-black text-lg shadow-[0_15px_40px_rgba(255,121,57,0.3)] transition-all active:scale-[0.98] relative overflow-hidden group"
        >
          <span className="relative z-10 flex items-center justify-center gap-3">
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Validando...</span>
              </>
            ) : "Entrar a OMNIA"}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </Button>
      </div>

      {onRegisterClick && (
        <div className="text-center">
          <p className="text-white/30 text-xs font-bold uppercase tracking-widest">
            ¿Nuevo en la comunidad?{" "}
            <button
              type="button"
              onClick={onRegisterClick}
              className="text-[#FF7939] hover:text-[#FFB56B] transition-colors ml-1 font-black"
            >
              Crea tu perfil
            </button>
          </p>
        </div>
      )}
    </form>
  )
}






























