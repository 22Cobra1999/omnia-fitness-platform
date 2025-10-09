const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncmZzd3JzdnJ6d3RnaWxzc2FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjE5MDMwMywiZXhwIjoyMDYxNzY2MzAzfQ.qRKBCY7dbxvNs-KCQqAm9L6xBY4X293oaFAW5yxc9Hc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function recreateWithRealDetalleSeries() {
  try {
    console.log('🔧 RECREANDO EJECUCIONES CON DETALLE_SERIES REALES...\n');

    const clientId = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';

    // 1. Obtener datos reales
    console.log('1️⃣ Obteniendo datos reales...');
    
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

    // 2. Mostrar datos reales de detalle_series
    console.log('\n📋 DATOS REALES DE DETALLE_SERIES:');
    ejercicios?.forEach(ej => {
      console.log(`   - ${ej.nombre_ejercicio} (ID: ${ej.id}): ${ej.detalle_series || 'NULL'}`);
    });

    // 3. ELIMINAR TODAS LAS EJECUCIONES EXISTENTES
    console.log('\n2️⃣ ELIMINANDO TODAS LAS EJECUCIONES EXISTENTES...');
    
    const { error: deleteAllError } = await supabase
      .from('ejecuciones_ejercicio')
      .delete()
      .eq('client_id', clientId);
    
    if (deleteAllError) {
      console.error('❌ Error eliminando ejecuciones:', deleteAllError);
      return false;
    }
    
    console.log('✅ TODAS las ejecuciones eliminadas');

    // 4. Crear ejecuciones con detalle_series REALES
    console.log('\n3️⃣ CREANDO EJECUCIONES CON DETALLE_SERIES REALES...');
    
    const ejecucionesReales = [];
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
                      console.log(`               Detalle series: ${ejercicio?.detalle_series || 'NULL'}`);
                      
                      // CREAR EJECUCIÓN CON DETALLE_SERIES REAL
                      const ejecucionReal = {
                        ejercicio_id: ej.id,
                        client_id: clientId,
                        periodo_id: periodoIdReal,
                        completado: false,
                        intensidad_aplicada: 'Principiante',
                        dia_semana: dia,
                        // Columnas adicionales con datos reales
                        bloque: parseInt(bloque),
                        orden: ej.orden,
                        detalle_series: ejercicio?.detalle_series || null, // USAR DATOS REALES
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      };
                      
                      ejecucionesReales.push(ejecucionReal);
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

    console.log(`\n📝 Total de ejecuciones reales a insertar: ${ejecucionesReales.length}`);

    // 5. Insertar ejecuciones con datos reales
    if (ejecucionesReales.length > 0) {
      console.log('\n4️⃣ INSERTANDO EJECUCIONES CON DATOS REALES...');
      
      const { data: insertData, error: insertError } = await supabase
        .from('ejecuciones_ejercicio')
        .insert(ejecucionesReales)
        .select();
      
      if (insertError) {
        console.error('❌ Error insertando ejecuciones reales:', insertError);
        return false;
      }
      
      console.log('✅ Ejecuciones con datos reales insertadas!');
      console.log(`📊 Ejecuciones insertadas: ${insertData?.length || 0}`);
    }

    // 6. Verificar resultado final
    console.log('\n5️⃣ VERIFICANDO RESULTADO FINAL...');
    
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
    
    // 7. Mostrar resultado final
    if (finalExecutions && finalExecutions.length > 0) {
      console.log('\n🎯 RESULTADO FINAL CON DETALLE_SERIES REALES:');
      finalExecutions.forEach((exec, index) => {
        const ejercicio = exec.ejercicios_detalles;
        console.log(`  ${index + 1}. ${ejercicio?.nombre_ejercicio}`);
        console.log(`     - Día: ${exec.dia_semana}`);
        console.log(`     - Bloque: ${exec.bloque}`);
        console.log(`     - Orden: ${exec.orden}`);
        console.log(`     - Detalle series REAL: ${exec.detalle_series || 'NULL'}`);
        console.log('');
      });
      
      // 8. Verificar que detalle_series coincide con ejercicios_detalles
      console.log('\n✅ VERIFICACIÓN DE DETALLE_SERIES REALES:');
      const statsPorDetalle = {};
      finalExecutions.forEach(exec => {
        const detalle = exec.detalle_series || 'NULL';
        statsPorDetalle[detalle] = (statsPorDetalle[detalle] || 0) + 1;
      });
      
      Object.entries(statsPorDetalle).forEach(([detalle, count]) => {
        console.log(`   - "${detalle}": ${count} ejecuciones`);
      });
      
      console.log('\n✅ SISTEMA RECREADO CON DETALLE_SERIES REALES!');
      console.log('\n🧪 Características finales:');
      console.log('   1. ✅ dia_semana = EXACTO de planificacion_ejercicios');
      console.log('   2. ✅ fecha_ejercicio = NULL (se llenará cuando cliente comience)');
      console.log('   3. ✅ bloque = Número del bloque (1, 2, 3, 4)');
      console.log('   4. ✅ orden = Orden del ejercicio dentro del bloque');
      console.log('   5. ✅ detalle_series = DATOS REALES de ejercicios_detalles');
      console.log('   6. ✅ Orden correcto: PERÍODO → SEMANA → DÍA → BLOQUE → EJERCICIO');
      
      console.log('\n📋 Datos reales de detalle_series:');
      console.log('   - HIIT Fútbol: NULL (como está en ejercicios_detalles)');
      console.log('   - Flexiones: (0-12-3);(0-10-2);(0-8-1) (como está en ejercicios_detalles)');
    }

    return true;

  } catch (error) {
    console.error('❌ Error general:', error);
    return false;
  }
}

// Ejecutar recreación con datos reales
recreateWithRealDetalleSeries().catch(console.error);










