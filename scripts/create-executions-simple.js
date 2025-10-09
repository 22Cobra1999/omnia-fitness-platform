const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncmZzd3JzdnJ6d3RnaWxzc2FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjE5MDMwMywiZXhwIjoyMDYxNzY2MzAzfQ.qRKBCY7dbxvNs-KCQqAm9L6xBY4X293oaFAW5yxc9Hc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSimpleExecutions() {
  try {
    console.log('🔧 Creando ejecuciones simples...\n');

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

    const { data: periodos, error: periodosError } = await supabase
      .from('periodos')
      .select('cantidad_periodos')
      .eq('actividad_id', 78);
    
    if (periodosError) {
      console.error('❌ Error obteniendo períodos:', periodosError);
      return false;
    }
    
    const totalPeriods = periodos?.[0]?.cantidad_periodos || 1;
    console.log('🔄 Períodos configurados:', totalPeriods);

    // 2. ID del cliente
    const clientId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';
    console.log('👤 Cliente ID:', clientId);

    // 3. Crear ejecuciones con estructura mínima
    console.log('\n2️⃣ Creando ejecuciones con estructura mínima...');
    
    const ejecucionesToInsert = [];
    
    if (ejercicios && ejercicios.length > 0) {
      for (const ejercicio of ejercicios) {
        for (let periodo = 1; periodo <= totalPeriods; periodo++) {
          ejecucionesToInsert.push({
            ejercicio_id: ejercicio.id,
            client_id: clientId,
            completado: false,
            intensidad_aplicada: ejercicio.tipo === 'fuerza' ? 'Principiante' : 
                                ejercicio.tipo === 'cardio' ? 'Moderado' : 'Descanso'
          });
        }
      }
    }

    console.log('📝 Ejecuciones a insertar:', ejecucionesToInsert.length);

    // 4. Intentar insertar con estructura mínima
    if (ejecucionesToInsert.length > 0) {
      console.log('\n3️⃣ Insertando ejecuciones...');
      
      const { data: insertData, error: insertError } = await supabase
        .from('ejecuciones_ejercicio')
        .insert(ejecucionesToInsert)
        .select();
      
      if (insertError) {
        console.error('❌ Error insertando ejecuciones:', insertError);
        
        // Intentar insertar una por una para ver cuál es el problema
        console.log('\n4️⃣ Intentando insertar una por una...');
        
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
        console.log(`  ${index + 1}. ${ejercicio?.nombre_ejercicio} - Completado: ${exec.completado}`);
      });
    }

    // 5. Verificar resultado
    console.log('\n4️⃣ Verificando resultado...');
    
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
      console.log('✅ SISTEMA FUNCIONANDO!');
      console.log('\n📋 RESUMEN:');
      console.log(`- Ejercicios: ${ejercicios?.length || 0}`);
      console.log(`- Períodos: ${totalPeriods}`);
      console.log(`- Ejecuciones creadas: ${finalExecutions.length}`);
      console.log(`- Cliente: ${clientId}`);
      
      console.log('\n🧪 Ahora puedes:');
      console.log('1. Ir a la actividad 78 en la app');
      console.log('2. Ver las ejecuciones creadas');
      console.log('3. Marcar ejercicios como completados');
      console.log('4. Ver el progreso actualizarse');
    }

    return true;

  } catch (error) {
    console.error('❌ Error general:', error);
    return false;
  }
}

// Ejecutar creación
createSimpleExecutions().catch(console.error);











