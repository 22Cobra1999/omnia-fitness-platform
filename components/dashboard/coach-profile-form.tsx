"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { createClient } from '@/lib/supabase-browser'
import { toast } from "@/components/ui/use-toast"

export function CoachProfileForm({ user, existingProfile }: any) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    bio: existingProfile?.bio || "",
    specialties: existingProfile?.specialties?.join(", ") || "",
    experience_years: existingProfile?.experience_years || "",
    certifications: existingProfile?.certifications?.join(", ") || "",
    hourly_rate: existingProfile?.hourly_rate || "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Prepare data for submission
      const submitData = {
        user_id: user.id,
        bio: formData.bio,
        specialties: formData.specialties
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        experience_years: Number.parseInt(formData.experience_years) || 0,
        certifications: formData.certifications
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        hourly_rate: Number.parseFloat(formData.hourly_rate) || 0,
        updated_at: new Date(),
      }

      let response

      if (existingProfile) {
        // Update existing profile
        response = await supabase.from("coach_profiles").update(submitData).eq("user_id", user.id)
      } else {
        // Create new profile
        response = await supabase.from("coach_profiles").insert([submitData])
      }

      if (response.error) throw response.error

      toast({
        title: existingProfile ? "Perfil actualizado" : "Perfil creado",
        description: "Tu perfil de coach ha sido guardado correctamente.",
      })

      router.refresh()
    } catch (error) {
      console.error("Error saving coach profile:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el perfil. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil de Coach</CardTitle>
        <CardDescription>Completa tu perfil para que los clientes puedan conocerte mejor</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bio">Biografía</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Cuéntanos sobre ti y tu experiencia..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialties">Especialidades</Label>
            <Input
              id="specialties"
              name="specialties"
              value={formData.specialties}
              onChange={handleChange}
              placeholder="Nutrición, Fuerza, Cardio (separadas por comas)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience_years">Años de experiencia</Label>
            <Input
              id="experience_years"
              name="experience_years"
              type="number"
              value={formData.experience_years}
              onChange={handleChange}
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="certifications">Certificaciones</Label>
            <Input
              id="certifications"
              name="certifications"
              value={formData.certifications}
              onChange={handleChange}
              placeholder="Personal Trainer, Nutrición Deportiva (separadas por comas)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hourly_rate">Tarifa por hora ($)</Label>
            <Input
              id="hourly_rate"
              name="hourly_rate"
              type="number"
              value={formData.hourly_rate}
              onChange={handleChange}
              min="0"
              step="0.01"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Guardando..." : existingProfile ? "Actualizar perfil" : "Crear perfil"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
