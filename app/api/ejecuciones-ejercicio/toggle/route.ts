import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase-server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, completado } = body || {}
    if (!id || typeof completado !== 'boolean') {
      return NextResponse.json({ error: 'id y completado son requeridos' }, { status: 400 })
    }

    // Verificar pertenencia con joins anidados (RLS-friendly)
    const { data: ejecucion, error: ejecErr } = await supabase
      .from('ejecuciones_ejercicio')
      .select(`
        id,
        periodos_asignados!inner(
          activity_enrollments!inner(
            client_id
          )
        )
      `)
      .eq('id', Number(id))
      .eq('periodos_asignados.activity_enrollments.client_id', user.id)
      .single()

    if (ejecErr || !ejecucion) {
      return NextResponse.json({ error: 'No autorizado para actualizar esta ejecución' }, { status: 403 })
    }

    const updateData: any = {
      completado,
      updated_at: new Date().toISOString(),
      completed_at: completado ? new Date().toISOString() : null
    }

    const { data: updated, error: updErr } = await supabase
      .from('ejecuciones_ejercicio')
      .update(updateData)
      .eq('id', Number(id))
      .select('id, completado, updated_at, completed_at')
      .single()

    if (updErr) {
      console.warn('⚠️ toggle update RLS falló, intentando con service role:', updErr)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (!supabaseUrl || !serviceKey) {
        console.error('❌ Falta SUPABASE_SERVICE_ROLE_KEY o URL')
        return NextResponse.json({ error: 'Config faltante', details: 'SUPABASE_SERVICE_ROLE_KEY/URL' }, { status: 500 })
      }

      const admin = createSupabaseAdmin(supabaseUrl, serviceKey)

      // Verificar pertenencia con SQL seguro antes de actualizar
      const { data: verifyRows, error: verifyErr } = await admin
        .from('periodos_asignados')
        .select('id, enrollment_id, activity_enrollments!inner(client_id)')
        .eq('activity_enrollments.client_id', user.id)

      if (verifyErr) {
        console.error('❌ toggle verify admin error:', verifyErr)
        return NextResponse.json({ error: 'Error verificando ejecución', details: verifyErr.message }, { status: 500 })
      }
      const periodoIds = (verifyRows || []).map((p: any) => p.id)
      if (!periodoIds.length) {
        return NextResponse.json({ error: 'No autorizado', details: 'Sin periodos del usuario' }, { status: 403 })
      }

      // Confirmar que la ejecución pertenece a esos periodos
      const { data: execRow, error: execErr } = await admin
        .from('ejecuciones_ejercicio')
        .select('id, periodo_id')
        .eq('id', Number(id))
        .in('periodo_id', periodoIds)
        .single()

      if (execErr || !execRow) {
        return NextResponse.json({ error: 'No autorizado para actualizar esta ejecución' }, { status: 403 })
      }

      const { data: adminUpdated, error: adminUpdErr } = await admin
        .from('ejecuciones_ejercicio')
        .update(updateData)
        .eq('id', Number(id))
        .select('id, completado, updated_at, completed_at')
        .single()

      if (adminUpdErr) {
        console.error('❌ toggle admin update error:', adminUpdErr)
        return NextResponse.json({ error: 'Error actualizando ejecución', details: adminUpdErr.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, ejecucion: adminUpdated })
    }

    return NextResponse.json({ success: true, ejecucion: updated })
  } catch (error: any) {
    console.error('❌ toggle route error:', error)
    return NextResponse.json({ error: 'Error interno del servidor', details: String(error?.message || error) }, { status: 500 })
  }
}


