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

async function createCorrectExecutionsFinal() {
  try {
    console.log('🔧 Creando ejecuciones correctas con datos reales...\n');

    // 1. Obtener datos reales de las tablas
    console.log('1️⃣ Obteniendo datos reales...');
    
    // Obtener planificación real
    const { data: planificacion, error: planificacionError } = await supabase
      .from('planificacion_ejercicios')
      .select('id, actividad_id, numero_semana, lunes, martes, miercoles, jueves, viernes, sabado, domingo')
      .eq('actividad_id', 78)
      .order('numero_semana');
    
    if (planificacionError) {
      console.error('❌ Error obteniendo planificación:', planificacionError);
      return false;
    }
    
    // Obtener períodos reales
    const { data: periodos, error: periodosError } = await supabase
      .from('periodos')
      .select('id, actividad_id, cantidad_periodos')
      .eq('actividad_id', 78);
    
    if (periodosError) {
      console.error('❌ Error obteniendo períodos:', periodosError);
      return false;
    }
    
    // Obtener ejercicios reales
    const { data: ejercicios, error: ejerciciosError } = await supabase
      .from('ejercicios_detalles')
      .select('id, nombre_ejercicio, activity_id')
      .eq('activity_id', 78)
      .order('id');
    
    if (ejerciciosError) {
      console.error('❌ Error obteniendo ejercicios:', ejerciciosError);
      return false;
    }

    const totalPeriods = periodos?.[0]?.cantidad_periodos || 1;
    const periodoId = periodos?.[0]?.id;
    const clientId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';

    console.log(`📊 Datos reales obtenidos:`);
    console.log(`- Ejercicios: ${ejercicios?.length || 0}`);
    console.log(`- Períodos: ${totalPeriods}`);
    console.log(`- Semanas de planificación: ${planificacion?.length || 0}`);
    console.log(`- Periodo ID: ${periodoId}`);

    // 2. Limpiar ejecuciones existentes
    console.log('\n2️⃣ Limpiando ejecuciones existentes...');
    
    const { error: deleteError } = await supabase
      .from('ejecuciones_ejercicio')
      .delete()
      .eq('client_id', clientId);
    
    if (deleteError) {
      console.error('❌ Error eliminando ejecuciones:', deleteError);
      return false;
    }
    
    console.log('✅ Ejecuciones existentes eliminadas');

    // 3. Crear ejecuciones correctas basadas en datos reales
    console.log('\n3️⃣ Creando ejecuciones correctas...');
    
    const ejecucionesCorrectas = [];
    
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
                      
                      console.log(`        - ${ejercicio?.nombre_ejercicio} (ID: ${ej.id}, Bloque: ${bloque}, Orden: ${ej.orden})`);
                      
                      // Crear ejecución con datos correctos
                      ejecucionesCorrectas.push({
                        ejercicio_id: ej.id,
                        client_id: clientId,
                        periodo_id: periodoId,
                        completado: false,
                        intensidad_aplicada: 'Principiante', // Mantener por ahora (columna requerida)
                        // Metadatos correctos
                        dia_semana: dia,
                        fecha_ejercicio: fechaEjercicio,
                        // Intentar agregar bloque y orden (pueden no existir)
                        bloque: parseInt(bloque),
                        orden: ej.orden,
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

    console.log(`\n📝 Total de ejecuciones correctas a insertar: ${ejecucionesCorrectas.length}`);

    // 4. Insertar ejecuciones correctas
    if (ejecucionesCorrectas.length > 0) {
      console.log('\n4️⃣ Insertando ejecuciones correctas...');
      
      // Intentar insertar con todas las columnas
      const { data: insertData, error: insertError } = await supabase
        .from('ejecuciones_ejercicio')
        .insert(ejecucionesCorrectas)
        .select();
      
      if (insertError) {
        console.error('❌ Error insertando ejecuciones:', insertError);
        
        // Si falla, intentar sin las columnas bloque y orden
        console.log('\n🔄 Intentando sin columnas bloque y orden...');
        
        const ejecucionesSinBloqueOrden = ejecucionesCorrectas.map(ej => {
          const { bloque, orden, ...resto } = ej;
          return resto;
        });
        
        const { data: insertData2, error: insertError2 } = await supabase
          .from('ejecuciones_ejercicio')
          .insert(ejecucionesSinBloqueOrden)
          .select();
        
        if (insertError2) {
          console.error('❌ Error insertando sin bloque/orden:', insertError2);
          return false;
        }
        
        console.log('✅ Ejecuciones insertadas sin bloque/orden');
        console.log(`📊 Ejecuciones insertadas: ${insertData2?.length || 0}`);
      } else {
        console.log('✅ Ejecuciones insertadas con todas las columnas');
        console.log(`📊 Ejecuciones insertadas: ${insertData?.length || 0}`);
      }
    }

    // 5. Verificar resultado final
    console.log('\n5️⃣ Verificando resultado final...');
    
    const { data: finalExecutions, error: finalError } = await supabase
      .from('ejecuciones_ejercicio')
      .select(`
        id,
        ejercicio_id,
        completado,
        dia_semana,
        fecha_ejercicio,
        bloque,
        orden,
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
    
    console.log('📊 Ejecuciones finales en base de datos:', finalExecutions?.length || 0);
    
    // 6. Mostrar resumen con datos correctos
    console.log('\n📋 RESUMEN FINAL CON DATOS CORRECTOS:');
    console.log(`✅ Ejecuciones esperadas: ${ejecucionesCorrectas.length}`);
    console.log(`✅ Ejecuciones creadas: ${finalExecutions?.length || 0}`);
    
    if (finalExecutions && finalExecutions.length > 0) {
      console.log('\n🎯 PRIMERAS 10 EJECUCIONES CORRECTAS:');
      finalExecutions.slice(0, 10).forEach((exec, index) => {
        const ejercicio = exec.ejercicios_detalles;
        console.log(`  ${index + 1}. ${ejercicio?.nombre_ejercicio}`);
        console.log(`     - Día: ${exec.dia_semana || 'N/A'}`);
        console.log(`     - Fecha: ${exec.fecha_ejercicio || 'N/A'}`);
        console.log(`     - Bloque: ${exec.bloque || 'N/A'}`);
        console.log(`     - Orden: ${exec.orden || 'N/A'}`);
        console.log(`     - Completado: ${exec.completado}`);
        console.log('');
      });
      
      if (finalExecutions.length > 10) {
        console.log(`  ... y ${finalExecutions.length - 10} más`);
      }
      
      // 7. Mostrar estadísticas por día
      console.log('\n📊 ESTADÍSTICAS POR DÍA:');
      const statsPorDia = {};
      finalExecutions.forEach(exec => {
        const dia = exec.dia_semana || 'N/A';
        statsPorDia[dia] = (statsPorDia[dia] || 0) + 1;
      });
      
      Object.entries(statsPorDia).forEach(([dia, count]) => {
        console.log(`  - ${dia}: ${count} ejecuciones`);
      });
      
      console.log('\n✅ SISTEMA CORREGIDO Y FUNCIONAL!');
      console.log('\n🧪 Ahora el sistema tiene:');
      console.log('1. Datos reales de planificacion_ejercicios y periodos');
      console.log('2. Ejecuciones correctas basadas en la planificación real');
      console.log('3. Día de semana y fecha correctos');
      console.log('4. Columnas bloque y orden (si están disponibles)');
      console.log('5. Intensidad aplicada (mantenida por compatibilidad)');
    }

    return true;

  } catch (error) {
    console.error('❌ Error general:', error);
    return false;
  }
}

// Ejecutar creación correcta
createCorrectExecutionsFinal().catch(console.error);





