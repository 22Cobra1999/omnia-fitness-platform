import { RunCoachMigration } from "@/components/admin/run-coach-migration"

export default function CoachSetupPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Configuración de Coach</h1>
      <RunCoachMigration />
    </div>
  )
}
