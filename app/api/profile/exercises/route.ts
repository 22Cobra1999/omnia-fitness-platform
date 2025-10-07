import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(cookieStore)
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    // Obtener ejercicios del usuario
    const { data: exercises, error: exercisesError } = await supabase
      .from('user_exercises')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (exercisesError) {
      console.error('Error fetching exercises:', exercisesError)
      return NextResponse.json({ error: 'Error al obtener ejercicios' }, { status: 500 })
    }
    // Para cada ejercicio, obtener los últimos 4 records
    const exercisesWithRecords = await Promise.all(
      exercises.map(async (exercise) => {
        const { data: records, error: recordsError } = await supabase
          .from('user_progress_records')
          .select('*')
          .eq('user_id', user.id)
          .eq('exercise_title', exercise.title)
          .order('record_date', { ascending: false })
          .limit(4)
        if (recordsError) {
          console.error('Error fetching records:', recordsError)
          return { ...exercise, records: [] }
        }
        return { ...exercise, records: records || [] }
      })
    )
    return NextResponse.json({
      success: true,
      exercises: exercisesWithRecords
    })
  } catch (error) {
    console.error('Error in exercises get:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(cookieStore)
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const body = await request.json()
    const { title, unit, current_value } = body
    if (!title || !unit || current_value === undefined) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }
    // Verificar si el ejercicio ya existe
    const { data: existingExercise } = await supabase
      .from('user_exercises')
      .select('id')
      .eq('user_id', user.id)
      .eq('title', title)
      .single()
    let exerciseId = existingExercise?.id
    // Si no existe, crear el ejercicio
    if (!exerciseId) {
      const { data: newExercise, error: exerciseError } = await supabase
        .from('user_exercises')
        .insert({
          user_id: user.id,
          title,
          unit,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      if (exerciseError) {
        console.error('Error creating exercise:', exerciseError)
        return NextResponse.json({ error: 'Error al crear ejercicio' }, { status: 500 })
      }
      exerciseId = newExercise.id
    }
    // Crear el primer record
    const { data: record, error: recordError } = await supabase
      .from('user_progress_records')
      .insert({
        user_id: user.id,
        exercise_title: title,
        unit,
        current_value: parseFloat(current_value),
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
      exercise: { id: exerciseId, title, unit },
      record
    })
  } catch (error) {
    console.error('Error in exercises post:', error)
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
    const exerciseId = searchParams.get('id')
    if (!exerciseId) {
      return NextResponse.json({ error: 'ID de ejercicio requerido' }, { status: 400 })
    }
    // Obtener el título del ejercicio para eliminar los records
    const { data: exercise } = await supabase
      .from('user_exercises')
      .select('title')
      .eq('id', exerciseId)
      .eq('user_id', user.id)
      .single()
    if (exercise) {
      // Eliminar todos los records del ejercicio
      await supabase
        .from('user_progress_records')
        .delete()
        .eq('user_id', user.id)
        .eq('exercise_title', exercise.title)
    }
    // Eliminar el ejercicio
    const { error: deleteError } = await supabase
      .from('user_exercises')
      .delete()
      .eq('id', exerciseId)
      .eq('user_id', user.id)
    if (deleteError) {
      console.error('Error deleting exercise:', deleteError)
      return NextResponse.json({ error: 'Error al eliminar ejercicio' }, { status: 500 })
    }
    return NextResponse.json({
      success: true,
      message: 'Ejercicio eliminado correctamente'
    })
  } catch (error) {
    console.error('Error in exercises delete:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}






