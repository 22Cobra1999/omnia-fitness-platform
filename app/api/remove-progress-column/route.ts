import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    console.log('🗑️ Quitando columna progress innecesaria...')
    
    const removeColumnSQL = `
      ALTER TABLE activity_enrollments 
      DROP COLUMN IF EXISTS progress;
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
        sql_query: removeColumnSQL
      })
    })

    const result = await response.json()
    
    return NextResponse.json({
      success: response.ok,
      result,
      message: response.ok ? 'Columna progress eliminada' : 'Error eliminando columna'
    })

  } catch (error) {
    console.error('❌ Error eliminando columna progress:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
