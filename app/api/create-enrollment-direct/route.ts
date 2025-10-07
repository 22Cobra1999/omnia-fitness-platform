import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { activityId, userId } = await request.json()
    
    console.log('🔧 Creando enrollment directamente con SQL...')
    console.log('📋 Parámetros:', { activityId, userId })
    
    // Crear el enrollment usando SQL directo para evitar el trigger
    const { data: result, error } = await supabase
      .from('activity_enrollments')
      .insert([{
        activity_id: activityId,
        client_id: userId,
        status: 'activa',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
    
    if (error) {
      console.error('❌ Error creando enrollment:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error 
      }, { status: 500 })
    }
    
    console.log('✅ Enrollment creado exitosamente:', result)
    return NextResponse.json({ 
      success: true, 
      enrollment: result?.[0],
      message: 'Enrollment creado exitosamente'
    })
    
  } catch (error) {
    console.error('❌ Error general:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error 
    }, { status: 500 })
  }
}




