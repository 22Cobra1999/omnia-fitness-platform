import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    console.log('🔍 VERIFY ACTIVITY 60: Verificando si la actividad 60 existe...')

    try {
      const { data: activity, error } = await supabase
        .from('activities')
        .select('*')
        .eq('id', 60)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('✅ VERIFY ACTIVITY 60: La actividad 60 NO existe (eliminada exitosamente)')
          return NextResponse.json({
            success: true,
            message: 'La actividad 60 fue eliminada exitosamente',
            exists: false,
            activity: null
          })
        } else {
          console.error('❌ VERIFY ACTIVITY 60: Error consultando actividad 60:', error)
          return NextResponse.json({
            success: false,
            error: 'Error consultando actividad 60',
            details: error.message
          }, { status: 500 })
        }
      }

      console.log('⚠️ VERIFY ACTIVITY 60: La actividad 60 AÚN existe:', activity)
      return NextResponse.json({
        success: true,
        message: 'La actividad 60 aún existe',
        exists: true,
        activity: activity
      })

    } catch (err: any) {
      console.error('❌ VERIFY ACTIVITY 60: Error inesperado:', err)
      return NextResponse.json({
        success: false,
        error: 'Error interno del servidor',
        details: err.message
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('❌ VERIFY ACTIVITY 60: Error general:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 })
  }
}
















