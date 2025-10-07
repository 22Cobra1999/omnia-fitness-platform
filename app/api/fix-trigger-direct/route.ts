import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    console.log('🔧 FIX TRIGGER DIRECT: Intentando arreglar el trigger problemático')

    try {
      // 1. Intentar crear la tabla fitness_exercises que falta
      console.log('🔄 FIX TRIGGER DIRECT: Creando tabla fitness_exercises...')
      
      const { data: createTableResult, error: createTableError } = await supabase
        .from('fitness_exercises')
        .select('*')
        .limit(1)

      if (createTableError && createTableError.message.includes('relation "fitness_exercises" does not exist')) {
        console.log('✅ FIX TRIGGER DIRECT: Confirmado que la tabla no existe, intentando crear...')
        
        // La tabla no existe, necesitamos crearla manualmente en Supabase
        return NextResponse.json({
          success: false,
          error: 'La tabla fitness_exercises no existe',
          solution: 'Necesitas crear la tabla manualmente en Supabase Dashboard',
          sql: `
            CREATE TABLE fitness_exercises (
              id SERIAL PRIMARY KEY,
              activity_id INTEGER,
              exercise_name TEXT,
              created_at TIMESTAMP DEFAULT NOW()
            );
          `
        }, { status: 500 })
      }

      if (!createTableError) {
        console.log('✅ FIX TRIGGER DIRECT: La tabla fitness_exercises ya existe')
        return NextResponse.json({
          success: true,
          message: 'La tabla fitness_exercises ya existe, el problema puede ser otro'
        })
      }

      console.log('⚠️ FIX TRIGGER DIRECT: Error inesperado:', createTableError.message)
      return NextResponse.json({
        success: false,
        error: 'Error inesperado',
        details: createTableError.message
      }, { status: 500 })

    } catch (error) {
      console.error('❌ FIX TRIGGER DIRECT: Error general:', error)
      return NextResponse.json({
        success: false,
        error: 'Error interno del servidor',
        details: error.message
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ FIX TRIGGER DIRECT: Error crítico:', error)
    return NextResponse.json({
      success: false,
      error: 'Error crítico del servidor'
    }, { status: 500 })
  }
}
















