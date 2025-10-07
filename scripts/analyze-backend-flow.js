const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncmZzd3JzdnJ6d3RnaWxzc2FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjE5MDMwMywiZXhwIjoyMDYxNzY2MzAzfQ.qRKBCY7dbxvNs-KCQqAm9L6xBY4X293oaFAW5yxc9Hc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeBackendFlow() {
  try {
    console.log('🔍 ANALIZANDO FLUJO DEL BACKEND - ACTIVIDAD 78\n');

    // 1. Obtener datos de planificación_ejercicios
    console.log('1️⃣ DATOS DE PLANIFICACIÓN_EJERCICIOS:');
    
    const { data: planificacion, error: planificacionError } = await supabase
      .from('planificacion_ejercicios')
      .select('*')
      .eq('actividad_id', 78)
      .order('numero_semana');
    
    if (planificacionError) {
      console.error('❌ Error obteniendo planificación:', planificacionError);
      return false;
    }
    
    planificacion?.forEach(plan => {
      console.log(`\n📅 SEMANA ${plan.numero_semana}:`);
      console.log(`   ID: ${plan.id}, Actividad: ${plan.actividad_id}`);
      
      const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
      dias.forEach(dia => {
        if (plan[dia] && plan[dia] !== '[]' && plan[dia] !== 'null') {
          console.log(`   ${dia.toUpperCase()}: ${plan[dia]}`);
          
          // Parsear JSON para mostrar estructura
          try {
            const ejerciciosDia = JSON.parse(plan[dia]);
            console.log(`     Estructura:`);
            Object.keys(ejerciciosDia).forEach(bloque => {
              const ejerciciosBloque = ejerciciosDia[bloque];
              console.log(`       Bloque ${bloque}: ${JSON.stringify(ejerciciosBloque)}`);
            });
          } catch (e) {
            console.log(`     Error parsing: ${e.message}`);
          }
        }
      });
    });

    // 2. Obtener datos de periodos
    console.log('\n\n2️⃣ DATOS DE PERIODOS:');
    
    const { data: periodos, error: periodosError } = await supabase
      .from('periodos')
      .select('*')
      .eq('actividad_id', 78);
    
    if (periodosError) {
      console.error('❌ Error obteniendo períodos:', periodosError);
      return false;
    }
    
    periodos?.forEach(per => {
      console.log(`   ID: ${per.id}, Actividad: ${per.actividad_id}, Cantidad: ${per.cantidad_periodos}`);
      console.log(`   Fecha creación: ${per.fecha_creacion}`);
      console.log(`   Fecha actualización: ${per.fecha_actualizacion}`);
    });

    // 3. Obtener datos de ejercicios_detalles
    console.log('\n\n3️⃣ DATOS DE EJERCICIOS_DETALLES:');
    
    const { data: ejercicios, error: ejerciciosError } = await supabase
      .from('ejercicios_detalles')
      .select('*')
      .eq('activity_id', 78)
      .order('id');
    
    if (ejerciciosError) {
      console.error('❌ Error obteniendo ejercicios:', ejerciciosError);
      return false;
    }
    
    ejercicios?.forEach(ej => {
      console.log(`   ID: ${ej.id}, Nombre: ${ej.nombre_ejercicio}`);
      console.log(`   Activity ID: ${ej.activity_id}`);
      console.log(`   Tipo: ${ej.tipo || 'N/A'}`);
      console.log('');
    });

    // 4. Analizar el flujo correcto
    console.log('\n\n4️⃣ ANÁLISIS DEL FLUJO CORRECTO:');
    
    const totalPeriods = periodos?.[0]?.cantidad_periodos || 1;
    const totalSemanas = planificacion?.length || 0;
    
    console.log(`📊 DATOS BASE:`);
    console.log(`   - Total períodos (réplicas): ${totalPeriods}`);
    console.log(`   - Total semanas por período: ${totalSemanas}`);
    console.log(`   - Total ejercicios: ${ejercicios?.length || 0}`);
    
    console.log(`\n🔄 FLUJO DE EJECUCIONES:`);
    console.log(`   1. Por cada PERÍODO (réplica): 1 a ${totalPeriods}`);
    console.log(`   2. Por cada SEMANA dentro del período: 1 a ${totalSemanas}`);
    console.log(`   3. Por cada DÍA de la semana: lunes a domingo`);
    console.log(`   4. Por cada BLOQUE en el día: 1, 2, 3, 4 (según planificación)`);
    console.log(`   5. Por cada EJERCICIO en el bloque: en orden específico`);
    
    console.log(`\n📋 ESTRUCTURA DE DATOS:`);
    console.log(`   - planificacion_ejercicios: Define QUÉ ejercicios van en cada día/semana`);
    console.log(`   - periodos: Define CUÁNTAS veces repetir toda la planificación`);
    console.log(`   - ejercicios_detalles: Define los ejercicios disponibles`);
    
    // 5. Mostrar secuencia exacta esperada
    console.log(`\n\n5️⃣ SECUENCIA EXACTA ESPERADA:`);
    
    let ejecucionCount = 0;
    
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
                
                // Procesar bloques en orden numérico
                Object.keys(ejerciciosArray).sort((a, b) => parseInt(a) - parseInt(b)).forEach(bloque => {
                  const ejerciciosBloque = ejerciciosArray[bloque];
                  
                  if (Array.isArray(ejerciciosBloque)) {
                    console.log(`         Bloque ${bloque}:`);
                    
                    // Ordenar por 'orden' dentro del bloque
                    ejerciciosBloque.sort((a, b) => a.orden - b.orden).forEach(ej => {
                      const ejercicio = ejercicios.find(e => e.id === ej.id);
                      ejecucionCount++;
                      
                      console.log(`            ${ejecucionCount}. ${ejercicio?.nombre_ejercicio} (ID: ${ej.id}, Orden: ${ej.orden})`);
                    });
                  }
                });
              }
            } catch (e) {
              console.log(`         Error parsing ${dia}: ${e.message}`);
            }
          }
        });
      }
    }
    
    console.log(`\n\n📊 RESUMEN FINAL:`);
    console.log(`   - Total ejecuciones esperadas: ${ejecucionCount}`);
    console.log(`   - Períodos: ${totalPeriods}`);
    console.log(`   - Semanas por período: ${totalSemanas}`);
    console.log(`   - Ejercicios únicos: ${ejercicios?.length || 0}`);
    
    console.log(`\n✅ FLUJO ENTENDIDO:`);
    console.log(`   1. Se repite la planificación completa ${totalPeriods} veces`);
    console.log(`   2. Cada repetición incluye las ${totalSemanas} semanas`);
    console.log(`   3. Cada semana tiene días específicos con ejercicios`);
    console.log(`   4. Cada día puede tener múltiples bloques`);
    console.log(`   5. Cada bloque tiene ejercicios en orden específico`);
    console.log(`   6. El orden debe respetarse: PERÍODO → SEMANA → DÍA → BLOQUE → EJERCICIO`);

    return true;

  } catch (error) {
    console.error('❌ Error general:', error);
    return false;
  }
}

// Ejecutar análisis
analyzeBackendFlow().catch(console.error);




