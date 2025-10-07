"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from '@/lib/supabase-browser'

export function RunVimeoMigration() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const runMigration = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      // Obtener el script SQL
      const response = await fetch("/api/admin/run-migration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          migrationFile: "add-vimeo-id-column.sql",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al ejecutar la migración")
      }

      const data = await response.json()

      // Actualizar la caché del esquema de Supabase
      await supabase.rpc("reload_schema_cache")

      setSuccess(true)
      toast({
        title: "Migración completada",
        description: "La columna vimeo_id ha sido añadida correctamente",
      })
    } catch (err) {
      console.error("Error en la migración:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Migración de Vimeo ID</CardTitle>
        <CardDescription>
          Añade la columna vimeo_id a la tabla activities para almacenar los IDs de videos de Vimeo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-4">
          Esta migración añadirá una nueva columna <code>vimeo_id</code> a la tabla <code>activities</code> para
          almacenar los IDs de videos de Vimeo para la presentación de productos.
        </p>
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-md">
            <CheckCircle className="h-5 w-5" />
            <span>Migración completada correctamente</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={runMigration} disabled={loading || success} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Ejecutando migración...
            </>
          ) : success ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Migración completada
            </>
          ) : (
            "Ejecutar migración"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
