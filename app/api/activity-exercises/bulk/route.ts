import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const body = await request.json()
    const { activityId, exercises } = body
    
    if (!activityId || !exercises || !Array.isArray(exercises)) {
      return NextResponse.json({ 
        error: 'Se requiere activityId y un array de exercises' 
      }, { status: 400 })
    }
    
    // Mapear ejercicios al formato de la tabla ejercicios_detalles
    const exercisesToInsert = exercises.map((exercise: any) => ({
      nombre_ejercicio: exercise.nombre || exercise['Nombre de la Actividad'] || '',
      descripcion: exercise.descripcion || exercise['Descripción'] || '',
      duracion_min: exercise.duracion_min || exercise['Duración (min)'] ? 
        parseInt(exercise.duracion_min || exercise['Duración (min)']) : null,
      tipo: exercise.tipo_ejercicio || exercise['Tipo de Ejercicio'] || '',
      intensidad: exercise.intensidad || exercise['Nivel de Intensidad'] || 'Moderado',
      equipo: exercise.equipo_necesario || exercise['Equipo Necesario'] || '',
      detalle_series: exercise.detalle_series || exercise['Detalle de Series (peso-repeticiones-series)'] || '',
      body_parts: exercise.body_parts || exercise['Partes del Cuerpo'] || '',
      calorias: exercise.calorias || exercise['Calorías'] ? 
        parseFloat(exercise.calorias || exercise['Calorías']) : null,
      video_url: exercise.video_url || null,
      activity_id: activityId,
      coach_id: user.id
    }))
    
    console.log('💾 Insertando ejercicios en bulk:', exercisesToInsert.length, 'items')
    
    // Insertar todos los ejercicios
    const { data: insertedExercises, error: insertError } = await supabase
      .from('ejercicios_detalles')
      .insert(exercisesToInsert)
      .select()
    
    if (insertError) {
      console.error('Error insertando ejercicios en bulk:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      insertedCount: insertedExercises?.length || 0,
      data: insertedExercises
    })
    
  } catch (error) {
    console.error('Error en API POST bulk de ejercicios:', error)
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
    const activityId = searchParams.get('activityId')
    
    if (!activityId) {
      return NextResponse.json({ error: 'Se requiere activityId' }, { status: 400 })
    }
    
    // Eliminar todos los ejercicios de la actividad
    const { error: deleteError } = await supabase
      .from('ejercicios_detalles')
      .delete()
      .eq('activity_id', parseInt(activityId))
      .eq('coach_id', user.id)
    
    if (deleteError) {
      console.error('Error eliminando ejercicios:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Ejercicios eliminados correctamente'
    })
    
  } catch (error) {
    console.error('Error en API DELETE bulk de ejercicios:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

