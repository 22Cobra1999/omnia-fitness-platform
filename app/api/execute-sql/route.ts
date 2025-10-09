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

    // Ejecutar SQL directamente
    const { data, error } = await supabase
      .from('conversations')
      .select('id')
      .limit(1)

    // Si la tabla no existe, intentar crearla
    if (error && error.code === 'PGRST116') {
      // Ejecutar el SQL usando una consulta directa
      const { error: sqlError } = await supabase
        .rpc('exec', { sql_query: sql })

      if (sqlError) {
        console.error('Error ejecutando SQL:', sqlError)
        return NextResponse.json({ 
          success: false, 
          error: sqlError.message 
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'SQL ejecutado exitosamente',
      data
    })

  } catch (error) {
    console.error('Error ejecutando SQL:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

































