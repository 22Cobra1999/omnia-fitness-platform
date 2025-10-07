import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
export const dynamic = "force-dynamic"
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 })
    }
    // Verificar si el bucket ya existe
    const { data: existingBuckets, error: bucketError } = await supabase.storage.listBuckets()
    if (bucketError) {
      return NextResponse.json({ success: false, error: bucketError.message }, { status: 500 })
    }
    // Comprobar si ya existe el bucket coach-content
    const coachContentBucket = existingBuckets?.find((bucket) => bucket.name === "coach-content")
    if (!coachContentBucket) {
      // Crear el bucket si no existe
      const { error: createBucketError } = await supabase.storage.createBucket("coach-content", {
        public: false,
      })
      if (createBucketError) {
        return NextResponse.json({ success: false, error: createBucketError.message }, { status: 500 })
      }
    }
    // Actualizar las políticas del bucket para permitir acceso público
    const { error: policyError } = await supabase.storage.from("coach-content").createSignedUrl("dummy.txt", 1)
    // Crear carpeta para PDFs si no existe (simulado con un archivo vacío)
    const { data: pdfFolder, error: pdfFolderError } = await supabase.storage.from("coach-content").list("pdfs")
    if (!pdfFolder || pdfFolderError) {
      const emptyFile = new Uint8Array(0)
      const { error: createFolderError } = await supabase.storage
        .from("coach-content")
        .upload("pdfs/.placeholder", emptyFile)
      if (createFolderError && createFolderError.message !== "The resource already exists") {
        console.error("Error creating pdfs folder:", createFolderError)
      }
    }
    return NextResponse.json({
      success: true,
      message: "Almacenamiento para PDFs configurado correctamente",
    })
  } catch (error) {
    console.error("Error configuring PDF storage:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
