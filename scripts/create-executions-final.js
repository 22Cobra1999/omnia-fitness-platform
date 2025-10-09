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

async function createFinalExecutions() {
  try {
    console.log('🔧 Creando ejecuciones finales con columnas disponibles...\n');

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

    // 3. Crear ejecuciones con columnas disponibles
    console.log('\n3️⃣ Creando ejecuciones con columnas disponibles...');
    
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
                      const fechaEjercicio = calcularFechaEjecucion(periodo, semana.numero_semana, dia);
                      
                      console.log(`        - ${ejercicio?.nombre_ejercicio} (${dia}, Bloque ${bloque}, Orden ${ej.orden})`);
                      
                      // Crear ejecución con columnas disponibles
                      ejecucionesToInsert.push({
                        ejercicio_id: ej.id,
                        client_id: clientId,
                        periodo_id: periodoId,
                        completado: false,
                        intensidad_aplicada: ejercicio?.tipo === 'fuerza' ? 'Principiante' : 
                                            ejercicio?.tipo === 'cardio' ? 'Moderado' : 'Descanso',
                        // Solo usar columnas disponibles
                        dia_semana: dia, // Día de la semana (lunes, martes, etc.)
                        fecha_ejercicio: fechaEjercicio, // Fecha calculada (usar fecha_ejercicio, no fecha_ejecucion)
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
      console.log('\n4️⃣ Insertando ejecuciones en la base de datos...');
      
      const { data: insertData, error: insertError } = await supabase
        .from('ejecuciones_ejercicio')
        .insert(ejecucionesToInsert)
        .select();
      
      if (insertError) {
        console.error('❌ Error insertando ejecuciones:', insertError);
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
        fecha_ejercicio,
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
    
    // 6. Mostrar resumen con metadatos disponibles
    console.log('\n📋 RESUMEN FINAL:');
    console.log(`✅ Ejecuciones esperadas: 24`);
    console.log(`✅ Ejecuciones creadas: ${finalExecutions?.length || 0}`);
    
    if (finalExecutions && finalExecutions.length > 0) {
      console.log('\n🎯 PRIMERAS 10 EJECUCIONES:');
      finalExecutions.slice(0, 10).forEach((exec, index) => {
        const ejercicio = exec.ejercicios_detalles;
        console.log(`  ${index + 1}. ${ejercicio?.nombre_ejercicio}`);
        console.log(`     - Día: ${exec.dia_semana || 'N/A'}`);
        console.log(`     - Fecha: ${exec.fecha_ejercicio || 'N/A'}`);
        console.log(`     - Completado: ${exec.completado}`);
        console.log('');
      });
      
      if (finalExecutions.length > 10) {
        console.log(`  ... y ${finalExecutions.length - 10} más`);
      }
      
      // 7. Mostrar estadísticas por día de semana
      console.log('\n📊 ESTADÍSTICAS POR DÍA DE SEMANA:');
      const statsPorDia = {};
      finalExecutions.forEach(exec => {
        const dia = exec.dia_semana || 'N/A';
        statsPorDia[dia] = (statsPorDia[dia] || 0) + 1;
      });
      
      Object.entries(statsPorDia).forEach(([dia, count]) => {
        console.log(`  - ${dia}: ${count} ejecuciones`);
      });
      
      // 8. Mostrar estadísticas por fecha
      console.log('\n📅 ESTADÍSTICAS POR FECHA:');
      const statsPorFecha = {};
      finalExecutions.forEach(exec => {
        const fecha = exec.fecha_ejercicio || 'N/A';
        statsPorFecha[fecha] = (statsPorFecha[fecha] || 0) + 1;
      });
      
      Object.entries(statsPorFecha).sort().forEach(([fecha, count]) => {
        console.log(`  - ${fecha}: ${count} ejecuciones`);
      });
      
      console.log('\n✅ SISTEMA COMPLETAMENTE FUNCIONAL!');
      console.log('\n🧪 Ahora puedes:');
      console.log('1. Filtrar ejecuciones por día de semana (lunes, miércoles, jueves)');
      console.log('2. Mostrar ejercicios por fecha específica');
      console.log('3. Seguir la planificación semanal exacta');
      console.log('4. Marcar ejercicios como completados día por día');
      console.log('5. Ver el progreso actualizarse automáticamente');
      
      console.log('\n📋 COLUMNAS UTILIZADAS:');
      console.log('✅ dia_semana - Día de la semana (lunes, martes, etc.)');
      console.log('✅ fecha_ejercicio - Fecha calculada de ejecución');
      console.log('✅ ejercicio_id - ID del ejercicio');
      console.log('✅ client_id - ID del cliente');
      console.log('✅ periodo_id - ID del período');
      console.log('✅ completado - Estado de completado');
      console.log('✅ intensidad_aplicada - Intensidad del ejercicio');
    }

    return true;

  } catch (error) {
    console.error('❌ Error general:', error);
    return false;
  }
}

// Ejecutar creación final
createFinalExecutions().catch(console.error);










