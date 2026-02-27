import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
    const reqUrl = 'http://localhost:3000/api/activities/today?activityId=209&date=2026-02-26&dia=4&userId=00dedc23-0b17-4e50-b84e-b2e8100dc93c'
    const res = await fetch(reqUrl)
    const json = await res.json()
    if (json.activities) {
        console.log(JSON.stringify(json.activities.slice(0, 3), null, 2))
    } else {
        console.log(json)
    }
}

test()
