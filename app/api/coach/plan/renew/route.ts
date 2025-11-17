import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Endpoint para renovación automática de planes
 * Se debe ejecutar diariamente (cron job) para renovar planes expirados
 * 
 * Lógica:
 * - Renueva planes que han expirado (expires_at <= now)
 * - Para plan free: máximo 3 renovaciones (renewal_count < 3)
 * - Para planes de pago: renovación ilimitada
 * - Crea una nueva fila con los límites actualizados y 31 días nuevos
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar que es una llamada autorizada (desde cron job o sistema interno)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ 
        error: 'No autorizado' 
      }, { status: 401 })
    }

    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const now = new Date()

    // Buscar planes activos que han expirado
    const { data: expiredPlans, error: fetchError } = await supabaseService
      .from('planes_uso_coach')
      .select('*')
      .eq('status', 'active')
      .lte('expires_at', now.toISOString())

    if (fetchError) {
      console.error('Error obteniendo planes expirados:', fetchError)
      return NextResponse.json({ 
        success: false,
        error: 'Error al obtener planes expirados',
        details: fetchError.message 
      }, { status: 500 })
    }

    if (!expiredPlans || expiredPlans.length === 0) {
      return NextResponse.json({ 
        success: true,
        message: 'No hay planes expirados para renovar',
        renewed: 0
      })
    }

    const renewedPlans: any[] = []
    const errors: any[] = []

    for (const plan of expiredPlans) {
      try {
        // Verificar si es plan free y si ya alcanzó el límite de renovaciones
        if (plan.plan_type === 'free') {
          const renewalCount = plan.renewal_count || 0
          if (renewalCount >= 3) {
            // Plan free alcanzó el límite, marcar como expirado
            await supabaseService
              .from('planes_uso_coach')
              .update({ 
                status: 'expired',
                updated_at: now.toISOString()
              })
              .eq('id', plan.id)
            
            errors.push({
              plan_id: plan.id,
              coach_id: plan.coach_id,
              error: 'Plan free alcanzó el límite de 3 renovaciones'
            })
            continue
          }
        }

        // Obtener el uso actual de almacenamiento
        const { data: storageUsageData } = await supabaseService
          .from('storage_usage')
          .select('gb_usage')
          .eq('coach_id', plan.coach_id)

        let storageUsed = 0
        if (storageUsageData) {
          storageUsed = storageUsageData.reduce((sum, item) => sum + (Number(item.gb_usage) || 0), 0)
        } else {
          storageUsed = Number(plan.storage_used_gb) || 0
        }

        // Límites de almacenamiento por plan
        const storageLimits: Record<string, number> = {
          free: 1,
          basico: 5,
          black: 25,
          premium: 100
        }

        const storageLimit = storageLimits[plan.plan_type] || 1

        // Validar que el almacenamiento usado no exceda el límite
        if (storageUsed > storageLimit) {
          // Marcar como expirado si excede el límite
          await supabaseService
            .from('planes_uso_coach')
            .update({ 
              status: 'expired',
              updated_at: now.toISOString()
            })
            .eq('id', plan.id)

          errors.push({
            plan_id: plan.id,
            coach_id: plan.coach_id,
            error: `Almacenamiento usado (${storageUsed.toFixed(2)} GB) excede el límite del plan (${storageLimit} GB)`
          })
          continue
        }

        // Desactivar el plan anterior
        await supabaseService
          .from('planes_uso_coach')
          .update({ 
            status: 'expired',
            updated_at: now.toISOString()
          })
          .eq('id', plan.id)

        // Calcular nueva fecha de expiración (31 días desde ahora en milisegundos)
        const thirtyOneDaysMs = 31 * 24 * 60 * 60 * 1000
        const newExpiresAt = new Date(now.getTime() + thirtyOneDaysMs)

        // Incrementar renewal_count si es plan free
        const newRenewalCount = plan.plan_type === 'free' 
          ? (plan.renewal_count || 0) + 1 
          : 0

        // Crear nuevo plan renovado
        const { data: newPlan, error: createError } = await supabaseService
          .from('planes_uso_coach')
          .insert({
            coach_id: plan.coach_id,
            plan_type: plan.plan_type,
            storage_limit_gb: storageLimit,
            storage_used_gb: storageUsed,
            status: 'active',
            started_at: now.toISOString(),
            expires_at: newExpiresAt.toISOString(),
            renewal_count: newRenewalCount
          })
          .select()
          .single()

        if (createError) {
          console.error('Error renovando plan:', createError)
          errors.push({
            plan_id: plan.id,
            coach_id: plan.coach_id,
            error: createError.message
          })
        } else {
          renewedPlans.push({
            old_plan_id: plan.id,
            new_plan_id: newPlan.id,
            coach_id: plan.coach_id,
            plan_type: plan.plan_type,
            renewal_count: newRenewalCount
          })
        }
      } catch (error) {
        console.error('Error procesando plan:', error)
        errors.push({
          plan_id: plan.id,
          coach_id: plan.coach_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `Renovación completada: ${renewedPlans.length} renovados, ${errors.length} errores`,
      renewed: renewedPlans.length,
      errors: errors.length,
      details: {
        renewed_plans: renewedPlans,
        errors: errors
      }
    })

  } catch (error) {
    console.error('Error en POST /api/coach/plan/renew:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

