const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncmZzd3JzdnJ6d3RnaWxzc2FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjE5MDMwMywiZXhwIjoyMDYxNzY2MzAzfQ.qRKBCY7dbxvNs-KCQqAm9L6xBY4X293oaFAW5yxc9Hc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyExecutions() {
  try {
    console.log('🔍 Verificando ejecuciones creadas...\n');

    const clientId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';

    // 1. Verificar ejecuciones creadas
    console.log('1️⃣ Verificando ejecuciones creadas...');
    
    const { data: finalExecutions, error: finalError } = await supabase
      .from('ejecuciones_ejercicio')
      .select(`
        id,
        ejercicio_id,
        completado,
        dia_semana,
        fecha_ejercicio,
        intensidad_aplicada,
        created_at,
        ejercicios_detalles!inner(nombre_ejercicio)
      `)
      .eq('client_id', clientId)
      .order('id');
    
    if (finalError) {
      console.error('❌ Error verificando ejecuciones:', finalError);
      return false;
    }
    
    console.log('📊 Ejecuciones encontradas:', finalExecutions?.length || 0);
    
    if (finalExecutions && finalExecutions.length > 0) {
      console.log('\n🎯 PRIMERAS 10 EJECUCIONES:');
      finalExecutions.slice(0, 10).forEach((exec, index) => {
        const ejercicio = exec.ejercicios_detalles;
        console.log(`  ${index + 1}. ${ejercicio?.nombre_ejercicio}`);
        console.log(`     - ID: ${exec.id}`);
        console.log(`     - Ejercicio ID: ${exec.ejercicio_id}`);
        console.log(`     - Día: ${exec.dia_semana || 'N/A'}`);
        console.log(`     - Fecha: ${exec.fecha_ejercicio || 'N/A'}`);
        console.log(`     - Intensidad: ${exec.intensidad_aplicada || 'N/A'}`);
        console.log(`     - Completado: ${exec.completado}`);
        console.log('');
      });
      
      if (finalExecutions.length > 10) {
        console.log(`  ... y ${finalExecutions.length - 10} más`);
      }
      
      // 2. Mostrar estadísticas por día
      console.log('\n📊 ESTADÍSTICAS POR DÍA:');
      const statsPorDia = {};
      finalExecutions.forEach(exec => {
        const dia = exec.dia_semana || 'N/A';
        statsPorDia[dia] = (statsPorDia[dia] || 0) + 1;
      });
      
      Object.entries(statsPorDia).forEach(([dia, count]) => {
        console.log(`  - ${dia}: ${count} ejecuciones`);
      });
      
      // 3. Mostrar estadísticas por fecha
      console.log('\n📅 ESTADÍSTICAS POR FECHA:');
      const statsPorFecha = {};
      finalExecutions.forEach(exec => {
        const fecha = exec.fecha_ejercicio || 'N/A';
        statsPorFecha[fecha] = (statsPorFecha[fecha] || 0) + 1;
      });
      
      Object.entries(statsPorFecha).sort().forEach(([fecha, count]) => {
        console.log(`  - ${fecha}: ${count} ejecuciones`);
      });
      
      // 4. Mostrar estadísticas por ejercicio
      console.log('\n🏃 ESTADÍSTICAS POR EJERCICIO:');
      const statsPorEjercicio = {};
      finalExecutions.forEach(exec => {
        const ejercicio = exec.ejercicios_detalles?.nombre_ejercicio || 'N/A';
        statsPorEjercicio[ejercicio] = (statsPorEjercicio[ejercicio] || 0) + 1;
      });
      
      Object.entries(statsPorEjercicio).forEach(([ejercicio, count]) => {
        console.log(`  - ${ejercicio}: ${count} ejecuciones`);
      });
      
      // 5. Mostrar estadísticas por intensidad
      console.log('\n💪 ESTADÍSTICAS POR INTENSIDAD:');
      const statsPorIntensidad = {};
      finalExecutions.forEach(exec => {
        const intensidad = exec.intensidad_aplicada || 'N/A';
        statsPorIntensidad[intensidad] = (statsPorIntensidad[intensidad] || 0) + 1;
      });
      
      Object.entries(statsPorIntensidad).forEach(([intensidad, count]) => {
        console.log(`  - ${intensidad}: ${count} ejecuciones`);
      });
      
      console.log('\n✅ VERIFICACIÓN COMPLETADA!');
      console.log('\n📋 RESUMEN:');
      console.log(`- Total ejecuciones: ${finalExecutions.length}`);
      console.log(`- Ejecuciones esperadas: 24`);
      console.log(`- Estado: ${finalExecutions.length === 24 ? '✅ CORRECTO' : '❌ INCORRECTO'}`);
      
      console.log('\n🧪 Para probar:');
      console.log('1. Ve a la actividad 78 en la aplicación');
      console.log('2. Verifica que aparezcan las 24 ejecuciones');
      console.log('3. Filtra por día de semana');
      console.log('4. Marca ejercicios como completados');
      console.log('5. Observa el progreso actualizarse');
      
      console.log('\n⚠️ NOTA:');
      console.log('Las columnas "bloque" y "orden" no están disponibles.');
      console.log('Para agregarlas, ejecuta el SQL en Supabase:');
      console.log('sql/add-columns-ejecuciones.sql');
    } else {
      console.log('❌ No se encontraron ejecuciones');
    }

    return true;

  } catch (error) {
    console.error('❌ Error general:', error);
    return false;
  }
}

// Ejecutar verificación
verifyExecutions().catch(console.error);










