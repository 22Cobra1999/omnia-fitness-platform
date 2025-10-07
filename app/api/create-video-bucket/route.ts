import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
export async function POST() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    // Verificar si el usuario está autenticado y es coach
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single()
    if (userProfile?.role !== "coach") {
      return NextResponse.json({ error: "Solo los coaches pueden crear buckets" }, { status: 403 })
    }
    // console.log('🔍 Verificando buckets existentes...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    if (bucketsError) {
      console.error('❌ Error listando buckets:', bucketsError)
      return NextResponse.json({ 
        error: "Error listando buckets", 
        details: bucketsError 
      }, { status: 500 })
    }
    // // console.log('📊 Buckets existentes:', buckets?.map(b => b.name))
    // Verificar si el bucket ya existe
    const existingBucket = buckets?.find(b => b.name === 'product-videos')
    if (existingBucket) {
      // console.log('✅ Bucket product-videos ya existe:', existingBucket)
      return NextResponse.json({
        success: true,
        message: "Bucket product-videos ya existe",
        bucket: existingBucket
      })
    }
    console.log('🆕 Creando bucket product-videos...')
    // Crear el bucket product-videos
    const { data: newBucket, error: createError } = await supabase.storage.createBucket('product-videos', {
      public: true, // Hacer el bucket público para que los videos sean accesibles
      allowedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/avi', 'video/mov'],
      fileSizeLimit: 52428800 // 50MB en bytes
    })
    if (createError) {
      console.error('❌ Error creando bucket:', createError)
      return NextResponse.json({ 
        error: "Error creando bucket product-videos", 
        details: createError
      }, { status: 500 })
    }
    // console.log('✅ Bucket product-videos creado exitosamente:', newBucket)
    // Verificar que el bucket se creó correctamente
    const { data: verifyBuckets, error: verifyError } = await supabase.storage.listBuckets()
    if (verifyError) {
      console.error('❌ Error verificando bucket creado:', verifyError)
    } else {
      const createdBucket = verifyBuckets?.find(b => b.name === 'product-videos')
      // console.log('✅ Bucket verificado:', createdBucket)
    }
    return NextResponse.json({
      success: true,
      message: "Bucket product-videos creado exitosamente",
      bucket: newBucket
    })
  } catch (error) {
    console.error('❌ Error general:', error)
    return NextResponse.json({ 
      error: "Error general", 
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
