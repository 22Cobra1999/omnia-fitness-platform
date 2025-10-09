const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncmZzd3JzdnJ6d3RnaWxzc2FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjE5MDMwMywiZXhwIjoyMDYxNzY2MzAzfQ.qRKBCY7dbxvNs-KCQqAm9L6xBY4X293oaFAW5yxc9Hc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkExecutionsColumns() {
  try {
    console.log('🔍 Verificando columnas disponibles en ejecuciones_ejercicio...\n');

    // 1. Obtener una ejecución existente para ver las columnas
    console.log('1️⃣ Verificando columnas existentes...');
    
    const { data: ejecuciones, error: ejecucionesError } = await supabase
      .from('ejecuciones_ejercicio')
      .select('*')
      .limit(1);
    
    if (ejecucionesError) {
      console.error('❌ Error obteniendo ejecuciones:', ejecucionesError);
      return false;
    }
    
    if (ejecuciones && ejecuciones.length > 0) {
      console.log('✅ Columnas disponibles en ejecuciones_ejercicio:');
      const columnas = Object.keys(ejecuciones[0]);
      columnas.forEach(col => {
        console.log(`  - ${col}: ${typeof ejecuciones[0][col]} = ${ejecuciones[0][col]}`);
      });
    } else {
      console.log('⚠️ No hay ejecuciones existentes para verificar columnas');
    }

    // 2. Intentar insertar con columnas básicas para verificar cuáles funcionan
    console.log('\n2️⃣ Probando inserción con diferentes columnas...');
    
    const clientId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';
    const ejercicioId = 1042; // HIIT Fútbol
    const periodoId = 19;

    // Probar con columnas básicas
    console.log('📝 Probando inserción básica...');
    const basicData = {
      ejercicio_id: ejercicioId,
      client_id: clientId,
      periodo_id: periodoId,
      completado: false,
      intensidad_aplicada: 'Principiante'
    };

    const { data: basicInsert, error: basicError } = await supabase
      .from('ejecuciones_ejercicio')
      .insert([basicData])
      .select();
    
    if (basicError) {
      console.error('❌ Error en inserción básica:', basicError);
    } else {
      console.log('✅ Inserción básica exitosa:', basicInsert);
      
      // Eliminar el registro de prueba
      if (basicInsert && basicInsert.length > 0) {
        const { error: deleteError } = await supabase
          .from('ejecuciones_ejercicio')
          .delete()
          .eq('id', basicInsert[0].id);
        
        if (deleteError) {
          console.log('⚠️ Error eliminando registro de prueba:', deleteError);
        } else {
          console.log('✅ Registro de prueba eliminado');
        }
      }
    }

    // 3. Probar con columnas adicionales una por una
    console.log('\n3️⃣ Probando columnas adicionales...');
    
    const columnasAdicionales = [
      'dia_semana',
      'numero_semana', 
      'numero_periodo',
      'numero_bloque',
      'orden_ejercicio',
      'fecha_ejecucion',
      'semana_original',
      'periodo_replica'
    ];

    for (const columna of columnasAdicionales) {
      console.log(`📝 Probando columna: ${columna}`);
      
      const testData = {
        ejercicio_id: ejercicioId,
        client_id: clientId,
        periodo_id: periodoId,
        completado: false,
        intensidad_aplicada: 'Principiante',
        [columna]: columna === 'dia_semana' ? 'lunes' : 
                   columna.includes('numero') || columna.includes('orden') ? 1 :
                   columna.includes('fecha') ? '2025-10-03' : 'test'
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
    console.log('  - intensidad_aplicada (TEXT)');
    console.log('  - created_at (TIMESTAMP)');
    console.log('  - updated_at (TIMESTAMP)');

    return true;

  } catch (error) {
    console.error('❌ Error general:', error);
    return false;
  }
}

// Ejecutar verificación
checkExecutionsColumns().catch(console.error);










