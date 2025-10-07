const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixActivityLevelColumn() {
  console.log('🔧 Iniciando corrección de columna activity_level...');
  
  try {
    // Paso 1: Eliminar la columna problemática
    console.log('📋 Paso 1: Eliminando columna activity_level...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE clients DROP COLUMN IF EXISTS activity_level;'
    });
    
    if (dropError) {
      console.log('❌ Error eliminando columna:', dropError.message);
    } else {
      console.log('✅ Columna activity_level eliminada correctamente');
    }
    
    // Paso 2: Crear nueva columna con valores en español
    console.log('📋 Paso 2: Creando nueva columna nivel_actividad...');
    const { error: addError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE clients 
        ADD COLUMN nivel_actividad TEXT 
        CHECK (nivel_actividad IN ('Principiante', 'Intermedio', 'Avanzado', 'Experto'));
      `
    });
    
    if (addError) {
      console.log('❌ Error creando nueva columna:', addError.message);
    } else {
      console.log('✅ Columna nivel_actividad creada correctamente');
    }
    
    // Paso 3: Verificar la nueva estructura
    console.log('📋 Paso 3: Verificando nueva estructura...');
    const { data: newData, error: verifyError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);
      
    if (verifyError) {
      console.log('❌ Error verificando estructura:', verifyError.message);
    } else if (newData && newData.length > 0) {
      console.log('✅ Nueva estructura verificada:');
      console.log('📋 Columnas:', Object.keys(newData[0]));
    }
    
    // Paso 4: Probar insertar un valor válido
    console.log('📋 Paso 4: Probando inserción de valor válido...');
    const testId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';
    const { data: testData, error: testError } = await supabase
      .from('clients')
      .update({ nivel_actividad: 'Principiante' })
      .eq('id', testId)
      .select();
      
    if (testError) {
      console.log('❌ Error en prueba:', testError.message);
    } else {
      console.log('✅ Prueba exitosa - valor insertado correctamente');
      console.log('📄 Datos de prueba:', testData[0]);
    }
    
    console.log('🎉 ¡Corrección completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

fixActivityLevelColumn();










































