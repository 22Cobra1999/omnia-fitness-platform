const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncmZzd3JzdnJ6d3RnaWxzc2FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjE5MDMwMywiZXhwIjoyMDYxNzY2MzAzfQ.qRKBCY7dbxvNs-KCQqAm9L6xBY4X293oaFAW5yxc9Hc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateTriggerFixed() {
  try {
    console.log('🔧 ACTUALIZANDO TRIGGER CON CORRECCIÓN...\n');

    // 1. Leer el SQL corregido
    const sqlPath = path.join(__dirname, '../sql/trigger-generate-ejecuciones-completo.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 SQL leído correctamente');
    console.log('📊 Tamaño del archivo:', sqlContent.length, 'caracteres');

    // 2. Dividir el SQL en comandos individuales
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📋 Comandos SQL encontrados: ${commands.length}`);

    // 3. Ejecutar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      if (command.toLowerCase().includes('drop') || 
          command.toLowerCase().includes('create') || 
          command.toLowerCase().includes('comment')) {
        
        console.log(`\n${i + 1}. Ejecutando comando:`);
        console.log(`   ${command.substring(0, 100)}${command.length > 100 ? '...' : ''}`);
        
        try {
          const { data, error } = await supabase.rpc('exec_sql', { sql: command + ';' });
          
          if (error) {
            console.log(`   ⚠️ Error: ${error.message}`);
            
            // Si es un error de que la función no existe, intentar con execute_sql
            if (error.message.includes('exec_sql')) {
              console.log('   🔄 Intentando con execute_sql...');
              const { data: data2, error: error2 } = await supabase.rpc('execute_sql', { sql: command + ';' });
              
              if (error2) {
                console.log(`   ❌ Error también con execute_sql: ${error2.message}`);
              } else {
                console.log('   ✅ Comando ejecutado con execute_sql');
              }
            }
          } else {
            console.log('   ✅ Comando ejecutado correctamente');
          }
        } catch (e) {
          console.log(`   ❌ Error ejecutando comando: ${e.message}`);
        }
      }
    }

    // 4. Verificar que el trigger se creó
    console.log('\n🔍 Verificando trigger...');
    
    try {
      const { data: triggers, error: triggerError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            trigger_name,
            event_manipulation,
            action_timing,
            action_statement
          FROM information_schema.triggers 
          WHERE trigger_name = 'trigger_generate_ejecuciones_ejercicio'
        `
      });
      
      if (triggerError) {
        console.log('⚠️ No se pudo verificar el trigger:', triggerError.message);
      } else {
        console.log('✅ Trigger verificado:', triggers);
      }
    } catch (e) {
      console.log('⚠️ Error verificando trigger:', e.message);
    }

    // 5. Probar el trigger con una compra de prueba
    console.log('\n🧪 Probando trigger con compra de prueba...');
    
    const testClientId = `test-client-${Date.now()}`;
    const testActivityId = 78;

    try {
      // Crear enrollment de prueba
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('activity_enrollments')
        .insert([{
          client_id: testClientId,
          activity_id: testActivityId,
          created_at: new Date().toISOString()
        }])
        .select();
      
      if (enrollmentError) {
        console.log('❌ Error creando enrollment de prueba:', enrollmentError.message);
      } else {
        console.log('✅ Enrollment de prueba creado:', enrollment);
        
        // Esperar un momento para que el trigger se ejecute
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verificar ejecuciones generadas
        const { data: executions, error: execError } = await supabase
          .from('ejecuciones_ejercicio')
          .select('*')
          .eq('client_id', testClientId);
        
        if (execError) {
          console.log('❌ Error verificando ejecuciones:', execError.message);
        } else {
          console.log(`✅ Ejecuciones generadas: ${executions?.length || 0}`);
          
          if (executions && executions.length > 0) {
            console.log('📊 Muestra de ejecuciones:');
            executions.slice(0, 3).forEach((exec, index) => {
              console.log(`   ${index + 1}. Ejercicio ${exec.ejercicio_id} - ${exec.dia_semana} - Bloque ${exec.bloque}`);
            });
          }
        }
        
        // Limpiar datos de prueba
        console.log('\n🧹 Limpiando datos de prueba...');
        
        await supabase
          .from('ejecuciones_ejercicio')
          .delete()
          .eq('client_id', testClientId);
        
        await supabase
          .from('activity_enrollments')
          .delete()
          .eq('client_id', testClientId);
        
        console.log('✅ Datos de prueba limpiados');
      }
    } catch (e) {
      console.log('❌ Error en prueba:', e.message);
    }

    console.log('\n🎉 ACTUALIZACIÓN DEL TRIGGER COMPLETADA!');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar actualización
updateTriggerFixed().catch(console.error);




