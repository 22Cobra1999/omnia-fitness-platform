"use client"

import { useEffect, useRef, useState } from "react"
import { extractVimeoId } from "@/utils/vimeo-utils"

interface VimeoPlayerProps {
  videoId: string
  title?: string
  className?: string
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
}

export function VimeoPlayer({
  videoId,
  title = "Vimeo video player",
  className = "",
  autoplay = false,
  loop = false,
  muted = false,
}: VimeoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!videoId || !containerRef.current) return

    // Limpiar cualquier iframe existente
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild)
    }

    // Extraer el ID de Vimeo si se proporciona una URL completa
    const vimeoId = extractVimeoId(videoId) || videoId

    // Crear el iframe
    const iframe = document.createElement("iframe")
    iframe.src = `https://player.vimeo.com/video/${vimeoId}?autoplay=${autoplay ? 1 : 0}&loop=${
      loop ? 1 : 0
    }&muted=${muted ? 1 : 0}&title=0&byline=0&portrait=0`
    iframe.width = "100%"
    iframe.height = "100%"
    iframe.allow = "autoplay; fullscreen; picture-in-picture"
    iframe.style.border = "0"
    iframe.title = title
    iframe.allowFullscreen = true

    // Añadir el iframe al contenedor
    containerRef.current.appendChild(iframe)

    return () => {
      // Limpiar al desmontar
      if (containerRef.current) {
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild)
        }
      }
    }
  }, [videoId, title, autoplay, loop, muted])

  if (!videoId) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <p>No se pudo cargar el video (ID no válido)</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={`relative aspect-video ${className}`} style={{ width: "100%", height: "100%" }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
          <p>{error}</p>
        </div>
      )}

      {/* <iframe
        src={`https://player.vimeo.com/video/${videoId}?autoplay=0&title=0&byline=0&portrait=0`}
        allow="autoplay; fullscreen; picture-in-picture"
        className="absolute top-0 left-0 w-full h-full"
        title={title}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setError("Error al cargar el video");
        }}
      ></iframe> */}
    </div>
  )
}
