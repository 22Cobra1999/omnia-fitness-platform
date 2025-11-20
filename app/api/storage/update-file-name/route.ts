import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { fileId, fileName, concept } = body

    console.log('[update-file-name] Request:', { fileId, fileName, concept, userId: user.id })

    if (!fileId || !fileName || !concept) {
      return NextResponse.json({ 
        success: false, 
        error: 'Faltan parámetros: fileId, fileName, concept' 
      }, { status: 400 })
    }

    const trimmedFileName = fileName.trim()
    if (!trimmedFileName) {
      return NextResponse.json({ 
        success: false, 
        error: 'El nombre no puede estar vacío' 
      }, { status: 400 })
    }

    // Obtener actividades del coach para validar
    const { data: activities } = await supabase
      .from('activities')
      .select('id')
      .eq('coach_id', user.id)

    const activityIds = activities?.map(a => a.id) || []

    // Determinar el origen del archivo según el fileId y concept
    if (concept === 'video') {
      // fileId puede ser:
      // - bunny_video_id (para videos de activity_media o ejercicios_detalles)
      // - video-{activityId}-{idx} (formato antiguo sintético)
      
      // Buscar en ejercicios_detalles
      const { data: ejercicio, error: ejError } = await supabase
        .from('ejercicios_detalles')
        .select('id, activity_id')
        .eq('coach_id', user.id)
        .eq('bunny_video_id', fileId)
        .maybeSingle()

      if (!ejError && ejercicio) {
        // Validar que la actividad pertenece al coach
        if (activityIds.includes(ejercicio.activity_id)) {
          const { error: updateError } = await supabase
            .from('ejercicios_detalles')
            .update({ video_file_name: trimmedFileName })
            .eq('id', ejercicio.id)

          if (updateError) {
            console.error('Error actualizando video_file_name en ejercicios_detalles:', updateError)
            return NextResponse.json({ 
              success: false, 
              error: 'Error actualizando nombre en ejercicios_detalles' 
            }, { status: 500 })
          }

          return NextResponse.json({ success: true, message: 'Nombre actualizado en ejercicios_detalles' })
        }
      }

      // Buscar en activity_media
      if (activityIds.length > 0) {
        const { data: media, error: mediaError } = await supabase
          .from('activity_media')
          .select('id, activity_id')
          .in('activity_id', activityIds)
          .eq('bunny_video_id', fileId)
          .maybeSingle()

        if (!mediaError && media) {
          const { error: updateError } = await supabase
            .from('activity_media')
            .update({ video_file_name: trimmedFileName })
            .eq('id', media.id)

          if (updateError) {
            console.error('Error actualizando video_file_name en activity_media:', updateError)
            return NextResponse.json({ 
              success: false, 
              error: 'Error actualizando nombre en activity_media' 
            }, { status: 500 })
          }

          return NextResponse.json({ success: true, message: 'Nombre actualizado en activity_media' })
        }

        // Buscar en nutrition_program_details (si tiene bunny_video_id)
        const { data: nutritionVideo, error: nutritionError } = await supabase
          .from('nutrition_program_details')
          .select('id, activity_id')
          .in('activity_id', activityIds)
          .eq('bunny_video_id', fileId)
          .maybeSingle()

        if (!nutritionError && nutritionVideo) {
          // Nota: nutrition_program_details puede no tener video_file_name, pero intentamos actualizar si existe
          // Primero verificamos si la columna existe consultando la estructura
          const { error: updateError } = await supabase
            .from('nutrition_program_details')
            .update({ video_file_name: trimmedFileName })
            .eq('id', nutritionVideo.id)

          if (updateError) {
            // Si falla porque no existe la columna, solo logueamos pero no fallamos
            console.warn('No se pudo actualizar video_file_name en nutrition_program_details (puede que la columna no exista):', updateError)
            // Continuamos sin fallar porque puede que la tabla no tenga ese campo
          } else {
            return NextResponse.json({ success: true, message: 'Nombre actualizado en nutrition_program_details' })
          }
        }
      }

      return NextResponse.json({ 
        success: false, 
        error: 'Video no encontrado o no tienes permisos' 
      }, { status: 404 })

    } else if (concept === 'image') {
      // fileId puede ser: image-{fileName}
      const actualFileName = fileId.startsWith('image-') ? fileId.substring(6) : fileId
      const coachId = user.id
      
      console.log('[update-file-name] Procesando imagen:', { actualFileName, newFileName: trimmedFileName, coachId })
      
      // Primero, renombrar el archivo en Supabase Storage directamente
      const oldPath = `coaches/${coachId}/images/${actualFileName}`
      const newPath = `coaches/${coachId}/images/${trimmedFileName}`
      
      let storageRenamed = false
      let storageErrorMsg: string | null = null
      
      try {
        // Verificar si el archivo existe listando los archivos en el directorio
        const { data: fileList, error: listError } = await supabase.storage
          .from('product-media')
          .list(`coaches/${coachId}/images`)

        if (listError) {
          console.error('Error listando archivos:', listError)
          storageErrorMsg = 'Error accediendo al storage'
        } else {
          // Verificar si el archivo existe
          const fileExists = fileList?.some(f => f.name === actualFileName)
          
          if (fileExists) {
            // Intentar copiar el archivo con el nuevo nombre
            const { error: copyError } = await supabase.storage
              .from('product-media')
              .copy(oldPath, newPath)

            if (!copyError) {
              // Si la copia fue exitosa, eliminar el archivo antiguo
              const { error: deleteError } = await supabase.storage
                .from('product-media')
                .remove([oldPath])

              if (!deleteError) {
                storageRenamed = true
              } else {
                console.error('Error eliminando archivo antiguo:', deleteError)
                storageErrorMsg = 'Error eliminando archivo antiguo'
              }
            } else {
              console.error('Error copiando archivo en storage:', copyError)
              storageErrorMsg = copyError.message || 'Error copiando archivo'
            }
          } else {
            console.log(`Archivo ${actualFileName} no encontrado en storage`)
          }
        }
      } catch (storageError: any) {
        console.error('Error renombrando archivo en storage:', storageError)
        storageErrorMsg = storageError.message || 'Error en storage'
      }

      // Buscar en activity_media por image_url que contenga el nombre
      let mediaUpdated = false
      if (activityIds.length > 0) {
        const { data: mediaList, error: mediaError } = await supabase
          .from('activity_media')
          .select('id, activity_id, image_url')
          .in('activity_id', activityIds)
          .not('image_url', 'is', null)
          .neq('image_url', '')

        if (!mediaError && mediaList) {
          // Buscar el que tenga el nombre de archivo en la URL
          const matchingMedia = mediaList.find((m: any) => {
            if (!m.image_url) return false
            const urlParts = m.image_url.split('/')
            const fileNameInUrl = urlParts[urlParts.length - 1].split('?')[0]
            return fileNameInUrl === actualFileName
          })

          if (matchingMedia) {
            // Actualizar la URL en activity_media con el nuevo nombre (mantener path y parámetros)
            const urlParts = matchingMedia.image_url.split('/')
            const params = urlParts[urlParts.length - 1].includes('?') 
              ? urlParts[urlParts.length - 1].split('?')[1] 
              : ''
            const baseUrl = urlParts.slice(0, -1).join('/')
            const newUrl = `${baseUrl}/${trimmedFileName}${params ? '?' + params : ''}`

            const { error: updateError } = await supabase
              .from('activity_media')
              .update({ image_url: newUrl })
              .eq('id', matchingMedia.id)

            if (!updateError) {
              mediaUpdated = true
            } else {
              console.error('Error actualizando image_url en activity_media:', updateError)
            }
          }
        }
      }

      // También buscar en user_profiles por avatar_url que contenga el nombre
      let avatarUpdated = false
      const { data: userProfiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, avatar_url')
        .not('avatar_url', 'is', null)
        .neq('avatar_url', '')

      if (!profilesError && userProfiles) {
        // Buscar perfiles que tengan este archivo como avatar
        const matchingProfiles = userProfiles.filter((p: any) => {
          if (!p.avatar_url) return false
          // El avatar_url puede ser una URL completa o un path relativo
          // Buscar si contiene el nombre del archivo
          const urlParts = p.avatar_url.split('/')
          const fileNameInUrl = urlParts[urlParts.length - 1].split('?')[0]
          // Puede estar en diferentes rutas: avatars/, coaches/{id}/images/, etc.
          return fileNameInUrl === actualFileName || p.avatar_url.includes(`/${actualFileName}`)
        })

        if (matchingProfiles.length > 0) {
          // Actualizar avatar_url en cada perfil que use esta imagen
          for (const profile of matchingProfiles) {
            const urlParts = profile.avatar_url.split('/')
            const params = urlParts[urlParts.length - 1].includes('?') 
              ? urlParts[urlParts.length - 1].split('?')[1] 
              : ''
            const baseUrl = urlParts.slice(0, -1).join('/')
            const newUrl = `${baseUrl}/${trimmedFileName}${params ? '?' + params : ''}`

            const { error: updateError } = await supabase
              .from('user_profiles')
              .update({ avatar_url: newUrl })
              .eq('id', profile.id)

            if (!updateError) {
              avatarUpdated = true
              console.log(`[update-file-name] Avatar actualizado para usuario ${profile.id}`)
            } else {
              console.error(`Error actualizando avatar_url para usuario ${profile.id}:`, updateError)
            }
          }
        }
      }

      // Si se renombró en storage o se actualizó en BD, devolver éxito
      if (storageRenamed || mediaUpdated || avatarUpdated) {
        const updates = []
        if (storageRenamed) updates.push('storage')
        if (mediaUpdated) updates.push('actividades')
        if (avatarUpdated) updates.push('avatar')
        
        return NextResponse.json({ 
          success: true, 
          message: `Nombre de imagen actualizado (${updates.join(', ')})`
        })
      }

      // Si no se pudo renombrar en ningún lado
      return NextResponse.json({ 
        success: false, 
        error: storageErrorMsg || 'Imagen no encontrada o no tienes permisos' 
      }, { status: 404 })

    } else if (concept === 'pdf') {
      // fileId puede ser: pdf-{fileName}
      const actualFileName = fileId.startsWith('pdf-') ? fileId.substring(4) : fileId
      const coachId = user.id
      
      // Primero, renombrar el archivo en Supabase Storage directamente
      const oldPath = `coaches/${coachId}/pdfs/${actualFileName}`
      const newPath = `coaches/${coachId}/pdfs/${trimmedFileName}`
      
      let storageRenamed = false
      try {
        // Intentar copiar el archivo directamente (Supabase manejará el error si no existe)
        const { error: copyError } = await supabase.storage
          .from('product-media')
          .copy(oldPath, newPath)

        if (!copyError) {
          // Si la copia fue exitosa, eliminar el archivo antiguo
          const { error: deleteError } = await supabase.storage
            .from('product-media')
            .remove([oldPath])

          if (!deleteError) {
            storageRenamed = true
          }
        } else {
          console.error('Error copiando PDF en storage (puede que no exista):', copyError)
        }
      } catch (storageError) {
        console.error('Error renombrando PDF en storage:', storageError)
      }

      // Buscar en activity_media por pdf_url que contenga el nombre
      if (activityIds.length > 0) {
        const { data: mediaList, error: mediaError } = await supabase
          .from('activity_media')
          .select('id, activity_id, pdf_url')
          .in('activity_id', activityIds)
          .not('pdf_url', 'is', null)
          .neq('pdf_url', '')

        if (!mediaError && mediaList) {
          // Buscar el que tenga el nombre de archivo en la URL
          const matchingMedia = mediaList.find((m: any) => {
            if (!m.pdf_url) return false
            const urlParts = m.pdf_url.split('/')
            const fileNameInUrl = urlParts[urlParts.length - 1].split('?')[0]
            return fileNameInUrl === actualFileName
          })

          if (matchingMedia) {
            // Actualizar la URL en activity_media con el nuevo nombre
            const urlParts = matchingMedia.pdf_url.split('/')
            const params = urlParts[urlParts.length - 1].includes('?') 
              ? urlParts[urlParts.length - 1].split('?')[1] 
              : ''
            const newUrl = urlParts.slice(0, -1).join('/') + '/' + trimmedFileName + (params ? '?' + params : '')

            const { error: updateError } = await supabase
              .from('activity_media')
              .update({ pdf_url: newUrl })
              .eq('id', matchingMedia.id)

            if (updateError) {
              console.error('Error actualizando pdf_url en activity_media:', updateError)
              return NextResponse.json({ 
                success: false, 
                error: 'Error actualizando nombre de PDF en BD' 
              }, { status: 500 })
            }

            return NextResponse.json({ 
              success: true, 
              message: storageRenamed ? 'Nombre de PDF actualizado' : 'Nombre actualizado en BD (renombrado en storage pendiente)' 
            })
          }
        }
      }

      // Si se renombró en storage, devolver éxito
      if (storageRenamed) {
        return NextResponse.json({ 
          success: true, 
          message: 'Nombre de PDF actualizado en storage' 
        })
      }

      return NextResponse.json({ 
        success: false, 
        error: 'PDF no encontrado o no tienes permisos' 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      success: false, 
      error: `Tipo de archivo no soportado: ${concept}` 
    }, { status: 400 })

  } catch (error) {
    console.error('Error en POST /api/storage/update-file-name:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
