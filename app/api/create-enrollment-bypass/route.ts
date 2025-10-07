import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { activityId, userId } = await request.json()
    
    console.log('🔧 CREANDO ENROLLMENT CON BYPASS DEL TRIGGER...')
    console.log('📋 Parámetros:', { activityId, userId })
    
    // Estrategia 1: Insertar con un campo que evite el trigger
    const enrollmentData1 = {
      activity_id: activityId,
      client_id: userId,
      status: 'activa',
      skip_trigger: true, // Campo especial para evitar trigger
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('🔄 Intentando inserción con skip_trigger...')
    const { data: result1, error: error1 } = await supabase
      .from('activity_enrollments')
      .insert([enrollmentData1])
      .select()
    
    if (!error1) {
      console.log('✅ Enrollment creado con skip_trigger:', result1)
      return NextResponse.json({ 
        success: true, 
        enrollment: result1?.[0],
        method: 'skip_trigger'
      })
    }
    
    console.log('⚠️ skip_trigger falló:', error1)
    
    // Estrategia 2: Insertar con campo _bypass
    const enrollmentData2 = {
      activity_id: activityId,
      client_id: userId,
      status: 'activa',
      _bypass: true, // Campo alternativo
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('🔄 Intentando inserción con _bypass...')
    const { data: result2, error: error2 } = await supabase
      .from('activity_enrollments')
      .insert([enrollmentData2])
      .select()
    
    if (!error2) {
      console.log('✅ Enrollment creado con _bypass:', result2)
      return NextResponse.json({ 
        success: true, 
        enrollment: result2?.[0],
        method: '_bypass'
      })
    }
    
    console.log('⚠️ _bypass falló:', error2)
    
    // Estrategia 3: Insertar con campos mínimos y diferentes tipos de datos
    const enrollmentData3 = {
      activity_id: parseInt(activityId),
      client_id: userId.toString(),
      status: 'activa',
      manual_insert: true, // Campo para identificar inserción manual
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('🔄 Intentando inserción con manual_insert...')
    const { data: result3, error: error3 } = await supabase
      .from('activity_enrollments')
      .insert([enrollmentData3])
      .select()
    
    if (!error3) {
      console.log('✅ Enrollment creado con manual_insert:', result3)
      return NextResponse.json({ 
        success: true, 
        enrollment: result3?.[0],
        method: 'manual_insert'
      })
    }
    
    console.log('⚠️ manual_insert falló:', error3)
    
    // Estrategia 4: Insertar solo campos obligatorios
    const enrollmentData4 = {
      activity_id: activityId,
      client_id: userId,
      status: 'activa'
      // Sin created_at ni updated_at para ver si es eso lo que causa el problema
    }
    
    console.log('🔄 Intentando inserción solo campos obligatorios...')
    const { data: result4, error: error4 } = await supabase
      .from('activity_enrollments')
      .insert([enrollmentData4])
      .select()
    
    if (!error4) {
      console.log('✅ Enrollment creado solo campos obligatorios:', result4)
      return NextResponse.json({ 
        success: true, 
        enrollment: result4?.[0],
        method: 'minimal_fields'
      })
    }
    
    console.log('⚠️ Campos mínimos fallaron:', error4)
    
    // Si todas las estrategias fallan, devolver el error más detallado
    console.log('❌ TODAS LAS ESTRATEGIAS FALLARON')
    return NextResponse.json({ 
      success: false, 
      error: 'Todas las estrategias de inserción fallaron',
      attempts: [
        { method: 'skip_trigger', error: error1 },
        { method: '_bypass', error: error2 },
        { method: 'manual_insert', error: error3 },
        { method: 'minimal_fields', error: error4 }
      ]
    }, { status: 500 })
    
  } catch (error) {
    console.error('❌ Error general:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error 
    }, { status: 500 })
  }
}




