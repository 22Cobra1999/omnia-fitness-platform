const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncmZzd3JzdnJ6d3RnaWxzc2FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjE5MDMwMywiZXhwIjoyMDYxNzY2MzAzfQ.qRKBCY7dbxvNs-KCQqAm9L6xBY4X293oaFAW5yxc9Hc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkEjerciciosDetalleSeries() {
  try {
    console.log('🔍 VERIFICANDO DATOS REALES DE EJERCICIOS_DETALLES...\n');

    // 1. Verificar estructura completa de ejercicios_detalles
    console.log('1️⃣ Estructura completa de ejercicios_detalles:');
    
    const { data: ejercicios, error: ejerciciosError } = await supabase
      .from('ejercicios_detalles')
      .select('*')
      .eq('activity_id', 78)
      .order('id');
    
    if (ejerciciosError) {
      console.error('❌ Error obteniendo ejercicios:', ejerciciosError);
      return false;
    }
    
    if (ejercicios && ejercicios.length > 0) {
      console.log('✅ Columnas disponibles en ejercicios_detalles:');
      Object.keys(ejercicios[0]).forEach(col => {
        console.log(`   - ${col}: ${typeof ejercicios[0][col]}`);
      });
      
      console.log('\n📋 Datos reales de ejercicios_detalles para actividad 78:');
      ejercicios.forEach((ej, index) => {
        console.log(`\n${index + 1}. EJERCICIO ${ej.id}:`);
        console.log(`   - Nombre: ${ej.nombre_ejercicio}`);
        console.log(`   - Tipo: ${ej.tipo || 'N/A'}`);
        console.log(`   - Activity ID: ${ej.activity_id}`);
        
        // Mostrar detalle_series si existe
        if (ej.detalle_series) {
          console.log(`   - Detalle series: ${ej.detalle_series}`);
          try {
            const detalleParsed = JSON.parse(ej.detalle_series);
            console.log(`   - Detalle series (parsed): ${JSON.stringify(detalleParsed, null, 2)}`);
          } catch (e) {
            console.log(`   - Detalle series (no es JSON): ${ej.detalle_series}`);
          }
        } else {
          console.log(`   - Detalle series: NULL o vacío`);
        }
        
        // Mostrar todas las columnas
        console.log(`   - Todas las columnas:`);
        Object.entries(ej).forEach(([key, value]) => {
          if (key !== 'detalle_series') {
            console.log(`     ${key}: ${value}`);
          }
        });
      });
    } else {
      console.log('❌ No se encontraron ejercicios para la actividad 78');
    }

    // 2. Verificar si hay otros ejercicios con detalle_series
    console.log('\n\n2️⃣ Verificando otros ejercicios con detalle_series:');
    
    const { data: otrosEjercicios, error: otrosError } = await supabase
      .from('ejercicios_detalles')
      .select('id, nombre_ejercicio, detalle_series, activity_id')
      .not('detalle_series', 'is', null)
      .limit(10);
    
    if (otrosError) {
      console.error('❌ Error obteniendo otros ejercicios:', otrosError);
    } else {
      console.log(`📊 Ejercicios con detalle_series encontrados: ${otrosEjercicios?.length || 0}`);
      
      otrosEjercicios?.forEach((ej, index) => {
        console.log(`\n${index + 1}. Ejercicio ${ej.id} (Actividad ${ej.activity_id}):`);
        console.log(`   - Nombre: ${ej.nombre_ejercicio}`);
        console.log(`   - Detalle series: ${ej.detalle_series}`);
      });
    }

    return true;

  } catch (error) {
    console.error('❌ Error general:', error);
    return false;
  }
}

// Ejecutar verificación
checkEjerciciosDetalleSeries().catch(console.error);





