// Tipos para Bunny.net API

export interface BunnyVideoUploadResponse {
  success: boolean
  videoId?: string
  guid?: string
  libraryId?: number
  status?: number
  error?: string
}

export interface BunnyVideoInfo {
  guid: string
  videoLibraryId: number
  title: string
  dateUploaded: string
  views: number
  length: number
  status: number
  framerate: number
  width: number
  height: number
  availableResolutions: string
  thumbnailFileName: string
  thumbnailCount: number
  encodeProgress: number
  storageSize: number
  captions: any[]
  hasMP4Fallback: boolean
  transcodingMessages: any[]
}

export interface BunnyStorageFile {
  Guid: string
  StorageZoneName: string
  Path: string
  ObjectName: string
  Length: number
  LastChanged: string
  ServerId: number
  ArrayNumber: number
  IsDirectory: boolean
  UserId: string
  ContentType: string
  DateCreated: string
  StorageZoneId: number
  Checksum: string | null
  ReplicatedZones: string | null
}

export interface BunnyUploadOptions {
  fileName: string
  folder?: string
  contentType?: string
  overwrite?: boolean
}

export interface BunnyVideoMetadata {
  bunny_video_id?: string
  bunny_library_id?: number
  bunny_cdn_url?: string
  supabase_url?: string
  storage_provider: 'bunny' | 'supabase'
  uploaded_at?: string
  file_size?: number
  duration?: number
}

export interface VideoMigrationStatus {
  id: string
  original_url: string
  bunny_url?: string
  bunny_video_id?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error?: string
  migrated_at?: string
}





























