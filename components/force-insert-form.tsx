"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { forceInsertEnrollment } from "@/app/actions/force-insert-enrollment"

export function ForceInsertForm() {
  const [activityId, setActivityId] = useState("1")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)
      setError(null)
      setResult(null)

      // Usar el Server Action para forzar la inserción
      const result = await forceInsertEnrollment({
        activityId: Number.parseInt(activityId),
      })

      console.log("Resultado de la inserción forzada:", result)

      if (!result.success) {
        throw new Error(result.error || "Error en la inserción forzada")
      }

      setResult(result)
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
        <CardTitle>Forzar Inserción (Server Action)</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="activity-id-force">ID de Actividad</Label>
            <Input
              id="activity-id-force"
              type="number"
              value={activityId}
              onChange={(e) => setActivityId(e.target.value)}
              min="1"
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Procesando..." : "Forzar Inserción"}
          </Button>

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
        </form>
      </CardContent>
    </Card>
  )
}
