"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function TestInsertButton() {
  const [activityId, setActivityId] = useState("1")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testInsert = async () => {
    try {
      setLoading(true)
      setError(null)
      setResult(null)

      // Probar el endpoint de inserción directa
      const response = await fetch("/api/direct-insert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ activityId: Number.parseInt(activityId) }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error en la inserción")
      }

      setResult(data)
      console.log("Resultado de la inserción:", data)
    } catch (err: any) {
      console.error("Error:", err)
      setError(err.message || "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const checkTable = async () => {
    try {
      setLoading(true)
      setError(null)
      setResult(null)

      // Verificar la tabla
      const response = await fetch("/api/check-table")

      const data = await response.json()

      setResult(data)
      console.log("Información de la tabla:", data)
    } catch (err: any) {
      console.error("Error:", err)
      setError(err.message || "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Prueba de Inserción</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="activity-id">ID de Actividad</Label>
          <Input
            id="activity-id"
            type="number"
            value={activityId}
            onChange={(e) => setActivityId(e.target.value)}
            min="1"
          />
        </div>

        <div className="flex space-x-2">
          <Button onClick={testInsert} disabled={loading} className="flex-1">
            {loading ? "Procesando..." : "Probar Inserción"}
          </Button>
          <Button onClick={checkTable} disabled={loading} variant="outline" className="flex-1">
            {loading ? "Verificando..." : "Verificar Tabla"}
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-md">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-4">
            <p className="font-medium mb-2">Resultado:</p>
            <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-60">
              <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
