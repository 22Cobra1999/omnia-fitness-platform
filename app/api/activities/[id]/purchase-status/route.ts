import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "../../../../../lib/supabase-server"
import { cookies } from "next/headers"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const activityId = parseInt(resolvedParams.id)
    
    if (!activityId || isNaN(activityId)) {
      return NextResponse.json(
        { success: false, error: "ID de actividad inválido" },
        { status: 400 }
      )
    }

    const supabase = await createRouteHandlerClient()

    // Verificar autenticación
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Usuario no autenticado" },
        { status: 401 }
      )
    }

    // Buscar todas las compras del cliente para esta actividad
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('activity_enrollments')
      .select('id, start_date, status, created_at, updated_at')
      .eq('activity_id', activityId)
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })

    if (enrollmentsError) {
      console.error('Error verificando enrollments:', enrollmentsError)
      return NextResponse.json(
        { success: false, error: "Error verificando estado de compra" },
        { status: 500 }
      )
    }

    let purchaseStatus = {
      hasNeverPurchased: true,
      hasActivePurchase: false,
      hasCompletedPurchase: false,
      hasCancelledPurchase: false,
      lastPurchase: null as any,
      message: '',
      buttonText: 'Comprar'
    }

    if (!enrollments || enrollments.length === 0) {
      // Nunca compró
      purchaseStatus.hasNeverPurchased = true
      purchaseStatus.message = 'Primera compra'
      purchaseStatus.buttonText = 'Comprar'
    } else {
      // Hay compras previas
      purchaseStatus.hasNeverPurchased = false
      purchaseStatus.lastPurchase = enrollments[0]

      // Verificar si tiene alguna compra activa
      const activeEnrollment = enrollments.find(e => 
        e.status === 'activa' || e.status === 'active' || e.status === 'enrolled' || e.status === 'pending'
      )

      if (activeEnrollment) {
        // Tiene compra activa
        purchaseStatus.hasActivePurchase = true
        purchaseStatus.message = 'Ya tienes esta actividad activa'
        purchaseStatus.buttonText = 'Ver Actividad'
      } else {
        // Solo tiene compras finalizadas/canceladas
        const completedEnrollment = enrollments.find(e => e.status === 'completed')
        const cancelledEnrollment = enrollments.find(e => e.status === 'cancelled')

        if (completedEnrollment) {
          purchaseStatus.hasCompletedPurchase = true
          purchaseStatus.message = 'Ya completaste esta actividad'
          purchaseStatus.buttonText = 'Repetir Actividad'
        } else if (cancelledEnrollment) {
          purchaseStatus.hasCancelledPurchase = true
          purchaseStatus.message = 'Cancelaste esta actividad anteriormente'
          purchaseStatus.buttonText = 'Comprar de Nuevo'
        } else {
          // Estado desconocido - pero permite múltiples compras
          purchaseStatus.message = 'Tienes compras previas - Puedes comprar nuevamente'
          purchaseStatus.buttonText = 'Comprar de Nuevo'
        }
      }
    }

    // // console.log(`📊 Estado de compra para usuario ${user.id} y actividad ${activityId}:`, purchaseStatus)

    return NextResponse.json({
      success: true,
      data: {
        activityId,
        userId: user.id,
        ...purchaseStatus,
        enrollments: enrollments || []
      }
    })

  } catch (error) {
    console.error('Error en GET /api/activities/[id]/purchase-status:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 }
    )
  }
}
