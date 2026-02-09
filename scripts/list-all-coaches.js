const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function listCoaches() {
  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select('id, full_name, role')
    .eq('role', 'coach')

  if (error) {
    console.error('Error fetching coaches:', error)
    return
  }

  console.log('--- ALL COACHES IN USER_PROFILES ---')
  profiles.forEach(p => console.log(`${p.full_name} (${p.id})`))
  
  const { data: coachesTable } = await supabase.from('coaches').select('id, full_name')
  console.log('--- ALL ENTRIES IN COACHES TABLE ---')
  coachesTable.forEach(c => console.log(`${c.full_name} (${c.id})`))
}

listCoaches()
