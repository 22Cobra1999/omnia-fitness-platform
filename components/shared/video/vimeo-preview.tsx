"use client"

import { useState } from "react"
import { Play } from "lucide-react"
import { extractVimeoId, getVimeoThumbnailUrl } from "@/utils/vimeo-utils"
import { VimeoPlayer } from "./vimeo-player"

interface VimeoPreviewProps {
  vimeoUrl: string | null | undefined
  title?: string
  className?: string
  showThumbnail?: boolean
}

export function VimeoPreview({
  vimeoUrl,
  title = "Video de Vimeo",
  className = "",
  showThumbnail = true,
}: VimeoPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const vimeoId = extractVimeoId(vimeoUrl)
  const thumbnailUrl = showThumbnail ? getVimeoThumbnailUrl(vimeoId) : null

  if (!vimeoId) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center aspect-video ${className}`}>
        <p className="text-gray-500">Video no disponible</p>
      </div>
    )
  }

  const handlePlay = () => {
    setIsPlaying(true)
  }

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      {!isPlaying && thumbnailUrl ? (
        <div className="relative aspect-video">
          <img
            src={thumbnailUrl || "/placeholder.svg"}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Si hay error cargando la miniatura, mostrar un placeholder
              const target = e.target as HTMLImageElement
              target.src = "/video-thumbnail.png"
            }}
          />
          <div
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 cursor-pointer hover:bg-opacity-30 transition-opacity"
            onClick={handlePlay}
          >
            <div className="h-16 w-16 flex items-center justify-center rounded-full bg-white bg-opacity-70">
              <Play className="h-8 w-8 text-black ml-1" />
            </div>
            <span className="sr-only">Reproducir {title}</span>
          </div>
        </div>
      ) : (
        <div className="aspect-video">
          <VimeoPlayer videoId={vimeoId} title={title} autoplay={isPlaying} />
        </div>
      )}
    </div>
  )
}
