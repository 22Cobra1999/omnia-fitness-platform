"use client"
import { OptimizedTabs, TabContentSkeleton } from "@/components/optimized-tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/utils/formatDate"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

// Tipos para las actividades
interface Activity {
  id: number
  title: string
  description: string
  type: string
  image_url: string
  price: number
  status: string
  progress: number
  created_at: string
}

// Componente de tabs optimizado para actividades del cliente
export function ClientActivitiesTabs() {
  // Definir las tabs y sus funciones de carga
  const tabs = [
    {
      id: "active",
      label: "Activas",
      fetchFunction: async () => {
        // Simular un pequeño retraso para mostrar el estado de carga
        await new Promise((resolve) => setTimeout(resolve, 300))
        const response = await fetch("/api/enrollments?status=active")
        if (!response.ok) throw new Error("Error al cargar actividades activas")
        return await response.json()
      },
      preload: true, // Cargar datos al montar el componente
    },
    {
      id: "completed",
      label: "Completadas",
      fetchFunction: async () => {
        const response = await fetch("/api/enrollments?status=completed")
        if (!response.ok) throw new Error("Error al cargar actividades completadas")
        return await response.json()
      },
      cacheTime: 10 * 60 * 1000, // 10 minutos de caché
    },
    {
      id: "all",
      label: "Todas",
      fetchFunction: async () => {
        const response = await fetch("/api/enrollments")
        if (!response.ok) throw new Error("Error al cargar todas las actividades")
        return await response.json()
      },
    },
  ]

  // Función para renderizar el contenido de cada tab
  const renderTabContent = (data: Activity[] | null, isLoading: boolean, error: Error | null) => {
    if (isLoading) {
      return <TabContentSkeleton rows={3} />
    }

    if (error) {
      return (
        <div className="flex items-center p-4 text-red-500 bg-red-50 rounded-md">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>Error: {error.message}</span>
        </div>
      )
    }

    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8 border rounded-md">
          <p className="text-muted-foreground mb-4">No hay actividades en esta categoría</p>
          <Link href="/activities">
            <Button>Explorar actividades</Button>
          </Link>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {data.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
    )
  }

  return (
    <OptimizedTabs
      tabs={tabs}
      renderContent={renderTabContent}
      storageKey="client_activities"
      defaultTab="active"
      showLastUpdated={true}
      showRefreshButton={true}
      className="w-full"
    />
  )
}

// Componente de tarjeta de actividad
function ActivityCard({ activity }: { activity: Activity }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <div className="w-full sm:w-1/3 h-40 relative">
          <img
            src={activity.image_url || "/placeholder.svg?height=200&width=300&query=fitness"}
            alt={activity.title}
            className="w-full h-full object-cover"
          />
        </div>
        <CardContent className="flex-1 p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{activity.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{activity.description}</p>
            </div>
            <Badge
              variant={
                activity.status === "completed" ? "success" : activity.status === "active" ? "default" : "secondary"
              }
            >
              {activity.status === "active"
                ? "En progreso"
                : activity.status === "completed"
                  ? "Completado"
                  : activity.status}
            </Badge>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Tipo:</span> {activity.type}
            </div>
            <div>
              <span className="text-muted-foreground">Inscrito el:</span> {formatDate(activity.created_at)}
            </div>
            <div>
              <span className="text-muted-foreground">Progreso:</span> {activity.progress}%
            </div>
            <div>
              <span className="text-muted-foreground">Precio:</span> ${activity.price}
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Link href={`/activities/${activity.id}`}>
              <Button variant="outline">Ver detalles</Button>
            </Link>
            <Button>Continuar</Button>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}
