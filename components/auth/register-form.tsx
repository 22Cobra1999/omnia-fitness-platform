"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
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
  const [height, setHeight] = useState("")
  const [weight, setWeight] = useState("")
  const [birthDate, setBirthDate] = useState("")
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

    // Validar campos físicos
    if (!height || !weight || !birthDate) {
      setError("Por favor completá todos los campos")
      setLoading(false)
      return
    }

    // Calcular edad automáticamente
    const today = new Date()
    const birth = new Date(birthDate)
    let ageNum = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      ageNum--
    }

    if (ageNum < 13 || ageNum > 120) {
      setError("Debes tener entre 13 y 120 años para registrarte")
      setLoading(false)
      return
    }

    const heightNum = parseInt(height)
    const weightNum = parseFloat(weight)

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

    try {
      const { error: signUpError } = await signUp(email, password, fullName, {
        age: ageNum,
        height: heightNum,
        weight: weightNum,
        birthDate: birthDate
      })

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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-gray-400">Nombre completo</Label>
        <Input
          id="fullName"
          type="text"
          placeholder="Juan Pérez"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="bg-white/5 border-white/10 text-white h-11"
        />
      </div>

      {/* Datos físicos en grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="height" className="text-xs text-gray-400">Altura (cm)</Label>
          <Input
            id="height"
            type="number"
            placeholder="170"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            required
            min="100"
            max="250"
            className="bg-white/5 border-white/10 text-white h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight" className="text-xs text-gray-400">Peso (kg)</Label>
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
            className="bg-white/5 border-white/10 text-white h-11"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="birthDate" className="text-gray-400">Fecha de nacimiento</Label>
        <Input
          id="birthDate"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          required
          className="bg-white/5 border-white/10 text-white h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-gray-400">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-white/5 border-white/10 text-white h-11"
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
          className="bg-white/5 border-white/10 text-white h-11"
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
          className="bg-white/5 border-white/10 text-white h-11"
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






























