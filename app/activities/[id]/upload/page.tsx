import { createClient } from "@/utils/supabase/server"
import { CSVUploadForm } from "@/components/csv-upload-form"
import { notFound, redirect } from "next/navigation"

export default async function UploadProgramPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  // Verificar autenticación
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect("/login")
  }

  // Verificar que la actividad existe y pertenece al usuario
  const { data: activity, error } = await supabase
    .from("activities")
    .select("id, title, coach_id")
    .eq("id", params.id)
    .eq("coach_id", user.id)
    .single()

  if (error || !activity) {
    notFound()
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Subir Programa</h1>
        <p className="text-muted-foreground mt-2">
          Sube los detalles del programa para: <strong>{activity.title}</strong>
        </p>
      </div>

      <CSVUploadForm activityId={params.id} activityTitle={activity.title} />
    </div>
  )
}
