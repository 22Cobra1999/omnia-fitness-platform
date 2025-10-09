const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncmZzd3JzdnJ6d3RnaWxzc2FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjE5MDMwMywiZXhwIjoyMDYxNzY2MzAzfQ.qRKBCY7dbxvNs-KCQqAm9L6xBY4X293oaFAW5yxc9Hc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkColumnsAndRecreate() {
  try {
    console.log('🔧 VERIFICANDO COLUMNAS Y RECREANDO CON BLOQUE, ORDEN Y DETALLE_SERIES...\n');

    const clientId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';

    // 1. Verificar columnas disponibles
    console.log('1️⃣ Verificando columnas disponibles...');
    
    const { data: ejecuciones, error: ejecucionesError } = await supabase
      .from('ejecuciones_ejercicio')
      .select('*')
      .limit(1);
    
    if (ejecucionesError) {
      console.error('❌ Error obteniendo ejecuciones:', ejecucionesError);
      return false;
    }
    
    if (ejecuciones && ejecuciones.length > 0) {
      console.log('✅ Columnas disponibles en ejecuciones_ejercicio:');
      Object.keys(ejecuciones[0]).forEach(col => {
        console.log(`   - ${col}: ${typeof ejecuciones[0][col]}`);
      });
    } else {
      console.log('⚠️ No hay ejecuciones existentes para verificar columnas');
    }

    // 2. Probar inserción con columnas bloque, orden, detalle_series
    console.log('\n2️⃣ Probando inserción con columnas adicionales...');
    
    const ejercicioId = 1042; // HIIT Fútbol
    const periodoId = 19;

    const testData = {
      ejercicio_id: ejercicioId,
      client_id: clientId,
      periodo_id: periodoId,
      completado: false,
      intensidad_aplicada: 'Principiante',
      dia_semana: 'lunes',
      // Columnas adicionales a probar
      bloque: 1,
      orden: 1,
      detalle_series: JSON.stringify([
        { serie: 1, repeticiones: 10, peso: null, descanso: 60 },
        { serie: 2, repeticiones: 10, peso: null, descanso: 60 }
      ])
    };

    const { data: testInsert, error: testError } = await supabase
      .from('ejecuciones_ejercicio')
      .insert([testData])
      .select();
    
    if (testError) {
      console.error('❌ Error en inserción de prueba:', testError);
      console.log('⚠️ Las columnas bloque, orden, detalle_series pueden no estar disponibles');
    } else {
      console.log('✅ Inserción de prueba exitosa con columnas adicionales');
      console.log('📊 Datos insertados:', testInsert);
      
      // Eliminar el registro de prueba
      if (testInsert && testInsert.length > 0) {
        const { error: deleteError } = await supabase
          .from('ejecuciones_ejercicio')
          .delete()
          .eq('id', testInsert[0].id);
        
        if (deleteError) {
          console.log('⚠️ Error eliminando registro de prueba:', deleteError);
        } else {
          console.log('✅ Registro de prueba eliminado');
        }
      }
    }

    // 3. Obtener datos reales para recreación
    console.log('\n3️⃣ Obteniendo datos reales para recreación...');
    
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
    const periodoIdReal = periodos?.[0]?.id;

    console.log(`📊 Datos obtenidos:`);
    console.log(`   - Períodos: ${totalPeriods}`);
    console.log(`   - Semanas: ${planificacion?.length || 0}`);
    console.log(`   - Ejercicios: ${ejercicios?.length || 0}`);
    console.log(`   - Periodo ID: ${periodoIdReal}`);

    // 4. ELIMINAR TODAS LAS EJECUCIONES EXISTENTES
    console.log('\n4️⃣ ELIMINANDO TODAS LAS EJECUCIONES EXISTENTES...');
    
    const { error: deleteAllError } = await supabase
      .from('ejecuciones_ejercicio')
      .delete()
      .eq('client_id', clientId);
    
    if (deleteAllError) {
      console.error('❌ Error eliminando ejecuciones:', deleteAllError);
      return false;
    }
    
    console.log('✅ TODAS las ejecuciones eliminadas');

    // 5. Crear ejecuciones COMPLETAS con bloque, orden y detalle_series
    console.log('\n5️⃣ CREANDO EJECUCIONES COMPLETAS...');
    
    const ejecucionesCompletas = [];
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
                      
                      console.log(`            ${contadorEjecucion}. ${ejercicio?.nombre_ejercicio} (ID: ${ej.id}, Bloque: ${bloque}, Orden: ${ej.orden})`);
                      
                      // CREAR DETALLE DE SERIES BASADO EN EL TIPO DE EJERCICIO
                      let detalleSeries = null;
                      if (ejercicio?.tipo === 'fuerza') {
                        detalleSeries = JSON.stringify([
                          { serie: 1, repeticiones: 10, peso: null, descanso: 60 },
                          { serie: 2, repeticiones: 10, peso: null, descanso: 60 },
                          { serie: 3, repeticiones: 10, peso: null, descanso: 60 }
                        ]);
                      } else if (ejercicio?.tipo === 'cardio') {
                        detalleSeries = JSON.stringify([
                          { serie: 1, tiempo: 30, intensidad: 'moderada', descanso: 30 },
                          { serie: 2, tiempo: 30, intensidad: 'moderada', descanso: 30 },
                          { serie: 3, tiempo: 30, intensidad: 'moderada', descanso: 30 }
                        ]);
                      }
                      
                      // CREAR EJECUCIÓN COMPLETA
                      const ejecucionCompleta = {
                        ejercicio_id: ej.id,
                        client_id: clientId,
                        periodo_id: periodoIdReal,
                        completado: false,
                        intensidad_aplicada: 'Principiante',
                        dia_semana: dia,
                        // Columnas adicionales
                        bloque: parseInt(bloque),
                        orden: ej.orden,
                        detalle_series: detalleSeries,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      };
                      
                      ejecucionesCompletas.push(ejecucionCompleta);
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

    console.log(`\n📝 Total de ejecuciones completas a insertar: ${ejecucionesCompletas.length}`);

    // 6. Insertar ejecuciones completas
    if (ejecucionesCompletas.length > 0) {
      console.log('\n6️⃣ INSERTANDO EJECUCIONES COMPLETAS...');
      
      const { data: insertData, error: insertError } = await supabase
        .from('ejecuciones_ejercicio')
        .insert(ejecucionesCompletas)
        .select();
      
      if (insertError) {
        console.error('❌ Error insertando ejecuciones completas:', insertError);
        
        // Si falla, intentar sin las columnas adicionales
        console.log('\n🔄 Intentando sin columnas adicionales...');
        
        const ejecucionesSinAdicionales = ejecucionesCompletas.map(ej => {
          const { bloque, orden, detalle_series, ...resto } = ej;
          return resto;
        });
        
        const { data: insertData2, error: insertError2 } = await supabase
          .from('ejecuciones_ejercicio')
          .insert(ejecucionesSinAdicionales)
          .select();
        
        if (insertError2) {
          console.error('❌ Error insertando sin columnas adicionales:', insertError2);
          return false;
        }
        
        console.log('✅ Ejecuciones insertadas sin columnas adicionales');
        console.log(`📊 Ejecuciones insertadas: ${insertData2?.length || 0}`);
      } else {
        console.log('✅ Ejecuciones completas insertadas!');
        console.log(`📊 Ejecuciones insertadas: ${insertData?.length || 0}`);
      }
    }

    // 7. Verificar resultado final
    console.log('\n7️⃣ VERIFICANDO RESULTADO FINAL...');
    
    const { data: finalExecutions, error: finalError } = await supabase
      .from('ejecuciones_ejercicio')
      .select(`
        id,
        ejercicio_id,
        completado,
        dia_semana,
        bloque,
        orden,
        detalle_series,
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
    
    // 8. Mostrar resultado final
    if (finalExecutions && finalExecutions.length > 0) {
      console.log('\n🎯 RESULTADO FINAL DE EJECUCIONES COMPLETAS:');
      finalExecutions.slice(0, 5).forEach((exec, index) => {
        const ejercicio = exec.ejercicios_detalles;
        console.log(`  ${index + 1}. ${ejercicio?.nombre_ejercicio}`);
        console.log(`     - Día: ${exec.dia_semana}`);
        console.log(`     - Bloque: ${exec.bloque || 'N/A'}`);
        console.log(`     - Orden: ${exec.orden || 'N/A'}`);
        console.log(`     - Detalle series: ${exec.detalle_series ? 'SÍ' : 'N/A'}`);
        console.log('');
      });
      
      if (finalExecutions.length > 5) {
        console.log(`  ... y ${finalExecutions.length - 5} más`);
      }
      
      console.log('\n✅ SISTEMA RECREADO CON COLUMNAS COMPLETAS!');
      console.log('\n🧪 Características finales:');
      console.log('   1. ✅ dia_semana = EXACTO de planificacion_ejercicios');
      console.log('   2. ✅ fecha_ejercicio = NULL (se llenará cuando cliente comience)');
      console.log('   3. ✅ bloque = Número del bloque (1, 2, 3, 4)');
      console.log('   4. ✅ orden = Orden del ejercicio dentro del bloque');
      console.log('   5. ✅ detalle_series = JSON con series/repes según tipo de ejercicio');
      console.log('   6. ✅ Orden correcto: PERÍODO → SEMANA → DÍA → BLOQUE → EJERCICIO');
    }

    return true;

  } catch (error) {
    console.error('❌ Error general:', error);
    return false;
  }
}

// Ejecutar verificación y recreación
checkColumnsAndRecreate().catch(console.error);










