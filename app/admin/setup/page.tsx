import { DatabaseSetup } from "@/components/admin/database-setup"

export default function AdminSetupPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">OMNIA Admin Setup</h1>
      <DatabaseSetup />
    </div>
  )
}
