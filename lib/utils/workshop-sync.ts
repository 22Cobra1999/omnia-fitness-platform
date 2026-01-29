import { createClient } from '@supabase/supabase-js'

export async function syncWorkshopToCalendar(activityId: number, coachId: string) {
    console.log(`🚀 [WorkshopSync] Sincronizando actividad ${activityId} para coach ${coachId}`)

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Obtener los temas del taller
    const { data: tallerDetalles, error: tdError } = await supabase
        .from('taller_detalles')
        .select('*')
        .eq('actividad_id', activityId)
        .eq('activo', true)

    if (tdError) {
        console.error('❌ [WorkshopSync] Error obteniendo taller_detalles:', tdError)
        return { success: false, error: tdError }
    }

    if (!tallerDetalles || tallerDetalles.length === 0) {
        console.log('⚠️ [WorkshopSync] No se encontraron temas activos para esta actividad.')
        return { success: true, count: 0 }
    }

    let insertedCount = 0
    let skippedCount = 0

    // 2. Procesar cada tema y sus fechas
    for (const td of tallerDetalles) {
        const originales = typeof td.originales === 'string' ? JSON.parse(td.originales) : td.originales

        if (!originales?.fechas_horarios || !Array.isArray(originales.fechas_horarios)) {
            console.log(`⚠️ [WorkshopSync] Tema "${td.nombre}" no tiene fechas válidas.`)
            continue
        }

        for (const fh of originales.fechas_horarios) {
            if (!fh.fecha || !fh.hora_inicio || !fh.hora_fin) continue

            // Construir timestamps
            const startTime = new Date(`${fh.fecha}T${fh.hora_inicio}`).toISOString()
            const endTime = new Date(`${fh.fecha}T${fh.hora_fin}`).toISOString()

            // 3. Verificar si ya existe para evitar duplicados
            const { data: existing } = await supabase
                .from('calendar_events')
                .select('id')
                .eq('coach_id', coachId)
                .eq('activity_id', activityId)
                .eq('start_time', startTime)
                .maybeSingle()

            if (existing) {
                skippedCount++
                continue
            }

            // 4. Insertar nuevo evento
            const { error: iError } = await supabase
                .from('calendar_events')
                .insert({
                    coach_id: coachId,
                    activity_id: activityId,
                    title: `Taller: ${td.nombre}`,
                    description: td.descripcion || `Cupo: ${fh.cupo || 20} personas`,
                    start_time: startTime,
                    end_time: endTime,
                    event_type: 'workshop',
                    status: 'scheduled',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })

            if (iError) {
                console.error(`❌ [WorkshopSync] Error insertando evento para tema "${td.nombre}":`, iError)
            } else {
                insertedCount++
            }
        }
    }

    console.log(`✅ [WorkshopSync] Sincronización finalizada: ${insertedCount} insertados, ${skippedCount} saltados.`)
    return { success: true, inserted: insertedCount, skipped: skippedCount }
}
