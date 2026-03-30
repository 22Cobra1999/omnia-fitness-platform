import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const targetClientId = searchParams.get('cliente_id') || user.id

    // Consulta principal incluyendo fit_kcal
    const { data: progressData, error: progressError } = await supabase
      .from('progreso_diario_actividad')
      .select('fecha, fit_items_c, fit_items_o, fit_mins_c, fit_mins_o, fit_kcal_c, fit_kcal_o, nut_items_c, nut_items_o, nut_kcal_c, nut_kcal_o, nut_macros')
      .eq('cliente_id', targetClientId)
      .gte('fecha', startDate || '2000-01-01')
      .lte('fecha', endDate || '2100-01-01')
      .order('fecha', { ascending: true })

    if (progressError) {
      return NextResponse.json({ 
        success: false, 
        error: `ERROR_DB: ${progressError.message}`,
        code: progressError.code
      }, { status: 500 })
    }

    const aggregated = (progressData || []).reduce((acc: any, curr: any) => {
      const date = curr.fecha
      if (!acc[date]) {
        acc[date] = {
          fecha: date,
          fit_items_c: 0, fit_items_o: 0,
          fit_mins_c: 0, fit_mins_o: 0,
          fit_kcal_c: 0, fit_kcal_o: 0,
          nut_items_c: 0, nut_items_o: 0,
          nut_kcal_c: 0, nut_kcal_o: 0,
          nut_macros: { p: { c: 0, o: 0 }, c: { c: 0, o: 0 }, f: { c: 0, o: 0 } }
        }
      }
      acc[date].fit_items_c += (Number(curr.fit_items_c) || 0)
      acc[date].fit_items_o += (Number(curr.fit_items_o) || 0)
      acc[date].fit_mins_c += (Number(curr.fit_mins_c) || 0)
      acc[date].fit_mins_o += (Number(curr.fit_mins_o) || 0)
      acc[date].fit_kcal_c += (Number(curr.fit_kcal_c) || 0)
      acc[date].fit_kcal_o += (Number(curr.fit_kcal_o) || 0)
      acc[date].nut_items_c += (Number(curr.nut_items_c) || 0)
      acc[date].nut_items_o += (Number(curr.nut_items_o) || 0)
      acc[date].nut_kcal_c += (Number(curr.nut_kcal_c) || 0)
      acc[date].nut_kcal_o += (Number(curr.nut_kcal_o) || 0)
      if (curr.nut_macros) {
        const m = curr.nut_macros
        if (m.p) { acc[date].nut_macros.p.c += (m.p.c || 0); acc[date].nut_macros.p.o += (m.p.o || 0) }
        if (m.c) { acc[date].nut_macros.c.c += (m.c.c || 0); acc[date].nut_macros.c.o += (m.c.o || 0) }
        if (m.f) { acc[date].nut_macros.f.c += (m.f.c || 0); acc[date].nut_macros.f.o += (m.f.o || 0) }
      }
      return acc
    }, {})

    const data = Object.values(aggregated).map((day: any) => ({
      fecha: day.fecha,
      cliente_id: targetClientId,
      // Fitness
      ejercicios_completados: day.fit_items_c,
      ejercicios_objetivo: day.fit_items_o,
      fitness_mins: day.fit_mins_c,
      fitness_mins_objetivo: day.fit_mins_o,
      fitness_kcal: day.fit_kcal_c,
      fitness_kcal_objetivo: day.fit_kcal_o,
      // Nutrición
      platos_completados: day.nut_items_c,
      platos_objetivo: day.nut_items_o,
      nutri_kcal: day.nut_kcal_c,
      nutri_kcal_objetivo: day.nut_kcal_o,
      // Extras
      ejercicios_pendientes: Math.max(0, day.fit_items_o - day.fit_items_c),
      platos_pendientes: Math.max(0, day.nut_items_o - day.nut_items_c),
      nutri_mins: day.fit_mins_c,
      nutri_mins_objetivo: day.fit_mins_o
    }))

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('[progress-summary] Fatal Error:', error)
    return NextResponse.json({ success: false, error: 'FATAL_ERROR', message: error.message }, { status: 500 })
  }
}
