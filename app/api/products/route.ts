import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

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
          .select('id, image_url, video_url, pdf_url')
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
        difficulty: body.level, // Usar difficulty en lugar de level
        is_public: body.is_public,
        capacity: body.capacity,
        // stockQuantity no existe en la tabla activities
        coach_id: user.id,
        // ✅ CAMPOS ESPECÍFICOS PARA TALLERES
        workshop_type: body.modality === 'workshop' ? 'general' : null,
        workshop_schedule_blocks: body.workshopSchedule ? JSON.stringify(body.workshopSchedule) : null
      })
      .select()
      .single()
    
    if (productError) {
      return NextResponse.json({ error: productError.message }, { status: 500 })
    }
    
    // ✅ DEBUG: Ver qué datos llegan
    console.log('🔍 DEBUG POST - Verificando datos del taller:')
    console.log('  - body.modality:', body.modality)
    console.log('  - body.workshopSchedule:', body.workshopSchedule)
    console.log('  - Es array?:', Array.isArray(body.workshopSchedule))
    console.log('  - Longitud:', body.workshopSchedule?.length)
    
    // ✅ Si es un taller, crear registros en taller_detalles
    if (body.modality === 'workshop' && body.workshopSchedule && Array.isArray(body.workshopSchedule)) {
      console.log('📝 Creando temas de taller en taller_detalles')
      console.log('📊 workshopSchedule recibido:', JSON.stringify(body.workshopSchedule, null, 2))
      console.log('🔢 Número de sesiones:', body.workshopSchedule.length)
      
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
      
      console.log('📊 Temas agrupados:', Array.from(topicGroups.entries()))
      
      // Crear un registro por cada tema
      for (const [topicTitle, topicData] of topicGroups) {
        console.log(`\n🎯 Procesando tema: ${topicTitle}`)
        console.log(`  - Horarios originales: ${topicData.originales.length}`)
        console.log(`  - Horarios secundarios: ${topicData.secundarios.length}`)
        
        // Crear JSONs con la nueva estructura
        const originalesJson = {
          fechas_horarios: topicData.originales
        }
        
        const secundariosJson = {
          fechas_horarios: topicData.secundarios
        }
        
        console.log('📅 JSONs creados:', {
          originales: originalesJson,
          secundarios: secundariosJson
        })
        
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
          console.log('✅ Tema creado en taller_detalles:', topicData.nombre)
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
    
    console.log('🔄 Actualizando producto:', {
      productId: body.editingProductId,
      name: body.name,
      hasImage: !!body.image_url,
      hasVideo: !!body.video_url,
      image_url: body.image_url,
      video_url: body.video_url,
      allBodyKeys: Object.keys(body),
      // ✅ DATOS DE TALLERES
      isWorkshop: body.modality === 'workshop',
      workshopScheduleLength: body.workshopSchedule?.length || 0,
      workshopSchedule: body.workshopSchedule,
      workshopMaterial: body.workshopMaterial
    })
    
    // Actualizar producto en activities
    const { data: product, error: productError } = await supabase
      .from('activities')
      .update({
        title: body.name,
        description: body.description,
        price: body.price,
        type: body.modality,
        difficulty: body.level,
        is_public: body.is_public,
        capacity: body.capacity,
        // ✅ CAMPOS ESPECÍFICOS PARA TALLERES
        workshop_type: body.modality === 'workshop' ? 'general' : null,
        workshop_schedule_blocks: body.workshopSchedule ? JSON.stringify(body.workshopSchedule) : null
      })
      .eq('id', body.editingProductId)
      .eq('coach_id', user.id) // Seguridad: solo el coach dueño puede actualizar
      .select()
      .single()
    
    if (productError) {
      console.error('❌ Error actualizando producto:', productError)
      return NextResponse.json({ error: productError.message }, { status: 500 })
    }
    
    // Actualizar media en activity_media si se proporcionaron nuevas URLs
    if (body.image_url || body.video_url) {
      console.log('🔄 Actualizando/creando media para actividad:', body.editingProductId)
      
      // Verificar si ya existe un registro de media para esta actividad
      const { data: existingMedia, error: checkError } = await supabase
        .from('activity_media')
        .select('id')
        .eq('activity_id', body.editingProductId)
        .maybeSingle()
      
      if (checkError) {
        console.error('⚠️ Error verificando media existente:', checkError)
      }
      
      if (existingMedia) {
        // Actualizar registro existente
        const { error: updateError } = await supabase
          .from('activity_media')
          .update({
            image_url: body.image_url || null,
            video_url: body.video_url || null
          })
          .eq('activity_id', body.editingProductId)
        
        if (updateError) {
          console.error('⚠️ Error actualizando media:', updateError)
        } else {
          console.log('✅ Media actualizada correctamente')
        }
      } else {
        // Crear nuevo registro
        const { error: insertError } = await supabase
          .from('activity_media')
          .insert({
            activity_id: body.editingProductId,
            image_url: body.image_url || null,
            video_url: body.video_url || null
          })
        
        if (insertError) {
          console.error('⚠️ Error insertando media:', insertError)
        } else {
          console.log('✅ Media insertada correctamente')
        }
      }
    }
    
    console.log('✅ Producto actualizado:', product.id)
    
    // ✅ DEBUG: Ver qué datos llegan
    console.log('🔍 DEBUG - Verificando datos del taller:')
    console.log('  - body.modality:', body.modality)
    console.log('  - body.workshopSchedule:', body.workshopSchedule)
    console.log('  - Es array?:', Array.isArray(body.workshopSchedule))
    console.log('  - Longitud:', body.workshopSchedule?.length)
    
    // ✅ Si es un taller, actualizar registros en taller_detalles
    if (body.modality === 'workshop' && body.workshopSchedule && Array.isArray(body.workshopSchedule)) {
      console.log('📝 Actualizando temas de taller en taller_detalles')
      console.log('📊 workshopSchedule recibido:', JSON.stringify(body.workshopSchedule, null, 2))
      console.log('🔢 Número de sesiones:', body.workshopSchedule.length)
      
      // Primero, eliminar temas existentes para este taller
      const { error: deleteError } = await supabase
        .from('taller_detalles')
        .delete()
        .eq('actividad_id', body.editingProductId)
      
      if (deleteError) {
        console.error('⚠️ Error eliminando temas antiguos:', deleteError)
      } else {
        console.log('🗑️ Temas antiguos eliminados correctamente')
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
      
      console.log(`📊 Total de temas encontrados: ${topicGroups.size}`)
      
      // Crear un registro por cada tema
      for (const [topicTitle, topicData] of topicGroups) {
        console.log(`🔄 Procesando tema: "${topicTitle}"`)
        console.log(`  - Horarios originales: ${topicData.originales.length}`)
        console.log(`  - Horarios secundarios: ${topicData.secundarios.length}`)
        
        // Crear JSONs con la nueva estructura
        const originalesJson = {
          fechas_horarios: topicData.originales
        }
        
        const secundariosJson = {
          fechas_horarios: topicData.secundarios
        }
        
        console.log('📅 JSONs creados:', {
          originales: originalesJson,
          secundarios: secundariosJson
        })
        
        // Insertar en taller_detalles
        const topicInsert = {
          actividad_id: body.editingProductId,
          nombre: topicData.nombre || 'Sin título',
          descripcion: topicData.descripcion || '',
          horarios: horariosJson
        }
        
        console.log('💾 Insertando tema en taller_detalles:', JSON.stringify(topicInsert, null, 2))
        
        const { error: topicError } = await supabase
          .from('taller_detalles')
          .insert(topicInsert)
        
        if (topicError) {
          console.error('❌ Error creando tema en taller_detalles:', topicError)
        } else {
          console.log('✅ Tema creado en taller_detalles:', topicData.nombre)
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