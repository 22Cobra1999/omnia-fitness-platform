"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react"

export function DebugCoaches() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDebugData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/debug/coaches")

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
      console.error("Error en diagnóstico:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDebugData()
  }, [])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Diagnóstico de Coaches</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchDebugData} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Actualizar
          </Button>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Cargando diagnóstico...</span>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 p-4 rounded-md flex items-start">
              <AlertTriangle className="h-5 w-5 text-destructive mr-2 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Error en el diagnóstico</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          )}

          {data && !loading && !error && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${data.isAuthenticated ? "bg-green-500" : "bg-red-500"}`}></div>
                <span className="font-medium">{data.isAuthenticated ? "Autenticado" : "No autenticado"}</span>
                {data.userId && <span className="text-xs text-muted-foreground">({data.userId})</span>}
              </div>

              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Coaches ({data.coachesCount})</h3>
                {data.coaches.length > 0 ? (
                  <ul className="space-y-2">
                    {data.coaches.map((coach: any) => (
                      <li key={coach.id} className="text-sm">
                        <span className="font-medium">{coach.id}</span>
                        {coach.specialization && (
                          <span className="text-muted-foreground ml-2">({coach.specialization})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No se encontraron coaches</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Tablas ({data.tables?.length || 0})</h3>
                  {data.tables && data.tables.length > 0 ? (
                    <ul className="text-sm space-y-1">
                      {data.tables.map((table: any, index: number) => (
                        <li key={index}>{table.table_name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {data.tablesError ? "Error al obtener tablas" : "No se encontraron tablas"}
                    </p>
                  )}
                </div>

                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Políticas ({data.policies?.length || 0})</h3>
                  {data.policies && data.policies.length > 0 ? (
                    <ul className="text-sm space-y-1">
                      {data.policies.map((policy: any, index: number) => (
                        <li key={index}>{policy.policyname || policy.name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {data.policiesError ? "Error al obtener políticas" : "No se encontraron políticas"}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Diagnóstico generado: {new Date(data.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
