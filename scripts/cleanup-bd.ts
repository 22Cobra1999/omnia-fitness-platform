import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanupOrphans() {
    const { data, error } = await supabase
        .from('progreso_cliente')
        .select('id, ejercicios_pendientes, ejercicios_completados, detalles_series')
        .eq('cliente_id', '00dedc23-0b17-4e50-b84e-b2e8100dc93c')
        .eq('fecha', '2026-02-26');

    if (error || !data || data.length === 0) {
        console.error('No progress record found or error:', error)
        return
    }

    for (const row of data) {
        let pendientes = typeof row.ejercicios_pendientes === 'string' ? JSON.parse(row.ejercicios_pendientes) : row.ejercicios_pendientes;
        let completados = typeof row.ejercicios_completados === 'string' ? JSON.parse(row.ejercicios_completados) : row.ejercicios_completados;
        let details = typeof row.detalles_series === 'string' ? JSON.parse(row.detalles_series) : row.detalles_series;
        let updated = false;

        // Remove any keys ending in _0
        Object.keys(pendientes || {}).forEach(k => {
            if (k.endsWith('_0')) {
                delete pendientes[k];
                updated = true;
            }
        });
        Object.keys(completados || {}).forEach(k => {
            if (k.endsWith('_0')) {
                delete completados[k];
                updated = true;
            }
        });
        Object.keys(details || {}).forEach(k => {
            if (k.endsWith('_0')) {
                delete details[k];
                updated = true;
            }
        });

        if (updated) {
            const { error: updError } = await supabase
                .from('progreso_cliente')
                .update({
                    ejercicios_pendientes: pendientes,
                    ejercicios_completados: completados,
                    detalles_series: details
                })
                .eq('id', row.id);

            console.log('Cleaned up row', row.id, updError || 'success');
        } else {
            console.log('Row', row.id, 'clean, nothing to modify');
        }
    }
}

cleanupOrphans()
