"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function SetupStorageAdmin() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<boolean | null>(null)
  const [message, setMessage] = useState("")
  const { toast } = useToast()

  const setupStorage = async () => {
    setLoading(true)
    setSuccess(null)
    setMessage("")

    try {
      const response = await fetch("/api/storage/admin-setup", {
        method: "POST",
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSuccess(true)
        setMessage(result.message || "Almacenamiento configurado correctamente")
        toast({
          title: "Éxito",
          description: "Almacenamiento configurado correctamente",
        })
      } else {
        setSuccess(false)
        setMessage(result.error || "Error al configurar almacenamiento")
        toast({
          title: "Error",
          description: result.error || "Error al configurar almacenamiento",
          variant: "destructive",
        })
      }
    } catch (error) {
      setSuccess(false)
      setMessage(error instanceof Error ? error.message : "Error desconocido")
      toast({
        title: "Error",
        description: "No se pudo completar la configuración",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Configurar almacenamiento (Admin)</CardTitle>
        <CardDescription>Configura el almacenamiento de Supabase utilizando la clave de servicio</CardDescription>
      </CardHeader>
      <CardContent>
        {success === true && (
          <div className="flex items-start gap-3 p-3 rounded-md bg-green-50 border border-green-200 mb-4">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-green-700">Configuración exitosa</h3>
              <p className="text-sm text-green-600">{message}</p>
            </div>
          </div>
        )}

        {success === false && (
          <div className="flex items-start gap-3 p-3 rounded-md bg-red-50 border border-red-200 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-700">Error en la configuración</h3>
              <p className="text-sm text-red-600">{message}</p>
            </div>
          </div>
        )}

        <p className="text-sm text-gray-600 mb-4">
          Este proceso configurará el bucket "coach-content" en Supabase Storage utilizando la clave de servicio, lo que
          omitirá las políticas RLS. Esto permitirá subir archivos PDF sin problemas.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={setupStorage} disabled={loading} className="bg-orange-600 hover:bg-orange-700">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Configurando...
            </>
          ) : (
            "Configurar almacenamiento"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
