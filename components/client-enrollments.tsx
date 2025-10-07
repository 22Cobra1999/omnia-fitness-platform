"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/utils/formatDate"
import Link from "next/link"

type Enrollment = {
  id: number
  status: string
  payment_status: string
  progress: number
  created_at: string
  updated_at: string
  completed_at: string | null
  amount_paid: number
  activities: {
    id: number
    title: string
    description: string
    image_url: string
    price: number
    type: string
    coach_id: string
    duration: number
  }
}

export function ClientEnrollments() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        setLoading(true)
        setError(null)

        // No necesitamos pasar el clientId, la API usará el usuario autenticado
        const response = await fetch(`/api/enrollments`)

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${await response.text()}`)
        }

        const data = await response.json()
        setEnrollments(data)
      } catch (err: any) {
        console.error("Error fetching enrollments:", err)
        setError(err.message || "Error al cargar las inscripciones")
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchEnrollments()
    } else {
      setLoading(false)
      setEnrollments([])
    }
  }, [user])

  if (loading) {
    return (
      <div className="p-4">
        <div className="h-24 bg-gray-200 animate-pulse rounded-md mb-4"></div>
        <div className="h-24 bg-gray-200 animate-pulse rounded-md"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 border border-red-300 rounded-md">
        <p>Error: {error}</p>
        <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-4 text-center">
        <p className="mb-4">Inicia sesión para ver tus actividades</p>
        <Link href="/auth/login">
          <Button>Iniciar sesión</Button>
        </Link>
      </div>
    )
  }

  if (enrollments.length === 0) {
    return (
      <div className="p-4 text-center border border-gray-200 rounded-md">
        <p className="mb-4">No tienes actividades inscritas</p>
        <Link href="/activities">
          <Button>Explorar actividades</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Mis Actividades</h2>
      {enrollments.map((enrollment) => (
        <Card key={enrollment.id} className="overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-1/3 h-48 md:h-auto relative">
              <img
                src={enrollment.activities.image_url || "/placeholder.svg?height=200&width=300&query=fitness activity"}
                alt={enrollment.activities.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{enrollment.activities.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{enrollment.activities.description}</CardDescription>
                  </div>
                  <Badge variant={enrollment.status === "completed" ? "success" : "default"}>
                    {enrollment.status === "active"
                      ? "En progreso"
                      : enrollment.status === "completed"
                        ? "Completado"
                        : enrollment.status === "pending"
                          ? "Pendiente"
                          : enrollment.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Tipo:</span> {enrollment.activities.type}
                  </div>
                  <div>
                    <span className="font-medium">Duración:</span> {enrollment.activities.duration} min
                  </div>
                  <div>
                    <span className="font-medium">Inscrito el:</span> {formatDate(enrollment.created_at)}
                  </div>
                  <div>
                    <span className="font-medium">Progreso:</span> {enrollment.progress}%
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Link href={`/activities/${enrollment.activities.id}`}>
                  <Button variant="outline">Ver detalles</Button>
                </Link>
                <Button>Continuar</Button>
              </CardFooter>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
