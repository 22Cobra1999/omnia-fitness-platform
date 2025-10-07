import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 UPLOAD-ORGANIZED: Iniciando subida organizada')
    
    // Configurar timeout más largo para archivos grandes
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minutos
    
    // Crear cliente con service key para bypass total de RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const formData = await request.formData()
    const file = formData.get('file') as File
    const mediaType = formData.get('mediaType') as string // 'image', 'video', 'avatar', 'certificate'
    const category = formData.get('category') as string || 'product' // 'product', 'user', 'certificate'
    
    console.log('📁 UPLOAD-ORGANIZED: Archivo recibido:', {
      name: file?.name,
      size: file?.size,
      type: file?.type,
      mediaType,
      category
    })
    
    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })
    }

    // Validar tipo de archivo
    if (mediaType === 'image' && !file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'El archivo debe ser una imagen' }, { status: 400 })
    }
    
    if (mediaType === 'video' && !file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'El archivo debe ser un video' }, { status: 400 })
    }
    
    if (mediaType === 'avatar' && !file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'El archivo debe ser una imagen para avatar' }, { status: 400 })
    }
    
    if (mediaType === 'certificate' && !file.type.includes('pdf')) {
      return NextResponse.json({ error: 'El archivo debe ser un PDF para certificado' }, { status: 400 })
    }

    // Validar tamaño
    const maxSize = mediaType === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `El archivo es demasiado grande. Máximo ${mediaType === 'video' ? '50MB' : '10MB'}` 
      }, { status: 400 })
    }
    
    console.log('✅ UPLOAD-ORGANIZED: Validaciones pasadas correctamente')

    // Generar nombre único y ruta organizada
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    
    // Usar estructura de carpetas existente basada en los buckets actuales
    let folderPath = ''
    let bucketName = ''
    
    switch (category) {
      case 'product':
        bucketName = 'product-media'
        if (mediaType === 'image') {
          folderPath = `images/products/${fileName}`
        } else if (mediaType === 'video') {
          folderPath = `videos/products/${fileName}`
        }
        break
      case 'user':
        bucketName = 'user-media'
        if (mediaType === 'avatar') {
          folderPath = `avatars/coaches/${fileName}`
        } else if (mediaType === 'certificate') {
          folderPath = `certificates/coaches/${fileName}`
        }
        break
      case 'exercise':
        bucketName = 'product-media'
        if (mediaType === 'video') {
          folderPath = `videos/exercises/${fileName}`
        }
        break
      case 'client':
        bucketName = 'user-media'
        if (mediaType === 'avatar') {
          folderPath = `avatars/clients/${fileName}`
        }
        break
      default:
        bucketName = 'uploads-direct'
        folderPath = fileName
    }
    
    console.log(`📤 UPLOAD-ORGANIZED: Subiendo ${mediaType} organizado: ${folderPath}`)
    console.log(`📊 UPLOAD-ORGANIZED: Tamaño del archivo: ${file.size} bytes (${(file.size / 1024 / 1024).toFixed(2)}MB)`)

    // Usar bucket dinámico basado en categoría con service key (bypass total de RLS)
    console.log(`🔍 UPLOAD-ORGANIZED: Usando bucket organizado: ${bucketName}`)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(folderPath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })

    if (uploadError) {
      console.error(`❌ UPLOAD-ORGANIZED: Error subiendo archivo:`, uploadError)
      return NextResponse.json({ 
        error: 'Error al subir el archivo',
        details: uploadError.message 
      }, { status: 500 })
    }

    console.log(`✅ UPLOAD-ORGANIZED: ${mediaType} subido exitosamente`)

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(folderPath)

    const mediaUrl = urlData.publicUrl
    console.log(`✅ UPLOAD-ORGANIZED: URL generada: ${mediaUrl}`)

    clearTimeout(timeoutId)
    
    return NextResponse.json({
      success: true,
      url: mediaUrl,
      path: folderPath,
      mediaType,
      category,
      fileName: file.name,
      fileSize: file.size,
      bucket: bucketName,
      method: 'service-key-organized',
      folderStructure: {
        category,
        mediaType,
        fullPath: folderPath
      }
    })

  } catch (error) {
    clearTimeout(timeoutId)
    console.error('❌ UPLOAD-ORGANIZED: Error interno:', error)
    
    // Detectar si es un error de timeout
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Timeout: El archivo es demasiado grande o la conexión es lenta', details: 'Upload timeout' },
        { status: 408 }
      )
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}
