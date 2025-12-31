"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Volume2, VolumeX } from "lucide-react"
import { cn } from '@/lib/utils/utils'
import Hls from 'hls.js'

interface UniversalVideoPlayerProps {
  videoUrl?: string | null
  bunnyVideoId?: string | null
  thumbnailUrl?: string | null
  autoPlay?: boolean
  controls?: boolean
  className?: string
  onError?: (error: any) => void
  muted?: boolean
  loop?: boolean
  disableDownload?: boolean
  forceIframeForBunny?: boolean
}

export function UniversalVideoPlayer({
  videoUrl,
  bunnyVideoId,
  thumbnailUrl,
  autoPlay = false,
  controls = true,
  className,
  onError,
  muted = false,
  loop = false,
  disableDownload = false,
  forceIframeForBunny = false,
}: UniversalVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isMuted, setIsMuted] = useState(muted)
  const [hasEnded, setHasEnded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // En desarrollo evitamos el iframe de Bunny (carga rum.js/metrics y puede fallar DNS),
  // y preferimos HLS directo con hls.js. Pero algunos entornos bloquean el HLS por CORS,
  // entonces permitimos forzar iframe en previews/modales.
  const useIframeForBunny = forceIframeForBunny || process.env.NODE_ENV !== 'development'

  const inferredBunny = (() => {
    if (!videoUrl) return null
    const match = videoUrl.match(
      /https?:\/\/vz-(\d+)\.b-cdn\.net\/([^/?#]+)\/(?:playlist\.m3u8)(?:[?#].*)?$/i
    )
    if (!match?.[1] || !match?.[2]) return null
    return { libraryId: match[1], videoId: match[2] }
  })()

  // Determinar la URL del video a usar
  const getVideoSrc = () => {
    // Priorizar Bunny.net si está disponible
    if (bunnyVideoId) {
      if (useIframeForBunny) {
        // URL de Bunny.net usando el video ID
        return `https://iframe.mediadelivery.net/embed/${process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || '337618'}/${bunnyVideoId}?autoplay=${autoPlay ? 'true' : 'false'}&loop=${loop ? 'true' : 'false'}&muted=${isMuted ? 'true' : 'false'}&preload=true&controls=false`
      }

      // DEV: usar HLS directo (evita scripts dentro del iframe)
      const libId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || '337618'
      const cdnBase = `https://vz-${libId}.b-cdn.net`
      return `${cdnBase}/${bunnyVideoId}/playlist.m3u8`
    }
    // Usar la URL directa si está disponible
    if (videoUrl) {
      return videoUrl
    }
    return null
  }

  // Extraer ID de Vimeo de la URL
  const extractVimeoId = (url: string) => {
    const match = url.match(/vimeo\.com\/(\d+)/)
    return match ? match[1] : null
  }

  const videoSrc = getVideoSrc()

  const resolveBunnyLibraryId = () => {
    const envId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID
    if (typeof envId === 'string' && envId.trim() !== '') return envId.trim()
    if (inferredBunny?.libraryId) return inferredBunny.libraryId
    if (videoUrl) {
      const match = videoUrl.match(/https?:\/\/vz-(\d+)\.b-cdn\.net\//)
      if (match?.[1]) return match[1]
    }
    return '337618'
  }

  const handleError = (error: any) => {
    setHasError(true)
    setIsLoading(false)
    onError?.(error)
  }

  const handleLoadedData = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
        setHasEnded(false) // Reset ended state when playing
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  // Inicializar HLS.js si el video es .m3u8
  useEffect(() => {
    if (!videoRef.current) return

    // Bunny: preferir embed (evita CORS). Si tenemos bunnyVideoId o se puede inferir desde videoUrl,
    // no intentamos cargar HLS directo.
    if (useIframeForBunny && (bunnyVideoId || inferredBunny?.videoId)) {
      return
    }

    const video = videoRef.current
    
    // Determinar la fuente del video (bunnyVideoId o videoSrc)
    const source = bunnyVideoId
      ? `https://vz-${resolveBunnyLibraryId()}.b-cdn.net/${bunnyVideoId}/playlist.m3u8`
      : videoSrc
    
    if (!source) return
    
    // Si es un archivo HLS (.m3u8), usar HLS.js
    if (source.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        })
        
        hls.loadSource(source)
        hls.attachMedia(video)
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (autoPlay) {
            video.play().catch(() => {
              setIsPlaying(false)
            })
          }
        })
        
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            handleError(data)
          }
        })
        
        return () => {
          hls.destroy()
        }
      } 
      // Safari soporta HLS nativamente
      else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source
        if (autoPlay) {
          video.play().catch(() => {
            setIsPlaying(false)
          })
        }
      }
    } else {
      // Video normal (MP4, WebM, etc.)
      if (autoPlay) {
        const playPromise = video.play()
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            setIsPlaying(false)
          })
        }
      }
    }
  }, [autoPlay, videoSrc, bunnyVideoId])

  // Si usamos Bunny.net con iframe
  const effectiveBunnyVideoId = bunnyVideoId || inferredBunny?.videoId || null

  if (useIframeForBunny && effectiveBunnyVideoId) {
    const libraryId = resolveBunnyLibraryId()
    const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${effectiveBunnyVideoId}?autoplay=${autoPlay ? 'true' : 'false'}&loop=${loop ? 'true' : 'false'}&muted=${isMuted ? 'true' : 'false'}&preload=true&controls=${controls ? 'true' : 'false'}`

    return (
      <div className={cn("relative w-full h-full bg-black", className)}>
        <iframe
          src={embedUrl}
          className={cn("w-full h-full", className)}
          allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
          allowFullScreen
          referrerPolicy="origin"
          onLoad={() => {
            setIsLoading(false)
            setHasError(false)
          }}
        />
      </div>
    )
  }

  // Si es un video de Vimeo, usar iframe de Vimeo
  if (videoUrl && videoUrl.includes('vimeo.com')) {
    const vimeoId = extractVimeoId(videoUrl)
    if (vimeoId) {
      const vimeoUrl = `https://player.vimeo.com/video/${vimeoId}?autoplay=${autoPlay ? 1 : 0}&loop=${loop ? 1 : 0}&muted=${isMuted ? 1 : 0}&title=0&byline=0&portrait=0&controls=${controls ? 1 : 0}`
      
      return (
        <div className={cn("relative w-full h-full bg-black", className)}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
          )}
          <iframe
            key={`vimeo-${isMuted}`}
            src={vimeoUrl}
            loading="eager"
            className={cn("w-full h-full border-0", className)}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            onLoad={() => {
              setIsLoading(false)
              setHasError(false)
            }}
            style={{ border: 'none' }}
          />
          
          {/* Botón de mute flotante */}
          {!isLoading && (
            <button
              onClick={toggleMute}
              className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm rounded-full p-3 hover:bg-black/70 transition-all z-30"
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5 text-white" />
              ) : (
                <Volume2 className="h-5 w-5 text-white" />
              )}
            </button>
          )}
        </div>
      )
    }
  }

  // Si no hay video disponible, mostrar thumbnail o placeholder
  if (!videoSrc) {
    return (
      <div className={cn("relative w-full h-full bg-black flex items-center justify-center", className)}>
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt="Video thumbnail" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-white/50 text-sm">No hay video disponible</div>
        )}
      </div>
    )
  }

  // Usar video HTML5 estándar para URLs directas
  return (
    <div className={cn("relative w-full h-full bg-black", className)} onClick={!controls ? togglePlay : undefined} style={{ minHeight: '200px', width: '100%', height: '100%' }}>
      <video
        ref={videoRef}
        src={videoSrc && !videoSrc.includes('.m3u8') ? videoSrc : undefined}
        poster={thumbnailUrl || undefined}
        className={cn("w-full h-full object-contain cursor-pointer", className)}
        autoPlay={autoPlay}
        controls={controls}
        controlsList={disableDownload ? "nodownload" : undefined}
        muted={isMuted}
        loop={loop}
        playsInline
        style={{ 
          width: '100%', 
          height: '100%',
          display: 'block',
          objectFit: 'contain',
          minHeight: '200px'
        }}
        onError={(e) => {
          console.error('❌ Error en video:', e)
          setHasError(true)
          setIsLoading(false)
        }}
        onLoadedData={() => {
          console.log('✅ Video cargado correctamente')
          handleLoadedData()
        }}
        onPlay={() => {
          console.log('▶️ Video reproduciendo')
          setIsPlaying(true)
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false)
          setHasEnded(true)
        }}
      />

      {/* Spinner de carga */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      )}

      {/* Botón de replay cuando termina el video - solo cuando no hay controles */}
      {!controls && !isLoading && !hasError && hasEnded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20">
          <button
            onClick={togglePlay}
            className="bg-orange-500/90 backdrop-blur-sm rounded-full p-4 hover:bg-orange-600 transition-all"
          >
            <Play className="h-8 w-8 text-white fill-white" />
          </button>
        </div>
      )}

      {/* Botón de mute flotante - solo cuando no hay controles */}
      {!controls && !isLoading && !hasError && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleMute()
          }}
          className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm rounded-full p-3 hover:bg-black/70 transition-all z-30"
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5 text-white" />
          ) : (
            <Volume2 className="h-5 w-5 text-white" />
          )}
        </button>
      )}

      {/* Botón de play grande en el centro cuando está pausado y sin controles */}
      {!controls && !isPlaying && !isLoading && !hasError && (
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer z-20" 
          onClick={togglePlay}
        >
          <div className="bg-black/50 rounded-full p-4 hover:bg-black/70 transition-colors">
            <Play className="h-10 w-10 text-white" />
          </div>
        </div>
      )}
    </div>
  )
}
