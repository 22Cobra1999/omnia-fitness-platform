import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    // Verificar si el usuario es administrador
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    // Verificar si el bucket ya existe
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some((bucket) => bucket.name === "coach-content")
    if (!bucketExists) {
      // Crear el bucket para contenido de coaches
      const { error: createError } = await supabase.storage.createBucket("coach-content", {
        public: false, // No accesible públicamente por defecto
        fileSizeLimit: 524288000, // 500MB en bytes
      })
      if (createError) {
        throw createError
      }
      // Configurar políticas de acceso para el bucket
      // Permitir a los coaches subir archivos
      await supabase.rpc("create_storage_policy", {
        bucket_name: "coach-content",
        policy_name: "Coach Upload Policy",
        definition: `(role() = 'authenticated' AND (storage.foldername(name))[1] = 'videos')`,
        operation: "INSERT",
      })
      // Permitir a los coaches actualizar sus propios archivos
      await supabase.rpc("create_storage_policy", {
        bucket_name: "coach-content",
        policy_name: "Coach Update Policy",
        definition: `(role() = 'authenticated' AND storage.foldername(name) = 'videos' AND name LIKE auth.uid() || '_%')`,
        operation: "UPDATE",
      })
      // Permitir a los coaches eliminar sus propios archivos
      await supabase.rpc("create_storage_policy", {
        bucket_name: "coach-content",
        policy_name: "Coach Delete Policy",
        definition: `(role() = 'authenticated' AND storage.foldername(name) = 'videos' AND name LIKE auth.uid() || '_%')`,
        operation: "DELETE",
      })
      // Permitir a todos los usuarios autenticados leer los archivos
      await supabase.rpc("create_storage_policy", {
        bucket_name: "coach-content",
        policy_name: "Public Read Policy",
        definition: `(role() = 'authenticated')`,
        operation: "SELECT",
      })
    }
    return NextResponse.json({ success: true, message: "Bucket configurado correctamente" })
  } catch (error) {
    console.error("Error al configurar el bucket:", error)
    return NextResponse.json({ error: "Error al configurar el almacenamiento" }, { status: 500 })
  }
}
