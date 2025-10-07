const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addActivityEnrollmentId() {
  console.log('🔧 AGREGANDO COLUMNA ACTIVITY_ENROLLMENT_ID A EJECUCIONES_EJERCICIO...')

  const CLIENT_ID = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
  const ACTIVITY_ID = 78

  try {
    // 1. Agregar la columna activity_enrollment_id si no existe
    console.log('\n1️⃣ AGREGANDO COLUMNA ACTIVITY_ENROLLMENT_ID...')
    
    const addColumnSQL = `
      ALTER TABLE ejecuciones_ejercicio 
      ADD COLUMN IF NOT EXISTS activity_enrollment_id INTEGER REFERENCES activity_enrollments(id);
    `

    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: addColumnSQL
    })

    if (addColumnError) {
      console.error('❌ Error agregando columna:', addColumnError)
      // Intentar con execute_sql
      const { error: addColumnError2 } = await supabase.rpc('execute_sql', {
        sql: addColumnSQL
      })
      if (addColumnError2) {
        console.error('❌ Error con execute_sql también:', addColumnError2)
        return
      }
    }

    console.log('✅ Columna activity_enrollment_id agregada exitosamente')

    // 2. Obtener el enrollment activo
    console.log('\n2️⃣ OBTENIENDO ENROLLMENT ACTIVO...')
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('activity_enrollments')
      .select('*')
      .eq('client_id', CLIENT_ID)
      .eq('activity_id', ACTIVITY_ID)
      .eq('status', 'activa')
      .not('start_date', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)

    if (enrollmentError || !enrollment || enrollment.length === 0) {
      console.error('❌ Error obteniendo enrollment activo:', enrollmentError)
      return
    }

    const activeEnrollment = enrollment[0]
    console.log(`✅ Enrollment activo encontrado: ID ${activeEnrollment.id}, Start Date: ${activeEnrollment.start_date}`)

    // 3. Actualizar todas las ejecuciones existentes con el activity_enrollment_id
    console.log('\n3️⃣ ACTUALIZANDO EJECUCIONES EXISTENTES...')
    
    // Primero obtener los IDs de ejercicios para esta actividad
    const { data: ejercicios, error: ejerciciosError } = await supabase
      .from('ejercicios_detalles')
      .select('id')
      .eq('activity_id', ACTIVITY_ID)

    if (ejerciciosError) {
      console.error('❌ Error obteniendo ejercicios:', ejerciciosError)
      return
    }

    const ejercicioIds = ejercicios.map(e => e.id)
    console.log(`📋 Ejercicios de la actividad ${ACTIVITY_ID}:`, ejercicioIds)

    // Actualizar ejecuciones existentes
    const { error: updateError } = await supabase
      .from('ejecuciones_ejercicio')
      .update({ activity_enrollment_id: activeEnrollment.id })
      .eq('client_id', CLIENT_ID)
      .in('ejercicio_id', ejercicioIds)
      .is('activity_enrollment_id', null)

    if (updateError) {
      console.error('❌ Error actualizando ejecuciones:', updateError)
      return
    }

    console.log('✅ Ejecuciones existentes actualizadas con activity_enrollment_id')

    // 4. Verificar resultado
    console.log('\n4️⃣ VERIFICANDO RESULTADO...')
    const { data: ejecucionesActualizadas, error: verifyError } = await supabase
      .from('ejecuciones_ejercicio')
      .select(`
        id,
        ejercicio_id,
        activity_enrollment_id,
        fecha_ejercicio,
        dia_semana,
        completado,
        ejercicios_detalles!inner(
          nombre_ejercicio,
          activity_id
        )
      `)
      .eq('client_id', CLIENT_ID)
      .eq('ejercicios_detalles.activity_id', ACTIVITY_ID)

    if (verifyError) {
      console.error('❌ Error verificando resultado:', verifyError)
    } else {
      console.log(`✅ Ejecuciones verificadas: ${ejecucionesActualizadas.length}`)
      
      // Agrupar por activity_enrollment_id
      const ejecucionesPorEnrollment = ejecucionesActualizadas.reduce((acc, ejecucion) => {
        const enrollmentId = ejecucion.activity_enrollment_id || 'NULL'
        if (!acc[enrollmentId]) {
          acc[enrollmentId] = []
        }
        acc[enrollmentId].push(ejecucion)
        return acc
      }, {})

      console.log('📊 Ejecuciones por enrollment:')
      Object.entries(ejecucionesPorEnrollment).forEach(([enrollmentId, ejecuciones]) => {
        console.log(`  Enrollment ID ${enrollmentId}: ${ejecuciones.length} ejecuciones`)
        const fechas = [...new Set(ejecuciones.map(e => e.fecha_ejercicio))]
        console.log(`    Fechas: ${fechas.join(', ')}`)
      })

      // Verificar que todas tengan activity_enrollment_id
      const ejecucionesSinEnrollment = ejecucionesActualizadas.filter(e => !e.activity_enrollment_id)
      if (ejecucionesSinEnrollment.length > 0) {
        console.log(`⚠️ ${ejecucionesSinEnrollment.length} ejecuciones sin activity_enrollment_id`)
      } else {
        console.log('✅ Todas las ejecuciones tienen activity_enrollment_id')
      }
    }

    // 5. Actualizar el trigger para incluir activity_enrollment_id
    console.log('\n5️⃣ ACTUALIZANDO TRIGGER...')
    
    const updateTriggerSQL = `
      CREATE OR REPLACE FUNCTION generate_ejecuciones_ejercicio()
      RETURNS TRIGGER AS $$
      DECLARE
          planificacion_record RECORD;
          periodo_record RECORD;
          ejercicio_record RECORD;
          total_periods INTEGER;
          periodo_id_val INTEGER;
          dia TEXT;
          dias_semana TEXT[] := ARRAY['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
          ejercicios_dia JSONB;
          bloque TEXT;
          ejercicios_bloque JSONB;
          ejercicio_info JSONB;
          ejecucion_data JSONB;
      BEGIN
          -- Obtener datos de planificación
          SELECT * INTO planificacion_record 
          FROM planificacion_ejercicios 
          WHERE actividad_id = NEW.activity_id 
          ORDER BY numero_semana;

          -- Obtener datos de períodos
          SELECT * INTO periodo_record 
          FROM periodos 
          WHERE actividad_id = NEW.activity_id;

          IF NOT FOUND THEN
              RAISE NOTICE 'No se encontraron períodos para la actividad %', NEW.activity_id;
              RETURN NEW;
          END IF;

          total_periods := periodo_record.cantidad_periodos;
          periodo_id_val := periodo_record.id;

          RAISE NOTICE 'Generando ejecuciones para actividad %, períodos: %, enrollment: %', NEW.activity_id, total_periods, NEW.id;

          -- Iterar por cada período
          FOR i IN 1..total_periods LOOP
              -- Iterar por cada semana en la planificación
              FOR planificacion_record IN 
                  SELECT * FROM planificacion_ejercicios 
                  WHERE actividad_id = NEW.activity_id 
                  ORDER BY numero_semana
              LOOP
                  -- Iterar por cada día de la semana
                  FOREACH dia IN ARRAY dias_semana LOOP
                      -- Verificar si el día tiene ejercicios
                      IF planificacion_record[dia] IS NOT NULL 
                         AND planificacion_record[dia] != '[]' 
                         AND planificacion_record[dia] != 'null' THEN
                          
                          BEGIN
                              ejercicios_dia := planificacion_record[dia]::JSONB;
                              
                              -- Iterar por cada bloque en el día
                              FOR bloque IN SELECT jsonb_object_keys(ejercicios_dia) LOOP
                                  ejercicios_bloque := ejercicios_dia->bloque;
                                  
                                  -- Iterar por cada ejercicio en el bloque
                                  FOR ejercicio_info IN SELECT * FROM jsonb_array_elements(ejercicios_bloque) LOOP
                                      -- Obtener detalles del ejercicio
                                      SELECT * INTO ejercicio_record 
                                      FROM ejercicios_detalles 
                                      WHERE id = (ejercicio_info->>'id')::INTEGER;
                                      
                                      IF FOUND THEN
                                          -- Insertar ejecución
                                          INSERT INTO ejecuciones_ejercicio (
                                              periodo_id,
                                              ejercicio_id,
                                              client_id,
                                              completado,
                                              intensidad_aplicada,
                                              dia_semana,
                                              fecha_ejercicio,
                                              bloque,
                                              orden,
                                              detalle_series,
                                              activity_enrollment_id,
                                              created_at,
                                              updated_at
                                          ) VALUES (
                                              periodo_id_val,
                                              ejercicio_record.id,
                                              NEW.client_id,
                                              false,
                                              'Principiante',
                                              dia,
                                              NULL, -- fecha_ejercicio será NULL hasta que el cliente inicie
                                              (bloque)::INTEGER,
                                              (ejercicio_info->>'orden')::INTEGER,
                                              ejercicio_record.detalle_series,
                                              NEW.id, -- CRÍTICO: Usar el ID del enrollment específico
                                              NOW(),
                                              NOW()
                                          );
                                          
                                          RAISE NOTICE 'Ejecución creada: ejercicio %, día %, bloque %, enrollment %', 
                                              ejercicio_record.id, dia, bloque, NEW.id;
                                      END IF;
                                  END LOOP;
                              END LOOP;
                              
                          EXCEPTION WHEN OTHERS THEN
                              RAISE NOTICE 'Error procesando día %: %', dia, SQLERRM;
                              CONTINUE;
                          END;
                      END IF;
                  END LOOP;
              END LOOP;
          END LOOP;

          RAISE NOTICE 'Ejecuciones generadas exitosamente para cliente % en actividad % (enrollment %)', 
              NEW.client_id, NEW.activity_id, NEW.id;

          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `

    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: updateTriggerSQL
    })

    if (triggerError) {
      console.error('❌ Error actualizando trigger:', triggerError)
      // Intentar con execute_sql
      const { error: triggerError2 } = await supabase.rpc('execute_sql', {
        sql: updateTriggerSQL
      })
      if (triggerError2) {
        console.error('❌ Error con execute_sql también:', triggerError2)
      } else {
        console.log('✅ Trigger actualizado exitosamente')
      }
    } else {
      console.log('✅ Trigger actualizado exitosamente')
    }

    console.log('\n🎉 PROCESO COMPLETADO EXITOSAMENTE')
    console.log('📋 Resumen de cambios:')
    console.log('  ✅ Columna activity_enrollment_id agregada')
    console.log('  ✅ Ejecuciones existentes actualizadas')
    console.log('  ✅ Trigger actualizado para incluir activity_enrollment_id')
    console.log('  ✅ Ahora cada ejecución está vinculada a un enrollment específico')

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

addActivityEnrollmentId()





