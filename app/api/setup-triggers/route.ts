import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Configurando triggers en Supabase...')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const results = []

    // 1. Eliminar triggers anteriores
    console.log('1️⃣ Eliminando triggers anteriores...')
    const cleanupQueries = [
      'DROP TRIGGER IF EXISTS trigger_generate_executions ON activity_enrollments',
      'DROP TRIGGER IF EXISTS trigger_update_progress ON ejecuciones_ejercicio',
      'DROP TRIGGER IF EXISTS trigger_generate_executions_simple ON activity_enrollments',
      'DROP FUNCTION IF EXISTS generate_exercise_executions_with_replicas()',
      'DROP FUNCTION IF EXISTS update_client_progress()',
      'DROP FUNCTION IF EXISTS generate_exercise_executions_simple()'
    ]

    for (const query of cleanupQueries) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: query })
        if (error) {
          console.log(`⚠️ Error en cleanup (puede ser normal): ${error.message}`)
        } else {
          console.log(`✅ Cleanup exitoso: ${query}`)
        }
      } catch (err) {
        console.log(`⚠️ Error en cleanup (puede ser normal): ${err}`)
      }
    }

    // 2. Crear función simple para generar ejecuciones
    console.log('2️⃣ Creando función para generar ejecuciones...')
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION generate_exercise_executions_simple()
      RETURNS TRIGGER AS $$
      DECLARE
        exercise_record RECORD;
        total_periods INTEGER;
        execution_count INTEGER := 0;
        i INTEGER;
      BEGIN
        IF NEW.status = 'activa' THEN
          SELECT cantidad_periodos INTO total_periods
          FROM periodos 
          WHERE actividad_id = NEW.activity_id
          LIMIT 1;
          
          IF total_periods IS NULL THEN
            total_periods := 1;
          END IF;
          
          FOR exercise_record IN 
            SELECT id, tipo, activity_id
            FROM ejercicios_detalles 
            WHERE activity_id = NEW.activity_id
          LOOP
            FOR i IN 1..total_periods LOOP
              DECLARE
                default_intensity TEXT;
              BEGIN
                IF exercise_record.tipo = 'fuerza' THEN
                  default_intensity := 'Principiante';
                ELSIF exercise_record.tipo = 'cardio' THEN
                  default_intensity := 'Moderado';
                ELSE
                  default_intensity := 'Descanso';
                END IF;
                
                INSERT INTO ejecuciones_ejercicio (
                  ejercicio_id,
                  client_id,
                  intensidad_aplicada,
                  completado,
                  fecha_ejecucion,
                  semana_original,
                  periodo_replica,
                  created_at,
                  updated_at
                ) VALUES (
                  exercise_record.id,
                  NEW.client_id,
                  default_intensity,
                  false,
                  CURRENT_DATE + INTERVAL '1 day' * (i - 1),
                  i,
                  i,
                  NOW(),
                  NOW()
                );
                
                execution_count := execution_count + 1;
              END;
            END LOOP;
          END LOOP;
          
          RAISE NOTICE '✅ Creadas % ejecuciones para cliente % en actividad %', 
            execution_count, NEW.client_id, NEW.activity_id;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `

    const { error: functionError } = await supabase.rpc('exec_sql', { sql: createFunctionSQL })
    if (functionError) {
      console.error('❌ Error creando función:', functionError)
      return NextResponse.json({ error: `Error creando función: ${functionError.message}` }, { status: 500 })
    }
    console.log('✅ Función creada correctamente')

    // 3. Crear trigger
    console.log('3️⃣ Creando trigger...')
    const createTriggerSQL = `
      CREATE TRIGGER trigger_generate_executions_simple
        AFTER INSERT ON activity_enrollments
        FOR EACH ROW
        EXECUTE FUNCTION generate_exercise_executions_simple()
    `

    const { error: triggerError } = await supabase.rpc('exec_sql', { sql: createTriggerSQL })
    if (triggerError) {
      console.error('❌ Error creando trigger:', triggerError)
      return NextResponse.json({ error: `Error creando trigger: ${triggerError.message}` }, { status: 500 })
    }
    console.log('✅ Trigger creado correctamente')

    // 4. Verificar instalación
    console.log('4️⃣ Verificando instalación...')
    const { data: triggers, error: verifyError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_manipulation')
      .eq('trigger_name', 'trigger_generate_executions_simple')

    if (verifyError) {
      console.error('❌ Error verificando triggers:', verifyError)
      return NextResponse.json({ error: `Error verificando triggers: ${verifyError.message}` }, { status: 500 })
    }

    console.log('✅ Triggers verificados:', triggers)

    // 5. Verificar datos para actividad 78
    console.log('5️⃣ Verificando datos para actividad 78...')
    const { data: ejercicios, error: ejerciciosError } = await supabase
      .from('ejercicios_detalles')
      .select('id, nombre_ejercicio')
      .eq('activity_id', 78)

    const { data: periodos, error: periodosError } = await supabase
      .from('periodos')
      .select('cantidad_periodos')
      .eq('actividad_id', 78)

    console.log('📊 Ejercicios para actividad 78:', ejercicios?.length || 0)
    console.log('🔄 Períodos para actividad 78:', periodos?.[0]?.cantidad_periodos || 0)

    return NextResponse.json({
      success: true,
      message: 'Triggers configurados correctamente',
      data: {
        triggers: triggers,
        ejercicios: ejercicios?.length || 0,
        periodos: periodos?.[0]?.cantidad_periodos || 0
      }
    })

  } catch (error) {
    console.error('❌ Error general:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor', 
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
