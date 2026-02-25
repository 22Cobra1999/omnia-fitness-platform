import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener datos del formulario
    const formData = await request.formData()

    const updateData: any = {}

    // Mapear campos del formulario a columnas de la tabla coaches
    if (formData.has('full_name')) {
      updateData.full_name = formData.get('full_name') || null
    }
    if (formData.has('height')) {
      const height = formData.get('height')
      updateData.height = height ? parseInt(height.toString()) : null
    }
    if (formData.has('weight')) {
      const weight = formData.get('weight')
      updateData.weight = weight ? parseFloat(weight.toString()) : null
    }
    if (formData.has('birth_date')) {
      updateData.birth_date = formData.get('birth_date') || null
    }
    if (formData.has('gender')) {
      updateData.gender = formData.get('gender') || null
    }
    if (formData.has('phone')) {
      updateData.phone = formData.get('phone') || null
    }
    if (formData.has('location')) {
      updateData.location = formData.get('location') || null
    }
    if (formData.has('emergency_contact')) {
      updateData.emergency_contact = formData.get('emergency_contact') || null
    }
    if (formData.has('specialization')) {
      updateData.specialization = formData.get('specialization') || null
    }
    if (formData.has('experience_years')) {
      const exp = formData.get('experience_years')
      updateData.experience_years = exp ? parseInt(exp.toString()) : 0
    }
    if (formData.has('whatsapp')) {
      const wa = formData.get('whatsapp')
      updateData.whatsapp = wa ? parseFloat(wa.toString()) : null
    }
    if (formData.has('instagram_username')) {
      updateData.instagram_username = formData.get('instagram_username') || null
    }
    if (formData.has('bio')) {
      updateData.bio = formData.get('bio') || null
    }
    if (formData.has('cafe')) {
      const c = formData.get('cafe')
      updateData.cafe = c ? parseFloat(c.toString()) : null
    }
    if (formData.has('cafe_enabled')) {
      updateData.cafe_enabled = formData.get('cafe_enabled') === 'true'
    }
    if (formData.has('meet_1')) {
      const m1 = formData.get('meet_1')
      updateData.meet_1 = m1 ? parseInt(m1.toString()) : 0
    }
    if (formData.has('meet_1_enabled')) {
      updateData.meet_1_enabled = formData.get('meet_1_enabled') === 'true'
    }
    if (formData.has('meet_30')) {
      const m30 = formData.get('meet_30')
      updateData.meet_30 = m30 ? parseInt(m30.toString()) : 0
    }
    if (formData.has('meet_30_enabled')) {
      updateData.meet_30_enabled = formData.get('meet_30_enabled') === 'true'
    }
    if (formData.has('category')) {
      updateData.category = formData.get('category') || 'general'
    }

    // Actualizar coaches
    const { data: updatedCoach, error: updateError } = await supabase
      .from('coaches')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error actualizando coach:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Error al actualizar el perfil del coach',
        details: updateError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      profile: {
        full_name: updatedCoach?.full_name || null,
        height: updatedCoach?.height || null,
        weight: updatedCoach?.weight || null,
        birth_date: updatedCoach?.birth_date || null,
        gender: updatedCoach?.gender || null,
        phone: updatedCoach?.phone || null,
        location: updatedCoach?.location || null,
        emergency_contact: updatedCoach?.emergency_contact || null,
        specialization: updatedCoach?.specialization || null,
        experience_years: updatedCoach?.experience_years || 0,
        whatsapp: updatedCoach?.whatsapp || null,
        instagram_username: updatedCoach?.instagram_username || null,
        bio: updatedCoach?.bio || null,
        cafe: updatedCoach?.cafe || null,
        cafe_enabled: updatedCoach?.cafe_enabled || false,
        meet_1: updatedCoach?.meet_1 || 0,
        meet_1_enabled: updatedCoach?.meet_1_enabled || false,
        meet_30: updatedCoach?.meet_30 || 0,
        meet_30_enabled: updatedCoach?.meet_30_enabled || false,
        category: updatedCoach?.category || 'general'
      }
    })

  } catch (error) {
    console.error('Error en PUT /api/profile/coach:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

