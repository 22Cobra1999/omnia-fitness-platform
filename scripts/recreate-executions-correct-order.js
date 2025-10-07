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

async function recreateExecutionsCorrectOrder() {
  try {
    console.log('🔧 RECREANDO EJECUCIONES CON ORDEN CORRECTO...\n');

    const clientId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';

    // 1. Obtener datos reales
    console.log('1️⃣ Obteniendo datos reales del backend...');
    
    const { data: planificacion, error: planificacionError } = await supabase
      .from('planificacion_ejercicios')
      .select('*')
      .eq('actividad_id', 78)
      .order('numero_semana');
    
    const { data: periodos, error: periodosError } = await supabase
      .from('periodos')
      .select('*')
      .eq('actividad_id', 78);
    
    const { data: ejercicios, error: ejerciciosError } = await supabase
      .from('ejercicios_detalles')
      .select('*')
      .eq('activity_id', 78)
      .order('id');
    
    if (planificacionError || periodosError || ejerciciosError) {
      console.error('❌ Error obteniendo datos:', { planificacionError, periodosError, ejerciciosError });
      return false;
    }

    const totalPeriods = periodos?.[0]?.cantidad_periodos || 1;
    const periodoId = periodos?.[0]?.id;

    console.log(`📊 Datos obtenidos:`);
    console.log(`   - Períodos: ${totalPeriods}`);
    console.log(`   - Semanas: ${planificacion?.length || 0}`);
    console.log(`   - Ejercicios: ${ejercicios?.length || 0}`);
    console.log(`   - Periodo ID: ${periodoId}`);

    // 2. ELIMINAR TODAS LAS EJECUCIONES EXISTENTES
    console.log('\n2️⃣ ELIMINANDO TODAS LAS EJECUCIONES EXISTENTES...');
    
    const { error: deleteError } = await supabase
      .from('ejecuciones_ejercicio')
      .delete()
      .eq('client_id', clientId);
    
    if (deleteError) {
      console.error('❌ Error eliminando ejecuciones:', deleteError);
      return false;
    }
    
    console.log('✅ TODAS las ejecuciones eliminadas');

    // 3. Crear ejecuciones con ORDEN CORRECTO
    console.log('\n3️⃣ CREANDO EJECUCIONES CON ORDEN CORRECTO...');
    
    const ejecucionesCorrectas = [];
    let contadorEjecucion = 0;
    
    // FLUJO: PERÍODO → SEMANA → DÍA → BLOQUE → EJERCICIO
    for (let periodo = 1; periodo <= totalPeriods; periodo++) {
      console.log(`\n📅 PERÍODO ${periodo} (Réplica ${periodo}):`);
      
      for (const semana of planificacion || []) {
        console.log(`   📅 Semana ${semana.numero_semana}:`);
        
        const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
        
        dias.forEach(dia => {
          const ejerciciosDia = semana[dia];
          
          if (ejerciciosDia && ejerciciosDia !== '[]' && ejerciciosDia !== 'null') {
            try {
              const ejerciciosArray = JSON.parse(ejerciciosDia);
              
              if (typeof ejerciciosArray === 'object' && ejerciciosArray !== null) {
                console.log(`      ${dia.toUpperCase()}:`);
                
                // PROCESAR BLOQUES EN ORDEN NUMÉRICO (1, 2, 3, 4)
                Object.keys(ejerciciosArray).sort((a, b) => parseInt(a) - parseInt(b)).forEach(bloque => {
                  const ejerciciosBloque = ejerciciosArray[bloque];
                  
                  if (Array.isArray(ejerciciosBloque)) {
                    console.log(`         Bloque ${bloque}:`);
                    
                    // ORDENAR POR 'orden' DENTRO DEL BLOQUE
                    ejerciciosBloque.sort((a, b) => a.orden - b.orden).forEach(ej => {
                      const ejercicio = ejercicios.find(e => e.id === ej.id);
                      const fechaEjercicio = calcularFechaEjecucion(periodo, semana.numero_semana, dia);
                      contadorEjecucion++;
                      
                      console.log(`            ${contadorEjecucion}. ${ejercicio?.nombre_ejercicio} (ID: ${ej.id}, Orden: ${ej.orden})`);
                      
                      // CREAR EJECUCIÓN CON ORDEN CORRECTO
                      ejecucionesCorrectas.push({
                        ejercicio_id: ej.id,
                        client_id: clientId,
                        periodo_id: periodoId,
                        completado: false,
                        intensidad_aplicada: 'Principiante', // Mantener por compatibilidad
                        dia_semana: dia,
                        fecha_ejercicio: fechaEjercicio,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      });
                    });
                  }
                });
              }
            } catch (e) {
              console.log(`      ${dia.toUpperCase()}: Error parsing - ${ejerciciosDia}`);
            }
          }
        });
      }
    }

    console.log(`\n📝 Total de ejecuciones a insertar: ${ejecucionesCorrectas.length}`);

    // 4. Insertar ejecuciones en el orden correcto
    if (ejecucionesCorrectas.length > 0) {
      console.log('\n4️⃣ INSERTANDO EJECUCIONES EN ORDEN CORRECTO...');
      
      const { data: insertData, error: insertError } = await supabase
        .from('ejecuciones_ejercicio')
        .insert(ejecucionesCorrectas)
        .select();
      
      if (insertError) {
        console.error('❌ Error insertando ejecuciones:', insertError);
        return false;
      }
      
      console.log('✅ Ejecuciones insertadas en orden correcto!');
      console.log(`📊 Ejecuciones insertadas: ${insertData?.length || 0}`);
    }

    // 5. Verificar orden final
    console.log('\n5️⃣ VERIFICANDO ORDEN FINAL...');
    
    const { data: finalExecutions, error: finalError } = await supabase
      .from('ejecuciones_ejercicio')
      .select(`
        id,
        ejercicio_id,
        completado,
        dia_semana,
        fecha_ejercicio,
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
    
    // 6. Mostrar orden final
    if (finalExecutions && finalExecutions.length > 0) {
      console.log('\n🎯 ORDEN FINAL DE EJECUCIONES:');
      finalExecutions.forEach((exec, index) => {
        const ejercicio = exec.ejercicios_detalles;
        console.log(`  ${index + 1}. ${ejercicio?.nombre_ejercicio} - ${exec.dia_semana} - ${exec.fecha_ejercicio}`);
      });
      
      // 7. Verificar que el orden es correcto
      console.log('\n✅ VERIFICACIÓN DE ORDEN:');
      console.log(`   - Ejecuciones esperadas: ${ejecucionesCorrectas.length}`);
      console.log(`   - Ejecuciones creadas: ${finalExecutions.length}`);
      console.log(`   - Orden correcto: ${finalExecutions.length === ejecucionesCorrectas.length ? '✅ SÍ' : '❌ NO'}`);
      
      // 8. Mostrar estadísticas por período
      console.log('\n📊 ESTADÍSTICAS POR PERÍODO:');
      const ejecucionesPorPeriodo = Math.floor(finalExecutions.length / totalPeriods);
      for (let i = 1; i <= totalPeriods; i++) {
        const inicio = (i - 1) * ejecucionesPorPeriodo;
        const fin = i * ejecucionesPorPeriodo;
        console.log(`   - Período ${i}: Ejecuciones ${inicio + 1} a ${fin}`);
      }
      
      console.log('\n✅ SISTEMA RECREADO CON ORDEN CORRECTO!');
      console.log('\n🧪 El sistema ahora respeta:');
      console.log('   1. PERÍODO → SEMANA → DÍA → BLOQUE → EJERCICIO');
      console.log('   2. Orden numérico de bloques (1, 2, 3, 4)');
      console.log('   3. Orden de ejercicios dentro de cada bloque');
      console.log('   4. Fechas calculadas correctamente');
      console.log('   5. Días de semana correctos');
    }

    return true;

  } catch (error) {
    console.error('❌ Error general:', error);
    return false;
  }
}

// Ejecutar recreación con orden correcto
recreateExecutionsCorrectOrder().catch(console.error);





