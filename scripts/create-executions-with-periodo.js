const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncmZzd3JzdnJ6d3RnaWxzc2FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjE5MDMwMywiZXhwIjoyMDYxNzY2MzAzfQ.qRKBCY7dbxvNs-KCQqAm9L6xBY4X293oaFAW5yxc9Hc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createExecutionsWithPeriodo() {
  try {
    console.log('🔧 Creando ejecuciones con periodo_id correcto...\n');

    // 1. Obtener datos de actividad 78
    console.log('1️⃣ Obteniendo datos de actividad 78...');
    
    const { data: ejercicios, error: ejerciciosError } = await supabase
      .from('ejercicios_detalles')
      .select('id, nombre_ejercicio, tipo')
      .eq('activity_id', 78);
    
    if (ejerciciosError) {
      console.error('❌ Error obteniendo ejercicios:', ejerciciosError);
      return false;
    }
    
    console.log('📋 Ejercicios encontrados:', ejercicios?.length || 0);
    ejercicios?.forEach(ej => console.log(`  - ${ej.nombre_ejercicio} (${ej.tipo}) - ID: ${ej.id}`));

    // 2. Obtener períodos para actividad 78
    console.log('\n2️⃣ Obteniendo períodos para actividad 78...');
    
    const { data: periodos, error: periodosError } = await supabase
      .from('periodos')
      .select('id, cantidad_periodos')
      .eq('actividad_id', 78);
    
    if (periodosError) {
      console.error('❌ Error obteniendo períodos:', periodosError);
      return false;
    }
    
    console.log('🔄 Períodos encontrados:', periodos?.length || 0);
    periodos?.forEach(per => console.log(`  - ID: ${per.id}, Cantidad: ${per.cantidad_periodos}`));

    // 3. ID del cliente
    const clientId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';
    console.log('\n👤 Cliente ID:', clientId);

    // 4. Crear ejecuciones con periodo_id correcto
    console.log('\n3️⃣ Creando ejecuciones con periodo_id...');
    
    const ejecucionesToInsert = [];
    
    if (ejercicios && ejercicios.length > 0 && periodos && periodos.length > 0) {
      const periodo = periodos[0]; // Usar el primer período
      const cantidadPeriodos = periodo.cantidad_periodos;
      
      for (const ejercicio of ejercicios) {
        for (let i = 1; i <= cantidadPeriodos; i++) {
          ejecucionesToInsert.push({
            ejercicio_id: ejercicio.id,
            client_id: clientId,
            periodo_id: periodo.id, // Usar el ID del período
            completado: false,
            intensidad_aplicada: ejercicio.tipo === 'fuerza' ? 'Principiante' : 
                                ejercicio.tipo === 'cardio' ? 'Moderado' : 'Descanso'
          });
        }
      }
    }

    console.log('📝 Ejecuciones a insertar:', ejecucionesToInsert.length);

    // 5. Limpiar ejecuciones existentes
    console.log('\n4️⃣ Limpiando ejecuciones existentes...');
    
    const { error: deleteError } = await supabase
      .from('ejecuciones_ejercicio')
      .delete()
      .eq('client_id', clientId)
      .in('ejercicio_id', ejercicios?.map(e => e.id) || []);
    
    if (deleteError) {
      console.log('⚠️ Error eliminando ejecuciones existentes:', deleteError);
    } else {
      console.log('✅ Ejecuciones existentes eliminadas');
    }

    // 6. Insertar ejecuciones
    if (ejecucionesToInsert.length > 0) {
      console.log('\n5️⃣ Insertando ejecuciones...');
      
      const { data: insertData, error: insertError } = await supabase
        .from('ejecuciones_ejercicio')
        .insert(ejecucionesToInsert)
        .select();
      
      if (insertError) {
        console.error('❌ Error insertando ejecuciones:', insertError);
        
        // Intentar insertar una por una
        console.log('\n6️⃣ Intentando insertar una por una...');
        
        for (let i = 0; i < ejecucionesToInsert.length; i++) {
          const ejecucion = ejecucionesToInsert[i];
          console.log(`Probando ejecución ${i + 1}:`, ejecucion);
          
          const { data: singleInsert, error: singleError } = await supabase
            .from('ejecuciones_ejercicio')
            .insert([ejecucion])
            .select();
          
          if (singleError) {
            console.error(`❌ Error en ejecución ${i + 1}:`, singleError);
          } else {
            console.log(`✅ Ejecución ${i + 1} insertada:`, singleInsert);
          }
        }
        
        return false;
      }
      
      console.log('✅ Todas las ejecuciones creadas exitosamente:', insertData?.length || 0);
      
      // Mostrar detalle
      insertData?.forEach((exec, index) => {
        const ejercicio = ejercicios.find(e => e.id === exec.ejercicio_id);
        console.log(`  ${index + 1}. ${ejercicio?.nombre_ejercicio} - Periodo: ${exec.periodo_id} - Completado: ${exec.completado}`);
      });
    }

    // 7. Verificar resultado final
    console.log('\n6️⃣ Verificando resultado final...');
    
    const { data: finalExecutions, error: finalError } = await supabase
      .from('ejecuciones_ejercicio')
      .select('*')
      .eq('client_id', clientId);
    
    if (finalError) {
      console.error('❌ Error verificando ejecuciones:', finalError);
      return false;
    }
    
    console.log('📊 Ejecuciones finales:', finalExecutions?.length || 0);
    
    if (finalExecutions && finalExecutions.length > 0) {
      console.log('\n✅ SISTEMA FUNCIONANDO CORRECTAMENTE!');
      console.log('\n📋 RESUMEN:');
      console.log(`- Ejercicios: ${ejercicios?.length || 0}`);
      console.log(`- Períodos: ${periodos?.[0]?.cantidad_periodos || 0}`);
      console.log(`- Ejecuciones creadas: ${finalExecutions.length}`);
      console.log(`- Cliente: ${clientId}`);
      
      console.log('\n🧪 Ahora puedes:');
      console.log('1. Ir a la actividad 78 en la app');
      console.log('2. Ver las ejecuciones creadas');
      console.log('3. Marcar ejercicios como completados');
      console.log('4. Ver el progreso actualizarse automáticamente');
      
      // Mostrar algunas ejecuciones de ejemplo
      console.log('\n📋 Ejecuciones creadas:');
      finalExecutions.slice(0, 5).forEach((exec, index) => {
        const ejercicio = ejercicios.find(e => e.id === exec.ejercicio_id);
        console.log(`  ${index + 1}. ${ejercicio?.nombre_ejercicio} - ID: ${exec.id} - Completado: ${exec.completado}`);
      });
      
      if (finalExecutions.length > 5) {
        console.log(`  ... y ${finalExecutions.length - 5} más`);
      }
    }

    return true;

  } catch (error) {
    console.error('❌ Error general:', error);
    return false;
  }
}

// Ejecutar creación
createExecutionsWithPeriodo().catch(console.error);






