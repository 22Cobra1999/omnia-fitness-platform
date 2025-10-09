"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { ClientActivitiesTabs } from "@/components/client-activities-tabs"
import { CalendarScreen } from "@/components/calendar/CalendarScreen"
import { useEffect } from "react"

interface DailyActivity {
  activity_id_out: number
  activity_title_out: string | null
  fitness_nombre_out: string | null
  nutrition_comida_out: string | null
  coach_name_out: string | null
  origen_out: string
}

export default function MyProgramsPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/")
    }
  }, [user, router])

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  }

  return (
    <PullToRefresh onRefresh={() => {}}>
      <div className="container mx-auto p-4 md:p-6 flex flex-col h-full">
        <h1 className="mb-6 text-3xl font-bold text-center">Mis Programas</h1>

        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendar">Calendario Diario</TabsTrigger>
            <TabsTrigger value="activities">Mis Actividades</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-4">
            <CalendarScreen clientId={user.id} />
          </TabsContent>

          <TabsContent value="activities" className="mt-4">
            <ClientActivitiesTabs clientId={user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </PullToRefresh>
  )
}
