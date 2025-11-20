'use client'

import { useState, useRef, useEffect } from 'react'
import { Scissors, Play, Pause, SkipBack, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

interface VideoTrimmerSimpleProps {
  videoFile: File
  onTrimmed: (trimmedFile: File, startTime: number, endTime: number) => void
  onCancel: () => void
  maxDuration?: number // Duración máxima en segundos (ej: 30 para videos cortos)
}

/**
 * Componente ligero para recortar videos antes de subir
 * Usa APIs nativas del navegador - NO requiere librerías pesadas
 * 
 * NOTA: Para mejor calidad de recorte, considerar procesamiento en servidor
 */
export function VideoTrimmerSimple({ 
  videoFile, 
  onTrimmed, 
  onCancel,
  maxDuration 
}: VideoTrimmerSimpleProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Crear URL del video para preview
  useEffect(() => {
    const url = URL.createObjectURL(videoFile)
    setVideoUrl(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [videoFile])

  // Obtener duración cuando el video esté cargado
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      const videoDuration = video.duration
      setDuration(videoDuration)
      const initialEnd = maxDuration ? Math.min(videoDuration, maxDuration) : videoDuration
      setEndTime(initialEnd)
      setStartTime(0)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      // Si llega al final del recorte, pausar y volver al inicio
      if (video.currentTime >= endTime) {
        video.pause()
        setIsPlaying(false)
        video.currentTime = startTime
      }
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('timeupdate', handleTimeUpdate)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [maxDuration])

  // Mantener video dentro del rango seleccionado
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (currentTime < startTime) {
      video.currentTime = startTime
    } else if (currentTime > endTime) {
      video.currentTime = startTime
      video.pause()
      setIsPlaying(false)
    }
  }, [startTime, endTime, currentTime])

  const handlePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      // Si está fuera del rango, ir al inicio
      if (video.currentTime < startTime || video.currentTime > endTime) {
        video.currentTime = startTime
      }
      video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  const handleSeekBack = () => {
    const video = videoRef.current
    if (!video) return
    
    const newTime = Math.max(0, video.currentTime - 5)
    video.currentTime = Math.max(startTime, newTime)
  }

  const handleSeekForward = () => {
    const video = videoRef.current
    if (!video) return
    
    const newTime = Math.min(duration, video.currentTime + 5)
    video.currentTime = Math.min(endTime, newTime)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleConfirm = () => {
    // Pasar los tiempos de inicio y fin para que el servidor haga el recorte
    // o usar el video original si el recorte es del 0% al 100%
    if (startTime === 0 && endTime >= duration - 0.1) {
      onTrimmed(videoFile, 0, duration)
    } else {
      // Por ahora, guardar los tiempos para que el servidor procese
      // El video original se usa pero con metadatos de recorte
      onTrimmed(videoFile, startTime, endTime)
    }
  }

  const handleStartTimeChange = (value: number[]) => {
    const newStart = value[0]
    // No permitir que el inicio sea mayor o igual al fin
    if (newStart < endTime - 0.5) {
      setStartTime(newStart)
      if (videoRef.current) {
        videoRef.current.currentTime = newStart
      }
    }
  }

  const handleEndTimeChange = (value: number[]) => {
    const newEnd = value[0]
    // No permitir que el fin sea menor o igual al inicio
    if (newEnd > startTime + 0.5) {
      setEndTime(Math.min(newEnd, duration))
    }
  }

  const trimmedDuration = endTime - startTime
  const isValid = trimmedDuration > 0 && (!maxDuration || trimmedDuration <= maxDuration)

  return (
    <div className="bg-[#1A1C1F] rounded-xl p-6 space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Scissors className="w-5 h-5 text-[#FF7939]" />
        <h3 className="text-lg font-semibold text-white">Recortar Video</h3>
      </div>

      {/* Preview del video */}
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
        {videoUrl && (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            playsInline
            muted
          />
        )}
        
        {/* Overlay con marcas de inicio y fin */}
        <div className="absolute top-0 left-0 right-0 h-full pointer-events-none">
          {/* Marca de inicio */}
          <div 
            className="absolute top-0 bottom-0 w-1 bg-[#FF7939] z-10"
            style={{ left: `${(startTime / duration) * 100}%` }}
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#FF7939] text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              Inicio
            </div>
          </div>
          
          {/* Marca de fin */}
          <div 
            className="absolute top-0 bottom-0 w-1 bg-[#FF7939] z-10"
            style={{ left: `${(endTime / duration) * 100}%` }}
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#FF7939] text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              Fin
            </div>
          </div>
          
          {/* Área recortada */}
          <div 
            className="absolute top-0 bottom-0 bg-[#FF7939]/20 z-0"
            style={{ 
              left: `${(startTime / duration) * 100}%`,
              width: `${((endTime - startTime) / duration) * 100}%`
            }}
          />
        </div>

        {/* Controles de reproducción */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSeekBack}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              title="Retroceder 5s"
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlay}
              className="text-white hover:bg-white/20 h-10 w-10 p-0"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSeekForward}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              title="Avanzar 5s"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Barra de progreso */}
          <div className="relative h-2 bg-gray-700 rounded-full mb-2">
            <div 
              className="absolute h-full bg-[#FF7939] rounded-full"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
          
          <div className="flex justify-between text-white text-xs">
            <span>{formatTime(currentTime)}</span>
            <span>Duración: {formatTime(trimmedDuration)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Controles de tiempo */}
      <div className="space-y-4 bg-gray-900/50 rounded-lg p-4">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Inicio: <span className="text-white font-medium">{formatTime(startTime)}</span></span>
            <span className="text-gray-300">Fin: <span className="text-white font-medium">{formatTime(endTime)}</span></span>
          </div>
          
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Punto de inicio</label>
            <Slider
              value={[startTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleStartTimeChange}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Punto de fin</label>
            <Slider
              value={[endTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleEndTimeChange}
              className="w-full"
            />
          </div>
        </div>

        {/* Info de duración */}
        <div className="text-center">
          <div className={`text-sm font-medium ${isValid ? 'text-green-400' : 'text-yellow-500'}`}>
            Duración seleccionada: {formatTime(trimmedDuration)}
            {maxDuration && ` / Máximo: ${formatTime(maxDuration)}`}
          </div>
          {!isValid && maxDuration && (
            <div className="text-xs text-yellow-500 mt-1">
              ⚠️ La duración máxima es {formatTime(maxDuration)}
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid}
            className="flex-1 bg-[#FF7939] hover:bg-[#FF8C42] text-white disabled:opacity-50"
          >
            <Scissors className="w-4 h-4 mr-2" />
            Confirmar Recorte
          </Button>
        </div>
      </div>
    </div>
  )
}
