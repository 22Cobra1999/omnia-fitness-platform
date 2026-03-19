
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function check() {
    const { data, error } = await supabase.from('coaches').select('*').limit(1)
    if (error) {
        console.error('Error:', error)
    } else if (data && data.length > 0) {
        console.log('Columns in coaches table:', Object.keys(data[0]))
    } else {
        console.log('No data found in coaches table.')
    }
}

check()
