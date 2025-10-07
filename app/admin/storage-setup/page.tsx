import { SetupStoragePermissions } from "@/components/setup-storage-permissions"

export default function StorageSetupPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Configuración de almacenamiento</h1>
      <SetupStoragePermissions />
    </div>
  )
}
