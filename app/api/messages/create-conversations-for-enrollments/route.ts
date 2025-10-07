import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // Verificar si las tablas de mensajes existen
    const { data: tableCheck, error: tableError } = await supabase
      .from('conversations')
      .select('id')
      .limit(1)

    if (tableError && tableError.code === 'PGRST116') {
      return NextResponse.json({ 
        success: false, 
        error: 'Las tablas de mensajes no existen. Ejecuta el script create-messages-tables.sql primero.'
      }, { status: 400 })
    }

    // Obtener todos los enrollments con información de actividades y coaches
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('activity_enrollments')
      .select(`
        id,
        client_id,
        activity_id,
        status,
        created_at,
        activities:activity_id (
          id,
          title,
          coach_id
        )
      `)
      .in('status', ['active', 'enrolled', 'pending', 'completed'])
      .order('created_at', { ascending: false })

    if (enrollmentsError) {
      console.error('Error obteniendo enrollments:', enrollmentsError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error al obtener enrollments' 
      }, { status: 500 })
    }

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No hay enrollments para crear conversaciones',
        created: 0
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
            activity_title: enrollment.activities.title,
            enrollment_date: enrollment.created_at
          })
        }
      }
    })

    console.log(`📊 Encontrados ${enrollments.length} enrollments, ${uniqueConversations.size} conversaciones únicas`)

    // Crear conversaciones
    const createdConversations = []
    const errors = []

    for (const [key, conversationData] of uniqueConversations) {
      try {
        // Verificar si la conversación ya existe
        const { data: existingConversation, error: checkError } = await supabase
          .from('conversations')
          .select('id')
          .eq('client_id', conversationData.client_id)
          .eq('coach_id', conversationData.coach_id)
          .single()

        if (checkError && checkError.code !== 'PGRST116') {
          // Error diferente a "no encontrado"
          console.error(`Error verificando conversación existente:`, checkError)
          errors.push({
            client_id: conversationData.client_id,
            coach_id: conversationData.coach_id,
            error: checkError.message
          })
          continue
        }

        if (existingConversation) {
          console.log(`✅ Conversación ya existe para ${key}`)
          continue
        }

        // Crear nueva conversación
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({
            client_id: conversationData.client_id,
            coach_id: conversationData.coach_id,
            is_active: true
          })
          .select()
          .single()

        if (createError) {
          console.error(`Error creando conversación:`, createError)
          errors.push({
            client_id: conversationData.client_id,
            coach_id: conversationData.coach_id,
            error: createError.message
          })
        } else {
          createdConversations.push(newConversation)
          console.log(`✅ Conversación creada: ${key}`)
        }

      } catch (error) {
        console.error(`Error procesando conversación ${key}:`, error)
        errors.push({
          client_id: conversationData.client_id,
          coach_id: conversationData.coach_id,
          error: error instanceof Error ? error.message : 'Error desconocido'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Proceso completado`,
      stats: {
        total_enrollments: enrollments.length,
        unique_conversations: uniqueConversations.size,
        created: createdConversations.length,
        errors: errors.length
      },
      created_conversations: createdConversations,
      errors: errors
    })

  } catch (error) {
    console.error('Error en POST /api/messages/create-conversations-for-enrollments:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}




























