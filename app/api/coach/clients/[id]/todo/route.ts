import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'

// GET - Obtener tareas To Do del cliente
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { id } = await params

    const { data: rows, error } = await supabase
      .from('coach_client_pendings')
      .select('id, task')
      .eq('client_id', id)
      .eq('coach_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error loading todo tasks:', error)
      return NextResponse.json(
        { success: false, error: 'Error al cargar tareas' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, tasks: (rows || []).map((r: any) => r.task) })

  } catch (error) {
    console.error('Error loading todo tasks:', error)
    return NextResponse.json(
      { success: false, error: 'Error al cargar tareas' },
      { status: 500 }
    )
  }
}

// POST - Agregar nueva tarea
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { task } = await request.json()

    const { id } = await params

    if (!task || !task.trim()) {
      return NextResponse.json(
        { success: false, error: 'Tarea inválida' },
        { status: 400 }
      )
    }

    const { count, error: countError } = await supabase
      .from('coach_client_pendings')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', id)
      .eq('coach_id', user.id)

    if (countError) {
      console.error('Error adding todo task:', countError)
      const msg = String((countError as any)?.message || '')
      if (msg.includes('coach_client_pendings') || msg.includes('relation') || msg.includes('does not exist')) {
        return NextResponse.json(
          { success: false, error: 'Falta crear la tabla coach_client_pendings en la base de datos' },
          { status: 500 }
        )
      }
      return NextResponse.json(
        { success: false, error: 'Error al agregar tarea' },
        { status: 500 }
      )
    }

    const currentCount = Number(count ?? 0) || 0

    // Limitar a 5 tareas máximo
    if (currentCount >= 5) {
      return NextResponse.json(
        { success: false, error: 'Máximo 5 tareas permitidas' },
        { status: 400 }
      )
    }

    const { error: insertError } = await supabase
      .from('coach_client_pendings')
      .insert({ coach_id: user.id, client_id: id, task: task.trim() })

    if (insertError) {
      console.error('Error adding todo task:', insertError)
      return NextResponse.json(
        { success: false, error: 'Error al agregar tarea' },
        { status: 500 }
      )
    }

    const { data: rows, error: listError } = await supabase
      .from('coach_client_pendings')
      .select('id, task')
      .eq('client_id', id)
      .eq('coach_id', user.id)
      .order('created_at', { ascending: true })

    if (listError) {
      console.error('Error adding todo task:', listError)
      return NextResponse.json(
        { success: false, error: 'Error al agregar tarea' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, tasks: (rows || []).map((r: any) => r.task) })

  } catch (error) {
    console.error('Error adding todo task:', error)
    return NextResponse.json(
      { success: false, error: 'Error al agregar tarea' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar tarea
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { taskIndex } = await request.json()

    const { id } = await params

    if (typeof taskIndex !== 'number' || taskIndex < 0) {
      return NextResponse.json(
        { success: false, error: 'Índice inválido' },
        { status: 400 }
      )
    }

    const { data: rows, error: listError } = await supabase
      .from('coach_client_pendings')
      .select('id, task')
      .eq('client_id', id)
      .eq('coach_id', user.id)
      .order('created_at', { ascending: true })

    if (listError) {
      console.error('Error deleting todo task:', listError)
      return NextResponse.json(
        { success: false, error: 'Error al eliminar tarea' },
        { status: 500 }
      )
    }

    const ordered = rows || []

    if (taskIndex >= ordered.length) {
      return NextResponse.json(
        { success: false, error: 'Tarea no encontrada' },
        { status: 404 }
      )
    }

    const rowToDelete = ordered[taskIndex]

    const { error: deleteError } = await supabase
      .from('coach_client_pendings')
      .delete()
      .eq('id', rowToDelete.id)
      .eq('coach_id', user.id)

    if (deleteError) {
      console.error('Error deleting todo task:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Error al eliminar tarea' },
        { status: 500 }
      )
    }

    const remaining = ordered.filter((_: any, i: number) => i !== taskIndex)
    return NextResponse.json({ success: true, tasks: remaining.map((r: any) => r.task) })

  } catch (error) {
    console.error('Error deleting todo task:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar tarea' },
      { status: 500 }
    )
  }
}

