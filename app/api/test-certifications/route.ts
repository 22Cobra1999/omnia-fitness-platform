import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Test: Verificando tabla coach_certifications...')
    const supabase = createClient({ cookies })
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log('❌ No autenticado')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    // console.log('✅ Usuario autenticado:', user.id)
    // Intentar acceder a la tabla
    const { data, error } = await supabase
      .from('coach_certifications')
      .select('count')
      .limit(1)
    if (error) {
      console.error('❌ Error accediendo a la tabla:', error)
      return NextResponse.json({ 
        error: 'Error accediendo a la tabla',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }
    // console.log('✅ Tabla accesible, datos:', data)
    return NextResponse.json({
      success: true,
      message: 'Tabla coach_certifications funciona correctamente',
      user: user.id,
      data: data
    })
  } catch (error) {
    console.error('❌ Error en test:', error)
    return NextResponse.json({ 
      error: 'Error interno',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
