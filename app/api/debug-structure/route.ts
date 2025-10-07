import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    console.log('🔍 Investigando estructura con Supabase client...')
    
    const results: any = {}
    
    // 1. Estado actual de la ejecución
    const { data: executionData, error: executionError } = await supabase
      .from('ejecuciones_ejercicio')
      .select('*')
      .eq('id', 1934)
      .eq('client_id', '00dedc23-0b17-4e50-b84e-b2e8100dc93c')
      .single()
    
    results.current_execution = {
      data: executionData,
      error: executionError?.message
    }
    
    // 2. Intentar actualizar y ver qué pasa
    const { data: updateData, error: updateError } = await supabase
      .from('ejecuciones_ejercicio')
      .update({ completado: true })
      .eq('id', 1934)
      .eq('client_id', '00dedc23-0b17-4e50-b84e-b2e8100dc93c')
      .select('*')
      .single()
    
    results.update_test = {
      data: updateData,
      error: updateError?.message,
      error_code: updateError?.code,
      error_details: updateError?.details
    }
    
    // 3. Verificar estado después del update
    const { data: afterUpdateData, error: afterUpdateError } = await supabase
      .from('ejecuciones_ejercicio')
      .select('*')
      .eq('id', 1934)
      .eq('client_id', '00dedc23-0b17-4e50-b84e-b2e8100dc93c')
      .single()
    
    results.after_update = {
      data: afterUpdateData,
      error: afterUpdateError?.message
    }
    
    // 4. Intentar consultar activity_enrollments para ver si existe
    const { data: enrollmentsData, error: enrollmentsError } = await supabase
      .from('activity_enrollments')
      .select('*')
      .limit(1)
    
    results.enrollments_test = {
      data: enrollmentsData,
      error: enrollmentsError?.message,
      error_code: enrollmentsError?.code,
      error_details: enrollmentsError?.details
    }
    
    return NextResponse.json({
      success: true,
      results,
      message: 'Investigación con Supabase client completada'
    })

  } catch (error) {
    console.error('❌ Error en debug-structure API:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
