import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const categoria = searchParams.get('categoria')
  const query = searchParams.get('query')

  const supabase = createRouteHandlerClient({ cookies })

  try {
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

    if (error) throw error

    return NextResponse.json(data ? data.map(d => d.concepto) : [])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { concepto, categoria } = await request.json()

  if (!concepto || !categoria) {
    return NextResponse.json({ error: 'Concepto y categoria son obligatorios' }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from('omnia_dictionary')
      .upsert({ concepto, categoria }, { onConflict: 'concepto, categoria' })
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
