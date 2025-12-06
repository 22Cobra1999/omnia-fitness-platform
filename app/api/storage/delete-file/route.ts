import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'

/**
 * Endpoint para eliminar archivos de storage (imágenes y PDFs)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { fileName, concept, activityIds } = body

    if (!fileName || !concept) {
      return NextResponse.json({ error: 'fileName y concept requeridos' }, { status: 400 })
    }

    // Determinar la carpeta según el concepto
    const folder = concept === 'image' ? 'images' : 'pdfs'
    const filePath = `coaches/${user.id}/${folder}/${fileName}`

    // PRIMERO: Buscar y eliminar referencias en activity_media (antes de eliminar el archivo físico)
    // Esto asegura que la base de datos se actualice incluso si el archivo físico ya no existe
    let mediaUpdated = false
    let mediaUpdateCount = 0
    
    const { data: coachActivities, error: activitiesError } = await supabase
      .from('activities')
      .select('id')
      .eq('coach_id', user.id)

    if (activitiesError) {
      console.error('Error obteniendo actividades del coach:', activitiesError)
    } else if (coachActivities && coachActivities.length > 0) {
      const activityIds = coachActivities.map(a => a.id)
      
      // Buscar en activity_media las filas que referencian este archivo
      const urlColumn = concept === 'image' ? 'image_url' : 'pdf_url'
      
      const { data: mediaList, error: mediaError } = await supabase
        .from('activity_media')
        .select(`id, activity_id, ${urlColumn}`)
        .in('activity_id', activityIds)
        .not(urlColumn, 'is', null)
        .neq(urlColumn, '')

      if (!mediaError && mediaList) {
        // Buscar las filas que tienen este nombre de archivo en la URL
        const matchingMedia = mediaList.filter((m: any) => {
          const url = m[urlColumn]
          if (!url) return false
          const urlParts = url.split('/')
          const fileNameInUrl = urlParts[urlParts.length - 1].split('?')[0]
          return fileNameInUrl === fileName
        })

        // Eliminar las referencias poniendo el campo en null
        if (matchingMedia.length > 0) {
          const mediaIds = matchingMedia.map((m: any) => m.id)
          const updateData: any = {}
          updateData[urlColumn] = null

          const { error: updateError } = await supabase
            .from('activity_media')
            .update(updateData)
            .in('id', mediaIds)

          if (updateError) {
            console.error('Error eliminando referencias en activity_media:', updateError)
            return NextResponse.json({ 
              success: false, 
              error: 'Error al eliminar referencias en la base de datos',
              details: updateError.message 
            }, { status: 500 })
          } else {
            mediaUpdated = true
            mediaUpdateCount = matchingMedia.length
            console.log(`✅ Eliminadas ${matchingMedia.length} referencias en activity_media`)
          }
        }
      }
    }

    // SEGUNDO: Eliminar archivo de Supabase Storage
    // Si el archivo no existe, no es un error crítico (puede que ya haya sido eliminado)
    const { error: deleteError } = await supabase.storage
      .from('product-media')
      .remove([filePath])

    if (deleteError) {
      // Si el archivo no existe, solo logueamos un warning pero continuamos
      if (deleteError.message?.includes('not found') || deleteError.message?.includes('No such file')) {
        console.warn('⚠️ Archivo no encontrado en storage (puede que ya haya sido eliminado):', filePath)
      } else {
        console.error('Error eliminando archivo de storage:', deleteError)
        // Si actualizamos la BD exitosamente, aún así retornamos éxito
        if (mediaUpdated) {
          console.log('✅ Base de datos actualizada, pero error al eliminar archivo físico')
        } else {
          return NextResponse.json({ 
            success: false, 
            error: 'Error al eliminar el archivo de storage',
            details: deleteError.message 
          }, { status: 500 })
        }
      }
    } else {
      console.log('✅ Archivo eliminado del storage:', filePath)
    }

    return NextResponse.json({ 
      success: true, 
      message: mediaUpdated 
        ? `Archivo eliminado correctamente. ${mediaUpdateCount} referencia(s) eliminada(s) de la base de datos.`
        : 'Archivo eliminado correctamente del storage.' 
    })
  } catch (error: any) {
    console.error('Error en POST /api/storage/delete-file:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 })
  }
}





