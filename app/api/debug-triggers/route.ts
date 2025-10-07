import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    console.log('🔍 Consultando triggers de la base de datos...')
    
    // Consultar todos los triggers en las tablas relevantes
    const triggersQuery = `
      SELECT 
        trigger_name,
        event_manipulation,
        event_object_table,
        action_statement,
        action_timing
      FROM information_schema.triggers 
      WHERE event_object_table IN ('ejecuciones_ejercicio', 'activity_enrollments')
      ORDER BY event_object_table, trigger_name;
    `
    
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        params: {},
        sql_query: triggersQuery
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Error consultando triggers:', errorText)
      return NextResponse.json({ error: 'Error consultando triggers', details: errorText }, { status: 500 })
    }

    const triggersResult = await response.json()
    const triggers = triggersResult.rows || triggersResult
    console.log('📋 Triggers encontrados:', triggers)

    // También consultar el estado actual de la ejecución
    const url = new URL(request.url)
    const executionId = url.searchParams.get('executionId')
    const clientId = url.searchParams.get('clientId')

    let executionState = null
    if (executionId && clientId) {
      const executionQuery = `
        SELECT id, completado, updated_at, client_id, created_at
        FROM ejecuciones_ejercicio
        WHERE id = ${executionId} AND client_id = '${clientId}';
      `
      
      const execResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          params: {},
          sql_query: executionQuery
        })
      })

      if (execResponse.ok) {
        const execDataResult = await execResponse.json()
        const execData = execDataResult.rows || execDataResult
        executionState = execData[0] || execData
        console.log('📊 Estado actual de ejecución:', executionState)
      }
    }

    // Consultar funciones relacionadas
    const functionsQuery = `
      SELECT 
        routine_name,
        routine_definition
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name LIKE '%ejecucion%' 
      OR routine_name LIKE '%progress%'
      OR routine_name LIKE '%completado%';
    `
    
    const funcResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        params: {},
        sql_query: functionsQuery
      })
    })

    let functions = []
    if (funcResponse.ok) {
      const functionsResult = await funcResponse.json()
      functions = functionsResult.rows || functionsResult
      console.log('🔧 Funciones relacionadas:', functions)
    }

    return NextResponse.json({
      success: true,
      triggers,
      executionState,
      functions,
      message: 'Información de triggers y estado obtenida'
    })

  } catch (error) {
    console.error('❌ Error en debug-triggers API:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
