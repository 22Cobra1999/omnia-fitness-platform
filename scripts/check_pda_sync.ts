import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { join } from 'path'

dotenv.config({ path: join(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkPDA() {
    const clientId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
    const date = '2026-03-31'
    
    console.log(`--- Checking PDA for ${clientId} on ${date} ---`)
    
    const { data: pda, error: pdaError } = await supabase
        .from('progreso_diario_actividad')
        .select('*')
        .eq('cliente_id', clientId)
        .eq('fecha', date)

    if (pdaError) {
        console.error('Error fetching PDA:', pdaError)
    } else {
        console.log('PDA Rows:', JSON.stringify(pda, null, 2))
    }

    const { data: nutri, error: nutriError } = await supabase
        .from('progreso_cliente_nutricion')
        .select('*')
        .eq('cliente_id', clientId)
        .eq('fecha', date)

    if (nutriError) {
        console.error('Error fetching Nutri:', nutriError)
    } else {
        console.log('Nutri Rows:', JSON.stringify(nutri, null, 2))
    }
}

checkPDA()
