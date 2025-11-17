import { bunnyClient } from './index'
import type { BunnyVideoInfo } from './types'
import { createClient } from '@supabase/supabase-js'

/**
 * Obtiene el tamaño total de videos en Bunny para una lista de video IDs
 */
export async function getBunnyVideoStorageSize(videoIds: string[]): Promise<number> {
  let totalBytes = 0
  
  for (const videoId of videoIds) {
    try {
      const videoInfo = await bunnyClient.getVideoInfo(videoId)
      if (videoInfo && videoInfo.storageSize) {
        totalBytes += videoInfo.storageSize
      }
    } catch (error) {
      console.error(`Error obteniendo info de video ${videoId}:`, error)
    }
  }
  
  // Convertir bytes a GB (1024^3)
  const totalGb = totalBytes / (1024 * 1024 * 1024)
  return totalGb
}

/**
 * Obtiene la lista completa de videos de un coach
 */
export async function getAllCoachVideosFromBunny(): Promise<BunnyVideoInfo[]> {
  const allVideos: BunnyVideoInfo[] = []
  let page = 1
  const itemsPerPage = 100
  
  console.log('📹 [getAllCoachVideosFromBunny] Iniciando obtención de videos de Bunny...')
  console.log('📹 [getAllCoachVideosFromBunny] bunnyClient disponible:', !!bunnyClient)
  
  try {
    while (true) {
      console.log(`📹 [getAllCoachVideosFromBunny] Llamando a listVideos página ${page}...`)
      const videos = await bunnyClient.listVideos(page, itemsPerPage)
      
      console.log(`📹 [getAllCoachVideosFromBunny] Página ${page}: Respuesta:`, {
        esArray: Array.isArray(videos),
        length: Array.isArray(videos) ? videos.length : 'no es array',
        tipo: typeof videos,
        primerVideo: Array.isArray(videos) && videos.length > 0 ? {
          guid: videos[0].guid,
          title: videos[0].title
        } : null
      })
      
      if (!videos || !Array.isArray(videos) || videos.length === 0) {
        console.log(`📹 [getAllCoachVideosFromBunny] Página ${page}: No hay más videos`)
        break
      }
      
      console.log(`📹 [getAllCoachVideosFromBunny] Página ${page}: Agregando ${videos.length} videos`)
      allVideos.push(...videos)
      
      // Si hay menos de itemsPerPage, ya cargamos todo
      if (videos.length < itemsPerPage) {
        console.log(`📹 [getAllCoachVideosFromBunny] Página ${page}: Última página`)
        break
      }
      
      page++
    }
    
    console.log(`✅ [getAllCoachVideosFromBunny] Total videos obtenidos: ${allVideos.length}`)
  } catch (error: any) {
    console.error('❌ [getAllCoachVideosFromBunny] Error listando videos de Bunny:', error)
    console.error('❌ [getAllCoachVideosFromBunny] Stack:', error?.stack)
    console.error('❌ [getAllCoachVideosFromBunny] Message:', error?.message)
  }
  
  return allVideos
}

/**
 * Obtiene el tamaño total de storage de Supabase para un coach
 * Consulta el bucket product-media para images y pdfs
 */
export async function getSupabaseStorageSize(coachId: string, concept: 'image' | 'pdf'): Promise<number> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Determinar la carpeta según el concepto
    const folder = concept === 'image' ? 'images' : 'pdfs'
    
    const { data: files, error } = await supabase.storage
      .from('product-media')
      .list(`coaches/${coachId}/${folder}`, { limit: 1000 })

    if (error) {
      console.error(`Error listando archivos de ${concept}:`, error)
      return 0
    }

    let totalBytes = 0
    
    // Filtrar archivos de control y sumar tamaños
    const validFiles = (files || []).filter(
      file => !file.name.includes('.emptyFolderPlaceholder') && !file.name.includes('.keep')
    )
    
    for (const file of validFiles) {
      // El tamaño puede venir en metadata.size o directamente en file.size
      if (file.metadata?.size) {
        totalBytes += parseInt(file.metadata.size)
      } else if ((file as any).size) {
        totalBytes += parseInt((file as any).size)
      }
    }

    // Convertir bytes a GB (1024^3)
    const totalGb = totalBytes / (1024 * 1024 * 1024)
    return totalGb
  } catch (error) {
    console.error(`Error calculando storage de ${concept} en Supabase:`, error)
    return 0
  }
}

