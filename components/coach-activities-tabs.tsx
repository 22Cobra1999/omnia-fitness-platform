"use client"

import { OptimizedTabs, TabContentSkeleton } from "@/components/optimized-tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/utils/formatDate"
import { AlertCircle, Edit, Eye, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"

// Tipos para las actividades
interface Activity {
  id: number
  title: string
  description: string
  type: string
  image_url: string
  price: number
  is_public: boolean
  created_at: string
  enrollments_count?: number
}

// Componente de tabs optimizado para actividades del coach
export function CoachActivitiesTabs() {
  const { toast } = useToast()
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null)

  // Definir las tabs y sus funciones de carga
  const tabs = [
    {
      id: "all",
      label: "Todas",
      fetchFunction: async () => {
        const response = await fetch("/api/activities")
        if (!response.ok) throw new Error("Error al cargar actividades")
        return await response.json()
      },
      preload: true,
    },
    {
      id: "published",
      label: "Publicadas",
      fetchFunction: async () => {
        const response = await fetch("/api/activities?status=published")
        if (!response.ok) throw new Error("Error al cargar actividades publicadas")
        return await response.json()
      },
    },
    {
      id: "draft",
      label: "Borradores",
      fetchFunction: async () => {
        const response = await fetch("/api/activities?status=draft")
        if (!response.ok) throw new Error("Error al cargar borradores")
        return await response.json()
      },
    },
    {
      id: "stats",
      label: "Estadísticas",
      fetchFunction: async () => {
        const response = await fetch("/api/activities/stats")
        if (!response.ok) throw new Error("Error al cargar estadísticas")
        return await response.json()
      },
      cacheTime: 5 * 60 * 1000, // 5 minutos
    },
  ]

  // Función para manejar la eliminación de una actividad
  const handleDeleteActivity = async () => {
    if (!activityToDelete) return

    try {
      const response = await fetch(`/api/activities/${activityToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar la actividad")
      }

      toast({
        title: "Actividad eliminada",
        description: `La actividad "${activityToDelete.title}" ha sido eliminada correctamente.`,
      })

      // Cerrar el diálogo
      setActivityToDelete(null)

      // Recargar los datos (esto se haría a través del hook useTabController)
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la actividad. Inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  // Función para renderizar el contenido de cada tab
  const renderTabContent = (data: any | null, isLoading: boolean, error: Error | null) => {
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

    // Tab de estadísticas
    if (data && data.stats) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Total de actividades" value={data.stats.total} />
          <StatCard title="Actividades publicadas" value={data.stats.published} />
          <StatCard title="Inscripciones totales" value={data.stats.enrollments} />
          <StatCard title="Ingresos totales" value={`$${data.stats.revenue.toFixed(2)}`} />
          <StatCard title="Actividad más popular" value={data.stats.mostPopular?.title || "N/A"} />
          <StatCard title="Promedio de inscripciones" value={data.stats.avgEnrollments.toFixed(1)} />
        </div>
      )
    }

    // Tabs de actividades
    if (!data || !data.activities || data.activities.length === 0) {
      return (
        <div className="text-center py-8 border rounded-md">
          <p className="text-muted-foreground mb-4">No hay actividades en esta categoría</p>
          <Link href="/coach/activities/new">
            <Button>Crear nueva actividad</Button>
          </Link>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {data.activities.map((activity: Activity) => (
          <ActivityCard key={activity.id} activity={activity} onDelete={() => setActivityToDelete(activity)} />
        ))}
      </div>
    )
  }

  return (
    <>
      <OptimizedTabs
        tabs={tabs}
        renderContent={renderTabContent}
        storageKey="coach_activities"
        defaultTab="all"
        showLastUpdated={true}
        showRefreshButton={true}
        className="w-full"
      />

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={!!activityToDelete} onOpenChange={(open) => !open && setActivityToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar actividad?</DialogTitle>
          </DialogHeader>
          <p>
            ¿Estás seguro de que deseas eliminar la actividad "{activityToDelete?.title}"? Esta acción no se puede
            deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivityToDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteActivity}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Componente de tarjeta de actividad
function ActivityCard({
  activity,
  onDelete,
}: {
  activity: Activity
  onDelete: () => void
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <div className="w-full sm:w-1/4 h-40 relative">
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
            <Badge variant={activity.is_public ? "default" : "secondary"}>
              {activity.is_public ? "Publicada" : "Borrador"}
            </Badge>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Tipo:</span> {activity.type}
            </div>
            <div>
              <span className="text-muted-foreground">Precio:</span> ${activity.price}
            </div>
            <div>
              <span className="text-muted-foreground">Creada el:</span> {formatDate(activity.created_at)}
            </div>
            <div>
              <span className="text-muted-foreground">Inscripciones:</span> {activity.enrollments_count || 0}
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/activities/${activity.id}`}>
                <Eye className="h-4 w-4 mr-1" /> Ver
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/coach/activities/${activity.id}/edit`}>
                <Edit className="h-4 w-4 mr-1" /> Editar
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="text-red-500" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-1" /> Eliminar
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}

// Componente para mostrar estadísticas
function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}
