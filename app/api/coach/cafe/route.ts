import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'

// GET: Obtener información del café del coach
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    
    // Intentar obtener sesión primero (más confiable en algunos casos)
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ [GET /api/coach/cafe] Error obteniendo sesión:', {
        error: sessionError.message,
        code: sessionError.status,
        name: sessionError.name
      })
    }
    
    // Verificar autenticación con getUser (más seguro)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('❌ [GET /api/coach/cafe] Error de autenticación:', {
        error: authError.message,
        code: authError.status,
        name: authError.name,
        hasSession: !!sessionData?.session,
        sessionError: sessionError?.message
      })
      return NextResponse.json({ 
        error: 'No autenticado',
        details: authError.message 
      }, { status: 401 })
    }
    
    if (!user) {
      console.warn('⚠️ [GET /api/coach/cafe] Usuario no encontrado en sesión', {
        hasSession: !!sessionData?.session,
        sessionUserId: sessionData?.session?.user?.id
      })
      return NextResponse.json({ 
        error: 'No autenticado',
        details: 'Usuario no autenticado'
      }, { status: 401 })
    }
    
    console.log('✅ [GET /api/coach/cafe] Usuario autenticado:', user.id)

    // Obtener información del café desde la tabla coaches
    const { data: coach, error: coachError } = await supabase
      .from('coaches')
      .select('cafe, cafe_enabled')
      .eq('id', user.id)
      .single()

    if (coachError) {
      console.error('Error obteniendo información del café:', coachError)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener información del café',
        details: coachError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      cafe: {
        price: coach?.cafe || 0,
        enabled: coach?.cafe_enabled || false
      }
    })

  } catch (error) {
    console.error('Error en GET /api/coach/cafe:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PUT: Actualizar información del café del coach
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener datos del body
    const body = await request.json()
    const { price, enabled } = body

    const updateData: any = {}

    // Actualizar precio si se proporciona
    if (price !== undefined && price !== null) {
      updateData.cafe = parseInt(price) || 0
    }

    // Actualizar estado habilitado si se proporciona
    if (enabled !== undefined && enabled !== null) {
      updateData.cafe_enabled = Boolean(enabled)
    }

    // Si no hay nada para actualizar, retornar error
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No se proporcionaron datos para actualizar'
      }, { status: 400 })
    }

    // Actualizar coaches
    const { data: updatedCoach, error: updateError } = await supabase
      .from('coaches')
      .update(updateData)
      .eq('id', user.id)
      .select('cafe, cafe_enabled')
      .single()

    if (updateError) {
      console.error('Error actualizando café:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Error al actualizar el café',
        details: updateError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      cafe: {
        price: updatedCoach?.cafe || 0,
        enabled: updatedCoach?.cafe_enabled || false
      }
    })

  } catch (error) {
    console.error('Error en PUT /api/coach/cafe:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}







