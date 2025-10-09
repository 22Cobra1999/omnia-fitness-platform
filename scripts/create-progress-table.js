const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createProgressTable() {
  try {
    console.log('Creating user_exercise_progress table...')
    
    // Crear tabla
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_exercise_progress (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          exercise_title TEXT NOT NULL,
          unit TEXT NOT NULL,
          value_1 DECIMAL(10,2),
          date_1 TIMESTAMP WITH TIME ZONE,
          value_2 DECIMAL(10,2),
          date_2 TIMESTAMP WITH TIME ZONE,
          value_3 DECIMAL(10,2),
          date_3 TIMESTAMP WITH TIME ZONE,
          value_4 DECIMAL(10,2),
          date_4 TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE (user_id, exercise_title)
        );
      `
    })

    if (createError) {
      console.error('Error creating table:', createError)
      return
    }

    console.log('✅ Table created successfully')
    
    // Habilitar RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE user_exercise_progress ENABLE ROW LEVEL SECURITY;'
    })

    if (rlsError) {
      console.error('Error enabling RLS:', rlsError)
      return
    }

    console.log('✅ RLS enabled')

    // Crear políticas
    const policies = [
      {
        name: 'Users can view their own exercise progress',
        sql: 'CREATE POLICY "Users can view their own exercise progress" ON user_exercise_progress FOR SELECT USING (auth.uid() = user_id);'
      },
      {
        name: 'Users can insert their own exercise progress',
        sql: 'CREATE POLICY "Users can insert their own exercise progress" ON user_exercise_progress FOR INSERT WITH CHECK (auth.uid() = user_id);'
      },
      {
        name: 'Users can update their own exercise progress',
        sql: 'CREATE POLICY "Users can update their own exercise progress" ON user_exercise_progress FOR UPDATE USING (auth.uid() = user_id);'
      },
      {
        name: 'Users can delete their own exercise progress',
        sql: 'CREATE POLICY "Users can delete their own exercise progress" ON user_exercise_progress FOR DELETE USING (auth.uid() = user_id);'
      }
    ]

    for (const policy of policies) {
      const { error: policyError } = await supabase.rpc('exec_sql', {
        sql: policy.sql
      })

      if (policyError) {
        console.error(`Error creating policy "${policy.name}":`, policyError)
      } else {
        console.log(`✅ Policy "${policy.name}" created`)
      }
    }

    console.log('🎉 All done! Table and policies created successfully.')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

createProgressTable()















































