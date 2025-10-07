import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
export const dynamic = "force-dynamic"
export const maxDuration = 60
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error("Error de autenticación:", authError)
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 })
    }
    // Verificar si existe el bucket
    const { data: existingBuckets, error: bucketListError } = await supabase.storage.listBuckets()
    if (bucketListError) {
      console.error("Error al listar buckets:", bucketListError)
      return NextResponse.json({ success: false, error: bucketListError.message }, { status: 500 })
    }
    // Verificar que el bucket "coach-content" exista
    const coachContentBucket = existingBuckets?.find((bucket) => bucket.name === "coach-content")
    if (!coachContentBucket) {
      // Crear el bucket si no existe
      const { error: createBucketError } = await supabase.storage.createBucket("coach-content", {
        public: false,
      })
      if (createBucketError) {
        console.error("Error al crear bucket:", createBucketError)
        return NextResponse.json({ success: false, error: createBucketError.message }, { status: 500 })
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
    // Recibir el archivo desde FormData
    const formData = await request.formData()
    const file = formData.get("file") as File
    if (!file) {
      return NextResponse.json({ success: false, error: "No se recibió ningún archivo" }, { status: 400 })
    }
    // Verificar que sea un PDF
    if (!file.type.includes("pdf")) {
      return NextResponse.json({ success: false, error: "El archivo debe ser un PDF" }, { status: 400 })
    }
    // Verificar tamaño (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, error: "El archivo no debe exceder 10MB" }, { status: 400 })
    }
    // Generar un nombre único para el archivo
    const fileExt = "pdf"
    const fileName = `${user.id}_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
    const filePath = `pdfs/${fileName}`
    // Convertir el archivo a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)
    // Subir el archivo
    console.log("Subiendo archivo:", filePath)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("coach-content")
      .upload(filePath, buffer, {
        contentType: "application/pdf",
        cacheControl: "3600",
        upsert: false,
      })
    if (uploadError) {
      console.error("Error al subir archivo:", uploadError)
      return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 })
    }
    // Crear URL pública
    const { data: publicUrlData } = supabase.storage.from("coach-content").getPublicUrl(filePath)
    console.log("Archivo subido correctamente:", publicUrlData.publicUrl)
    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      path: filePath,
      message: "Archivo subido correctamente",
    })
  } catch (error) {
    console.error("Error al procesar la solicitud:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
