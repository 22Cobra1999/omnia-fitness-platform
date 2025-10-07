import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    // Verificar si el bucket product-images existe
    // console.log('🔍 Verificando bucket product-images...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    if (bucketsError) {
      console.error('❌ Error listando buckets:', bucketsError)
      return NextResponse.json({ 
        error: "Error listando buckets", 
        details: bucketsError 
      }, { status: 500 })
    }
    // // console.log('📊 Buckets disponibles:', buckets?.map(b => b.name))
    const productImagesBucket = buckets?.find(b => b.name === 'product-images')
    if (!productImagesBucket) {
      console.error('❌ Bucket product-images no encontrado')
      return NextResponse.json({ 
        error: "Bucket product-images no encontrado",
        availableBuckets: buckets?.map(b => b.name)
      }, { status: 404 })
    }
    // console.log('✅ Bucket product-images encontrado:', productImagesBucket)
    // Intentar listar archivos en el bucket product-images
    const { data: files, error: filesError } = await supabase.storage
      .from('product-images')
      .list()
    if (filesError) {
      console.error('❌ Error listando archivos:', filesError)
      return NextResponse.json({ 
        error: "Error listando archivos en product-images", 
        details: filesError,
        bucket: productImagesBucket
      }, { status: 500 })
    }
    console.log('📁 Archivos en product-images:', files)
    // Buscar la carpeta product-videos
    const productVideosFolder = files?.find(f => f.name === 'product-videos' && f.metadata?.mimetype === 'application/x-directory')
    if (!productVideosFolder) {
      console.log('📁 Carpeta product-videos no encontrada, se creará automáticamente al subir el primer video')
    } else {
      // console.log('✅ Carpeta product-videos encontrada:', productVideosFolder)
    }
    // Intentar listar archivos en la carpeta product-videos
    const { data: videoFiles, error: videoFilesError } = await supabase.storage
      .from('product-images')
      .list('product-videos')
    if (videoFilesError) {
      console.log('📁 Carpeta product-videos vacía o no existe aún')
    } else {
      console.log('📹 Videos en product-videos:', videoFiles)
    }
    // Intentar crear un archivo de prueba en la carpeta product-videos
    const testFileName = `test_${Date.now()}.txt`
    const testContent = 'Test file for video folder verification'
    const testFilePath = `product-videos/${testFileName}`
    console.log('🧪 Creando archivo de prueba:', testFilePath)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(testFilePath, testContent, {
        contentType: 'text/plain',
        upsert: false
      })
    if (uploadError) {
      console.error('❌ Error subiendo archivo de prueba:', uploadError)
      return NextResponse.json({ 
        error: "Error subiendo archivo de prueba", 
        details: uploadError,
        bucket: productImagesBucket,
        files: files
      }, { status: 500 })
    }
    // console.log('✅ Archivo de prueba subido exitosamente:', uploadData)
    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(testFilePath)
    console.log('🔗 URL pública del archivo de prueba:', urlData.publicUrl)
    // Eliminar archivo de prueba
    const { error: deleteError } = await supabase.storage
      .from('product-images')
      .remove([testFilePath])
    if (deleteError) {
      console.error('⚠️ Error eliminando archivo de prueba:', deleteError)
    } else {
      console.log('🗑️ Archivo de prueba eliminado')
    }
    return NextResponse.json({
      success: true,
      message: "Bucket product-images y carpeta product-videos funcionan correctamente",
      bucket: productImagesBucket,
      files: files,
      videoFiles: videoFiles || [],
      testUpload: {
        fileName: testFileName,
        path: testFilePath,
        url: urlData.publicUrl,
        deleted: !deleteError
      }
    })
  } catch (error) {
    console.error('❌ Error general:', error)
    return NextResponse.json({ 
      error: "Error general", 
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
