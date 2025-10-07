"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from '@/lib/supabase-browser'
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Filter, CheckCircle2 } from "lucide-react"
import Image from "next/image"

interface Activity {
  id: number
  title: string
  description: string
  price: number
  type: string
  difficulty: string
  availability_type: string
  image_url?: string
  coach_id: string
  coach_name?: string
}

interface ImmediatePurchaseActivitiesProps {
  selectedClientId?: string
  onSelectActivity: (activity: Activity) => void
  selectedActivityId?: number
}

export function ImmediatePurchaseActivities({
  selectedClientId,
  onSelectActivity,
  selectedActivityId,
}: ImmediatePurchaseActivitiesProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const supabase = createClient()
  const { toast } = useToast()

  // Cargar actividades cuando se selecciona un cliente
  useEffect(() => {
    const loadActivities = async () => {
      if (!selectedClientId) return

      setIsLoading(true)
      try {
        // Obtener actividades con disponibilidad inmediata
        const { data, error } = await supabase
          .from("activities")
          .select(`
            id, 
            title, 
            description, 
            price, 
            type, 
            difficulty, 
            availability_type,
            image_url,
            coach_id
          `)
          .eq("availability_type", "immediate_purchase")
          .eq("is_public", true)
          .order("created_at", { ascending: false })

        if (error) throw error

        // Obtener información de los coaches
        const coachIds = [...new Set(data.map((activity) => activity.coach_id))]
        const { data: coachesData, error: coachesError } = await supabase
          .from("user_profiles")
          .select("id, full_name")
          .in("id", coachIds)

        if (coachesError) throw coachesError

        // Mapear nombres de coaches a actividades
        const activitiesWithCoachNames = data.map((activity) => {
          const coach = coachesData.find((c) => c.id === activity.coach_id)
          return {
            ...activity,
            coach_name: coach?.full_name || "Coach",
          }
        })

        setActivities(activitiesWithCoachNames)
      } catch (error) {
        console.error("Error al cargar actividades:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las actividades. Intente nuevamente.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadActivities()
  }, [selectedClientId, supabase, toast])

  // Filtrar actividades según la pestaña activa
  const getFilteredActivities = () => {
    if (activeTab === "all") return activities
    return activities.filter((activity) => activity.type.toLowerCase() === activeTab)
  }

  // Obtener tipos únicos para las pestañas
  const activityTypes = ["all", ...new Set(activities.map((a) => a.type.toLowerCase()))]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Actividades disponibles para compra inmediata</h3>
        <Badge variant="outline" className="flex items-center gap-1">
          <Filter className="h-3 w-3" />
          <span>{activities.length} actividades</span>
        </Badge>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No hay actividades disponibles para compra inmediata</div>
      ) : (
        <>
          <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => {
  setActiveTab(value)
  // Scroll hacia arriba cuando se cambia de tab
  setTimeout(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, 100)
}}>
            <TabsList className="mb-4">
              {activityTypes.map((type) => (
                <TabsTrigger key={type} value={type} className="capitalize">
                  {type === "all" ? "Todas" : type}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFilteredActivities().map((activity) => (
                  <Card
                    key={activity.id}
                    className={`cursor-pointer transition-colors hover:bg-accent overflow-hidden ${
                      selectedActivityId === activity.id ? "border-primary" : ""
                    }`}
                    onClick={() => onSelectActivity(activity)}
                  >
                    {activity.image_url && (
                      <div className="relative h-40 w-full">
                        <Image
                          src={activity.image_url || "/placeholder.svg"}
                          alt={activity.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <CardHeader className={activity.image_url ? "pt-3 pb-2" : ""}>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{activity.title}</CardTitle>
                        <Badge>{activity.type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="py-2">
                      <p className="text-sm text-muted-foreground line-clamp-2">{activity.description}</p>
                      <div className="flex justify-between items-center mt-2">
                        <div className="text-sm">
                          <span className="font-medium">${activity.price}</span>
                        </div>
                        <Badge variant="outline">{activity.difficulty}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Por: {activity.coach_name}</div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      {selectedActivityId === activity.id && (
                        <Badge variant="secondary" className="w-full flex justify-center items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Seleccionada
                        </Badge>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
