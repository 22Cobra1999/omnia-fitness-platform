// Configuración de Bunny.net para streaming de video
export const BUNNY_CONFIG = {
  // Storage Zone
  storageZoneName: process.env.BUNNY_STORAGE_ZONE_NAME || 'omnia-videos',
  storageApiKey: process.env.BUNNY_STORAGE_API_KEY || '',
  storageRegion: process.env.BUNNY_STORAGE_REGION || 'br', // São Paulo, Brazil
  
  // Pull Zone (CDN)
  pullZoneUrl: process.env.BUNNY_PULL_ZONE_URL || 'https://omnia-videos.b-cdn.net',
  pullZoneId: process.env.BUNNY_PULL_ZONE_ID || '',
  
  // Stream (Video Platform)
  streamApiKey: process.env.BUNNY_STREAM_API_KEY || '',
  streamLibraryId: process.env.BUNNY_STREAM_LIBRARY_ID || '',
  streamCdnUrl: process.env.BUNNY_STREAM_CDN_URL || '',
  
  // Network Type
  // RECOMENDADO: 'volume' para 91-93% ahorro ($0.005/GB vs $0.045/GB)
  // Alternativa: 'standard' para latencia ultra-baja (30ms vs 50ms)
  networkType: (process.env.BUNNY_NETWORK_TYPE as 'volume' | 'standard') || 'volume',
  
  // API Base
  apiUrl: 'https://api.bunny.net',
  storageApiUrl: 'https://storage.bunnycdn.com',
  
  // Configuración de video
  maxVideoSize: 500 * 1024 * 1024, // 500MB
  allowedFormats: ['mp4', 'mov', 'avi', 'webm', 'mkv'],
  thumbnailCount: 3,
  
  // Pricing (Volume Network - Recomendado para OMNIA)
  pricing: {
    storage: 0.01,        // $0.01/GB/mes
    bandwidth: 0.005,     // $0.005/GB (Volume) vs $0.045 (Standard SA)
    encoding: 0.01,       // $0.01/min procesado
  },
  
  // Estimated savings vs Supabase
  estimatedSavings: {
    storage: 0.52,        // 52% ahorro
    bandwidth: 0.94,      // 94% ahorro (Volume) / 50% (Standard)
    overall: 0.91,        // 91% ahorro total (Volume)
  },
} as const

export type BunnyConfig = typeof BUNNY_CONFIG

