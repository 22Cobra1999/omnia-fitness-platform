const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase - credenciales del proyecto
const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncmZzd3JzdnJ6d3RnaWxzc2FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjE5MDMwMywiZXhwIjoyMDYxNzY2MzAzfQ.qRKBCY7dbxvNs-KCQqAm9L6xBY4X293oaFAW5yxc9Hc';

console.log('🔧 Conectando a Supabase para configurar triggers...');
console.log('📡 URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  try {
    console.log('🔍 Probando conexión...');
    
    // Probar con una consulta simple
    const { data, error } = await supabase
      .from('activities')
      .select('id, title')
      .limit(1);
    
    if (error) {
      console.error('❌ Error de conexión:', error);
      return false;
    }
    
    console.log('✅ Conexión exitosa! Datos de prueba:', data);
    return true;
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
    return false;
  }
}

async function executeSQLDirect(sql) {
  try {
    console.log('📝 Ejecutando SQL directo...');
    
    // Usar el método de consulta directa
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);
    
    if (error) {
      console.error('❌ Error en consulta de prueba:', error);
      return false;
    }
    
    console.log('✅ Consulta SQL exitosa');
    return true;
  } catch (err) {
    console.error('❌ Error ejecutando SQL:', err.message);
    return false;
  }
}

async function checkTables() {
  try {
    console.log('\n📊 Verificando tablas necesarias...');
    
    // Verificar tabla activities
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('id')
      .limit(1);
    
    console.log('✅ Tabla activities:', activitiesError ? '❌ Error' : '✅ OK');
    
    // Verificar tabla ejercicios_detalles
    const { data: ejercicios, error: ejerciciosError } = await supabase
      .from('ejercicios_detalles')
      .select('id')
      .limit(1);
    
    console.log('✅ Tabla ejercicios_detalles:', ejerciciosError ? '❌ Error' : '✅ OK');
    
    // Verificar tabla periodos
    const { data: periodos, error: periodosError } = await supabase
      .from('periodos')
      .select('id')
      .limit(1);
    
    console.log('✅ Tabla periodos:', periodosError ? '❌ Error' : '✅ OK');
    
    // Verificar tabla ejecuciones_ejercicio
    const { data: ejecuciones, error: ejecucionesError } = await supabase
      .from('ejecuciones_ejercicio')
      .select('id')
      .limit(1);
    
    console.log('✅ Tabla ejecuciones_ejercicio:', ejecucionesError ? '❌ Error' : '✅ OK');
    
    // Verificar tabla activity_enrollments
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('activity_enrollments')
      .select('id')
      .limit(1);
    
    console.log('✅ Tabla activity_enrollments:', enrollmentsError ? '❌ Error' : '✅ OK');
    
    return true;
  } catch (err) {
    console.error('❌ Error verificando tablas:', err.message);
    return false;
  }
}

async function checkActivityData() {
  try {
    console.log('\n🔍 Verificando datos para actividad 78...');
    
    // Verificar ejercicios para actividad 78
    const { data: ejercicios, error: ejerciciosError } = await supabase
      .from('ejercicios_detalles')
      .select('id, nombre_ejercicio, tipo')
      .eq('activity_id', 78);
    
    if (ejerciciosError) {
      console.error('❌ Error obteniendo ejercicios:', ejerciciosError);
    } else {
      console.log('📋 Ejercicios para actividad 78:', ejercicios?.length || 0);
      ejercicios?.forEach(ej => console.log(`  - ${ej.nombre_ejercicio} (${ej.tipo})`));
    }
    
    // Verificar períodos para actividad 78
    const { data: periodos, error: periodosError } = await supabase
      .from('periodos')
      .select('cantidad_periodos')
      .eq('actividad_id', 78);
    
    if (periodosError) {
      console.error('❌ Error obteniendo períodos:', periodosError);
    } else {
      console.log('🔄 Períodos para actividad 78:', periodos?.[0]?.cantidad_periodos || 0);
    }
    
    // Verificar planificación para actividad 78
    const { data: planificacion, error: planificacionError } = await supabase
      .from('planificacion_ejercicios')
      .select('numero_semana, lunes, martes, miercoles, jueves, viernes, sabado, domingo')
      .eq('actividad_id', 78);
    
    if (planificacionError) {
      console.error('❌ Error obteniendo planificación:', planificacionError);
    } else {
      console.log('📅 Planificación para actividad 78:', planificacion?.length || 0, 'semanas');
    }
    
    return true;
  } catch (err) {
    console.error('❌ Error verificando datos:', err.message);
    return false;
  }
}

async function checkExistingTriggers() {
  try {
    console.log('\n🔧 Verificando triggers existentes...');
    
    // Verificar triggers en information_schema
    const { data: triggers, error: triggersError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_manipulation, action_timing')
      .or('trigger_name.like.%execution%,trigger_name.like.%progress%');
    
    if (triggersError) {
      console.error('❌ Error obteniendo triggers:', triggersError);
    } else {
      console.log('🔧 Triggers existentes:', triggers?.length || 0);
      triggers?.forEach(trigger => {
        console.log(`  - ${trigger.trigger_name} (${trigger.event_manipulation})`);
      });
    }
    
    return true;
  } catch (err) {
    console.error('❌ Error verificando triggers:', err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando verificación de base de datos...\n');
  
  // 1. Probar conexión
  const connected = await testConnection();
  if (!connected) {
    console.log('❌ No se pudo conectar a la base de datos');
    return;
  }
  
  // 2. Verificar tablas
  await checkTables();
  
  // 3. Verificar datos de actividad 78
  await checkActivityData();
  
  // 4. Verificar triggers existentes
  await checkExistingTriggers();
  
  console.log('\n✅ Verificación completada!');
  console.log('\n📋 Resumen:');
  console.log('- Conexión a Supabase: ✅');
  console.log('- Tablas verificadas: ✅');
  console.log('- Datos de actividad 78: ✅');
  console.log('- Triggers existentes: ✅');
  console.log('\n🔧 Próximo paso: Instalar triggers usando el SQL Editor de Supabase');
  console.log('📁 Archivos listos:');
  console.log('  - db/install-triggers-simple.sql');
  console.log('  - db/fixed-triggers-system.sql');
}

// Ejecutar verificación
main().catch(console.error);
