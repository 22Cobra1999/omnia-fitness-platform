import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const executionId = url.searchParams.get('executionId')
    const clientId = url.searchParams.get('clientId')

    if (!executionId || !clientId) {
      return NextResponse.json({ error: 'executionId y clientId son requeridos' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase
      .from('ejecuciones_ejercicio')
      .select('id, completado, updated_at, client_id')
      .eq('id', executionId)
      .eq('client_id', clientId)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      execution: data
    })

  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
