import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
    const { data: qdata } = await supabase.from('progreso_cliente_nutricion').select('*').limit(1)
    console.log('Columns in progreso_cliente_nutricion:', Object.keys(qdata?.[0] || {}))
}

test()
