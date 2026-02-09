
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function findFrancos() {
    console.log('Searching for Francos...')

    const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, role, email')
        .ilike('full_name', '%franco%')

    if (error) {
        console.error('Error:', error)
        return
    }

    console.log('Found profiles:', profiles)

    // Check if any of these are in the coaches table
    const ids = profiles.map(p => p.id)
    const { data: coachesInDb } = await supabase
        .from('coaches')
        .select('id, full_name')
        .in('id', ids)

    const coachIds = new Set(coachesInDb?.map(c => c.id))

    profiles.forEach(p => {
        const isInCoachesTable = coachIds.has(p.id)
        console.log(`User: ${p.full_name} (${p.role}) - In Coaches Table: ${isInCoachesTable}`)
    })
}

findFrancos()
