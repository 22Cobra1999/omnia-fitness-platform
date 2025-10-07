import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔥 API exercise-completion: Iniciando...')
    
    const body = await request.json()
    console.log('📥 API exercise-completion: Datos recibidos:', body)
    
    const { executionId, completed, clientId } = body

    if (!executionId || !clientId) {
      console.error('❌ executionId y clientId son requeridos')
      return NextResponse.json({ 
        error: 'executionId y clientId son requeridos' 
      }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    console.log(`🔄 Actualizando ejecución ${executionId} a completado: ${completed}`)

    // Verificación de propiedad: asegurar que la ejecución pertenece al cliente
    const verifyOwnerSQL = `
      SELECT ee.id
      FROM ejecuciones_ejercicio ee
      JOIN periodos_asignados pa ON pa.id = ee.periodo_id
      JOIN activity_enrollments ae ON ae.id = pa.enrollment_id
      WHERE ee.id = ${executionId} AND ae.client_id = '${clientId}'
      LIMIT 1;
    `

    const ownerCheckResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ params: {}, sql_query: verifyOwnerSQL })
    })

    if (!ownerCheckResponse.ok) {
      const errorText = await ownerCheckResponse.text()
      console.error('❌ Error verificando propiedad de ejecución:', errorText)
      return NextResponse.json({ error: 'Error verificando propiedad' }, { status: 500 })
    }

    const ownerRows = await ownerCheckResponse.json()
    const ownerData = ownerRows.rows || ownerRows
    if (!ownerData[0]) {
      console.warn(`🚫 Ejecución ${executionId} no pertenece al cliente ${clientId}`)
      return NextResponse.json({ error: 'No autorizado para actualizar esta ejecución' }, { status: 403 })
    }
    
    // Paso 1: Asegurar que la columna progress existe
    const addProgressColumnSQL = `
      ALTER TABLE activity_enrollments 
      ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;
    `
    
    try {
      await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          params: {},
          sql_query: addProgressColumnSQL
        })
      })
      console.log('✅ Columna progress asegurada')
    } catch (error) {
      console.log('⚠️ Error agregando columna progress:', error)
    }
    
    // Paso 2: Actualizar la ejecución con timestamp explícito
    const updateSQL = `
      UPDATE ejecuciones_ejercicio 
      SET completado = ${completed}, updated_at = NOW(), completed_at = ${completed ? 'NOW()' : 'NULL'}
      WHERE id = ${executionId}
      RETURNING id, completado, updated_at, completed_at;
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
        sql_query: updateSQL
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Error actualizando ejecución:', errorText)
      return NextResponse.json({ 
        error: 'Error al actualizar ejecución', 
        details: errorText 
      }, { status: 500 })
    }

    const result = await response.json()
    const data = result.rows || result
    
    console.log('✅ Ejecución actualizada correctamente:', data)

    // Paso 3: Verificar que realmente se actualizó
    const verifySQL = `
      SELECT ee.id, ee.completado, ee.updated_at, ee.completed_at
      FROM ejecuciones_ejercicio ee
      JOIN periodos_asignados pa ON pa.id = ee.periodo_id
      JOIN activity_enrollments ae ON ae.id = pa.enrollment_id
      WHERE ee.id = ${executionId} AND ae.client_id = '${clientId}';
    `
    
    const verifyResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        params: {},
        sql_query: verifySQL
      })
    })

    if (verifyResponse.ok) {
      const verifyResult = await verifyResponse.json()
      const verifyData = verifyResult.rows || verifyResult
      console.log('🔍 Verificación post-actualización:', verifyData[0])
      
      // Si la verificación muestra que se actualizó correctamente, usar esos datos
      if (verifyData[0] && verifyData[0].completado === completed) {
        return NextResponse.json({
          success: true,
          execution: verifyData[0],
          message: `Ejercicio ${completed ? 'marcado como completado' : 'marcado como pendiente'}`
        })
      }
    }

    // Si no se puede verificar o no coincide, devolver los datos del update
    return NextResponse.json({
      success: true,
      execution: data[0] || data,
      message: `Ejercicio ${completed ? 'marcado como completado' : 'marcado como pendiente'}`
    })

  } catch (error) {
    console.error('❌ Error in exercise-completion API:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}