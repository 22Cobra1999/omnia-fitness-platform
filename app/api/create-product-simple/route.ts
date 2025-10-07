import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const productData = await request.json()
    
    // 🔄 LOG ESPECÍFICO PARA REPETIR ACTIVIDAD
    console.log('🔄 REPETIR ACTIVIDAD - Datos recibidos:', {
      editingProductId: productData.editingProductId,
      isRepeating: !!productData.isRepeating,
      repeatCount: productData.repeatCount,
      periods: productData.periods,
      weeklySchedule: productData.weeklySchedule
    })
    
    // Validar campos requeridos
    const requiredFields = ['title', 'description', 'price', 'type', 'categoria', 'coach_id']
    const missingFields = requiredFields.filter(field => !productData[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json({ 
        success: false,
        error: `Faltan campos: ${missingFields.join(', ')}`
      }, { status: 400 })
    }
    
    let activity
    
    // Verificar si es edición o creación
    if (productData.editingProductId) {
      console.log('🔄 EDITANDO PRODUCTO:', productData.editingProductId)
      
      // Actualizar producto existente
      const productUpdate = {
        title: productData.title,
        description: productData.description,
        type: productData.type,
        categoria: productData.categoria,
        difficulty: productData.difficulty || 'beginner',
        is_public: productData.is_public !== false,
        price: parseFloat(productData.price),
        capacity: productData.capacity || 20,
        modality: productData.modality || 'online',
        workshop_type: null,
        sessions_per_client: null,
        updated_at: new Date().toISOString()
      }
      
      const { data: updatedActivity, error: updateError } = await supabase
        .from('activities')
        .update(productUpdate)
        .eq('id', productData.editingProductId)
        .select()
        .single()
      
      if (updateError) {
        console.error('❌ Error actualizando producto:', updateError)
        return NextResponse.json({ 
          success: false,
          error: 'Error actualizando producto',
          details: updateError.message
        }, { status: 500 })
      }
      
      activity = updatedActivity

      // Imagen de portada en activity_media (upsert)
      if (productData.image_url && typeof productData.image_url === 'string') {
        const { data: existingMedia } = await supabase
          .from('activity_media')
          .select('id')
          .eq('activity_id', productData.editingProductId)
          .single()

        if (existingMedia?.id) {
          const { error: updateError } = await supabase
            .from('activity_media')
            .update({ image_url: productData.image_url })
            .eq('id', existingMedia.id)
          
          if (updateError) {
            console.error('❌ Error actualizando media:', updateError)
          }
        } else {
          const { error: insertError } = await supabase
            .from('activity_media')
            .insert({ activity_id: productData.editingProductId, image_url: productData.image_url })
          
          if (insertError) {
            console.error('❌ Error insertando media:', insertError)
          }
        }
      }

      // Procesar video si existe
      if (productData.video_url && typeof productData.video_url === 'string') {
        const { data: existingMedia } = await supabase
          .from('activity_media')
          .select('id')
          .eq('activity_id', productData.editingProductId)
          .single()

        if (existingMedia?.id) {
          const { error: updateError } = await supabase
            .from('activity_media')
            .update({ video_url: productData.video_url })
            .eq('id', existingMedia.id)
          
          if (updateError) {
            console.error('❌ Error actualizando video:', updateError)
          }
        } else {
          const { error: insertError } = await supabase
            .from('activity_media')
            .insert({ activity_id: productData.editingProductId, video_url: productData.video_url })
          
          if (insertError) {
            console.error('❌ Error insertando video:', insertError)
          }
        }
      }
      
    } else {
      // Crear producto nuevo
      const productInsert = {
        coach_id: productData.coach_id,
        title: productData.title,
        description: productData.description,
        type: productData.type,
        categoria: productData.categoria,
        difficulty: productData.difficulty || 'beginner',
        is_public: productData.is_public !== false,
        price: parseFloat(productData.price),
        capacity: productData.capacity || 20,
        modality: productData.modality || 'online',
        workshop_type: null,
        sessions_per_client: null
      }
      
      const { data: newActivity, error: insertError } = await supabase
        .from('activities')
        .insert(productInsert)
        .select()
        .single()
      
      if (insertError) {
        console.error('❌ Error creando producto:', insertError)
        return NextResponse.json({ 
          success: false,
          error: 'Error creando producto',
          details: insertError.message 
        }, { status: 500 })
      }
      
      activity = newActivity

      // Imagen de portada en activity_media (insert si viene)
      if (productData.image_url && typeof productData.image_url === 'string') {
        await supabase
          .from('activity_media')
          .insert({ activity_id: activity.id, image_url: productData.image_url })
      }
    }
    
    // Procesar CSV de forma simple
    
    // Verificar si hay información de eliminación
    let deletedRows = Array.isArray(productData.deletedRows) ? productData.deletedRows : []
    let csvDataToProcess = productData.csvData || []
    
    if (productData.csvData && productData.csvData.length > 0) {
      // Verificar si el último elemento tiene _deletedRows
      const lastItem = productData.csvData[productData.csvData.length - 1]
      if (lastItem && typeof lastItem === 'object' && '_deletedRows' in lastItem) {
        const fromCsvMarker = Array.isArray(lastItem._deletedRows) ? lastItem._deletedRows : []
        const merged = new Set([...(deletedRows || []), ...fromCsvMarker])
        deletedRows = Array.from(merged)
        csvDataToProcess = productData.csvData.filter(item => !item._deletedRows)
      }
    }
    
    // Eliminar filas de la base de datos incluso si csvData está vacío
    if (deletedRows && deletedRows.length > 0) {
      const { error: deleteError } = await supabase
        .from('ejercicios_detalles')
        .delete()
        .eq('activity_id', activity.id)
        .in('id', deletedRows)
      if (deleteError) {
        console.error('❌ Error eliminando filas:', deleteError)
      }
    }
    
    if (csvDataToProcess && csvDataToProcess.length > 0) {
      const csvData = csvDataToProcess // Solo ejercicios no eliminados
      
      for (let i = 0; i < csvData.length; i++) {
        const ejercicio = csvData[i]
        
        // Si el ejercicio ya tiene un ID (es existente), solo actualizar
        if (ejercicio.id && (ejercicio.isExisting === true || ejercicio.isExisting === 'true')) {
          
          const ejercicioData = {
            nombre_ejercicio: ejercicio['Nombre de la Actividad'] || `Ejercicio ${i + 1}`,
            descripcion: ejercicio['Descripción'] || '',
            tipo: 'fuerza',
            equipo: ejercicio['Equipo Necesario'] || '',
            body_parts: ejercicio['Partes del Cuerpo'] || '',
            calorias: parseInt(ejercicio['Calorías']) || 0,
            intensidad: null,
            duracion_min: parseInt(ejercicio['Duración (min)']) || null,
            detalle_series: ejercicio['Detalle de Series (peso-repeticiones-series)'] || null,
            updated_at: new Date().toISOString()
          }
          
          const { data: ejercicioUpdated, error: ejercicioError } = await supabase
            .from('ejercicios_detalles')
            .update(ejercicioData)
            .eq('id', ejercicio.id)
            .select()
            .single()
          
          if (ejercicioError) {
            console.error(`❌ Error actualizando ejercicio ${i + 1}:`, ejercicioError)
          }
        } else {
          // Crear nuevo ejercicio solo si no existe
          const ejercicioData = {
            activity_id: activity.id,
            nombre_ejercicio: ejercicio['Nombre de la Actividad'] || `Ejercicio ${i + 1}`,
            descripcion: ejercicio['Descripción'] || '',
            tipo: 'fuerza',
            equipo: ejercicio['Equipo Necesario'] || '',
            body_parts: ejercicio['Partes del Cuerpo'] || '',
            calorias: parseInt(ejercicio['Calorías']) || 0,
            intensidad: null,
            duracion_min: parseInt(ejercicio['Duración (min)']) || null,
            detalle_series: ejercicio['Detalle de Series (peso-repeticiones-series)'] || null,
            video_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          const { data: ejercicioInserted, error: ejercicioError } = await supabase
            .from('ejercicios_detalles')
            .insert(ejercicioData)
            .select()
            .single()
          
          if (ejercicioError) {
            console.error(`❌ Error guardando ejercicio ${i + 1}:`, ejercicioError)
          }
        }
      }
    }
    
    // Guardar planificación semanal si existe
    if (productData.weeklySchedule && Object.keys(productData.weeklySchedule).length > 0) {
      // Eliminar planificación anterior si existe
      const { error: deleteError } = await supabase
        .from('planificacion_ejercicios')
        .delete()
        .eq('actividad_id', activity.id)
      
      if (deleteError) {
        console.error('❌ Error eliminando planificación anterior:', deleteError)
      }
      
      // Crear registros de planificación - SOLO SEMANAS BASE (NO RÉPLICAS)
      const planificacionRecords: any[] = []
      
      // Obtener períodos del frontend (si no se envía, usar 1 por defecto)
      const periods = productData.periods || 1
      
      // 🔄 LOG ESPECÍFICO PARA PERÍODOS
      console.log('🔄 PERÍODOS - Datos recibidos:', {
        periodsFromFrontend: productData.periods,
        periodsCalculated: periods,
        isRepeating: !!productData.isRepeating,
        repeatCount: productData.repeatCount
      })
      
      // Obtener semanas base del schedule
      const semanasBase = Object.keys(productData.weeklySchedule).map(Number).sort()
      
      // Crear UNA FILA POR CADA SEMANA BASE (sin réplicas)
      semanasBase.forEach(semanaBase => {
        const dias = productData.weeklySchedule[semanaBase.toString()]
        
        const semanaRecord = {
          actividad_id: activity.id,
          numero_semana: semanaBase,
          lunes: '',
          martes: '',
          miercoles: '',
          jueves: '',
          viernes: '',
          sabado: '',
          domingo: ''
        }
        
        // Mapear días de la semana
        const diasSemana = {
          '1': 'lunes',
          '2': 'martes', 
          '3': 'miercoles',
          '4': 'jueves',
          '5': 'viernes',
          '6': 'sabado',
          '7': 'domingo'
        }
        
        for (const [dia, ejercicios] of Object.entries(dias)) {
          // Manejar tanto arrays directos como objetos con estructura de bloques
          let ejerciciosArray: any[] = []
          
          if (Array.isArray(ejercicios)) {
            ejerciciosArray = ejercicios
          } else if (ejercicios && typeof ejercicios === 'object' && 'exercises' in ejercicios) {
            ejerciciosArray = (ejercicios as any).exercises
          }
          
          // Crear estructura de bloques con información completa
          const bloquesEjercicios: { [key: number]: any[] } = {}
          
          for (let index = 0; index < ejerciciosArray.length; index++) {
            const ejercicio = ejerciciosArray[index]
            let ejercicioId = null
            let bloque = 1
            
            if (typeof ejercicio === 'object' && ejercicio !== null) {
              // Buscar el ID real del ejercicio por nombre, no por ID temporal
              const nombre = ejercicio.name || ejercicio['Nombre de la Actividad'] || ejercicio.nombre
              
              if (nombre) {
                // Buscar en ejercicios existentes por nombre para obtener el ID real
                const ejercicioExistente = csvDataToProcess.find((ej: any) => 
                  (ej['Nombre de la Actividad'] || ej.nombre) === nombre
                )
                
                if (ejercicioExistente && ejercicioExistente.id) {
                  // Solo usar IDs numéricos (reales), no IDs temporales como "exercise-0"
                  if (typeof ejercicioExistente.id === 'number' || 
                      (typeof ejercicioExistente.id === 'string' && !isNaN(parseInt(ejercicioExistente.id)))) {
                    ejercicioId = ejercicioExistente.id
                    bloque = ejercicio.block || 1
                  } else {
                    // Si es un ID temporal, no procesarlo ya que no tenemos el ID real
                    // Los datos del backend ya fueron corregidos anteriormente
                    continue
                  }
                }
              }
            } else if (typeof ejercicio === 'string') {
              // Si es un string, asumir que es un ID
              ejercicioId = ejercicio
              bloque = 1
            }
            
            if (ejercicioId) {
              if (!bloquesEjercicios[bloque]) {
                bloquesEjercicios[bloque] = []
              }
              bloquesEjercicios[bloque].push({
                id: ejercicioId,
                orden: index + 1
              })
            }
          }
          
          // Convertir a JSON string para almacenar la estructura de bloques
          const ejerciciosString = JSON.stringify(bloquesEjercicios)
          
          // Asignar a la columna correspondiente del día
          const nombreDia = diasSemana[dia as keyof typeof diasSemana]
          if (nombreDia) {
            semanaRecord[nombreDia as keyof typeof semanaRecord] = ejerciciosString
          }
        }
        
        planificacionRecords.push(semanaRecord)
      })
      
      if (planificacionRecords.length > 0) {
        const { data: planificacionInserted, error: planificacionError } = await supabase
          .from('planificacion_ejercicios')
          .insert(planificacionRecords)
          .select()
        
        if (planificacionError) {
          console.error('❌ Error guardando planificación:', planificacionError)
        }
        
        // Guardar información de períodos en tabla periodos
        console.log('🔄 GUARDANDO PERÍODOS - Antes de eliminar anteriores:', {
          activityId: activity.id,
          periodsToSave: periods
        })
        
        // Eliminar registros anteriores de períodos para esta actividad
        const { error: deletePeriodosError } = await supabase
          .from('periodos')
          .delete()
          .eq('actividad_id', activity.id)
        
        if (deletePeriodosError) {
          console.error('❌ Error eliminando períodos anteriores:', deletePeriodosError)
        } else {
          console.log('✅ Períodos anteriores eliminados correctamente')
        }
        
        // Crear registro de períodos
        const periodoRecord = {
          actividad_id: activity.id,
          cantidad_periodos: periods
        }
        
        console.log('🔄 GUARDANDO PERÍODOS - Registro a insertar:', periodoRecord)
        
        const { data: periodoInserted, error: periodoError } = await supabase
          .from('periodos')
          .insert(periodoRecord)
          .select()
        
        if (periodoError) {
          console.error('❌ Error guardando períodos:', periodoError)
        } else {
          console.log('✅ Períodos guardados exitosamente:', periodoInserted)
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      product: activity,
      message: 'Producto creado exitosamente'
    })
    
  } catch (error) {
    console.error('❌ Error general:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

        const ejercicioData = {
          activity_id: activity.id,
          nombre_ejercicio: ejercicio['Nombre de la Actividad'] || `Ejercicio ${i + 1}`,
          descripcion: ejercicio['Descripción'] || '',
          tipo: 'fuerza', // Valor fijo para evitar constraint
          equipo: ejercicio['Equipo Necesario'] || '',
          body_parts: ejercicio['Partes del Cuerpo'] || '',
          calorias: parseInt(ejercicio['Calorías']) || 0,
          intensidad: null, // Usar null para evitar constraint
          duracion_min: parseInt(ejercicio['Duración (min)']) || null,
          detalle_series: ejercicio['Detalle de Series (peso-repeticiones-series)'] || null,
          video_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        logs.push(`💾 API SIMPLE: Datos del ejercicio ${i + 1}: ${JSON.stringify(ejercicioData)}`)
        logs.push(`💾 API SIMPLE: Guardando ejercicio ${i + 1}...`)
        console.log(`💾 API SIMPLE: Datos del ejercicio ${i + 1}:`, ejercicioData)
        console.log(`💾 API SIMPLE: Guardando ejercicio ${i + 1}...`)
        
        const { data: ejercicioInserted, error: ejercicioError } = await supabase
          .from('ejercicios_detalles')
          .insert(ejercicioData)
          .select()
                  .single()
        
        if (ejercicioError) {
          logs.push(`❌ API SIMPLE: Error guardando ejercicio ${i + 1}: ${ejercicioError.message}`)
          logs.push(`❌ API SIMPLE: Error code: ${ejercicioError.code}`)
          console.error(`❌ API SIMPLE: Error guardando ejercicio ${i + 1}:`, ejercicioError)
          console.error(`❌ API SIMPLE: Error details:`, ejercicioError.message)
          console.error(`❌ API SIMPLE: Error code:`, ejercicioError.code)
        } else {
          logs.push(`✅ API SIMPLE: Ejercicio ${i + 1} guardado: ${JSON.stringify(ejercicioInserted)}`)
          console.log(`✅ API SIMPLE: Ejercicio ${i + 1} guardado:`, ejercicioInserted)
        }
      }
    }
    
    // Guardar planificación semanal si existe
    if (productData.weeklySchedule && Object.keys(productData.weeklySchedule).length > 0) {
      logs.push(`📅 API SIMPLE: Guardando planificación semanal...`)
      console.log('📅 API SIMPLE: Guardando planificación semanal...')
      
      try {
        // Eliminar planificación anterior si existe
        const { error: deleteError } = await supabase
          .from('planificacion_ejercicios')
          .delete()
          .eq('actividad_id', activity.id)
        
        if (deleteError) {
          logs.push(`⚠️ API SIMPLE: Error eliminando planificación anterior: ${deleteError.message}`)
          console.log('⚠️ API SIMPLE: Error eliminando planificación anterior:', deleteError)
        } else {
          logs.push(`✅ API SIMPLE: Planificación anterior eliminada`)
          console.log('✅ API SIMPLE: Planificación anterior eliminada')
        }
        
        // Crear registros de planificación - SOLO SEMANAS BASE (NO RÉPLICAS)
        const planificacionRecords = []
        
        // Obtener períodos del frontend (si no se envía, usar 1 por defecto)
        const periods = productData.periods || 1
        logs.push(`📅 API SIMPLE: Períodos a replicar: ${periods}`)
        console.log(`📅 API SIMPLE: Períodos a replicar: ${periods}`)
        
        // Obtener semanas base del schedule
        const semanasBase = Object.keys(productData.weeklySchedule).map(Number).sort()
        
        logs.push(`📅 API SIMPLE: Semanas base: ${semanasBase.join(', ')}`)
        logs.push(`📅 API SIMPLE: Solo guardando semanas base (no réplicas)`)
        console.log(`📅 API SIMPLE: Semanas base:`, semanasBase)
        console.log(`📅 API SIMPLE: Solo guardando semanas base (no réplicas)`)
        
        // Crear UNA FILA POR CADA SEMANA BASE (sin réplicas)
        semanasBase.forEach(semanaBase => {
          const dias = productData.weeklySchedule[semanaBase.toString()]
          
          logs.push(`📅 API SIMPLE: Creando semana base ${semanaBase}`)
          console.log(`📅 API SIMPLE: Creando semana base ${semanaBase}`)
          
          const semanaRecord = {
            actividad_id: activity.id,
            numero_semana: semanaBase,
            lunes: '',
            martes: '',
            miercoles: '',
            jueves: '',
            viernes: '',
            sabado: '',
            domingo: ''
          }
          
          // Mapear días de la semana
          const diasSemana = {
            '1': 'lunes',
            '2': 'martes', 
            '3': 'miercoles',
            '4': 'jueves',
            '5': 'viernes',
            '6': 'sabado',
            '7': 'domingo'
          }
          
          Object.entries(dias).forEach(([dia, ejercicios]) => {
            logs.push(`📅 API SIMPLE: Procesando día ${dia} con ${ejercicios.length} ejercicios`)
            console.log(`📅 API SIMPLE: Procesando día ${dia}:`, ejercicios)
            
            // Obtener IDs de ejercicios en lugar de nombres
            const ejercicioIds = ejercicios.map(ejercicio => {
              if (typeof ejercicio === 'object' && ejercicio !== null) {
                // Si es un objeto con ID, usar ese ID
                if (ejercicio.id) {
                  return ejercicio.id
                }
                // Si es un objeto con nombre, buscar el ID correspondiente
                const nombre = ejercicio.name || ejercicio['Nombre de la Actividad'] || ejercicio.nombre
                if (nombre) {
                  // Buscar en ejercicios existentes por nombre
                  const ejercicioExistente = csvDataToProcess.find(ej => 
                    (ej['Nombre de la Actividad'] || ej.nombre) === nombre
                  )
                  return ejercicioExistente ? ejercicioExistente.id : null
                }
              }
              return null
            }).filter(id => id !== null)
            
            // Convertir IDs a string separado por comas
            const ejerciciosString = ejercicioIds.join(', ')
            
            // Asignar a la columna correspondiente del día
            const nombreDia = diasSemana[dia]
            if (nombreDia) {
              semanaRecord[nombreDia] = ejerciciosString
              console.log(`📅 API SIMPLE: Asignado a ${nombreDia} (semana base ${semanaBase}): ${ejerciciosString}`)
            }
          })
          
          planificacionRecords.push(semanaRecord)
          console.log(`📅 API SIMPLE: Registro de semana base ${semanaBase} creado:`, semanaRecord)
        })
        
        logs.push(`📅 API SIMPLE: Total de registros a insertar: ${planificacionRecords.length}`)
        console.log(`📅 API SIMPLE: Total de registros a insertar:`, planificacionRecords.length)
        console.log(`📅 API SIMPLE: Registros:`, planificacionRecords)
        
        if (planificacionRecords.length > 0) {
          const { data: planificacionInserted, error: planificacionError } = await supabase
            .from('planificacion_ejercicios')
            .insert(planificacionRecords)
            .select()
          
          if (planificacionError) {
            logs.push(`❌ API SIMPLE: Error guardando planificación: ${planificacionError.message}`)
            console.error('❌ API SIMPLE: Error guardando planificación:', planificacionError)
          } else {
            logs.push(`✅ API SIMPLE: Planificación guardada exitosamente: ${planificacionInserted.length} registros`)
            console.log('✅ API SIMPLE: Planificación guardada exitosamente:', planificacionInserted)
            
            // Guardar información de períodos en tabla periodos (SIEMPRE)
            logs.push(`📅 API SIMPLE: Guardando información de períodos...`)
            console.log('📅 API SIMPLE: Guardando información de períodos...')
            
            // Eliminar registros anteriores de períodos para esta actividad
            const { error: deletePeriodosError } = await supabase
              .from('periodos')
              .delete()
              .eq('actividad_id', activity.id)
            
            if (deletePeriodosError) {
              logs.push(`⚠️ API SIMPLE: Error eliminando períodos anteriores: ${deletePeriodosError.message}`)
              console.log('⚠️ API SIMPLE: Error eliminando períodos anteriores:', deletePeriodosError)
            } else {
              logs.push(`✅ API SIMPLE: Períodos anteriores eliminados`)
              console.log('✅ API SIMPLE: Períodos anteriores eliminados')
            }
            
            // Crear registro de períodos
            const periodoRecord = {
              actividad_id: activity.id,
              cantidad_periodos: periods
            }
            
            const { data: periodoInserted, error: periodoError } = await supabase
              .from('periodos')
              .insert(periodoRecord)
              .select()
            
            if (periodoError) {
              logs.push(`❌ API SIMPLE: Error guardando períodos: ${periodoError.message}`)
              console.error('❌ API SIMPLE: Error guardando períodos:', periodoError)
            } else {
              logs.push(`✅ API SIMPLE: Períodos guardados exitosamente: ${periodoInserted.length} registros`)
              console.log('✅ API SIMPLE: Períodos guardados exitosamente:', periodoInserted)
            }

          }
        } else {
          logs.push(`⚠️ API SIMPLE: No hay registros de planificación para insertar`)
          console.log('⚠️ API SIMPLE: No hay registros de planificación para insertar')
        }
        
      } catch (error) {
        logs.push(`❌ API SIMPLE: Error procesando planificación: ${error}`)
        console.error('❌ API SIMPLE: Error procesando planificación:', error)
      }
    } else {
      logs.push(`⚠️ API SIMPLE: No se recibió planificación semanal para guardar`)
      console.log('⚠️ API SIMPLE: No se recibió planificación semanal para guardar')
    }
    
        return NextResponse.json({
      success: true,
      product: activity,
      message: 'Producto creado exitosamente',
      logs: logs
    })
    
  } catch (error) {
    console.error('❌ API SIMPLE: Error general:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}}
