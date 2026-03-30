import { getSupabaseClient } from './lib/supabase/supabase-client'

async function checkSchema() {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
        .from('progreso_diario_actividad')
        .select('*')
        .limit(1)
    
    if (error) {
        console.error('Error fetching data:', error)
        return
    }
    
    if (data && data.length > 0) {
        console.log('Columns found:', Object.keys(data[0]))
    } else {
        console.log('No data found to infer columns.')
        // Try getting column names from information_schema if possible, but select * is easier if there is data
    }
}

checkSchema()
