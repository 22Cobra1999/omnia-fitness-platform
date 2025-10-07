import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Configurando políticas RLS para Storage...')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verificar si el bucket product-media existe
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('Error listando buckets:', bucketsError)
      return NextResponse.json({
        success: false,
        error: 'Error verificando buckets',
        details: bucketsError
      }, { status: 500 })
    }

    const productMediaBucket = buckets?.find(bucket => bucket.name === 'product-media')
    
    if (!productMediaBucket) {
      console.log('Bucket product-media no existe, creándolo...')
      
      // Intentar crear el bucket
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('product-media', {
        public: true,
        allowedMimeTypes: ['image/*', 'video/*', 'application/pdf'],
        fileSizeLimit: 50 * 1024 * 1024 // 50MB
      })
      
      if (createError) {
        console.error('Error creando bucket:', createError)
        return NextResponse.json({
          success: false,
          error: 'Error creando bucket product-media',
          details: createError
        }, { status: 500 })
      }
      
      console.log('✅ Bucket product-media creado exitosamente')
    } else {
      console.log('✅ Bucket product-media ya existe')
    }

    // Intentar subir un archivo de prueba para verificar permisos
    console.log('🧪 Probando permisos de subida...')
    
    // Crear un archivo de imagen simple (1x1 pixel PNG)
    const testImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    const testImageBuffer = Buffer.from(testImageData, 'base64')
    const testFile = new File([testImageBuffer], 'test.png', { type: 'image/png' })
    
    const { data: uploadTest, error: uploadError } = await supabase.storage
      .from('product-media')
      .upload('avatars/test-upload.png', testFile)

    if (uploadError) {
      console.error('❌ Error en prueba de subida:', uploadError)
      return NextResponse.json({
        success: false,
        error: 'Error de permisos en Storage',
        details: uploadError,
        message: 'Las políticas RLS están bloqueando la subida. Necesitas configurar las políticas en Supabase Dashboard.'
      }, { status: 500 })
    }

    // Limpiar archivo de prueba
    await supabase.storage.from('product-media').remove(['avatars/test-upload.png'])

    console.log('✅ Permisos de Storage verificados correctamente')

    return NextResponse.json({
      success: true,
      message: 'Políticas de Storage configuradas correctamente',
      bucketExists: !!productMediaBucket,
      uploadTest: uploadTest
    })

  } catch (error) {
    console.error('Error configurando Storage:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}