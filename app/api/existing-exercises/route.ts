import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

// Devuelve ejercicios existentes del coach (tomados de ejercicios_detalles)
// Filtra por actividades que pertenezcan al coach autenticado y que sean de tipo "program"
// Respuesta: [{ name, descripcion, tipo_ejercicio, nivel_intensidad, equipo_necesario, partes_cuerpo }]
export async function GET() {
  try {
    const supabase = await createRouteHandlerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener actividades del coach
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('id, type')
      .eq('coach_id', user.id)

    if (activitiesError) {
      return NextResponse.json({ error: 'Error obteniendo actividades' }, { status: 500 })
    }

    if (!activities || activities.length === 0) {
      return NextResponse.json({ exercises: [] })
    }

    const activityIds = activities
      .filter(a => (a as any).type === 'program' || (a as any).type === 'fitness')
      .map(a => a.id)

    if (activityIds.length === 0) {
      return NextResponse.json({ exercises: [] })
    }

    // Tomar ejercicios existentes de esas actividades y devolver únicos por nombre + tipo
    const { data: details, error: detailsError } = await supabase
      .from('ejercicios_detalles')
      .select('id, nombre_ejercicio, descripcion, tipo, nivel_intensidad:intensidad, equipo, body_parts, duracion_min, calorias, detalle_series')
      .in('activity_id', activityIds)

    if (detailsError) {
      return NextResponse.json({ error: 'Error obteniendo ejercicios' }, { status: 500 })
    }

    const seen = new Set<string>()
    const exercises = (details || []).reduce<any[]>((acc, row: any) => {
      const key = `${row.nombre_ejercicio}|${row.tipo}`
      if (!seen.has(key)) {
        seen.add(key)
        acc.push({
          id: row.id,
          name: row.nombre_ejercicio,
          descripcion: row.descripcion || '',
          tipo_ejercicio: row.tipo || '',
          nivel_intensidad: row.nivel_intensidad || '',
          equipo_necesario: row.equipo || '',
          partes_cuerpo: row.body_parts || '',
          duracion_min: row.duracion_min || '',
          calorias: row.calorias?.toString?.() || '',
          detalle_series: row.detalle_series || null
        })
      }
      return acc
    }, [])

    return NextResponse.json({ exercises })
  } catch (error) {
    console.error('Error existing-exercises:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}


