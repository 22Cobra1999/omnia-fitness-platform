import { SetupStorageAdmin } from "@/components/setup-storage-admin"

export default function StorageAdminPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Configuración de almacenamiento (Admin)</h1>
      <SetupStorageAdmin />
    </div>
  )
}
