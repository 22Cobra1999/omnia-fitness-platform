import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

// GET: Obtener progreso del cliente para una actividad específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ activityId: string }> }
) {
  try {
    const resolvedParams = await params
    const activityId = resolvedParams.activityId
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener inscripción del cliente para esta actividad
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('activity_enrollments')
      .select(`
        id,
        activity_id,
        client_id,
        status,
        start_date,
        periodos_asignados (
          id,
          created_at,
          duracion_semanas
        )
      `)
      .eq('activity_id', activityId)
      .eq('client_id', user.id)
      .eq('status', 'active')
      .single()

    if (enrollmentError || !enrollment) {
      return NextResponse.json({ 
        error: 'No se encontró inscripción activa para esta actividad' 
      }, { status: 404 })
    }

    // Obtener ejercicios organizados para la actividad
    const { data: organizedExercises, error: exercisesError } = await supabase
      .from('organizacion_ejercicios')
      .select(`
        id,
        semana,
        dia,
        bloque,
        ejercicio_id,
        ejercicio:ejercicios_detalles!inner(
          id,
          nombre_ejercicio,
          descripcion,
          tipo,
          duracion_min
        )
      `)
      .eq('activity_id', activityId)
      .order('semana', { ascending: true })
      .order('dia', { ascending: true })
      .order('bloque', { ascending: true })

    if (exercisesError) {
      console.error('Error fetching organized exercises:', exercisesError)
      return NextResponse.json({ 
        error: 'Error al obtener ejercicios organizados' 
      }, { status: 500 })
    }

    // Obtener ejecuciones del cliente
    const { data: executions, error: executionsError } = await supabase
      .from('ejecuciones_ejercicio')
      .select(`
        id,
        ejercicio_id,
        completado,
        fecha_ejecucion,
        completed_at,
        intensidad_aplicada,
        duracion,
        calorias_estimadas,
        peso_usado,
        repeticiones_realizadas,
        series_completadas,
        nota_cliente
      `)
      .in('periodo_id', enrollment.periodos_asignados.map(p => p.id))

    if (executionsError) {
      console.error('Error fetching executions:', executionsError)
      return NextResponse.json({ 
        error: 'Error al obtener ejecuciones' 
      }, { status: 500 })
    }

    // Organizar datos por semana y día
    const progressByWeek: { [key: number]: any } = {}
    const executionsMap = new Map(executions?.map(e => [e.ejercicio_id, e]) || [])

    organizedExercises?.forEach(exercise => {
      const week = exercise.semana
      const day = exercise.dia
      const execution = executionsMap.get(exercise.ejercicio_id)

      if (!progressByWeek[week]) {
        progressByWeek[week] = {}
      }
      if (!progressByWeek[week][day]) {
        progressByWeek[week][day] = {
          dayNumber: day,
          dayName: getDayName(day),
          exercises: []
        }
      }

      progressByWeek[week][day].exercises.push({
        id: exercise.id,
        ejercicio_id: exercise.ejercicio_id,
        bloque: exercise.bloque,
        nombre_ejercicio: exercise.ejercicio.nombre_ejercicio,
        descripcion: exercise.ejercicio.descripcion,
        tipo: exercise.ejercicio.tipo,
        duracion_min: 30, // Valor por defecto
        completado: execution?.completado || false,
        fecha_ejecucion: execution?.fecha_ejecucion,
        completed_at: execution?.completed_at,
        intensidad_aplicada: execution?.intensidad_aplicada,
        duracion: execution?.duracion,
        calorias_estimadas: execution?.calorias_estimadas,
        peso_usado: execution?.peso_usado,
        repeticiones_realizadas: execution?.repeticiones_realizadas,
        series_completadas: execution?.series_completadas,
        nota_cliente: execution?.nota_cliente
      })
    })

    // Calcular estadísticas
    const totalExercises = organizedExercises?.length || 0
    const completedExercises = executions?.filter(e => e.completado).length || 0
    const progressPercentage = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0

    return NextResponse.json({
      success: true,
      enrollment: {
        id: enrollment.id,
        activity_id: enrollment.activity_id,
        start_date: enrollment.start_date,
        status: enrollment.status
      },
      period: enrollment.periodos_asignados[0],
      progress: {
        totalExercises,
        completedExercises,
        pendingExercises: totalExercises - completedExercises,
        progressPercentage
      },
      weeks: progressByWeek
    })

  } catch (error) {
    console.error('Error in client progress API:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// Función auxiliar para convertir número de día a nombre
function getDayName(dayNumber: number): string {
  const dayNames = ['', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
  return dayNames[dayNumber] || ''
}
