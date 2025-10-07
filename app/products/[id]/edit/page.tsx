"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Plus, Trash } from "lucide-react"
import { createClient } from '@/lib/supabase-browser'
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingProduct, setLoadingProduct] = useState(true)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "pdf",
    price: "",
    image_url: "",
    is_public: true,
    availability_type: "immediate_purchase",
    preview_video_url: "",

    // Campos específicos para PDF
    pdf_url: "",

    // Campos específicos para Video
    video_url: "",
    interactive_pauses: [{ time: "", description: "" }],

    // Campos específicos para Taller
    session_type: "individual",
    available_slots: "10",
    available_times: [{ date: "", start_time: "", end_time: "" }],
  })

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoadingProduct(true)

        // Obtener el usuario actual
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          toast({
            title: "Error de autenticación",
            description: "Por favor inicia sesión para editar productos",
            variant: "destructive",
          })
          router.push("/auth/login")
          return
        }

        // Obtener el producto
        const { data, error } = await supabase.from("activities").select("*").eq("id", params.id).single()

        if (error) {
          throw error
        }

        if (!data) {
          toast({
            title: "Error",
            description: "Producto no encontrado",
            variant: "destructive",
          })
          router.push("/products")
          return
        }

        // Verificar que el producto pertenece al usuario
        if (data.coach_id !== user.id) {
          toast({
            title: "Acceso denegado",
            description: "No tienes permiso para editar este producto",
            variant: "destructive",
          })
          router.push("/products")
          return
        }

        // Actualizar el formulario con los datos del producto
        setFormData({
          title: data.title || "",
          description: data.description || "",
          type: data.type || "pdf",
          price: data.price ? data.price.toString() : "",
          image_url: data.image_url || "",
          is_public: data.is_public !== undefined ? data.is_public : true,
          availability_type: data.availability_type || "immediate_purchase",
          preview_video_url: data.preview_video_url || "",

          // Campos específicos para PDF
          pdf_url: data.pdf_url || "",

          // Campos específicos para Video
          video_url: data.video_url || "",
          interactive_pauses: data.interactive_pauses || [{ time: "", description: "" }],

          // Campos específicos para Taller
          session_type: data.session_type || "individual",
          available_slots: data.available_slots ? data.available_slots.toString() : "10",
          available_times: data.available_times || [{ date: "", start_time: "", end_time: "" }],
        })
      } catch (error) {
        console.error("Error fetching product:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar el producto",
          variant: "destructive",
        })
        router.push("/products")
      } finally {
        setLoadingProduct(false)
      }
    }

    fetchProduct()
  }, [params.id, router, supabase, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleBooleanChange = (name: string, value: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Manejadores para campos de arreglos
  const handlePauseChange = (index: number, field: string, value: string) => {
    const updatedPauses = [...formData.interactive_pauses]
    updatedPauses[index] = { ...updatedPauses[index], [field]: value }
    setFormData((prev) => ({ ...prev, interactive_pauses: updatedPauses }))
  }

  const addPause = () => {
    setFormData((prev) => ({
      ...prev,
      interactive_pauses: [...prev.interactive_pauses, { time: "", description: "" }],
    }))
  }

  const removePause = (index: number) => {
    const updatedPauses = [...formData.interactive_pauses]
    updatedPauses.splice(index, 1)
    setFormData((prev) => ({ ...prev, interactive_pauses: updatedPauses }))
  }

  const handleTimeSlotChange = (index: number, field: string, value: string) => {
    const updatedTimes = [...formData.available_times]
    updatedTimes[index] = { ...updatedTimes[index], [field]: value }
    setFormData((prev) => ({ ...prev, available_times: updatedTimes }))
  }

  const addTimeSlot = () => {
    setFormData((prev) => ({
      ...prev,
      available_times: [...prev.available_times, { date: "", start_time: "", end_time: "" }],
    }))
  }

  const removeTimeSlot = (index: number) => {
    const updatedTimes = [...formData.available_times]
    updatedTimes.splice(index, 1)
    setFormData((prev) => ({ ...prev, available_times: updatedTimes }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)

      // Validar campos requeridos
      if (!formData.title || !formData.price) {
        toast({
          title: "Error",
          description: "Por favor completa todos los campos requeridos",
          variant: "destructive",
        })
        return
      }

      // Validaciones específicas por tipo
      if (formData.type === "pdf" && !formData.pdf_url) {
        toast({
          title: "Error",
          description: "Por favor ingresa la URL del archivo PDF",
          variant: "destructive",
        })
        return
      }

      if (formData.type === "video" && !formData.video_url) {
        toast({
          title: "Error",
          description: "Por favor ingresa la URL del video",
          variant: "destructive",
        })
        return
      }

      if (formData.type === "workshop" && formData.available_times.length === 0) {
        toast({
          title: "Error",
          description: "Por favor agrega al menos un horario disponible",
          variant: "destructive",
        })
        return
      }

      // Obtener el usuario actual
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        toast({
          title: "Error de autenticación",
          description: "Por favor inicia sesión para editar productos",
          variant: "destructive",
        })
        router.push("/auth/login")
        return
      }

      // Preparar datos para enviar
      const activityData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        price: formData.price ? Number.parseFloat(formData.price) : 0,
        image_url: formData.image_url || null,
        is_public: formData.is_public,
        availability_type: formData.availability_type,
        preview_video_url: formData.preview_video_url || null,

        // Campos específicos según el tipo
        pdf_url: formData.type === "pdf" ? formData.pdf_url : null,

        video_url: formData.type === "video" ? formData.video_url : null,
        interactive_pauses: formData.type === "video" ? formData.interactive_pauses : null,

        session_type: formData.type === "workshop" ? formData.session_type : null,
        available_slots: formData.type === "workshop" ? Number.parseInt(formData.available_slots) : null,
        available_times: formData.type === "workshop" ? formData.available_times : null,

        updated_at: new Date().toISOString(),
      }

      // Actualizar en la base de datos
      const { error } = await supabase
        .from("activities")
        .update(activityData)
        .eq("id", params.id)
        .eq("coach_id", user.id)

      if (error) {
        throw error
      }

      toast({
        title: "Éxito",
        description: "Producto actualizado correctamente",
      })

      // Redirigir a la página de productos
      router.push("/products")
    } catch (error) {
      console.error("Error updating product:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingProduct) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Editar Producto</h1>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Información del Producto</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Tipo de producto */}
            <div className="space-y-2">
              <Label>Tipo de Producto</Label>
              <Tabs
                value={formData.type}
                onValueChange={(value) => handleSelectChange("type", value)}
                className="w-full"
              >
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="pdf">PDF</TabsTrigger>
                  <TabsTrigger value="video">Video</TabsTrigger>
                  <TabsTrigger value="workshop">Taller</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Campos comunes para todos los tipos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Precio *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="availability_type">Tipo de disponibilidad</Label>
                <Select
                  value={formData.availability_type}
                  onValueChange={(value) => handleSelectChange("availability_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de disponibilidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate_purchase">Compra inmediata</SelectItem>
                    <SelectItem value="check_availability">Consultar disponibilidad</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">URL de la imagen</Label>
                <Input
                  id="image_url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleChange}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preview_video_url">URL del video de presentación (Vimeo)</Label>
              <Input
                id="preview_video_url"
                name="preview_video_url"
                value={formData.preview_video_url}
                onChange={handleChange}
                placeholder="https://vimeo.com/123456789"
              />
              <p className="text-xs text-gray-500">
                Este video se mostrará como presentación del producto a los clientes.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_public"
                checked={formData.is_public}
                onCheckedChange={(checked) => handleBooleanChange("is_public", checked)}
              />
              <Label htmlFor="is_public">Producto activo</Label>
            </div>

            {/* Campos específicos para PDF */}
            {formData.type === "pdf" && (
              <div className="space-y-2 border p-4 rounded-md">
                <h3 className="font-medium text-lg mb-2">Información específica para PDF</h3>
                <div className="space-y-2">
                  <Label htmlFor="pdf_url">URL del archivo PDF *</Label>
                  <Input
                    id="pdf_url"
                    name="pdf_url"
                    value={formData.pdf_url}
                    onChange={handleChange}
                    placeholder="https://ejemplo.com/archivo.pdf"
                    required={formData.type === "pdf"}
                  />
                </div>
              </div>
            )}

            {/* Campos específicos para Video */}
            {formData.type === "video" && (
              <div className="space-y-4 border p-4 rounded-md">
                <h3 className="font-medium text-lg mb-2">Información específica para Video</h3>
                <div className="space-y-2">
                  <Label htmlFor="video_url">URL del video *</Label>
                  <Input
                    id="video_url"
                    name="video_url"
                    value={formData.video_url}
                    onChange={handleChange}
                    placeholder="https://ejemplo.com/video.mp4"
                    required={formData.type === "video"}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Pausas interactivas</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addPause}>
                      <Plus className="h-4 w-4 mr-1" /> Agregar pausa
                    </Button>
                  </div>

                  {formData.interactive_pauses.map((pause, index) => (
                    <div key={index} className="flex gap-2 items-start border p-2 rounded-md">
                      <div className="flex-1">
                        <Label htmlFor={`pause-time-${index}`} className="text-xs">
                          Tiempo (segundos)
                        </Label>
                        <Input
                          id={`pause-time-${index}`}
                          type="number"
                          value={pause.time}
                          onChange={(e) => handlePauseChange(index, "time", e.target.value)}
                          placeholder="60"
                        />
                      </div>
                      <div className="flex-[3]">
                        <Label htmlFor={`pause-desc-${index}`} className="text-xs">
                          Descripción
                        </Label>
                        <Input
                          id={`pause-desc-${index}`}
                          value={pause.description}
                          onChange={(e) => handlePauseChange(index, "description", e.target.value)}
                          placeholder="Pregunta o tarea para el usuario"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-5"
                        onClick={() => removePause(index)}
                        disabled={formData.interactive_pauses.length <= 1}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Campos específicos para Taller */}
            {formData.type === "workshop" && (
              <div className="space-y-4 border p-4 rounded-md">
                <h3 className="font-medium text-lg mb-2">Información específica para Taller</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="session_type">Tipo de sesión</Label>
                    <Select
                      value={formData.session_type}
                      onValueChange={(value) => handleSelectChange("session_type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo de sesión" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="group">Grupal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="available_slots">Cupos disponibles</Label>
                    <Input
                      id="available_slots"
                      name="available_slots"
                      type="number"
                      value={formData.available_slots}
                      onChange={handleChange}
                      min="1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Horarios disponibles</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addTimeSlot}>
                      <Plus className="h-4 w-4 mr-1" /> Agregar horario
                    </Button>
                  </div>

                  {formData.available_times.map((timeSlot, index) => (
                    <div key={index} className="flex gap-2 items-start border p-2 rounded-md">
                      <div className="flex-1">
                        <Label htmlFor={`date-${index}`} className="text-xs">
                          Fecha
                        </Label>
                        <Input
                          id={`date-${index}`}
                          type="date"
                          value={timeSlot.date}
                          onChange={(e) => handleTimeSlotChange(index, "date", e.target.value)}
                        />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor={`start-time-${index}`} className="text-xs">
                          Hora inicio
                        </Label>
                        <Input
                          id={`start-time-${index}`}
                          type="time"
                          value={timeSlot.start_time}
                          onChange={(e) => handleTimeSlotChange(index, "start_time", e.target.value)}
                        />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor={`end-time-${index}`} className="text-xs">
                          Hora fin
                        </Label>
                        <Input
                          id={`end-time-${index}`}
                          type="time"
                          value={timeSlot.end_time}
                          onChange={(e) => handleTimeSlotChange(index, "end_time", e.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-5"
                        onClick={() => removeTimeSlot(index)}
                        disabled={formData.available_times.length <= 1}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push("/products")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
