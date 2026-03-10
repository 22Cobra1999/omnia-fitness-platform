
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

async function check() {
    const { data, error } = await supabase.from('progreso_diario_actividad').select('*').limit(1)
    if (data) {
        console.log('progreso_diario_actividad columns:', Object.keys(data[0] || {}))
    } else {
        console.log('Error fetching pda:', error)
    }
}

check()
