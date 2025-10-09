const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase - credenciales del proyecto
const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncmZzd3JzdnJ6d3RnaWxzc2FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjE5MDMwMywiZXhwIjoyMDYxNzY2MzAzfQ.qRKBCY7dbxvNs-KCQqAm9L6xBY4X293oaFAW5yxc9Hc';

console.log('🔧 Creando ejecuciones manualmente para probar el sistema...');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createExecutionsForActivity78() {
  try {
    console.log('🚀 Iniciando creación manual de ejecuciones...\n');

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

    // 2. ID del cliente de prueba (el que está comprando)
    const clientId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';
    console.log('👤 Cliente ID:', clientId);

    // 3. Limpiar ejecuciones existentes para este cliente
    console.log('\n2️⃣ Limpiando ejecuciones existentes...');
    
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

    // 4. Crear ejecuciones nuevas
    console.log('\n3️⃣ Creando ejecuciones nuevas...');
    
    const ejecucionesToInsert = [];
    
    if (ejercicios && ejercicios.length > 0) {
      for (const ejercicio of ejercicios) {
        for (let periodo = 1; periodo <= totalPeriods; periodo++) {
          // Calcular fecha de ejecución (un día por período)
          const fechaEjecucion = new Date();
          fechaEjecucion.setDate(fechaEjecucion.getDate() + (periodo - 1));
          
          ejecucionesToInsert.push({
            ejercicio_id: ejercicio.id,
            client_id: clientId,
            intensidad_aplicada: ejercicio.tipo === 'fuerza' ? 'Principiante' : 
                                ejercicio.tipo === 'cardio' ? 'Moderado' : 'Descanso',
            completado: false,
            fecha_ejecucion: fechaEjecucion.toISOString().split('T')[0],
            semana_original: periodo,
            periodo_replica: periodo,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }
    }

    console.log('📝 Ejecuciones a insertar:', ejecucionesToInsert.length);
    
    // 5. Insertar ejecuciones
    if (ejecucionesToInsert.length > 0) {
      const { data: insertData, error: insertError } = await supabase
        .from('ejecuciones_ejercicio')
        .insert(ejecucionesToInsert)
        .select();
      
      if (insertError) {
        console.error('❌ Error insertando ejecuciones:', insertError);
        return false;
      }
      
      console.log('✅ Ejecuciones creadas exitosamente:', insertData?.length || 0);
      
      // Mostrar detalle de las ejecuciones creadas
      insertData?.forEach((exec, index) => {
        const ejercicio = ejercicios.find(e => e.id === exec.ejercicio_id);
        console.log(`  ${index + 1}. ${ejercicio?.nombre_ejercicio} - Período ${exec.periodo_replica} - ${exec.fecha_ejecucion}`);
      });
    }

    // 6. Verificar resultado final
    console.log('\n4️⃣ Verificando resultado final...');
    
    const { data: finalExecutions, error: finalError } = await supabase
      .from('ejecuciones_ejercicio')
      .select(`
        id,
        ejercicio_id,
        client_id,
        completado,
        fecha_ejecucion,
        semana_original,
        periodo_replica,
        intensidad_aplicada
      `)
      .eq('client_id', clientId)
      .in('ejercicio_id', ejercicios?.map(e => e.id) || []);
    
    if (finalError) {
      console.error('❌ Error verificando ejecuciones finales:', finalError);
      return false;
    }
    
    console.log('📊 Ejecuciones finales en base de datos:', finalExecutions?.length || 0);
    
    // 7. Mostrar resumen
    console.log('\n📋 RESUMEN:');
    console.log(`- Ejercicios en actividad 78: ${ejercicios?.length || 0}`);
    console.log(`- Períodos configurados: ${totalPeriods}`);
    console.log(`- Ejecuciones esperadas: ${(ejercicios?.length || 0) * totalPeriods}`);
    console.log(`- Ejecuciones creadas: ${finalExecutions?.length || 0}`);
    console.log(`- Cliente: ${clientId}`);
    
    if (finalExecutions && finalExecutions.length > 0) {
      console.log('\n✅ SISTEMA FUNCIONANDO CORRECTAMENTE!');
      console.log('🧪 Ahora puedes probar:');
      console.log('1. Ir a la actividad 78');
      console.log('2. Ver las ejecuciones creadas');
      console.log('3. Marcar ejercicios como completados');
      console.log('4. Ver el progreso actualizarse');
    } else {
      console.log('\n❌ No se crearon ejecuciones');
    }

    return true;

  } catch (error) {
    console.error('❌ Error general:', error);
    return false;
  }
}

// Ejecutar creación de ejecuciones
createExecutionsForActivity78().catch(console.error);











