import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const exerciseId = parseInt(params.id)

    if (!exerciseId) {
      return NextResponse.json(
        { error: 'ID de ejercicio requerido' },
        { status: 400 }
      )
    }

    // Usar service role key para bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Consultar intensidades del ejercicio
    const { data: intensities, error } = await supabase
      .from('intensidades')
      .select('*')
      .eq('ejercicio_id', exerciseId)
      .order('orden', { ascending: true })

    if (error) {
      console.error('Error consultando intensidades:', error)
      return NextResponse.json(
        { error: 'Error consultando intensidades' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: intensities || [],
      count: intensities?.length || 0
    })

  } catch (error) {
    console.error('Error en endpoint:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


































