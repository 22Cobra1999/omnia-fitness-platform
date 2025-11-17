import { SupabaseClient } from '@supabase/supabase-js'

export async function deleteVideoIfUnused(
  supabase: SupabaseClient,
  videoId: string | null | undefined
) {
  if (!videoId) return

  try {
    const [{ data: exerciseRefs }, { data: mediaRefs }] = await Promise.all([
      supabase
        .from('ejercicios_detalles')
        .select('id')
        .eq('bunny_video_id', videoId),
      supabase
        .from('activity_media')
        .select('id')
        .eq('bunny_video_id', videoId)
    ])

    const totalRefs =
      (exerciseRefs?.length || 0) +
      (mediaRefs?.length || 0)

    if (totalRefs === 0) {
      const deleted = await (await import('./index')).bunnyClient.deleteVideo(videoId)
      if (!deleted) {
        console.warn('⚠️ No se pudo eliminar el video en Bunny.net:', videoId)
      }
    }
  } catch (cleanupError) {
    console.error('❌ Error intentando eliminar video en Bunny.net:', cleanupError)
  }
}














