import { ForceInsertForm } from "@/components/force-insert-form"

export default function ForceInsertPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Forzar Inserción en activity_enrollments</h1>
      <p className="mb-6 text-gray-600">
        Esta página utiliza un Server Action para intentar forzar la inserción en la tabla activity_enrollments. Utiliza
        este método como último recurso para diagnóstico.
      </p>
      <ForceInsertForm />
    </div>
  )
}
