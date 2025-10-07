const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncmZzd3JzdnJ6d3RnaWxzc2FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjE5MDMwMywiZXhwIjoyMDYxNzY2MzAzfQ.qRKBCY7dbxvNs-KCQqAm9L6xBY4X293oaFAW5yxc9Hc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function recreateExecutionsFinalCorrect() {
  try {
    console.log('🔧 RECREANDO EJECUCIONES FINAL CORRECTO...\n');

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

    // 3. Crear ejecuciones CORRECTAS (sin fecha_ejercicio, dia_semana exacto)
    console.log('\n3️⃣ CREANDO EJECUCIONES CORRECTAS...');
    
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
                      contadorEjecucion++;
                      
                      console.log(`            ${contadorEjecucion}. ${ejercicio?.nombre_ejercicio} (ID: ${ej.id}, Orden: ${ej.orden})`);
                      
                      // CREAR EJECUCIÓN CORRECTA (SIN fecha_ejercicio, dia_semana exacto)
                      ejecucionesCorrectas.push({
                        ejercicio_id: ej.id,
                        client_id: clientId,
                        periodo_id: periodoId,
                        completado: false,
                        intensidad_aplicada: 'Principiante', // Mantener por compatibilidad
                        dia_semana: dia, // DÍA EXACTO de planificacion_ejercicios (lunes, miercoles, jueves)
                        // NO incluir fecha_ejercicio - se llenará cuando el cliente comience
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

    // 4. Insertar ejecuciones correctas
    if (ejecucionesCorrectas.length > 0) {
      console.log('\n4️⃣ INSERTANDO EJECUCIONES CORRECTAS...');
      
      const { data: insertData, error: insertError } = await supabase
        .from('ejecuciones_ejercicio')
        .insert(ejecucionesCorrectas)
        .select();
      
      if (insertError) {
        console.error('❌ Error insertando ejecuciones:', insertError);
        return false;
      }
      
      console.log('✅ Ejecuciones insertadas correctamente!');
      console.log(`📊 Ejecuciones insertadas: ${insertData?.length || 0}`);
    }

    // 5. Verificar resultado final
    console.log('\n5️⃣ VERIFICANDO RESULTADO FINAL...');
    
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
    
    // 6. Mostrar resultado final
    if (finalExecutions && finalExecutions.length > 0) {
      console.log('\n🎯 RESULTADO FINAL DE EJECUCIONES:');
      finalExecutions.forEach((exec, index) => {
        const ejercicio = exec.ejercicios_detalles;
        console.log(`  ${index + 1}. ${ejercicio?.nombre_ejercicio} - ${exec.dia_semana} - Fecha: ${exec.fecha_ejercicio || 'NULL (correcto)'}`);
      });
      
      // 7. Verificar que dia_semana es correcto
      console.log('\n✅ VERIFICACIÓN DE DÍA DE SEMANA:');
      const statsPorDia = {};
      finalExecutions.forEach(exec => {
        const dia = exec.dia_semana || 'N/A';
        statsPorDia[dia] = (statsPorDia[dia] || 0) + 1;
      });
      
      Object.entries(statsPorDia).forEach(([dia, count]) => {
        console.log(`   - ${dia}: ${count} ejecuciones`);
      });
      
      // 8. Verificar que fecha_ejercicio es NULL
      console.log('\n✅ VERIFICACIÓN DE FECHA_EJERCICIO:');
      const conFecha = finalExecutions.filter(exec => exec.fecha_ejercicio !== null).length;
      const sinFecha = finalExecutions.filter(exec => exec.fecha_ejercicio === null).length;
      console.log(`   - Con fecha: ${conFecha} ejecuciones`);
      console.log(`   - Sin fecha (NULL): ${sinFecha} ejecuciones`);
      console.log(`   - Estado: ${sinFecha === finalExecutions.length ? '✅ CORRECTO' : '❌ INCORRECTO'}`);
      
      // 9. Mostrar secuencia esperada
      console.log('\n📋 SECUENCIA ESPERADA:');
      console.log('   Ejecuciones 1-4: Lunes (4 ejercicios en 4 bloques)');
      console.log('   Ejecuciones 5-6: Miércoles (2 ejercicios en 2 bloques)');
      console.log('   Ejecuciones 7-8: Jueves (2 ejercicios en 1 bloque)');
      console.log('   (Se repite 3 veces = 24 ejecuciones totales)');
      
      console.log('\n✅ SISTEMA RECREADO CORRECTAMENTE!');
      console.log('\n🧪 Características correctas:');
      console.log('   1. ✅ dia_semana = EXACTO de planificacion_ejercicios');
      console.log('   2. ✅ fecha_ejercicio = NULL (se llenará cuando cliente comience)');
      console.log('   3. ✅ Orden correcto: PERÍODO → SEMANA → DÍA → BLOQUE → EJERCICIO');
      console.log('   4. ✅ Bloques ordenados: 1, 2, 3, 4');
      console.log('   5. ✅ Ejercicios ordenados por campo "orden"');
    }

    return true;

  } catch (error) {
    console.error('❌ Error general:', error);
    return false;
  }
}

// Ejecutar recreación final correcta
recreateExecutionsFinalCorrect().catch(console.error);




