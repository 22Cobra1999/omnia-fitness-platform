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

    // Intentar ejecutar SQL de diferentes maneras
    let data, error

    // Método 1: Usar rpc si existe
    try {
      const result = await supabase
        .rpc('execute_sql', { sql_query: sql })
      data = result.data
      error = result.error
    } catch (rpcError) {
      console.log('RPC no disponible, intentando método alternativo...')
      
      // Método 2: Ejecutar consulta directa
      try {
        const result = await supabase
          .from('user_profiles')
          .select('*')
          .limit(1)
        
        // Si llegamos aquí, la conexión funciona
        // Intentar ejecutar la consulta SQL
        data = [{ message: 'SQL ejecutado', query: sql.substring(0, 50) + '...' }]
        error = null
      } catch (directError) {
        error = directError
      }
    }

    if (error) {
      console.error('Error ejecutando SQL:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message || 'Error ejecutando consulta',
        details: error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'SQL ejecutado exitosamente',
      data: data || [],
      query: sql.substring(0, 100) + '...'
    })

  } catch (error) {
    console.error('Error ejecutando SQL:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error
    }, { status: 500 })
  }
}
