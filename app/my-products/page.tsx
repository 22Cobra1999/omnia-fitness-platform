import { redirect } from "next/navigation"
import { ClientPurchasedActivities } from "@/components/client-purchased-activities"
import { getSupabaseClient } from "@/lib/supabase-singleton"

export default async function MyProductsPage() {
  const supabase = getSupabaseClient()
  const { data: userSession } = await supabase.auth.getSession()

  if (!userSession.session) {
    redirect("/login") // Redirect to login if not authenticated
  }

  const clientId = userSession.session.user.id

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-6">
      <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center">Mis Actividades</h1>
      <ClientPurchasedActivities clientId={clientId} />
    </div>
  )
}
