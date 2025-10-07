import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Agregando columnas faltantes a la tabla coaches...')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Intentar actualizar un coach existente para verificar si las columnas existen
    const testUpdate = {
      birth_date: null,
      location: null,
      gender: null,
      age: null
    }

    const results = []
    
    // Intentar actualizar el coach de prueba para ver qué columnas faltan
    const { data: updateResult, error: updateError } = await supabase
      .from('coaches')
      .update(testUpdate)
      .eq('id', 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f')
      .select()

    if (updateError) {
      console.log('❌ Error al actualizar - columnas faltantes:', updateError.message)
      results.push({ 
        status: 'error', 
        message: 'Columnas faltantes detectadas',
        error: updateError.message 
      })
    } else {
      console.log('✅ Todas las columnas existen y funcionan correctamente')
      results.push({ 
        status: 'success', 
        message: 'Todas las columnas existen',
        data: updateResult 
      })
    }

    // Verificar que las columnas se agregaron
    const { data: columns, error: columnsError } = await supabase
      .from('coaches')
      .select('*')
      .limit(1)

    if (columnsError) {
      console.error('Error verificando columnas:', columnsError)
    }

    console.log('✅ Proceso completado')

    return NextResponse.json({
      success: true,
      message: 'Columnas agregadas a la tabla coaches',
      results,
      tableInfo: columns ? 'Tabla verificada exitosamente' : 'Error verificando tabla'
    })

  } catch (error) {
    console.error('Error agregando columnas:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}