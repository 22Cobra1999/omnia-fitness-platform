import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'

/**
 * Endpoint para subir archivos organizados (imágenes y PDFs) a Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📤 [upload-organized] Iniciando upload de archivo...')

    const supabase = await createRouteHandlerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('❌ [upload-organized] Error de autenticación:', authError)
      return NextResponse.json({
        success: false,
        error: 'No autorizado'
      }, { status: 401 })
    }

    console.log('✅ [upload-organized] Usuario autenticado:', user.id)

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const mediaType = (formData.get('mediaType') as string) || 'image'
    const category = formData.get('category') as string

    console.log('📋 [upload-organized] Datos recibidos:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      mediaType,
      category
    })

    if (!file) {
      console.error('❌ [upload-organized] No se proporcionó archivo')
      return NextResponse.json({
        success: false,
        error: 'No se proporcionó archivo'
      }, { status: 400 })
    }

    const fileNameSafe = file.name || 'archivo_adjunto'
    const originalFileName = fileNameSafe
    // Validar que el archivo tenga un nombre válido (ahora cubierto por el fallback)

    // Determinar la carpeta según el tipo de media
    // image  -> images
    // video  -> videos
    // otros  -> pdfs (por compatibilidad hacia atrás)
    const folder =
      mediaType === 'image'
        ? 'images'
        : mediaType === 'video'
          ? 'videos'
          : 'pdfs'
    const coachId = user.id

    // Crear un nombre de archivo único
    const fileExt = fileNameSafe.split('.').pop() || 'jpg'
    const originalBase = fileNameSafe.replace(/\.[^/.]+$/, '')
    const safeBase = originalBase
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9-_]/g, '')
      .slice(0, 80)
      .replace(/^-+/, '')
      .replace(/-+$/, '')
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 10)
    const basePrefix = safeBase && safeBase.length > 0 ? safeBase : 'archivo'
    const fileName = `${basePrefix}_${timestamp}_${randomString}.${fileExt}`
    const filePath = `coaches/${coachId}/${folder}/${fileName}`

    console.log('📁 [upload-organized] Preparando upload:', {
      fileName,
      filePath,
      folder,
      coachId
    })

    // Subir el archivo a Supabase Storage
    // Convertir el File a Blob para asegurar compatibilidad
    console.log('⬆️ [upload-organized] Subiendo archivo a storage...')

    // Leer el archivo como ArrayBuffer y luego crear un Blob
    // Leer el archivo como ArrayBuffer y luego crear un Buffer (más compatible con Node)
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)
    const fallbackContentType =
      file.type ||
      (mediaType === 'image'
        ? 'image/jpeg'
        : mediaType === 'video'
          ? 'video/mp4'
          : 'application/pdf')

    // const blob = new Blob([arrayBuffer], { type: fallbackContentType }) // Blob puede fallar en Node fetch

    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('product-media')
      .upload(filePath, fileBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: fallbackContentType
      })

    if (uploadError) {
      console.error('❌ [upload-organized] Error subiendo archivo a storage:', uploadError)
      return NextResponse.json({
        success: false,
        error: 'Error al subir el archivo',
        details: uploadError.message,
        code: uploadError.statusCode
      }, { status: 500 })
    }

    console.log('✅ [upload-organized] Archivo subido exitosamente:', uploadData)

    // Obtener la URL pública del archivo
    const { data: urlData } = supabase.storage
      .from('product-media')
      .getPublicUrl(filePath)

    console.log('✅ [upload-organized] URL pública generada:', urlData.publicUrl)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      fileName: fileName,
      originalFileName: originalFileName,
      filePath: filePath
    })
  } catch (error: any) {
    console.error('❌ [upload-organized] Error en POST /api/upload-organized:', error)
    console.error('❌ [upload-organized] Stack:', error.stack)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

