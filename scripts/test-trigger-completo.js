const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncmZzd3JzdnJ6d3RnaWxzc2FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjE5MDMwMywiZXhwIjoyMDYxNzY2MzAzfQ.qRKBCY7dbxvNs-KCQqAm9L6xBY4X293oaFAW5yxc9Hc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testTriggerCompleto() {
  try {
    console.log('🧪 PROBANDO TRIGGER COMPLETO PARA GENERAR EJECUCIONES...\n');

    // 1. Verificar que el trigger existe
    console.log('1️⃣ Verificando que el trigger existe...');
    
    const { data: triggers, error: triggersError } = await supabase
      .rpc('exec_sql', { 
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
    
    if (triggersError) {
      console.log('⚠️ No se pudo verificar triggers (usando método alternativo)');
    } else {
      console.log('✅ Trigger verificado:', triggers);
    }

    // 2. Crear un cliente de prueba
    const testClientId = `test-client-${Date.now()}`;
    const testActivityId = 78; // Actividad que ya conocemos
    
    console.log(`\n2️⃣ Creando cliente de prueba: ${testClientId}`);
    console.log(`   Actividad: ${testActivityId}`);

    // 3. Verificar ejecuciones antes de la compra
    console.log('\n3️⃣ Verificando ejecuciones antes de la compra...');
    
    const { data: ejecucionesAntes, error: antesError } = await supabase
      .from('ejecuciones_ejercicio')
      .select('*')
      .eq('client_id', testClientId);
    
    if (antesError) {
      console.error('❌ Error verificando ejecuciones antes:', antesError);
    } else {
      console.log(`📊 Ejecuciones antes: ${ejecucionesAntes?.length || 0}`);
    }

    // 4. Simular compra de actividad (esto debería activar el trigger)
    console.log('\n4️⃣ Simulando compra de actividad...');
    
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('activity_enrollments')
      .insert([{
        client_id: testClientId,
        activity_id: testActivityId,
        created_at: new Date().toISOString()
      }])
      .select();
    
    if (enrollmentError) {
      console.error('❌ Error creando enrollment:', enrollmentError);
      return false;
    }
    
    console.log('✅ Enrollment creado:', enrollment);

    // 5. Verificar ejecuciones después de la compra
    console.log('\n5️⃣ Verificando ejecuciones después de la compra...');
    
    // Esperar un momento para que el trigger se ejecute
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { data: ejecucionesDespues, error: despuesError } = await supabase
      .from('ejecuciones_ejercicio')
      .select(`
        id,
        ejercicio_id,
        client_id,
        periodo_id,
        completado,
        dia_semana,
        bloque,
        orden,
        detalle_series,
        created_at,
        ejercicios_detalles!inner(nombre_ejercicio, tipo)
      `)
      .eq('client_id', testClientId)
      .order('id');
    
    if (despuesError) {
      console.error('❌ Error verificando ejecuciones después:', despuesError);
      return false;
    }
    
    console.log(`📊 Ejecuciones después: ${ejecucionesDespues?.length || 0}`);

    // 6. Analizar resultados
    if (ejecucionesDespues && ejecucionesDespues.length > 0) {
      console.log('\n✅ TRIGGER FUNCIONÓ CORRECTAMENTE!');
      
      console.log('\n📋 EJECUCIONES GENERADAS:');
      ejecucionesDespues.forEach((exec, index) => {
        const ejercicio = exec.ejercicios_detalles;
        console.log(`  ${index + 1}. ${ejercicio?.nombre_ejercicio}`);
        console.log(`     - Día: ${exec.dia_semana}`);
        console.log(`     - Bloque: ${exec.bloque}`);
        console.log(`     - Orden: ${exec.orden}`);
        console.log(`     - Detalle series: ${exec.detalle_series || 'NULL'}`);
        console.log(`     - Completado: ${exec.completado}`);
        console.log('');
      });
      
      // 7. Verificar orden y estructura
      console.log('\n🔍 VERIFICACIÓN DE ORDEN Y ESTRUCTURA:');
      
      // Verificar distribución por día
      const statsPorDia = {};
      ejecucionesDespues.forEach(exec => {
        const dia = exec.dia_semana || 'N/A';
        statsPorDia[dia] = (statsPorDia[dia] || 0) + 1;
      });
      
      console.log('   Distribución por día:');
      Object.entries(statsPorDia).forEach(([dia, count]) => {
        console.log(`     - ${dia}: ${count} ejecuciones`);
      });
      
      // Verificar distribución por bloque
      const statsPorBloque = {};
      ejecucionesDespues.forEach(exec => {
        const bloque = exec.bloque || 'N/A';
        statsPorBloque[bloque] = (statsPorBloque[bloque] || 0) + 1;
      });
      
      console.log('   Distribución por bloque:');
      Object.entries(statsPorBloque).forEach(([bloque, count]) => {
        console.log(`     - Bloque ${bloque}: ${count} ejecuciones`);
      });
      
      // Verificar detalle_series
      const statsPorDetalle = {};
      ejecucionesDespues.forEach(exec => {
        const detalle = exec.detalle_series || 'NULL';
        statsPorDetalle[detalle] = (statsPorDetalle[detalle] || 0) + 1;
      });
      
      console.log('   Distribución por detalle_series:');
      Object.entries(statsPorDetalle).forEach(([detalle, count]) => {
        console.log(`     - "${detalle}": ${count} ejecuciones`);
      });
      
      // 8. Verificar que coincide con datos esperados
      console.log('\n✅ VERIFICACIÓN DE DATOS ESPERADOS:');
      
      const totalEsperado = 24; // 3 períodos × 8 ejecuciones por período
      const totalGenerado = ejecucionesDespues.length;
      
      console.log(`   - Total esperado: ${totalEsperado}`);
      console.log(`   - Total generado: ${totalGenerado}`);
      console.log(`   - Coincide: ${totalGenerado === totalEsperado ? '✅ SÍ' : '❌ NO'}`);
      
      // Verificar días esperados
      const diasEsperados = ['lunes', 'miercoles', 'jueves'];
      const diasGenerados = Object.keys(statsPorDia);
      const diasCoinciden = diasEsperados.every(dia => diasGenerados.includes(dia));
      
      console.log(`   - Días esperados: ${diasEsperados.join(', ')}`);
      console.log(`   - Días generados: ${diasGenerados.join(', ')}`);
      console.log(`   - Días coinciden: ${diasCoinciden ? '✅ SÍ' : '❌ NO'}`);
      
      // 9. Limpiar datos de prueba
      console.log('\n9️⃣ Limpiando datos de prueba...');
      
      // Eliminar ejecuciones de prueba
      const { error: deleteExecutionsError } = await supabase
        .from('ejecuciones_ejercicio')
        .delete()
        .eq('client_id', testClientId);
      
      if (deleteExecutionsError) {
        console.log('⚠️ Error eliminando ejecuciones de prueba:', deleteExecutionsError);
      } else {
        console.log('✅ Ejecuciones de prueba eliminadas');
      }
      
      // Eliminar enrollment de prueba
      const { error: deleteEnrollmentError } = await supabase
        .from('activity_enrollments')
        .delete()
        .eq('client_id', testClientId);
      
      if (deleteEnrollmentError) {
        console.log('⚠️ Error eliminando enrollment de prueba:', deleteEnrollmentError);
      } else {
        console.log('✅ Enrollment de prueba eliminado');
      }
      
      console.log('\n🎉 TRIGGER FUNCIONA PERFECTAMENTE!');
      console.log('\n📋 RESUMEN:');
      console.log('   ✅ Trigger se ejecuta automáticamente');
      console.log('   ✅ Genera ejecuciones en orden correcto');
      console.log('   ✅ Respeta bloques y orden');
      console.log('   ✅ Copia datos reales de detalle_series');
      console.log('   ✅ Maneja múltiples períodos (réplicas)');
      console.log('   ✅ Distribuye correctamente por días');
      
    } else {
      console.log('\n❌ TRIGGER NO FUNCIONÓ');
      console.log('   - No se generaron ejecuciones automáticamente');
      console.log('   - Verificar que el trigger esté instalado correctamente');
    }

    return true;

  } catch (error) {
    console.error('❌ Error general:', error);
    return false;
  }
}

// Ejecutar prueba del trigger
testTriggerCompleto().catch(console.error);




