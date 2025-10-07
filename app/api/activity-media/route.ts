import { createRouteHandlerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// POST - Crear o actualizar media para una actividad
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que el usuario existe en user_profiles
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'Perfil de usuario no encontrado' }, { status: 404 })
    }

    // Verificar que es un coach
    if (userProfile.role !== 'coach') {
      return NextResponse.json({ error: 'Solo los coaches pueden gestionar media' }, { status: 403 })
    }

    const body = await request.json()
    const { activity_id, image_url, video_url, vimeo_id, pdf_url } = body

    // Validar datos requeridos
    if (!activity_id) {
      return NextResponse.json({ error: 'activity_id es requerido' }, { status: 400 })
    }

    // Verificar que la actividad existe y pertenece al coach
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('id, coach_id')
      .eq('id', activity_id)
      .single()

    if (activityError || !activity) {
      return NextResponse.json({ error: 'Actividad no encontrada' }, { status: 404 })
    }

    if (activity.coach_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado para gestionar esta actividad' }, { status: 403 })
    }

    // Verificar si ya existe un registro de media para esta actividad
    const { data: existingMedia, error: fetchError } = await supabase
      .from('activity_media')
      .select('id')
      .eq('activity_id', activity_id)
      .single()

    let result
    if (existingMedia) {
      // Actualizar registro existente
      const { data, error } = await supabase
        .from('activity_media')
        .update({
          image_url: image_url || null,
          video_url: video_url || null,
          vimeo_id: vimeo_id || null,
          pdf_url: pdf_url || null
        })
        .eq('activity_id', activity_id)
        .select()
        .single()

      if (error) {
        console.error('Error actualizando activity_media:', error)
        return NextResponse.json({ 
          error: 'Error al actualizar media',
          details: error.message 
        }, { status: 500 })
      }

      result = data
    } else {
      // Crear nuevo registro
      const { data, error } = await supabase
        .from('activity_media')
        .insert({
          activity_id,
          image_url: image_url || null,
          video_url: video_url || null,
          vimeo_id: vimeo_id || null,
          pdf_url: pdf_url || null
        })
        .select()
        .single()

      if (error) {
        console.error('Error insertando activity_media:', error)
        return NextResponse.json({ 
          error: 'Error al crear media',
          details: error.message 
        }, { status: 500 })
      }

      result = data
    }

    return NextResponse.json({
      success: true,
      media: result,
      message: existingMedia ? 'Media actualizado exitosamente' : 'Media creado exitosamente'
    })

  } catch (error) {
    console.error('Error en POST /api/activity-media:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// GET - Obtener media de una actividad
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const activity_id = searchParams.get('activity_id')

    if (!activity_id) {
      return NextResponse.json({ error: 'activity_id es requerido' }, { status: 400 })
    }

    // Obtener media de la actividad
    const { data: media, error: mediaError } = await supabase
      .from('activity_media')
      .select('*')
      .eq('activity_id', activity_id)
      .single()

    if (mediaError && mediaError.code !== 'PGRST116') {
      console.error('Error obteniendo media:', mediaError)
      return NextResponse.json({ 
        error: 'Error al obtener media',
        details: mediaError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      media: media || null
    })

  } catch (error) {
    console.error('Error en GET /api/activity-media:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
