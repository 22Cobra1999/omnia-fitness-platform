import { BUNNY_CONFIG } from './config'
import type { BunnyVideoUploadResponse, BunnyVideoInfo, BunnyStorageFile, BunnyUploadOptions } from './types'

export class BunnyClient {
  private streamApiKey: string
  private storageApiKey: string
  private libraryId: string
  
  constructor() {
    this.streamApiKey = BUNNY_CONFIG.streamApiKey
    this.storageApiKey = BUNNY_CONFIG.storageApiKey
    this.libraryId = BUNNY_CONFIG.streamLibraryId
  }

  // ==================== BUNNY STREAM API ====================
  
  async uploadVideoToStream(file: File, title?: string): Promise<BunnyVideoUploadResponse> {
    try {
      const createUrl = `https://video.bunnycdn.com/library/${this.libraryId}/videos`
      
      const createResponse = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'AccessKey': this.streamApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title || file.name,
        }),
      })

      if (!createResponse.ok) {
        const errorText = await createResponse.text()
        console.error('❌ Error creando video:', createResponse.status, errorText)
        throw new Error(`Error creando video: ${createResponse.statusText} - ${errorText}`)
      }

      const videoData = await createResponse.json()
      const videoId = videoData.guid

      const uploadUrl = `https://video.bunnycdn.com/library/${this.libraryId}/videos/${videoId}`
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'AccessKey': this.streamApiKey,
        },
        body: file,
      })

      if (!uploadResponse.ok) {
        throw new Error(`Error subiendo video: ${uploadResponse.statusText}`)
      }

      return {
        success: true,
        videoId: videoId,
        guid: videoId,
        libraryId: parseInt(this.libraryId),
      }
    } catch (error: any) {
      console.error('❌ Error subida:', error.message)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  async getVideoInfo(videoId: string): Promise<BunnyVideoInfo | null> {
    try {
      const response = await fetch(
        `${BUNNY_CONFIG.apiUrl}/library/${this.libraryId}/videos/${videoId}`,
        {
          headers: {
            'AccessKey': this.streamApiKey,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Error obteniendo info: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Error getVideoInfo:', error)
      return null
    }
  }

  async deleteVideo(videoId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${BUNNY_CONFIG.apiUrl}/library/${this.libraryId}/videos/${videoId}`,
        {
          method: 'DELETE',
          headers: {
            'AccessKey': this.streamApiKey,
          },
        }
      )

      return response.ok
    } catch (error) {
      console.error('❌ Error deleteVideo:', error)
      return false
    }
  }

  async listVideos(page = 1, itemsPerPage = 100): Promise<BunnyVideoInfo[]> {
    try {
      const url = `${BUNNY_CONFIG.apiUrl}/library/${this.libraryId}/videos?page=${page}&itemsPerPage=${itemsPerPage}`
      console.log(`📹 [BunnyClient.listVideos] Llamando a: ${url.replace(/AccessKey=[^&]+/, 'AccessKey=***')}`)
      
      const response = await fetch(url, {
        headers: {
          'AccessKey': this.streamApiKey,
        },
      })

      console.log(`📹 [BunnyClient.listVideos] Respuesta HTTP: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ [BunnyClient.listVideos] Error HTTP ${response.status}:`, errorText)
        throw new Error(`Error listando videos: ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log(`📹 [BunnyClient.listVideos] Datos recibidos:`, {
        tieneItems: !!data.items,
        itemsLength: Array.isArray(data.items) ? data.items.length : 'no es array',
        totalItems: data.totalItems,
        currentPage: data.currentPage,
        itemsPerPage: data.itemsPerPage,
        totalPages: data.totalPages
      })
      
      return data.items || []
    } catch (error: any) {
      console.error('❌ [BunnyClient.listVideos] Error:', error)
      console.error('❌ [BunnyClient.listVideos] Stack:', error?.stack)
      console.error('❌ [BunnyClient.listVideos] Message:', error?.message)
      return []
    }
  }

  getStreamUrl(videoId: string): string {
    const cdnUrl = BUNNY_CONFIG.streamCdnUrl || `https://vz-${this.libraryId}.b-cdn.net`
    return `${cdnUrl}/${videoId}/playlist.m3u8`
  }

  getThumbnailUrl(videoId: string, thumbnailFileName?: string): string {
    const fileName = thumbnailFileName || 'thumbnail.jpg'
    const cdnUrl = BUNNY_CONFIG.streamCdnUrl || `https://vz-${this.libraryId}.b-cdn.net`
    return `${cdnUrl}/${videoId}/${fileName}`
  }

  // ==================== BUNNY STORAGE API ====================
  
  async uploadFileToStorage(file: File, options: BunnyUploadOptions): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const { fileName, folder = 'videos', contentType, overwrite = false } = options
      const path = `${BUNNY_CONFIG.storageZoneName}/${folder}/${fileName}`
      
      const url = `${BUNNY_CONFIG.storageApiUrl}/${path}`
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'AccessKey': this.storageApiKey,
          'Content-Type': contentType || file.type || 'application/octet-stream',
        },
        body: file,
      })

      if (!response.ok) {
        throw new Error(`Error subiendo a storage: ${response.statusText}`)
      }

      const cdnUrl = `${BUNNY_CONFIG.pullZoneUrl}/${folder}/${fileName}`

      return {
        success: true,
        url: cdnUrl,
      }
    } catch (error: any) {
      console.error('❌ Error uploadStorage:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  async deleteFileFromStorage(path: string): Promise<boolean> {
    try {
      const url = `${BUNNY_CONFIG.storageApiUrl}/${BUNNY_CONFIG.storageZoneName}/${path}`
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'AccessKey': this.storageApiKey,
        },
      })

      return response.ok
    } catch (error) {
      console.error('❌ Error deleteStorage:', error)
      return false
    }
  }

  async listStorageFiles(folder: string = ''): Promise<BunnyStorageFile[]> {
    try {
      const path = folder ? `${BUNNY_CONFIG.storageZoneName}/${folder}/` : `${BUNNY_CONFIG.storageZoneName}/`
      const url = `${BUNNY_CONFIG.storageApiUrl}/${path}`
      
      const response = await fetch(url, {
        headers: {
          'AccessKey': this.storageApiKey,
        },
      })

      if (!response.ok) {
        throw new Error(`Error listando archivos: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Error listStorage:', error)
      return []
    }
  }
}

// Instancia singleton
export const bunnyClient = new BunnyClient()

