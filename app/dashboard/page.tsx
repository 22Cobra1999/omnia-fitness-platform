import { ClientActivitiesTabs } from "@/components/client-activities-tabs"
import { CoachActivitiesTabs } from "@/components/coach-activities-tabs"
import { getServerSupabaseClient } from "@/lib/supabase"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const supabase = getServerSupabaseClient()

  // Obtener la sesión del usuario
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/login?redirect=/dashboard")
  }

  // Obtener el rol del usuario
  const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", session.user.id).single()

  const userRole = profile?.role || "client"

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {userRole === "coach" ? (
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">Mis Actividades</h2>
            <CoachActivitiesTabs />
          </section>
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">Mis Actividades</h2>
            <ClientActivitiesTabs />
          </section>
        </div>
      )}
    </div>
  )
}
