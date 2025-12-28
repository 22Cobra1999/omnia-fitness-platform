import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { getPlanLimit, type PlanType } from '@/lib/utils/plan-limits'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener el coach_id (el id de coaches es el mismo que user.id)
    const { data: coach } = await supabase
      .from('coaches')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!coach) {
      return NextResponse.json({ error: 'Coach no encontrado' }, { status: 404 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      const planType: PlanType = 'free'
      const limits = {
        activitiesPerProduct: getPlanLimit(planType, 'activitiesPerProduct'),
        weeksPerProduct: getPlanLimit(planType, 'weeksPerProduct'),
        stockPerProduct: getPlanLimit(planType, 'stockPerProduct'),
        activeProducts: getPlanLimit(planType, 'activeProducts'),
        totalClients: getPlanLimit(planType, 'totalClients'),
        clientsPerProduct: getPlanLimit(planType, 'clientsPerProduct')
      }

      return NextResponse.json({
        success: true,
        planType,
        limits,
        warning: 'Service role key no configurada; usando límites de plan free'
      })
    }

    // Crear cliente con service role para obtener el plan
    const supabaseService = createClient(
      supabaseUrl,
      serviceRoleKey
    )

    // Obtener el plan activo del coach
    const { data: plan, error: planError } = await supabaseService
      .from('planes_uso_coach')
      .select('plan_type')
      .eq('coach_id', coach.id)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (planError) {
      console.error('Error obteniendo plan:', planError)
      const planType: PlanType = 'free'
      const limits = {
        activitiesPerProduct: getPlanLimit(planType, 'activitiesPerProduct'),
        weeksPerProduct: getPlanLimit(planType, 'weeksPerProduct'),
        stockPerProduct: getPlanLimit(planType, 'stockPerProduct'),
        activeProducts: getPlanLimit(planType, 'activeProducts'),
        totalClients: getPlanLimit(planType, 'totalClients'),
        clientsPerProduct: getPlanLimit(planType, 'clientsPerProduct')
      }

      return NextResponse.json({
        success: true,
        planType,
        limits,
        warning: planError.message
      })
    }

    // Obtener el tipo de plan (por defecto 'free')
    const planType: PlanType = (plan?.plan_type || 'free') as PlanType

    // Obtener los límites según el plan
    const limits = {
      activitiesPerProduct: getPlanLimit(planType, 'activitiesPerProduct'),
      weeksPerProduct: getPlanLimit(planType, 'weeksPerProduct'),
      stockPerProduct: getPlanLimit(planType, 'stockPerProduct'),
      activeProducts: getPlanLimit(planType, 'activeProducts'),
      totalClients: getPlanLimit(planType, 'totalClients'),
      clientsPerProduct: getPlanLimit(planType, 'clientsPerProduct')
    }

    return NextResponse.json({
      success: true,
      planType,
      limits
    })
  } catch (error: any) {
    console.error('Error en /api/coach/plan-limits:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 })
  }
}

