
import { createClient } from './lib/supabase/supabase-client'

async function checkValues() {
    const supabase = createClient()
    
    console.log('--- Checking real data in progreso_cliente ---')
    const { data, error } = await supabase
        .from('progreso_cliente')
        .select('id, ejercicios_pendientes, ejercicios_completados, informacion, detalles_series')
        .limit(1)

    if (error) {
        console.error('Error:', error)
        return
    }

    const row = data[0]
    if (!row) {
        console.log('No data found.')
        return
    }

    console.log('ID:', row.id)
    console.log('pendientes type:', typeof row.ejercicios_pendientes, Array.isArray(row.ejercicios_pendientes) ? 'Array' : 'Object')
    console.log('pendientes value:', JSON.stringify(row.ejercicios_pendientes, null, 2))
    console.log('informacion type:', typeof row.informacion)
    console.log('informacion value:', JSON.stringify(row.informacion, null, 2))
}

checkValues()
