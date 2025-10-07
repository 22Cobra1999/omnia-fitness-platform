import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    console.log('🔍 Investigando estructura de base de datos...')
    
    const results: any = {}
    
    // Query 1: Triggers en las tablas relevantes
    const triggersQuery = `
      SELECT 
        trigger_name,
        event_manipulation,
        event_object_table,
        action_timing,
        action_statement,
        trigger_schema
      FROM information_schema.triggers 
      WHERE event_object_table IN ('ejecuciones_ejercicio', 'activity_enrollments')
      ORDER BY event_object_table, trigger_name;
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
          sql_query: triggersQuery
        })
      })

      if (response.ok) {
        const data = await response.json()
        results.triggers = data.rows || data
      } else {
        results.triggers = { error: await response.text() }
      }
    } catch (error) {
      results.triggers = { error: error }
    }
    
    // Query 2: Estructura de ejecuciones_ejercicio
    const ejecucionesQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'ejecuciones_ejercicio' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
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
          sql_query: ejecucionesQuery
        })
      })

      if (response.ok) {
        const data = await response.json()
        results.ejecuciones_structure = data.rows || data
      } else {
        results.ejecuciones_structure = { error: await response.text() }
      }
    } catch (error) {
      results.ejecuciones_structure = { error: error }
    }
    
    // Query 3: Estructura de activity_enrollments
    const enrollmentsQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'activity_enrollments' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
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
          sql_query: enrollmentsQuery
        })
      })

      if (response.ok) {
        const data = await response.json()
        results.enrollments_structure = data.rows || data
      } else {
        results.enrollments_structure = { error: await response.text() }
      }
    } catch (error) {
      results.enrollments_structure = { error: error }
    }
    
    // Query 4: Verificar si existe la columna progress
    const progressQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'activity_enrollments' 
      AND column_name = 'progress'
      AND table_schema = 'public';
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
          sql_query: progressQuery
        })
      })

      if (response.ok) {
        const data = await response.json()
        results.progress_column = data.rows || data
      } else {
        results.progress_column = { error: await response.text() }
      }
    } catch (error) {
      results.progress_column = { error: error }
    }
    
    // Query 5: Estado actual de la ejecución
    const currentStateQuery = `
      SELECT 
        id,
        completado,
        updated_at,
        created_at,
        client_id,
        fecha_ejercicio
      FROM ejecuciones_ejercicio 
      WHERE id = 1934 AND client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';
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
          sql_query: currentStateQuery
        })
      })

      if (response.ok) {
        const data = await response.json()
        results.current_execution = data.rows || data
      } else {
        results.current_execution = { error: await response.text() }
      }
    } catch (error) {
      results.current_execution = { error: error }
    }
    
    return NextResponse.json({
      success: true,
      results,
      message: 'Investigación completada'
    })

  } catch (error) {
    console.error('❌ Error en investigate-db API:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}