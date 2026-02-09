import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkActivity() {
  const { data: activity, error } = await supabase
    .from('activities')
    .select('id, title, coach_id, coaches(full_name)')
    .eq('id', 78)
    .single()

  if (error) {
    console.error('Error fetching activity:', error)
    return
  }

  console.log('Activity 78:', activity)
}

checkActivity()
