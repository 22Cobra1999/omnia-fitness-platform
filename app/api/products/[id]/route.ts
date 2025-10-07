import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

// Función para extraer ID de Vimeo
function extractVimeoId(url: string): string | null {
  const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/;
  const match = url.match(vimeoRegex);
  return match ? match[1] : null;
}

// Endpoint GET para obtener un producto específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== INICIO GET /api/products/[id] ===')
    const id = await params.id
    console.log('ID del producto a obtener:', id)
    
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }



    // Obtener el producto base
    const { data: product, error: productError } = await supabase
      .from('activities')
      .select(`
        *,
        activity_media (*),
        activity_availability (*),
        activity_tags (*)
      `)
      .eq('id', id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    // Si es un programa, obtener los datos del CSV
    if (product.type === 'fitness' || product.type === 'program') {
      // console.log('🔍 Obteniendo datos de CSV para programa...')
      // // console.log('📊 Tipo de producto:', product.type)
      // // console.log('📊 ID del producto:', id)
      
      // Obtener ejercicios de fitness
      // console.log('🔍 Consultando tabla fitness_exercises para activity_id:', id)
      const { data: fitnessExercises, error: fitnessError } = await supabase
        .from('fitness_exercises')
        .select('*')
        .eq('activity_id', id)
        .order('semana', { ascending: true })
        .order('día', { ascending: true })

      if (fitnessError) {
        console.error('❌ Error obteniendo ejercicios de fitness:', fitnessError)
      } else {
        // console.log(`✅ Obtenidos ${fitnessExercises?.length || 0} ejercicios de fitness`)
        // console.log('🔍 Primer ejercicio encontrado:', fitnessExercises?.[0])
        
        if (fitnessExercises && fitnessExercises.length > 0) {
          // // console.log('📊 Ejercicios encontrados:', fitnessExercises.length)
          // // // // console.log('📊 Primer ejercicio:', fitnessExercises[0])
          // // console.log('📊 Columnas disponibles en el primer ejercicio:', Object.keys(fitnessExercises[0]))
          // // console.log('📊 ¿Tiene video_url?:', 'video_url' in fitnessExercises[0])
          // // console.log('📊 Valor de video_url en primer ejercicio:', fitnessExercises[0].video_url)
        } else {
          console.log('⚠️ No se encontraron ejercicios en fitness_exercises')
        }
        
        // Convertir ejercicios a formato CSV
        const csvHeaders = [
          'Semana', 'Día', 'Nombre de la Actividad', 'Descripción', 
          'Duración (min)', 'Tipo de Ejercicio', 'Nivel de Intensidad', 
          'Equipo Necesario', '1RM', 'Detalle de Series (peso-repeticiones-series)', 'video_url', 'Video_File'
        ]
        
        const csvData = [csvHeaders]
        
        if (fitnessExercises && fitnessExercises.length > 0) {
          // // console.log('📊 Datos de fitness_exercises encontrados:', fitnessExercises.length, 'ejercicios')
          console.log('📊 Primer ejercicio:', fitnessExercises[0])
          // console.log('📊 Columnas nuevas del primer ejercicio:', fitnessExercises[0])
          
          fitnessExercises.forEach((exercise: any) => {
            csvData.push([
              exercise.semana?.toString() || '',
              exercise.día?.toString() || '',
              exercise.nombre_actividad || '',
              exercise.descripción || '',
              exercise.duracion_min?.toString() || '45', // Valor por defecto si está vacío
              exercise.tipo_ejercicio || '',
              exercise.nivel_intensidad || '',
              exercise.equipo_necesario || '',
              exercise.one_rm?.toString() || '100', // Valor por defecto si está vacío
              exercise.detalle_series || '[(50-10-3)]', // Valor por defecto si está vacío
              exercise.video_url || '',
              exercise.video_url || '' // Duplicar en Video_File para compatibilidad
            ])
          })
        }
        
        // Agregar datos CSV al producto
        product.csvData = csvData
        product.csvFileName = `fitness_program_${id}.csv`
        product.exercisesCount = fitnessExercises?.length || 0
        
        // Calcular total de sesiones (semanas únicas)
        if (fitnessExercises && fitnessExercises.length > 0) {
          const uniqueWeeks = new Set(fitnessExercises.map(ex => ex.semana))
          product.totalSessions = uniqueWeeks.size
          
          // Obtener el video del programa desde fitness_exercises
          const exerciseWithVideo = fitnessExercises.find(ex => ex.video_url && ex.video_url.trim())
          if (exerciseWithVideo) {
            console.log('🎥 Video del programa encontrado en fitness_exercises:', exerciseWithVideo.video_url)
            product.video_url = exerciseWithVideo.video_url
          } else {
            console.log('⚠️ No se encontró video del programa en fitness_exercises')
          }
        } else {
          product.totalSessions = 0
        }
        console.log('📤 CSV agregado al producto:', {
          csvDataLength: csvData.length,
          csvFileName: product.csvFileName,
          exercisesCount: product.exercisesCount,
          totalSessions: product.totalSessions,
          firstRow: csvData[0],
          secondRow: csvData[1]
        })
        
        // Log específico para verificar videos en el CSV
        if (csvData.length > 1) {
          console.log('🎥 === VERIFICANDO VIDEOS EN CSV ===')
          // // console.log('📊 Headers del CSV:', csvData[0])
          const videoUrlIndex = csvData[0]?.findIndex(header => header === 'video_url')
          const videoFileIndex = csvData[0]?.findIndex(header => header === 'Video_File')
          // // console.log('📊 Índice de video_url:', videoUrlIndex)
          // // console.log('📊 Índice de Video_File:', videoFileIndex)
          
          csvData.slice(1).forEach((row, index) => {
            const videoUrl = videoUrlIndex !== -1 ? row[videoUrlIndex] : ''
            const videoFile = videoFileIndex !== -1 ? row[videoFileIndex] : ''
            const exerciseName = row[2] // Nombre de la Actividad
            console.log(`  Fila ${index + 1} (${exerciseName}):`)
            console.log(`    - video_url: "${videoUrl}"`)
            console.log(`    - Video_File: "${videoFile}"`)
            console.log(`    - ¿Tiene video?: ${!!videoUrl}`)
            
            if (videoUrl) {
              // console.log(`    ✅ Tiene video: ${videoUrl}`)
            } else {
              console.log(`    ❌ Sin video`)
            }
          })
        }
      }
      
      // También verificar nutrition_program_details
      // console.log('🔍 Consultando tabla nutrition_program_details para activity_id:', id)
      const { data: nutritionDetails, error: nutritionError } = await supabase
        .from('nutrition_program_details')
        .select('*')
        .eq('activity_id', id)
        .order('semana', { ascending: true })
        .order('día', { ascending: true })

      if (nutritionError) {
        console.error('❌ Error obteniendo detalles de nutrición:', nutritionError)
      } else {
        // console.log(`✅ Obtenidos ${nutritionDetails?.length || 0} detalles de nutrición`)
        if (nutritionDetails && nutritionDetails.length > 0) {
          // // console.log('📊 Detalles de nutrición encontrados:', nutritionDetails.length)
          // // console.log('📊 Primer detalle:', nutritionDetails[0])
        } else {
          console.log('⚠️ No se encontraron detalles en nutrition_program_details')
        }
      }

      // Obtener datos de disponibilidad específicos del programa
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('activity_availability')
        .select('*')
        .eq('activity_id', id)
        .in('availability_type', ['until_stock', 'consult', 'program_dates', 'stock_management'])

      if (!availabilityError && availabilityData && availabilityData.length > 0) {
        // // console.log('📊 Datos de disponibilidad encontrados:', availabilityData.length, 'registros')
        
        // Buscar la configuración consolidada del programa
        const programConfig = availabilityData.find(config => 
          config.session_type === 'program_period' && 
          (config.availability_type === 'until_stock' || config.availability_type === 'consult')
        )
        
        if (programConfig) {
          // console.log('✅ Configuración consolidada encontrada:', programConfig)
          // console.log('🔍 Valores de stock en programConfig:', programConfig)
          product.startDate = programConfig.start_date
          product.endDate = programConfig.end_date
          product.availabilityType = programConfig.availability_type
          product.stockQuantity = programConfig.stock_quantity?.toString() || programConfig.available_slots?.toString() || ''
        } else {
          console.log('⚠️ No se encontró configuración consolidada, usando primer registro')
          const firstConfig = availabilityData[0]
          product.startDate = firstConfig.start_date
          product.endDate = firstConfig.end_date
          product.availabilityType = firstConfig.availability_type
          product.stockQuantity = firstConfig.stock_quantity?.toString() || ''
        }
      } else {
        console.log('⚠️ No se encontraron datos de disponibilidad')
      }
    }

    // console.log('✅ Producto obtenido exitosamente')
    console.log('📤 Datos del producto a enviar al frontend:', {
      id: product.id,
      title: product.title,
      type: product.type,
      startDate: product.startDate,
      endDate: product.endDate,
      availabilityType: product.availabilityType,
      stockQuantity: product.stockQuantity,
      csvDataLength: product.csvData?.length || 0,
      activityAvailabilityLength: product.activity_availability?.length || 0
    })
    
    // console.log('🔍 Datos completos de activity_availability:', product.activity_availability)

    // Manejar video (solo videos locales ahora)
    // console.log('🔍 === ANÁLISIS DE VIDEO ===')
    console.log('product.activity_media:', product.activity_media)
    console.log('product.video_url:', product.video_url)
    
    // Verificar todas las filas de activity_media para esta actividad
    if (product.activity_media && product.activity_media.length > 0) {
      // // console.log('📊 Filas encontradas en activity_media:')
      product.activity_media.forEach((media: any, index: number) => {
        console.log(`  Fila ${index + 1}:`, {
          id: media.id,
          activity_id: media.activity_id,
          image_url: media.image_url,
          video_url: media.video_url,
          vimeo_id: media.vimeo_id,
          created_at: media.created_at
        })
      })
    } else {
      console.log('❌ No se encontraron filas en activity_media')
    }
    
    const videoUrl = product.activity_media?.[0]?.video_url || product.video_url
    // console.log('🔍 Video URL final:', videoUrl)
    
    if (videoUrl) {
      // Siempre tratar como video local
      // console.log('✅ Video detectado, configurando como local')
      product.videoType = 'local'
      product.videoFile = {
        name: videoUrl.split('/').pop() || 'video.mp4',
        url: videoUrl,
        type: 'video/mp4'
      }
      console.log('📁 VideoFile configurado:', product.videoFile)
    } else {
      console.log('❌ No se encontró video URL')
    }

    console.log('📤 Producto final a enviar:', {
      id: product.id,
      title: product.title,
      videoType: product.videoType,
      videoFile: product.videoFile,
      videoUrl: product.videoUrl,
      activityMediaVideo: product.activity_media?.[0]?.video_url,
      activityMediaImage: product.activity_media?.[0]?.image_url,
      totalActivityMediaRows: product.activity_media?.length || 0
    })

    return NextResponse.json({ 
      success: true, 
      product: product 
    })

  } catch (error) {
    console.error('Error en GET /api/products/[id]:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

// Función para subir imagen a Supabase Storage
async function uploadImageToStorage(supabase: any, imageInfo: any, activityId: string): Promise<string> {
  try {
    // Si tiene un archivo real, subirlo a Supabase Storage
    if (imageInfo.file) {
      const timestamp = Date.now()
      const fileName = `${activityId}_${timestamp}_${imageInfo.name}`
      const filePath = `product-images/${fileName}`
      
      console.log(`📤 Subiendo archivo real a Supabase Storage: ${filePath}`)
      
      try {
        // Subir archivo a Supabase Storage usando el bucket de imágenes
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(filePath, imageInfo.file, {
            cacheControl: '3600',
            upsert: false
          })
        
        if (error) {
          console.error('❌ Error subiendo archivo a Storage:', error)
          throw error
        }
        
        // Obtener URL pública del archivo
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath)
        
        const imageUrl = urlData.publicUrl
        // // console.log(`✅ Archivo subido exitosamente: ${imageUrl}`)
        
        return imageUrl
      } catch (storageError) {
        console.error('❌ Error en Storage, usando fallback:', storageError)
        // Fallback: usar imagen de ejemplo
        const imageUrl = `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center&filename=${encodeURIComponent(fileName)}&timestamp=${timestamp}`
        return imageUrl
      }
    }
    
    // Si tiene información de archivo (name, type, size), es una nueva imagen
    if (imageInfo.name && imageInfo.type && imageInfo.size) {
      const timestamp = Date.now()
      const fileName = `${activityId}_${timestamp}_${imageInfo.name}`
      const filePath = `product-images/${fileName}`
      
      console.log(`📁 Procesando nueva imagen: ${fileName}`)
      console.log(`📁 Ruta del archivo: ${filePath}`)
      // console.log(`📊 Información del archivo:`, imageInfo)
      
      // Intentar subir el archivo real
      try {
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(filePath, imageInfo.file, {
            cacheControl: '3600',
            upsert: false
          })
        
        if (error) {
          console.error('❌ Error subiendo archivo a Storage:', error)
          throw error
        }
        
        // Obtener URL pública del archivo
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath)
        
        const imageUrl = urlData.publicUrl
        console.log(`✅ Archivo subido exitosamente: ${imageUrl}`)
        
        return imageUrl
      } catch (storageError) {
        console.error('❌ Error en Storage, usando fallback:', storageError)
        // Fallback: usar imagen de ejemplo
        const imageUrl = `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center&filename=${encodeURIComponent(fileName)}&timestamp=${timestamp}`
        return imageUrl
      }
    }
    
    // Si ya es una URL válida (no placeholder), la devolvemos tal como está
    if (imageInfo.url && !imageInfo.url.includes('via.placeholder.com')) {
      console.log(`Usando imagen existente: ${imageInfo.url}`)
      return imageInfo.url
    }
    
    // Fallback para casos donde no tenemos información completa
    const timestamp = Date.now()
    return `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center&timestamp=${timestamp}`
  } catch (error) {
    console.error('Error procesando imagen:', error)
    // Fallback en caso de error
    const timestamp = Date.now()
    return `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center&timestamp=${timestamp}`
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('=== INICIO DELETE PRODUCT ===')
    console.log('ID del producto a eliminar:', id)
    
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Usuario autenticado:', user?.email)
    
    if (authError || !user) {
      console.log('Error: No autorizado')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar perfil
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    console.log('Perfil:', userProfile?.role)

    if (profileError || !userProfile || userProfile.role !== 'coach') {
      console.log('Error: No es coach')
      return NextResponse.json({ error: 'Solo los coaches pueden eliminar productos' }, { status: 403 })
    }

    // Verificar que el producto existe y pertenece al coach
    const { data: existingProduct, error: fetchError } = await supabase
      .from('activities')
      .select('id, title, coach_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingProduct) {
      console.log('Error: Producto no encontrado')
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    if (existingProduct.coach_id !== user.id) {
      console.log('Error: No autorizado para eliminar este producto')
      return NextResponse.json({ error: 'No autorizado para eliminar este producto' }, { status: 403 })
    }

    // Eliminar el producto
    const { error: deleteError } = await supabase
      .from('activities')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error eliminando producto:', deleteError)
      return NextResponse.json({ 
        error: 'Error al eliminar el producto',
        details: deleteError.message 
      }, { status: 500 })
    }

    console.log('=== PRODUCTO ELIMINADO EXITOSAMENTE ===')
    console.log('ID eliminado:', id)

    return NextResponse.json({ 
      success: true,
      message: 'Producto eliminado exitosamente' 
    })

  } catch (error) {
    console.error('Error en DELETE /api/products/[id]:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('=== INICIO UPDATE PRODUCT ===')
    console.log('ID del producto a actualizar:', id)
    // console.log('🔄 Endpoint PUT ejecutándose para producto ID:', id)
    
    const cookieStore = await cookies()
    const supabase = createClient({ 
      cookies: () => cookieStore,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    })
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Usuario autenticado:', user?.email)
    
    if (authError || !user) {
      console.log('Error: No autorizado')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar perfil
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    console.log('Perfil:', userProfile?.role)

    if (profileError || !userProfile || userProfile.role !== 'coach') {
      console.log('Error: No es coach')
      return NextResponse.json({ error: 'Solo los coaches pueden actualizar productos' }, { status: 403 })
    }

    // Verificar que el producto existe y pertenece al coach
    const { data: existingProduct, error: fetchError } = await supabase
      .from('activities')
      .select('id, title, coach_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingProduct) {
      console.log('Error: Producto no encontrado')
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    if (existingProduct.coach_id !== user.id) {
      console.log('Error: No autorizado para actualizar este producto')
      return NextResponse.json({ error: 'No autorizado para actualizar este producto' }, { status: 403 })
    }

    // Obtener datos del producto
    let productData: any
    
    // Verificar si es FormData (archivo real) o JSON
    const contentType = request.headers.get('content-type') || ''
    
    if (contentType.includes('multipart/form-data')) {
      // Es FormData con archivo real
      const formData = await request.formData()
      const imageFile = formData.get('image') as File
      const dataString = formData.get('data') as string
      
      console.log('📁 Archivo recibido:', {
        name: imageFile?.name,
        type: imageFile?.type,
        size: imageFile?.size
      })
      
      productData = JSON.parse(dataString)
      productData.image = {
        name: imageFile?.name,
        type: imageFile?.type,
        size: imageFile?.size,
        lastModified: imageFile?.lastModified,
        file: imageFile // Archivo real
      }
      
      console.log('Datos recibidos para actualizar (con archivo real):', productData)
    } else {
      // Es JSON normal
      productData = await request.json()
      console.log('Datos recibidos para actualizar:', productData)
    }
    
    const {
      title,
      description,
      price,
      type,
      image,
      videoUrl,
      capacity,
      modality,
      blocks,
      startDate,
      endDate,
      availabilityType,
      stockQuantity,
      csvData,
      csvFileName
    } = productData

    // =====================================================
    // LOGGING DETALLADO DE DATOS RECIBIDOS
    // =====================================================
    console.log('=== DATOS RECIBIDOS PARA ACTUALIZACIÓN ===')
    console.log('Título:', title)
    console.log('Descripción:', description)
    console.log('Precio:', price)
    console.log('Tipo:', type)
    console.log('Capacidad:', capacity)
    console.log('Modalidad:', modality)
    console.log('Fecha de inicio:', startDate)
    console.log('Fecha de finalización:', endDate)
    console.log('Tipo de disponibilidad:', availabilityType)
    console.log('Cantidad de stock:', stockQuantity)
    console.log('Datos CSV:', csvData ? `${csvData.length} filas` : 'No hay datos CSV')
    console.log('Nombre archivo CSV:', csvFileName)
    console.log('Bloques:', blocks ? `${blocks.length} bloques` : 'No hay bloques')
    console.log('Video URL:', videoUrl)
    console.log('==========================================')
    // console.log('🔍 Verificando si es programa...')
    console.log('Tipo recibido:', type)
    console.log('¿Es igual a "program"?', type === 'program')
    console.log('¿Es igual a program?', type === 'program')
    console.log('Longitud del tipo:', type ? type.length : 'undefined')
    console.log('Código ASCII del tipo:', type ? type.split('').map(c => c.charCodeAt(0)) : 'undefined')

    // Manejar imagen y video en activity_media usando RPC
    if (image || videoUrl) {
      try {
        let imageUrl = null
        let videoUrlToSave = null
        let vimeoId = null
        
        // Procesar imagen
        if (image && typeof image === 'object') {
          if (image.file) {
            // Es un archivo real
            console.log('📁 Archivo real detectado:', image.name, image.type, image.size)
            imageUrl = await uploadImageToStorage(supabase, image, id)
            console.log('URL de imagen generada:', imageUrl)
          } else if (image.name && image.type && image.size) {
            // Es un objeto File-like (viene del frontend como objeto)
            console.log('Imagen detectada:', image.name, image.type, image.size)
            // Subir imagen a Storage
            imageUrl = await uploadImageToStorage(supabase, image, id)
            console.log('URL de imagen generada:', imageUrl)
          } else if (image.url) {
            // Es una imagen existente con URL
            imageUrl = image.url
            console.log('URL de imagen existente:', imageUrl)
          } else {
            console.log('Objeto de imagen no reconocido:', image)
          }
        }
        
        // Procesar video
        if (videoUrl) {
          videoUrlToSave = videoUrl
          vimeoId = extractVimeoId(videoUrl)
        }
        
        // Guardar en activity_media usando consultas directas
        try {
          console.log('💾 PRODUCTS-PUT: Guardando media en activity_media:', {
            activity_id: id,
            image_url: imageUrl,
            video_url: videoUrlToSave,
            vimeo_id: vimeoId
          })
          
          // Primero verificar si ya existe un registro
          const { data: existingMedia, error: fetchError } = await supabase
            .from('activity_media')
            .select('id')
            .eq('activity_id', id)
            .single()

          if (existingMedia) {
            console.log('🔄 PRODUCTS-PUT: Actualizando registro existente en activity_media')
            // Actualizar registro existente
            const { error: updateError } = await supabase
              .from('activity_media')
              .update({
                image_url: imageUrl,
                video_url: videoUrlToSave,
                vimeo_id: vimeoId
              })
              .eq('activity_id', id)

            if (updateError) {
              console.error('❌ PRODUCTS-PUT: Error actualizando activity_media:', updateError)
            } else {
              console.log('✅ PRODUCTS-PUT: Datos actualizados en activity_media exitosamente')
            }
          } else {
            console.log('➕ PRODUCTS-PUT: Creando nuevo registro en activity_media')
            // Crear nuevo registro
            const { error: insertError } = await supabase
              .from('activity_media')
              .insert({
                activity_id: id,
                image_url: imageUrl,
                video_url: videoUrlToSave,
                vimeo_id: vimeoId
              })

            if (insertError) {
              console.error('❌ PRODUCTS-PUT: Error insertando activity_media:', insertError)
            } else {
              console.log('✅ PRODUCTS-PUT: Datos insertados en activity_media exitosamente')
            }
          }
        } catch (error) {
          console.warn('⚠️ PRODUCTS-PUT: Error manejando activity_media:', error)
        }
      } catch (error) {
        console.warn('Error manejando activity_media:', error)
      }
    }

    // Validar datos requeridos
    if (!title || !description || !price || !type) {
      return NextResponse.json({ 
        error: 'Faltan campos requeridos' 
      }, { status: 400 })
    }

    // Preparar datos para actualizar
    const updateData = {
      title,
      description,
      type: type, // Mantener el tipo original (program, workshop, document)
      difficulty: 'beginner',
      price: parseFloat(price),
      capacity: capacity || 20,
      modality: modality || 'online',
      workshop_type: productData.workshopType || null,
      sessions_per_client: productData.sessionsPerClient ? parseInt(productData.sessionsPerClient) : null,
      updated_at: new Date().toISOString()
    }

    // Si hay bloques, actualizar en activity_availability
    if (blocks && blocks.length > 0) {
      console.log('Actualizando bloques de horario en activity_availability:', blocks.length)
      
      // Primero eliminar bloques existentes
      const { error: deleteError } = await supabase
        .from('activity_availability')
        .delete()
        .eq('activity_id', id)
      
      if (deleteError) {
        console.warn('Error eliminando bloques existentes:', deleteError)
      }
      
      // Insertar nuevos bloques
      const availabilityData = blocks.map((block: any) => ({
        activity_id: id,
        availability_type: 'workshop_block',
        session_type: 'scheduled',
        start_time: block.startTime,
        end_time: block.endTime,
        start_date: block.startDate,
        end_date: block.endDate,
        color: block.color,
        selected_dates: block.selectedDates,
        repeat_type: block.repeatType,
        selected_week_days: block.selectedWeekDays,
        selected_weeks: block.selectedWeeks,
        selected_months: block.selectedMonths
      }))
      
      const { error: insertError } = await supabase
        .from('activity_availability')
        .insert(availabilityData)
      
      if (insertError) {
        console.warn('Error insertando nuevos bloques:', insertError)
      } else {
        // console.log('✅ Bloques de horario actualizados exitosamente en activity_availability')
      }
    }

    console.log('Datos finales a actualizar:', updateData)

    // Actualizar el producto
    const { data: updatedProduct, error: updateError } = await supabase
      .from('activities')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error actualizando producto:', updateError)
      return NextResponse.json({ 
        error: 'Error al actualizar el producto',
        details: updateError.message 
      }, { status: 500 })
    }

    // Por ahora, no manejamos activity_media para evitar problemas de RLS
    // TODO: Implementar manejo de imágenes y videos cuando se resuelvan los problemas de RLS
    console.log('Video URL recibida:', videoUrl)

    // =====================================================
    // PROCESAMIENTO DE CSV PARA PROGRAMAS
    // =====================================================
    
    console.log('=== VERIFICANDO TIPO DE PRODUCTO ===')
    console.log('Tipo recibido:', type)
    console.log('¿Es programa?', type === 'program')
    console.log('Datos CSV disponibles:', !!csvData)
    console.log('Longitud CSV:', csvData ? csvData.length : 0)
    console.log('Nombre archivo CSV:', csvFileName)
    console.log('Fecha de inicio:', startDate)
    console.log('Fecha de finalización:', endDate)
    console.log('Tipo de disponibilidad:', availabilityType)
    console.log('Cantidad de stock:', stockQuantity)
    console.log('🚨 ANTES DE LA CONDICIÓN: type === "program"')
    console.log('🚨 Valor de type:', JSON.stringify(type))
    console.log('🚨 Comparación exacta:', type === 'program')
    
    if (type === 'program') {
      // console.log('✅ INICIANDO PROCESAMIENTO DE PROGRAMA')
      console.log('Datos CSV disponibles:', !!csvData)
      console.log('Longitud CSV:', csvData ? csvData.length : 0)
      console.log('Nombre archivo CSV:', csvFileName)
      
      // Procesar CSV si existe
      console.log('=== VERIFICANDO CSV ===')
      console.log('csvData existe:', !!csvData)
      console.log('csvData es array:', Array.isArray(csvData))
      console.log('csvData longitud:', csvData ? csvData.length : 'N/A')
      
      if (csvData && csvData.length > 0) {
        // console.log('✅ CSV VÁLIDO DETECTADO')
        console.log('Procesando CSV del programa:', csvData.length, 'filas')
        console.log('Nombre del archivo CSV:', csvFileName)
        console.log('Primera fila (headers):', csvData[0])
        console.log('Segunda fila (ejemplo):', csvData[1])
        
        // Determinar el tipo de programa basado en los headers del CSV
        const headers = csvData[0]
        let programType = 'fitness' // por defecto
        
        if (headers.includes('Comida') || headers.includes('comida')) {
          programType = 'nutrition'
        } else if (headers.includes('Comida') && (headers.includes('Semana') || headers.includes('Día'))) {
          programType = 'mixto'
        }
        
        console.log('Tipo de programa detectado:', programType)
        console.log('Headers del CSV:', headers)
        
        // Eliminar datos existentes de fitness_exercises y nutrition_program_details
        console.log('🗑️ Eliminando datos existentes...')
        
        const { error: deleteFitnessError } = await supabase
          .from('fitness_exercises')
          .delete()
          .eq('activity_id', id)
        
        if (deleteFitnessError) {
          console.warn('Error eliminando ejercicios existentes:', deleteFitnessError)
        } else {
          // console.log('✅ Ejercicios existentes eliminados')
        }
        
        const { error: deleteNutritionError } = await supabase
          .from('nutrition_program_details')
          .delete()
          .eq('activity_id', id)
        
        if (deleteNutritionError) {
          console.warn('Error eliminando detalles de nutrición existentes:', deleteNutritionError)
        } else {
          // console.log('✅ Detalles de nutrición existentes eliminados')
        }
        
        // Insertar ejercicios de fitness si es fitness o mixto
        if (programType === 'fitness' || programType === 'mixto') {
          console.log('Procesando ejercicios de fitness...')
          
                      const fitnessExercises = csvData.slice(1).map((row: string[], index: number) => {
              console.log(`Procesando fila ${index + 1}:`, row)
              
              return {
                activity_id: id,
              coach_id: user.id,
              client_id: null, // Para programas, no necesitamos client_id específico
              semana: parseInt(row[0]) || 1,
              día: parseInt(row[1]) || 1,
              nombre_actividad: row[2] || '',
              descripción: row[3] || '',
              tipo_ejercicio: row[5] || '',
              nivel_intensidad: row[6] || '',
              equipo_necesario: row[7] || '',
              video_url: row[10] || null,
              scheduled_date: new Date().toISOString().split('T')[0],
              completed: false
            }
          })
          
          console.log('Ejercicios de fitness a insertar:', fitnessExercises.length)
          
          if (fitnessExercises.length > 0) {
            // console.log('🔄 INSERTANDO EJERCICIOS DE FITNESS...')
            console.log('Cantidad a insertar:', fitnessExercises.length)
            console.log('Primer ejercicio:', fitnessExercises[0])
            
            const { data: fitnessData, error: fitnessError } = await supabase
              .from('fitness_exercises')
              .insert(fitnessExercises)
              .select()
            
            if (fitnessError) {
              console.error('❌ Error guardando ejercicios de fitness:', fitnessError)
              console.error('Detalles del error:', fitnessError.message)
              
              // Si el error es por client_id, intentar sin ese campo
              if (fitnessError.message.includes('client_id')) {
                // console.log('🔄 Intentando insertar sin client_id...')
                
                const fitnessExercisesWithoutClient = fitnessExercises.map(exercise => {
                  const { client_id, ...exerciseWithoutClient } = exercise
                  return exerciseWithoutClient
                })
                
                const { data: fitnessDataRetry, error: fitnessErrorRetry } = await supabase
                  .from('fitness_exercises')
                  .insert(fitnessExercisesWithoutClient)
                  .select()
                
                if (fitnessErrorRetry) {
                  console.error('❌ Error persistente guardando ejercicios de fitness:', fitnessErrorRetry)
                } else {
                  // console.log('✅ Ejercicios de fitness guardados exitosamente (sin client_id):', fitnessExercisesWithoutClient.length)
                  console.log('Datos insertados:', fitnessDataRetry)
                }
              }
            } else {
              // console.log('✅ Ejercicios de fitness guardados exitosamente en fitness_exercises:', fitnessExercises.length)
              console.log('Datos insertados:', fitnessData)
            }
          } else {
            console.log('⚠️ No hay ejercicios de fitness para insertar')
          }
        }
        
        // Insertar detalles de nutrición si es nutrition o mixto
        if (programType === 'nutrition' || programType === 'mixto') {
          console.log('Procesando detalles de nutrición...')
          
          const nutritionDetails = csvData.slice(1).map((row: string[], index: number) => {
            console.log(`Procesando fila nutrición ${index + 1}:`, row)
            
            return {
              activity_id: id,
              coach_id: user.id,
              semana: parseInt(row[0]) || 1,
              día: parseInt(row[1]) || 1,
              comida: row[2] || '',
              nombre: row[3] || '',
              calorías: parseFloat(row[4]) || 0,
              proteínas: parseFloat(row[5]) || 0,
              carbohidratos: parseFloat(row[6]) || 0,
              peso: row[7] || '',
              receta: row[8] || '',
              video_url: row[9] || null,
              scheduled_date: new Date().toISOString().split('T')[0],
              completed: false
            }
          })
          
          console.log('Detalles de nutrición a insertar:', nutritionDetails.length)
          
          if (nutritionDetails.length > 0) {
            const { data: nutritionData, error: nutritionError } = await supabase
              .from('nutrition_program_details')
              .insert(nutritionDetails)
              .select()
            
            if (nutritionError) {
              console.error('❌ Error guardando detalles de nutrición:', nutritionError)
            } else {
              // console.log('✅ Detalles de nutrición guardados exitosamente:', nutritionDetails.length)
              console.log('Datos insertados:', nutritionData)
            }
          }
        }
        
        // Guardar configuración del programa en activity_availability (una sola línea)
        // console.log('📅 Guardando configuración del programa...')
        console.log('Fecha de inicio:', startDate)
        console.log('Fecha de finalización:', endDate)
        console.log('Tipo de disponibilidad:', availabilityType)
        console.log('Cantidad de stock:', stockQuantity)
        // console.log('🔄 Procesando programa ID:', id)
        
        // Buscar si ya existe una configuración para este programa
        // console.log('🔍 Buscando configuración existente del programa...')
        const { data: existingConfig, error: findError } = await supabase
          .from('activity_availability')
          .select('*')
          .eq('activity_id', id)
          .limit(1)
        
        if (findError) {
          console.warn('Error buscando configuración existente:', findError)
        } else {
          console.log('Configuración existente encontrada:', existingConfig?.length || 0, 'registros')
        }
        
        // Si existe alguna configuración, eliminarla primero para evitar duplicados
        if (existingConfig && existingConfig.length > 0) {
          console.log('🗑️ Eliminando configuración existente para evitar duplicados...')
          const { error: deleteError } = await supabase
            .from('activity_availability')
            .delete()
            .eq('activity_id', id)
          
          if (deleteError) {
            console.warn('Error eliminando configuración existente:', deleteError)
          } else {
            // console.log('✅ Configuración existente eliminada')
          }
        }
        
        // Preparar la configuración del programa
        const mainConfig = {
          activity_id: id,
          availability_type: availabilityType || 'consult', // 'until_stock' o 'consult'
          session_type: 'program_period',
          start_date: startDate || null,
          end_date: endDate || null,
          stock_quantity: availabilityType === 'until_stock' ? parseInt(stockQuantity) : null,
          available_slots: availabilityType === 'until_stock' ? parseInt(stockQuantity) : null,
          color: availabilityType === 'until_stock' ? 'bg-red-500' : 'bg-blue-500',
          created_at: new Date().toISOString()
        }
        
        // Crear nueva configuración del programa
        console.log('➕ Creando configuración del programa')
        console.log('📝 Datos a insertar:', mainConfig)
        
        const { data: programData, error: programError } = await supabase
          .from('activity_availability')
          .insert(mainConfig)
          .select()
        
        if (programError) {
          console.error('❌ Error creando configuración del programa:', programError)
          console.error('Detalles del error:', programError.message)
        } else {
          // console.log('✅ Configuración del programa creada exitosamente')
          console.log('Datos finales:', programData)
        }
        
        if (programError) {
          console.error('❌ Error guardando configuración del programa:', programError)
          console.error('Detalles del error:', programError.message)
        } else {
          // console.log('✅ Configuración del programa guardada exitosamente')
          console.log('Datos insertados:', programData)
        }
        
        // Extraer y guardar materiales únicos del CSV
        console.log('🏷️ Extrayendo materiales únicos del CSV...')
        
        // Eliminar tags existentes
        const { error: deleteTagsError } = await supabase
          .from('activity_tags')
          .delete()
          .eq('activity_id', id)
          .eq('tag_type', 'material')
        
        if (deleteTagsError) {
          console.warn('Error eliminando tags existentes:', deleteTagsError)
        }
        
        // Extraer materiales únicos de la columna "Equipo Necesario" (índice 7)
        const uniqueMaterials = new Set<string>()
        csvData.slice(1).forEach((row: string[]) => {
          if (row[7] && row[7].trim() && row[7].trim() !== 'Ninguno') {
            uniqueMaterials.add(row[7].trim())
          }
        })
        
        console.log('Materiales únicos encontrados:', Array.from(uniqueMaterials))
        
        if (uniqueMaterials.size > 0) {
          // Insertar nuevos tags
          const materialTagData = Array.from(uniqueMaterials).map((material: string) => ({
            activity_id: id,
            tag_value: material,
            tag_type: 'material'
          }))
          
          const { error: tagsError } = await supabase
            .from('activity_tags')
            .insert(materialTagData)
          
          if (tagsError) {
            console.warn('Error guardando tags de materiales:', tagsError)
          } else {
            // console.log('✅ Tags de materiales guardados exitosamente:', uniqueMaterials.size)
          }
        } else {
          console.log('⚠️ No se encontraron materiales únicos en el CSV')
        }
      } else {
        console.log('⚠️ No hay datos CSV para procesar')
      }
    } else {
      console.log('❌ NO ES PROGRAMA - Tipo detectado:', type)
      console.log('❌ Saltando procesamiento de CSV')
    }

    console.log('=== PRODUCTO ACTUALIZADO EXITOSAMENTE ===')
    console.log('ID actualizado:', id)
    // console.log('🏁 FINALIZANDO ENDPOINT PUT')

    return NextResponse.json({ 
      success: true, 
      product: updatedProduct,
      message: 'Producto actualizado exitosamente' 
    })

  } catch (error) {
    console.error('Error en PUT /api/products/[id]:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}




