import { TestInsertButton } from "@/components/test-insert-button"

export default function TestInsertPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Prueba de Inserción en activity_enrollments</h1>
      <p className="mb-6 text-gray-600">
        Esta página permite probar la inserción directa en la tabla activity_enrollments y verificar la estructura de la
        tabla.
      </p>
      <TestInsertButton />
    </div>
  )
}
