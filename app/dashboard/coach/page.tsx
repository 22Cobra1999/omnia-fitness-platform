import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { CoachProfileForm } from "@/components/dashboard/coach-profile-form"
import { redirect } from "next/navigation"

export default async function CoachDashboardPage() {
  const supabase = createServerComponentClient({ cookies })

  // Obtener el usuario actual
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/login")
  }

  // Verificar si el usuario es coach
  const { data: userMeta } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

  // Obtener el perfil de coach si existe
  const { data: coachProfile } = await supabase
    .from("coach_profiles")
    .select("*")
    .eq("user_id", session.user.id)
    .single()

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Panel de Coach</h1>

      <div className="grid gap-6">
        <CoachProfileForm user={session.user} existingProfile={coachProfile} />
      </div>
    </div>
  )
}
