import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const clientId = url.searchParams.get('clientId')
    const activityId = url.searchParams.get('activityId')
    const date = url.searchParams.get('date') // YYYY-MM-DD

    if (!clientId || !date) {
      return NextResponse.json({
        error: 'clientId y date son requeridos'
      }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase
      .from('ejecuciones_ejercicio')
      .select('id, ejercicio_id, fecha_ejercicio, bloque, orden, completado')
      .eq('client_id', clientId)
      .eq('fecha_ejercicio', date)
      .order('bloque', { ascending: true })
      .order('orden', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return new NextResponse(JSON.stringify(data ?? []), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    })
  } catch (e) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

