import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

/**
 * Endpoint para inicializar la estructura de carpetas de un coach
 * Se ejecuta automáticamente cuando un coach se registra en la plataforma
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 INITIALIZE-STORAGE: Iniciando inicialización de carpetas para coach')
    
    // Obtener usuario autenticado
    const supabaseAuth = await createRouteHandlerClient()
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    
    if (authError || !user) {
      console.error('❌ INITIALIZE-STORAGE: Usuario no autenticado')
      return NextResponse.json({ 
        error: 'No autorizado',
        details: 'User not authenticated'
      }, { status: 401 })
    }
    
    // Verificar que sea un coach
    const { data: userProfile, error: profileError } = await supabaseAuth
      .from('user_profiles')
      .select('id, role, email')
      .eq('id', user.id)
      .single()
    
    if (profileError || !userProfile) {
      return NextResponse.json({ 
        error: 'Perfil no encontrado',
        details: profileError?.message
      }, { status: 404 })
    }
    
    if (userProfile.role !== 'coach') {
      return NextResponse.json({ 
        error: 'Solo los coaches pueden inicializar su estructura de archivos',
        details: 'User is not a coach'
      }, { status: 403 })
    }
    
    console.log('✅ INITIALIZE-STORAGE: Coach verificado:', {
      id: userProfile.id,
      email: userProfile.email || user.email
    })
    
    // Crear cliente con service key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    const coachId = user.id
    // Crear un archivo de texto vacío para .keep
    const placeholderContent = new Blob([''], { type: 'text/plain' })
    
    // Estructura de carpetas a crear (solo product-media por ahora)
    const folderStructure = [
      // Product Media
      { bucket: 'product-media', path: `coaches/${coachId}/images/.keep`, type: 'images' },
      { bucket: 'product-media', path: `coaches/${coachId}/videos/.keep`, type: 'videos' },
      { bucket: 'product-media', path: `coaches/${coachId}/exercises/.keep`, type: 'exercises' },
    ]
    
    console.log('📁 INITIALIZE-STORAGE: Creando estructura de carpetas...')
    
    const results = []
    
    for (const folder of folderStructure) {
      try {
        const { data, error } = await supabase.storage
          .from(folder.bucket)
          .upload(folder.path, placeholderContent, {
            cacheControl: '3600',
            upsert: false,
            contentType: 'text/plain'
          })
        
        if (error) {
          // Si el archivo ya existe, no es un error crítico
          if (error.message.includes('already exists')) {
            console.log(`ℹ️ INITIALIZE-STORAGE: Carpeta ${folder.type} ya existe`)
            results.push({
              bucket: folder.bucket,
              type: folder.type,
              status: 'already_exists',
              path: folder.path
            })
          } else {
            console.error(`❌ INITIALIZE-STORAGE: Error creando ${folder.type}:`, error)
            results.push({
              bucket: folder.bucket,
              type: folder.type,
              status: 'error',
              error: error.message
            })
          }
        } else {
          console.log(`✅ INITIALIZE-STORAGE: Carpeta ${folder.type} creada exitosamente`)
          results.push({
            bucket: folder.bucket,
            type: folder.type,
            status: 'created',
            path: folder.path
          })
        }
      } catch (err: any) {
        console.error(`❌ INITIALIZE-STORAGE: Error inesperado en ${folder.type}:`, err)
        results.push({
          bucket: folder.bucket,
          type: folder.type,
          status: 'error',
          error: err.message
        })
      }
    }
    
    // Guardar metadata en la base de datos
    const { error: metadataError } = await supabaseAuth
      .from('coach_storage_metadata')
      .upsert({
        coach_id: coachId,
        storage_initialized: true,
        initialization_date: new Date().toISOString(),
        folder_structure: {
          'product-media': `coaches/${coachId}`,
          'user-media': `coaches/${coachId}`
        }
      }, {
        onConflict: 'coach_id'
      })
    
    if (metadataError) {
      console.warn('⚠️ INITIALIZE-STORAGE: Error guardando metadata (tabla puede no existir):', metadataError.message)
    }
    
    console.log('🎉 INITIALIZE-STORAGE: Inicialización completada')
    
    return NextResponse.json({
      success: true,
      message: 'Estructura de carpetas inicializada correctamente',
      coach: {
        id: coachId,
        email: userProfile.email || user.email
      },
      folders: results,
      structure: {
        'product-media': `coaches/${coachId}`,
        'user-media': `coaches/${coachId}`
      }
    })
    
  } catch (error: any) {
    console.error('❌ INITIALIZE-STORAGE: Error interno:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Endpoint GET para verificar si un coach ya tiene su estructura inicializada
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseAuth = await createRouteHandlerClient()
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'No autorizado'
      }, { status: 401 })
    }
    
    // Verificar metadata en la base de datos
    const { data: metadata, error: metadataError } = await supabaseAuth
      .from('coach_storage_metadata')
      .select('*')
      .eq('coach_id', user.id)
      .maybeSingle()
    
    if (metadataError && !metadataError.message.includes('does not exist')) {
      console.error('Error verificando metadata:', metadataError)
    }
    
    return NextResponse.json({
      initialized: !!metadata?.storage_initialized,
      coachId: user.id,
      metadata: metadata || null
    })
    
  } catch (error: any) {
    console.error('Error en GET initialize-storage:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

