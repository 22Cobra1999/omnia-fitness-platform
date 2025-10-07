"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from '@/lib/supabase-browser'
import { toast } from "@/components/ui/use-toast"

export function ActivityForm({ user, existingActivity }: any) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    title: existingActivity?.title || "",
    description: existingActivity?.description || "",
    category: existingActivity?.category || "fitness",
    subcategory: existingActivity?.subcategory || "",
    level: existingActivity?.level || "All",
    duration_minutes: existingActivity?.duration_minutes || "60",
    format: existingActivity?.format || "Live",
    price: existingActivity?.price || "0",
    date: existingActivity?.date || "",
    time_start: existingActivity?.time_start || "",
    time_end: existingActivity?.time_end || "",
    tags: existingActivity?.tags?.join(", ") || "",
    visibility: existingActivity?.visibility || "Public",
    image_url: existingActivity?.image_url || "",
    video_url: existingActivity?.video_url || "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Prepare data for submission - simplify this process
      const submitData = {
        coach_id: user.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory,
        level: formData.level,
        duration_minutes: Number.parseInt(formData.duration_minutes) || 60,
        format: formData.format,
        price: Number.parseFloat(formData.price) || 0,
        date: formData.date || null,
        time_start: formData.time_start || null,
        time_end: formData.time_end || null,
        tags: formData.tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        visibility: formData.visibility,
        image_url: formData.image_url || null, // Añadir manejo explícito
        video_url: formData.video_url || null, // Añadir manejo explícito
        updated_at: new Date().toISOString(),
      }

      let response

      if (existingActivity) {
        // Update existing activity - simplify comparison logic
        response = await supabase.from("activities").update(submitData).eq("activity_id", existingActivity.activity_id)
      } else {
        // Create new activity
        response = await supabase.from("activities").insert([submitData])
      }

      if (response.error) throw response.error

      toast({
        title: existingActivity ? "Actividad actualizada" : "Actividad creada",
        description: "Tu actividad ha sido guardada correctamente.",
      })

      router.push("/coach/activities")
    } catch (error) {
      console.error("Error saving activity:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la actividad. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{existingActivity ? "Editar actividad" : "Nueva actividad"}</CardTitle>
        <CardDescription>
          {existingActivity ? "Actualiza los detalles de tu actividad" : "Crea una nueva actividad para tus clientes"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Título de la actividad"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe tu actividad..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fitness">Fitness</SelectItem>
                  <SelectItem value="nutrition">Nutrición</SelectItem>
                  <SelectItem value="wellness">Bienestar</SelectItem>
                  <SelectItem value="strength">Fuerza</SelectItem>
                  <SelectItem value="cardio">Cardio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategoría</Label>
              <Input
                id="subcategory"
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                placeholder="Subcategoría"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="level">Nivel</Label>
              <Select value={formData.level} onValueChange={(value) => handleSelectChange("level", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Principiante</SelectItem>
                  <SelectItem value="Intermediate">Intermedio</SelectItem>
                  <SelectItem value="Advanced">Avanzado</SelectItem>
                  <SelectItem value="All">Todos los niveles</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Formato</Label>
              <Select value={formData.format} onValueChange={(value) => handleSelectChange("format", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Live">En vivo</SelectItem>
                  <SelectItem value="On-demand">Bajo demanda</SelectItem>
                  <SelectItem value="Private">Privado</SelectItem>
                  <SelectItem value="Group">Grupal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration_minutes">Duración (minutos)</Label>
              <Input
                id="duration_minutes"
                name="duration_minutes"
                type="number"
                value={formData.duration_minutes}
                onChange={handleChange}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Precio ($)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time_start">Hora inicio</Label>
              <Input
                id="time_start"
                name="time_start"
                type="time"
                value={formData.time_start}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time_end">Hora fin</Label>
              <Input id="time_end" name="time_end" type="time" value={formData.time_end} onChange={handleChange} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Etiquetas</Label>
            <Input
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="yoga, meditación, fuerza (separadas por comas)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visibility">Visibilidad</Label>
            <Select value={formData.visibility} onValueChange={(value) => handleSelectChange("visibility", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona la visibilidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Public">Pública</SelectItem>
                <SelectItem value="Subscribers only">Solo suscriptores</SelectItem>
                <SelectItem value="Private">Privada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Añadir estos campos al formulario */}
          <div className="space-y-2">
            <Label htmlFor="image_url">URL de imagen</Label>
            <Input
              id="image_url"
              name="image_url"
              value={formData.image_url || ""}
              onChange={handleChange}
              placeholder="https://ejemplo.com/imagen.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video_url">URL de video</Label>
            <Input
              id="video_url"
              name="video_url"
              value={formData.video_url || ""}
              onChange={handleChange}
              placeholder="https://ejemplo.com/video.mp4"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Guardando..." : existingActivity ? "Actualizar actividad" : "Crear actividad"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
