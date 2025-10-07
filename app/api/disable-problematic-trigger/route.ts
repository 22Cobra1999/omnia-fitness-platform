import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    console.log('🔧 Deshabilitando trigger problemático...')
    
    // Deshabilitar todos los triggers en activity_enrollments
    const disableTriggersSQL = `
      ALTER TABLE activity_enrollments DISABLE TRIGGER ALL;
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
        sql_query: disableTriggersSQL
      })
    })

    const result = await response.json()
    
    return NextResponse.json({
      success: response.ok,
      result,
      message: response.ok ? 'Triggers deshabilitados' : 'Error deshabilitando triggers'
    })

  } catch (error) {
    console.error('❌ Error deshabilitando triggers:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
