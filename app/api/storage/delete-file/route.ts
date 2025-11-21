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

    // Eliminar archivo de Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from('product-media')
      .remove([filePath])

    if (deleteError) {
      console.error('Error eliminando archivo de storage:', deleteError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error al eliminar el archivo de storage' 
      }, { status: 500 })
    }

    // Si hay activityIds, actualizar las referencias en las actividades
    // Esto dependerá de cómo se almacenan las referencias en cada tabla
    // Por ahora solo eliminamos el archivo físico

    return NextResponse.json({ 
      success: true, 
      message: 'Archivo eliminado correctamente' 
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



