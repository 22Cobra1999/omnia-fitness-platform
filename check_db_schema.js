
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
    console.log('--- activity_enrollments ---')
    const { data: cols } = await supabase.from('activity_enrollments').select('*').limit(1)
    if (cols && cols.length > 0) {
        console.log('Columns:', Object.keys(cols[0]))
        console.log('Sample ID type:', typeof cols[0].id, cols[0].id)
    }

    console.log('--- progreso_cliente ---')
    const { data: progCols } = await supabase.from('progreso_cliente').select('*').limit(1)
    if (progCols && progCols.length > 0) {
        console.log('progreso_cliente columns:', Object.keys(progCols[0]))
        console.log('Sample enrollment_id type:', typeof progCols[0].enrollment_id, progCols[0].enrollment_id)
    }
}

checkSchema()
