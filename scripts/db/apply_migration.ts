import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load .env.local explicitly
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables in .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log('🚀 Running migration...')
  
  const sql = `
    ALTER TABLE public.activity_enrollments ADD COLUMN IF NOT EXISTS last_streak_date DATE;
    ALTER TABLE public.activity_enrollments ADD COLUMN IF NOT EXISTS current_streak INT DEFAULT 0;
  `;
  
  // Attempt to run SQL via RPC. 
  // OMNIA typically has an execute_sql or exec_sql rpc for migrations.
  const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql })
  
  if (error) {
    if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('⚠️ RPC "execute_sql" does not exist. This is expected in some environments.')
        console.log('👉 Please run this SQL manually in the Supabase SQL Editor:')
        console.log(sql)
    } else {
        console.error('❌ Error applying migration:', error.message)
    }
  } else {
    console.log('✅ Migration applied successfully (or attempted)!')
  }
}

main()
