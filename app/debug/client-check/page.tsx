"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ClientCheckPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [createClientLoading, setCreateClientLoading] = useState(false)

  const checkClientStatus = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/debug/client-check")
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al verificar estado del cliente")
      }

      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const createClientRecord = async () => {
    if (!data?.user?.id) {
      setError("No hay usuario autenticado")
      return
    }

    setCreateClientLoading(true)
    try {
      const response = await fetch("/api/debug/create-client", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: data.user.id,
          fullName: data.user.email?.split("@")[0] || "Cliente",
          email: data.user.email,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al crear registro de cliente")
      }

      // Actualizar el estado
      await checkClientStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setCreateClientLoading(false)
    }
  }

  useEffect(() => {
    checkClientStatus()
  }, [])

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Diagnóstico de Cliente</h1>

      <div className="mb-4 flex gap-4">
        <Button onClick={checkClientStatus} disabled={loading}>
          {loading ? "Verificando..." : "Verificar estado"}
        </Button>

        {data && !data.clientExists && (
          <Button onClick={createClientRecord} disabled={createClientLoading} variant="secondary">
            {createClientLoading ? "Creando..." : "Crear registro de cliente"}
          </Button>
        )}
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      {data && (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Información del usuario</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <div>
                  <strong>ID:</strong> {data.user.id}
                </div>
                <div>
                  <strong>Email:</strong> {data.user.email}
                </div>
                <div>
                  <strong>Rol:</strong> {data.user.role}
                </div>
                <div className={data.clientExists ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                  {data.message}
                </div>
              </div>
            </CardContent>
          </Card>

          {data.clientExists && data.clientData && (
            <Card>
              <CardHeader>
                <CardTitle>Datos del cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
                  {JSON.stringify(data.clientData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Inscripciones ({data.enrollments?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {data.enrollments?.length > 0 ? (
                <div className="overflow-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actividad ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.enrollments.map((enrollment: any) => (
                        <tr key={enrollment.id}>
                          <td className="px-6 py-4 whitespace-nowrap">{enrollment.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{enrollment.activity_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{enrollment.status}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {new Date(enrollment.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-gray-500">No hay inscripciones</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
