const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncmZzd3JzdnJ6d3RnaWxzc2FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjE5MDMwMywiZXhwIjoyMDYxNzY2MzAzfQ.qRKBCY7dbxvNs-KCQqAm9L6xBY4X293oaFAW5yxc9Hc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeExerciseOrder() {
  try {
    console.log('🔍 Analizando orden de ejercicios y réplicas para actividad 78...\n');

    // 1. Obtener planificación semanal
    console.log('1️⃣ Planificación semanal:');
    
    const { data: planificacion, error: planificacionError } = await supabase
      .from('planificacion_ejercicios')
      .select('numero_semana, lunes, martes, miercoles, jueves, viernes, sabado, domingo')
      .eq('actividad_id', 78)
      .order('numero_semana');
    
    if (planificacionError) {
      console.error('❌ Error obteniendo planificación:', planificacionError);
      return false;
    }
    
    console.log('📅 Semanas de planificación:', planificacion?.length || 0);
    
    // Mostrar planificación detallada
    planificacion?.forEach(semana => {
      console.log(`\n📅 SEMANA ${semana.numero_semana}:`);
      const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
      
      dias.forEach(dia => {
        const ejerciciosDia = semana[dia];
        if (ejerciciosDia && ejerciciosDia !== '[]' && ejerciciosDia !== 'null') {
          console.log(`  ${dia.toUpperCase()}: ${ejerciciosDia}`);
        } else {
          console.log(`  ${dia.toUpperCase()}: Sin ejercicios`);
        }
      });
    });

    // 2. Obtener ejercicios detallados
    console.log('\n2️⃣ Ejercicios detallados:');
    
    const { data: ejercicios, error: ejerciciosError } = await supabase
      .from('ejercicios_detalles')
      .select('id, nombre_ejercicio, tipo')
      .eq('activity_id', 78)
      .order('id');
    
    if (ejerciciosError) {
      console.error('❌ Error obteniendo ejercicios:', ejerciciosError);
      return false;
    }
    
    console.log('📋 Ejercicios disponibles:');
    ejercicios?.forEach(ej => {
      console.log(`  - ID: ${ej.id} | ${ej.nombre_ejercicio} (${ej.tipo})`);
    });

    // 3. Obtener períodos
    console.log('\n3️⃣ Períodos configurados:');
    
    const { data: periodos, error: periodosError } = await supabase
      .from('periodos')
      .select('id, cantidad_periodos')
      .eq('actividad_id', 78);
    
    if (periodosError) {
      console.error('❌ Error obteniendo períodos:', periodosError);
      return false;
    }
    
    periodos?.forEach(per => {
      console.log(`  - ID: ${per.id} | Cantidad: ${per.cantidad_periodos} períodos`);
    });

    // 4. Obtener ejecuciones actuales
    console.log('\n4️⃣ Ejecuciones actuales:');
    
    const { data: ejecuciones, error: ejecucionesError } = await supabase
      .from('ejecuciones_ejercicio')
      .select(`
        id,
        ejercicio_id,
        completado,
        intensidad_aplicada,
        created_at,
        semana_original,
        periodo_replica,
        ejercicios_detalles!inner(nombre_ejercicio, tipo)
      `)
      .eq('client_id', '00dedc23-0b17-4e50-b84e-b2e8100dc93c')
      .order('id');
    
    if (ejecucionesError) {
      console.error('❌ Error obteniendo ejecuciones:', ejecucionesError);
      return false;
    }
    
    console.log('🏃 Ejecuciones creadas:');
    ejecuciones?.forEach((exec, index) => {
      const ejercicio = exec.ejercicios_detalles;
      console.log(`  ${index + 1}. ${ejercicio?.nombre_ejercicio} - Semana: ${exec.semana_original || 'N/A'} - Período: ${exec.periodo_replica || 'N/A'} - Completado: ${exec.completado}`);
    });

    // 5. Análisis del orden correcto
    console.log('\n5️⃣ ANÁLISIS DEL ORDEN CORRECTO:');
    console.log('\n📋 Según la planificación semanal:');
    
    if (planificacion && planificacion.length > 0) {
      const totalPeriods = periodos?.[0]?.cantidad_periodos || 1;
      const totalSemanas = planificacion.length;
      
      console.log(`- Total de semanas: ${totalSemanas}`);
      console.log(`- Total de períodos (réplicas): ${totalPeriods}`);
      console.log(`- Ejercicios por semana: Variable según planificación`);
      
      console.log('\n🔄 Orden correcto de ejecuciones:');
      
      for (let periodo = 1; periodo <= totalPeriods; periodo++) {
        console.log(`\n📅 PERÍODO ${periodo} (Réplica ${periodo}):`);
        
        for (let semana = 1; semana <= totalSemanas; semana++) {
          const planSemana = planificacion.find(p => p.numero_semana === semana);
          if (planSemana) {
            console.log(`  Semana ${semana}:`);
            
            const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
            dias.forEach(dia => {
              const ejerciciosDia = planSemana[dia];
              if (ejerciciosDia && ejerciciosDia !== '[]' && ejerciciosDia !== 'null') {
                try {
                  const ejerciciosArray = JSON.parse(ejerciciosDia);
                  if (Array.isArray(ejerciciosArray)) {
                    ejerciciosArray.forEach(ej => {
                      const ejercicio = ejercicios.find(e => e.id === ej.id);
                      console.log(`    ${dia}: ${ejercicio?.nombre_ejercicio} (ID: ${ej.id})`);
                    });
                  }
                } catch (e) {
                  console.log(`    ${dia}: ${ejerciciosDia} (formato no JSON)`);
                }
              }
            });
          }
        }
      }
    }

    // 6. Comparar con ejecuciones actuales
    console.log('\n6️⃣ COMPARACIÓN CON EJECUCIONES ACTUALES:');
    
    if (ejecuciones && ejecuciones.length > 0) {
      console.log('\n❌ PROBLEMA DETECTADO:');
      console.log('Las ejecuciones actuales NO siguen el orden de la planificación semanal.');
      console.log('Se crearon ejecuciones simples sin considerar:');
      console.log('- Días de la semana');
      console.log('- Orden de ejercicios por día');
      console.log('- Bloques de ejercicios');
      console.log('- Fechas específicas de ejecución');
      
      console.log('\n✅ ORDEN CORRECTO DEBERÍA SER:');
      console.log('1. Por cada período (réplica)');
      console.log('2. Por cada semana de la planificación');
      console.log('3. Por cada día de la semana (lunes a domingo)');
      console.log('4. Por cada ejercicio en ese día');
      console.log('5. Con fecha_ejecucion calculada correctamente');
    }

    return true;

  } catch (error) {
    console.error('❌ Error general:', error);
    return false;
  }
}

// Ejecutar análisis
analyzeExerciseOrder().catch(console.error);




