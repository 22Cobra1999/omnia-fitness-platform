"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from '@/lib/supabase-browser'

export function ClientDashboard({ user, profile }: any) {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function loadActivities() {
    setLoading(true)

    const { data, error } = await supabase.from("activities").select("*").eq("visibility", "Public").limit(10)

    if (data) {
      setActivities(data)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadActivities()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Panel de Cliente</CardTitle>
          <CardDescription>Explora actividades y gestiona tu perfil</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Perfil</h3>
              <p>Nombre: {user.user_metadata?.name || "Sin nombre"}</p>
              <p>Email: {user.email}</p>
              <p>Bio: {profile?.bio || "Sin bio"}</p>

              {profile && (
                <>
                  <p>Altura: {profile.height || "No especificada"}</p>
                  <p>Peso: {profile.weight || "No especificado"}</p>
                </>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium">Actividades Recomendadas</h3>

              {activities.length > 0 ? (
                <div className="grid gap-4 mt-4">
                  {activities.map((activity) => (
                    <Card key={activity.activity_id}>
                      <CardContent className="p-4">
                        <h4 className="font-medium">{activity.title}</h4>
                        <p className="text-sm text-gray-500">{activity.description}</p>
                        <div className="flex justify-between mt-2">
                          <span className="text-sm">Coach: {activity.coach_name}</span>
                          <span className="text-sm font-medium">${activity.price}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-2">
                  {loading ? "Cargando actividades..." : "No hay actividades para mostrar"}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
