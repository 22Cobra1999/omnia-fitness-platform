"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DebugEnrollments() {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEnrollments = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/enrollments")

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`)
      }

      const data = await response.json()
      setEnrollments(data)
      console.log("Enrollments data:", data)
    } catch (err: any) {
      console.error("Error fetching enrollments:", err)
      setError(err.message || "Error al cargar las inscripciones")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEnrollments()
  }, [])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Depuración de Inscripciones
          <Button variant="outline" size="sm" onClick={fetchEnrollments} disabled={loading}>
            {loading ? "Cargando..." : "Actualizar"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && <div className="bg-red-50 p-4 rounded-md text-red-600 mb-4">Error: {error}</div>}

        <div className="text-sm">
          <p>Total de inscripciones: {enrollments.length}</p>
        </div>

        {enrollments.length > 0 ? (
          <div className="mt-4 border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actividad
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{enrollment.id}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{enrollment.activities?.title || "N/A"}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{enrollment.status}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {new Date(enrollment.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {loading ? "Cargando inscripciones..." : "No se encontraron inscripciones"}
          </div>
        )}

        <div className="mt-4">
          <details>
            <summary className="cursor-pointer text-sm text-gray-500">Ver datos completos (JSON)</summary>
            <pre className="mt-2 p-4 bg-gray-50 rounded-md overflow-auto text-xs">
              {JSON.stringify(enrollments, null, 2)}
            </pre>
          </details>
        </div>
      </CardContent>
    </Card>
  )
}
