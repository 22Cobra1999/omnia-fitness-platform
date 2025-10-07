import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // console.log('🔍 Debug: Obteniendo datos de fitness_exercises para activity_id:', id)
    const supabase = createClient(cookieStore)
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    // Obtener ejercicios de fitness
    const { data: fitnessExercises, error: fitnessError } = await supabase
      .from('fitness_exercises')
      .select('*')
      .eq('activity_id', id)
      .order('semana', { ascending: true })
      .order('día', { ascending: true })
    if (fitnessError) {
      console.error('❌ Error obteniendo ejercicios:', fitnessError)
      return NextResponse.json({ error: 'Error obteniendo ejercicios' }, { status: 500 })
    }
    // console.log(`✅ Obtenidos ${fitnessExercises?.length || 0} ejercicios`)
    // Mostrar los primeros 3 ejercicios con sus datos
    const sampleExercises = fitnessExercises?.slice(0, 3) || []
    return NextResponse.json({
      success: true,
      totalExercises: fitnessExercises?.length || 0,
      sampleExercises: sampleExercises.map(exercise => ({
        id: exercise.id,
        semana: exercise.semana,
        día: exercise.día,
        nombre_actividad: exercise.nombre_actividad,
        descripción: exercise.descripción,
        duracion_min: exercise.duracion_min,
        tipo_ejercicio: exercise.tipo_ejercicio,
        nivel_intensidad: exercise.nivel_intensidad,
        equipo_necesario: exercise.equipo_necesario,
        one_rm: exercise.one_rm,
        detalle_series: exercise.detalle_series,
        video_url: exercise.video_url,
        created_at: exercise.created_at,
        updated_at: exercise.updated_at
      })),
      allExercises: fitnessExercises
    })
  } catch (error) {
    console.error('Error en debug endpoint:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
