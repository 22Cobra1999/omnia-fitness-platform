import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl!, supabaseKey!)

async function checkProgressData() {
    const clientId = '4f75d5ef-e188-4b7e-9acb-9274022e3672'
    const monthStart = '2026-04-01'
    const monthEnd = '2026-04-30'

    console.log(`Checking progress for client: ${clientId}`)

    // 1. Fetch progress
    const { data: pda, error: pdaError } = await supabase
        .from('progreso_diario_actividad')
        .select('*')
        .eq('cliente_id', clientId)
        .gte('fecha', monthStart)
        .lte('fecha', monthEnd)

    if (pdaError) {
        console.error('PDA Error:', pdaError)
        return
    }

    console.log(`Found ${pda?.length} progress records.`)

    const activityIds = [78, 93, 124]
    console.log(`Checking Activity IDs:`, activityIds)

    // 2. Fetch activities
    const { data: acts, error: actsError } = await supabase
        .from('activities')
        .select('id, title, coach_id')
        .in('id', activityIds)

    if (actsError) {
        console.error('Acts Error:', actsError)
        return
    }

    console.log('Activities found:')
    acts?.forEach(a => {
        console.log(`- ID: ${a.id}, Title: ${a.title}, Coach ID: ${a.coach_id}`)
    })

    // 4. Find ANY activity around today (2026-04-02)
    const { data: recent, error: recentError } = await supabase
        .from('progreso_diario_actividad')
        .select('cliente_id, fecha, actividad_id, fit_items_o, fit_items_c, nut_items_o, nut_items_c')
        .gte('fecha', '2026-03-25')
        .lte('fecha', '2026-04-05')
        .order('fecha', { ascending: false })

    if (recent) {
        console.log('\nRecent activity in PDA table:')
        recent.forEach(r => {
            console.log(`- Date: ${r.fecha}, Client: ${r.cliente_id}, Act: ${r.actividad_id}`)
        })
    }
}

checkProgressData()
