const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase - credenciales del proyecto
const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncmZzd3JzdnJ6d3RnaWxzc2FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjE5MDMwMywiZXhwIjoyMDYxNzY2MzAzfQ.qRKBCY7dbxvNs-KCQqAm9L6xBY4X293oaFAW5yxc9Hc';

console.log('🔧 Instalando triggers en Supabase...');
console.log('📡 URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQL(sql) {
  try {
    console.log('📝 Ejecutando SQL...');
    
    // Usar el método rpc para ejecutar SQL
    const { data, error } = await supabase.rpc('execute_sql', { sql });
    
    if (error) {
      console.error('❌ Error ejecutando SQL:', error);
      return false;
    }
    
    console.log('✅ SQL ejecutado correctamente');
    return true;
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
    return false;
  }
}

async function installTriggers() {
  console.log('\n🚀 Iniciando instalación de triggers...\n');

  // 1. Eliminar triggers anteriores
  console.log('1️⃣ Eliminando triggers anteriores...');
  const cleanupQueries = [
    'DROP TRIGGER IF EXISTS trigger_generate_executions ON activity_enrollments',
    'DROP TRIGGER IF EXISTS trigger_update_progress ON ejecuciones_ejercicio',
    'DROP TRIGGER IF EXISTS trigger_generate_executions_simple ON activity_enrollments',
    'DROP FUNCTION IF EXISTS generate_exercise_executions_with_replicas()',
    'DROP FUNCTION IF EXISTS update_client_progress()',
    'DROP FUNCTION IF EXISTS generate_exercise_executions_simple()'
  ];

  for (const query of cleanupQueries) {
    try {
      await executeSQL(query);
    } catch (err) {
      console.log(`⚠️ Error en cleanup (puede ser normal): ${err.message}`);
    }
  }

  // 2. Crear función simple para generar ejecuciones
  console.log('\n2️⃣ Creando función para generar ejecuciones...');
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
  `;
  
  const functionSuccess = await executeSQL(createFunctionSQL);
  if (!functionSuccess) {
    console.error('❌ Error creando función, abortando...');
    return false;
  }

  // 3. Crear trigger
  console.log('\n3️⃣ Creando trigger...');
  const createTriggerSQL = `
    CREATE TRIGGER trigger_generate_executions_simple
      AFTER INSERT ON activity_enrollments
      FOR EACH ROW
      EXECUTE FUNCTION generate_exercise_executions_simple()
  `;
  
  const triggerSuccess = await executeSQL(createTriggerSQL);
  if (!triggerSuccess) {
    console.error('❌ Error creando trigger, abortando...');
    return false;
  }

  // 4. Verificar instalación consultando las funciones
  console.log('\n4️⃣ Verificando instalación...');
  
  // Verificar que la función existe
  const { data: functions, error: functionsError } = await supabase
    .from('pg_proc')
    .select('proname')
    .eq('proname', 'generate_exercise_executions_simple');
  
  if (functionsError) {
    console.error('❌ Error verificando funciones:', functionsError);
  } else {
    console.log('✅ Función verificada:', functions?.length > 0 ? '✅ Existe' : '❌ No existe');
  }

  // 5. Probar con datos de actividad 78
  console.log('\n5️⃣ Probando con datos de actividad 78...');
  
  const { data: ejercicios, error: ejerciciosError } = await supabase
    .from('ejercicios_detalles')
    .select('id, nombre_ejercicio, tipo')
    .eq('activity_id', 78);
  
  const { data: periodos, error: periodosError } = await supabase
    .from('periodos')
    .select('cantidad_periodos')
    .eq('actividad_id', 78);
  
  console.log('📊 Ejercicios para probar:', ejercicios?.length || 0);
  console.log('🔄 Períodos para probar:', periodos?.[0]?.cantidad_periodos || 0);
  
  const expectedExecutions = (ejercicios?.length || 0) * (periodos?.[0]?.cantidad_periodos || 0);
  console.log('🎯 Ejecuciones esperadas:', expectedExecutions);

  console.log('\n✅ Instalación de triggers completada!');
  console.log('\n🧪 Para probar:');
  console.log('1. Intenta comprar la actividad 78');
  console.log('2. Verifica que se generen', expectedExecutions, 'ejecuciones en ejecuciones_ejercicio');
  console.log('3. Revisa los logs en la consola de Supabase');
  
  return true;
}

// Ejecutar instalación
installTriggers().catch(console.error);
