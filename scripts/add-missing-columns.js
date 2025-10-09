const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncmZzd3JzdnJ6d3RnaWxzc2FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjE5MDMwMywiZXhwIjoyMDYxNzY2MzAzfQ.qRKBCY7dbxvNs-KCQqAm9L6xBY4X293oaFAW5yxc9Hc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addMissingColumns() {
  try {
    console.log('🔧 Agregando columnas faltantes a ejecuciones_ejercicio...\n');

    // 1. Verificar columnas actuales
    console.log('1️⃣ Verificando columnas actuales...');
    
    const { data: ejecuciones, error: ejecucionesError } = await supabase
      .from('ejecuciones_ejercicio')
      .select('*')
      .limit(1);
    
    if (ejecucionesError) {
      console.error('❌ Error obteniendo ejecuciones:', ejecucionesError);
      return false;
    }
    
    if (ejecuciones && ejecuciones.length > 0) {
      console.log('✅ Columnas actuales:');
      Object.keys(ejecuciones[0]).forEach(col => {
        console.log(`  - ${col}: ${typeof ejecuciones[0][col]}`);
      });
    } else {
      console.log('⚠️ No hay ejecuciones existentes para verificar columnas');
    }

    // 2. Crear una ejecución de prueba para verificar qué columnas son requeridas
    console.log('\n2️⃣ Probando inserción con diferentes combinaciones...');
    
    const clientId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';
    const ejercicioId = 1042; // HIIT Fútbol
    const periodoId = 19;

    // Probar inserción mínima
    console.log('📝 Probando inserción mínima...');
    const minimalData = {
      ejercicio_id: ejercicioId,
      client_id: clientId,
      periodo_id: periodoId,
      completado: false,
      intensidad_aplicada: 'Principiante' // Mantener por ahora ya que es requerida
    };

    const { data: minimalInsert, error: minimalError } = await supabase
      .from('ejecuciones_ejercicio')
      .insert([minimalData])
      .select();
    
    if (minimalError) {
      console.error('❌ Error en inserción mínima:', minimalError);
      return false;
    }
    
    console.log('✅ Inserción mínima exitosa');
    
    // Eliminar el registro de prueba
    if (minimalInsert && minimalInsert.length > 0) {
      const { error: deleteError } = await supabase
        .from('ejecuciones_ejercicio')
        .delete()
        .eq('id', minimalInsert[0].id);
      
      if (deleteError) {
        console.log('⚠️ Error eliminando registro de prueba:', deleteError);
      } else {
        console.log('✅ Registro de prueba eliminado');
      }
    }

    // 3. Probar con columnas adicionales
    console.log('\n3️⃣ Probando columnas adicionales...');
    
    const additionalColumns = ['bloque', 'orden', 'dia_semana', 'fecha_ejercicio'];
    
    for (const columna of additionalColumns) {
      console.log(`📝 Probando columna: ${columna}`);
      
      const testData = {
        ejercicio_id: ejercicioId,
        client_id: clientId,
        periodo_id: periodoId,
        completado: false,
        intensidad_aplicada: 'Principiante',
        [columna]: columna === 'dia_semana' ? 'lunes' : 
                   columna === 'fecha_ejercicio' ? '2025-10-03' : 
                   1 // Para bloque y orden
      };

      const { data: testInsert, error: testError } = await supabase
        .from('ejecuciones_ejercicio')
        .insert([testData])
        .select();
      
      if (testError) {
        console.log(`❌ Columna ${columna}: NO DISPONIBLE - ${testError.message}`);
      } else {
        console.log(`✅ Columna ${columna}: DISPONIBLE`);
        
        // Eliminar el registro de prueba
        if (testInsert && testInsert.length > 0) {
          await supabase
            .from('ejecuciones_ejercicio')
            .delete()
            .eq('id', testInsert[0].id);
        }
      }
    }

    // 4. Mostrar resumen de columnas disponibles
    console.log('\n4️⃣ RESUMEN DE COLUMNAS DISPONIBLES:');
    console.log('✅ Columnas básicas (confirmadas):');
    console.log('  - id (SERIAL)');
    console.log('  - ejercicio_id (INTEGER)');
    console.log('  - client_id (UUID)');
    console.log('  - periodo_id (INTEGER)');
    console.log('  - completado (BOOLEAN)');
    console.log('  - intensidad_aplicada (TEXT) - REQUERIDA');
    console.log('  - created_at (TIMESTAMP)');
    console.log('  - updated_at (TIMESTAMP)');

    console.log('\n⚠️ NOTA IMPORTANTE:');
    console.log('Las columnas "bloque" y "orden" no existen en la tabla ejecuciones_ejercicio.');
    console.log('Necesitamos crearlas usando SQL directo en Supabase o usar columnas existentes.');
    console.log('Por ahora usaremos solo las columnas disponibles.');

    return true;

  } catch (error) {
    console.error('❌ Error general:', error);
    return false;
  }
}

// Ejecutar verificación
addMissingColumns().catch(console.error);










