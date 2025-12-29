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

    // Obtener tareas del cliente
    const { data: client, error } = await supabase
      .from('clients')
      .select('todo_tasks')
      .eq('id', id)
      .eq('coach_id', user.id)
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      tasks: client?.todo_tasks || []
    })

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

    // Obtener tareas actuales
    const { data: client } = await supabase
      .from('clients')
      .select('todo_tasks')
      .eq('id', id)
      .eq('coach_id', user.id)
      .single()

    const currentTasks = client?.todo_tasks || []
    
    // Limitar a 5 tareas máximo
    if (currentTasks.length >= 5) {
      return NextResponse.json(
        { success: false, error: 'Máximo 5 tareas permitidas' },
        { status: 400 }
      )
    }

    const newTasks = [...currentTasks, task.trim()]

    // Actualizar tareas
    const { error } = await supabase
      .from('clients')
      .update({ todo_tasks: newTasks })
      .eq('id', id)
      .eq('coach_id', user.id)

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Error al agregar tarea' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      tasks: newTasks
    })

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

    // Obtener tareas actuales
    const { data: client } = await supabase
      .from('clients')
      .select('todo_tasks')
      .eq('id', id)
      .eq('coach_id', user.id)
      .single()

    const currentTasks = client?.todo_tasks || []
    
    if (taskIndex >= currentTasks.length) {
      return NextResponse.json(
        { success: false, error: 'Tarea no encontrada' },
        { status: 404 }
      )
    }

    // Eliminar tarea
    const newTasks = currentTasks.filter((_: any, i: number) => i !== taskIndex)

    // Actualizar tareas
    const { error } = await supabase
      .from('clients')
      .update({ todo_tasks: newTasks })
      .eq('id', id)
      .eq('coach_id', user.id)

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Error al eliminar tarea' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      tasks: newTasks
    })

  } catch (error) {
    console.error('Error deleting todo task:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar tarea' },
      { status: 500 }
    )
  }
}

