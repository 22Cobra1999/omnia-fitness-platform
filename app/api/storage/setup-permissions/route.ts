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
    // Verificar si existe el bucket
    const { data: existingBuckets, error: bucketListError } = await supabase.storage.listBuckets()
    if (bucketListError) {
      return NextResponse.json({ success: false, error: bucketListError.message }, { status: 500 })
    }
    // Verificar que el bucket "coach-content" exista
    const coachContentBucket = existingBuckets?.find((bucket) => bucket.name === "coach-content")
    if (!coachContentBucket) {
      // Crear el bucket si no existe
      const { error: createBucketError } = await supabase.storage.createBucket("coach-content", {
        public: true, // Hacer el bucket público
      })
      if (createBucketError) {
        return NextResponse.json({ success: false, error: createBucketError.message }, { status: 500 })
      }
    } else {
      // Actualizar el bucket a público si ya existe
      const { error: updateBucketError } = await supabase.storage.updateBucket("coach-content", {
        public: true,
      })
      if (updateBucketError) {
        return NextResponse.json({ success: false, error: updateBucketError.message }, { status: 500 })
      }
    }
    // Asegurarse de que exista la carpeta pdfs
    try {
      const { data: pdfFolder } = await supabase.storage.from("coach-content").list("pdfs")
      if (!pdfFolder || pdfFolder.length === 0) {
        // Crear carpeta con archivo placeholder
        const emptyFile = new Uint8Array(0)
        await supabase.storage.from("coach-content").upload("pdfs/.placeholder", emptyFile)
      }
    } catch (folderError) {
      console.error("Error al verificar carpeta pdfs:", folderError)
      // Continuamos de todos modos
    }
    return NextResponse.json({
      success: true,
      message: "Permisos de almacenamiento configurados correctamente",
    })
  } catch (error) {
    console.error("Error al configurar permisos:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
