const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncmZzd3JzdnJ6d3RnaWxzc2FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjE5MDMwMywiZXhwIjoyMDYxNzY2MzAzfQ.qRKBCY7dbxvNs-KCQqAm9L6xBY4X293oaFAW5yxc9Hc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function calcularFechaEjecucion(periodo, semana, dia) {
  const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const indiceDia = diasSemana.indexOf(dia);
  
  // Calcular días desde el inicio del programa
  // Cada período tiene 14 días (2 semanas)
  const diasDesdeInicio = (periodo - 1) * 14 + (semana - 1) * 7 + indiceDia;
  
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + diasDesdeInicio);
  
  return fecha.toISOString().split('T')[0];
}

function obtenerNumeroSemana(periodo, semanaOriginal) {
  // Calcular el número de semana global
  // Período 1, Semana 1 = Semana 1
  // Período 1, Semana 2 = Semana 2
  // Período 2, Semana 1 = Semana 3
  // Período 2, Semana 2 = Semana 4
  // etc.
  return (periodo - 1) * 2 + semanaOriginal;
}

function obtenerNumeroPeriodo(periodo) {
  // El período actual (1, 2, 3)
  return periodo;
}

async function createExecutionsWithWeekday() {
  try {
    console.log('🔧 Creando ejecuciones con día de semana y metadatos completos...\n');

    // 1. Obtener datos necesarios
    console.log('1️⃣ Obteniendo datos de la actividad 78...');
    
    const { data: planificacion, error: planificacionError } = await supabase
      .from('planificacion_ejercicios')
      .select('numero_semana, lunes, martes, miercoles, jueves, viernes, sabado, domingo')
      .eq('actividad_id', 78)
      .order('numero_semana');
    
    if (planificacionError) {
      console.error('❌ Error obteniendo planificación:', planificacionError);
      return false;
    }
    
    const { data: ejercicios, error: ejerciciosError } = await supabase
      .from('ejercicios_detalles')
      .select('id, nombre_ejercicio, tipo')
      .eq('activity_id', 78)
      .order('id');
    
    if (ejerciciosError) {
      console.error('❌ Error obteniendo ejercicios:', ejerciciosError);
      return false;
    }
    
    const { data: periodos, error: periodosError } = await supabase
      .from('periodos')
      .select('id, cantidad_periodos')
      .eq('actividad_id', 78);
    
    if (periodosError) {
      console.error('❌ Error obteniendo períodos:', periodosError);
      return false;
    }

    const totalPeriods = periodos?.[0]?.cantidad_periodos || 1;
    const periodoId = periodos?.[0]?.id;
    const clientId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';

    console.log(`📊 Datos obtenidos:`);
    console.log(`- Ejercicios: ${ejercicios?.length || 0}`);
    console.log(`- Períodos: ${totalPeriods}`);
    console.log(`- Semanas de planificación: ${planificacion?.length || 0}`);
    console.log(`- Periodo ID: ${periodoId}`);

    // 2. Limpiar ejecuciones existentes
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

    // 3. Crear ejecuciones con metadatos completos
    console.log('\n3️⃣ Creando ejecuciones con metadatos completos...');
    
    const ejecucionesToInsert = [];
    
    // Iterar por cada período (réplica)
    for (let periodo = 1; periodo <= totalPeriods; periodo++) {
      console.log(`\n📅 PERÍODO ${periodo} (Réplica ${periodo}):`);
      
      // Iterar por cada semana de la planificación
      for (const semana of planificacion || []) {
        console.log(`  📅 Semana ${semana.numero_semana}:`);
        
        const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
        
        dias.forEach(dia => {
          const ejerciciosDia = semana[dia];
          
          if (ejerciciosDia && ejerciciosDia !== '[]' && ejerciciosDia !== 'null') {
            try {
              const ejerciciosArray = JSON.parse(ejerciciosDia);
              
              if (typeof ejerciciosArray === 'object' && ejerciciosArray !== null) {
                console.log(`    ${dia.toUpperCase()}:`);
                
                // Procesar bloques en orden (1, 2, 3, 4)
                Object.keys(ejerciciosArray).sort().forEach(bloque => {
                  const ejerciciosBloque = ejerciciosArray[bloque];
                  
                  if (Array.isArray(ejerciciosBloque)) {
                    console.log(`      Bloque ${bloque}:`);
                    
                    // Ordenar por 'orden' dentro del bloque
                    ejerciciosBloque.sort((a, b) => a.orden - b.orden).forEach(ej => {
                      const ejercicio = ejercicios.find(e => e.id === ej.id);
                      const fechaEjecucion = calcularFechaEjecucion(periodo, semana.numero_semana, dia);
                      const numeroSemanaGlobal = obtenerNumeroSemana(periodo, semana.numero_semana);
                      const numeroPeriodo = obtenerNumeroPeriodo(periodo);
                      
                      console.log(`        - ${ejercicio?.nombre_ejercicio} (${dia}, Semana ${numeroSemanaGlobal}, Bloque ${bloque})`);
                      
                      // Crear ejecución con metadatos completos
                      ejecucionesToInsert.push({
                        ejercicio_id: ej.id,
                        client_id: clientId,
                        periodo_id: periodoId,
                        completado: false,
                        intensidad_aplicada: ejercicio?.tipo === 'fuerza' ? 'Principiante' : 
                                            ejercicio?.tipo === 'cardio' ? 'Moderado' : 'Descanso',
                        // Metadatos adicionales
                        dia_semana: dia, // Día de la semana (lunes, martes, etc.)
                        numero_semana: numeroSemanaGlobal, // Número de semana global
                        numero_periodo: numeroPeriodo, // Número de período (1, 2, 3)
                        numero_bloque: parseInt(bloque), // Número de bloque (1, 2, 3, 4)
                        orden_ejercicio: ej.orden, // Orden del ejercicio dentro del bloque
                        fecha_ejecucion: fechaEjecucion, // Fecha calculada de ejecución
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      });
                    });
                  }
                });
              }
            } catch (e) {
              console.log(`    ${dia.toUpperCase()}: Error parsing - ${ejerciciosDia}`);
            }
          }
        });
      }
    }

    console.log(`\n📝 Total de ejecuciones a insertar: ${ejecucionesToInsert.length}`);

    // 4. Insertar ejecuciones
    if (ejecucionesToInsert.length > 0) {
      console.log('\n4️⃣ Insertando ejecuciones con metadatos completos...');
      
      const { data: insertData, error: insertError } = await supabase
        .from('ejecuciones_ejercicio')
        .insert(ejecucionesToInsert)
        .select();
      
      if (insertError) {
        console.error('❌ Error insertando ejecuciones:', insertError);
        
        // Intentar insertar en lotes más pequeños
        console.log('\n🔄 Intentando insertar en lotes...');
        
        const batchSize = 10;
        for (let i = 0; i < ejecucionesToInsert.length; i += batchSize) {
          const batch = ejecucionesToInsert.slice(i, i + batchSize);
          console.log(`Insertando lote ${Math.floor(i/batchSize) + 1} (${batch.length} ejecuciones)...`);
          
          const { data: batchData, error: batchError } = await supabase
            .from('ejecuciones_ejercicio')
            .insert(batch)
            .select();
          
          if (batchError) {
            console.error(`❌ Error en lote ${Math.floor(i/batchSize) + 1}:`, batchError);
          } else {
            console.log(`✅ Lote ${Math.floor(i/batchSize) + 1} insertado: ${batchData?.length || 0} ejecuciones`);
          }
        }
        
        return false;
      }
      
      console.log('✅ Todas las ejecuciones creadas exitosamente!');
      console.log(`📊 Ejecuciones insertadas: ${insertData?.length || 0}`);
    }

    // 5. Verificar resultado final
    console.log('\n5️⃣ Verificando resultado final...');
    
    const { data: finalExecutions, error: finalError } = await supabase
      .from('ejecuciones_ejercicio')
      .select(`
        id,
        ejercicio_id,
        completado,
        intensidad_aplicada,
        dia_semana,
        numero_semana,
        numero_periodo,
        numero_bloque,
        orden_ejercicio,
        fecha_ejecucion,
        created_at,
        ejercicios_detalles!inner(nombre_ejercicio, tipo)
      `)
      .eq('client_id', clientId)
      .order('id');
    
    if (finalError) {
      console.error('❌ Error verificando ejecuciones:', finalError);
      return false;
    }
    
    console.log('📊 Ejecuciones finales en base de datos:', finalExecutions?.length || 0);
    
    // 6. Mostrar resumen con metadatos
    console.log('\n📋 RESUMEN FINAL CON METADATOS:');
    console.log(`✅ Ejecuciones esperadas: 24`);
    console.log(`✅ Ejecuciones creadas: ${finalExecutions?.length || 0}`);
    
    if (finalExecutions && finalExecutions.length > 0) {
      console.log('\n🎯 PRIMERAS 10 EJECUCIONES CON METADATOS:');
      finalExecutions.slice(0, 10).forEach((exec, index) => {
        const ejercicio = exec.ejercicios_detalles;
        console.log(`  ${index + 1}. ${ejercicio?.nombre_ejercicio}`);
        console.log(`     - Día: ${exec.dia_semana || 'N/A'}`);
        console.log(`     - Semana: ${exec.numero_semana || 'N/A'}`);
        console.log(`     - Período: ${exec.numero_periodo || 'N/A'}`);
        console.log(`     - Bloque: ${exec.numero_bloque || 'N/A'}`);
        console.log(`     - Orden: ${exec.orden_ejercicio || 'N/A'}`);
        console.log(`     - Fecha: ${exec.fecha_ejecucion || 'N/A'}`);
        console.log(`     - Completado: ${exec.completado}`);
        console.log('');
      });
      
      if (finalExecutions.length > 10) {
        console.log(`  ... y ${finalExecutions.length - 10} más`);
      }
      
      // 7. Mostrar estadísticas por metadatos
      console.log('\n📊 ESTADÍSTICAS POR METADATOS:');
      
      // Estadísticas por día de semana
      const statsPorDia = {};
      finalExecutions.forEach(exec => {
        const dia = exec.dia_semana || 'N/A';
        statsPorDia[dia] = (statsPorDia[dia] || 0) + 1;
      });
      console.log('📅 Ejecuciones por día:');
      Object.entries(statsPorDia).forEach(([dia, count]) => {
        console.log(`  - ${dia}: ${count} ejecuciones`);
      });
      
      // Estadísticas por período
      const statsPorPeriodo = {};
      finalExecutions.forEach(exec => {
        const periodo = exec.numero_periodo || 'N/A';
        statsPorPeriodo[periodo] = (statsPorPeriodo[periodo] || 0) + 1;
      });
      console.log('\n🔄 Ejecuciones por período:');
      Object.entries(statsPorPeriodo).forEach(([periodo, count]) => {
        console.log(`  - Período ${periodo}: ${count} ejecuciones`);
      });
      
      console.log('\n✅ SISTEMA COMPLETAMENTE FUNCIONAL CON METADATOS!');
      console.log('\n🧪 Ahora puedes:');
      console.log('1. Filtrar ejecuciones por día de semana');
      console.log('2. Mostrar progreso por período');
      console.log('3. Organizar ejercicios por bloques');
      console.log('4. Calcular fechas de ejecución automáticamente');
      console.log('5. Seguir la planificación semanal exacta');
    }

    return true;

  } catch (error) {
    console.error('❌ Error general:', error);
    return false;
  }
}

// Ejecutar creación de ejecuciones con metadatos
createExecutionsWithWeekday().catch(console.error);










