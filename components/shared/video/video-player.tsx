"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize, SkipForward, SkipBack } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { cn } from '@/lib/utils/utils'

interface VideoPlayerProps {
  src: string
  poster?: string
  title?: string
  onTimeUpdate?: (currentTime: number) => void
  className?: string
  autoPlay?: boolean
  interactivePauses?: { time: string; description: string }[]
}

export function VideoPlayer({
  src,
  poster,
  title,
  onTimeUpdate,
  className,
  autoPlay = false,
  interactivePauses = [],
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isControlsVisible, setIsControlsVisible] = useState(true)
  const [isBuffering, setIsBuffering] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Formatear tiempo en formato mm:ss
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  // Manejar reproducción/pausa
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  // Manejar volumen
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  // Manejar pantalla completa
  const toggleFullscreen = () => {
    if (!playerRef.current) return

    if (!document.fullscreenElement) {
      playerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error al intentar mostrar en pantalla completa: ${err.message}`)
      })
    } else {
      document.exitFullscreen()
    }
  }

  // Manejar cambio de tiempo
  const handleTimeChange = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  // Manejar cambio de volumen
  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      const newVolume = value[0]
      videoRef.current.volume = newVolume
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }
  }

  // Avanzar 10 segundos
  const handleForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, duration)
    }
  }

  // Retroceder 10 segundos
  const handleBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0)
    }
  }

  // Mostrar/ocultar controles automáticamente
  const showControls = () => {
    setIsControlsVisible(true)

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }

    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setIsControlsVisible(false)
      }
    }, 3000)
  }

  // Eventos del video
  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) return

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime)
      onTimeUpdate?.(videoElement.currentTime)
    }
    const onDurationChange = () => setDuration(videoElement.duration)
    const onVolumeChange = () => setVolume(videoElement.volume)
    const onWaiting = () => setIsBuffering(true)
    const onCanPlay = () => setIsBuffering(false)
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement)

    videoElement.addEventListener("play", onPlay)
    videoElement.addEventListener("pause", onPause)
    videoElement.addEventListener("timeupdate", onTimeUpdate)
    videoElement.addEventListener("durationchange", onDurationChange)
    videoElement.addEventListener("volumechange", onVolumeChange)
    videoElement.addEventListener("waiting", onWaiting)
    videoElement.addEventListener("canplay", onCanPlay)
    document.addEventListener("fullscreenchange", onFullscreenChange)

    return () => {
      videoElement.removeEventListener("play", onPlay)
      videoElement.removeEventListener("pause", onPause)
      videoElement.removeEventListener("timeupdate", onTimeUpdate)
      videoElement.removeEventListener("durationchange", onDurationChange)
      videoElement.removeEventListener("volumechange", onVolumeChange)
      videoElement.removeEventListener("waiting", onWaiting)
      videoElement.removeEventListener("canplay", onCanPlay)
      document.removeEventListener("fullscreenchange", onFullscreenChange)

      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [onTimeUpdate])

  // Verificar pausas interactivas
  useEffect(() => {
    if (!interactivePauses.length) return

    const checkForPauses = () => {
      const pause = interactivePauses.find((p) => Math.abs(currentTime - Number.parseFloat(p.time)) < 0.5 && isPlaying)

      if (pause && videoRef.current) {
        videoRef.current.pause()
        // Aquí podrías mostrar un diálogo con la descripción de la pausa
      }
    }

    checkForPauses()
  }, [currentTime, interactivePauses, isPlaying])

  return (
    <div
      ref={playerRef}
      className={cn("relative group overflow-hidden bg-black rounded-lg", className)}
      onMouseMove={showControls}
      onMouseLeave={() => isPlaying && setIsControlsVisible(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full"
        onClick={togglePlay}
        autoPlay={autoPlay}
      />

      {/* Overlay para carga */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      )}

      {/* Controles */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300",
          isControlsVisible ? "opacity-100" : "opacity-0",
        )}
      >
        {title && <div className="text-white font-medium mb-2 text-sm">{title}</div>}

        {/* Barra de progreso */}
        <div className="mb-2">
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={0.1}
            onValueChange={handleTimeChange}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-white mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Botones de control */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={togglePlay} className="text-white hover:bg-white/20">
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>

            <Button variant="ghost" size="icon" onClick={handleBackward} className="text-white hover:bg-white/20">
              <SkipBack className="h-5 w-5" />
            </Button>

            <Button variant="ghost" size="icon" onClick={handleForward} className="text-white hover:bg-white/20">
              <SkipForward className="h-5 w-5" />
            </Button>

            <div className="flex items-center space-x-2 ml-2">
              <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:bg-white/20">
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-20"
              />
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-white hover:bg-white/20">
            <Maximize className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Botón de play grande en el centro cuando está pausado */}
      {!isPlaying && !isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center cursor-pointer" onClick={togglePlay}>
          <div className="bg-black/50 rounded-full p-4">
            <Play className="h-10 w-10 text-white" />
          </div>
        </div>
      )}
    </div>
  )
}
