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
        height: updatedCoach?.height || null,
        weight: updatedCoach?.weight || null,
        birth_date: updatedCoach?.birth_date || null,
        gender: updatedCoach?.gender || null,
        phone: updatedCoach?.phone || null,
        location: updatedCoach?.location || null,
        emergency_contact: updatedCoach?.emergency_contact || null,
        specialization: updatedCoach?.specialization || null,
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

