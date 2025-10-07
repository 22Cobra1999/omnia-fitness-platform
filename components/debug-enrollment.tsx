"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export function DebugEnrollment() {
  const [activityId, setActivityId] = useState("")
  const [clientId, setClientId] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("credit_card")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setResponse(null)

    try {
      // Log para depuración
      console.log("Enviando datos:", {
        activityId: Number.parseInt(activityId),
        clientId,
        paymentMethod,
        notes,
      })

      const res = await fetch("/api/debug/enrollment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          activityId: Number.parseInt(activityId),
          clientId,
          paymentMethod,
          notes,
        }),
      })

      const data = await res.json()
      console.log("Respuesta:", data)

      if (res.ok) {
        setResponse(data)
        toast({
          title: "Prueba completada",
          description: "Revisa la consola y la respuesta para más detalles",
        })
      } else {
        setError(data.error || "Error desconocido")
        toast({
          title: "Error",
          description: data.error || "Ocurrió un error al procesar la solicitud",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Error:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Depuración de Inscripciones</CardTitle>
        <CardDescription>Prueba directa de inscripción a actividades</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="activityId">ID de Actividad</Label>
            <Input
              id="activityId"
              type="number"
              value={activityId}
              onChange={(e) => setActivityId(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientId">ID de Cliente (UUID)</Label>
            <Input
              id="clientId"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Método de Pago</Label>
            <Input
              id="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              "Probar Inscripción"
            )}
          </Button>
        </form>
      </CardContent>

      {(response || error) && (
        <CardFooter className="flex flex-col items-start">
          {error && (
            <div className="w-full p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm mb-3">
              <strong>Error:</strong> {error}
            </div>
          )}

          {response && (
            <div className="w-full">
              <h4 className="font-medium mb-2">Respuesta:</h4>
              <pre className="bg-slate-100 p-3 rounded-md text-xs overflow-auto max-h-60">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
