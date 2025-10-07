import { NextRequest, NextResponse } from 'next/server';
import { createClientWithCookies } from '../../../lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = request.cookies;
    const supabase = await createClientWithCookies(cookieStore);

    console.log('🧹 Iniciando limpieza y corrección del trigger...');

    // 1. Limpiar todas las ejecuciones existentes
    console.log('🗑️ Eliminando ejecuciones existentes...');
    const { error: deleteError } = await supabase
      .from('ejecuciones_ejercicio')
      .delete()
      .neq('id', 0); // Eliminar todas las filas

    if (deleteError) {
      console.error('Error eliminando ejecuciones:', deleteError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error eliminando ejecuciones existentes',
        details: deleteError 
      });
    }

    // 2. Eliminar el trigger actual
    // console.log('🔧 Eliminando trigger actual...');
    await supabase.rpc('execute_sql', { 
      sql: 'DROP TRIGGER IF EXISTS trigger_generate_executions ON activity_enrollments;' 
    });

    // 3. Eliminar la función actual
    // console.log('🔧 Eliminando función actual...');
    await supabase.rpc('execute_sql', { 
      sql: 'DROP FUNCTION IF EXISTS generate_exercise_executions();' 
    });

    // 4. Crear nueva función simplificada
    console.log('🆕 Creando nueva función...');
    const newFunctionSQL = `
    CREATE OR REPLACE FUNCTION generate_exercise_executions()
    RETURNS TRIGGER AS $$
    DECLARE
        ejercicio_record RECORD;
        periodo_record RECORD;
        client_uuid UUID;
        activity_uuid UUID;
        coach_uuid UUID;
        execution_count INTEGER;
    BEGIN
        -- Obtener datos del enrollment
        client_uuid := NEW.client_id;
        activity_uuid := NEW.activity_id;
        
        -- Verificar si ya existen ejecuciones para esta actividad y cliente
        SELECT COUNT(*) INTO execution_count
        FROM ejecuciones_ejercicio ee
        JOIN periodos_asignados pa ON ee.periodo_id = pa.id
        WHERE pa.activity_id = activity_uuid 
        AND ee.client_id = client_uuid;
        
        -- Si ya existen ejecuciones, no generar más
        IF execution_count > 0 THEN
            RAISE NOTICE 'Ejecuciones ya existen para cliente % en actividad %, saltando...', client_uuid, activity_uuid;
            RETURN NEW;
        END IF;
        
        -- Generar ejecuciones para cada período y ejercicio
        FOR periodo_record IN 
            SELECT id, numero_periodo 
            FROM periodos_asignados 
            WHERE activity_id = activity_uuid
            ORDER BY numero_periodo
        LOOP
            FOR ejercicio_record IN 
                SELECT id, tipo, intensidad_base
                FROM ejercicios_detalles 
                WHERE activity_id = activity_uuid
                ORDER BY id
            LOOP
                -- Insertar ejecución
                INSERT INTO ejecuciones_ejercicio (
                    periodo_id,
                    numero_periodo,
                    ejercicio_id,
                    client_id,
                    intensidad_aplicada,
                    completado,
                    created_at,
                    updated_at
                ) VALUES (
                    periodo_record.id,
                    periodo_record.numero_periodo,
                    ejercicio_record.id,
                    client_uuid,
                    CASE 
                        WHEN ejercicio_record.tipo = 'descanso' THEN 'Descanso'
                        ELSE ejercicio_record.intensidad_base
                    END,
                    false,
                    NOW(),
                    NOW()
                );
            END LOOP;
        END LOOP;
        
        RAISE NOTICE 'Generadas ejecuciones para cliente % en actividad %', client_uuid, activity_uuid;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;`;

    const { error: functionError } = await supabase.rpc('execute_sql', { sql: newFunctionSQL });

    if (functionError) {
      console.error('Error creando función:', functionError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error creando nueva función',
        details: functionError 
      });
    }

    // 5. Crear el trigger
    // console.log('🔧 Creando nuevo trigger...');
    const { error: triggerError } = await supabase.rpc('execute_sql', { 
      sql: `CREATE TRIGGER trigger_generate_executions
            AFTER INSERT ON activity_enrollments
            FOR EACH ROW
            EXECUTE FUNCTION generate_exercise_executions();` 
    });

    if (triggerError) {
      console.error('Error creando trigger:', triggerError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error creando nuevo trigger',
        details: triggerError 
      });
    }

    // 6. Verificar que se creó correctamente
    // console.log('✅ Verificando trigger...');
    const { data: triggerInfo, error: triggerInfoError } = await supabase.rpc('execute_sql', { 
      sql: `SELECT trigger_name, event_manipulation, action_timing 
            FROM information_schema.triggers 
            WHERE trigger_name = 'trigger_generate_executions'` 
    });

    // 7. Probar el trigger con un enrollment de prueba
    console.log('🧪 Probando trigger...');
    const testUserId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';
    
    // Limpiar enrollments anteriores de prueba
    await supabase
      .from('activity_enrollments')
      .delete()
      .eq('client_id', testUserId)
      .eq('activity_id', 59);

    // Crear nuevo enrollment para probar
    const { data: newEnrollment, error: enrollmentError } = await supabase
      .from('activity_enrollments')
      .insert({
        activity_id: 59,
        client_id: testUserId,
        status: 'activa'
      })
      .select()
      .single();

    if (enrollmentError) {
      console.error('Error creando enrollment de prueba:', enrollmentError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error creando enrollment de prueba',
        details: enrollmentError 
      });
    }

    // 8. Verificar ejecuciones generadas
    const { data: executions, error: executionsError } = await supabase
      .from('ejecuciones_ejercicio')
      .select('*')
      .eq('client_id', testUserId);

    const totalExecutions = executions?.length || 0;
    const expectedExecutions = 19 * 2; // 19 ejercicios × 2 períodos

    return NextResponse.json({
      success: true,
      message: 'Trigger corregido y probado exitosamente',
      data: {
        triggerInfo,
        triggerInfoError,
        newEnrollment,
        executions: {
          total: totalExecutions,
          expected: expectedExecutions,
          correct: totalExecutions === expectedExecutions,
          executions: executions?.slice(0, 5) || [] // Primeras 5 para verificar
        },
        executionsError
      }
    });

  } catch (error) {
    console.error('Error en clean-and-fix-trigger:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}
