"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

type ActivityFormProps = {
  activityId?: string
  defaultValues?: any
}

export function ActivityForm({ activityId, defaultValues = {} }: ActivityFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    category: "Fitness",
    subcategory: "",
    description: "",
    level: "Beginner",
    duration_minutes: 60,
    format: "On-demand",
    price: 0,
    date: "",
    time_start: "",
    time_end: "",
    language: "Español",
    frequency: "Única",
    cover_url: "",
    visibility: "Public",
    ...defaultValues,
  })

  const isEditing = !!activityId

  useEffect(() => {
    if (isEditing && !defaultValues.title) {
      // Cargar datos de la actividad si estamos editando
      const fetchActivity = async () => {
        try {
          const response = await fetch(`/api/activities/${activityId}`)
          const data = await response.json()

          if (response.ok) {
            setFormData({
              ...formData,
              ...data.activity,
            })
          } else {
            setError(data.error || "Error al cargar la actividad")
          }
        } catch (error) {
          setError("Error al cargar la actividad")
        }
      }

      fetchActivity()
    }
  }, [activityId, isEditing, defaultValues])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked ? "Subscribers only" : "Public",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setError("Debes iniciar sesión para crear actividades")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const url = isEditing ? `/api/activities/${activityId}` : "/api/activities"

      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        // Redirigir a la página de la actividad
        router.push(isEditing ? `/activities/${activityId}` : `/activities/${data.activity.activity_id}`)
      } else {
        setError(data.error || "Error al guardar la actividad")
      }
    } catch (error) {
      setError("Error al guardar la actividad")
    } finally {
      setLoading(false)
    }
  }

  const fitnessSubcategories = [
    "Cardio",
    "Fuerza",
    "HIIT",
    "Stretching",
    "Yoga",
    "Mindfulness",
    "Hábitos saludables",
    "Deportes específicos",
  ]

  const nutritionSubcategories = [
    "Batch cooking",
    "Comidas rápidas saludables",
    "Planificación semanal",
    "Comer consciente",
  ]

  const subcategories = formData.category === "Fitness" ? fitnessSubcategories : nutritionSubcategories

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? "Editar actividad" : "Crear nueva actividad"}</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {error && <div className="bg-red-50 text-red-500 p-3 rounded-md">{error}</div>}

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoría *</Label>
                <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fitness">Fitness</SelectItem>
                    <SelectItem value="Nutrition">Nutrición</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subcategory">Subcategoría</Label>
                <Select
                  value={formData.subcategory}
                  onValueChange={(value) => handleSelectChange("subcategory", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una subcategoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories.map((sub) => (
                      <SelectItem key={sub} value={sub}>
                        {sub}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration_minutes">Duración (minutos)</Label>
                <Input
                  id="duration_minutes"
                  name="duration_minutes"
                  type="number"
                  value={formData.duration_minutes}
                  onChange={handleChange}
                />
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

              <div className="space-y-2">
                <Label htmlFor="price">Precio (USD)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time_start">Hora de inicio</Label>
                <Input
                  id="time_start"
                  name="time_start"
                  type="time"
                  value={formData.time_start}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time_end">Hora de fin</Label>
                <Input id="time_end" name="time_end" type="time" value={formData.time_end} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">Idioma</Label>
                <Input id="language" name="language" value={formData.language} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Frecuencia</Label>
                <Select value={formData.frequency} onValueChange={(value) => handleSelectChange("frequency", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una frecuencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Única">Única</SelectItem>
                    <SelectItem value="Semanal">Semanal</SelectItem>
                    <SelectItem value="Mensual">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover_url">URL de imagen de portada</Label>
              <Input
                id="cover_url"
                name="cover_url"
                value={formData.cover_url}
                onChange={handleChange}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="visibility"
                checked={formData.visibility === "Subscribers only"}
                onCheckedChange={(checked) => handleSwitchChange("visibility", checked)}
              />
              <Label htmlFor="visibility">Solo para suscriptores</Label>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>

          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : isEditing ? "Actualizar" : "Crear actividad"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
