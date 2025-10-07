import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
export async function POST() {
  try {
    const supabase = createClient({ cookies })
    const results: any = {}
    // 1. Crear tabla schedule_blocks
    try {
      const { error: createScheduleBlocksError } = await supabase.rpc('create_schedule_blocks_table')
      if (createScheduleBlocksError) {
        // Si no existe la función, crear la tabla directamente con SQL
        const { error: sqlError } = await supabase.rpc('exec_sql', {
          sql_query: `
            CREATE TABLE IF NOT EXISTS schedule_blocks (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
              name TEXT NOT NULL,
              start_time TIME NOT NULL,
              end_time TIME NOT NULL,
              start_date DATE NOT NULL,
              end_date DATE NOT NULL,
              color TEXT NOT NULL,
              selected_dates JSONB DEFAULT '[]',
              repeat_type TEXT DEFAULT 'days',
              selected_week_days TEXT[] DEFAULT '{}',
              selected_weeks INTEGER[] DEFAULT '{}',
              selected_months TEXT[] DEFAULT '{}',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            -- Crear índices para mejorar rendimiento
            CREATE INDEX IF NOT EXISTS idx_schedule_blocks_activity_id ON schedule_blocks(activity_id);
            CREATE INDEX IF NOT EXISTS idx_schedule_blocks_dates ON schedule_blocks(start_date, end_date);
          `
        })
        if (sqlError) {
          results.schedule_blocks = { 
            created: false, 
            error: sqlError.message,
            suggestion: 'No se pudo crear la tabla schedule_blocks. Verifica permisos de base de datos.'
          }
        } else {
          results.schedule_blocks = { created: true, message: 'Tabla schedule_blocks creada exitosamente' }
        }
      } else {
        results.schedule_blocks = { created: true, message: 'Tabla schedule_blocks creada exitosamente' }
      }
    } catch (error) {
      results.schedule_blocks = { 
        created: false, 
        error: `Error inesperado: ${error}`,
        suggestion: 'Error al crear tabla schedule_blocks'
      }
    }
    // 2. Crear tabla workshop_details
    try {
      const { error: createWorkshopDetailsError } = await supabase.rpc('create_workshop_details_table')
      if (createWorkshopDetailsError) {
        // Si no existe la función, crear la tabla directamente con SQL
        const { error: sqlError } = await supabase.rpc('exec_sql', {
          sql_query: `
            CREATE TABLE IF NOT EXISTS workshop_details (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
              modality TEXT NOT NULL,
              capacity INTEGER NOT NULL,
              video_url TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            -- Crear índice para mejorar rendimiento
            CREATE INDEX IF NOT EXISTS idx_workshop_details_activity_id ON workshop_details(activity_id);
          `
        })
        if (sqlError) {
          results.workshop_details = { 
            created: false, 
            error: sqlError.message,
            suggestion: 'No se pudo crear la tabla workshop_details. Verifica permisos de base de datos.'
          }
        } else {
          results.workshop_details = { created: true, message: 'Tabla workshop_details creada exitosamente' }
        }
      } else {
        results.workshop_details = { created: true, message: 'Tabla workshop_details creada exitosamente' }
      }
    } catch (error) {
      results.workshop_details = { 
        created: false, 
        error: `Error inesperado: ${error}`,
        suggestion: 'Error al crear tabla workshop_details'
      }
    }
    // 3. Crear tabla program_details
    try {
      const { error: createProgramDetailsError } = await supabase.rpc('create_program_details_table')
      if (createProgramDetailsError) {
        // Si no existe la función, crear la tabla directamente con SQL
        const { error: sqlError } = await supabase.rpc('exec_sql', {
          sql_query: `
            CREATE TABLE IF NOT EXISTS program_details (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
              duration TEXT,
              level TEXT,
              materials TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            -- Crear índice para mejorar rendimiento
            CREATE INDEX IF NOT EXISTS idx_program_details_activity_id ON program_details(activity_id);
          `
        })
        if (sqlError) {
          results.program_details = { 
            created: false, 
            error: sqlError.message,
            suggestion: 'No se pudo crear la tabla program_details. Verifica permisos de base de datos.'
          }
        } else {
          results.program_details = { created: true, message: 'Tabla program_details creada exitosamente' }
        }
      } else {
        results.program_details = { created: true, message: 'Tabla program_details creada exitosamente' }
      }
    } catch (error) {
      results.program_details = { 
        created: false, 
        error: `Error inesperado: ${error}`,
        suggestion: 'Error al crear tabla program_details'
      }
    }
    // 4. Agregar campos faltantes a la tabla activities si es necesario
    try {
      const { error: alterActivitiesError } = await supabase.rpc('exec_sql', {
        sql_query: `
          -- Agregar campo video_url si no existe
          DO $$ 
          BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'activities' AND column_name = 'video_url') THEN
              ALTER TABLE activities ADD COLUMN video_url TEXT;
            END IF;
          END $$;
          -- Agregar campo difficulty si no existe (ya existe como 'difficulty')
          -- Agregar campo capacity si no existe
          DO $$ 
          BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'activities' AND column_name = 'capacity') THEN
              ALTER TABLE activities ADD COLUMN capacity INTEGER;
            END IF;
          END $$;
        `
      })
      if (alterActivitiesError) {
        results.activities_update = { 
          updated: false, 
          error: alterActivitiesError.message,
          note: 'Los campos ya existen o no se pudieron agregar'
        }
      } else {
        results.activities_update = { updated: true, message: 'Campos adicionales agregados a activities' }
      }
    } catch (error) {
      results.activities_update = { 
        updated: false, 
        error: `Error inesperado: ${error}`,
        note: 'Los campos ya existen o no se pudieron agregar'
      }
    }
    return NextResponse.json({ 
      success: true,
      tablesCreated: results,
      summary: {
        scheduleBlocksCreated: results.schedule_blocks?.created || false,
        workshopDetailsCreated: results.workshop_details?.created || false,
        programDetailsCreated: results.program_details?.created || false,
        activitiesUpdated: results.activities_update?.updated || false
      }
    })
  } catch (error) {
    console.error('Error en POST /api/create-missing-tables:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
