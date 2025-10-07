import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    console.log('🔍 CHECK TRIGGERS ACTIVITIES: Consultando triggers de la tabla activities...')

    // Query para obtener todos los triggers de la tabla activities
    const triggersQuery = `
      SELECT 
        trigger_name,
        event_manipulation,
        event_object_table,
        action_statement,
        action_timing,
        action_orientation,
        action_condition
      FROM information_schema.triggers
      WHERE event_object_table = 'activities'
        AND trigger_schema = 'public'
      ORDER BY trigger_name;
    `

    // Query para obtener funciones relacionadas
    const functionsQuery = `
      SELECT 
        routine_name,
        routine_type,
        data_type,
        routine_definition
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND (routine_name LIKE '%activity%' OR routine_name LIKE '%cleanup%')
      ORDER BY routine_name;
    `

    // Query para obtener constraints de la tabla
    const constraintsQuery = `
      SELECT
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule,
        rc.update_rule
      FROM information_schema.table_constraints AS tc
      LEFT JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      LEFT JOIN information_schema.referential_constraints AS rc
        ON tc.constraint_name = rc.constraint_name
        AND tc.table_schema = rc.constraint_schema
      WHERE tc.table_name = 'activities'
        AND tc.table_schema = 'public'
      ORDER BY tc.constraint_type, tc.constraint_name;
    `

    // Query para verificar si la tabla fitness_exercises existe
    const tableExistsQuery = `
      SELECT 
        table_name,
        table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = 'fitness_exercises';
    `

    let triggersResult = null
    let functionsResult = null
    let constraintsResult = null
    let tableExistsResult = null

    try {
      const { data: triggers, error: triggersError } = await supabase.rpc('execute_sql', { 
        sql_query: triggersQuery 
      })
      
      if (triggersError) {
        console.error('❌ CHECK TRIGGERS ACTIVITIES: Error consultando triggers:', triggersError)
        triggersResult = { error: triggersError.message }
      } else {
        triggersResult = triggers
        console.log('✅ CHECK TRIGGERS ACTIVITIES: Triggers encontrados:', triggers?.length || 0)
      }
    } catch (err: any) {
      console.error('❌ CHECK TRIGGERS ACTIVITIES: Error ejecutando query de triggers:', err)
      triggersResult = { error: err.message }
    }

    try {
      const { data: functions, error: functionsError } = await supabase.rpc('execute_sql', { 
        sql_query: functionsQuery 
      })
      
      if (functionsError) {
        console.error('❌ CHECK TRIGGERS ACTIVITIES: Error consultando funciones:', functionsError)
        functionsResult = { error: functionsError.message }
      } else {
        functionsResult = functions
        console.log('✅ CHECK TRIGGERS ACTIVITIES: Funciones encontradas:', functions?.length || 0)
      }
    } catch (err: any) {
      console.error('❌ CHECK TRIGGERS ACTIVITIES: Error ejecutando query de funciones:', err)
      functionsResult = { error: err.message }
    }

    try {
      const { data: constraints, error: constraintsError } = await supabase.rpc('execute_sql', { 
        sql_query: constraintsQuery 
      })
      
      if (constraintsError) {
        console.error('❌ CHECK TRIGGERS ACTIVITIES: Error consultando constraints:', constraintsError)
        constraintsResult = { error: constraintsError.message }
      } else {
        constraintsResult = constraints
        console.log('✅ CHECK TRIGGERS ACTIVITIES: Constraints encontrados:', constraints?.length || 0)
      }
    } catch (err: any) {
      console.error('❌ CHECK TRIGGERS ACTIVITIES: Error ejecutando query de constraints:', err)
      constraintsResult = { error: err.message }
    }

    try {
      const { data: tableExists, error: tableExistsError } = await supabase.rpc('execute_sql', { 
        sql_query: tableExistsQuery 
      })
      
      if (tableExistsError) {
        console.error('❌ CHECK TRIGGERS ACTIVITIES: Error verificando tabla fitness_exercises:', tableExistsError)
        tableExistsResult = { error: tableExistsError.message }
      } else {
        tableExistsResult = tableExists
        console.log('✅ CHECK TRIGGERS ACTIVITIES: Tabla fitness_exercises existe:', tableExists?.length > 0)
      }
    } catch (err: any) {
      console.error('❌ CHECK TRIGGERS ACTIVITIES: Error verificando existencia de tabla:', err)
      tableExistsResult = { error: err.message }
    }

    return NextResponse.json({
      success: true,
      message: 'Análisis completo de triggers y constraints de la tabla activities',
      data: {
        triggers: triggersResult,
        functions: functionsResult,
        constraints: constraintsResult,
        fitness_exercises_table_exists: tableExistsResult,
        summary: {
          triggers_count: Array.isArray(triggersResult) ? triggersResult.length : 0,
          functions_count: Array.isArray(functionsResult) ? functionsResult.length : 0,
          constraints_count: Array.isArray(constraintsResult) ? constraintsResult.length : 0,
          fitness_exercises_exists: Array.isArray(tableExistsResult) ? tableExistsResult.length > 0 : false
        }
      }
    })

  } catch (error: any) {
    console.error('❌ CHECK TRIGGERS ACTIVITIES: Error general:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 })
  }
}

















