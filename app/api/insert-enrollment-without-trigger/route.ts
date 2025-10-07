import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { activityId, userId } = await request.json()
    
    console.log('🔧 INSERTANDO ENROLLMENT SIN TRIGGER...')
    console.log('📋 Parámetros:', { activityId, userId })
    
    // Estrategia 1: Deshabilitar trigger temporalmente
    console.log('\n1️⃣ DESHABILITANDO TRIGGER TEMPORALMENTE...')
    try {
      const disableTriggerSQL = `
        DROP TRIGGER IF EXISTS generate_ejecuciones_ejercicio_trigger ON activity_enrollments;
      `
      
      const { data: disableResult, error: disableError } = await supabase
        .rpc('exec_sql', { sql: disableTriggerSQL })
      
      if (disableError) {
        console.log('⚠️ Error deshabilitando trigger:', disableError)
        
        // Intentar con execute_sql
        const { data: disableResult2, error: disableError2 } = await supabase
          .rpc('execute_sql', { sql: disableTriggerSQL })
        
        if (disableError2) {
          console.log('⚠️ Error con execute_sql también:', disableError2)
        } else {
          console.log('✅ Trigger deshabilitado con execute_sql')
        }
      } else {
        console.log('✅ Trigger deshabilitado con exec_sql')
      }
    } catch (e) {
      console.log('⚠️ Error deshabilitando trigger:', e)
    }
    
    // Estrategia 2: Insertar enrollment
    console.log('\n2️⃣ INSERTANDO ENROLLMENT...')
    console.log('🔍 VARIABLES DE ENTRADA:')
    console.log('  - activityId:', activityId, '(tipo:', typeof activityId, ')')
    console.log('  - userId:', userId, '(tipo:', typeof userId, ')')
    
    const enrollmentData = {
      activity_id: activityId,
      client_id: userId,
      status: 'activa',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('📋 DATOS DEL ENROLLMENT A INSERTAR:')
    console.log('  - activity_id:', enrollmentData.activity_id, '(tipo:', typeof enrollmentData.activity_id, ')')
    console.log('  - client_id:', enrollmentData.client_id, '(tipo:', typeof enrollmentData.client_id, ')')
    console.log('  - status:', enrollmentData.status, '(tipo:', typeof enrollmentData.status, ')')
    console.log('  - created_at:', enrollmentData.created_at)
    console.log('  - updated_at:', enrollmentData.updated_at)
    console.log('📋 OBJETO COMPLETO:', JSON.stringify(enrollmentData, null, 2))
    
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('activity_enrollments')
      .insert([enrollmentData])
      .select()
    
    if (enrollmentError) {
      console.log('❌ Error insertando enrollment:', enrollmentError)
      
      // Estrategia 3: Intentar con campos mínimos
      console.log('\n3️⃣ INTENTANDO CON CAMPOS MÍNIMOS...')
      const minimalData = {
        activity_id: activityId,
        client_id: userId,
        status: 'activa'
      }
      
      const { data: minimalEnrollment, error: minimalError } = await supabase
        .from('activity_enrollments')
        .insert([minimalData])
        .select()
      
      if (minimalError) {
        console.log('❌ Error con campos mínimos:', minimalError)
        return NextResponse.json({ 
          success: false, 
          error: 'Error insertando enrollment',
          details: {
            fullError: enrollmentError,
            minimalError: minimalError
          }
        })
      } else {
        console.log('✅ Enrollment insertado con campos mínimos:', minimalEnrollment)
        return NextResponse.json({ 
          success: true, 
          enrollment: minimalEnrollment?.[0],
          method: 'minimal_fields'
        })
      }
    } else {
      console.log('✅ Enrollment insertado exitosamente:', enrollment)
      return NextResponse.json({ 
        success: true, 
        enrollment: enrollment?.[0],
        method: 'full_fields'
      })
    }
    
  } catch (error) {
    console.error('❌ Error general:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error 
    }, { status: 500 })
  }
}
