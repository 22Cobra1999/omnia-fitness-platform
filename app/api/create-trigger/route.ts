import { NextResponse } from "next/server"
import { createClientWithCookies } from "../../../lib/supabase-server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = await createClientWithCookies(cookieStore)

    // console.log("🔧 Creando trigger para automatizar ejecuciones...")

    // Script del trigger completo
    const triggerSQL = `
      -- Función para generar ejecuciones automáticamente
      CREATE OR REPLACE FUNCTION generate_exercise_executions()
      RETURNS TRIGGER AS $$
      DECLARE
        exercise_record RECORD;
        period_record RECORD;
        execution_count INTEGER := 0;
        total_executions INTEGER := 0;
      BEGIN
        -- Solo procesar si el status es 'activa'
        IF NEW.status = 'activa' THEN
          RAISE NOTICE 'Generando ejecuciones para enrollment ID: %', NEW.id;
          
          -- Obtener ejercicios de la actividad
          FOR exercise_record IN 
            SELECT id, tipo
            FROM ejercicios_detalles 
            WHERE activity_id = NEW.activity_id
          LOOP
            -- Obtener períodos de la actividad
            FOR period_record IN 
              SELECT id
              FROM periodos_asignados 
              WHERE activity_id = NEW.activity_id
            LOOP
              -- Determinar intensidad por defecto
              DECLARE
                default_intensity TEXT;
              BEGIN
                IF exercise_record.tipo = 'fuerza' THEN
                  default_intensity := 'Principiante';
                ELSIF exercise_record.tipo = 'cardio' THEN
                  default_intensity := 'Moderado';
                ELSE
                  default_intensity := 'Descanso';
                END IF;
                
                -- Insertar ejecución
                INSERT INTO ejecuciones_ejercicio (
                  periodo_id,
                  ejercicio_id,
                  client_id,
                  intensidad_aplicada,
                  completado
                ) VALUES (
                  period_record.id,
                  exercise_record.id,
                  NEW.client_id,
                  default_intensity,
                  false
                );
                
                execution_count := execution_count + 1;
              END;
            END LOOP;
          END LOOP;
          
          total_executions := execution_count;
          RAISE NOTICE 'Generadas % ejecuciones para enrollment ID: %', total_executions, NEW.id;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Crear trigger
      DROP TRIGGER IF EXISTS trigger_generate_executions ON activity_enrollments;
      
      CREATE TRIGGER trigger_generate_executions
        AFTER INSERT ON activity_enrollments
        FOR EACH ROW
        EXECUTE FUNCTION generate_exercise_executions();

      -- Verificar que el trigger se creó
      SELECT 
        trigger_name,
        event_manipulation,
        action_timing,
        action_statement
      FROM information_schema.triggers 
      WHERE trigger_name = 'trigger_generate_executions';
    `

    // Ejecutar el script
    const { data: result, error: execError } = await supabase
      .rpc('exec_sql', { sql: triggerSQL })

    if (execError) {
      console.log("No se puede ejecutar via RPC, el trigger debe crearse manualmente")
      return NextResponse.json({ 
        success: false, 
        error: "No se puede crear trigger via API. Ejecutar manualmente en Supabase SQL Editor.",
        instructions: "Ejecutar el script en db/create-complete-trigger-final.sql"
      }, { status: 500 })
    }

    // console.log("✅ Trigger creado exitosamente:", result)

    return NextResponse.json({
      success: true,
      message: "Trigger creado exitosamente",
      data: {
        triggerCreated: true,
        triggerName: "trigger_generate_executions",
        functionName: "generate_exercise_executions",
        table: "activity_enrollments",
        event: "AFTER INSERT",
        systemReady: true
      }
    })
  } catch (error: any) {
    console.error("Error creando trigger:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      instructions: "Ejecutar el script en db/create-complete-trigger-final.sql manualmente en Supabase SQL Editor"
    }, { status: 500 })
  }
}
































