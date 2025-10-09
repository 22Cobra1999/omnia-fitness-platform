const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Configurando triggers en Supabase...');
console.log('📡 URL:', supabaseUrl);
console.log('🔑 Service Key:', supabaseServiceKey ? '✅ Configurada' : '❌ No configurada');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno no configuradas');
  console.log('Variables necesarias:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQL(sql) {
  try {
    console.log('📝 Ejecutando SQL...');
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
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

async function setupTriggers() {
  console.log('\n🚀 Iniciando configuración de triggers...\n');

  // 1. Verificar estado actual
  console.log('1️⃣ Verificando estado actual...');
  const checkStatusSQL = `
    SELECT 
      'TRIGGERS EXISTENTES' as seccion,
      trigger_name,
      event_manipulation
    FROM information_schema.triggers 
    WHERE trigger_name LIKE '%execution%' OR trigger_name LIKE '%progress%'
    ORDER BY trigger_name;
  `;
  
  await executeSQL(checkStatusSQL);

  // 2. Eliminar triggers anteriores
  console.log('\n2️⃣ Eliminando triggers anteriores...');
  const cleanupSQL = `
    DROP TRIGGER IF EXISTS trigger_generate_executions ON activity_enrollments;
    DROP TRIGGER IF EXISTS trigger_update_progress ON ejecuciones_ejercicio;
    DROP TRIGGER IF EXISTS trigger_generate_executions_simple ON activity_enrollments;
    DROP FUNCTION IF EXISTS generate_exercise_executions_with_replicas();
    DROP FUNCTION IF EXISTS update_client_progress();
    DROP FUNCTION IF EXISTS generate_exercise_executions_simple();
  `;
  
  await executeSQL(cleanupSQL);

  // 3. Crear función simple para generar ejecuciones
  console.log('\n3️⃣ Creando función para generar ejecuciones...');
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION generate_exercise_executions_simple()
    RETURNS TRIGGER AS $$
    DECLARE
      exercise_record RECORD;
      total_periods INTEGER;
      execution_count INTEGER := 0;
      i INTEGER;
    BEGIN
      -- Solo procesar si el status es 'activa'
      IF NEW.status = 'activa' THEN
        
        -- Obtener cantidad de períodos
        SELECT cantidad_periodos INTO total_periods
        FROM periodos 
        WHERE actividad_id = NEW.activity_id
        LIMIT 1;
        
        IF total_periods IS NULL THEN
          total_periods := 1;
        END IF;
        
        -- Generar ejecuciones para cada ejercicio
        FOR exercise_record IN 
          SELECT id, tipo, activity_id
          FROM ejercicios_detalles 
          WHERE activity_id = NEW.activity_id
        LOOP
          
          -- Generar ejecuciones para cada período
          FOR i IN 1..total_periods LOOP
            
            -- Determinar intensidad por defecto
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
              
              -- Insertar ejecución
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
        
        -- Log de creación
        RAISE NOTICE '✅ Creadas % ejecuciones para cliente % en actividad %', 
          execution_count, NEW.client_id, NEW.activity_id;
      END IF;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `;
  
  await executeSQL(createFunctionSQL);

  // 4. Crear trigger
  console.log('\n4️⃣ Creando trigger...');
  const createTriggerSQL = `
    CREATE TRIGGER trigger_generate_executions_simple
      AFTER INSERT ON activity_enrollments
      FOR EACH ROW
      EXECUTE FUNCTION generate_exercise_executions_simple();
  `;
  
  await executeSQL(createTriggerSQL);

  // 5. Verificar instalación
  console.log('\n5️⃣ Verificando instalación...');
  const verifySQL = `
    SELECT 
      'TRIGGER INSTALADO' as seccion,
      trigger_name,
      event_manipulation
    FROM information_schema.triggers 
    WHERE trigger_name = 'trigger_generate_executions_simple';
  `;
  
  await executeSQL(verifySQL);

  // 6. Verificar datos de prueba
  console.log('\n6️⃣ Verificando datos para actividad 78...');
  const checkDataSQL = `
    SELECT 
      'DATOS ACTIVIDAD 78' as seccion,
      'ejercicios_detalles' as tabla,
      COUNT(*) as registros
    FROM ejercicios_detalles 
    WHERE activity_id = 78
    UNION ALL
    SELECT 
      'DATOS ACTIVIDAD 78',
      'planificacion_ejercicios',
      COUNT(*)
    FROM planificacion_ejercicios 
    WHERE actividad_id = 78
    UNION ALL
    SELECT 
      'DATOS ACTIVIDAD 78',
      'periodos',
      COUNT(*)
    FROM periodos 
    WHERE actividad_id = 78;
  `;
  
  await executeSQL(checkDataSQL);

  console.log('\n✅ Configuración de triggers completada!');
  console.log('\n🧪 Para probar:');
  console.log('1. Intenta comprar una actividad');
  console.log('2. Verifica que se generen ejecuciones en ejecuciones_ejercicio');
  console.log('3. Revisa los logs en la consola de Supabase');
}

// Ejecutar configuración
setupTriggers().catch(console.error);











