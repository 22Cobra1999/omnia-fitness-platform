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
    // Obtener objetivos de ejercicios del usuario
    const { data: exercises, error: exercisesError } = await supabase
      .from('user_exercise_objectives')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (exercisesError) {
      console.error('Error fetching exercises:', exercisesError)
      return NextResponse.json({ 
        error: 'Error al obtener ejercicios', 
        details: exercisesError.message,
        code: exercisesError.code 
      }, { status: 500 })
    }
    return NextResponse.json({
      success: true,
      exercises: exercises || []
    })
  } catch (error) {
    console.error('Error in exercise progress get:', error)
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
    const { exercise_title, unit, value, exercise_id } = body
    if ((!exercise_title && !exercise_id) || value === undefined) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }
    // Si se proporciona exercise_id, buscar por ID, sino por título
    let existingExercise
    if (exercise_id) {
      const { data } = await supabase
        .from('user_exercise_objectives')
        .select('*')
        .eq('user_id', user.id)
        .eq('id', exercise_id)
        .single()
      existingExercise = data
    } else {
      const { data } = await supabase
        .from('user_exercise_objectives')
        .select('*')
        .eq('user_id', user.id)
        .eq('exercise_title', exercise_title)
        .single()
      existingExercise = data
    }
    if (existingExercise) {
      // Actualizar valor actual del ejercicio existente
      const updateData = {
        current_value: parseFloat(value),
        updated_at: new Date().toISOString()
      }
      const { data: updatedExercise, error: updateError } = await supabase
        .from('user_exercise_objectives')
        .update(updateData)
        .eq('id', existingExercise.id)
        .select()
        .single()
      if (updateError) {
        console.error('Error updating exercise:', updateError)
        return NextResponse.json({ error: 'Error al actualizar ejercicio' }, { status: 500 })
      }
      return NextResponse.json({
        success: true,
        exercise: updatedExercise
      })
    } else {
      // Crear nuevo ejercicio
      const { data: newExercise, error: createError } = await supabase
        .from('user_exercise_objectives')
        .insert({
          user_id: user.id,
          exercise_title,
          unit,
          current_value: parseFloat(value),
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      if (createError) {
        console.error('Error creating exercise:', createError)
        return NextResponse.json({ 
          error: 'Error al crear ejercicio', 
          details: createError.message,
          code: createError.code 
        }, { status: 500 })
      }
      return NextResponse.json({
        success: true,
        exercise: newExercise
      })
    }
  } catch (error) {
    console.error('Error in exercise progress post:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error in PUT:', authError)
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const body = await request.json()
    const { id, value_index, value, exercise_title, objective } = body
    console.log('PUT request body:', { id, value_index, value, exercise_title, objective, valueType: typeof value })
    if (!id) {
      console.error('Missing required fields:', { id, value_index, value, exercise_title })
      return NextResponse.json({ error: 'ID de ejercicio requerido' }, { status: 400 })
    }
    // Si se está editando el título o el objetivo
    if (exercise_title || objective !== undefined) {
      const updateData: any = {
        updated_at: new Date().toISOString()
      }
      if (exercise_title) {
        updateData.exercise_title = exercise_title.trim()
      }
      if (objective !== undefined) {
        updateData.objective = objective ? parseFloat(objective) : null
      }
      const { data: updatedExercise, error: updateError } = await supabase
        .from('user_exercise_objectives')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()
      if (updateError) {
        console.error('Error updating exercise:', updateError)
        return NextResponse.json({ 
          error: 'Error al actualizar ejercicio', 
          details: updateError.message,
          code: updateError.code 
        }, { status: 500 })
      }
      console.log('Successfully updated exercise:', updatedExercise)
      return NextResponse.json({
        success: true,
        exercise: updatedExercise
      })
    }
    // Para la nueva estructura, solo manejamos actualización de current_value
    if (value !== undefined && value !== null) {
      const numericValue = parseFloat(value)
      if (isNaN(numericValue)) {
        console.error('Invalid numeric value:', value)
        return NextResponse.json({ error: 'Valor numérico inválido' }, { status: 400 })
      }
      const updateData = {
        current_value: numericValue,
        updated_at: new Date().toISOString()
      }
      console.log('Update data:', updateData)
      const { data: updatedExercise, error: updateError } = await supabase
        .from('user_exercise_objectives')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()
      if (updateError) {
        console.error('Error updating exercise value:', updateError)
        return NextResponse.json({ 
          error: 'Error al actualizar valor', 
          details: updateError.message,
          code: updateError.code 
        }, { status: 500 })
      }
      console.log('Successfully updated exercise:', updatedExercise)
      return NextResponse.json({
        success: true,
        exercise: updatedExercise
      })
    }
    return NextResponse.json({ error: 'No se proporcionó valor para actualizar' }, { status: 400 })
  } catch (error) {
    console.error('Error in exercise progress put:', error)
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
    const exerciseId = searchParams.get('id')
    if (!exerciseId) {
      return NextResponse.json({ error: 'ID de ejercicio requerido' }, { status: 400 })
    }
    // Eliminar el ejercicio
    const { error: deleteError } = await supabase
      .from('user_exercise_objectives')
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
    console.error('Error in exercise progress delete:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
