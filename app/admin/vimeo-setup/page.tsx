import { RunVimeoMigration } from "@/components/admin/run-vimeo-migration"

export default function VimeoSetupPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Configuración de Vimeo</h1>
      <RunVimeoMigration />
    </div>
  )
}
