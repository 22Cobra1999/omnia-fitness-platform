import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
export async function POST(request: NextRequest) {
  try {
    // console.log('🔧 Configurando tabla de certificaciones...')
    const supabase = createClient({ cookies })
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    // console.log('✅ Usuario autenticado:', user.id)
    // SQL para crear la tabla
    const createTableSQL = `
      -- Crear tabla coach_certifications
      CREATE TABLE IF NOT EXISTS coach_certifications (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          coach_id UUID NOT NULL,
          name TEXT NOT NULL,
          issuer TEXT NOT NULL,
          year INTEGER NOT NULL,
          file_url TEXT NOT NULL,
          file_path TEXT NOT NULL,
          file_size BIGINT NOT NULL,
          verified BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      -- Habilitar RLS
      ALTER TABLE coach_certifications ENABLE ROW LEVEL SECURITY;
      -- Eliminar políticas existentes si las hay
      DROP POLICY IF EXISTS "Allow all operations" ON coach_certifications;
      DROP POLICY IF EXISTS "Coaches can manage their certifications" ON coach_certifications;
      -- Política para coaches (usuarios autenticados con rol coach)
      CREATE POLICY "Coaches can manage their certifications" ON coach_certifications
          FOR ALL USING (
              coach_id = auth.uid()::uuid
          );
      -- Política para lectura pública (opcional)
      CREATE POLICY "Public can view certifications" ON coach_certifications
          FOR SELECT USING (true);
    `
    // console.log('🔍 Ejecutando SQL para crear tabla...')
    // Ejecutar el SQL
    const { error: sqlError } = await supabase.rpc('exec_sql', {
      sql_query: createTableSQL
    })
    if (sqlError) {
      console.error('❌ Error ejecutando SQL:', sqlError)
      // Intentar método alternativo
      // console.log('🔄 Intentando método alternativo...')
      try {
        // Verificar si la tabla ya existe
        const { data: checkTable, error: checkError } = await supabase
          .from('coach_certifications')
          .select('count')
          .limit(1)
        if (checkError) {
          console.error('❌ Tabla no existe y no se pudo crear:', checkError)
          return NextResponse.json({
            error: 'No se pudo crear la tabla de certificaciones',
            details: 'Ejecuta manualmente el script SQL en Supabase',
            sqlError: sqlError.message,
            checkError: checkError.message
          }, { status: 500 })
        }
        // console.log('✅ Tabla ya existe o se creó correctamente')
      } catch (altError) {
        console.error('❌ Error en método alternativo:', altError)
        return NextResponse.json({
          error: 'Error configurando tabla',
          details: 'Contacta al administrador',
          sqlError: sqlError.message,
          altError: altError instanceof Error ? altError.message : 'Unknown'
        }, { status: 500 })
      }
    } else {
      // console.log('✅ SQL ejecutado correctamente')
    }
    // Verificar que la tabla funciona
    // console.log('🔍 Verificando que la tabla funciona...')
    const { data: testData, error: testError } = await supabase
      .from('coach_certifications')
      .select('count')
      .limit(1)
    if (testError) {
      console.error('❌ Error verificando tabla:', testError)
      return NextResponse.json({
        error: 'Tabla creada pero no funciona correctamente',
        details: testError.message
      }, { status: 500 })
    }
    // console.log('✅ Tabla verificada correctamente')
    return NextResponse.json({
      success: true,
      message: 'Tabla de certificaciones configurada correctamente',
      tableExists: true,
      tableWorking: true
    })
  } catch (error) {
    console.error('❌ Error configurando tabla:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
