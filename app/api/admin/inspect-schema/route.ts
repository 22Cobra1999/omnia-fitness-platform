import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()

    // Buscar tablas que contengan las columnas objetivo
    const tablesToCheck = [
      'ejercicios_detalles',
      'ejecuciones_ejercicio',
      'intensidades',
      'activities',
      'ejercicios',
      'program_exercises'
    ]

    // information_schema.columns no está expuesto por PostgREST, así que probamos selects simples por tabla
    const results: any = {}

    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)

        results[table] = {
          exists: !error,
          sample: data?.[0] ?? null,
        }
      } catch (e: any) {
        results[table] = { exists: false, sample: null }
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}




























