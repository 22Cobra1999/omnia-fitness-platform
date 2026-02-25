
import { getSupabaseClient } from './lib/supabase/supabase-client'

async function checkClientsTable() {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from('clients').select('*').limit(1)
    if (error) {
        console.error('Error fetching clients:', error)
    } else {
        console.log('Clients table columns:', Object.keys(data[0] || {}))
    }
}

checkClientsTable()
