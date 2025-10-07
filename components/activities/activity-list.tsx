"use client"

import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, DollarSign, Users } from "lucide-react"
import Link from "next/link"
import { useActivitiesStore } from "@/hooks/use-activities-store"
import { useAuth } from "@/contexts/auth-context"

type Activity = {
  activity_id: string
  title: string
  coach_name: string
  category: string
  subcategory: string | null
  description: string | null
  level: string | null
  duration_minutes: number | null
  format: string | null
  price: number
  date: string | null
  time_start: string | null
  language: string | null
  visibility: string
  coach_id: string
}

export function ActivityList({ coachId }: { coachId?: string }) {
  const { activities, isLoading, fetchActivities } = useActivitiesStore()
  const { user } = useAuth()

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  // Filtrar actividades por coachId si se proporciona
  const filteredActivities = coachId ? activities.filter((activity) => activity.coach_id === coachId) : activities

  const isCoach = (activityCoachId: string) => {
    return user?.id === activityCoachId
  }

  if (isLoading) {
    return <div className="flex justify-center p-8">Cargando actividades...</div>
  }

  if (filteredActivities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="mb-4 text-center text-muted-foreground">No hay actividades disponibles</p>
        {user && (
          <Button asChild>
            <Link href="/coach/activities/new">Crear actividad</Link>
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {filteredActivities.map((activity) => (
        <Card key={activity.activity_id} className="overflow-hidden">
          {activity.visibility === "Subscribers only" && (
            <div className="bg-orange-500 text-white text-xs font-bold px-2 py-1 absolute right-2 top-2 rounded">
              Solo suscriptores
            </div>
          )}

          <div className="h-48 bg-muted relative">
            {activity.cover_url ? (
              <img
                src={activity.cover_url || "/placeholder.svg"}
                alt={activity.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-orange-400 to-red-500">
                <span className="text-white font-bold text-xl">{activity.category}</span>
              </div>
            )}
          </div>

          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="line-clamp-1">{activity.title}</CardTitle>
                <CardDescription>Por {activity.coach_name}</CardDescription>
              </div>
              <Badge variant={activity.category === "Fitness" ? "default" : "secondary"}>{activity.category}</Badge>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-2">
              {activity.subcategory && <div className="text-sm">{activity.subcategory}</div>}

              {activity.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{activity.description}</p>
              )}

              <div className="flex flex-wrap gap-2 mt-2">
                {activity.level && <Badge variant="outline">{activity.level}</Badge>}
                {activity.format && <Badge variant="outline">{activity.format}</Badge>}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3">
                {activity.duration_minutes && (
                  <div className="flex items-center text-sm">
                    <Clock className="mr-1 h-4 w-4" />
                    <span>{activity.duration_minutes} min</span>
                  </div>
                )}

                {activity.date && (
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-1 h-4 w-4" />
                    <span>{new Date(activity.date).toLocaleDateString()}</span>
                  </div>
                )}

                {activity.price > 0 && (
                  <div className="flex items-center text-sm">
                    <DollarSign className="mr-1 h-4 w-4" />
                    <span>${activity.price}</span>
                  </div>
                )}

                {activity.format && (
                  <div className="flex items-center text-sm">
                    <Users className="mr-1 h-4 w-4" />
                    <span>{activity.format}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button asChild variant="outline">
              <Link href={`/activities/${activity.activity_id}`}>Ver detalles</Link>
            </Button>

            {isCoach(activity.coach_id) && (
              <Button asChild variant="ghost">
                <Link href={`/coach/activities/${activity.activity_id}/edit`}>Editar</Link>
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
