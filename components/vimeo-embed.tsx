"use client"
import { Play } from "lucide-react"

interface VimeoEmbedProps {
  videoContent: string
  title?: string
  className?: string
}

export function VimeoEmbed({ videoContent, title = "Video", className = "" }: VimeoEmbedProps) {
  // Función para extraer el ID de Vimeo de diferentes formatos
  const extractVimeoId = (content: string): string | null => {
    if (!content) return null

    // Si es un código embed completo, extraer el ID del iframe
    const iframeMatch = content.match(/src="[^"]*player\.vimeo\.com\/video\/(\d+)[^"]*"/)
    if (iframeMatch) return iframeMatch[1]

    // Si es una URL directa del player
    const playerMatch = content.match(/player\.vimeo\.com\/video\/(\d+)/)
    if (playerMatch) return playerMatch[1]

    // Si es una URL de Vimeo normal
    const urlMatch = content.match(/vimeo\.com\/(\d+)/)
    if (urlMatch) return urlMatch[1]

    // Si es solo el ID
    const idMatch = content.match(/^\d+$/)
    if (idMatch) return content

    return null
  }

  // Función para determinar si el contenido es un embed completo
  const isFullEmbed = (content: string): boolean => {
    return content.includes("<iframe") && content.includes("vimeo.com")
  }

  // Función para limpiar y procesar el embed HTML
  const processEmbedHTML = (content: string): string => {
    // Remover el script tag que puede causar problemas
    let cleanContent = content.replace(/<script[^>]*>.*?<\/script>/gi, "")

    // Asegurar que el iframe tenga los atributos correctos para funcionar en nuestro contexto
    cleanContent = cleanContent.replace(
      /style="[^"]*"/g,
      'style="position:absolute;top:0;left:0;width:100%;height:100%;"',
    )

    // Agregar parámetros adicionales para evitar problemas de autenticación
    cleanContent = cleanContent.replace(/(src="[^"]*)/g, "$1&dnt=1&quality=auto")

    return cleanContent
  }

  const vimeoId = extractVimeoId(videoContent)

  if (!videoContent || (!vimeoId && !isFullEmbed(videoContent))) {
    return <VideoPlaceholder className={className} />
  }

  // Si es un embed completo, procesarlo y renderizarlo
  if (isFullEmbed(videoContent)) {
    const processedHTML = processEmbedHTML(videoContent)

    return (
      <div className={`relative w-full h-full ${className}`}>
        <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: processedHTML }} />
      </div>
    )
  }

  // Si tenemos un ID de Vimeo, crear nuestro propio embed
  if (vimeoId) {
    return (
      <div className={`relative w-full h-full ${className}`}>
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?badge=0&autopause=0&player_id=0&app_id=58479&autoplay=0&loop=0&muted=0&dnt=1&quality=auto`}
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
          title={title}
          className="rounded-none"
        />
      </div>
    )
  }

  return <VideoPlaceholder className={className} />
}

// Componente para mostrar un placeholder cuando no hay video
export function VideoPlaceholder({ className = "" }: { className?: string }) {
  return (
    <div className={`relative bg-gray-900 flex items-center justify-center ${className}`}>
      <div className="text-center text-gray-500">
        <Play className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No hay video disponible</p>
      </div>
    </div>
  )
}
