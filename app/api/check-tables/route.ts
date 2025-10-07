import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    
    console.log('🔍 CHECKING TABLES: Verificando tablas disponibles')
    
    // Verificar tablas principales
    const tables = [
      'activities',
      'ejercicios_detalles', 
      'planificacion_ejercicios',
      'periodos',
      'activity_media',
      'purchases'
    ]
    
    const results = {}
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        results[table] = {
          exists: !error,
          error: error?.message || null
        }
      } catch (err) {
        results[table] = {
          exists: false,
          error: err.message
        }
      }
    }
    
    console.log('📊 CHECKING TABLES: Resultados:', results)
    
    return NextResponse.json({ 
      success: true,
      tables: results
    })
    
  } catch (error) {
    console.error('❌ CHECKING TABLES: Error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Error verificando tablas'
    }, { status: 500 })
  }
}
















