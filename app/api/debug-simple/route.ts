import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const url = new URL(request.url)
    const executionId = url.searchParams.get('executionId')
    const clientId = url.searchParams.get('clientId')

    // Consultar estado actual de la ejecución
    let executionState = null
    if (executionId && clientId) {
      const { data, error } = await supabase
        .from('ejecuciones_ejercicio')
        .select('id, completado, updated_at, client_id, created_at')
        .eq('id', executionId)
        .eq('client_id', clientId)
        .single()

      if (error) {
        console.error('❌ Error consultando ejecución:', error)
      } else {
        executionState = data
        console.log('📊 Estado actual de ejecución:', executionState)
      }
    }

    // Intentar una actualización de prueba
    let updateTest = null
    if (executionId && clientId) {
      const { data, error } = await supabase
        .from('ejecuciones_ejercicio')
        .update({ completado: false })
        .eq('id', executionId)
        .eq('client_id', clientId)
        .select('id, completado, updated_at')
        .single()

      updateTest = {
        success: !error,
        error: error?.message,
        data: data
      }
      console.log('🧪 Test de actualización:', updateTest)
    }

    return NextResponse.json({
      success: true,
      executionState,
      updateTest,
      message: 'Información obtenida'
    })

  } catch (error) {
    console.error('❌ Error en debug-simple API:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
