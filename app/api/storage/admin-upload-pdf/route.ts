import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
export const dynamic = "force-dynamic"
export const maxDuration = 60
export async function POST(request: Request) {
  try {
    // Usar la clave de servicio para omitir las políticas RLS
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
    // Verificar si existe el bucket
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()
    if (bucketsError) {
      console.error("Error al listar buckets:", bucketsError)
      return NextResponse.json({ success: false, error: bucketsError.message }, { status: 500 })
    }
    // Crear el bucket si no existe
    const bucketExists = buckets?.some((bucket) => bucket.name === "coach-content")
    if (!bucketExists) {
      console.log("Creando bucket coach-content...")
      const { error: createBucketError } = await supabaseAdmin.storage.createBucket("coach-content", {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ["application/pdf"],
      })
      if (createBucketError) {
        console.error("Error al crear bucket con clave de servicio:", createBucketError)
        return NextResponse.json({ success: false, error: createBucketError.message }, { status: 500 })
      }
    }
    // Recibir el archivo desde FormData
    const formData = await request.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string
    if (!file) {
      return NextResponse.json({ success: false, error: "No se recibió ningún archivo" }, { status: 400 })
    }
    if (!userId) {
      return NextResponse.json({ success: false, error: "No se recibió el ID del usuario" }, { status: 400 })
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
    const fileName = `${userId}_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
    const filePath = `pdfs/${fileName}`
    // Convertir el archivo a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)
    // Subir el archivo
    console.log("Subiendo archivo:", filePath)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("coach-content")
      .upload(filePath, buffer, {
        contentType: "application/pdf",
        cacheControl: "3600",
        upsert: false,
      })
    if (uploadError) {
      console.error("Error al subir archivo con clave de servicio:", uploadError)
      return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 })
    }
    // Crear URL pública
    const { data: publicUrlData } = supabaseAdmin.storage.from("coach-content").getPublicUrl(filePath)
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
