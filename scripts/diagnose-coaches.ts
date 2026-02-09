
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

async function diagnoseCoaches() {
    console.log('Diagnosing coaches table vs user_profiles roles...')

    const { data: coaches, error: coachesError } = await supabase
        .from('coaches')
        .select('id, full_name')

    if (coachesError) {
        console.error('Error fetching coaches:', coachesError)
        return
    }

    const coachIds = coaches.map(c => c.id)

    const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, full_name, role, email')
        .in('id', coachIds)

    if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        return
    }

    const profileMap = new Map(profiles.map(p => [p.id, p]))
    let inconsistentCount = 0

    coaches.forEach(coach => {
        const profile = profileMap.get(coach.id)
        if (!profile) {
            console.log(`⚠️ Coach ${coach.full_name} (${coach.id}) has NO user_profile!`)
        } else {
            const role = profile.role?.trim().toLowerCase()
            if (role !== 'coach') {
                console.log(`❌ MISMATCH: Coach ${coach.full_name} (${coach.id}) has role '${profile.role}' in user_profiles!`)
                inconsistentCount++
            } else {
                // console.log(`✅ OK: ${coach.full_name}`)
            }
        }
    })

    if (inconsistentCount === 0) {
        console.log('✅ All coaches in the database have the correct "coach" role.')
    } else {
        console.log(`found ${inconsistentCount} mismatches.`)
    }
}

diagnoseCoaches()
