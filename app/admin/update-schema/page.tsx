import { UpdateSchemaButton } from "@/components/update-schema-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function UpdateSchemaPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Actualizar Esquema de Base de Datos</h1>

      <Card>
        <CardHeader>
          <CardTitle>Actualización de Esquema</CardTitle>
          <CardDescription>
            Actualiza el esquema de la base de datos para asegurar que todas las columnas necesarias existan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
            <p className="text-amber-800">
              Esta operación verificará y creará la columna <strong>rich_description</strong> en la tabla activities si
              no existe. También actualizará la caché del esquema de Supabase.
            </p>
          </div>

          <UpdateSchemaButton />
        </CardContent>
      </Card>
    </div>
  )
}
