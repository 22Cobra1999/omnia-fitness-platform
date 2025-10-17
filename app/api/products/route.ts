import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    // Obtener productos básicos
    const { data: products, error: productsError } = await supabase
      .from('activities')
      .select('*')
      .eq('coach_id', user.id)
      .order('created_at', { ascending: false })
    
    if (productsError) {
      return NextResponse.json({ error: productsError.message }, { status: 500 })
    }
    
    // Obtener media para cada producto
    const productsWithMedia = await Promise.all(
      (products || []).map(async (product) => {
        const { data: media } = await supabase
          .from('activity_media')
          .select('id, image_url, video_url, pdf_url, bunny_video_id, bunny_library_id, video_thumbnail_url')
          .eq('activity_id', product.id)
          .single()
        
        return {
          id: product.id,
          title: product.title || 'Sin título',
          name: product.title || 'Sin título', // Alias para compatibilidad
          description: product.description || 'Sin descripción',
          price: product.price || 0,
          type: product.type || 'activity',
          difficulty: product.difficulty || 'beginner',
          is_public: product.is_public || false,
          capacity: product.capacity || null,
          created_at: product.created_at,
          updated_at: product.updated_at,
          // Valores seguros para campos que pueden no existir
          program_rating: product.program_rating || null,
          total_program_reviews: product.total_program_reviews || null,
          coach_name: product.coach_name || null,
          coach_avatar_url: product.coach_avatar_url || null,
          coach_whatsapp: product.coach_whatsapp || null,
          // Media real
          media: media,
          image_url: media?.image_url || null,
          video_url: media?.video_url || null,
          pdf_url: media?.pdf_url || null,
          // Para compatibilidad con el modal
          activity_media: media ? [media] : []
        }
      })
    )
    
    return NextResponse.json({ 
      success: true, 
      products: productsWithMedia 
    })
    
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const body = await request.json()
    
    // Crear producto en activities (la tabla real)
    const { data: product, error: productError } = await supabase
      .from('activities')
      .insert({
        title: body.name, // Usar title en lugar de name
        description: body.description,
        price: body.price,
        type: body.modality, // Usar type en lugar de modality
        categoria: body.categoria || 'fitness', // ✅ GUARDAR CATEGORIA (fitness o nutricion)
        difficulty: body.level, // Usar difficulty en lugar de level
        is_public: body.is_public,
        capacity: body.capacity,
        // stockQuantity no existe en la tabla activities
        coach_id: user.id,
        // ✅ CAMPOS ESPECÍFICOS PARA TALLERES
        workshop_type: body.workshop_type || (body.modality === 'workshop' ? 'general' : null)
      })
      .select()
      .single()
    
    if (productError) {
      return NextResponse.json({ error: productError.message }, { status: 500 })
    }
    
    if (body.modality === 'workshop' && body.workshopSchedule && Array.isArray(body.workshopSchedule)) {
      
      // Agrupar sesiones por tema
      const topicGroups = new Map()
      
      for (const session of body.workshopSchedule) {
        const topicKey = session.title || 'Sin título'
        if (!topicGroups.has(topicKey)) {
          topicGroups.set(topicKey, {
            nombre: session.title,
            descripcion: session.description || '',
            originales: [],
            secundarios: []
          })
        }
        
        const topic = topicGroups.get(topicKey)
        const horarioItem = {
          fecha: session.date,
          hora_inicio: session.startTime,
          hora_fin: session.endTime,
          cupo: 20 // Cupo por defecto
        }
        
        if (session.isPrimary) {
          topic.originales.push(horarioItem)
        } else {
          topic.secundarios.push(horarioItem)
        }
      }
      
      for (const [topicTitle, topicData] of topicGroups) {
        const originalesJson = {
          fechas_horarios: topicData.originales
        }
        
        const secundariosJson = {
          fechas_horarios: topicData.secundarios
        }
        
        // Insertar en taller_detalles
        const { error: topicError } = await supabase
          .from('taller_detalles')
          .insert({
            actividad_id: product.id,
            nombre: topicData.nombre || 'Sin título',
            descripcion: topicData.descripcion || '',
            originales: originalesJson,
            secundarios: secundariosJson
          })
        
        if (topicError) {
          console.error('❌ Error creando tema en taller_detalles:', topicError)
        } else {
        }
      }
    }
    
    // Devolver formato esperado por el modal
    return NextResponse.json({ 
      success: true, 
      productId: product.id,
      product: product 
    })
    
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const body = await request.json()
    
    // Verificar que se envió el ID del producto a actualizar
    if (!body.editingProductId) {
      return NextResponse.json({ error: 'ID de producto requerido para actualización' }, { status: 400 })
    }
    
    
    // Actualizar producto en activities
    const { data: product, error: productError } = await supabase
      .from('activities')
      .update({
        title: body.name,
        description: body.description,
        price: body.price,
        type: body.modality,
        categoria: body.categoria || 'fitness', // ✅ ACTUALIZAR CATEGORIA
        difficulty: body.level,
        is_public: body.is_public,
        capacity: body.capacity,
        // ✅ CAMPOS ESPECÍFICOS PARA TALLERES
        workshop_type: body.workshop_type || (body.modality === 'workshop' ? 'general' : null)
      })
      .eq('id', body.editingProductId)
      .eq('coach_id', user.id) // Seguridad: solo el coach dueño puede actualizar
      .select()
      .single()
    
    if (productError) {
      console.error('❌ Error actualizando producto:', productError)
      return NextResponse.json({ error: productError.message }, { status: 500 })
    }
    
    if (body.image_url || body.video_url) {
      // Verificar si ya existe un registro de media para esta actividad
      const { data: existingMedia, error: checkError } = await supabase
        .from('activity_media')
        .select('id')
        .eq('activity_id', body.editingProductId)
        .maybeSingle()
      
      if (checkError) {
        console.error('⚠️ Error verificando media existente:', checkError)
      }
      
      // Preparar datos de actualización
      const mediaUpdate: any = {
        image_url: body.image_url || null,
        video_url: body.video_url || null
      }
      
      if (body.video_url) {
        const isBunnyVideo = body.video_url.includes('b-cdn.net') || 
                             body.video_url.includes('mediadelivery.net')
        
        if (isBunnyVideo) {
          const embedMatch = body.video_url.match(/mediadelivery\.net\/embed\/([a-f0-9-]+)/)
          const cdnMatch = body.video_url.match(/b-cdn\.net\/([a-f0-9-]+)\//)
          const playlistMatch = body.video_url.match(/mediadelivery\.net\/([a-f0-9-]+)\//)
          const bunnyVideoId = embedMatch?.[1] || cdnMatch?.[1] || playlistMatch?.[1]
          
          if (bunnyVideoId) {
            mediaUpdate.bunny_video_id = bunnyVideoId
            mediaUpdate.bunny_library_id = parseInt(process.env.BUNNY_STREAM_LIBRARY_ID || '0')
          }
        }
      }
      
      if (existingMedia) {
        // Actualizar registro existente
        const { error: updateError } = await supabase
          .from('activity_media')
          .update(mediaUpdate)
          .eq('activity_id', body.editingProductId)
        
        if (updateError) {
          console.error('❌ Error actualizando media:', updateError)
        }
      } else {
        const { error: insertError } = await supabase
          .from('activity_media')
          .insert({
            activity_id: body.editingProductId,
            ...mediaUpdate
          })
        
        if (insertError) {
          console.error('❌ Error insertando media:', insertError)
        }
      }
    }
    
    if (body.modality === 'workshop' && body.workshopSchedule && Array.isArray(body.workshopSchedule)) {
      
      // Primero, eliminar temas existentes para este taller
      const { error: deleteError } = await supabase
        .from('taller_detalles')
        .delete()
        .eq('actividad_id', body.editingProductId)
      
      if (deleteError) {
        console.error('❌ Error eliminando temas:', deleteError)
      }
      
      // Agrupar sesiones por tema
      const topicGroups = new Map()
      
      for (const session of body.workshopSchedule) {
        const topicKey = session.title || 'Sin título'
        if (!topicGroups.has(topicKey)) {
          topicGroups.set(topicKey, {
            nombre: session.title,
            descripcion: session.description || '',
            originales: [],
            secundarios: []
          })
        }
        
        const topic = topicGroups.get(topicKey)
        const horarioItem = {
          fecha: session.date,
          hora_inicio: session.startTime,
          hora_fin: session.endTime,
          cupo: 20 // Cupo por defecto
        }
        
        if (session.isPrimary) {
          topic.originales.push(horarioItem)
        } else {
          topic.secundarios.push(horarioItem)
        }
      }
      
      for (const [topicTitle, topicData] of topicGroups) {
        const originalesJson = {
          fechas_horarios: topicData.originales
        }
        
        const secundariosJson = {
          fechas_horarios: topicData.secundarios
        }
        
        // Insertar en taller_detalles
        const topicInsert = {
          actividad_id: body.editingProductId,
          nombre: topicData.nombre || 'Sin título',
          descripcion: topicData.descripcion || '',
          horarios: horariosJson
        }
        
        const { error: topicError } = await supabase
          .from('taller_detalles')
          .insert(topicInsert)
        
        if (topicError) {
          console.error('❌ Error creando tema en taller_detalles:', topicError)
        } else {
        }
      }
    }
    
    // Devolver formato esperado por el modal
    return NextResponse.json({ 
      success: true, 
      productId: product.id,
      product: product 
    })
    
  } catch (error: any) {
    console.error('❌ Error en actualización:', error)
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 })
  }
}