import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { ActivityCard } from "@/components/activities/activity-card"
import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function MyActivitiesPage() {
  const supabase = createServerComponentClient({ cookies })

  // Verificar si el usuario está autenticado
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    redirect("/auth/login")
  }

  // Obtener las inscripciones del usuario
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from("activity_enrollments")
    .select(`
      enrollment_id,
      activity_id,
      status,
      payment_date,
      amount_paid,
      activities(
        activity_id,
        title,
        description,
        category,
        level,
        format,
        price,
        date,
        time_start,
        duration_minutes,
        tags,
        profiles(name, avatar_url)
      )
    `)
    .eq("user_id", session.user.id)
    .order("payment_date", { ascending: false })

  if (enrollmentsError) {
    console.error("Error al obtener inscripciones:", enrollmentsError)
  }

  // Separar actividades activas y completadas/canceladas
  const activeEnrollments = enrollments?.filter((e) => e.status === "Active") || []
  const pastEnrollments = enrollments?.filter((e) => e.status !== "Active") || []

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Mis actividades</h1>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-2">
          <TabsTrigger value="active">Activas ({activeEnrollments.length})</TabsTrigger>
          <TabsTrigger value="past">Completadas ({pastEnrollments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {activeEnrollments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeEnrollments.map((enrollment) => (
                <ActivityCard
                  key={enrollment.enrollment_id}
                  activity={{
                    ...enrollment.activities,
                    coach_name: enrollment.activities.profiles?.name,
                  }}
                  isEnrolled={true}
                  enrollmentStatus={enrollment.status}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No tienes actividades activas en este momento.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {pastEnrollments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastEnrollments.map((enrollment) => (
                <ActivityCard
                  key={enrollment.enrollment_id}
                  activity={{
                    ...enrollment.activities,
                    coach_name: enrollment.activities.profiles?.name,
                  }}
                  isEnrolled={true}
                  enrollmentStatus={enrollment.status}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No tienes actividades completadas o canceladas.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
