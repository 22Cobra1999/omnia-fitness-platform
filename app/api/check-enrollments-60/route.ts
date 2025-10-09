import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    console.log('🔍 CHECK ENROLLMENTS 60: Verificando inscripciones en actividad 60')

    try {
      // Verificar inscripciones en la actividad 60
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('activity_enrollments')
        .select('*')
        .eq('activity_id', '60')

      if (enrollmentsError) {
        console.log('❌ CHECK ENROLLMENTS 60: Error obteniendo inscripciones:', enrollmentsError.message)
        return NextResponse.json({
          success: false,
          error: 'Error obteniendo inscripciones',
          details: enrollmentsError.message
        }, { status: 500 })
      }

      console.log('✅ CHECK ENROLLMENTS 60: Inscripciones encontradas:', enrollments.length)

      // Si hay inscripciones, obtener detalles de los clientes
      let clientDetails = []
      if (enrollments.length > 0) {
        for (const enrollment of enrollments) {
          try {
            const { data: client, error: clientError } = await supabase
              .from('clients')
              .select('*')
              .eq('id', enrollment.client_id)
              .single()

            if (!clientError && client) {
              clientDetails.push({
                enrollment: enrollment,
                client: client
              })
            }
          } catch (err) {
            console.log('⚠️ CHECK ENROLLMENTS 60: Error obteniendo cliente:', err.message)
          }
        }
      }

      const canDelete = enrollments.length === 0

      return NextResponse.json({
        success: true,
        message: 'Verificación de inscripciones completada',
        activityId: '60',
        enrollmentsCount: enrollments.length,
        enrollments: enrollments,
        clientDetails: clientDetails,
        canDelete: canDelete,
        recommendation: canDelete 
          ? 'SEGURO ELIMINAR - No hay clientes inscritos'
          : 'NO ELIMINAR - Hay clientes inscritos que se verían afectados',
        impact: canDelete 
          ? 'NINGUNO - No hay clientes afectados'
          : `ALTO - ${enrollments.length} cliente(s) inscrito(s) se verían afectados`
      })

    } catch (error) {
      console.error('❌ CHECK ENROLLMENTS 60: Error general:', error)
      return NextResponse.json({
        success: false,
        error: 'Error interno del servidor',
        details: error.message
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ CHECK ENROLLMENTS 60: Error crítico:', error)
    return NextResponse.json({
      success: false,
      error: 'Error crítico del servidor'
    }, { status: 500 })
  }
}






















