import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const categoria = searchParams.get('categoria')
  const query = searchParams.get('query')

  try {
    const supabase = await createRouteHandlerClient()

    let q = supabase
      .from('omnia_dictionary')
      .select('concepto')
      .order('concepto', { ascending: true })

    if (categoria) {
      q = q.eq('categoria', categoria)
    }

    if (query) {
      q = q.ilike('concepto', `%${query}%`)
    }

    const { data, error } = await q.limit(20)

    if (error) {
      console.error('❌ [API Dictionary] Error fetching:', error)
      throw error
    }

    return NextResponse.json(data ? data.map((d: { concepto: string }) => d.concepto) : [])
  } catch (error: any) {
    console.error('❌ [API Dictionary] GET Exception:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { concepto, categoria } = await request.json()

  if (!concepto || !categoria) {
    return NextResponse.json({ error: 'Concepto y categoria son obligatorios' }, { status: 400 })
  }

  try {
    const supabase = await createRouteHandlerClient()
    
    const { data, error } = await supabase
      .from('omnia_dictionary')
      .upsert({ concepto, categoria }, { onConflict: 'concepto, categoria' })
      .select()

    if (error) {
      console.error('❌ [API Dictionary] Error saving:', error)
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('❌ [API Dictionary] POST Exception:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
