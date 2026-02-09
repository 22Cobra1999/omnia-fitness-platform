
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

async function fixFrancoHotmail() {
    const userId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
    console.log(`Fixing user: ${userId} (Franco hotmail)`)

    // 1. Update role to client
    const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ role: 'client' })
        .eq('id', userId)

    if (updateError) {
        console.error('Error updating role:', updateError)
        return
    }
    console.log('✅ Updated role to "client" in user_profiles')

    // 2. Remove from coaches table
    const { error: deleteError } = await supabase
        .from('coaches')
        .delete()
        .eq('id', userId)

    if (deleteError) {
        console.error('Error removing from coaches:', deleteError)
        return
    }
    console.log('✅ Removed from coaches table')
}

fixFrancoHotmail()
