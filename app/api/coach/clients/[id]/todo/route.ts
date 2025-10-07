import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Utilities
async function getClientEnrollments(clientId: string) {
  // Traer inscripciones activas del cliente con su todo_list
  const { data: enrollments, error } = await supabaseAdmin
    .from('activity_enrollments')
    .select('id, client_id, activity_id, status, todo_list')
    .eq('client_id', clientId)
    .in('status', ['activa', 'active'])

  if (error) throw error
  return enrollments || []
}

function normalizeTodos(value: any): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.filter((v) => typeof v === 'string')
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.filter((v) => typeof v === 'string')
    } catch {
      // Soportar formato legacy separado por ';'
      return value
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean)
    }
  }
  return []
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params
    const enrollments = await getClientEnrollments(clientId)
    const tasks = enrollments.flatMap((e) => normalizeTodos(e.todo_list))

    return NextResponse.json({ success: true, tasks })
  } catch (error: any) {
    console.error('[todo][GET] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params
    const body = await request.json()
    const task = (body?.task || '').toString().trim()
    if (!task) return NextResponse.json({ success: false, error: 'Tarea requerida' }, { status: 400 })

    const enrollments = await getClientEnrollments(clientId)
    if (enrollments.length === 0) return NextResponse.json({ success: false, error: 'Sin inscripciones activas' }, { status: 404 })

    // Construir lista total y validar límite 4
    const merged = enrollments.flatMap((e) => normalizeTodos(e.todo_list))
    if (merged.length >= 4) return NextResponse.json({ success: false, error: 'Máximo 4 tareas' }, { status: 400 })

    // Agregar al primer enrollment activo
    const target = enrollments[0]
    const current = normalizeTodos(target.todo_list)
    const next = [...current, task]

    const { error: updateError } = await supabaseAdmin
      .from('activity_enrollments')
      .update({ todo_list: next })
      .eq('id', target.id)

    if (updateError) throw updateError

    const tasks = [...merged, task]
    return NextResponse.json({ success: true, tasks })
  } catch (error: any) {
    console.error('[todo][POST] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params
    const body = await request.json()
    const taskIndex = Number(body?.taskIndex)
    if (!Number.isInteger(taskIndex) || taskIndex < 0) {
      return NextResponse.json({ success: false, error: 'taskIndex inválido' }, { status: 400 })
    }

    const enrollments = await getClientEnrollments(clientId)
    // Construir mapa de indices → enrollment
    let cumulative = 0
    for (const e of enrollments) {
      const todos = normalizeTodos(e.todo_list)
      if (taskIndex < cumulative + todos.length) {
        const localIndex = taskIndex - cumulative
        const next = todos.filter((_, idx) => idx !== localIndex)
        const { error: updateError } = await supabaseAdmin
          .from('activity_enrollments')
          .update({ todo_list: next })
          .eq('id', e.id)
        if (updateError) throw updateError

        // Devolver lista nueva combinada
        const afterEnrollments = await getClientEnrollments(clientId)
        const tasks = afterEnrollments.flatMap((x) => normalizeTodos(x.todo_list))
        return NextResponse.json({ success: true, tasks })
      }
      cumulative += todos.length
    }

    return NextResponse.json({ success: false, error: 'Índice fuera de rango' }, { status: 404 })
  } catch (error: any) {
    console.error('[todo][DELETE] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}




