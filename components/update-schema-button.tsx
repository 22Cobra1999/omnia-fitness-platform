"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function UpdateSchemaButton() {
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

  const updateSchema = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch("/api/db/update-schema", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al actualizar el esquema")
      }

      const result = await response.json()

      toast({
        title: "Éxito",
        description: "Esquema de base de datos actualizado correctamente",
      })
    } catch (error) {
      console.error("Error al actualizar el esquema:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar el esquema",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Button onClick={updateSchema} disabled={isUpdating} className="bg-orange-600 hover:bg-orange-700 text-white">
      {isUpdating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Actualizando...
        </>
      ) : (
        "Actualizar Esquema de Base de Datos"
      )}
    </Button>
  )
}
