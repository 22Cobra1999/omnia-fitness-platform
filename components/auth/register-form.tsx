"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

interface RegisterFormProps {
  onSuccess?: () => void
  onLoginClick?: () => void
}

export function RegisterForm({ onSuccess, onLoginClick }: RegisterFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [height, setHeight] = useState("")
  const [weight, setWeight] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [role, setRole] = useState<"client" | "coach">("client")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      setLoading(false)
      return
    }

    // Validar campos físicos solo si es cliente
    let ageNum = 0
    let heightNum = 0
    let weightNum = 0

    if (role === 'client') {
      if (!height || !weight || !birthDate) {
        setError("Por favor completá todos los campos")
        setLoading(false)
        return
      }

      // Calcular edad automáticamente
      const today = new Date()
      const birth = new Date(birthDate)
      ageNum = today.getFullYear() - birth.getFullYear()
      const m = today.getMonth() - birth.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        ageNum--
      }

      if (ageNum < 13 || ageNum > 120) {
        setError("Debes tener entre 13 y 120 años para registrarte")
        setLoading(false)
        return
      }

      heightNum = parseInt(height)
      weightNum = parseFloat(weight)

      if (heightNum < 100 || heightNum > 250) {
        setError("La altura debe estar entre 100 y 250 cm")
        setLoading(false)
        return
      }

      if (weightNum < 30 || weightNum > 300) {
        setError("El peso debe estar entre 30 y 300 kg")
        setLoading(false)
        return
      }
    }

    try {
      const { error: signUpError } = await signUp(
        email,
        password,
        fullName,
        role === 'client' ? {
          age: ageNum,
          height: heightNum,
          weight: weightNum,
          birthDate: birthDate
        } : undefined,
        role
      )

      if (signUpError) {
        setError(typeof signUpError === 'string' ? signUpError : (signUpError as any).message)
        return
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/auth/login")
      }
    } catch (err: any) {
      setError(err?.message || "Error al crear la cuenta")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-medium text-center"
        >
          {error}
        </motion.div>
      )}

      {/* Role Selection */}
      <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10 mb-2">
        <button
          type="button"
          onClick={() => setRole("client")}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${role === "client" ? "bg-[#FF7939] text-white shadow-lg" : "text-white/40 hover:text-white/60"}`}
        >
          Soy Cliente
        </button>
        <button
          type="button"
          onClick={() => setRole("coach")}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${role === "coach" ? "bg-[#FF7939] text-white shadow-lg" : "text-white/40 hover:text-white/60"}`}
        >
          Soy Coach
        </button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-white/40 font-bold text-xs uppercase tracking-widest ml-1">Nombre completo</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Juan Pérez"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="bg-white/5 border-white/10 text-white h-14 rounded-2xl focus:ring-2 focus:ring-[#FF7939]/30 focus:border-[#FF7939]/50 transition-all placeholder:text-white/20 font-medium px-5"
          />
        </div>

        {role === "client" && (
          <>
            {/* Datos físicos solo para clientes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height" className="text-white/40 font-bold text-xs uppercase tracking-widest ml-1">Altura (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="170"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  required
                  min="100"
                  max="250"
                  className="bg-white/5 border-white/10 text-white h-14 rounded-2xl focus:ring-2 focus:ring-[#FF7939]/30 focus:border-[#FF7939]/50 transition-all placeholder:text-white/20 font-medium px-5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight" className="text-white/40 font-bold text-xs uppercase tracking-widest ml-1">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="70"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  required
                  min="30"
                  max="300"
                  className="bg-white/5 border-white/10 text-white h-14 rounded-2xl focus:ring-2 focus:ring-[#FF7939]/30 focus:border-[#FF7939]/50 transition-all placeholder:text-white/20 font-medium px-5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate" className="text-white/40 font-bold text-xs uppercase tracking-widest ml-1">Fecha de nacimiento</Label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white h-14 rounded-2xl focus:ring-2 focus:ring-[#FF7939]/30 focus:border-[#FF7939]/50 transition-all font-medium px-5 text-white"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </>
        )}

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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/40 font-bold text-xs uppercase tracking-widest ml-1">Contraseña</Label>
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-white/40 font-bold text-xs uppercase tracking-widest ml-1">Repetir</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="bg-white/5 border-white/10 text-white h-14 rounded-2xl focus:ring-2 focus:ring-[#FF7939]/30 focus:border-[#FF7939]/50 transition-all placeholder:text-white/20 font-medium px-5"
            />
          </div>
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
                <span>Creando cuenta...</span>
              </>
            ) : role === 'coach' ? "Unirme como Coach" : "Unirme a OMNIA"}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </Button>
      </div>

      {onLoginClick && (
        <div className="text-center">
          <p className="text-white/30 text-xs font-bold uppercase tracking-widest">
            ¿Ya tienes cuenta?{" "}
            <button
              type="button"
              onClick={onLoginClick}
              className="text-[#FF7939] hover:text-[#FFB56B] transition-colors ml-1 font-black"
            >
              Inicia sesión aquí
            </button>
          </p>
        </div>
      )}
    </form>
  )
}






























