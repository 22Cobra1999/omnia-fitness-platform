import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const formData = await request.formData()
    const updateData: any = {}
    // Procesar campos de texto para user_profiles
    const userProfileFields = ['full_name', 'email']
    const userProfileData: any = {}
    userProfileFields.forEach(field => {
      const value = formData.get(field)
      if (value !== null && value !== '') {
        userProfileData[field] = value
      }
    })
    // Procesar campos de texto para clients
    const clientFields = ['phone', 'location', 'emergency_contact', 'age', 'weight', 'height', 'gender', 'level']
    const clientData: any = {}
    clientFields.forEach(field => {
      const value = formData.get(field)
      if (value !== null && value !== '') {
        // Mapear campos a los nombres correctos de la tabla clients
        const fieldMapping: { [key: string]: string } = {
          'weight': 'weight',
          'height': 'Height',
          'gender': 'Genre',
          'level': 'activity_level'
        }
        const dbField = fieldMapping[field] || field
        clientData[dbField] = value
      }
    })
    // Procesar imagen de perfil
    const profileImage = formData.get('profile_image') as File
    let imageUrl = null
    if (profileImage && profileImage.size > 0) {
      try {
        // Crear cliente con service role para subir archivos
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        // Generar nombre único para la imagen
        const fileExt = profileImage.name.split('.').pop()
        const fileName = `profile-${user.id}-${Date.now()}.${fileExt}`
        const filePath = `Foto de perfil/${fileName}`
        // Subir imagen al bucket product-images en la carpeta Foto de perfil
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('product-images')
          .upload(filePath, profileImage, {
            cacheControl: '3600',
            upsert: true
          })
        if (uploadError) {
          console.error('Error uploading image:', uploadError)
          return NextResponse.json({ error: 'Error al subir la imagen' }, { status: 500 })
        }
        // Obtener URL pública de la imagen
        const { data: urlData } = supabaseAdmin.storage
          .from('product-images')
          .getPublicUrl(filePath)
        imageUrl = urlData.publicUrl
        userProfileData.avatar_url = imageUrl
      } catch (error) {
        console.error('Error processing image:', error)
        return NextResponse.json({ error: 'Error al procesar la imagen' }, { status: 500 })
      }
    }
    // Actualizar user_profiles
    let profileData = null
    if (Object.keys(userProfileData).length > 0) {
      const { data: userProfile, error: userProfileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          ...userProfileData,
          role: 'client', // Asegurar que role no sea null
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      if (userProfileError) {
        console.error('Error updating user_profiles:', userProfileError)
        return NextResponse.json({ error: 'Error al actualizar el perfil de usuario' }, { status: 500 })
      }
      profileData = userProfile
    }
    // Actualizar clients
    if (Object.keys(clientData).length > 0) {
      const { data: clientProfile, error: clientError } = await supabase
        .from('clients')
        .upsert({
          id: user.id,
          ...clientData,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      if (clientError) {
        console.error('Error updating clients:', clientError)
        return NextResponse.json({ error: 'Error al actualizar el perfil de cliente' }, { status: 500 })
      }
      // Combinar datos si tenemos ambos
      if (profileData) {
        profileData = { ...profileData, ...clientProfile }
      } else {
        profileData = clientProfile
      }
    }
    return NextResponse.json({
      success: true,
      profile: profileData,
      imageUrl
    })
  } catch (error) {
    console.error('Error in profile update:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = await createClientWithCookies(cookieStore)
    // Verificar autenticación
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
    // Obtener perfil de clients
    const { data: clientProfile, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', user.id)
      .single()
    // Combinar perfiles
    let combinedProfile = null
    if (userProfile || clientProfile) {
      combinedProfile = {
        ...userProfile,
        ...clientProfile,
        // Mapear campos de clients a nombres del frontend
        height: clientProfile?.Height,
        gender: clientProfile?.Genre,
        level: clientProfile?.activity_level
      }
    }
    if (userProfileError && userProfileError.code !== 'PGRST116') {
      console.error('Error fetching user profile:', userProfileError)
    }
    if (clientError && clientError.code !== 'PGRST116') {
      console.error('Error fetching client profile:', clientError)
    }
    return NextResponse.json({
      success: true,
      profile: combinedProfile
    })
  } catch (error) {
    console.error('Error in profile get:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
