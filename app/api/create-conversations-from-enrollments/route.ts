import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    
    console.log('💬 Creando conversaciones basadas en enrollments existentes...')

    // Obtener todos los enrollments con información de actividades y coaches
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('activity_enrollments')
      .select(`
        id,
        client_id,
        activity_id,
        status,
        created_at,
        activities!activity_enrollments_activity_id_fkey (
          id,
          title,
          coach_id
        )
      `)
      .in('status', ['active', 'enrolled', 'pending', 'completed', 'activa'])

    if (enrollmentsError) {
      console.error('Error obteniendo enrollments:', enrollmentsError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error al obtener enrollments',
        details: enrollmentsError.message
      }, { status: 500 })
    }

    console.log(`📊 Encontrados ${enrollments?.length || 0} enrollments`)

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No hay enrollments para crear conversaciones',
        stats: {
          enrollments_found: 0,
          conversations_created: 0
        }
      })
    }

    // Crear un mapa de conversaciones únicas (client_id, coach_id)
    const uniqueConversations = new Map()
    
    enrollments.forEach(enrollment => {
      if (enrollment.activities && enrollment.activities.coach_id) {
        const key = `${enrollment.client_id}-${enrollment.activities.coach_id}`
        if (!uniqueConversations.has(key)) {
          uniqueConversations.set(key, {
            client_id: enrollment.client_id,
            coach_id: enrollment.activities.coach_id,
            created_at: enrollment.created_at
          })
        }
      }
    })

    console.log(`📋 ${uniqueConversations.size} conversaciones únicas a crear`)

    // Verificar cuáles conversaciones ya existen
    const existingConversations = []
    const conversationsToCreate = []

    for (const [key, conversationData] of uniqueConversations) {
      const { data: existing, error: checkError } = await supabase
        .from('conversations')
        .select('id')
        .eq('client_id', conversationData.client_id)
        .eq('coach_id', conversationData.coach_id)
        .single()

      if (existing) {
        existingConversations.push(key)
      } else if (checkError && checkError.code === 'PGRST116') {
        // No existe, agregar a la lista para crear
        conversationsToCreate.push(conversationData)
      }
    }

    console.log(`✅ ${existingConversations.length} conversaciones ya existen`)
    console.log(`🆕 ${conversationsToCreate.length} conversaciones nuevas a crear`)

    let createdConversations = []

    if (conversationsToCreate.length > 0) {
      const { data: insertedConversations, error: insertError } = await supabase
        .from('conversations')
        .insert(conversationsToCreate)
        .select()

      if (insertError) {
        console.error('Error insertando conversaciones:', insertError)
        return NextResponse.json({ 
          success: false, 
          error: 'Error al insertar conversaciones',
          details: insertError.message
        }, { status: 500 })
      }

      createdConversations = insertedConversations || []
    }

    // Obtener estadísticas finales
    const { data: totalConversations, error: countError } = await supabase
      .from('conversations')
      .select('id', { count: 'exact' })

    console.log(`🎉 ${createdConversations.length} conversaciones creadas exitosamente`)

    return NextResponse.json({
      success: true,
      message: `Conversaciones creadas exitosamente`,
      stats: {
        enrollments_found: enrollments.length,
        unique_conversations_needed: uniqueConversations.size,
        existing_conversations: existingConversations.length,
        new_conversations_created: createdConversations.length,
        total_conversations_in_db: totalConversations?.length || 0
      },
      created_conversations: createdConversations.slice(0, 5), // Mostrar solo las primeras 5
      existing_conversation_keys: existingConversations.slice(0, 5) // Mostrar solo las primeras 5
    })

  } catch (error) {
    console.error('Error creando conversaciones:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
