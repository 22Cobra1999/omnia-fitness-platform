import { sql } from "@/lib/db"
import { notFound } from "next/navigation"
import { ActivityForm } from "@/components/activities/activity-form"

async function getActivity(id: string) {
  try {
    const activities = await sql`
      SELECT * FROM activities WHERE activity_id = ${id}
    `

    if (activities.length === 0) {
      return null
    }

    return activities[0]
  } catch (error) {
    console.error("Error fetching activity:", error)
    return null
  }
}

export default async function EditActivityPage({ params }: { params: { id: string } }) {
  const activity = await getActivity(params.id)

  if (!activity) {
    notFound()
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Editar actividad</h1>
      <ActivityForm activityId={params.id} defaultValues={activity} />
    </div>
  )
}
