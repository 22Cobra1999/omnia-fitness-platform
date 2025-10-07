import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

// POST: Marcar ejercicio como completado
export async function POST(request: NextRequest) {
  try {
    console.log('🔥 API mark-exercise-completed: Iniciando...')
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('❌ Error de autenticación:', authError)
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    console.log('📥 API mark-exercise-completed: Datos recibidos:', body)
    
    const { 
      ejercicio_id, 
      completado = true,
      intensidad_aplicada,
      duracion,
      calorias_estimadas,
      peso_usado,
      repeticiones_realizadas,
      series_completadas,
      tiempo_real_segundos,
      nota_cliente
    } = body

    if (!ejercicio_id) {
      console.error('❌ ejercicio_id es requerido')
      return NextResponse.json({ 
        error: 'ejercicio_id es requerido' 
      }, { status: 400 })
    }

    // Buscar la ejecución del ejercicio para este cliente (simplificado)
    const { data: execution, error: executionError } = await supabase
      .from('ejecuciones_ejercicio')
      .select('id, ejercicio_id, client_id')
      .eq('id', ejercicio_id) // Usar el ID de la ejecución directamente
      .eq('client_id', user.id)
      .single()

    if (executionError || !execution) {
      console.error('Error finding execution:', executionError)
      return NextResponse.json({ 
        error: 'No se encontró ejecución para este ejercicio',
        details: executionError?.message 
      }, { status: 404 })
    }

    // Preparar datos de actualización
    const updateData: any = {
      completado,
      updated_at: new Date().toISOString()
    }

    if (completado) {
      updateData.completed_at = new Date().toISOString()
    } else {
      updateData.completed_at = null
    }

    if (intensidad_aplicada !== undefined) updateData.intensidad_aplicada = intensidad_aplicada
    if (duracion !== undefined) updateData.duracion = duracion
    if (calorias_estimadas !== undefined) updateData.calorias_estimadas = calorias_estimadas
    if (peso_usado !== undefined) updateData.peso_usado = peso_usado
    if (repeticiones_realizadas !== undefined) updateData.repeticiones_realizadas = repeticiones_realizadas
    if (series_completadas !== undefined) updateData.series_completadas = series_completadas
    if (tiempo_real_segundos !== undefined) updateData.tiempo_real_segundos = tiempo_real_segundos
    if (nota_cliente !== undefined) updateData.nota_cliente = nota_cliente

    // Actualizar ejecución (simplificado)
    console.log('🔄 API mark-exercise-completed: Actualizando ejecución:', {
      executionId: execution.id,
      updateData,
      userId: user.id
    })
    
    const { data: updatedExecution, error: updateError } = await supabase
      .from('ejecuciones_ejercicio')
      .update(updateData)
      .eq('id', execution.id)
      .select('*')
      .single()

    if (updateError) {
      console.error('❌ Error updating execution:', updateError)
      return NextResponse.json({ 
        error: 'Error al actualizar ejecución', 
        details: updateError.message 
      }, { status: 500 })
    }

    console.log('✅ API mark-exercise-completed: Ejecución actualizada correctamente:', updatedExecution)

    return NextResponse.json({
      success: true,
      execution: updatedExecution,
      message: `Ejercicio ${completado ? 'marcado como completado' : 'marcado como pendiente'}`
    })

  } catch (error) {
    console.error('Error in mark exercise completed API:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}