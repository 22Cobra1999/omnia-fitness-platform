import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    console.log('🔧 Ejecutando fix para la columna progress...')
    
    const results: any = {}
    
    // Paso 1: Agregar la columna progress
    const addColumnSQL = `
      ALTER TABLE activity_enrollments 
      ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;
    `
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          params: {},
          sql_query: addColumnSQL
        })
      })

      results.add_column = {
        success: response.ok,
        status: response.status,
        error: response.ok ? null : await response.text()
      }
      console.log('📡 Respuesta agregar columna:', response.status)
    } catch (error) {
      results.add_column = { success: false, error: error }
    }
    
    // Paso 2: Actualizar registros existentes
    const updateRecordsSQL = `
      UPDATE activity_enrollments 
      SET progress = 0 
      WHERE progress IS NULL;
    `
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          params: {},
          sql_query: updateRecordsSQL
        })
      })

      results.update_records = {
        success: response.ok,
        status: response.status,
        error: response.ok ? null : await response.text()
      }
      console.log('📡 Respuesta actualizar registros:', response.status)
    } catch (error) {
      results.update_records = { success: false, error: error }
    }
    
    // Paso 3: Probar la actualización
    console.log('🧪 Probando actualización después del fix...')
    
    try {
      const testResponse = await fetch(`${supabaseUrl}/rest/v1/ejecuciones_ejercicio?id=eq.1934&client_id=eq.00dedc23-0b17-4e50-b84e-b2e8100dc93c`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          completado: true
        })
      })

      const testResult = await testResponse.json()
      results.test_update = {
        success: testResponse.ok,
        status: testResponse.status,
        data: testResult,
        error: testResponse.ok ? null : await testResponse.text()
      }
      console.log('📡 Respuesta test update:', testResponse.status)
    } catch (error) {
      results.test_update = { success: false, error: error }
    }
    
    return NextResponse.json({
      success: true,
      results,
      message: 'Fix de columna progress ejecutado'
    })

  } catch (error) {
    console.error('❌ Error en fix-progress-column API:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}