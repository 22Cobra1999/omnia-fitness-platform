import { createClient } from "@/utils/supabase/server"
import ProgramImportForm from "@/components/program-import-form"
import { notFound } from "next/navigation"

export default async function ImportProgramPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const { data: session } = await supabase.auth.getSession()

  if (!session?.session?.user) {
    return notFound()
  }

  const userId = session.session.user.id

  // Verificar si la actividad existe y pertenece al usuario (coach)
  const { data: activity, error } = await supabase
    .from("activities")
    .select("*")
    .eq("id", params.id)
    .eq("coach_id", userId)
    .single()

  if (error || !activity) {
    return notFound()
  }

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Importar Programa para: {activity.title}</h1>
      <ProgramImportForm activityId={params.id} coachId={userId} />

      <div className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Instrucciones para preparar el CSV</h2>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Para Programas de Fitness:</h3>
          <p>El archivo CSV debe tener las siguientes columnas en este orden:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Día (número o texto como "Lunes", "Martes", etc.)</li>
            <li>Semana (número)</li>
            <li>Nombre de la Actividad (texto)</li>
            <li>Descripción (texto)</li>
            <li>Duración (min) (número)</li>
            <li>Tipo de Ejercicio (texto)</li>
            <li>Repeticiones (número)</li>
            <li>Series (número)</li>
            <li>Intervalo (texto)</li>
            <li>Descanso (texto)</li>
            <li>Peso (número)</li>
            <li>Nivel de Intensidad (texto)</li>
            <li>Equipo Necesario (texto)</li>
            <li>1RM (número)</li>
          </ol>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Para Programas de Nutrición:</h3>
          <p>El archivo CSV debe tener las siguientes columnas en este orden:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Día (número o texto como "Lunes", "Martes", etc.)</li>
            <li>Semana (número)</li>
            <li>Comida (texto, ej: "Desayuno", "Almuerzo", "Cena")</li>
            <li>Nombre (texto, nombre del plato)</li>
            <li>Calorías (número)</li>
            <li>Proteínas (g) (número)</li>
            <li>Carbohidratos (g) (número)</li>
            <li>Peso/Cantidad (número)</li>
            <li>Receta/Notas (texto)</li>
          </ol>
        </div>

        <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
          <p className="text-amber-800 font-medium">Importante:</p>
          <ul className="list-disc pl-5 text-amber-700">
            <li>
              La primera fila del CSV debe contener los nombres de las columnas exactamente como se muestran arriba.
            </li>
            <li>Asegúrate de que el archivo esté en formato CSV (valores separados por comas).</li>
            <li>Si exportas desde Excel, selecciona "Guardar como" y elige el formato "CSV (delimitado por comas)".</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
