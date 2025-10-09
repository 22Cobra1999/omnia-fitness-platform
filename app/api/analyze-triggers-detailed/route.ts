import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    console.log('🔍 ANALYZE TRIGGERS DETAILED: Análisis detallado de triggers...')

    // Query más simple para obtener triggers
    const triggersQuery = `
      SELECT 
        trigger_name,
        event_manipulation,
        event_object_table,
        action_statement,
        action_timing
      FROM information_schema.triggers
      WHERE event_object_table = 'activities'
        AND trigger_schema = 'public';
    `

    // Query para obtener funciones específicas
    const functionsQuery = `
      SELECT 
        routine_name,
        routine_type,
        routine_definition
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_name LIKE '%cleanup%';
    `

    // Query para verificar si existe la función cleanup_activity_data
    const specificFunctionQuery = `
      SELECT 
        proname as function_name,
        prosrc as function_body
      FROM pg_proc 
      WHERE proname = 'cleanup_activity_data';
    `

    // Query para verificar si existe el trigger específico
    const specificTriggerQuery = `
      SELECT 
        tgname as trigger_name,
        tgtype as trigger_type,
        tgenabled as trigger_enabled
      FROM pg_trigger 
      WHERE tgname LIKE '%cleanup%';
    `

    let triggersData = null
    let functionsData = null
    let specificFunctionData = null
    let specificTriggerData = null

    // Consultar triggers
    try {
      const { data, error } = await supabase.rpc('execute_sql', { 
        sql_query: triggersQuery 
      })
      
      if (error) {
        console.error('❌ ANALYZE TRIGGERS DETAILED: Error consultando triggers:', error)
        triggersData = { error: error.message }
      } else {
        triggersData = data
        console.log('✅ ANALYZE TRIGGERS DETAILED: Triggers encontrados:', data?.length || 0)
      }
    } catch (err: any) {
      console.error('❌ ANALYZE TRIGGERS DETAILED: Error ejecutando query de triggers:', err)
      triggersData = { error: err.message }
    }

    // Consultar funciones
    try {
      const { data, error } = await supabase.rpc('execute_sql', { 
        sql_query: functionsQuery 
      })
      
      if (error) {
        console.error('❌ ANALYZE TRIGGERS DETAILED: Error consultando funciones:', error)
        functionsData = { error: error.message }
      } else {
        functionsData = data
        console.log('✅ ANALYZE TRIGGERS DETAILED: Funciones encontradas:', data?.length || 0)
      }
    } catch (err: any) {
      console.error('❌ ANALYZE TRIGGERS DETAILED: Error ejecutando query de funciones:', err)
      functionsData = { error: err.message }
    }

    // Consultar función específica
    try {
      const { data, error } = await supabase.rpc('execute_sql', { 
        sql_query: specificFunctionQuery 
      })
      
      if (error) {
        console.error('❌ ANALYZE TRIGGERS DETAILED: Error consultando función específica:', error)
        specificFunctionData = { error: error.message }
      } else {
        specificFunctionData = data
        console.log('✅ ANALYZE TRIGGERS DETAILED: Función cleanup_activity_data encontrada:', data?.length > 0)
      }
    } catch (err: any) {
      console.error('❌ ANALYZE TRIGGERS DETAILED: Error ejecutando query de función específica:', err)
      specificFunctionData = { error: err.message }
    }

    // Consultar trigger específico
    try {
      const { data, error } = await supabase.rpc('execute_sql', { 
        sql_query: specificTriggerQuery 
      })
      
      if (error) {
        console.error('❌ ANALYZE TRIGGERS DETAILED: Error consultando trigger específico:', error)
        specificTriggerData = { error: error.message }
      } else {
        specificTriggerData = data
        console.log('✅ ANALYZE TRIGGERS DETAILED: Trigger cleanup encontrado:', data?.length > 0)
      }
    } catch (err: any) {
      console.error('❌ ANALYZE TRIGGERS DETAILED: Error ejecutando query de trigger específico:', err)
      specificTriggerData = { error: err.message }
    }

    return NextResponse.json({
      success: true,
      message: 'Análisis detallado de triggers y funciones de la tabla activities',
      data: {
        triggers: triggersData,
        functions: functionsData,
        specific_function: specificFunctionData,
        specific_trigger: specificTriggerData,
        analysis: {
          has_triggers: Array.isArray(triggersData) ? triggersData.length > 0 : false,
          has_cleanup_function: Array.isArray(specificFunctionData) ? specificFunctionData.length > 0 : false,
          has_cleanup_trigger: Array.isArray(specificTriggerData) ? specificTriggerData.length > 0 : false,
          total_triggers: Array.isArray(triggersData) ? triggersData.length : 0,
          total_functions: Array.isArray(functionsData) ? functionsData.length : 0
        }
      }
    })

  } catch (error: any) {
    console.error('❌ ANALYZE TRIGGERS DETAILED: Error general:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 })
  }
}






















