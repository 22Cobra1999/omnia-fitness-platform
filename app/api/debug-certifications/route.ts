import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
export async function GET(request: NextRequest) {
  try {
    // console.log('🔍 Debug: Verificando estado de certificaciones...')
    const supabase = createClient({ cookies })
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log('❌ Usuario no autenticado')
      return NextResponse.json({ 
        error: 'No autorizado',
        authenticated: false
      }, { status: 401 })
    }
    // console.log('✅ Usuario autenticado:', user.id)
    // Verificar si la tabla existe
    // console.log('🔍 Verificando existencia de tabla coach_certifications...')
    try {
      const { data: tableCheck, error: tableError } = await supabase
        .from('coach_certifications')
        .select('count')
        .limit(1)
      if (tableError) {
        console.error('❌ Error accediendo a la tabla:', tableError)
        return NextResponse.json({
          error: 'Error accediendo a la tabla',
          details: tableError.message,
          code: tableError.code,
          tableExists: false
        }, { status: 500 })
      }
      // console.log('✅ Tabla coach_certifications existe')
      // Obtener certificaciones del usuario
      const { data: certifications, error: fetchError } = await supabase
        .from('coach_certifications')
        .select('*')
        .eq('coach_id', user.id)
        .order('created_at', { ascending: false })
      if (fetchError) {
        console.error('❌ Error obteniendo certificaciones:', fetchError)
        return NextResponse.json({
          error: 'Error obteniendo certificaciones',
          details: fetchError.message,
          code: fetchError.code
        }, { status: 500 })
      }
      // console.log('✅ Certificaciones obtenidas:', certifications?.length || 0)
      return NextResponse.json({
        success: true,
        authenticated: true,
        userId: user.id,
        tableExists: true,
        certifications: certifications || [],
        count: certifications?.length || 0
      })
    } catch (error) {
      console.error('❌ Error general:', error)
      return NextResponse.json({
        error: 'Error general',
        details: error instanceof Error ? error.message : 'Unknown error',
        tableExists: false
      }, { status: 500 })
    }
  } catch (error) {
    console.error('❌ Error en debug:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
