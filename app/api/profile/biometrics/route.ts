import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    // Obtener mediciones biométricas del usuario
    const { data: biometrics, error: biometricsError } = await supabase
      .from('user_biometrics')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (biometricsError) {
      console.error('Error fetching biometrics:', biometricsError)
      return NextResponse.json({ error: 'Error al obtener mediciones' }, { status: 500 })
    }
    return NextResponse.json({
      success: true,
      biometrics: biometrics || []
    })
  } catch (error) {
    console.error('Error in biometrics get:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const body = await request.json()
    const { name, value, unit, notes } = body
    if (!name || value === undefined || !unit) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }
    // Crear nueva medición
    const { data: biometric, error: biometricError } = await supabase
      .from('user_biometrics')
      .insert({
        user_id: user.id,
        name,
        value: parseFloat(value),
        unit,
        notes: notes || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    if (biometricError) {
      console.error('Error creating biometric:', biometricError)
      return NextResponse.json({ error: 'Error al crear medición' }, { status: 500 })
    }
    return NextResponse.json({
      success: true,
      biometric
    })
  } catch (error) {
    console.error('Error in biometrics post:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const body = await request.json()
    const { id, value, notes } = body
    if (!id || value === undefined) {
      return NextResponse.json({ error: 'ID y valor requeridos' }, { status: 400 })
    }
    const updateData: any = {
      value: parseFloat(value),
      updated_at: new Date().toISOString()
    }
    if (notes !== undefined) updateData.notes = notes
    // Actualizar medición
    const { data: biometric, error: biometricError } = await supabase
      .from('user_biometrics')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()
    if (biometricError) {
      console.error('Error updating biometric:', biometricError)
      return NextResponse.json({ error: 'Error al actualizar medición' }, { status: 500 })
    }
    return NextResponse.json({
      success: true,
      biometric
    })
  } catch (error) {
    console.error('Error in biometrics put:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'ID de medición requerido' }, { status: 400 })
    }
    // Eliminar medición
    const { error: deleteError } = await supabase
      .from('user_biometrics')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (deleteError) {
      console.error('Error deleting biometric:', deleteError)
      return NextResponse.json({ error: 'Error al eliminar medición' }, { status: 500 })
    }
    return NextResponse.json({
      success: true,
      message: 'Medición eliminada correctamente'
    })
  } catch (error) {
    console.error('Error in biometrics delete:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
