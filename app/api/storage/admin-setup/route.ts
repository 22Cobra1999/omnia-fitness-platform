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
    console.log("Iniciando configuración de almacenamiento con clave de servicio...")
    // 1. Verificar si el bucket existe
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()
    if (bucketsError) {
      console.error("Error al listar buckets:", bucketsError)
      return NextResponse.json({ success: false, error: bucketsError.message }, { status: 500 })
    }
    // 2. Crear el bucket si no existe
    const bucketExists = buckets?.some((bucket) => bucket.name === "coach-content")
    if (!bucketExists) {
      console.log("Creando bucket coach-content...")
      const { error: createBucketError } = await supabaseAdmin.storage.createBucket("coach-content", {
        public: true, // Hacer el bucket público
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ["application/pdf"],
      })
      if (createBucketError) {
        console.error("Error al crear bucket con clave de servicio:", createBucketError)
        return NextResponse.json({ success: false, error: createBucketError.message }, { status: 500 })
      }
      console.log("Bucket coach-content creado correctamente")
    } else {
      console.log("El bucket coach-content ya existe")
      // Actualizar la configuración del bucket existente
      const { error: updateBucketError } = await supabaseAdmin.storage.updateBucket("coach-content", {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ["application/pdf"],
      })
      if (updateBucketError) {
        console.error("Error al actualizar bucket:", updateBucketError)
        return NextResponse.json({ success: false, error: updateBucketError.message }, { status: 500 })
      }
      console.log("Bucket coach-content actualizado correctamente")
    }
    // 3. Crear carpeta pdfs si no existe
    try {
      console.log("Verificando carpeta pdfs...")
      const { data: folderCheck } = await supabaseAdmin.storage.from("coach-content").list("pdfs")
      if (!folderCheck || folderCheck.length === 0) {
        console.log("Creando carpeta pdfs...")
        // Crear un archivo placeholder para crear la carpeta
        const emptyFile = new Uint8Array(0)
        const { error: placeholderError } = await supabaseAdmin.storage
          .from("coach-content")
          .upload("pdfs/.placeholder", emptyFile)
        if (placeholderError) {
          console.error("Error al crear carpeta pdfs:", placeholderError)
          // No retornamos error, continuamos con la configuración
        } else {
          console.log("Carpeta pdfs creada correctamente")
        }
      } else {
        console.log("La carpeta pdfs ya existe")
      }
    } catch (folderError) {
      console.error("Error al verificar carpeta pdfs:", folderError)
      // No retornamos error, continuamos con la configuración
    }
    // 4. Configurar políticas de acceso público para el bucket
    try {
      console.log("Configurando políticas de acceso público...")
      const { data: publicUrlData } = supabaseAdmin.storage.from("coach-content").getPublicUrl("pdfs/.placeholder")
      console.log("URL pública generada correctamente:", publicUrlData.publicUrl)
    } catch (publicUrlError) {
      console.error("Error al generar URL pública:", publicUrlError)
      // No retornamos error, continuamos con la configuración
    }
    return NextResponse.json({
      success: true,
      message: "Almacenamiento configurado correctamente",
    })
  } catch (error) {
    console.error("Error en la configuración de almacenamiento:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
