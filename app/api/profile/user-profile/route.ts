import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const formData = await request.formData()

    const full_name = formData.get('full_name') as string | null
    const email = formData.get('email') as string | null
    const profile_image = formData.get('profile_image') as File | null

    const updateData: any = {}
    if (full_name !== null && full_name !== undefined) updateData.full_name = full_name
    if (email !== null && email !== undefined) updateData.email = email

    // PROCESAR IMAGEN DE PERFIL SI EXISTE
    if (profile_image && profile_image.size > 0) {
      try {
        const fileExt = profile_image.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        
        // Subir al bucket 'product-media' en la subcarpeta 'avatars/'
        const { error: uploadError } = await supabase.storage
          .from('product-media')
          .upload(`avatars/${fileName}`, profile_image)

        if (uploadError) {
          console.error('Error uploading image to storage:', uploadError)
        } else {
          // Obtener URL pública desde el bucket correcto
          const { data: { publicUrl } } = supabase.storage
            .from('product-media')
            .getPublicUrl(`avatars/${fileName}`)
          
          updateData.avatar_url = publicUrl
        }
      } catch (err) {
        console.error('Error processing profile image:', err)
      }
    }

    // Si no hay nada para actualizar, devolver el perfil actual
    if (Object.keys(updateData).length === 0) {
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, avatar_url')
        .eq('id', user.id)
        .maybeSingle()

      return NextResponse.json({
        success: true,
        profile: existingProfile || {
          id: user.id,
          full_name: user.user_metadata?.full_name || '',
          email: user.email || '',
          avatar_url: user.user_metadata?.avatar_url || null,
        },
      })
    }

    // Primero intentar actualizar el registro existente
    const { data: updated, error: updateError } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', user.id)
      .select('id, full_name, email, avatar_url')
      .maybeSingle()

    if (updateError && updateError.code !== 'PGRST116') {
      console.error('Error actualizando user_profiles:', updateError)
      return NextResponse.json(
        {
          success: false,
          error: 'Error al actualizar datos básicos del perfil',
          details: updateError.message,
        },
        { status: 500 }
      )
    }

    // Si no existía el registro (PGRST116), crear uno nuevo
    let finalProfile = updated

    if (!finalProfile) {
      const { data: inserted, error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          ...updateData,
        })
        .select('id, full_name, email, avatar_url')
        .single()

      if (insertError) {
        console.error('Error insertando user_profiles:', insertError)
        return NextResponse.json(
          {
            success: false,
            error: 'Error al crear datos básicos del perfil',
            details: insertError.message,
          },
          { status: 500 }
        )
      }

      finalProfile = inserted
    }

    return NextResponse.json({
      success: true,
      profile: finalProfile,
    })
  } catch (error) {
    console.error('Error en PUT /api/profile/user-profile:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}


