import { ActivityForm } from "@/components/activities/activity-form"

export default function NewActivityPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Crear nueva actividad</h1>
      <ActivityForm />
    </div>
  )
}
