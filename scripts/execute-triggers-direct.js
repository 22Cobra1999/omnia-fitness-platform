const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase - usar las mismas credenciales que en el código
const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncmZzd3JzdnJ6d3RnaWxzYXAiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzM1MzU5NzUyLCJleHAiOjIwNTA5MzU3NTJ9.FH1Yk6GqKj5Vj2Y3Q4R5T6U7I8O9P0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6';

console.log('🔧 Configurando triggers en Supabase...');
console.log('📡 URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQL(sql) {
  try {
    console.log('📝 Ejecutando SQL...');
    
    // Dividir el SQL en statements individuales
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('🔄 Ejecutando:', statement.trim().substring(0, 50) + '...');
        
        // Usar rpc para ejecutar SQL
        const { data, error } = await supabase.rpc('exec', { sql: statement.trim() });
        
        if (error) {
          console.error('❌ Error ejecutando SQL:', error);
          return false;
        }
      }
    }
    
    console.log('✅ SQL ejecutado correctamente');
    return true;
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
    return false;
  }
}

async function setupTriggers() {
  console.log('\n🚀 Iniciando configuración de triggers...\n');

  // 1. Eliminar triggers anteriores
  console.log('1️⃣ Eliminando triggers anteriores...');
  const cleanupSQL = `
    DROP TRIGGER IF EXISTS trigger_generate_executions ON activity_enrollments;
    DROP TRIGGER IF EXISTS trigger_update_progress ON ejecuciones_ejercicio;
    DROP TRIGGER IF EXISTS trigger_generate_executions_simple ON activity_enrollments;
    DROP FUNCTION IF EXISTS generate_exercise_executions_with_replicas();
    DROP FUNCTION IF EXISTS update_client_progress();
    DROP FUNCTION IF EXISTS generate_exercise_executions_simple()
  `;
  
  await executeSQL(cleanupSQL);

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
  
  await executeSQL(createFunctionSQL);

  // 3. Crear trigger
  console.log('\n3️⃣ Creando trigger...');
  const createTriggerSQL = `
    CREATE TRIGGER trigger_generate_executions_simple
      AFTER INSERT ON activity_enrollments
      FOR EACH ROW
      EXECUTE FUNCTION generate_exercise_executions_simple()
  `;
  
  await executeSQL(createTriggerSQL);

  // 4. Verificar instalación
  console.log('\n4️⃣ Verificando instalación...');
  const verifySQL = `
    SELECT 
      'TRIGGER INSTALADO' as seccion,
      trigger_name,
      event_manipulation
    FROM information_schema.triggers 
    WHERE trigger_name = 'trigger_generate_executions_simple'
  `;
  
  await executeSQL(verifySQL);

  console.log('\n✅ Configuración de triggers completada!');
  console.log('\n🧪 Para probar:');
  console.log('1. Intenta comprar una actividad');
  console.log('2. Verifica que se generen ejecuciones en ejecuciones_ejercicio');
  console.log('3. Revisa los logs en la consola de Supabase');
}

// Ejecutar configuración
setupTriggers().catch(console.error);






