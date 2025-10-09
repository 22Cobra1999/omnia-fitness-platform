import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  let timeoutId: NodeJS.Timeout | undefined
  
  try {
    console.log('🚀 UPLOAD-ORGANIZED: Iniciando subida organizada')
    
    // Obtener usuario autenticado usando el cliente de ruta
    const supabaseAuth = await createRouteHandlerClient()
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    
    if (authError || !user) {
      console.error('❌ UPLOAD-ORGANIZED: Usuario no autenticado')
      return NextResponse.json({ 
        error: 'No autorizado',
        details: 'User not authenticated'
      }, { status: 401 })
    }
    
    console.log('✅ UPLOAD-ORGANIZED: Usuario autenticado:', user.id)
    
    // Obtener perfil del usuario para verificar rol
    const { data: userProfile, error: profileError } = await supabaseAuth
      .from('user_profiles')
      .select('id, role, email')
      .eq('id', user.id)
      .single()
    
    if (profileError || !userProfile) {
      console.error('❌ UPLOAD-ORGANIZED: Perfil no encontrado')
      return NextResponse.json({ 
        error: 'Perfil de usuario no encontrado',
        details: profileError?.message
      }, { status: 404 })
    }
    
    console.log('👤 UPLOAD-ORGANIZED: Perfil cargado:', {
      id: userProfile.id,
      role: userProfile.role,
      email: userProfile.email || user.email
    })
    
    // Crear cliente con service key para operaciones de storage
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ UPLOAD-ORGANIZED: Variables de entorno faltantes')
      return NextResponse.json({ 
        error: 'Configuración del servidor incompleta',
        details: 'Missing Supabase credentials'
      }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          'x-client-info': 'upload-organized',
          'x-user-id': user.id
        }
      }
    })

    const formData = await request.formData()
    const file = formData.get('file') as File
    const mediaType = formData.get('mediaType') as string // 'image', 'video', 'avatar', 'certificate'
    const category = formData.get('category') as string || 'product' // 'product', 'user', 'certificate'
    const coachId = user.id // ✅ Usar el ID del usuario autenticado
    
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

    // Generar nombre único y ruta organizada POR COACH
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}_${cleanFileName}`
    
    // ✅ NUEVA ESTRUCTURA ORGANIZADA POR COACH
    let folderPath = ''
    let bucketName = ''
    
    switch (category) {
      case 'product':
        bucketName = 'product-media'
        if (mediaType === 'image') {
          // coaches/{coach_id}/images/{timestamp}_{filename}
          folderPath = `coaches/${coachId}/images/${fileName}`
        } else if (mediaType === 'video') {
          // coaches/{coach_id}/videos/{timestamp}_{filename}
          folderPath = `coaches/${coachId}/videos/${fileName}`
        }
        break
      case 'user':
        bucketName = 'user-media'
        if (mediaType === 'avatar') {
          // coaches/{coach_id}/avatar/{timestamp}_{filename}
          folderPath = `coaches/${coachId}/avatar/${fileName}`
        } else if (mediaType === 'certificate') {
          // coaches/{coach_id}/certificates/{timestamp}_{filename}
          folderPath = `coaches/${coachId}/certificates/${fileName}`
        }
        break
      case 'exercise':
        bucketName = 'product-media'
        if (mediaType === 'video') {
          // coaches/{coach_id}/exercises/{timestamp}_{filename}
          folderPath = `coaches/${coachId}/exercises/${fileName}`
        }
        break
      case 'client':
        bucketName = 'user-media'
        if (mediaType === 'avatar') {
          // clients/{user_id}/avatar/{timestamp}_{filename}
          folderPath = `clients/${coachId}/avatar/${fileName}`
        }
        break
      default:
        bucketName = 'uploads-direct'
        folderPath = `${coachId}/${fileName}`
    }
    
    console.log('📂 UPLOAD-ORGANIZED: Estructura organizada por coach:', {
      coachId,
      coachEmail: userProfile.email || user.email,
      bucketName,
      folderPath,
      category,
      mediaType
    })
    
    console.log(`📤 UPLOAD-ORGANIZED: Subiendo ${mediaType} organizado: ${folderPath}`)
    console.log(`📊 UPLOAD-ORGANIZED: Tamaño del archivo: ${file.size} bytes (${(file.size / 1024 / 1024).toFixed(2)}MB)`)

    // Usar bucket dinámico basado en categoría con service key (bypass total de RLS)
    console.log(`🔍 UPLOAD-ORGANIZED: Usando bucket organizado: ${bucketName}`)

    // Convertir File a ArrayBuffer para mejor compatibilidad
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)
    
    console.log('📦 UPLOAD-ORGANIZED: Buffer creado correctamente')

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(folderPath, buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })

    if (uploadError) {
      console.error(`❌ UPLOAD-ORGANIZED: Error subiendo archivo:`, uploadError)
      
      // ✅ Detectar errores de conexión PRIMERO (EPIPE, UND_ERR_SOCKET)
      const errorString = JSON.stringify(uploadError)
      const errorMessage = uploadError.message || ''
      
      if (errorString.includes('EPIPE') || errorString.includes('UND_ERR_SOCKET') || 
          errorString.includes('other side closed') || errorString.includes('fetch failed')) {
        console.error('🔌 UPLOAD-ORGANIZED: Error de conexión detectado en uploadError')
        return NextResponse.json({ 
          error: 'Error de conexión con Supabase Storage',
          details: '⚠️ FALTA CONFIGURAR STORAGE POLICIES EN SUPABASE ⚠️',
          suggestion: 'Ve a Supabase Dashboard → Storage → product-media → Policies → New Policy → Allow authenticated users to INSERT',
          helpUrl: 'https://supabase.com/docs/guides/storage/security/access-control',
          technicalError: errorMessage
        }, { status: 503 })
      }
      
      // Detectar errores de RLS/Permisos
      if (errorMessage.includes('policy') || errorMessage.includes('permission')) {
        return NextResponse.json({ 
          error: 'Sin permisos para subir archivo',
          details: 'Falta configurar Storage Policies en Supabase',
          suggestion: 'Ve a Storage → product-media → Policies y crea una policy para authenticated users'
        }, { status: 403 })
      }
      
      return NextResponse.json({ 
        error: 'Error al subir el archivo',
        details: errorMessage,
        errorCode: uploadError.statusCode || uploadError.status
      }, { status: 500 })
    }

    console.log(`✅ UPLOAD-ORGANIZED: ${mediaType} subido exitosamente`)

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(folderPath)

    const mediaUrl = urlData.publicUrl
    console.log(`✅ UPLOAD-ORGANIZED: URL generada: ${mediaUrl}`)

    // Actualizar metadata del coach en la tabla
    try {
      const { data: currentMetadata } = await supabaseAuth
        .from('coach_storage_metadata')
        .select('total_files_count, total_storage_bytes')
        .eq('coach_id', coachId)
        .maybeSingle()
      
      const newFileCount = (currentMetadata?.total_files_count || 0) + 1
      const newStorageBytes = (currentMetadata?.total_storage_bytes || 0) + file.size
      
      const { error: updateError } = await supabaseAuth
        .from('coach_storage_metadata')
        .update({
          total_files_count: newFileCount,
          total_storage_bytes: newStorageBytes,
          last_upload_date: new Date().toISOString()
        })
        .eq('coach_id', coachId)
      
      if (updateError) {
        console.warn('⚠️ UPLOAD-ORGANIZED: No se pudo actualizar metadata:', updateError.message)
      } else {
        console.log('📊 UPLOAD-ORGANIZED: Metadata actualizada:', {
          archivos: newFileCount,
          bytes: newStorageBytes,
          mb: (newStorageBytes / 1024 / 1024).toFixed(2)
        })
      }
    } catch (metaError) {
      console.warn('⚠️ UPLOAD-ORGANIZED: Error actualizando metadata (no crítico):', metaError)
    }

    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    return NextResponse.json({
      success: true,
      url: mediaUrl,
      path: folderPath,
      mediaType,
      category,
      fileName: file.name,
      fileSize: file.size,
      bucket: bucketName,
      method: 'service-key-organized-by-coach',
      coach: {
        id: coachId,
        email: userProfile.email || user.email,
        role: userProfile.role
      },
      folderStructure: {
        coachId,
        category,
        mediaType,
        fullPath: folderPath,
        structure: `${bucketName}/${folderPath}`
      }
    })

  } catch (error: any) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    console.error('❌ UPLOAD-ORGANIZED: Error interno:', error)
    
    // Detectar si es un error de timeout
    if (error?.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Timeout: El archivo es demasiado grande o la conexión es lenta', details: 'Upload timeout' },
        { status: 408 }
      )
    }
    
    // Detectar errores de red/Socket
    if (error?.cause?.code === 'EPIPE' || error?.code === 'EPIPE' || 
        error?.cause?.code === 'UND_ERR_SOCKET' || error?.code === 'UND_ERR_SOCKET') {
      console.error('🔌 Error de conexión detectado:', error?.cause || error)
      return NextResponse.json(
        { 
          error: 'Error de conexión con Supabase Storage', 
          details: 'La conexión se cerró inesperadamente. Verifica Storage Policies en Supabase.',
          suggestion: 'Configura Storage Policies en Dashboard: Storage → product-media → Policies'
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
