
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

async function check() {
    const { data: cols, error } = await supabase.rpc('get_table_columns', { p_table: 'activity_enrollments' })
    if (error) {
        // If RPC doesn't exist, try to select one record
        const { data, error: qErr } = await supabase.from('activity_enrollments').select('*').limit(1)
        if (data && data.length > 0) {
            console.log('Sample data keys:', Object.keys(data[0]))
            console.log('Sample ID:', data[0].id, 'Type:', typeof data[0].id)
        } else {
            console.log('No data found in activity_enrollments')
        }
    } else {
        console.log('Columns:', cols)
    }
}

check()
