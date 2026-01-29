const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncTallerToCalendar(coachId) {
    console.log(`🚀 Sincronizando talleres para el coach: ${coachId}`);

    // 1. Obtener todos los temas activos del coach
    const { data: tallerDetalles, error: tdError } = await supabase
        .from('taller_detalles')
        .select('*, activities!inner(coach_id)')
        .eq('activities.coach_id', coachId)
        .eq('activo', true);

    if (tdError) {
        console.error('❌ Error obteniendo taller_detalles:', tdError);
        return;
    }

    console.log(`📥 Encontrados ${tallerDetalles?.length || 0} temas de taller.`);

    let insertedCount = 0;
    let skippedCount = 0;

    for (const td of tallerDetalles || []) {
        if (!td.originales?.fechas_horarios) continue;

        for (const fh of td.originales.fechas_horarios) {
            if (!fh.fecha || !fh.hora_inicio || !fh.hora_fin) continue;

            const startTime = new Date(`${fh.fecha}T${fh.hora_inicio}`).toISOString();
            const endTime = new Date(`${fh.fecha}T${fh.hora_fin}`).toISOString();

            // Verificar si ya existe
            const { data: existing, error: eError } = await supabase
                .from('calendar_events')
                .select('id')
                .eq('coach_id', coachId)
                .eq('activity_id', td.actividad_id)
                .eq('start_time', startTime)
                .maybeSingle();

            if (existing) {
                skippedCount++;
                continue;
            }

            // Insertar
            const { error: iError } = await supabase
                .from('calendar_events')
                .insert({
                    coach_id: coachId,
                    activity_id: td.actividad_id,
                    title: `Taller: ${td.nombre}`,
                    description: td.descripcion || `Cupo: ${fh.cupo || 20} personas`,
                    start_time: startTime,
                    end_time: endTime,
                    event_type: 'workshop',
                    status: 'scheduled',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });

            if (iError) {
                console.error(`❌ Error insertando evento para tema ${td.nombre}:`, iError);
            } else {
                insertedCount++;
            }
        }
    }

    console.log(`✅ Sincronización finalizada: ${insertedCount} insertados, ${skippedCount} saltados.`);
}

const coachId = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f';
syncTallerToCalendar(coachId);
