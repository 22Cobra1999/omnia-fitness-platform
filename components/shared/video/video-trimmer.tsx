'use client'

import { useState, useRef, useEffect } from 'react'
import { Scissors, Play, Pause, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

interface VideoTrimmerProps {
  videoFile: File
  onTrimmed: (trimmedFile: File) => void
  onCancel: () => void
  maxDuration?: number // Duración máxima en segundos
}

export function VideoTrimmer({ videoFile, onTrimmed, onCancel, maxDuration }: VideoTrimmerProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
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
      setEndTime(Math.min(videoDuration, maxDuration || videoDuration))
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      // Si llega al final del recorte, pausar
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
  }, [startTime, endTime, maxDuration])

  // Actualizar posición del video cuando cambia startTime o endTime
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (currentTime < startTime || currentTime > endTime) {
      video.currentTime = startTime
    }
  }, [startTime, endTime, currentTime])

  const handlePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
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

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const trimVideo = async () => {
    if (!videoRef.current || isProcessing) return

    setIsProcessing(true)

    try {
      // Usar Canvas API para capturar frames y crear nuevo video
      // Nota: Esta es una solución simplificada. Para mejor calidad,
      // sería mejor usar un servicio de procesamiento en el servidor
      
      const canvas = document.createElement('canvas')
      const video = videoRef.current
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('No se pudo obtener contexto del canvas')

      // Crear MediaRecorder para grabar el segmento
      const stream = canvas.captureStream(30) // 30 FPS
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      })

      const chunks: Blob[] = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      return new Promise<void>((resolve, reject) => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' })
          const trimmedFile = new File([blob], videoFile.name.replace(/\.[^/.]+$/, '-trimmed.webm'), {
            type: 'video/webm'
          })

          onTrimmed(trimmedFile)
          setIsProcessing(false)
          resolve()
        }

        recorder.onerror = (e) => {
          setIsProcessing(false)
          reject(e)
        }

        // Grabar el segmento
        recorder.start()
        
        const frameRate = 30
        const frameInterval = 1000 / frameRate
        let currentFrame = startTime

        const drawFrame = () => {
          if (currentFrame >= endTime) {
            recorder.stop()
            return
          }

          video.currentTime = currentFrame
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          
          currentFrame += frameInterval
          setTimeout(drawFrame, frameInterval)
        }

        video.addEventListener('seeked', () => {
          drawFrame()
        }, { once: true })

        video.currentTime = startTime
      })
    } catch (error) {
      console.error('Error recortando video:', error)
      setIsProcessing(false)
      // Fallback: usar el video original pero con marcadores
      alert('Error al recortar video. Se usará el video completo.')
      onTrimmed(videoFile)
    }
  }

  const handleStartTimeChange = (value: number[]) => {
    const newStart = value[0]
    setStartTime(Math.min(newStart, endTime - 1))
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(newStart, endTime - 1)
    }
  }

  const handleEndTimeChange = (value: number[]) => {
    const newEnd = value[0]
    setEndTime(Math.max(newEnd, startTime + 1))
  }

  return (
    <div className="bg-[#1A1C1F] rounded-xl p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-2">
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
          />
        )}
        
        {/* Controles de reproducción */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlay}
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(endTime - startTime)}
            </span>
          </div>
        </div>
      </div>

      {/* Controles de tiempo */}
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Inicio: {formatTime(startTime)}</span>
            <span>Fin: {formatTime(endTime)}</span>
            <span>Duración: {formatTime(endTime - startTime)}</span>
          </div>
          
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Inicio</label>
              <Slider
                value={[startTime]}
                max={duration}
                step={0.1}
                onValueChange={handleStartTimeChange}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Fin</label>
              <Slider
                value={[endTime]}
                max={duration}
                step={0.1}
                onValueChange={handleEndTimeChange}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={isProcessing}
          >
            Cancelar
          </Button>
          <Button
            onClick={trimVideo}
            disabled={isProcessing || endTime - startTime <= 0}
            className="flex-1 bg-[#FF7939] hover:bg-[#FF8C42] text-white"
          >
            {isProcessing ? (
              'Procesando...'
            ) : (
              <>
                <Scissors className="w-4 h-4 mr-2" />
                Recortar Video
              </>
            )}
          </Button>
        </div>

        {maxDuration && endTime - startTime > maxDuration && (
          <div className="text-yellow-500 text-xs text-center">
            ⚠️ La duración máxima es {formatTime(maxDuration)}
          </div>
        )}
      </div>
    </div>
  )
}
