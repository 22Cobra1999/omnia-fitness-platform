import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { sql } = await request.json()

    if (!sql) {
      return NextResponse.json({ 
        success: false, 
        error: 'SQL query is required' 
      }, { status: 400 })
    }

    console.log('🔧 Ejecutando SQL:', sql.substring(0, 100) + '...')

    // Ejecutar SQL usando rpc
    const { data, error } = await supabase
      .rpc('exec_sql', { sql_query: sql })

    if (error) {
      console.error('Error ejecutando SQL:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'SQL ejecutado exitosamente',
      data: data || []
    })

  } catch (error) {
    console.error('Error ejecutando SQL:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}




























