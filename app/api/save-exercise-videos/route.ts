import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { activityId, exerciseVideos } = body

    if (!activityId || !exerciseVideos || !Array.isArray(exerciseVideos)) {
      return NextResponse.json({ 
        error: 'activityId y exerciseVideos son requeridos' 
      }, { status: 400 })
    }

    console.log('🎥 Guardando videos de ejercicios:', {
      activityId,
      videosCount: exerciseVideos.length,
      videos: exerciseVideos
    })

    // Actualizar cada ejercicio con su video
    const updatePromises = exerciseVideos.map(async (exerciseVideo: any) => {
      const { exerciseId, videoUrl } = exerciseVideo
      
      if (!exerciseId || !videoUrl) {
        console.warn('⚠️ Ejercicio sin ID o video URL:', exerciseVideo)
        return null
      }

      const { data, error } = await supabase
        .from('ejercicios_detalles')
        .update({ video_url: videoUrl })
        .eq('id', exerciseId)
        .eq('activity_id', activityId)
        .select()

      if (error) {
        console.error('❌ Error actualizando ejercicio:', exerciseId, error)
        return { exerciseId, error: error.message }
      }

      console.log('✅ Video guardado para ejercicio:', exerciseId, videoUrl)
      return { exerciseId, success: true }
    })

    const results = await Promise.all(updatePromises)
    const successful = results.filter(r => r && r.success)
    const failed = results.filter(r => r && r.error)

    console.log('📊 Resultados de guardado:', {
      total: exerciseVideos.length,
      successful: successful.length,
      failed: failed.length
    })

    return NextResponse.json({
      success: true,
      message: `Videos guardados: ${successful.length}/${exerciseVideos.length}`,
      results: {
        successful,
        failed
      }
    })

  } catch (error) {
    console.error('❌ Error guardando videos de ejercicios:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}












