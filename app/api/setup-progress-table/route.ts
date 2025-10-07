import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient({ cookies: () => cookieStore })
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    // Intentar crear la tabla usando SQL directo
    const createTableSQL = `
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
    // Intentar ejecutar el SQL
    const { error: createError } = await supabase.rpc('exec', { sql: createTableSQL })
    if (createError) {
      console.error('Error creating table:', createError)
      return NextResponse.json({ 
        error: 'Error al crear tabla', 
        details: createError.message 
      }, { status: 500 })
    }
    // Habilitar RLS
    const { error: rlsError } = await supabase.rpc('exec', { 
      sql: 'ALTER TABLE user_exercise_progress ENABLE ROW LEVEL SECURITY;' 
    })
    if (rlsError) {
      console.error('Error enabling RLS:', rlsError)
    }
    // Crear políticas RLS
    const policies = [
      'CREATE POLICY IF NOT EXISTS "Users can view their own exercise progress" ON user_exercise_progress FOR SELECT USING (auth.uid() = user_id);',
      'CREATE POLICY IF NOT EXISTS "Users can insert their own exercise progress" ON user_exercise_progress FOR INSERT WITH CHECK (auth.uid() = user_id);',
      'CREATE POLICY IF NOT EXISTS "Users can update their own exercise progress" ON user_exercise_progress FOR UPDATE USING (auth.uid() = user_id);',
      'CREATE POLICY IF NOT EXISTS "Users can delete their own exercise progress" ON user_exercise_progress FOR DELETE USING (auth.uid() = user_id);'
    ]
    for (const policy of policies) {
      const { error: policyError } = await supabase.rpc('exec', { sql: policy })
      if (policyError) {
        console.error('Error creating policy:', policyError)
      }
    }
    return NextResponse.json({
      success: true,
      message: 'Tabla creada exitosamente'
    })
  } catch (error) {
    console.error('Error in setup table:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
