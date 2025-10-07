import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Edit, Eye, Users } from "lucide-react"

export default async function CoachActivitiesPage() {
  // Datos de ejemplo para mostrar la estructura
  const activities = [
    {
      id: 1,
      title: "Programa de Fitness Completo",
      type: "fitness_program",
      price: 99,
      is_public: true,
      created_at: "2024-01-15",
      enrollments: 12
    },
    {
      id: 2,
      title: "Plan de Nutrición Personalizado",
      type: "nutrition_plan",
      price: 75,
      is_public: false,
      created_at: "2024-01-10",
      enrollments: 8
    },
    {
      id: 3,
      title: "Entrenamiento de Fuerza",
      type: "fitness_program",
      price: 120,
      is_public: true,
      created_at: "2024-01-05",
      enrollments: 15
    }
  ]

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Mis Actividades</h1>
        <Button asChild>
          <Link href="/coach/activities/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nueva Actividad
          </Link>
        </Button>
      </div>

      <div className="grid gap-6">
        {activities?.map((activity) => (
          <Card key={activity.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <CardTitle>{activity.title}</CardTitle>
                <Badge variant={activity.is_public ? "default" : "secondary"}>
                  {activity.is_public ? "Pública" : "Privada"}
                </Badge>
              </div>
              <CardDescription>{new Date(activity.created_at).toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{activity.type}</Badge>
                  <span className="text-sm font-medium">${activity.price}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {activity.enrollments} inscripciones
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/products/${activity.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver
                </Link>
              </Button>
              <Button variant="default" size="sm" asChild>
                <Link href={`/coach/activities/${activity.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}

        {activities?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No has creado ninguna actividad todavía.</p>
            <Button asChild>
              <Link href="/coach/activities/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Crear mi primera actividad
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
