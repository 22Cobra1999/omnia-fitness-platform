import { Suspense } from "react"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { WorkshopScheduleForm } from "@/components/workshops/workshop-schedule-form"
import { redirect } from "next/navigation"

interface PageProps {
  params: {
    id: string
  }
}

export default async function WorkshopSchedulePage({ params }: PageProps) {
  const supabase = createServerComponentClient({ cookies })

  // Verificar autenticación
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login?callbackUrl=/coach/activities")
  }

  // Verificar que el usuario sea coach
  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select("preferences")
    .eq("user_id", user.id)
    .single()

  const role = userProfile?.preferences?.role
  if (role !== "coach") {
    redirect("/dashboard")
  }

  // Verificar que la actividad exista y pertenezca al coach
  const { data: activity } = await supabase
    .from("activities")
    .select("*")
    .eq("id", params.id)
    .eq("coach_id", user.id)
    .single()

  if (!activity) {
    redirect("/coach/activities")
  }

  // Obtener sesiones existentes
  const { data: sessions } = await supabase
    .from("calendar_events")
    .select("id, start_time, end_time, available_slots, booked_slots")
    .eq("activity_id", params.id)
    .eq("is_workshop_session", true)

  const formattedSessions =
    sessions?.map((session) => ({
      id: session.id,
      date: new Date(session.start_time).toISOString().split("T")[0],
      startTime: new Date(session.start_time).toTimeString().slice(0, 5),
      endTime: new Date(session.end_time).toTimeString().slice(0, 5),
      availableSlots: session.available_slots,
    })) || []

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Programar Horarios: {activity.title}</h1>

      <Suspense fallback={<div>Cargando...</div>}>
        <WorkshopScheduleForm activityId={Number.parseInt(params.id)} existingSessions={formattedSessions} />
      </Suspense>
    </div>
  )
}
