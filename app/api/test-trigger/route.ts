import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Usar service role para probar el trigger
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    console.log('🧪 Probando trigger de conversaciones automáticas...')

    // Obtener una actividad con coach que no tenga enrollment para este cliente
    const { data: allActivities, error: activitiesError } = await supabase
      .from('activities')
      .select('id, title, coach_id')
      .not('coach_id', 'is', null)
      .limit(10)

    if (activitiesError || !allActivities || allActivities.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No hay actividades con coaches disponibles' 
      }, { status: 400 })
    }

    // Obtener el cliente
    const { data: existingEnrollments, error: enrollmentsError } = await supabase
      .from('activity_enrollments')
      .select('client_id')
      .limit(1)

    if (enrollmentsError || !existingEnrollments || existingEnrollments.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No hay clientes disponibles para la prueba' 
      }, { status: 400 })
    }

    const clientId = existingEnrollments[0].client_id

    // Encontrar una actividad que no tenga enrollment para este cliente
    let activity = null
    for (const act of allActivities) {
      const { data: existingEnrollment } = await supabase
        .from('activity_enrollments')
        .select('id')
        .eq('activity_id', act.id)
        .eq('client_id', clientId)
        .single()

      if (!existingEnrollment) {
        activity = act
        break
      }
    }

    if (!activity) {
      return NextResponse.json({ 
        success: false, 
        error: 'No hay actividades disponibles para crear un enrollment de prueba' 
      }, { status: 400 })
    }

    console.log(`📋 Usando actividad: ${activity.title} (ID: ${activity.id})`)
    console.log(`👤 Usando cliente: ${clientId}`)

    // Verificar conversaciones antes del test
    const { data: conversationsBefore, error: beforeError } = await supabase
      .from('conversations')
      .select('id, client_id, coach_id')
      .eq('client_id', clientId)
      .eq('coach_id', activity.coach_id)

    console.log(`📊 Conversaciones antes: ${conversationsBefore?.length || 0}`)

    // Crear un enrollment de prueba
    const { data: newEnrollment, error: insertError } = await supabase
      .from('activity_enrollments')
      .insert({
        activity_id: activity.id,
        client_id: clientId,
        status: 'pending',
        amount_paid: 0,
        payment_method: 'test',
        payment_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creando enrollment de prueba:', insertError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error al crear enrollment de prueba',
        details: insertError.message
      }, { status: 500 })
    }

    console.log(`✅ Enrollment de prueba creado: ${newEnrollment.id}`)

    // Esperar un momento para que se ejecute el trigger
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Verificar conversaciones después del test
    const { data: conversationsAfter, error: afterError } = await supabase
      .from('conversations')
      .select('id, client_id, coach_id, created_at')
      .eq('client_id', clientId)
      .eq('coach_id', activity.coach_id)

    console.log(`📊 Conversaciones después: ${conversationsAfter?.length || 0}`)

    // Limpiar el enrollment de prueba
    await supabase
      .from('activity_enrollments')
      .delete()
      .eq('id', newEnrollment.id)

    console.log(`🧹 Enrollment de prueba eliminado`)

    const triggerWorked = (conversationsAfter?.length || 0) > (conversationsBefore?.length || 0)

    return NextResponse.json({
      success: true,
      message: triggerWorked ? '✅ Trigger funciona correctamente' : '⚠️ Trigger no se ejecutó o ya existía conversación',
      test_results: {
        activity_used: {
          id: activity.id,
          title: activity.title,
          coach_id: activity.coach_id
        },
        client_used: clientId,
        enrollment_created: newEnrollment.id,
        conversations_before: conversationsBefore?.length || 0,
        conversations_after: conversationsAfter?.length || 0,
        trigger_executed: triggerWorked,
        new_conversation: triggerWorked ? conversationsAfter?.[0] : null
      }
    })

  } catch (error) {
    console.error('Error probando trigger:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
