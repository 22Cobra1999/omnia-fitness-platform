import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    // Obtener perfil de user_profiles
    const { data: userProfile, error: userProfileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    if (userProfileError && userProfileError.code !== 'PGRST116') {
      console.error('Error fetching user profile:', userProfileError)
      return NextResponse.json({ error: 'Error al obtener el perfil' }, { status: 500 })
    }
    return NextResponse.json({
      success: true,
      profile: userProfile
    })
  } catch (error) {
    console.error('Error in user profile get:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
export async function PUT(request: NextRequest) {
  try {
    console.log('🔥 [API Profile] PUT request iniciada')
    console.log('🔧 [API Profile] Variables de entorno disponibles:')
    console.log('  - NEXT_PUBLIC_SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('  - SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    
    const supabase = await createClient()
    console.log('✅ [API Profile] Cliente Supabase creado')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('🔐 [API Profile] Usuario autenticado:', { userId: user?.id, hasError: !!authError })
    
    if (authError || !user) {
      console.error('❌ [API Profile] Error de autenticación:', authError)
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    console.log('📝 [API Profile] Procesando formData...')
    const formData = await request.formData()
    // Procesar campos para user_profiles
    const userProfileData: any = {
      id: user.id,
      updated_at: new Date().toISOString()
    }
    // Campos de user_profiles
    const userProfileFields = ['full_name', 'email']
    userProfileFields.forEach(field => {
      const value = formData.get(field)
      if (value !== null && value !== '') {
        userProfileData[field] = value
      }
    })
    // Procesar imagen de perfil
    const profileImage = formData.get('profile_image') as File
    console.log('🖼️ [API Profile] Procesando imagen:', { 
      hasImage: !!profileImage, 
      imageSize: profileImage?.size, 
      imageName: profileImage?.name,
      imageType: profileImage?.type 
    })
    
    if (profileImage && profileImage.size > 0) {
      try {
        console.log('🔄 [API Profile] Iniciando subida de imagen...')
        
        // Verificar variables de entorno
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        
        console.log('🔧 [API Profile] Variables de entorno:', {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!serviceRoleKey,
          url: supabaseUrl?.substring(0, 20) + '...'
        })
        
        if (!supabaseUrl || !serviceRoleKey) {
          console.warn('⚠️ [API Profile] Variables de entorno faltantes - continuando sin subir imagen')
          userProfileData.avatar_url = null
        } else {
          // Crear cliente con service role para subir archivos
          const supabaseAdmin = createSupabaseClient(supabaseUrl, serviceRoleKey)
          console.log('✅ [API Profile] Cliente admin creado')
          
          // Generar nombre único para el archivo
          const fileExt = profileImage.name.split('.').pop()
          const fileName = `${user.id}-${Date.now()}.${fileExt}`
          const filePath = `avatars/${fileName}`
          
          console.log('📁 [API Profile] Datos de archivo:', {
            fileExt,
            fileName,
            filePath,
            originalName: profileImage.name
          })
          
          // Subir imagen al bucket product-media en la carpeta avatars
          console.log('⬆️ [API Profile] Subiendo a bucket product-media...')
          const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('product-media')
            .upload(filePath, profileImage, {
              cacheControl: '3600',
              upsert: true
            })
            
          if (uploadError) {
            console.error('❌ [API Profile] Error uploading image:', uploadError)
            // Continuar sin imagen en lugar de fallar
            console.warn('⚠️ [API Profile] Continuando sin imagen debido a error de subida')
            userProfileData.avatar_url = null
          } else {
            console.log('✅ [API Profile] Imagen subida correctamente:', uploadData)
            
            // Obtener URL pública de la imagen
            const { data: urlData } = supabaseAdmin.storage
              .from('product-media')
              .getPublicUrl(filePath)
              
            console.log('🔗 [API Profile] URL pública generada:', urlData.publicUrl)
            userProfileData.avatar_url = urlData.publicUrl
          }
        }
        
      } catch (error) {
        console.error('❌ [API Profile] Error processing image:', error)
        // Continuar sin imagen en lugar de fallar
        console.warn('⚠️ [API Profile] Continuando sin imagen debido a error de procesamiento')
        userProfileData.avatar_url = null
      }
    } else {
      console.log('ℹ️ [API Profile] No hay imagen para procesar')
    }
    // Actualizar user_profiles
    console.log('🔄 [API Profile] Actualizando user_profiles con datos:', userProfileData)
    
    const { data: profileData, error: updateError } = await supabase
      .from('user_profiles')
      .upsert({
        ...userProfileData,
        role: 'client' // Asegurar que role no sea null
      })
      .select()
      .single()
      
    if (updateError) {
      console.error('❌ [API Profile] Error updating user_profiles:', updateError)
      return NextResponse.json({ 
        error: 'Error al actualizar el perfil de usuario', 
        details: updateError.message 
      }, { status: 500 })
    }
    
    console.log('✅ [API Profile] Perfil actualizado correctamente:', profileData)
    return NextResponse.json({
      success: true,
      profile: profileData
    })
  } catch (error) {
    console.error('Error in user profile update:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
