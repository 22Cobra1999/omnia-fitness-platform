import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// POST: Toggle ejercicio completado - NUEVO ENDPOINT SIMPLE
export async function POST(request: NextRequest) {
  try {
    console.log('🔥🔥🔥 [POST /api/toggle-exercise] NUEVA PETICIÓN RECIBIDA 🔥🔥🔥')
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('❌ [POST /api/toggle-exercise] Error de autenticación:', authError)
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    console.log('✅ [POST /api/toggle-exercise] Usuario autenticado:', user.id)

    const body = await request.json()
    console.log('📥 [POST /api/toggle-exercise] Payload recibido:', body)
    
    const { executionId } = body

    if (!executionId) {
      console.error('❌ [POST /api/toggle-exercise] executionId es requerido')
      return NextResponse.json({ error: 'executionId es requerido' }, { status: 400 })
    }

    console.log(`🔍 [POST /api/toggle-exercise] Buscando ejecución ID: ${executionId} para usuario: ${user.id}`)

    // Buscar la ejecución actual
    const { data: currentExecution, error: fetchError } = await supabase
      .from('ejecuciones_ejercicio')
      .select('id, completado, ejercicio_id, nombre_ejercicio:ejercicios_detalles(nombre_ejercicio)')
      .eq('id', executionId)
      .eq('client_id', user.id)
      .single()

    if (fetchError || !currentExecution) {
      console.error('❌ [POST /api/toggle-exercise] Error buscando ejecución:', fetchError)
      return NextResponse.json({ 
        error: 'Ejecución no encontrada o no autorizada',
        details: fetchError?.message 
      }, { status: 404 })
    }

    console.log('✅ [POST /api/toggle-exercise] Ejecución encontrada:', currentExecution)

    // Calcular nuevo estado (toggle)
    const newCompletedState = !currentExecution.completado
    console.log(`🔄 [POST /api/toggle-exercise] Toggle: ${currentExecution.completado} → ${newCompletedState}`)

    // Actualizar en la base de datos
    const updateData = {
      completado: newCompletedState,
      updated_at: new Date().toISOString(),
      completed_at: newCompletedState ? new Date().toISOString() : null
    }

    console.log('📝 [POST /api/toggle-exercise] Datos a actualizar:', updateData)

    const { data: updatedExecution, error: updateError } = await supabase
      .from('ejecuciones_ejercicio')
      .update(updateData)
      .eq('id', executionId)
      .eq('client_id', user.id)
      .select('id, completado, completed_at, updated_at')
      .single()

    if (updateError) {
      console.error('❌ [POST /api/toggle-exercise] Error actualizando:', updateError)
      return NextResponse.json({ 
        error: 'Error al actualizar ejecución',
        details: updateError.message 
      }, { status: 500 })
    }

    console.log('✅ [POST /api/toggle-exercise] Ejecución actualizada exitosamente:', updatedExecution)

    return NextResponse.json({
      success: true,
      message: `Ejercicio ${newCompletedState ? 'marcado como completado' : 'desmarcado'}`,
      data: {
        executionId: updatedExecution.id,
        completado: updatedExecution.completado,
        completed_at: updatedExecution.completed_at,
        updated_at: updatedExecution.updated_at
      }
    })

  } catch (error) {
    console.error('❌ [POST /api/toggle-exercise] Error interno:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
