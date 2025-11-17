import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { getPlanLimit } from '@/lib/utils/plan-limits'

export async function POST(request: NextRequest) {
  try {
    const { activityId, paymentMethod, notes } = await request.json()

    if (!activityId) {
      return NextResponse.json({ error: 'activityId es requerido' }, { status: 400 })
    }

    const supabase = await createRouteHandlerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Permitir múltiples compras - eliminada validación de compra única
    // Obtener información de la actividad y el coach
    const { data: activity } = await supabase
      .from('activities')
      .select('id, title, price, type, coach_id')
      .eq('id', activityId)
      .single()

    if (!activity) {
      return NextResponse.json({ 
        error: 'Actividad no encontrada' 
      }, { status: 404 })
    }

    // Para talleres: verificar si está activo (disponible para nuevas ventas)
    if (activity.type === 'workshop') {
      const { data: tallerDetalles } = await supabase
        .from('taller_detalles')
        .select('activo')
        .eq('actividad_id', activityId)
        .limit(1)
      
      // Si hay temas y el taller está inactivo, no permitir inscripción
      if (tallerDetalles && tallerDetalles.length > 0 && tallerDetalles[0].activo === false) {
        return NextResponse.json({ 
          success: false,
          error: 'Este taller ha finalizado y no está disponible para nuevas inscripciones. Por favor, contacta al coach para más información.' 
        }, { status: 400 })
      }
    }

    // Validar límite de clientes por producto según el plan del coach
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Obtener plan del coach
    const { data: plan } = await supabaseService
      .from('planes_uso_coach')
      .select('plan_type')
      .eq('coach_id', activity.coach_id)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const planType = (plan?.plan_type || 'free') as 'free' | 'basico' | 'black' | 'premium'
    const totalClientsLimit = getPlanLimit(planType, 'totalClients')
    const stockLimit = getPlanLimit(planType, 'stockPerProduct')
    
    const normalizeCapacity = (value: any) => {
      if (value === null || value === undefined) return null
      if (typeof value === 'number') return isFinite(value) ? value : null
      if (typeof value === 'string') {
        const parsed = parseFloat(value)
        return isNaN(parsed) ? null : parsed
      }
      return null
    }
    
    const isDocumentProduct = typeof activity.type === 'string' && activity.type.toLowerCase() === 'document'
    
    const { data: coachActivities, error: coachActivitiesError } = await supabaseService
      .from('activities')
      .select('id, type')
      .eq('coach_id', activity.coach_id)
    
    if (coachActivitiesError) {
      console.error('❌ Error obteniendo actividades del coach para validar clientes totales:', coachActivitiesError)
      return NextResponse.json({ 
        error: 'No se pudo validar el límite de clientes totales',
        details: coachActivitiesError.message
      }, { status: 500 })
    }
    
    const eligibleActivityIds = (coachActivities || [])
      .filter((item) => {
        if (!item?.type) return true
        return item.type.toLowerCase() !== 'document'
      })
      .map((item) => item.id)
      .filter((id): id is number => typeof id === 'number' && !isNaN(id))

    // Contar clientes actuales inscritos en esta actividad
    const { count: currentClientsCount } = await supabaseService
      .from('activity_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('activity_id', activityId)
      .in('status', ['activa', 'active', 'enrolled', 'pending'])

    if (!isDocumentProduct) {
      const { count: totalActiveClients } = eligibleActivityIds.length > 0
        ? await supabaseService
            .from('activity_enrollments')
            .select('id', { count: 'exact', head: true })
            .in('activity_id', eligibleActivityIds)
            .in('status', ['activa', 'active', 'enrolled', 'pending'])
        : { count: 0 }
      
      if ((totalActiveClients || 0) >= totalClientsLimit) {
        return NextResponse.json({ 
          success: false,
          error: `Este coach ya alcanzó el máximo de clientes (${totalClientsLimit}) permitido por su plan actual.` 
        }, { status: 400 })
      }
      
      const productCapacityLimit =
        normalizeCapacity(activity.capacity) ??
        (stockLimit > 0 ? stockLimit : null)
      
      if (
        productCapacityLimit !== null &&
        (currentClientsCount || 0) >= productCapacityLimit
      ) {
        return NextResponse.json({ 
          success: false,
          error: `Este producto alcanzó su cupo máximo (${productCapacityLimit}). Por favor, contacta al coach para más información.` 
        }, { status: 400 })
      }
    }

    // Crear enrollment SIN start_date
    // El start_date se establecerá cuando el usuario presione "Comenzar actividad"
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('activity_enrollments')
      .insert({
        activity_id: activityId,
        client_id: user.id,
        status: 'activa',
        start_date: null // Se establecerá cuando el usuario inicie la actividad
      })
      .select()
      .single()

    if (enrollmentError) {
      console.error('Error creando enrollment:', enrollmentError)
      return NextResponse.json({ 
        error: 'Error al crear la inscripción',
        details: enrollmentError.message 
      }, { status: 500 })
    }

    console.log('✅ Enrollment creado:', enrollment.id)

    // Crear registro de pago en tabla banco
    const { error: bancoError } = await supabase
      .from('banco')
      .insert({
        enrollment_id: enrollment.id,
        amount_paid: activity.price || 0,
        payment_date: new Date().toISOString(),
        payment_method: paymentMethod || 'credit_card',
        currency: 'USD',
        payment_status: 'completed',
        external_reference: `direct_${enrollment.id}_${Date.now()}`
      })

    if (bancoError) {
      console.error('Error creando registro de pago:', bancoError)
      // No fallar la compra si falla el registro de pago
    } else {
      console.log('✅ Registro de pago creado en banco')
    }

    // NO inicializar progreso aquí - se inicializará cuando el usuario presione "Comenzar actividad"
    console.log('ℹ️ Enrollment creado sin start_date - esperando que el usuario inicie la actividad')

    return NextResponse.json({
      success: true,
      enrollment,
      message: 'Inscripción exitosa'
    })

  } catch (error: any) {
    console.error('Error en enrollments/direct:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 })
  }
}

