import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
export async function GET() {
  try {
    const supabase = createClient({ cookies })
    const results: any = {}
    // Verificar estructura real de activity_availability
    try {
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('activity_availability')
        .select('*')
        .limit(1)
      if (availabilityError) {
        results.activity_availability = { error: availabilityError.message }
      } else {
        // Si no hay datos, intentar obtener la estructura de la tabla
        const { data: structureData, error: structureError } = await supabase
          .rpc('get_table_structure', { table_name: 'activity_availability' })
          .catch(() => ({ data: null, error: 'RPC not available' }))
        results.activity_availability = {
          hasData: availabilityData && availabilityData.length > 0,
          sampleData: availabilityData || [],
          structureQuery: structureError ? 'RPC not available' : 'Attempted',
          columns: availabilityData && availabilityData.length > 0 ? Object.keys(availabilityData[0]) : []
        }
      }
    } catch (error) {
      results.activity_availability = { error: `Error inesperado: ${error}` }
    }
    // Verificar estructura real de activity_media
    try {
      const { data: mediaData, error: mediaError } = await supabase
        .from('activity_media')
        .select('*')
        .limit(1)
      if (mediaError) {
        results.activity_media = { error: mediaError.message }
      } else {
        results.activity_media = {
          hasData: mediaData && mediaData.length > 0,
          sampleData: mediaData || [],
          columns: mediaData && mediaData.length > 0 ? Object.keys(mediaData[0]) : []
        }
      }
    } catch (error) {
      results.activity_media = { error: `Error inesperado: ${error}` }
    }
    // Intentar crear un registro de prueba en activity_availability
    try {
      const testData = {
        activity_id: 22, // Usar un ID existente
        availability_type: 'test',
        session_type: 'test',
        start_time: '09:00',
        end_time: '10:00',
        start_date: '2025-08-25',
        end_date: '2025-08-25',
        color: 'bg-blue-500',
        selected_dates: JSON.stringify([new Date('2025-08-25')]),
        repeat_type: 'none',
        selected_week_days: [],
        selected_weeks: [],
        selected_months: [],
        available_slots: 10
      }
      const { data: insertData, error: insertError } = await supabase
        .from('activity_availability')
        .insert(testData)
        .select()
      results.test_insert = {
        success: !insertError,
        error: insertError?.message,
        insertedData: insertData
      }
    } catch (error) {
      results.test_insert = { error: `Error inesperado: ${error}` }
    }
    return NextResponse.json({ 
      success: true,
      debugResults: results
    })
  } catch (error) {
    console.error('Error en GET /api/debug-tables:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
