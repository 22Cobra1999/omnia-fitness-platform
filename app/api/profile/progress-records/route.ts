import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(cookieStore)
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const body = await request.json()
    const { exercise_title, unit, current_value, notes } = body
    if (!exercise_title || !unit || current_value === undefined) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }
    // Verificar si ya hay 4 records para este ejercicio
    const { data: existingRecords, error: countError } = await supabase
      .from('user_progress_records')
      .select('id')
      .eq('user_id', user.id)
      .eq('exercise_title', exercise_title)
      .order('record_date', { ascending: false })
    if (countError) {
      console.error('Error counting records:', countError)
      return NextResponse.json({ error: 'Error al verificar registros' }, { status: 500 })
    }
    // Si ya hay 4 records, eliminar el más antiguo
    if (existingRecords && existingRecords.length >= 4) {
      const oldestRecord = existingRecords[existingRecords.length - 1]
      await supabase
        .from('user_progress_records')
        .delete()
        .eq('id', oldestRecord.id)
    }
    // Crear el nuevo record
    const { data: record, error: recordError } = await supabase
      .from('user_progress_records')
      .insert({
        user_id: user.id,
        exercise_title,
        unit,
        current_value: parseFloat(current_value),
        notes: notes || null,
        record_date: new Date().toISOString()
      })
      .select()
      .single()
    if (recordError) {
      console.error('Error creating record:', recordError)
      return NextResponse.json({ error: 'Error al crear registro' }, { status: 500 })
    }
    return NextResponse.json({
      success: true,
      record
    })
  } catch (error) {
    console.error('Error in progress records post:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient(cookieStore)
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const body = await request.json()
    const { id, current_value, notes } = body
    if (!id || current_value === undefined) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }
    // Actualizar el record
    const { data: record, error: recordError } = await supabase
      .from('user_progress_records')
      .update({
        current_value: parseFloat(current_value),
        notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()
    if (recordError) {
      console.error('Error updating record:', recordError)
      return NextResponse.json({ error: 'Error al actualizar registro' }, { status: 500 })
    }
    return NextResponse.json({
      success: true,
      record
    })
  } catch (error) {
    console.error('Error in progress records put:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient(cookieStore)
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const recordId = searchParams.get('id')
    if (!recordId) {
      return NextResponse.json({ error: 'ID de registro requerido' }, { status: 400 })
    }
    // Eliminar el record
    const { error: deleteError } = await supabase
      .from('user_progress_records')
      .delete()
      .eq('id', recordId)
      .eq('user_id', user.id)
    if (deleteError) {
      console.error('Error deleting record:', deleteError)
      return NextResponse.json({ error: 'Error al eliminar registro' }, { status: 500 })
    }
    return NextResponse.json({
      success: true,
      message: 'Registro eliminado correctamente'
    })
  } catch (error) {
    console.error('Error in progress records delete:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}






