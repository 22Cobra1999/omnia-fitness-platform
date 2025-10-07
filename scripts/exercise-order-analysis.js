const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncmZzd3JzdnJ6d3RnaWxzc2FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjE5MDMwMywiZXhwIjoyMDYxNzY2MzAzfQ.qRKBCY7dbxvNs-KCQqAm9L6xBY4X293oaFAW5yxc9Hc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeExerciseOrder() {
  try {
    console.log('🔍 ANÁLISIS DEL ORDEN DE EJERCICIOS Y RÉPLICAS\n');

    // 1. Obtener planificación semanal
    console.log('1️⃣ PLANIFICACIÓN SEMANAL:');
    
    const { data: planificacion, error: planificacionError } = await supabase
      .from('planificacion_ejercicios')
      .select('numero_semana, lunes, martes, miercoles, jueves, viernes, sabado, domingo')
      .eq('actividad_id', 78)
      .order('numero_semana');
    
    if (planificacionError) {
      console.error('❌ Error obteniendo planificación:', planificacionError);
      return false;
    }

    // 2. Obtener ejercicios
    const { data: ejercicios, error: ejerciciosError } = await supabase
      .from('ejercicios_detalles')
      .select('id, nombre_ejercicio, tipo')
      .eq('activity_id', 78)
      .order('id');
    
    if (ejerciciosError) {
      console.error('❌ Error obteniendo ejercicios:', ejerciciosError);
      return false;
    }

    // 3. Obtener períodos
    const { data: periodos, error: periodosError } = await supabase
      .from('periodos')
      .select('id, cantidad_periodos')
      .eq('actividad_id', 78);
    
    if (periodosError) {
      console.error('❌ Error obteniendo períodos:', periodosError);
      return false;
    }

    const totalPeriods = periodos?.[0]?.cantidad_periodos || 1;
    
    console.log('📊 DATOS BASE:');
    console.log(`- Ejercicios disponibles: ${ejercicios?.length || 0}`);
    console.log(`- Períodos (réplicas): ${totalPeriods}`);
    console.log(`- Semanas de planificación: ${planificacion?.length || 0}\n`);

    // 4. Mostrar planificación detallada
    console.log('📅 ESTRUCTURA DE LA PLANIFICACIÓN:');
    
    planificacion?.forEach(semana => {
      console.log(`\n📅 SEMANA ${semana.numero_semana}:`);
      const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
      
      dias.forEach(dia => {
        const ejerciciosDia = semana[dia];
        if (ejerciciosDia && ejerciciosDia !== '[]' && ejerciciosDia !== 'null') {
          try {
            const ejerciciosArray = JSON.parse(ejerciciosDia);
            if (typeof ejerciciosArray === 'object' && ejerciciosArray !== null) {
              console.log(`  ${dia.toUpperCase()}:`);
              
              // Procesar bloques (1, 2, 3, 4)
              Object.keys(ejerciciosArray).forEach(bloque => {
                const ejerciciosBloque = ejerciciosArray[bloque];
                if (Array.isArray(ejerciciosBloque)) {
                  console.log(`    Bloque ${bloque}:`);
                  ejerciciosBloque.forEach(ej => {
                    const ejercicio = ejercicios.find(e => e.id === ej.id);
                    console.log(`      - ${ejercicio?.nombre_ejercicio} (ID: ${ej.id}, Orden: ${ej.orden})`);
                  });
                }
              });
            }
          } catch (e) {
            console.log(`    ${dia.toUpperCase()}: ${ejerciciosDia} (formato no JSON)`);
          }
        } else {
          console.log(`  ${dia.toUpperCase()}: Sin ejercicios`);
        }
      });
    });

    // 5. Mostrar orden correcto de ejecuciones
    console.log('\n\n🔄 ORDEN CORRECTO DE EJECUCIONES:');
    console.log('\n📋 LÓGICA DE RÉPLICAS:');
    console.log(`- Se repite la planificación completa ${totalPeriods} veces`);
    console.log('- Cada réplica representa una "iteración" del programa completo');
    console.log('- Los ejercicios se ejecutan en el mismo orden en cada réplica\n');

    console.log('🎯 SECUENCIA ESPERADA:');
    
    for (let periodo = 1; periodo <= totalPeriods; periodo++) {
      console.log(`\n📅 PERÍODO ${periodo} (Réplica ${periodo}):`);
      
      for (const semana of planificacion || []) {
        console.log(`  📅 Semana ${semana.numero_semana}:`);
        
        const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
        dias.forEach(dia => {
          const ejerciciosDia = semana[dia];
          if (ejerciciosDia && ejerciciosDia !== '[]' && ejerciciosDia !== 'null') {
            try {
              const ejerciciosArray = JSON.parse(ejerciciosDia);
              if (typeof ejerciciosArray === 'object' && ejerciciosArray !== null) {
                
                // Procesar bloques en orden
                Object.keys(ejerciciosArray).sort().forEach(bloque => {
                  const ejerciciosBloque = ejerciciosArray[bloque];
                  if (Array.isArray(ejerciciosBloque)) {
                    
                    // Ordenar por 'orden' dentro del bloque
                    ejerciciosBloque.sort((a, b) => a.orden - b.orden).forEach(ej => {
                      const ejercicio = ejercicios.find(e => e.id === ej.id);
                      const fechaEjecucion = calcularFechaEjecucion(periodo, semana.numero_semana, dia);
                      console.log(`    ${dia} - Bloque ${bloque} - ${ejercicio?.nombre_ejercicio} (Fecha: ${fechaEjecucion})`);
                    });
                  }
                });
              }
            } catch (e) {
              // Ignorar errores de parsing
            }
          }
        });
      }
    }

    // 6. Mostrar resumen de ejecuciones esperadas
    console.log('\n\n📊 RESUMEN DE EJECUCIONES ESPERADAS:');
    
    let totalEjecuciones = 0;
    const ejecucionesPorPeriodo = [];
    
    for (let periodo = 1; periodo <= totalPeriods; periodo++) {
      let ejecucionesPeriodo = 0;
      
      for (const semana of planificacion || []) {
        const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
        dias.forEach(dia => {
          const ejerciciosDia = semana[dia];
          if (ejerciciosDia && ejerciciosDia !== '[]' && ejerciciosDia !== 'null') {
            try {
              const ejerciciosArray = JSON.parse(ejerciciosDia);
              if (typeof ejerciciosArray === 'object' && ejerciciosArray !== null) {
                Object.keys(ejerciciosArray).forEach(bloque => {
                  const ejerciciosBloque = ejerciciosArray[bloque];
                  if (Array.isArray(ejerciciosBloque)) {
                    ejecucionesPeriodo += ejerciciosBloque.length;
                  }
                });
              }
            } catch (e) {
              // Ignorar errores
            }
          }
        });
      }
      
      ejecucionesPorPeriodo.push(ejecucionesPeriodo);
      totalEjecuciones += ejecucionesPeriodo;
      console.log(`- Período ${periodo}: ${ejecucionesPeriodo} ejecuciones`);
    }
    
    console.log(`\n🎯 TOTAL DE EJECUCIONES ESPERADAS: ${totalEjecuciones}`);
    console.log(`📋 Ejecuciones actuales en BD: 6 (incorrectas)`);
    console.log(`❌ Diferencia: ${totalEjecuciones - 6} ejecuciones faltantes o incorrectas`);

    // 7. Mostrar problema actual
    console.log('\n\n❌ PROBLEMA ACTUAL:');
    console.log('Las ejecuciones actuales NO siguen la planificación semanal.');
    console.log('Se crearon ejecuciones simples sin considerar:');
    console.log('- Días específicos de la semana');
    console.log('- Bloques de ejercicios');
    console.log('- Orden dentro de cada bloque');
    console.log('- Fechas de ejecución calculadas');
    console.log('- Repetición por períodos');

    console.log('\n✅ SOLUCIÓN:');
    console.log('Crear ejecuciones que sigan exactamente la planificación semanal:');
    console.log('1. Por cada período (réplica)');
    console.log('2. Por cada semana de la planificación');
    console.log('3. Por cada día de la semana');
    console.log('4. Por cada bloque de ejercicios');
    console.log('5. Por cada ejercicio en el bloque');
    console.log('6. Con fecha_ejecucion calculada correctamente');

    return true;

  } catch (error) {
    console.error('❌ Error general:', error);
    return false;
  }
}

function calcularFechaEjecucion(periodo, semana, dia) {
  const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const indiceDia = diasSemana.indexOf(dia);
  
  // Calcular días desde el inicio
  const diasDesdeInicio = (periodo - 1) * 7 + (semana - 1) * 7 + indiceDia;
  
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + diasDesdeInicio);
  
  return fecha.toISOString().split('T')[0];
}

// Ejecutar análisis
analyzeExerciseOrder().catch(console.error);





